import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui';

export default function EmployeeLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const navItems = [
    { path: '/employee/profile', label: 'Profile' },
    { path: '/employee/requests', label: 'Requests' },
    { path: '/employee/documents', label: 'Documents' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Madison 88 Employee Portal</h1>
            <p className="text-sm text-slate-500">Welcome back{user?.email ? `, ${user.email}` : ''}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </aside>

        <main className="lg:col-span-3">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
