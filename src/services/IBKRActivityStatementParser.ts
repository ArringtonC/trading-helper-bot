import { OptionTrade, OptionStrategy } from '../types/options';

// Define interfaces for IBKR data structure
interface IBKRAccountInfo {
  accountId: string;
  accountName: string;
  accountType: string;
  baseCurrency: string;
  balance: number;
}

interface IBKRTradeRecord {
  assetCategory: string;
  currency: string;
  symbol: string;
  dateTime: string;
  quantity: number;
  tradePrice: number;
  closePrice: number;
  proceeds: number;
  commissionFee: number;
  basis: number;
  realizedPL: number;
  mtmPL: number;
  code: string;
  _processed?: boolean;
}

interface IBKRPositionRecord {
  assetCategory: string;
  currency: string;
  symbol: string;
  quantity: number;
  multiplier: number;
  costPrice: number;
  costBasis: number;
  closePrice: number;
  value: number;
  unrealizedPL: number;
  code: string;
}

interface IBKRInstrumentInfo {
  assetCategory: string;
  symbol: string;
  description: string;
  underlying: string;
  multiplier: number;
  expiry: string;
  type: string;
  strike: number;
}

/**
 * Main parser class for IBKR activity statements
 */
export class IBKRActivityStatementParser {
  private content: string;
  private lines: string[];
  
  // Parsed data structures
  private accountInfo: IBKRAccountInfo | null = null;
  private trades: IBKRTradeRecord[] = [];
  private positions: IBKRPositionRecord[] = [];
  private instrumentInfo: Map<string, IBKRInstrumentInfo> = new Map();
  
  constructor(content: string) {
    this.content = content;
    this.lines = content.split('\n');
  }
  
  /**
   * Parse the entire activity statement
   */
  public parse(): {
    accountInfo: IBKRAccountInfo,
    trades: IBKRTradeRecord[],
    positions: IBKRPositionRecord[],
    optionTrades: OptionTrade[]
  } {
    this.parseAccountInfo();
    this.parsePositions();
    this.parseTrades();
    this.parseInstrumentInfo();
    
    return {
      accountInfo: this.accountInfo!,
      trades: this.trades,
      positions: this.positions,
      optionTrades: this.convertToOptionTrades()
    };
  }
  
  /**
   * Parse account information section
   */
  private parseAccountInfo(): void {
    let accountName = '';
    let accountId = '';
    let accountType = '';
    let baseCurrency = '';
    let balance = 0;
    
    // Find account information section
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      
      if (line.includes('Account Information\tData\tName')) {
        const parts = line.split('\t');
        accountName = parts[3] || '';
      }
      
      if (line.includes('Account Information\tData\tAccount')) {
        const parts = line.split('\t');
        const accountParts = parts[3]?.split(' ') || [];
        accountId = accountParts[0] || '';
      }
      
      if (line.includes('Account Information\tData\tAccount Type')) {
        const parts = line.split('\t');
        accountType = parts[3] || '';
      }
      
      if (line.includes('Account Information\tData\tBase Currency')) {
        const parts = line.split('\t');
        baseCurrency = parts[3] || '';
      }
      
      // Find ending cash balance
      if (line.includes('Cash Report\tData\tEnding Cash\tBase Currency Summary')) {
        const parts = line.split('\t');
        balance = parseFloat(parts[4] || '0');
      }
    }
    
