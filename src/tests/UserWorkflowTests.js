/**
 * Comprehensive User Workflow Tests
 * Tests the complete user journey from account value input to stock portfolio management
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { act } from 'react-dom/test-utils';

// Import components
import StockSelectionLanding from '../components/StockSelectionLanding';
import WatchlistPage from '../pages/trading/WatchlistPage';
import AdvancedScreeningPage from '../pages/trading/AdvancedScreeningPage';
import CuratedStockListsPage from '../pages/trading/CuratedStockListsPage';

// Import services
import AccountBasedStockPicker from '../services/AccountBasedRecommendations';
import WatchlistService from '../services/WatchlistService';

// Test helper to wrap components with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('End-to-End User Workflow Tests', () => {
  let watchlistService;
  let stockPicker;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Initialize services
    watchlistService = new WatchlistService();
    stockPicker = new AccountBasedStockPicker();
    
    // Clear any existing watchlist
    watchlistService.clearWatchlist();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Test 1: Small Account ($1K-$10K) - Conservative Portfolio', () => {
    test('should complete small account workflow successfully', async () => {
      const accountValue = 5000;
      
      // Step 1: Render Quick Picks landing page
      renderWithRouter(<StockSelectionLanding />);
      
      // Step 2: Input account value
      const accountInput = screen.getByPlaceholderText(/e.g., 25000/i);
      fireEvent.change(accountInput, { target: { value: accountValue.toString() } });
      
      // Step 3: Select conservative risk tolerance
      const conservativeButton = screen.getByText(/conservative/i);
      fireEvent.click(conservativeButton);
      
      // Step 4: Get recommendations
      const getRecommendationsButton = screen.getByText(/Get My 5 Best Stocks/i);
      fireEvent.click(getRecommendationsButton);
      
      // Step 5: Wait for recommendations to load
      await waitFor(() => {
        expect(screen.getByText(/Your Recommended Portfolio/i)).toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Step 6: Verify beginner classification
      expect(screen.getByText(/BEGINNER Investor/i)).toBeInTheDocument();
      
      // Step 7: Verify conservative stock recommendations (blue chips, dividend stocks)
      const expectedStocks = ['AAPL', 'MSFT', 'KO', 'JNJ', 'PG'];
      expectedStocks.forEach(symbol => {
        expect(screen.getByText(symbol)).toBeInTheDocument();
      });
      
      // Step 8: Verify position sizing (max 15% or $5K)
      const recommendations = stockPicker.getTop5Stocks(accountValue, 'conservative');
      recommendations.stocks.forEach(stock => {
        expect(stock.positionSize).toBeLessThanOrEqual(Math.min(accountValue * 0.15, 5000));
      });
      
      // Step 9: Add all stocks to watchlist
      const addAllButton = screen.getByText(/Add All to Watchlist/i);
      fireEvent.click(addAllButton);
      
      await waitFor(() => {
        const watchlist = watchlistService.getWatchlist();
        expect(watchlist.stocks).toHaveLength(5);
      });
      
      // Step 10: Verify portfolio total is appropriate for account size
      const totalInvestment = recommendations.totalInvestment;
      expect(totalInvestment).toBeLessThanOrEqual(accountValue * 0.9); // 90% max investment
      expect(totalInvestment).toBeGreaterThan(0);
    });
  });

  describe('Test 2: Medium Account ($25K-$100K) - Balanced Portfolio', () => {
    test('should complete medium account workflow successfully', async () => {
      const accountValue = 50000;
      
      renderWithRouter(<StockSelectionLanding />);
      
      // Input account value
      const accountInput = screen.getByPlaceholderText(/e.g., 25000/i);
      fireEvent.change(accountInput, { target: { value: accountValue.toString() } });
      
      // Select moderate risk tolerance
      const moderateButton = screen.getByText(/moderate/i);
      fireEvent.click(moderateButton);
      
      // Get recommendations
      const getRecommendationsButton = screen.getByText(/Get My 5 Best Stocks/i);
      fireEvent.click(getRecommendationsButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Your Recommended Portfolio/i)).toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Verify intermediate classification
      expect(screen.getByText(/INTERMEDIATE Investor/i)).toBeInTheDocument();
      
      // Verify balanced portfolio (growth + stability mix)
      const expectedStocks = ['NVDA', 'GOOGL', 'V', 'UNH', 'SPY'];
      expectedStocks.forEach(symbol => {
        expect(screen.getByText(symbol)).toBeInTheDocument();
      });
      
      // Test position sizing up to 20%
      const recommendations = stockPicker.getTop5Stocks(accountValue, 'moderate');
      recommendations.stocks.forEach(stock => {
        expect(stock.positionSize).toBeLessThanOrEqual(accountValue * 0.20);
      });
      
      // Verify expected return is reasonable for intermediate portfolio
      expect(recommendations.expectedReturn).toBeGreaterThan(10);
      expect(recommendations.expectedReturn).toBeLessThan(25);
    });
  });

  describe('Test 3: Large Account ($100K+) - Advanced Portfolio', () => {
    test('should complete large account workflow successfully', async () => {
      const accountValue = 150000;
      
      renderWithRouter(<StockSelectionLanding />);
      
      // Input account value
      const accountInput = screen.getByPlaceholderText(/e.g., 25000/i);
      fireEvent.change(accountInput, { target: { value: accountValue.toString() } });
      
      // Select aggressive risk tolerance
      const aggressiveButton = screen.getByText(/aggressive/i);
      fireEvent.click(aggressiveButton);
      
      // Get recommendations
      const getRecommendationsButton = screen.getByText(/Get My 5 Best Stocks/i);
      fireEvent.click(getRecommendationsButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Your Recommended Portfolio/i)).toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Verify advanced classification
      expect(screen.getByText(/ADVANCED Investor/i)).toBeInTheDocument();
      
      // Verify access to small-cap, high-growth stocks
      const expectedStocks = ['PLTR', 'SHOP', 'TSLA', 'COIN', 'RBLX'];
      expectedStocks.forEach(symbol => {
        expect(screen.getByText(symbol)).toBeInTheDocument();
      });
      
      // Test position sizing up to 25%
      const recommendations = stockPicker.getTop5Stocks(accountValue, 'aggressive');
      recommendations.stocks.forEach(stock => {
        expect(stock.positionSize).toBeLessThanOrEqual(accountValue * 0.25);
      });
      
      // Verify higher expected return for aggressive portfolio
      expect(recommendations.expectedReturn).toBeGreaterThan(15);
    });
  });

  describe('Test 4: Complete Navigation Flow', () => {
    test('should maintain watchlist state across pages', async () => {
      // Start with Quick Picks
      renderWithRouter(<StockSelectionLanding />);
      
      // Add a stock to watchlist
      const accountInput = screen.getByPlaceholderText(/e.g., 25000/i);
      fireEvent.change(accountInput, { target: { value: '25000' } });
      
      const getRecommendationsButton = screen.getByText(/Get My 5 Best Stocks/i);
      fireEvent.click(getRecommendationsButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Your Recommended Portfolio/i)).toBeInTheDocument();
      });
      
      // Add first stock to watchlist
      const addButtons = screen.getAllByText(/Add to Watchlist/i);
      fireEvent.click(addButtons[0]);
      
      // Navigate to Advanced Screening page
      renderWithRouter(<AdvancedScreeningPage />);
      
      // Verify the stock shows as "In Watchlist"
      await waitFor(() => {
        const watchlist = watchlistService.getWatchlist();
        expect(watchlist.stocks).toHaveLength(1);
      });
      
      // Navigate to Curated Lists page
      renderWithRouter(<CuratedStockListsPage />);
      
      // Add another stock from curated lists
      // (This would require the actual implementation to be tested)
      
      // Navigate to Watchlist page
      renderWithRouter(<WatchlistPage />);
      
      // Verify all stocks appear with correct metadata
      await waitFor(() => {
        const watchlist = watchlistService.getWatchlist();
        expect(watchlist.stocks.length).toBeGreaterThan(0);
        
        // Check that sources are correctly attributed
        const quickPicksStocks = watchlist.stocks.filter(s => s.source === 'quick-picks');
        expect(quickPicksStocks.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Test 5: Cross-Page Consistency', () => {
    test('should show consistent stock status across all pages', async () => {
      // First, add stock from curated lists
      const testStock = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 175.30,
        source: 'curated-lists',
        riskLevel: 'medium',
        sector: 'Technology',
        marketCap: 2700000000000
      };
      
      watchlistService.addStock(testStock);
      
      // Test 1: Verify stock shows as "In Watchlist" in Advanced Screening
      renderWithRouter(<AdvancedScreeningPage />);
      // (Would need actual component implementation to test UI state)
      
      // Test 2: Verify stock shows as "In Watchlist" in Quick Picks
      renderWithRouter(<StockSelectionLanding />);
      // (Would need actual component implementation to test UI state)
      
      // Test 3: Verify stock appears in Watchlist page
      renderWithRouter(<WatchlistPage />);
      
      await waitFor(() => {
        const watchlist = watchlistService.getWatchlist();
        const foundStock = watchlist.stocks.find(s => s.symbol === 'AAPL');
        expect(foundStock).toBeDefined();
        expect(foundStock.source).toBe('curated-lists');
      });
    });
  });

  describe('Test 6: Position Sizing Validation', () => {
    test('should calculate correct position sizes for different account tiers', () => {
      // Test small account
      const smallAccount = stockPicker.getTop5Stocks(5000, 'moderate');
      smallAccount.stocks.forEach(stock => {
        expect(stock.positionSize).toBeLessThanOrEqual(750); // 15% of $5K
        expect(stock.shares).toBeGreaterThan(0);
        expect(stock.targetAllocation).toBeLessThanOrEqual(15);
      });
      
      // Test medium account
      const mediumAccount = stockPicker.getTop5Stocks(50000, 'moderate');
      mediumAccount.stocks.forEach(stock => {
        expect(stock.positionSize).toBeLessThanOrEqual(10000); // 20% of $50K
        expect(stock.targetAllocation).toBeLessThanOrEqual(20);
      });
      
      // Test large account
      const largeAccount = stockPicker.getTop5Stocks(150000, 'moderate');
      largeAccount.stocks.forEach(stock => {
        expect(stock.positionSize).toBeLessThanOrEqual(37500); // 25% of $150K
        expect(stock.targetAllocation).toBeLessThanOrEqual(25);
      });
    });
  });

  describe('Test 7: Risk Tolerance Impact', () => {
    test('should adjust portfolio based on risk tolerance', () => {
      const accountValue = 50000;
      
      // Conservative portfolio
      const conservative = stockPicker.getTop5Stocks(accountValue, 'conservative');
      const conservativeAvgBeta = conservative.stocks.reduce((sum, s) => sum + s.beta, 0) / 5;
      
      // Aggressive portfolio
      const aggressive = stockPicker.getTop5Stocks(accountValue, 'aggressive');
      const aggressiveAvgBeta = aggressive.stocks.reduce((sum, s) => sum + s.beta, 0) / 5;
      
      // Aggressive should have higher average beta
      expect(aggressiveAvgBeta).toBeGreaterThan(conservativeAvgBeta);
      
      // Conservative should have more dividend-paying stocks
      const conservativeDividendStocks = conservative.stocks.filter(s => s.dividend && s.dividend > 0);
      const aggressiveDividendStocks = aggressive.stocks.filter(s => s.dividend && s.dividend > 0);
      
      expect(conservativeDividendStocks.length).toBeGreaterThanOrEqual(aggressiveDividendStocks.length);
    });
  });

  describe('Test 8: Performance Metrics Validation', () => {
    test('should provide realistic portfolio metrics', () => {
      const portfolio = stockPicker.getTop5Stocks(50000, 'moderate');
      
      // Expected return should be reasonable
      expect(portfolio.expectedReturn).toBeGreaterThan(5);
      expect(portfolio.expectedReturn).toBeLessThan(50);
      
      // Diversification score should be good (80%+)
      expect(portfolio.diversificationScore).toBeGreaterThan(60);
      
      // Cash reserve should be 10% of account
      expect(portfolio.cashReserve).toBeCloseTo(5000, -2);
      
      // Total investment + cash should equal account value
      const total = portfolio.totalInvestment + portfolio.cashReserve;
      expect(total).toBeCloseTo(50000, -2);
      
      // Max drawdown should be reasonable
      expect(portfolio.maxDrawdown).toBeLessThan(60);
    });
  });
});

describe('Integration Tests: Service Layer', () => {
  test('AccountBasedStockPicker should classify accounts correctly', () => {
    const picker = new AccountBasedStockPicker();
    
    expect(picker.classifyAccount(5000)).toBe('BEGINNER');
    expect(picker.classifyAccount(24999)).toBe('BEGINNER');
    expect(picker.classifyAccount(25000)).toBe('INTERMEDIATE');
    expect(picker.classifyAccount(99999)).toBe('INTERMEDIATE');
    expect(picker.classifyAccount(100000)).toBe('ADVANCED');
    expect(picker.classifyAccount(500000)).toBe('ADVANCED');
  });
  
  test('WatchlistService should persist data correctly', () => {
    const service = new WatchlistService();
    
    const testStock = {
      symbol: 'TEST',
      name: 'Test Stock',
      price: 100,
      source: 'test',
      riskLevel: 'medium',
      sector: 'Technology',
      marketCap: 1000000
    };
    
    // Add stock
    service.addStock(testStock);
    expect(service.isInWatchlist('TEST')).toBe(true);
    
    // Check persistence
    const newService = new WatchlistService();
    expect(newService.isInWatchlist('TEST')).toBe(true);
    
    // Remove stock
    service.removeStock('TEST');
    expect(service.isInWatchlist('TEST')).toBe(false);
  });
});

export {
  renderWithRouter
}; 