import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import ApplyModal from '../../components/ui/ApplyModal'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const SavedJobs = () => {
  const navigate                              = useNavigate()
  const [savedJobs,      setSavedJobs]        = useState([])
  const [isLoading,      setIsLoading]        = useState(true)
  const [error,          setError]            = useState('')
  const [removeError,    setRemoveError]      = useState('')
  const [applyModalOpen, setApplyModalOpen]   = useState(false)
  const [selectedJob,    setSelectedJob]      = useState(null)
  const [isRemoving,     setIsRemoving]       = useState('')
  const [appliedJobIds,  setAppliedJobIds]    = useState([])

  const fetchSavedJobs = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')
      const [savedResult, appsResult] = await Promise.allSettled([
        api.get('/auth/saved-jobs'),
        api.get('/applications/my')
      ])
      if (savedResult.status === 'fulfilled')
        setSavedJobs(savedResult.value.data.data || [])
      if (appsResult.status === 'fulfilled') {
        const jobIds = (appsResult.value.data.data || []).map(app => String(app.jobId._id || app.jobId))
        setAppliedJobIds(jobIds)
      }
      if (savedResult.status === 'rejected' && appsResult.status === 'rejected')
        setError('Failed to load saved jobs. Please try again.')
    } catch (err) {
      setError('Failed to load saved jobs. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchSavedJobs() }, [fetchSavedJobs])

  const handleRemove = async (jobId) => {
    try {
      setIsRemoving(jobId)
      setRemoveError('')
      await api.delete(`/auth/save-job/${jobId}`)
      setSavedJobs(prev => prev.filter(j => j._id !== jobId))
    } catch (err) {
      setRemoveError('Failed to remove saved job. Please try again.')
    } finally {
      setIsRemoving('')
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Saved Jobs</h1>

      {removeError ? (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg z-40 text-sm">
          {removeError}
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : null}

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">
          {error}
          <button onClick={fetchSavedJobs} className="ml-3 underline text-red-700 hover:text-red-900">
            Retry
          </button>
        </div>
      ) : null}

      {!isLoading && !error && savedJobs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No saved jobs yet.</p>
          <button
            onClick={() => navigate('/applicant/browse-jobs')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            Browse Jobs
          </button>
        </div>
      ) : null}

      {!isLoading && savedJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedJobs.map(job => (
            <div key={job._id} className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-base font-bold text-gray-900 mb-1">{job.title}</h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                  {job.department}
                </span>
                {job.employmentType ? (
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                    {job.employmentType}
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-gray-500 mb-2">{job.location}</p>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {job.description?.slice(0, 120)}
                {job.description?.length > 120 ? '…' : ''}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={isRemoving === job._id}
                  onClick={() => handleRemove(job._id)}
                  className="flex-1 border border-red-200 text-red-600 py-2 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  {isRemoving === job._id ? 'Removing…' : 'Remove'}
                </button>
                <button
                  disabled={appliedJobIds.includes(String(job._id))}
                  onClick={() => { setSelectedJob(job); setApplyModalOpen(true) }}
                  className={appliedJobIds.includes(String(job._id))
                    ? 'flex-1 py-2 text-xs font-semibold bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed'
                    : 'flex-1 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'}
                >
                  {appliedJobIds.includes(String(job._id)) ? 'Already Applied' : 'Apply Now'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {applyModalOpen ? (
        <ApplyModal
          isOpen={applyModalOpen}
          onClose={() => {
            setApplyModalOpen(false)
            setSelectedJob(null)
          }}
          job={selectedJob}
          alreadyApplied={selectedJob ? appliedJobIds.includes(String(selectedJob._id)) : false}
          onSuccess={() => {
            setApplyModalOpen(false)
            if (selectedJob) {
              setAppliedJobIds(prev => [...prev, String(selectedJob._id)])
            }
            setSelectedJob(null)
          }}
        />
      ) : null}
    </div>
  )
}

export default SavedJobs
