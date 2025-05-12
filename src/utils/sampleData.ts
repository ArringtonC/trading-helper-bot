import { OptionTrade, OptionStrategy } from '../types/options';

/**
 * Sample trades for testing the application
 */
export const SAMPLE_TRADES: OptionTrade[] = [
  {
    id: 'AAPL-1',
    symbol: 'AAPL',
    putCall: 'CALL',
    strike: 180,
    expiry: new Date('2023-12-15'),
    quantity: 1,
    premium: 3.50,
    openDate: new Date('2023-11-01'),
    closeDate: new Date('2023-11-15'),
    closePremium: 5.00,
    strategy: OptionStrategy.LONG_CALL,
    commission: 0.65,
    notes: 'Total P&L: $150.00'
  },
  {
    id: 'MSFT-1',
    symbol: 'MSFT',
    putCall: 'PUT',
    strike: 350,
    expiry: new Date('2023-12-22'),
    quantity: -1,
    premium: 2.75,
    openDate: new Date('2023-11-05'),
    closeDate: new Date('2023-11-20'),
    closePremium: 0.65,
    strategy: OptionStrategy.SHORT_PUT,
    commission: 0.65,
    notes: 'Total P&L: $210.00'
  },
  {
    id: 'TSLA-1',
    symbol: 'TSLA',
    putCall: 'CALL',
    strike: 220,
    expiry: new Date('2023-12-29'),
    quantity: 1,
    premium: 5.20,
    openDate: new Date('2023-11-10'),
    strategy: OptionStrategy.LONG_CALL,
    commission: 0.65,
    notes: 'Unrealized P&L: -$520.00'
  },
  {
    id: 'AMZN-1',
    symbol: 'AMZN',
    putCall: 'PUT',
    strike: 140,
    expiry: new Date('2024-01-05'),
    quantity: -1,
    premium: 1.85,
    openDate: new Date('2023-11-15'),
    strategy: OptionStrategy.SHORT_PUT,
    commission: 0.65,
    notes: 'Unrealized P&L: $120.00'
  },
  {
    id: 'NVDA-1',
    symbol: 'NVDA',
    putCall: 'CALL',
    strike: 450,
    expiry: new Date('2024-01-12'),
    quantity: 1,
    premium: 8.75,
    openDate: new Date('2023-11-20'),
    strategy: OptionStrategy.LONG_CALL,
    commission: 0.65,
    notes: 'Unrealized P&L: -$875.00'
  }
];

/**
 * Initialize sample data if no trades exist in localStorage
 */
export function initializeSampleData(): void {
  // Check if trades exist in localStorage
  const savedTrades = localStorage.getItem('trades');
  
  if (!savedTrades) {
    // Add sample trades to localStorage
    localStorage.setItem('trades', JSON.stringify(SAMPLE_TRADES));
    console.log('Sample trades initialized');
  }
  
  // Check if options portfolios exist
  const savedPortfolios = localStorage.getItem('options_portfolios');
  
  if (!savedPortfolios) {
    // Create a sample portfolio with the demo account
    const samplePortfolio = {
      accountId: 'demo1',
      id: 'demo1',
      trades: SAMPLE_TRADES
    };
    
    localStorage.setItem('options_portfolios', JSON.stringify({
      'demo1': samplePortfolio
    }));
    
    console.log('Sample options portfolio initialized');
  }
} 