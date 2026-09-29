import axios from 'axios';
import {
  Job,
  Candidate,
  ScreeningResult,
  Explanation,
  FairnessAudit,
  Counterfactual,
  HumanReview,
  DashboardStats,
  ModelCardData
} from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Demo APIs
export const loadDemoData = async () => {
  const response = await apiClient.post('/demo/load');
  return response.data;
};

export const getDemoStatus = async () => {
  const response = await apiClient.get('/demo/status');
  return response.data;
};

// Dashboard APIs
export const getDashboardStats = async (jobId?: number): Promise<DashboardStats> => {
  const response = await apiClient.get('/dashboard', {
    params: jobId ? { job_id: jobId } : undefined,
  });
  return response.data;
};

// Jobs APIs
export const getJobs = async (): Promise<Job[]> => {
  const response = await apiClient.get('/jobs');
  return response.data;
};

export const getJob = async (id: number): Promise<Job> => {
  const response = await apiClient.get(`/jobs/${id}`);
  return response.data;
};

export const createJob = async (jobData: Partial<Job>): Promise<Job> => {
  const response = await apiClient.post('/jobs', jobData);
  return response.data;
};

// Candidates APIs
export const getCandidates = async (params?: { job_id?: number; search?: string }): Promise<Candidate[]> => {
  const response = await apiClient.get('/candidates', { params });
  return response.data;
};

export const getCandidate = async (id: number): Promise<Candidate> => {
  const response = await apiClient.get(`/candidates/${id}`);
  return response.data;
};

// Resume Upload & Parse APIs
export const uploadResumes = async (formData: FormData) => {
  const response = await apiClient.post('/resumes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const parseResume = async (resumeId: number) => {
  const response = await apiClient.post(`/resumes/${resumeId}/parse`);
  return response.data;
};

// Screening APIs
export const runScreening = async (params: { job_id: number; threshold?: number }) => {
  const response = await apiClient.post('/screening/run', params);
  return response.data;
};

export const getScreeningResults = async (params?: { job_id?: number; decision?: string }): Promise<ScreeningResult[]> => {
  const response = await apiClient.get('/screening/results', { params });
  return response.data;
};

export const getScreeningResult = async (id: number): Promise<ScreeningResult> => {
  const response = await apiClient.get(`/screening/results/${id}`);
  return response.data;
};

// Explanations APIs (SHAP)
export const getExplanation = async (resultId: number): Promise<Explanation> => {
  const response = await apiClient.get(`/explanations/${resultId}`);
  return response.data;
};

export const generateExplanation = async (resultId: number): Promise<Explanation> => {
  const response = await apiClient.post(`/explanations/${resultId}/shap`);
  return response.data;
};

// Fairness APIs
export const runFairnessAudit = async (params?: { job_id?: number; threshold?: number }): Promise<FairnessAudit> => {
  const response = await apiClient.post('/fairness/run', params || {});
  return response.data;
};

export const getLatestFairnessAudit = async (jobId?: number): Promise<FairnessAudit> => {
  const response = await apiClient.get('/fairness', {
    params: jobId ? { job_id: jobId } : undefined,
  });
  // Backend returns a list ordered by created_at desc; take the first
  const list: FairnessAudit[] = response.data;
  if (!list || list.length === 0) throw new Error('No fairness audits found');
  return list[0];
};

// Counterfactual APIs
export const getCounterfactual = async (resultId: number): Promise<Counterfactual> => {
  const response = await apiClient.get(`/counterfactual/${resultId}`);
  return response.data;
};

export const generateCounterfactual = async (resultId: number, targetDecision: string = 'shortlisted'): Promise<Counterfactual> => {
  const response = await apiClient.post(`/counterfactual/${resultId}`, { target_decision: targetDecision });
  return response.data;
};

// Human Review APIs
export const getReviews = async (params?: { status?: string }): Promise<HumanReview[]> => {
  const response = await apiClient.get('/reviews', { params });
  return response.data;
};

export const submitReview = async (data: {
  screening_result_id: number;
  reviewer_name: string;
  override_decision: 'approved' | 'rejected' | 're-assess';
  notes: string;
  justification_category?: string;
}): Promise<HumanReview> => {
  const response = await apiClient.post('/reviews', data);
  return response.data;
};

// Reports APIs
export const generateReport = async (data: { title: string; job_id?: number; notes?: string }) => {
  const response = await apiClient.post('/reports/generate', data);
  return response.data;
};

export const downloadPdfReportUrl = (reportId: number | string) => {
  return `${API_BASE_URL}/reports/${reportId}/download?format=pdf`;
};

export const downloadExcelReportUrl = (reportId: number | string) => {
  return `${API_BASE_URL}/reports/${reportId}/download?format=excel`;
};

// Model Info API
export const getModelCard = async (): Promise<ModelCardData> => {
  const response = await apiClient.get('/fairness/model-card');
  return response.data;
};
