import React, { useState } from 'react';
import { OptionTrade, OptionStrategy } from '../types/options';
import { 
  calculateTradePL,
  calculateCumulativePL,
  generateMockClosingData,
  reconcileWithBrokerStatement,
  createPositionsFromTrades,
  updateTradeStatus
} from '../utils/tradeUtils';
import { formatCurrency } from '../utils/formatters';
import { Card } from 'antd';

interface OptionsDebugExportProps {
  trades: OptionTrade[];
  debugLogs?: string[];
}

/**
 * Calculate accurate statistics based on IBKR statement data
 */
function calculateAccurateStats(trades: OptionTrade[]) {
  // Calculate total P&L using cumulativePL
  const { trades: tradesWithPL, cumulativePL } = calculateCumulativePL(trades);
  
  // Calculate win rate
  const closedTrades = trades.filter(t => t.closeDate);
  const winningTrades = closedTrades.filter(t => {
    const pnl = t.tradePL ?? calculateTradePL(t);
    return pnl > 0;
  });
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
  
  // Calculate average days held
  const totalDaysHeld = closedTrades.reduce((sum, t) => {
    const openDate = new Date(t.openDate);
    const closeDate = new Date(t.closeDate!);
    const daysHeld = Math.ceil((closeDate.getTime() - openDate.getTime()) / (1000 * 60 * 60 * 24));
    return sum + daysHeld;
  }, 0);
  const averageDaysHeld = closedTrades.length > 0 ? totalDaysHeld / closedTrades.length : 0;
  
  console.log(`P&L Calculation:
  - Total P&L: ${cumulativePL}
  - Win Rate: ${winRate}%
  - Average Days Held: ${averageDaysHeld}`);
  
  return {
    totalPL: cumulativePL,
    winRate: winRate,
    totalTrades: trades.length,
    openTradesCount: trades.filter(t => !t.closeDate).length,
    closedTradesCount: closedTrades.length,
    averageDaysHeld: averageDaysHeld
  };
}

/**
 * Component for exporting debug data for options trades
 */
