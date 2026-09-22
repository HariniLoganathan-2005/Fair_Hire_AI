"""FairHire AI — Counterfactual API."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import ScreeningResult, Counterfactual
from app.schemas.schemas import CounterfactualResponse
from app.counterfactual.generator import generate_counterfactuals

router = APIRouter()


@router.post("/{result_id}", response_model=CounterfactualResponse)
def create_counterfactual(result_id: int, db: Session = Depends(get_db)):
    """Generate counterfactual explanations for a screening result."""
    result = db.query(ScreeningResult).filter(ScreeningResult.id == result_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Screening result not found")

    if not result.features_used:
        raise HTTPException(status_code=400, detail="No features available for this result")

    try:
        cf_data = generate_counterfactuals(result.features_used, result.threshold_used)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Counterfactual generation error: {str(e)}")

    # Delete existing
    db.query(Counterfactual).filter(Counterfactual.screening_result_id == result_id).delete()

    cf = Counterfactual(
        screening_result_id=result_id,
        original_score=cf_data["original_score"],
        original_decision=cf_data["original_decision"],
        changes=cf_data["changes"],
        is_demo_data=result.is_demo_data,
    )
    db.add(cf)
    db.commit()
    db.refresh(cf)
    return cf


@router.get("/{result_id}", response_model=CounterfactualResponse)
def get_counterfactual(result_id: int, db: Session = Depends(get_db)):
    cf = db.query(Counterfactual).filter(Counterfactual.screening_result_id == result_id).first()
    if not cf:
        raise HTTPException(status_code=404, detail="Counterfactual not found. Generate one first.")
    return cf
