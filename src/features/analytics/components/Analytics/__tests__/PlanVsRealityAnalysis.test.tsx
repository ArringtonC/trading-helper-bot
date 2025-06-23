import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GoalAnalyticsDashboard } from '../GoalAnalyticsDashboard';
import { FeedbackCollection, FeedbackSummaryDashboard } from '../FeedbackCollection';
import { PlanVsRealityAnalysisHub } from '../PlanVsRealityAnalysisHub';
// TODO: GoalSizingContext needs to be implemented
// import { useGoalSizing } from '../../../../../context/GoalSizingContext';
import { DatabaseService } from '../../../../../shared/services/DatabaseService';

// Mock dependencies
// jest.mock('../../../../../context/GoalSizingContext');
jest.mock('../../../../../shared/services/DatabaseService');
jest.mock('../../../../../shared/services/AnalyticsDataService');
jest.mock('../../../utils/analytics/UnifiedAnalyticsEngine');

const mockUseGoalSizing = useGoalSizing as jest.MockedFunction<typeof useGoalSizing>;

const mockGoalConfig = {
  goalType: 'aggressive_growth',
  goalParameters: {
    targetReturn: 15,
    timeFrame: 12,
    drawdownTolerance: 5
  },
  sizingRules: {
    baseSizePercentage: 2,
    maxPositionSize: 10,
    maxTotalExposure: 50,
    volatilityAdjustment: true
  },
  capitalObjectiveParameters: {
    currentBalance: 50000,
    targetBalance: 57500,
    timeHorizonMonths: 12
  },
  tradeStatistics: {
    winRate: 55,
    avgWin: 150,
    avgLoss: -100
  }
};

