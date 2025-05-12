import React, { useState } from 'react';
import { OptionTrade } from '../../types/options';

interface OptionsAnalysisCardProps {
  openPositions: OptionTrade[];
  closedPositions: OptionTrade[];
}

/**
 * Component for displaying options trading analytics
 */
const OptionsAnalysisCard: React.FC<OptionsAnalysisCardProps> = ({ openPositions, closedPositions }) => {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');
  
  // Calculate metrics
  const calculateMetrics = () => {
    // Get trades within the selected timeframe
    const now = new Date();
    let startDate = new Date();
    
    if (timeframe === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeframe === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else {
      startDate.setFullYear(now.getFullYear() - 1);
    }
    
    // Filter closed trades by close date
    const recentTrades = closedPositions.filter(trade => 
      trade.closeDate && trade.closeDate >= startDate
    );
    
    // Calculate profit/loss for recent trades
    const profitLoss = recentTrades.reduce((total, trade) => {
      if (!trade.closeDate || !trade.closePremium || trade.premium === undefined) return total;
      
      const multiplier = 100; // Standard option multiplier
      const openValue = trade.premium * Math.abs(trade.quantity) * multiplier;
      const closeValue = trade.closePremium * Math.abs(trade.quantity) * multiplier;
      
      // For long positions
      if (trade.quantity > 0) {
        return total + (closeValue - openValue - (trade.commission || 0));
      } 
      // For short positions
      else {
        return total + (openValue - closeValue - (trade.commission || 0));
      }
    }, 0);
    
    // Calculate win rate
    const winningTrades = recentTrades.filter(trade => {
      if (!trade.closeDate || !trade.closePremium || trade.premium === undefined) return false;
      
      const multiplier = 100;
      const openValue = trade.premium * Math.abs(trade.quantity) * multiplier;
      const closeValue = trade.closePremium * Math.abs(trade.quantity) * multiplier;
      
      if (trade.quantity > 0) {
        return closeValue - openValue - (trade.commission || 0) > 0;
      } else {
        return openValue - closeValue - (trade.commission || 0) > 0;
      }
    });
    
    const winRate = recentTrades.length > 0 
      ? (winningTrades.length / recentTrades.length) * 100 
      : 0;
    
    // Calculate average trade duration (in days)
    const tradeDurations = recentTrades
      .filter(trade => trade.closeDate)
      .map(trade => {
        const openDate = new Date(trade.openDate);
        const closeDate = new Date(trade.closeDate!);
        return Math.floor((closeDate.getTime() - openDate.getTime()) / (1000 * 60 * 60 * 24));
      });
    
    const avgDuration = tradeDurations.length > 0
      ? tradeDurations.reduce((sum, duration) => sum + duration, 0) / tradeDurations.length
      : 0;
    
    // Calculate percentage of calls vs puts
    const calls = recentTrades.filter(trade => trade.putCall === 'CALL').length;
    const puts = recentTrades.filter(trade => trade.putCall === 'PUT').length;
    
    const callPercentage = recentTrades.length > 0 
      ? (calls / recentTrades.length) * 100 
      : 0;
    
    const putPercentage = recentTrades.length > 0 
      ? (puts / recentTrades.length) * 100 
      : 0;
    
    return {
      totalTrades: recentTrades.length,
      profitLoss,
      winRate,
      avgDuration,
      callPercentage,
      putPercentage,
    };
  };
  
  const metrics = calculateMetrics();
  
  const calculatePL = (trade: OptionTrade): number => {
    // For closed trades
    if (trade.closeDate && trade.closePremium !== undefined) {
      // If premium is undefined, we can't calculate P&L
      if (trade.premium === undefined) {
        return 0;
      }
      
      const multiplier = 100; // Standard option multiplier
      const openValue = trade.premium * Math.abs(trade.quantity) * multiplier;
      const closeValue = trade.closePremium * Math.abs(trade.quantity) * multiplier;
      
      // For long positions
      if (trade.quantity > 0) {
        return closeValue - openValue - (trade.commission || 0);
      }
      // For short positions
      else {
        return openValue - closeValue - (trade.commission || 0);
      }
    }
    
    // For open trades with current price
    if (trade.currentPrice !== undefined) {
      // If premium is undefined, we can't calculate P&L
      if (trade.premium === undefined) {
        return 0;
      }
      
      const multiplier = 100;
      const openValue = trade.premium * Math.abs(trade.quantity) * multiplier;
      const closeValue = trade.currentPrice * Math.abs(trade.quantity) * multiplier;
      
      if (trade.quantity > 0) {
        return closeValue - openValue - (trade.commission || 0);
      } else {
        return openValue - closeValue - (trade.commission || 0);
      }
    }
    
    // If no close price or current price available
    return 0;
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-800">Options Analysis</h2>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeframe('week')}
            className={`px-2 py-1 text-xs rounded ${
              timeframe === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-2 py-1 text-xs rounded ${
              timeframe === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setTimeframe('year')}
            className={`px-2 py-1 text-xs rounded ${
              timeframe === 'year'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Year
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 rounded-md">
          <div className="text-xs text-gray-500">Total Trades</div>
          <div className="text-xl font-bold">{metrics.totalTrades}</div>
        </div>
        
        <div className="p-3 bg-gray-50 rounded-md">
          <div className="text-xs text-gray-500">P&L</div>
          <div className={`text-xl font-bold ${metrics.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${metrics.profitLoss.toFixed(2)}
          </div>
        </div>
        
        <div className="p-3 bg-gray-50 rounded-md">
          <div className="text-xs text-gray-500">Win Rate</div>
          <div className="text-xl font-bold">
            {metrics.winRate.toFixed(1)}%
          </div>
        </div>
        
        <div className="p-3 bg-gray-50 rounded-md">
          <div className="text-xs text-gray-500">Avg Duration</div>
          <div className="text-xl font-bold">
            {metrics.avgDuration.toFixed(1)} days
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Strategy Breakdown</h3>
        <div className="flex items-center">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-green-600 h-2.5 rounded-full"
              style={{ width: `${metrics.callPercentage}%` }}
            ></div>
          </div>
          <div className="ml-2 text-xs flex justify-between w-20">
            <span>Calls</span>
            <span>{metrics.callPercentage.toFixed(0)}%</span>
          </div>
        </div>
        <div className="flex items-center mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-red-600 h-2.5 rounded-full"
              style={{ width: `${metrics.putPercentage}%` }}
            ></div>
          </div>
          <div className="ml-2 text-xs flex justify-between w-20">
            <span>Puts</span>
            <span>{metrics.putPercentage.toFixed(0)}%</span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Current Exposure</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Open Positions:</span>
          <span className="font-medium">{openPositions.length}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm text-gray-600">Expiring in 7 days:</span>
          <span className="font-medium">
            {openPositions.filter(p => {
              const now = new Date();
              const expiry = new Date(p.expiry);
              const diffTime = expiry.getTime() - now.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return diffDays <= 7 && diffDays >= 0;
            }).length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OptionsAnalysisCard; 