import { OptionTrade, OptionStrategy, OptionsPortfolio, calculateTradePL } from '../types/options';
import { safeParseDate } from '../utils/dateUtils';
import { SAMPLE_TRADES } from '../utils/sampleData';
import { PortfolioStats } from '../types/portfolio';

const STORAGE_KEY = 'options_portfolios';

/**
 * Service for managing options trading data
 */
export class OptionService {
  private static portfolios: Map<string, OptionsPortfolio> = new Map();

  /**
   * Check if an option is expired
   */
  private static isOptionExpired(trade: OptionTrade, currentDate: Date = new Date()): boolean {
    const expiry = safeParseDate(trade.expiry);
    return expiry ? expiry <= currentDate : false;
  }

  /**
   * Get options portfolio for an account
   */
  static getOptionsPortfolio(accountId: string): OptionsPortfolio {
    console.log(`Getting options portfolio for account: ${accountId}`);
    
    // Normalize account ID to lowercase for consistency
    const normalizedAccountId = accountId.toLowerCase();
    
    const portfolios = this.getAllPortfolios();
    console.log(`Available portfolios: ${Object.keys(portfolios).join(', ')}`);
    
    // If no portfolio exists for the demo account, create one with sample trades
    if (normalizedAccountId === 'demo1' && !portfolios[normalizedAccountId]) {
      console.log(`Creating demo portfolio for account: ${normalizedAccountId}`);
      const demoPortfolio = {
        id: 'demo1',
        accountId: 'demo1',
        trades: SAMPLE_TRADES,
        cumulativePL: 1600.32 // Hardcoded value for demo account
      };
      this.savePortfolio(demoPortfolio);
      return demoPortfolio;
    }
    
    // If portfolio doesn't exist for this account, create an empty one
    if (!portfolios[normalizedAccountId]) {
      console.log(`Creating new empty portfolio for account: ${normalizedAccountId}`);
      const newPortfolio = {
        id: normalizedAccountId,
        accountId: normalizedAccountId,
        trades: [],
        cumulativePL: 0
      };
      this.savePortfolio(newPortfolio);
      return newPortfolio;
    }
    
    // Calculate cumulative P&L for existing portfolio
    const portfolio = portfolios[normalizedAccountId];
    if (!portfolio.cumulativePL) {
      portfolio.cumulativePL = portfolio.trades.reduce((total, trade) => {
        return total + (trade.tradePL || 0);
      }, 0);
      this.savePortfolio(portfolio);
    }
    
    console.log(`Found existing portfolio for account: ${normalizedAccountId} with ${portfolio.trades.length} trades and P&L: ${portfolio.cumulativePL}`);
    return portfolio;
  }

  /**
   * Get all options portfolios
   */
  static getAllPortfolios(): Record<string, OptionsPortfolio> {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      // Initialize with demo portfolio
      const initialData = {
        'demo1': {
          id: 'demo1',
          accountId: 'demo1',
          trades: SAMPLE_TRADES
        }
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
      return initialData;
    }
    
    const parsedData = JSON.parse(data);
    
    // Convert date strings back to Date objects
    Object.keys(parsedData).forEach(accountId => {
      const portfolio = parsedData[accountId];
      portfolio.trades = portfolio.trades.map((trade: any) => ({
        ...trade,
        openDate: safeParseDate(trade.openDate) || new Date(),
        expiry: safeParseDate(trade.expiry) || new Date(),
        closeDate: trade.closeDate ? safeParseDate(trade.closeDate) : undefined,
        proceeds: typeof trade.premium === 'number' && typeof trade.quantity === 'number' ? trade.premium * trade.quantity * 100 : undefined
      }));
    });
    
    return parsedData;
  }

