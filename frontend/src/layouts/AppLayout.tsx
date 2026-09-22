import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { DemoBanner } from '../components/DemoBanner';
import { loadDemoData } from '../services/api';
import { Bell, Sparkles, Shield, HelpCircle } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleLoadDemo = async () => {
    try {
      setLoadingDemo(true);
      const res = await loadDemoData();
      setToastMessage(res.message || 'Academic Demo Scenario successfully loaded!');
      setTimeout(() => {
        setToastMessage(null);
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      setToastMessage('Failed to load demo scenario. Is backend running?');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 antialiased font-sans">
      {/* Sidebar */}
      <Sidebar onLoadDemo={handleLoadDemo} loadingDemo={loadingDemo} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Academic Demo Mode Disclaimer Banner */}
        <DemoBanner isDemo={true} />

        {/* Top bar header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-8 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-sm text-slate-200">
              Project: Auditing and Explaining Career-Gap Bias in AI Resume Screening
            </span>
            <span className="hidden md:inline-block text-[11px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
              v1.0 (Viva Edition)
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-850 px-3 py-1.5 rounded-lg border border-slate-800">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>Auditing Mode: <strong>Career Gap (Protected Proxy)</strong></span>
            </div>

            <button
              onClick={handleLoadDemo}
              disabled={loadingDemo}
              className="text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              title="Reset or re-seed academic demo candidate profiles"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>{loadingDemo ? 'Resetting...' : 'Reset Demo Data'}</span>
            </button>
          </div>
        </header>

        {/* Toast alert */}
        {toastMessage && (
          <div className="fixed top-20 right-8 z-50 p-4 rounded-xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/25 border border-indigo-400 flex items-center gap-3 animate-bounce">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
