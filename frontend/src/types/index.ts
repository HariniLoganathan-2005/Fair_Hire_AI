export interface Job {
  id: number;
  title: string;
  department?: string;
  description?: string;
  required_skills: string[];
  required_experience_years: number;
  min_education_level?: string;
  created_at: string;
}

export interface CandidateExperience {
  company: string;
  title: string;
  start_date: string;
  end_date?: string;
  duration_months: number;
}

export interface CandidateSkill {
  skill: string;
  category?: string;
}

export interface Candidate {
  id: number;
  job_id: number;
  name: string;
  email: string;
  phone?: string;
  total_experience_years: number;
  education_level: string;
  skills_match_score: number;
  career_gap_months: number;
  career_gap_count: number;
  gender_proxy?: string;
  age_proxy?: string;
  raw_text?: string;
  created_at: string;
  job?: Job;
  experiences?: CandidateExperience[];
  skills?: CandidateSkill[];
  screening_results?: ScreeningResult[];
}

export interface ScreeningResult {
  id: number;
  candidate_id: number;
  job_id: number;
  model_version_id: number;
  score: number;
  decision: string; // 'SHORTLISTED' | 'REJECTED' from backend
  confidence?: number;
  threshold_used: number;
  features_used?: {
    skills_match: number;
    experience_years: number;
    education_match: number;
    project_count: number;
    certification_count: number;
    career_gap_months: number;
    career_gap_count: number;
  };
  is_demo_data?: boolean;
  created_at: string;
  candidate?: Candidate;
  job?: Job;
  explanation?: Explanation;
  counterfactual?: Counterfactual;
}

export interface ExplanationFeature {
  feature: string;
  feature_key?: string;
  value: number;
}

export interface Explanation {
  id: number;
  screening_result_id: number;
  feature_contributions: Record<string, number>;
  top_positive: ExplanationFeature[];
  top_negative: ExplanationFeature[];
  natural_language?: string;
  model_coefficients?: Record<string, number>;
  is_demo_data?: boolean;
}

export interface FairnessMetric {
  name: string;
  value: number;
  status: 'fair' | 'borderline' | 'disparate';
  description: string;
  threshold_rule: string;
}

export interface FairnessAudit {
  id: number;
  job_id?: number;
  model_version_id?: number;
  dataset_name?: string;
  candidate_count: number;          // backend field name
  sample_size?: number;             // alias used in some older responses
  threshold_used?: number;
  selection_rate_no_gap: number;
  selection_rate_gap: number;
  disparate_impact_ratio: number;
  demographic_parity_difference: number;   // backend field name
  demographic_parity_diff?: number;        // alias kept for safety
  career_gap_penalty_estimate?: number;
  is_fair?: boolean;
  is_demo_data?: boolean;
  notes?: string;
  created_at: string;
  metrics_breakdown?: FairnessMetric[];
  demographic_analysis?: Record<string, any>;
  career_gap_analysis?: Record<string, any>;
  group_statistics?: Record<string, any>;
  controlled_experiment?: {
    avg_score_original: number;
    avg_score_gap_removed: number;
    avg_impact_percentage: number;
    candidates_tested: number;
  };
}

export interface CounterfactualChange {
  feature: string;
  feature_key?: string;
  original_value: number;
  modified_value: number;
  original_score: number;
  new_score: number;
  score_change: number;
  new_decision?: string;
  category: 'LEGITIMATE' | 'MODEL-SENSITIVE' | 'NOT RECOMMENDED';
  action?: string;
  note?: string | null;
}

export interface Counterfactual {
  id: number;
  screening_result_id: number;
  original_score: number;
  original_decision: string;
  changes: CounterfactualChange[];
  is_demo_data?: boolean;
}

export interface HumanReview {
  id: number;
  screening_result_id: number;
  reviewer_name: string;
  original_decision: string;
  override_decision: 'approved' | 'rejected' | 're-assess';
  notes: string;
  justification_category?: string;
  created_at: string;
  screening_result?: ScreeningResult;
}

export interface DashboardStats {
  total_candidates: number;
  total_jobs: number;
  total_screened: number;
  shortlisted_count: number;
  rejected_count: number;
  overall_selection_rate: number;
  no_gap_count: number;
  no_gap_shortlisted: number;
  no_gap_selection_rate: number;
  gap_count: number;
  gap_shortlisted: number;
  gap_selection_rate: number;
  disparate_impact_ratio: number;
  pending_human_reviews: number;
  score_distribution: Array<{ range: string; count: number; gap_count: number; no_gap_count: number }>;
}

export interface ModelCardData {
  model_name: string;
  version: string;
  model_type: string;
  created_at: string;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
  };
  features: string[];
  coefficients: Record<string, number>;
  intercept: number;
  training_dataset_info: {
    samples: number;
    source: string;
    is_synthetic: boolean;
  };
  limitations: string[];
  responsible_ai_notes: string[];
}
