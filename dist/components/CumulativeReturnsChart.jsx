var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { calculateTradePL } from '../utils/tradeUtils';
import { safeParseDate, formatDateForDisplay } from '../utils/dateUtils';
// Color palette for different strategies/expirations
var COLORS = [
    '#2563EB', '#7C3AED', '#DB2777', '#EC4899', '#8B5CF6',
    '#6366F1', '#10B981', '#059669', '#0EA5E9', '#6D28D9'
];
var CumulativeReturnsChart = function (_a) {
    var trades = _a.trades, _b = _a.groupBy, groupBy = _b === void 0 ? 'strategy' : _b, _c = _a.dateRange, dateRange = _c === void 0 ? null : _c, _d = _a.height, height = _d === void 0 ? 400 : _d;
    // Calculate cumulative returns and format data for chart
    var chartData = useMemo(function () {
        // Filter trades by date range if provided
        var filteredTrades = __spreadArray([], trades, true);
        if (dateRange) {
            var startDate_1 = dateRange[0], endDate_1 = dateRange[1];
            filteredTrades = filteredTrades.filter(function (trade) {
                var tradeDate = safeParseDate(trade.closeDate || trade.openDate);
                if (!tradeDate)
                    return false;
                return tradeDate >= startDate_1 && tradeDate <= endDate_1;
            });
        }
        // Sort trades by date
        filteredTrades.sort(function (a, b) {
            var dateA = safeParseDate(a.closeDate || a.openDate);
            var dateB = safeParseDate(b.closeDate || b.openDate);
            if (!dateA || !dateB)
                return 0;
            return dateA.getTime() - dateB.getTime();
        });
        // Group trades by date and strategy/expiration
        var tradesByDate = {};
        // Initialize cumulative totals by group
        var cumulativeTotals = {};
        // Process each trade
        filteredTrades.forEach(function (trade) {
            var tradeDate = safeParseDate(trade.closeDate || trade.openDate);
            if (!tradeDate)
                return;
            var formattedDate = formatDateForDisplay(tradeDate, 'yyyy-MM-dd');
            // Determine group key based on groupBy parameter
            var groupKey;
            if (groupBy === 'strategy') {
                groupKey = trade.strategy || 'Unknown';
            }
            else if (groupBy === 'expiration') {
                var expiryDate = safeParseDate(trade.expiry);
                if (!expiryDate)
                    return;
                groupKey = formatDateForDisplay(expiryDate, 'MMM yyyy');
            }
            else {
                groupKey = 'All Trades';
            }
            // Calculate P&L for this trade
            var pl = calculateTradePL(trade);
            // Initialize group in cumulative totals if needed
            if (cumulativeTotals[groupKey] === undefined) {
                cumulativeTotals[groupKey] = 0;
            }
            // Add P&L to cumulative total for this group
            cumulativeTotals[groupKey] += pl;
            // Initialize date in tradesByDate if needed
            if (!tradesByDate[formattedDate]) {
                tradesByDate[formattedDate] = {};
            }
            // Store cumulative total for this group on this date
            tradesByDate[formattedDate][groupKey] = cumulativeTotals[groupKey];
        });
        // Convert to array format for Recharts
        var dates = Object.keys(tradesByDate).sort();
        var result = dates.map(function (date) {
            var dateData = { date: date };
            // Fill in values for each group
            Object.keys(cumulativeTotals).forEach(function (group) {
                dateData[group] = tradesByDate[date][group] || 0;
            });
            return dateData;
        });
        return {
            chartData: result,
            groups: Object.keys(cumulativeTotals).map(function (group, index) { return ({
                id: group,
                name: group,
                color: COLORS[index % COLORS.length]
            }); })
        };
    }, [trades, groupBy, dateRange]);
    // Custom tooltip component
    var CustomTooltip = function (_a) {
        var active = _a.active, payload = _a.payload, label = _a.label;
        if (active && payload && payload.length) {
            return (<div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-semibold text-gray-800">{format(parseISO(label), 'MMM d, yyyy')}</p>
          <div className="mt-2">
            {payload.map(function (entry, index) { return (<div key={"tooltip-".concat(index)} className="flex items-center mb-1">
                <div className="w-2 h-2 mr-2 rounded-full" style={{ backgroundColor: entry.color }}/>
                <span className="text-sm mr-2">{entry.name}:</span>
                <span className={"text-sm font-semibold ".concat(Number(entry.value) >= 0 ? 'text-green-600' : 'text-red-600')}>
                  ${Number(entry.value).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}
                </span>
              </div>); })}
          </div>
        </div>);
        }
        return null;
    };
    return (<div>
      <h3 className="text-lg font-semibold mb-4">Cumulative Returns</h3>
      <div style={{ height: height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData.chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB"/>
            <XAxis dataKey="date" tickFormatter={function (date) { return format(parseISO(date), 'MMM d'); }} tick={{ fill: '#6B7280', fontSize: 12 }}/>
            <YAxis tickFormatter={function (value) { return "$".concat(value.toLocaleString()); }} tick={{ fill: '#6B7280', fontSize: 12 }}/>
            <Tooltip content={<CustomTooltip />}/>
            <Legend />
            {chartData.groups.map(function (group) { return (<Line key={group.id} type="monotone" dataKey={group.id} name={group.name} stroke={group.color} activeDot={{ r: 8 }} dot={false} strokeWidth={2}/>); })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>);
};
export default CumulativeReturnsChart;
