"""FairHire AI — Human Review API."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.database.database import get_db
from app.database.models import HumanReview, ScreeningResult, Candidate
from app.schemas.schemas import HumanReviewCreate, HumanReviewResponse

router = APIRouter()


@router.post("", response_model=HumanReviewResponse)
def create_review(review_data: HumanReviewCreate, db: Session = Depends(get_db)):
    """Submit a human review decision."""
    # Validate references
    result = db.query(ScreeningResult).filter(
        ScreeningResult.id == review_data.screening_result_id
    ).first()
    if not result:
        raise HTTPException(status_code=404, detail="Screening result not found")

    review = HumanReview(
        candidate_id=review_data.candidate_id,
        screening_result_id=review_data.screening_result_id,
        reviewer_name=review_data.reviewer_name,
        decision=review_data.decision,
        comment=review_data.comment,
        reason_for_review=review_data.reason_for_review,
        reviewed_at=datetime.now(timezone.utc),
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@router.get("", response_model=list[HumanReviewResponse])
def list_reviews(db: Session = Depends(get_db)):
    reviews = db.query(HumanReview).order_by(HumanReview.created_at.desc()).all()
    return reviews


@router.get("/pending")
def get_pending_reviews(db: Session = Depends(get_db)):
    """Get screening results that should be flagged for human review."""
    results = db.query(ScreeningResult).all()
    pending = []
    for r in results:
        candidate = db.query(Candidate).filter(Candidate.id == r.candidate_id).first()
        already_reviewed = db.query(HumanReview).filter(
            HumanReview.screening_result_id == r.id
        ).first()

        needs_review = False
        reasons = []

        # Borderline score
        if 40 <= r.score <= 60:
            needs_review = True
            reasons.append("Borderline score")

        # Career gap sensitivity
        if candidate and (candidate.career_gap_months or 0) > 6:
            needs_review = True
            reasons.append("Significant career gap")

        # Rejected with high skills
        features = r.features_used or {}
        if r.decision == "REJECTED" and features.get("skills_match", 0) > 70:
            needs_review = True
            reasons.append("High skills match but rejected")

        if needs_review:
            pending.append({
                "screening_result_id": r.id,
                "candidate_id": r.candidate_id,
                "candidate_name": candidate.name if candidate else "Unknown",
                "score": r.score,
                "decision": r.decision,
                "career_gap_months": candidate.career_gap_months if candidate else 0,
                "reasons": reasons,
                "already_reviewed": already_reviewed is not None,
                "review_decision": already_reviewed.decision if already_reviewed else None,
            })

    return pending
