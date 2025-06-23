import React, { useState } from 'react';
import { OptionTrade } from '../types/options';
import ninjaTraderExportService, { NinjaTraderExportOptions } from '../services/NinjaTraderExportService';
import { formatDateForDisplay } from '../utils/dateUtils';

interface NinjaTraderExportProps {
  trades?: OptionTrade[];
  strategyNames: string[];
}

const NinjaTraderExport: React.FC<NinjaTraderExportProps> = ({ 
  trades = [], 
  strategyNames 
}) => {
  // State for export options
  const [showOptions, setShowOptions] = useState(false);
  const [exportOptions, setExportOptions] = useState<NinjaTraderExportOptions>({
    strategyName: strategyNames.length > 0 ? strategyNames[0] : 'DefaultStrategy',
    includeClosedTrades: false,
  });
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle export options changes
  const handleOptionsChange = (field: keyof NinjaTraderExportOptions, value: any) => {
    setExportOptions(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle date range changes
  const handleDateRangeChange = (range: { start: Date; end: Date } | null) => {
    setDateRange(range);
    setExportOptions(prev => ({
      ...prev,
      dateRange: range || undefined
    }));
  };

  // Execute export
  const handleExport = async () => {
    try {
      setIsExporting(true);
      setError(null);

      // Generate export files
      const exportFiles = ninjaTraderExportService.exportToNinjaTrader(trades, exportOptions);
      
      // Trigger downloads
      ninjaTraderExportService.downloadExportFiles(exportFiles.callsFile, exportFiles.putsFile);
      
      // Show success message
      alert(`Export successful! Files downloaded: ${exportFiles.callsFile.name} and ${exportFiles.putsFile.name}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred during export");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-md p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-800">NinjaTrader Export</h3>
        <button 
          className="text-sm px-3 py-1 border rounded hover:bg-gray-50"
          onClick={() => setShowOptions(!showOptions)}
        >
          {showOptions ? "Hide Options" : "Show Options"}
        </button>
      </div>

      {showOptions && (
        <div className="mb-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Strategy Name
            </label>
            <select 
              className="w-full p-2 border rounded"
              value={exportOptions.strategyName}
              onChange={(e) => handleOptionsChange('strategyName', e.target.value)}
            >
              {strategyNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
              {strategyNames.length === 0 && (
                <option value="DefaultStrategy">Default Strategy</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range (Optional)
            </label>
            <div className="flex space-x-2">
              <input
                type="date"
                className="p-2 border rounded"
                value={dateRange?.start ? formatDateForDisplay(dateRange.start, 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  const start = e.target.value ? new Date(e.target.value) : null;
                  handleDateRangeChange(start ? { start, end: dateRange?.end || new Date() } : null);
                }}
              />
              <input
                type="date"
                className="p-2 border rounded"
                value={dateRange?.end ? formatDateForDisplay(dateRange.end, 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  const end = e.target.value ? new Date(e.target.value) : null;
                  handleDateRangeChange(dateRange?.start ? { start: dateRange.start, end: end || new Date() } : null);
                }}
              />
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={exportOptions.includeClosedTrades}
                onChange={(e) => handleOptionsChange('includeClosedTrades', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Include Closed Trades</span>
            </label>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-2 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}

      <button 
        className={`w-full py-2 px-4 rounded ${
          isExporting 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
        onClick={handleExport}
        disabled={isExporting}
      >
        {isExporting ? 'Exporting...' : 'Export to NinjaTrader'}
      </button>
    </div>
  );
};

export default NinjaTraderExport; 