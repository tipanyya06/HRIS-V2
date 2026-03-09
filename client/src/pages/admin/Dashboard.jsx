import React from 'react';
import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Card, LoadingSpinner, PageHeader } from '../../components/ui';

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [kpis, setKpis] = useState([
    { label: 'Total Employees', value: 0, icon: 'EMP' },
    { label: 'Open Jobs', value: 0, icon: 'JOB' },
    { label: 'Active Applicants', value: 0, icon: 'ATS' },
    { label: 'Interviews This Week', value: 0, icon: 'INT' },
  ]);

  const extractErrorMessage = (error) => {
    if (typeof error?.response?.data?.error === 'string') {
      return error.response.data.error;
    }
    if (typeof error?.response?.data?.error?.message === 'string') {
      return error.response.data.error.message;
    }
    if (typeof error?.message === 'string') {
      return error.message;
    }
    return 'Failed to load dashboard data.';
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');

      const { data: jobsData } = await api.get('/jobs/admin/all');
      const { data: applicationsData } = await api.get('/applications');

      const jobs = jobsData?.data || [];
      const applications = applicationsData?.data || [];

      const openJobs = jobs.filter((job) => job.status === 'active').length;
      const activeApplicants = applications.filter((app) => app.stage !== 'hired' && app.stage !== 'rejected').length;
      const interviewsThisWeek = applications.filter((app) => app.stage === 'interview').length;

      setKpis([
        { label: 'Total Employees', value: 0, icon: 'EMP' },
        { label: 'Open Jobs', value: openJobs, icon: 'JOB' },
        { label: 'Active Applicants', value: activeApplicants, icon: 'ATS' },
        { label: 'Interviews This Week', value: interviewsThisWeek, icon: 'INT' },
      ]);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const kpiContent = isLoading ? (
    <div className="flex justify-center py-12">
      <LoadingSpinner size="lg" />
    </div>
  ) : errorMessage ? (
    <Card>
      <p className="text-red-600">{errorMessage}</p>
    </Card>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="border border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm">{kpi.label}</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{kpi.value}</p>
            </div>
            <span className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">
              {kpi.icon}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Realtime operational overview for HRIS and ATS"
      />

      {kpiContent}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-2">ATS Funnel</h2>
          <p className="text-slate-500">Pipeline stage analytics can be plugged in here next.</p>
        </Card>
        <Card className="border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Headcount by Department</h2>
          <p className="text-slate-500">Departmental summary widgets can be connected here next.</p>
        </Card>
      </div>
    </div>
  );
}
