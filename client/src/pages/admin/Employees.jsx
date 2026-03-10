import React, { useEffect, useMemo, useState } from 'react';
import api from '../../lib/api';
import {
  Button,
  LoadingSpinner,
  Modal,
  PageHeader,
  Table,
  Toast,
} from '../../components/ui';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Detail Modal
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Edit Status Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusEmployee, setStatusEmployee] = useState(null);
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  // Terminate Modal
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
  const [terminateEmployee, setTerminateEmployeeTarget] = useState(null);
  const [isTerminating, setIsTerminating] = useState(false);

  const departments = useMemo(() => {
    const depts = employees.map((e) => e.department).filter(Boolean);
    return [...new Set(depts)].sort();
  }, [employees]);

  const getEmployeeName = (employee) => {
    const givenName = employee?.name?.given_name || employee?.personalInfo?.givenName || '';
    const familyName = employee?.name?.family_name || employee?.personalInfo?.lastName || '';
    const fullName = `${givenName} ${familyName}`.trim();
    return fullName || employee?.email || 'Unknown';
  };

  const getStatusBadge = (employee) => {
    if (!employee.isActive) return { label: 'Inactive', class: 'bg-red-100 text-red-700' };
    if (!employee.isVerified) return { label: 'Pending', class: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Active', class: 'bg-green-100 text-green-700' };
  };

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      setError('');

      let query = `/employees?page=${page}&limit=20`;
      if (filterDept !== 'all') query += `&department=${encodeURIComponent(filterDept)}`;
      if (filterStatus !== 'all') query += `&status=${filterStatus}`;
      if (search.trim()) query += `&search=${encodeURIComponent(search.trim())}`;

      const res = await api.get(query);
      const list = res.data?.data || res.data || [];
      const pages = res.data?.totalPages || 1;
      const count = res.data?.total || list.length;

      setEmployees(Array.isArray(list) ? list : []);
      setTotalPages(pages);
      setTotal(count);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to load employees';
      setError(message);
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openDetail = async (employee) => {
    try {
      setIsDetailLoading(true);
      setIsDetailOpen(true);
      const res = await api.get(`/employees/${employee._id}`);
      setSelectedEmployee(res.data?.data || res.data || null);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to load employee details';
      setToast({ message, type: 'error' });
      setIsDetailOpen(false);
      setSelectedEmployee(null);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const openStatusModal = (employee) => {
    setStatusEmployee(employee);
    setIsStatusModalOpen(true);
  };

  const handleStatusToggle = async () => {
    if (!statusEmployee) return;
    try {
      setIsSubmittingStatus(true);
      const newStatus = !statusEmployee.isActive;
      await api.patch(`/employees/${statusEmployee._id}/status`, {
        isActive: newStatus,
      });
      setIsStatusModalOpen(false);
      await fetchEmployees();
      setToast({
        message: newStatus ? 'Employee activated.' : 'Employee deactivated.',
        type: 'success',
      });
    } catch (err) {
      setToast({
        message: err.response?.data?.error || 'Failed to update status.',
        type: 'error',
      });
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  const openTerminateModal = (employee) => {
    setTerminateEmployeeTarget(employee);
    setIsTerminateModalOpen(true);
  };

  const handleTerminate = async () => {
    if (!terminateEmployee) return;
    try {
      setIsTerminating(true);
      await api.delete(`/employees/${terminateEmployee._id}`);
      setIsTerminateModalOpen(false);
      await fetchEmployees();
      setToast({ message: 'Employee terminated.', type: 'success' });
    } catch (err) {
      setToast({
        message: err.response?.data?.error || 'Failed to terminate employee.',
        type: 'error',
      });
    } finally {
      setIsTerminating(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [filterDept, filterStatus, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchEmployees();
      } else {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const columns = [
    {
      key: 'name',
      label: 'Employee',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{getEmployeeName(row)}</div>
          <div className="text-xs text-gray-400">{row.email}</div>
        </div>
      ),
    },
    {
      key: 'department',
      label: 'Department',
      render: (row) => <span className="text-sm text-gray-700">{row.department || '-'}</span>,
    },
    {
      key: 'position',
      label: 'Position',
      render: (row) => (
        <span className="text-sm text-gray-600">{row.positionTitle || row.position || '-'}</span>
      ),
    },
    {
      key: 'employmentType',
      label: 'Type',
      render: (row) => (
        <span className="text-sm text-gray-500 capitalize">{row.classification || '-'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const badge = getStatusBadge(row);
        return (
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.class}`}
          >
            {badge.label}
          </span>
        );
      },
    },
    {
      key: 'hireDate',
      label: 'Joined',
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
          <Button size="sm" variant="ghost" onClick={() => openDetail(row)}>
            View
          </Button>
          <Button size="sm" variant="secondary" onClick={() => openStatusModal(row)}>
            {row.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          {row.isActive ? (
            <Button size="sm" variant="danger" onClick={() => openTerminateModal(row)}>
              Terminate
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const activeCount = employees.filter((e) => e.isActive && e.isVerified).length;
  const inactiveCount = employees.filter((e) => !e.isActive).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Employee Records"
        subtitle={`${total} employee${total !== 1 ? 's' : ''} total`}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Total Employees
          </div>
          <div className="text-2xl font-bold text-[#223B5B]">{total}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Active
          </div>
          <div className="text-2xl font-bold text-[#223B5B]">{activeCount}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Inactive
          </div>
          <div className="text-2xl font-bold text-[#223B5B]">{inactiveCount}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <input
          type="text"
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 w-64"
        />

        <select
          value={filterDept}
          onChange={(e) => {
            setFilterDept(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="all">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {error ? <p className="text-sm text-red-600 mb-3">{error}</p> : null}

      <Table
        data={employees}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No employees found."
      />

      {totalPages > 1 ? (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            isDisabled={page === 1}
          >
            Previous
          </Button>
          <span className="px-3 py-1 text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            isDisabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      ) : null}

      {toast ? (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      ) : null}

      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Employee Profile"
        size="lg"
      >
        {isDetailLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : selectedEmployee ? (
          <div className="space-y-5">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="w-14 h-14 rounded-full bg-[#223B5B] flex items-center justify-center text-white text-xl font-bold">
                {(selectedEmployee.personalInfo?.givenName || 'E').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">{getEmployeeName(selectedEmployee)}</p>
                <p className="text-sm text-gray-500">{selectedEmployee.email}</p>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      getStatusBadge(selectedEmployee).class
                    }`}
                  >
                    {getStatusBadge(selectedEmployee).label}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Department</p>
                <p className="text-gray-800 font-medium">{selectedEmployee.department || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Role</p>
                <p className="text-gray-800 font-medium">{selectedEmployee.role || '-'}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Position</p>
                <p className="text-gray-800 font-medium">
                  {selectedEmployee.positionTitle || selectedEmployee.position || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Email (secondary)</p>
                <p className="text-gray-800 font-medium">
                  {selectedEmployee.personalInfo?.email || selectedEmployee.contactInfo?.personalEmail || '-'}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Employment Type</p>
                <p className="text-gray-800 font-medium">{selectedEmployee.classification || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Address</p>
                <p className="text-gray-800 font-medium">
                  {selectedEmployee.contactInfo?.address?.addressLine || '-'}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Phone</p>
                <p className="text-gray-800 font-medium">
                  {selectedEmployee.personalInfo?.phone || selectedEmployee.contactInfo?.mainContactNo || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Emergency Contact</p>
                <p className="text-gray-800 font-medium">
                  {selectedEmployee.emergencyContact?.name || '-'}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Date of Birth</p>
                <p className="text-gray-800 font-medium">{selectedEmployee.personalInfo?.dateOfBirth || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Emergency Phone</p>
                <p className="text-gray-800 font-medium">
                  {selectedEmployee.emergencyContact?.phone || selectedEmployee.emergencyContact?.contact || '-'}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Civil Status</p>
                <p className="text-gray-800 font-medium">{selectedEmployee.personalInfo?.civilStatus || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">HMO Provider</p>
                <p className="text-gray-800 font-medium">{selectedEmployee.hmoInfo?.provider || '-'}</p>
              </div>
            </div>

            {selectedEmployee.governmentIds ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Government IDs
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">SSN</p>
                    <p className="text-gray-800">{selectedEmployee.governmentIds?.ssn || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">TIN</p>
                    <p className="text-gray-800">{selectedEmployee.governmentIds?.tin || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">SSS</p>
                    <p className="text-gray-800">{selectedEmployee.governmentIds?.sss || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Pag-IBIG</p>
                    <p className="text-gray-800">{selectedEmployee.governmentIds?.pagIbig || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">PhilHealth</p>
                    <p className="text-gray-800">{selectedEmployee.governmentIds?.philhealth || '-'}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">Encrypted - decrypted for admin view only</p>
              </div>
            ) : null}

            <div className="flex gap-2 justify-end mt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsDetailOpen(false);
                  openStatusModal(selectedEmployee);
                }}
              >
                {selectedEmployee.isActive ? 'Deactivate' : 'Activate'}
              </Button>
              {selectedEmployee.isActive ? (
                <Button
                  variant="danger"
                  onClick={() => {
                    setIsDetailOpen(false);
                    openTerminateModal(selectedEmployee);
                  }}
                >
                  Terminate
                </Button>
              ) : null}
              <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={statusEmployee?.isActive ? 'Deactivate Employee' : 'Activate Employee'}
        size="sm"
      >
        {statusEmployee ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to <strong>{statusEmployee.isActive ? 'deactivate' : 'activate'}</strong>{' '}
              <strong>{getEmployeeName(statusEmployee)}</strong>?
            </p>

            {statusEmployee.isActive ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  Deactivating will prevent this employee from logging in.
                </p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  Activating will restore login access for this employee.
                </p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setIsStatusModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant={statusEmployee.isActive ? 'danger' : 'primary'}
                onClick={handleStatusToggle}
                isLoading={isSubmittingStatus}
                isDisabled={isSubmittingStatus}
              >
                {statusEmployee.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={isTerminateModalOpen}
        onClose={() => setIsTerminateModalOpen(false)}
        title="Terminate Employee"
        size="sm"
      >
        {terminateEmployee ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              You are about to terminate <strong>{getEmployeeName(terminateEmployee)}</strong>.
            </p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800 font-medium">This will:</p>
              <ul className="text-xs text-red-700 mt-1 space-y-1 list-disc list-inside">
                <li>Immediately deactivate their account</li>
                <li>Block all system access</li>
                <li>Record termination date</li>
                <li>Their data will be preserved</li>
              </ul>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setIsTerminateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleTerminate}
                isLoading={isTerminating}
                isDisabled={isTerminating}
              >
                Confirm Terminate
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
