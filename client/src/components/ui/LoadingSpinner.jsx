import React from 'react';

export default function LoadingSpinner({ size = 'md', isFullPage = false }) {
  const spinner = (
    <div
      className={`animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 ${
        size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-12 w-12' : 'h-8 w-8'
      }`}
    />
  );

  if (isFullPage) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}
