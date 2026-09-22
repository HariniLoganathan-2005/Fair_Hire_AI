import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  UploadCloud,
  Users,
  BrainCircuit,
  Scale,
  GitFork,
  UserCheck,
  FileSpreadsheet,
  FileText,
  Database,
  Lightbulb,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  onLoadDemo: () => void;
  loadingDemo: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLoadDemo, loadingDemo }) => {
  const navGroups = [
    {
      label: 'OVERVIEW & JOBS',
      items: [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/jobs', label: 'Job Postings', icon: Briefcase },
        { to: '/screening', label: 'Screening & Upload', icon: UploadCloud },
        { to: '/candidates', label: 'Candidates List', icon: Users },
      ]
    },
    {
      label: 'RESPONSIBLE AI AUDIT',
      items: [
        { to: '/explainability', label: 'SHAP Explainability', icon: BrainCircuit },
        { to: '/fairness', label: 'Fairness Audit', icon: Scale },
        { to: '/counterfactual', label: 'Counterfactuals (What-If)', icon: GitFork },
        { to: '/human-review', label: 'Human Review Queue', icon: UserCheck },
      ]
    },
    {
      label: 'DOCUMENTATION & AUDITING',
      items: [
        { to: '/reports', label: 'Audit Reports & Export', icon: FileSpreadsheet },
        { to: '/model-card', label: 'Model Card', icon: FileText },
        { to: '/dataset-card', label: 'Dataset Card', icon: Database },
        { to: '/recommendations', label: 'RAI Recommendations', icon: Lightbulb },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-bold text-lg text-white tracking-tight">FairHire AI</h1>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-semibold border border-indigo-500/30">RAI</span>
          </div>
          <p className="text-[11px] text-slate-400">Career-Gap Bias Auditor</p>
        </div>
      </div>

      {/* Demo Action Button for Viva/Demonstration */}
      <div className="p-3">
        <button
          onClick={onLoadDemo}
          disabled={loadingDemo}
          className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 transition duration-150 disabled:opacity-50 cursor-pointer"
        >
          <Sparkles className={`w-4 h-4 ${loadingDemo ? 'animate-spin' : 'text-yellow-300'}`} />
          {loadingDemo ? 'Loading Scenario...' : 'Load Academic Demo (5 Profiles)'}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
        {navGroups.map((group, idx) => (
          <div key={idx}>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / Viva Status */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/80">
        <div className="p-2.5 rounded-lg bg-slate-850 border border-slate-800 text-[11px] text-slate-400 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Model Active
            </span>
            <span className="font-mono text-[10px] text-slate-400">LogisticReg v1.0</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Fairlearn & SHAP Auditing Framework
          </p>
        </div>
      </div>
    </aside>
  );
};
