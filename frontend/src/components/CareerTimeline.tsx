import React from 'react';
import { CandidateExperience } from '../types';
import { Briefcase, AlertCircle, Calendar } from 'lucide-react';

interface CareerTimelineProps {
  experiences?: CandidateExperience[];
  careerGapMonths?: number;
}

export const CareerTimeline: React.FC<CareerTimelineProps> = ({
  experiences = [],
  careerGapMonths = 0,
}) => {
  if (!experiences || experiences.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-800 text-xs text-slate-400">
        No structured experience history available for timeline rendering.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {careerGapMonths > 0 && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Detected Career Gap: </span>
            <span>Total uninterrupted employment gap of approx {careerGapMonths} months.</span>
          </div>
        </div>
      )}

      <div className="relative pl-6 border-l-2 border-indigo-500/30 space-y-6">
        {experiences.map((exp, idx) => (
          <div key={idx} className="relative group">
            {/* Timeline Dot */}
            <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-indigo-400 flex items-center justify-center group-hover:scale-125 transition-transform">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm text-white flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                  {exp.title}
                </h4>
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {exp.start_date} – {exp.end_date || 'Present'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">{exp.company}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {exp.duration_months} months
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
