/**
 * @fileoverview Enhanced Trades Table Component - Advanced Trade Display with Rule Engine Integration
 * 
 * This component provides a sophisticated trading data visualization interface that integrates
 * with the rule engine to display trades alongside their compliance status and risk indicators.
 * It combines raw trade data with batch evaluation results to present a comprehensive view
 * of trading activity with real-time rule violation detection.
 * 
 * Key Features:
 * - Interactive data table with sorting, filtering, and pagination
 * - Real-time rule violation highlighting and flagging
 * - Batch result integration for compliance monitoring
 * - Visual indicators for trade types (entry/exit) and risk levels
 * - Conditional filtering to focus on flagged trades
 * - Comprehensive data formatting for financial values
 * 
 * Data Flow:
 * 1. Receives raw trade data and batch evaluation results
 * 2. Transforms and merges data for table display
 * 3. Applies rule status evaluation and visual formatting
 * 4. Provides interactive filtering and sorting capabilities
 * 5. Highlights rule violations with contextual information
 * 
 * Integration Points:
 * - Rule Engine: Consumes batch evaluation results for compliance display
 * - AccessibleTable: Uses shared table component for consistent UX
 * - Import & Analyze Page: Primary display component for processed trade data
 * 
 * @author Trading Helper Bot Team
 * @version 2.1.0
 * @since 2024-Q4
 */

import React, { useMemo, useState } from 'react';
import { AccessibleTable, TableColumn } from '../ui/AccessibleTable';

/**
 * Individual trade record interface representing a single trading transaction.
 * Contains both raw trade data and derived fields for analysis.
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
 * Each result corresponds to a trade and includes compliance evaluation.
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
 * Props interface for the EnhancedTradesTable component.
 * Defines the data inputs required for table rendering and rule integration.
 * 
 * @interface EnhancedTradesTableProps
 */
interface EnhancedTradesTableProps {
  /** Array of trade records to display */
  trades: Trade[];
  /** Array of batch evaluation results from rule engine (null if not evaluated) */
  batchResults: BatchResult[] | null;
}

/**
 * Internal table row interface representing the processed data structure.
 * Combines trade data with batch results for unified table display.
 * 
 * @interface TableRow
 */
interface TableRow {
  /** Unique row identifier */
  id: string;
  /** Formatted date/time string */
  dateTime: string;
  /** Trading symbol */
  symbol: string;
  /** Trade quantity with sign indication */
  quantity: number;
  /** Execution price */
  price: number;
  /** Cash flow impact (positive = inflow, negative = outflow) */
  cashFlow: number;
  /** Realized profit/loss */
  realizedPL: number;
  /** Position cost basis */
  costBasis: number;
  /** Trade type ('Entry', 'Exit', or '-') */
  type: string;
  /** Loss flag indicator text */
  lossFlag: string;
  /** Rule status description */
  ruleStatus: string;
  /** Whether any rule was triggered */
  ruleTriggered: boolean;
  /** Count of consecutive losses */
  consecutiveLosses: number;
  /** Original array index for reference */
  originalIndex: number;
}

/**
 * EnhancedTradesTable Component
 * 
 * A sophisticated trading data visualization component that integrates raw trade data
 * with rule engine evaluation results to provide comprehensive risk monitoring and
 * compliance tracking. Features advanced table functionality with filtering, sorting,
 * and conditional highlighting of rule violations.
 * 
 * The component transforms heterogeneous data sources into a unified table view,
 * applies visual formatting for financial data, and provides interactive controls
 * for focusing on specific trade categories or risk conditions.
 * 
 * @component
 * @param {EnhancedTradesTableProps} props - Component props
 * @returns {JSX.Element} The rendered enhanced trades table
 * 
 * @example
 * ```tsx
 * <EnhancedTradesTable
 *   trades={importedTrades}
 *   batchResults={ruleEngineResults}
 * />
 * ```
 */
