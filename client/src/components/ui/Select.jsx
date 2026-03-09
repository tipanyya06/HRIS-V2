import React from 'react';

export default function Select({
  label,
  name,
  value,
  onChange,
  options = [],
  error,
  isRequired = false,
  isDisabled = false,
}) {
  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <label htmlFor={name} className="text-sm font-medium text-gray-700">
          {label} {isRequired ? <span className="text-red-500">*</span> : null}
        </label>
      ) : null}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={isDisabled}
        className={`
          w-full px-3 py-2 border rounded
          focus:outline-none focus:ring-2
          ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}
          disabled:bg-gray-100 disabled:cursor-not-allowed
        `}
      >
        <option value="">-- Select --</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-sm text-red-500">{error}</span> : null}
    </div>
  );
}
