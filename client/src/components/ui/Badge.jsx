import React from 'react';

export default function Badge({ status, label }) {
  const colors = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    inactive: 'bg-red-100 text-red-700',
    terminated: 'bg-gray-200 text-gray-600',
    hired: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    interview: 'bg-blue-100 text-blue-800',
    draft: 'bg-yellow-100 text-yellow-800',
    closed: 'bg-red-100 text-red-800',
    // Applicant stages
    applied: 'bg-gray-100 text-gray-700',
    screening: 'bg-yellow-100 text-yellow-800',
    offer: 'bg-purple-100 text-purple-800',
  };

  return (
    <span className={`px-2 py-1 rounded text-sm font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {label}
    </span>
  );
}
