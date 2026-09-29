"""FairHire AI — Dashboard API."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import Candidate, ScreeningResult, FairnessAudit, Job, HumanReview
from app.schemas.schemas import DashboardStats

router = APIRouter()


@router.get("", response_model=DashboardStats)
@router.get("/stats", response_model=DashboardStats)
def get_dashboard(db: Session = Depends(get_db)):
    """Get dashboard statistics — returns all fields the frontend expects."""

    # ── Counts ──────────────────────────────────────────────────────────────
    total_candidates = db.query(Candidate).count()
    total_jobs = db.query(Job).count()

    screening_results = db.query(ScreeningResult).all()
    total_screened = len(screening_results)
    shortlisted_count = sum(1 for r in screening_results if r.decision == "SHORTLISTED")
    rejected_count = sum(1 for r in screening_results if r.decision == "REJECTED")
    overall_selection_rate = round(shortlisted_count / total_screened, 4) if total_screened else 0.0

    # ── Career gap split ─────────────────────────────────────────────────────
    gap_candidate_ids = set(
        c.id for c in db.query(Candidate).filter(Candidate.career_gap_months > 0).all()
    )

    gap_results    = [r for r in screening_results if r.candidate_id in gap_candidate_ids]
    no_gap_results = [r for r in screening_results if r.candidate_id not in gap_candidate_ids]

    gap_count      = len(gap_results)
    no_gap_count   = len(no_gap_results)

    gap_shortlisted    = sum(1 for r in gap_results if r.decision == "SHORTLISTED")
    no_gap_shortlisted = sum(1 for r in no_gap_results if r.decision == "SHORTLISTED")

    gap_selection_rate    = round(gap_shortlisted / gap_count, 4) if gap_count else 0.0
    no_gap_selection_rate = round(no_gap_shortlisted / no_gap_count, 4) if no_gap_count else 0.0

    # ── Disparate Impact Ratio ───────────────────────────────────────────────
    if no_gap_selection_rate > 0:
        disparate_impact_ratio = round(gap_selection_rate / no_gap_selection_rate, 4)
    else:
        # Fall back to latest saved audit value if available
        latest_audit = db.query(FairnessAudit).order_by(FairnessAudit.created_at.desc()).first()
        disparate_impact_ratio = (
            latest_audit.disparate_impact_ratio
            if latest_audit and latest_audit.disparate_impact_ratio is not None
            else 0.0
        )

    # ── Pending human reviews (not yet decided) ──────────────────────────────
    pending_human_reviews = db.query(HumanReview).filter(
        HumanReview.decision == None  # noqa: E711
    ).count()
    # Also count flagged-but-not-reviewed: high-skill rejected gap candidates
    if pending_human_reviews == 0:
        reviewed_result_ids = set(
            r.screening_result_id for r in db.query(HumanReview).all()
        )
        for r in gap_results:
            if r.decision == "REJECTED" and r.id not in reviewed_result_ids:
                if r.features_used and r.features_used.get("skills_match", 0) > 60:
                    pending_human_reviews += 1

    # ── Fairness alerts ──────────────────────────────────────────────────────
    audits = db.query(FairnessAudit).all()
    fairness_alerts = sum(
        1 for a in audits
        if a.disparate_impact_ratio is not None and a.disparate_impact_ratio < 0.80
    )

    # ── Score distribution ───────────────────────────────────────────────────
    score_distribution = []
    if screening_results:
        bins = [(0, 20), (20, 40), (40, 60), (60, 80), (80, 101)]
        labels = ["0-20", "20-40", "40-60", "60-80", "80-100"]
        for (lo, hi), label in zip(bins, labels):
            in_bin = [r for r in screening_results if lo <= r.score < hi]
            gap_in_bin    = sum(1 for r in in_bin if r.candidate_id in gap_candidate_ids)
            no_gap_in_bin = len(in_bin) - gap_in_bin
            score_distribution.append({
                "range": label,
                "count": len(in_bin),
                "gap_count": gap_in_bin,
                "no_gap_count": no_gap_in_bin,
            })

    # ── Recent audit ─────────────────────────────────────────────────────────
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
        total_jobs=total_jobs,
        screened=total_screened,           # legacy field kept
        total_screened=total_screened,
        shortlisted=shortlisted_count,     # legacy field kept
        shortlisted_count=shortlisted_count,
        rejected=rejected_count,           # legacy field kept
        rejected_count=rejected_count,
        overall_selection_rate=overall_selection_rate,
        career_gap_candidates=len(gap_candidate_ids),
        no_gap_count=no_gap_count,
        no_gap_shortlisted=no_gap_shortlisted,
        no_gap_selection_rate=no_gap_selection_rate,
        gap_count=gap_count,
        gap_shortlisted=gap_shortlisted,
        gap_selection_rate=gap_selection_rate,
        disparate_impact_ratio=disparate_impact_ratio,
        pending_human_reviews=pending_human_reviews,
        fairness_alerts=fairness_alerts,
        recent_audit=recent_audit,
        score_distribution=score_distribution,
        selection_by_gap={
            "with_gap": {"total": gap_count, "selected": gap_shortlisted, "rate": gap_selection_rate},
            "without_gap": {"total": no_gap_count, "selected": no_gap_shortlisted, "rate": no_gap_selection_rate},
        },
    )
