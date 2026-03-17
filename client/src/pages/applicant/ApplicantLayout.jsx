import React from 'react';
import { Navigate, useLocation, useNavigate, Link, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import NotificationBell from '../../components/ui/NotificationBell';
import {
  LayoutDashboard,
  FileText,
  FileCheck,
  Bookmark,
  Briefcase,
  Calendar,
  LogOut,
  Menu,
  X,
  Bell,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function ApplicantLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showPreEmployment, setShowPreEmployment] = useState(false);

  useEffect(() => {
    api.get('/applications/my')
      .then(res => {
        const apps = res.data.data || res.data || [];
        const qualified = apps.some(a =>
          ['offer', 'hired'].includes(a.stage?.toLowerCase?.())
        );
        setShowPreEmployment(qualified);
      })
      .catch(() => setShowPreEmployment(false));
  }, []);

  const navigationItems = [
    { label: 'Dashboard', path: '/applicant/dashboard', icon: LayoutDashboard },
    { label: 'My Applications', path: '/applicant/applications', icon: FileText },
    { label: 'Interviews', path: '/applicant/interview', icon: Calendar },
    ...(showPreEmployment
      ? [{ label: 'Pre-Employment', path: '/applicant/pre-employment', icon: FileCheck }]
      : []),
    { label: 'Saved Jobs', path: '/applicant/saved-jobs', icon: Bookmark },
    { label: 'Browse Jobs', path: '/applicant/browse-jobs', icon: Briefcase },
  ];

  // Role guard
  if (!user || user.role !== 'applicant') {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:relative lg:transform-none flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h2 className="text-[20px] font-semibold text-[#1a3a5c]">Madison 88</h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-gray-600 hover:text-gray-900"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-2 px-4">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 h-[36px] px-4 rounded-md text-[13px] transition-colors ${
                    isActive
                      ? 'bg-[#185FA5] border border-[#185FA5] text-white font-medium'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-[#1a3a5c] border border-transparent'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
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
          {/* Left: Hamburger Menu & Logo (mobile) */}
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

          {/* Center: Welcome Message */}
          <div className="hidden md:block">
            <p className="text-[13px] text-gray-700">
              Welcome, {user?.personalInfo?.givenName || user?.email || 'Applicant'}
            </p>
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
