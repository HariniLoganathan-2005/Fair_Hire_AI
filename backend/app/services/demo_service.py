"""
FairHire AI — Demo Data Service.

Preloads a complete demo scenario so the application can be demonstrated
without uploading real files. All demo data is clearly labeled.

IMPORTANT: All values labeled as DEMO DATA.
"""

from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.database.models import (
    Job, Candidate, Experience, ModelVersion, ScreeningResult
)
from app.ml.predictor import get_predictor


# Demo candidate profiles — realistic but synthetic
DEMO_CANDIDATES = [
    {
        "name": "Priya Sharma",
        "email": "priya.sharma@example.com",
        "phone": "+91-9876543210",
        "education": "M.Tech Computer Science, IIT Delhi",
        "education_level": "Master's",
        "skills": ["Python", "SQL", "Machine Learning", "Pandas", "Scikit-learn", "Statistics", "TensorFlow", "Data Analysis"],
        "total_experience_years": 5.2,
        "career_gap_months": 0,
        "career_gap_count": 0,
        "projects_count": 4,
        "certifications_count": 2,
        "demographic_gender": "Female",
        "demographic_age_group": "26-35",
        "experiences": [
            {"company": "Tech Solutions Pvt. Ltd.", "job_title": "Data Analyst", "start_date": "2019-06", "end_date": "2021-08"},
            {"company": "DataVerse Analytics", "job_title": "Data Scientist", "start_date": "2021-09", "end_date": "2024-10"},
        ],
    },
    {
        "name": "Rahul Mehta",
        "email": "rahul.mehta@example.com",
        "phone": "+91-9876543211",
        "education": "B.Tech Information Technology, NIT Trichy",
        "education_level": "Bachelor's",
        "skills": ["Python", "SQL", "Machine Learning", "Pandas", "Statistics", "Data Analysis"],
        "total_experience_years": 4.1,
        "career_gap_months": 18,
        "career_gap_count": 1,
        "projects_count": 3,
        "certifications_count": 1,
        "demographic_gender": "Male",
        "demographic_age_group": "26-35",
        "experiences": [
            {"company": "Infosys Ltd.", "job_title": "Software Engineer", "start_date": "2018-07", "end_date": "2020-12"},
            {"company": None, "job_title": "Career Break", "start_date": "2021-01", "end_date": "2022-06", "is_gap": True},
            {"company": "Analytics Corp.", "job_title": "Junior Data Scientist", "start_date": "2022-07", "end_date": "2024-10"},
        ],
    },
    {
        "name": "Ananya Reddy",
        "email": "ananya.reddy@example.com",
        "phone": "+91-9876543212",
        "education": "M.Sc Statistics, ISI Kolkata",
        "education_level": "Master's",
        "skills": ["Python", "R", "SQL", "Statistics", "Machine Learning", "Scikit-learn", "Pandas", "NumPy"],
        "total_experience_years": 6.5,
        "career_gap_months": 0,
        "career_gap_count": 0,
        "projects_count": 5,
        "certifications_count": 3,
        "demographic_gender": "Female",
        "demographic_age_group": "26-35",
        "experiences": [
            {"company": "Research Institute of India", "job_title": "Statistical Analyst", "start_date": "2017-08", "end_date": "2019-12"},
            {"company": "FinTech Solutions", "job_title": "Data Scientist", "start_date": "2020-01", "end_date": "2024-10"},
        ],
    },
    {
        "name": "Vikram Singh",
        "email": "vikram.singh@example.com",
        "phone": "+91-9876543213",
        "education": "B.E. Computer Science, BITS Pilani",
        "education_level": "Bachelor's",
        "skills": ["Python", "SQL", "Machine Learning", "Data Analysis"],
        "total_experience_years": 3.0,
        "career_gap_months": 12,
        "career_gap_count": 1,
        "projects_count": 2,
        "certifications_count": 0,
        "demographic_gender": "Male",
        "demographic_age_group": "26-35",
        "experiences": [
            {"company": "Wipro Technologies", "job_title": "Associate Analyst", "start_date": "2019-07", "end_date": "2021-06"},
            {"company": None, "job_title": "Career Break", "start_date": "2021-07", "end_date": "2022-06", "is_gap": True},
            {"company": "StartupXYZ", "job_title": "Data Analyst", "start_date": "2022-07", "end_date": "2024-10"},
        ],
    },
    {
        "name": "Sneha Iyer",
        "email": "sneha.iyer@example.com",
        "phone": "+91-9876543214",
        "education": "Ph.D. Machine Learning, IISc Bangalore",
        "education_level": "PhD",
        "skills": ["Python", "SQL", "Machine Learning", "Deep Learning", "NLP", "TensorFlow", "PyTorch", "Statistics", "Pandas", "Scikit-learn"],
        "total_experience_years": 7.0,
        "career_gap_months": 6,
        "career_gap_count": 1,
        "projects_count": 6,
        "certifications_count": 2,
        "demographic_gender": "Female",
        "demographic_age_group": "36-45",
        "experiences": [
            {"company": "IISc Research Lab", "job_title": "Research Associate", "start_date": "2015-08", "end_date": "2019-07"},
            {"company": None, "job_title": "Career Break", "start_date": "2019-08", "end_date": "2020-01", "is_gap": True},
            {"company": "AI Innovations Pvt. Ltd.", "job_title": "Senior Data Scientist", "start_date": "2020-02", "end_date": "2024-10"},
        ],
    },
]