describe('GoalAnalyticsDashboard', () => {
  beforeEach(() => {
    mockUseGoalSizing.mockReturnValue({
      config: mockGoalConfig,
      isLoading: false,
      saveConfig: jest.fn(),
      loadConfig: jest.fn(),
      saveOnboardingProgress: jest.fn(),
      loadOnboardingProgress: jest.fn(),
      completeOnboardingPhase: jest.fn(),
      onboardingProgress: null,
      currentPhase: 1,
      saveUserContext: jest.fn(),
      loadUserContext: jest.fn(),
      createBackup: jest.fn(),
      restoreFromBackup: jest.fn()
    });

    // Mock localStorage
    Storage.prototype.getItem = jest.fn(() => '[]');
    Storage.prototype.setItem = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders analytics dashboard with goal overview', async () => {
    render(<GoalAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Goal Performance Analytics')).toBeInTheDocument();
    });

    // Check for goal overview cards
    expect(screen.getByText('Goal Achievement')).toBeInTheDocument();
    expect(screen.getByText('Return Performance')).toBeInTheDocument();
    expect(screen.getByText('Win Rate')).toBeInTheDocument();
    expect(screen.getByText('Max Drawdown')).toBeInTheDocument();
  });

  test('shows loading state', () => {
    mockUseGoalSizing.mockReturnValue({
      ...mockUseGoalSizing(),
      isLoading: true
    });

    render(<GoalAnalyticsDashboard />);
    
    expect(screen.getByTestId('loading-skeleton') || 
           document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  test('shows no config message when no goal configuration exists', () => {
    mockUseGoalSizing.mockReturnValue({
      ...mockUseGoalSizing(),
      config: null
    });

    render(<GoalAnalyticsDashboard />);
    
    expect(screen.getByText('No Goal Configuration Found')).toBeInTheDocument();
    expect(screen.getByText(/Please create a goal using the Goal Sizing Wizard/)).toBeInTheDocument();
  });

  test('displays detailed view when enabled', async () => {
    render(<GoalAnalyticsDashboard showDetailedView={true} />);

    await waitFor(() => {
      expect(screen.getByText('Plan vs Reality Performance')).toBeInTheDocument();
      expect(screen.getByText('Position Size Compliance')).toBeInTheDocument();
      expect(screen.getByText('Trade Execution Analysis')).toBeInTheDocument();
    });
  });

  test('handles error state gracefully', async () => {
    // Mock analytics service to throw error
    const mockAnalyticsService = require('../../../services/AnalyticsDataService');
    mockAnalyticsService.AnalyticsDataService.mockImplementation(() => ({
      getAllTrades: jest.fn().mockRejectedValue(new Error('Database error'))
    }));

    render(<GoalAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Analytics')).toBeInTheDocument();
      expect(screen.getByText('Failed to load analytics data. Please try again.')).toBeInTheDocument();
    });
  });
});

describe('FeedbackCollection', () => {
  beforeEach(() => {
    mockUseGoalSizing.mockReturnValue({
      config: mockGoalConfig,
      isLoading: false,
      saveConfig: jest.fn(),
      loadConfig: jest.fn(),
      saveOnboardingProgress: jest.fn(),
      loadOnboardingProgress: jest.fn(),
      completeOnboardingPhase: jest.fn(),
      onboardingProgress: null,
      currentPhase: 1,
      saveUserContext: jest.fn(),
      loadUserContext: jest.fn(),
      createBackup: jest.fn(),
      restoreFromBackup: jest.fn()
    });
  });

  test('renders manual feedback trigger button', () => {
    render(
      <FeedbackCollection 
        triggerPoint="manual" 
        onFeedbackSubmitted={jest.fn()}
      />
    );
    
    expect(screen.getByText('Provide Feedback')).toBeInTheDocument();
  });

  test('opens feedback modal when trigger is clicked', () => {
    render(
      <FeedbackCollection 
        triggerPoint="manual" 
        onFeedbackSubmitted={jest.fn()}
      />
    );
    
    fireEvent.click(screen.getByText('Provide Feedback'));
    
    expect(screen.getByText('Share Your Feedback')).toBeInTheDocument();
    expect(screen.getByText('Feedback Type')).toBeInTheDocument();
  });

  test('validates required fields before submission', async () => {
    const mockOnFeedbackSubmitted = jest.fn();
    
    render(
      <FeedbackCollection 
        triggerPoint="manual" 
        onFeedbackSubmitted={mockOnFeedbackSubmitted}
      />
    );
    
    fireEvent.click(screen.getByText('Provide Feedback'));
    fireEvent.click(screen.getByText('Submit Feedback'));
    
    await waitFor(() => {
      expect(screen.getByText('Please fill in all required fields.')).toBeInTheDocument();
    });
    
    expect(mockOnFeedbackSubmitted).not.toHaveBeenCalled();
  });

  test('submits feedback with all required fields', async () => {
    const mockOnFeedbackSubmitted = jest.fn();
    
    render(
      <FeedbackCollection 
        triggerPoint="manual" 
        onFeedbackSubmitted={mockOnFeedbackSubmitted}
      />
    );
    
    fireEvent.click(screen.getByText('Provide Feedback'));
    
    // Fill in required fields
    fireEvent.change(screen.getByDisplayValue(''), { 
      target: { value: 'Goal Setting Experience' } 
    });
    fireEvent.change(screen.getByPlaceholderText('Brief summary of your feedback'), {
      target: { value: 'Test feedback subject' }
    });
    fireEvent.change(screen.getByPlaceholderText(/Please provide detailed feedback/), {
      target: { value: 'This is detailed feedback about the goal setting experience.' }
    });
    
    fireEvent.click(screen.getByText('Submit Feedback'));
    
    await waitFor(() => {
      expect(mockOnFeedbackSubmitted).toHaveBeenCalled();
    });
  });

  test('auto-triggers for goal completion', () => {
    render(
      <FeedbackCollection 
        triggerPoint="goal_completion" 
        onFeedbackSubmitted={jest.fn()}
      />
    );
    
    // Should auto-trigger (though with delay in real implementation)
    expect(screen.getByText('Share Your Feedback')).toBeInTheDocument();
  });

  test('handles different feedback types', () => {
    render(
      <FeedbackCollection 
        triggerPoint="manual" 
        onFeedbackSubmitted={jest.fn()}
      />
    );
    
    fireEvent.click(screen.getByText('Provide Feedback'));
    
    // Check feedback type options
    const select = screen.getByDisplayValue('General Feedback') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'goal_effectiveness' } });
    
    expect(select.value).toBe('goal_effectiveness');
  });

  test('stores feedback locally as backup', async () => {
    const mockSetItem = jest.spyOn(Storage.prototype, 'setItem');
    
    render(
      <FeedbackCollection 
        triggerPoint="manual" 
        onFeedbackSubmitted={jest.fn()}
      />
    );
    
    fireEvent.click(screen.getByText('Provide Feedback'));
    
    // Fill and submit feedback
    fireEvent.change(screen.getByDisplayValue(''), { 
      target: { value: 'Goal Setting Experience' } 
    });
    fireEvent.change(screen.getByPlaceholderText('Brief summary of your feedback'), {
      target: { value: 'Test feedback' }
    });
    fireEvent.change(screen.getByPlaceholderText(/Please provide detailed feedback/), {
      target: { value: 'Detailed feedback' }
    });
    
    fireEvent.click(screen.getByText('Submit Feedback'));
    
    await waitFor(() => {
      expect(mockSetItem).toHaveBeenCalledWith('userFeedback', expect.any(String));
    });
  });
});

