import React from 'react';

export default function Documents() {
  return (
    <div className="w-full px-6 py-5 flex flex-col gap-4">
      <div>
        <h1 className="text-[20px] font-semibold text-[#1a3a5c]">My Documents</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">View and download your employment documents.</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-12 flex flex-col items-center justify-center text-center gap-3">
        <div className="text-[32px]">Documents</div>
        <p className="text-[14px] font-medium text-[#1a3a5c]">Documents coming soon</p>
        <p className="text-[13px] text-gray-500 max-w-sm">
          Your contracts, clearances, and employment documents will be accessible here once your HR team uploads them.
        </p>
      </div>
    </div>
  );
}
