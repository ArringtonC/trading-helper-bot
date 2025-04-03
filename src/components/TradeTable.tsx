import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { OptionTrade, calculateTradePL } from '../types/options';
import { format, differenceInDays } from 'date-fns';
import { formatDateForDisplay, daysUntil, daysBetween } from '../utils/dateUtils';
import { debugLog } from '../utils/debugUtils';

interface TradeTableProps {
  trades: OptionTrade[];
  onClose?: (tradeId: string) => void;
  onEdit?: (tradeId: string) => void;
  onDelete?: (tradeId: string) => void;
  onView?: (trade: OptionTrade) => void;
  showActions?: boolean;
  showPL?: boolean;
  initialSortField?: 'symbol' | 'type' | 'strike' | 'expiry' | 'quantity' | 'premium' | 'days' | 'pnl' | 'openDate' | 'closeDate';
  initialSortDirection?: 'asc' | 'desc';
  initialFilter?: string;
  initialGroupBy?: 'none' | 'symbol' | 'strategy' | 'status';
  initialStatusFilter?: 'all' | 'open' | 'closed';
}

type SortField = 'symbol' | 'type' | 'strike' | 'expiry' | 'quantity' | 'premium' | 'days' | 'pnl' | 'openDate' | 'closeDate';
type SortDirection = 'asc' | 'desc';
type GroupBy = 'none' | 'symbol' | 'strategy' | 'status';
type StatusFilter = 'all' | 'open' | 'closed';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

/**
 * Enhanced component for displaying a table of option trades with advanced filtering and sorting
 */
