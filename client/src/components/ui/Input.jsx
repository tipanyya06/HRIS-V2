import React from 'react';

export default function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  isRequired = false,
  isDisabled = false,
}) {
  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <label htmlFor={name} className="text-[11px] font-semibold uppercase tracking-widest text-gray-700">
          {label} {isRequired ? <span className="text-red-500">*</span> : null}
        </label>
      ) : null}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={isDisabled}
        className={`
          w-full h-[32px] px-3 bg-white text-[13px] text-gray-700 border rounded-md
          focus:outline-none focus:ring-1
          ${error ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : 'border-gray-200 focus:ring-[#185FA5] focus:border-[#185FA5]'}
          disabled:bg-gray-100 disabled:cursor-not-allowed
        `}
      />
      {error ? <span className="text-[12px] text-red-500">{error}</span> : null}
    </div>
  );
}
