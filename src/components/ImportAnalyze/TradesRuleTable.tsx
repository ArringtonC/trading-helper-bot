/**
 * @fileoverview Trades Rule Table Component - Legacy Table Implementation
 * 
 * This component provides a basic HTML table implementation for displaying trades
 * with rule evaluation results. It serves as a simpler alternative to the enhanced
 * table component, offering straightforward tabular display without advanced
 * filtering, sorting, or pagination features.
 * 
 * Key Features:
 * - Basic HTML table with responsive design
 * - Rule violation highlighting with background colors
 * - Financial data formatting with color coding
 * - Trade type indicators (Entry/Exit) with emojis
 * - Compact display optimized for small screens
 * - Direct batch result integration
 * 
 * Differences from EnhancedTradesTable:
 * - No sorting, filtering, or pagination
 * - Simpler implementation with standard HTML table
 * - Fixed column layout without customization
 * - Basic responsive design with horizontal scrolling
 * - Direct prop mapping without data transformation layer
 * 
 * Use Cases:
 * - Simple trade display without advanced features
 * - Mobile-optimized compact view
 * - Quick prototyping and testing
 * - Legacy system compatibility
 * 
 * Integration Points:
 * - Import & Analyze Page: Alternative table display option
 * - Rule Engine: Direct batch result consumption
 * - Mobile Interface: Compact display for smaller screens
 * 
 * @author Trading Helper Bot Team
 * @version 2.1.0
 * @since 2024-Q4
 */

import React from 'react';

/**
 * Individual trade record interface representing a single trading transaction.
 * Identical to EnhancedTradesTable interface for consistency.
 * 
 * @interface Trade
 */
interface Trade {
  /** Unique identifier for the trade (optional, auto-generated if missing) */
  id?: string;
  /** Trading symbol (e.g., 'AAPL', 'SPY') */
  symbol: string;
  /** Number of shares/contracts traded (positive for buy, negative for sell) */
  quantity: number;
  /** Execution price per share/contract */
  tradePrice: number;
  /** Account balance at time of trade (optional) */
  accountBalance?: number;
  /** ISO timestamp of trade execution (optional) */
  dateTime?: string;
  /** Profit/loss for this specific trade (optional) */
  tradePL?: number;
  /** Realized profit/loss from position closure (optional) */
  realizedPL?: number;
  /** Cost basis from CSV import (optional) */
  csvBasis?: number;
  /** Calculated cost basis for position sizing (optional) */
  costBasis?: number;
}

/**
 * Batch evaluation result interface containing rule engine analysis results.
 * Identical to EnhancedTradesTable interface for consistency.
 * 
 * @interface BatchResult
 */
interface BatchResult {
  /** Index position in the original trade array */
  index: number;
  /** Trading symbol for cross-reference */
  symbol: string;
  /** Quantity from the evaluated trade */
  quantity: number;
  /** Realized profit/loss calculated by rule engine */
  realizedPL: number;
  /** Amount of capital used/freed by this trade */
  amountUsed: number;
  /** Calculated cost basis for position sizing rules */
  costBasis: number;
  /** Number of consecutive losses detected */
  consecutiveLosses: number;
  /** Flag indicating consecutive loss pattern detection */
  consecutiveLossFlag: string;
  /** Account balance after trade execution */
  accountBalance: number;
  /** Whether any rule was violated by this trade */
  ruleTriggered: boolean;
  /** Action taken by rule engine (e.g., 'reducePositionSize') */
  actionTaken?: string;
  /** Timestamp of trade evaluation */
  dateTime?: string;
  /** Whether this trade opens a new position */
  isEntry: boolean;
  /** Whether this trade closes an existing position */
  isExit: boolean;
}

/**
 * Props interface for the TradesRuleTable component.
 * Simplified compared to EnhancedTradesTable due to reduced functionality.
 * 
 * @interface TradesRuleTableProps
 */
interface TradesRuleTableProps {
  /** Array of trade records to display */
  trades: Trade[];
  /** Array of batch evaluation results from rule engine (null if not evaluated) */
  batchResults: BatchResult[] | null;
}

/**
 * TradesRuleTable Component
 * 
 * A basic HTML table implementation for displaying trading data with rule evaluation
 * results. Provides a straightforward tabular view without advanced features,
 * focusing on simplicity and mobile compatibility.
 * 
 * The component directly maps trade data and batch results to table rows without
 * intermediate data transformation, resulting in a simpler but less flexible
 * implementation compared to the enhanced table variant.
 * 
 * Features responsive design through horizontal scrolling and uses consistent
 * financial formatting with color coding for positive/negative values.
 * 
 * @component
 * @param {TradesRuleTableProps} props - Component props
 * @returns {JSX.Element} The rendered basic trades table
 * 
 * @example
 * ```tsx
 * <TradesRuleTable
 *   trades={rawTradeData}
 *   batchResults={ruleEvaluationResults}
 * />
 * ```
 */
