import React from 'react';
import { Database, FileSpreadsheet, AlertCircle, Info, Sparkles, Layers } from 'lucide-react';

export const DatasetCard: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white">Dataset Card: FairHire Synthetic Resume Benchmark</h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Gebru et al. Datasheets for Datasets
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Transparency documentation detailing dataset provenance, feature distributions, curation methodology, and ethical labeling
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 text-center">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Sample Count</span>
          <span className="text-2xl font-bold font-mono text-white">200 Candidates</span>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 text-center">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Career Gap Ratio</span>
          <span className="text-2xl font-bold font-mono text-amber-400">44.0% with gaps</span>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 text-center">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Dataset Source</span>
          <span className="text-2xl font-bold font-mono text-indigo-400">Synthetic / Academic</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dataset Provenance */}
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" /> Dataset Motivation & Provenance
          </h3>

          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <p>
              <strong>Purpose:</strong> Created specifically for researching algorithmic bias against candidates with career breaks in machine learning-based resume screening systems.
            </p>
            <p>
              <strong>Synthesis Methodology:</strong> Generated via parametric distributions with controlled statistical dependencies between skill scores, work histories, and career interruptions.
            </p>
            <p>
              <strong>Demographic Attributes:</strong> Protected attributes (gender proxy, age bracket) are included strictly for <em>offline fairness auditing</em> and are never supplied during model training or runtime inference.
            </p>
          </div>
        </div>

        {/* Feature Schema */}
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" /> Feature Schema & Semantics
          </h3>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-850 flex justify-between">
              <div>
                <strong className="text-white">skills_match (0–100%)</strong>
                <p className="text-[11px] text-slate-400">Jaccard / semantic similarity against job requirements</p>
              </div>
              <span className="text-slate-500 font-mono text-[10px]">Continuous</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-850 flex justify-between">
              <div>
                <strong className="text-white">experience_years (0–20 yrs)</strong>
                <p className="text-[11px] text-slate-400">Sum of verified active employment durations</p>
              </div>
              <span className="text-slate-500 font-mono text-[10px]">Continuous</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-850 flex justify-between border border-amber-500/20">
              <div>
                <strong className="text-amber-300">career_gap_months (0–36 mo)</strong>
                <p className="text-[11px] text-slate-400">Longest single uninterrupted gap between roles</p>
              </div>
              <span className="text-amber-400 font-mono text-[10px]">Audited Target</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
