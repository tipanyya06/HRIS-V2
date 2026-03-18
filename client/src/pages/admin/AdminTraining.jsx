import React from 'react';

export default function Training() {
  return (
    <div className="w-full px-6 py-5 flex flex-col gap-4">
      <div>
        <h1 className="text-[20px] font-semibold text-[#1a3a5c]">Training</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Manage and track employee training programs.</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-12 flex flex-col items-center justify-center text-center gap-3">
        <div className="text-[32px]">Training</div>
        <p className="text-[14px] font-medium text-[#1a3a5c]">Training module coming soon</p>
        <p className="text-[13px] text-gray-500 max-w-sm">
          Employee training records, certifications, and completion tracking will be available here.
        </p>
      </div>
    </div>
  );
}
