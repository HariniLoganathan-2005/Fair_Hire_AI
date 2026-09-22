import React from 'react';
import { AlertCircle, GraduationCap, ShieldAlert } from 'lucide-react';

interface DemoBannerProps {
  isDemo?: boolean;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ isDemo = true }) => {
  if (!isDemo) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-slate-300 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <GraduationCap className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong className="text-amber-400 font-semibold uppercase tracking-wider">Academic Demonstration:</strong> All models, metrics, and SHAP analyses run on genuine mathematical pipelines with synthetic training data. No real hiring decisions are made.
        </span>
      </div>
      <div className="hidden sm:flex items-center gap-2">
        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-semibold border border-amber-500/30">
          DEMO / ILLUSTRATIVE
        </span>
      </div>
    </div>
  );
};
