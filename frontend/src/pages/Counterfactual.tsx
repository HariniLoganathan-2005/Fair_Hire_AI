import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  GitFork,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  HelpCircle,
  Lightbulb,
  Info
} from 'lucide-react';
import { getScreeningResults, getCounterfactual, generateCounterfactual } from '../services/api';
import { ScreeningResult, Counterfactual as CounterfactualType } from '../types';
import { CandidateBadge } from '../components/CandidateBadge';

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

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const data = await getScreeningResults();
        setResults(data);
        if (!selectedResultId && data.length > 0) {
          // Prefer a rejected candidate to demonstrate flipping the decision
          const rejected = data.find((r) => r.decision === 'rejected');
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

    const fetchCounterfactual = async () => {
      try {
        setGenerating(true);
        const cf = await getCounterfactual(selectedResultId);
        setCounterfactual(cf);
      } catch (err) {
        try {
          const newCf = await generateCounterfactual(selectedResultId, 'shortlisted');
          setCounterfactual(newCf);
        } catch (genErr) {
          console.error('Failed to generate counterfactual:', genErr);
        }
      } finally {
        setGenerating(false);
      }
    };
    fetchCounterfactual();
  }, [selectedResultId]);

  const selectedResult = results.find((r) => r.id === selectedResultId);
  const cand = selectedResult?.candidate;

  const classificationBadges = {
    LEGITIMATE: {
      label: 'Legitimate Action (Skill/Cert Upgrading)',
      class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    MODEL_SENSITIVE: {
      label: 'Model Sensitivity (Small Experience Shift)',
      class: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    },
    NOT_RECOMMENDED: {
      label: 'Ethically Unsound / Bias Signal (Erase Gap)',
      class: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">Counterfactual Explanations ("What-If" Analysis)</h2>
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
          <label className="text-xs text-slate-400">Candidate:</label>
          <select
            value={selectedResultId || ''}
            onChange={(e) => {
              const val = Number(e.target.value);
              setSelectedResultId(val);
              setSearchParams({ result_id: val.toString() });
            }}
            className="bg-slate-850 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            {results.map((r) => (
              <option key={r.id} value={r.id}>
                {r.candidate?.name || `Candidate #${r.candidate_id}`} — {r.decision.toUpperCase()} ({r.score.toFixed(1)} pts)
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-xs text-slate-400">
          Loading counterfactual simulator...
        </div>
      ) : selectedResult ? (
        <div className="space-y-6">
          {/* Top Banner: Current Decision vs Target */}
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
                  Original Score: <strong className="font-mono text-white">{selectedResult.score.toFixed(1)}/100</strong> &rarr; Threshold: <strong className="font-mono text-white">{selectedResult.threshold_used}/100</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedResult.decision === 'shortlisted' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                Current: {selectedResult.decision.toUpperCase()}
              </span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Target: SHORTLISTED (&ge; {selectedResult.threshold_used})
              </span>
            </div>
          </div>

          {/* Counterfactual Changes Table */}
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-white">Minimum Perturbations (Counterfactual Paths)</h3>
                <p className="text-xs text-slate-400">
                  Model-simulated attribute shifts and ethical recourse classification
                </p>
              </div>
              {generating && (
                <span className="text-[10px] font-mono text-purple-400 animate-pulse">
                  Searching perturbations...
                </span>
              )}
            </div>

            {counterfactual?.changes_required && counterfactual.changes_required.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[11px] text-slate-400 uppercase tracking-wider bg-slate-850 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Feature Attribute</th>
                      <th className="py-3 px-4">Current Value</th>
                      <th className="py-3 px-4">Required Counterfactual</th>
                      <th className="py-3 px-4">Classification & Category</th>
                      <th className="py-3 px-4">Responsible AI Justification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {counterfactual.changes_required.map((change, idx) => {
                      const badge = classificationBadges[change.classification] || classificationBadges.LEGITIMATE;
                      return (
                        <tr key={idx} className="hover:bg-slate-850/50 transition">
                          <td className="py-3.5 px-4 font-semibold text-white capitalize">
                            {change.feature.replace(/_/g, ' ')}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-300">
                            {typeof change.current_value === 'number'
                              ? change.current_value.toFixed(1)
                              : String(change.current_value)}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                            {typeof change.required_value === 'number'
                              ? change.required_value.toFixed(1)
                              : String(change.required_value)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.class}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-300 text-[11px] leading-relaxed max-w-sm">
                            {change.explanation}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center border border-slate-800 rounded-xl bg-slate-850/50 text-xs text-slate-400">
                {selectedResult.decision === 'shortlisted' ? (
                  <span className="text-emerald-400">
                    Candidate already meets the shortlist threshold ({selectedResult.score.toFixed(1)}/100). No perturbations required.
                  </span>
                ) : (
                  <span>Generating counterfactual paths...</span>
                )}
              </div>
            )}

            {/* Ethical Disclaimer Callout */}
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold uppercase tracking-wider text-[11px]">
                <ShieldAlert className="w-4 h-4" /> Ethical Constraint on Career-Gap Counterfactuals
              </div>
              <p className="leading-relaxed text-[11px] text-slate-300">
                <strong>Responsible AI Notice:</strong> If a counterfactual suggests "reducing career gap duration" to overturn a rejection, this is classified as <strong>NOT RECOMMENDED / BIAS ARTIFACT</strong>. A candidate cannot alter past life circumstances (parental leave, caregiving, health recovery). When an AI requires erasing a career gap rather than upgrading skills to pass, the organization must route the profile to <strong>Human Review</strong> rather than penalizing the applicant.
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
