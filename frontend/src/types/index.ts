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
  decision: 'shortlisted' | 'rejected';
  confidence?: number;
  threshold_used: number;
  created_at: string;
  candidate?: Candidate;
  job?: Job;
  explanation?: Explanation;
  counterfactual?: Counterfactual;
}

export interface Explanation {
  id: number;
  screening_result_id: number;
  shap_values: Record<string, number>;
  base_value: number;
  top_positive_features: Array<{ feature: string; shap_value: number; raw_value?: number }>;
  top_negative_features: Array<{ feature: string; shap_value: number; raw_value?: number }>;
  summary_text: string;
  created_at: string;
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
  selection_rate_no_gap: number;
  selection_rate_gap: number;
  disparate_impact_ratio: number;
  demographic_parity_diff: number;
  career_gap_penalty_estimate?: number;
  sample_size: number;
  is_fair: boolean;
  notes?: string;
  created_at: string;
  metrics_breakdown?: FairnessMetric[];
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
  current_value: any;
  required_value: any;
  difference: any;
  classification: 'LEGITIMATE' | 'MODEL_SENSITIVE' | 'NOT_RECOMMENDED';
  explanation: string;
}

export interface Counterfactual {
  id: number;
  screening_result_id: number;
  original_score: number;
  original_decision: string;
  target_decision: string;
  changes_required: CounterfactualChange[];
  minimal_perturbation_score: number;
  feasibility_notes: string;
  disclaimer: string;
  created_at: string;
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
