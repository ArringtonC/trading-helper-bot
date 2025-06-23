import improvedIBKRServiceAdapter from './ImprovedIBKRServiceAdapter';
import { IBKRService } from './IBKRService';
import { AccountService } from './AccountService';
import { OptionService } from './OptionService';
import { OptionTrade } from '../../types/options';
import { Account, AccountType } from '../../types/account';
import { IBKRImportResult, IBKRTradeRecord } from '../types/ibkr';

interface ImportSummary {
  accountId: string;
  accountName: string;
  totalTrades: number;
  newTrades: number;
  updatedTrades: number;
  positions: number;
  errors: string[];
  warnings: string[];
}

interface BatchImportSummary {
  totalFiles: number;
  successfulFiles: number;
  failedFiles: number;
  accounts: string[];
  totalTrades: number;
  newTrades: number;
  updatedTrades: number;
  positions: number;
  errors: string[];
  warnings: string[];
}

/**
 * Integration service to bring together the original and improved IBKR services
 */
export class IBKRIntegrationService {
  private debugLogs: string[] = [];
  
  /**
   * Import a single IBKR activity statement
   * @param content The raw content of the IBKR activity statement
   * @param useImprovedParser Whether to use the improved parser (defaults to true)
   */
  public async importActivityStatement(
    content: string, 
    useImprovedParser: boolean = true
  ): Promise<ImportSummary> {
    this.logInfo(`Starting import process...`);
    this.logInfo(`Using ${useImprovedParser ? 'improved' : 'original'} parser`);
    this.logInfo(`Content length: ${content.length} characters`);
    this.logInfo(`Content preview: ${content.substring(0, 100)}...`);
    
    try {
      // Parse the content using the selected parser
      let result: IBKRImportResult;
      if (useImprovedParser) {
        this.logInfo(`Using improved parser...`);
        result = await improvedIBKRServiceAdapter.importActivityStatement(content);
        
        // Add logs from the improved adapter
        this.debugLogs = this.debugLogs.concat(improvedIBKRServiceAdapter.getDebugLogs());
      } else {
        this.logInfo(`Using original parser...`);
        result = await IBKRService.parseActivityStatement(content);
        // Convert positions to option trades for the original parser
        result.optionTrades = IBKRService.convertToOptionTrades(result);
      }
      
      const { account, positions, optionTrades } = result;
      
      if (account) {
        this.logInfo(`Parsed account: ${account.accountName} (${account.accountId})`);
      } else {
        this.logInfo('No account information found in the import result');
      }
      
      if (Array.isArray(positions)) {
        this.logInfo(`Found ${positions.length} positions`);
      } else {
        this.logInfo('No positions found in the import result');
      }
      
      if (optionTrades) {
        this.logInfo(`Found ${optionTrades.length} option trades`);
      } else {
        this.logInfo('No option trades found in the import result');
      }
      
      // Save the account if it doesn't exist
      if (account) {
        const existingAccounts = await AccountService.getAccounts();
        const existingAccount = existingAccounts.find((a: Account) => a.id === account.accountId);
        
        if (!existingAccount) {
          this.logInfo(`Creating new account: ${account.accountName} (${account.accountId})`);
          const newAccount: Account = {
            id: account.accountId,
            name: account.accountName,
            type: AccountType.IBKR,
            balance: account.balance,
            created: new Date(),
            lastUpdated: new Date()
          };
          
          await AccountService.addAccount(newAccount);
          this.logInfo(`Account created: ${newAccount.name}`);
        } else {
          this.logInfo(`Account already exists: ${existingAccount.name}`);
        }
      }
      
      // Save the trades
      if (optionTrades && account) {
        this.logInfo(`Saving ${optionTrades.length} option trades to database...`);
        
        const savedTradeResults = await Promise.all(
          optionTrades.map((trade: OptionTrade) => this.saveTrade(account.accountId, trade))
        );
        
        // Count new vs updated trades
        const newTrades = savedTradeResults.filter(r => r.isNew).length;
        const updatedTrades = savedTradeResults.filter(r => !r.isNew).length;
        
        this.logInfo(`Saved ${newTrades} new trades and updated ${updatedTrades} existing trades`);
        
        // Create summary
        const summary: ImportSummary = {
          accountId: account.accountId,
          accountName: account.accountName,
          totalTrades: optionTrades.length,
          newTrades,
          updatedTrades,
          positions: Array.isArray(positions) ? positions.length : 0,
          errors: [],
          warnings: []
        };
        
        return summary;
      } else {
        this.logInfo('No trades to save or account information missing');
        return {
          accountId: account?.accountId || 'unknown',
          accountName: account?.accountName || 'unknown',
          totalTrades: 0,
          newTrades: 0,
          updatedTrades: 0,
          positions: 0,
          errors: [],
          warnings: []
        };
      }
    } catch (error) {
      this.logError(`Error importing IBKR activity statement: ${error}`);
      this.logError(`Error stack: ${error instanceof Error ? error.stack : 'No stack trace available'}`);
      
      // Create error summary
      const summary: ImportSummary = {
        accountId: 'UNKNOWN',
        accountName: 'UNKNOWN',
        totalTrades: 0,
        newTrades: 0,
        updatedTrades: 0,
        positions: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: []
      };
      
      return summary;
    }
  }
  
