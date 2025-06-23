/**
 * Quick Picks Integration Test
 * Tests the streamlined account-based stock selection workflow
 */

import AccountBasedStockPicker from '../services/AccountBasedRecommendations';
import WatchlistService from '../services/WatchlistService';

describe('Quick Picks Integration Tests', () => {
  let stockPicker;
  let watchlistService;

  beforeEach(() => {
    stockPicker = new AccountBasedStockPicker();
    watchlistService = new WatchlistService();
    watchlistService.clearWatchlist();
  });

  test('should generate appropriate recommendations for small account', () => {
    const recommendations = stockPicker.getTop5Stocks(5000, 'moderate');
    
    expect(recommendations.stocks).toHaveLength(5);
    expect(recommendations.totalInvestment).toBeLessThanOrEqual(4500); // 90% of account
    expect(recommendations.cashReserve).toBeCloseTo(500, -1); // ~10% cash reserve
    
    // Each position should respect 15% limit for beginners
    recommendations.stocks.forEach(stock => {
      expect(stock.positionSize).toBeLessThanOrEqual(750); // 15% of $5K
      expect(stock.shares).toBeGreaterThan(0);
    });
  });

  test('should generate appropriate recommendations for medium account', () => {
    const recommendations = stockPicker.getTop5Stocks(50000, 'moderate');
    
    expect(recommendations.stocks).toHaveLength(5);
    expect(recommendations.totalInvestment).toBeLessThanOrEqual(45000);
    
    // Each position should respect 20% limit for intermediate
    recommendations.stocks.forEach(stock => {
      expect(stock.positionSize).toBeLessThanOrEqual(10000); // 20% of $50K
    });
  });

  test('should generate appropriate recommendations for large account', () => {
    const recommendations = stockPicker.getTop5Stocks(150000, 'aggressive');
    
    expect(recommendations.stocks).toHaveLength(5);
    expect(recommendations.totalInvestment).toBeLessThanOrEqual(135000);
    
    // Each position should respect 25% limit for advanced
    recommendations.stocks.forEach(stock => {
      expect(stock.positionSize).toBeLessThanOrEqual(37500); // 25% of $150K
    });
  });

  test('should adjust recommendations based on risk tolerance', () => {
    const conservative = stockPicker.getTop5Stocks(50000, 'conservative');
    const aggressive = stockPicker.getTop5Stocks(50000, 'aggressive');
    
    // Calculate average beta for each portfolio
    const conservativeBeta = conservative.stocks.reduce((sum, s) => sum + s.beta, 0) / 5;
    const aggressiveBeta = aggressive.stocks.reduce((sum, s) => sum + s.beta, 0) / 5;
    
    expect(aggressiveBeta).toBeGreaterThan(conservativeBeta);
  });

  test('should provide realistic portfolio metrics', () => {
    const portfolio = stockPicker.getTop5Stocks(25000, 'moderate');
    
    // Expected return should be reasonable (5-50%)
    expect(portfolio.expectedReturn).toBeGreaterThan(5);
    expect(portfolio.expectedReturn).toBeLessThan(50);
    
    // Diversification should be good
    expect(portfolio.diversificationScore).toBeGreaterThan(60);
    
    // Risk profile should be appropriate
    expect(portfolio.riskProfile).toContain('Growth');
  });

  test('should integrate with watchlist service', () => {
    const recommendations = stockPicker.getTop5Stocks(25000, 'moderate');
    
    // Add all stocks to watchlist
    recommendations.stocks.forEach(stock => {
      watchlistService.addStock({
        symbol: stock.symbol,
        name: stock.name,
        price: stock.price,
        source: 'quick-picks',
        riskLevel: stock.riskLevel,
        sector: stock.sector,
        marketCap: stock.marketCap
      });
    });
    
    // Verify all stocks are in watchlist
    recommendations.stocks.forEach(stock => {
      expect(watchlistService.isInWatchlist(stock.symbol)).toBe(true);
    });
    
    // Check watchlist summary
    const summary = watchlistService.getWatchlistSummary();
    expect(summary.totalStocks).toBe(5);
    expect(summary.sources['quick-picks']).toBe(5);
  });

  test('should provide account tier information', () => {
    const smallAccountInfo = stockPicker.getAccountTierInfo(5000);
    expect(smallAccountInfo.tier).toBe('BEGINNER');
    expect(smallAccountInfo.features).toContain('Blue-chip stocks only');
    
    const mediumAccountInfo = stockPicker.getAccountTierInfo(50000);
    expect(mediumAccountInfo.tier).toBe('INTERMEDIATE');
    expect(mediumAccountInfo.features).toContain('Growth + dividend mix');
    
    const largeAccountInfo = stockPicker.getAccountTierInfo(150000);
    expect(largeAccountInfo.tier).toBe('ADVANCED');
    expect(largeAccountInfo.features).toContain('High-growth opportunities');
  });

  test('should maintain data consistency across service calls', () => {
    // Get recommendations
    const portfolio1 = stockPicker.getTop5Stocks(25000, 'moderate');
    const portfolio2 = stockPicker.getTop5Stocks(25000, 'moderate');
    
    // Should get same recommendations for same inputs
    expect(portfolio1.stocks[0].symbol).toBe(portfolio2.stocks[0].symbol);
    expect(portfolio1.totalInvestment).toBe(portfolio2.totalInvestment);
  });
});

