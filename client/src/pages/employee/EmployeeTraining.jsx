import { useState, useEffect } from 'react'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'

const STATUS_STYLES = {
  completed: 'bg-green-50 text-green-700 border-green-200',
  'in-progress': 'bg-amber-50 text-amber-700 border-amber-200',
  expired: 'bg-red-50 text-red-700 border-red-200',
}

const STATUS_LABELS = {
  completed: 'Completed',
  'in-progress': 'In Progress',
  expired: 'Expired',
}

export default function EmployeeTraining() {
  const { user } = useAuthStore()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchTraining = async () => {
      try {
        setLoading(true)
        setError('')
        const res = await api.get('/training/my')
        setRecords(res.data?.data ?? res.data ?? [])
      } catch (err) {
        setError('Failed to load training records.')
        setRecords([])
      } finally {
        setLoading(false)
      }
    }
    if (user?.id) fetchTraining()
  }, [user?.id])

  const isExpiringSoon = (expiresAt) => {
    if (!expiresAt) return false
    const days = Math.floor(
      (new Date(expiresAt) - new Date()) /
      (1000 * 60 * 60 * 24)
    )
    return days >= 0 && days <= 30
  }

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  return (
    <div className="w-full px-6 py-5 flex flex-col gap-4">
      <div>
        <h1 className="text-[20px] font-semibold text-[#1a3a5c]">
          My Training Records
        </h1>
        <p className="text-[13px] text-gray-500 mt-0.5">
          View your training history and certifications.
        </p>
      </div>

      {/* Expiry alerts */}
      {records.some(r => isExpiringSoon(r.expiresAt)) ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-[13px] text-amber-700">
          You have certifications expiring within 30 days. Please contact HR to renew.
        </div>
      ) : null}

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center text-[13px] text-gray-400">
          Loading training records...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-[13px] text-red-600">
          {error}
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 flex flex-col items-center justify-center text-center gap-3">
          <div className="text-[32px]">TRN</div>
          <p className="text-[14px] font-medium text-[#1a3a5c]">
            No training records yet
          </p>
          <p className="text-[13px] text-gray-500 max-w-sm">
            Your training assignments and certifications will appear here once HR assigns them.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Course
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Provider
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Completed
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Expires
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Certificate
                </th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-b-0"
                >
                  <td className="px-4 py-3 text-[13px] font-medium text-[#1a3a5c]">
                    {record.courseName ?? 'Ã¢â‚¬â€'}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-gray-700">
                    {record.provider ?? 'Ã¢â‚¬â€'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_STYLES[record.status]
                      ?? STATUS_STYLES['in-progress']}`}>
                      {STATUS_LABELS[record.status]
                        ?? record.status ?? 'Ã¢â‚¬â€'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-gray-700">
                    {record.completedAt
                      ? new Date(record.completedAt)
                          .toLocaleDateString('en-PH')
                      : 'Ã¢â‚¬â€'}
                  </td>
                  <td className="px-4 py-3 text-[13px]">
                    {record.expiresAt ? (
                      <span className={
                        isExpired(record.expiresAt)
                          ? 'text-red-600 font-medium'
                          : isExpiringSoon(record.expiresAt)
                          ? 'text-amber-600 font-medium'
                          : 'text-gray-700'
                      }>
                        {new Date(record.expiresAt)
                          .toLocaleDateString('en-PH')}
                        {isExpiringSoon(record.expiresAt)
                          ? ' (Expiring)' : ''}
                        {isExpired(record.expiresAt)
                          ? ' (Expired)' : ''}
                      </span>
                    ) : (
                      <span className="text-gray-400">
                        No expiry
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {record.certUrl ? (
                      <a
                        href={record.certUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[12px] text-[#185FA5] hover:underline"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-[12px] text-gray-400">
                        Ã¢â‚¬â€
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
