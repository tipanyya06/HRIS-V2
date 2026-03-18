import React, { useEffect, useRef, useState } from 'react';
import api from '../../lib/api';
import {
  Button,
  LoadingSpinner,
  Modal,
  PageHeader,
  Toast,
} from '../../components/ui';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [departments, setDepartments] = useState([]);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const searchTimeout = useRef(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Detail Modal
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [profileTab, setProfileTab] = useState('personal');

  // Edit Status Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusEmployee, setStatusEmployee] = useState(null);
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  // Terminate Modal
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
  const [terminateEmployee, setTerminateEmployeeTarget] = useState(null);
  const [isTerminating, setIsTerminating] = useState(false);

  const getEmployeeName = (employee) => {
    const givenName = employee?.personalInfo?.firstName || employee?.personalInfo?.givenName || '';
    const familyName = employee?.name?.family_name || employee?.personalInfo?.lastName || '';
    const fullName = employee?.personalInfo?.fullName || `${givenName} ${familyName}`.trim();
    return fullName || employee?.email || 'Unknown';
  };

  const getStatusBadge = (employee) => {
    const status = employee?.status || (employee?.isActive ? 'active' : 'inactive');
    if (status === 'active') return { label: 'Active', class: 'bg-green-100 text-green-700' };
    if (status === 'inactive') return { label: 'Inactive', class: 'bg-red-100 text-red-700' };
    if (status === 'on-leave') return { label: 'On leave', class: 'bg-amber-100 text-amber-700' };
    if (status === 'terminated') return { label: 'Terminated', class: 'bg-gray-100 text-gray-600' };
    return { label: status, class: 'bg-gray-100 text-gray-600' };
  };

  const getParams = () => ({
    ...(search && { search }),
    ...(filterDept && { department: filterDept }),
    ...(filterStatus && { status: filterStatus }),
    ...(employmentType && { employmentType }),
    page,
    limit: 10,
    sortBy,
    sortOrder,
  });

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 400);
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      setError('');
      const res = await api.get('/employees', { params: getParams() });
      const data = res.data?.data || {};
      setEmployees(Array.isArray(data.employees) ? data.employees : []);
      setPagination(data.pagination || null);
      setDepartments(Array.isArray(data.meta?.departments) ? data.meta.departments : []);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to load employees';
      setError(message);
      setEmployees([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  };

  const openDetail = async (employee) => {
    try {
      setIsDetailLoading(true);
      setProfileTab('personal');
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
  }, [search, filterDept, filterStatus, employmentType, page, sortBy, sortOrder]);

  useEffect(() => {
    setPage(1);
  }, [search, filterDept, filterStatus, employmentType]);

  useEffect(() => () => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
  }, []);

  const activeCount = employees.filter((e) => (e.status || '').toLowerCase() === 'active').length;
  const inactiveCount = employees.filter((e) => (e.status || '').toLowerCase() === 'inactive').length;
  const total = pagination?.total || 0;
  const filtersApplied = search || filterDept || filterStatus || employmentType;

  return (
    <div className="w-full px-6 py-5 flex flex-col gap-4">
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
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Filters</span>
        <input
          type="text"
          placeholder="Search name, email, department..."
          value={searchInput}
          onChange={handleSearchChange}
          className="h-[32px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5] min-w-[220px]"
        />

        <select
          value={filterDept}
          onChange={(e) => {
            setFilterDept(e.target.value);
            setPage(1);
          }}
          className="h-[32px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5]"
        >
          <option value="">All departments</option>
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
          className="h-[32px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5]"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="on-leave">On leave</option>
          <option value="terminated">Terminated</option>
        </select>

        <select
          value={employmentType}
          onChange={(e) => {
            setEmploymentType(e.target.value);
            setPage(1);
          }}
          className="h-[32px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5]"
        >
          <option value="">All types</option>
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
          <option value="Contract">Contract</option>
          <option value="Probationary">Probationary</option>
        </select>

        <button
          onClick={() => {
            setSearchInput('');
            setSearch('');
            setFilterDept('');
            setFilterStatus('');
            setEmploymentType('');
            setPage(1);
          }}
          className="text-[12px] text-[#185FA5] border border-gray-200 rounded-md px-3 h-[30px] bg-white hover:bg-gray-50 whitespace-nowrap"
        >
          Reset
        </button>

        {filtersApplied ? (
          <span className="text-[11px] text-amber-600 font-medium">Filtered results</span>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold">Sort</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-[32px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5]"
          >
            <option value="createdAt">Created</option>
            <option value="department">Department</option>
            <option value="status">Status</option>
            <option value="dateOfEmployment">Start date</option>
            <option value="personalInfo.lastName">Last name</option>
            <option value="personalInfo.firstName">First name</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="h-[32px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5]"
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600 mb-3">{error}</p> : null}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">Employee</th>
              <th
                className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 cursor-pointer hover:text-[#185FA5]"
                onClick={() => toggleSort('department')}
              >
                Department{sortBy === 'department' ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : ''}
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">Position</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">Type</th>
              <th
                className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 cursor-pointer hover:text-[#185FA5]"
                onClick={() => toggleSort('status')}
              >
                Status{sortBy === 'status' ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : ''}
              </th>
              <th
                className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 cursor-pointer hover:text-[#185FA5]"
                onClick={() => toggleSort('dateOfEmployment')}
              >
                Start date{sortBy === 'dateOfEmployment' ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : ''}
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="px-4 py-3" colSpan={7}>
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
                  </td>
                </tr>
              ))
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[13px] text-gray-400">
                  No employees found
                </td>
              </tr>
            ) : (
              employees.map((emp) => {
                const badge = getStatusBadge(emp);
                const displayName = getEmployeeName(emp);
                const initials = `${emp?.personalInfo?.firstName?.[0] || emp?.personalInfo?.givenName?.[0] || ''}${emp?.personalInfo?.lastName?.[0] || ''}`;
                return (
                  <tr key={emp._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {emp.avatarUrl ? (
                          <img src={emp.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[11px] font-semibold text-blue-700 flex-shrink-0">
                            {initials}
                          </div>
                        )}
                        <div>
                          <div className="text-[13px] font-medium text-[#1a3a5c]">{displayName || '—'}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5">{emp.companyEmail || emp.email || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-gray-700">{emp.department || '—'}</td>
                    <td className="px-4 py-3 text-[13px] text-gray-700">{emp.positionTitle || emp.position || '—'}</td>
                    <td className="px-4 py-3 text-[13px] text-gray-700">{emp.employmentType || emp.classification || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.class}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-gray-500">
                      {emp.dateOfEmployment ? new Date(emp.dateOfEmployment).toLocaleDateString('en-PH') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        <Button size="sm" variant="ghost" onClick={() => openDetail(emp)}>
                          View
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => openStatusModal(emp)}>
                          {emp.status === 'active' || emp.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        {emp.status === 'active' || emp.isActive ? (
                          <Button size="sm" variant="danger" onClick={() => openTerminateModal(emp)}>
                            Terminate
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination ? (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
          <span className="text-[12px] text-gray-500">
            Showing <span className="font-medium text-gray-700">{total === 0 ? 0 : ((pagination.page - 1) * pagination.limit) + 1}</span>
            {' '}–{' '}
            <span className="font-medium text-gray-700">{Math.min(pagination.page * pagination.limit, pagination.total)}</span>
            {' '}of{' '}
            <span className="font-medium text-gray-700">{pagination.total}</span> employees
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPrevPage}
              className="h-[30px] px-3 border border-gray-200 rounded-md text-[12px] text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <span className="text-[12px] text-gray-600 px-2">
              {pagination.page} / {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(Math.max(pagination.totalPages || 1, 1), p + 1))}
              disabled={!pagination.hasNextPage}
              className="h-[30px] px-3 border border-gray-200 rounded-md text-[12px] text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      ) : null}

      {toast ? (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      ) : null}

      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Employee Profile"
        size="3xl"
      >
        {isDetailLoading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : selectedEmployee ? (
          <div className="flex -mx-6 -mb-6 -mt-4" style={{ minHeight: '560px' }}>

            {/* LEFT SIDEBAR */}
            <div className="w-60 flex-shrink-0 bg-[#1e3a5f] flex flex-col items-center py-8 px-5 rounded-bl-lg">

              {/* Avatar */}
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/20 mb-4">
                {selectedEmployee.profilePicUrl ? (
                  <img src={selectedEmployee.profilePicUrl} alt={getEmployeeName(selectedEmployee)} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#2596BE] flex items-center justify-center text-white text-3xl font-bold">
                    {(selectedEmployee.personalInfo?.givenName || 'E').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name + email + status */}
              <p className="text-white font-semibold text-sm text-center leading-snug">{getEmployeeName(selectedEmployee)}</p>
              <p className="text-white/50 text-xs text-center mt-1 mb-2">{selectedEmployee.email}</p>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-5 ${getStatusBadge(selectedEmployee).class}`}>
                {getStatusBadge(selectedEmployee).label}
              </span>

              {/* Divider */}
              <div className="w-full border-t border-white/10 mb-5" />

              {/* Info fields */}
              <div className="w-full space-y-4 text-left">
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mb-0.5">Department</p>
                  <p className="text-white text-sm font-medium">{selectedEmployee.department || '-'}</p>
                </div>
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mb-0.5">Position</p>
                  <p className="text-white text-sm font-medium">{selectedEmployee.positionTitle || selectedEmployee.position || '-'}</p>
                </div>
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mb-0.5">Classification</p>
                  <p className="text-white text-sm font-medium">{selectedEmployee.classification || '-'}</p>
                </div>
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mb-0.5">Role</p>
                  <p className="text-white text-sm font-medium capitalize">{selectedEmployee.role || '-'}</p>
                </div>
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Action buttons */}
              <div className="w-full space-y-2 pt-4">
                <button
                  onClick={() => { setIsDetailOpen(false); openStatusModal(selectedEmployee); }}
                  className="w-full px-3 py-2 text-xs font-semibold bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors border border-white/10"
                >
                  {selectedEmployee.isActive ? 'Deactivate' : 'Activate'}
                </button>
                {selectedEmployee.isActive ? (
                  <button
                    onClick={() => { setIsDetailOpen(false); openTerminateModal(selectedEmployee); }}
                    className="w-full px-3 py-2 text-xs font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Terminate
                  </button>
                ) : null}
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors border border-white/10"
                >
                  Close
                </button>
              </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="flex-1 flex flex-col overflow-hidden border-l border-gray-100">

              {/* Tab bar */}
              <div className="flex border-b border-gray-200 px-6 bg-white flex-shrink-0 overflow-x-auto">
                {[
                  { key: 'personal', label: 'Personal Info' },
                  { key: 'contact', label: 'Contact & Emergency' },
                  { key: 'employment', label: 'Employment Info' },
                  { key: 'government', label: 'Government IDs' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setProfileTab(tab.key)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap mr-1 ${
                      profileTab === tab.key
                        ? 'border-[#1e3a5f] text-[#1e3a5f]'
                        : 'border-transparent text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto px-8 py-6 bg-gray-50">

                {/* Personal Info */}
                {profileTab === 'personal' && (
                  <div className="grid grid-cols-2 gap-x-10 gap-y-6">
                    {[
                      { label: 'Given Name', value: selectedEmployee.personalInfo?.givenName },
                      { label: 'Last Name', value: selectedEmployee.personalInfo?.lastName || selectedEmployee.personalInfo?.surname },
                      { label: 'Middle Name', value: selectedEmployee.personalInfo?.middleName },
                      { label: 'Date of Birth', value: selectedEmployee.personalInfo?.dateOfBirth },
                      { label: 'Gender', value: selectedEmployee.personalInfo?.gender },
                      { label: 'Civil Status', value: selectedEmployee.personalInfo?.civilStatus },
                      { label: 'Religion', value: selectedEmployee.personalInfo?.religion },
                      { label: 'Blood Type', value: selectedEmployee.bloodType || selectedEmployee.personalInfo?.bloodType },
                      { label: 'Willing to Donate', value: selectedEmployee.bloodDonorConsent ? 'Yes' : 'No' },
                      { label: 'Nationality', value: selectedEmployee.personalInfo?.nationality },
                    ].map(field => (
                      <div key={field.label} className="bg-white rounded-lg px-4 py-3 border border-gray-100">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">{field.label}</p>
                        <p className="text-gray-800 font-semibold text-sm">{field.value || '-'}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Contact & Emergency */}
                {profileTab === 'contact' && (
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Contact Details</p>
                      <div className="grid grid-cols-2 gap-x-10 gap-y-4">
                        {[
                          { label: 'Personal Email', value: selectedEmployee.personalInfo?.email || selectedEmployee.contactInfo?.personalEmail },
                          { label: 'Company Email', value: selectedEmployee.email },
                          { label: 'Main Contact No', value: selectedEmployee.contactInfo?.mainContactNo },
                          { label: 'Alternative Contact No', value: selectedEmployee.contactInfo?.alternativeContactNo },
                          { label: 'Address Line', value: selectedEmployee.contactInfo?.address?.addressLine },
                          { label: 'City', value: selectedEmployee.contactInfo?.address?.city },
                          { label: 'Province', value: selectedEmployee.contactInfo?.address?.province },
                          { label: 'Zip Code', value: selectedEmployee.contactInfo?.address?.zipCode },
                          { label: 'Country', value: selectedEmployee.contactInfo?.address?.country },
                        ].map(field => (
                          <div key={field.label} className="bg-white rounded-lg px-4 py-3 border border-gray-100">
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">{field.label}</p>
                            <p className="text-gray-800 font-semibold text-sm">{field.value || '-'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Emergency Contact</p>
                      <div className="grid grid-cols-2 gap-x-10 gap-y-4">
                        {[
                          { label: 'Name', value: selectedEmployee.emergencyContact?.name },
                          { label: 'Relationship', value: selectedEmployee.emergencyContact?.relationship },
                          { label: 'Contact Number', value: selectedEmployee.emergencyContact?.contact || selectedEmployee.emergencyContact?.phone },
                          { label: 'Address', value: typeof selectedEmployee.emergencyContact?.address === 'object'
                            ? [selectedEmployee.emergencyContact?.address?.addressLine, selectedEmployee.emergencyContact?.address?.city, selectedEmployee.emergencyContact?.address?.country].filter(Boolean).join(', ')
                            : selectedEmployee.emergencyContact?.address },
                        ].map(field => (
                          <div key={field.label} className="bg-white rounded-lg px-4 py-3 border border-gray-100">
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">{field.label}</p>
                            <p className="text-gray-800 font-semibold text-sm">{field.value || '-'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Employment Info */}
                {profileTab === 'employment' && (
                  <div className="grid grid-cols-2 gap-x-10 gap-y-4">
                    {[
                      { label: 'Department', value: selectedEmployee.department },
                      { label: 'Position', value: selectedEmployee.positionTitle || selectedEmployee.position },
                      { label: 'Classification', value: selectedEmployee.classification },
                      { label: 'Role', value: selectedEmployee.role },
                      { label: 'Hire Date', value: selectedEmployee.dateOfEmployment || selectedEmployee.hireDate
                        ? new Date(selectedEmployee.dateOfEmployment || selectedEmployee.hireDate).toLocaleDateString()
                        : '-' },
                      { label: 'Years of Service', value: (() => {
                        const start = new Date(selectedEmployee.dateOfEmployment || selectedEmployee.hireDate || selectedEmployee.createdAt);
                        const now = new Date();
                        const years = Math.floor((now - start) / (365.25 * 24 * 60 * 60 * 1000));
                        const months = Math.floor(((now - start) % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
                        return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
                      })() },
                      { label: 'HMO Provider', value: selectedEmployee.hmoInfo?.provider },
                      { label: 'Allowance Type', value: selectedEmployee.payrollInfo?.allowanceType },
                      { label: 'Allowance Amount', value: selectedEmployee.payrollInfo?.allowanceAmount
                        ? `₱${Number(selectedEmployee.payrollInfo.allowanceAmount).toLocaleString()}`
                        : '-' },
                    ].map(field => (
                      <div key={field.label} className="bg-white rounded-lg px-4 py-3 border border-gray-100">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">{field.label}</p>
                        <p className="text-gray-800 font-semibold text-sm">{field.value || '-'}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Government IDs */}
                {profileTab === 'government' && (
                  selectedEmployee.governmentIds ? (
                    <div>
                      <div className="grid grid-cols-2 gap-x-10 gap-y-4">
                        {[
                          { label: 'SSN', value: selectedEmployee.governmentIds?.ssn },
                          { label: 'TIN', value: selectedEmployee.governmentIds?.tin },
                          { label: 'SSS', value: selectedEmployee.governmentIds?.sss },
                          { label: 'Pag-IBIG', value: selectedEmployee.governmentIds?.pagIbig },
                          { label: 'PhilHealth', value: selectedEmployee.governmentIds?.philhealth },
                        ].map(field => (
                          <div key={field.label} className="bg-white rounded-lg px-4 py-3 border border-gray-100">
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">{field.label}</p>
                            <p className="text-gray-800 font-semibold text-sm">{field.value || '-'}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-6">🔒 Encrypted — decrypted for admin view only</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No government ID information available.</p>
                  )
                )}

              </div>
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
