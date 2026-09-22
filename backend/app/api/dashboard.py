"""FairHire AI — Dashboard API."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import Candidate, ScreeningResult, FairnessAudit
from app.schemas.schemas import DashboardStats

router = APIRouter()


@router.get("", response_model=DashboardStats)
def get_dashboard(db: Session = Depends(get_db)):
    """Get dashboard statistics."""
    total_candidates = db.query(Candidate).count()
    screening_results = db.query(ScreeningResult).all()
    screened = len(screening_results)
    shortlisted = sum(1 for r in screening_results if r.decision == "SHORTLISTED")
    rejected = sum(1 for r in screening_results if r.decision == "REJECTED")
    career_gap_candidates = db.query(Candidate).filter(Candidate.career_gap_months > 0).count()

    # Fairness alerts: count audits with disparate impact < 0.80
    audits = db.query(FairnessAudit).all()
    fairness_alerts = sum(
        1 for a in audits
        if a.disparate_impact_ratio is not None and a.disparate_impact_ratio < 0.80
    )

    # Score distribution for chart
    score_distribution = []
    if screening_results:
        import numpy as np
        scores = [r.score for r in screening_results]
        bins = [0, 20, 40, 60, 80, 100]
        labels = ["0-20", "20-40", "40-60", "60-80", "80-100"]
        hist, _ = np.histogram(scores, bins=bins)
        score_distribution = [{"range": l, "count": int(c)} for l, c in zip(labels, hist)]

    # Selection rate by gap status
    selection_by_gap = None
    if screening_results:
        gap_ids = set(
            c.id for c in db.query(Candidate).filter(Candidate.career_gap_months > 0).all()
        )
        gap_results = [r for r in screening_results if r.candidate_id in gap_ids]
        no_gap_results = [r for r in screening_results if r.candidate_id not in gap_ids]

        gap_selected = sum(1 for r in gap_results if r.decision == "SHORTLISTED")
        no_gap_selected = sum(1 for r in no_gap_results if r.decision == "SHORTLISTED")

        selection_by_gap = {
            "with_gap": {
                "total": len(gap_results),
                "selected": gap_selected,
                "rate": round(gap_selected / len(gap_results), 4) if gap_results else 0,
            },
            "without_gap": {
                "total": len(no_gap_results),
                "selected": no_gap_selected,
                "rate": round(no_gap_selected / len(no_gap_results), 4) if no_gap_results else 0,
            },
        }

    # Recent audit
    recent_audit = None
    latest = db.query(FairnessAudit).order_by(FairnessAudit.created_at.desc()).first()
    if latest:
        recent_audit = {
            "id": latest.id,
            "dataset_name": latest.dataset_name,
            "candidate_count": latest.candidate_count,
            "created_at": latest.created_at.isoformat() if latest.created_at else None,
            "disparate_impact_ratio": latest.disparate_impact_ratio,
        }

    return DashboardStats(
        total_candidates=total_candidates,
        screened=screened,
        shortlisted=shortlisted,
        rejected=rejected,
        career_gap_candidates=career_gap_candidates,
        fairness_alerts=fairness_alerts,
        recent_audit=recent_audit,
        score_distribution=score_distribution,
        selection_by_gap=selection_by_gap,
    )
