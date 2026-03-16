import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import { LoadingSpinner, AuthModal, ApplyModal } from '../../components/ui';

export default function Careers() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [departments, setDepartments] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [pendingJob, setPendingJob] = useState(null);
  const [employeeBlockMessage, setEmployeeBlockMessage] = useState('');
  const [appliedJobIds, setAppliedJobIds] = useState([]);

  useEffect(() => {
    fetchJobs();
  }, []);

  // Fetch applied jobs for applicants and employees
  useEffect(() => {
    if (user?.role === 'applicant' || user?.role === 'employee') {
      fetchUserJobData();
    }
  }, [user]);

  const fetchUserJobData = async () => {
    try {
      const appliedRes = await api.get('/applications/my');
      if (appliedRes.status === 200) {
        const applied = appliedRes.data.data || [];
        const ids = applied
          .map(a => {
            if (typeof a.jobId === 'object' && a.jobId?._id)
              return String(a.jobId._id);
            if (typeof a.jobId === 'string')
              return String(a.jobId);
            return null;
          })
          .filter(Boolean);
        setAppliedJobIds(ids);
      }
    } catch (err) {
      // Silent fail
    }
  };

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await api.get('/jobs?status=active');
      const jobList = response.data?.data || [];
      setJobs(jobList);

      const uniqueDepartments = [...new Set(jobList.map((job) => job.department).filter(Boolean))];
      setDepartments(uniqueDepartments);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load jobs');
      setJobs([]);
      setDepartments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchSearch = job.title.toLowerCase().includes(search.toLowerCase());
    const matchDept = filterDept === 'All' || job.department === filterDept;
    return matchSearch && matchDept;
  });

  const handleApplyClick = (job) => {
    if (!job) return;

    const blockedAdminRoles = ['admin', 'super-admin', 'hr'];

    if (user && blockedAdminRoles.includes(user.role)) {
      return;
    }

    if (user?.role === 'employee') {
      setEmployeeBlockMessage('You are already an employee. Contact HR for internal transfers.');
      return;
    }

    if (!user) {
      setPendingJob(job);
      setSelectedJob(job);
      setAuthModalOpen(true);
      return;
    }

    setSelectedJob(job);
    setApplyModalOpen(true);
  };

  const handleAuthSuccess = () => {
    setAuthModalOpen(false);
    if (pendingJob) {
      setSelectedJob(pendingJob);
      setApplyModalOpen(true);
      setPendingJob(null);
    }
  };

  const handleApplySuccess = () => {
    setApplyModalOpen(false);
    if (selectedJob) {
      setAppliedJobIds(prev => [...prev, String(selectedJob._id)]);
    }
    setSelectedJob(null);
    fetchUserJobData();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* PAGE HEADER */}
      <section style={{ backgroundColor: '#223B5B' }} className="pt-32 pb-20 px-[6%] text-center">
        <div className="max-w-[1100px] mx-auto">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="w-6 h-px bg-[#2596BE]" />
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/45">
              Careers
            </span>
            <span className="w-6 h-px bg-[#2596BE]" />
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight leading-tight mb-4">
            Join Our Team
          </h1>

          {/* Subheadline */}
          <p className="text-base text-white/60">
            Building the world's best headwear — together
          </p>
        </div>
      </section>

      {/* SEARCH + FILTER BAR */}
      <section className="bg-white border-b border-gray-200 py-4 px-[6%] sticky top-[60px] z-10">
        <div className="max-w-[1100px] mx-auto flex items-center gap-3 flex-wrap">
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search positions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2.5 text-sm font-light border border-gray-200 rounded-sm placeholder:text-gray-300 focus:outline-none focus:border-[#223B5B] transition-colors"
          />

          {/* Filter Chips */}
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setFilterDept('All')}
              className={`px-4 py-2 text-xs font-medium tracking-wide border rounded-sm transition-all ${
                filterDept === 'All'
                  ? 'border-[#223B5B] text-[#223B5B] bg-[#223B5B]/[0.04]'
                  : 'border-gray-200 text-gray-500 bg-white hover:border-[#223B5B] hover:text-[#223B5B]'
              }`}
            >
              All
            </button>
            {departments.map((department) => (
              <button
                key={department}
                type="button"
                onClick={() => setFilterDept(department)}
                className={`px-4 py-2 text-xs font-medium tracking-wide border rounded-sm transition-all ${
                  filterDept === department
                    ? 'border-[#223B5B] text-[#223B5B] bg-[#223B5B]/[0.04]'
                    : 'border-gray-200 text-gray-500 bg-white hover:border-[#223B5B] hover:text-[#223B5B]'
                }`}
              >
                {department}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* JOBS LIST */}
      <section className="py-16 px-[6%]">
        <div className="max-w-[1100px] mx-auto">
          {isLoading ? (
            <div className="py-10 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-red-400 text-sm text-center py-10">{error}</div>
          ) : filteredJobs.length === 0 ? (
            <div className="py-24 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-2xl font-bold text-gray-900 mb-2">No positions found</p>
              <p className="text-sm text-gray-400 font-light">
                Try a different search or department filter
              </p>
            </div>
          ) : (
            <>
              {/* Results Count */}
              <div className="text-xs text-gray-400 font-medium tracking-wide uppercase mb-6">
                {filteredJobs.length} Position{filteredJobs.length !== 1 ? 's' : ''} Available
              </div>

              <div className={`flex gap-8 items-start ${selectedJob ? 'flex-col lg:flex-row' : 'flex-col'}`}>

                {/* Left: Job Rows */}
                <div className={selectedJob ? 'w-full lg:w-1/2' : 'w-full'}>
                  {/* Job Rows */}
                  <div className="flex flex-col gap-3">
                    {filteredJobs.map((job) => (
                      <div
                        key={job._id}
                        onClick={() => setSelectedJob(job)}
                        className="group flex items-center gap-5 px-7 py-6 bg-white border border-gray-200 rounded-lg cursor-pointer transition-all duration-200 hover:border-[#223B5B] hover:shadow-lg"
                      >
                        {/* Accent Dot */}
                        <span className="w-2 h-2 rounded-full bg-[#2596BE] flex-shrink-0" />

                        {/* Department Badge */}
                        <span className="text-xs font-medium text-[#2596BE] bg-[#2596BE]/[0.07] px-3 py-1.5 rounded-sm flex-shrink-0 min-w-[140px] text-center whitespace-nowrap">
                          {job.department || 'General'}
                        </span>

                        {/* Job Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#2596BE] transition-colors">
                            {job.title}
                          </h3>
                          <p className="text-xs text-gray-400 font-light mt-0.5">
                            {job.slots} position{job.slots !== 1 ? 's' : ''} available
                          </p>
                        </div>

                        {/* Meta (hidden on mobile) */}
                        <div className="hidden sm:flex gap-6 ml-auto">
                          <span className="text-xs text-gray-400 font-light flex items-center gap-1.5">
                            📍 {job.country || 'Multiple Locations'}
                          </span>
                          <span className="text-xs text-gray-400 font-light flex items-center gap-1.5">
                            ⏰ Full-time
                          </span>
                        </div>

                        {/* Arrow */}
                        <span className="text-gray-300 ml-3 flex-shrink-0 transition-all group-hover:text-[#223B5B] group-hover:translate-x-1">
                          -&gt;
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Job Description Panel — only when selectedJob is not null */}
                {selectedJob && (
                  <div className="w-full lg:w-1/2 sticky top-[80px]">
                    <div className="mt-6 bg-white border border-gray-200 rounded-lg p-8">
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">{selectedJob.title}</h2>
                          <p className="text-sm text-[#2596BE] font-medium mt-1">{selectedJob.department}</p>
                        </div>
                        <button onClick={() => setSelectedJob(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
                      </div>
                      <div className="space-y-4 mb-6 text-sm text-gray-600">
                        <p>📍 {selectedJob.country || 'Multiple Locations'}</p>
                        <p>🪑 {selectedJob.slots} position{selectedJob.slots !== 1 ? 's' : ''} available</p>
                      </div>
                      {selectedJob.description && (
                        <div className="mb-6">
                          <h3 className="text-base font-bold text-gray-900 mb-2">Description</h3>
                          <p className="text-sm text-gray-700 leading-relaxed">{selectedJob.description}</p>
                        </div>
                      )}
                      {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                        <div className="mb-8">
                          <h3 className="text-base font-bold text-gray-900 mb-2">Requirements</h3>
                          <ul className="list-disc list-inside space-y-1">
                            {selectedJob.requirements.map((req, idx) => (
                              <li key={idx} className="text-sm text-gray-700">{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const blockedAdminRoles = ['admin', 'super-admin', 'hr'];
                          if (user && blockedAdminRoles.includes(user.role)) return;
                          if (user?.role === 'employee') {
                            setEmployeeBlockMessage('You are already an employee. Contact HR for internal transfers.');
                            return;
                          }
                          if (!user) {
                            setPendingJob(selectedJob);
                            setAuthModalOpen(true);
                          } else {
                            setApplyModalOpen(true);
                          }
                        }}
                        className="px-8 py-3 text-sm font-semibold tracking-wide uppercase bg-[#223B5B] text-white rounded-sm hover:bg-[#2596BE] transition-colors"
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </>
          )}
        </div>
      </section>

      {authModalOpen ? (
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => {
            setAuthModalOpen(false);
            setPendingJob(null);
          }}
          onSuccess={handleAuthSuccess}
        />
      ) : null}

      {applyModalOpen ? (
        <ApplyModal
          isOpen={applyModalOpen}
          onClose={() => {
            setApplyModalOpen(false);
            setSelectedJob(null);
          }}
          job={selectedJob}
          alreadyApplied={
            selectedJob
              ? appliedJobIds.includes(String(selectedJob._id))
              : false
          }
          onSuccess={handleApplySuccess}
        />
      ) : null}

      {employeeBlockMessage !== '' ? (
        <div className="fixed bottom-4 right-4 bg-yellow-600 text-white px-4 py-3 rounded-lg shadow-lg z-40 text-sm max-w-sm">
          {employeeBlockMessage}
          <button
            onClick={() => setEmployeeBlockMessage('')}
            className="ml-3 font-bold hover:opacity-70"
          >
            ✕
          </button>
        </div>
      ) : null}
    </div>
  );
}
