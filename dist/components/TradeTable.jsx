var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
import { format } from 'date-fns';
var TradeTable = function (_a) {
    var trades = _a.trades, _b = _a.calculatePL, calculatePL = _b === void 0 ? function (trade) { return trade.tradePL || 0; } : _b, onTradeUpdated = _a.onTradeUpdated, onClose = _a.onClose, onEdit = _a.onEdit, onDelete = _a.onDelete, onView = _a.onView, _c = _a.showActions, showActions = _c === void 0 ? true : _c, _d = _a.showPL, showPL = _d === void 0 ? true : _d, _e = _a.initialSortField, initialSortField = _e === void 0 ? 'expiry' : _e, _f = _a.initialSortDirection, initialSortDirection = _f === void 0 ? 'asc' : _f, _g = _a.initialFilter, initialFilter = _g === void 0 ? '' : _g, _h = _a.initialGroupBy, initialGroupBy = _h === void 0 ? 'none' : _h;
    // Initialize hooks at the top level
    var _j = useState({
        field: initialSortField,
        direction: initialSortDirection
    }), sortConfig = _j[0], setSortConfig = _j[1];
    var _k = useState(initialFilter), filter = _k[0], setFilter = _k[1];
    var _l = useState(initialGroupBy), groupBy = _l[0], setGroupBy = _l[1];
    var _m = useState({}), expandedGroups = _m[0], setExpandedGroups = _m[1];
    // Format date for display
    var formatDate = useCallback(function (date) {
        if (!date)
            return '-';
        return format(date, 'MMM d, yyyy');
    }, []);
    // Filter trades based on search text
    var filteredTrades = useMemo(function () {
        if (!filter) {
            return trades;
        }
        var searchLower = filter.toLowerCase();
        return trades.filter(function (trade) {
            return trade.symbol.toLowerCase().includes(searchLower) ||
                trade.putCall.toLowerCase().includes(searchLower) ||
                trade.strategy.toLowerCase().includes(searchLower) ||
                (trade.notes && trade.notes.toLowerCase().includes(searchLower));
        });
    }, [trades, filter]);
    // Group trades
    var groupedTrades = useMemo(function () {
        if (groupBy === 'none') {
            return { 'All Trades': filteredTrades };
        }
        var groups = {};
        filteredTrades.forEach(function (trade) {
            var key;
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
    var sortTrades = useCallback(function (tradesToSort) {
        return __spreadArray([], tradesToSort, true).sort(function (a, b) {
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
                case 'pl':
                    var plA = calculatePL(a) || 0;
                    var plB = calculatePL(b) || 0;
                    comparison = plA - plB;
                    break;
                case 'openDate':
                    var openDateA = new Date(a.openDate).getTime();
                    var openDateB = new Date(b.openDate).getTime();
                    comparison = openDateA - openDateB;
                    break;
                case 'closeDate':
                    var closeDateA = a.closeDate ? new Date(a.closeDate).getTime() : Infinity;
                    var closeDateB = b.closeDate ? new Date(b.closeDate).getTime() : Infinity;
                    comparison = closeDateA - closeDateB;
                    break;
            }
            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
    }, [sortConfig, calculatePL]);
    // Handle sort
    var handleSort = function (field) {
        setSortConfig(function (prevConfig) { return ({
            field: field,
            direction: prevConfig.field === field && prevConfig.direction === 'asc' ? 'desc' : 'asc'
        }); });
    };
    // Toggle group expansion
    var toggleGroup = function (groupName) {
        setExpandedGroups(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[groupName] = !prev[groupName], _a)));
        });
    };
    // Sort header component
    var SortHeader = function (_a) {
        var field = _a.field, children = _a.children, dataTestId = _a["data-testid"];
        return (<th onClick={function () { return handleSort(field); }} className="cursor-pointer hover:bg-gray-100 px-4 py-2 text-left" data-testid={dataTestId}>
      {children}
      {sortConfig.field === field && (<span className="ml-1">
          {sortConfig.direction === 'asc' ? '↑' : '↓'}
        </span>)}
    </th>);
    };
    return (<div className="space-y-4">
      <div className="flex items-center space-x-4">
        <input type="text" placeholder="Search trades..." value={filter} onChange={function (e) { return setFilter(e.target.value); }} className="px-4 py-2 border rounded"/>
        <select value={groupBy} onChange={function (e) { return setGroupBy(e.target.value); }} className="px-4 py-2 border rounded">
          <option value="none">No Grouping</option>
          <option value="symbol">Group by Symbol</option>
          <option value="strategy">Group by Strategy</option>
        </select>
        </div>
        
      {/* Position Groups */}
      {Object.entries(groupedTrades).map(function (_a) {
            var groupName = _a[0], positions = _a[1];
            return (<div key={groupName} className="mb-6">
          {groupBy !== 'none' && (<h3 className="text-lg font-semibold mb-2 pb-1 border-b border-gray-200">
              {groupName} ({positions.length})
            </h3>)}
          
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
              {sortTrades(positions).map(function (position) {
                    var _a, _b, _c;
                    var pl = calculatePL(position);
                    return (<tr key={position.id} data-testid={"trade-row-".concat(position.id)}>
                    <td data-testid={"symbol-".concat(position.id)}>{position.symbol}</td>
                    <td data-testid={"type-".concat(position.id)}>{position.putCall}</td>
                    <td data-testid={"strike-".concat(position.id)}>${((_a = position.strike) !== null && _a !== void 0 ? _a : 0).toFixed(2)}</td>
                    <td data-testid={"expiry-".concat(position.id)}>{formatDate(position.expiry)}</td>
                    <td data-testid={"quantity-".concat(position.id)}>{position.quantity}</td>
                    <td data-testid={"proceeds-".concat(position.id)}>${((_b = position.proceeds) !== null && _b !== void 0 ? _b : 0).toFixed(2)}</td>
                    <td data-testid={"debug-".concat(position.id)}> <pre style={{ fontSize: 10, maxWidth: 200, whiteSpace: 'pre-wrap' }}>{JSON.stringify(position, null, 2)}</pre> </td>
                    <td data-testid={"premium-".concat(position.id)}>${((_c = position.premium) !== null && _c !== void 0 ? _c : 0).toFixed(2)}</td>
                    <td data-testid={"openDate-".concat(position.id)}>{formatDate(position.openDate)}</td>
                    <td data-testid={"closeDate-".concat(position.id)}>{position.closeDate ? formatDate(position.closeDate) : '-'}</td>
                      {showPL && (<td data-testid={"trade-pl-".concat(position.id)} className={"py-2 px-4 font-medium ".concat(pl > 0 ? 'text-green-600' :
                                pl < 0 ? 'text-red-600' : 'text-gray-600')}>
                          ${(pl !== null && pl !== void 0 ? pl : 0).toFixed(2)}
                        </td>)}
                    </tr>);
                })}
              </tbody>
            </table>
          </div>);
        })}
    </div>);
};
export default TradeTable;
