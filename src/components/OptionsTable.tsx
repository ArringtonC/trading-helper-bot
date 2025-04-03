import React, { useState, useMemo, useCallback } from 'react';
import { OptionTrade, calculateTradePL } from '../types/options';
import { format, differenceInDays, parseISO } from 'date-fns';

interface OptionsTableProps {
  positions: OptionTrade[];
  onClose?: (tradeId: string) => void;
  onEdit?: (tradeId: string) => void;
  onDelete?: (tradeId: string) => void;
  onView?: (trade: OptionTrade) => void;
  showActions?: boolean;
  showPL?: boolean;
}

type SortField = 'symbol' | 'type' | 'strike' | 'expiry' | 'quantity' | 'premium' | 'days' | 'pnl';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

/**
 * Component for displaying a table of options positions
 */
const OptionsTable: React.FC<OptionsTableProps> = ({ 
  positions, 
  onClose, 
  onEdit, 
  onDelete,
  onView,
  showActions = true,
  showPL = true
}) => {
  // Initialize hooks at the top level
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'expiry', direction: 'asc' });
  const [filter, setFilter] = useState('');
  const [groupBy, setGroupBy] = useState<'none' | 'symbol' | 'strategy'>('none');
  
  // Format date for display
  const formatDate = useCallback((date: Date): string => {
    return format(date, 'MMM d, yyyy');
  }, []);
  
  // Calculate days until expiration
  const daysUntilExpiration = useCallback((position: OptionTrade): number => {
    const today = new Date();
    const expiry = new Date(position.expiry);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }, []);
  
  // Calculate days open
  const daysOpen = useCallback((position: OptionTrade): number => {
    const today = new Date();
    const openDate = new Date(position.openDate);
    const closeDate = position.closeDate ? new Date(position.closeDate) : today;
    return differenceInDays(closeDate, openDate);
  }, []);
  
  // Determine if a trade is open or closed
  const isOpen = useCallback((position: OptionTrade): boolean => {
    return !position.closeDate;
  }, []);
  
  // Calculate P&L for a trade
  const calculatePL = useCallback((position: OptionTrade): number => {
    if (isOpen(position)) {
      return 0;
    }
    
    // For imported trades, use the realizedPL from notes if available
    if (position.notes && position.notes.includes('Realized P&L:')) {
      const plMatch = position.notes.match(/Realized P&L: \$([\d.]+)/);
      if (plMatch && plMatch[1]) {
        return parseFloat(plMatch[1]);
      }
    }
    
    // For manually closed trades, calculate based on premium difference
    if (position.closePremium !== undefined) {
      const premiumDiff = position.closePremium - position.premium;
      const totalPL = premiumDiff * position.quantity;
      return totalPL - (position.commission || 0);
    }
    
    // Fallback to the calculateTradePL function
    return calculateTradePL(position);
  }, [isOpen]);
  
  // Calculate summary statistics
  const summary = useMemo(() => {
    const openPositions = positions.filter(p => isOpen(p));
    const closedPositions = positions.filter(p => !isOpen(p));
    const winningTrades = closedPositions.filter(p => calculatePL(p) > 0);
    
    return {
      totalPositions: positions.length,
      openPositions: openPositions.length,
      closedPositions: closedPositions.length,
      totalPL: closedPositions.reduce((sum, p) => sum + calculatePL(p), 0),
      averageDaysToExpiry: openPositions.length > 0 
        ? openPositions.reduce((sum, p) => sum + daysUntilExpiration(p), 0) / openPositions.length
        : 0,
      winRate: closedPositions.length > 0 
        ? (winningTrades.length / closedPositions.length) * 100 
        : 0,
      averageDaysHeld: closedPositions.length > 0
        ? closedPositions.reduce((sum, p) => sum + daysOpen(p), 0) / closedPositions.length
        : 0
    };
  }, [positions, isOpen, calculatePL, daysUntilExpiration, daysOpen]);
  
  // Group positions by symbol or strategy
  const groupedPositions = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Positions': positions };
    }
    
    const groups: Record<string, OptionTrade[]> = {};
    
    positions.forEach(position => {
      const key = groupBy === 'symbol' ? position.symbol : position.strategy;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(position);
    });
    
    return groups;
  }, [positions, groupBy]);
  
  // Sort and filter positions
  const sortPositions = useCallback((positions: OptionTrade[]) => {
    return [...positions].sort((a, b) => {
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
          comparison = a.expiry.getTime() - b.expiry.getTime();
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
      }
      
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [sortConfig, daysUntilExpiration, calculatePL]);
  
  const handleSort = (field: SortField) => {
    setSortConfig(prevConfig => ({
      field,
      direction: prevConfig.field === field && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  const SortHeader: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <th 
      onClick={() => handleSort(field)}
      className="cursor-pointer hover:bg-gray-100"
    >
      {children}
      {sortConfig.field === field && (
        <span className="ml-1">
          {sortConfig.direction === 'asc' ? '↑' : '↓'}
        </span>
      )}
    </th>
  );
  
  // Render a group of positions
  const renderPositionGroup = (groupName: string, positions: OptionTrade[]) => {
    const sortedPositions = sortPositions(positions);
    const filteredPositions = sortedPositions.filter(p => 
      p.symbol.toLowerCase().includes(filter.toLowerCase()) ||
      p.putCall.toLowerCase().includes(filter.toLowerCase()) ||
      p.strategy.toLowerCase().includes(filter.toLowerCase())
    );
    
    if (filteredPositions.length === 0) {
      return null;
    }
    
    return (
      <div key={groupName} className="mb-6">
        {groupBy !== 'none' && (
          <h3 className="text-lg font-semibold mb-2 pb-1 border-b border-gray-200">
            {groupName} ({filteredPositions.length})
          </h3>
        )}
        
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <SortHeader field="symbol">Symbol</SortHeader>
              <SortHeader field="type">Type</SortHeader>
              <SortHeader field="strike">Strike</SortHeader>
              <SortHeader field="expiry">Expiry</SortHeader>
              <SortHeader field="quantity">Qty</SortHeader>
              <SortHeader field="premium">Premium</SortHeader>
              {showPL && <SortHeader field="pnl">P&L</SortHeader>}
              <SortHeader field="days">Days</SortHeader>
              <th>Status</th>
              {showActions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredPositions.map((position) => (
              <tr key={position.id} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="py-2 px-4">
                  <div className="font-medium">{position.symbol}</div>
                  <div className="text-xs text-gray-500">
                    Opened: {formatDate(position.openDate)}
                  </div>
                </td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    position.putCall === 'CALL' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {position.putCall}
                  </span>
                </td>
                <td className="py-2 px-4">${position.strike.toFixed(2)}</td>
                <td className="py-2 px-4">
                  <div>{formatDate(position.expiry)}</div>
                  <div className={`text-xs ${
                    daysUntilExpiration(position) <= 3 ? 'text-red-600 font-medium' : 'text-gray-500'
                  }`}>
                    {daysUntilExpiration(position)}d left
                  </div>
                </td>
                <td className="py-2 px-4">
                  <span className={`${
                    position.quantity > 0 ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {position.quantity}
                  </span>
                </td>
                <td className="py-2 px-4">${position.premium.toFixed(2)}</td>
                {showPL && (
                  <td className={`py-2 px-4 font-medium ${
                    calculatePL(position) > 0 ? 'text-green-600' : 
                    calculatePL(position) < 0 ? 'text-red-600' : ''
                  }`}>
                    ${calculatePL(position).toFixed(2)}
                  </td>
                )}
                <td className="py-2 px-4">{daysOpen(position)}</td>
                <td className="py-2 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    isOpen(position) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {isOpen(position) ? 'OPEN' : 'CLOSED'}
                  </span>
                </td>
                {showActions && (
                  <td className="py-2 px-4">
                    <div className="flex space-x-2">
                      {isOpen(position) && onClose && (
                        <button
                          onClick={() => onClose(position.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Close
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(position.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      )}
                      {onView && (
                        <button
                          onClick={() => onView(position)}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          View
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
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
            ${summary.totalPL.toFixed(2)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm text-gray-500">Win Rate</div>
          <div className="text-xl font-bold">
            {summary.winRate.toFixed(1)}%
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm text-gray-500">Avg Days Held</div>
          <div className="text-xl font-bold">
            {summary.averageDaysHeld.toFixed(1)}
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
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Filter positions..."
            className="px-3 py-1 border rounded"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <select 
            className="px-3 py-1 border rounded"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as 'none' | 'symbol' | 'strategy')}
          >
            <option value="none">No Grouping</option>
            <option value="symbol">Group by Symbol</option>
            <option value="strategy">Group by Strategy</option>
          </select>
        </div>
      </div>
      
      {/* Position Groups */}
      {Object.entries(groupedPositions).map(([groupName, positions]) => 
        renderPositionGroup(groupName, positions)
      )}
    </div>
  );
};

export default OptionsTable; 