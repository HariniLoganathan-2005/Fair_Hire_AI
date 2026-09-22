import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  Play,
  FileText,
  CheckCircle2,
  BrainCircuit,
  SlidersHorizontal,
  Layers,
  Sparkles,
  Loader2,
  Info
} from 'lucide-react';
import { getJobs, uploadResumes, runScreening } from '../services/api';
import { Job } from '../types';

interface ScreeningStep {
  id: number;
  label: string;
  description: string;
}

const SCREENING_STEPS: ScreeningStep[] = [
  {
    id: 1,
    label: '1. Feature Vector Extraction',
    description: 'Extracting candidate skills overlap, verified experience, education tier, and career gap metrics (months & count).'
  },
  {
    id: 2,
    label: '2. Preprocessing & StandardScaler',
    description: 'Standardizing 7 numerical feature dimensions against fitted training distributions.'
  },
  {
    id: 3,
    label: '3. ML Inference (Logistic Regression)',
    description: 'Computing calibrated qualification probability P(Qualified | Features) for each candidate.'
  },
  {
    id: 4,
    label: '4. Threshold Decision Gate',
    description: 'Evaluating candidate scores against cutoff threshold to assign Shortlisted vs Rejected classifications.'
  },
  {
    id: 5,
    label: '5. Audit & SHAP Attributions',
    description: 'Persisting decisions to database, preparing Kernel/Linear SHAP attributions, and updating fairness metrics.'
  }
];

