import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, HelpCircle } from 'lucide-react';

interface FairnessMetricCardProps {
  title: string;
  value: string | number;
  thresholdRule: string;
  status: 'fair' | 'borderline' | 'disparate';
  description: string;
}

export const FairnessMetricCard: React.FC<FairnessMetricCardProps> = ({
  title,
  value,
  thresholdRule,
  status,
  description,
}) => {
  const statusConfig = {
    fair: {
      badge: 'FAIR / COMPLIANT',
      badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      icon: ShieldCheck,
      iconColor: 'text-emerald-400',
      cardBorder: 'border-emerald-500/20 bg-emerald-950/10',
    },
    borderline: {
      badge: 'BORDERLINE',
      badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      cardBorder: 'border-amber-500/20 bg-amber-950/10',
    },
    disparate: {
      badge: 'DISPARATE / BIASED',
      badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      icon: AlertOctagon,
      iconColor: 'text-rose-400',
      cardBorder: 'border-rose-500/20 bg-rose-950/10',
    },
  };

  const current = statusConfig[status] || statusConfig.borderline;
  const Icon = current.icon;

  return (
    <div className={`p-5 rounded-xl border backdrop-blur-md transition-all ${current.cardBorder}`}>
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium text-xs text-slate-300 uppercase tracking-wider">{title}</h4>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white">{value}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase border ${current.badgeClass}`}>
            <Icon className="w-3 h-3" />
            {current.badge}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Standard: {thresholdRule}</span>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
};
