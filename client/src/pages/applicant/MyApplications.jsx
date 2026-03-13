import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
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

const MyApplications = () => {
  const navigate                          = useNavigate()
  const [applications, setApplications]   = useState([])
  const [isLoading,    setIsLoading]      = useState(true)
  const [error,        setError]          = useState('')
  const [filter,       setFilter]         = useState('all')
  const [expandedId,   setExpandedId]     = useState(null)

  const fetchApplications = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')
      const res = await api.get('/applications/my')
      setApplications(res.data.data || [])
    } catch (err) {
      setError('Failed to load applications. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchApplications() }, [fetchApplications])

  const filtered = filter === 'all'
    ? applications
    : applications.filter(a => a.stage === filter)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All</option>
          <option value="applied">Applied</option>
          <option value="screening">Screening</option>
          <option value="interview">Interview</option>
          <option value="offer">Offer</option>
          <option value="hired">Hired</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : null}

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">
          {error}
          <button onClick={fetchApplications} className="ml-3 underline text-red-700 hover:text-red-900">
            Retry
          </button>
        </div>
      ) : null}

      {!isLoading && !error && filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-1">No applications found.</p>
          {filter !== 'all' ? (
            <p className="text-sm text-gray-400 mb-4">Try changing the filter.</p>
          ) : null}
          <button
            onClick={() => navigate('/applicant/browse-jobs')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            Browse Jobs
          </button>
        </div>
      ) : null}

      {!isLoading && filtered.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Job Title</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Department</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Applied Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(app => (
                <React.Fragment key={app._id}>
                  <tr className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {app.jobId?.title || 'Unknown Job'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{app.jobId?.department || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(app.stage)}`}>
                        {app.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpandedId(expandedId === app._id ? null : app._id)}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        {expandedId === app._id ? 'Hide' : 'View Details'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === app._id ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Cover Letter</p>
                        <p className="text-sm text-gray-700">{app.coverLetter || 'No cover letter provided'}</p>
                        {app.resumeUrl ? (
                          <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                            View Resume
                          </a>
                        ) : null}
                      </td>
                    </tr>
                  ) : null}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}

export default MyApplications
