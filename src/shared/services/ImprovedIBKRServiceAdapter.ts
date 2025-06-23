import { IBKRActivityStatementParser } from './brokers/parsers/IBKRActivityStatementParser';
import { IBKRImportResult, IBKRTradeRecord, IBKRPosition, IBKRAccount } from '../types/ibkr';
import { Account, AccountType } from '../types/account';
import { OptionTrade, OptionStrategy } from '../../types/options';

/**
 * Service adapter that uses the improved IBKR parser but
 * maintains compatibility with the existing application structure
 */
export class ImprovedIBKRServiceAdapter {
  private debugLogs: string[] = [];

  /**
   * Import an IBKR activity statement with improved parsing
   */
  public async importActivityStatement(content: string): Promise<IBKRImportResult> {
    this.debugLogs = [];
    this.log('Starting import of IBKR activity statement');
    this.log(`Content length: ${content.length} characters`);
    this.log(`Content preview: ${content.substring(0, 100)}...`);
    
    try {
      // Clean content
      this.log('Cleaning content...');
      const cleanedContent = this.cleanContent(content);
      this.log(`Cleaned content length: ${cleanedContent.length} characters`);
      this.log(`Cleaned content preview: ${cleanedContent.substring(0, 100)}...`);
      
      // Parse statement
      this.log('Parsing IBKR activity statement...');
      const parser = new IBKRActivityStatementParser(cleanedContent);
      const parseResult = await parser.parse();
      
      if (!parseResult.success) {
        this.log(`Parse failed: ${parseResult.error}`);
        return {
          success: false,
          error: parseResult.error,
          debugLogs: this.debugLogs
        };
      }
      
      this.log('Parse successful');
      this.log(`Account info found: ${!!parseResult.account}`);
      this.log(`Trades found: ${parseResult.trades?.length || 0}`);
      this.log(`Positions found: ${Array.isArray(parseResult.positions) ? parseResult.positions.length : 0}`);
      
      // Convert to application models
      this.log('Converting to application models...');
      
      // Convert account
      const account = parseResult.account ? this.convertToAccount(parseResult.account) : undefined;
      if (account) {
        this.log(`Account converted: ${account.accountId} - ${account.accountName}`);
      }
      
      // Convert positions
      const positions = Array.isArray(parseResult.positions) ? this.convertToPositions(parseResult.positions) : [];
      this.log(`Positions converted: ${positions.length}`);
      
      // Convert trades
      const trades = parseResult.trades ? this.convertToTrades(parseResult.trades) : [];
      this.log(`Trades converted: ${trades.length}`);
      
      // Log trade details
      trades.forEach((trade, index) => {
        this.log(`Trade ${index + 1}: ${trade.symbol} - ${trade.quantity} @ ${trade.strike}`);
      });
      
      return {
        success: true,
        accountId: account?.accountId,
        accountName: account?.accountName,
        totalTrades: trades.length,
        newTrades: trades.filter(t => !t.id).length,
        updatedTrades: trades.filter(t => t.id).length,
        positions: positions,
        debugLogs: this.debugLogs,
        account,
        trades: parseResult.trades,
        optionTrades: trades
      };
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? `${error.name}: ${error.message}\n${error.stack}` 
        : String(error);
      
      this.log(`Error during import: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
        debugLogs: this.debugLogs
      };
    }
  }

  /**
   * Process multiple IBKR activity statements in batch
   */
  public async processBatch(contents: string[]): Promise<IBKRImportResult[]> {
    this.logInfo(`Starting batch import of ${contents.length} files`);
    const results: IBKRImportResult[] = [];
    
    // Find pending files
    const pendingFiles = contents.filter(content => content.trim().length > 0);
    this.logInfo(`Found ${pendingFiles.length} pending files to process`);
    
    // Process each file
    for (let i = 0; i < pendingFiles.length; i++) {
      try {
        this.logInfo(`Processing file: ${i + 1}/${pendingFiles.length}`);
        const result = await this.importActivityStatement(pendingFiles[i]);
        results.push(result);
      } catch (error) {
        this.logError(`Error processing file ${i + 1}: ${error}`);
        // Continue with next file instead of failing the batch
      }
    }
    
    this.logInfo(`Batch import completed: ${results.length} successful, ${pendingFiles.length - results.length} failed`);
    
    // Log batch summary
    const totalTrades = results.reduce((sum, result) => sum + (result.totalTrades || 0), 0);
    this.logInfo(`Total trades: ${totalTrades}`);
    
    return results;
  }

  /**
   * Clean and prepare content for parsing
   */
  private cleanContent(content: string): string {
    this.logInfo('Cleaning content...');
    this.logInfo('-------------------- RAW CONTENT PREVIEW --------------------');
    this.logInfo(content.substring(0, 500));
    this.logInfo('-------------------- END OF RAW CONTENT PREVIEW --------------------');
    
    return content;
  }

  /**
   * Convert IBKR account to application Account model
   */
  private convertToAccount(ibkrAccount: IBKRAccount): IBKRAccount {
    return {
      accountId: ibkrAccount.accountId,
      accountName: ibkrAccount.accountName,
      accountType: ibkrAccount.accountType,
      baseCurrency: ibkrAccount.baseCurrency,
      balance: ibkrAccount.balance || 0
    };
  }

  /**
   * Convert IBKR positions to application Position models
   */
  private convertToPositions(ibkrPositions: IBKRPosition[]): IBKRPosition[] {
    return ibkrPositions.map(position => ({
      ...position,
      accountId: position.accountId || 'Unknown'
    }));
  }

  /**
   * Convert IBKR trades to application OptionTrade models
   */
  private convertToTrades(ibkrTrades: IBKRTradeRecord[]): OptionTrade[] {
    return ibkrTrades
      .filter(trade => trade.assetCategory === 'Option')
      .map(trade => {
        const quantity = trade.quantity;
        
        // Determine strategy based on quantity and put/call type
        const strategy = quantity > 0
          ? trade.putCall === 'CALL'
            ? OptionStrategy.LONG_CALL
            : OptionStrategy.LONG_PUT
          : trade.putCall === 'CALL'
            ? OptionStrategy.SHORT_CALL
            : OptionStrategy.SHORT_PUT;
        
        return {
          id: `${trade.symbol}-${Date.now()}`,
          symbol: trade.symbol.split(' ')[0],
          putCall: trade.putCall || 'CALL',
          strike: trade.strike || 0,
          expiry: trade.expiry || new Date(),
          quantity,
          premium: trade.tradePrice,
          strategy,
          openDate: new Date(trade.dateTime),
          commission: trade.commissionFee,
          notes: `Imported from IBKR - ${trade.description}`
        };
      });
  }

  /**
   * Get debug logs
   */
  public getDebugLogs(): string[] {
    return this.debugLogs;
  }

  /**
   * Log info message
   */
  private logInfo(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp}: ${message}`;
    this.debugLogs.push(logEntry);
    console.log(logEntry);
  }

  /**
   * Log error message
   */
  private logError(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp}: ERROR: ${message}`;
    this.debugLogs.push(logEntry);
    console.error(logEntry);
  }

  private log(message: string) {
    this.debugLogs.push(message);
    console.log(`[ImprovedIBKRServiceAdapter] ${message}`);
  }
}

export default new ImprovedIBKRServiceAdapter(); 