def compute_skills_match(candidate_skills: list[str], required_skills: list[str]) -> float:
    """Compute the percentage of required skills matched by the candidate."""
    if not required_skills:
        return 50.0
    matched = sum(1 for s in required_skills if s.lower() in [cs.lower() for cs in candidate_skills])
    return round((matched / len(required_skills)) * 100, 1)


def compute_education_match(edu_level: str, required: str) -> float:
    """Simple education match scoring."""
    levels = {"High School": 20, "Associate": 40, "Bachelor's": 60, "Master's": 80, "PhD": 100}
    candidate_score = levels.get(edu_level, 40)
    # Basic matching — higher education gets higher match
    req_lower = (required or "").lower()
    if "phd" in req_lower or "doctorate" in req_lower:
        required_score = 100
    elif "master" in req_lower:
        required_score = 80
    elif "bachelor" in req_lower:
        required_score = 60
    else:
        required_score = 60

    if candidate_score >= required_score:
        return min(100, candidate_score)
    else:
        return max(20, candidate_score - (required_score - candidate_score) * 0.5)


def load_demo_data(db: Session) -> dict:
    """Load the complete demo scenario into the database."""

    # Check if demo data already exists
    existing_job = db.query(Job).filter(Job.title == "Data Scientist (Demo)").first()
    if existing_job:
        candidate_count = db.query(Candidate).filter(Candidate.is_demo_data == True).count()
        return {
            "message": "Demo data already loaded",
            "job_id": existing_job.id,
            "candidate_count": candidate_count,
            "screening_complete": db.query(ScreeningResult).filter(ScreeningResult.is_demo_data == True).count() > 0,
        }

    # ─── Create demo job ────────────────────────────────────────────────
    required_skills = ["Python", "SQL", "Machine Learning", "Statistics", "Pandas", "Scikit-learn"]
    job = Job(
        title="Data Scientist (Demo)",
        description="We are looking for a Data Scientist to join our analytics team. "
                    "The ideal candidate has strong skills in Python, machine learning, "
                    "and statistical analysis with experience in data-driven decision making.",
        required_skills=required_skills,
        preferred_skills=["TensorFlow", "PyTorch", "Deep Learning", "NLP", "Cloud (AWS/GCP)"],
        min_experience_years=2.0,
        education_requirement="Bachelor's degree in Computer Science, Statistics, or related field",
    )
    db.add(job)
    db.flush()

    # ─── Create model version ───────────────────────────────────────────
    predictor = get_predictor()
    metadata = predictor.get_metadata() if predictor.is_loaded() else {}

    model_version = ModelVersion(
        name=metadata.get("model_name", "Resume Screening v1"),
        version=metadata.get("version", "1.0"),
        model_type=metadata.get("model_type", "LogisticRegression"),
        features=metadata.get("features", []),
        dataset_name=metadata.get("dataset_name", "Synthetic Candidate Dataset"),
        metrics=metadata.get("metrics", {}),
        threshold=0.5,
        is_active=True,
    )
    db.add(model_version)
    db.flush()

    # ─── Create candidates and screen them ──────────────────────────────
    candidate_ids = []
    for cdata in DEMO_CANDIDATES:
        candidate = Candidate(
            name=cdata["name"],
            email=cdata["email"],
            phone=cdata["phone"],
            education=cdata["education"],
            education_level=cdata["education_level"],
            skills=cdata["skills"],
            total_experience_years=cdata["total_experience_years"],
            career_gap_months=cdata["career_gap_months"],
            career_gap_count=cdata["career_gap_count"],
            projects_count=cdata["projects_count"],
            certifications_count=cdata["certifications_count"],
            demographic_gender=cdata["demographic_gender"],
            demographic_age_group=cdata["demographic_age_group"],
            is_demo_data=True,
        )
        db.add(candidate)
        db.flush()
        candidate_ids.append(candidate.id)

        # Add experiences
        for exp in cdata.get("experiences", []):
            experience = Experience(
                candidate_id=candidate.id,
                company=exp.get("company"),
                job_title=exp.get("job_title"),
                start_date=exp.get("start_date"),
                end_date=exp.get("end_date"),
                is_career_gap=exp.get("is_gap", False),
                gap_months=cdata["career_gap_months"] if exp.get("is_gap") else 0,
            )
            db.add(experience)

        # Compute features and run screening
        skills_match = compute_skills_match(cdata["skills"], required_skills)
        education_match = compute_education_match(
            cdata["education_level"], job.education_requirement
        )

        features = {
            "skills_match": skills_match,
            "experience_years": cdata["total_experience_years"],
            "education_match": education_match,
            "project_count": cdata["projects_count"],
            "certification_count": cdata["certifications_count"],
            "career_gap_months": cdata["career_gap_months"],
            "career_gap_count": cdata["career_gap_count"],
        }

        # Get prediction from actual model
        if predictor.is_loaded():
            prediction = predictor.predict(features, threshold=0.5)
            score = prediction["score"]
            decision = prediction["decision"]
        else:
            # Fallback — should not happen if model is trained
            score = 50.0
            decision = "REJECTED"

        screening_result = ScreeningResult(
            candidate_id=candidate.id,
            job_id=job.id,
            model_version_id=model_version.id,
            score=score,
            decision=decision,
            threshold_used=0.5,
            features_used=features,
            is_demo_data=True,
        )
        db.add(screening_result)

    db.commit()

    return {
        "message": "Demo data loaded successfully — DEMO DATA",
        "job_id": job.id,
        "candidate_count": len(DEMO_CANDIDATES),
        "screening_complete": True,
    }
