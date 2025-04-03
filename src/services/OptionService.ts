import { OptionTrade, OptionsPortfolio, OptionPortfolioStats, calculateTradePL } from '../types/options';
import { safeParseDate } from '../utils/dateUtils';
import { SAMPLE_TRADES } from '../utils/sampleData';

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
    const portfolios = this.getAllPortfolios();
    
    // If no portfolio exists for the demo account, create one with sample trades
    if (accountId === 'demo1' && !portfolios[accountId]) {
      const demoPortfolio = {
        id: 'demo1',
        accountId: 'demo1',
        trades: SAMPLE_TRADES
      };
      this.savePortfolio(demoPortfolio);
      return demoPortfolio;
    }
    
    return portfolios[accountId] || { id: accountId, accountId, trades: [] };
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
        closeDate: trade.closeDate ? safeParseDate(trade.closeDate) : undefined
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
    const portfolio = this.getOptionsPortfolio(accountId);
    const newTrade: OptionTrade = {
      ...trade,
      id: `${trade.symbol}-${Date.now()}`
    };
    
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
   * Delete a trade
   */
  static deleteTrade(accountId: string, tradeId: string): boolean {
    const portfolio = this.getOptionsPortfolio(accountId);
    const initialLength = portfolio.trades.length;
    
    portfolio.trades = portfolio.trades.filter(t => t.id !== tradeId);
    
    if (portfolio.trades.length < initialLength) {
      this.savePortfolio(portfolio);
      return true;
    }
    
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
    return calculateTradePL(trade);
  }

  /**
   * Calculate total P&L for an account
   */
  public static calculateTotalPL(accountId: string): number {
    const portfolio = this.getOptionsPortfolio(accountId);
    
    return portfolio.trades.reduce((total, trade) => {
      return total + calculateTradePL(trade);
    }, 0);
  }

  /**
   * Calculate portfolio statistics
   */
  static calculateStats(portfolio: OptionsPortfolio): OptionPortfolioStats {
    const trades = portfolio.trades;
    const closedTrades = trades.filter(t => t.closeDate);
    const openTrades = trades.filter(t => !t.closeDate);
    
    const totalPL = trades.reduce((sum, trade) => sum + calculateTradePL(trade), 0);
    const winningTrades = closedTrades.filter(t => calculateTradePL(t) > 0);
    const losingTrades = closedTrades.filter(t => calculateTradePL(t) < 0);
    
    const totalWins = winningTrades.reduce((sum, t) => sum + calculateTradePL(t), 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + calculateTradePL(t), 0));
    
    // Calculate average days to expiry for open positions
    const totalDaysToExpiry = openTrades.reduce((sum, trade) => {
      const days = (trade.expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    
    return {
      totalTrades: trades.length,
      openTrades: openTrades.length,
      closedTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: closedTrades.length > 0 ? winningTrades.length / closedTrades.length : 0,
      averageWin: winningTrades.length > 0 ? totalWins / winningTrades.length : 0,
      averageLoss: losingTrades.length > 0 ? totalLosses / losingTrades.length : 0,
      totalPL,
      averageDaysToExpiry: openTrades.length > 0 ? totalDaysToExpiry / openTrades.length : 0
    };
  }
} 