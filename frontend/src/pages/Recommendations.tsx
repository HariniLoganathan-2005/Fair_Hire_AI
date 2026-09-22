import React from 'react';
import {
  Lightbulb,
  CheckCircle2,
  ShieldCheck,
  Scale,
  Users,
  BrainCircuit,
  Sliders,
  Sparkles
} from 'lucide-react';

export const Recommendations: React.FC = () => {
  const recommendations = [
    {
      category: '1. Feature Engineering & Model Design',
      icon: BrainCircuit,
      color: 'text-indigo-400 border-indigo-500/30 bg-indigo-950/20',
      points: [
        'Decouple total active experience from raw calendar gaps. Total months worked is a valid competency metric; calendar interruptions are not.',
        'Prioritize validated skill match and recent portfolio evidence over strict chronological continuity.',
        'Avoid negative coefficient weighting on parental, medical, or caregiving career breaks.',
      ],
    },
    {
      category: '2. Fairness Auditing & Metric Thresholds',
      icon: Scale,
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20',
      points: [
        'Enforce continuous monitoring of EEOC Four-Fifths Rule (Disparate Impact Ratio >= 0.80) across all employment gap cohorts.',
        'Regularly run controlled sensitivity experiments (e.g. testing score shifts when gap feature is set to zero).',
        'Audit demographic parity difference to ensure disparity remains within +/- 10% bounds.',
      ],
    },
    {
      category: '3. Explainability & Actionable Recourse',
      icon: Lightbulb,
      color: 'text-amber-400 border-amber-500/30 bg-amber-950/20',
      points: [
        'Provide transparent SHAP explanations to candidates and talent acquisition teams to justify every recommendation.',
        'Ensure counterfactual recourse focuses exclusively on actionable criteria (e.g. skills, certifications) rather than asking candidates to erase history.',
        'Flag any counterfactual requiring gap reduction as an indicator of model bias.',
      ],
    },
    {
      category: '4. Human-in-the-Loop Governance',
      icon: Users,
      color: 'text-purple-400 border-purple-500/30 bg-purple-950/20',
      points: [
        'Automatically route borderline candidates (within 10-15 points of threshold) to human reviewers.',
        'Mandate human review whenever a candidate possesses high skill alignment (>=60%) but was rejected with a career gap.',
        'Maintain a tamper-evident audit log of all human override decisions with explicit justifications.',
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white">Responsible AI Policy & Technical Recommendations</h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Governance Framework
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Actionable technical, organizational, and regulatory guidelines for deploying fair and transparent AI resume screening systems
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recommendations.map((rec, idx) => {
          const Icon = rec.icon;
          return (
            <div key={idx} className={`p-6 rounded-xl border backdrop-blur-md space-y-4 ${rec.color}`}>
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-sm text-white">{rec.category}</h3>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                {rec.points.map((pt, pIdx) => (
                  <li key={pIdx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};
