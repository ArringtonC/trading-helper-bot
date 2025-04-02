import React from 'react';
import { OptionPortfolioStats } from '../types/options';
import { Link } from 'react-router-dom';

interface OptionsSummaryProps {
  stats: OptionPortfolioStats;
  accountId: string;
}

/**
 * Component to display options portfolio summary for the dashboard
 */
const OptionsSummary: React.FC<OptionsSummaryProps> = ({ stats, accountId }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-800">Options Summary</h2>
        <Link 
          to="/options" 
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View All →
        </Link>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Open Positions:</span>
          <span className="font-medium">{stats.openTrades}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Closed Positions:</span>
          <span className="font-medium">{stats.closedTrades}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Win Rate:</span>
          <span className="font-medium">{(stats.winRate * 100).toFixed(1)}%</span>
        </div>
        
        <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mt-2">
          <span className="text-gray-600 font-medium">Total P&L:</span>
          <span className={`font-bold ${stats.totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${stats.totalPL.toFixed(2)}
          </span>
        </div>
      </div>
      
      {stats.openTrades > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Quick Actions</h3>
          <div className="flex gap-2">
            <Link
              to={`/options/new?accountId=${accountId}`}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
            >
              New Trade
            </Link>
            <Link
              to="/options"
              className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded"
            >
              Manage Positions
            </Link>
          </div>
        </div>
      )}
      
      {stats.totalTrades === 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500 mb-3">No options trades yet</p>
          <Link
            to={`/options/new?accountId=${accountId}`}
            className="inline-block text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
          >
            Add Your First Trade
          </Link>
        </div>
      )}
    </div>
  );
};

export default OptionsSummary; 