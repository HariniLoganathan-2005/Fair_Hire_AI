import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  GitFork,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { getScreeningResults, getCounterfactual, generateCounterfactual } from '../services/api';
import { ScreeningResult, Counterfactual as CounterfactualType } from '../types';

export const Counterfactual: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const resultIdParam = searchParams.get('result_id');

  const [results, setResults] = useState<ScreeningResult[]>([]);
  const [selectedResultId, setSelectedResultId] = useState<number | null>(
    resultIdParam ? Number(resultIdParam) : null
  );
  const [counterfactual, setCounterfactual] = useState<CounterfactualType | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const data = await getScreeningResults();
        setResults(data);
        if (!selectedResultId && data.length > 0) {
          // Prefer a rejected candidate to demonstrate flipping decision
          const rejected = data.find(
            (r) => r.decision?.toUpperCase() === 'REJECTED'
          );
          setSelectedResultId(rejected ? rejected.id : data[0].id);
        }
      } catch (err) {
        console.error('Error fetching results:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  useEffect(() => {
    if (!selectedResultId) return;
    setCounterfactual(null);
    setError(null);

    const fetchCounterfactual = async () => {
      try {
        setGenerating(true);
        // Try to get cached CF first
        try {
          const cf = await getCounterfactual(selectedResultId);
          setCounterfactual(cf);
          return;
        } catch {
          // Not cached — generate it
        }
        const newCf = await generateCounterfactual(selectedResultId, 'shortlisted');
        setCounterfactual(newCf);
      } catch (genErr: any) {
        console.error('Failed to generate counterfactual:', genErr);
        setError('Counterfactual generation failed. Please try again.');
      } finally {
        setGenerating(false);
      }
    };
    fetchCounterfactual();
  }, [selectedResultId]);

  const selectedResult = results.find((r) => r.id === selectedResultId);
  const cand = selectedResult?.candidate;
  const isShortlisted = selectedResult?.decision?.toUpperCase() === 'SHORTLISTED';

  const getCategoryBadge = (category: string) => {
    if (category === 'LEGITIMATE') {
      return {
        label: 'Legitimate Action',
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      };
    }
    if (category === 'NOT RECOMMENDED') {
      return {
        label: 'NOT RECOMMENDED — Bias Artifact',
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
        cls: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      };
    }
    return {
      label: 'Model Sensitive',
      icon: <TrendingUp className="w-3.5 h-3.5" />,
      cls: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">
              Counterfactual Explanations ("What-If" Analysis)
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Actionable Recourse
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Identify the smallest realistic modifications to a candidate's features that would overturn a negative decision
          </p>
        </div>

        {/* Candidate Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 shrink-0">Candidate:</label>
          <select
            value={selectedResultId || ''}
            onChange={(e) => {
              const val = Number(e.target.value);
              setSelectedResultId(val);
              setSearchParams({ result_id: val.toString() });
            }}
            className="bg-slate-850 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 max-w-xs"
          >
            {results.map((r) => (
              <option key={r.id} value={r.id}>
                {r.candidate?.name || `Candidate #${r.candidate_id}`} — {r.decision?.toUpperCase()} ({r.score.toFixed(1)} pts)
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-xs text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading counterfactual simulator...
        </div>
      ) : selectedResult ? (
        <div className="space-y-6">
          {/* Decision Banner */}
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <GitFork className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">
                  Target Recourse for: <span className="text-purple-400">{cand?.name}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Original Score:{' '}
                  <strong className="font-mono text-white">
                    {counterfactual?.original_score?.toFixed(1) ?? selectedResult.score.toFixed(1)}/100
                  </strong>{' '}
                  &rarr; Threshold:{' '}
                  <strong className="font-mono text-white">
                    {(selectedResult.threshold_used * (selectedResult.threshold_used <= 1 ? 100 : 1)).toFixed(0)}/100
                  </strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  isShortlisted
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                }`}
              >
                Current: {selectedResult.decision?.toUpperCase()}
              </span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Target: SHORTLISTED (&ge; 0.5)
              </span>
            </div>
          </div>

          {/* Counterfactual Paths Table */}
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-white">Minimum Perturbations (Counterfactual Paths)</h3>
                <p className="text-xs text-slate-400">
                  Model-simulated attribute shifts and ethical recourse classification
                </p>
              </div>
              {generating && (
                <div className="flex items-center gap-2 text-[11px] font-mono text-purple-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching perturbations...</span>
                </div>
              )}
            </div>

            {error ? (
              <div className="p-8 text-center space-y-3">
                <p className="text-xs text-rose-400">{error}</p>
                <button
                  onClick={() => {
                    if (!selectedResultId) return;
                    setError(null);
                    setGenerating(true);
                    generateCounterfactual(selectedResultId, 'shortlisted')
                      .then(setCounterfactual)
                      .catch(() => setError('Counterfactual generation failed.'))
                      .finally(() => setGenerating(false));
                  }}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition"
                >
                  Retry
                </button>
              </div>
            ) : generating ? (
              <div className="h-40 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-7 h-7 text-purple-400 animate-spin" />
                <p className="text-xs text-slate-400">Running counterfactual perturbation search...</p>
              </div>
            ) : counterfactual?.changes && counterfactual.changes.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="text-[11px] text-slate-400 uppercase tracking-wider bg-slate-850 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Feature</th>
                      <th className="py-3 px-4">Current Value</th>
                      <th className="py-3 px-4">Counterfactual</th>
                      <th className="py-3 px-4">Score Impact</th>
                      <th className="py-3 px-4">New Decision</th>
                      <th className="py-3 px-4">Classification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {counterfactual.changes.map((change, idx) => {
                      const badge = getCategoryBadge(change.category);
                      const isNotRec = change.category === 'NOT RECOMMENDED';
                      const newDecisionUp = change.new_decision?.toUpperCase();
                      return (
                        <tr
                          key={idx}
                          className={`transition ${
                            isNotRec
                              ? 'bg-rose-950/10 hover:bg-rose-950/20'
                              : 'hover:bg-slate-850/50'
                          }`}
                        >
                          <td className="py-3.5 px-4 font-semibold text-white">
                            {change.feature}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-300">
                            {change.original_value.toFixed(1)}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                            {change.modified_value.toFixed(1)}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-mono text-indigo-300 text-[11px]">
                                {change.original_score.toFixed(1)} &rarr;{' '}
                                <span className={change.new_score > change.original_score ? 'text-emerald-400' : 'text-rose-400'}>
                                  {change.new_score.toFixed(1)}
                                </span>
                              </span>
                              <span
                                className={`text-[10px] font-mono font-bold ${
                                  change.score_change > 0 ? 'text-emerald-500' : 'text-rose-500'
                                }`}
                              >
                                {change.score_change > 0 ? '+' : ''}{change.score_change.toFixed(1)} pts
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                                newDecisionUp === 'SHORTLISTED'
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                              }`}
                            >
                              {newDecisionUp || '—'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.cls}`}
                            >
                              {badge.icon}
                              {badge.label}
                            </span>
                            {change.note && (
                              <p className="text-[10px] text-slate-500 mt-1 max-w-xs leading-tight">
                                {change.note}
                              </p>
                            )}
                            {change.action && (
                              <p className="text-[10px] text-slate-400 mt-1 italic">
                                Action: {change.action}
                              </p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : !generating ? (
              <div className="p-8 text-center border border-slate-800 rounded-xl bg-slate-850/50 text-xs">
                {isShortlisted ? (
                  <span className="text-emerald-400">
                    Candidate already meets the shortlist threshold ({selectedResult.score.toFixed(1)}/100). No perturbations required.
                  </span>
                ) : (
                  <span className="text-slate-400">
                    No significant counterfactual paths found for this candidate.
                  </span>
                )}
              </div>
            ) : null}

            {/* Ethical Disclaimer */}
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold uppercase tracking-wider text-[11px]">
                <ShieldAlert className="w-4 h-4" /> Ethical Constraint on Career-Gap Counterfactuals
              </div>
              <p className="leading-relaxed text-[11px] text-slate-300">
                <strong>Responsible AI Notice:</strong> If a counterfactual suggests "reducing career gap duration"
                to overturn a rejection, this is classified as{' '}
                <strong>NOT RECOMMENDED / BIAS ARTIFACT</strong>. A candidate cannot alter past life
                circumstances (parental leave, caregiving, health recovery). When an AI requires erasing a
                career gap rather than upgrading skills to pass, the organization must route the profile to{' '}
                <strong>Human Review</strong> rather than penalizing the applicant.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center border border-slate-800 rounded-xl bg-slate-900/60 text-xs text-slate-400">
          No candidates available for counterfactual exploration.
        </div>
      )}
    </div>
  );
};