export const Screening: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number>(1);
  const [threshold, setThreshold] = useState<number>(50);
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [screening, setScreening] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await getJobs();
        setJobs(data);
        if (data.length > 0) {
          setSelectedJobId(data[0].id);
        }
      } catch (err) {
        console.error('Error fetching jobs:', err);
      }
    };
    fetchJobs();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files || files.length === 0) {
      setStatusMessage('Please select one or more PDF/DOCX resume files.');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      formData.append('job_id', selectedJobId.toString());

      const res = await uploadResumes(formData);
      setStatusMessage(`Successfully uploaded and parsed ${res.count || files.length} resumes!`);
      setFiles(null);
    } catch (err: any) {
      setStatusMessage('Failed to upload/parse files. Ensure backend is running.');
    } finally {
      setUploading(false);
    }
  };

  const handleRunScreening = async () => {
    try {
      setScreening(true);
      setActiveStep(1);
      setProgressPercent(15);
      setStatusMessage('Step 1/5: Extracting features from candidate profiles...');

      // Animate progress smoothly through stages while API call proceeds
      const stepTimer1 = setTimeout(() => {
        setActiveStep(2);
        setProgressPercent(35);
        setStatusMessage('Step 2/5: Normalizing feature vectors via StandardScaler...');
      }, 400);

      const stepTimer2 = setTimeout(() => {
        setActiveStep(3);
        setProgressPercent(60);
        setStatusMessage('Step 3/5: Running ML Logistic Regression inference & calculating scores...');
      }, 900);

      const stepTimer3 = setTimeout(() => {
        setActiveStep(4);
        setProgressPercent(80);
        setStatusMessage(`Step 4/5: Applying decision threshold (${threshold}/100) — classifying Shortlisted / Rejected...`);
      }, 1400);

      const res = await runScreening({
        job_id: selectedJobId,
        threshold: threshold > 1 ? threshold / 100 : threshold,
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      setActiveStep(5);
      setProgressPercent(100);
      const count = Array.isArray(res) ? res.length : (res.screened_count || 'all');
      setStatusMessage(`Step 5/5: Screening complete! Successfully evaluated ${count} candidates.`);

      setTimeout(() => {
        navigate('/candidates');
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setStatusMessage('Screening failed. Please ensure candidates exist for this job.');
      setScreening(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">AI Resume Screening Engine</h2>
        <p className="text-xs text-slate-400">
          Upload resumes for feature extraction (skills, experience, employment continuity) and run ML scoring
        </p>
      </div>

      {/* Real-time Status / Alert Banner */}
      {statusMessage && (
        <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-300 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="font-medium">{statusMessage}</span>
          </div>
          {screening && (
            <span className="font-mono text-xs text-indigo-400 font-bold px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
              {progressPercent}%
            </span>
          )}
        </div>
      )}

      {/* Screening Progress Status Bar (Visible when screening is active or just completed) */}
      {screening && (
        <div className="p-5 rounded-xl border border-indigo-500/40 bg-slate-900/90 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                Screening Pipeline in Progress
              </h4>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-300">{progressPercent}%</span>
          </div>

          {/* Glowing Animated Progress Bar */}
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Stepper Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 pt-2">
            {SCREENING_STEPS.map((step) => {
              const isDone = activeStep > step.id || activeStep === 5;
              const isCurrent = activeStep === step.id && activeStep !== 5;
              return (
                <div
                  key={step.id}
                  className={`p-2.5 rounded-lg border text-[11px] transition-all ${
                    isDone
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                      : isCurrent
                      ? 'bg-indigo-950/50 border-indigo-500/60 text-indigo-200 ring-1 ring-indigo-500/50'
                      : 'bg-slate-850/50 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold mb-1">
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-600 flex items-center justify-center text-[9px] shrink-0">
                        {step.id}
                      </div>
                    )}
                    <span className="truncate">{step.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Job & Threshold Configuration */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" /> Target Job Position
            </h3>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Select Job</label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(Number(e.target.value))}
                className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.required_experience_years}+ yrs exp)
                  </option>
                ))}
              </select>
            </div>

            {/* Threshold Slider */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                  Decision Threshold:
                </label>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {threshold}/100
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                step="5"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 leading-normal">
                Candidates scoring &ge; {threshold} are <strong>Shortlisted</strong>; below are <strong>Rejected</strong>. Adjusting the threshold dynamically shifts disparate impact rates.
              </p>
            </div>

            {/* Action Button */}
            <button
              onClick={handleRunScreening}
              disabled={screening}
              className="w-full py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 cursor-pointer"
            >
              {screening ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Pipeline ({progressPercent}%)...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Run Screening on All Candidates</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Info Box on How Screening Happens */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <Info className="w-4 h-4 text-indigo-400" />
              <span>What does "Run Screening" do?</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              1. Maps every candidate's extracted profile against the selected job requirements.
            </p>
            <p className="text-[11px] leading-relaxed">
              2. Feeds 7 quantitative features (including career gap penalty metrics) into the ML model.
            </p>
            <p className="text-[11px] leading-relaxed">
              3. Compares the 0–100 score with your threshold to generate decisions, prepare SHAP explanations, and audit for demographic bias.
            </p>
          </div>
        </div>

        {/* Right Column: Upload Box & Pipeline Architecture */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-indigo-400" /> Upload Candidate Resumes (PDF / DOCX)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Extract candidate skills, work history, and calculate uninterrupted career gap metrics automatically.
              </p>

              <form onSubmit={handleUpload} className="mt-5 space-y-4">
                <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-xl p-8 text-center transition cursor-pointer bg-slate-850/40">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx,.txt"
                    id="resume-files"
                    onChange={(e) => setFiles(e.target.files)}
                    className="hidden"
                  />
                  <label htmlFor="resume-files" className="cursor-pointer space-y-2 block">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-medium text-slate-200">
                      {files && files.length > 0 ? (
                        <span className="text-indigo-400 font-bold">{files.length} file(s) selected</span>
                      ) : (
                        <span>Click to browse or drop PDF / DOCX resumes here</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Supports PyMuPDF and python-docx parsing
                    </p>
                  </label>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={uploading || !files}
                    className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-2 transition disabled:opacity-40 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    {uploading ? 'Extracting & Parsing...' : 'Parse & Add Candidates'}
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-slate-850 border border-slate-800">
                <span className="block text-slate-400 text-[10px] uppercase">Parser Method</span>
                <span className="font-semibold text-white font-mono">Regex + NLP</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-850 border border-slate-800">
                <span className="block text-slate-400 text-[10px] uppercase">Model Family</span>
                <span className="font-semibold text-white font-mono">Logistic Regression</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-850 border border-slate-800">
                <span className="block text-slate-400 text-[10px] uppercase">Explainability</span>
                <span className="font-semibold text-white font-mono">Kernel/Linear SHAP</span>
              </div>
            </div>
          </div>

          {/* Technical Workflow & Fairness Pipeline Breakdown */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-indigo-400" />
              Screening & Bias Auditing Decision Flow
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-850 border border-slate-800 space-y-1">
                <div className="text-indigo-400 font-semibold text-[11px] flex items-center gap-1">
                  <span>1. Parsing & Inputs</span>
                </div>
                <p className="text-slate-400 text-[10px] leading-normal">
                  PyMuPDF extracts raw text &rarr; Regex + NLP extracts Skills, Experience, and Career Gap Months/Count.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-850 border border-slate-800 space-y-1">
                <div className="text-indigo-400 font-semibold text-[11px] flex items-center gap-1">
                  <span>2. ML Inference</span>
                </div>
                <p className="text-slate-400 text-[10px] leading-normal">
                  StandardScaler normalizes features &rarr; Logistic Regression outputs qualification probability (0–100).
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-850 border border-slate-800 space-y-1">
                <div className="text-indigo-400 font-semibold text-[11px] flex items-center gap-1">
                  <span>3. Decision Rule</span>
                </div>
                <p className="text-slate-400 text-[10px] leading-normal">
                  If Score &ge; Threshold ({threshold}), candidate is <strong>Shortlisted</strong>, else <strong>Rejected</strong>.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-850 border border-slate-800 space-y-1">
                <div className="text-indigo-400 font-semibold text-[11px] flex items-center gap-1">
                  <span>4. SHAP & Audit</span>
                </div>
                <p className="text-slate-400 text-[10px] leading-normal">
                  SHAP attributions quantify the career-gap penalty &rarr; Fairness audit measures Disparate Impact Ratio.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
