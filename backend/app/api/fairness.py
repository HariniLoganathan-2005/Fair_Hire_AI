"""FairHire AI — Fairness Audit API."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import ScreeningResult, Candidate, FairnessAudit, ModelVersion
from app.schemas.schemas import FairnessRunRequest, FairnessAuditResponse, CareerGapComparisonResponse
from app.fairness.auditor import calculate_fairness_metrics, run_career_gap_sensitivity

router = APIRouter()


@router.post("/run", response_model=FairnessAuditResponse)
def run_fairness_audit(request: FairnessRunRequest, db: Session = Depends(get_db)):
    """Run a fairness audit on screening results for a job."""
    query = db.query(ScreeningResult)
    if request.job_id is not None:
        query = query.filter(ScreeningResult.job_id == request.job_id)
    results = query.all()
    if not results:
        raise HTTPException(status_code=400, detail="No screening results found. Run screening first.")

    # Gather data
    candidate_ids = [r.candidate_id for r in results]
    candidates = {c.id: c for c in db.query(Candidate).filter(Candidate.id.in_(candidate_ids)).all()}

    scores = [r.score for r in results]
    decisions = [r.decision for r in results]
    career_gap_flags = [
        (candidates[r.candidate_id].career_gap_months or 0) > 0
        for r in results
    ]
    demographic_genders = [
        candidates[r.candidate_id].demographic_gender for r in results
    ]
    demographic_age_groups = [
        candidates[r.candidate_id].demographic_age_group for r in results
    ]

    # Calculate actual fairness metrics
    norm_threshold = request.threshold / 100.0 if request.threshold > 1.0 else request.threshold
    metrics = calculate_fairness_metrics(
        scores=scores,
        decisions=decisions,
        career_gap_flags=career_gap_flags,
        threshold=norm_threshold,
        demographic_genders=demographic_genders,
        demographic_age_groups=demographic_age_groups,
    )

    # Get model version
    model_version = db.query(ModelVersion).filter(ModelVersion.is_active == True).first()
    is_demo = any(r.is_demo_data for r in results)

    # Save audit
    audit = FairnessAudit(
        model_version_id=model_version.id if model_version else None,
        job_id=request.job_id,
        dataset_name="Synthetic Candidate Dataset" if is_demo else "Uploaded Candidates",
        candidate_count=len(results),
        threshold_used=norm_threshold,
        selection_rate_no_gap=metrics.get("selection_rate_no_gap"),
        selection_rate_gap=metrics.get("selection_rate_gap"),
        disparate_impact_ratio=metrics.get("disparate_impact_ratio"),
        demographic_parity_difference=metrics.get("demographic_parity_difference"),
        demographic_analysis=metrics.get("demographic_analysis"),
        career_gap_analysis=metrics.get("career_gap_analysis"),
        is_demo_data=is_demo,
    )
    db.add(audit)
    db.commit()
    db.refresh(audit)
    return audit


@router.get("/{audit_id}", response_model=FairnessAuditResponse)
def get_fairness_audit(audit_id: int, db: Session = Depends(get_db)):
    audit = db.query(FairnessAudit).filter(FairnessAudit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Fairness audit not found")
    return audit


@router.get("", response_model=list[FairnessAuditResponse])
def list_fairness_audits(db: Session = Depends(get_db)):
    return db.query(FairnessAudit).order_by(FairnessAudit.created_at.desc()).all()


@router.post("/career-gap-sensitivity", response_model=list[CareerGapComparisonResponse])
def career_gap_sensitivity(result_id: int, db: Session = Depends(get_db)):
    """Run career gap sensitivity analysis for a candidate."""
    result = db.query(ScreeningResult).filter(ScreeningResult.id == result_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Screening result not found")

    if not result.features_used:
        raise HTTPException(status_code=400, detail="No features available")

    base_features = dict(result.features_used)
    sensitivity_results = run_career_gap_sensitivity(base_features)

    # Format as comparison responses
    base_score = result.score
    base_decision = result.decision
    comparisons = []
    for sr in sensitivity_results:
        variant_features = base_features.copy()
        variant_features["career_gap_months"] = sr["career_gap_months"]
        variant_features["career_gap_count"] = 1 if sr["career_gap_months"] > 0 else 0

        comparisons.append(CareerGapComparisonResponse(
            base_candidate_features=base_features,
            base_score=base_score,
            base_decision=base_decision,
            variant_features=variant_features,
            variant_score=sr["score"],
            variant_decision=sr["decision"],
            score_difference=round(sr["score"] - base_score, 1),
            gap_months_tested=sr["career_gap_months"],
        ))

    return comparisons
