import React, { useEffect, useState } from 'react';
import {
  FileText,
  BrainCircuit,
  AlertTriangle,
  ShieldCheck,
  Code,
  Layers,
  Sparkles
} from 'lucide-react';
import { getModelCard } from '../services/api';
import { ModelCardData } from '../types';

export const ModelCard: React.FC = () => {
  const [modelCard, setModelCard] = useState<ModelCardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCard = async () => {
      try {
        setLoading(true);
        const data = await getModelCard();
        setModelCard(data);
      } catch (err) {
        console.error('Error loading model card:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCard();
  }, []);

  const fallbackMetrics = {
    accuracy: 0.875,
    precision: 0.846,
    recall: 0.957,
    f1_score: 0.898,
  };

  const metrics = modelCard?.metrics || fallbackMetrics;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white">Model Card: FairHire AI Resume Screener</h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Mitchell et al. Format
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Standardized documentation detailing model architecture, performance metrics, training data, and known limitations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 text-center">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Accuracy</span>
          <span className="text-2xl font-bold font-mono text-white">{(metrics.accuracy * 100).toFixed(1)}%</span>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 text-center">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Precision</span>
          <span className="text-2xl font-bold font-mono text-emerald-400">{(metrics.precision * 100).toFixed(1)}%</span>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 text-center">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Recall</span>
          <span className="text-2xl font-bold font-mono text-indigo-400">{(metrics.recall * 100).toFixed(1)}%</span>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 text-center">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">F1-Score</span>
          <span className="text-2xl font-bold font-mono text-purple-400">{(metrics.f1_score * 100).toFixed(1)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Overview & Feature Weights */}
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-indigo-400" /> Architecture & Feature Weights
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Model Algorithm:</span>
              <span className="font-mono text-white font-semibold">Standardized Logistic Regression (L2)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Model Version:</span>
              <span className="font-mono text-slate-300">v1.0.0 (Academic Demonstration)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Decision Threshold:</span>
              <span className="font-mono text-slate-300">Default 0.50 (Configurable)</span>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">
              Learned Feature Coefficients ($w_i$):
            </span>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between p-2 rounded bg-slate-850">
                <span className="text-slate-300">experience_years:</span>
                <span className="text-emerald-400 font-bold">+2.1245</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-850">
                <span className="text-slate-300">skills_match:</span>
                <span className="text-emerald-400 font-bold">+0.8005</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-850">
                <span className="text-slate-300">education_match:</span>
                <span className="text-emerald-400 font-bold">+0.5848</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-850">
                <span className="text-slate-300">certification_count:</span>
                <span className="text-emerald-400 font-bold">+0.5729</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-850">
                <span className="text-slate-300">project_count:</span>
                <span className="text-emerald-400 font-bold">+0.1828</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-850 border border-amber-500/20">
                <span className="text-amber-300">career_gap_months (Audited Bias Feature):</span>
                <span className="text-rose-400 font-bold">-0.1254</span>
              </div>
            </div>
          </div>
        </div>

        {/* Limitations & RAI Notes */}
        <div className="space-y-4">
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Known Limitations & Out-of-Scope Use
            </h3>
            <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside leading-relaxed">
              <li>Trained on synthetic candidate distributions for academic transparency.</li>
              <li>Should <strong>NEVER</strong> be deployed for unassisted real-world hiring without human review.</li>
              <li>Employment gap features create an inherent penalty on caregiving and health sabbaticals.</li>
              <li>Protected attributes (gender, age, race) are strictly prohibited as model input features.</li>
            </ul>
          </div>

          <div className="p-6 rounded-xl border border-indigo-500/20 bg-indigo-950/20 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" /> Responsible AI Governance Mechanisms
            </h3>
            <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside leading-relaxed">
              <li><strong>SHAP Attributions:</strong> Individual score derivations accessible to candidates and auditors.</li>
              <li><strong>Counterfactual Recourse:</strong> Provides actionable paths to qualification without requiring gap erasure.</li>
              <li><strong>Fairness Auditing:</strong> Continuous 4/5ths rule disparate impact evaluation using Fairlearn.</li>
              <li><strong>Mandatory Human Oversight:</strong> Automatic queuing of borderline scores and gap-impacted profiles.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
