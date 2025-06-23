import { OptionTrade, OptionsPortfolio, OptionPortfolioStats, calculateTradePL } from '../../types/options';

export class OptionsService {
  private static portfolios: Map<string, OptionsPortfolio> = new Map();

  /**
   * Get portfolio for an account
   */
  private static getPortfolio(accountId: string): OptionsPortfolio {
    if (!this.portfolios.has(accountId)) {
      this.portfolios.set(accountId, {
        id: accountId,
        accountId,
        trades: []
      });
    }
    return this.portfolios.get(accountId)!;
  }

  /**
   * Calculate portfolio statistics
   */
  public static calculateStats(accountId: string): OptionPortfolioStats {
    const portfolio = this.getPortfolio(accountId);
    const trades = portfolio.trades;
    const closedTrades = trades.filter((t: OptionTrade) => t.closeDate);
    const openTrades = trades.filter((t: OptionTrade) => !t.closeDate);
    const winningTrades = closedTrades.filter((t: OptionTrade) => calculateTradePL(t) > 0);
    const losingTrades = closedTrades.filter((t: OptionTrade) => calculateTradePL(t) < 0);
    
    const totalWins = winningTrades.reduce((sum: number, t: OptionTrade) => sum + calculateTradePL(t), 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum: number, t: OptionTrade) => sum + calculateTradePL(t), 0));
    const totalPL = trades.reduce((sum: number, t: OptionTrade) => sum + calculateTradePL(t), 0);
    
    // Calculate average days to expiry for open positions
    const totalDaysToExpiry = openTrades.reduce((sum: number, trade: OptionTrade) => {
      const days = (trade.expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);

    return {
      totalTrades: trades.length,
      openTrades: trades.length - closedTrades.length,
      closedTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0,
      averageWin: winningTrades.length > 0 ? totalWins / winningTrades.length : 0,
      averageLoss: losingTrades.length > 0 ? totalLosses / losingTrades.length : 0,
      totalPL,
      averageDaysToExpiry: openTrades.length > 0 ? totalDaysToExpiry / openTrades.length : 0
    };
  }
} 