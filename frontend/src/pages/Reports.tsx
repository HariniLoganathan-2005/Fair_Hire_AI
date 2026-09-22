import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Sparkles,
  CheckCircle2,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { generateReport, downloadPdfReportUrl, downloadExcelReportUrl } from '../services/api';

export const Reports: React.FC = () => {
  const [reportTitle, setReportTitle] = useState('FairHire AI — Career-Gap Fairness Audit Report');
  const [reportNotes, setReportNotes] = useState(
    'Formal algorithmic audit report evaluating career-gap disparate impact under EEOC four-fifths guidelines, featuring SHAP attributions and human review logs.'
  );
  const [generating, setGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGenerating(true);
      const res = await generateReport({
        title: reportTitle,
        notes: reportNotes,
      });
      setGeneratedReport(res);
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white">Audit Reports & Export Center</h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            PDF & Excel Engine
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Generate comprehensive compliance reports containing candidate scoring tables, SHAP feature rankings, and fairness metrics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Generator Form */}
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" /> Configure & Generate Audit Report
          </h3>

          <form onSubmit={handleGenerate} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 mb-1 font-medium">Report Title</label>
              <input
                type="text"
                required
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">Executive Summary & Audit Context</label>
              <textarea
                rows={4}
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={generating}
                className="w-full py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                {generating ? 'Building PDF & Excel Files...' : 'Compile Audit Report'}
              </button>
            </div>
          </form>
        </div>

        {/* Download & Export Formats */}
        <div className="space-y-4">
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-400" /> Export Downloads
            </h3>
            <p className="text-xs text-slate-400">
              Download formal audit artifacts formatted for stakeholders, compliance officers, and academic evaluation.
            </p>

            <div className="space-y-3 pt-2">
              {/* PDF Download Card */}
              <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-white">Full PDF Audit Report</h4>
                    <p className="text-[11px] text-slate-400">Formatted with ReportLab • Executive summary & charts</p>
                  </div>
                </div>

                <a
                  href={downloadPdfReportUrl(generatedReport?.report_id || 'latest')}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" /> PDF
                </a>
              </div>

              {/* Excel Download Card */}
              <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-white">Raw Audit Spreadsheet (.xlsx)</h4>
                    <p className="text-[11px] text-slate-400">openpyxl export • Candidate rows & disparity metrics</p>
                  </div>
                </div>

                <a
                  href={downloadExcelReportUrl(generatedReport?.report_id || 'latest')}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" /> Excel
                </a>
              </div>
            </div>

            {generatedReport && (
              <div className="p-3.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Report compiled! Files are ready for download.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
