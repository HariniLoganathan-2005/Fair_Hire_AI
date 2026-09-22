"""FairHire AI — Reports API."""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import os

from app.database.database import get_db
from app.database.models import (
    AuditReport, ScreeningResult, Candidate, FairnessAudit,
    HumanReview, ModelVersion
)
from app.schemas.schemas import ReportGenerateRequest, ReportResponse
from app.reports.pdf_generator import generate_audit_pdf
from app.reports.excel_generator import generate_excel_report

router = APIRouter()
REPORTS_DIR = "./reports_output"


@router.post("/generate", response_model=ReportResponse)
def generate_report(request: ReportGenerateRequest, db: Session = Depends(get_db)):
    """Generate an audit report (PDF + Excel)."""
    os.makedirs(REPORTS_DIR, exist_ok=True)

    # Gather data
    results = db.query(ScreeningResult).filter(ScreeningResult.job_id == request.job_id).all()
    if not results:
        raise HTTPException(status_code=400, detail="No screening results found")

    candidate_ids = [r.candidate_id for r in results]
    candidates = {c.id: c for c in db.query(Candidate).filter(Candidate.id.in_(candidate_ids)).all()}

    model_version = db.query(ModelVersion).filter(ModelVersion.is_active == True).first()
    fairness_audit = db.query(FairnessAudit).filter(
        FairnessAudit.job_id == request.job_id
    ).order_by(FairnessAudit.created_at.desc()).first()
    human_reviews = db.query(HumanReview).filter(
        HumanReview.screening_result_id.in_([r.id for r in results])
    ).all()

    is_demo = any(r.is_demo_data for r in results)

    # Build report data
    shortlisted = sum(1 for r in results if r.decision == "SHORTLISTED")
    total = len(results)

    report_data = {
        "is_demo_data": is_demo,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "dataset_name": "Synthetic Candidate Dataset (Demo)" if is_demo else "Uploaded Candidates",
        "candidate_count": total,
        "candidates_with_gaps": sum(1 for r in results if (candidates.get(r.candidate_id) and (candidates[r.candidate_id].career_gap_months or 0) > 0)),
        "threshold": results[0].threshold_used if results else 0.5,
        "model_info": {
            "model_name": model_version.name if model_version else "Resume Screening v1",
            "model_type": model_version.model_type if model_version else "LogisticRegression",
            "version": model_version.version if model_version else "1.0",
            "features": model_version.features if model_version else [],
        },
        "screening_summary": {
            "total": total,
            "shortlisted": shortlisted,
            "rejected": total - shortlisted,
            "selection_rate": shortlisted / total if total > 0 else 0,
        },
        "fairness_metrics": {
            "candidate_count": fairness_audit.candidate_count if fairness_audit else total,
            "threshold_used": fairness_audit.threshold_used if fairness_audit else 0.5,
            "overall_selection_rate": shortlisted / total if total > 0 else 0,
            "selection_rate_no_gap": fairness_audit.selection_rate_no_gap if fairness_audit else None,
            "selection_rate_gap": fairness_audit.selection_rate_gap if fairness_audit else None,
            "disparate_impact_ratio": fairness_audit.disparate_impact_ratio if fairness_audit else None,
            "demographic_parity_difference": fairness_audit.demographic_parity_difference if fairness_audit else None,
            "career_gap_analysis": fairness_audit.career_gap_analysis if fairness_audit else {},
        },
        "human_reviews": {
            "total": len(human_reviews),
            "approved": sum(1 for r in human_reviews if r.decision == "APPROVED"),
            "rejected": sum(1 for r in human_reviews if r.decision == "REJECTED"),
            "skills_assessment": sum(1 for r in human_reviews if r.decision == "SKILLS_ASSESSMENT"),
        },
        "candidates": [
            {
                "name": candidates[r.candidate_id].name if r.candidate_id in candidates else "Unknown",
                "score": r.score,
                "decision": r.decision,
                "features": r.features_used or {},
            }
            for r in results
        ],
    }

    # Generate files
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    pdf_path = os.path.join(REPORTS_DIR, f"fairhire_audit_{timestamp}.pdf")
    excel_path = os.path.join(REPORTS_DIR, f"fairhire_audit_{timestamp}.xlsx")

    generate_audit_pdf(report_data, pdf_path)
    generate_excel_report(report_data, excel_path)

    # Save to DB
    report = AuditReport(
        job_id=request.job_id,
        model_version_id=model_version.id if model_version else None,
        report_name=f"Fairness Audit Report — {timestamp}",
        report_data=report_data,
        pdf_path=pdf_path,
        excel_path=excel_path,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return report


@router.get("/{report_id}", response_model=ReportResponse)
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(AuditReport).filter(AuditReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.get("/{report_id}/download/pdf")
def download_pdf(report_id: int, db: Session = Depends(get_db)):
    report = db.query(AuditReport).filter(AuditReport.id == report_id).first()
    if not report or not report.pdf_path:
        raise HTTPException(status_code=404, detail="PDF report not found")
    if not os.path.exists(report.pdf_path):
        raise HTTPException(status_code=404, detail="PDF file not found on disk")
    return FileResponse(
        report.pdf_path,
        media_type="application/pdf",
        filename=os.path.basename(report.pdf_path)
    )


@router.get("/{report_id}/download/excel")
def download_excel(report_id: int, db: Session = Depends(get_db)):
    report = db.query(AuditReport).filter(AuditReport.id == report_id).first()
    if not report or not report.excel_path:
        raise HTTPException(status_code=404, detail="Excel report not found")
    if not os.path.exists(report.excel_path):
        raise HTTPException(status_code=404, detail="Excel file not found on disk")
    return FileResponse(
        report.excel_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=os.path.basename(report.excel_path)
    )


@router.get("", response_model=list[ReportResponse])
def list_reports(db: Session = Depends(get_db)):
    return db.query(AuditReport).order_by(AuditReport.created_at.desc()).all()
