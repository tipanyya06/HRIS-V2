import React from 'react';

export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex justify-between items-start mb-6">
      <div>
        <h1 className="text-[20px] font-semibold text-[#1a3a5c]">{title}</h1>
        {subtitle ? <p className="text-[13px] text-gray-500 mt-1">{subtitle}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
