import React from 'react';

interface MetricCardProps {
  title: string;
  value: number | string | null | undefined;
  unit?: string;
  color?: string; // Background color class
  valueColor?: string; // Text color class for the value
  isLoading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit, color, valueColor, isLoading }) => {
  // TODO: Add appropriate animations for loading states and value changes
  // TODO: Ensure accessibility compliance

  // Determine text color for value based on value or explicit valueColor prop
  const displayValueColor = valueColor 
    ? valueColor 
    : (typeof value === 'number' 
      ? (value >= 0 ? 'text-green-600' : 'text-red-600') 
      : 'text-gray-900');

  return (
    <div className={`p-4 rounded-lg shadow-md ${color || 'bg-white'} w-full`}>
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <div className={`mt-2 text-2xl font-bold ${displayValueColor}`}>
        {isLoading ? (
          <div className="animate-pulse h-6 bg-gray-300 rounded w-3/4" role="status"></div>
        ) : (
          <p>{value !== undefined && value !== null ? `${value}${unit || ''}` : 'N/A'}</p>
        )}
      </div>
    </div>
  );
};

export default MetricCard;