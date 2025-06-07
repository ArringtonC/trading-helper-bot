import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GoalSizingWizard from '../GoalSizingWizard';
import { GoalSizingConfig } from '../../../types/goalSizing'; // Import from types

// Import the mocked component after the mock is defined
const { GoalSizingProvider } = require('../../../context/GoalSizingContext');


// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock the sizingSolvers module
jest.mock('../../../utils/sizingSolvers', () => ({
  solveFixedFractionalF: jest.fn(() => null),
  calculateKellyFraction: jest.fn(() => null),
}));



// Mock the GoalSizing context to avoid IndexedDB initialization
jest.mock('../../../context/GoalSizingContext', () => ({
  GoalSizingProvider: ({ children }: { children: React.ReactNode }) => children,
  useGoalSizing: () => ({
    saveConfig: jest.fn().mockResolvedValue(undefined),
    isLoading: false,
    error: null,
    configs: [],
    loadConfigs: jest.fn(),
    deleteConfig: jest.fn(),
    updateConfig: jest.fn(),
  }),
}));

const mockOnComplete = jest.fn();
const mockOnClose = jest.fn();

const renderWizard = (initialConfig?: Partial<GoalSizingConfig>, isFirstTimeUser = false) => {
  // Ensure a minimal valid config if initialConfig is provided but incomplete
  const baseConfig: GoalSizingConfig = {
    goalType: '',
    goalParameters: {},
    sizingRules: {
      maxPositionSize: 5,
      maxTotalExposure: 25
    },
    capitalObjectiveParameters: {
      currentBalance: 10000,
      targetBalance: 12000,
      timeHorizonMonths: 12
    },
    tradeStatistics: {}
  };
  const configToUse = initialConfig 
    ? { ...baseConfig, ...initialConfig } 
    : baseConfig;

  return render(
    <GoalSizingWizard
      isOpen={true}
      onClose={mockOnClose}
      onComplete={mockOnComplete}
      initialConfig={configToUse as GoalSizingConfig}
      isFirstTimeUser={isFirstTimeUser}
    />
  );
};

