import React from 'react';
var PerformanceSummary = function (_a) {
    var _b = _a.monthToDatePnL, monthToDatePnL = _b === void 0 ? 0 : _b, _c = _a.yearToDatePnL, yearToDatePnL = _c === void 0 ? 0 : _c, _d = _a.totalPnL, totalPnL = _d === void 0 ? 0 : _d;
    return (<div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4">Performance Summary</h2>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 p-3 rounded-md">
          <h3 className="text-sm text-gray-600 mb-1">Month to Date</h3>
          <p className={"text-xl font-bold ".concat(monthToDatePnL >= 0 ? 'text-green-600' : 'text-red-600')}>
            ${monthToDatePnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-md">
          <h3 className="text-sm text-gray-600 mb-1">Year to Date</h3>
          <p className={"text-xl font-bold ".concat(yearToDatePnL >= 0 ? 'text-green-600' : 'text-red-600')}>
            ${yearToDatePnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-md">
          <h3 className="text-sm text-gray-600 mb-1">Total P&L</h3>
          <p className={"text-xl font-bold ".concat(totalPnL >= 0 ? 'text-green-600' : 'text-red-600')}>
            ${totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>);
};
export default PerformanceSummary;
