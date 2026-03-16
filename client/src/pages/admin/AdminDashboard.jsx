import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Badge, LoadingSpinner } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';

const STAGES = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];

const STAGE_BAR_CLASSES = {
  applied: 'bg-sky-500',
  screening: 'bg-amber-500',
  interview: 'bg-violet-500',
  offer: 'bg-emerald-500',
  hired: 'bg-green-500',
  rejected: 'bg-red-500',
};

const STAGE_BADGE_CLASSES = {
  applied: 'bg-sky-100 text-sky-700',
  screening: 'bg-amber-100 text-amber-700',
  interview: 'bg-violet-100 text-violet-700',
  offer: 'bg-emerald-100 text-emerald-700',
  hired: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const getTimeOfDay = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuthStore();

  const adminFirstName =
    user?.name?.given_name ||
    user?.personalInfo?.givenName ||
    user?.firstName ||
    'Admin';

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      setError('');
      const res = await api.get('/reports/dashboard');
      setStats(res.data?.data || res.data || null);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to load dashboard data.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          Failed to load dashboard data.
        </div>
      </div>
    );
  }

  const totalApplications = stats.applications?.total || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#223B5B]">
            Good {getTimeOfDay()}, {adminFirstName}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here's what's happening at Madison 88 today.
          </p>
        </div>
        <div className="text-sm text-gray-400">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 border-t-4 border-t-[#223B5B] rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Total Employees
          </p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-[#223B5B]">{stats.employees?.total || 0}</p>
              <p className="text-xs text-gray-500">{stats.employees?.active || 0} active</p>
            </div>
            <span className="text-xl">👥</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 border-t-4 border-t-[#2596BE] rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Open Jobs
          </p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-[#223B5B]">{stats.jobs?.active || 0}</p>
              <p className="text-xs text-gray-500">{stats.jobs?.draft || 0} drafts</p>
            </div>
            <span className="text-xl">💼</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 border-t-4 border-t-green-500 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Applications
          </p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-[#223B5B]">{stats.applications?.total || 0}</p>
              <p className="text-xs text-gray-500">
                {stats.applications?.byStage?.hired || 0} hired
              </p>
            </div>
            <span className="text-xl">📋</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 border-t-4 border-t-purple-500 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Upcoming Interviews
          </p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-[#223B5B]">{stats.interviews?.upcoming || 0}</p>
              <p className="text-xs text-gray-500">Scheduled</p>
            </div>
            <span className="text-xl">📅</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">ATS Pipeline Overview</h2>
        {STAGES.map((stage) => {
          const count = stats.applications?.byStage?.[stage] || 0;
          const width = totalApplications > 0 ? (count / totalApplications) * 100 : 0;

          return (
            <div key={stage} className="flex items-center gap-3 mb-2">
              <span className="text-xs text-gray-500 w-20 text-right capitalize">{stage}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${STAGE_BAR_CLASSES[stage]}`}
                  style={{ width: `${width}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-700 w-8">{count}</span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Recent Applications</h2>
            <Link to="/admin/applicants" className="text-xs text-[#2596BE] hover:underline">
              View All -&gt;
            </Link>
          </div>

          {(stats.recentApplications || []).length === 0 ? (
            <p className="text-sm text-gray-500 py-2">No recent applications.</p>
          ) : (
            (stats.recentApplications || []).map((app) => (
              <div
                key={app._id}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{app.fullName}</p>
                  <p className="text-xs text-gray-400">{app.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                      STAGE_BADGE_CLASSES[app.stage] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {app.stage}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Open Positions</h2>
            <Link to="/admin/jobs" className="text-xs text-[#2596BE] hover:underline">
              View All -&gt;
            </Link>
          </div>

          {(stats.openJobs || []).length === 0 ? (
            <p className="text-sm text-gray-500 py-2">No open jobs.</p>
          ) : (
            (stats.openJobs || []).map((job) => (
              <div
                key={job._id}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{job.title}</p>
                  <p className="text-xs text-gray-400">{job.department}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{job.slots} slots</span>
                  <Badge status="active" label="Active" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
