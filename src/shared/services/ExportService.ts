import { AccountService } from './AccountService';
import { OptionService } from './OptionService';
import { ProjectionService } from './ProjectionService';
import { OptionTrade, OptionsPortfolio } from '../../types/options';

/**
 * Service for exporting account and trading data
 */
export class ExportService {
  
  /**
   * Export the current capabilities and state of the system
   * @returns CSV string containing capabilities data
   */
  public static exportCapabilities(): string {
    const accounts = AccountService.getAccounts();
    
    let csv = 'Trading Helper Bot - Capabilities Export\n';
    csv += `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n\n`;
    
    // System Overview
    csv += 'System Overview\n';
    csv += 'Module,Status,Features,Limitations\n';
    csv += `Account Management,Implemented,"Account dashboard, balance tracking, projections",${accounts.length} account(s)\n`;
    csv += 'Options Trading,Implemented,"Trade tracking, P&L calculation, IBKR import",Basic analytics only\n';
    csv += 'Futures Trading,Planned,"Coming in June",Not yet implemented\n';
    csv += 'AI Strategies,Planned,"Coming in September",Not yet implemented\n\n';
    
    // Account Information
    csv += 'Account Information\n';
    csv += 'ID,Name,Type,Balance,Last Updated\n';
    
    accounts.forEach(account => {
      csv += `${account.id},${account.name},${account.type},${account.balance.toFixed(2)},${account.lastUpdated.toLocaleDateString()}\n`;
    });
    
    csv += '\n';
    
    // Options Trading Statistics
    csv += 'Options Trading Statistics\n';
    csv += 'Account ID,Open Positions,Closed Positions,Win Rate,Total P&L\n';
    
    accounts.forEach(account => {
      const optionsPortfolio = OptionService.getOptionsPortfolio(account.id);
      const stats = OptionService.calculateStats(optionsPortfolio);
      
      csv += `${account.id},${stats.openTrades},${stats.closedTrades},${(stats.winRate * 100).toFixed(1)}%,$${stats.totalPL.toFixed(2)}\n`;
    });
    
    csv += '\n';
    
    // Open Positions
    csv += 'Open Positions\n';
    csv += 'Account ID,Symbol,Type,Strike,Expiry,Quantity,Premium,Open Date,Days to Expiry\n';
    
    accounts.forEach(account => {
      const openPositions = OptionService.getOpenPositions(account.id);
      
      openPositions.forEach(position => {
        const daysToExpiry = Math.max(0, Math.floor((position.expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
        
        csv += `${account.id},${position.symbol},${position.putCall},${position.strike.toFixed(2)},${position.expiry.toLocaleDateString()},${position.quantity},${(position.premium || 0).toFixed(2)},${position.openDate.toLocaleDateString()},${daysToExpiry}\n`;
      });
    });
    
    csv += '\n';
    
    // Technical Specifications
    csv += 'Technical Specifications\n';
    csv += 'Component,Specification\n';
    csv += 'Frontend,React with TypeScript\n';
    csv += 'UI Framework,Tailwind CSS\n';
    csv += 'Charts,Recharts\n';
    csv += 'Storage,Local storage (browser-based)\n';
    csv += 'Version,April 2025 Release\n\n';
    
    // Known Limitations
    csv += 'Known Limitations\n';
    csv += 'Limitation\n';
    csv += 'No real-time market data integration\n';
    csv += 'Local storage only (no cloud synchronization)\n';
    csv += 'Basic options analytics (no Greeks)\n';
    csv += 'No multi-leg strategy builder\n';
    csv += 'Limited historical analysis\n';
    
    return csv;
  }
  
  /**
   * Export option trades for an account
   * @param accountId Account ID to export trades for
   * @returns CSV string containing option trades
   */
  public static exportOptionTrades(accountId: string): string {
    const account = AccountService.getAccountById(accountId);
    
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }
    
    const openPositions = OptionService.getOpenPositions(accountId);
    const closedPositions = OptionService.getClosedPositions(accountId);
    const allTrades = [...openPositions, ...closedPositions];
    
    let csv = `Option Trades Export - ${account.name}\n`;
    csv += `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n\n`;
    
    csv += 'ID,Symbol,Type,Strike,Expiry,Quantity,Premium,Open Date,Close Date,Close Premium,P&L,Strategy,Notes\n';
    
    allTrades.forEach(trade => {
      const pl = OptionService.calculatePL(trade);
      
      csv += `${trade.id},${trade.symbol},${trade.putCall},${trade.strike.toFixed(2)},${trade.expiry.toLocaleDateString()},${trade.quantity},${(trade.premium || 0).toFixed(2)},${trade.openDate.toLocaleDateString()},${trade.closeDate ? trade.closeDate.toLocaleDateString() : ''},${trade.closePremium ? trade.closePremium.toFixed(2) : ''},${pl.toFixed(2)},${trade.strategy || ''},${trade.notes || ''}\n`;
    });
    
    return csv;
  }
  
  /**
   * Export account projections
   * @param accountId Account ID to export projections for
   * @returns CSV string containing projections
   */
  public static exportProjections(accountId: string): string {
    const account = AccountService.getAccountById(accountId);
    
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }
    
    const projections = ProjectionService.calculateYearlyProjections(account);
    
    let csv = `Account Projections Export - ${account.name}\n`;
    csv += `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n\n`;
    
    csv += 'Month,Projected Balance\n';
    
    projections.forEach(projection => {
      csv += `${projection.month},${projection.balance.toFixed(2)}\n`;
    });
    
    return csv;
  }
  
  /**
   * Generate a downloadable file from CSV content
   * @param csvContent CSV content as string
   * @param fileName Name for the download file
   */
  public static downloadCSV(csvContent: string, fileName: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Export open positions to CSV
export const exportOpenPositionsToCSV = (portfolios: Record<string, OptionsPortfolio>): string => {
  let csv = 'Account,Symbol,Type,Strike,Expiry,Quantity,Premium,OpenDate,DaysToExpiry\n';
  
  Object.entries(portfolios).forEach(([accountId, account]) => {
    account.trades
      .filter((position: OptionTrade) => !position.closeDate)
      .forEach((position: OptionTrade) => {
        const daysToExpiry = Math.max(0, Math.floor((position.expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
        
        csv += `${account.id},${position.symbol},${position.putCall},${position.strike.toFixed(2)},${position.expiry.toLocaleDateString()},${position.quantity},${(position.premium || 0).toFixed(2)},${position.openDate.toLocaleDateString()},${daysToExpiry}\n`;
      });
  });
  
  return csv;
};

// Export trades to CSV
export const exportTradesToCSV = (trades: OptionTrade[]): string => {
  let csv = 'ID,Symbol,Type,Strike,Expiry,Quantity,Premium,OpenDate,CloseDate,ClosePremium,P&L,Strategy,Notes\n';
  
  trades.forEach(trade => {
    const pl = OptionService.calculatePL(trade);
    
    csv += `${trade.id},${trade.symbol},${trade.putCall},${trade.strike.toFixed(2)},${trade.expiry.toLocaleDateString()},${trade.quantity},${(trade.premium || 0).toFixed(2)},${trade.openDate.toLocaleDateString()},${trade.closeDate ? trade.closeDate.toLocaleDateString() : ''},${trade.closePremium ? trade.closePremium.toFixed(2) : ''},${pl.toFixed(2)},${trade.strategy || ''},${trade.notes || ''}\n`;
  });
  
  return csv;
}; 