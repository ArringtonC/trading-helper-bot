import { parseTradeCSV } from './parseTradeCSV';
import { parsePositionCSV } from './parsePositionCSV';
import { isTradeCSV, isPositionCSV } from './parseTradeCSV'; // assuming detect functions live there
import { insertSummary, getAggregatePL, insertPosition, insertNormalizedTrades, resetDatabase } from '../services/DatabaseService';
import { BrokerType, AssetCategory, NormalizedTradeData, OpenCloseIndicator } from '../types/trade';
import { RawTrade } from './parseTradeCSV';
// Note: insertPosition will be added later

export async function handleUpload(
  fileText: string,
  logDebug?: (data: any) => void // optional debug callback
): Promise<void> {
  console.log('[DEBUG] handleUpload called', fileText.slice(0, 500));
  try {
    if (isTradeCSV(fileText)) {
      console.log('[DEBUG] Detected as trade CSV');
      // Assuming parseTradeCSV returns an array of raw trade objects (ParsedTrade[]) directly
      const trades = parseTradeCSV(fileText); // This is the array of raw trades

      // *** DEBUG LOG: First raw trade data from the parser ***
      if (trades && trades.length > 0) {
        console.log('[DEBUG] First raw trade from parser in handleUpload:', trades[0]);
      }

      // Map ParsedTrade to NormalizedTradeData before inserting
      // We need to derive accountId and broker if parseTradeCSV doesn't return them explicitly
      // For now, we'll hardcode BrokerType.IBKR as this function seems specific to it.
      const normalizedTrades: NormalizedTradeData[] = trades.map((trade: any) => {
        // Assuming the raw 'trade' object from the parser has relevant fields (adjust names as needed)
        // accountId is not consistently available in raw trade data, use undefined if not present
        const accountId = trade.accountId || undefined;
        // Broker type is not provided by parseTradeCSV in this case, default to IBKR
        const broker = BrokerType.IBKR; 

        // Get raw values from the parsed trade object
        const raw = trade as RawTrade; // Use RawTrade interface for expected fields

        // Correct mapping with data cleaning and sign adjustments
        // Use Math.max(0, ...) and Math.abs() for robust sign handling
        const quantity = Number(raw.quantity);
        const tradePrice = Number(raw.price);

        // Parse raw financials directly as numbers
        const proceedsRaw = Number(raw.proceeds ?? 0);
        const commissionRaw = Number(raw.commissionFee ?? 0); // Use commissionFee from RawTrade
        const feesRaw = Number(raw.fees ?? 0);

        // Calculate netAmount: Use rawRealizedPL for closed trades, 0 for open trades
        const netAmount = raw.isClose ? (raw.rawRealizedPL ?? 0) : 0;

        // For the normalized model, store proceeds, cost, commission, fees as positive values
        // And use the calculated netAmount
        const normalizedProceeds = proceedsRaw > 0 ? proceedsRaw : 0;
        const normalizedCost = proceedsRaw < 0 ? Math.abs(proceedsRaw) : 0; // Approximate cost for buys
        const normalizedCommission = Math.abs(commissionRaw);
        const normalizedFees = Math.abs(feesRaw);

        return {
          id: raw.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)), // Generate ID if missing
          importTimestamp: new Date().toISOString(),
          broker: broker, // Use the determined broker
          accountId: raw.accountId || undefined, // Use accountId from raw trade, default to undefined
          // Trim trailing commas from date strings
          tradeDate: (raw.tradeDate || (raw.dateTime ? raw.dateTime.split(' ')[0] : '')).replace(/,+$/, ''), 
          settleDate: raw.settleDate || undefined, // Use undefined for optional string
          symbol: raw.symbol || '', // Symbol should likely be required, but providing fallback
          // Trim trailing commas from date strings
          dateTime: raw.dateTime ? raw.dateTime.replace(/,+$/, '') : undefined, // Keep original dateTime or use undefined, trim comma
          description: raw.description || undefined, // Use undefined for optional string
          assetCategory: raw.assetCategory || 'OPT', // Default or derive this (parseTradeCSV likely determines this now)
          action: raw.action || undefined, // Action from CSV, use undefined for optional string
          quantity: quantity, // Use corrected quantity
          tradePrice: tradePrice, // Use corrected tradePrice
          currency: raw.currency || 'USD', // Default or derive this (parseTradeCSV likely determines this now)

          // Financials - Use the corrected and calculated values
          proceeds: normalizedProceeds, 
          cost: normalizedCost,
          commission: normalizedCommission,
          fees: normalizedFees,
          netAmount: netAmount, // Use calculated netAmount

          // Open/Close Indicator - Critical field for dashboard stats
          // Map from isClose boolean calculated by parseTradeCSV: true -> 'C', false -> 'O'
          openCloseIndicator: raw.isClose ? 'C' : 'O', // Use isClose from parser, map to literal strings

          // Option Specifics - Use undefined for optional fields from raw data
          costBasis: raw.costBasis || undefined, // Use undefined for optional number
          optionSymbol: raw.optionSymbol || undefined, // Use undefined for optional string
          expiryDate: raw.expiryDate || undefined, // Use undefined for optional string
          strikePrice: raw.strikePrice || undefined, // Use undefined for optional number
          putCall: raw.putCall || undefined, // Use undefined for optional string
          multiplier: raw.multiplier || undefined, // Use undefined for optional number

          // Linkage & Identifiers - Use undefined for optional fields from raw data
          orderID: raw.orderID || undefined, // Use undefined for optional string
          executionID: raw.executionID || undefined, // Use undefined for optional string
          notes: raw.notes || undefined, // Use undefined for optional string

          // Include raw Realized P/L for debugging
          rawRealizedPL: raw.rawRealizedPL || undefined,

          // Raw row data - Ensure it's an object or undefined
          rawCsvRow: raw.rawCsvRow || (Object.keys(raw).length > 0 ? Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, String(v)])) : undefined),
        };
      });

      // *** DEBUG LOG: First normalized trade data before insert ***
      if (normalizedTrades.length > 0) {
        console.log('[DEBUG] First normalized trade before insert in handleUpload:', normalizedTrades[0]);
      }

      // *** DEBUG LOG: Calculate and log realized P&L from normalizedTrades ***
      const closedTrades = normalizedTrades.filter(trade => trade.openCloseIndicator === 'C');
      const realizedPLCheck = closedTrades.reduce((sum, trade) => sum + (trade.netAmount ?? 0), 0); // Use ?? 0 for safety
      console.log('[DEBUG] Calculated realized P&L from normalizedTrades:', realizedPLCheck);

      // *** DEBUG LOG: Compare raw vs. computed netAmount for closed trades ***
      console.log('[DEBUG] Comparing raw vs. computed netAmount for closed trades (first 5):');
      closedTrades.slice(0, 5).forEach(t => {
        console.log(
          `Symbol: ${t.symbol}`,
          `RawRealizedPL: ${t.rawRealizedPL}`,
          `ComputedNet: ${t.netAmount?.toFixed(2) ?? 'N/A'}` // Use ?. and ?? for safety
        );
      });
      console.log('[DEBUG] Sum of computed netAmount for all closed trades:', realizedPLCheck);
      const rawRealizedPLSum = closedTrades.reduce((sum, t) => sum + (t.rawRealizedPL ?? 0), 0);
      console.log('[DEBUG] Sum of raw Realized P/L for all closed trades:', rawRealizedPLSum);

      // Reset database and insert trades
      await resetDatabase(); // Clear previous data before inserting new batch
      await insertNormalizedTrades(normalizedTrades);
      console.log(`✅ Imported ${normalizedTrades.length} trades.`);

      // Assuming getAggregatePL sums netAmount or similar for a quick check
      const pl = await getAggregatePL();
      insertSummary(pl); // Update summary table, potentially with aggregate PL

      logDebug?.(normalizedTrades); // 🔍 send parsed trades to debug to the callback if provided
    } else if (isPositionCSV(fileText)) {
      console.log('[DEBUG] Detected as position CSV');
      const positions = parsePositionCSV(fileText);
      positions.forEach(insertPosition);
      console.log(`✅ Imported ${positions.length} positions.`);
      logDebug?.(positions); // 🔍 send parsed positions to debug
    } else {
      console.log('[DEBUG] Unknown CSV format, about to throw error');
      console.error('❌ Unknown CSV format.');
      alert('Unsupported CSV file. Please upload a valid trade or position CSV.');
    }
  } catch (err) {
    console.log('[DEBUG] Error caught in handleUpload:', err);
    console.error('❌ Error while processing CSV:', err);
    alert('An error occurred while parsing the file. See console for details.');
  }
}

// Helper function to read file content (used by the handleUpload function above)
async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && event.target.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('Failed to read file content.'));
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsText(file);
  });
}