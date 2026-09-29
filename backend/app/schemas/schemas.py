"""
FairHire AI — Pydantic v2 schemas for API request/response validation.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ─── Jobs ───────────────────────────────────────────────────────────────────

class JobCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    required_skills: Optional[list[str]] = None
    preferred_skills: Optional[list[str]] = None
    min_experience_years: float = 0
    education_requirement: Optional[str] = None


class JobResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    required_skills: Optional[list[str]] = None
    preferred_skills: Optional[list[str]] = None
    min_experience_years: float
    education_requirement: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── Candidates ─────────────────────────────────────────────────────────────

class ExperienceResponse(BaseModel):
    id: int
    company: Optional[str] = None
    job_title: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_career_gap: bool = False
    gap_months: float = 0

    model_config = {"from_attributes": True}


class CandidateResponse(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    education: Optional[str] = None
    education_level: Optional[str] = None
    total_experience_years: float = 0
    career_gap_months: float = 0
    career_gap_count: int = 0
    skills: Optional[list[str]] = None
    projects_count: int = 0
    certifications_count: int = 0
    is_demo_data: bool = False
    created_at: Optional[datetime] = None
    experiences: list[ExperienceResponse] = []

    model_config = {"from_attributes": True}


class CandidateSummary(BaseModel):
    id: int
    name: str
    total_experience_years: float = 0
    career_gap_months: float = 0
    skills_count: int = 0
    is_demo_data: bool = False

    model_config = {"from_attributes": True}


# ─── Resumes ────────────────────────────────────────────────────────────────

class ResumeResponse(BaseModel):
    id: int
    candidate_id: int
    filename: str
    file_type: Optional[str] = None
    parse_status: str = "pending"
    uploaded_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── Screening ──────────────────────────────────────────────────────────────

class ScreeningRunRequest(BaseModel):
    job_id: int
    candidate_ids: Optional[list[int]] = None  # None = screen all candidates
    threshold: float = Field(default=0.5, ge=0.0, le=100.0)


class ScreeningResultResponse(BaseModel):
    id: int
    candidate_id: int
    job_id: int
    score: float
    decision: str
    threshold_used: float
    features_used: Optional[dict] = None
    is_demo_data: bool = False
    created_at: Optional[datetime] = None
    candidate: Optional[CandidateResponse] = None

    model_config = {"from_attributes": True}


# ─── Explanations ───────────────────────────────────────────────────────────

class ExplanationResponse(BaseModel):
    id: int
    screening_result_id: int
    feature_contributions: Optional[dict[str, float]] = None
    top_positive: Optional[list[dict]] = None
    top_negative: Optional[list[dict]] = None
    natural_language: Optional[str] = None
    model_coefficients: Optional[dict[str, float]] = None
    is_demo_data: bool = False

    model_config = {"from_attributes": True}


# ─── Fairness ───────────────────────────────────────────────────────────────

class FairnessRunRequest(BaseModel):
    job_id: Optional[int] = None
    threshold: float = Field(default=0.5, ge=0.0, le=100.0)


class FairnessAuditResponse(BaseModel):
    id: int
    dataset_name: Optional[str] = None
    candidate_count: int = 0
    threshold_used: float = 0.5
    selection_rate_no_gap: Optional[float] = None
    selection_rate_gap: Optional[float] = None
    disparate_impact_ratio: Optional[float] = None
    demographic_parity_difference: Optional[float] = None
    demographic_analysis: Optional[dict] = None
    career_gap_analysis: Optional[dict] = None
    is_demo_data: bool = False
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── Counterfactual ─────────────────────────────────────────────────────────

class CounterfactualChange(BaseModel):
    feature: str
    original_value: float
    modified_value: float
    original_score: float
    new_score: float
    score_change: float
    category: str  # "LEGITIMATE", "MODEL-SENSITIVE", "NOT RECOMMENDED"
    note: Optional[str] = None


class CounterfactualResponse(BaseModel):
    id: int
    screening_result_id: int
    original_score: float
    original_decision: str
    changes: list[CounterfactualChange] = []
    is_demo_data: bool = False

    model_config = {"from_attributes": True}


# ─── Human Review ───────────────────────────────────────────────────────────

class HumanReviewCreate(BaseModel):
    candidate_id: int
    screening_result_id: int
    reviewer_name: Optional[str] = None
    decision: str  # "APPROVED", "REJECTED", "SKILLS_ASSESSMENT"
    comment: Optional[str] = None
    reason_for_review: Optional[str] = None


class HumanReviewResponse(BaseModel):
    id: int
    candidate_id: int
    screening_result_id: int
    reviewer_name: Optional[str] = None
    decision: Optional[str] = None
    comment: Optional[str] = None
    reason_for_review: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    candidate: Optional[CandidateResponse] = None

    model_config = {"from_attributes": True}


# ─── Reports ────────────────────────────────────────────────────────────────

class ReportGenerateRequest(BaseModel):
    job_id: int
    include_fairness: bool = True
    include_explanations: bool = True
    include_counterfactuals: bool = True


class ReportResponse(BaseModel):
    id: int
    report_name: Optional[str] = None
    pdf_path: Optional[str] = None
    excel_path: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── Career Gap Analysis ───────────────────────────────────────────────────

class CareerGapComparisonResponse(BaseModel):
    base_candidate_features: dict
    base_score: float
    base_decision: str
    variant_features: dict
    variant_score: float
    variant_decision: str
    score_difference: float
    gap_months_tested: float


# ─── Dashboard ──────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    # Counts
    total_candidates: int = 0
    total_jobs: int = 0
    # Legacy field names kept for backward compat
    screened: int = 0
    shortlisted: int = 0
    rejected: int = 0
    # Flat names the frontend expects
    total_screened: int = 0
    shortlisted_count: int = 0
    rejected_count: int = 0
    overall_selection_rate: float = 0.0
    career_gap_candidates: int = 0
    # Gap/no-gap split (flat)
    no_gap_count: int = 0
    no_gap_shortlisted: int = 0
    no_gap_selection_rate: float = 0.0
    gap_count: int = 0
    gap_shortlisted: int = 0
    gap_selection_rate: float = 0.0
    # Fairness
    disparate_impact_ratio: float = 0.0
    fairness_alerts: int = 0
    pending_human_reviews: int = 0
    # Charts / nested
    recent_audit: Optional[dict] = None
    score_distribution: Optional[list[dict]] = None
    selection_by_gap: Optional[dict] = None


# ─── Demo ───────────────────────────────────────────────────────────────────

class DemoLoadResponse(BaseModel):
    message: str
    job_id: int
    candidate_count: int
    screening_complete: bool = False
