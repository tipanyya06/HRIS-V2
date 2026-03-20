import { useState, useEffect } from 'react'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import Table from '../../components/ui/Table'
import StatusBadge from '../../components/ui/StatusBadge'

export default function AdminOffboarding() {
  const { user } = useAuthStore()
  const [offboardings, setOffboardings] = useState([])
  const [loading, setLoading]           = useState(true)
  const [pagination, setPagination]     = useState(null)
  const [page, setPage]                 = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [employees, setEmployees]       = useState([])
  const [showInitModal, setShowInitModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selected, setSelected]         = useState(null)
  const [toast, setToast]               = useState('')
  const [saving, setSaving]             = useState(false)

  // Initiate form
  const [initForm, setInitForm] = useState({
    employeeId: '',
    reason: '',
    lastDay: '',
    notes: '',
  })

  const fetchOffboardings = async () => {
    try {
      setLoading(true)
      const res = await api.get('/offboarding', {
        params: {
          status: statusFilter || undefined,
          page, limit: 20
        }
      })
      setOffboardings(res.data.offboardings ?? [])
      setPagination(res.data.pagination ?? null)
    } catch { setOffboardings([]) }
    finally { setLoading(false) }
  }

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees',
        { params: { limit: 200 } }
      )
      setEmployees(res.data.data?.employees ?? [])
    } catch { setEmployees([]) }
  }

  useEffect(() => { fetchOffboardings() },
    [page, statusFilter])
  useEffect(() => { fetchEmployees() }, [])
  useEffect(() => { setPage(1) }, [statusFilter])

  const getEmpName = (emp) => {
    if (!emp) return '—'
    if (typeof emp === 'string') return emp
    const full = emp.personalInfo?.fullName
    const first = emp.personalInfo?.firstName ?? ''
    const last  = emp.personalInfo?.lastName  ?? ''
    return full || `${first} ${last}`.trim() ||
      emp.email || '—'
  }

  const handleInitiate = async () => {
    try {
      if (!initForm.employeeId) {
        setToast('Please select an employee')
        return
      }
      if (!initForm.reason) {
        setToast('Please select a reason')
        return
      }
      if (!initForm.lastDay) {
        setToast('Please set the last day')
        return
      }
      setSaving(true)
      await api.post('/offboarding', initForm)
      setToast('Offboarding initiated successfully')
      setShowInitModal(false)
      setInitForm({
        employeeId: '', reason: '',
        lastDay: '', notes: ''
      })
      fetchOffboardings()
    } catch (err) {
      let msg = err.response?.data?.error ?? 'Failed to initiate offboarding';
      if (typeof msg === 'object') {
        msg = msg.message || msg.status || JSON.stringify(msg);
      }
      setToast(msg);
    } finally { setSaving(false) }
  }

  const handleAssetToggle = async (
    offboardingId, assetId, currentReturned
  ) => {
    try {
      const res = await api.patch(
        `/offboarding/${offboardingId}/asset`,
        { assetId, returned: !currentReturned }
      )
      setSelected(res.data.data)
      fetchOffboardings()
    } catch {
      setToast('Failed to update asset')
    }
  }

  const handleClearanceToggle = async (
    offboardingId, clearanceId, currentCleared
  ) => {
    try {
      const res = await api.patch(
        `/offboarding/${offboardingId}/clearance`,
        { clearanceId, cleared: !currentCleared }
      )
      setSelected(res.data.data)
      fetchOffboardings()
    } catch {
      setToast('Failed to update clearance')
    }
  }

  const handleSystemAccess = async (
    offboardingId, field, value
  ) => {
    try {
      const res = await api.patch(
        `/offboarding/${offboardingId}/system-access`,
        { [field]: value }
      )
      setSelected(res.data.data)
      fetchOffboardings()
    } catch {
      setToast('Failed to update system access')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(
      'Delete this offboarding record?'
    )) return
    try {
      await api.delete(`/offboarding/${id}`)
      setToast('Offboarding record deleted')
      fetchOffboardings()
    } catch {
      setToast('Failed to delete')
    }
  }

  const getProgress = (ob) => {
    const total =
      ob.assets.length +
      ob.clearances.length + 2
    const done =
      ob.assets.filter(a => a.returned).length +
      ob.clearances.filter(c => c.cleared).length +
      (ob.exitInterview.conducted ? 1 : 0) +
      (ob.systemAccess.emailDisabled &&
       ob.systemAccess.systemsRevoked ? 1 : 0)
    return Math.round((done / total) * 100)
  }

  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: row => (
        <div>
          <p className="text-[13px] font-medium text-[#1a3a5c]">
            {getEmpName(row.employeeId)}
          </p>
          <p className="text-[11px] text-gray-400">
            {row.employeeId?.department ?? '—'}
          </p>
        </div>
      )
    },
    {
      key: 'reason',
      label: 'Reason',
      render: row => (
        <span className="text-[12px] text-gray-700 capitalize">
          {row.exitInterview?.reason ?? '—'}
        </span>
      )
    },
    {
      key: 'lastDay',
      label: 'Last Day',
      render: row => row.exitInterview?.lastDay
        ? new Date(row.exitInterview.lastDay).toLocaleDateString('en-PH')
        : '—'
    },
    {
      key: 'status',
      label: 'Status',
      render: row => (
        <StatusBadge status={row.status} />
      )
    },
    {
      key: 'progress',
      label: 'Progress',
      render: row => {
        const pct = getProgress(row)
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#185FA5] rounded-full"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[11px] text-gray-500">
              {pct}%
            </span>
          </div>
        )
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: row => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelected(row)
              setShowDetailModal(true)
            }}
            className="text-[12px] text-[#185FA5] border border-gray-200 rounded-md px-3 h-[28px] bg-white hover:bg-gray-50"
          >
            Manage
          </button>
          <button
            onClick={() => handleDelete(row._id)}
            className="text-[12px] text-red-500 border border-red-200 rounded-md px-3 h-[28px] bg-white hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      )
    },
  ]

  return (
    <div className="w-full px-6 py-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-[#1a3a5c]">Offboarding</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Manage employee exit processes and clearances.</p>
        </div>
        <button
          onClick={() => setShowInitModal(true)}
          className="h-[36px] px-4 bg-[#185FA5] text-white rounded-md text-[13px] font-medium hover:bg-[#0C447C]"
        >
          + Initiate Offboarding
        </button>
      </div>

      {/* Toast */}
      {toast ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-[13px] text-blue-700">
          {toast}
        </div>
      ) : null}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Status</span>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-[32px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5]"
        >
          <option value="">All</option>
          <option value="initiated">Initiated</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <button
          onClick={() => setStatusFilter('')}
          className="text-[12px] text-[#185FA5] border border-gray-200 rounded-md px-3 h-[30px] bg-white hover:bg-gray-50"
        >
          Reset
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <Table
          columns={columns}
          data={offboardings}
          isLoading={loading}
          emptyMessage="No offboarding records found"
        />
      </div>

      {/* Pagination */}
      {pagination ? (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
          <span className="text-[12px] text-gray-500">
            Showing{' '}
            <span className="font-medium text-gray-700">
              {((pagination.page - 1) * pagination.limit) + 1}
            </span>
            {' '}–{' '}
            <span className="font-medium text-gray-700">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>
            {' '}of{' '}
            <span className="font-medium text-gray-700">
              {pagination.total}
            </span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={!pagination.hasPrevPage}
              className="h-[30px] px-3 border border-gray-200 rounded-md text-[12px] text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <span className="text-[12px] text-gray-500">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={!pagination.hasNextPage}
              className="h-[30px] px-3 border border-gray-200 rounded-md text-[12px] text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      ) : null}

      {/* Initiate Modal */}
      {showInitModal ? (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-[#1a3a5c]">Initiate Offboarding</h2>
              <button
                onClick={() => setShowInitModal(false)}
                className="text-gray-400 hover:text-gray-600 text-[20px] leading-none"
              >×</button>
            </div>
            <div className="px-5 py-4 flex flex-col gap-3">
              {/* Employee */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">
                  Employee
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  value={initForm.employeeId}
                  onChange={e => setInitForm(f => ({ ...f, employeeId: e.target.value }))}
                  className="w-full h-[36px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5]"
                >
                  <option value="">Select employee</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {getEmpName(emp)}
                      {emp.department ? ` — ${emp.department}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {/* Reason */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">
                  Reason
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  value={initForm.reason}
                  onChange={e => setInitForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full h-[36px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5]"
                >
                  <option value="">Select reason</option>
                  <option value="resignation">Resignation</option>
                  <option value="termination">Termination</option>
                  <option value="end-of-contract">End of Contract</option>
                  <option value="retirement">Retirement</option>
                  <option value="redundancy">Redundancy</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {/* Last day */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widests text-gray-500 mb-1">
                  Last Day
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="date"
                  value={initForm.lastDay}
                  onChange={e => setInitForm(f => ({ ...f, lastDay: e.target.value }))}
                  className="w-full h-[36px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5]"
                />
              </div>
              {/* Notes */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">
                  Notes
                </label>
                <textarea
                  value={initForm.notes}
                  onChange={e => setInitForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="Additional notes..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5] resize-none"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowInitModal(false)}
                className="h-[36px] px-4 border border-gray-200 rounded-md text-[13px] text-gray-600 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleInitiate}
                disabled={saving}
                className="h-[36px] px-4 bg-[#185FA5] text-white rounded-md text-[13px] font-medium hover:bg-[#0C447C] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Initiating...' : 'Initiate'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
