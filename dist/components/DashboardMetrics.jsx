import React from 'react';
import { calculateTradePL } from '../utils/tradeUtils';
export var DashboardMetrics = function (_a) {
    var trades = _a.trades;
    // Calculate metrics
    var totalPnl = trades.reduce(function (sum, trade) { return sum + calculateTradePL(trade); }, 0);
    var winningTrades = trades.filter(function (trade) { return calculateTradePL(trade) > 0; }).length;
    var winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;
    var openPositions = trades.filter(function (t) { return !t.closeDate; }).length;
    var closedPositions = trades.filter(function (t) { return t.closeDate; }).length;
    var callPercentage = trades.length > 0
        ? (trades.filter(function (t) { return t.putCall === 'CALL'; }).length / trades.length) * 100
        : 0;
    return (<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="text-sm text-gray-500">Total P&L</div>
        <div className={"text-xl font-bold ".concat(totalPnl >= 0 ? 'text-green-600' : 'text-red-600')}>
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
            <div className="h-full bg-green-100" style={{ width: "".concat(callPercentage, "%") }}/>
            <div className="h-full bg-red-100" style={{ width: "".concat(100 - callPercentage, "%") }}/>
          </div>
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-600">
            <span>Calls {callPercentage.toFixed(1)}%</span>
            <span>Puts {(100 - callPercentage).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>);
};