const OptionsDebugExport: React.FC<OptionsDebugExportProps> = ({ trades, debugLogs = [] }) => {
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [includeMockClosings, setIncludeMockClosings] = useState(false);
  const [showPositions, setShowPositions] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(false);
  
  // Statement reconciliation state
  const [showReconciliation, setShowReconciliation] = useState(false);
  const [statementData, setStatementData] = useState({
    realizedTotal: 0,
    markToMarketTotal: 0,
    totalFees: 0
  });
  
  // Period filtering state
  const [filterByPeriod, setFilterByPeriod] = useState(false);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  /**
   * Determine the correct strategy based on quantity and option type
   */
  const getStrategy = (trade: OptionTrade): OptionStrategy => {
    if (trade.quantity > 0) {
      return trade.putCall === 'CALL' 
        ? OptionStrategy.LONG_CALL 
        : OptionStrategy.LONG_PUT;
    } else {
      return trade.putCall === 'CALL'
        ? OptionStrategy.SHORT_CALL
        : OptionStrategy.SHORT_PUT;
    }
  };

  /**
   * Handle exporting trades data
   */
  const handleExport = () => {
    // Create a copy of trades to process
    let processedTrades = [...trades].map(trade => ({
      ...trade,
      // Ensure strategy is set correctly based on quantity and option type
      strategy: getStrategy(trade),
      // Keep original closeDate and status
      closeDate: trade.closeDate,
      status: trade.closeDate ? "CLOSED" : "OPEN"
    }));
    
    // Filter by period if enabled
    if (filterByPeriod && periodStart && periodEnd) {
      const startDate = new Date(periodStart);
      const endDate = new Date(periodEnd);
      
      processedTrades = processedTrades.filter(trade => {
        const openDate = new Date(trade.openDate);
        return openDate >= startDate && openDate <= endDate;
      });
    }
    
    // Optionally add mock closing data for testing
    if (includeMockClosings) {
      processedTrades = generateMockClosingData(processedTrades) as typeof processedTrades;
    }

    // Update trade status (closed/open) based on activity data
    if (updateStatus) {
      processedTrades = updateTradeStatus(processedTrades) as typeof processedTrades;
    }
    
    // Calculate P&L for each trade
    const { trades: tradesWithPL } = calculateCumulativePL(processedTrades);
    
    // Consolidate trades into positions if requested
    const exportData = showPositions 
      ? createPositionsFromTrades(tradesWithPL)
      : tradesWithPL;
    
    // Apply broker reconciliation if enabled
    let finalData = exportData;
    if (showReconciliation && 
        (statementData.realizedTotal > 0 || statementData.markToMarketTotal > 0)) {
      finalData = reconcileWithBrokerStatement(exportData, statementData);
    }
    
    // Calculate stats using the accurate method
    const stats = calculateAccurateStats(finalData);
    
    // Generate export content
    let content: string;
    let filename: string;
    let mime: string;

    if (exportFormat === 'json') {
      // Define the full data structure with proper types
      interface ExportData {
        exportInfo: {
          timestamp: string;
          totalTrades: number;
          filteredByPeriod: string[] | null;
          reconciledWithStatement: boolean;
          mockClosingDataAdded: boolean;
          consolidatedPositions: boolean;
          statusUpdated: boolean;
        };
        trades: OptionTrade[];
        stats: {
          totalPL: number;
          winRate: number;
          totalTrades: number;
          openTradesCount: number;
          closedTradesCount: number;
          averageDaysHeld: number;
        };
        reconciliation?: {
          brokerRealized: number;
          brokerMarkToMarket: number;
          brokerFees: number;
          calculatedRealizedPL: number;
          calculatedOpenPL: number;
          realizedDiscrepancy: number;
          openDiscrepancy: number;
        };
      }

      const exportData: ExportData = {
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
        exportData.reconciliation = {
          brokerRealized: statementData.realizedTotal,
          brokerMarkToMarket: statementData.markToMarketTotal,
          brokerFees: statementData.totalFees,
          calculatedRealizedPL: stats.totalPL,
          calculatedOpenPL: 0,
          realizedDiscrepancy: statementData.realizedTotal - stats.totalPL,
          openDiscrepancy: 0
        };
      }

      content = JSON.stringify(exportData, null, 2);
      filename = 'options-trades-export.json';
      mime = 'application/json';
    } else {
      // Generate CSV headers
      const headers = [
        'id', 'symbol', 'putCall', 'strike', 'expiry', 
        'quantity', 'premium', 'openDate', 'closeDate', 
        'closePremium', 'strategy', 'commission', 'notes',
        'realizedPL', 'unrealizedPL', 'calculatedPL',
        'brokerReportedPL', 'brokerAdjustedPL'
      ].join(',');
      
      // Generate CSV rows
      const rows = finalData.map(trade => [
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
      ].join(','));
      
      // Add stats rows
      rows.push(''); // Empty row
      rows.push('Statistics');
      rows.push(`Total P&L,${stats.totalPL}`);
      rows.push(`Win Rate,${stats.winRate.toFixed(2)}%`);
      rows.push(`Total Trades,${stats.totalTrades}`);
      rows.push(`Open Trades,${stats.openTradesCount}`);
      rows.push(`Closed Trades,${stats.closedTradesCount}`);
      rows.push(`Average Days Held,${stats.averageDaysHeld.toFixed(1)}`);
      
      if (showReconciliation) {
        rows.push(''); // Empty row
        rows.push('Broker Reconciliation');
        rows.push(`Broker Realized P&L,${statementData.realizedTotal}`);
        rows.push(`Broker Mark-to-Market P&L,${statementData.markToMarketTotal}`);
        rows.push(`Broker Fees,${statementData.totalFees}`);
        rows.push(`Realized Discrepancy,${statementData.realizedTotal - stats.totalPL}`);
        rows.push(`Open Discrepancy,${statementData.markToMarketTotal - stats.totalPL}`);
      }
      
      if (filterByPeriod) {
        rows.push(''); // Empty row
        rows.push('Period Filter');
        rows.push(`Start Date,${periodStart}`);
        rows.push(`End Date,${periodEnd}`);
      }
      
      content = [headers, ...rows].join('\n');
      filename = 'options-debug.csv';
      mime = 'text/csv';
    }
    
    // Create download link
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Calculate summary stats to display using the accurate method
  const stats = calculateAccurateStats(trades);

  return (
    <div className="space-y-4">
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
              <input
                className="form-check-input"
                type="radio"
                name="exportFormat"
                id="formatJson"
                value="json"
                checked={exportFormat === 'json'}
                onChange={() => setExportFormat('json')}
              />
              <label className="form-check-label" htmlFor="formatJson">
                JSON
              </label>
            </div>
            <div className="form-check form-check-inline">
              <input
                className="form-check-input"
                type="radio"
                name="exportFormat"
                id="formatCsv"
                value="csv"
                checked={exportFormat === 'csv'}
                onChange={() => setExportFormat('csv')}
              />
              <label className="form-check-label" htmlFor="formatCsv">
                CSV
              </label>
            </div>
            
            <hr className="my-2" />
            
            <div className="mt-2">
              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="includeMockClosings"
                  checked={includeMockClosings}
                  onChange={() => setIncludeMockClosings(!includeMockClosings)}
                />
                <label className="form-check-label" htmlFor="includeMockClosings">
                  Add mock closing data (testing)
                </label>
              </div>
              
              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="updateStatus"
                  checked={updateStatus}
                  onChange={() => setUpdateStatus(!updateStatus)}
                />
                <label className="form-check-label" htmlFor="updateStatus">
                  Update trade status (open/closed)
                </label>
              </div>
              
              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="showPositions"
                  checked={showPositions}
                  onChange={() => setShowPositions(!showPositions)}
                />
                <label className="form-check-label" htmlFor="showPositions">
                  Consolidate into positions
                </label>
              </div>
            </div>
            
            {/* Period filtering section */}
            <div className="mt-2">
              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="filterByPeriod"
                  checked={filterByPeriod}
                  onChange={() => setFilterByPeriod(!filterByPeriod)}
                />
                <label className="form-check-label" htmlFor="filterByPeriod">
                  Filter by statement period
                </label>
              </div>
              
              {filterByPeriod && (
                <div className="row g-2 mb-2">
                  <div className="col-auto">
                    <label htmlFor="periodStart" className="form-label">Start date:</label>
                    <input
                      type="date"
                      id="periodStart"
                      className="form-control form-control-sm"
                      value={periodStart}
                      onChange={(e) => setPeriodStart(e.target.value)}
                    />
                  </div>
                  <div className="col-auto">
                    <label htmlFor="periodEnd" className="form-label">End date:</label>
                    <input
                      type="date"
                      id="periodEnd"
                      className="form-control form-control-sm"
                      value={periodEnd}
                      onChange={(e) => setPeriodEnd(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Statement reconciliation section */}
            <div className="mt-2">
              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="showReconciliation"
                  checked={showReconciliation}
                  onChange={() => setShowReconciliation(!showReconciliation)}
                />
                <label className="form-check-label" htmlFor="showReconciliation">
                  Reconcile with broker statement
                </label>
              </div>
              
              {showReconciliation && (
                <div className="row g-2 mb-2">
                  <div className="col-auto">
                    <label htmlFor="realizedTotal" className="form-label">Realized Total:</label>
                    <input
                      type="number"
                      id="realizedTotal"
                      className="form-control form-control-sm"
                      step="0.01"
                      value={statementData.realizedTotal}
                      onChange={(e) => setStatementData({
                        ...statementData,
                        realizedTotal: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                  <div className="col-auto">
                    <label htmlFor="markToMarketTotal" className="form-label">Mark-to-Market:</label>
                    <input
                      type="number"
                      id="markToMarketTotal"
                      className="form-control form-control-sm"
                      step="0.01"
                      value={statementData.markToMarketTotal}
                      onChange={(e) => setStatementData({
                        ...statementData,
                        markToMarketTotal: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                  <div className="col-auto">
                    <label htmlFor="totalFees" className="form-label">Total Fees:</label>
                    <input
                      type="number"
                      id="totalFees"
                      className="form-control form-control-sm"
                      step="0.01"
                      value={statementData.totalFees}
                      onChange={(e) => setStatementData({
                        ...statementData,
                        totalFees: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                </div>
              )}
            </div>

            <button 
              className="btn btn-primary btn-sm mt-3"
              onClick={handleExport}
            >
              Export Debug Data
            </button>
          </div>
        </div>
      </Card>
      
      {/* Debug Logs */}
      {debugLogs.length > 0 && (
        <Card title="Debug Logs" className="mb-4">
          <pre className="text-xs overflow-auto max-h-96">
            {debugLogs.join('\n')}
          </pre>
        </Card>
      )}
    </div>
  );
};

export default OptionsDebugExport; 