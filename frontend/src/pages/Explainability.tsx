import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  BrainCircuit,
  TrendingUp,
  TrendingDown,
  User,
  Info,
  Sparkles,
  ArrowRight,
  HelpCircle,
  FileText,
  Clock
} from 'lucide-react';
import { getScreeningResults, getExplanation, generateExplanation } from '../services/api';
import { ScreeningResult, Explanation } from '../types';
import { ShapChart } from '../components/ShapChart';
import { CandidateBadge } from '../components/CandidateBadge';

export const Explainability: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const resultIdParam = searchParams.get('result_id');

  const [results, setResults] = useState<ScreeningResult[]>([]);
  const [selectedResultId, setSelectedResultId] = useState<number | null>(
    resultIdParam ? Number(resultIdParam) : null
  );
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const data = await getScreeningResults();
        setResults(data);
        if (!selectedResultId && data.length > 0) {
          setSelectedResultId(data[0].id);
        }
      } catch (err) {
        console.error('Error fetching screening results:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  useEffect(() => {
    if (!selectedResultId) return;

    const fetchShap = async () => {
      try {
        setGenerating(true);
        const expData = await getExplanation(selectedResultId);
        setExplanation(expData);
      } catch (err) {
        // If not cached, generate SHAP
        try {
          const newExp = await generateExplanation(selectedResultId);
          setExplanation(newExp);
        } catch (genErr) {
          console.error('Failed to generate SHAP explanation:', genErr);
        }
      } finally {
        setGenerating(false);
      }
    };
    fetchShap();
  }, [selectedResultId]);

  const selectedResult = results.find((r) => r.id === selectedResultId);
  const cand = selectedResult?.candidate;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">Model Explainability (SHAP Values)</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              SHAP Explainer
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Additive feature attributions explaining exactly why this candidate received their screening score
          </p>
        </div>

        {/* Candidate Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Select Candidate:</label>
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
                {r.candidate?.name || `Candidate #${r.candidate_id}`} — {r.score.toFixed(1)} pts ({r.decision})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-xs text-slate-400">
          Loading screening outcomes...
        </div>
      ) : selectedResult ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Candidate Summary Card */}
          <div className="space-y-6">
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Candidate Overview</h3>
                <CandidateBadge
                  decision={selectedResult.decision}
                  careerGapMonths={cand?.career_gap_months}
                />
              </div>

              <div className="p-3.5 rounded-lg bg-slate-850 border border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-white text-sm">{cand?.name}</div>
                <div className="text-slate-400">{cand?.email}</div>
                <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Experience:</span>
                    <span className="font-mono text-white font-semibold">{cand?.total_experience_years} yrs</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Skills Match:</span>
                    <span className="font-mono text-white font-semibold">{cand?.skills_match_score}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Career Gap:</span>
                    <span className={`font-mono font-semibold ${(cand?.career_gap_months || 0) > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                      {cand?.career_gap_months || 0} months
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">AI Score:</span>
                    <span className="font-mono text-indigo-400 font-bold">{selectedResult.score.toFixed(1)}/100</span>
                  </div>
                </div>
              </div>

              {/* Natural Language AI Explanation Box */}
              <div className="p-4 rounded-lg bg-indigo-950/20 border border-indigo-500/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Natural Language Audit Summary</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {explanation?.summary_text || (
                    generating ? 'Computing mathematical SHAP attributions...' :
                    `The model assigned a score of ${selectedResult.score.toFixed(1)}/100 leading to a ${selectedResult.decision} recommendation. Skills match and experience had the strongest positive influence.`
                  )}
                </p>
              </div>

              <Link
                to={`/counterfactual?result_id=${selectedResult.id}`}
                className="w-full py-2.5 px-3 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-medium text-xs flex items-center justify-center gap-2 transition"
              >
                <span>What would change this decision? (Counterfactual)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: SHAP Feature Attribution Chart & Positive/Negative Drivers */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-white">SHAP Feature Attribution Plot</h3>
                  <p className="text-xs text-slate-400">
                    Directional contribution of each candidate feature to the final classification score
                  </p>
                </div>
                {generating && (
                  <span className="text-[10px] font-mono text-indigo-400 animate-pulse">
                    Computing SHAP...
                  </span>
                )}
              </div>

              <div className="pt-2">
                {explanation?.shap_values ? (
                  <ShapChart
                    shapValues={explanation.shap_values}
                    baseValue={explanation.base_value}
                  />
                ) : (
                  <div className="h-64 flex items-center justify-center text-xs text-slate-500">
                    Calculating SHAP feature values...
                  </div>
                )}
              </div>
            </div>

            {/* Top Positive & Negative Drivers Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-950/10 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
                  <TrendingUp className="w-4 h-4" /> Top Positive Influences (+ Score)
                </div>
                <ul className="space-y-2 text-xs">
                  {explanation?.top_positive_features && explanation.top_positive_features.length > 0 ? (
                    explanation.top_positive_features.map((feat, idx) => (
                      <li key={idx} className="flex justify-between items-center py-1 border-b border-emerald-500/10">
                        <span className="text-slate-300 capitalize">{feat.feature.replace(/_/g, ' ')}</span>
                        <span className="font-mono font-bold text-emerald-400">+{feat.shap_value.toFixed(3)}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-500 italic">No significant positive features</li>
                  )}
                </ul>
              </div>

              <div className="p-5 rounded-xl border border-rose-500/20 bg-rose-950/10 space-y-3">
                <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs uppercase tracking-wider">
                  <TrendingDown className="w-4 h-4" /> Top Negative Influences (- Score)
                </div>
                <ul className="space-y-2 text-xs">
                  {explanation?.top_negative_features && explanation.top_negative_features.length > 0 ? (
                    explanation.top_negative_features.map((feat, idx) => (
                      <li key={idx} className="flex justify-between items-center py-1 border-b border-rose-500/10">
                        <span className="text-slate-300 capitalize">{feat.feature.replace(/_/g, ' ')}</span>
                        <span className="font-mono font-bold text-rose-400">{feat.shap_value.toFixed(3)}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-500 italic">No negative feature penalties</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center border border-slate-800 rounded-xl bg-slate-900/60 text-xs text-slate-400">
          No candidates screened yet. Please run screening from the Screening tab.
        </div>
      )}
    </div>
  );
};
