import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

export default function JobBoard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [filters, setFilters] = useState({ search: '', department: '' });

  // Fetch jobs on mount and when filters change
  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.department) params.append('department', filters.department);

      const response = await api.get(`/jobs?${params}`);
      setJobs(response.data.data || []);
    } catch (err) {
      // Extract error message - handle both string and object errors
      let errorMessage = 'Failed to load jobs';
      if (err.response?.data?.error) {
        if (typeof err.response.data.error === 'string') {
          errorMessage = err.response.data.error;
        } else if (err.response.data.error.message) {
          errorMessage = err.response.data.error.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setFilters({ ...filters, search: e.target.value });
  };

  const handleDepartmentChange = (e) => {
    setFilters({ ...filters, department: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <nav className="bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-3 mb-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">Madison 88</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/meeting-calendar')}
              className="text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2"
            >
              Schedule Interview
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="bg-gray-900 hover:bg-black text-white font-semibold px-4 py-2 rounded-lg transition"
            >
              Sign Up
            </button>
            <button
              onClick={() => navigate('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition"
            >
              Login
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Job Board</h1>
            <p className="text-gray-600">Find your next opportunity at Madison 88</p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2"
          >
            Login
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Search by title or keywords..."
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filters.department}
              onChange={handleDepartmentChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              <option value="General">General</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Operations">Operations</option>
              <option value="Sales">Sales</option>
              <option value="Engineering">Engineering</option>
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Jobs List */}
          <div className="lg:col-span-2">
            {loading && (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading jobs...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {!loading && jobs.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <p className="text-gray-600 text-lg">No jobs available at the moment.</p>
              </div>
            )}

            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job._id}
                  className={`bg-white rounded-lg shadow-sm border-2 cursor-pointer transition ${
                    selectedJob?._id === job._id
                      ? 'border-blue-500 shadow-md'
                      : 'border-transparent hover:shadow-md'
                  }`}
                  onClick={() => setSelectedJob(job)}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                        <p className="text-sm text-gray-600">{job.department}</p>
                      </div>
                      <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {job.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">
                      {job.description ? job.description.substring(0, 150) + '...' : 'No description'}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Slots: {job.slots}</span>
                      <span className="text-gray-500">
                        Posted {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Job Details Sidebar */}
          <div className="lg:col-span-1">
            {selectedJob ? (
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedJob.title}</h2>

                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Department</p>
                    <p className="text-gray-900">{selectedJob.department}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Available Slots</p>
                    <p className="text-gray-900">{selectedJob.slots}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Posted By</p>
                    <p className="text-gray-900">
                      {selectedJob.postedBy?.firstName} {selectedJob.postedBy?.lastName}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Posted On</p>
                    <p className="text-gray-900">
                      {new Date(selectedJob.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Status</p>
                    <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {selectedJob.status}
                    </span>
                  </div>
                </div>

                {selectedJob.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 text-sm">{selectedJob.description}</p>
                  </div>
                )}

                {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Requirements</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedJob.requirements.map((req, idx) => (
                        <li key={idx} className="text-gray-700 text-sm">
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button 
                  onClick={() => navigate(`/apply/${selectedJob._id}`)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition">
                  Apply Now
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <p className="text-gray-600">Select a job to see details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
