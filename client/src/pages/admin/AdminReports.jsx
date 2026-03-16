import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Loader } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>{children}</div>
);

export default function Reports() {
  const user = useAuthStore((state) => state.user);

  const [activeTab, setActiveTab] = useState('ats');
  const [reportData, setReportData] = useState(null);
  const [atsTrend, setAtsTrend] = useState([]);
  const [hiringTrend, setHiringTrend] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTrendLoading, setIsTrendLoading] = useState(false);
  const [isExporting, setIsExporting] = useState('');
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [department, setDepartment] = useState('');

  const getFilterParams = () => ({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    department: department.trim() || undefined,
  });

  // Fetch report data when tab changes
  useEffect(() => {
    fetchReportData(activeTab);
  }, [activeTab, dateFrom, dateTo, department]);

  useEffect(() => {
    if (activeTab !== 'ats') {
      return;
    }

    fetchATSTrends();
  }, [activeTab, dateFrom, dateTo, department]);

  const fetchReportData = async (reportType) => {
    setIsLoading(true);
    setError('');
    setReportData(null);

    try {
      const endpoints = {
        ats: '/reports/ats',
        headcount: '/reports/headcount',
        employees: '/reports/employees',
        training: '/reports/training',
      };

      const response = await api.get(endpoints[reportType], { params: getFilterParams() });
      setReportData(response.data.data);
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load report';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchATSTrends = async () => {
    setIsTrendLoading(true);

    try {
      const params = getFilterParams();
      const [atsRes, hiringRes] = await Promise.all([
        api.get('/reports/trends/ats', { params }),
        api.get('/reports/trends/hiring', { params }),
      ]);

      setAtsTrend(atsRes.data?.data || []);
      setHiringTrend(hiringRes.data?.data || []);
    } catch (err) {
      setAtsTrend([]);
      setHiringTrend([]);
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load trends';
      setError(message);
    } finally {
      setIsTrendLoading(false);
    }
  };

  const handleExport = async (format) => {
    setIsExporting(format);
    try {
      const response = await api.get(
        `/reports/export/${format}`,
        {
          params: { type: activeTab, ...getFilterParams() },
          responseType: 'blob',
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeTab}-report-${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || `Failed to export ${format.toUpperCase()}`);
    } finally {
      setIsExporting('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Analytics and reporting for HR operations</p>
        </div>
        <BarChart3 size={32} className="text-blue-600" />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white border border-gray-200 rounded-lg p-4">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded text-sm"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded text-sm"
        />
        <input
          type="text"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          placeholder="Department"
          className="px-3 py-2 border border-gray-300 rounded text-sm"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {['ats', 'headcount', 'employees', 'training'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'ats' && 'ATS Funnel'}
            {tab === 'headcount' && 'Headcount'}
            {tab === 'employees' && 'Employee Status'}
            {tab === 'training' && 'Training'}
          </button>
        ))}
      </div>

      {/* Export Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => handleExport('csv')}
          disabled={isExporting === 'csv' || isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isExporting === 'csv' ? <Loader size={18} className="animate-spin" /> : <Download size={18} />}
          {isExporting === 'csv' ? 'Exporting...' : 'Export CSV'}
        </button>
        <button
          onClick={() => handleExport('pdf')}
          disabled={isExporting === 'pdf' || isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          {isExporting === 'pdf' ? <Loader size={18} className="animate-spin" /> : <Download size={18} />}
          {isExporting === 'pdf' ? 'Exporting...' : 'Export PDF'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {typeof error === 'string' ? error : error?.message || 'An error occurred'}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader size={32} className="animate-spin text-blue-600" />
        </div>
      ) : null}

      {/* ATS Funnel Tab */}
      {activeTab === 'ats' && !isLoading && (
        <div className="space-y-6">
          {reportData ? (
            <>
              <Card>
                <h2 className="text-lg font-bold mb-4">ATS Pipeline Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'].map((stage) => (
                    <div
                      key={stage}
                      className={`p-4 rounded text-center ${
                        stage === 'hired'
                          ? 'bg-green-100'
                          : stage === 'rejected'
                            ? 'bg-red-100'
                            : 'bg-blue-100'
                      }`}
                    >
                      <div className="text-2xl font-bold text-gray-900">{reportData?.[stage] || 0}</div>
                      <div className="text-sm text-gray-600 capitalize">{stage}</div>
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <h3 className="text-lg font-bold mb-2">Total Applicants</h3>
                <p className="text-3xl font-bold text-blue-600">{reportData?.total || 0}</p>
              </Card>

              <Card>
                <h3 className="text-lg font-bold mb-4">ATS Trend (Last 12 Months)</h3>
                {isTrendLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader size={16} className="animate-spin" /> Loading trends...
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium">Month</th>
                          <th className="px-4 py-2 text-left font-medium">Applications</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(atsTrend || []).map((row, idx) => (
                          <tr key={`${row.month}-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-2">{row.month}</td>
                            <td className="px-4 py-2">{row.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              <Card>
                <h3 className="text-lg font-bold mb-4">Hiring Trend (Last 12 Months)</h3>
                {isTrendLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader size={16} className="animate-spin" /> Loading trends...
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium">Month</th>
                          <th className="px-4 py-2 text-left font-medium">Hired</th>
                          <th className="px-4 py-2 text-left font-medium">Rejected</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(hiringTrend || []).map((row, idx) => (
                          <tr key={`${row.month}-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-2">{row.month}</td>
                            <td className="px-4 py-2">{row.hired}</td>
                            <td className="px-4 py-2">{row.rejected}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </>
          ) : (
            <Card>
              <p className="text-gray-500">No data available</p>
            </Card>
          )}
        </div>
      )}

      {/* Headcount Tab */}
      {activeTab === 'headcount' && !isLoading && (
        reportData ? (
          <Card>
            <h2 className="text-lg font-bold mb-4">Headcount by Department</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Department</th>
                    <th className="px-4 py-2 text-center font-medium">Total</th>
                    <th className="px-4 py-2 text-center font-medium">Active</th>
                    <th className="px-4 py-2 text-center font-medium">Inactive</th>
                  </tr>
                </thead>
                <tbody>
                  {(reportData?.departments || []).map((dept, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2">{dept.department}</td>
                      <td className="px-4 py-2 text-center font-bold">{dept.total}</td>
                      <td className="px-4 py-2 text-center text-green-700">{dept.active}</td>
                      <td className="px-4 py-2 text-center text-red-700">{dept.inactive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card>
            <p className="text-gray-500">No data available</p>
          </Card>
        )
      )}

      {/* Employee Status Tab */}
      {activeTab === 'employees' && !isLoading && (
        reportData ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <div className="text-sm text-gray-600">Total Employees</div>
                <div className="text-3xl font-bold text-blue-600">{reportData?.summary?.total || reportData?.total || 0}</div>
              </Card>
              <Card>
                <div className="text-sm text-gray-600">Active</div>
                <div className="text-3xl font-bold text-green-600">{reportData?.summary?.active || reportData?.active || 0}</div>
              </Card>
              <Card>
                <div className="text-sm text-gray-600">Inactive</div>
                <div className="text-3xl font-bold text-orange-600">{reportData?.summary?.inactive || reportData?.inactive || 0}</div>
              </Card>
              <Card>
                <div className="text-sm text-gray-600">Terminated</div>
                <div className="text-3xl font-bold text-red-600">{reportData?.summary?.terminated || reportData?.terminated || 0}</div>
              </Card>
            </div>

            {/* Employee List */}
            <Card>
              <h2 className="text-lg font-bold mb-4">Employee List</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Name</th>
                      <th className="px-4 py-2 text-left font-medium">Department</th>
                      <th className="px-4 py-2 text-left font-medium">Position</th>
                      <th className="px-4 py-2 text-center font-medium">Status</th>
                      <th className="px-4 py-2 text-left font-medium">Start Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData?.employees || []).map((emp, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2">{emp.name}</td>
                        <td className="px-4 py-2">{emp.department}</td>
                        <td className="px-4 py-2">{emp.position}</td>
                        <td className="px-4 py-2 text-center">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              emp.status === 'Active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {emp.status}
                          </span>
                        </td>
                        <td className="px-4 py-2">{emp.startDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        ) : (
          <Card>
            <p className="text-gray-500">No data available</p>
          </Card>
        )
      )}

      {/* Training Tab */}
      {activeTab === 'training' && !isLoading && (
        reportData ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <div className="text-sm text-gray-600">Total Programs</div>
                <div className="text-2xl font-bold text-blue-600">{reportData?.summary?.totalPrograms || reportData?.totalPrograms || 0}</div>
              </Card>
              <Card>
                <div className="text-sm text-gray-600">Total Assignments</div>
                <div className="text-2xl font-bold text-blue-600">{reportData?.summary?.totalAssignments || reportData?.totalAssignments || 0}</div>
              </Card>
              <Card>
                <div className="text-sm text-gray-600">Completed</div>
                <div className="text-2xl font-bold text-green-600">{reportData?.summary?.completed || reportData?.completed || 0}</div>
              </Card>
              <Card>
                <div className="text-sm text-gray-600">Pending</div>
                <div className="text-2xl font-bold text-orange-600">{reportData?.summary?.pending || reportData?.pending || 0}</div>
              </Card>
              <Card>
                <div className="text-sm text-gray-600">Overdue</div>
                <div className="text-2xl font-bold text-red-600">{reportData?.summary?.overdue || reportData?.overdue || 0}</div>
              </Card>
            </div>

            {/* Assignment List */}
            <Card>
              <h2 className="text-lg font-bold mb-4">Training Assignments</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Employee</th>
                      <th className="px-4 py-2 text-left font-medium">Training</th>
                      <th className="px-4 py-2 text-center font-medium">Status</th>
                      <th className="px-4 py-2 text-left font-medium">Completion Date</th>
                      <th className="px-4 py-2 text-left font-medium">Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData?.assignments || []).map((assign, idx) => {
                      const isOverdue = new Date(assign.expiryDate) < new Date() && assign.status !== 'completed';
                      return (
                        <tr
                          key={idx}
                          className={
                            isOverdue
                              ? 'bg-red-50'
                              : idx % 2 === 0
                                ? 'bg-white'
                                : 'bg-gray-50'
                          }
                        >
                          <td className="px-4 py-2">{assign.employeeName}</td>
                          <td className="px-4 py-2">{assign.trainingName}</td>
                          <td className="px-4 py-2 text-center">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                assign.status === 'completed'
                                  ? 'bg-green-100 text-green-700'
                                  : assign.status === 'pending'
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {assign.status}
                            </span>
                          </td>
                          <td className="px-4 py-2">{assign.completionDate}</td>
                          <td className={`px-4 py-2 ${isOverdue ? 'text-red-700 font-bold' : ''}`}>
                            {assign.expiryDate}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        ) : (
          <Card>
            <p className="text-gray-500">No data available</p>
          </Card>
        )
      )}
    </div>
  );
}
