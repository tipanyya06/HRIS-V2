import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Button, PageHeader, Table, Toast, LoadingSpinner } from '../../components/ui';

const extractErrorMessage = (err, fallback) => {
  const message = err?.response?.data?.error;
  if (typeof message === 'string') return message;
  if (typeof message?.message === 'string') return message.message;
  return fallback;
};

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterResource, setFilterResource] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const getActionBadge = (action) => {
    const map = {
      CREATE: { label: 'Create', class: 'bg-green-100 text-green-700' },
      UPDATE: { label: 'Update', class: 'bg-blue-100 text-blue-700' },
      DELETE: { label: 'Delete', class: 'bg-red-100 text-red-700' },
      LOGIN: { label: 'Login', class: 'bg-purple-100 text-purple-700' },
      LOGOUT: { label: 'Logout', class: 'bg-gray-100 text-gray-600' },
      ACTIVATE: { label: 'Activate', class: 'bg-teal-100 text-teal-700' },
      DEACTIVATE: { label: 'Deactivate', class: 'bg-orange-100 text-orange-700' },
      TERMINATE: { label: 'Terminate', class: 'bg-red-100 text-red-800' },
      STAGE_CHANGE: { label: 'Stage Change', class: 'bg-yellow-100 text-yellow-700' },
    };
    return map[action] || { label: action, class: 'bg-gray-100 text-gray-600' };
  };

  const getResourceBadge = (resource) => {
    const map = {
      employee: 'bg-blue-50 text-blue-600',
      admin: 'bg-purple-50 text-purple-600',
      job: 'bg-green-50 text-green-600',
      application: 'bg-yellow-50 text-yellow-600',
      interview: 'bg-teal-50 text-teal-600',
    };
    return map[resource] || 'bg-gray-50 text-gray-500';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  const getActiveFilters = () => {
    const filters = {};
    if (search.trim()) filters.search = search.trim();
    if (filterResource !== 'all') filters.resource = filterResource;
    if (filterAction !== 'all') filters.action = filterAction;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    return filters;
  };

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const response = await api.get('/logs/export/csv', {
        params: getActiveFilters(),
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      const today = new Date().toISOString().split('T')[0];
      link.href = url;
      link.setAttribute('download', `activity-logs-${today}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to export activity logs'));
    } finally {
      setIsExporting(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      setError('');

      let query = `/logs?page=${page}&limit=50`;
      if (filterResource !== 'all') query += `&resource=${filterResource}`;
      if (filterAction !== 'all') query += `&action=${filterAction}`;
      if (dateFrom) query += `&dateFrom=${dateFrom}`;
      if (dateTo) query += `&dateTo=${dateTo}`;
      if (search.trim()) query += `&search=${encodeURIComponent(search.trim())}`;

      const res = await api.get(query);
      const list = res.data?.data || res.data || [];
      setLogs(Array.isArray(list) ? list : []);
      setTotalPages(res.data?.totalPages || 1);
      setTotal(res.data?.total || list.length);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load activity logs'));
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterResource, filterAction, dateFrom, dateTo, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchLogs();
      } else {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const columns = [
    {
      key: 'createdAt',
      label: 'Timestamp',
      render: (row) => (
        <span className="text-sm text-gray-500 whitespace-nowrap">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      key: 'user',
      label: 'User',
      render: (row) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{row.userEmail || 'system'}</div>
          <div className="text-xs text-gray-400 capitalize">{row.userRole || '-'}</div>
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (row) => {
        const badge = getActionBadge(row.action);
        return (
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${badge.class}`}
          >
            {badge.label}
          </span>
        );
      },
    },
    {
      key: 'resource',
      label: 'Resource',
      render: (row) => (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${getResourceBadge(row.resource)}`}
        >
          {row.resource || '-'}
        </span>
      ),
    },
    {
      key: 'details',
      label: 'Details',
      render: (row) => (
        <span className="text-sm text-gray-600 max-w-xs truncate block">{row.details || '-'}</span>
      ),
    },
    {
      key: 'ip',
      label: 'IP Address',
      render: (row) => <span className="text-xs text-gray-400 font-mono">{row.ip || '-'}</span>,
    },
    {
      key: 'view',
      label: 'View',
      render: (row) => (
        <Button size="sm" variant="secondary" onClick={() => setSelectedLog(row)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title="Activity Logs" subtitle={`${total} log${total !== 1 ? 's' : ''} total`} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Logs</div>
          <div className="text-2xl font-bold text-[#223B5B]">{total}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Creates</div>
          <div className="text-2xl font-bold text-[#223B5B]">
            {logs.filter((l) => l.action === 'CREATE').length}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Updates</div>
          <div className="text-2xl font-bold text-[#223B5B]">
            {logs.filter((l) => l.action === 'UPDATE').length}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Deletes + Terminates
          </div>
          <div className="text-2xl font-bold text-[#223B5B]">
            {logs.filter((l) => l.action === 'DELETE' || l.action === 'TERMINATE').length}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <input
          type="text"
          placeholder="Search email, details, resource..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 w-64"
        />

        <select
          value={filterResource}
          onChange={(e) => {
            setFilterResource(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="all">All Resources</option>
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
          <option value="job">Job</option>
          <option value="application">Application</option>
          <option value="interview">Interview</option>
        </select>

        <select
          value={filterAction}
          onChange={(e) => {
            setFilterAction(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="all">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="ACTIVATE">Activate</option>
          <option value="DEACTIVATE">Deactivate</option>
          <option value="TERMINATE">Terminate</option>
          <option value="LOGIN">Login</option>
          <option value="STAGE_CHANGE">Stage Change</option>
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        />

        <input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        />

        {(filterResource !== 'all' || filterAction !== 'all' || dateFrom || dateTo || search) ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setFilterResource('all');
              setFilterAction('all');
              setDateFrom('');
              setDateTo('');
              setSearch('');
              setPage(1);
            }}
          >
            Clear Filters
          </Button>
        ) : null}

        <Button
          size="sm"
          variant="primary"
          onClick={handleExportCsv}
          isLoading={isExporting}
          isDisabled={isLoading || isExporting}
        >
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </div>

      {error ? <p className="text-sm text-red-600 mb-3">{error}</p> : null}

      {isLoading && logs.length === 0 ? (
        <div className="mb-3">
          <LoadingSpinner message="Loading activity logs..." />
        </div>
      ) : null}

      <Table data={logs} columns={columns} isLoading={isLoading} emptyMessage="No activity logs found." />

      {totalPages > 1 ? (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
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
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            isDisabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      ) : null}

      {selectedLog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white border border-gray-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Log Details</h3>
              <Button size="sm" variant="secondary" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
            <div className="px-6 py-4 space-y-3 text-sm">
              <div><span className="font-semibold text-gray-700">Timestamp:</span> {formatDate(selectedLog.createdAt)}</div>
              <div><span className="font-semibold text-gray-700">User:</span> {selectedLog.userId || 'system'}</div>
              <div><span className="font-semibold text-gray-700">Email:</span> {selectedLog.userEmail || 'system'}</div>
              <div><span className="font-semibold text-gray-700">Role:</span> {selectedLog.userRole || '-'}</div>
              <div><span className="font-semibold text-gray-700">Action:</span> {selectedLog.action || '-'}</div>
              <div><span className="font-semibold text-gray-700">Resource:</span> {selectedLog.resource || '-'}</div>
              <div><span className="font-semibold text-gray-700">Resource ID:</span> {selectedLog.resourceId || '-'}</div>
              <div><span className="font-semibold text-gray-700">Details:</span> {selectedLog.details || '-'}</div>
              <div><span className="font-semibold text-gray-700">IP Address:</span> {selectedLog.ip || '-'}</div>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} /> : null}
    </div>
  );
}