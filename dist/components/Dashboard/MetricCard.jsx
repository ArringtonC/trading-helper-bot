import React from 'react';
var MetricCard = function (_a) {
    // TODO: Add appropriate animations for loading states and value changes
    // TODO: Ensure accessibility compliance
    var title = _a.title, value = _a.value, unit = _a.unit, color = _a.color, valueColor = _a.valueColor, isLoading = _a.isLoading;
    // Determine text color for value based on value or explicit valueColor prop
    var displayValueColor = valueColor
        ? valueColor
        : (typeof value === 'number'
            ? (value >= 0 ? 'text-green-600' : 'text-red-600')
            : 'text-gray-900');
    return (<div className={"p-4 rounded-lg shadow-md ".concat(color || 'bg-white', " w-full")}>
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <div className={"mt-2 text-2xl font-bold ".concat(displayValueColor)}>
        {isLoading ? (<div className="animate-pulse h-6 bg-gray-300 rounded w-3/4" role="status"></div>) : (<p>{value !== undefined && value !== null ? "".concat(value).concat(unit || '') : 'N/A'}</p>)}
      </div>
    </div>);
};
export default MetricCard;