const EnhancedTradesTable: React.FC<EnhancedTradesTableProps> = ({
  trades,
  batchResults
}) => {
  // ===== STATE MANAGEMENT =====
  /** Toggle state for filtering to show only rule-violating trades */
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);

  // ===== DATA TRANSFORMATION =====
  /**
   * Transforms raw trade data and batch results into unified table rows.
   * This is the core data processing function that merges trade data with
   * rule engine results to create a comprehensive view.
   * 
   * Process:
   * 1. Maps over trades array with index for batch result correlation
   * 2. Extracts relevant batch result data for each trade
   * 3. Determines trade type (Entry/Exit) based on batch analysis
   * 4. Calculates rule status and violation indicators
   * 5. Formats data for table display with consistent structure
   * 
   * @returns {TableRow[]} Array of processed table row objects
   */
  const tableData = useMemo((): TableRow[] => {
    if (!trades || trades.length === 0) return [];
    
    return trades.map((trade, i) => {
      // Extract corresponding batch result for this trade index
      const batch = batchResults?.[i];
      
      // Extract rule evaluation results with safe defaults
      const ruleViolated = batch?.ruleTriggered || false;
      const amountUsed = batch?.amountUsed || 0;
      const realizedPL = batch?.realizedPL || 0;
      const costBasis = batch?.costBasis || 0;
      const consecutiveLossFlag = batch?.consecutiveLossFlag || '';
      const isEntry = batch?.isEntry || false;
      const isExit = batch?.isExit || false;
      const consecutiveLosses = batch?.consecutiveLosses ?? 0;
      
      // Determine trade type based on batch analysis
      const type = isEntry ? 'Entry' : isExit ? 'Exit' : '-';
      
      // Generate comprehensive rule status description
      let ruleStatus = 'OK';
      if (ruleViolated) {
        // Determine which rule was violated
        const ruleName = consecutiveLosses >= 3 
          ? 'Consecutive Losses' 
          : 'Cost Basis';
        
        // Extract action taken by rule engine
        const actionText = batch?.actionTaken === 'reducePositionSize' 
          ? 'Reduce size' 
          : '';
        
        ruleStatus = `${ruleName}: ${actionText}`;
      }
      
      // Return unified table row structure
      return {
        id: trade.id || `trade-${i}`,
        dateTime: trade.dateTime || '',
        symbol: trade.symbol,
        quantity: trade.quantity,
        price: trade.tradePrice,
        cashFlow: amountUsed,
        realizedPL: realizedPL,
        costBasis: costBasis,
        type: type,
        lossFlag: consecutiveLossFlag,
        ruleStatus: ruleStatus,
        ruleTriggered: ruleViolated,
        consecutiveLosses: consecutiveLosses,
        originalIndex: i
      };
    });
  }, [trades, batchResults]);

  /**
   * Applies conditional filtering based on user preferences.
   * When showFlaggedOnly is true, filters to display only trades
   * that triggered rule violations for focused risk analysis.
   * 
   * @returns {TableRow[]} Filtered array of table rows
   */
  const finalTableData = useMemo(() => {
    if (!showFlaggedOnly) return tableData;
    return tableData.filter(row => row.ruleTriggered);
  }, [tableData, showFlaggedOnly]);

  // ===== COLUMN DEFINITIONS =====
  /**
   * Defines the table column configuration with advanced formatting,
   * sorting, and filtering capabilities. Each column includes:
   * - Data accessor and display formatting
   * - Sort and filter capabilities
   * - Custom rendering for financial data
   * - Visual styling and width constraints
   * 
   * @returns {TableColumn<TableRow>[]} Array of column configuration objects
   */
  const columns = useMemo((): TableColumn<TableRow>[] => [
    {
      key: 'dateTime',
      header: 'Date/Time',
      accessor: 'dateTime',
      sortable: true,
      filterable: true,
      filterType: 'text',
      className: 'text-xs',
      width: '130px',
      /**
       * Formats ISO timestamp to readable date/time format.
       * Handles parsing errors gracefully by returning raw value.
       * 
       * @param {string} value - ISO timestamp string
       * @returns {string} Formatted date/time or original value
       */
      render: (value: string) => {
        if (!value) return '-';
        try {
          return new Date(value).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch {
          return value;
        }
      }
    },
    {
      key: 'symbol',
      header: 'Symbol',
      accessor: 'symbol',
      sortable: true,
      filterable: true,
      filterType: 'select',
      className: 'font-mono font-semibold',
      width: '120px'
    },
    {
      key: 'quantity',
      header: 'Qty',
      accessor: 'quantity',
      sortable: true,
      filterable: true,
      filterType: 'number',
      className: 'text-center',
      width: '80px',
      /**
       * Formats quantity with explicit positive/negative indicators.
       * Provides clear visual distinction between buy/sell operations.
       * 
       * @param {number} value - Quantity value
       * @returns {string} Formatted quantity with +/- prefix
       */
      render: (value: number) => {
        return value > 0 ? `+${value}` : `${value}`;
      }
    },
    {
      key: 'price',
      header: 'Price',
      accessor: 'price',
      sortable: true,
      filterable: true,
      filterType: 'number',
      className: 'text-right',
      width: '90px',
      /**
       * Formats price as currency with consistent decimal places.
       * 
       * @param {number} value - Price value
       * @returns {string} Formatted currency string
       */
      render: (value: number) => `$${value.toFixed(2)}`
    },
    {
      key: 'cashFlow',
      header: 'Cash Flow',
      accessor: 'cashFlow',
      sortable: true,
      filterable: true,
      filterType: 'number',
      className: 'text-right',
      width: '100px',
      /**
       * Formats cash flow with color-coded positive/negative indicators.
       * Green for inflows (credits), red for outflows (debits).
       * 
       * @param {number} value - Cash flow amount
       * @returns {JSX.Element} Formatted cash flow with color styling
       */
      render: (value: number) => {
        if (value === 0) return '$0.00';
        const absValue = Math.abs(value);
        const formattedValue = `$${absValue.toFixed(2)}`;
        return (
          <span className={value < 0 ? 'text-red-600' : 'text-green-600'}>
            {value < 0 ? `-${formattedValue}` : `+${formattedValue}`}
          </span>
        );
      }
    },
    {
      key: 'realizedPL',
      header: 'Realized P&L',
      accessor: 'realizedPL',
      sortable: true,
      filterable: true,
      filterType: 'number',
      className: 'text-right',
      width: '110px',
      /**
       * Formats realized profit/loss with color coding and emphasis.
       * Uses bold text and green/red colors to highlight performance.
       * 
       * @param {number} value - Realized P&L amount
       * @returns {JSX.Element} Formatted P&L with color and weight styling
       */
      render: (value: number) => {
        if (value === 0) return '$0.00';
        const absValue = Math.abs(value);
        const formattedValue = `$${absValue.toFixed(2)}`;
        const className = value > 0 
          ? 'text-green-600 font-semibold' 
          : 'text-red-600 font-semibold';
        return (
          <span className={className}>
            {value > 0 ? `+${formattedValue}` : `-${formattedValue}`}
          </span>
        );
      }
    },
    {
      key: 'costBasis',
      header: 'Cost Basis',
      accessor: 'costBasis',
      sortable: true,
      filterable: true,
      filterType: 'number',
      className: 'text-right',
      width: '100px',
      /**
       * Formats cost basis as currency for position sizing reference.
       * 
       * @param {number} value - Cost basis amount
       * @returns {string} Formatted currency string
       */
      render: (value: number) => `$${value.toFixed(2)}`
    },
    {
      key: 'type',
      header: 'Type',
      accessor: 'type',
      sortable: true,
      filterable: true,
      filterType: 'select',
      className: 'text-center',
      width: '90px',
      /**
       * Renders trade type with intuitive emoji indicators.
       * Provides quick visual identification of trade direction.
       * 
       * @param {string} value - Trade type ('Entry', 'Exit', or '-')
       * @returns {string} Formatted type with emoji
       */
      render: (value: string) => {
        if (value === 'Entry') return '📥 Entry';
        if (value === 'Exit') return '📤 Exit';
        return '-';
      }
    },
    {
      key: 'lossFlag',
      header: 'Loss Flag',
      accessor: 'lossFlag',
      sortable: true,
      filterable: true,
      filterType: 'select',
      className: 'text-center',
      width: '120px',
      /**
       * Renders loss flag indicator with warning styling.
       * Highlights consecutive loss patterns for risk awareness.
       * 
       * @param {string} value - Loss flag text
       * @returns {JSX.Element|string} Warning indicator or dash
       */
      render: (value: string) => {
        if (!value) return '-';
        return <span className="text-amber-600">⚠️ Back-to-Back Loss</span>;
      }
    },
    {
      key: 'ruleStatus',
      header: 'Rule Status',
      accessor: 'ruleStatus',
      sortable: true,
      filterable: true,
      filterType: 'select',
      className: 'text-center',
      width: '140px',
      /**
       * Renders rule compliance status with color-coded indicators.
       * Shows specific rule violations or OK status with appropriate styling.
       * 
       * @param {string} value - Rule status description
       * @param {TableRow} item - Complete row data for violation check
       * @returns {JSX.Element} Status indicator with color and icon
       */
      render: (value: string, item: TableRow) => {
        if (item.ruleTriggered) {
          return <span className="text-red-600">❌ {value}</span>;
        }
        return <span className="text-green-600">✔️ OK</span>;
      }
    }
  ], []);

  // ===== STYLING FUNCTIONS =====
  /**
   * Generates dynamic CSS classes for table rows based on rule violations.
   * Applies background highlighting to visually distinguish problematic trades.
   * 
   * @param {TableRow} item - Table row data
   * @returns {string} CSS class string for row styling
   */
  const getRowClassName = (item: TableRow) => {
    return item.ruleTriggered ? 'bg-red-50' : '';
  };

  // ===== COMPUTED VALUES =====
  /** Count of trades that triggered rule violations for summary display */
  const ruleViolations = tableData.filter(row => row.ruleTriggered).length;

  // ===== EARLY RETURN GUARDS =====
  // Only perform early returns after all hooks to maintain hook call order
  if (!trades || trades.length === 0) {
    return <div className="text-gray-500 text-center py-8">No trades to display.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Trades & Rule Status</h3>
        <div className="flex items-center space-x-3">
          {ruleViolations > 0 && (
            <button
              onClick={() => setShowFlaggedOnly(!showFlaggedOnly)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                showFlaggedOnly 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-red-100 text-red-800 hover:bg-red-200'
              }`}
            >
              {showFlaggedOnly ? '🔍 Showing Flagged Only' : '⚠️ Show Flagged Only'} ({ruleViolations})
            </button>
          )}
          {ruleViolations === 0 && (
            <div className="px-4 py-2 rounded-lg bg-green-100 text-green-800 font-semibold">
              ✅ All clear! No risk flags found in your trades.
            </div>
          )}
        </div>
      </div>
      
      <AccessibleTable
        data={finalTableData}
        columns={columns}
        caption="Trading activity with rule analysis and risk flags"
        aria-label="Trades and rule status table"
        searchPlaceholder="Search trades by symbol, type, or status..."
        pageSize={50}
        rowClassName={getRowClassName}
        emptyMessage={showFlaggedOnly ? "No flagged trades found." : "No trades match your current filters."}
        className="w-full"
      />
      
      <div className="text-xs text-gray-500 space-y-1">
        <p><strong>Legend:</strong></p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>📥 Entry = Opening position | 📤 Exit = Closing position</div>
          <div>⚠️ Back-to-Back Loss = Consecutive exit losses</div>
          <div><span className="text-green-600">Positive Cash Flow</span> = Sell/Credit</div>
          <div><span className="text-red-600">Negative Cash Flow</span> = Buy/Debit</div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTradesTable; 
 
 
 