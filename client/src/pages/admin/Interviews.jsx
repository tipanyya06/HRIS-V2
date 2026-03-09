import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import api from '../../lib/api';
import {
  Badge,
  Button,
  Card,
  LoadingSpinner,
  Modal,
  PageHeader,
  Select,
  Table,
  Toast,
} from '../../components/ui';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rescheduled', label: 'Rescheduled' },
];

const extractErrorMessage = (error, fallbackMessage) => {
  if (typeof error?.response?.data?.error === 'string') {
    return error.response.data.error;
  }
  if (typeof error?.response?.data?.error?.message === 'string') {
    return error.response.data.error.message;
  }
  if (typeof error?.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  if (typeof error?.message === 'string') {
    return error.message;
  }
  return fallbackMessage;
};

export default function Interviews() {
  const now = new Date();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [isUpdating, setIsUpdating] = useState(false);

  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [statusFilter, setStatusFilter] = useState('');

  const [interviews, setInterviews] = useState([]);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');

  const monthOptions = useMemo(() => (
    Array.from({ length: 12 }).map((_, index) => ({
      value: String(index + 1),
      label: String(index + 1),
    }))
  ), []);

  const yearOptions = useMemo(() => (
    [
      { value: String(now.getFullYear() - 1), label: String(now.getFullYear() - 1) },
      { value: String(now.getFullYear()), label: String(now.getFullYear()) },
      { value: String(now.getFullYear() + 1), label: String(now.getFullYear() + 1) },
    ]
  ), [now]);

  const statusBadgeType = (status) => {
    if (status === 'completed') return 'hired';
    if (status === 'cancelled') return 'rejected';
    if (status === 'scheduled' || status === 'rescheduled') return 'interview';
    return 'pending';
  };

  const loadInterviews = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');

      const params = {
        month,
        year,
      };

      if (statusFilter) {
        params.status = statusFilter;
      }

      const { data } = await api.get('/interviews', { params });
      setInterviews(data?.data || []);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error, 'Unable to load interviews.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInterviews();
  }, [month, year, statusFilter]);

  const openStatusModal = (interview) => {
    setSelectedInterview(interview);
    setSelectedStatus(interview.status || 'scheduled');
  };

  const handleUpdateStatus = async () => {
    if (!selectedInterview?._id || !selectedStatus) {
      return;
    }

    try {
      setIsUpdating(true);
      await api.patch(`/interviews/${selectedInterview._id}/status`, {
        status: selectedStatus,
      });

      setInterviews((prev) =>
        prev.map((item) =>
          item._id === selectedInterview._id
            ? { ...item, status: selectedStatus }
            : item
        )
      );

      setToastType('success');
      setToastMessage('Interview status updated.');
      setSelectedInterview(null);
      setSelectedStatus('');
    } catch (error) {
      setToastType('error');
      setToastMessage(extractErrorMessage(error, 'Failed to update interview status.'));
    } finally {
      setIsUpdating(false);
    }
  };

  const columns = [
    {
      key: 'applicantEmail',
      label: 'Applicant',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.receiverName || 'Candidate'}</p>
          <p className="text-xs text-slate-500">{row.applicantEmail || '-'}</p>
        </div>
      ),
    },
    {
      key: 'scheduledAt',
      label: 'Schedule',
      render: (row) => (
        <div>
          <p className="text-slate-900">{new Date(row.scheduledAt).toLocaleDateString()}</p>
          <p className="text-xs text-slate-500">{new Date(row.scheduledAt).toLocaleTimeString()}</p>
        </div>
      ),
    },
    {
      key: 'timezone',
      label: 'Timezone',
      render: (row) => <span className="text-slate-700 text-sm">{row.timezone || 'Asia/Manila'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge
          status={statusBadgeType(row.status)}
          label={(row.status || 'pending').toUpperCase()}
        />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <Button size="sm" variant="secondary" onClick={() => openStatusModal(row)}>
          Update Status
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Interviews"
        subtitle="Track and manage scheduled interviews"
      />

      <Card className="border border-slate-200 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <Select
            label="Month"
            name="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            options={monthOptions}
          />
          <Select
            label="Year"
            name="year"
            value={year}
            onChange={(event) => setYear(event.target.value)}
            options={yearOptions}
          />
          <Select
            label="Status"
            name="status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            options={STATUS_OPTIONS}
          />
          <Button onClick={loadInterviews} variant="primary">
            Refresh
          </Button>
        </div>
      </Card>

      {errorMessage ? (
        <Card className="border border-red-200 bg-red-50 mb-4">
          <p className="text-red-700">{errorMessage}</p>
        </Card>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <Card className="border border-slate-200">
          <Table
            columns={columns}
            data={interviews}
            isLoading={false}
            emptyMessage="No interviews found for selected filters"
          />
        </Card>
      )}

      <Modal
        isOpen={Boolean(selectedInterview)}
        onClose={() => setSelectedInterview(null)}
        title="Update Interview Status"
      >
        <div className="space-y-4">
          <Select
            label="New Status"
            name="newStatus"
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
            options={STATUS_OPTIONS}
          />

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setSelectedInterview(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} isLoading={isUpdating}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {toastMessage ? (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      ) : null}
    </div>
  );
}
