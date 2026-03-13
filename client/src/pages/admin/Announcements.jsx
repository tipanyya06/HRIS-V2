import React, { useState, useEffect } from 'react';
import { Bell, Edit2, Trash2, X } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { LoadingSpinner, Button, Badge, Modal, Table, Toast } from '../../components/ui';

const PRIORITY_COLORS = {
  urgent: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  normal: 'bg-blue-100 text-blue-800',
  low: 'bg-gray-100 text-gray-700',
};

const AUDIENCE_LABELS = {
  all: 'All',
  employees: 'Employees Only',
  admins: 'Admin Only',
};

export default function Announcements() {
  const user = useAuthStore((state) => state.user);

  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    priority: 'normal',
    targetAudience: 'all',
    isActive: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Fetch announcements on mount
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await api.get('/announcements?limit=50');
      setAnnouncements(response.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Failed to load announcements');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (announcement = null) => {
    if (announcement) {
      setEditingAnnouncement(announcement);
      setFormData({
        title: announcement.title,
        body: announcement.body,
        priority: announcement.priority,
        targetAudience: announcement.targetAudience,
        isActive: announcement.isActive,
      });
    } else {
      setEditingAnnouncement(null);
      setFormData({
        title: '',
        body: '',
        priority: 'normal',
        targetAudience: 'all',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      body: '',
      priority: 'normal',
      targetAudience: 'all',
      isActive: true,
    });
  };

  const handleSave = async () => {
    if (!formData.title || !formData.body) {
      setToastMessage('Title and body are required');
      setToastType('error');
      return;
    }

    try {
      setIsSaving(true);
      if (editingAnnouncement) {
        // Update
        const response = await api.patch(
          `/announcements/${editingAnnouncement._id}`,
          formData
        );
        setAnnouncements(
          announcements.map((a) =>
            a._id === editingAnnouncement._id ? response.data.data : a
          )
        );
        setToastMessage('Announcement updated successfully');
      } else {
        // Create
        const response = await api.post('/announcements', formData);
        setAnnouncements([response.data.data, ...announcements]);
        setToastMessage('Announcement created successfully');
      }
      setToastType('success');
      closeModal();
    } catch (err) {
      setToastMessage(err?.response?.data?.error || 'Failed to save announcement');
      setToastType('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (announcement) => {
    if (!window.confirm('Delete this announcement? This cannot be undone.')) return;

    try {
      await api.delete(`/announcements/${announcement._id}`);
      setAnnouncements(announcements.filter((a) => a._id !== announcement._id));
      setToastMessage('Announcement deleted successfully');
      setToastType('success');
    } catch (err) {
      setToastMessage(err?.response?.data?.error || 'Failed to delete announcement');
      setToastType('error');
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (row) => <div className="font-medium text-gray-900">{row.title}</div>,
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (row) => (
        <Badge
          className={`${PRIORITY_COLORS[row.priority] || PRIORITY_COLORS.normal}`}
        >
          {row.priority.charAt(0).toUpperCase() + row.priority.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'targetAudience',
      label: 'Audience',
      render: (row) => <span className="text-sm text-gray-700">{AUDIENCE_LABELS[row.targetAudience]}</span>,
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (row) => (
        <Badge className={row.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (row) => (
        <span className="text-sm text-gray-500">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => openModal(row)}
            className="text-blue-600 hover:text-blue-800 p-1"
            title="Edit"
          >
            <Edit2 size={18} />
          </button>
          {user?.role === 'super-admin' && (
            <button
              onClick={() => handleDelete(row)}
              className="text-red-600 hover:text-red-800 p-1"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600">Company-wide announcements and notifications</p>
        </div>
        <Button onClick={() => openModal()} variant="primary">
          <Bell size={18} className="mr-2" />
          New Announcement
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {typeof error === 'string' ? error : error?.message || 'An error occurred'}
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      )}

      {/* Table */}
      {announcements.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-6 py-3 text-left text-sm font-medium text-gray-700"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {announcements.map((announcement, idx) => (
                <tr
                  key={announcement._id}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50 border-b border-gray-200'}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 text-sm">
                      {col.render(announcement)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <Bell size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No announcements yet</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
        >
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Announcement title"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Body *
              </label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Announcement content"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Target Audience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Audience
              </label>
              <select
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="employees">Employees Only</option>
                <option value="admins">Admins Only</option>
              </select>
            </div>

            {/* Active Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Active
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-end pt-4">
              <Button
                onClick={closeModal}
                variant="secondary"
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                variant="primary"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
