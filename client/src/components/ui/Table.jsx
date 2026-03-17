import React from 'react';
import LoadingSpinner from './LoadingSpinner';

export default function Table({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = 'No data found',
}) {
  if (isLoading) return <LoadingSpinner />;

  if (data.length === 0) {
    return <div className="py-10 text-[13px] text-gray-400 text-center">{emptyMessage}</div>;
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 border-b border-gray-200">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-b-0">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-[13px] text-gray-700">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
