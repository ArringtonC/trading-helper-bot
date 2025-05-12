import React from 'react';
import { Skeleton } from '../ui/skeleton'; // Path is correct if MetricCard is in src/components/Dashboard/

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  valueColor?: string; // e.g., 'text-green-600' or 'text-red-600'
  isLoading?: boolean;
  tooltip?: string;
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit = '',
  valueColor = 'text-gray-900',
  isLoading = false,
  tooltip,
  className = ''
}) => {
  return (
    <div 
      className={`bg-white shadow-sm rounded-lg p-4 flex flex-col justify-between ${className}`}
      title={tooltip}
    >
      <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>
      {
        isLoading ? (
          <Skeleton className="h-8 w-3/4 mt-1" />
        ) : (
          <p className={`text-3xl font-semibold ${valueColor} mt-1 truncate`}>
            {typeof value === 'number' && (unit === '$' || title.toLowerCase().includes('p&l') || title.toLowerCase().includes('amount')) 
              ? value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : value}
            {typeof value !== 'number' && unit && <span className="text-lg">{unit}</span>}
            {typeof value === 'number' && unit && unit !== '$' && <span className="text-lg ml-1">{unit}</span>}
          </p>
        )
      }
    </div>
  );
};

export default MetricCard; 