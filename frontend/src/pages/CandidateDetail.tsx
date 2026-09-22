import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  BrainCircuit,
  GitFork,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  Layers
} from 'lucide-react';
import { getCandidate, getScreeningResults } from '../services/api';
import { Candidate, ScreeningResult } from '../types';
import { CareerTimeline } from '../components/CareerTimeline';
import { CandidateBadge } from '../components/CandidateBadge';

export const CandidateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [screeningResult, setScreeningResult] = useState<ScreeningResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [candData, allResults] = await Promise.all([
          getCandidate(Number(id)),
          getScreeningResults(),
        ]);
        setCandidate(candData);
        const match = allResults.find((r) => r.candidate_id === Number(id));
        setScreeningResult(match || null);
      } catch (err) {
        console.error('Failed to fetch candidate details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        Loading candidate profile...
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="p-8 text-center border border-slate-800 rounded-xl bg-slate-900/60 text-xs text-slate-400 space-y-3">
        <p>Candidate not found.</p>
        <Link to="/candidates" className="text-indigo-400 hover:underline">
          &larr; Back to Candidates
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/candidates"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Candidate Pool
        </Link>
      </div>

      {/* Header Profile Card */}
      <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-xl">
            {candidate.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">{candidate.name}</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                ID #{candidate.id}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-500" /> {candidate.email}
              </span>
              <span className="flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-slate-500" /> {candidate.education_level}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Briefcase className="w-3.5 h-3.5 text-slate-500" /> {candidate.total_experience_years} yrs exp
              </span>
            </div>
          </div>
        </div>

        {/* Screening Outcome Snapshot */}
        {screeningResult && (
          <div className="flex flex-col items-end gap-2 bg-slate-850 p-4 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400">AI Screening Outcome</span>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold font-mono text-white">
                {screeningResult.score.toFixed(1)}/100
              </span>
              <CandidateBadge
                decision={screeningResult.decision}
                careerGapMonths={candidate.career_gap_months}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Details & Responsible AI Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Parsed Details & Skills */}
        <div className="space-y-6">
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
            <h3 className="text-sm font-semibold text-white">Extracted Qualifications</h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Skills Match Score:</span>
                <span className="font-mono font-bold text-white">{candidate.skills_match_score}%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Total Experience:</span>
                <span className="font-mono text-slate-200">{candidate.total_experience_years} Years</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Audited Career Gap:</span>
                <span className={`font-mono font-bold ${candidate.career_gap_months > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                  {candidate.career_gap_months} Months ({candidate.career_gap_count} gaps)
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Education Degree:</span>
                <span className="text-slate-200">{candidate.education_level}</span>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-2">
                Identified Skills:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills && candidate.skills.length > 0 ? (
                  candidate.skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700"
                    >
                      {s.skill}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 italic text-xs">Standard parsed skill set</span>
                )}
              </div>
            </div>
          </div>

          {/* Responsible AI Actions Panel */}
          {screeningResult && (
            <div className="p-5 rounded-xl border border-indigo-500/20 bg-indigo-950/20 space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" /> Responsible AI Deep Dive
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Inspect how feature weights influenced this specific score or simulate counterfactual requirements to overturn the decision.
              </p>

              <div className="pt-2 space-y-2">
                <Link
                  to={`/explainability?result_id=${screeningResult.id}`}
                  className="w-full py-2.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition shadow-md shadow-indigo-600/20"
                >
                  <BrainCircuit className="w-4 h-4" /> View SHAP Feature Contributions
                </Link>
                <Link
                  to={`/counterfactual?result_id=${screeningResult.id}`}
                  className="w-full py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs flex items-center justify-center gap-2 transition"
                >
                  <GitFork className="w-4 h-4" /> Run Counterfactual (What-If)
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Work History Timeline */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" /> Employment History & Continuity Timeline
          </h3>
          <p className="text-xs text-slate-400">
            Chronological breakdown of past roles and automatic detection of employment intervals.
          </p>

          <div className="pt-3">
            <CareerTimeline
              experiences={candidate.experiences}
              careerGapMonths={candidate.career_gap_months}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
