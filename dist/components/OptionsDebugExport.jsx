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
import React, { useState } from 'react';
import { OptionStrategy } from '../types/options';
import { calculateTradePL, calculateCumulativePL, generateMockClosingData, reconcileWithBrokerStatement, createPositionsFromTrades, updateTradeStatus } from '../utils/tradeUtils';
import { formatCurrency } from '../utils/formatters';
import { Card } from 'antd';
/**
 * Calculate accurate statistics based on IBKR statement data
 */
function calculateAccurateStats(trades) {
    // Calculate total P&L using cumulativePL
    var _a = calculateCumulativePL(trades), tradesWithPL = _a.trades, cumulativePL = _a.cumulativePL;
    // Calculate win rate
    var closedTrades = trades.filter(function (t) { return t.closeDate; });
    var winningTrades = closedTrades.filter(function (t) {
        var _a;
        var pnl = (_a = t.tradePL) !== null && _a !== void 0 ? _a : calculateTradePL(t);
        return pnl > 0;
    });
    var winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
    // Calculate average days held
    var totalDaysHeld = closedTrades.reduce(function (sum, t) {
        var openDate = new Date(t.openDate);
        var closeDate = new Date(t.closeDate);
        var daysHeld = Math.ceil((closeDate.getTime() - openDate.getTime()) / (1000 * 60 * 60 * 24));
        return sum + daysHeld;
    }, 0);
    var averageDaysHeld = closedTrades.length > 0 ? totalDaysHeld / closedTrades.length : 0;
    console.log("P&L Calculation:\n  - Total P&L: ".concat(cumulativePL, "\n  - Win Rate: ").concat(winRate, "%\n  - Average Days Held: ").concat(averageDaysHeld));
    return {
        totalPL: cumulativePL,
        winRate: winRate,
        totalTrades: trades.length,
        openTradesCount: trades.filter(function (t) { return !t.closeDate; }).length,
        closedTradesCount: closedTrades.length,
        averageDaysHeld: averageDaysHeld
    };
}
/**
 * Component for exporting debug data for options trades
 */
