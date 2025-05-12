import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { OptionTrade } from '../types/options';
import { format } from 'date-fns';

type SortField = 'symbol' | 'type' | 'strike' | 'expiry' | 'quantity' | 'proceeds' | 'premium' | 'days' | 'pnl' | 'openDate' | 'closeDate' | 'pl';
type SortDirection = 'asc' | 'desc';
type GroupBy = 'none' | 'symbol' | 'strategy' | 'status';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

interface TradeTableProps {
  trades: OptionTrade[];
  calculatePL?: (trade: OptionTrade) => number;
  onTradeUpdated?: () => void;
  onClose?: (tradeId: string) => void;
  onEdit?: (tradeId: string) => void;
  onDelete?: (tradeId: string) => void;
  onView?: (trade: OptionTrade) => void;
  showActions?: boolean;
  showPL?: boolean;
  initialSortField?: SortField;
  initialSortDirection?: 'asc' | 'desc';
  initialFilter?: string;
  initialGroupBy?: 'none' | 'symbol' | 'strategy' | 'status';
}

const TradeTable: React.FC<TradeTableProps> = ({ 
  trades, 
  calculatePL = (trade: OptionTrade) => trade.tradePL || 0,
  onTradeUpdated,
  onClose, 
  onEdit, 
  onDelete,
  onView,
  showActions = true,
  showPL = true,
  initialSortField = 'expiry',
  initialSortDirection = 'asc',
  initialFilter = '',
  initialGroupBy = 'none'
}) => {
  // Initialize hooks at the top level
  const [sortConfig, setSortConfig] = useState<SortConfig>({ 
    field: initialSortField, 
    direction: initialSortDirection 
  });
  const [filter, setFilter] = useState(initialFilter);
  const [groupBy, setGroupBy] = useState<GroupBy>(initialGroupBy);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  // Format date for display
  const formatDate = useCallback((date: Date | undefined): string => {
    if (!date) return '-';
    return format(date, 'MMM d, yyyy');
  }, []);
  
  // Filter trades based on search text
  const filteredTrades = useMemo(() => {
    if (!filter) {
      return trades;
    }
    
    const searchLower = filter.toLowerCase();
    return trades.filter(trade => 
      trade.symbol.toLowerCase().includes(searchLower) ||
      trade.putCall.toLowerCase().includes(searchLower) ||
      trade.strategy.toLowerCase().includes(searchLower) ||
      (trade.notes && trade.notes.toLowerCase().includes(searchLower))
    );
  }, [trades, filter]);
  
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
          key = trade.closeDate ? 'Closed Positions' : 'Open Positions';
          break;
        default:
          key = 'All Trades';
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(trade);
    });
    
    return groups;
  }, [filteredTrades, groupBy]);
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
          comparison = (a.premium || 0) - (b.premium || 0);
          break;
        case 'pl':
          const plA = calculatePL(a) || 0;
          const plB = calculatePL(b) || 0;
          comparison = plA - plB;
          break;
        case 'openDate':
          const openDateA = new Date(a.openDate).getTime();
          const openDateB = new Date(b.openDate).getTime();
          comparison = openDateA - openDateB;
          break;
        case 'closeDate':
          const closeDateA = a.closeDate ? new Date(a.closeDate).getTime() : Infinity;
          const closeDateB = b.closeDate ? new Date(b.closeDate).getTime() : Infinity;
          comparison = closeDateA - closeDateB;
          break;
      }
      
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [sortConfig, calculatePL]);
  
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
  const SortHeader: React.FC<{ field: SortField; children: React.ReactNode; 'data-testid'?: string }> = ({ field, children, 'data-testid': dataTestId }) => (
    <th 
      onClick={() => handleSort(field)}
      className="cursor-pointer hover:bg-gray-100 px-4 py-2 text-left"
      data-testid={dataTestId}
    >
      {children}
      {sortConfig.field === field && (
        <span className="ml-1">
          {sortConfig.direction === 'asc' ? '↑' : '↓'}
        </span>
      )}
    </th>
  );
    
    return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <input
          type="text"
          placeholder="Search trades..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border rounded"
        />
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as GroupBy)}
          className="px-4 py-2 border rounded"
        >
          <option value="none">No Grouping</option>
          <option value="symbol">Group by Symbol</option>
          <option value="strategy">Group by Strategy</option>
        </select>
        </div>
        
      {/* Position Groups */}
      {Object.entries(groupedTrades).map(([groupName, positions]) => (
        <div key={groupName} className="mb-6">
          {groupBy !== 'none' && (
            <h3 className="text-lg font-semibold mb-2 pb-1 border-b border-gray-200">
              {groupName} ({positions.length})
            </h3>
          )}
          
          <table data-testid="trades-table" className="min-w-full bg-white border border-gray-200">
              <thead>
              <tr className="bg-gray-100">
                <SortHeader field="symbol" data-testid="header-symbol">Symbol</SortHeader>
                <SortHeader field="type" data-testid="header-type">Type</SortHeader>
                <SortHeader field="strike" data-testid="header-strike">Strike</SortHeader>
                <SortHeader field="expiry" data-testid="header-expiry">Expiry</SortHeader>
                <SortHeader field="quantity" data-testid="header-quantity">Qty</SortHeader>
                <SortHeader field="proceeds" data-testid="header-proceeds">Proceeds</SortHeader>
                <th>Debug</th>
                <SortHeader field="premium" data-testid="header-premium">Premium</SortHeader>
                <SortHeader field="openDate" data-testid="header-open-date">Open Date</SortHeader>
                <SortHeader field="closeDate" data-testid="header-close-date">Close Date</SortHeader>
                {showPL && <SortHeader field="pl" data-testid="header-pl">P&L</SortHeader>}
                </tr>
              </thead>
              <tbody>
              {sortTrades(positions).map((position) => {
                const pl = calculatePL(position);
                  return (
                  <tr key={position.id} data-testid={`trade-row-${position.id}`}>
                    <td data-testid={`symbol-${position.id}`}>{position.symbol}</td>
                    <td data-testid={`type-${position.id}`}>{position.putCall}</td>
                    <td data-testid={`strike-${position.id}`}>${(position.strike ?? 0).toFixed(2)}</td>
                    <td data-testid={`expiry-${position.id}`}>{formatDate(position.expiry)}</td>
                    <td data-testid={`quantity-${position.id}`}>{position.quantity}</td>
                    <td data-testid={`proceeds-${position.id}`}>${(position.proceeds ?? 0).toFixed(2)}</td>
                    <td data-testid={`debug-${position.id}`}> <pre style={{ fontSize: 10, maxWidth: 200, whiteSpace: 'pre-wrap' }}>{JSON.stringify(position, null, 2)}</pre> </td>
                    <td data-testid={`premium-${position.id}`}>${(position.premium ?? 0).toFixed(2)}</td>
                    <td data-testid={`openDate-${position.id}`}>{formatDate(position.openDate)}</td>
                    <td data-testid={`closeDate-${position.id}`}>{position.closeDate ? formatDate(position.closeDate) : '-'}</td>
                      {showPL && (
                      <td data-testid={`trade-pl-${position.id}`} className={`py-2 px-4 font-medium ${
                          pl > 0 ? 'text-green-600' : 
                        pl < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          ${(pl ?? 0).toFixed(2)}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
      ))}
    </div>
  );
};

export default TradeTable; 
