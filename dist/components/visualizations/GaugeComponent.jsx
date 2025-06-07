import React from 'react';
var GaugeComponent = function (_a) {
    var metricName = _a.metricName, value = _a.value, min = _a.min, max = _a.max, thresholds = _a.thresholds, _b = _a.unit, unit = _b === void 0 ? '' : _b, _c = _a.width, width = _c === void 0 ? 200 : _c, _d = _a.height, height = _d === void 0 ? 100 : _d;
    var padding = 10;
    var barHeight = 20;
    var labelYOffset = 20;
    var valueYOffset = 45;
    var gaugeY = height - barHeight - padding - 5; // Position gauge at the bottom
    var normalizedValue = Math.max(min, Math.min(max, value));
    var percentage = ((normalizedValue - min) / (max - min)) * 100;
    var barWidth = (width - 2 * padding) * (percentage / 100);
    var getFillColor = function () {
        if (value < thresholds.criticalMin || value > thresholds.criticalMax) {
            return 'fill-red-500'; // Critical
        }
        if (value < thresholds.warningMin || value > thresholds.warningMax) {
            return 'fill-yellow-500'; // Warning/Caution
        }
        return 'fill-green-500'; // Optimal
    };
    var fillColorClass = getFillColor();
    // Ensure value is a number for toFixed
    var displayValue = typeof value === 'number' ? value.toFixed(2) : 'N/A';
    var titleId = "gauge-title-".concat(metricName.toLowerCase().replace(/\s+/g, '-'));
    return (<div className="p-2 border rounded-md shadow-sm bg-white" style={{ width: width + padding * 2, height: height + padding * 2 }}>
      <svg width={width} height={height} aria-labelledby={titleId}>
        <title id={titleId}>{metricName} Gauge: {displayValue}{unit}</title>
        
        {/* Metric Name */}
        <text x={width / 2} y={labelYOffset} textAnchor="middle" className="text-sm font-semibold fill-gray-700">
          {metricName}
        </text>

        {/* Current Value */}
        <text x={width / 2} y={valueYOffset} textAnchor="middle" className="text-lg font-bold fill-gray-900">
          {displayValue}{unit}
        </text>

        {/* Gauge Background */}
        <rect x={padding} y={gaugeY} width={width - 2 * padding} height={barHeight} className="fill-gray-200" rx="3" ry="3"/>

        {/* Gauge Value Bar */}
        <rect x={padding} y={gaugeY} width={barWidth > 0 ? barWidth : 0} height={barHeight} className={fillColorClass} rx="3" ry="3"/>

        {/* Min and Max Labels for Gauge Bar */}
        <text x={padding} y={gaugeY + barHeight + 15} textAnchor="start" className="text-xs fill-gray-500">
          {min}
        </text>
        <text x={width - padding} y={gaugeY + barHeight + 15} textAnchor="end" className="text-xs fill-gray-500">
          {max}
        </text>
      </svg>
    </div>);
};
export default GaugeComponent;
