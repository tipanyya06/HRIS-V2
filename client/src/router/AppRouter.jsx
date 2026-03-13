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

import MeetingCalendar from '../pages/public/MeetingCalendar';
import Home from '../pages/public/Home';
import Careers from '../pages/public/Careers';
import AboutUs from '../pages/public/AboutUs';
import ContactUs from '../pages/public/ContactUs';

// Pages - Admin
import Dashboard from '../pages/admin/Dashboard';
import Jobs from '../pages/admin/Jobs';
import Applicants from '../pages/admin/Applicants';
import ATS from '../pages/admin/ATS';
import Employees from '../pages/admin/Employees';
import Interviews from '../pages/admin/Interviews';
import Training from '../pages/admin/Training';
import Reports from '../pages/admin/Reports';
import Announcements from '../pages/admin/Announcements';
import AdminList from '../pages/admin/AdminList';
import ActivityLogs from '../pages/admin/ActivityLogs';
import AdminRequests from '../pages/admin/AdminRequests';

// Pages - Employee
import EmployeeDashboard from '../pages/employee/EmployeeDashboard';
import EmployeeProfile from '../pages/employee/Profile';
import EmployeeRequests from '../pages/employee/EmployeeRequests';
import EmployeeDocuments from '../pages/employee/Documents';
import EmployeeAnnouncements from '../pages/employee/Announcements';
import EmployeeContactHR from '../pages/employee/ContactHR';
import EmployeeTraining from '../pages/employee/EmployeeTraining';

// Pages - Applicant & Auth
import ApplicantLayout from '../pages/applicant/ApplicantLayout';
import ApplicantDashboard from '../pages/applicant/ApplicantDashboard';
import MyApplications from '../pages/applicant/MyApplications';
import SavedJobs from '../pages/applicant/SavedJobs';
import ApplicantInterviews from '../pages/applicant/ApplicantInterviews';
import PendingApproval from '../pages/auth/PendingApproval';

// Protect routes by auth + role.
const PrivateRoute = ({ children, roles }) => {
  const { user } = useAuthStore();

  if (!user)
    return <Navigate to="/login" replace />;

  if (!user.role)
    return <Navigate to="/pending" replace />;

  if (user.role === 'applicant' &&
      !roles?.includes('applicant'))
    return <Navigate
      to="/applicant/dashboard" replace />;

  if (user.role === 'employee' &&
      roles?.includes('applicant') &&
      !roles?.includes('employee'))
    return <Navigate
      to="/employee/dashboard" replace />;

  if (['admin','super-admin'].includes(user.role)
      && roles?.length === 1
      && roles[0] === 'employee')
    return <Navigate to="/pending" replace />;

  if (roles && !roles.includes(user.role))
    return <Navigate to="/pending" replace />;

  return children;
};

// Redirect logged-in users away from public routes
const PublicOnlyRoute = ({ children }) => {
  const { user } = useAuthStore();

  if (!user) return children;

  if (user.role === 'applicant')
    return <Navigate 
      to="/applicant/browse-jobs" replace />;
  if (user.role === 'employee')
    return <Navigate 
      to="/employee/dashboard" replace />;
  if (['admin','super-admin','hr']
      .includes(user.role))
    return <Navigate 
      to="/admin/dashboard" replace />;
  if (!user.role)
    return <Navigate to="/pending" replace />;

  return children;
};

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={
          <PublicOnlyRoute>
            <PublicLayout />
          </PublicOnlyRoute>
        }>
          <Route path="/" element={<Home />} />
          <Route path="/jobs" element={<JobBoard />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/meeting-calendar" element={<MeetingCalendar />} />
        </Route>

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/pending" element={<PendingApproval />} />

        {/* Applicant Routes */}
        <Route
          path="/applicant"
          element={
            <PrivateRoute roles={['applicant']}>
              <ApplicantLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ApplicantDashboard />} />
          <Route path="applications" element={<MyApplications />} />
          <Route path="saved-jobs" element={<SavedJobs />} />
          <Route path="interview" element={<ApplicantInterviews />} />
          <Route path="browse-jobs" element={<JobBoard />} />
        </Route>

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
          <Route path="jobs" element={<Jobs />} />
          <Route path="applicants" element={<Applicants />} />
          <Route path="ats" element={<ATS />} />
          <Route path="employees" element={<Employees />} />
          <Route path="interviews" element={<Interviews />} />
          <Route path="training" element={<Training />} />
          <Route path="reports" element={<Reports />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="admins" element={<AdminList />} />
          <Route path="requests" element={<AdminRequests />} />
          <Route path="logs" element={<ActivityLogs />} />
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
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="profile" element={<EmployeeProfile />} />
          <Route path="requests" element={<EmployeeRequests />} />
          <Route path="announcements" element={<EmployeeAnnouncements />} />
          <Route path="contact-hr" element={<EmployeeContactHR />} />
          <Route path="documents" element={<EmployeeDocuments />} />
          <Route path="training" element={<EmployeeTraining />} />
        </Route>

        {/* Catch all - must be last */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
