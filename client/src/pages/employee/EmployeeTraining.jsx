import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Award, Download, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

const extractErrorMessage = (err) => {
  if (typeof err?.response?.data?.error === 'string') {
    return err.response.data.error;
  }
  if (typeof err?.message === 'string') {
    return err.message;
  }
  return 'Something went wrong';
};

const EmployeeTraining = () => {
  const { user } = useAuthStore();
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTraining();
  }, []);

  const fetchTraining = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await api.get('/training/my');
      setRecords(response.data.data || []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-100 text-green-700',
      expired: 'bg-red-100 text-red-700',
      'in-progress': 'bg-blue-100 text-blue-700',
    };
    return `px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-600'}`;
  };

  const getExpiryInfo = (expiresAt) => {
    if (!expiresAt) return null;
    const days = Math.ceil((new Date(expiresAt) - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0)
      return {
        label: 'Expired',
        color: 'text-red-600',
        Icon: AlertTriangle,
      };
    if (days <= 30)
      return {
        label: `Expires in ${days} days`,
        color: 'text-orange-500',
        Icon: AlertTriangle,
      };
    return {
      label: `Expires ${new Date(expiresAt).toLocaleDateString()}`,
      color: 'text-gray-400',
      Icon: Clock,
    };
  };

  const getCompletionPercent = (status) => {
    if (status === 'completed') return 100;
    if (status === 'in-progress') return 50;
    if (status === 'expired') return 100;
    return 0;
  };

  const completedCount = records.filter((r) => r.status === 'completed').length;

  const expiringSoonCount = records.filter((r) => {
    if (!r.expiresAt) return false;
    const days = Math.ceil((new Date(r.expiresAt) - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 && days <= 30;
  }).length;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">My Training</h1>
      <p className="text-gray-500 text-sm mb-6">Your certifications and training records</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Records', value: records.length },
          { label: 'Completed', value: completedCount },
          { label: 'Expiring Soon', value: expiringSoonCount },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Award className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No training records found</p>
          <p className="text-gray-400 text-sm mt-1">
            Your training history will appear here once added by HR.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => {
            const expiryInfo = getExpiryInfo(record.expiresAt);
            const pct = getCompletionPercent(record.status);
            return (
              <div key={record._id} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Award
                      className={`w-5 h-5 ${
                        record.status === 'completed' ? 'text-green-500' : 'text-gray-400'
                      }`}
                    />
                    <div>
                      <p className="font-semibold text-gray-800">{record.courseName}</p>
                      <p className="text-sm text-gray-500">{record.provider || '—'}</p>
                    </div>
                  </div>
                  <span className={getStatusBadge(record.status)}>{record.status}</span>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        record.status === 'expired'
                          ? 'bg-red-400'
                          : record.status === 'completed'
                            ? 'bg-green-500'
                            : 'bg-blue-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs text-gray-500">
                    Completed:{' '}
                    {record.completedAt ? new Date(record.completedAt).toLocaleDateString() : '—'}
                  </span>

                  {expiryInfo ? (
                    <span className={`flex items-center gap-1 text-xs ${expiryInfo.color}`}>
                      <expiryInfo.Icon className="w-3 h-3" />
                      {expiryInfo.label}
                    </span>
                  ) : null}

                  {record.certUrl ? (
                    <a
                      href={record.certUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
                    >
                      <Download className="w-3 h-3" />
                      Download Certificate
                    </a>
                  ) : (
                    <span className="text-xs text-gray-300">No certificate</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EmployeeTraining;
