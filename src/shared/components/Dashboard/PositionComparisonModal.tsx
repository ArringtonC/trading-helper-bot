import React from 'react';
import { exportComparisonToCSV, generateTimestampedFilename } from '../../utils/exportUtils';

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

interface PositionComparisonModalProps {
  positions: Position[];
  onClose: () => void;
  onClear: () => void;
}

const metrics = [
  { key: 'symbol', label: 'Symbol' },
  { key: 'description', label: 'Description' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'costBasis', label: 'Cost Basis' },
  { key: 'marketValue', label: 'Market Value' },
  { key: 'gainDollar', label: 'Gain/Loss' },
  { key: 'gainPercent', label: 'Gain/Loss %' },
  { key: 'type', label: 'Type' },
  { key: 'date', label: 'Date' },
  { key: 'status', label: 'Status' },
];

const PositionComparisonModal: React.FC<PositionComparisonModalProps> = ({ positions, onClose, onClear }) => {
  if (positions.length < 2) return null;

  // Handle export
  const handleExport = () => {
    const filename = generateTimestampedFilename('position-comparison');
    exportComparisonToCSV(positions, filename);
  };

  // Find best/worst for numeric metrics
  const getHighlight = (key: string, value: any) => {
    const numericKeys = ['quantity', 'costBasis', 'marketValue', 'gainDollar', 'gainPercent'];
    if (!numericKeys.includes(key)) return '';
    const values = positions.map((p) => Number((p as any)[key] ?? 0));
    const max = Math.max(...values);
    const min = Math.min(...values);
    if (Number(value) === max) return 'bg-green-50 text-green-700 font-bold';
    if (Number(value) === min) return 'bg-red-50 text-red-700 font-bold';
    return '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full p-6 relative">
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Compare Positions ({positions.length})</h2>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            onClick={handleExport}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 bg-gray-50 text-left">Metric</th>
                {positions.map((p) => (
                  <th key={p.id} className="px-4 py-2 bg-gray-50 text-center">
                    {p.symbol}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => (
                <tr key={metric.key}>
                  <td className="px-4 py-2 font-medium text-gray-700 bg-gray-50">{metric.label}</td>
                  {positions.map((p) => (
                    <td
                      key={p.id}
                      className={`px-4 py-2 text-center ${getHighlight(metric.key, (p as any)[metric.key])}`}
                    >
                      {metric.key === 'costBasis' || metric.key === 'marketValue' || metric.key === 'gainDollar'
                        ? `$${Number((p as any)[metric.key] ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : metric.key === 'gainPercent'
                        ? `${Number((p as any)[metric.key] ?? 0).toFixed(2)}%`
                        : (p as any)[metric.key] ?? '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            onClick={onClear}
          >
            Clear Selection
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PositionComparisonModal; 
 
 
 