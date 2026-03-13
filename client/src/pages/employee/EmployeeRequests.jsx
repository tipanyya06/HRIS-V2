import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Users,
  AlertTriangle,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import api from '../../lib/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const extractErrorMessage = (error) => {
  if (typeof error?.response?.data?.error === 'string') return error.response.data.error;
  if (typeof error?.response?.data?.message === 'string') return error.response.data.message;
  return 'Something went wrong. Please try again.';
};

const REQUEST_TYPES = [
  { key: 'meeting', label: 'Meeting Request', icon: MessageSquare, color: 'blue' },
  { key: 'talent', label: 'Talent Acquisition Form', icon: Users, color: 'purple' },
  { key: 'incident', label: 'Incident Report', icon: AlertTriangle, color: 'red' },
];

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  reviewed: 'bg-blue-100 text-blue-800',
};

export default function EmployeeRequests() {
  const [activeTab, setActiveTab] = useState('meeting');
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [form, setForm] = useState({
    subject: '',
    message: '',
    date: '',
    priority: 'normal',
  });

  const fetchRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const res = await api.get(`/requests/my?type=${activeTab}`);
      setRequests(res.data.data || []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchRequests();
    setShowForm(false);
    setFormError('');
    setFormSuccess('');
    setForm({ subject: '', message: '', date: '', priority: 'normal' });
  }, [activeTab, fetchRequests]);

  const handleSubmit = async () => {
    setFormError('');
    if (!form.subject.trim() || !form.message.trim()) {
      setFormError('Subject and message are required');
      return;
    }
    try {
      setIsSubmitting(true);
      await api.post('/requests', { type: activeTab, ...form });
      setFormSuccess('Request submitted successfully');
      setShowForm(false);
      setForm({ subject: '', message: '', date: '', priority: 'normal' });
      fetchRequests();
      setTimeout(() => setFormSuccess(''), 3000);
    } catch (err) {
      setFormError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeType = REQUEST_TYPES.find((t) => t.key === activeTab);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Requests</h1>
        <p className="text-sm text-gray-500 mt-1">Submit and track your HR requests</p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {REQUEST_TYPES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {formSuccess ? (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
          {formSuccess}
        </div>
      ) : null}

      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            setShowForm((f) => !f);
            setFormError('');
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={15} />
          New {activeType?.label}
        </button>
      </div>

      {showForm ? (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Submit {activeType?.label}</h3>

          {formError ? (
            <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {formError}
            </div>
          ) : null}

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="Brief subject of your request"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
              <textarea
                rows={4}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Describe your request in detail..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {activeTab === 'meeting' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date - Optional</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : null}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => {
                setShowForm(false);
                setFormError('');
              }}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? <LoadingSpinner /> : 'Submit Request'}
            </button>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
          <button onClick={fetchRequests} className="ml-3 underline">Retry</button>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No {activeType?.label.toLowerCase()}s yet</p>
          <p className="text-sm mt-1">Submit one using the button above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
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
                    {req.status || 'pending'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{req.subject}</p>
                    <p className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                {expandedId === req._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>

              {expandedId === req._id ? (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{req.message}</p>
                  {req.adminNote ? (
                    <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-700 mb-1">HR Response</p>
                      <p className="text-sm text-blue-800">{req.adminNote}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
