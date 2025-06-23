interface Position {
  id: number;
  symbol: string;
  description?: string;
  quantity: number;
  price: number;
  marketValue: number;
  costBasis: number;
  gainDollar: number;
  gainPercent: number;
  date?: string;
  type?: 'stock' | 'option' | 'future';
  status?: 'open' | 'closed';
}

/**
 * Convert positions array to CSV format
 */
export const exportPositionsToCSV = (positions: Position[], filename: string = 'positions.csv'): void => {
  if (positions.length === 0) {
    console.warn('No positions to export');
    return;
  }

  const headers = [
    'Symbol',
    'Description',
    'Quantity',
    'Price',
    'Market Value',
    'Cost Basis',
    'Gain/Loss ($)',
    'Gain/Loss (%)',
    'Type',
    'Date',
    'Status'
  ];

  const csvContent = [
    headers.join(','),
    ...positions.map(position => [
      `"${position.symbol || ''}"`,
      `"${position.description || ''}"`,
      position.quantity || 0,
      position.price || 0,
      position.marketValue || 0,
      position.costBasis || 0,
      position.gainDollar || 0,
      position.gainPercent || 0,
      `"${position.type || ''}"`,
      `"${position.date || ''}"`,
      `"${position.status || ''}"`
    ].join(','))
  ].join('\n');

  downloadCSV(csvContent, filename);
};

/**
 * Export position comparison data to CSV
 */
export const exportComparisonToCSV = (positions: Position[], filename: string = 'position-comparison.csv'): void => {
  if (positions.length < 2) {
    console.warn('Need at least 2 positions for comparison export');
    return;
  }

  const metrics = [
    'Symbol',
    'Description', 
    'Quantity',
    'Cost Basis',
    'Market Value',
    'Gain/Loss ($)',
    'Gain/Loss (%)',
    'Type',
    'Date',
    'Status'
  ];

  // Create comparison table format
  const csvRows = [
    // Header row with position symbols
    ['Metric', ...positions.map(p => p.symbol)].join(','),
    
    // Data rows for each metric
    ...metrics.map(metric => {
      const row = [metric];
      positions.forEach(position => {
        let value = '';
        switch (metric) {
          case 'Symbol':
            value = position.symbol || '';
            break;
          case 'Description':
            value = position.description || '';
            break;
          case 'Quantity':
            value = String(position.quantity || 0);
            break;
          case 'Cost Basis':
            value = `$${(position.costBasis || 0).toFixed(2)}`;
            break;
          case 'Market Value':
            value = `$${(position.marketValue || 0).toFixed(2)}`;
            break;
          case 'Gain/Loss ($)':
            value = `$${(position.gainDollar || 0).toFixed(2)}`;
            break;
          case 'Gain/Loss (%)':
            value = `${(position.gainPercent || 0).toFixed(2)}%`;
            break;
          case 'Type':
            value = position.type || '';
            break;
          case 'Date':
            value = position.date || '';
            break;
          case 'Status':
            value = position.status || '';
            break;
          default:
            value = '';
        }
        row.push(`"${value}"`);
      });
      return row.join(',');
    })
  ];

  const csvContent = csvRows.join('\n');
  downloadCSV(csvContent, filename);
};

/**
 * Download CSV content as a file
 */
const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    console.error('CSV download not supported in this browser');
  }
};

/**
 * Generate filename with timestamp
 */
export const generateTimestampedFilename = (prefix: string, extension: string = 'csv'): string => {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace(/[:.]/g, '-');
  return `${prefix}_${timestamp}.${extension}`;
}; 
 
 
 