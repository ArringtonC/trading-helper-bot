import React, { memo } from 'react';

interface HeatMapData {
  strategy: string;
  Mon: number;
  Tue: number;
  Wed: number;
  Thu: number;
  Fri: number;
}

interface StrategyHeatMapProps {
  data: HeatMapData[];
}

export const StrategyHeatMap: React.FC<StrategyHeatMapProps> = memo(({ data }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  
  const getColorClass = (value: number): string => {
    if (value > 0) {
      const intensity = Math.min(Math.abs(value) / 1000, 1); // Normalize to 0-1
      if (intensity > 0.7) return 'bg-green-600';
      if (intensity > 0.4) return 'bg-green-500';
      if (intensity > 0.1) return 'bg-green-400';
      return 'bg-green-200';
    } else if (value < 0) {
      const intensity = Math.min(Math.abs(value) / 1000, 1);
      if (intensity > 0.7) return 'bg-red-600';
      if (intensity > 0.4) return 'bg-red-500';
      if (intensity > 0.1) return 'bg-red-400';
      return 'bg-red-200';
    }
    return 'bg-gray-100';
  };

  const getTextColor = (value: number): string => {
    const intensity = Math.min(Math.abs(value) / 1000, 1);
    return intensity > 0.4 ? 'text-white' : 'text-gray-800';
  };

  return (
    <div className="h-64 p-4 bg-white rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Strategy Performance Heatmap</h3>
      
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p>No strategy data available</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-6 gap-1 text-xs font-medium text-gray-600">
            <div className="text-left">Strategy</div>
            {days.map(day => (
              <div key={day} className="text-center">{day}</div>
            ))}
          </div>
          
          {/* Data Rows */}
          {data.map((row, index) => (
            <div key={index} className="grid grid-cols-6 gap-1">
              <div className="text-sm font-medium text-gray-800 truncate pr-2">
                {row.strategy}
              </div>
              {days.map(day => {
                const value = row[day as keyof HeatMapData] as number;
                return (
                  <div
                    key={day}
                    className={`
                      h-8 rounded text-xs font-medium flex items-center justify-center
                      ${getColorClass(value)} ${getTextColor(value)}
                      transition-all duration-200 hover:scale-105 cursor-pointer
                    `}
                    title={`${row.strategy} - ${day}: $${value.toFixed(2)}`}
                  >
                    {Math.abs(value) > 10 ? `$${Math.round(value)}` : '—'}
                  </div>
                );
              })}
            </div>
          ))}
          
          {/* Legend */}
          <div className="flex items-center justify-center space-x-4 mt-4 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Loss</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-100 rounded border"></div>
              <span>Neutral</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Profit</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

StrategyHeatMap.displayName = 'StrategyHeatMap'; 
 
 
 