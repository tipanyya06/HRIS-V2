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
    return <div className="p-4 text-center text-gray-500">{emptyMessage}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-b hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-2 text-sm text-gray-900">
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
