import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Loader } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend
);

// Base card component
const Card = ({ children, className = '' }) => (
  <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>{children}</div>
);

// KPI Card for global metrics
const KpiCard = ({ label, value, delta, deltaClassName = '', isLoading = false }) => (
  <Card>
    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">{label}</p>
    {isLoading ? (
      <div className="h-7 w-16 bg-gray-100 rounded animate-pulse mb-1" />
    ) : (
      <p className="text-[28px] font-bold text-[#1a3a5c] mb-1">{value}</p>
    )}
    {isLoading ? (
      <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
    ) : delta ? (
      <p className={`text-[12px] ${deltaClassName || (delta?.trim().startsWith('▼') ? 'text-red-600' : 'text-green-700')}`}>{delta}</p>
    ) : null}
  </Card>
);

// Status badge component
const StatusBadge = ({ status }) => {
  let bgColor = 'bg-gray-50 text-gray-500 border-gray-200';
  const statusLower = status?.toLowerCase();
  
  if (statusLower === 'active') bgColor = 'bg-green-50 text-green-700 border-green-200';
  else if (statusLower === 'inactive') bgColor = 'bg-red-50 text-red-700 border-red-200';
  else if (statusLower === 'pending') bgColor = 'bg-amber-50 text-amber-700 border-amber-200';
  else if (statusLower === 'overdue') bgColor = 'bg-red-50 text-red-700 border-red-200';
  else if (statusLower === 'completed') bgColor = 'bg-green-50 text-green-700 border-green-200';
  else if (statusLower === 'hired') bgColor = 'bg-blue-50 text-blue-700 border-blue-200';
  else if (statusLower === 'rejected') bgColor = 'bg-red-50 text-red-700 border-red-200';
  else if (statusLower === 'draft') bgColor = 'bg-gray-50 text-gray-600 border-gray-200';
  else if (statusLower === 'quiet') bgColor = 'bg-gray-50 text-gray-500 border-gray-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${bgColor}`}>
      {status}
    </span>
  );
};

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
  const [department, setDepartment] = useState('All Departments');
  const [status, setStatus] = useState('All Statuses');
  const [departments, setDepartments] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [customReportName, setCustomReportName] = useState('Custom Report');
  const [customFilters, setCustomFilters] = useState({
    countryOfEmployment: '',
  });
  const [customData, setCustomData] = useState([]);
  const [isCustomLoading, setIsCustomLoading] = useState(false);
  const [pesoData, setPesoData] = useState([]);
  const [isPesoLoading, setIsPesoLoading] = useState(false);
  const [globalKpi, setGlobalKpi] = useState(null);
  const [globalKpiLoading, setGlobalKpiLoading] = useState(true);

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
    department: department !== 'All Departments' ? (department.trim() || undefined) : undefined,
    status: status !== 'All Statuses' ? status : undefined,
  });

  const filtersActive =
    department !== 'All Departments' ||
    status !== 'All Statuses' ||
    !!dateFrom ||
    !!dateTo;

  // Fetch report data when tab changes
  useEffect(() => {
    if (['ats', 'headcount', 'employees', 'training'].includes(activeTab)) {
      fetchReportData(activeTab);
    }
  }, [activeTab, dateFrom, dateTo, department, status]);

  useEffect(() => {
    if (activeTab !== 'ats') {
      return;
    }

    fetchATSTrends();
  }, [activeTab, dateFrom, dateTo, department, status]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.get('/reports/headcount');
        const deptList = res.data?.data?.byDepartment ?? [];
        const names = deptList.map((d) => d.department).filter(Boolean);
        setDepartments([...new Set(names)]);
      } catch (err) {
        setDepartments([]);
      }
    };

    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchGlobalKpi = async () => {
      try {
        setGlobalKpiLoading(true);
        const res = await api.get('/reports/global-kpi');
        setGlobalKpi(res.data?.data || null);
      } catch (err) {
        setGlobalKpi(null);
      } finally {
        setGlobalKpiLoading(false);
      }
    };

    fetchGlobalKpi();
  }, []);

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

  const totalEmployees = globalKpi?.totalEmployees ?? 0;
  const totalEmployeesThisMonth = globalKpi?.totalEmployeesThisMonth ?? 0;
  const activeHeadcount = globalKpi?.activeHeadcount ?? 0;
  const activePercent = globalKpi?.activePercent ?? '0%';
  const openPositions = globalKpi?.openPositions ?? 0;
  const closingSoon = globalKpi?.closingSoon ?? 0;
  const avgTenureYears = globalKpi?.avgTenureYears ?? '0.0';
  const openPositionsDeltaClass = closingSoon > 0 ? 'text-red-600' : 'text-gray-400';

  const atsTrendData =
    (reportData?.atsTrend && reportData.atsTrend.length ? reportData.atsTrend : atsTrend) || [];
  const hiringTrendData =
    (reportData?.hiringTrend && reportData.hiringTrend.length ? reportData.hiringTrend : hiringTrend) || [];
  const headcountByDept = reportData?.byDepartment || [];

  const atsBarData = {
    labels: atsTrendData.map((d) => d.month),
    datasets: [
      {
        label: 'Applications',
        data: atsTrendData.map((d) => d.count),
        backgroundColor: '#BFDBFE',
        borderColor: '#185FA5',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const atsBarOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index' },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: { size: 11 },
        },
        grid: { color: '#f3f4f6' },
      },
      x: {
        ticks: { font: { size: 11 } },
        grid: { display: false },
      },
    },
  };

  const hiringLineData = {
    labels: hiringTrendData.map((d) => d.month),
    datasets: [
      {
        label: 'Hired',
        data: hiringTrendData.map((d) => d.hired),
        borderColor: '#22c55e',
        backgroundColor: '#dcfce7',
        tension: 0.3,
        pointRadius: 4,
      },
      {
        label: 'Rejected',
        data: hiringTrendData.map((d) => d.rejected),
        borderColor: '#ef4444',
        backgroundColor: '#fee2e2',
        tension: 0.3,
        pointRadius: 4,
      },
    ],
  };

  const hiringLineOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { font: { size: 11 }, boxWidth: 12 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: { size: 11 },
        },
        grid: { color: '#f3f4f6' },
      },
      x: {
        ticks: { font: { size: 11 } },
        grid: { display: false },
      },
    },
  };

  const headcountBarData = {
    labels: headcountByDept.map((d) => d.department),
    datasets: [
      {
        label: 'Active',
        data: headcountByDept.map((d) => d.active),
        backgroundColor: '#bbf7d0',
        borderColor: '#22c55e',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Inactive',
        data: headcountByDept.map((d) => d.inactive),
        backgroundColor: '#fecaca',
        borderColor: '#ef4444',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const headcountBarOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { font: { size: 11 }, boxWidth: 12 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: { size: 11 },
        },
        grid: { color: '#f3f4f6' },
      },
      x: {
        ticks: { font: { size: 11 } },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="w-full px-6 py-5 flex flex-col gap-4">
      {/* ===== SECTION 1: PAGE HEADER ===== */}
      <div>
        <h1 className="text-[20px] font-semibold text-[#1a3a5c]">Reports</h1>
        <p className="text-[13px] text-gray-500">Analytics and reporting for HR operations</p>
      </div>

      {/* ===== SECTION 2: GLOBAL KPI CARDS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Employees"
          value={totalEmployees}
          delta={`▲ ${totalEmployeesThisMonth} added this month`}
          deltaClassName="text-green-700"
          isLoading={globalKpiLoading}
        />
        <KpiCard
          label="Active Headcount"
          value={activeHeadcount}
          delta={`▲ ${activePercent} of total`}
          deltaClassName="text-green-700"
          isLoading={globalKpiLoading}
        />
        <KpiCard
          label="Open Positions"
          value={openPositions}
          delta={`▼ ${closingSoon} closing soon`}
          deltaClassName={openPositionsDeltaClass}
          isLoading={globalKpiLoading}
        />
        <KpiCard
          label="Avg Tenure (yrs)"
          value={avgTenureYears}
          delta="▲ +0.2 vs last year"
          deltaClassName="text-green-700"
          isLoading={globalKpiLoading}
        />
      </div>

      {/* ===== SECTION 3: FILTERS BAR ===== */}
      <Card>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-[12px] font-semibold uppercase tracking-widest text-gray-500">Filters</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-[32px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5] flex-shrink-0"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-[32px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5] flex-shrink-0"
          />
          <div className="h-6 w-px bg-gray-300"></div>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="h-[32px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5] flex-shrink-0"
          >
            <option value="All Departments">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-[32px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5] flex-shrink-0"
          >
            <option value="All Statuses">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <button
            onClick={() => {
              setDateFrom('');
              setDateTo('');
              setDepartment('All Departments');
              setStatus('All Statuses');
            }}
            className="text-[12px] text-[#185FA5] border border-gray-200 rounded-md px-3 h-[30px] bg-white hover:bg-gray-50 whitespace-nowrap"
          >
            Reset filters
          </button>
        </div>
      </Card>

      {/* ===== SECTION 4: TABBED REPORT CARD ===== */}
      <Card>
        {/* Tab headers */}
        <div className="flex items-center justify-between border-b border-gray-200 mb-6">
          <div className="flex gap-8">
            {['ats', 'headcount', 'employees', 'training', 'custom', 'peso'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 text-[13px] border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-[#185FA5] text-[#185FA5] font-medium'
                    : 'border-transparent text-gray-500 hover:text-[#1a3a5c]'
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

          {/* Export buttons */}
          <div className="flex gap-2">
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
              className="inline-flex items-center gap-1 h-[26px] px-3 bg-green-50 text-green-700 border border-green-200 rounded-md text-[11px] font-semibold hover:bg-green-100 disabled:opacity-50 transition-colors"
            >
              {isExporting === 'csv' || isExporting === 'csv-custom' || isExporting === 'csv-peso' ? (
                <Loader size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              CSV
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
              className="inline-flex items-center gap-1 h-[26px] px-3 bg-green-50 text-green-700 border border-green-200 rounded-md text-[11px] font-semibold hover:bg-green-100 disabled:opacity-50 transition-colors"
            >
              {isExporting === 'xlsx' || isExporting === 'xlsx-custom' || isExporting === 'xlsx-peso' ? (
                <Loader size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              Excel
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
              className="inline-flex items-center gap-1 h-[26px] px-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-[11px] font-semibold hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              {isExporting === 'pdf' || isExporting === 'pdf-custom' || isExporting === 'pdf-peso' ? (
                <Loader size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              PDF
            </button>
          </div>
        </div>

        {/* Error messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {typeof error === 'string' ? error : error?.message || 'An error occurred'}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (activeTab === 'ats' || activeTab === 'headcount' || activeTab === 'employees' || activeTab === 'training') ? (
          <div className="flex justify-center py-12">
            <Loader size={32} className="animate-spin text-blue-600" />
          </div>
        ) : null}

        {/* ===== TAB 1: ATS FUNNEL ===== */}
        {activeTab === 'ats' && !isLoading && reportData ? (
          <div className="space-y-6">
            {/* Stat cards - unified 7-column layout */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">Total Applicants</p>
                <p className="text-[24px] font-bold text-[#1a3a5c]">{reportData?.stats?.totalApplicants ?? 0}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">Applied</p>
                <p className="text-[24px] font-bold text-[#1a3a5c]">{reportData?.funnelStages?.applied ?? 0}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">Screening</p>
                <p className="text-[24px] font-bold text-[#1a3a5c]">{reportData?.funnelStages?.screening ?? 0}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">Interview</p>
                <p className="text-[24px] font-bold text-[#1a3a5c]">{reportData?.funnelStages?.interview ?? 0}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">Offer</p>
                <p className="text-[24px] font-bold text-[#1a3a5c]">{reportData?.funnelStages?.offer ?? 0}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">Hired</p>
                <p className="text-[24px] font-bold text-[#1a3a5c]">{reportData?.funnelStages?.hired ?? 0}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">Rejected</p>
                <p className="text-[24px] font-bold text-[#1a3a5c]">{reportData?.funnelStages?.rejected ?? 0}</p>
              </div>
            </div>

            {filtersActive ? (
              <p className="text-[12px] text-amber-600 mb-3">
                Showing filtered results - some records may be excluded. Reset filters to see all data.
              </p>
            ) : null}

            {/* Trend tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ATS Trend */}
              <div>
                <h3 className="text-[14px] font-medium text-[#1a3a5c] mb-4">ATS Trend (Last 12 Months)</h3>
                {atsTrendData.length > 0 ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                    <p className="text-[12px] font-semibold uppercase tracking-widest text-gray-500 mb-3">
                      Applications per month
                    </p>
                    <Bar
                      data={atsBarData}
                      options={atsBarOptions}
                      height={80}
                    />
                  </div>
                ) : null}
                {isTrendLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-8">
                    <Loader size={16} className="animate-spin" /> Loading trends...
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 border-b border-gray-200">Month</th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 border-b border-gray-200">Applications</th>
                        </tr>
                      </thead>
                      <tbody>
                          {((reportData?.atsTrend || atsTrend) || []).map((row, idx) => (
                          <tr key={`ats-${idx}`} className="border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-b-0">
                            <td className="px-4 py-3 text-[13px] text-gray-700">{row.month || `-`}</td>
                            <td className="px-4 py-3 text-[13px] text-gray-700">{row.count || 0}</td>
                          </tr>
                        ))}
                          {(!(reportData?.atsTrend || atsTrend) || (reportData?.atsTrend || atsTrend).length === 0) && (
                          <tr>
                            <td colSpan="2" className="py-10 text-[13px] text-gray-400 text-center">No records found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Hiring Trend */}
              <div>
                <h3 className="text-[14px] font-medium text-[#1a3a5c] mb-4">Hiring Trend (Last 12 Months)</h3>
                {hiringTrendData.length > 0 ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                    <p className="text-[12px] font-semibold uppercase tracking-widest text-gray-500 mb-3">
                      Hired vs Rejected per month
                    </p>
                    <Line
                      data={hiringLineData}
                      options={hiringLineOptions}
                      height={80}
                    />
                  </div>
                ) : null}
                {isTrendLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-8">
                    <Loader size={16} className="animate-spin" /> Loading trends...
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 border-b border-gray-200">Month</th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 border-b border-gray-200">Hired</th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 border-b border-gray-200">Rejected</th>
                        </tr>
                      </thead>
                      <tbody>
                          {((reportData?.hiringTrend || hiringTrend) || []).map((row, idx) => (
                          <tr key={`hiring-${idx}`} className="border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-b-0">
                            <td className="px-4 py-3 text-[13px] text-gray-700">{row.month || `-`}</td>
                            <td className="px-4 py-3 text-[13px] text-gray-700">{row.hired || 0}</td>
                            <td className="px-4 py-3 text-[13px] text-gray-700">{row.rejected || 0}</td>
                          </tr>
                        ))}
                          {(!(reportData?.hiringTrend || hiringTrend) || (reportData?.hiringTrend || hiringTrend).length === 0) && (
                          <tr>
                            <td colSpan="3" className="py-10 text-[13px] text-gray-400 text-center">No records found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'ats' ? (
          <div className="py-10 text-[13px] text-gray-400 text-center">No data available</div>
        ) : null}

        {/* ===== TAB 2: HEADCOUNT ===== */}
        {activeTab === 'headcount' && !isLoading && reportData ? (
          <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">Total Headcount</p>
                <p className="text-[24px] font-bold text-[#1a3a5c]">{reportData?.stats?.totalHeadcount ?? 0}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">Active</p>
                <p className="text-[24px] font-bold text-[#1a3a5c]">{reportData?.stats?.active ?? 0}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">Inactive</p>
                <p className="text-[24px] font-bold text-[#1a3a5c]">{reportData?.stats?.inactive ?? 0}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">Departments</p>
                <p className="text-[24px] font-bold text-[#1a3a5c]">{reportData?.stats?.departments ?? 0}</p>
              </div>
            </div>

            {filtersActive ? (
              <p className="text-[12px] text-amber-600 mb-3">
                Showing filtered results - some records may be excluded. Reset filters to see all data.
              </p>
            ) : null}

            {/* Headcount by Department */}
            <div>
              <h3 className="text-[14px] font-medium text-[#1a3a5c] mb-4">Headcount by Department</h3>
              {headcountByDept.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="text-[12px] font-semibold uppercase tracking-widest text-gray-500 mb-3">
                    Headcount by department
                  </p>
                  <Bar
                    data={headcountBarData}
                    options={headcountBarOptions}
                    height={80}
                  />
                </div>
              ) : null}
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">Department</th>
                      <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">Total</th>
                      <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">Active</th>
                      <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">Inactive</th>
                      <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">% Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData?.byDepartment || []).map((dept, idx) => {
                      const pctActive = dept.total ? ((dept.active / dept.total) * 100).toFixed(0) : 0;
                      return (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-[13px] text-gray-700">{dept.department || `-`}</td>
                          <td className="px-4 py-3 text-center text-[13px] text-gray-700 font-medium">{dept.total || 0}</td>
                          <td className="px-4 py-3 text-center text-[13px] text-gray-700">{dept.active || 0}</td>
                          <td className="px-4 py-3 text-center text-[13px] text-gray-700">{dept.inactive || 0}</td>
                          <td className="px-4 py-3 text-center text-[13px] text-gray-700">
                            <span>{pctActive}%</span>
                          </td>
                        </tr>
                      );
                    })}
                    {(!reportData?.byDepartment || reportData.byDepartment.length === 0) && (
                      <tr>
                        <td colSpan="5" className="px-4 py-10 text-center text-[13px] text-gray-400">No records found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === 'headcount' ? (
          <div className="py-10 text-[13px] text-gray-400 text-center">No data available</div>
        ) : null}

        {/* ===== TAB 3: EMPLOYEE STATUS ===== */}
        {activeTab === 'employees' && !isLoading && reportData ? (
          <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">Total Employees</p>
                <p className="text-[24px] font-bold text-[#1a3a5c]">{reportData?.stats?.totalEmployees ?? 0}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">Active</p>
                <p className="text-[24px] font-bold text-[#1a3a5c]">{reportData?.stats?.active ?? 0}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">Inactive</p>
                <p className="text-[24px] font-bold text-[#1a3a5c]">{reportData?.stats?.inactive ?? 0}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">Terminated</p>
                <p className="text-[24px] font-bold text-[#1a3a5c]">{reportData?.stats?.terminated ?? 0}</p>
              </div>
            </div>

            {filtersActive ? (
              <p className="text-[12px] text-amber-600 mb-3">
                Showing filtered results - some records may be excluded. Reset filters to see all data.
              </p>
            ) : null}

            {/* Employee List */}
            <div>
              <h3 className="text-[14px] font-medium text-[#1a3a5c] mb-4">Employee List</h3>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">Name</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">Department</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">Position</th>
                      <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">Status</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">Start Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData?.employees || []).map((emp, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-[13px] text-gray-700">{emp.name || `-`}</td>
                        <td className="px-4 py-3 text-[13px] text-gray-700">{emp.department || `-`}</td>
                        <td className="px-4 py-3 text-[13px] text-gray-700">{emp.position || `-`}</td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={emp.status} />
                        </td>
                        <td className="px-4 py-3 text-[13px] text-gray-700">{emp.startDate || `-`}</td>
                      </tr>
                    ))}
                    {(!reportData?.employees || reportData.employees.length === 0) && (
                      <tr>
                        <td colSpan="5" className="px-4 py-10 text-center text-[13px] text-gray-400">No records found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === 'employees' ? (
          <div className="py-10 text-[13px] text-gray-400 text-center">No data available</div>
        ) : null}

        {/* ===== TAB 4: TRAINING ===== */}
        {activeTab === 'training' && !isLoading && reportData ? (
          <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">Total Programs</p>
                <p className="text-[24px] font-bold text-[#1a3a5c]">{reportData?.stats?.totalPrograms ?? 0}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">Total Assignments</p>
                <p className="text-[24px] font-bold text-[#1a3a5c]">{reportData?.stats?.totalAssignments ?? 0}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">Completed</p>
                <p className="text-[24px] font-bold text-[#1a3a5c]">{reportData?.stats?.completed ?? 0}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">Pending</p>
                <p className="text-[24px] font-bold text-[#1a3a5c]">{reportData?.stats?.pending ?? 0}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">Overdue</p>
                <p className="text-[24px] font-bold text-[#1a3a5c]">{reportData?.stats?.overdue ?? 0}</p>
              </div>
            </div>

            {filtersActive ? (
              <p className="text-[12px] text-amber-600 mb-3">
                Showing filtered results - some records may be excluded. Reset filters to see all data.
              </p>
            ) : null}

            {/* Training Assignments */}
            <div>
              <h3 className="text-[14px] font-medium text-[#1a3a5c] mb-4">Training Assignments</h3>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">Employee</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">Training</th>
                      <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">Status</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">Completion Date</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData?.assignments || []).map((assign, idx) => {
                      const isOverdue = new Date(assign.expiryDate) < new Date() && assign.status !== 'completed';
                      return (
                        <tr key={idx} className={isOverdue ? 'bg-red-50' : 'border-b border-gray-100 hover:bg-gray-50 transition-colors'}>
                          <td className="px-4 py-3 text-[13px] text-gray-700">{assign.employeeName || `-`}</td>
                          <td className="px-4 py-3 text-[13px] text-gray-700">{assign.trainingName || `-`}</td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge status={assign.status} />
                          </td>
                          <td className="px-4 py-3 text-[13px] text-gray-700">{assign.completionDate || `-`}</td>
                          <td className={`px-4 py-3 text-[13px] ${isOverdue ? 'text-red-700 font-bold' : 'text-gray-700'}`}>
                            {assign.expiryDate || `-`}
                          </td>
                        </tr>
                      );
                    })}
                    {(!reportData?.assignments || reportData.assignments.length === 0) && (
                      <tr>
                        <td colSpan="5" className="px-4 py-10 text-center text-[13px] text-gray-400">No records found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === 'training' ? (
          <div className="py-10 text-[13px] text-gray-400 text-center">No data available</div>
        ) : null}

        {/* ===== TAB 5: CUSTOM REPORT ===== */}
        {activeTab === 'custom' && (
          <div className="space-y-6">
            {/* Custom Report Builder */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column: Config */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">
                    Report Name
                  </label>
                  <input
                    type="text"
                    value={customReportName}
                    onChange={(e) => setCustomReportName(e.target.value)}
                    className="w-full h-[32px] px-3 border border-gray-200 rounded-md text-[13px] bg-white text-gray-700 outline-none focus:border-[#185FA5]"
                    placeholder="Enter report name..."
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">
                    Country of Employment
                  </label>
                  <select
                    value={customFilters.countryOfEmployment}
                    onChange={(e) => setCustomFilters((prev) => ({
                      ...prev,
                      countryOfEmployment: e.target.value,
                    }))}
                    className="w-full h-[32px] px-3 border border-gray-200 rounded-md text-[13px] bg-white text-gray-700 outline-none focus:border-[#185FA5]"
                  >
                    <option value="">All Countries</option>
                    <option value="Philippines">Philippines</option>
                    <option value="USA">USA</option>
                    <option value="Indonesia">Indonesia</option>
                  </select>
                </div>

                <div className="h-px bg-gray-200"></div>

                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1">
                    Export Format
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="export-format" value="csv" defaultChecked className="w-4 h-4" />
                      <span className="text-[13px] text-gray-700">CSV</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="export-format" value="xlsx" className="w-4 h-4" />
                      <span className="text-[13px] text-gray-700">Excel</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="export-format" value="pdf" className="w-4 h-4" />
                      <span className="text-[13px] text-gray-700">PDF</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={fetchCustomReport}
                  disabled={!customFields.length || isCustomLoading}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 h-[32px] bg-[#185FA5] text-white rounded-md text-[13px] font-medium hover:bg-[#0C447C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCustomLoading ? <Loader size={16} className="animate-spin" /> : null}
                  Generate Report
                </button>
              </div>

              {/* Right column: Field Selector */}
              <div className="lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-medium text-[#1a3a5c]">Select Fields</h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-[#185FA5] rounded-full text-[11px] font-medium">
                      {customFields.length} selected
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setCustomFields(
                        AVAILABLE_FIELDS.flatMap(c => c.fields)
                      )}
                      className="text-[12px] text-[#185FA5] hover:underline cursor-pointer"
                    >
                      Select all
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => setCustomFields([])}
                      className="text-[12px] text-[#185FA5] hover:underline cursor-pointer"
                    >
                      Clear all
                    </button>
                  </div>
                </div>

                <div className="space-y-5 max-h-96 overflow-y-auto">
                  {AVAILABLE_FIELDS.map(({ category, fields }) => (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-2">{category}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCustomFields(prev => {
                              const newFields = [...new Set([...prev, ...fields])];
                              return newFields;
                            })}
                            className="text-[12px] text-[#185FA5] hover:underline cursor-pointer"
                          >
                            Select all
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => setCustomFields(prev =>
                              prev.filter(f => !fields.includes(f))
                            )}
                            className="text-[12px] text-[#185FA5] hover:underline cursor-pointer"
                          >
                            Deselect
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
                            className={`px-3 py-1 rounded-full text-[12px] border transition-colors ${
                              customFields.includes(field)
                                ? 'bg-blue-50 border border-[#378ADD] text-[#0C447C] font-medium'
                                : 'bg-white text-gray-500 border border-gray-200 hover:border-[#185FA5] hover:text-[#185FA5]'
                            }`}
                          >
                            {field}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded text-[13px] text-gray-700">
                  <strong>Selected:</strong> {customFields.length} fields
                </div>
              </div>
            </div>

            {/* Results table */}
            {customData.length > 0 && (
              <div>
                <h3 className="text-[14px] font-medium text-[#1a3a5c] mb-4">
                  {customReportName} — {customData.length} employees
                </h3>
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 border-b border-gray-200 w-12">No.</th>
                        {customFields.map((field) => (
                          <th key={field} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 border-b border-gray-200 whitespace-nowrap">
                            {field}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {customData.map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-b-0">
                          <td className="px-4 py-3 text-[13px] text-gray-700">{idx + 1}</td>
                          {customFields.map((field) => (
                            <td key={field} className="px-4 py-3 text-[13px] text-gray-700 whitespace-nowrap">
                              {row[field] || `-`}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {isCustomLoading && (
              <div className="flex justify-center py-12">
                <Loader size={32} className="animate-spin text-blue-600" />
              </div>
            )}
          </div>
        )}

        {/* ===== TAB 6: PESO REPORT ===== */}
        {activeTab === 'peso' && (
          <div className="space-y-6">
            {/* PESO Header Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-[14px] font-medium text-[#1a3a5c] mb-3">Fixed PESO Columns</h3>
              <p className="text-[13px] text-gray-700 mb-3">PESO compliance requires these fixed columns:</p>
              <div className="flex flex-wrap gap-2">
                {['Full Name', 'Date of Birth', 'Sex', 'Address', 'Civil Status', 'SSS', 'PhilHealth', 'TIN', 'Pag-IBIG', 'Position', 'Date of Employment', 'Department'].map((field) => (
                  <span key={field} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                    {field}
                  </span>
                ))}
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">Total Hires (PESO)</p>
                <p className="text-[24px] font-bold text-[#1a3a5c]">{pesoData?.summary?.totalHires || 0}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">Local Hires</p>
                <p className="text-[24px] font-bold text-[#1a3a5c]">{pesoData?.summary?.localHires || 0}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">Referred by PESO</p>
                <p className="text-[24px] font-bold text-[#1a3a5c]">{pesoData?.summary?.referredByPeso || 0}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-1">Job Orders Filed</p>
                <p className="text-[24px] font-bold text-[#1a3a5c]">{pesoData?.summary?.jobOrdersFiled || 0}</p>
              </div>
            </div>

            {/* Country filter */}
            <div className="max-w-xs">
              <label className="block text-[12px] font-medium text-gray-700 mb-1">
                Country of Employment
              </label>
              <select
                value={customFilters.countryOfEmployment}
                onChange={(e) => setCustomFilters((prev) => ({
                  ...prev,
                  countryOfEmployment: e.target.value,
                }))}
                className="w-full h-[32px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5]"
              >
                <option value="">All Countries</option>
                <option value="Philippines">Philippines</option>
                <option value="USA">USA</option>
                <option value="Indonesia">Indonesia</option>
              </select>
            </div>

            {/* Loading state */}
            {isPesoLoading && (
              <div className="flex justify-center py-12">
                <Loader size={32} className="animate-spin text-blue-600" />
              </div>
            )}

            {/* PESO Data Table */}
            {!isPesoLoading && pesoData.length > 0 ? (
              <div>
                <h3 className="text-[14px] font-medium text-[#1a3a5c] mb-4">
                  PESO Report — {pesoData.length} employees
                </h3>
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 w-12">No.</th>
                        {['Full Name', 'Date of Birth', 'Sex', 'Address', 'Civil Status', 'SSS', 'PhilHealth', 'TIN', 'Pag-IBIG', 'Position', 'Date of Employment', 'Department'].map((field) => (
                          <th key={field} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap">
                            {field}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pesoData.map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-[12px] text-gray-500">{idx + 1}</td>
                          {['Full Name', 'Date of Birth', 'Sex', 'Address', 'Civil Status', 'SSS', 'PhilHealth', 'TIN', 'Pag-IBIG', 'Position', 'Date of Employment', 'Department'].map((field) => (
                            <td key={field} className="px-4 py-3 text-[12px] text-gray-700 whitespace-nowrap">
                              {row[field] || `-`}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : !isPesoLoading ? (
              <div className="py-10 text-[13px] text-gray-400 text-center">No records found</div>
            ) : null}
          </div>
        )}
      </Card>
    </div>
  );
}