describe('FeedbackSummaryDashboard', () => {
  test('renders empty state when no feedback exists', () => {
    Storage.prototype.getItem = jest.fn(() => '[]');
    
    render(<FeedbackSummaryDashboard />);
    
    expect(screen.getByText('Feedback Summary')).toBeInTheDocument();
    expect(screen.getByText('No feedback collected yet.')).toBeInTheDocument();
  });

  test('displays feedback metrics when feedback exists', () => {
    const mockFeedback = [
      {
        id: 'feedback1',
        rating: 5,
        category: 'Goal Setting Experience',
        subject: 'Great experience',
        message: 'Really helpful tool',
        createdAt: new Date().toISOString()
      },
      {
        id: 'feedback2',
        rating: 4,
        category: 'Wizard Usability',
        subject: 'Minor improvements',
        message: 'Could be more intuitive',
        createdAt: new Date().toISOString()
      }
    ];
    
    Storage.prototype.getItem = jest.fn(() => JSON.stringify(mockFeedback));
    
    render(<FeedbackSummaryDashboard />);
    
    expect(screen.getByText('2')).toBeInTheDocument(); // Total feedback
    expect(screen.getByText('4.5 ★')).toBeInTheDocument(); // Average rating
    expect(screen.getByText('2')).toBeInTheDocument(); // Categories count
  });

  test('shows category breakdown', () => {
    const mockFeedback = [
      {
        id: 'feedback1',
        category: 'Goal Setting Experience',
        rating: 5,
        createdAt: new Date().toISOString()
      }
    ];
    
    Storage.prototype.getItem = jest.fn(() => JSON.stringify(mockFeedback));
    
    render(<FeedbackSummaryDashboard />);
    
    expect(screen.getByText('Category Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Goal Setting Experience')).toBeInTheDocument();
  });
});

