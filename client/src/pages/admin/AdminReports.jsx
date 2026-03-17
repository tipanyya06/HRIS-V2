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
  const [customFields, setCustomFields] = useState([]);
  const [customReportName, setCustomReportName] = useState('Custom Report');
  const [customFilters, setCustomFilters] = useState({
    countryOfEmployment: '',
  });
  const [customData, setCustomData] = useState([]);
  const [isCustomLoading, setIsCustomLoading] = useState(false);
  const [pesoData, setPesoData] = useState([]);
  const [isPesoLoading, setIsPesoLoading] = useState(false);

  const AVAILABLE_FIELDS = [
    { category: 'Personal', fields: ['Full Name', 'Given Name', 'Last Name', 'Middle Name', 'Date of Birth', 'Sex', 'Civil Status', 'Religion', 'Nationality'] },
    { category: 'Contact', fields: ['Personal Email', 'Company Email', 'Main Contact No', 'Address'] },
    { category: 'Employment', fields: ['Department', 'Position', 'Classification', 'Country of Employment', 'Date of Employment'] },
    { category: 'Government IDs', fields: ['SSS', 'TIN', 'Pag-IBIG', 'PhilHealth'] },
    { category: 'HMO', fields: ['Blood Type', 'HMO Provider', 'HMO Card Number'] },
    { category: 'Emergency Contact', fields: ['Emergency Contact Name', 'Emergency Contact No', 'Emergency Relationship'] },
    { category: 'Education', fields: ['School', 'Course', 'Attainment'] },
    { category: 'Payroll', fields: ['Bank Name', 'Account Name'] },
  ];

  const getFilterParams = () => ({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    department: department.trim() || undefined,
  });

  // Fetch report data when tab changes
  useEffect(() => {
    if (['ats', 'headcount', 'employees', 'training'].includes(activeTab)) {
      fetchReportData(activeTab);
    }
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

  const fetchCustomReport = async () => {
    if (!customFields.length) return;
    setIsCustomLoading(true);
    try {
      const res = await api.post('/reports/custom', {
        fields: customFields,
        filters: { ...getFilterParams(), ...customFilters },
      });
      setCustomData(res.data.data || []);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load custom report');
    } finally {
      setIsCustomLoading(false);
    }
  };

  const fetchPesoReport = async () => {
    setIsPesoLoading(true);
    try {
      const res = await api.get('/reports/peso', {
        params: { ...getFilterParams(), ...customFilters },
      });
      setPesoData(res.data.data || []);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load PESO report');
    } finally {
      setIsPesoLoading(false);
    }
  };

  const handleCustomExport = async (format) => {
    setIsExporting(`${format}-custom`);
    try {
      const res = await api.post(
        `/reports/custom/export/${format}`,
        {
          fields: customFields,
          filters: { ...getFilterParams(), ...customFilters },
          reportName: customReportName,
        },
        { responseType: 'blob' }
      );
      const ext = format === 'xlsx' ? 'xlsx' : format === 'pdf' ? 'pdf' : 'csv';
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${customReportName}-${new Date().toISOString().split('T')[0]}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export custom report');
    } finally {
      setIsExporting('');
    }
  };

  const handlePesoExport = async (format) => {
    setIsExporting(`${format}-peso`);
    try {
      const res = await api.post(
        `/reports/peso/export/${format}`,
        { filters: { ...getFilterParams(), ...customFilters } },
        { responseType: 'blob' }
      );
      const ext = format === 'xlsx' ? 'xlsx' : format === 'pdf' ? 'pdf' : 'csv';
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `PESO-Report-${new Date().toISOString().split('T')[0]}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export PESO report');
    } finally {
      setIsExporting('');
    }
  };

  useEffect(() => {
    if (activeTab === 'peso') fetchPesoReport();
  }, [activeTab]);

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
      link.setAttribute('download', `${activeTab}-report-${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : format === 'xlsx' ? 'xlsx' : 'pdf'}`);
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
        {['ats', 'headcount', 'employees', 'training', 'custom', 'peso'].map((tab) => (
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
            {tab === 'custom' && 'Custom Report'}
            {tab === 'peso' && 'PESO Report'}
          </button>
        ))}
      </div>

      {/* Global Export Bar */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => {
            if (activeTab === 'custom') handleCustomExport('csv');
            else if (activeTab === 'peso') handlePesoExport('csv');
            else handleExport('csv');
          }}
          disabled={
            (activeTab === 'peso' && !pesoData.length) ||
            !!isExporting || (activeTab !== 'custom' && isLoading)
          }
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
        >
          {isExporting === 'csv' || isExporting === 'csv-custom' || isExporting === 'csv-peso'
            ? <Loader size={16} className="animate-spin" />
            : <Download size={16} />}
          Export CSV
        </button>

        <button
          onClick={() => {
            if (activeTab === 'custom') handleCustomExport('xlsx');
            else if (activeTab === 'peso') handlePesoExport('xlsx');
            else handleExport('xlsx');
          }}
          disabled={
            (activeTab === 'peso' && !pesoData.length) ||
            !!isExporting || (activeTab !== 'custom' && isLoading)
          }
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 text-sm"
        >
          {isExporting === 'xlsx' || isExporting === 'xlsx-custom' || isExporting === 'xlsx-peso'
            ? <Loader size={16} className="animate-spin" />
            : <Download size={16} />}
          Export Excel
        </button>

        <button
          onClick={() => {
            if (activeTab === 'custom') handleCustomExport('pdf');
            else if (activeTab === 'peso') handlePesoExport('pdf');
            else handleExport('pdf');
          }}
          disabled={
            (activeTab === 'peso' && !pesoData.length) ||
            !!isExporting || (activeTab !== 'custom' && isLoading)
          }
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm"
        >
          {isExporting === 'pdf' || isExporting === 'pdf-custom' || isExporting === 'pdf-peso'
            ? <Loader size={16} className="animate-spin" />
            : <Download size={16} />}
          Export PDF
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

      {activeTab === 'custom' && (
        <div className="space-y-4">
          <Card>
            <h2 className="text-lg font-bold mb-4">Custom Report Builder</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Name
              </label>
              <input
                type="text"
                value={customReportName}
                onChange={(e) => setCustomReportName(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded text-sm w-full max-w-sm"
                placeholder="Enter report name..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country of Employment
              </label>
              <select
                value={customFilters.countryOfEmployment}
                onChange={(e) => setCustomFilters((prev) => ({
                  ...prev, countryOfEmployment: e.target.value,
                }))}
                className="px-3 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="">All Countries</option>
                <option value="Philippines">Philippines</option>
                <option value="USA">USA</option>
                <option value="Indonesia">Indonesia</option>
              </select>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700">
                  Select Fields ({customFields.length} selected)
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setCustomFields(
                      AVAILABLE_FIELDS.flatMap(c => c.fields)
                    )}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    Select All Fields
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => setCustomFields([])}
                    className="text-xs text-red-500 hover:underline font-medium"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {AVAILABLE_FIELDS.map(({ category, fields }) => (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{category}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCustomFields(prev => {
                            const newFields = [...new Set([...prev, ...fields])];
                            return newFields;
                          })}
                          className="text-[11px] text-blue-600 hover:underline"
                        >
                          Select All
                        </button>
                        <span className="text-gray-300 text-xs">|</span>
                        <button
                          onClick={() => setCustomFields(prev =>
                            prev.filter(f => !fields.includes(f))
                          )}
                          className="text-[11px] text-red-500 hover:underline"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {fields.map((field) => (
                        <button
                          key={field}
                          onClick={() => setCustomFields((prev) =>
                            prev.includes(field)
                              ? prev.filter((f) => f !== field)
                              : [...prev, field]
                          )}
                          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                            customFields.includes(field)
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                          }`}
                        >
                          {field}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={fetchCustomReport}
                disabled={!customFields.length || isCustomLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {isCustomLoading ? <Loader size={14} className="animate-spin" /> : null}
                Generate Report
              </button>
            </div>
          </Card>

          {customData.length > 0 && (
            <Card>
              <h3 className="text-lg font-bold mb-4">
                {customReportName} - {customData.length} employees
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">
                        No.
                      </th>
                      {customFields.map((field) => (
                        <th key={field} className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap">
                          {field}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {customData.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                        {customFields.map((field) => (
                          <td key={field} className="px-3 py-2 whitespace-nowrap">
                            {row[field] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'peso' && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">PESO Report</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Fixed columns required for PESO compliance reporting
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country of Employment
              </label>
              <select
                value={customFilters.countryOfEmployment}
                onChange={(e) => setCustomFilters((prev) => ({
                  ...prev, countryOfEmployment: e.target.value,
                }))}
                className="px-3 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="">All Countries</option>
                <option value="Philippines">Philippines</option>
                <option value="USA">USA</option>
                <option value="Indonesia">Indonesia</option>
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs font-semibold text-blue-700 mb-2">
                Fixed PESO Columns:
              </p>
              <div className="flex flex-wrap gap-1">
                {['Full Name', 'Date of Birth', 'Sex', 'Address', 'Civil Status',
                  'SSS', 'PhilHealth', 'TIN', 'Pag-IBIG', 'Position',
                  'Date of Employment', 'Department'].map((f) => (
                  <span key={f} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{f}</span>
                ))}
              </div>
            </div>
          </Card>

          {isPesoLoading ? (
            <div className="flex justify-center py-12">
              <Loader size={32} className="animate-spin text-blue-600" />
            </div>
          ) : pesoData.length > 0 ? (
            <Card>
              <h3 className="text-lg font-bold mb-4">
                PESO Report - {pesoData.length} employees
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">No.</th>
                      {['Full Name', 'Date of Birth', 'Sex', 'Address', 'Civil Status',
                        'SSS', 'PhilHealth', 'TIN', 'Pag-IBIG', 'Position',
                        'Date of Employment', 'Department'].map((f) => (
                        <th key={f} className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap">{f}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pesoData.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                        {['Full Name', 'Date of Birth', 'Sex', 'Address', 'Civil Status',
                          'SSS', 'PhilHealth', 'TIN', 'Pag-IBIG', 'Position',
                          'Date of Employment', 'Department'].map((f) => (
                          <td key={f} className="px-3 py-2 whitespace-nowrap">
                            {row[f] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card>
              <p className="text-gray-500 text-center py-4">No employee data found</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
