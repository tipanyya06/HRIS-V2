import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { LoadingSpinner } from '../../components/ui';
import { Calendar } from 'lucide-react';

const extractErrorMessage = (error) => {
  if (typeof error?.response?.data?.error === 'string') {
    return error.response.data.error;
  }
  if (typeof error?.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  if (typeof error?.message === 'string') {
    return error.message;
  }
  return 'Failed to load requests';
};

const getStatusBadgeColor = (status) => {
  return status === 'approved'
    ? 'bg-green-100 text-green-800'
    : status === 'rejected'
    ? 'bg-red-100 text-red-800'
    : 'bg-yellow-100 text-yellow-800';
};

const getStatusLabel = (status) => {
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending';
};

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadRequests = async () => {
      try {
        setIsLoading(true);
        setError('');
        const response = await api.get('/requests/my');
        setRequests(response.data.data || []);
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    loadRequests();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const meetingRequests = requests.filter((r) => r.requestType === 'meeting' || r.model === 'MeetingRequest');
  const talentRequests = requests.filter((r) => r.requestType === 'talent' || r.model === 'TalentRequest');

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Requests</h1>
        <p className="text-gray-600 mt-2">View your submitted requests and their status</p>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      ) : null}

      {/* Meeting Requests Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Meeting Requests</h2>
        {meetingRequests.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600">No meeting requests submitted yet</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {meetingRequests.map((request) => (
              <div
                key={request._id}
                className="bg-white border border-gray-200 rounded-lg p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {request.subject || request.title || 'Meeting Request'}
                    </h3>
                    <div className="space-y-2 mt-3">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Type:</span> {request.type || request.meetingType || '—'}
                      </p>
                      {request.preferredDate ? (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar size={16} />
                          <span className="font-medium">Date:</span> {formatDate(request.preferredDate)}
                        </div>
                      ) : null}
                      {request.location ? (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Location:</span> {request.location}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-sm font-medium whitespace-nowrap ${getStatusBadgeColor(
                      request.status
                    )}`}
                  >
                    {getStatusLabel(request.status)}
                  </span>
                </div>
                {request.rejectionReason ? (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium text-red-700">Rejection Reason:</span>
                      <span className="text-gray-600 ml-2">{request.rejectionReason}</span>
                    </p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Talent/TARF Requests Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Talent Acquisition Requests</h2>
        {talentRequests.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600">No talent requests submitted yet</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {talentRequests.map((request) => (
              <div
                key={request._id}
                className="bg-white border border-gray-200 rounded-lg p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {request.positionTitle || request.title || 'Talent Request'}
                    </h3>
                    <div className="space-y-2 mt-3">
                      {request.department ? (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Department:</span> {request.department}
                        </p>
                      ) : null}
                      {request.headcountNeeded ? (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Headcount:</span> {request.headcountNeeded}
                        </p>
                      ) : null}
                      {request.employmentType ? (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Employment Type:</span> {request.employmentType}
                        </p>
                      ) : null}
                      {request.targetDate ? (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar size={16} />
                          <span className="font-medium">Target Date:</span> {formatDate(request.targetDate)}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-sm font-medium whitespace-nowrap ${getStatusBadgeColor(
                      request.status
                    )}`}
                  >
                    {getStatusLabel(request.status)}
                  </span>
                </div>
                {request.rejectionReason ? (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium text-red-700">Rejection Reason:</span>
                      <span className="text-gray-600 ml-2">{request.rejectionReason}</span>
                    </p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {meetingRequests.length === 0 && talentRequests.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700 text-sm">
          No requests submitted yet. Visit the{' '}
          <span className="font-medium">Contact HR</span> page to submit meeting or talent acquisition requests.
        </div>
      ) : null}
    </div>
  );
}
