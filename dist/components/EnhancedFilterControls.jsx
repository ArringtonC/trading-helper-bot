var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import React, { useState, useEffect } from 'react';
import { format, subDays, startOfYear, subYears } from 'date-fns';
import { formatDateForDisplay, safeParseDate } from '../utils/dateUtils';
var EnhancedFilterControls = function (_a) {
    var trades = _a.trades, onFilterChange = _a.onFilterChange, _b = _a.className, className = _b === void 0 ? '' : _b;
    // Extract unique strategies and expirations
    var _c = useState([]), strategies = _c[0], setStrategies = _c[1];
    var _d = useState([]), expirations = _d[0], setExpirations = _d[1];
    // Filter state
    var _e = useState(null), dateRange = _e[0], setDateRange = _e[1];
    var _f = useState([]), selectedStrategies = _f[0], setSelectedStrategies = _f[1];
    var _g = useState([]), selectedExpirations = _g[0], setSelectedExpirations = _g[1];
    var _h = useState('strategy'), groupBy = _h[0], setGroupBy = _h[1];
    var _j = useState(null), activeDatePreset = _j[0], setActiveDatePreset = _j[1];
    // Extract unique values from trades
    useEffect(function () {
        if (!trades || trades.length === 0)
            return;
        // Get unique strategies
        var uniqueStrategies = Array.from(new Set(trades.map(function (trade) { return trade.strategy || 'Unknown'; }))).sort();
        setStrategies(uniqueStrategies);
        // Get unique expiration months
        var uniqueExpirations = Array.from(new Set(trades.map(function (trade) {
            return formatDateForDisplay(safeParseDate(trade.expiry), 'MMM yyyy');
        }))).sort();
        setExpirations(uniqueExpirations);
    }, [trades]);
    // Apply filters when they change
    useEffect(function () {
        onFilterChange({
            dateRange: dateRange,
            strategies: selectedStrategies,
            expirations: selectedExpirations,
            groupBy: groupBy
        });
    }, [dateRange, selectedStrategies, selectedExpirations, groupBy, onFilterChange]);
    // Date preset handler
    var handleDatePreset = function (preset) {
        var today = new Date();
        var start;
        var end = today;
        switch (preset) {
            case '7D':
                start = subDays(today, 7);
                break;
            case '30D':
                start = subDays(today, 30);
                break;
            case '90D':
                start = subDays(today, 90);
                break;
            case 'YTD':
                start = startOfYear(today);
                break;
            case '1Y':
                start = subYears(today, 1);
                break;
            case 'ALL':
                setDateRange(null);
                setActiveDatePreset(preset);
                return;
            default:
                return;
        }
        setDateRange([start, end]);
        setActiveDatePreset(preset);
    };
    // Handle custom date selection
    var handleDateChange = function (event, isStartDate) {
        var newDate = new Date(event.target.value);
        if (isStartDate && dateRange) {
            setDateRange([newDate, dateRange[1]]);
        }
        else if (!isStartDate && dateRange) {
            setDateRange([dateRange[0], newDate]);
        }
        else {
            var today = new Date();
            setDateRange(isStartDate ? [newDate, today] : [today, newDate]);
        }
        setActiveDatePreset(null);
    };
    // Toggle strategy selection
    var toggleStrategy = function (strategy) {
        setSelectedStrategies(function (prev) {
            return prev.includes(strategy)
                ? prev.filter(function (s) { return s !== strategy; })
                : __spreadArray(__spreadArray([], prev, true), [strategy], false);
        });
    };
    // Toggle expiration selection
    var toggleExpiration = function (expiration) {
        setSelectedExpirations(function (prev) {
            return prev.includes(expiration)
                ? prev.filter(function (e) { return e !== expiration; })
                : __spreadArray(__spreadArray([], prev, true), [expiration], false);
        });
    };
    // Clear all filters
    var clearFilters = function () {
        setDateRange(null);
        setSelectedStrategies([]);
        setSelectedExpirations([]);
        setActiveDatePreset(null);
    };
    return (<div className={"bg-white rounded-lg shadow p-4 ".concat(className)}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4">
        <h3 className="text-lg font-semibold mb-2 lg:mb-0">Filters & Grouping</h3>
        <div className="flex items-center space-x-2">
          <button className={"px-3 py-1 rounded text-sm font-medium ".concat(groupBy === 'strategy'
            ? 'bg-blue-100 text-blue-800 border border-blue-300'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700')} onClick={function () { return setGroupBy('strategy'); }}>
            By Strategy
          </button>
          <button className={"px-3 py-1 rounded text-sm font-medium ".concat(groupBy === 'expiration'
            ? 'bg-blue-100 text-blue-800 border border-blue-300'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700')} onClick={function () { return setGroupBy('expiration'); }}>
            By Expiration
          </button>
          <button className={"px-3 py-1 rounded text-sm font-medium ".concat(groupBy === 'none'
            ? 'bg-blue-100 text-blue-800 border border-blue-300'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700')} onClick={function () { return setGroupBy('none'); }}>
            All Trades
          </button>
        </div>
      </div>

      {/* Date Range Selection */}
      <div className="mb-4">
        <h4 className="font-medium mb-2 text-sm text-gray-600">Time Period</h4>
        <div className="flex flex-wrap gap-2 mb-3">
          {['7D', '30D', '90D', 'YTD', '1Y', 'ALL'].map(function (preset) { return (<button key={preset} className={"px-3 py-1 rounded text-xs font-medium ".concat(activeDatePreset === preset
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700')} onClick={function () { return handleDatePreset(preset); }}>
              {preset}
            </button>); })}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm mb-1 text-gray-600">Start Date</label>
            <input type="date" className="w-full px-2 py-1 border border-gray-300 rounded text-sm" value={dateRange ? format(dateRange[0], 'yyyy-MM-dd') : ''} onChange={function (e) { return handleDateChange(e, true); }}/>
          </div>
          <div className="flex-1">
            <label className="block text-sm mb-1 text-gray-600">End Date</label>
            <input type="date" className="w-full px-2 py-1 border border-gray-300 rounded text-sm" value={dateRange ? format(dateRange[1], 'yyyy-MM-dd') : ''} onChange={function (e) { return handleDateChange(e, false); }}/>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strategy Selection */}
        <div>
          <h4 className="font-medium mb-2 text-sm text-gray-600">Strategies</h4>
          <div className="max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
            {strategies.length > 0 ? (<div className="space-y-1">
                {strategies.map(function (strategy) { return (<div key={strategy} className="flex items-center">
                    <input type="checkbox" id={"strategy-".concat(strategy)} checked={selectedStrategies.includes(strategy)} onChange={function () { return toggleStrategy(strategy); }} className="mr-2"/>
                    <label htmlFor={"strategy-".concat(strategy)} className="text-sm">
                      {strategy}
                    </label>
                  </div>); })}
              </div>) : (<p className="text-sm text-gray-500 p-2">No strategies available</p>)}
          </div>
        </div>

        {/* Expiration Selection */}
        <div>
          <h4 className="font-medium mb-2 text-sm text-gray-600">Expirations</h4>
          <div className="max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
            {expirations.length > 0 ? (<div className="space-y-1">
                {expirations.map(function (expiration) { return (<div key={expiration} className="flex items-center">
                    <input type="checkbox" id={"expiration-".concat(expiration)} checked={selectedExpirations.includes(expiration)} onChange={function () { return toggleExpiration(expiration); }} className="mr-2"/>
                    <label htmlFor={"expiration-".concat(expiration)} className="text-sm">
                      {expiration}
                    </label>
                  </div>); })}
              </div>) : (<p className="text-sm text-gray-500 p-2">No expirations available</p>)}
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(selectedStrategies.length > 0 || selectedExpirations.length > 0 || dateRange) && (<div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium text-sm text-gray-600">Active Filters:</h4>
            <button onClick={clearFilters} className="text-xs text-blue-600 hover:text-blue-800">
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {dateRange && (<span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                {format(dateRange[0], 'MMM d, yyyy')} - {format(dateRange[1], 'MMM d, yyyy')}
              </span>)}
            
            {selectedStrategies.map(function (strategy) { return (<span key={strategy} className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs flex items-center">
                {strategy}
                <button className="ml-1 text-green-500 hover:text-green-700" onClick={function () { return toggleStrategy(strategy); }}>
                  ×
                </button>
              </span>); })}
            
            {selectedExpirations.map(function (expiration) { return (<span key={expiration} className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs flex items-center">
                {expiration}
                <button className="ml-1 text-purple-500 hover:text-purple-700" onClick={function () { return toggleExpiration(expiration); }}>
                  ×
                </button>
              </span>); })}
          </div>
        </div>)}
    </div>);
};
export default EnhancedFilterControls;
