import React, { useState, useEffect } from 'react'
import { X, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import LoadingSpinner from './LoadingSpinner'

const extractErrorMessage = (error) => {
  if (typeof error?.response?.data?.error === 'string')   return error.response.data.error
  if (typeof error?.response?.data?.message === 'string') return error.response.data.message
  if (typeof error?.message === 'string')                 return error.message
  return 'Something went wrong. Please try again.'
}

const ApplyModal = ({ isOpen, onClose, job, onSuccess, alreadyApplied = false }) => {
  // ALL hooks declared first (useState, useEffect, useAuthStore, useNavigate)
  const [coverLetter,  setCoverLetter]  = useState('')
  const [phone,        setPhone]        = useState('')
  const [resumeFile,   setResumeFile]   = useState(null)
  const [resumeError,  setResumeError]  = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error,        setError]        = useState('')
  const [submitted,    setSubmitted]    = useState(false)

  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      setError('')
      setCoverLetter('')
      setPhone('')
      setResumeFile(null)
    }
  }, [isOpen])

  // Early returns AFTER all hooks are declared
  if (!isOpen || !job) return null

  const blockedRoles = ['admin', 'super-admin', 'hr', 'employee']
  if (!user || blockedRoles.includes(user.role)) {
    return null
  }

  // Show already-applied state if user has already applied
  if (alreadyApplied) {
    return (
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-xl w-full max-w-md p-6 relative shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>

          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Already Applied</h3>
            <p className="text-sm text-gray-500 mb-6">
              You have already submitted an application for {job?.title}. Track your status in your dashboard.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onClose()
                  navigate('/applicant/dashboard')
                }}
                className="flex-1 px-6 py-2 border border-blue-600 text-blue-600 text-sm font-semibold rounded-lg hover:bg-blue-50 transition-colors"
              >
                View My Applications
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    setResumeError('')
    if (!file) return
    if (file.type !== 'application/pdf') {
      setResumeError('Only PDF files are accepted')
      setResumeFile(null)
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setResumeError('Resume must be under 5MB')
      setResumeFile(null)
      return
    }
    setResumeFile(file)
  }

  const handleSubmit = async () => {
    setError('')
    if (!coverLetter.trim()) {
      setError('Cover letter is required')
      return
    }
    if (coverLetter.trim().length < 50) {
      setError(`Please write at least 50 characters (${50 - coverLetter.trim().length} more needed)`)
      return
    }
    try {
      setIsSubmitting(true)
      let resumeUrl = ''

      if (resumeFile) {
        try {
          const formData = new FormData()
          formData.append('resume', resumeFile)
          const uploadRes = await api.post('/upload/resume', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          resumeUrl = uploadRes.data.data?.resumeUrl || ''
        } catch (uploadErr) {
          setResumeError('Resume upload failed. Submitting without resume.')
        }
      }

      await api.post('/applications', {
        jobId:       job._id,
        coverLetter: coverLetter.trim(),
        resumeUrl,
        phone:       phone.trim() || '',
      })

      setSubmitted(true)
      setCoverLetter('')
      setPhone('')
      setResumeFile(null)

      setTimeout(() => {
        setSubmitted(false)
        onSuccess()
      }, 1500)

    } catch (err) {
      if (err?.response?.status === 409) {
        setError('You have already applied for this position')
      } else {
        setError(extractErrorMessage(err))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">

        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:opacity-30"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-gray-800 mb-1">Apply for Position</h2>
        <p className="text-lg font-semibold text-gray-900">{job.title}</p>
        <p className="text-sm text-gray-500 mb-4">{job.department} · {job.location}</p>

        {submitted ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-sm text-center my-3">
            Application submitted successfully! Redirecting…
          </div>
        ) : null}

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm my-3">
            {error}
          </div>
        ) : null}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cover Letter <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={6}
              required
              placeholder="Tell us why you're a great fit for this position... (minimum 50 characters)"
              value={coverLetter}
              onChange={(e) => { setError(''); setCoverLetter(e.target.value) }}
              disabled={isSubmitting}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              {coverLetter.length} characters{' '}
              {coverLetter.length < 50
                ? `(${50 - coverLetter.length} more needed)`
                : '✓'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number — Optional
            </label>
            <input
              type="tel"
              placeholder="+63 123 456 7890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSubmitting}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resume (PDF, max 5MB) — Optional
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={isSubmitting}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-600"
            />
            {resumeFile ? (
              <p className="text-sm text-green-600 mt-1">✓ {resumeFile.name}</p>
            ) : null}
            {resumeError ? (
              <p className="text-sm text-red-600 mt-1">{resumeError}</p>
            ) : null}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? <LoadingSpinner /> : 'Submit Application'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default ApplyModal
