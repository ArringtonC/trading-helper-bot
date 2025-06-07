import { getTrades } from './DatabaseService';
import { NormalizedTradeData } from '../types/trade';

/**
 * Service for accessing and providing trade data for analytics and ML purposes.
 */
export class AnalyticsDataService {
  /**
   * Retrieves all normalized trade data from the database.
   * @returns A promise resolving to an array of NormalizedTradeData.
   */
  public async getAllTrades(): Promise<NormalizedTradeData[]> {
    // Use the existing DatabaseService to fetch trades
    const trades = await getTrades();
    // Apply preprocessing steps
    const preprocessedTrades = this.preprocessTrades(trades);
    return preprocessedTrades;
  }

  /**
   * Applies preprocessing steps to trade data.
   * This is a placeholder and can be expanded for cleaning, transformation, etc.
   * @param trades - Array of NormalizedTradeData.
   * @returns The preprocessed array of NormalizedTradeData.
   */
  private preprocessTrades(trades: NormalizedTradeData[]): NormalizedTradeData[] {
    console.log(`[AnalyticsDataService] Starting preprocessing for ${trades.length} trades.`);

    return trades.map(trade => {
      const processedTrade = { ...trade };

      // Basic date validation: Ensure date strings are not empty if they exist
      // tradeDate is NOT optional in type, ensure it's a string.
      if (processedTrade.tradeDate === '') { /* Decide how to handle empty tradeDate if necessary, for now keep as empty string */ }
      if (processedTrade.settleDate === '') processedTrade.settleDate = undefined; // settleDate IS optional, can be undefined
      if (processedTrade.expiryDate === '') processedTrade.expiryDate = undefined; // expiryDate IS optional, can be undefined
      if (processedTrade.dateTime === '') processedTrade.dateTime = undefined; // dateTime IS optional, can be undefined

      // Ensure key numerical fields are finite numbers or null if they were optional
      // The type definition for quantity, tradePrice, netAmount is number, which implies they should always be finite after initial parsing
      // For optional number fields that can be null, ensure they are not NaN or Infinity
      if (processedTrade.proceeds !== undefined && processedTrade.proceeds !== null && !Number.isFinite(processedTrade.proceeds)) processedTrade.proceeds = null;
      if (processedTrade.cost !== undefined && processedTrade.cost !== null && !Number.isFinite(processedTrade.cost)) processedTrade.cost = null;
      if (processedTrade.commission !== undefined && processedTrade.commission !== null && !Number.isFinite(processedTrade.commission)) processedTrade.commission = null;
      if (processedTrade.fees !== undefined && processedTrade.fees !== null && !Number.isFinite(processedTrade.fees)) processedTrade.fees = null;
      if (processedTrade.costBasis !== undefined && processedTrade.costBasis !== null && !Number.isFinite(processedTrade.costBasis)) processedTrade.costBasis = null;
      if (processedTrade.strikePrice !== undefined && processedTrade.strikePrice !== null && !Number.isFinite(processedTrade.strikePrice)) processedTrade.strikePrice = null;
      if (processedTrade.multiplier !== undefined && processedTrade.multiplier !== null && !Number.isFinite(processedTrade.multiplier)) processedTrade.multiplier = undefined; // Multiplier is number | undefined

      // Example preprocessing: Convert date strings to Date objects for easier time-series analysis
      // Note: This might be done later in feature engineering, but can be done here too.
      // processedTrade.tradeDate = new Date(processedTrade.tradeDate); // Requires updating NormalizedTradeData type if uncommented

      // Example preprocessing: Handle potential missing values for numerical fields
      // For required fields (quantity, tradePrice, netAmount), they should ideally be valid numbers from initial parsing.
      // For optional number fields that can be null:
      if (processedTrade.proceeds === null) { /* Decide how to handle, e.g., impute with 0 or a statistical measure */ }
      if (processedTrade.cost === null) { /* Decide how to handle */ }
      if (processedTrade.commission === null) { /* Decide how to handle */ }
      if (processedTrade.fees === null) { /* Decide how to handle */ }
      if (processedTrade.costBasis === null) { /* Decide how to handle */ }
      if (processedTrade.strikePrice === null) { /* Decide how to handle */ }
      if (processedTrade.multiplier === undefined) { /* Decide how to handle */ } // Multiplier is number | undefined

      // Example preprocessing: Ensure specific string fields have default values if empty or null
      if (!processedTrade.description) processedTrade.description = '';
      if (!processedTrade.action) processedTrade.action = '';

      // TODO: Add more sophisticated cleaning like outlier detection, handling missing values based on context, etc.

      return processedTrade as NormalizedTradeData; // Cast back to ensure type consistency
    });
  }

  /**
   * Retrieves normalized trade data for a specific symbol from the database.
   * @param symbol - The trading symbol to filter by.
   * @returns A promise resolving to an array of NormalizedTradeData for the given symbol.
   */
  public async getTradesBySymbol(symbol: string): Promise<NormalizedTradeData[]> {
    // For now, fetch all trades and filter in memory. For larger datasets, this should be a database query.
    const allTrades = await this.getAllTrades();
    const filteredTrades = allTrades.filter(trade => trade.symbol === symbol);
    console.log(`[AnalyticsDataService] Retrieved ${filteredTrades.length} trades for symbol: ${symbol}`);
    // TODO: Add more sophisticated filtering or sorting here if needed
    return filteredTrades;
  }

  // TODO: Add more methods for accessing filtered or specific trade data (e.g., by symbol, date range)
} 