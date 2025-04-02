import React, { useState, useMemo } from 'react';
import { OptionTrade, calculateTradePL, daysUntilExpiration, OptionStrategy } from '../types/options';

interface OptionsTableProps {
  positions: OptionTrade[];
  onClose?: (tradeId: string) => void;
  onEdit?: (tradeId: string) => void;
  onDelete?: (tradeId: string) => void;
  onView?: (trade: OptionTrade) => void;
  showActions?: boolean;
  showPL?: boolean;
}

type SortField = 'symbol' | 'type' | 'strike' | 'expiry' | 'quantity' | 'premium' | 'days';
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
  
  // Current date for expiration calculations
  const currentDate = new Date();
  
  // Calculate summary statistics
  const summary = useMemo(() => {
    const openPositions = positions.filter(p => !p.closeDate);
    const closedPositions = positions.filter(p => p.closeDate);
    
    return {
      totalPositions: positions.length,
      openPositions: openPositions.length,
      closedPositions: closedPositions.length,
      totalPL: closedPositions.reduce((sum, p) => sum + calculateTradePL(p), 0),
      averageDaysToExpiry: openPositions.length > 0 
        ? openPositions.reduce((sum, p) => sum + daysUntilExpiration(p), 0) / openPositions.length
        : 0
    };
  }, [positions, currentDate]);
  
  // Sort and filter positions
  const sortedPositions = useMemo(() => {
    let filtered = positions.filter(p => 
      p.symbol.toLowerCase().includes(filter.toLowerCase()) ||
      p.putCall.toLowerCase().includes(filter.toLowerCase())
    );
    
    return [...filtered].sort((a, b) => {
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
      }
      
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [positions, sortConfig, filter, currentDate]);
  
  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  const SortHeader: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <th 
      className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center">
        {children}
        {sortConfig.field === field && (
          <span className="ml-1">
            {sortConfig.direction === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );

  // Render empty state if no positions
  if (!positions || positions.length === 0) {
    return (
      <div className="bg-gray-50 p-4 border border-gray-200 rounded-md text-center">
        <p className="text-gray-500">No positions found</p>
      </div>
    );
  }
  
  // Render table with positions
  return (
    <div className="space-y-4">
      {/* Filter input */}
      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="Filter by symbol or type..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="text-sm text-gray-500">
          Showing {sortedPositions.length} of {positions.length} positions
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <SortHeader field="symbol">Symbol</SortHeader>
              <SortHeader field="type">Type</SortHeader>
              <SortHeader field="strike">Strike</SortHeader>
              <SortHeader field="expiry">Expiry</SortHeader>
              <SortHeader field="quantity">Qty</SortHeader>
              <SortHeader field="premium">Premium</SortHeader>
              {positions[0].closeDate && (
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Close</th>
              )}
              {showPL && (
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P&L</th>
              )}
              {!positions[0].closeDate && (
                <SortHeader field="days">Days</SortHeader>
              )}
              {showActions && (
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedPositions.map((position) => {
              const pl = calculateTradePL(position);
              const daysToExpiry = daysUntilExpiration(position);
              const isExpired = daysToExpiry <= 0;
              
              return (
                <tr 
                  key={position.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={(e) => {
                    // Prevent row click when clicking action buttons
                    if (e.target instanceof HTMLButtonElement) {
                      e.stopPropagation();
                      return;
                    }
                    onView?.(position);
                  }}
                >
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="group relative">
                      <span>{position.symbol}</span>
                      <div className="absolute left-0 top-full mt-1 w-48 bg-gray-800 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        Opened: {position.openDate.toLocaleDateString()}
                        {position.closeDate && <br />}
                        {position.closeDate && `Closed: ${position.closeDate.toLocaleDateString()}`}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span 
                      className={position.putCall === 'CALL' ? 'text-green-600' : 'text-red-600'}
                    >
                      {position.putCall}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">${position.strike.toFixed(2)}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {position.expiry.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className={position.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                      {position.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">${position.premium.toFixed(2)}</td>
                  {position.closeDate && (
                    <td className="px-4 py-2 whitespace-nowrap">
                      ${position.closePremium?.toFixed(2) || '-'}
                    </td>
                  )}
                  {showPL && (
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={pl >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ${pl.toFixed(2)}
                      </span>
                    </td>
                  )}
                  {!position.closeDate && (
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={isExpired ? 'text-red-600' : ''}>
                        {daysToExpiry}
                      </span>
                    </td>
                  )}
                  {showActions && (
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {onClose && !position.closeDate && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onClose(position.id);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Close
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(position.id);
                            }}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            Edit
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(position.id);
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
            
            {/* Summary row */}
            <tr className="bg-gray-50 font-medium">
              <td colSpan={4} className="px-4 py-2 text-right">Summary:</td>
              <td className="px-4 py-2">
                {summary.openPositions} open / {summary.closedPositions} closed
              </td>
              <td className="px-4 py-2">-</td>
              {positions[0].closeDate && <td className="px-4 py-2">-</td>}
              {showPL && (
                <td className="px-4 py-2">
                  <span className={summary.totalPL >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ${summary.totalPL.toFixed(2)}
                  </span>
                </td>
              )}
              {!positions[0].closeDate && (
                <td className="px-4 py-2">
                  {summary.averageDaysToExpiry.toFixed(1)} avg
                </td>
              )}
              {showActions && <td className="px-4 py-2">-</td>}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OptionsTable; 