var OptionsDebugExport = function (_a) {
    var trades = _a.trades, _b = _a.debugLogs, debugLogs = _b === void 0 ? [] : _b;
    var _c = useState('json'), exportFormat = _c[0], setExportFormat = _c[1];
    var _d = useState(false), includeMockClosings = _d[0], setIncludeMockClosings = _d[1];
    var _e = useState(false), showPositions = _e[0], setShowPositions = _e[1];
    var _f = useState(false), updateStatus = _f[0], setUpdateStatus = _f[1];
    // Statement reconciliation state
    var _g = useState(false), showReconciliation = _g[0], setShowReconciliation = _g[1];
    var _h = useState({
        realizedTotal: 0,
        markToMarketTotal: 0,
        totalFees: 0
    }), statementData = _h[0], setStatementData = _h[1];
    // Period filtering state
    var _j = useState(false), filterByPeriod = _j[0], setFilterByPeriod = _j[1];
    var _k = useState(''), periodStart = _k[0], setPeriodStart = _k[1];
    var _l = useState(''), periodEnd = _l[0], setPeriodEnd = _l[1];
    /**
     * Determine the correct strategy based on quantity and option type
     */
    var getStrategy = function (trade) {
        if (trade.quantity > 0) {
            return trade.putCall === 'CALL'
                ? OptionStrategy.LONG_CALL
                : OptionStrategy.LONG_PUT;
        }
        else {
            return trade.putCall === 'CALL'
                ? OptionStrategy.SHORT_CALL
                : OptionStrategy.SHORT_PUT;
        }
    };
    /**
     * Handle exporting trades data
     */
    var handleExport = function () {
        // Create a copy of trades to process
        var processedTrades = __spreadArray([], trades, true).map(function (trade) { return (__assign(__assign({}, trade), { 
            // Ensure strategy is set correctly based on quantity and option type
            strategy: getStrategy(trade), 
            // Keep original closeDate and status
            closeDate: trade.closeDate, status: trade.closeDate ? "CLOSED" : "OPEN" })); });
        // Filter by period if enabled
        if (filterByPeriod && periodStart && periodEnd) {
            var startDate_1 = new Date(periodStart);
            var endDate_1 = new Date(periodEnd);
            processedTrades = processedTrades.filter(function (trade) {
                var openDate = new Date(trade.openDate);
                return openDate >= startDate_1 && openDate <= endDate_1;
            });
        }
        // Optionally add mock closing data for testing
        if (includeMockClosings) {
            processedTrades = generateMockClosingData(processedTrades);
        }
        // Update trade status (closed/open) based on activity data
        if (updateStatus) {
            processedTrades = updateTradeStatus(processedTrades);
        }
        // Calculate P&L for each trade
        var tradesWithPL = calculateCumulativePL(processedTrades).trades;
        // Consolidate trades into positions if requested
        var exportData = showPositions
            ? createPositionsFromTrades(tradesWithPL)
            : tradesWithPL;
        // Apply broker reconciliation if enabled
        var finalData = exportData;
        if (showReconciliation &&
            (statementData.realizedTotal > 0 || statementData.markToMarketTotal > 0)) {
            finalData = reconcileWithBrokerStatement(exportData, statementData);
        }
        // Calculate stats using the accurate method
        var stats = calculateAccurateStats(finalData);
        // Generate export content
        var content;
        var filename;
        var mime;
        if (exportFormat === 'json') {
            var exportData_1 = {
                exportInfo: {
                    timestamp: new Date().toISOString(),
                    totalTrades: finalData.length,
                    filteredByPeriod: filterByPeriod ? [periodStart, periodEnd] : null,
                    reconciledWithStatement: showReconciliation,
                    mockClosingDataAdded: includeMockClosings,
                    consolidatedPositions: showPositions,
                    statusUpdated: updateStatus
                },
                trades: finalData,
                stats: stats
            };
            if (showReconciliation) {
                exportData_1.reconciliation = {
                    brokerRealized: statementData.realizedTotal,
                    brokerMarkToMarket: statementData.markToMarketTotal,
                    brokerFees: statementData.totalFees,
                    calculatedRealizedPL: stats.totalPL,
                    calculatedOpenPL: 0,
                    realizedDiscrepancy: statementData.realizedTotal - stats.totalPL,
                    openDiscrepancy: 0
                };
            }
            content = JSON.stringify(exportData_1, null, 2);
            filename = 'options-trades-export.json';
            mime = 'application/json';
        }
        else {
            // Generate CSV headers
            var headers = [
                'id', 'symbol', 'putCall', 'strike', 'expiry',
                'quantity', 'premium', 'openDate', 'closeDate',
                'closePremium', 'strategy', 'commission', 'notes',
                'realizedPL', 'unrealizedPL', 'calculatedPL',
                'brokerReportedPL', 'brokerAdjustedPL'
            ].join(',');
            // Generate CSV rows
            var rows = finalData.map(function (trade) { return [
                trade.id,
                trade.symbol,
                trade.putCall,
                trade.strike,
                trade.expiry instanceof Date ? trade.expiry.toISOString() : trade.expiry,
                trade.quantity,
                trade.premium,
                trade.openDate instanceof Date ? trade.openDate.toISOString() : trade.openDate,
                trade.closeDate ? (trade.closeDate instanceof Date ? trade.closeDate.toISOString() : trade.closeDate) : '',
                trade.closePremium || '',
                trade.strategy,
                trade.commission,
                trade.notes || '',
                trade.realizedPL || '',
                trade.unrealizedPL || '',
                trade.calculatedPL,
                trade.brokerReportedPL || '',
                trade.brokerAdjustedPL || ''
            ].join(','); });
            // Add stats rows
            rows.push(''); // Empty row
            rows.push('Statistics');
            rows.push("Total P&L,".concat(stats.totalPL));
            rows.push("Win Rate,".concat(stats.winRate.toFixed(2), "%"));
            rows.push("Total Trades,".concat(stats.totalTrades));
            rows.push("Open Trades,".concat(stats.openTradesCount));
            rows.push("Closed Trades,".concat(stats.closedTradesCount));
            rows.push("Average Days Held,".concat(stats.averageDaysHeld.toFixed(1)));
            if (showReconciliation) {
                rows.push(''); // Empty row
                rows.push('Broker Reconciliation');
                rows.push("Broker Realized P&L,".concat(statementData.realizedTotal));
                rows.push("Broker Mark-to-Market P&L,".concat(statementData.markToMarketTotal));
                rows.push("Broker Fees,".concat(statementData.totalFees));
                rows.push("Realized Discrepancy,".concat(statementData.realizedTotal - stats.totalPL));
                rows.push("Open Discrepancy,".concat(statementData.markToMarketTotal - stats.totalPL));
            }
            if (filterByPeriod) {
                rows.push(''); // Empty row
                rows.push('Period Filter');
                rows.push("Start Date,".concat(periodStart));
                rows.push("End Date,".concat(periodEnd));
            }
            content = __spreadArray([headers], rows, true).join('\n');
            filename = 'options-debug.csv';
            mime = 'text/csv';
        }
        // Create download link
        var blob = new Blob([content], { type: mime });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    // Calculate summary stats to display using the accurate method
    var stats = calculateAccurateStats(trades);
    return (<div className="space-y-4">
      <Card title="Debug Export" className="mb-4">
        <div className="space-y-4">
          {/* Debug Summary */}
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="text-lg font-semibold mb-2">Summary</h3>
            <div data-testid="debug-total-pl" className="text-sm">
              Total P&L: {formatCurrency(stats.totalPL)}
            </div>
            <div className="text-sm">
              Win Rate: {stats.winRate.toFixed(1)}%
            </div>
            <div className="text-sm">
              Trades: {stats.openTradesCount} open / {stats.closedTradesCount} closed
            </div>
          </div>
          
          {/* Export Controls */}
          <div className="space-y-2">
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="radio" name="exportFormat" id="formatJson" value="json" checked={exportFormat === 'json'} onChange={function () { return setExportFormat('json'); }}/>
              <label className="form-check-label" htmlFor="formatJson">
                JSON
              </label>
            </div>
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="radio" name="exportFormat" id="formatCsv" value="csv" checked={exportFormat === 'csv'} onChange={function () { return setExportFormat('csv'); }}/>
              <label className="form-check-label" htmlFor="formatCsv">
                CSV
              </label>
            </div>
            
            <hr className="my-2"/>
            
            <div className="mt-2">
              <div className="form-check mb-2">
                <input className="form-check-input" type="checkbox" id="includeMockClosings" checked={includeMockClosings} onChange={function () { return setIncludeMockClosings(!includeMockClosings); }}/>
                <label className="form-check-label" htmlFor="includeMockClosings">
                  Add mock closing data (testing)
                </label>
              </div>
              
              <div className="form-check mb-2">
                <input className="form-check-input" type="checkbox" id="updateStatus" checked={updateStatus} onChange={function () { return setUpdateStatus(!updateStatus); }}/>
                <label className="form-check-label" htmlFor="updateStatus">
                  Update trade status (open/closed)
                </label>
              </div>
              
              <div className="form-check mb-2">
                <input className="form-check-input" type="checkbox" id="showPositions" checked={showPositions} onChange={function () { return setShowPositions(!showPositions); }}/>
                <label className="form-check-label" htmlFor="showPositions">
                  Consolidate into positions
                </label>
              </div>
            </div>
            
            {/* Period filtering section */}
            <div className="mt-2">
              <div className="form-check mb-2">
                <input className="form-check-input" type="checkbox" id="filterByPeriod" checked={filterByPeriod} onChange={function () { return setFilterByPeriod(!filterByPeriod); }}/>
                <label className="form-check-label" htmlFor="filterByPeriod">
                  Filter by statement period
                </label>
              </div>
              
              {filterByPeriod && (<div className="row g-2 mb-2">
                  <div className="col-auto">
                    <label htmlFor="periodStart" className="form-label">Start date:</label>
                    <input type="date" id="periodStart" className="form-control form-control-sm" value={periodStart} onChange={function (e) { return setPeriodStart(e.target.value); }}/>
                  </div>
                  <div className="col-auto">
                    <label htmlFor="periodEnd" className="form-label">End date:</label>
                    <input type="date" id="periodEnd" className="form-control form-control-sm" value={periodEnd} onChange={function (e) { return setPeriodEnd(e.target.value); }}/>
                  </div>
                </div>)}
            </div>
            
            {/* Statement reconciliation section */}
            <div className="mt-2">
              <div className="form-check mb-2">
                <input className="form-check-input" type="checkbox" id="showReconciliation" checked={showReconciliation} onChange={function () { return setShowReconciliation(!showReconciliation); }}/>
                <label className="form-check-label" htmlFor="showReconciliation">
                  Reconcile with broker statement
                </label>
              </div>
              
              {showReconciliation && (<div className="row g-2 mb-2">
                  <div className="col-auto">
                    <label htmlFor="realizedTotal" className="form-label">Realized Total:</label>
                    <input type="number" id="realizedTotal" className="form-control form-control-sm" step="0.01" value={statementData.realizedTotal} onChange={function (e) { return setStatementData(__assign(__assign({}, statementData), { realizedTotal: parseFloat(e.target.value) || 0 })); }}/>
                  </div>
                  <div className="col-auto">
                    <label htmlFor="markToMarketTotal" className="form-label">Mark-to-Market:</label>
                    <input type="number" id="markToMarketTotal" className="form-control form-control-sm" step="0.01" value={statementData.markToMarketTotal} onChange={function (e) { return setStatementData(__assign(__assign({}, statementData), { markToMarketTotal: parseFloat(e.target.value) || 0 })); }}/>
                  </div>
                  <div className="col-auto">
                    <label htmlFor="totalFees" className="form-label">Total Fees:</label>
                    <input type="number" id="totalFees" className="form-control form-control-sm" step="0.01" value={statementData.totalFees} onChange={function (e) { return setStatementData(__assign(__assign({}, statementData), { totalFees: parseFloat(e.target.value) || 0 })); }}/>
                  </div>
                </div>)}
            </div>

            <button className="btn btn-primary btn-sm mt-3" onClick={handleExport}>
              Export Debug Data
            </button>
          </div>
        </div>
      </Card>
      
      {/* Debug Logs */}
      {debugLogs.length > 0 && (<Card title="Debug Logs" className="mb-4">
          <pre className="text-xs overflow-auto max-h-96">
            {debugLogs.join('\n')}
          </pre>
        </Card>)}
    </div>);
};
export default OptionsDebugExport;
