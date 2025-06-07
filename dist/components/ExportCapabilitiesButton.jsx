import React, { useState } from 'react';
import { ExportService } from '../services/ExportService';
/**
 * Button component for exporting system capabilities
 */
var ExportCapabilitiesButton = function (_a) {
    var className = _a.className;
    var _b = useState(false), isExporting = _b[0], setIsExporting = _b[1];
    var handleExport = function () {
        setIsExporting(true);
        try {
            // Generate the CSV content
            var csvContent = ExportService.exportCapabilities();
            // Create filename with current date
            var date = new Date().toISOString().split('T')[0];
            var fileName = "trading-helper-capabilities-".concat(date, ".csv");
            // Download the file
            ExportService.downloadCSV(csvContent, fileName);
            // Show success message or toast notification
            alert('Capabilities exported successfully');
        }
        catch (error) {
            console.error('Error exporting capabilities:', error);
            alert('Error exporting capabilities. Please try again.');
        }
        finally {
            setIsExporting(false);
        }
    };
    return (<button onClick={handleExport} disabled={isExporting} className={"px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 ".concat(className || '')}>
      {isExporting ? 'Exporting...' : 'Export Capabilities'}
    </button>);
};
export default ExportCapabilitiesButton;
