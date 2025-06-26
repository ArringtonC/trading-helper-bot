import React, { useEffect, useState } from 'react';
import { getPositions } from '../services/DatabaseService'; // adjust path if needed

interface Position {
  id: number;
  symbol: string;
  description: string;
  quantity: number;
  price: number;
  marketValue: number;
  costBasis: number;
  gainDollar: number;
  gainPercent: number;
}

// Format helpers
const formatNumber = (val: any, digits = 2) => {
  const num = typeof val === 'number' ? val : parseFloat(val);
  return isNaN(num) ? '0.00' : num.toFixed(digits);
};

const formatPercent = (val: any) => {
  const num = typeof val === 'number' ? val : parseFloat(val);
  return isNaN(num) ? '0.00%' : `${num.toFixed(2)}%`;
};

const PositionsTable: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    (async () => {
      const data = await getPositions();
      setPositions(data);
    })();
  }, []);

  if (!positions.length) {
    return <p className="text-sm text-gray-500 italic">⚠️ No positions found. Import a positions CSV to see results here.</p>;
  }

  // Add gainLoss and gainLossPercent to each row
  const rowsWithPL = positions.map((pos) => {
    const marketValue = Number(pos.marketValue);
    const costBasis = Number(pos.costBasis);
    const gainLoss = marketValue - costBasis;
    const gainLossPercent = costBasis !== 0 ? (gainLoss / costBasis) * 100 : 0;
    return {
      ...pos,
      gainLoss,
      gainLossPercent
    };
  });

  // Summary calculations
  const summary = rowsWithPL.reduce(
    (acc, pos) => {
      acc.marketValue += pos.marketValue ?? 0;
      acc.costBasis += pos.costBasis ?? 0;
      acc.gain += pos.gainLoss ?? 0;
      return acc;
    },
    { marketValue: 0, costBasis: 0, gain: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div className="p-4 border rounded shadow-sm bg-white">
          <div className="text-gray-500">Total Market Value</div>
          <div className="text-lg font-semibold">${formatNumber(summary.marketValue)}</div>
        </div>
        <div className="p-4 border rounded shadow-sm bg-white">
          <div className="text-gray-500">Total Cost Basis</div>
          <div className="text-lg font-semibold">${formatNumber(summary.costBasis)}</div>
        </div>
        <div className={`p-4 border rounded shadow-sm ${summary.gain >= 0 ? 'bg-green-50' : 'bg-red-50'}`}> 
          <div className="text-gray-500">Net Gain / Loss</div>
          <div className="text-lg font-semibold">
            ${formatNumber(summary.gain)} ({formatPercent((summary.gain / (summary.costBasis || 1)) * 100)})
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm table-auto border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">Symbol</th>
              <th className="border px-2 py-1 text-right">Qty</th>
              <th className="border px-2 py-1 text-right">Cost Basis</th>
              <th className="border px-2 py-1 text-right">Market Value</th>
              <th className="border px-2 py-1 text-right">Gain/Loss</th>
              <th className="border px-2 py-1 text-right">Gain/Loss %</th>
            </tr>
          </thead>
          <tbody>
            {rowsWithPL.map(pos => (
              <tr key={pos.id}>
                <td className="border px-2 py-1">{pos.symbol}</td>
                <td className="border px-2 py-1 text-right">{formatNumber(pos.quantity, 0)}</td>
                <td className="border px-2 py-1 text-right">${formatNumber(pos.costBasis)}</td>
                <td className="border px-2 py-1 text-right">${formatNumber(pos.marketValue)}</td>
                <td className="border px-2 py-1 text-right" style={{ color: pos.gainLoss >= 0 ? 'green' : 'red' }}>
                  ${formatNumber(pos.gainLoss)}
                </td>
                <td className="border px-2 py-1 text-right" style={{ color: pos.gainLoss >= 0 ? 'green' : 'red' }}>
                  {formatPercent(pos.gainLossPercent)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PositionsTable; 