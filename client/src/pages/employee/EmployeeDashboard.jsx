import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Card, LoadingSpinner } from '../../components/ui';
import { MapPin, Briefcase, Clock, User } from 'lucide-react';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [employee, setEmployee] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        setError('');

        const results = await Promise.all([
          api.get(`/employees/${user?.id}`),
          api.get('/announcements?limit=5'),
          api.get('/requests/my?limit=5'),
        ]);

        setEmployee(results[0].data.data);
        setAnnouncements(results[1].data.data || []);
        setRequests(results[2].data.data || []);
      } catch (err) {
        const errorMsg =
          typeof err?.response?.data?.error === 'string'
            ? err.response.data.error
            : typeof err?.response?.data?.message === 'string'
            ? err.response.data.message
            : typeof err?.message === 'string'
            ? err.message
            : 'Failed to load dashboard';
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [user?.id]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const getStatusColor = (status) => {
    return status === 'active'
      ? 'bg-green-100 text-green-800'
      : status === 'on-leave'
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-red-100 text-red-800';
  };

  const getStatusLabel = (status) => {
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
  };

  const getRequestStatusColor = (status) => {
    return status === 'approved'
      ? 'bg-green-100 text-green-800'
      : status === 'rejected'
      ? 'bg-red-100 text-red-800'
      : 'bg-yellow-100 text-yellow-800';
  };

  const avatarUrl = employee?.profilePicUrl
    ? employee.profilePicUrl
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'employee'}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {employee?.firstName || user?.name || 'Employee'}
        </h1>
        <p className="text-gray-600 mt-2">Here's your workspace overview</p>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      ) : null}

      {/* Top Row: Profile Card & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1 border border-gray-200">
          <div className="flex flex-col items-center text-center">
            <img
              src={avatarUrl}
              alt={employee?.firstName || 'Employee'}
              className="w-24 h-24 rounded-full border-4 border-gray-200 object-cover"
            />
            <h2 className="text-xl font-bold text-gray-900 mt-4">
              {employee?.firstName} {employee?.lastName}
            </h2>
            <p className="text-sm text-gray-600 mt-1">{employee?.positionTitle}</p>
            <p className="text-sm text-gray-500 flex items-center justify-center gap-2 mt-2">
              <MapPin size={16} />
              {employee?.department}
            </p>
            <span
              className={`inline-block mt-4 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                employee?.status
              )}`}
            >
              {getStatusLabel(employee?.status)}
            </span>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/employee/profile')}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-md transition-all text-left"
          >
            <User className="text-blue-600 mb-2" size={24} />
            <h3 className="font-semibold text-gray-900">Edit Profile</h3>
            <p className="text-sm text-gray-500 mt-1">Update your information</p>
          </button>

          <button
            onClick={() => navigate('/employee/contact-hr')}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-md transition-all text-left"
          >
            <Briefcase className="text-blue-600 mb-2" size={24} />
            <h3 className="font-semibold text-gray-900">Submit Request</h3>
            <p className="text-sm text-gray-500 mt-1">Meeting or talent request</p>
          </button>

          <button
            onClick={() => navigate('/')}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-md transition-all text-left"
          >
            <Briefcase className="text-blue-600 mb-2" size={24} />
            <h3 className="font-semibold text-gray-900">Browse Jobs</h3>
            <p className="text-sm text-gray-500 mt-1">View open positions</p>
          </button>

          <button
            onClick={() => navigate('/employee/contact-hr')}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-md transition-all text-left"
          >
            <Clock className="text-blue-600 mb-2" size={24} />
            <h3 className="font-semibold text-gray-900">Contact HR</h3>
            <p className="text-sm text-gray-500 mt-1">Get HR support</p>
          </button>
        </div>
      </div>

      {/* Bottom Row: Announcements & Recent Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Announcements */}
        <Card className="border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Announcements</h3>
          {announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement._id}
                  className="border-b border-gray-200 pb-4 last:border-b-0"
                >
                  <h4 className="font-medium text-gray-900">{announcement.title}</h4>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {announcement.content}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No announcements yet</p>
          )}
        </Card>

        {/* My Recent Requests */}
        <Card className="border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">My Recent Requests</h3>
          {requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request._id}
                  className="border-b border-gray-200 pb-4 last:border-b-0 flex items-start justify-between"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {request.subject || request.positionTitle}
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`ml-2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getRequestStatusColor(
                      request.status
                    )}`}
                  >
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No requests yet</p>
          )}
        </Card>
      </div>
    </div>
  );
}
