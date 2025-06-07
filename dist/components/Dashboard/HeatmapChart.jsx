import React from 'react';
// Import the CSS file we will create next
import './HeatmapChart.css';
// Placeholder data matching the previous example structure
var placeholderHeatmapData = [
    [5, 7, 3, 8, 4, 6, 9],
    [8, 2, 9, 4, 7, 3, 5],
    [4, 6, 5, 1, 8, 9, 2],
    [7, 3, 6, 5, 2, 8, 4],
];
// Constants for default labels
var defaultXLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
var defaultYLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
export var HeatmapChart = function (_a) {
    var _b = _a.data, data = _b === void 0 ? placeholderHeatmapData : _b, _c = _a.xAxisLabels, xAxisLabels = _c === void 0 ? defaultXLabels : _c, // Use renamed constant for default
    _d = _a.yAxisLabels, // Use renamed constant for default
    yAxisLabels = _d === void 0 ? defaultYLabels : _d, // Use renamed constant for default
    _e = _a.colorScale, // Use renamed constant for default
    colorScale = _e === void 0 ? [
        '#e5f5e0', '#c7e9c0', '#a1d99b',
        '#74c476', '#41ab5d', '#238b45', '#005a32'
    ] : _e;
    // Updated getColor function to use the colorScale prop
    var getColor = function (value, min, max) {
        if (max === min) {
            return colorScale[Math.floor(colorScale.length / 2)]; // Middle color
        }
        var ratio = (value - min) / (max - min);
        var index = Math.min(colorScale.length - 1, Math.floor(ratio * colorScale.length));
        return colorScale[index];
    };
    // Find min and max values in data
    var flatData = data.flat().filter(function (v) { return typeof v === 'number'; }); // Ensure only numbers
    if (flatData.length === 0) {
        return <div className="p-4 text-center text-gray-500">No numeric data available for heatmap.</div>;
    }
    var minValue = Math.min.apply(Math, flatData);
    var maxValue = Math.max.apply(Math, flatData);
    return (<div className="p-4 bg-white shadow-md rounded-lg dark:bg-gray-800">
      <h3 className="text-lg font-semibold text-gray-700 dark:text-white mb-2">Trade Performance Heatmap (Table)</h3>
      <div className="heatmap-container">
        <table className="heatmap-table">
          <thead>
            <tr>
              <th></th> {/* Empty cell for top-left corner */}
              {xAxisLabels.map(function (label, index) { return (<th key={index}>{label}</th>); })}
            </tr>
          </thead>
          <tbody>
            {data.map(function (row, rowIndex) { return (<tr key={rowIndex}>
                <th>{yAxisLabels[rowIndex]}</th>
                {row.map(function (value, colIndex) { return (<td key={colIndex} style={{
                    backgroundColor: typeof value === 'number' ? getColor(value, minValue, maxValue) : '#eee', // Grey for non-numbers
                }} title={"".concat(yAxisLabels[rowIndex], ", ").concat(xAxisLabels[colIndex], ": ").concat(typeof value === 'number' ? value : 'N/A')}>
                    {typeof value === 'number' ? value : ''} {/* Display value or empty */}
                  </td>); })}
              </tr>); })}
          </tbody>
        </table>
      </div>
    </div>);
};
export default HeatmapChart;
