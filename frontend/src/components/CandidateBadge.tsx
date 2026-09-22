import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';

interface CandidateBadgeProps {
  decision?: string;
  score?: number;
  careerGapMonths?: number;
}

export const CandidateBadge: React.FC<CandidateBadgeProps> = ({
  decision,
  score,
  careerGapMonths = 0,
}) => {
  const isShortlisted = decision?.toLowerCase() === 'shortlisted';

  return (
    <div className="flex items-center gap-2">
      {decision && (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
            isShortlisted
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
          }`}
        >
          {isShortlisted ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <XCircle className="w-3.5 h-3.5" />
          )}
          {isShortlisted ? 'Shortlisted' : 'Rejected'}
        </span>
      )}

      {typeof score === 'number' && (
        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
          {score.toFixed(1)}/100
        </span>
      )}

      {careerGapMonths > 0 ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <Clock className="w-3 h-3" />
          {careerGapMonths} mo gap
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
          No gap
        </span>
      )}
    </div>
  );
};
