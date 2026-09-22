"""FairHire AI — Explanations API (SHAP)."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import ScreeningResult, Explanation
from app.schemas.schemas import ExplanationResponse
from app.explainability.shap_explainer import get_shap_explainer

router = APIRouter()


@router.post("/{result_id}/shap", response_model=ExplanationResponse)
def generate_shap_explanation(result_id: int, db: Session = Depends(get_db)):
    """Generate SHAP explanation for a screening result."""
    result = db.query(ScreeningResult).filter(ScreeningResult.id == result_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Screening result not found")

    if not result.features_used:
        raise HTTPException(status_code=400, detail="No features available for this result")

    try:
        explainer = get_shap_explainer()
        explanation_data = explainer.explain(result.features_used)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SHAP computation error: {str(e)}")

    # Delete existing explanation
    db.query(Explanation).filter(Explanation.screening_result_id == result_id).delete()

    explanation = Explanation(
        screening_result_id=result_id,
        feature_contributions=explanation_data["feature_contributions"],
        top_positive=explanation_data["top_positive"],
        top_negative=explanation_data["top_negative"],
        natural_language=explanation_data["natural_language"],
        model_coefficients=explanation_data["model_coefficients"],
        is_demo_data=result.is_demo_data,
    )
    db.add(explanation)
    db.commit()
    db.refresh(explanation)
    return explanation


@router.get("/{result_id}", response_model=ExplanationResponse)
def get_explanation(result_id: int, db: Session = Depends(get_db)):
    explanation = db.query(Explanation).filter(
        Explanation.screening_result_id == result_id
    ).first()
    if not explanation:
        raise HTTPException(status_code=404, detail="Explanation not found. Generate one first.")
    return explanation
