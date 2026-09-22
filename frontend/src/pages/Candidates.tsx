import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  BrainCircuit,
  GitFork,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Filter,
  Eye
} from 'lucide-react';
import { getCandidates, getScreeningResults } from '../services/api';
import { Candidate, ScreeningResult } from '../types';

export const Candidates: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [screeningMap, setScreeningMap] = useState<Record<number, ScreeningResult>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [gapFilter, setGapFilter] = useState<'all' | 'gap' | 'no-gap'>('all');
  const [decisionFilter, setDecisionFilter] = useState<'all' | 'shortlisted' | 'rejected'>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [candData, resultsData] = await Promise.all([
          getCandidates(),
          getScreeningResults(),
        ]);
        setCandidates(candData);

        const map: Record<number, ScreeningResult> = {};
        resultsData.forEach((res) => {
          map[res.candidate_id] = res;
        });
        setScreeningMap(map);
      } catch (err) {
        console.error('Error fetching candidates:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.education_level.toLowerCase().includes(searchTerm.toLowerCase());

    const hasGap = (c.career_gap_months || 0) > 0;
    const matchesGap =
      gapFilter === 'all' ||
      (gapFilter === 'gap' && hasGap) ||
      (gapFilter === 'no-gap' && !hasGap);

    const result = screeningMap[c.id];
    const matchesDecision =
      decisionFilter === 'all' ||
      (result && result.decision?.toLowerCase() === decisionFilter.toLowerCase());

    return matchesSearch && matchesGap && matchesDecision;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Candidate Pool & Screening Registry</h2>
          <p className="text-xs text-slate-400">
            Audit individual candidate profiles, extracted career gap metrics, and SHAP decision insights
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by candidate name, email, or degree..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={gapFilter}
            onChange={(e) => setGapFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Gap: All Profiles</option>
            <option value="gap">Has Career Gap (Audited)</option>
            <option value="no-gap">Continuous (0 mo gap)</option>
          </select>

          <select
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Decision: All Outcomes</option>
            <option value="shortlisted">Shortlisted Only</option>
            <option value="rejected">Rejected Only</option>
          </select>
        </div>
      </div>

      {/* Candidates Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          Loading candidate profiles...
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/30 text-xs text-slate-400">
          No candidates match the selected filters.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] text-slate-400 uppercase tracking-wider bg-slate-850 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Candidate Profile</th>
                <th className="py-3 px-4">Total Experience</th>
                <th className="py-3 px-4">Skills Match</th>
                <th className="py-3 px-4">Career Gap (Audited)</th>
                <th className="py-3 px-4">AI Score</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4 text-right">Audit Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredCandidates.map((cand) => {
                const res = screeningMap[cand.id];
                const hasGap = (cand.career_gap_months || 0) > 0;
                const isShortlisted = res?.decision?.toLowerCase() === 'shortlisted';
                const skillsMatchVal = res?.features_used?.skills_match ?? (cand as any).skills_match_score ?? (cand.skills?.length ? Math.min(100, cand.skills.length * 15) : 0);

                return (
                  <tr key={cand.id} className="hover:bg-slate-850/50 transition">
                    <td className="py-3.5 px-4 font-medium text-white">
                      <div>
                        <Link
                          to={`/candidates/${cand.id}`}
                          className="hover:text-indigo-400 transition font-semibold"
                        >
                          {cand.name}
                        </Link>
                        <div className="text-[10px] text-slate-400">{cand.email || 'No email'} • {cand.education_level || 'Not specified'}</div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono">
                      {cand.total_experience_years} years
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      <div className="flex items-center gap-2">
                        <span>{Number(skillsMatchVal).toFixed(0)}%</span>
                        <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, Math.max(0, Number(skillsMatchVal)))}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {hasGap ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
                          <Clock className="w-3 h-3" />
                          {cand.career_gap_months} mo gap
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-[10px]">0 mo (Continuous)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {res ? `${res.score.toFixed(1)}/100` : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {res ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            isShortlisted
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isShortlisted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {isShortlisted ? 'Shortlisted' : 'Rejected'}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Not Screened</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <Link
                        to={`/candidates/${cand.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition"
                      >
                        <Eye className="w-3 h-3" /> View Profile
                      </Link>
                      {res && (
                        <>
                          <Link
                            to={`/explainability?result_id=${res.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-medium transition"
                            title="SHAP Feature Importance"
                          >
                            <BrainCircuit className="w-3 h-3" /> SHAP
                          </Link>
                          <Link
                            to={`/counterfactual?result_id=${res.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-medium transition"
                            title="Counterfactual What-If Analysis"
                          >
                            <GitFork className="w-3 h-3" /> What-If
                          </Link>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
