import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Protect routes by auth + role
const PrivateRoute = ({ children, roles }) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

// Placeholder pages (to be implemented)
const JobBoard = () => <div className="p-8">Job Board - Coming Soon</div>;
const Login = () => <div className="p-8">Login Page - Coming Soon</div>;
const AdminDashboard = () => <div className="p-8">Admin Dashboard - Coming Soon</div>;
const EmployeeDashboard = () => <div className="p-8">Employee Dashboard - Coming Soon</div>;

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<JobBoard />} />
        <Route path="/login" element={<Login />} />

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <PrivateRoute roles={['admin', 'super-admin']}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />

        {/* Employee Routes */}
        <Route
          path="/employee/*"
          element={
            <PrivateRoute roles={['employee']}>
              <EmployeeDashboard />
            </PrivateRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
