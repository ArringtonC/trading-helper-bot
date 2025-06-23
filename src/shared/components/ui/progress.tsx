import React from 'react';

interface ProgressProps {
  value: number;
  className?: string;
}

const Progress: React.FC<ProgressProps> = ({ value, className = '' }) => (
  <div className={`w-full bg-gray-200 rounded h-3 ${className}`}>
    <div
      className="bg-blue-500 h-3 rounded transition-all"
      style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
    />
  </div>
);

export { Progress }; 