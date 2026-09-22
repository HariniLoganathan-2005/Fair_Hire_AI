import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'emerald' | 'amber' | 'rose';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
}) => {
  const variantStyles = {
    default: 'border-slate-800 bg-slate-900/60',
    primary: 'border-indigo-500/30 bg-indigo-950/20 glow-primary',
    emerald: 'border-emerald-500/30 bg-emerald-950/20 glow-emerald',
    amber: 'border-amber-500/30 bg-amber-950/20',
    rose: 'border-rose-500/30 bg-rose-950/20 glow-rose',
  };

  const iconColors = {
    default: 'text-slate-400 bg-slate-800',
    primary: 'text-indigo-400 bg-indigo-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    rose: 'text-rose-400 bg-rose-500/10',
  };

  return (
    <div className={`p-5 rounded-xl border backdrop-blur-md transition-all duration-200 ${variantStyles[variant]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 tracking-wide uppercase">{title}</span>
        <div className={`p-2 rounded-lg ${iconColors[variant]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-white font-mono">{value}</span>
        {trend && (
          <span className={`text-xs font-semibold ${trend.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend.value}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
};