  /**
   * Save options portfolio
   */
  private static savePortfolio(portfolio: OptionsPortfolio): void {
    const portfolios = this.getAllPortfolios();
    portfolios[portfolio.accountId] = portfolio;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolios));
  }

  /**
   * Add a new trade to an account's portfolio
   */
  static addTrade(accountId: string, trade: Omit<OptionTrade, 'id'>): OptionTrade {
    console.log(`Adding trade to account: ${accountId}`);
    
    // Normalize account ID to lowercase for consistency
    const normalizedAccountId = accountId.toLowerCase();
    
    const portfolio = this.getOptionsPortfolio(normalizedAccountId);
    const newTrade: OptionTrade = {
      ...trade,
      id: `${trade.symbol}-${Date.now()}`
    };
    
    console.log(`Adding trade: ${newTrade.symbol} ${newTrade.putCall} ${newTrade.strike} to portfolio with ${portfolio.trades.length} existing trades`);
    
    portfolio.trades.push(newTrade);
    this.savePortfolio(portfolio);
    
    return newTrade;
  }

  /**
   * Close an existing trade
   */
  static closeTrade(
    accountId: string,
    tradeId: string,
    closeData: { closeDate: Date; closePremium: number }
  ): OptionTrade | null {
    const portfolio = this.getOptionsPortfolio(accountId);
    const tradeIndex = portfolio.trades.findIndex(t => t.id === tradeId);
    
    if (tradeIndex === -1) {
      return null;
    }

    const trade = portfolio.trades[tradeIndex];
    const closedTrade: OptionTrade = {
      ...trade,
      closeDate: closeData.closeDate,
      closePremium: closeData.closePremium
    };

    portfolio.trades[tradeIndex] = closedTrade;
    this.savePortfolio(portfolio);

    return closedTrade;
  }

  /**
   * Delete a trade from an account's portfolio
   */
  static deleteTrade(accountId: string, tradeId: string): boolean {
    console.log(`Deleting trade ${tradeId} from account: ${accountId}`);
    
    // Normalize account ID to lowercase for consistency
    const normalizedAccountId = accountId.toLowerCase();
    
    const portfolio = this.getOptionsPortfolio(normalizedAccountId);
    const initialLength = portfolio.trades.length;
    
    portfolio.trades = portfolio.trades.filter(trade => trade.id !== tradeId);
    
    if (portfolio.trades.length < initialLength) {
      console.log(`Successfully deleted trade ${tradeId} from account ${normalizedAccountId}`);
      this.savePortfolio(portfolio);
      return true;
    }
    
    console.log(`Trade ${tradeId} not found in account ${normalizedAccountId}`);
    return false;
  }

  /**
   * Get open positions for an account
   */
  static getOpenPositions(accountId: string): OptionTrade[] {
    const portfolio = this.getOptionsPortfolio(accountId);
    return portfolio.trades.filter(t => !t.closeDate);
  }

  /**
   * Get closed positions for an account
   */
  static getClosedPositions(accountId: string): OptionTrade[] {
    const portfolio = this.getOptionsPortfolio(accountId);
    return portfolio.trades.filter(t => t.closeDate);
  }

  /**
   * Get expired open positions
   */
  public static getExpiredPositions(accountId: string): OptionTrade[] {
    const openPositions = this.getOpenPositions(accountId);
    const currentDate = new Date();
    
    return openPositions.filter(trade => this.isOptionExpired(trade, currentDate));
  }

  /**
   * Calculate P&L for a trade
   */
  public static calculatePL(trade: OptionTrade): number {
    // If the trade is closed, calculate based on premiums
    if (trade.closeDate && trade.closePremium !== undefined) {
      const openValue = (trade.premium || 0) * trade.quantity * 100;
      const closeValue = trade.closePremium * trade.quantity * 100;
      return closeValue - openValue;
    }
    
    // If the trade is open and has a current price, calculate unrealized P&L
    if (trade.currentPrice !== undefined) {
      const openValue = (trade.premium || 0) * trade.quantity * 100;
      const currentValue = trade.currentPrice * trade.quantity * 100;
      return currentValue - openValue;
    }
    
    return 0;
  }

  /**
   * Calculate total P&L for an account
   */
  public static calculateTotalPL(accountId: string): number {
    const portfolio = this.getOptionsPortfolio(accountId);
    
    return portfolio.trades.reduce((total, trade) => {
      return total + this.calculatePL(trade);
    }, 0);
  }

  /**
   * Calculate average days held for trades
   */
  private static calculateAverageDaysHeld(trades: OptionTrade[]): number {
    const closedTrades = trades.filter(t => t.closeDate);
    if (closedTrades.length === 0) return 0;

    const totalDays = closedTrades.reduce((sum, trade) => {
      const openDate = safeParseDate(trade.openDate);
      const closeDate = safeParseDate(trade.closeDate);
      if (!openDate || !closeDate) return sum;
      return sum + (closeDate.getTime() - openDate.getTime()) / (1000 * 60 * 60 * 24);
    }, 0);

    return totalDays / closedTrades.length;
  }

  /**
   * Calculate portfolio statistics
   */
  static calculateStats(accountId: string | OptionsPortfolio): PortfolioStats {
    console.log('==================== P&L CALCULATION START ====================');
    console.log('Calculating stats for:', typeof accountId === 'string' ? `account ${accountId}` : 'portfolio');
    
    const portfolio = typeof accountId === 'string' 
      ? this.getOptionsPortfolio(accountId)
      : accountId;
      
    console.log('\nPortfolio:', JSON.stringify(portfolio, null, 2));
    
    const trades = portfolio.trades;
    console.log('\n📊 Total number of trades:', trades.length);
    
    // Log P&L calculation for each trade
    console.log('\n💰 Individual Trade P&L Calculations:');
    trades.forEach(trade => {
      const pl = this.calculatePL(trade);
      console.log(`\nTrade ${trade.symbol}:`, JSON.stringify({
        id: trade.id,
        symbol: trade.symbol,
        putCall: trade.putCall,
        strike: trade.strike,
        quantity: trade.quantity,
        premium: trade.premium,
        openDate: trade.openDate,
        closeDate: trade.closeDate,
        closePremium: trade.closePremium,
        strategy: trade.strategy,
        commission: trade.commission,
        calculatedPL: pl
      }, null, 2));
    });

    const openTrades = trades.filter(t => !t.closeDate);
    const closedTrades = trades.filter(t => t.closeDate);
    
    console.log('\n📈 Position Summary:');
    console.log('Open trades:', openTrades.length);
    console.log('Closed trades:', closedTrades.length);

    const totalPL = trades.reduce((sum, trade) => sum + this.calculatePL(trade), 0);
    console.log('\n💵 Total P&L:', totalPL.toFixed(2));

    const winningTrades = closedTrades.filter(t => this.calculatePL(t) > 0);
    const losingTrades = closedTrades.filter(t => this.calculatePL(t) < 0);
    
    console.log('\n🎯 Performance Metrics:');
    console.log('Winning trades:', winningTrades.length);
    console.log('Losing trades:', losingTrades.length);

    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
    console.log('Win rate:', winRate.toFixed(2) + '%');

    const totalWins = winningTrades.reduce((sum, t) => sum + this.calculatePL(t), 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + this.calculatePL(t), 0));

    const stats = {
      totalPL,
      winRate,
      openPositions: openTrades.length,
      closedPositions: closedTrades.length,
      avgDaysHeld: this.calculateAverageDaysHeld(trades),
      totalTrades: trades.length,
      openTrades: openTrades.length,
      closedTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      averageWin: winningTrades.length > 0 ? totalWins / winningTrades.length : 0,
      averageLoss: losingTrades.length > 0 ? totalLosses / losingTrades.length : 0
    };

    console.log('\n📊 Final Stats:', JSON.stringify(stats, null, 2));
    console.log('==================== P&L CALCULATION END ====================\n');

    return stats;
  }

  // Get all options portfolios
  public async getOptionsPortfolios(): Promise<{ [key: string]: OptionsPortfolio }> {
    try {
      const portfoliosJson = localStorage.getItem(STORAGE_KEY);
      if (!portfoliosJson) {
        return {};
      }
      
      const portfolios = JSON.parse(portfoliosJson);
      
      // Convert date strings back to Date objects
      Object.keys(portfolios).forEach(accountId => {
        if (portfolios[accountId].trades) {
          portfolios[accountId].trades = portfolios[accountId].trades.map((trade: any) => ({
            ...trade,
            openDate: trade.openDate ? new Date(trade.openDate) : undefined,
            closeDate: trade.closeDate ? new Date(trade.closeDate) : undefined,
            expiry: trade.expiry ? new Date(trade.expiry) : undefined,
            proceeds: typeof trade.premium === 'number' && typeof trade.quantity === 'number' ? trade.premium * trade.quantity * 100 : undefined
          }));
        }
      });
      
      return portfolios;
    } catch (error) {
      console.error('Error getting options portfolios:', error);
      return {};
    }
  }

  // Get options portfolio for a specific account
  public async getOptionsPortfolio(accountId: string): Promise<OptionsPortfolio> {
    try {
      console.log(`Getting options portfolio for account: ${accountId}`);
      // Get portfolios from storage
      const portfolios = await this.getOptionsPortfolios();
      console.log(`Retrieved portfolios for accounts: ${Object.keys(portfolios).join(', ')}`);
      
      // Check if this account has a portfolio
      let portfolio = portfolios[accountId];
      
      // If no portfolio exists, create a new one
      if (!portfolio) {
        console.log(`No portfolio found for account ${accountId}, creating new one`);
        
        // For demo account, use sample data
        if (accountId === 'demo1') {
          portfolio = {
            id: `portfolio-${accountId}`,
            accountId,
            trades: this.getSampleTrades()
          };
        } else {
          // For other accounts, create an empty portfolio
          portfolio = {
            id: `portfolio-${accountId}`,
            accountId,
            trades: []
          };
        }
        
        // Save the new portfolio
        portfolios[accountId] = portfolio;
        await this.saveOptionsPortfolios(portfolios);
      }
      
      console.log(`Portfolio for ${accountId} has ${portfolio.trades.length} trades`);
      return portfolio;
    } catch (error) {
      console.error(`Error getting options portfolio for ${accountId}:`, error);
      return {
        id: `portfolio-${accountId}`,
        accountId,
        trades: []
      };
    }
  }

  // Add a trade to an options portfolio
  public async addTrade(accountId: string, trade: OptionTrade): Promise<boolean> {
    try {
      console.log(`Adding trade to portfolio for account ${accountId}:`, trade);
      
      // Get the portfolio
      const portfolios = await this.getOptionsPortfolios();
      let portfolio = portfolios[accountId];
      
      // Create portfolio if it doesn't exist
      if (!portfolio) {
        portfolio = {
          id: `portfolio-${accountId}`,
          accountId,
          trades: []
        };
        portfolios[accountId] = portfolio;
      }
      
      // Add the trade
      portfolio.trades.push(trade);
      
      // Save portfolios
      await this.saveOptionsPortfolios(portfolios);
      console.log(`Successfully added trade to portfolio. New trade count: ${portfolio.trades.length}`);
      return true;
    } catch (error) {
      console.error(`Error adding trade to portfolio for ${accountId}:`, error);
      return false;
    }
  }

  // Close a trade in an options portfolio
  public async closeTrade(accountId: string, tradeId: string, closeDate: Date, closePremium: number): Promise<boolean> {
    try {
      console.log(`Closing trade ${tradeId} in portfolio for account ${accountId}`);
      
      // Get the portfolio
      const portfolios = await this.getOptionsPortfolios();
      const portfolio = portfolios[accountId];
      
      if (!portfolio) {
        console.error(`Portfolio not found for account ${accountId}`);
        return false;
      }
      
      // Find the trade
      const tradeIndex = portfolio.trades.findIndex(t => t.id === tradeId);
      if (tradeIndex === -1) {
        console.error(`Trade ${tradeId} not found in portfolio for account ${accountId}`);
        return false;
      }
      
      // Update the trade
      portfolio.trades[tradeIndex] = {
        ...portfolio.trades[tradeIndex],
        closeDate,
        closePremium
      };
      
      // Save portfolios
      await this.saveOptionsPortfolios(portfolios);
      console.log(`Successfully closed trade ${tradeId} in portfolio for account ${accountId}`);
      return true;
    } catch (error) {
      console.error(`Error closing trade ${tradeId} in portfolio for account ${accountId}:`, error);
      return false;
    }
  }

  // Calculate P&L for a specific account
  public static async calculateAccountPL(accountId: string): Promise<number> {
    try {
      const portfolio = await this.getOptionsPortfolio(accountId);
      return portfolio.trades.reduce((total, trade) => {
        return total + this.calculatePL(trade);
      }, 0);
    } catch (error) {
      console.error(`Error calculating P&L for account ${accountId}:`, error);
      return 0;
    }
  }

  // Get sample trades for demo account
  private getSampleTrades(): OptionTrade[] {
    return [
      {
        id: '1',
        symbol: 'SPY',
        putCall: 'CALL',
        strike: 420,
        expiry: new Date('2025-12-15'),
        quantity: 1,
        premium: 5.25,
        openDate: new Date('2025-11-01'),
        closeDate: new Date('2025-11-15'),
        closePremium: 7.50,
        strategy: OptionStrategy.LONG_CALL,
        commission: 1.25,
        realizedPL: 225.00,
        notes: 'Demo trade. Realized P&L: 225.00'
      },
      {
        id: '2',
        symbol: 'AAPL',
        putCall: 'PUT',
        strike: 180,
        expiry: new Date('2025-12-15'),
        quantity: -2,
        premium: 3.75,
        openDate: new Date('2025-11-05'),
        closeDate: new Date('2025-11-20'),
        closePremium: 1.25,
        strategy: OptionStrategy.SHORT_PUT,
        commission: 2.50,
        realizedPL: 500.00,
        notes: 'Demo trade. Realized P&L: 500.00'
      }
    ];
  }

  // 2. Add a direct method to save trades to a specific portfolio
  public async saveTradeToPortfolio(accountId: string, trade: OptionTrade): Promise<boolean> {
    try {
      console.log(`Saving trade to portfolio for account ${accountId}:`, trade);
      
      // Get the portfolio
      const portfolios = await this.getOptionsPortfolios();
      let portfolio = portfolios[accountId];
      
      // Create portfolio if it doesn't exist
      if (!portfolio) {
        portfolio = {
          id: `portfolio-${accountId}`,
          accountId,
          trades: []
        };
        portfolios[accountId] = portfolio;
      }
      
      // Check if trade already exists
      const existingIndex = portfolio.trades.findIndex(t => 
        t.id === trade.id || (
          t.symbol === trade.symbol &&
          t.putCall === trade.putCall &&
          t.strike === trade.strike &&
          t.expiry.getTime() === new Date(trade.expiry).getTime() &&
          Math.abs(new Date(t.openDate).getTime() - new Date(trade.openDate).getTime()) < 86400000 // Within 1 day
        )
      );
      
      if (existingIndex >= 0) {
        // Update existing trade
        console.log(`Updating existing trade at index ${existingIndex}`);
        portfolio.trades[existingIndex] = {
          ...portfolio.trades[existingIndex],
          ...trade,
          id: portfolio.trades[existingIndex].id // Keep original ID
        };
      } else {
        // Add new trade
        console.log(`Adding new trade with ID ${trade.id}`);
        portfolio.trades.push(trade);
      }
      
      // Save portfolios
      await this.saveOptionsPortfolios(portfolios);
      console.log(`Successfully saved trade to portfolio. New trade count: ${portfolio.trades.length}`);
      return true;
    } catch (error) {
      console.error(`Error saving trade to portfolio for ${accountId}:`, error);
      return false;
    }
  }

  // 3. Fix the saveOptionsPortfolios method to handle Date objects properly
  private async saveOptionsPortfolios(portfolios: { [key: string]: OptionsPortfolio }): Promise<void> {
    try {
      // Prepare portfolios for storage - convert Date objects to strings
      const portfoliosToSave = JSON.parse(JSON.stringify(portfolios));
      
      // Log portfolios before saving
      console.log(`Saving portfolios for accounts: ${Object.keys(portfoliosToSave).join(', ')}`);
      
      // Store in localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(portfoliosToSave));
    } catch (error) {
      console.error('Error saving options portfolios:', error);
      throw error;
    }
  }

  // 4. Add a method to save a batch of trades at once
  public async saveTradesToPortfolio(accountId: string, trades: OptionTrade[]): Promise<number> {
    try {
      console.log(`Saving ${trades.length} trades to portfolio for account ${accountId}`);
      
      // Get the portfolio
      const portfolios = await this.getOptionsPortfolios();
      let portfolio = portfolios[accountId];
      
      // Create portfolio if it doesn't exist
      if (!portfolio) {
        portfolio = {
          id: `portfolio-${accountId}`,
          accountId,
          trades: []
        };
        portfolios[accountId] = portfolio;
      }
      
      let addedCount = 0;
      let updatedCount = 0;
      
      // Process each trade
      for (const trade of trades) {
        // Check if trade already exists
        const existingIndex = portfolio.trades.findIndex(t => 
          t.id === trade.id || (
            t.symbol === trade.symbol &&
            t.putCall === trade.putCall &&
            t.strike === trade.strike &&
            t.expiry.getTime() === new Date(trade.expiry).getTime() &&
            Math.abs(new Date(t.openDate).getTime() - new Date(trade.openDate).getTime()) < 86400000 // Within 1 day
          )
        );
        
        if (existingIndex >= 0) {
          // Update existing trade
          portfolio.trades[existingIndex] = {
            ...portfolio.trades[existingIndex],
            ...trade,
            id: portfolio.trades[existingIndex].id // Keep original ID
          };
          updatedCount++;
        } else {
          // Add new trade
          portfolio.trades.push(trade);
          addedCount++;
        }
      }
      
      // Save portfolios
      await this.saveOptionsPortfolios(portfolios);
      console.log(`Successfully saved trades to portfolio. Added: ${addedCount}, Updated: ${updatedCount}`);
      return addedCount + updatedCount;
    } catch (error) {
      console.error(`Error saving trades to portfolio for ${accountId}:`, error);
      return 0;
    }
  }

  // Calculate total P&L for a portfolio
  public static calculatePortfolioPL(portfolio: OptionsPortfolio): number {
    return portfolio.trades.reduce((total, trade) => {
      return total + OptionService.calculatePL(trade);
    }, 0);
  }

  // Analyze trades and generate statistics
  public static analyzeTrades(trades: OptionTrade[]): void {
    try {
      console.log('\n📊 Trade Analysis');
      console.log('Total trades:', trades.length);
      
      const closedTrades = trades.filter(t => t.closeDate);
      console.log('Closed trades:', closedTrades.length);

      const totalPL = trades.reduce((sum, trade) => sum + OptionService.calculatePL(trade), 0);
      console.log('\n💵 Total P&L:', totalPL.toFixed(2));

      const winningTrades = closedTrades.filter(t => OptionService.calculatePL(t) > 0);
      const losingTrades = closedTrades.filter(t => OptionService.calculatePL(t) < 0);
      
      console.log('\n🎯 Performance Metrics:');
      console.log('Winning trades:', winningTrades.length);
      console.log('Losing trades:', losingTrades.length);
      
      const winRate = closedTrades.length > 0 
        ? (winningTrades.length / closedTrades.length) * 100 
        : 0;
      console.log('Win rate:', winRate.toFixed(2) + '%');

      const totalWins = winningTrades.reduce((sum, t) => sum + OptionService.calculatePL(t), 0);
      const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + OptionService.calculatePL(t), 0));

      const stats = {
        totalTrades: trades.length,
        closedTrades: closedTrades.length,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        winRate,
        totalPL,
        totalWins,
        totalLosses,
        averageWin: winningTrades.length > 0 ? totalWins / winningTrades.length : 0,
        averageLoss: losingTrades.length > 0 ? totalLosses / losingTrades.length : 0
      };

      console.log('\n📈 Summary Statistics:', stats);
    } catch (error) {
      console.error('Error analyzing trades:', error);
    }
  }
} 