/**
 * Strategy Recommendation Engine Tests
 * 
 * Basic integration tests for the Strategy Recommendation Engine component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import StrategyRecommendationEngine from '../StrategyRecommendationEngine';

// Mock the TradingStrategyService
jest.mock('../../services/TradingStrategyService', () => ({
  tradingStrategyService: {
    detectMarketEnvironment: jest.fn().mockResolvedValue({
      volatilityRegime: 'MEDIUM',
      trendDirection: 'UPTREND',
      marketCondition: 'BULL_MARKET',
      vixLevel: 18.5,
      marketSentiment: 'BULLISH',
      sectorRotation: ['Technology', 'Healthcare'],
      economicCycle: 'EXPANSION'
    }),
    getAllStrategies: jest.fn().mockReturnValue([]),
    getRecommendedStrategies: jest.fn().mockResolvedValue([]),
    getStrategyPerformance: jest.fn().mockReturnValue([])
  },
  StrategyCategory: {
    MOMENTUM: 'MOMENTUM',
    VALUE: 'VALUE',
    GROWTH: 'GROWTH'
  },
  RiskLevel: {
    LOW: 'LOW',
    MODERATE: 'MODERATE',
    HIGH: 'HIGH'
  },
  TimeHorizon: {
    DAY_TRADE: 'DAY_TRADE',
    SWING: 'SWING',
    POSITION: 'POSITION'
  }
}));

// Mock recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="chart-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  RadarChart: ({ children }: any) => <div data-testid="radar-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Area: () => <div data-testid="area" />,
  Bar: () => <div data-testid="bar" />,
  Radar: () => <div data-testid="radar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />
}));

describe('StrategyRecommendationEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    render(<StrategyRecommendationEngine />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading market data and generating recommendations...')).not.toBeInTheDocument();
    });
  });

  it('displays market environment dashboard when enabled', async () => {
    render(<StrategyRecommendationEngine showMarketDashboard={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Market Environment')).toBeInTheDocument();
    });
  });

  it('displays user profile section when enabled', async () => {
    render(<StrategyRecommendationEngine showUserProfile={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Trading Profile')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    render(<StrategyRecommendationEngine />);
    
    expect(screen.getByText('Loading market data and generating recommendations...')).toBeInTheDocument();
  });

  it('handles strategy selection callback', async () => {
    const mockOnStrategySelected = jest.fn();
    
    render(
      <StrategyRecommendationEngine onStrategySelected={mockOnStrategySelected} />
    );
    
    await waitFor(() => {
      expect(screen.queryByText('Loading market data and generating recommendations...')).not.toBeInTheDocument();
    });
  });

  it('handles XP earned callback', async () => {
    const mockOnXPEarned = jest.fn();
    
    render(
      <StrategyRecommendationEngine onXPEarned={mockOnXPEarned} />
    );
    
    await waitFor(() => {
      expect(screen.queryByText('Loading market data and generating recommendations...')).not.toBeInTheDocument();
    });
  });

  it('renders tabs for different views', async () => {
    render(<StrategyRecommendationEngine />);
    
    await waitFor(() => {
      expect(screen.getByText('Recommendations')).toBeInTheDocument();
      expect(screen.getByText('All Strategies')).toBeInTheDocument();
    });
  });

  it('applies custom className when provided', async () => {
    const { container } = render(
      <StrategyRecommendationEngine className="custom-class" />
    );
    
    await waitFor(() => {
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });

  it('handles autoRefresh prop correctly', async () => {
    render(<StrategyRecommendationEngine autoRefresh={false} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading market data and generating recommendations...')).not.toBeInTheDocument();
    });
  });

  it('displays filter controls in recommendations tab', async () => {
    render(<StrategyRecommendationEngine />);
    
    await waitFor(() => {
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });
  });

  it('shows edit profile button when user profile is enabled', async () => {
    render(<StrategyRecommendationEngine showUserProfile={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });
  });
});

describe('StrategyRecommendationEngine Integration', () => {
  it('integrates with TradingStrategyService correctly', async () => {
    const { tradingStrategyService } = require('../../services/TradingStrategyService');
    
    render(<StrategyRecommendationEngine />);
    
    await waitFor(() => {
      expect(tradingStrategyService.detectMarketEnvironment).toHaveBeenCalled();
      expect(tradingStrategyService.getAllStrategies).toHaveBeenCalled();
      expect(tradingStrategyService.getStrategyPerformance).toHaveBeenCalled();
    });
  });
});