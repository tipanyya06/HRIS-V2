import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Users,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Eye,
} from 'lucide-react';
import api from '../../lib/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const extractErrorMessage = (error) => {
  if (typeof error?.response?.data?.error === 'string') return error.response.data.error;
  if (typeof error?.response?.data?.message === 'string') return error.response.data.message;
  return 'Something went wrong. Please try again.';
};

const REQUEST_TYPES = [
  { key: 'all', label: 'All Requests', icon: MessageSquare },
  { key: 'meeting', label: 'Meeting Requests', icon: MessageSquare },
  { key: 'talent', label: 'Talent Acquisition', icon: Users },
  { key: 'incident', label: 'Incident Reports', icon: AlertTriangle },
];

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  reviewed: 'bg-blue-100 text-blue-800',
};

const PRIORITY_STYLES = {
  urgent: 'bg-red-100 text-red-700',
  normal: 'bg-gray-100 text-gray-600',
  low: 'bg-green-100 text-green-700',
};

export default function AdminRequests() {
  const [activeTab, setActiveTab] = useState('all');
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [adminNote, setAdminNote] = useState({});
  const [statusFilter, setStatusFilter] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.set('type', activeTab);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/requests?${params.toString()}`);
      setRequests(res.data.data || []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, statusFilter]);

  useEffect(() => {
    fetchRequests();
    setExpandedId(null);
  }, [fetchRequests]);

  const handleUpdateStatus = async (requestId, status) => {
    try {
      setUpdatingId(requestId);
      await api.patch(`/requests/${requestId}`, {
        status,
        adminNote: adminNote[requestId] || '',
      });
      setRequests((prev) =>
        prev.map((r) =>
          r._id === requestId
            ? { ...r, status, adminNote: adminNote[requestId] || r.adminNote }
            : r
        )
      );
      setExpandedId(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="w-full px-6 py-5 flex flex-col gap-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-semibold text-[#1a3a5c]">Requests</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Review and manage employee requests and approvals.</p>
        </div>
        {pendingCount > 0 ? (
          <span className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full">
            {pendingCount} pending
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-2 border-b border-gray-200 flex-1">
          {REQUEST_TYPES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm mb-4">
          {error}
          <button onClick={fetchRequests} className="ml-3 underline">Retry</button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No requests found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const employeeName = req.userId?.personalInfo?.givenName
              ? `${req.userId.personalInfo.givenName} ${req.userId.personalInfo.surname || ''}`.trim()
              : req.userId?.email || 'Unknown';

            return (
              <div
                key={req._id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedId(expandedId === req._id ? null : req._id)}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        STATUS_STYLES[req.status] || STATUS_STYLES.pending
                      }`}
                    >
                      {req.status}
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        PRIORITY_STYLES[req.priority] || PRIORITY_STYLES.normal
                      }`}
                    >
                      {req.priority}
                    </span>
                    <div>
                      <p className="text-[14px] font-medium text-[#1a3a5c]">{req.subject}</p>
                      <p className="text-xs text-gray-400">
                        {employeeName} - {req.type} - {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {expandedId === req._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>

                {expandedId === req._id ? (
                  <div className="px-4 pb-5 border-t border-gray-100 pt-4 space-y-4">
                    <p className="text-[13px] text-gray-700 whitespace-pre-wrap">{req.message}</p>

                    {req.date ? (
                      <p className="text-[13px] text-gray-700">
                        Preferred date: {new Date(req.date).toLocaleDateString()}
                      </p>
                    ) : null}

                    {req.adminNote ? (
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <p className="text-[14px] font-medium text-[#1a3a5c] mb-1">Previous HR Response</p>
                        <p className="text-[13px] text-gray-700">{req.adminNote}</p>
                      </div>
                    ) : null}

                    {req.status === 'pending' || req.status === 'reviewed' ? (
                      <div className="space-y-3 pt-2 border-t border-gray-100">
                        <textarea
                          rows={3}
                          placeholder="Add a response note (optional)..."
                          value={adminNote[req._id] || ''}
                          onChange={(e) => setAdminNote((prev) => ({ ...prev, [req._id]: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateStatus(req._id, 'reviewed')}
                            disabled={updatingId === req._id}
                            className="flex items-center gap-1 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm hover:bg-blue-100 disabled:opacity-50"
                          >
                            <Eye size={14} /> Mark Reviewed
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(req._id, 'approved')}
                            disabled={updatingId === req._id}
                            className="flex items-center gap-1 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm hover:bg-green-100 disabled:opacity-50"
                          >
                            <CheckCircle size={14} /> Approve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(req._id, 'rejected')}
                            disabled={updatingId === req._id}
                            className="flex items-center gap-1 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm hover:bg-red-100 disabled:opacity-50"
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
