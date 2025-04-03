import React, { useState, useMemo } from 'react';
import { OptionTrade } from '../types/options';
import TradeTable from '../components/TradeTable';
import { DashboardMetrics } from '../components/DashboardMetrics';
import { differenceInDays } from 'date-fns';

interface OptionsTradingViewProps {
  trades: OptionTrade[];
  onCloseTrade?: (tradeId: string) => void;
  onEditTrade?: (tradeId: string) => void;
  onDeleteTrade?: (tradeId: string) => void;
  onViewTrade?: (trade: OptionTrade) => void;
}

type TimeRange = 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_YEAR' | 'ALL_TIME';

export const OptionsTradingView: React.FC<OptionsTradingViewProps> = ({
  trades,
  onCloseTrade,
  onEditTrade,
  onDeleteTrade,
  onViewTrade
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL_TIME');
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'closed'>('all');

  // Filter trades based on time range
  const filteredTrades = useMemo(() => {
    const now = new Date();
    return trades.filter(trade => {
      const tradeDate = new Date(trade.openDate);
      const daysDiff = differenceInDays(now, tradeDate);
      
      switch (timeRange) {
        case 'LAST_7_DAYS': return daysDiff <= 7;
        case 'LAST_30_DAYS': return daysDiff <= 30;
        case 'LAST_YEAR': return daysDiff <= 365;
        default: return true;
      }
    });
  }, [trades, timeRange]);

  // Filter trades based on active tab
  const displayedTrades = useMemo(() => {
    switch (activeTab) {
      case 'open':
        return filteredTrades.filter(t => !t.closeDate);
      case 'closed':
        return filteredTrades.filter(t => t.closeDate);
      default:
        return filteredTrades;
    }
  }, [filteredTrades, activeTab]);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Options Trading Dashboard</h1>
        <div className="flex items-center space-x-4">
          <select
            className="px-3 py-1 border rounded"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          >
            <option value="LAST_7_DAYS">Last 7 Days</option>
            <option value="LAST_30_DAYS">Last 30 Days</option>
            <option value="LAST_YEAR">Last Year</option>
            <option value="ALL_TIME">All Time</option>
          </select>
        </div>
      </div>

      <DashboardMetrics trades={filteredTrades} />

      <div className="mb-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('all')}
            >
              All Trades
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'open'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('open')}
            >
              Open Positions
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'closed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('closed')}
            >
              Closed Positions
            </button>
          </nav>
        </div>
      </div>

      <TradeTable
        trades={displayedTrades}
        onClose={onCloseTrade}
        onEdit={onEditTrade}
        onDelete={onDeleteTrade}
        onView={onViewTrade}
        showActions={true}
        showPL={true}
        initialGroupBy="status"
      />
    </div>
  );
}; 