describe('Account Classification Tests', () => {
  let stockPicker;

  beforeEach(() => {
    stockPicker = new AccountBasedStockPicker();
  });

  test('should classify accounts correctly', () => {
    expect(stockPicker.classifyAccount(999)).toBe('BEGINNER');
    expect(stockPicker.classifyAccount(5000)).toBe('BEGINNER');
    expect(stockPicker.classifyAccount(24999)).toBe('BEGINNER');
    expect(stockPicker.classifyAccount(25000)).toBe('INTERMEDIATE');
    expect(stockPicker.classifyAccount(50000)).toBe('INTERMEDIATE');
    expect(stockPicker.classifyAccount(99999)).toBe('INTERMEDIATE');
    expect(stockPicker.classifyAccount(100000)).toBe('ADVANCED');
    expect(stockPicker.classifyAccount(500000)).toBe('ADVANCED');
  });
});

describe('Watchlist Service Tests', () => {
  let watchlistService;

  beforeEach(() => {
    watchlistService = new WatchlistService();
    watchlistService.clearWatchlist();
  });

  test('should manage watchlist correctly', () => {
    const testStock = {
      symbol: 'TEST',
      name: 'Test Company',
      price: 100.50,
      source: 'quick-picks',
      riskLevel: 'medium',
      sector: 'Technology',
      marketCap: 1000000000
    };

    // Add stock
    watchlistService.addStock(testStock);
    expect(watchlistService.isInWatchlist('TEST')).toBe(true);

    // Get watchlist
    const watchlist = watchlistService.getWatchlist();
    expect(watchlist.stocks).toHaveLength(1);
    expect(watchlist.stocks[0].symbol).toBe('TEST');

    // Remove stock
    watchlistService.removeStock('TEST');
    expect(watchlistService.isInWatchlist('TEST')).toBe(false);
  });

  test('should provide correct summary statistics', () => {
    // Add multiple stocks
    const stocks = [
      { symbol: 'AAPL', name: 'Apple', price: 175, source: 'quick-picks', riskLevel: 'medium', sector: 'Technology', marketCap: 2700000000000 },
      { symbol: 'MSFT', name: 'Microsoft', price: 400, source: 'curated-lists', riskLevel: 'low', sector: 'Technology', marketCap: 2900000000000 },
      { symbol: 'NVDA', name: 'NVIDIA', price: 700, source: 'screening', riskLevel: 'high', sector: 'Technology', marketCap: 1700000000000 }
    ];

    stocks.forEach(stock => watchlistService.addStock(stock));

    const summary = watchlistService.getWatchlistSummary();
    expect(summary.totalStocks).toBe(3);
    expect(summary.averagePrice).toBeCloseTo(425, -1);
    expect(summary.riskDistribution.medium).toBe(1);
    expect(summary.riskDistribution.low).toBe(1);
    expect(summary.riskDistribution.high).toBe(1);
    expect(summary.sources['quick-picks']).toBe(1);
    expect(summary.sources['curated-lists']).toBe(1);
    expect(summary.sources['screening']).toBe(1);
  });
}); 