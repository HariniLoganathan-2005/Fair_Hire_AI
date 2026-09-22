import React, { useEffect, useState } from 'react';
import { Briefcase, Plus, CheckCircle, Calendar, GraduationCap, Clock } from 'lucide-react';
import { getJobs, createJob } from '../services/api';
import { Job } from '../types';

export const Jobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    department: 'Engineering',
    description: '',
    required_experience_years: 3,
    required_skills: 'Python, SQL, Machine Learning, Git',
    min_education_level: "Bachelor's Degree",
  });

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await getJobs();
      setJobs(data);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const skillsArray = formData.required_skills
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      await createJob({
        title: formData.title,
        department: formData.department,
        description: formData.description,
        required_experience_years: Number(formData.required_experience_years),
        required_skills: skillsArray,
        min_education_level: formData.min_education_level,
      });

      setShowModal(false);
      setFormData({
        title: '',
        department: 'Engineering',
        description: '',
        required_experience_years: 3,
        required_skills: 'Python, SQL, Machine Learning, Git',
        min_education_level: "Bachelor's Degree",
      });
      fetchJobs();
    } catch (err) {
      console.error('Error creating job:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Job Postings</h2>
          <p className="text-xs text-slate-400">
            Define requirements against which resumes are evaluated for skills matching and experience
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-2 shadow-md shadow-indigo-600/30 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create New Job
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-xs text-slate-400">
          Loading jobs...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-white">{job.title}</h3>
                      <span className="text-[11px] text-slate-400">{job.department || 'General'}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    ID #{job.id}
                  </span>
                </div>

                {job.description && (
                  <p className="mt-3 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>
                )}

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Required Experience: <strong className="text-white">{job.required_experience_years} years</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                    <span>Min Education: <strong className="text-white">{job.min_education_level || "Bachelor's Degree"}</strong></span>
                  </div>
                </div>

                <div className="mt-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1.5">
                    Required Skills:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {job.required_skills?.map((skill, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 font-mono">
                  <Calendar className="w-3 h-3" />
                  {new Date(job.created_at).toLocaleDateString()}
                </span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Active Benchmark
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Job Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Create New Job Position</h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Senior Data Scientist"
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Job Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Key responsibilities and qualifications..."
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Required Exp (Years)</label>
                  <input
                    type="number"
                    min="0"
                    max="25"
                    value={formData.required_experience_years}
                    onChange={(e) => setFormData({ ...formData, required_experience_years: Number(e.target.value) })}
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Min Education</label>
                  <select
                    value={formData.min_education_level}
                    onChange={(e) => setFormData({ ...formData, min_education_level: e.target.value })}
                    className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="High School">High School</option>
                    <option value="Associate Degree">Associate Degree</option>
                    <option value="Bachelor's Degree">Bachelor's Degree</option>
                    <option value="Master's Degree">Master's Degree</option>
                    <option value="Ph.D.">Ph.D.</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Required Skills (comma separated)</label>
                <input
                  type="text"
                  value={formData.required_skills}
                  onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
                >
                  Save Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