describe('GoalSizingWizard - Position Limit Suggestions', () => {
  beforeEach(() => {
    localStorageMock.clear();
    mockOnComplete.mockClear();
    mockOnClose.mockClear();
    jest.clearAllMocks(); // Clears mock call history and implementations
  });

  test('should suggest 5% Max Position Size and 50% Max Total Exposure for "Maximize Growth" with default moderate risk', async () => {
    renderWizard(undefined, false); // isFirstTimeUser = false means no intro screen

    // Step 1: Choose Goal Type
    // Find and click the "Maximize Growth" radio button.
    // Using a more resilient query if label text is complex.
    const growthRadio = screen.getByRole('radio', { name: /Maximize Growth/i });
    fireEvent.click(growthRadio);
    
    // Wait for the internal state to update reflecting the choice.
    await waitFor(() => {
      expect(growthRadio).toBeChecked();
    });

    // Click "Next" to go from Step 1 (Choose Goal) to Step 4 (Set Goal Parameters for Growth)
    // Note: The wizard's internal step numbering might differ from display numbering.
    // We are targeting the logical flow.
    const nextButtonStep1 = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButtonStep1);

    // Step 4: Set Goal Parameters (for Growth goal type)
    // This step is where risk tolerance is typically set. For "Maximize Growth",
    // it defaults to "moderate". The suggestions are applied via useEffect.
    // We need to ensure this step is loaded before proceeding.
    await screen.findByText(/Set Goal Parameters/i); // Wait for header of this step

    // Fill in required fields to pass validation for this step
    const targetAnnualReturnInput = screen.getByLabelText(/Target Annual Return/i);
    fireEvent.change(targetAnnualReturnInput, { target: { value: '15' } }); // Provide a valid value
    await waitFor(() => expect(targetAnnualReturnInput).toHaveValue(15));

    const nextButtonStep4 = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButtonStep4);

    // Step 5: Configure Sizing Rules
    // This is where the position limit inputs are displayed.
    await screen.findByText(/Configure Sizing Rules/i); // Wait for header of this step

    // Find the input for "Maximum Position Size (% of Account)"
    // Using a more direct query targeting the input via its label.
    const maxPositionSizeInput = screen.getByLabelText(/Maximum Position Size \(% of Account\)/i);
    expect(maxPositionSizeInput).toHaveValue(5);

    // Find the input for "Maximum Total Exposure (% of Account)"
    const maxTotalExposureInput = screen.getByLabelText(/Maximum Total Exposure \(% of Account\)/i);
    expect(maxTotalExposureInput).toHaveValue(50);
  });

  test('should suggest 2% Max Position Size and 20% Max Total Exposure for "Maximize Growth" with "Conservative" risk', async () => {
    renderWizard(undefined, false);

    // Step 1: Choose Goal Type
    const growthRadio = screen.getByRole('radio', { name: /Maximize Growth/i });
    fireEvent.click(growthRadio);
    await waitFor(() => expect(growthRadio).toBeChecked());

    let nextButton = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButton);

    // Step 4: Set Goal Parameters (for Growth goal type)
    await screen.findByText(/Set Goal Parameters/i);

    // Fill in required fields to pass validation for this step
    const targetAnnualReturnInput = screen.getByLabelText(/Target Annual Return/i);
    fireEvent.change(targetAnnualReturnInput, { target: { value: '15' } }); // Provide a valid value
    await waitFor(() => expect(targetAnnualReturnInput).toHaveValue(15));

    // Change Risk Tolerance to Conservative
    const riskToleranceSelect = screen.getByLabelText(/Risk Tolerance Level/i);
    fireEvent.change(riskToleranceSelect, { target: { value: 'conservative' } });
    await waitFor(() => expect(riskToleranceSelect).toHaveValue('conservative'));
    
    nextButton = screen.getByRole('button', { name: /Next/i }); // Re-fetch if needed, or ensure it's the same instance
    fireEvent.click(nextButton);

    // Step 5: Configure Sizing Rules
    await screen.findByText(/Configure Sizing Rules/i);

    const maxPositionSizeInput = screen.getByLabelText(/Maximum Position Size \(% of Account\)/i);
    expect(maxPositionSizeInput).toHaveValue(2);

    const maxTotalExposureInput = screen.getByLabelText(/Maximum Total Exposure \(% of Account\)/i);
    expect(maxTotalExposureInput).toHaveValue(20);
  });

  test('should suggest 10% Max Position Size and 60% Max Total Exposure for "Maximize Growth" with "Aggressive" risk', async () => {
    renderWizard(undefined, false);

    // Step 1: Choose Goal Type
    const growthRadio = screen.getByRole('radio', { name: /Maximize Growth/i });
    fireEvent.click(growthRadio);
    await waitFor(() => expect(growthRadio).toBeChecked());

    let nextButton = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButton);

    // Step 4: Set Goal Parameters (for Growth goal type)
    await screen.findByText(/Set Goal Parameters/i);

    // Fill in required fields to pass validation for this step
    const targetAnnualReturnInput = screen.getByLabelText(/Target Annual Return/i);
    fireEvent.change(targetAnnualReturnInput, { target: { value: '15' } }); // Provide a valid value
    await waitFor(() => expect(targetAnnualReturnInput).toHaveValue(15));

    // Change Risk Tolerance to Aggressive
    const riskToleranceSelect = screen.getByLabelText(/Risk Tolerance Level/i);
    fireEvent.change(riskToleranceSelect, { target: { value: 'aggressive' } });
    await waitFor(() => expect(riskToleranceSelect).toHaveValue('aggressive'));
    
    nextButton = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButton);

    // Step 5: Configure Sizing Rules
    await screen.findByText(/Configure Sizing Rules/i);

    const maxPositionSizeInput = screen.getByLabelText(/Maximum Position Size \(% of Account\)/i);
    expect(maxPositionSizeInput).toHaveValue(10);

    const maxTotalExposureInput = screen.getByLabelText(/Maximum Total Exposure \(% of Account\)/i);
    expect(maxTotalExposureInput).toHaveValue(60);
  });

  test('should use default 5% Max Position Size and 5% Max Total Exposure for "Capital Objective" goal', async () => {
    renderWizard(undefined, false);

    // Step 1: Choose Goal Type
    const capitalObjectiveRadio = screen.getByRole('radio', { name: /Achieve a Specific Capital Objective/i });
    fireEvent.click(capitalObjectiveRadio);
    await waitFor(() => expect(capitalObjectiveRadio).toBeChecked());

    let nextButton = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButton); // To Step 2 (Capital Objective Params)

    // Step 2: Define Your Capital Objective
    await screen.findByText(/Define Your Capital Objective/i);
    // Fill in valid data to pass validation for Step 2
    fireEvent.change(screen.getByLabelText(/Current Account Balance/i), { target: { value: '10000' } });
    fireEvent.change(screen.getByLabelText(/Target Account Balance/i), { target: { value: '20000' } });
    fireEvent.change(screen.getByLabelText(/Time Horizon \(Years\)/i), { target: { value: '1' } });
    
    nextButton = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButton); // To Step 3 (Trade Statistics)

    // Step 3: Provide Your Typical Trade Statistics
    await screen.findByText(/Provide Your Typical Trade Statistics/i);
    // Fill in valid data for Step 3
    fireEvent.change(screen.getByLabelText(/Estimated Win Rate/i), { target: { value: '0.55' } });
    fireEvent.change(screen.getByLabelText(/Average Payoff Ratio/i), { target: { value: '1.5' } });
    fireEvent.change(screen.getByLabelText(/Expected Number of Trades/i), { target: { value: '100' } });

    nextButton = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButton); // To Step 5 (Configure Sizing Rules)
    
    // Step 5: Configure Sizing Rules
    await screen.findByText(/Configure Sizing Rules/i);

    const maxPositionSizeInput = screen.getByLabelText(/Maximum Position Size \(% of Account\)/i);
    // For Capital Objective, the specific radio button onChange sets these to 5% currently.
    // The dynamic suggestions from riskTolerance (growth goal) should not apply.
    expect(maxPositionSizeInput).toHaveValue(5);

    const maxTotalExposureInput = screen.getByLabelText(/Maximum Total Exposure \(% of Account\)/i);
    expect(maxTotalExposureInput).toHaveValue(5);
  });

  // Additional test cases will be added here for other scenarios:
  // - "Maximize Growth" with "Aggressive" risk
  // - "Capital Objective" goal (should not use these dynamic suggestions)
}); 