const TradesRuleTable: React.FC<TradesRuleTableProps> = ({
  trades,
  batchResults
}) => {
  if (!trades || trades.length === 0) {
    return <div className="text-gray-500">No trades to display.</div>;
  }

  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold mb-2">Trades & Rule Status</h3>
      {batchResults && batchResults.filter(r => r.ruleTriggered).length === 0 && (
        <div className="p-3 mb-4 rounded bg-green-100 text-green-800 font-semibold">
          All clear! No risk flags found in your trades.
        </div>
      )}
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full border text-xs">
          <thead>
            <tr>
              <th className="border px-2 py-1">Date/Time</th>
              <th className="border px-2 py-1">Symbol</th>
              <th className="border px-2 py-1">Qty</th>
              <th className="border px-2 py-1">Price</th>
              <th className="border px-2 py-1">Cash Flow</th>
              <th className="border px-2 py-1">Realized P&L</th>
              <th className="border px-2 py-1">Cost Basis</th>
              <th className="border px-2 py-1">Type</th>
              <th className="border px-2 py-1">Loss Flag</th>
              <th className="border px-2 py-1">Rule Status</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade, i) => {
              // Match by index for better accuracy since trades are processed in order
              const batch = batchResults?.[i];
              const ruleViolated = batch?.ruleTriggered;
              
              // Use corrected options trading calculations from batch results
              const amountUsed = batch?.amountUsed || 0;
              const realizedPL = batch?.realizedPL || 0;
              const costBasis = batch?.costBasis || 0;
              const consecutiveLossFlag = batch?.consecutiveLossFlag || '';
              const isEntry = batch?.isEntry || false;
              const isExit = batch?.isExit || false;
              
              // Format Amount Used with proper sign convention
              let amountLabel = '$0.00';
              let amountClass = '';
              if (amountUsed < 0) {
                amountLabel = `-$${Math.abs(amountUsed).toFixed(2)}`;
                amountClass = 'text-red-600'; // Negative cash flow (buy)
              } else if (amountUsed > 0) {
                amountLabel = `+$${amountUsed.toFixed(2)}`;
                amountClass = 'text-green-600'; // Positive cash flow (sell)
              }
              
              // Format Realized P&L
              let plLabel = '$0.00';
              let plClass = '';
              if (realizedPL > 0) { 
                plLabel = `+$${realizedPL.toFixed(2)}`; 
                plClass = 'text-green-600 font-semibold'; 
              } else if (realizedPL < 0) { 
                plLabel = `-$${Math.abs(realizedPL).toFixed(2)}`; 
                plClass = 'text-red-600 font-semibold'; 
              }
              
              const consecutiveLosses = batch?.consecutiveLosses ?? 0;
              
              let ruleStatus = <span className="text-green-600">✔️ OK</span>;
              if (ruleViolated) {
                let ruleName = consecutiveLosses >= 3 
                  ? 'Consecutive Losses' 
                  : 'Cost Basis';
                let actionText = batch?.actionTaken === 'reducePositionSize' 
                  ? 'Reduce size' 
                  : '';
                ruleStatus = (
                  <span className="text-red-600">
                    ❌ {ruleName}: {actionText}
                  </span>
                );
              }
              
              // Format date for display
              const dateDisplay = trade.dateTime 
                ? new Date(trade.dateTime).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : '-';
              
              return (
                <tr key={trade.id || i} className={ruleViolated ? 'bg-red-50' : ''}>
                  <td className="border px-2 py-1 text-xs">{dateDisplay}</td>
                  <td className="border px-2 py-1">{trade.symbol}</td>
                  <td className="border px-2 py-1">{trade.quantity}</td>
                  <td className="border px-2 py-1">${trade.tradePrice.toFixed(2)}</td>
                  <td className={`border px-2 py-1 ${amountClass}`}>
                    {amountLabel}
                  </td>
                  <td className={`border px-2 py-1 text-center ${plClass}`}>
                    {plLabel}
                  </td>
                  <td className="border px-2 py-1 text-center">
                    ${costBasis.toFixed(2)}
                  </td>
                  <td className="border px-2 py-1 text-center">
                    {isEntry ? '📥 Entry' : isExit ? '📤 Exit' : '-'}
                  </td>
                  <td className="border px-2 py-1 text-center">
                    {consecutiveLossFlag || '-'}
                  </td>
                  <td className="border px-2 py-1 text-center">
                    {ruleStatus}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TradesRuleTable; 
 
 
 