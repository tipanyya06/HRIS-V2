import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const topNavItems = [{ path: '/admin/dashboard', label: 'Dashboard', icon: 'DB' }];

  const recruitmentItems = [
    { path: '/admin/jobs', label: 'Jobs', icon: 'JB' },
    { path: '/admin/applicants', label: 'Applicants', icon: 'AP' },
    { path: '/admin/ats', label: 'ATS Pipeline', icon: 'AT' },
    { path: '/admin/interviews', label: 'Interviews', icon: 'IN' },
  ];

  const workforceItems = [
    { path: '/admin/employees', label: 'Employees', icon: 'EM' },
    { path: '/admin/training', label: 'Training', icon: 'TR' },
  ];

  const adminItems = [
    { path: '/admin/admins', label: 'Admin List', icon: 'AL' },
    { path: '/admin/logs', label: 'Activity Logs', icon: 'LG' },
    { path: '/admin/reports', label: 'Reports', icon: 'RP' },
  ];

  const navItems = [
    ...topNavItems,
    ...recruitmentItems,
    ...workforceItems,
    ...adminItems,
  ];

  const isActive = (path) => location.pathname === path;

  const currentPage = navItems.find((item) => isActive(item.path));

  return (
    <div className="flex h-screen bg-slate-100">
      <aside className="w-72 bg-white border-r border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900">Madison 88</h1>
          <p className="text-sm text-slate-500">Admin Console</p>
        </div>

        <nav className="space-y-4 px-4 py-4">
          <div className="space-y-2">
            {topNavItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="inline-flex h-6 w-6 mr-3 items-center justify-center rounded bg-black/10 text-xs font-bold">
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </div>

          <div>
            <p className="px-2 pb-2 text-[11px] font-semibold tracking-widest text-slate-400">
              RECRUITMENT
            </p>
            <div className="space-y-2">
              {recruitmentItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                    isActive(item.path)
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="inline-flex h-6 w-6 mr-3 items-center justify-center rounded bg-black/10 text-xs font-bold">
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="px-2 pb-2 text-[11px] font-semibold tracking-widest text-slate-400">
              WORKFORCE
            </p>
            <div className="space-y-2">
              {workforceItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                    isActive(item.path)
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="inline-flex h-6 w-6 mr-3 items-center justify-center rounded bg-black/10 text-xs font-bold">
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="px-2 pb-2 text-[11px] font-semibold tracking-widest text-slate-400">
              ADMIN
            </p>
            <div className="space-y-2">
              {adminItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                    isActive(item.path)
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="inline-flex h-6 w-6 mr-3 items-center justify-center rounded bg-black/10 text-xs font-bold">
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-slate-800">
              {currentPage ? currentPage.label : 'Admin'}
            </h2>
            <span className="text-xs uppercase tracking-wider text-slate-500">Madison 88</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-600">{user?.email}</span>
            <Button onClick={handleLogout} variant="danger" size="sm">
              Logout
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
