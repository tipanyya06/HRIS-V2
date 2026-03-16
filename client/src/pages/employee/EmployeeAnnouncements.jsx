import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { LoadingSpinner } from '../../components/ui';
import { X, Calendar } from 'lucide-react';

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
  return 'Failed to load announcements';
};

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        setIsLoading(true);
        setError('');
        const response = await api.get('/announcements?limit=20');
        setAnnouncements(response.data.data || []);
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    loadAnnouncements();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPreview = (content) => {
    if (!content) return '';
    return content.length > 100 ? `${content.substring(0, 100)}...` : content;
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
        <p className="text-gray-600 mt-2">Stay updated with company announcements</p>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      ) : null}

      {announcements.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No announcements yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {announcements.map((announcement) => (
            <div
              key={announcement._id}
              onClick={() => setSelectedAnnouncement(announcement)}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {announcement.title}
                  </h3>
                  <p className="text-gray-600 mt-2 text-sm">
                    {getPreview(announcement.body)}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      {formatDate(announcement.createdAt)}
                    </div>
                    {announcement.priority ? (
                      <span
                        className={
                          announcement.priority === 'high'
                            ? 'px-2 py-1 bg-red-100 text-red-700 rounded'
                            : announcement.priority === 'medium'
                            ? 'px-2 py-1 bg-yellow-100 text-yellow-700 rounded'
                            : 'px-2 py-1 bg-green-100 text-green-700 rounded'
                        }
                      >
                        {announcement.priority.charAt(0).toUpperCase() +
                          announcement.priority.slice(1)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedAnnouncement ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedAnnouncement.title}
                </h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    {formatDate(selectedAnnouncement.createdAt)}
                  </div>
                  {selectedAnnouncement.priority ? (
                    <span
                      className={
                        selectedAnnouncement.priority === 'high'
                          ? 'px-2 py-1 bg-red-100 text-red-700 rounded text-xs'
                          : selectedAnnouncement.priority === 'medium'
                          ? 'px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs'
                          : 'px-2 py-1 bg-green-100 text-green-700 rounded text-xs'
                      }
                    >
                      {selectedAnnouncement.priority.charAt(0).toUpperCase() +
                        selectedAnnouncement.priority.slice(1)}
                    </span>
                  ) : null}
                </div>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                {selectedAnnouncement.body}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
