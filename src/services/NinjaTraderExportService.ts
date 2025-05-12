import { OptionTrade } from '../types/options';
import { formatDateForDisplay } from '../utils/dateUtils';

export interface NinjaTraderExportOptions {
  strategyName: string;
  dateRange?: { start: Date; end: Date };
  includeClosedTrades: boolean;
}

export class NinjaTraderExportService {
  /**
   * Generate filename for export based on strategy and date
   */
  private generateFilename(strategyName: string, optionType: 'CALL' | 'PUT'): string {
    const currentDate = formatDateForDisplay(new Date(), 'yyyyMMdd');
    const typeSuffix = optionType === 'CALL' ? 'calls' : 'puts';
    return `${strategyName}_${typeSuffix}_${currentDate}.csv`;
  }

  /**
   * Convert trades to NinjaTrader format
   * Separate handling for calls and puts
   */
  private formatTradesForNinjaTrader(trades: OptionTrade[], optionType: 'CALL' | 'PUT'): string {
    // NinjaTrader headers
    const headers = [
      "Date", "Time", "Symbol", "Strike", "Expiry", "Type", 
      "Action", "Quantity", "Price", "Commission", "Account"
    ].join(",");

    // Filter trades by option type
    const filteredTrades = trades.filter(trade => trade.putCall === optionType);

    // Format each trade according to NinjaTrader requirements
    const rows = filteredTrades.map(trade => {
      const [date, time] = new Date(trade.openDate).toISOString().split('T');
      return [
        date,
        time.substring(0, 8),
        trade.symbol,
        trade.strike,
        formatDateForDisplay(new Date(trade.expiry), 'yyyyMMdd'),
        trade.putCall === 'CALL' ? 'Call' : 'Put',
        trade.quantity > 0 ? 'Buy' : 'Sell',
        Math.abs(trade.quantity),
        trade.premium,
        trade.commission || 0,
        'Default' // Using default account since OptionTrade doesn't have account property
      ].join(",");
    });

    return [headers, ...rows].join("\n");
  }

  /**
   * Export options trades to NinjaTrader format
   */
  public exportToNinjaTrader(
    trades: OptionTrade[], 
    options: NinjaTraderExportOptions
  ): { callsFile: { name: string, content: string }, putsFile: { name: string, content: string } } {
    
    // Filter trades by date range if provided
    let filteredTrades = [...trades];
    if (options.dateRange) {
      const { start, end } = options.dateRange;
      filteredTrades = filteredTrades.filter(trade => {
        const tradeDate = new Date(trade.openDate);
        return tradeDate >= start && tradeDate <= end;
      });
    }

    // Only include closed trades if specified
    if (!options.includeClosedTrades) {
      filteredTrades = filteredTrades.filter(trade => !trade.closeDate);
    }

    // Create separate files for calls and puts
    const callsContent = this.formatTradesForNinjaTrader(filteredTrades, 'CALL');
    const putsContent = this.formatTradesForNinjaTrader(filteredTrades, 'PUT');

    return {
      callsFile: {
        name: this.generateFilename(options.strategyName, 'CALL'),
        content: callsContent
      },
      putsFile: {
        name: this.generateFilename(options.strategyName, 'PUT'),
        content: putsContent
      }
    };
  }

  /**
   * Trigger download of export files
   */
  public downloadExportFiles(
    callsFile: { name: string, content: string },
    putsFile: { name: string, content: string }
  ): void {
    // Helper function to trigger download
    const triggerDownload = (filename: string, content: string) => {
      const blob = new Blob([content], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    // Download both files
    triggerDownload(callsFile.name, callsFile.content);
    setTimeout(() => {
      triggerDownload(putsFile.name, putsFile.content);
    }, 100); // Small delay to avoid browser blocking multiple downloads
  }
}

const ninjaTraderExportService = new NinjaTraderExportService();
export default ninjaTraderExportService; 