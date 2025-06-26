import { IBKRAccount, IBKRPosition, IBKRImportResult } from '../types/ibkr';
import { Account, AccountType } from '../types/account';
import { OptionTrade, OptionStrategy } from '../types/options';
import { OptionService } from './OptionService';
import { IBKRActivityStatementParser } from './IBKRActivityStatementParser';

/**
 * Service for handling IBKR data imports
 */
export class IBKRService {
  
  /**
   * Parse IBKR CSV data and convert to internal models
   */
  static parseIBKRData(csvData: string): IBKRImportResult {
    const parser = new IBKRActivityStatementParser(csvData);
    const result = parser.parse();
    
    return result;
  }

  /**
   * Import IBKR data and convert to internal models
   */
  static async importIBKRData(file: File): Promise<IBKRImportResult> {
    try {
      const text = await file.text();
      const parser = new IBKRActivityStatementParser(text);
      const result = await parser.parse();

      if (result.errors && result.errors.length > 0) {
        console.error('Errors found during parsing:', result.errors);
        return result;
      }

      // Convert option positions to trades
      if (Array.isArray(result.positions)) {
        result.optionTrades = result.positions
          .map(p => this.convertIBKRPositionToTrade(p))
          .filter((trade): trade is OptionTrade => trade !== null);
      } else {
        result.optionTrades = [];
      }

      console.log(`Converted ${result.optionTrades?.length || 0} option trades during import.`);

      // Persist trades (this logic might belong elsewhere, e.g., in the component)
      if (result.optionTrades && result.account) {
        for (const trade of result.optionTrades) {
          OptionService.addTrade(result.account.accountId, trade);
        }
      }

      return result;
    } catch (error) {
      console.error('Error importing IBKR data:', error);
      // Return a result indicating failure
      const failedResult: IBKRImportResult = {
        success: false,
        account: { accountId: '', accountName: '', accountType: '', baseCurrency: '', balance: 0 },
        positions: [],
        trades: [],
        optionTrades: [],
        errors: [error instanceof Error ? error.message : String(error)]
      };
      return failedResult;
    }
  }
  
