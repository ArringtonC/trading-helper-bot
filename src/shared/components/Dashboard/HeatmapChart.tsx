import React from 'react';
// Import the CSS file we will create next
import './HeatmapChart.css';

// Placeholder data matching the previous example structure
const placeholderHeatmapData = [
  [5, 7, 3, 8, 4, 6, 9],
  [8, 2, 9, 4, 7, 3, 5],
  [4, 6, 5, 1, 8, 9, 2],
  [7, 3, 6, 5, 2, 8, 4],
];

// Constants for default labels
const defaultXLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const defaultYLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

interface HeatmapProps {
  // TODO: Replace with actual data fetching
  data?: number[][];
  xAxisLabels?: string[]; // Renamed prop
  yAxisLabels?: string[]; // Renamed prop
  colorScale?: string[]; // Added colorScale prop
}

export const HeatmapChart: React.FC<HeatmapProps> = ({
  data = placeholderHeatmapData,
  xAxisLabels = defaultXLabels, // Use renamed constant for default
  yAxisLabels = defaultYLabels, // Use renamed constant for default
  colorScale = [
    '#e5f5e0', '#c7e9c0', '#a1d99b',
    '#74c476', '#41ab5d', '#238b45', '#005a32'
  ]
}) => {
  // Updated getColor function to use the colorScale prop
  const getColor = (value: number, min: number, max: number) => {
    if (max === min) {
      return colorScale[Math.floor(colorScale.length / 2)]; // Middle color
    }
    const ratio = (value - min) / (max - min);
    const index = Math.min(colorScale.length - 1, Math.floor(ratio * colorScale.length));
    return colorScale[index];
  };

  // Find min and max values in data
  const flatData = data.flat().filter(v => typeof v === 'number'); // Ensure only numbers
  if (flatData.length === 0) {
    return <div className="p-4 text-center text-gray-500">No numeric data available for heatmap.</div>;
  }
  const minValue = Math.min(...flatData);
  const maxValue = Math.max(...flatData);

  return (
    <div className="p-4 bg-white shadow-md rounded-lg dark:bg-gray-800">
      <h3 className="text-lg font-semibold text-gray-700 dark:text-white mb-2">Trade Performance Heatmap (Table)</h3>
      <div className="heatmap-container">
        <table className="heatmap-table">
          <thead>
            <tr>
              <th></th> {/* Empty cell for top-left corner */}
              {xAxisLabels.map((label: string, index: number) => (
                <th key={index}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row: number[], rowIndex: number) => (
              <tr key={rowIndex}>
                <th>{yAxisLabels[rowIndex]}</th>
                {row.map((value: number, colIndex: number) => (
                  <td
                    key={colIndex}
                    style={{
                      backgroundColor: typeof value === 'number' ? getColor(value, minValue, maxValue) : '#eee', // Grey for non-numbers
                    }}
                    title={`${yAxisLabels[rowIndex]}, ${xAxisLabels[colIndex]}: ${typeof value === 'number' ? value : 'N/A'}`}
                  >
                    {typeof value === 'number' ? value : ''} {/* Display value or empty */}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HeatmapChart; 