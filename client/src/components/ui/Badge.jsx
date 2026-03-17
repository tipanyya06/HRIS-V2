import React from 'react';

export default function Badge({ status, label }) {
  const colors = {
    active: 'bg-green-50 text-green-700 border-green-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    inactive: 'bg-red-50 text-red-700 border-red-200',
    terminated: 'bg-gray-50 text-gray-500 border-gray-200',
    hired: 'bg-blue-50 text-blue-700 border-blue-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    interview: 'bg-blue-50 text-blue-700 border-blue-200',
    draft: 'bg-gray-50 text-gray-600 border-gray-200',
    closed: 'bg-red-50 text-red-700 border-red-200',
    overdue: 'bg-red-50 text-red-700 border-red-200',
    quiet: 'bg-gray-50 text-gray-500 border-gray-200',
    // Applicant stages
    applied: 'bg-gray-50 text-gray-600 border-gray-200',
    screening: 'bg-amber-50 text-amber-700 border-amber-200',
    offer: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${colors[status] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
      {label}
    </span>
  );
}
