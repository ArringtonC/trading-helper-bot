import { IBKRAccount, IBKRPosition, IBKRImportResult, convertIBKRPositionToTrade } from '../types/ibkr';
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
    
    const positions: IBKRPosition[] = result.positions.map(p => ({
      symbol: p.symbol,
      quantity: p.quantity,
      marketPrice: p.closePrice,
      marketValue: p.value,
      averageCost: p.costPrice,
      unrealizedPL: p.unrealizedPL,
      realizedPL: 0,
      assetType: p.assetCategory.includes('Options') ? 'OPTION' : 'STOCK',
      currency: p.currency,
      accountId: result.accountInfo.accountId,
      lastUpdated: new Date()
    }));
    
    return {
      account: {
        id: result.accountInfo.accountId,
        name: result.accountInfo.accountName,
        type: result.accountInfo.accountType === 'MARGIN' ? 'MARGIN' : 'CASH',
        currency: result.accountInfo.baseCurrency,
        balance: result.accountInfo.balance,
        cash: result.accountInfo.balance,
        marketValue: 0,
        positions,
        lastUpdated: new Date()
      },
      positions,
      errors: [],
      warnings: []
    };
  }

  /**
   * Import IBKR data and convert to internal models
   */
  static async importIBKRData(file: File): Promise<IBKRImportResult> {
    try {
      const text = await file.text();
      const result = this.parseIBKRData(text);

      if (result.errors.length > 0) {
        return result;
      }

      // Convert option positions to trades
      for (const position of result.positions) {
        if (position.assetType === 'OPTION') {
          const trade = convertIBKRPositionToTrade(position, result.account.id);
          if (trade) {
            OptionService.addTrade(result.account.id, trade);
          }
        }
      }

      return result;
    } catch (error) {
      return {
        account: {
          id: '',
          name: '',
          type: 'CASH',
          currency: 'USD',
          balance: 0,
          cash: 0,
          marketValue: 0,
          positions: [],
          lastUpdated: new Date()
        },
        positions: [],
        errors: [`Error importing IBKR data: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      };
    }
  }
  
  /**
   * Parse IBKR activity statement CSV
   */
  public static parseActivityStatement(csvContent: string): IBKRAccount {
    try {
      const parser = new IBKRActivityStatementParser(csvContent);
      const result = parser.parse();
      
      const positions: IBKRPosition[] = result.positions.map(p => ({
        symbol: p.symbol,
        quantity: p.quantity,
        marketPrice: p.closePrice,
        marketValue: p.value,
        averageCost: p.costPrice,
        unrealizedPL: p.unrealizedPL,
        realizedPL: 0,
        assetType: p.assetCategory.includes('Options') ? 'OPTION' : 'STOCK',
        currency: p.currency,
        accountId: result.accountInfo.accountId,
        lastUpdated: new Date()
      }));
      
      return {
        id: `IBKR-${result.accountInfo.accountId}`,
        name: result.accountInfo.accountName,
        type: result.accountInfo.accountType === 'MARGIN' ? 'MARGIN' : 'CASH',
        currency: result.accountInfo.baseCurrency,
        balance: result.accountInfo.balance,
        cash: result.accountInfo.balance,
        marketValue: 0,
        positions,
        lastUpdated: new Date()
      };
    } catch (error: unknown) {
      console.error('Error parsing IBKR activity statement', error);
      throw new Error(`Failed to parse IBKR activity statement: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Convert IBKR account to internal Account model
   */
  public static convertToAccount(ibkrAccount: IBKRAccount): Account {
    return {
      id: ibkrAccount.id,
      name: ibkrAccount.name,
      type: AccountType.IBKR,
      balance: ibkrAccount.marketValue + ibkrAccount.cash,
      lastUpdated: ibkrAccount.lastUpdated
    };
  }
  
  /**
   * Convert IBKR option positions to internal OptionTrade models
   */
  public static convertToOptionTrades(ibkrAccount: IBKRAccount): OptionTrade[] {
    return ibkrAccount.positions
      .filter(p => p.assetType === 'OPTION' && p.strike && p.expiry && p.putCall)
      .map(p => ({
        id: `ibkr-option-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        symbol: p.symbol.split(' ')[0],
        putCall: p.putCall as 'PUT' | 'CALL',
        strike: p.strike as number,
        expiry: p.expiry as Date,
        quantity: p.quantity,
        premium: p.averageCost / 100,
        openDate: new Date(),
        strategy: p.putCall === 'CALL' ? OptionStrategy.LONG_CALL : OptionStrategy.LONG_PUT,
        notes: `Imported from IBKR: ${p.symbol}`
      }));
  }
}