    this.accountInfo = {
      accountId,
      accountName,
      accountType,
      baseCurrency,
      balance
    };
  }
  
  /**
   * Parse open positions section
   */
  private parsePositions(): void {
    let inPositionsSection = false;
    let headerRow: string[] = [];
    
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      
      // Find positions header
      if (line.includes('Open Positions\tHeader\tDataDiscriminator')) {
        inPositionsSection = true;
        headerRow = line.split('\t');
        continue;
      }
      
      // Parse position data rows
      if (inPositionsSection && line.includes('Open Positions\tData')) {
        const parts = line.split('\t');
        
        // Skip summary rows
        if (parts[1] === 'Summary') {
          const position: IBKRPositionRecord = {
            assetCategory: parts[2] || '',
            currency: parts[3] || '',
            symbol: parts[4] || '',
            quantity: parseFloat(parts[5] || '0'),
            multiplier: parseFloat(parts[6] || '0'),
            costPrice: parseFloat(parts[7] || '0'),
            costBasis: parseFloat(parts[8] || '0'),
            closePrice: parseFloat(parts[9] || '0'),
            value: parseFloat(parts[10] || '0'),
            unrealizedPL: parseFloat(parts[11] || '0'),
            code: parts[12] || ''
          };
          
          this.positions.push(position);
        }
      }
      
      // End of positions section
      if (inPositionsSection && line.includes('Open Positions\tTotal')) {
        inPositionsSection = false;
      }
    }
  }
  
  /**
   * Parse trades section
   */
  private parseTrades(): void {
    let inTradesSection = false;
    let headerRow: string[] = [];
    
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      
      // Find trades header
      if (line.includes('Trades\tHeader\tDataDiscriminator')) {
        inTradesSection = true;
        headerRow = line.split('\t');
        continue;
      }
      
      // Parse trade data rows
      if (inTradesSection && line.includes('Trades\tData\tOrder')) {
        const parts = line.split('\t');
        
        const trade: IBKRTradeRecord = {
          assetCategory: parts[2] || '',
          currency: parts[3] || '',
          symbol: parts[5] || '',
          dateTime: parts[6] || '',
          quantity: parseFloat(parts[7] || '0'),
          tradePrice: parseFloat(parts[8] || '0'),
          closePrice: parseFloat(parts[9] || '0'),
          proceeds: parseFloat(parts[10] || '0'),
          commissionFee: parseFloat(parts[11] || '0'),
          basis: parseFloat(parts[12] || '0'),
          realizedPL: parseFloat(parts[13] || '0'),
          mtmPL: parseFloat(parts[14] || '0'),
          code: parts[15] || ''
        };
        
        this.trades.push(trade);
      }
      
      // End of trades section
      if (inTradesSection && line.includes('Trades\tTotal')) {
        inTradesSection = false;
      }
    }
  }
  
  /**
   * Parse financial instrument information section
   */
  private parseInstrumentInfo(): void {
    let inInstrumentSection = false;
    let headerRow: string[] = [];
    
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      
      // Find instrument header
      if (line.includes('Financial Instrument Information\tHeader')) {
        inInstrumentSection = true;
        headerRow = line.split('\t');
        continue;
      }
      
      // Parse instrument data rows
      if (inInstrumentSection && line.includes('Financial Instrument Information\tData')) {
        const parts = line.split('\t');
        
        const instrument: IBKRInstrumentInfo = {
          assetCategory: parts[1] || '',
          symbol: parts[2] || '',
          description: parts[3] || '',
          underlying: parts[5] || '',
          multiplier: parseFloat(parts[7] || '0'),
          expiry: parts[8] || '',
          type: parts[10] || '',
          strike: parseFloat(parts[11] || '0')
        };
        
        this.instrumentInfo.set(instrument.symbol, instrument);
      }
    }
  }
  
  /**
   * Convert IBKR trades to OptionTrade model
   */
  private convertToOptionTrades(): OptionTrade[] {
    const optionTrades: OptionTrade[] = [];
    const tradeMap = new Map<string, IBKRTradeRecord[]>();
    
    // Group trades by symbol
    for (const trade of this.trades) {
      if (trade.assetCategory.includes('Options')) {
        if (!tradeMap.has(trade.symbol)) {
          tradeMap.set(trade.symbol, []);
        }
        tradeMap.get(trade.symbol)!.push(trade);
      }
    }
    
    // Process each symbol's trades
    for (const [symbol, trades] of tradeMap.entries()) {
      const instrumentInfo = this.instrumentInfo.get(symbol);
      
      if (!instrumentInfo) continue;
      
      // Sort trades by date
      const sortedTrades = [...trades].sort((a, b) => {
        return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
      });
      
      // Find open and close trades
      const openTrades = sortedTrades.filter(t => t.quantity > 0);
      const closeTrades = sortedTrades.filter(t => t.quantity < 0);
      
      // Process each open trade
      for (const openTrade of openTrades) {
        // Find matching close trade if any
        const closeTrade = closeTrades.find(ct => !ct._processed && Math.abs(ct.quantity) === Math.abs(openTrade.quantity));
        
        if (closeTrade) {
          closeTrade._processed = true; // Mark as processed
        }
        
        const optionTrade: OptionTrade = {
          id: `ibkr-${symbol}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          symbol: instrumentInfo.underlying,
          putCall: instrumentInfo.type === 'C' ? 'CALL' : 'PUT',
          strike: instrumentInfo.strike,
          expiry: new Date(instrumentInfo.expiry),
          quantity: Math.abs(openTrade.quantity),
          premium: openTrade.tradePrice,
          openDate: new Date(openTrade.dateTime),
          commission: Math.abs(openTrade.commissionFee),
          strategy: openTrade.quantity > 0 ? 
            (instrumentInfo.type === 'C' ? OptionStrategy.LONG_CALL : OptionStrategy.LONG_PUT) :
            (instrumentInfo.type === 'C' ? OptionStrategy.SHORT_CALL : OptionStrategy.SHORT_PUT),
          notes: `Imported from IBKR: ${instrumentInfo.description}`
        };
        
        // Add close information if available
        if (closeTrade) {
          optionTrade.closeDate = new Date(closeTrade.dateTime);
          optionTrade.closePremium = closeTrade.tradePrice;
        }
        
        optionTrades.push(optionTrade);
      }
      
      // Add any remaining close trades (which might not have corresponding opens in this statement)
      const remainingCloseTrades = closeTrades.filter(ct => !ct._processed);
      
      for (const closeTrade of remainingCloseTrades) {
        const optionTrade: OptionTrade = {
          id: `ibkr-close-${symbol}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          symbol: instrumentInfo.underlying,
          putCall: instrumentInfo.type === 'C' ? 'CALL' : 'PUT',
          strike: instrumentInfo.strike,
          expiry: new Date(instrumentInfo.expiry),
          quantity: Math.abs(closeTrade.quantity),
          premium: 0, // Unknown open premium
          openDate: new Date(new Date(closeTrade.dateTime).getTime() - 86400000), // Estimate 1 day before
          closeDate: new Date(closeTrade.dateTime),
          closePremium: closeTrade.tradePrice,
          commission: Math.abs(closeTrade.commissionFee),
          strategy: closeTrade.quantity < 0 ? 
            (instrumentInfo.type === 'C' ? OptionStrategy.LONG_CALL : OptionStrategy.LONG_PUT) :
            (instrumentInfo.type === 'C' ? OptionStrategy.SHORT_CALL : OptionStrategy.SHORT_PUT),
          notes: `Imported from IBKR (close only): ${instrumentInfo.description}`
        };
        
        optionTrades.push(optionTrade);
      }
    }
    
    // Add open positions that don't have corresponding trades
    for (const position of this.positions) {
      if (position.assetCategory.includes('Options')) {
        const instrumentInfo = this.instrumentInfo.get(position.symbol);
        
        if (!instrumentInfo) continue;
        
        // Check if we already created a trade for this position
        const existingTrade = optionTrades.find(t => 
          t.symbol === instrumentInfo.underlying && 
          t.putCall === (instrumentInfo.type === 'C' ? 'CALL' : 'PUT') &&
          t.strike === instrumentInfo.strike &&
          t.expiry.getTime() === new Date(instrumentInfo.expiry).getTime() &&
          !t.closeDate // Only consider open trades
        );
        
        if (!existingTrade) {
          const optionTrade: OptionTrade = {
            id: `ibkr-pos-${position.symbol}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            symbol: instrumentInfo.underlying,
            putCall: instrumentInfo.type === 'C' ? 'CALL' : 'PUT',
            strike: instrumentInfo.strike,
            expiry: new Date(instrumentInfo.expiry),
            quantity: Math.abs(position.quantity),
            premium: position.costPrice,
            openDate: new Date(), // Estimate current date
            commission: 0, // Unknown commission
            strategy: position.quantity > 0 ? 
              (instrumentInfo.type === 'C' ? OptionStrategy.LONG_CALL : OptionStrategy.LONG_PUT) :
              (instrumentInfo.type === 'C' ? OptionStrategy.SHORT_CALL : OptionStrategy.SHORT_PUT),
            notes: `Imported from IBKR position: ${instrumentInfo.description}`
          };
          
          optionTrades.push(optionTrade);
        }
      }
    }
    
    return optionTrades;
  }
} 