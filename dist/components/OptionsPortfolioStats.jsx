import React from 'react';
export var OptionsPortfolioStats = function (_a) {
    var stats = _a.stats;
    return (<div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Portfolio Statistics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-sm text-gray-600">Total Trades</p>
          <p className="text-xl font-bold">{stats.totalTrades}</p>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-600">Open Trades</p>
          <p className="text-xl font-bold text-green-600">{stats.openTrades}</p>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-600">Closed Trades</p>
          <p className="text-xl font-bold">{stats.closedTrades}</p>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-600">Win Rate</p>
          <p className="text-xl font-bold">{stats.winRate.toFixed(1)}%</p>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-600">Winning Trades</p>
          <p className="text-xl font-bold text-green-600">{stats.winningTrades}</p>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-600">Losing Trades</p>
          <p className="text-xl font-bold text-red-600">{stats.losingTrades}</p>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-600">Avg Win</p>
          <p className="text-xl font-bold text-green-600">${stats.averageWin.toFixed(2)}</p>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-600">Avg Loss</p>
          <p className="text-xl font-bold text-red-600">${stats.averageLoss.toFixed(2)}</p>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-600">Total P/L</p>
          <p className={"text-2xl font-bold ".concat(stats.totalPL >= 0 ? 'text-green-600' : 'text-red-600')}>
            ${stats.totalPL.toFixed(2)}
          </p>
        </div>
      </div>
    </div>);
};
