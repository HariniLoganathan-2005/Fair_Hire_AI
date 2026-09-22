"""
FairHire AI — SQLAlchemy ORM models.

All database tables for the FairHire AI platform.
Responsible AI note: Protected attributes (gender, age, race) are stored
ONLY for fairness auditing purposes and are NEVER used as screening features.
"""

from sqlalchemy import (
    Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.database import Base


def _utcnow():
    return datetime.now(timezone.utc)


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    required_skills = Column(JSON, nullable=True)  # list of strings
    preferred_skills = Column(JSON, nullable=True)
    min_experience_years = Column(Float, default=0)
    education_requirement = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=_utcnow)

    screening_results = relationship("ScreeningResult", back_populates="job")


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    email = Column(String(200), nullable=True)
    phone = Column(String(50), nullable=True)
    education = Column(String(500), nullable=True)
    education_level = Column(String(100), nullable=True)  # e.g. "Bachelor's", "Master's"
    total_experience_years = Column(Float, default=0)
    career_gap_months = Column(Float, default=0)
    career_gap_count = Column(Integer, default=0)
    skills = Column(JSON, nullable=True)  # list of strings
    projects_count = Column(Integer, default=0)
    certifications_count = Column(Integer, default=0)
    # Responsible AI: demographic fields are for AUDITING ONLY, never for screening
    # These are only populated in synthetic/demo datasets and clearly labeled
    demographic_gender = Column(String(50), nullable=True)
    demographic_age_group = Column(String(50), nullable=True)
    is_demo_data = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_utcnow)

    resumes = relationship("Resume", back_populates="candidate")
    experiences = relationship("Experience", back_populates="candidate", order_by="Experience.start_date")
    screening_results = relationship("ScreeningResult", back_populates="candidate")
    human_reviews = relationship("HumanReview", back_populates="candidate")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    filename = Column(String(500), nullable=False)
    file_path = Column(String(1000), nullable=True)
    file_type = Column(String(10), nullable=True)  # pdf, docx
    extracted_text = Column(Text, nullable=True)
    parse_status = Column(String(50), default="pending")  # pending, parsing, completed, failed
    uploaded_at = Column(DateTime, default=_utcnow)

    candidate = relationship("Candidate", back_populates="resumes")


class Experience(Base):
    __tablename__ = "experiences"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    company = Column(String(300), nullable=True)
    job_title = Column(String(300), nullable=True)
    start_date = Column(String(20), nullable=True)  # stored as YYYY-MM for flexibility
    end_date = Column(String(20), nullable=True)  # "present" for current roles
    is_career_gap = Column(Boolean, default=False)
    gap_months = Column(Float, default=0)

    candidate = relationship("Candidate", back_populates="experiences")


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    version = Column(String(50), nullable=False)
    model_type = Column(String(100), nullable=False)  # e.g. "LogisticRegression"
    features = Column(JSON, nullable=True)
    training_date = Column(DateTime, nullable=True)
    dataset_name = Column(String(200), nullable=True)
    metrics = Column(JSON, nullable=True)  # accuracy, precision, recall, f1
    threshold = Column(Float, default=0.5)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=_utcnow)

    screening_results = relationship("ScreeningResult", back_populates="model_version")
    fairness_audits = relationship("FairnessAudit", back_populates="model_version")


class ScreeningResult(Base):
    __tablename__ = "screening_results"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    model_version_id = Column(Integer, ForeignKey("model_versions.id"), nullable=True)
    score = Column(Float, nullable=False)
    decision = Column(String(20), nullable=False)  # "SHORTLISTED" or "REJECTED"
    threshold_used = Column(Float, default=0.5)
    features_used = Column(JSON, nullable=True)  # snapshot of feature values
    is_demo_data = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_utcnow)

    candidate = relationship("Candidate", back_populates="screening_results")
    job = relationship("Job", back_populates="screening_results")
    model_version = relationship("ModelVersion", back_populates="screening_results")
    explanations = relationship("Explanation", back_populates="screening_result")
    counterfactuals = relationship("Counterfactual", back_populates="screening_result")
    human_reviews = relationship("HumanReview", back_populates="screening_result")


class FairnessAudit(Base):
    __tablename__ = "fairness_audits"

    id = Column(Integer, primary_key=True, index=True)
    model_version_id = Column(Integer, ForeignKey("model_versions.id"), nullable=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    dataset_name = Column(String(200), nullable=True)
    candidate_count = Column(Integer, default=0)
    threshold_used = Column(Float, default=0.5)
    selection_rate_no_gap = Column(Float, nullable=True)
    selection_rate_gap = Column(Float, nullable=True)
    disparate_impact_ratio = Column(Float, nullable=True)
    demographic_parity_difference = Column(Float, nullable=True)
    demographic_analysis = Column(JSON, nullable=True)  # detailed breakdowns
    career_gap_analysis = Column(JSON, nullable=True)
    is_demo_data = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_utcnow)

    model_version = relationship("ModelVersion", back_populates="fairness_audits")


class Explanation(Base):
    __tablename__ = "explanations"

    id = Column(Integer, primary_key=True, index=True)
    screening_result_id = Column(Integer, ForeignKey("screening_results.id"), nullable=False)
    feature_contributions = Column(JSON, nullable=True)  # {feature: shap_value}
    top_positive = Column(JSON, nullable=True)
    top_negative = Column(JSON, nullable=True)
    natural_language = Column(Text, nullable=True)
    model_coefficients = Column(JSON, nullable=True)
    is_demo_data = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_utcnow)

    screening_result = relationship("ScreeningResult", back_populates="explanations")


class Counterfactual(Base):
    __tablename__ = "counterfactuals"

    id = Column(Integer, primary_key=True, index=True)
    screening_result_id = Column(Integer, ForeignKey("screening_results.id"), nullable=False)
    original_score = Column(Float, nullable=False)
    original_decision = Column(String(20), nullable=False)
    changes = Column(JSON, nullable=True)  # list of {feature, original, modified, new_score, category}
    is_demo_data = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_utcnow)

    screening_result = relationship("ScreeningResult", back_populates="counterfactuals")


class HumanReview(Base):
    __tablename__ = "human_reviews"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    screening_result_id = Column(Integer, ForeignKey("screening_results.id"), nullable=False)
    reviewer_name = Column(String(200), nullable=True)
    decision = Column(String(50), nullable=True)  # "APPROVED", "REJECTED", "SKILLS_ASSESSMENT"
    comment = Column(Text, nullable=True)
    reason_for_review = Column(String(500), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=_utcnow)

    candidate = relationship("Candidate", back_populates="human_reviews")
    screening_result = relationship("ScreeningResult", back_populates="human_reviews")


class AuditReport(Base):
    __tablename__ = "audit_reports"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    model_version_id = Column(Integer, ForeignKey("model_versions.id"), nullable=True)
    report_name = Column(String(500), nullable=True)
    report_data = Column(JSON, nullable=True)
    pdf_path = Column(String(1000), nullable=True)
    excel_path = Column(String(1000), nullable=True)
    created_at = Column(DateTime, default=_utcnow)
