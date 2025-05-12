import { v4 as uuidv4 } from 'uuid';
import { OptionTrade, OptionStrategy } from '../types/options';

class IBKRActivityStatementParser {
  private determinePutCall(symbol: string): 'PUT' | 'CALL' {
    return symbol.includes('P') ? 'PUT' : 'CALL';
  }

  private extractStrike(symbol: string): number {
    const strikeMatch = symbol.match(/\d+/);
    return strikeMatch ? parseFloat(strikeMatch[0]) : 0;
  }

  private parseQuantity(value: string): number {
    if (!value) return 0;
    return parseInt(value);
  }

  private parsePremium(value: string): number {
    if (!value) return 0;
    return parseFloat(value.replace(/[$,]/g, ''));
  }

  private parseCommission(value: string): number {
    if (!value) return 0;
    return parseFloat(value.replace(/[$,]/g, ''));
  }

  private parseDate(value: string): Date {
    return new Date(value);
  }

  private extractOptionDetails(description: string): { symbol: string; putCall: 'PUT' | 'CALL'; strike: number; expiry: Date } {
    // Example description format: "SPY 01/19/24 450 CALL"
    const parts = description.split(' ');
    const symbol = parts[0];
    const expiry = new Date(parts[1]);
    const strike = parseFloat(parts[2]);
    const putCall = parts[3] as 'PUT' | 'CALL';
    
    return { symbol, putCall, strike, expiry };
  }

  private determineStrategy(putCall: 'PUT' | 'CALL', quantity: number): OptionStrategy {
    if (quantity > 0) {
      return putCall === 'CALL' ? OptionStrategy.LONG_CALL : OptionStrategy.LONG_PUT;
    } else {
      return putCall === 'CALL' ? OptionStrategy.SHORT_CALL : OptionStrategy.SHORT_PUT;
    }
  }

  private parseTrade(row: string[]): OptionTrade {
    const [date, symbol, putCall, strike, expiry, quantity, price, commission] = row;
    
    return {
      id: uuidv4(),
      symbol,
      putCall: putCall as 'PUT' | 'CALL',
      strike: parseFloat(strike),
      expiry: new Date(expiry),
      quantity: parseInt(quantity),
      premium: parseFloat(price),
      openDate: new Date(date),
      strategy: this.determineStrategy(putCall as 'PUT' | 'CALL', parseInt(quantity)),
      commission: parseFloat(commission),
      notes: '',
      realizedPL: 0
    };
  }

  private parsePL(value: string): number {
    if (!value) return 0;
    return parseFloat(value.replace(/[$,]/g, ''));
  }

  // ... existing code ...
} 