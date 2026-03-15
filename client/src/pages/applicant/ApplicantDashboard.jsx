import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import api from '../../lib/api'
import ApplyModal from '../../components/ui/ApplyModal'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const getStatusBadge = (status) => {
  const styles = {
    applied:   'bg-blue-100 text-blue-700',
    screening: 'bg-yellow-100 text-yellow-700',
    interview: 'bg-purple-100 text-purple-700',
    offer:     'bg-green-100 text-green-700',
    hired:     'bg-emerald-100 text-emerald-700',
    rejected:  'bg-red-100 text-red-700',
  }
  return styles[status] || 'bg-gray-100 text-gray-700'
}

const ApplicantDashboard = () => {
  const { user }                              = useAuthStore()
  const navigate                              = useNavigate()
  const [applications,   setApplications]     = useState([])
  const [savedJobs,      setSavedJobs]        = useState([])
  const [isLoading,      setIsLoading]        = useState(true)
  const [error,          setError]            = useState('')
  const [applyModalOpen, setApplyModalOpen]   = useState(false)
  const [selectedJob,    setSelectedJob]      = useState(null)

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    const [appsResult, savedResult] = await Promise.allSettled([
      api.get('/applications/my'),
      api.get('/auth/saved-jobs')
    ])
    if (appsResult.status === 'fulfilled')
      setApplications(appsResult.value.data.data || [])
    if (savedResult.status === 'fulfilled')
      setSavedJobs(savedResult.value.data.data || [])
    if (appsResult.status === 'rejected' && savedResult.status === 'rejected')
      setError('Failed to load dashboard data. Please refresh.')
    setIsLoading(false)
  }, [])

  useEffect(() => { fetchDashboardData() }, [fetchDashboardData])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.personalInfo?.givenName || 'Applicant'}!
        </h1>
        <p className="text-gray-500 text-sm mt-1">Here's your application overview</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : (
        <div>
          {error ? (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
              <p className="text-sm text-gray-500">Total Applications</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-2xl font-bold text-gray-900">
                {applications.filter(a => a.stage === 'interview').length}
              </p>
              <p className="text-sm text-gray-500">Interviews Scheduled</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-2xl font-bold text-gray-900">{savedJobs.length}</p>
              <p className="text-sm text-gray-500">Saved Jobs</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
            <h2 className="text-base font-semibold text-gray-800 mb-3">Recent Applications</h2>
            {applications.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 mb-3">You haven't applied to any jobs yet.</p>
                <button
                  onClick={() => navigate('/applicant/browse-jobs')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                >
                  Browse Jobs
                </button>
              </div>
            ) : (
              <div>
                <div className="space-y-2">
                  {applications.slice(0, 5).map(app => (
                    <div key={app._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {app.jobId?.title || 'Unknown Job'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {app.jobId?.department || '—'} · {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadge(app.stage)}`}>
                        {app.stage}
                      </span>
                    </div>
                  ))}
                </div>
                {applications.length > 5 ? (
                  <button
                    onClick={() => navigate('/applicant/applications')}
                    className="text-sm text-blue-600 hover:underline mt-3"
                  >
                    View all applications →
                  </button>
                ) : null}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-3">Saved Jobs</h2>
            {savedJobs.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 mb-3">No saved jobs yet.</p>
                <button
                  onClick={() => navigate('/applicant/browse-jobs')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                >
                  Browse Jobs
                </button>
              </div>
            ) : (
              <div>
                <div className="space-y-2">
                  {savedJobs.slice(0, 3).map(job => (
                    <div key={job._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{job.title}</p>
                        <p className="text-xs text-gray-400">{job.department} · {job.location}</p>
                      </div>
                      <button
                        onClick={() => { setSelectedJob(job); setApplyModalOpen(true) }}
                        className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-700"
                      >
                        Apply Now
                      </button>
                    </div>
                  ))}
                </div>
                {savedJobs.length > 3 ? (
                  <button
                    onClick={() => navigate('/applicant/saved-jobs')}
                    className="text-sm text-blue-600 hover:underline mt-3"
                  >
                    View all saved jobs →
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}

      {applyModalOpen ? (
        <ApplyModal
          isOpen={applyModalOpen}
          onClose={() => setApplyModalOpen(false)}
          job={selectedJob}
          alreadyApplied={
            Array.isArray(applications)
              ? applications.some((app) => {
                  const appJobId = typeof app.jobId === 'string'
                    ? app.jobId
                    : app.jobId?._id
                  return appJobId === selectedJob?._id
                })
              : false
          }
          onSuccess={() => {
            setApplyModalOpen(false)
            fetchDashboardData()
          }}
        />
      ) : null}
    </div>
  )
}

export default ApplicantDashboard
