import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Briefcase,
  CheckCircle2,
  XCircle,
  Scale,
  BrainCircuit,
  ArrowRight,
  TrendingDown,
  AlertTriangle,
  FileSpreadsheet,
  Clock,
  Sparkles
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { FairnessMetricCard } from '../components/FairnessMetricCard';
import { getDashboardStats, getScreeningResults } from '../services/api';
import { DashboardStats, ScreeningResult } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid
} from 'recharts';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentResults, setRecentResults] = useState<ScreeningResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, resultsData] = await Promise.all([
          getDashboardStats(),
          getScreeningResults(),
        ]);
        setStats(statsData);
        setRecentResults(resultsData.slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400">Loading FairHire AI Dashboard...</p>
      </div>
    );
  }

  // Selection rates comparison data for chart
  const comparisonData = stats ? [
    {
      category: 'Continuous Career (No Gap)',
      'Total Applicants': stats.no_gap_count,
      'Shortlisted': stats.no_gap_shortlisted,
      'Selection Rate (%)': Number((stats.no_gap_selection_rate * 100).toFixed(1)),
    },
    {
      category: 'With Career Gap (>=1 mo)',
      'Total Applicants': stats.gap_count,
      'Shortlisted': stats.gap_shortlisted,
      'Selection Rate (%)': Number((stats.gap_selection_rate * 100).toFixed(1)),
    },
  ] : [];

  const disparateImpact = stats?.disparate_impact_ratio ?? 0;
  const fairnessStatus = disparateImpact >= 0.8 ? 'fair' : disparateImpact >= 0.6 ? 'borderline' : 'disparate';

  return (
    <div className="space-y-8">
      {/* Welcome & Viva Highlights Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/60 border border-indigo-500/20 backdrop-blur-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Responsible AI Viva Demonstration Platform
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Career-Gap Bias Auditing & Transparent Explainability
          </h2>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Audit AI resume screening pipelines for subtle career-break penalties. Inspect individual decisions with mathematically computed <strong>SHAP feature attributions</strong>, test actionable <strong>counterfactual explanations</strong>, and maintain human oversight.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/fairness"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition"
            >
              <Scale className="w-4 h-4" /> Run Fairness Audit
            </Link>
            <Link
              to="/screening"
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs flex items-center gap-2 transition"
            >
              <Users className="w-4 h-4" /> Screen New Resumes
            </Link>
            <Link
              to="/reports"
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs flex items-center gap-2 transition"
            >
              <FileSpreadsheet className="w-4 h-4" /> Download PDF/Excel Report
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Candidates"
          value={stats?.total_candidates || 0}
          subtitle={`Across ${stats?.total_jobs || 1} job posting`}
          icon={Users}
          variant="default"
        />
        <StatCard
          title="Shortlist Rate"
          value={`${((stats?.overall_selection_rate || 0) * 100).toFixed(1)}%`}
          subtitle={`${stats?.shortlisted_count || 0} selected of ${stats?.total_screened || 0} screened`}
          icon={CheckCircle2}
          variant="emerald"
        />
        <StatCard
          title="Disparate Impact"
          value={`${((stats?.disparate_impact_ratio || 0)).toFixed(2)}`}
          subtitle="Career-Gap Selection Ratio"
          icon={Scale}
          variant={fairnessStatus === 'fair' ? 'emerald' : fairnessStatus === 'borderline' ? 'amber' : 'rose'}
        />
        <StatCard
          title="Flagged for Human Review"
          value={stats?.pending_human_reviews || 0}
          subtitle="Borderline or gap-impacted profiles"
          icon={AlertTriangle}
          variant="amber"
        />
      </div>

      {/* Fairness Audit Headline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <FairnessMetricCard
            title="Four-Fifths Rule (80% Rule)"
            value={`${((stats?.disparate_impact_ratio || 0) * 100).toFixed(0)}%`}
            status={fairnessStatus}
            thresholdRule="Disparate Impact Ratio >= 0.80"
            description="Measures whether candidates with career breaks are selected at at least 80% the rate of candidates with continuous employment."
          />

          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Selection Rate Disparity
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-300">Continuous Careers:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {((stats?.no_gap_selection_rate || 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-300">With Career Gaps:</span>
                <span className="font-mono font-bold text-amber-400">
                  {((stats?.gap_selection_rate || 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Demographic Parity Diff:</span>
                <span className="font-mono font-bold text-rose-400">
                  {(((stats?.no_gap_selection_rate || 0) - (stats?.gap_selection_rate || 0)) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            <Link
              to="/fairness"
              className="mt-3 block text-center py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-medium transition"
            >
              Inspect Complete Audit Breakdown &rarr;
            </Link>
          </div>
        </div>

        {/* Comparison Chart */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm text-white">Selection Rate by Employment Continuity</h3>
              <p className="text-xs text-slate-400">Comparing candidates with and without career breaks</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              EEOC 4/5ths Metric
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Selection Rate (%)" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Disparity Delta: <strong className="text-white">{(((stats?.no_gap_selection_rate || 0) - (stats?.gap_selection_rate || 0)) * 100).toFixed(1)} percentage points</strong></span>
            <Link to="/counterfactual" className="text-indigo-400 hover:underline flex items-center gap-1">
              Explore Counterfactuals <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Screening Candidates List */}
      <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-white">Recent Screening Outcomes</h3>
            <p className="text-xs text-slate-400">Individual candidate scores, SHAP explanations, and review status</p>
          </div>
          <Link to="/candidates" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
            View All Candidates <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] text-slate-400 uppercase tracking-wider bg-slate-850 border-y border-slate-800">
              <tr>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Experience</th>
                <th className="py-3 px-4">Skills Match</th>
                <th className="py-3 px-4">Career Gap</th>
                <th className="py-3 px-4">AI Score</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4 text-right">Responsible AI Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {recentResults.map((res) => {
                const cand = res.candidate;
                const isShortlisted = res.decision?.toLowerCase() === 'shortlisted';
                const hasGap = (cand?.career_gap_months || 0) > 0;
                const skillsMatchVal = res.features_used?.skills_match ?? (cand as any)?.skills_match_score ?? (cand?.skills?.length ? Math.min(100, cand.skills.length * 15) : 0);

                return (
                  <tr key={res.id} className="hover:bg-slate-850/50 transition">
                    <td className="py-3.5 px-4 font-medium text-white">
                      <div>
                        <span>{cand?.name || `Candidate #${res.candidate_id}`}</span>
                        <div className="text-[10px] text-slate-400">{cand?.email || 'No email'}</div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono">
                      {cand?.total_experience_years || 0} yrs
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {Number(skillsMatchVal).toFixed(0)}%
                    </td>
                    <td className="py-3.5 px-4">
                      {hasGap ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <Clock className="w-3 h-3" />
                          {cand?.career_gap_months} mo gap
                        </span>
                      ) : (
                        <span className="text-slate-400">Continuous</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {res.score.toFixed(1)}/100
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          isShortlisted
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {isShortlisted ? 'Shortlisted' : 'Rejected'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        to={`/explainability?result_id=${res.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-medium transition"
                      >
                        <BrainCircuit className="w-3 h-3" /> SHAP
                      </Link>
                      <Link
                        to={`/candidates/${res.candidate_id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition"
                      >
                        Profile
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
