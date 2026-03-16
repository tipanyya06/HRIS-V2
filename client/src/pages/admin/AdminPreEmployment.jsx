import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../lib/api';
import { Button, Card, LoadingSpinner, Table, Toast } from '../../components/ui';

const STATUS_STYLES = {
  'not-started': 'bg-gray-100 text-gray-700',
  'in-progress': 'bg-yellow-100 text-yellow-800',
  submitted: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const extractErrorMessage = (error, fallback) => {
  if (typeof error?.response?.data?.error === 'string') return error.response.data.error;
  if (typeof error?.response?.data?.message === 'string') return error.response.data.message;
  if (typeof error?.message === 'string') return error.message;
  return fallback;
};

const getApplicantName = (user) => {
  const firstName = user?.personalInfo?.givenName || '';
  const lastName = user?.personalInfo?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || user?.email || 'Unknown Applicant';
};

export default function AdminPreEmployment() {
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewing, setIsReviewing] = useState('');
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const fetchRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await api.get('/pre-employment');
      const list = response.data?.data || [];
      setRecords(list);
      if (list.length > 0 && !selectedRecord) {
        setSelectedRecord(list[0]);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load pre-employment records'));
    } finally {
      setIsLoading(false);
    }
  }, [selectedRecord]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleReview = async (recordId, itemKey, status) => {
    try {
      setIsReviewing(`${recordId}:${itemKey}:${status}`);
      const response = await api.patch(`/pre-employment/${recordId}/items/${itemKey}/review`, {
        status,
      });
      const updated = response.data?.data;
      setRecords((prev) =>
        prev.map((record) =>
          record._id === updated._id
            ? { ...record, ...updated, position: updated.position || record.position || '' }
            : record
        )
      );
      setSelectedRecord((prev) =>
        prev?._id === updated._id
          ? { ...prev, ...updated, position: updated.position || prev.position || '' }
          : prev
      );
      setToastType('success');
      setToastMessage(`Checklist item ${status}`);
    } catch (err) {
      setToastType('error');
      setToastMessage(extractErrorMessage(err, 'Failed to review checklist item'));
    } finally {
      setIsReviewing('');
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'applicant',
        label: 'Applicant',
        render: (row) => (
          <div>
            <div className="font-medium text-gray-900">{getApplicantName(row.userId)}</div>
            <div className="text-xs text-gray-400">{row.userId?.email || '—'}</div>
          </div>
        ),
      },
      {
        key: 'overallStatus',
        label: 'Overall Status',
        render: (row) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[row.overallStatus] || STATUS_STYLES['not-started']}`}>
            {row.overallStatus}
          </span>
        ),
      },
      {
        key: 'position',
        label: 'Position',
        render: (row) => <span className="text-sm text-gray-700">{row.position || '—'}</span>,
      },
      {
        key: 'progress',
        label: 'Progress',
        render: (row) => {
          const approved = (row.items || []).filter((item) => item.status === 'approved').length;
          return <span className="text-sm text-gray-600">{approved} / {(row.items || []).length} approved</span>;
        },
      },
      {
        key: 'action',
        label: 'Action',
        render: (row) => (
          <Button size="sm" variant="secondary" onClick={() => setSelectedRecord(row)}>
            Open
          </Button>
        ),
      },
    ],
    []
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pre-Employment</h1>
        <p className="text-gray-600 mt-2">Review applicant checklist submissions and approve requirements.</p>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      ) : null}

      {toastMessage ? (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      ) : null}

      <Card className="border border-gray-200 p-0 overflow-hidden">
        <Table data={records} columns={columns} emptyMessage="No pre-employment records found." />
      </Card>

      {selectedRecord ? (
        <Card className="border border-gray-200">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{getApplicantName(selectedRecord.userId)}</h2>
              <p className="text-sm text-gray-500">{selectedRecord.userId?.email || '—'}</p>
              <p className="text-sm text-gray-500">Position: {selectedRecord.position || '—'}</p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[selectedRecord.overallStatus] || STATUS_STYLES['not-started']}`}>
              {selectedRecord.overallStatus}
            </span>
          </div>

          <div className="space-y-4">
            {(selectedRecord.items || []).map((item) => (
              <div key={item.key} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{item.label}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[item.status] || STATUS_STYLES.pending}`}>
                        {item.status}
                      </span>
                    </div>
                    {item.originalName ? (
                      <p className="text-sm text-gray-500 mt-1">{item.originalName}</p>
                    ) : (
                      <p className="text-sm text-gray-500 mt-1">No file uploaded</p>
                    )}
                    {item.adminNote ? (
                      <p className="text-sm text-gray-600 mt-2">Note: {item.adminNote}</p>
                    ) : null}
                  </div>

                  <div className="flex gap-2 items-center flex-wrap">
                    {item.documentUrl ? (
                      <a
                        href={item.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        View File
                      </a>
                    ) : null}
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleReview(selectedRecord._id, item.key, 'approved')}
                      isLoading={isReviewing === `${selectedRecord._id}:${item.key}:approved`}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleReview(selectedRecord._id, item.key, 'rejected')}
                      isLoading={isReviewing === `${selectedRecord._id}:${item.key}:rejected`}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
