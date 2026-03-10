import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { LoadingSpinner } from '../../components/ui';

export default function Careers() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchJobs();
  }, []);

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
          <h1 className="font-serif text-5xl md:text-6xl font-semibold text-white tracking-tight leading-tight mb-4">
            Join Our Team
          </h1>

          {/* Subheadline */}
          <p className="text-base font-light tracking-[0.06em] uppercase text-white/45">
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
              <p className="font-serif text-2xl text-[#223B5B] mb-2">No positions found</p>
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

              {/* Job Rows */}
              <div className="flex flex-col gap-3">
                {filteredJobs.map((job) => (
                  <div
                    key={job._id}
                    onClick={() => navigate(`/apply/${job._id}`)}
                    className="group flex items-center gap-5 px-7 py-6 bg-white border border-gray-200 rounded-sm cursor-pointer transition-all duration-200 hover:border-[#223B5B] hover:shadow-lg"
                  >
                    {/* Accent Dot */}
                    <span className="w-2 h-2 rounded-full bg-[#2596BE] flex-shrink-0" />

                    {/* Department Badge */}
                    <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#2596BE] bg-[#2596BE]/[0.07] px-3 py-1.5 rounded-sm flex-shrink-0 min-w-[140px] text-center whitespace-nowrap">
                      {job.department || 'General'}
                    </span>

                    {/* Job Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif text-xl font-semibold text-[#223B5B] group-hover:text-[#2596BE] transition-colors">
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

                    {/* Apply Button (hidden on mobile) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/apply/${job._id}`);
                      }}
                      className="hidden md:flex px-5 py-2 text-xs font-semibold tracking-wide uppercase border border-[#223B5B] text-[#223B5B] rounded-sm group-hover:bg-[#223B5B] group-hover:text-white transition-all flex-shrink-0"
                    >
                      Apply Now
                    </button>

                    {/* Arrow */}
                    <span className="text-gray-300 ml-3 flex-shrink-0 transition-all group-hover:text-[#223B5B] group-hover:translate-x-1">
                      -&gt;
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
