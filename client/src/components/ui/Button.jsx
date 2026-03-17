import React from 'react';

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isDisabled = false,
  isLoading = false,
  className = '',
  ...props
}) {
  const variants = {
    primary: 'bg-[#185FA5] text-white border border-[#185FA5] hover:bg-[#0C447C]',
    secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
    danger: 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100',
    ghost: 'bg-transparent text-gray-500 border border-transparent hover:bg-gray-50',
  };

  const sizes = {
    sm: 'h-[26px] px-3 text-[11px] font-semibold',
    md: 'h-[32px] px-4 text-[13px] font-medium',
    lg: 'h-[40px] px-6 text-[14px] font-medium',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled || isLoading}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        rounded-md transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        inline-flex items-center gap-2
        ${className}
      `}
      {...props}
    >
      {isLoading ? <span className="animate-spin">⏳</span> : null}
      {children}
    </button>
  );
}
