import React, { useEffect, useState } from 'react';
import {
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Sparkles,
  ShieldCheck,
  Send
} from 'lucide-react';
import { getScreeningResults, getReviews, submitReview } from '../services/api';
import { ScreeningResult, HumanReview as HumanReviewType } from '../types';

export const HumanReview: React.FC = () => {
  const [flaggedResults, setFlaggedResults] = useState<ScreeningResult[]>([]);
  const [reviews, setReviews] = useState<HumanReviewType[]>([]);
  const [selectedResult, setSelectedResult] = useState<ScreeningResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Review form states
  const [reviewerName, setReviewerName] = useState('Senior HR Auditor');
  const [overrideDecision, setOverrideDecision] = useState<'approved' | 'rejected' | 're-assess'>('approved');
  const [justification, setJustification] = useState('Skills match is exceptionally high (>=75%); career gap was taken for caregiving/upskilling and should not preclude interview.');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [allResults, allReviews] = await Promise.all([
        getScreeningResults(),
        getReviews(),
      ]);

      // Smart Flagging: Borderline scores (within 10 pts of threshold) OR has career gap with skills >= 60%
      const reviewedIds = new Set(allReviews.map((r) => r.screening_result_id));
      const flagged = allResults.filter((r) => {
        const hasGap = (r.candidate?.career_gap_months || 0) > 0;
        const isBorderline = Math.abs(r.score - (r.threshold_used * 100)) <= 20;
        const skillsMatch = r.features_used?.skills_match ?? (r.candidate as any)?.skills_match_score ?? (r.candidate?.skills?.length ? Math.min(100, r.candidate.skills.length * 15) : 0);
        const isHighSkillRejected = r.decision?.toLowerCase() === 'rejected' && skillsMatch >= 50;
        return (hasGap || isBorderline || isHighSkillRejected) && !reviewedIds.has(r.id);
      });

      setFlaggedResults(flagged);
      setReviews(allReviews);
      if (flagged.length > 0 && !selectedResult) {
        setSelectedResult(flagged[0]);
      }
    } catch (err) {
      console.error('Error fetching review data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResult) return;

    try {
      setSubmitting(true);
      await submitReview({
        screening_result_id: selectedResult.id,
        reviewer_name: reviewerName,
        override_decision: overrideDecision,
        notes: justification,
        justification_category: 'Career Gap Mitigation & Skill Verification',
      });

      setStatusMsg(`Human review submitted for ${selectedResult.candidate?.name}!`);
      setTimeout(() => setStatusMsg(null), 3000);
      setSelectedResult(null);
      fetchData();
    } catch (err) {
      console.error('Failed to submit review:', err);
      setStatusMsg('Error submitting review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">Human-in-the-Loop Oversight Queue</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Responsible AI Governance
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Audit borderline candidates and mitigate potential career-break penalties with accountable human intervention
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{statusMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="h-64 flex items-center justify-center text-xs text-slate-400">
          Loading human review queue...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Flagged Candidate Queue */}
          <div className="space-y-4">
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Flagged for Review
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                  {flaggedResults.length} pending
                </span>
              </div>

              <div className="space-y-2">
                {flaggedResults.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-800 rounded-lg text-xs text-slate-400">
                    No pending flagged candidates! All reviewed or within safe margins.
                  </div>
                ) : (
                  flaggedResults.map((r) => {
                    const isSelected = selectedResult?.id === r.id;
                    const cand = r.candidate;
                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedResult(r)}
                        className={`p-3 rounded-lg border transition cursor-pointer text-xs space-y-1.5 ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-950/30 glow-primary'
                            : 'border-slate-800 bg-slate-850 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">{cand?.name}</span>
                          <span className="font-mono text-[10px] font-bold text-slate-400">
                            {r.score.toFixed(1)} pts
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span>{cand?.total_experience_years} yrs exp</span>
                          <span>•</span>
                          <span>{cand?.skills_match_score}% skill match</span>
                        </div>
                        {(cand?.career_gap_months || 0) > 0 && (
                          <div className="text-[10px] text-amber-300 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" /> {cand?.career_gap_months} mo career gap
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Center & Right Column: Interactive Human Decision Form */}
          <div className="lg:col-span-2 space-y-6">
            {selectedResult ? (
              <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Reviewing: {selectedResult.candidate?.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      AI Screening Result: <strong className="text-rose-400 uppercase">{selectedResult.decision}</strong> ({selectedResult.score.toFixed(1)}/100 points)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">Identified Gap</span>
                    <span className="font-mono font-bold text-amber-400 text-xs">
                      {selectedResult.candidate?.career_gap_months || 0} months
                    </span>
                  </div>
                </div>

                {/* Candidate qualifications summary */}
                <div className="grid grid-cols-3 gap-3 text-xs bg-slate-850 p-3.5 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Skills Match:</span>
                    <span className="font-mono font-bold text-white">
                      {Number(selectedResult.features_used?.skills_match ?? (selectedResult.candidate as any)?.skills_match_score ?? 0).toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Active Experience:</span>
                    <span className="font-mono font-bold text-white">{selectedResult.candidate?.total_experience_years} Years</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Education Degree:</span>
                    <span className="font-medium text-white">{selectedResult.candidate?.education_level}</span>
                  </div>
                </div>

                {/* Review Form */}
                <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">Auditor / Reviewer Name</label>
                    <input
                      type="text"
                      required
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">Override / Final Governance Decision</label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setOverrideDecision('approved')}
                        className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                          overrideDecision === 'approved'
                            ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                            : 'border-slate-800 bg-slate-850 text-slate-400 hover:text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Approve (Shortlist)
                      </button>
                      <button
                        type="button"
                        onClick={() => setOverrideDecision('rejected')}
                        className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                          overrideDecision === 'rejected'
                            ? 'border-rose-500 bg-rose-950/40 text-rose-300'
                            : 'border-slate-800 bg-slate-850 text-slate-400 hover:text-white'
                        }`}
                      >
                        <XCircle className="w-4 h-4 text-rose-400" />
                        Uphold Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => setOverrideDecision('re-assess')}
                        className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                          overrideDecision === 're-assess'
                            ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300'
                            : 'border-slate-800 bg-slate-850 text-slate-400 hover:text-white'
                        }`}
                      >
                        <RotateCcw className="w-4 h-4 text-indigo-400" />
                        Re-Assess Skills
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">
                      Auditing Justification & Notes (Recorded in Compliance Log)
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      placeholder="Explain why this decision is being modified or upheld..."
                      className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      {submitting ? 'Recording Audit...' : 'Log Human Decision'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="p-12 text-center border border-slate-800 rounded-xl bg-slate-900/60 text-xs text-slate-400">
                Select a candidate from the left to begin human review.
              </div>
            )}

            {/* Past Completed Reviews Table */}
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Completed Human Auditing Log ({reviews.length})
              </h4>
              {reviews.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No historical human reviews recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-[10px] text-slate-400 uppercase bg-slate-850">
                      <tr>
                        <th className="py-2.5 px-3">Auditor</th>
                        <th className="py-2.5 px-3">Candidate Result</th>
                        <th className="py-2.5 px-3">Decision</th>
                        <th className="py-2.5 px-3">Justification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {reviews.map((rev) => (
                        <tr key={rev.id}>
                          <td className="py-2.5 px-3 font-medium text-white">{rev.reviewer_name}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-300">Result #{rev.screening_result_id}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 uppercase">
                              {rev.override_decision}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 text-[11px] max-w-xs truncate">{rev.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
