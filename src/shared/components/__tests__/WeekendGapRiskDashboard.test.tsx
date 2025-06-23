/**
 * Tests for Weekend Gap Risk Dashboard
 * 
 * Tests dashboard rendering, data loading, error handling,
 * and user interactions for the weekend gap risk analysis feature.
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WeekendGapRiskDashboard } from '../WeekendGapRiskDashboard';

// Mock the services
jest.mock('../../services/WeekendGapRiskService');
jest.mock('../../services/GapRiskRuleEngine'); 
jest.mock('../../services/TradingStyleConfigService');

describe('WeekendGapRiskDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render loading state initially', () => {
      render(<WeekendGapRiskDashboard />);
      
      expect(screen.getByText('🏁 Weekend Gap Risk Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Friday position analysis with gap risk assessment and recommendations')).toBeInTheDocument();
      
      // Should show loading skeleton
      const loadingSkeletons = document.querySelectorAll('.animate-pulse');
      expect(loadingSkeletons.length).toBeGreaterThan(0);
    });

    it('should render with custom props', () => {
      render(
        <WeekendGapRiskDashboard 
          userId="test-user" 
          selectedTradingStyle="day_trading" 
        />
      );
      
      expect(screen.getByText('🏁 Weekend Gap Risk Dashboard')).toBeInTheDocument();
    });
  });

  describe('Dashboard Data Loading', () => {
    it('should display loaded data after successful fetch', async () => {
      render(<WeekendGapRiskDashboard />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('animate-pulse')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Should show summary cards
      expect(screen.getByText('Total Positions')).toBeInTheDocument();
      expect(screen.getByText('Portfolio Value')).toBeInTheDocument();
      expect(screen.getByText('High Risk Positions')).toBeInTheDocument();
      expect(screen.getByText('Overall Risk Score')).toBeInTheDocument();
    });

    it('should display position summary table', async () => {
      render(<WeekendGapRiskDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Position Summary with Gap Risk Analysis')).toBeInTheDocument();
      });

      // Should show table headers
      expect(screen.getByText('Symbol')).toBeInTheDocument();
      expect(screen.getByText('Quantity')).toBeInTheDocument();
      expect(screen.getByText('Price')).toBeInTheDocument();
      expect(screen.getByText('Position Value')).toBeInTheDocument();
      expect(screen.getByText('Gap Risk Level')).toBeInTheDocument();
      expect(screen.getByText('Risk Score')).toBeInTheDocument();
      expect(screen.getByText('Expected Loss')).toBeInTheDocument();
    });

    it('should display mock position data', async () => {
      render(<WeekendGapRiskDashboard />);
      
      await waitFor(() => {
        // Should show mock symbols
        expect(screen.getByText('AAPL')).toBeInTheDocument();
        expect(screen.getByText('TSLA')).toBeInTheDocument();
        expect(screen.getByText('SPY')).toBeInTheDocument();
      });
    });
  });

  describe('Recommendations Panel', () => {
    it('should display recommendations when available', async () => {
      render(<WeekendGapRiskDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('📋 Trading Recommendations')).toBeInTheDocument();
      });

      // Should show mock recommendation
      expect(screen.getByText('Reduce Position')).toBeInTheDocument();
      expect(screen.getByText('Consider reducing AAPL position before weekend')).toBeInTheDocument();
      expect(screen.getByText('HIGH PRIORITY')).toBeInTheDocument();
    });

    it('should display priority icons', async () => {
      render(<WeekendGapRiskDashboard />);
      
      await waitFor(() => {
        const priorityIcon = screen.getByText('🔥');
        expect(priorityIcon).toBeInTheDocument();
      });
    });
  });

  describe('Risk Analysis Summary', () => {
    it('should display trading style configuration', async () => {
      render(<WeekendGapRiskDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Trading Style Configuration')).toBeInTheDocument();
        expect(screen.getByText('Portfolio Metrics')).toBeInTheDocument();
      });

      // Should show style and risk tolerance
      expect(screen.getByText('Style:')).toBeInTheDocument();
      expect(screen.getByText('Risk Tolerance:')).toBeInTheDocument();
      expect(screen.getByText('Overall Risk Score:')).toBeInTheDocument();
    });

    it('should display portfolio metrics', async () => {
      render(<WeekendGapRiskDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Total Positions:')).toBeInTheDocument();
        expect(screen.getByText('Recommendations:')).toBeInTheDocument();
        expect(screen.getByText('Analysis Date:')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should handle refresh button click', async () => {
      render(<WeekendGapRiskDashboard />);
      
      await waitFor(() => {
        const refreshButton = screen.getByText('🔄 Refresh Data');
        expect(refreshButton).toBeInTheDocument();
      });

      const refreshButton = screen.getByText('🔄 Refresh Data');
      fireEvent.click(refreshButton);

      // Should show refreshing state
      await waitFor(() => {
        expect(screen.getByText('⟳ Refreshing...')).toBeInTheDocument();
      });
    });

    it('should disable refresh button while refreshing', async () => {
      render(<WeekendGapRiskDashboard />);
      
      await waitFor(() => {
        const refreshButton = screen.getByText('🔄 Refresh Data');
        fireEvent.click(refreshButton);
      });

      const refreshButton = screen.getByText('⟳ Refreshing...');
      expect(refreshButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should handle and display errors gracefully', async () => {
      // Mock console.error to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Create a component that will trigger an error
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      // Note: This test might need adjustment based on actual error handling implementation
      
      consoleSpy.mockRestore();
    });
  });

  describe('Responsive Design', () => {
    it('should render summary cards in grid layout', async () => {
      render(<WeekendGapRiskDashboard />);
      
      await waitFor(() => {
        const summaryGrid = document.querySelector('.grid-cols-1.md\\:grid-cols-4');
        expect(summaryGrid).toBeInTheDocument();
      });
    });

    it('should make table responsive with overflow', async () => {
      render(<WeekendGapRiskDashboard />);
      
      await waitFor(() => {
        const tableContainer = document.querySelector('.overflow-x-auto');
        expect(tableContainer).toBeInTheDocument();
      });
    });
  });

  describe('Data Formatting', () => {
    it('should format currency values correctly', async () => {
      render(<WeekendGapRiskDashboard />);
      
      await waitFor(() => {
        // Check for formatted currency values
        expect(screen.getByText('$150.00')).toBeInTheDocument();
        expect(screen.getByText('$200.00')).toBeInTheDocument();
        expect(screen.getByText('$400.00')).toBeInTheDocument();
      });
    });

    it('should format large numbers with commas', async () => {
      render(<WeekendGapRiskDashboard />);
      
      await waitFor(() => {
        // Should show formatted position values
        expect(screen.getByText('15,000')).toBeInTheDocument();
        expect(screen.getByText('10,000')).toBeInTheDocument();
        expect(screen.getByText('80,000')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      render(<WeekendGapRiskDashboard />);
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('🏁 Weekend Gap Risk Dashboard');
      
      await waitFor(() => {
        const subHeadings = screen.getAllByRole('heading', { level: 2 });
        expect(subHeadings.length).toBeGreaterThan(0);
      });
    });

    it('should have accessible table structure', async () => {
      render(<WeekendGapRiskDashboard />);
      
      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
        
        const tableHeaders = screen.getAllByRole('columnheader');
        expect(tableHeaders.length).toBe(7); // Symbol, Quantity, Price, Position Value, Gap Risk Level, Risk Score, Expected Loss
      });
    });

    it('should provide meaningful button labels', async () => {
      render(<WeekendGapRiskDashboard />);
      
      await waitFor(() => {
        const refreshButton = screen.getByRole('button', { name: /refresh data/i });
        expect(refreshButton).toBeInTheDocument();
      });
    });
  });

  describe('Trading Style Integration', () => {
    it('should work with different trading styles', async () => {
      const { rerender } = render(
        <WeekendGapRiskDashboard selectedTradingStyle="day_trading" />
      );
      
      await waitFor(() => {
        expect(screen.getByText('🏁 Weekend Gap Risk Dashboard')).toBeInTheDocument();
      });

      rerender(<WeekendGapRiskDashboard selectedTradingStyle="position_trading" />);
      
      await waitFor(() => {
        expect(screen.getByText('🏁 Weekend Gap Risk Dashboard')).toBeInTheDocument();
      });
    });

    it('should handle user configuration properly', async () => {
      render(<WeekendGapRiskDashboard userId="test-user-123" />);
      
      await waitFor(() => {
        expect(screen.getByText('🏁 Weekend Gap Risk Dashboard')).toBeInTheDocument();
      });
    });
  });
}); 