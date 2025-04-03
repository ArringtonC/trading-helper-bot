import React from 'react';
import { OptionTrade } from '../types/options';
import { calculateTradePL } from '../utils/tradeUtils';

interface DashboardMetricsProps {
  trades: OptionTrade[];
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ trades }) => {
  // Calculate metrics
  const totalPnl = trades.reduce((sum, trade) => sum + calculateTradePL(trade), 0);
  const winningTrades = trades.filter(trade => calculateTradePL(trade) > 0).length;
  const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;
  
  const openPositions = trades.filter(t => !t.closeDate).length;
  const closedPositions = trades.filter(t => t.closeDate).length;

  const callPercentage = trades.length > 0
    ? (trades.filter(t => t.putCall === 'CALL').length / trades.length) * 100
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="text-sm text-gray-500">Total P&L</div>
        <div className={`text-xl font-bold ${
          totalPnl >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          ${totalPnl.toFixed(2)}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="text-sm text-gray-500">Win Rate</div>
        <div className="text-xl font-bold">
          {winRate.toFixed(1)}%
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="text-sm text-gray-500">Positions</div>
        <div className="text-xl font-bold">
          {openPositions} open / {closedPositions} closed
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="text-sm text-gray-500 mb-2">Strategy Mix</div>
        <div className="relative h-24">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-xs text-gray-500">Strategy Mix</div>
          </div>
          <div className="absolute inset-0 flex">
            <div 
              className="h-full bg-green-100" 
              style={{ width: `${callPercentage}%` }}
            />
            <div 
              className="h-full bg-red-100" 
              style={{ width: `${100 - callPercentage}%` }}
            />
          </div>
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-600">
            <span>Calls {callPercentage.toFixed(1)}%</span>
            <span>Puts {(100 - callPercentage).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 