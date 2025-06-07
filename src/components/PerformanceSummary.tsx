import React from 'react';

interface PerformanceSummaryProps {
  monthToDatePnL?: number;
  yearToDatePnL?: number;
  totalPnL?: number;
}

const PerformanceSummary: React.FC<PerformanceSummaryProps> = ({
  monthToDatePnL = 0,
  yearToDatePnL = 0,
  totalPnL = 0
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4">Performance Summary</h2>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 p-3 rounded-md">
          <h3 className="text-sm text-gray-600 mb-1">Month to Date</h3>
          <p className={`text-xl font-bold ${monthToDatePnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${monthToDatePnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-md">
          <h3 className="text-sm text-gray-600 mb-1">Year to Date</h3>
          <p className={`text-xl font-bold ${yearToDatePnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${yearToDatePnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-md">
          <h3 className="text-sm text-gray-600 mb-1">Total P&L</h3>
          <p className={`text-xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceSummary; 