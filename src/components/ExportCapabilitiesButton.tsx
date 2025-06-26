import React, { useState } from 'react';
import { ExportService } from '../services/ExportService';

interface ExportCapabilitiesButtonProps {
  className?: string;
}

/**
 * Button component for exporting system capabilities
 */
const ExportCapabilitiesButton: React.FC<ExportCapabilitiesButtonProps> = ({ className }) => {
  const [isExporting, setIsExporting] = useState(false);
  
  const handleExport = () => {
    setIsExporting(true);
    
    try {
      // Generate the CSV content
      const csvContent = ExportService.exportCapabilities();
      
      // Create filename with current date
      const date = new Date().toISOString().split('T')[0];
      const fileName = `trading-helper-capabilities-${date}.csv`;
      
      // Download the file
      ExportService.downloadCSV(csvContent, fileName);
      
      // Show success message or toast notification
      alert('Capabilities exported successfully');
    } catch (error) {
      console.error('Error exporting capabilities:', error);
      alert('Error exporting capabilities. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 ${className || ''}`}
    >
      {isExporting ? 'Exporting...' : 'Export Capabilities'}
    </button>
  );
};

export default ExportCapabilitiesButton; 