const TradeTable: React.FC<TradeTableProps> = ({ 
  trades, 
  onClose, 
  onEdit, 
  onDelete,
  onView,
  showActions = true,
  showPL = true,
  initialSortField = 'expiry',
  initialSortDirection = 'asc',
  initialFilter = '',
  initialGroupBy = 'none',
  initialStatusFilter = 'all'
}) => {
  // Debug log the trades prop
  useEffect(() => {
    debugLog('TradeTable received trades', trades);
  }, [trades]);
  
  // Initialize hooks at the top level
  const [sortConfig, setSortConfig] = useState<SortConfig>({ 
    field: initialSortField, 
    direction: initialSortDirection 
  });
  const [filter, setFilter] = useState(initialFilter);
  const [groupBy, setGroupBy] = useState<GroupBy>(initialGroupBy);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatusFilter);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  // Format date for display
  const formatDate = useCallback((date: Date): string => {
    return formatDateForDisplay(date);
  }, []);
  
  // Calculate days until expiration
  const daysUntilExpiration = useCallback((trade: OptionTrade): number => {
    return daysUntil(trade.expiry);
  }, []);
  
  // Calculate days open
  const daysOpen = useCallback((trade: OptionTrade): number => {
    const today = new Date();
    const openDate = new Date(trade.openDate);
    const closeDate = trade.closeDate ? new Date(trade.closeDate) : today;
    return daysBetween(openDate, closeDate);
  }, []);
  
  // Determine if a trade is open or closed
  const isOpen = useCallback((trade: OptionTrade): boolean => {
    return !trade.closeDate;
  }, []);
  
  // Calculate P&L for a trade
  const calculatePL = useCallback((trade: OptionTrade): number => {
    if (isOpen(trade)) {
      return 0;
    }
    
    // For imported trades, use the realizedPL from notes if available
    if (trade.notes && trade.notes.includes('Realized P&L:')) {
      const plMatch = trade.notes.match(/Realized P&L: \$([\d.]+)/);
      if (plMatch && plMatch[1]) {
        return parseFloat(plMatch[1]);
      }
    }
    
    // For manually closed trades, calculate based on premium difference
    if (trade.closePremium !== undefined) {
      const premiumDiff = trade.closePremium - trade.premium;
      const totalPL = premiumDiff * trade.quantity;
      return totalPL - (trade.commission || 0);
    }
    
    // Fallback to the calculateTradePL function
    return calculateTradePL(trade);
  }, [isOpen]);
  
  // Filter trades based on status
  const filteredByStatus = useMemo(() => {
    if (statusFilter === 'all') {
      return trades;
    }
    const filtered = trades.filter(trade => 
      statusFilter === 'open' ? isOpen(trade) : !isOpen(trade)
    );
    debugLog('Filtered by status', filtered);
    return filtered;
  }, [trades, statusFilter, isOpen]);
  
  // Filter trades based on search text
  const filteredTrades = useMemo(() => {
    if (!filter) {
      return filteredByStatus;
    }
    
    const searchLower = filter.toLowerCase();
    const filtered = filteredByStatus.filter(trade => 
      trade.symbol.toLowerCase().includes(searchLower) ||
      trade.putCall.toLowerCase().includes(searchLower) ||
      trade.strategy.toLowerCase().includes(searchLower) ||
      (trade.notes && trade.notes.toLowerCase().includes(searchLower))
    );
    debugLog('Filtered by search', filtered);
    return filtered;
  }, [filteredByStatus, filter]);
  
  // Group trades
  const groupedTrades = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Trades': filteredTrades };
    }
    
    const groups: Record<string, OptionTrade[]> = {};
    
    filteredTrades.forEach(trade => {
      let key: string;
      
      switch (groupBy) {
        case 'symbol':
          key = trade.symbol;
          break;
        case 'strategy':
          key = trade.strategy;
          break;
        case 'status':
          key = isOpen(trade) ? 'Open Positions' : 'Closed Positions';
          break;
        default:
          key = 'All Trades';
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(trade);
    });
    
    debugLog('Grouped trades', groups);
    return groups;
  }, [filteredTrades, groupBy, isOpen]);
  
  // Sort trades
  const sortTrades = useCallback((tradesToSort: OptionTrade[]) => {
    return [...tradesToSort].sort((a, b) => {
      let comparison = 0;
      
      switch (sortConfig.field) {
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case 'type':
          comparison = a.putCall.localeCompare(b.putCall);
          break;
        case 'strike':
          comparison = a.strike - b.strike;
          break;
        case 'expiry':
          comparison = new Date(a.expiry).getTime() - new Date(b.expiry).getTime();
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
        case 'premium':
          comparison = a.premium - b.premium;
          break;
        case 'days':
          comparison = daysUntilExpiration(a) - daysUntilExpiration(b);
          break;
        case 'pnl':
          comparison = calculatePL(a) - calculatePL(b);
          break;
        case 'openDate':
          comparison = new Date(a.openDate).getTime() - new Date(b.openDate).getTime();
          break;
        case 'closeDate':
          if (!a.closeDate && !b.closeDate) return 0;
          if (!a.closeDate) return 1;
          if (!b.closeDate) return -1;
          comparison = new Date(a.closeDate).getTime() - new Date(b.closeDate).getTime();
          break;
      }
      
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [sortConfig, daysUntilExpiration, calculatePL]);
  
  // Handle sort
  const handleSort = (field: SortField) => {
    setSortConfig(prevConfig => ({
      field,
      direction: prevConfig.field === field && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  // Toggle group expansion
  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };
  
  // Sort header component
  const SortHeader: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <th 
      onClick={() => handleSort(field)}
      className="cursor-pointer hover:bg-gray-100 px-4 py-2 text-left"
    >
      {children}
      {sortConfig.field === field && (
        <span className="ml-1">
          {sortConfig.direction === 'asc' ? '↑' : '↓'}
        </span>
      )}
    </th>
  );
  
  // Render a group of trades
  const renderTradeGroup = (groupName: string, groupTrades: OptionTrade[]) => {
    const sortedTrades = sortTrades(groupTrades);
    const isExpanded = expandedGroups[groupName] !== false; // Default to expanded
    
    if (sortedTrades.length === 0) {
      return null;
    }
    
    return (
      <div key={groupName} className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
        <div 
          className="bg-gray-100 p-3 flex justify-between items-center cursor-pointer"
          onClick={() => toggleGroup(groupName)}
        >
          <h3 className="text-lg font-semibold">
            {groupName} ({sortedTrades.length})
          </h3>
          <span>{isExpanded ? '▼' : '▶'}</span>
        </div>
        
        {isExpanded && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <SortHeader field="symbol">Symbol</SortHeader>
                  <SortHeader field="type">Type</SortHeader>
                  <SortHeader field="strike">Strike</SortHeader>
                  <SortHeader field="expiry">Expiry</SortHeader>
                  <SortHeader field="quantity">Qty</SortHeader>
                  <SortHeader field="premium">Premium</SortHeader>
                  {showPL && <SortHeader field="pnl">P&L</SortHeader>}
                  <SortHeader field="openDate">Open Date</SortHeader>
                  <SortHeader field="closeDate">Close Date</SortHeader>
                  <th className="px-4 py-2 text-left">Status</th>
                  {showActions && <th className="px-4 py-2 text-left">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {sortedTrades.map((trade) => {
                  // Safely calculate values
                  const pl = calculatePL(trade);
                  const daysLeft = daysUntilExpiration(trade);
                  const strike = trade.strike || 0;
                  const premium = trade.premium || 0;
                  
                  return (
                    <tr key={trade.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <div className="font-medium">{trade.symbol}</div>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          trade.putCall === 'CALL' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {trade.putCall}
                        </span>
                      </td>
                      <td className="px-4 py-2">${strike.toFixed(2)}</td>
                      <td className="px-4 py-2">
                        <div>{formatDate(trade.expiry)}</div>
                        <div className={`text-xs ${
                          daysLeft <= 3 ? 'text-red-600 font-medium' : 'text-gray-500'
                        }`}>
                          {daysLeft}d left
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`${
                          trade.quantity > 0 ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {trade.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-2">${premium.toFixed(2)}</td>
                      {showPL && (
                        <td className={`px-4 py-2 font-medium ${
                          pl > 0 ? 'text-green-600' : 
                          pl < 0 ? 'text-red-600' : ''
                        }`}>
                          ${pl.toFixed(2)}
                        </td>
                      )}
                      <td className="px-4 py-2">{formatDate(trade.openDate)}</td>
                      <td className="px-4 py-2">
                        {trade.closeDate ? formatDate(trade.closeDate) : '-'}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          isOpen(trade) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {isOpen(trade) ? 'OPEN' : 'CLOSED'}
                        </span>
                      </td>
                      {showActions && (
                        <td className="px-4 py-2">
                          <div className="flex space-x-2">
                            {isOpen(trade) && onClose && (
                              <button
                                onClick={() => onClose(trade.id)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                Close
                              </button>
                            )}
                            {onEdit && (
                              <button
                                onClick={() => onEdit(trade.id)}
                                className="text-gray-600 hover:text-gray-800"
                              >
                                Edit
                              </button>
                            )}
                            {onDelete && (
                              <button
                                onClick={() => onDelete(trade.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Delete
                              </button>
                            )}
                            {onView && (
                              <button
                                onClick={() => onView(trade)}
                                className="text-gray-600 hover:text-gray-800"
                              >
                                View
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };
  
  // Calculate summary statistics with safe values
  const summary = useMemo(() => {
    const openPositions = filteredTrades.filter(t => isOpen(t));
    const closedPositions = filteredTrades.filter(t => !isOpen(t));
    const winningTrades = closedPositions.filter(t => calculatePL(t) > 0);
    
    const totalPL = closedPositions.reduce((sum, t) => sum + calculatePL(t), 0);
    const avgDaysToExpiry = openPositions.length > 0 
      ? openPositions.reduce((sum, t) => sum + daysUntilExpiration(t), 0) / openPositions.length
      : 0;
    const winRate = closedPositions.length > 0 
      ? (winningTrades.length / closedPositions.length) * 100 
      : 0;
    const avgDaysHeld = closedPositions.length > 0
      ? closedPositions.reduce((sum, t) => sum + daysOpen(t), 0) / closedPositions.length
      : 0;
    
    return {
      totalTrades: filteredTrades.length,
      openPositions: openPositions.length,
      closedPositions: closedPositions.length,
      totalPL: totalPL || 0,
      averageDaysToExpiry: avgDaysToExpiry || 0,
      winRate: winRate || 0,
      averageDaysHeld: avgDaysHeld || 0
    };
  }, [filteredTrades, isOpen, calculatePL, daysUntilExpiration, daysOpen]);
  
  return (
    <div className="overflow-x-auto">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm text-gray-500">Total P&L</div>
          <div className={`text-xl font-bold ${
            summary.totalPL > 0 ? 'text-green-600' : 
            summary.totalPL < 0 ? 'text-red-600' : ''
          }`}>
            ${(summary.totalPL || 0).toFixed(2)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm text-gray-500">Win Rate</div>
          <div className="text-xl font-bold">
            {(summary.winRate || 0).toFixed(1)}%
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm text-gray-500">Avg Days Held</div>
          <div className="text-xl font-bold">
            {(summary.averageDaysHeld || 0).toFixed(1)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm text-gray-500">Positions</div>
          <div className="text-xl font-bold">
            {summary.openPositions} open / {summary.closedPositions} closed
          </div>
        </div>
      </div>
      
      {/* Filters and Controls */}
      <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="text"
            placeholder="Filter trades..."
            className="px-3 py-1 border rounded"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <select 
            className="px-3 py-1 border rounded"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
          >
            <option value="none">No Grouping</option>
            <option value="symbol">Group by Symbol</option>
            <option value="strategy">Group by Strategy</option>
            <option value="status">Group by Status</option>
          </select>
          <select 
            className="px-3 py-1 border rounded"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="all">All Trades</option>
            <option value="open">Open Only</option>
            <option value="closed">Closed Only</option>
          </select>
        </div>
      </div>
      
      {/* Trade Groups */}
      {Object.entries(groupedTrades).map(([groupName, groupTrades]) => 
        renderTradeGroup(groupName, groupTrades)
      )}
    </div>
  );
};

export default TradeTable; 