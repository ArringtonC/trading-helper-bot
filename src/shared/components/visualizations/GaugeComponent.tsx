import React from 'react';

export interface GaugeThresholds {
  // Values below 'cautionMin' are considered critical (e.g., red)
  criticalMin: number; 
  // Values between 'cautionMin' and 'warningMin' are caution (e.g., yellow)
  warningMin: number;
  // Values between 'warningMin' and 'warningMax' are optimal (e.g., green)
  // Values between 'warningMax' and 'cautionMax' are caution (e.g., yellow)
  warningMax: number;
  // Values above 'cautionMax' are considered critical (e.g., red)
  criticalMax: number; 
}

interface GaugeComponentProps {
  metricName: string;
  value: number;
  min: number;
  max: number;
  thresholds: GaugeThresholds;
  unit?: string;
  width?: number;
  height?: number;
}

const GaugeComponent: React.FC<GaugeComponentProps> = ({
  metricName,
  value,
  min,
  max,
  thresholds,
  unit = '',
  width = 200,
  height = 100,
}) => {
  const padding = 10;
  const barHeight = 20;
  const labelYOffset = 20;
  const valueYOffset = 45;
  const gaugeY = height - barHeight - padding - 5; // Position gauge at the bottom

  const normalizedValue = Math.max(min, Math.min(max, value));
  const percentage = ((normalizedValue - min) / (max - min)) * 100;
  const barWidth = (width - 2 * padding) * (percentage / 100);

  const getFillColor = (): string => {
    if (value < thresholds.criticalMin || value > thresholds.criticalMax) {
      return 'fill-red-500'; // Critical
    }
    if (value < thresholds.warningMin || value > thresholds.warningMax) {
      return 'fill-yellow-500'; // Warning/Caution
    }
    return 'fill-green-500'; // Optimal
  };

  const fillColorClass = getFillColor();

  // Ensure value is a number for toFixed
  const displayValue = typeof value === 'number' ? value.toFixed(2) : 'N/A';
  const titleId = `gauge-title-${metricName.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="p-2 border rounded-md shadow-sm bg-white" style={{ width: width + padding * 2, height: height + padding * 2}}>
      <svg width={width} height={height} aria-labelledby={titleId}>
        <title id={titleId}>{metricName} Gauge: {displayValue}{unit}</title>
        
        {/* Metric Name */}
        <text
          x={width / 2}
          y={labelYOffset}
          textAnchor="middle"
          className="text-sm font-semibold fill-gray-700"
        >
          {metricName}
        </text>

        {/* Current Value */}
        <text
          x={width / 2}
          y={valueYOffset}
          textAnchor="middle"
          className="text-lg font-bold fill-gray-900"
        >
          {displayValue}{unit}
        </text>

        {/* Gauge Background */}
        <rect
          x={padding}
          y={gaugeY}
          width={width - 2 * padding}
          height={barHeight}
          className="fill-gray-200"
          rx="3"
          ry="3"
        />

        {/* Gauge Value Bar */}
        <rect
          x={padding}
          y={gaugeY}
          width={barWidth > 0 ? barWidth : 0}
          height={barHeight}
          className={fillColorClass}
          rx="3"
          ry="3"
        />

        {/* Min and Max Labels for Gauge Bar */}
        <text x={padding} y={gaugeY + barHeight + 15} textAnchor="start" className="text-xs fill-gray-500">
          {min}
        </text>
        <text x={width - padding} y={gaugeY + barHeight + 15} textAnchor="end" className="text-xs fill-gray-500">
          {max}
        </text>
      </svg>
    </div>
  );
};

export default GaugeComponent; 