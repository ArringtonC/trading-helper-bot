import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PositionLimitRecommendations from '../PositionLimitRecommendations';
import { GoalSizingConfig } from '../../../types/goalSizing';
import * as positionLimitEngine from '../../../utils/positionLimitEngine';

// Mock the position limit engine
jest.mock('../../../utils/positionLimitEngine');
const mockGeneratePositionLimitRecommendations = positionLimitEngine.generatePositionLimitRecommendations as jest.MockedFunction<typeof positionLimitEngine.generatePositionLimitRecommendations>;

describe('PositionLimitRecommendations', () => {
  const mockOnLimitsChange = jest.fn();
  
  const baseConfig: GoalSizingConfig = {
    goalType: 'growth',
    goalParameters: {
      riskTolerance: 'moderate'
    },
    sizingRules: {
      maxPositionSize: 5,
      maxTotalExposure: 25
    },
    capitalObjectiveParameters: {
      currentBalance: 50000,
      targetBalance: 60000,
      timeHorizonMonths: 12
    },
    tradeStatistics: {}
  };

  const mockRecommendations = {
    recommended: {
      maxPositionSize: 8,
      maxTotalExposure: 30,
      riskPerTrade: 2
    },
    rationale: {
      primary: 'Risk-based positioning',
      factors: ['Moderate risk tolerance', 'Growth-focused strategy'],
      methodology: 'Fixed percentage with volatility adjustment'
    },
    comparison: {
      warnings: [
        {
          severity: 'warning' as const,
          message: 'Current position size may be too conservative',
          recommendation: 'Consider increasing position size to 8%'
        }
      ],
      compliance: {
        conservative: true,
        moderate: true,
        aggressive: false
      }
    },
    bestPractices: {
      applicableRules: [
        {
          id: 'rule1',
          title: 'Position Sizing',
          description: 'Never risk more than 2% per trade',
          category: 'risk_management' as const,
          recommendation: {
            maxPositionSize: 8,
            maxTotalExposure: 30
          },
          applicableFor: {
            assetClasses: ['stocks'],
            tradingStrategies: ['swing_trading'],
            riskProfiles: ['moderate']
          },
          severity: 'critical' as const,
          source: 'industry_standard'
        }
      ],
      criticalRules: [],
      educationalContent: {}
    },
    adjustments: {
      applied: ['Experience level adjustment: +10%', 'Market volatility adjustment: -5%']
    },
    disclaimer: 'This is not financial advice'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGeneratePositionLimitRecommendations.mockReturnValue(mockRecommendations);
  });

  describe('Initial State', () => {
    it('renders loading state when no goal type is set', () => {
      const incompleteConfig = { ...baseConfig, goalType: '' };
      render(
        <PositionLimitRecommendations
          config={incompleteConfig}
          onLimitsChange={mockOnLimitsChange}
          accountSize={50000}
        />
      );

      expect(screen.getByText('Complete your goal setup to see position limit recommendations')).toBeInTheDocument();
    });

    it('generates recommendations when valid config is provided', async () => {
      render(
        <PositionLimitRecommendations
          config={baseConfig}
          onLimitsChange={mockOnLimitsChange}
          accountSize={50000}
        />
      );

      await waitFor(() => {
        expect(mockGeneratePositionLimitRecommendations).toHaveBeenCalledWith({
          accountSize: 50000,
          riskTolerance: 'moderate',
          tradingStrategy: 'swing_trading',
          experienceLevel: 'import',
          goalType: 'growth',
          capitalObjectiveParameters: {
            currentBalance: 50000,
            targetBalance: 60000,
            timeHorizonMonths: 12
          }
        });
      });
    });
  });

  describe('Recommendations Display', () => {
    beforeEach(() => {
      render(
        <PositionLimitRecommendations
          config={baseConfig}
          onLimitsChange={mockOnLimitsChange}
          accountSize={50000}
        />
      );
    });

    it('displays recommendation summary', async () => {
      await waitFor(() => {
        expect(screen.getByText('8%')).toBeInTheDocument(); // Max position size
        expect(screen.getByText('30%')).toBeInTheDocument(); // Max exposure
        expect(screen.getByText('$4,000')).toBeInTheDocument(); // Dollar value for position
        expect(screen.getByText('$15,000')).toBeInTheDocument(); // Dollar value for exposure
      });
    });

    it('shows AI-powered recommendations header', async () => {
      await waitFor(() => {
        expect(screen.getByText('AI-Powered Position Limit Recommendations')).toBeInTheDocument();
      });
    });

    it('displays apply recommendations button', async () => {
      await waitFor(() => {
        expect(screen.getByText('Apply Recommendations')).toBeInTheDocument();
      });
    });
  });

  describe('Detailed View', () => {
    beforeEach(async () => {
      render(
        <PositionLimitRecommendations
          config={baseConfig}
          onLimitsChange={mockOnLimitsChange}
          accountSize={50000}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Show Details')).toBeInTheDocument();
      });
    });

    it('toggles detailed recommendations view', async () => {
      const detailsButton = screen.getByText('Show Details');
      fireEvent.click(detailsButton);

      await waitFor(() => {
        expect(screen.getByText('Hide Details')).toBeInTheDocument();
        expect(screen.getByText('Recommendation Rationale')).toBeInTheDocument();
      });
    });

    it('displays rationale when details are shown', async () => {
      const detailsButton = screen.getByText('Show Details');
      fireEvent.click(detailsButton);

      await waitFor(() => {
        expect(screen.getByText('Risk-based positioning')).toBeInTheDocument();
        expect(screen.getByText('Moderate risk tolerance')).toBeInTheDocument();
        expect(screen.getByText('Growth-focused strategy')).toBeInTheDocument();
      });
    });

    it('displays applied adjustments when details are shown', async () => {
      const detailsButton = screen.getByText('Show Details');
      fireEvent.click(detailsButton);

      await waitFor(() => {
        expect(screen.getByText('Applied Adjustments:')).toBeInTheDocument();
        expect(screen.getByText('Experience level adjustment: +10%')).toBeInTheDocument();
        expect(screen.getByText('Market volatility adjustment: -5%')).toBeInTheDocument();
      });
    });

    it('displays warnings when present', async () => {
      const detailsButton = screen.getByText('Show Details');
      fireEvent.click(detailsButton);

      await waitFor(() => {
        expect(screen.getByText('Current position size may be too conservative')).toBeInTheDocument();
        expect(screen.getByText('Consider increasing position size to 8%')).toBeInTheDocument();
      });
    });

    it('displays best practices when present', async () => {
      const detailsButton = screen.getByText('Show Details');
      fireEvent.click(detailsButton);

      await waitFor(() => {
        expect(screen.getByText('Best Practices')).toBeInTheDocument();
        expect(screen.getByText('Position Sizing: Never risk more than 2% per trade')).toBeInTheDocument();
      });
    });
  });

  describe('Apply Recommendations', () => {
    it('calls onLimitsChange when apply button is clicked', async () => {
      render(
        <PositionLimitRecommendations
          config={baseConfig}
          onLimitsChange={mockOnLimitsChange}
          accountSize={50000}
        />
      );

      await waitFor(() => {
        const applyButton = screen.getByText('Apply Recommendations');
        fireEvent.click(applyButton);
      });

      expect(mockOnLimitsChange).toHaveBeenCalledWith(8, 30);
    });
  });

  describe('User Override Detection', () => {
    it('shows custom values detected when user has different limits', async () => {
      const configWithDifferentLimits = {
        ...baseConfig,
        sizingRules: {
          maxPositionSize: 3, // Different from recommended 8%
          maxTotalExposure: 15 // Different from recommended 30%
        }
      };

      render(
        <PositionLimitRecommendations
          config={configWithDifferentLimits}
          onLimitsChange={mockOnLimitsChange}
          accountSize={50000}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Custom values detected')).toBeInTheDocument();
      });
    });

    it('does not show custom values message when limits match recommendations', async () => {
      const configWithMatchingLimits = {
        ...baseConfig,
        sizingRules: {
          maxPositionSize: 8, // Matches recommended
          maxTotalExposure: 30 // Matches recommended
        }
      };

      render(
        <PositionLimitRecommendations
          config={configWithMatchingLimits}
          onLimitsChange={mockOnLimitsChange}
          accountSize={50000}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Custom values detected')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles recommendation generation errors gracefully', async () => {
      mockGeneratePositionLimitRecommendations.mockImplementation(() => {
        throw new Error('Recommendation generation failed');
      });

      render(
        <PositionLimitRecommendations
          config={baseConfig}
          onLimitsChange={mockOnLimitsChange}
          accountSize={50000}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Complete your goal setup to see position limit recommendations')).toBeInTheDocument();
      });
    });
  });

  describe('Tooltip Functionality', () => {
    it('shows and hides tooltip on hover', async () => {
      render(
        <PositionLimitRecommendations
          config={baseConfig}
          onLimitsChange={mockOnLimitsChange}
          accountSize={50000}
        />
      );

      await waitFor(() => {
        const tooltipTrigger = screen.getByText('(?)');
        fireEvent.mouseEnter(tooltipTrigger);
      });

      expect(screen.getByText(/These recommendations are based on your risk tolerance/)).toBeInTheDocument();
    });
  });

  describe('Account Size Handling', () => {
    it('uses account size from props when provided', async () => {
      render(
        <PositionLimitRecommendations
          config={baseConfig}
          onLimitsChange={mockOnLimitsChange}
          accountSize={100000}
        />
      );

      await waitFor(() => {
        expect(mockGeneratePositionLimitRecommendations).toHaveBeenCalledWith(
          expect.objectContaining({
            accountSize: 100000
          })
        );
      });
    });

    it('falls back to config balance when account size not provided', async () => {
      render(
        <PositionLimitRecommendations
          config={baseConfig}
          onLimitsChange={mockOnLimitsChange}
        />
      );

      await waitFor(() => {
        expect(mockGeneratePositionLimitRecommendations).toHaveBeenCalledWith(
          expect.objectContaining({
            accountSize: 50000 // From capitalObjectiveParameters.currentBalance
          })
        );
      });
    });

    it('uses default account size when neither is available', async () => {
      const configWithoutBalance = {
        ...baseConfig,
        capitalObjectiveParameters: undefined
      };

      render(
        <PositionLimitRecommendations
          config={configWithoutBalance}
          onLimitsChange={mockOnLimitsChange}
        />
      );

      await waitFor(() => {
        expect(mockGeneratePositionLimitRecommendations).toHaveBeenCalledWith(
          expect.objectContaining({
            accountSize: 10000 // Default fallback
          })
        );
      });
    });
  });

  describe('Disclaimer', () => {
    it('always displays disclaimer', async () => {
      render(
        <PositionLimitRecommendations
          config={baseConfig}
          onLimitsChange={mockOnLimitsChange}
          accountSize={50000}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/These are educational suggestions based on industry best practices/)).toBeInTheDocument();
      });
    });
  });
}); 
 
 
 