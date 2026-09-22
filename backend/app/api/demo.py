"""FairHire AI — Demo Mode API."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import Candidate, ScreeningResult
from app.services.demo_service import load_demo_data
from app.schemas.schemas import DemoLoadResponse

router = APIRouter()


@router.post("/load", response_model=DemoLoadResponse)
def load_demo(db: Session = Depends(get_db)):
    """Load the demo scenario with preloaded candidates and screening results."""
    result = load_demo_data(db)
    return DemoLoadResponse(**result)


@router.get("/status")
def demo_status(db: Session = Depends(get_db)):
    """Check if demo data is loaded."""
    demo_candidates = db.query(Candidate).filter(Candidate.is_demo_data == True).count()
    demo_results = db.query(ScreeningResult).filter(ScreeningResult.is_demo_data == True).count()
    return {
        "demo_loaded": demo_candidates > 0,
        "candidate_count": demo_candidates,
        "screening_results_count": demo_results,
    }
