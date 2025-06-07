import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardPnlCards from '../components/Dashboard/DashboardPnlCards';
import * as DatabaseService from '../services/DatabaseService';
import { NormalizedTradeData, BrokerType } from '../types/trade';

// Mock the DatabaseService functions
jest.mock('../services/DatabaseService', () => ({
  getAggregatePL: jest.fn(),
  getTradeCounts: jest.fn(),
  getClosedTrades: jest.fn(),
}));

// Helper function to create mock trade data
const createMockTrade = (id: string, netAmount: number): NormalizedTradeData => ({
  id,
  importTimestamp: new Date().toISOString(),
  broker: BrokerType.IBKR,
  tradeDate: '2024-01-01',
  symbol: 'SPY',
  assetCategory: 'OPT',
  quantity: 1,
  tradePrice: 100,
  currency: 'USD',
  netAmount,
  openCloseIndicator: 'C'
});

describe('DashboardPnlCards', () => {
  // Cast the mocked functions for easier typing in tests
  const mockGetAggregatePL = DatabaseService.getAggregatePL as jest.MockedFunction<typeof DatabaseService.getAggregatePL>;
  const mockGetTradeCounts = DatabaseService.getTradeCounts as jest.MockedFunction<typeof DatabaseService.getTradeCounts>;
  const mockGetClosedTrades = DatabaseService.getClosedTrades as jest.MockedFunction<typeof DatabaseService.getClosedTrades>;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Set default mock implementations
    mockGetAggregatePL.mockResolvedValue({ realizedPL: 0 });
    mockGetTradeCounts.mockResolvedValue({ open: 0, closed: 0 });
    mockGetClosedTrades.mockResolvedValue([]);
  });

  test('renders correctly with zero data', async () => {
    render(<DashboardPnlCards />);

    // Wait for data fetching to complete
    await waitFor(() => expect(mockGetAggregatePL).toHaveBeenCalled());

    // Expect zero values or N/A for all metrics (with proper formatting)
    expect(screen.getByText('0.00$')).toBeInTheDocument(); // Realized P&L with $
    expect(screen.getByText('0.0%')).toBeInTheDocument(); // Win Rate with %
    expect(screen.getByText('0')).toBeInTheDocument(); // Open Trades
    expect(screen.getByText('0')).toBeInTheDocument(); // Closed Trades
    expect(screen.getByText('0.00$')).toBeInTheDocument(); // Unrealized P&L (mock data) with $
  });

  test('renders correctly with some data', async () => {
    // Provide mock data
    mockGetAggregatePL.mockResolvedValue({ realizedPL: 150.75 });
    mockGetTradeCounts.mockResolvedValue({ open: 5, closed: 10 });
    mockGetClosedTrades.mockResolvedValue([
      createMockTrade('1', 50),
      createMockTrade('2', -20),
      createMockTrade('3', 100),
      createMockTrade('4', -10),
      createMockTrade('5', 30),
      createMockTrade('6', 0), // Break-even
      createMockTrade('7', 45),
      createMockTrade('8', -5),
      createMockTrade('9', 25),
      createMockTrade('10', 15),
    ]);

    render(<DashboardPnlCards />);

    await waitFor(() => expect(mockGetAggregatePL).toHaveBeenCalled());

    // Calculate expected win rate: 7 winning trades out of 10 closed trades
    const expectedWinRate = (7 / 10) * 100; // 70%

    // Assert displayed values (with proper formatting)
    expect(screen.getByText('150.75$')).toBeInTheDocument(); // Realized P&L with $
    expect(screen.getByText(expectedWinRate.toFixed(1) + '%')).toBeInTheDocument(); // Win Rate (formatted)
    expect(screen.getByText('5')).toBeInTheDocument(); // Open Trades
    expect(screen.getByText('10')).toBeInTheDocument(); // Closed Trades
  });

  test('renders correctly with all open trades', async () => {
    mockGetAggregatePL.mockResolvedValue({ realizedPL: 0 });
    mockGetTradeCounts.mockResolvedValue({ open: 15, closed: 0 });
    mockGetClosedTrades.mockResolvedValue([]);

    render(<DashboardPnlCards />);

    await waitFor(() => expect(mockGetTradeCounts).toHaveBeenCalled());

    expect(screen.getByText('0.00$')).toBeInTheDocument(); // Realized P&L with $
    expect(screen.getByText('0.0%')).toBeInTheDocument(); // Win Rate with %
    expect(screen.getByText('15')).toBeInTheDocument(); // Open Trades
    expect(screen.getByText('0')).toBeInTheDocument(); // Closed Trades
  });

  test('renders correctly with all winning closed trades', async () => {
    const closedTrades = [
      createMockTrade('1', 50),
      createMockTrade('2', 20),
      createMockTrade('3', 100),
    ];
    const totalPL = closedTrades.reduce((sum, t) => sum + t.netAmount, 0);

    mockGetAggregatePL.mockResolvedValue({ realizedPL: totalPL });
    mockGetTradeCounts.mockResolvedValue({ open: 0, closed: closedTrades.length });
    mockGetClosedTrades.mockResolvedValue(closedTrades);

    render(<DashboardPnlCards />);

    await waitFor(() => expect(mockGetTradeCounts).toHaveBeenCalled());

    expect(screen.getByText(totalPL.toFixed(2) + '$')).toBeInTheDocument(); // Realized P&L with $
    expect(screen.getByText('100.0%')).toBeInTheDocument(); // Win Rate with %
    expect(screen.getByText('0')).toBeInTheDocument(); // Open Trades
    expect(screen.getByText(closedTrades.length.toString())).toBeInTheDocument(); // Closed Trades
  });

  test('renders correctly with all losing closed trades', async () => {
    const closedTrades = [
      createMockTrade('1', -50),
      createMockTrade('2', -20),
      createMockTrade('3', -100),
    ];
    const totalPL = closedTrades.reduce((sum, t) => sum + t.netAmount, 0);

    mockGetAggregatePL.mockResolvedValue({ realizedPL: totalPL });
    mockGetTradeCounts.mockResolvedValue({ open: 0, closed: closedTrades.length });
    mockGetClosedTrades.mockResolvedValue(closedTrades);

    render(<DashboardPnlCards />);

    await waitFor(() => expect(mockGetTradeCounts).toHaveBeenCalled());

    expect(screen.getByText(totalPL.toFixed(2) + '$')).toBeInTheDocument(); // Realized P&L with $
    expect(screen.getByText('0.0%')).toBeInTheDocument(); // Win Rate with %
    expect(screen.getByText('0')).toBeInTheDocument(); // Open Trades
    expect(screen.getByText(closedTrades.length.toString())).toBeInTheDocument(); // Closed Trades
  });

  test('renders correctly with a single winning closed trade', async () => {
    const closedTrades = [
      createMockTrade('1', 100),
    ];
    const totalPL = closedTrades.reduce((sum, t) => sum + t.netAmount, 0);

    mockGetAggregatePL.mockResolvedValue({ realizedPL: totalPL });
    mockGetTradeCounts.mockResolvedValue({ open: 0, closed: closedTrades.length });
    mockGetClosedTrades.mockResolvedValue(closedTrades);

    render(<DashboardPnlCards />);

    await waitFor(() => expect(mockGetTradeCounts).toHaveBeenCalled());

    expect(screen.getByText(totalPL.toFixed(2) + '$')).toBeInTheDocument(); // Realized P&L with $
    expect(screen.getByText('100.0%')).toBeInTheDocument(); // Win Rate with %
    expect(screen.getByText('0')).toBeInTheDocument(); // Open Trades
    expect(screen.getByText(closedTrades.length.toString())).toBeInTheDocument(); // Closed Trades
  });

  test('renders correctly with a single losing closed trade', async () => {
    const closedTrades = [
      createMockTrade('1', -50),
    ];
    const totalPL = closedTrades.reduce((sum, t) => sum + t.netAmount, 0);

    mockGetAggregatePL.mockResolvedValue({ realizedPL: totalPL });
    mockGetTradeCounts.mockResolvedValue({ open: 0, closed: closedTrades.length });
    mockGetClosedTrades.mockResolvedValue(closedTrades);

    render(<DashboardPnlCards />);

    await waitFor(() => expect(mockGetTradeCounts).toHaveBeenCalled());

    expect(screen.getByText(totalPL.toFixed(2) + '$')).toBeInTheDocument(); // Realized P&L with $
    expect(screen.getByText('0.0%')).toBeInTheDocument(); // Win Rate with %
    expect(screen.getByText('0')).toBeInTheDocument(); // Open Trades
    expect(screen.getByText(closedTrades.length.toString())).toBeInTheDocument(); // Closed Trades
  });

  test('renders correctly with large numbers', async () => {
    const largePL = 1234567.89;
    const largeOpen = 1000;
    const largeClosed = 5000;
    const closedTrades = Array.from({ length: largeClosed }, (_, i) => 
      createMockTrade(`${i}`, (i % 2 === 0 ? 100 : -50) + (i * 0.01))
    ); // Mix of wins/losses
    const calculatedLargePL = closedTrades.reduce((sum, t) => sum + t.netAmount, 0);

    mockGetAggregatePL.mockResolvedValue({ realizedPL: calculatedLargePL });
    mockGetTradeCounts.mockResolvedValue({ open: largeOpen, closed: largeClosed });
    mockGetClosedTrades.mockResolvedValue(closedTrades);

    render(<DashboardPnlCards />);

    await waitFor(() => expect(mockGetTradeCounts).toHaveBeenCalled());

    const winningClosed = closedTrades.filter(t => t.netAmount > 0).length;
    const expectedWinRate = (winningClosed / largeClosed) * 100;

    // Note: MetricCard formats numbers, so we expect formatted strings with units
    expect(screen.getByText(calculatedLargePL.toFixed(2) + '$')).toBeInTheDocument(); // Realized P&L with $
    expect(screen.getByText(largeOpen.toString())).toBeInTheDocument(); // Open Trades
    expect(screen.getByText(largeClosed.toString())).toBeInTheDocument(); // Closed Trades
    expect(screen.getByText(expectedWinRate.toFixed(1) + '%')).toBeInTheDocument(); // Win Rate (formatted) with %
  });

  test('handles error when fetching data', async () => {
    const errorMessage = 'Failed to fetch trades';
    mockGetAggregatePL.mockRejectedValue(new Error(errorMessage));
    mockGetTradeCounts.mockRejectedValue(new Error(errorMessage));
    mockGetClosedTrades.mockRejectedValue(new Error(errorMessage));

    // Mock console.error to prevent test runner from logging the error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<DashboardPnlCards />);

    await screen.findByText('Failed to load dashboard data.');

    // Ensure loading state is false after error
    const loadingIndicators = screen.queryAllByRole('status');
    expect(loadingIndicators.length).toBe(0);

    // Expect N/A values for metrics when there's an error
    const naElements = screen.getAllByText('N/A');
    expect(naElements.length).toBeGreaterThan(0); // Multiple N/A values should be displayed

    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  // TODO: Add more test cases for different scenarios:
  // - Edge cases for win rate (0 closed trades, 1 closed trade - covered partially by win/loss/breakeven cases)
}); 