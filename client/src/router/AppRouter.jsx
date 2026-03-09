import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Layouts
import AdminLayout from '../components/layout/AdminLayout';
import PublicLayout from '../components/layout/PublicLayout';
import EmployeeLayout from '../components/layout/EmployeeLayout';

// Pages - Public
import Login from '../pages/auth/Login';
import Signup from '../pages/auth/Signup';
import JobBoard from '../pages/public/JobBoard';
import ApplyForm from '../pages/public/ApplyForm';
import MeetingCalendar from '../pages/public/MeetingCalendar';
import Home from '../pages/public/Home';

// Pages - Admin
import Dashboard from '../pages/admin/Dashboard';
import ATS from '../pages/admin/ATS';
import Employees from '../pages/admin/Employees';
import Interviews from '../pages/admin/Interviews';
import Training from '../pages/admin/Training';
import Reports from '../pages/admin/Reports';
import EmployeeProfile from '../pages/employee/Profile';
import EmployeeRequests from '../pages/employee/Requests';
import EmployeeDocuments from '../pages/employee/Documents';

// Protect routes by auth + role.
const PrivateRoute = ({ children, roles }) => {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/careers" element={<JobBoard />} />
          <Route path="/apply/:jobId" element={<ApplyForm />} />
          <Route path="/meeting-calendar" element={<MeetingCalendar />} />
        </Route>

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Admin Routes - Nested with Layout */}
        <Route
          path="/admin"
          element={
            <PrivateRoute roles={['admin', 'super-admin', 'hr']}>
              <AdminLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="ats" element={<ATS />} />
          <Route path="employees" element={<Employees />} />
          <Route path="interviews" element={<Interviews />} />
          <Route path="training" element={<Training />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        {/* Employee Routes */}
        <Route
          path="/employee"
          element={
            <PrivateRoute roles={['employee']}>
              <EmployeeLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<EmployeeProfile />} />
          <Route path="requests" element={<EmployeeRequests />} />
          <Route path="documents" element={<EmployeeDocuments />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
