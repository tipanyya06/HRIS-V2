import React from 'react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
    setWarning('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setWarning('');

    try {
      const result = await login(formData.email, formData.password);
      const role = result?.user?.role;

      // Redirect based on role
      if (['admin', 'super-admin', 'hr'].includes(role)) navigate('/admin/dashboard');
      else if (role === 'employee')                       navigate('/employee/profile');
      else if (role === 'applicant')                      navigate('/applicant/dashboard');
      else                                                navigate('/pending');
    } catch (err) {
      // Extract error message
      let errorMessage = 'Login failed. Please try again.';
      if (err.response?.data?.error) {
        if (typeof err.response.data.error === 'object' && err.response.data.error.message) {
          errorMessage = err.response.data.error.message;
        } else if (typeof err.response.data.error === 'string') {
          errorMessage = err.response.data.error;
        }
      }
      
      // Check if this is a pending approval message
      const isPendingMessage = errorMessage.toLowerCase().includes('pending');
      if (isPendingMessage) {
        setWarning(errorMessage);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        {/* Header */}
        <h1 className="text-3xl font-bold text-center mb-2">Madison 88</h1>
        <p className="text-center text-gray-600 mb-8">HRIS & ATS Platform</p>

        {/* Error Message (Red) */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Warning Message (Yellow - for pending status) */}
        {warning && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
            {warning}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 rounded-lg transition"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-gray-600 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-600 hover:underline font-medium">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