describe('PlanVsRealityAnalysisHub', () => {
  beforeEach(() => {
    mockUseGoalSizing.mockReturnValue({
      config: mockGoalConfig,
      isLoading: false,
      saveConfig: jest.fn(),
      loadConfig: jest.fn(),
      saveOnboardingProgress: jest.fn(),
      loadOnboardingProgress: jest.fn(),
      completeOnboardingPhase: jest.fn(),
      onboardingProgress: null,
      currentPhase: 1,
      saveUserContext: jest.fn(),
      loadUserContext: jest.fn(),
      createBackup: jest.fn(),
      restoreFromBackup: jest.fn()
    });
  });

  test('renders main hub with tab navigation', () => {
    render(<PlanVsRealityAnalysisHub />);
    
    expect(screen.getByText('Plan vs. Reality Analysis')).toBeInTheDocument();
    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Insights & Actions')).toBeInTheDocument();
    expect(screen.getByText('Feedback System')).toBeInTheDocument();
  });

  test('switches between tabs correctly', () => {
    render(<PlanVsRealityAnalysisHub />);
    
    // Start on analytics tab
    expect(screen.getByText('Goal Performance Analytics')).toBeInTheDocument();
    
    // Switch to insights tab
    fireEvent.click(screen.getByText('Insights & Actions'));
    expect(screen.getByText('Analysis Insights')).toBeInTheDocument();
    
    // Switch to feedback tab
    fireEvent.click(screen.getByText('Feedback System'));
    expect(screen.getByText('Feedback & Continuous Improvement')).toBeInTheDocument();
  });

  test('generates insights based on goal configuration', async () => {
    render(<PlanVsRealityAnalysisHub defaultTab="insights" />);
    
    await waitFor(() => {
      expect(screen.getByText('Goal Target Analysis')).toBeInTheDocument();
    });
  });

  test('shows action required alerts', async () => {
    const configWithHighRisk = {
      ...mockGoalConfig,
      sizingRules: {
        ...mockGoalConfig.sizingRules,
        maxPositionSize: 25, // High position size
        maxTotalExposure: 50 // Add missing property
      },
      capitalObjectiveParameters: {
        ...mockGoalConfig.capitalObjectiveParameters,
        timeHorizonMonths: 12 // Ensure this is included
      }
    };
    
    mockUseGoalSizing.mockReturnValue({
      ...mockUseGoalSizing(),
      config: configWithHighRisk
    });
    
    render(<PlanVsRealityAnalysisHub defaultTab="insights" />);
    
    await waitFor(() => {
      expect(screen.getByText('High Position Size Limit')).toBeInTheDocument();
      expect(screen.getByText('Action Required')).toBeInTheDocument();
    });
  });

  test('handles feedback submission from insights', async () => {
    render(<PlanVsRealityAnalysisHub defaultTab="insights" />);
    
    // Should be able to refresh insights
    const refreshButton = screen.getByText('Refresh Insights');
    fireEvent.click(refreshButton);
    
    // Insights should still be visible
    await waitFor(() => {
      expect(screen.getByText('Goal Target Analysis')).toBeInTheDocument();
    });
  });

  test('integrates feedback collection across tabs', () => {
    render(<PlanVsRealityAnalysisHub />);
    
    // Should have feedback collection trigger on analytics tab
    expect(screen.getByText('Provide Feedback')).toBeInTheDocument();
    
    // Switch to feedback tab
    fireEvent.click(screen.getByText('Feedback System'));
    expect(screen.getByText('Submit New Feedback')).toBeInTheDocument();
  });

  test('shows no config state appropriately', () => {
    mockUseGoalSizing.mockReturnValue({
      ...mockUseGoalSizing(),
      config: null
    });
    
    render(<PlanVsRealityAnalysisHub />);
    
    expect(screen.getByText('No Goal Configuration Found')).toBeInTheDocument();
    expect(screen.getByText('Start Goal Setup')).toBeInTheDocument();
  });

  test('handles loading state', () => {
    mockUseGoalSizing.mockReturnValue({
      ...mockUseGoalSizing(),
      isLoading: true
    });
    
    render(<PlanVsRealityAnalysisHub />);
    
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});

describe('Integration Tests', () => {
  test('feedback flows work end-to-end', async () => {
    const mockOnFeedbackSubmitted = jest.fn();
    
    render(
      <PlanVsRealityAnalysisHub 
        defaultTab="feedback"
        showFeedbackTrigger={true}
      />
    );
    
    // Open feedback modal
    fireEvent.click(screen.getByText('Submit New Feedback'));
    
    // Fill out feedback form
    fireEvent.change(screen.getByDisplayValue(''), { 
      target: { value: 'Goal Setting Experience' } 
    });
    fireEvent.change(screen.getByPlaceholderText('Brief summary of your feedback'), {
      target: { value: 'Integration test feedback' }
    });
    fireEvent.change(screen.getByPlaceholderText(/Please provide detailed feedback/), {
      target: { value: 'This is an integration test for the feedback system.' }
    });
    
    // Submit feedback
    fireEvent.click(screen.getByText('Submit Feedback'));
    
    // Should close modal and update summary
    await waitFor(() => {
      expect(screen.queryByText('Share Your Feedback')).not.toBeInTheDocument();
    });
  });

  test('analytics and insights work together', async () => {
    render(<PlanVsRealityAnalysisHub />);
    
    // Start on analytics tab
    expect(screen.getByText('Goal Performance Analytics')).toBeInTheDocument();
    
    // Switch to insights tab
    fireEvent.click(screen.getByText('Insights & Actions'));
    
    // Should show insights based on the same config
    await waitFor(() => {
      expect(screen.getByText('Goal Target Analysis')).toBeInTheDocument();
    });
    
    // Refresh insights
    fireEvent.click(screen.getByText('Refresh Insights'));
    
    // Should still show insights
    expect(screen.getByText('Goal Target Analysis')).toBeInTheDocument();
  });
}); 