import React from 'react';

export default function Card({ children, onClick, className = '' }) {
  return (
    <div
      className={`bg-white rounded-lg shadow p-4 ${onClick ? 'cursor-pointer hover:shadow-lg' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
