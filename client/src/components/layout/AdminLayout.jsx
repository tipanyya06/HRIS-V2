import React from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import NotificationBell from '../ui/NotificationBell';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  MessageSquare,
  GitBranch,
  Calendar,
  BookOpen,
  Shield,
  Activity,
  Bell,
  BarChart3,
  FileCheck,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Role guard
  if (!user || (user.role !== 'admin' && user.role !== 'super-admin')) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const recruitmentItems = [
    { path: '/admin/jobs', label: 'Jobs', icon: Briefcase },
    { path: '/admin/applicants', label: 'Applicants', icon: Users },
    { path: '/admin/pre-employment', label: 'Pre-Employment', icon: FileCheck },
    { path: '/admin/ats', label: 'ATS Pipeline', icon: GitBranch },
    { path: '/admin/interviews', label: 'Interviews', icon: Calendar },
  ];

  const workforceItems = [
    { path: '/admin/employees', label: 'Employees', icon: Users },
    { path: '/admin/training', label: 'Training', icon: BookOpen },
    { path: '/admin/performance', label: 'Performance', icon: BarChart3 },
  ];

  const adminItems = [
    { path: '/admin/admins', label: 'Admin List', icon: Shield },
    { path: '/admin/requests', label: 'Requests', icon: MessageSquare },
    { path: '/admin/offboarding', label: 'Offboarding', icon: LogOut },
    { path: '/admin/logs', label: 'Activity Logs', icon: Activity },
    { path: '/admin/announcements', label: 'Announcements', icon: Bell },
    { path: '/admin/reports', label: 'Reports', icon: BarChart3 },
  ];

  const topNavItems = [{ path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard }];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:static lg:transform-none flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div>
            <h2 className="text-[20px] font-semibold text-[#1a3a5c]">Madison 88</h2>
            <p className="text-[13px] text-gray-500">Admin Console</p>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-gray-600 hover:text-gray-900"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-visible">
          {/* Top Navigation */}
          <div className="space-y-2 px-4 mb-3">
            {topNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 h-[36px] px-4 rounded-md text-[13px] transition-colors ${
                    isActive(item.path)
                      ? 'bg-[#185FA5] border border-[#185FA5] text-white font-medium'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-[#1a3a5c] border border-transparent'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Recruitment Section */}
          <div className="mb-3">
            <p className="px-4 pb-1 text-[11px] font-semibold tracking-widest uppercase text-gray-500">
              Recruitment
            </p>
            <div className="space-y-2 px-4">
              {recruitmentItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 h-[36px] px-4 rounded-md text-[13px] transition-colors ${
                      isActive(item.path)
                        ? 'bg-[#185FA5] border border-[#185FA5] text-white font-medium'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-[#1a3a5c] border border-transparent'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Workforce Section */}
          <div className="mb-3">
            <p className="px-4 pb-1 text-[11px] font-semibold tracking-widest uppercase text-gray-500">
              Workforce
            </p>
            <div className="space-y-2 px-4">
              {workforceItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 h-[36px] px-4 rounded-md text-[13px] transition-colors ${
                      isActive(item.path)
                        ? 'bg-[#185FA5] border border-[#185FA5] text-white font-medium'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-[#1a3a5c] border border-transparent'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Admin Section */}
          <div className="mb-3">
            <p className="px-4 pb-1 text-[11px] font-semibold tracking-widest uppercase text-gray-500">
              Admin
            </p>
            <div className="space-y-2 px-4">
              {adminItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 h-[36px] px-4 rounded-md text-[13px] transition-colors ${
                      isActive(item.path)
                        ? 'bg-[#185FA5] border border-[#185FA5] text-white font-medium'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-[#1a3a5c] border border-transparent'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full h-[36px] px-4 rounded-md text-[13px] text-gray-500 hover:bg-gray-50 hover:text-[#1a3a5c] font-medium transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shadow-sm">
          {/* Left: Hamburger Menu & Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              <Menu size={24} />
            </button>
            <h1 className="hidden lg:block text-[20px] font-semibold text-[#1a3a5c]">
              Madison 88 HRIS
            </h1>
          </div>

          {/* Right: NotificationBell & Email */}
          <div className="flex items-center gap-3">
            <NotificationBell />
            <p className="text-[13px] text-gray-700">
              {user?.email}
            </p>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
