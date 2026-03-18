import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { LoadingSpinner, Button, Badge } from '../../components/ui';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Toast from '../../components/ui/Toast';
import PageHeader from '../../components/ui/PageHeader';

export default function Jobs() {
  // Main state
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  // Form state
  const [form, setForm] = useState({
    title: '',
    department: '',
    description: '',
    slots: 1,
    status: 'active',
    country: 'Philippines',
    requirements: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Filter state
  const [tab, setTab] = useState('all');

  // Fetch jobs on mount
  useEffect(() => {
    fetchJobs();
  }, []);

  // FETCH DATA
  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await api.get('/jobs');
      setJobs(response.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load jobs');
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  // HANDLERS
  const openCreate = () => {
    setEditingJob(null);
    setForm({
      title: '',
      department: '',
      description: '',
      slots: 1,
      status: 'active',
      country: 'Philippines',
      requirements: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEdit = (job) => {
    setEditingJob(job);
    setForm({
      title: job.title,
      department: job.department,
      description: job.description,
      slots: job.slots,
      status: job.status,
      country: job.country || 'Philippines',
      requirements: (job.requirements || []).join(', '),
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    setFormError('');

    // Validation
    if (!form.title || !form.department || !form.description || !form.slots) {
      setFormError('Please fill in all required fields.');
      return;
    }

    const payload = {
      ...form,
      slots: parseInt(form.slots),
      requirements: form.requirements
        .split(',')
        .map((r) => r.trim())
        .filter((r) => r.length > 0),
    };

    try {
      setIsSubmitting(true);

      if (editingJob) {
        // Update
        await api.patch(`/jobs/${editingJob._id}`, payload);
        setToast({
          message: 'Job updated successfully.',
          type: 'success',
        });
      } else {
        // Create
        await api.post('/jobs', payload);
        setToast({
          message: 'Job created successfully.',
          type: 'success',
        });
      }

      setIsModalOpen(false);
      fetchJobs();
    } catch (err) {
      setFormError(
        err.response?.data?.message || 'Failed to save job.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusToggle = async (job) => {
    try {
      const newStatus = job.status === 'active' ? 'closed' : 'active';
      await api.patch(`/jobs/${job._id}`, { status: newStatus });
      setToast({
        message: 'Status updated successfully.',
        type: 'success',
      });
      fetchJobs();
    } catch (err) {
      setToast({
        message: 'Failed to update status.',
        type: 'error',
      });
    }
  };

  const handleDelete = async (job) => {
    if (!window.confirm('Close this job posting?')) return;

    try {
      await api.delete(`/jobs/${job._id}`);
      setToast({
        message: 'Job closed successfully.',
        type: 'success',
      });
      fetchJobs();
    } catch (err) {
      setToast({
        message: 'Failed to close job.',
        type: 'error',
      });
    }
  };

  // FILTERS
  const displayedJobs =
    tab === 'all'
      ? jobs
      : jobs.filter((j) => j.status === tab);

  // STATS
  const stats = [
    {
      label: 'Total Jobs',
      value: jobs.length,
    },
    {
      label: 'Active',
      value: jobs.filter((j) => j.status === 'active').length,
    },
    {
      label: 'Closed',
      value: jobs.filter((j) => j.status === 'closed').length,
    },
    {
      label: 'Draft',
      value: jobs.filter((j) => j.status === 'draft').length,
    },
  ];

  // TABLE COLUMNS
  const columns = [
    {
      key: 'title',
      label: 'Position',
      render: (job) => (
        <div>
          <div className="font-medium text-gray-900">{job.title}</div>
          <div className="text-xs text-gray-400">{job.department}</div>
        </div>
      ),
    },
    {
      key: 'slots',
      label: 'Slots',
      render: (job) => <span className="text-sm text-gray-700">{job.slots}</span>,
    },
    {
      key: 'country',
      label: 'Location',
      render: (job) => (
        <span className="text-sm text-gray-600">{job.country || '—'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (job) => (
        <Badge
          status={job.status}
          label={job.status.charAt(0).toUpperCase() + job.status.slice(1)}
        />
      ),
    },
    {
      key: 'created_at',
      label: 'Posted',
      render: (job) => (
        <span className="text-sm text-gray-500">
          {new Date(job.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (job) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openEdit(job)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant={job.status === 'active' ? 'secondary' : 'primary'}
            onClick={() => handleStatusToggle(job)}
          >
            {job.status === 'active' ? 'Close' : 'Reopen'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full px-6 py-5 flex flex-col gap-4">
      {/* PAGE HEADER */}
      <PageHeader
        title="Job Postings"
        subtitle="Manage all open, draft, and closed positions"
        action={
          <Button variant="primary" onClick={openCreate}>
            + New Job
          </Button>
        }
      />

      {/* STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              {stat.label}
            </div>
            <div className="text-2xl font-bold text-[#223B5B]">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* FILTER TABS */}
      <div className="flex gap-2 mb-4">
        {['all', 'active', 'draft', 'closed'].map((tabName) => (
          <button
            key={tabName}
            onClick={() => setTab(tabName)}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              tab === tabName
                ? 'bg-[#185FA5] border-[#185FA5] text-white hover:bg-[#0C447C] hover:border-[#0C447C]'
                : 'bg-white border-slate-200 text-slate-600 hover:border-[#185FA5] hover:text-[#185FA5]'
            }`}
          >
            {tabName.charAt(0).toUpperCase() + tabName.slice(1)}
          </button>
        ))}
      </div>

      {/* JOBS TABLE */}
      <Table
        data={displayedJobs}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No job postings found."
      />

      {/* TOAST */}
      {toast ? (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      ) : null}

      {/* CREATE/EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingJob ? 'Edit Job Posting' : 'Create Job Posting'}
        size="lg"
      >
        <div className="flex flex-col gap-4">
          {/* Row 1 */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Job Title"
              name="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              isRequired
              placeholder="e.g. Senior React Developer"
            />
            <Input
              label="Department"
              name="department"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              isRequired
              placeholder="e.g. Engineering"
            />
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Slots"
              name="slots"
              type="number"
              value={form.slots}
              onChange={(e) => setForm({ ...form, slots: e.target.value })}
              isRequired
              min="1"
            />
            <Select
              label="Status"
              name="status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'draft', label: 'Draft' },
                { value: 'closed', label: 'Closed' },
              ]}
            />
            <Select
              label="Country"
              name="country"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              options={[
                { value: 'Philippines', label: 'Philippines' },
                { value: 'USA', label: 'USA' },
                { value: 'Indonesia', label: 'Indonesia' },
              ]}
            />
          </div>

          {/* Row 3 */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Job Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              placeholder="Describe the role and responsibilities..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm resize-none"
            />
          </div>

          {/* Row 4 */}
          <Input
            label="Requirements (comma-separated)"
            name="requirements"
            value={form.requirements}
            onChange={(e) => setForm({ ...form, requirements: e.target.value })}
            placeholder="e.g. React, Node.js, MongoDB"
          />

          {/* Form Error */}
          {formError ? (
            <p className="text-sm text-red-500 text-center">{formError}</p>
          ) : null}

          {/* Modal Actions */}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              isDisabled={isSubmitting}
            >
              {editingJob ? 'Save Changes' : 'Create Job'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
