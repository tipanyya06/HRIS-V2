import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Button, Modal, Table, Toast, StatusBadge } from '../../components/ui';

const extractErrorMessage = (err, fallback) => {
  const message = err?.response?.data?.error;
  if (typeof message === 'string') return message;
  if (typeof message?.message === 'string') return message.message;
  return fallback;
};

export default function AdminList() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super-admin';

  // Main data state
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [total, setTotal] = useState(0);

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    givenName: '',
    lastName: '',
    role: 'admin',
    department: '',
  });
  const [formError, setFormError] = useState('');

  // Edit Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editAdmin, setEditAdmin] = useState(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editRole, setEditRole] = useState('');
  const [editDept, setEditDept] = useState('');

  // Status Modal
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [statusAdmin, setStatusAdmin] = useState(null);
  const [isStatusSubmitting, setIsStatusSubmitting] = useState(false);

  // Helpers
  const getAdminName = (admin) => {
    const given = admin?.personalInfo?.givenName || '';
    const last = admin?.personalInfo?.lastName || '';
    const full = `${given} ${last}`.trim();
    return full || admin?.email || 'Unknown';
  };

  const getRoleBadge = (role) => {
    if (role === 'super-admin') {
      return { label: 'Super Admin', class: 'bg-purple-100 text-purple-700' };
    }
    if (role === 'admin') {
      return { label: 'Admin', class: 'bg-blue-100 text-blue-700' };
    }
    if (role === 'hr') {
      return { label: 'HR', class: 'bg-teal-100 text-teal-700' };
    }
    return { label: role, class: 'bg-gray-100 text-gray-600' };
  };

  const resetCreateForm = () => {
    setCreateForm({
      email: '',
      password: '',
      confirmPassword: '',
      givenName: '',
      lastName: '',
      role: 'admin',
      department: '',
    });
    setFormError('');
  };

  // Fetch admins
  const fetchAdmins = async () => {
    if (!isSuperAdmin) {
      setError('Only super-admin accounts can access Admin List.');
      setAdmins([]);
      setTotal(0);
      setTotalPages(1);
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      let query = `/admins?page=${page}&limit=20`;
      if (filterRole !== 'all') query += `&role=${filterRole}`;
      if (search.trim()) query += `&search=${encodeURIComponent(search.trim())}`;

      const res = await api.get(query);
      const list = res.data?.data || res.data || [];
      setAdmins(Array.isArray(list) ? list : []);
      const totalPages = res.data?.totalPages || 1;
      const tot = res.data?.total || list.length;
      setTotal(tot);
      setPagination({ page, limit: 20, total: tot, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 });
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load admins'));
      setAdmins([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch when role filter or page changes
  useEffect(() => {
    fetchAdmins();
  }, [filterRole, page]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchAdmins();
      } else {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Create handler
  const handleCreate = async () => {
    setFormError('');
    if (
      !createForm.email ||
      !createForm.password ||
      !createForm.givenName ||
      !createForm.lastName ||
      !createForm.role
    ) {
      setFormError('Please fill in all required fields.');
      return;
    }
    if (createForm.password !== createForm.confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }
    if (createForm.password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }
    try {
      setIsSubmitting(true);
      await api.post('/admins', {
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
        department: createForm.department,
        personalInfo: {
          givenName: createForm.givenName,
          lastName: createForm.lastName,
        },
      });
      setIsCreateOpen(false);
      resetCreateForm();
      await fetchAdmins();
      setToast({ message: 'Admin account created.', type: 'success' });
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Failed to create admin.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit handlers
  const openEdit = (admin) => {
    setEditAdmin(admin);
    setEditRole(admin.role);
    setEditDept(admin.department || '');
    setIsEditOpen(true);
  };

  const handleEditSave = async () => {
    try {
      setIsEditSubmitting(true);
      await api.patch(`/admins/${editAdmin._id}`, {
        role: editRole,
        department: editDept,
      });
      setIsEditOpen(false);
      await fetchAdmins();
      setToast({ message: 'Admin updated.', type: 'success' });
    } catch (err) {
      setToast({
        message: extractErrorMessage(err, 'Failed to update admin.'),
        type: 'error',
      });
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Status modal handlers
  const openStatusModal = (admin) => {
    setStatusAdmin(admin);
    setIsStatusOpen(true);
  };

  const handleStatusToggle = async () => {
    try {
      setIsStatusSubmitting(true);
      const newStatus = !statusAdmin.isActive;
      await api.patch(`/admins/${statusAdmin._id}/status`, {
        isActive: newStatus,
      });
      setIsStatusOpen(false);
      await fetchAdmins();
      setToast({
        message: newStatus ? 'Admin activated.' : 'Admin deactivated.',
        type: 'success',
      });
    } catch (err) {
      setToast({
        message: extractErrorMessage(err, 'Failed to update status.'),
        type: 'error',
      });
    } finally {
      setIsStatusSubmitting(false);
    }
  };

  // Table columns
  const columns = [
    {
      key: 'name',
      label: 'Admin',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{getAdminName(row)}</div>
          <div className="text-xs text-gray-400">{row.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (row) => <StatusBadge status={row.role} />,
    },
    {
      key: 'department',
      label: 'Department',
      render: (row) => (
        <span className="text-sm text-gray-700">{row.department || '-'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.isActive ? 'active' : 'inactive'} />,
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (row) => (
        <span className="text-sm text-gray-500">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-1 flex-wrap">
          {row.role !== 'super-admin' ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => openStatusModal(row)}
              >
                {row.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            </>
          ) : (
            <span className="text-xs text-gray-400 italic px-2">Protected</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="w-full px-6 py-5 flex flex-col gap-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-[#1a3a5c]">Admin list</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Manage administrator accounts and permissions</p>
        </div>
        <Button variant="primary" onClick={() => setIsCreateOpen(true)} isDisabled={!isSuperAdmin}>
          + New Admin
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Total Admins
          </div>
          <div className="text-2xl font-bold text-[#223B5B]">{total}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Admins
          </div>
          <div className="text-2xl font-bold text-[#223B5B]">
            {admins.filter((a) => a.role === 'admin').length}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            HR Users
          </div>
          <div className="text-2xl font-bold text-[#223B5B]">
            {admins.filter((a) => a.role === 'hr').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-3 flex-wrap">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Filters</span>
        <input
          type="text"
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="h-[32px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5] min-w-[200px]"
        />
        <select
          value={filterRole}
          onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}
          className="h-[32px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5]"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="hr">HR</option>
          <option value="super-admin">Super Admin</option>
        </select>
        <button
          onClick={() => { setSearch(''); setFilterRole('all'); setPage(1); }}
          className="text-[12px] text-[#185FA5] border border-gray-200 rounded-md px-3 h-[30px] bg-white hover:bg-gray-50 whitespace-nowrap"
        >
          Reset
        </button>
      </div>

      {/* Error */}
      {error ? <p className="text-sm text-red-600 mb-3">{error}</p> : null}

      {/* Table */}
      <Table
        data={admins}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No admins found."
      />

      {/* Pagination */}
      {pagination ? (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
          <span className="text-[12px] text-gray-500">
            Showing <span className="font-medium text-gray-700">{((pagination.page - 1) * pagination.limit) + 1}</span>{' '}–{' '}<span className="font-medium text-gray-700">{Math.min(pagination.page * pagination.limit, pagination.total)}</span>{' '}of{' '}<span className="font-medium text-gray-700">{pagination.total}</span> records
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!pagination.hasPrevPage} className="h-[30px] px-3 border border-gray-200 rounded-md text-[12px] text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">← Prev</button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1).reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...'); acc.push(p); return acc; }, []).map((p, idx) =>
              p === '...' ? (<span key={`ellipsis-${idx}`} className="text-[12px] text-gray-400 px-1">…</span>) : (
                <button key={p} onClick={() => setPage(p)} className={`h-[30px] w-[30px] rounded-md text-[12px] border transition-colors ${pagination.page === p ? 'bg-[#185FA5] text-white border-[#185FA5]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{p}</button>
              )
            )}
            <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={!pagination.hasNextPage} className="h-[30px] px-3 border border-gray-200 rounded-md text-[12px] text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
          </div>
        </div>
      ) : null}

      {/* Toast */}
      {toast ? (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      ) : null}

      {/* === CREATE MODAL === */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          resetCreateForm();
          setFormError('');
        }}
        title="Create Admin Account"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Given name *"
              value={createForm.givenName}
              onChange={(e) =>
                setCreateForm({ ...createForm, givenName: e.target.value })
              }
              className="w-full h-[32px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5]"
            />
            <input
              placeholder="Last name *"
              value={createForm.lastName}
              onChange={(e) =>
                setCreateForm({ ...createForm, lastName: e.target.value })
              }
              className="w-full h-[32px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5]"
            />
          </div>

          <input
            type="email"
            placeholder="Email address *"
            value={createForm.email}
            onChange={(e) =>
              setCreateForm({ ...createForm, email: e.target.value })
            }
            className="w-full h-[32px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5]"
          />

          <div className="grid grid-cols-2 gap-3">
            <select
              value={createForm.role}
              onChange={(e) =>
                setCreateForm({ ...createForm, role: e.target.value })
              }
              className="h-[32px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5]"
            >
              <option value="admin">Admin</option>
              <option value="hr">HR</option>
            </select>
            <input
              placeholder="Department (optional)"
              value={createForm.department}
              onChange={(e) =>
                setCreateForm({ ...createForm, department: e.target.value })
              }
              className="w-full h-[32px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="password"
              placeholder="Password (min 8 chars) *"
              value={createForm.password}
              onChange={(e) =>
                setCreateForm({ ...createForm, password: e.target.value })
              }
              className="w-full h-[32px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5]"
            />
            <input
              type="password"
              placeholder="Confirm password *"
              value={createForm.confirmPassword}
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  confirmPassword: e.target.value,
                })
              }
              className="w-full h-[32px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5]"
            />
          </div>

          {formError ? (
            <p className="text-sm text-red-500 text-center">{formError}</p>
          ) : null}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              This account will have immediate access to the Admin Console.
              Share credentials securely.
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setIsCreateOpen(false);
                resetCreateForm();
                setFormError('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              isLoading={isSubmitting}
              isDisabled={isSubmitting}
            >
              Create Admin
            </Button>
          </div>
        </div>
      </Modal>

      {/* === EDIT MODAL === */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Admin"
        size="sm"
      >
        {editAdmin ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Editing: <strong>{getAdminName(editAdmin)}</strong>
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">
                  Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full h-[32px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5]"
                >
                  <option value="admin">Admin</option>
                  <option value="hr">HR</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">
                  Department
                </label>
                <input
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value)}
                  placeholder="Department"
                  className="w-full h-[32px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5]"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleEditSave}
                isLoading={isEditSubmitting}
                isDisabled={isEditSubmitting}
              >
                Save Changes
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* === STATUS MODAL === */}
      <Modal
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        title={
          statusAdmin?.isActive ? 'Deactivate Admin' : 'Activate Admin'
        }
        size="sm"
      >
        {statusAdmin ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to{' '}
              <strong>
                {statusAdmin.isActive ? 'deactivate' : 'activate'}
              </strong>{' '}
              <strong>{getAdminName(statusAdmin)}</strong>?
            </p>

            {statusAdmin.isActive ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  Deactivating will prevent this admin from accessing the
                  console.
                </p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  Activating will restore console access for this admin.
                </p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={() => setIsStatusOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant={statusAdmin.isActive ? 'danger' : 'primary'}
                onClick={handleStatusToggle}
                isLoading={isStatusSubmitting}
                isDisabled={isStatusSubmitting}
              >
                {statusAdmin.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
