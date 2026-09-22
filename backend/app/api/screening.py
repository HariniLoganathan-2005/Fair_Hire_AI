"""FairHire AI — Screening API."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import Candidate, Job, ScreeningResult, ModelVersion
from app.schemas.schemas import ScreeningRunRequest, ScreeningResultResponse
from app.ml.predictor import get_predictor
from app.services.demo_service import compute_skills_match, compute_education_match

router = APIRouter()


@router.post("/run", response_model=list[ScreeningResultResponse])
def run_screening(request: ScreeningRunRequest, db: Session = Depends(get_db)):
    """Run AI screening on candidates for a job."""
    predictor = get_predictor()
    if not predictor.is_loaded():
        raise HTTPException(status_code=503, detail="ML model not loaded. Please train the model first.")

    job = db.query(Job).filter(Job.id == request.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Get candidates
    if request.candidate_ids:
        candidates = db.query(Candidate).filter(Candidate.id.in_(request.candidate_ids)).all()
    else:
        candidates = db.query(Candidate).all()

    if not candidates:
        raise HTTPException(status_code=400, detail="No candidates found")

    # Get or create model version
    model_version = db.query(ModelVersion).filter(ModelVersion.is_active == True).first()
    if not model_version:
        metadata = predictor.get_metadata()
        model_version = ModelVersion(
            name=metadata.get("model_name", "Resume Screening v1"),
            version=metadata.get("version", "1.0"),
            model_type=metadata.get("model_type", "LogisticRegression"),
            features=metadata.get("features", []),
            dataset_name=metadata.get("dataset_name", "Synthetic Candidate Dataset"),
            metrics=metadata.get("metrics", {}),
            threshold=request.threshold,
            is_active=True,
        )
        db.add(model_version)
        db.flush()

    results = []
    for candidate in candidates:
        # Delete existing results for this candidate+job
        db.query(ScreeningResult).filter(
            ScreeningResult.candidate_id == candidate.id,
            ScreeningResult.job_id == job.id
        ).delete()

        # Compute features
        skills_match = compute_skills_match(candidate.skills or [], job.required_skills or [])
        education_match = compute_education_match(candidate.education_level, job.education_requirement)

        features = {
            "skills_match": skills_match,
            "experience_years": candidate.total_experience_years or 0,
            "education_match": education_match,
            "project_count": candidate.projects_count or 0,
            "certification_count": candidate.certifications_count or 0,
            "career_gap_months": candidate.career_gap_months or 0,
            "career_gap_count": candidate.career_gap_count or 0,
        }

        prediction = predictor.predict(features, request.threshold)

        result = ScreeningResult(
            candidate_id=candidate.id,
            job_id=job.id,
            model_version_id=model_version.id,
            score=prediction["score"],
            decision=prediction["decision"],
            threshold_used=request.threshold,
            features_used=features,
            is_demo_data=candidate.is_demo_data,
        )
        db.add(result)
        db.flush()
        results.append(result)

    db.commit()

    # Refresh and return with candidates
    final = []
    for r in results:
        db.refresh(r)
        final.append(r)
    return final


@router.get("/results", response_model=list[ScreeningResultResponse])
def get_screening_results(job_id: int = None, db: Session = Depends(get_db)):
    query = db.query(ScreeningResult)
    if job_id:
        query = query.filter(ScreeningResult.job_id == job_id)
    results = query.order_by(ScreeningResult.score.desc()).all()
    return results


@router.get("/results/{result_id}", response_model=ScreeningResultResponse)
def get_screening_result(result_id: int, db: Session = Depends(get_db)):
    result = db.query(ScreeningResult).filter(ScreeningResult.id == result_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Screening result not found")
    return result
