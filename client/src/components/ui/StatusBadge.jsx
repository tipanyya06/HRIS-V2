export default function StatusBadge({ status }) {
  const styles = {
    // Employee statuses
    active:         'bg-green-50 text-green-700 border-green-200',
    inactive:       'bg-red-50 text-red-700 border-red-200',
    'on-leave':     'bg-amber-50 text-amber-700 border-amber-200',
    terminated:     'bg-gray-100 text-gray-500 border-gray-200',
    // ATS stages
    applied:        'bg-blue-50 text-blue-700 border-blue-200',
    screening:      'bg-amber-50 text-amber-700 border-amber-200',
    interview:      'bg-purple-50 text-purple-700 border-purple-200',
    offer:          'bg-green-50 text-green-700 border-green-200',
    hired:          'bg-green-50 text-green-700 border-green-200',
    rejected:       'bg-red-50 text-red-700 border-red-200',
    // Job & Draft statuses
    draft:          'bg-gray-100 text-gray-500 border-gray-200',
    open:           'bg-green-50 text-green-700 border-green-200',
    closed:         'bg-red-50 text-red-700 border-red-200',
    paused:         'bg-amber-50 text-amber-700 border-amber-200',
    // Performance Evaluation statuses
    'self-rating':        'bg-amber-50 text-amber-700 border-amber-200',
    'supervisor-rating':  'bg-blue-50 text-blue-700 border-blue-200',
    'acknowledged':       'bg-purple-50 text-purple-700 border-purple-200',
    // Performance Evaluation dispositions
    'fail':        'bg-red-50 text-red-700 border-red-200',
    'next-pe':     'bg-amber-50 text-amber-700 border-amber-200',
    'regularize':  'bg-green-50 text-green-700 border-green-200',
    // General
    pending:        'bg-amber-50 text-amber-700 border-amber-200',
    approved:       'bg-green-50 text-green-700 border-green-200',
    completed:      'bg-green-50 text-green-700 border-green-200',
    cancelled:      'bg-red-50 text-red-700 border-red-200',
    'not-started':  'bg-gray-100 text-gray-500 border-gray-200',
    // Priority
    urgent:         'bg-red-50 text-red-700 border-red-200',
    high:           'bg-orange-50 text-orange-700 border-orange-200',
    normal:         'bg-blue-50 text-blue-700 border-blue-200',
    low:            'bg-gray-100 text-gray-500 border-gray-200',
  };

  const labels = {
    'on-leave':    'On leave',
    'not-started': 'Not started',
    'self-rating': 'Self rating',
    'supervisor-rating': 'Supervisor rating',
    'next-pe': 'Proceed to next PE',
    'regularize': 'For Regularization',
  };

  const key = status?.toLowerCase?.() ?? '';
  const style = styles[key] ?? 'bg-gray-100 text-gray-500 border-gray-200';
  const label = labels[key] ?? (status ? status.charAt(0).toUpperCase() + status.slice(1) : '—');

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${style}`}>
      {label}
    </span>
  );
}
