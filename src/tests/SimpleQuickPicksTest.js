/**
 * Simple Quick Picks Functionality Test
 * Basic verification that the account-based recommendations work
 */

import AccountBasedStockPicker from '../services/AccountBasedRecommendations';

describe('Quick Picks Basic Functionality', () => {
  let stockPicker;

  beforeEach(() => {
    stockPicker = new AccountBasedStockPicker();
  });

  test('should generate 5 stock recommendations for any account size', () => {
    const recommendations = stockPicker.getTop5Stocks(25000, 'moderate');
    
    expect(recommendations).toBeDefined();
    expect(recommendations.stocks).toHaveLength(5);
    expect(recommendations.totalInvestment).toBeGreaterThan(0);
    expect(recommendations.cashReserve).toBeGreaterThan(0);
  });

  test('should respect position sizing limits based on account tier', () => {
    // Test small account (BEGINNER - 15% max)
    const smallAccountRecs = stockPicker.getTop5Stocks(10000, 'moderate');
    smallAccountRecs.stocks.forEach(stock => {
      expect(stock.positionSize).toBeLessThanOrEqual(1500); // 15% of $10K
    });

    // Test large account (ADVANCED - 25% max)
    const largeAccountRecs = stockPicker.getTop5Stocks(200000, 'moderate');
    largeAccountRecs.stocks.forEach(stock => {
      expect(stock.positionSize).toBeLessThanOrEqual(50000); // 25% of $200K
    });
  });

  test('should provide different stock selections by account tier', () => {
    const beginnerRecs = stockPicker.getTop5Stocks(5000, 'moderate');
    const advancedRecs = stockPicker.getTop5Stocks(200000, 'moderate');
    
    // Should get different stock selections
    const beginnerSymbols = beginnerRecs.stocks.map(s => s.symbol);
    const advancedSymbols = advancedRecs.stocks.map(s => s.symbol);
    
    // At least some stocks should be different
    const intersection = beginnerSymbols.filter(s => advancedSymbols.includes(s));
    expect(intersection.length).toBeLessThan(5); // Not all the same
  });

  test('should classify accounts into correct tiers', () => {
    expect(stockPicker.classifyAccount(5000)).toBe('BEGINNER');
    expect(stockPicker.classifyAccount(50000)).toBe('INTERMEDIATE');
    expect(stockPicker.classifyAccount(150000)).toBe('ADVANCED');
  });

  test('should provide account tier information', () => {
    const tierInfo = stockPicker.getAccountTierInfo(25000);
    expect(tierInfo.tier).toBe('INTERMEDIATE');
    expect(tierInfo.features).toBeInstanceOf(Array);
    expect(tierInfo.features.length).toBeGreaterThan(0);
  });

  test('should handle different risk tolerances', () => {
    const conservative = stockPicker.getTop5Stocks(50000, 'conservative');
    const moderate = stockPicker.getTop5Stocks(50000, 'moderate');
    const aggressive = stockPicker.getTop5Stocks(50000, 'aggressive');
    
    expect(conservative.stocks).toHaveLength(5);
    expect(moderate.stocks).toHaveLength(5);
    expect(aggressive.stocks).toHaveLength(5);
    
    // Risk profiles should be different
    expect(conservative.riskProfile).not.toBe(aggressive.riskProfile);
  });

  test('should provide realistic portfolio metrics', () => {
    const portfolio = stockPicker.getTop5Stocks(50000, 'moderate');
    
    // Total investment + cash should approximately equal account value
    const total = portfolio.totalInvestment + portfolio.cashReserve;
    expect(total).toBeCloseTo(50000, -3); // Within $1000
    
    // Expected return should be reasonable
    expect(portfolio.expectedReturn).toBeGreaterThan(0);
    expect(portfolio.expectedReturn).toBeLessThan(100);
    
    // Diversification score should be meaningful
    expect(portfolio.diversificationScore).toBeGreaterThan(0);
    expect(portfolio.diversificationScore).toBeLessThanOrEqual(100);
  });

  test('should ensure all stocks have required properties', () => {
    const recommendations = stockPicker.getTop5Stocks(25000, 'moderate');
    
    recommendations.stocks.forEach(stock => {
      expect(stock.symbol).toBeDefined();
      expect(stock.name).toBeDefined();
      expect(stock.price).toBeGreaterThan(0);
      expect(stock.shares).toBeGreaterThan(0);
      expect(stock.positionSize).toBeGreaterThan(0);
      expect(stock.targetAllocation).toBeGreaterThan(0);
      expect(stock.rationale).toBeDefined();
      expect(['low', 'medium', 'high']).toContain(stock.riskLevel);
      expect(stock.sector).toBeDefined();
      expect(stock.marketCap).toBeGreaterThan(0);
      expect(stock.beta).toBeGreaterThan(0);
    });
  });
});

// This test demonstrates the complete user workflow
describe('User Workflow Simulation', () => {
  test('should complete the full Quick Picks user journey', () => {
    const stockPicker = new AccountBasedStockPicker();
    
    // Step 1: User enters account value
    const accountValue = 35000;
    
    // Step 2: System classifies account
    const tier = stockPicker.classifyAccount(accountValue);
    expect(tier).toBe('INTERMEDIATE');
    
    // Step 3: User selects risk tolerance
    const riskTolerance = 'moderate';
    
    // Step 4: System generates recommendations
    const recommendations = stockPicker.getTop5Stocks(accountValue, riskTolerance);
    
    // Step 5: Verify recommendations are appropriate
    expect(recommendations.stocks).toHaveLength(5);
    expect(recommendations.totalInvestment).toBeLessThanOrEqual(accountValue * 0.9);
    
    // Step 6: Verify each position respects sizing rules (20% max for intermediate)
    recommendations.stocks.forEach(stock => {
      expect(stock.positionSize).toBeLessThanOrEqual(accountValue * 0.20);
      expect(stock.targetAllocation).toBeLessThanOrEqual(20);
    });
    
    // Step 7: Verify portfolio has good characteristics
    expect(recommendations.riskProfile).toContain('Growth');
    expect(recommendations.diversificationScore).toBeGreaterThan(60);
    
    console.log('✅ Quick Picks workflow completed successfully!');
    console.log(`Account: $${accountValue.toLocaleString()}`);
    console.log(`Tier: ${tier}`);
    console.log(`Total Investment: $${recommendations.totalInvestment.toLocaleString()}`);
    console.log(`Cash Reserve: $${recommendations.cashReserve.toLocaleString()}`);
    console.log(`Expected Return: ${recommendations.expectedReturn.toFixed(1)}%`);
    console.log('Recommended Stocks:');
    recommendations.stocks.forEach((stock, i) => {
      console.log(`  ${i + 1}. ${stock.symbol} - $${stock.positionSize.toLocaleString()} (${stock.shares} shares)`);
    });
  });
}); 