  /**
   * Import multiple IBKR activity statements
   * @param contentArray Array of IBKR activity statement contents
   * @param useImprovedParser Whether to use the improved parser (defaults to true)
   */
  public async importMultipleStatements(
    contentArray: string[],
    useImprovedParser: boolean = true
  ): Promise<BatchImportSummary> {
    this.logInfo(`Starting batch import of ${contentArray.length} files`);
    this.logInfo(`Using ${useImprovedParser ? 'improved' : 'original'} parser`);
    
    // Find non-empty files
    const nonEmptyContents = contentArray.filter(content => content && content.trim().length > 0);
    this.logInfo(`Found ${nonEmptyContents.length} non-empty files to process`);
    
    const summaries: ImportSummary[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Process each file
    for (let i = 0; i < nonEmptyContents.length; i++) {
      try {
        this.logInfo(`Processing file ${i + 1}/${nonEmptyContents.length}`);
        
        // Get a sample of the file content for logging
        const contentSample = nonEmptyContents[i].substring(0, 100);
        this.logInfo(`File content preview: ${contentSample}...`);
        
        // Import the file
        const summary = await this.importActivityStatement(nonEmptyContents[i], useImprovedParser);
        summaries.push(summary);
        
        // Collect any errors and warnings
        errors.push(...summary.errors);
        warnings.push(...summary.warnings);
        
        this.logInfo(`Successfully processed file ${i + 1}`);
      } catch (error) {
        this.logError(`Error processing file ${i + 1}: ${error}`);
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }
    
    // Calculate batch summary
    const batchSummary: BatchImportSummary = {
      totalFiles: nonEmptyContents.length,
      successfulFiles: summaries.length,
      failedFiles: nonEmptyContents.length - summaries.length,
      accounts: Array.from(new Set(summaries.map(s => s.accountId))),
      totalTrades: summaries.reduce((sum, s) => sum + s.totalTrades, 0),
      newTrades: summaries.reduce((sum, s) => sum + s.newTrades, 0),
      updatedTrades: summaries.reduce((sum, s) => sum + s.updatedTrades, 0),
      positions: summaries.reduce((sum, s) => sum + s.positions, 0),
      errors,
      warnings
    };
    
    this.logInfo(`Batch import completed: ${batchSummary.successfulFiles} successful, ${batchSummary.failedFiles} failed`);
    this.logInfo(`Total trades: ${batchSummary.totalTrades} (${batchSummary.newTrades} new, ${batchSummary.updatedTrades} updated)`);
    
    return batchSummary;
  }
  
  /**
   * Save or update a trade
   */
  private async saveTrade(accountId: string, trade: OptionTrade): Promise<{ isNew: boolean }> {
    try {
      // Check if the trade already exists
      const existingTrades = await OptionService.getOpenPositions(accountId);
      const existingTrade = existingTrades.find((t: OptionTrade) => 
        t.symbol === trade.symbol &&
        t.strike === trade.strike &&
        t.putCall === trade.putCall &&
        t.expiry.getTime() === trade.expiry.getTime() &&
        t.openDate.getTime() === trade.openDate.getTime()
      );
      
      if (existingTrade) {
        // Update existing trade
        await OptionService.closeTrade(accountId, existingTrade.id, {
          closeDate: new Date(),
          closePremium: trade.premium || 0
        });
        return { isNew: false };
      } else {
        // Add new trade
        await OptionService.addTrade(accountId, trade);
        return { isNew: true };
      }
    } catch (error) {
      this.logError(`Error saving trade: ${error}`);
      throw error;
    }
  }
  
  /**
   * Get debug logs
   */
  public getDebugLogs(): string[] {
    return this.debugLogs;
  }
  
  /**
   * Clear debug logs
   */
  public clearDebugLogs(): void {
    this.debugLogs = [];
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
}

export default new IBKRIntegrationService(); 