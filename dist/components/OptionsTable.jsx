var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import React, { useState, useMemo, useCallback } from 'react';
import { format, differenceInDays } from 'date-fns';
/**
 * Component for displaying a table of options positions
 */
var OptionsTable = function (_a) {
    var positions = _a.positions, onClose = _a.onClose, onEdit = _a.onEdit, onDelete = _a.onDelete, onView = _a.onView, _b = _a.showActions, showActions = _b === void 0 ? true : _b, _c = _a.showPL, showPL = _c === void 0 ? true : _c;
    // Initialize hooks at the top level
    var _d = useState({ field: 'expiry', direction: 'asc' }), sortConfig = _d[0], setSortConfig = _d[1];
    var _e = useState(''), filter = _e[0], setFilter = _e[1];
    var _f = useState('none'), groupBy = _f[0], setGroupBy = _f[1];
    // Format date for display
    var formatDate = useCallback(function (date) {
        return format(date, 'MMM d, yyyy');
    }, []);
    // Calculate days until expiration
    var daysUntilExpiration = useCallback(function (position) {
        var today = new Date();
        var expiry = new Date(position.expiry);
        var diffTime = expiry.getTime() - today.getTime();
        return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }, []);
    // Calculate days open
    var daysOpen = useCallback(function (position) {
        var today = new Date();
        var openDate = new Date(position.openDate);
        var closeDate = position.closeDate ? new Date(position.closeDate) : today;
        return differenceInDays(closeDate, openDate);
    }, []);
    // Determine if a trade is open or closed
    var isOpen = useCallback(function (position) {
        return !position.closeDate;
    }, []);
    // Calculate P&L for a trade
    var calculatePL = useCallback(function (position) {
        // For manually closed trades, calculate based on premium difference
        if (position.closePremium !== undefined) {
            var premiumDiff = position.closePremium - (position.premium || 0);
            var totalPL = premiumDiff * position.quantity;
            return totalPL - (position.commission || 0);
        }
        // For open trades, calculate based on current price if available
        if (position.currentPrice !== undefined) {
            var priceDiff = position.currentPrice - (position.premium || 0);
            var totalPL = priceDiff * position.quantity;
            return totalPL - (position.commission || 0);
        }
        return 0;
    }, []);
    // Calculate summary statistics
    var summary = useMemo(function () {
        var openPositions = positions.filter(function (p) { return isOpen(p); });
        var closedPositions = positions.filter(function (p) { return !isOpen(p); });
        var winningTrades = closedPositions.filter(function (p) { return calculatePL(p) > 0; });
        return {
            totalPositions: positions.length,
            openPositions: openPositions.length,
            closedPositions: closedPositions.length,
            totalPL: closedPositions.reduce(function (sum, p) { return sum + calculatePL(p); }, 0),
            averageDaysToExpiry: openPositions.length > 0
                ? openPositions.reduce(function (sum, p) { return sum + daysUntilExpiration(p); }, 0) / openPositions.length
                : 0,
            winRate: closedPositions.length > 0
                ? (winningTrades.length / closedPositions.length) * 100
                : 0,
            averageDaysHeld: closedPositions.length > 0
                ? closedPositions.reduce(function (sum, p) { return sum + daysOpen(p); }, 0) / closedPositions.length
                : 0
        };
    }, [positions, isOpen, calculatePL, daysUntilExpiration, daysOpen]);
    // Group positions by symbol or strategy
    var groupedPositions = useMemo(function () {
        if (groupBy === 'none') {
            return { 'All Positions': positions };
        }
        var groups = {};
        positions.forEach(function (position) {
            var key = groupBy === 'symbol' ? position.symbol : position.strategy;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(position);
        });
        return groups;
    }, [positions, groupBy]);
    // Sort and filter positions
    var sortPositions = useCallback(function (positions) {
        return __spreadArray([], positions, true).sort(function (a, b) {
            var comparison = 0;
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
    var handleSort = function (field) {
        setSortConfig(function (prevConfig) { return ({
            field: field,
            direction: prevConfig.field === field && prevConfig.direction === 'asc' ? 'desc' : 'asc'
        }); });
    };
    var SortHeader = function (_a) {
        var field = _a.field, children = _a.children;
        return (<th onClick={function () { return handleSort(field); }} className="cursor-pointer hover:bg-gray-100">
      {children}
      {sortConfig.field === field && (<span className="ml-1">
          {sortConfig.direction === 'asc' ? '↑' : '↓'}
        </span>)}
    </th>);
    };
    // Render a group of positions
    var renderPositionGroup = function (groupName, positions) {
        var sortedPositions = sortPositions(positions);
        var filteredPositions = sortedPositions.filter(function (p) {
            return p.symbol.toLowerCase().includes(filter.toLowerCase()) ||
                p.putCall.toLowerCase().includes(filter.toLowerCase()) ||
                p.strategy.toLowerCase().includes(filter.toLowerCase());
        });
        if (filteredPositions.length === 0) {
            return null;
        }
        return (<div key={groupName} className="mb-6">
        {groupBy !== 'none' && (<h3 className="text-lg font-semibold mb-2 pb-1 border-b border-gray-200">
            {groupName} ({filteredPositions.length})
          </h3>)}
        
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <SortHeader field="symbol">Symbol</SortHeader>
              <SortHeader field="type">Type</SortHeader>
              <SortHeader field="strike">Strike</SortHeader>
              <SortHeader field="expiry">Expiry</SortHeader>
              <SortHeader field="quantity">Qty</SortHeader>
              <th>Proceeds (debug)</th>
              <SortHeader field="premium">Premium</SortHeader>
              {showPL && <SortHeader field="pnl">P&L</SortHeader>}
              <SortHeader field="days">Days</SortHeader>
              <th>Status</th>
              {showActions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredPositions.map(function (position) { return (<tr key={position.id} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="py-2 px-4">
                  <div className="font-medium">{position.symbol}</div>
                  <div className="text-xs text-gray-500">
                    Opened: {formatDate(position.openDate)}
                  </div>
                </td>
                <td className="py-2 px-4">
                  <span className={"px-2 py-1 rounded text-xs ".concat(position.putCall === 'CALL' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                    {position.putCall}
                  </span>
                </td>
                <td className="py-2 px-4">${position.strike.toFixed(2)}</td>
                <td className="py-2 px-4">
                  <div>{formatDate(position.expiry)}</div>
                  <div className={"text-xs ".concat(daysUntilExpiration(position) <= 3 ? 'text-red-600 font-medium' : 'text-gray-500')}>
                    {daysUntilExpiration(position)}d left
                  </div>
                </td>
                <td className={"$".concat(position.quantity > 0 ? 'text-blue-600' : 'text-red-600', " py-2 px-4")}>
                    {position.quantity}
                </td>
                <td className="py-2 px-4 text-xs text-gray-500">{typeof position.proceeds !== 'undefined' ? String(position.proceeds) : 'n/a'}</td>
                <td className="py-2 px-4">${(position.premium || 0).toFixed(2)}</td>
                {showPL && (<td className={"py-2 px-4 font-medium ".concat(calculatePL(position) > 0 ? 'text-green-600' :
                        calculatePL(position) < 0 ? 'text-red-600' : 'text-gray-600')}>
                    ${calculatePL(position).toFixed(2)}
                  </td>)}
                <td className="py-2 px-4">{daysOpen(position)}</td>
                <td className="py-2 px-4">
                  <span className={"px-2 py-1 rounded text-xs ".concat(isOpen(position) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')}>
                    {isOpen(position) ? 'OPEN' : 'CLOSED'}
                  </span>
                </td>
                {showActions && (<td className="py-2 px-4">
                    <div className="flex space-x-2">
                      {isOpen(position) && onClose && (<button onClick={function () { return onClose(position.id); }} className="text-blue-600 hover:text-blue-800">
                          Close
                        </button>)}
                      {onDelete && (<button onClick={function () { return onDelete(position.id); }} className="text-red-600 hover:text-red-800">
                          Delete
                        </button>)}
                      {onView && (<button onClick={function () { return onView(position); }} className="text-gray-600 hover:text-gray-800">
                          View
                        </button>)}
                    </div>
                  </td>)}
              </tr>); })}
          </tbody>
        </table>
      </div>);
    };
    return (<div className="overflow-x-auto">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm text-gray-500">Total P&L</div>
          <div className={"text-xl font-bold ".concat(summary.totalPL > 0 ? 'text-green-600' :
            summary.totalPL < 0 ? 'text-red-600' : '')}>
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
          <input type="text" placeholder="Filter positions..." className="px-3 py-1 border rounded" value={filter} onChange={function (e) { return setFilter(e.target.value); }}/>
          <select className="px-3 py-1 border rounded" value={groupBy} onChange={function (e) { return setGroupBy(e.target.value); }}>
            <option value="none">No Grouping</option>
            <option value="symbol">Group by Symbol</option>
            <option value="strategy">Group by Strategy</option>
          </select>
        </div>
      </div>
      
      {/* Position Groups */}
      {Object.entries(groupedPositions).map(function (_a) {
            var groupName = _a[0], positions = _a[1];
            return renderPositionGroup(groupName, positions);
        })}
    </div>);
};
export default OptionsTable;
