"""FairHire AI — Resume Upload & Parsing API."""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import Resume, Candidate, Experience
from app.resume_parser.parser import parse_resume
from app.schemas.schemas import ResumeResponse, CandidateResponse
import os
import shutil

router = APIRouter()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")


@router.post("/upload", response_model=list[ResumeResponse])
async def upload_resumes(
    files: list[UploadFile] = File(...),
    job_id: int = Form(default=None),
    db: Session = Depends(get_db)
):
    """Upload one or more resume files (PDF or DOCX)."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    results = []

    for file in files:
        # Validate file type
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in (".pdf", ".docx"):
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {ext}. Supported: .pdf, .docx"
            )

        # Save file
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        # Create placeholder candidate (will be populated after parsing)
        candidate = Candidate(name=os.path.splitext(file.filename)[0])
        db.add(candidate)
        db.flush()

        resume = Resume(
            candidate_id=candidate.id,
            filename=file.filename,
            file_path=file_path,
            file_type=ext.lstrip("."),
            parse_status="uploaded",
        )
        db.add(resume)
        db.flush()
        results.append(resume)

    db.commit()
    return results


@router.post("/{resume_id}/parse", response_model=CandidateResponse)
def parse_uploaded_resume(resume_id: int, db: Session = Depends(get_db)):
    """Parse an uploaded resume and extract structured information."""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if not resume.file_path or not os.path.exists(resume.file_path):
        raise HTTPException(status_code=400, detail="Resume file not found on disk")

    # Update status
    resume.parse_status = "parsing"
    db.commit()

    try:
        # Parse resume
        parsed = parse_resume(resume.file_path)

        if "error" in parsed:
            resume.parse_status = "failed"
            db.commit()
            raise HTTPException(status_code=400, detail=parsed["error"])

        # Update candidate with parsed data
        candidate = db.query(Candidate).filter(Candidate.id == resume.candidate_id).first()
        candidate.name = parsed.get("name", candidate.name)
        candidate.email = parsed.get("email")
        candidate.phone = parsed.get("phone")
        candidate.education = parsed.get("education")
        candidate.education_level = parsed.get("education_level")
        candidate.skills = parsed.get("skills", [])
        candidate.total_experience_years = parsed.get("total_experience_years", 0)
        candidate.career_gap_months = parsed.get("career_gap_months", 0)
        candidate.career_gap_count = parsed.get("career_gap_count", 0)
        candidate.projects_count = parsed.get("projects_count", 0)
        candidate.certifications_count = parsed.get("certifications_count", 0)

        # Save extracted text
        resume.extracted_text = parsed.get("raw_text", "")
        resume.parse_status = "completed"

        # Add experiences
        for start_str, end_str, context in parsed.get("date_ranges", []):
            exp = Experience(
                candidate_id=candidate.id,
                job_title=context[:200] if context else None,
                start_date=start_str,
                end_date=end_str,
            )
            db.add(exp)

        # Add career gap entries
        for gap in parsed.get("career_gaps", []):
            gap_exp = Experience(
                candidate_id=candidate.id,
                job_title="Career Gap",
                start_date=gap["start"],
                end_date=gap["end"],
                is_career_gap=True,
                gap_months=gap["months"],
            )
            db.add(gap_exp)

        db.commit()
        db.refresh(candidate)
        return candidate

    except HTTPException:
        raise
    except Exception as e:
        resume.parse_status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Resume parsing error: {str(e)}")


@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(resume_id: int, db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume
