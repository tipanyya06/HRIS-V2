import React, { useCallback, useEffect, useState } from 'react';
import api from '../../lib/api';
import { Card, LoadingSpinner, Toast } from '../../components/ui';

const STATUS_STYLES = {
  pending: 'bg-gray-100 text-gray-700',
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

export default function ApplicantPreEmployment() {
  const [record, setRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [uploadingKey, setUploadingKey] = useState('');

  const fetchRecord = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await api.get('/pre-employment/my');
      setRecord(response.data?.data || null);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load pre-employment checklist'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);

  const handleUpload = async (itemKey, file) => {
    if (!file) return;

    try {
      setUploadingKey(itemKey);
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', 'pre-employment');

      const uploadResponse = await api.post('/upload/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const documentUrl = uploadResponse.data?.data?.documentUrl;

      if (!documentUrl) {
        throw new Error('Upload succeeded but no document URL was returned');
      }

      const response = await api.patch(`/pre-employment/my/items/${itemKey}`, {
        documentUrl,
        originalName: file.name,
      });

      setRecord(response.data?.data || null);
      setToastType('success');
      setToastMessage('Document uploaded successfully');
    } catch (err) {
      setToastType('error');
      setToastMessage(extractErrorMessage(err, 'Failed to upload document'));
    } finally {
      setUploadingKey('');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pre-Employment</h1>
        <p className="text-gray-600 mt-2">Upload and track your pre-employment requirements.</p>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      ) : null}

      {toastMessage ? (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      ) : null}

      <Card className="border border-gray-200">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-gray-500">Overall Status</p>
            <p className="text-lg font-semibold text-gray-900 capitalize">{record?.overallStatus || 'not-started'}</p>
          </div>
          <div className="text-sm text-gray-500">
            {(record?.items || []).filter((item) => item.status === 'approved').length} of {(record?.items || []).length} approved
          </div>
        </div>
      </Card>

      <div className="grid gap-4">
        {(record?.items || []).map((item) => (
          <Card key={item.key} className="border border-gray-200">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold text-gray-900">{item.label}</h2>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[item.status] || STATUS_STYLES.pending}`}>
                    {item.status}
                  </span>
                </div>
                {item.originalName ? (
                  <p className="text-sm text-gray-500 mt-1">Latest upload: {item.originalName}</p>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">No file uploaded yet</p>
                )}
                {item.adminNote ? (
                  <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Admin Note</p>
                    <p className="text-sm text-blue-800">{item.adminNote}</p>
                  </div>
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
                <label className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                  {uploadingKey === item.key ? 'Uploading...' : 'Upload'}
                  <input
                    type="file"
                    onChange={(event) => handleUpload(item.key, event.target.files?.[0])}
                    className="hidden"
                    disabled={uploadingKey === item.key}
                  />
                </label>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
