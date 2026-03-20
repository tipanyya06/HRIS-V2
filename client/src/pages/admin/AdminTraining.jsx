import { useState, useEffect } from 'react'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import Table from '../../components/ui/Table'
import StatusBadge from '../../components/ui/StatusBadge'

const EMPTY_FORM = {
  employeeId: '', // legacy, for edit
  employeeIds: [], // for multi-select
  employeeSearch: '',
  department: '',
  courseName: '',
  provider: '',
  completedAt: '',
  expiresAt: '',
  certUrl: '',
  status: 'in-progress',
}

export default function AdminTraining() {
  const { user } = useAuthStore()
  const [records, setRecords]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [pagination, setPagination]   = useState(null)
  const [page, setPage]               = useState(1)
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [employees, setEmployees]     = useState([])
  const [showModal, setShowModal]     = useState(false)
  const [editRecord, setEditRecord]   = useState(null)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [saving, setSaving]           = useState(false)
  const [toast, setToast]             = useState('')
  const [expiringCount, setExpiringCount] = useState(0)
  const [assignMode, setAssignMode] = useState('individual') // 'individual' or 'department'
  const departments = [
    ...new Set(
      employees
        .map(e => e.department)
        .filter(Boolean)
    )
  ].sort()

  // Fetch training records
  const fetchRecords = async () => {
    try {
      setLoading(true)
      const res = await api.get('/training', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          page,
          limit: 20,
        }
      })
      setRecords(res.data.records ?? [])
      setPagination(res.data.pagination ?? null)
    } catch {
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch employees for dropdown
  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees',
        { params: { limit: 200 } }
      )
      setEmployees(
        res.data.data?.employees ?? []
      )
    } catch { setEmployees([]) }
  }

  // Fetch expiring count
  const fetchExpiring = async () => {
    try {
      const res = await api.get('/training/expiring')
      setExpiringCount(res.data.data?.length ?? 0)
    } catch { setExpiringCount(0) }
  }

  useEffect(() => {
    fetchRecords()
  }, [page, search, statusFilter])

  useEffect(() => {
    fetchEmployees()
    fetchExpiring()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])


  const openCreate = () => {
    setEditRecord(null)
    setAssignMode('individual')
    setForm({ ...EMPTY_FORM })
    setShowModal(true)
  }

  const openEdit = (record) => {
    setEditRecord(record)
    setAssignMode('individual')
    setForm({
      employeeId: record.employeeId?._id ?? record.employeeId ?? '',
      employeeIds: record.employeeId?._id ? [record.employeeId._id] : [],
      employeeSearch: '',
      department: '',
      courseName:  record.courseName ?? '',
      provider:    record.provider ?? '',
      completedAt: record.completedAt
        ? new Date(record.completedAt)
            .toISOString().split('T')[0]
        : '',
      expiresAt: record.expiresAt
        ? new Date(record.expiresAt)
            .toISOString().split('T')[0]
        : '',
      certUrl: record.certUrl ?? '',
      status:  record.status ?? 'in-progress',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    try {
      // Validation
      if (assignMode === 'individual') {
        if (!Array.isArray(form.employeeIds) || form.employeeIds.length === 0) {
          setToast('Please select at least one employee')
          return
        }
      } else if (assignMode === 'department') {
        if (!form.department) {
          setToast('Please select a department')
          return
        }
      }
      if (!form.courseName.trim()) {
        setToast('Course name is required')
        return
      }
      if (!form.status) {
        setToast('Status is required')
        return
      }
      setSaving(true)
      if (assignMode === 'department' && form.department) {
        const deptEmployees = employees.filter(e =>
          e.department === form.department
        )
        if (deptEmployees.length === 0) {
          setToast('No employees found in this department')
          setSaving(false)
          return
        }
        await Promise.allSettled(
          deptEmployees.map(emp =>
            api.post('/training', {
              ...form,
              employeeId: emp._id,
            })
          )
        )
        setToast(
          `Training assigned to ${deptEmployees.length} employees in ${form.department}`
        )
      } else if (assignMode === 'individual' && Array.isArray(form.employeeIds) && form.employeeIds.length > 0) {
        if (editRecord) {
          // Edit mode: only update the single record
          await api.patch(`/training/${editRecord._id}`, {
            ...form,
            employeeId: form.employeeIds[0],
          })
          setToast('Training record updated')
        } else {
          // Bulk create for all selected employees
          await Promise.allSettled(
            form.employeeIds.map(empId =>
              api.post('/training', {
                ...form,
                employeeId: empId,
              })
            )
          )
          setToast(`Training assigned to ${form.employeeIds.length} employee${form.employeeIds.length > 1 ? 's' : ''}`)
        }
      }
      setShowModal(false)
      fetchRecords()
      fetchExpiring()
    } catch (err) {
      setToast(
        err.response?.data?.error ?? 'Failed to save'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(
      'Delete this training record?'
    )) return
    try {
      await api.delete(`/training/${id}`)
      setToast('Training record deleted')
      fetchRecords()
      fetchExpiring()
    } catch {
      setToast('Failed to delete')
    }
  }

  const handleMarkComplete = async (id) => {
    try {
      await api.patch(`/training/${id}/complete`)
      setToast('Marked as complete')
      fetchRecords()
    } catch {
      setToast('Failed to mark complete')
    }
  }

  const getEmployeeName = (emp) => {
    if (!emp) return '—'
    if (typeof emp === 'string') return emp
    const fullName = emp.personalInfo?.fullName
    const firstName = emp.personalInfo?.firstName ?? ''
    const lastName = emp.personalInfo?.lastName ?? ''
    const combined = `${firstName} ${lastName}`.trim()
    return fullName || combined || emp.email || '—'
  }

  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: row => (
        <div>
          <p className="text-[13px] font-medium text-[#1a3a5c]">
            {getEmployeeName(row.employeeId)}
          </p>
          <p className="text-[11px] text-gray-400">
            {row.employeeId?.department ?? '—'}
          </p>
        </div>
      )
    },
    {
      key: 'courseName',
      label: 'Course',
      render: row => (
        <div>
          <p className="text-[13px] font-medium text-[#1a3a5c]">
            {row.courseName ?? '—'}
          </p>
          <p className="text-[11px] text-gray-400">
            {row.provider ?? ''}
          </p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: row => (
        <StatusBadge status={row.status} />
      )
    },
    {
      key: 'completedAt',
      label: 'Completed',
      render: row => row.completedAt
        ? new Date(row.completedAt)
            .toLocaleDateString('en-PH')
        : '—'
    },
    {
      key: 'expiresAt',
      label: 'Expires',
      render: row => {
        if (!row.expiresAt) return (
          <span className="text-gray-400">No expiry</span>
        )
        const days = Math.floor(
          (new Date(row.expiresAt) - new Date()) /
          (1000 * 60 * 60 * 24)
        )
        const isExpired = days < 0
        const isSoon = days >= 0 && days <= 30
        return (
          <span className={
            isExpired ? 'text-red-600 font-medium' :
            isSoon    ? 'text-amber-600 font-medium' :
            'text-gray-700'
          }>
            {new Date(row.expiresAt)
              .toLocaleDateString('en-PH')}
            {isSoon ? ' ⚠️' : ''}
            {isExpired ? ' (Expired)' : ''}
          </span>
        )
      }
    },
    {
      key: 'certUrl',
      label: 'Certificate',
      render: row => row.certUrl ? (
        <a href={row.certUrl} target="_blank" rel="noreferrer" className="text-[12px] text-[#185FA5] hover:underline">View</a>
      ) : (
        <span className="text-gray-400 text-[12px]">
          —
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: row => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEdit(row)}
            className="text-[12px] text-[#185FA5] border border-gray-200 rounded-md px-3 h-[28px] bg-white hover:bg-gray-50"
          >
            Edit
          </button>
          {row.status !== 'completed' ? (
            <button
              onClick={() => handleMarkComplete(row._id)}
              className="text-[12px] text-green-600 border border-green-200 rounded-md px-3 h-[28px] bg-white hover:bg-green-50"
            >
              Complete
            </button>
          ) : null}
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
          <h1 className="text-[20px] font-semibold text-[#1a3a5c]">
            Training Records
          </h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Manage employee training and certifications.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="h-[36px] px-4 bg-[#185FA5] text-white rounded-md text-[13px] font-medium hover:bg-[#0C447C]"
        >
          + Add Training
        </button>
      </div>

      {/* Expiry alert */}
      {expiringCount > 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-[13px] text-amber-700">
          ⚠️ {expiringCount} certification
          {expiringCount === 1 ? '' : 's'} expiring
          within 30 days.
        </div>
      ) : null}

      {/* Toast */}
      {toast ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-[13px] text-blue-700">
          {toast}
        </div>
      ) : null}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-3 flex-wrap">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">
          Filters
        </span>
        <input
          type="text"
          placeholder="Search course or provider..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-[32px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5] min-w-[200px]"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-[32px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5]"
        >
          <option value="">All Statuses</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="expired">Expired</option>
        </select>
        <button
          onClick={() => {
            setSearch('')
            setStatusFilter('')
          }}
          className="text-[12px] text-[#185FA5] border border-gray-200 rounded-md px-3 h-[30px] bg-white hover:bg-gray-50"
        >
          Reset
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <Table
          columns={columns}
          data={records}
          isLoading={loading}
          emptyMessage="No training records found"
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
              {Math.min(
                pagination.page * pagination.limit,
                pagination.total
              )}
            </span>
            {' '}of{' '}
            <span className="font-medium text-gray-700">
              {pagination.total}
            </span>
            {' '}records
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
              onClick={() => setPage(p =>
                Math.min(pagination.totalPages, p + 1)
              )}
              disabled={!pagination.hasNextPage}
              className="h-[30px] px-3 border border-gray-200 rounded-md text-[12px] text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      ) : null}

      {/* Create / Edit Modal */}
      {showModal ? (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl overflow-y-auto max-h-[90vh]">

            {/* Modal header */}
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-[#1a3a5c]">
                {editRecord
                  ? 'Edit Training Record'
                  : 'Add Training Record'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-[20px] leading-none"
              >
                ×
              </button>
            </div>

            {/* Modal body */}
            <div className="px-5 py-4 flex flex-col gap-3">

              {/* Assignment mode toggle and employee/department select */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">
                  Assign To
                </label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAssignMode('individual')
                      setForm(f => ({ ...f, department: '', employeeId: '' }))
                    }}
                    className={`h-[30px] px-3 rounded-md text-[12px] font-medium border transition-colors ${assignMode === 'individual' ? 'bg-[#185FA5] text-white border-[#185FA5]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                  >
                    Specific Employee
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAssignMode('department')
                      setForm(f => ({ ...f, employeeId: '', department: '' }))
                    }}
                    className={`h-[30px] px-3 rounded-md text-[12px] font-medium border transition-colors ${assignMode === 'department' ? 'bg-[#185FA5] text-white border-[#185FA5]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                  >
                    By Department
                  </button>
                </div>
                {assignMode === 'individual' ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center mb-2 gap-2">
                      <input
                        type="text"
                        placeholder="Search employees..."
                        value={form.employeeSearch || ''}
                        onChange={e => setForm(f => ({ ...f, employeeSearch: e.target.value }))}
                        className="w-full h-[32px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5]"
                      />
                      <button
                        type="button"
                        className="text-[12px] text-[#185FA5] border border-gray-200 rounded-md px-2 h-[30px] bg-white hover:bg-gray-50"
                        onClick={() => {
                          // Select all filtered employees
                          const filtered = employees.filter(emp => {
                            const q = (form.employeeSearch || '').toLowerCase();
                            return getEmployeeName(emp).toLowerCase().includes(q) || (emp.department || '').toLowerCase().includes(q);
                          });
                          setForm(f => ({ ...f, employeeIds: filtered.map(emp => emp._id) }));
                        }}
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        className="text-[12px] text-gray-500 border border-gray-200 rounded-md px-2 h-[30px] bg-white hover:bg-gray-50"
                        onClick={() => setForm(f => ({ ...f, employeeIds: [] }))}
                      >
                        Clear
                      </button>
                    </div>
                    <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-md bg-gray-50 p-2">
                      {employees
                        .filter(emp => {
                          const q = (form.employeeSearch || '').toLowerCase();
                          return getEmployeeName(emp).toLowerCase().includes(q) || (emp.department || '').toLowerCase().includes(q);
                        })
                        .map(emp => (
                          <label key={emp._id} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-blue-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Array.isArray(form.employeeIds) && form.employeeIds.includes(emp._id)}
                              onChange={e => {
                                setForm(f => {
                                  let ids = Array.isArray(f.employeeIds) ? [...f.employeeIds] : [];
                                  if (e.target.checked) {
                                    ids.push(emp._id);
                                  } else {
                                    ids = ids.filter(id => id !== emp._id);
                                  }
                                  return { ...f, employeeIds: ids };
                                });
                              }}
                            />
                            <span className="text-[13px]">{getEmployeeName(emp)}</span>
                            {emp.department ? (
                              <span className="ml-2 text-[11px] text-gray-400">{emp.department}</span>
                            ) : null}
                          </label>
                        ))}
                      {employees.length === 0 && (
                        <div className="text-[13px] text-gray-400 px-2 py-1">No employees found</div>
                      )}
                    </div>
                    <div className="text-[11px] text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md mt-2">
                      {Array.isArray(form.employeeIds) && form.employeeIds.length > 0
                        ? `Selected ${form.employeeIds.length} employee${form.employeeIds.length > 1 ? 's' : ''}`
                        : 'No employees selected'}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <select
                      value={form.department}
                      onChange={e => setForm(f => ({
                        ...f, department: e.target.value
                      }))}
                      className="w-full h-[36px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5]"
                    >
                      <option value="">Select department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                    {form.department ? (
                      <p className="text-[11px] text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md">
                        Will assign to all{' '}
                        <strong>{employees.filter(e => e.department === form.department).length}</strong>
                        {' '}employees in {form.department}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Course name */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">
                  Course Name
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={form.courseName}
                  onChange={e => setForm(f => ({
                    ...f, courseName: e.target.value
                  }))}
                  placeholder="e.g. First Aid Training"
                  className="w-full h-[36px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5]"
                />
              </div>

              {/* Provider */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">
                  Provider
                </label>
                <input
                  type="text"
                  value={form.provider}
                  onChange={e => setForm(f => ({
                    ...f, provider: e.target.value
                  }))}
                  placeholder="e.g. Red Cross Philippines"
                  className="w-full h-[36px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5]"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({
                    ...f, status: e.target.value
                  }))}
                  className="w-full h-[36px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5]"
                >
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              {/* Dates — 2 columns */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">
                    Completed Date
                  </label>
                  <input
                    type="date"
                    value={form.completedAt}
                    onChange={e => setForm(f => ({
                      ...f,
                      completedAt: e.target.value
                    }))}
                    className="w-full h-[36px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={e => setForm(f => ({
                      ...f, expiresAt: e.target.value
                    }))}
                    className="w-full h-[36px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5]"
                  />
                </div>
              </div>

              {/* Certificate URL */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">
                  Certificate URL
                </label>
                <input
                  type="url"
                  value={form.certUrl}
                  onChange={e => setForm(f => ({
                    ...f, certUrl: e.target.value
                  }))}
                  placeholder="https://..."
                  className="w-full h-[36px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5]"
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="h-[36px] px-4 border border-gray-200 rounded-md text-[13px] text-gray-600 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || (assignMode === 'individual' && (!Array.isArray(form.employeeIds) || form.employeeIds.length === 0))}
                className="h-[36px] px-4 bg-[#185FA5] text-white rounded-md text-[13px] font-medium hover:bg-[#0C447C] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving
                  ? 'Saving...'
                  : editRecord
                  ? 'Save Changes'
                  : 'Add Record'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  )
}
