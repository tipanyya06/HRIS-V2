import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import { ApplyModal, AuthModal } from '../../components/ui';

export default function JobBoard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [filters, setFilters] = useState({ search: '', department: '' });
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingApplyJob, setPendingApplyJob] = useState(null);
  const [employeeBlockMessage, setEmployeeBlockMessage] = useState('');
  const [appliedJobIds, setAppliedJobIds] = useState([]);

  // Fetch user's applied jobs on mount
  useEffect(() => {
    if (user?.id) {
      fetchUserJobData();
    }
  }, [user?.id]);

  // Fetch jobs on mount and when filters change
  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchUserJobData = async () => {
    try {
      const appliedRes = await api.get('/applications/my');
      if (appliedRes.status === 200) {
        const applied = appliedRes.data.data || [];
        console.log('RAW APPLIED DATA:', applied);
        const ids = applied
          .map(a => {
            if (typeof a.jobId === 'object' && a.jobId?._id)
              return String(a.jobId._id);
            if (typeof a.jobId === 'string')
              return String(a.jobId);
            return null;
          })
          .filter(Boolean);
        console.log('APPLIED JOB IDS:', ids);
        setAppliedJobIds(ids);
      }
    } catch (err) {
      console.error('Error fetching user applications:', err);
    }
  };

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

  const handleApply = (job) => {
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
      setPendingApplyJob(job);
      setAuthModalOpen(true);
    } else {
      setSelectedJob(job);
      setApplyModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Job Board</h1>
          <p className="text-gray-600">Find your next opportunity at Madison 88</p>
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

                {user?.role === 'employee'
                  ? null
                  : user && ['admin', 'super-admin', 'hr'].includes(user.role)
                    ? null
                    : appliedJobIds.includes(String(selectedJob?._id))
                      ? <button
                          onClick={() => handleApply(selectedJob)}
                          className="w-full py-3 text-sm font-semibold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                          Already Applied — View Status
                        </button>
                      : <button
                          onClick={() => handleApply(selectedJob)}
                          className="w-full py-3 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          Apply Now
                        </button>
                }
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <p className="text-gray-600">Select a job to see details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setPendingApplyJob(null);
        }}
        onSuccess={() => {
          setAuthModalOpen(false);
          if (pendingApplyJob) {
            setSelectedJob(pendingApplyJob);
            setPendingApplyJob(null);
            setApplyModalOpen(true);
          }
        }}
      />

      <ApplyModal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        job={selectedJob}
        alreadyApplied={
          selectedJob 
            ? appliedJobIds.includes(String(selectedJob._id)) 
            : false
        }
        onSuccess={() => {
          setApplyModalOpen(false);
          if (selectedJob) {
            setAppliedJobIds(prev => [...prev, String(selectedJob._id)]);
          }
          setSelectedJob(null);
          fetchUserJobData();
        }}
      />

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