  /**
   * Parse IBKR activity statement CSV
   */
  public static async parseActivityStatement(csvContent: string): Promise<IBKRImportResult> {
    console.log('[Service] Starting to parse activity statement...');
    console.log('[Service] Content length:', csvContent.length);
    console.log('[Service] First 100 chars:', csvContent.substring(0, 100));
    
    try {
      console.log('[Service] Creating parser instance...');
      const parser = new IBKRActivityStatementParser(csvContent);
      
      console.log('[Service] Calling parser.parse()...');
      const result = await parser.parse();
      
      console.log('[Service] Parse completed. Result:', {
        accountId: result.account?.accountId || 'unknown',
        accountName: result.account?.accountName || 'unknown',
        positionsCount: Array.isArray(result.positions) ? result.positions.length : 0,
        tradesCount: result.trades?.length || 0,
        errors: result.errors?.length || 0,
        warnings: result.warnings?.length || 0
      });
      
      if (result.errors && result.errors.length > 0) {
        console.error('[Service] Parsing errors:', result.errors);
        console.error('[Service] Parser debug state:', parser.getDebugState());
      }
      
      if (result.warnings && result.warnings.length > 0) {
        console.warn('[Service] Parsing warnings:', result.warnings);
      }
      
      return result;
    } catch (error: unknown) {
      console.error('[Service] Error parsing IBKR activity statement', error);
      throw new Error(`Failed to parse IBKR activity statement: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Convert IBKR account to internal Account model
   */
  public static convertToAccount(ibkrAccount: IBKRAccount): Account {
    return {
      id: `IBKR-${ibkrAccount.accountId}`,
      name: ibkrAccount.accountName,
      type: AccountType.IBKR,
      balance: ibkrAccount.balance,
      lastUpdated: ibkrAccount.lastUpdated || new Date(),
      created: new Date()
    };
  }
  
  /**
   * Convert IBKR option positions to internal OptionTrade models
   */
  public static convertToOptionTrades(parsedResult: IBKRImportResult): OptionTrade[] {
    if (!Array.isArray(parsedResult.positions)) {
      return [];
    }
    
    return parsedResult.positions
      .filter(p => p.assetType === 'OPTION' || p.symbol === 'SPY')
      .map(p => {
        const trade = this.convertIBKRPositionToTrade(p);
        
        if (trade) {
          const totalPL = (p.realizedPL || 0) + (p.unrealizedPL || 0);
          trade.notes = [
            `Imported from IBKR: ${p.symbol}`,
            `Market Price: $${p.marketPrice.toFixed(2)}`,
            `Market Value: $${p.marketValue.toFixed(2)}`,
            `Average Cost: $${p.averageCost.toFixed(2)}`,
            `Realized P&L: $${(p.realizedPL || 0).toFixed(2)}`,
            `Unrealized P&L: $${(p.unrealizedPL || 0).toFixed(2)}`,
            `Total P&L: $${totalPL.toFixed(2)}`,
            `Last Updated: ${p.lastUpdated.toLocaleString()}`
          ].join('\n');
          return trade;
        }
        return null;
      })
      .filter((trade): trade is OptionTrade => trade !== null);
  }

  static convertIBKRPositionToTrade(position: IBKRPosition): OptionTrade | null {
    let putCall: 'PUT' | 'CALL' = position.putCall || 'CALL';
    let strike = position.strike || 0;
    let expiry = position.expiry || new Date();
    let quantity = position.quantity;
    let premium = position.marketPrice || 0;

    console.log('Starting position conversion for:', position.symbol);

    // Handle SPY special case
    if (position.symbol === "SPY") {
      if (Math.abs(position.quantity) >= 100) {
        quantity = position.quantity > 0 ? 1 : -1;
        console.log('SPY special case: Quantity adjusted to', quantity);
      }
      if (premium > 100 && quantity !== 0) {
        premium = premium / 100 / Math.abs(quantity);
        console.log('SPY special case: Premium adjusted per share to', premium);
      }
      putCall = 'CALL'; // Assume SPY is CALL
    }
    // Parse standard OCC options if not already done
    else if (position.assetType === 'OPTION') {
      if (position.putCall === undefined || position.strike === undefined) {
        const occPattern = /^([A-Z]+)\s+(\d{6})([CP])(\d{8})$/;
        const match = position.symbol.match(occPattern);
        if (match) {
          const [, , dateStr, pcStr, strikeStr] = match;
          putCall = pcStr === 'C' ? 'CALL' : 'PUT';
          strike = parseInt(strikeStr) / 1000;
          const year = parseInt(dateStr.substring(0, 2)) + 2000;
          const month = parseInt(dateStr.substring(2, 4)) - 1;
          const day = parseInt(dateStr.substring(4, 6));
          expiry = new Date(Date.UTC(year, month, day));
          console.log('Parsed OCC from symbol:', { putCall, strike, expiry: expiry.toISOString() });
        } else {
          console.warn('Could not parse OCC symbol, using existing/default values:', position.symbol);
        }
      }
      // Convert quantity if it looks like shares
      if (Math.abs(position.quantity) >= 100) {
        console.log('Adjusting option quantity from shares to contracts:', position.quantity);
        quantity = position.quantity / 100;
      }
    }
    
    // Skip if it doesn't look like an option after parsing
    if (position.assetType !== 'OPTION' && position.symbol !== 'SPY') {
      console.log('Skipping non-option position:', position.symbol);
      return null;
    }

    // Determine strategy
    const strategy = quantity > 0
      ? (putCall === 'CALL' ? OptionStrategy.LONG_CALL : OptionStrategy.LONG_PUT)
      : (putCall === 'CALL' ? OptionStrategy.SHORT_CALL : OptionStrategy.SHORT_PUT);

    console.log('Final converted trade values:', { symbol: position.symbol, putCall, strike, expiry: expiry.toISOString(), quantity, premium, strategy, commission: position.commission || 0 });

    return {
      id: `${position.symbol}-${Date.now()}`,
      symbol: position.symbol.split(' ')[0] || position.symbol,
      putCall,
      strike,
      expiry,
      quantity,
      premium,
      openDate: position.lastUpdated || new Date(),
      strategy,
      commission: position.commission || 0,
      notes: `Imported from IBKR - ${position.symbol}`
    };
  }
}