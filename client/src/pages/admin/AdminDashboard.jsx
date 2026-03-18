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
  applied: 'bg-sky-50 border border-sky-200 text-sky-700',
  screening: 'bg-amber-50 border border-amber-200 text-amber-700',
  interview: 'bg-indigo-50 border border-indigo-200 text-indigo-700',
  offer: 'bg-emerald-50 border border-emerald-200 text-emerald-700',
  hired: 'bg-green-50 border border-green-200 text-green-700',
  rejected: 'bg-red-50 border border-red-200 text-red-700',
};

const getTimeOfDay = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
};

const KpiIcon = ({ type }) => {
  if (type === 'employees') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
        <path d="M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 20v-1a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  if (type === 'jobs') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M3 12h18" />
      </svg>
    );
  }

  if (type === 'applications') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
        <rect x="6" y="3" width="12" height="18" rx="2" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
      <path d="M8 14h3" />
      <path d="M13 14h3" />
      <path d="M8 17h3" />
    </svg>
  );
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
      <div className="w-full px-6 py-5 flex flex-col gap-4">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-6 py-5 flex flex-col gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="w-full px-6 py-5 flex flex-col gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          Failed to load dashboard data.
        </div>
      </div>
    );
  }

  const toNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };

  const firstNumeric = (values) => {
    for (const value of values) {
      const num = toNumber(value);
      if (num !== null) return num;
    }
    return null;
  };

  const toPercent = (part, whole) => {
    if (!whole || whole <= 0) return 0;
    return Math.round((part / whole) * 100);
  };

  const getDeltaToneClasses = (deltaValue) => {
    if (deltaValue > 0) return 'bg-green-50 border-green-200 text-green-700';
    if (deltaValue < 0) return 'bg-red-50 border-red-200 text-red-700';
    return 'bg-gray-50 border-gray-200 text-gray-600';
  };

  const formatDelta = (deltaValue) => {
    if (deltaValue > 0) return `+${Math.abs(deltaValue)}%`;
    if (deltaValue < 0) return `-${Math.abs(deltaValue)}%`;
    return '0%';
  };

  const totalApplications = stats.applications?.total || 0;
  const totalJobs = (stats.jobs?.active || 0) + (stats.jobs?.draft || 0) + (stats.jobs?.closed || 0);
  const pendingActionItems = [
    {
      key: 'approvals',
      label: 'Leave requests awaiting approval',
      count: stats.requests?.pending || 0,
      due: 'Today',
      href: '/admin/requests',
    },
    {
      key: 'draftJobs',
      label: 'Draft job posts to publish',
      count: stats.jobs?.draft || 0,
      due: 'This week',
      href: '/admin/jobs',
    },
    {
      key: 'interviews',
      label: 'Upcoming interviews to confirm',
      count: stats.interviews?.upcoming || 0,
      due: 'Next 7 days',
      href: '/admin/interviews',
    },
  ];

  const workforceSnapshot = [
    { label: 'Headcount', value: stats.employees?.total || 0 },
    { label: 'Departments', value: stats.employees?.departments || '—' },
    { label: 'On Leave', value: stats.employees?.onLeave || 0 },
    { label: 'New Hires', value: stats.employees?.newHiresThisMonth || 0 },
  ];

  const upcomingItems = [
    {
      key: 'birthdays',
      label: 'Birthdays this month',
      value: stats.employees?.birthdaysThisMonth || 0,
      tone: 'text-slate-700',
    },
    {
      key: 'anniversaries',
      label: 'Work anniversaries',
      value: stats.employees?.anniversariesThisMonth || 0,
      tone: 'text-slate-700',
    },
    {
      key: 'training',
      label: 'Training expiring soon',
      value: stats.training?.expiringSoon || 0,
      tone: (stats.training?.expiringSoon || 0) > 0 ? 'text-red-600' : 'text-slate-700',
    },
  ];

  const urgentTotal = pendingActionItems.reduce((sum, item) => sum + item.count, 0);

  const kpiCards = [
    {
      label: 'Total Employees',
      value: stats.employees?.total || 0,
      icon: 'employees',
      subLabel: `${stats.employees?.active || 0} active this month`,
      delta: firstNumeric([
        stats.employees?.delta,
        stats.employees?.deltaPct,
        stats.employees?.changePercent,
        stats.employees?.momPercent,
      ]) ?? toPercent(stats.employees?.newHiresThisMonth || 0, stats.employees?.total || 0),
      deltaLabel: firstNumeric([
        stats.employees?.delta,
        stats.employees?.deltaPct,
        stats.employees?.changePercent,
        stats.employees?.momPercent,
      ]) !== null ? 'vs last period' : 'new-hire signal',
    },
    {
      label: 'Open Jobs',
      value: stats.jobs?.active || 0,
      icon: 'jobs',
      subLabel: `${stats.jobs?.draft || 0} drafts available`,
      delta: firstNumeric([
        stats.jobs?.delta,
        stats.jobs?.deltaPct,
        stats.jobs?.changePercent,
        stats.jobs?.momPercent,
      ]) ?? toPercent(stats.jobs?.active || 0, totalJobs),
      deltaLabel: firstNumeric([
        stats.jobs?.delta,
        stats.jobs?.deltaPct,
        stats.jobs?.changePercent,
        stats.jobs?.momPercent,
      ]) !== null ? 'vs last period' : 'open-rate signal',
    },
    {
      label: 'Applications',
      value: stats.applications?.total || 0,
      icon: 'applications',
      subLabel: `${stats.applications?.byStage?.hired || 0} hired this month`,
      delta: firstNumeric([
        stats.applications?.delta,
        stats.applications?.deltaPct,
        stats.applications?.changePercent,
        stats.applications?.momPercent,
      ]) ?? toPercent(stats.applications?.byStage?.hired || 0, stats.applications?.total || 0),
      deltaLabel: firstNumeric([
        stats.applications?.delta,
        stats.applications?.deltaPct,
        stats.applications?.changePercent,
        stats.applications?.momPercent,
      ]) !== null ? 'vs last period' : 'hire conversion',
    },
    {
      label: 'Upcoming Interviews',
      value: stats.interviews?.upcoming || 0,
      icon: 'interviews',
      subLabel: 'Scheduled within this week',
      delta: firstNumeric([
        stats.interviews?.delta,
        stats.interviews?.deltaPct,
        stats.interviews?.changePercent,
        stats.interviews?.momPercent,
      ]) ?? toPercent(stats.interviews?.upcoming || 0, (stats.interviews?.upcoming || 0) + (stats.interviews?.completed || 0)),
      deltaLabel: firstNumeric([
        stats.interviews?.delta,
        stats.interviews?.deltaPct,
        stats.interviews?.changePercent,
        stats.interviews?.momPercent,
      ]) !== null ? 'vs last period' : 'schedule momentum',
    },
  ];

  return (
    <div className="w-full px-6 py-5 flex flex-col gap-4">
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

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
        <p className="text-sm font-medium text-amber-800">
          {urgentTotal} item{urgentTotal === 1 ? '' : 's'} needing your attention
          {' '}<span className="text-amber-700">- review approvals and upcoming deadlines.</span>
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div key={card.label} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{card.label}</p>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getDeltaToneClasses(card.delta)}`}>
                  {formatDelta(card.delta)}
                </span>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-slate-200 bg-slate-50 text-slate-600">
                  <KpiIcon type={card.icon} />
                </span>
              </div>
            </div>
            <p className="text-3xl font-bold text-[#1a3a5c] leading-none">{card.value}</p>
            <p className="text-xs text-gray-500 mt-2">{card.subLabel}</p>
            <p className="text-[11px] text-gray-400 mt-1">{card.deltaLabel}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 bg-white border border-gray-200 rounded-lg p-5">
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
                <span className="text-xs font-medium text-gray-700 w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>

        <div className="xl:col-span-4 bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Pending Actions</h2>
            <Link to="/admin/requests" className="text-xs text-[#185FA5] hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {pendingActionItems.map((item) => (
              <Link
                key={item.key}
                to={item.href}
                className="block border border-gray-100 rounded-lg px-3 py-2 hover:border-gray-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-700 leading-5">{item.label}</p>
                  <span className="text-xs font-semibold text-[#1a3a5c]">{item.count}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Due: {item.due}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4 bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Recent Applications</h2>
            <Link to="/admin/applicants" className="text-xs text-[#185FA5] hover:underline">
              View all
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

        <div className="xl:col-span-4 bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Open Positions</h2>
            <Link to="/admin/jobs" className="text-xs text-[#185FA5] hover:underline">
              View all
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

        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Workforce Snapshot</h2>
            <div className="grid grid-cols-2 gap-3">
              {workforceSnapshot.map((item) => (
                <div key={item.label} className="border border-gray-100 rounded-lg p-3">
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">{item.label}</p>
                  <p className="text-xl font-semibold text-[#1a3a5c] mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Upcoming Events</h2>
            <div className="space-y-2">
              {upcomingItems.map((item) => (
                <div key={item.key} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                  <p className="text-sm text-gray-600">{item.label}</p>
                  <p className={`text-sm font-semibold ${item.tone}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
