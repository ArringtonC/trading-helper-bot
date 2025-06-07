import React, { useReducer, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { solveFixedFractionalF, calculateKellyFraction } from '../../utils/sizingSolvers';
import { useGoalSizing } from '../../context/GoalSizingContext';
import { GoalSizingConfig } from '../../types/goalSizing';
import { useConfigValidation } from '../../hooks/useValidation';
import { EnhancedPositionSizingInterface } from './EnhancedPositionSizingInterface';
import { PositionSizingResult } from '../../utils/finance/PositionSizingCalculator';


// Interfaces
interface SuggestedFractions {
  fixedFractional?: number | null;
  fullKelly?: number | null;
  halfKelly?: number | null;
}

interface GoalSizingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (config: GoalSizingConfig) => void;
  isFirstTimeUser?: boolean;
  initialConfig?: GoalSizingConfig;
}

interface WizardState {
  currentStep: number;
  config: GoalSizingConfig;
  errors: Record<string, string>;
  showIntro: boolean;
  suggestedFractions: SuggestedFractions;
  sizingWarning: string | null;
  enhancedPositionResult: PositionSizingResult | null;
  showEnhancedInterface: boolean;
}

type WizardAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_CONFIG'; payload: GoalSizingConfig }
  | { type: 'UPDATE_CONFIG'; payload: Partial<GoalSizingConfig> }
  | { type: 'SET_ERROR'; payload: { step: number; error: string | null } }
  | { type: 'SET_SHOW_INTRO'; payload: boolean }
  | { type: 'SET_SUGGESTED_FRACTIONS'; payload: SuggestedFractions }
  | { type: 'SET_SIZING_WARNING'; payload: string | null }
  | { type: 'SET_ENHANCED_POSITION_RESULT'; payload: PositionSizingResult | null }
  | { type: 'TOGGLE_ENHANCED_INTERFACE'; payload: boolean }
  | { type: 'LOAD_SAVED_STATE'; payload: { step: number; config: GoalSizingConfig } }
  | { type: 'RESET_TO_DEFAULTS'; payload: GoalSizingConfig };

// Constants
const LOCAL_STORAGE_KEY = "goalSizingWizardState";
const ONBOARDING_VIEWED_KEY = "goalSizingWizardOnboardingViewed";
const HIGH_F_THRESHOLD = 0.20;

// Default configuration factory
const createDefaultConfig = (): GoalSizingConfig => ({
      goalType: '',
      goalParameters: {
        targetReturn: 10,
        timeFrame: 12,
        riskTolerance: "moderate",
        drawdownTolerance: 5,
        incomeTarget: 1000,
      },
      capitalObjectiveParameters: {
        currentBalance: 10000,
        targetBalance: 12000,
        timeHorizonMonths: 12,
      },
      tradeStatistics: {
    winRate: 50,
    payoffRatio: 1.5,
    numTrades: 100,
      },
      sizingRules: {
        maxPositionSize: 2,
        maxTotalExposure: 50,
        baseMethod: "fixedFractional",
        baseSizePercentage: 1,
        minPositionSize: 0.5,
        volatilityAdjustment: {
          enabled: false,
          atrPeriod: 14,
          atrMultiplier: 1,
        },
        kellyFraction: "half",
        equityTrendFilter: {
          enabled: false,
          maPeriod: 20,
          allocationAboveMa: 100,
          allocationBelowMa: 50,
        },
      },
});

// Reducer
const wizardReducer = (state: WizardState, action: WizardAction): WizardState => {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_CONFIG':
      return { ...state, config: action.payload };
    case 'UPDATE_CONFIG':
      return { ...state, config: { ...state.config, ...action.payload } };
    case 'SET_ERROR':
      return { 
        ...state, 
        errors: { 
          ...state.errors, 
          [action.payload.step]: action.payload.error || '' 
        } 
      };
    case 'SET_SHOW_INTRO':
      return { ...state, showIntro: action.payload };
    case 'SET_SUGGESTED_FRACTIONS':
      return { ...state, suggestedFractions: action.payload };
    case 'SET_SIZING_WARNING':
      return { ...state, sizingWarning: action.payload };
    case 'SET_ENHANCED_POSITION_RESULT':
      return { ...state, enhancedPositionResult: action.payload };
    case 'TOGGLE_ENHANCED_INTERFACE':
      return { ...state, showEnhancedInterface: action.payload };
    case 'LOAD_SAVED_STATE':
      return { 
        ...state, 
        currentStep: action.payload.step, 
        config: action.payload.config 
      };
    case 'RESET_TO_DEFAULTS':
      return { 
        ...state, 
        config: action.payload,
        currentStep: 1,
        errors: {},
        suggestedFractions: {},
        sizingWarning: null
      };
    default:
      return state;
  }
};



// Main Component
const GoalSizingWizard: React.FC<GoalSizingWizardProps> = ({
  isOpen,
  onClose,
  onComplete,
  initialConfig,
  isFirstTimeUser = false,
}) => {
  const defaultConfig = useMemo(() => createDefaultConfig(), []);
  
  // Initialize state with useReducer
  const [state, dispatch] = useReducer(wizardReducer, {
    currentStep: 1,
    config: initialConfig ? { ...defaultConfig, ...initialConfig } : defaultConfig,
    errors: {},
    showIntro: false,
    suggestedFractions: {},
    sizingWarning: null,
    enhancedPositionResult: null,
    showEnhancedInterface: false,
  });

  const { saveConfig, isLoading: isSavingConfig } = useGoalSizing();
  const { validateConfig } = useConfigValidation(state.config);
  const navigate = useNavigate();

  // Memoized suggested fractions calculation to prevent infinite loops
  const calculatedSuggestions = useMemo(() => {
    if (
      state.config.goalType === 'capitalObjective' &&
      state.config.capitalObjectiveParameters && 
      state.config.tradeStatistics
    ) {
      const { currentBalance, targetBalance, timeHorizonMonths } = state.config.capitalObjectiveParameters;
      const { winRate, payoffRatio, numTrades } = state.config.tradeStatistics;

      if (
        currentBalance && currentBalance > 0 &&
        targetBalance && targetBalance > currentBalance &&
        timeHorizonMonths && timeHorizonMonths > 0 &&
        winRate !== undefined && winRate > 0 && winRate <= 100 &&
        payoffRatio !== undefined && payoffRatio > 0 &&
        numTrades !== undefined && numTrades > 0 && Number.isInteger(numTrades)
      ) {
        const targetCapitalRatio = targetBalance / currentBalance;
        // Convert win rate from percentage to decimal for calculations
        const winRateDecimal = winRate / 100;
        const ffF = solveFixedFractionalF({ targetCapitalRatio, winRate: winRateDecimal, payoffRatio, numTrades });
        const kellyF = calculateKellyFraction({ winRate: winRateDecimal, payoffRatio });
        const halfKellyF = kellyF !== null ? kellyF / 2 : null;

        let warning: string | null = null;
        if (ffF !== null && ffF > HIGH_F_THRESHOLD) {
          warning = `Warning: The calculated Fixed Fractional risk per trade (${(ffF * 100).toFixed(1)}%) to meet your objective is high. Consider re-evaluating your inputs or using a more conservative approach.`;
        } else if (kellyF !== null && kellyF > HIGH_F_THRESHOLD) {
          warning = `Warning: The calculated Full Kelly risk per trade (${(kellyF * 100).toFixed(1)}%) is high. Consider using a smaller fraction of Kelly or re-evaluating your inputs.`;
        }

        return {
          fractions: { fixedFractional: ffF, fullKelly: kellyF, halfKelly: halfKellyF },
          warning
        };
      }
    }
    return { fractions: {}, warning: null };
  }, [state.config.goalType, state.config.capitalObjectiveParameters, state.config.tradeStatistics]);

  // Update suggestions when calculations change
  useEffect(() => {
    dispatch({ type: 'SET_SUGGESTED_FRACTIONS', payload: calculatedSuggestions.fractions });
    dispatch({ type: 'SET_SIZING_WARNING', payload: calculatedSuggestions.warning });
  }, [calculatedSuggestions]);

  // Initialize wizard state on open
  useEffect(() => {
    if (isOpen) {
      const onboardingViewed = localStorage.getItem(ONBOARDING_VIEWED_KEY);
      if (isFirstTimeUser && !onboardingViewed) {
        dispatch({ type: 'SET_SHOW_INTRO', payload: true });
        dispatch({ type: 'SET_STEP', payload: 0 });
      } else {
        dispatch({ type: 'SET_SHOW_INTRO', payload: false });
        const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedState) {
          try {
            const { step: savedStep, config: savedData } = JSON.parse(savedState);
            if (savedStep && savedData) {
              dispatch({ type: 'LOAD_SAVED_STATE', payload: { step: savedStep, config: savedData } });
            } else {
              dispatch({ type: 'RESET_TO_DEFAULTS', payload: defaultConfig });
            }
          } catch (error) {
            console.error("Failed to parse saved wizard state:", error);
            dispatch({ type: 'RESET_TO_DEFAULTS', payload: defaultConfig });
            localStorage.removeItem(LOCAL_STORAGE_KEY);
          }
        } else {
          dispatch({ type: 'RESET_TO_DEFAULTS', payload: defaultConfig });
        }
      }
    }
  }, [isOpen, isFirstTimeUser, defaultConfig]);

  // Save state to localStorage
  useEffect(() => {
    if (isOpen && !state.showIntro) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ 
          step: state.currentStep, 
          config: state.config 
        }));
      } catch (error) {
        console.error('Failed to save wizard config to local storage:', error);
      }
    }
  }, [state.currentStep, state.config, isOpen, state.showIntro]);

  // Validation function
  const validateStep = (step: number): boolean => {
    if (step === 0) return true; // No validation for intro step

    const validation = validateConfig(state.config);
    const stepSpecificErrors = validation.errors.filter(error => {
      switch (step) {
        case 1: return error.field === 'goalType';
        case 2: return error.field.startsWith('capitalObjectiveParameters');
        case 3: return error.field.startsWith('tradeStatistics');
        case 4: return error.field.startsWith('goalParameters');
        case 5: return error.field.startsWith('sizingRules');
        default: return false;
      }
    });



    let stepErrors: string | null = null;
    if (stepSpecificErrors.length > 0) {
      stepErrors = stepSpecificErrors[0].message;
    } else {
      // Additional business logic validation
    switch (step) {
      case 1:
          if (!state.config.goalType) {
           stepErrors = 'Please select a goal type.';
        }
        break;
        case 2:
          if (state.config.goalType === 'capitalObjective') {
            if (!state.config.capitalObjectiveParameters?.currentBalance || state.config.capitalObjectiveParameters.currentBalance <= 0) {
            stepErrors = 'Please enter a valid current balance (must be > 0).';
            } else if (!state.config.capitalObjectiveParameters?.targetBalance || state.config.capitalObjectiveParameters.targetBalance <= 0) {
            stepErrors = 'Please enter a valid target balance (must be > 0).';
            } else if (state.config.capitalObjectiveParameters?.targetBalance <= (state.config.capitalObjectiveParameters?.currentBalance || 0)) {
            stepErrors = 'Target balance must be greater than current balance.';
            } else if (!state.config.capitalObjectiveParameters?.timeHorizonMonths || state.config.capitalObjectiveParameters.timeHorizonMonths <= 0) {
            stepErrors = 'Please enter a valid time horizon in months (must be > 0).';
          }
        }
        break;
        case 3:
          // Win rate is stored as percentage (0-100), but user enters decimal (0-1)
          if (state.config.tradeStatistics?.winRate === undefined || state.config.tradeStatistics.winRate <= 0 || state.config.tradeStatistics.winRate > 100) {
            stepErrors = 'Please enter a valid win rate (0.01 to 1.0).';
          } else if (!state.config.tradeStatistics?.payoffRatio || state.config.tradeStatistics.payoffRatio <= 0) {
            stepErrors = 'Please enter a valid payoff ratio (must be > 0).';
          } else if (!state.config.tradeStatistics?.numTrades || state.config.tradeStatistics.numTrades <= 0 || !Number.isInteger(state.config.tradeStatistics.numTrades)) {
            stepErrors = 'Please enter a valid number of trades (must be a positive integer).';
          }
        break;
        case 5:
          if (!state.config.sizingRules?.baseSizePercentage || state.config.sizingRules.baseSizePercentage <= 0 || state.config.sizingRules.baseSizePercentage > 10) {
            stepErrors = 'Please enter a valid base position size between 0.1% and 10%.';
          } else if (!state.config.sizingRules?.maxPositionSize || state.config.sizingRules.maxPositionSize <= 0 || state.config.sizingRules.maxPositionSize > 20) {
            stepErrors = 'Please enter a valid maximum position size between 0.1% and 20%.';
          } else if (!state.config.sizingRules?.maxTotalExposure || state.config.sizingRules.maxTotalExposure <= 0 || state.config.sizingRules.maxTotalExposure > 200) {
            stepErrors = 'Please enter a valid maximum total exposure between 10% and 200%.';
          } else if (state.config.sizingRules.baseSizePercentage > state.config.sizingRules.maxPositionSize) {
            stepErrors = 'Base position size cannot exceed maximum position size.';
          } else if (state.config.sizingRules.maxPositionSize > state.config.sizingRules.maxTotalExposure) {
            stepErrors = 'Maximum position size cannot exceed maximum total exposure.';
          } else if (!state.config.sizingRules?.baseMethod) {
            stepErrors = 'Please select a position sizing method.';
          }
        break;
        // Add other validation cases as needed
      }
    }

    dispatch({ type: 'SET_ERROR', payload: { step, error: stepErrors } });
    return stepErrors === null;
  };

  // Event handlers
  const handleNext = async () => {
    if (state.showIntro) {
      dispatch({ type: 'SET_SHOW_INTRO', payload: false });
      dispatch({ type: 'SET_STEP', payload: 1 });
      localStorage.setItem(ONBOARDING_VIEWED_KEY, 'true');
      return;
    }

    if (validateStep(state.currentStep)) {
      let nextStepNumber = -1; 

      if (state.currentStep === 1) {
        nextStepNumber = state.config.goalType === 'capitalObjective' ? 2 : 4;
      } else if (state.currentStep === 2) {
        nextStepNumber = 3; 
      } else if (state.currentStep === 3) {
        nextStepNumber = 5; 
      } else if (state.currentStep === 4) {
        nextStepNumber = 5; 
      } else if (state.currentStep === 5) {
        nextStepNumber = 6;
      } else if (state.currentStep === 6) {
        // Final step - save and navigate to results
        try {
          await saveConfig(state.config);
          onComplete(state.config);
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          
          // Navigate to position sizing results page with the config data
          // Store the config in sessionStorage for the results page
          sessionStorage.setItem('goalSizingResults', JSON.stringify({
            config: state.config,
            goalType: state.config.goalType,
            currentBalance: state.config.capitalObjectiveParameters?.currentBalance,
            targetBalance: state.config.capitalObjectiveParameters?.targetBalance,
            timeHorizonMonths: state.config.capitalObjectiveParameters?.timeHorizonMonths,
            winRate: state.config.tradeStatistics?.winRate,
            avgRewardRisk: state.config.tradeStatistics?.payoffRatio,
            riskPerTrade: state.config.sizingRules?.baseSizePercentage,
            rewardRiskRatio: state.config.tradeStatistics?.payoffRatio
          }));
          
          // Navigate to goal sizing results page
          navigate('/goal-sizing-results', {
            state: {
              config: state.config,
              goalType: state.config.goalType,
              currentBalance: state.config.capitalObjectiveParameters?.currentBalance,
              targetBalance: state.config.capitalObjectiveParameters?.targetBalance,
              timeHorizonMonths: state.config.capitalObjectiveParameters?.timeHorizonMonths,
              winRate: state.config.tradeStatistics?.winRate,
              avgRewardRisk: state.config.tradeStatistics?.payoffRatio,
              riskPerTrade: state.config.sizingRules?.baseSizePercentage,
              rewardRiskRatio: state.config.tradeStatistics?.payoffRatio
            }
          });
        } catch (error) {
          console.error('Failed to save config:', error);
        }
        return;
      }

      if (nextStepNumber > 0) {
        dispatch({ type: 'SET_STEP', payload: nextStepNumber });
      }
    }
  };

  const handleBack = () => {
    if (state.currentStep > 1) {
    let prevStepNumber = -1;

      if (state.currentStep === 2) {
      prevStepNumber = 1; 
      } else if (state.currentStep === 3) {
      prevStepNumber = 2; 
      } else if (state.currentStep === 4) {
      prevStepNumber = 1; 
      } else if (state.currentStep === 5) {
        prevStepNumber = state.config.goalType === 'capitalObjective' ? 3 : 4;
      } else if (state.currentStep === 6) {
        prevStepNumber = 5;
      }

      if (prevStepNumber > 0) {
        dispatch({ type: 'SET_STEP', payload: prevStepNumber });
      }
    }
  };

  const handleCancel = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    onClose();
  };

  // Simplified render content for now - just basic structure
  const renderStepContent = () => {
    if (state.showIntro) {
      return (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Welcome to Goal Sizing!</h2>
          <p className="text-gray-600 mb-6">
            This wizard will help you configure your position sizing strategy based on your trading goals.
          </p>
        </div>
      );
    }

    switch (state.currentStep) {
      case 1:
        return (
          <div>
            <h3 className="text-lg font-medium mb-4">Step 1: Choose Your Goal</h3>
            <div className="space-y-3">
              {['capitalObjective', 'growth', 'drawdown', 'income'].map((goalType) => (
                <label key={goalType} className="flex items-center space-x-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="goalType"
                    value={goalType}
                    checked={state.config.goalType === goalType}
                    onChange={(e) => dispatch({ type: 'UPDATE_CONFIG', payload: { goalType: e.target.value } })}
                    className="text-blue-600"
                  />
                  <span className="capitalize">{goalType.replace(/([A-Z])/g, ' $1').trim()}</span>
              </label>
              ))}
            </div>
          </div>
        );
      
      case 2:
        return (
          <div>
            <h3 className="text-lg font-medium mb-4">Step 2: Capital Objective Parameters</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Balance ($)</label>
                <input
                  type="number"
                  value={state.config.capitalObjectiveParameters?.currentBalance || ''}
                                     onChange={(e) => dispatch({ 
                     type: 'UPDATE_CONFIG', 
                     payload: { 
                    capitalObjectiveParameters: {
                      currentBalance: parseFloat(e.target.value) || 0,
                         targetBalance: state.config.capitalObjectiveParameters?.targetBalance || 0,
                         timeHorizonMonths: state.config.capitalObjectiveParameters?.timeHorizonMonths || 0
                       }
                    }
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Balance ($)</label>
                <input
                  type="number"
                  value={state.config.capitalObjectiveParameters?.targetBalance || ''}
                                     onChange={(e) => dispatch({ 
                     type: 'UPDATE_CONFIG', 
                     payload: { 
                    capitalObjectiveParameters: {
                         currentBalance: state.config.capitalObjectiveParameters?.currentBalance || 0,
                      targetBalance: parseFloat(e.target.value) || 0,
                         timeHorizonMonths: state.config.capitalObjectiveParameters?.timeHorizonMonths || 0
                       }
                    }
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Horizon (Months)</label>
                <input
                  type="number"
                  value={state.config.capitalObjectiveParameters?.timeHorizonMonths || ''}
                                     onChange={(e) => dispatch({ 
                     type: 'UPDATE_CONFIG', 
                     payload: { 
                    capitalObjectiveParameters: {
                         currentBalance: state.config.capitalObjectiveParameters?.currentBalance || 0,
                         targetBalance: state.config.capitalObjectiveParameters?.targetBalance || 0,
                         timeHorizonMonths: parseFloat(e.target.value) || 0
                       }
                     }
                   })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <h3 className="text-lg font-medium mb-4">Step 3: Enhanced Position Sizing</h3>
            <p className="text-gray-600 mb-6">
              Configure your position sizing with research-driven calculations including Kelly Criterion, VIX scaling, and comprehensive risk management.
            </p>
            
            {/* Enhanced Position Sizing Interface */}
            <EnhancedPositionSizingInterface
              accountBalance={state.config.capitalObjectiveParameters?.currentBalance || 10000}
              onPositionSizeChange={(result) => {
                dispatch({ type: 'SET_ENHANCED_POSITION_RESULT', payload: result });
                
                // Update trade statistics and sizing rules based on enhanced calculations
                dispatch({ 
                  type: 'UPDATE_CONFIG', 
                  payload: { 
                    tradeStatistics: {
                      winRate: 55, // Default from enhanced interface
                      payoffRatio: 1.5,
                      numTrades: 100
                    },
                    sizingRules: {
                      ...state.config.sizingRules,
                      baseSizePercentage: result.recommendedPositionSize,
                      maxPositionSize: result.maxPositionSize,
                      baseMethod: "kelly" as const
                    }
                  }
                });
              }}
              onGrowthProjectionChange={(projection) => {
                                 // Update capital objective parameters based on growth projection
                 if (projection.validation.isValid) {
                   dispatch({ 
                     type: 'UPDATE_CONFIG', 
                     payload: { 
                       capitalObjectiveParameters: {
                         currentBalance: state.config.capitalObjectiveParameters?.currentBalance || 10000,
                         targetBalance: projection.compoundedFinalValue,
                         timeHorizonMonths: state.config.capitalObjectiveParameters?.timeHorizonMonths || 12
                       }
                     }
                   });
                 }
              }}
              initialValues={{
                winRate: state.config.tradeStatistics?.winRate || 55,
                avgWin: 150,
                avgLoss: 100,
                riskProfile: 'moderate',
                currentVIX: 20
              }}
              showAdvancedOptions={state.showEnhancedInterface}
            />
            
            {/* Toggle for Advanced Options */}
            <div className="mt-6 text-center">
              <button
                onClick={() => dispatch({ type: 'TOGGLE_ENHANCED_INTERFACE', payload: !state.showEnhancedInterface })}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
              >
                {state.showEnhancedInterface ? 'Hide' : 'Show'} Advanced Options
              </button>
            </div>
            
            {/* Legacy suggestions for compatibility */}
            {state.enhancedPositionResult && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                <h4 className="font-medium text-green-900 mb-2">Research-Driven Position Sizing Results:</h4>
                <div className="space-y-1 text-sm text-green-800">
                  <p>Recommended Size: {state.enhancedPositionResult.recommendedPositionSize.toFixed(2)}% per trade</p>
                  <p>VIX Adjusted: {state.enhancedPositionResult.vixAdjustedSize.toFixed(2)}% per trade</p>
                  <p>Kelly Fraction: {(state.enhancedPositionResult.kellyFraction * 100).toFixed(2)}% (Full Kelly)</p>
                  <p>Risk Amount: ${state.enhancedPositionResult.riskAmount.toFixed(0)} per trade</p>
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div>
            <h3 className="text-lg font-medium mb-4">Step 4: Trade Statistics</h3>
            <p className="text-gray-600 mb-6">
              Enter your historical trading statistics to calculate optimal position sizing. If you don't have this data yet, use estimates based on your trading strategy.
            </p>
            <div className="space-y-6">
              {/* Win Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Win Rate (%)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="99"
                  value={state.config.tradeStatistics?.winRate || ''}
                  onChange={(e) => dispatch({ 
                    type: 'UPDATE_CONFIG', 
                    payload: { 
                      tradeStatistics: {
                        winRate: parseFloat(e.target.value) || 50,
                        payoffRatio: state.config.tradeStatistics?.payoffRatio || 1.5,
                        numTrades: state.config.tradeStatistics?.numTrades || 100
                      }
                    }
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Percentage of trades that are profitable
                </p>
              </div>

              {/* Payoff Ratio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payoff Ratio (Average Win / Average Loss)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10"
                  value={state.config.tradeStatistics?.payoffRatio || ''}
                  onChange={(e) => dispatch({ 
                    type: 'UPDATE_CONFIG', 
                    payload: { 
                      tradeStatistics: {
                        winRate: state.config.tradeStatistics?.winRate || 50,
                        payoffRatio: parseFloat(e.target.value) || 1.5,
                        numTrades: state.config.tradeStatistics?.numTrades || 100
                      }
                    }
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="1.5"
                />
                <p className="text-xs text-gray-500 mt-1">
                  How much you make on winning trades vs. lose on losing trades
                </p>
              </div>

              {/* Number of Trades */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Number of Trades (per time period)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="1000"
                  value={state.config.tradeStatistics?.numTrades || ''}
                  onChange={(e) => dispatch({ 
                    type: 'UPDATE_CONFIG', 
                    payload: { 
                      tradeStatistics: {
                        winRate: state.config.tradeStatistics?.winRate || 50,
                        payoffRatio: state.config.tradeStatistics?.payoffRatio || 1.5,
                        numTrades: parseInt(e.target.value) || 100
                      }
                    }
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Number of trades you expect to make over your time horizon
                </p>
              </div>

              {/* Help Section */}
              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="font-medium text-blue-900 mb-2">Need Help with These Numbers?</h4>
                <div className="text-sm text-blue-800 space-y-2">
                  <p><strong>Win Rate:</strong> Look at your past trades. What percentage were profitable?</p>
                  <p><strong>Payoff Ratio:</strong> If your average win is $150 and average loss is $100, your ratio is 1.5</p>
                  <p><strong>Number of Trades:</strong> How many trades do you typically make per month/year?</p>
                  <p className="mt-3 text-blue-700">
                    <strong>Don't have historical data?</strong> Start with conservative estimates: 45% win rate, 1.5 payoff ratio
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div>
            <h3 className="text-lg font-medium mb-4">Step 5: Position Sizing Rules</h3>
            <p className="text-gray-600 mb-6">
              Configure your position sizing limits and risk management rules.
            </p>
            <div className="space-y-6">
              {/* Base Position Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Position Size (% of portfolio)
                </label>
                  <input
                    type="number"
                    step="0.1"
                  min="0.1"
                  max="10"
                  value={state.config.sizingRules?.baseSizePercentage || ''}
                  onChange={(e) => dispatch({ 
                    type: 'UPDATE_CONFIG', 
                    payload: { 
                      sizingRules: {
                        ...state.config.sizingRules,
                        baseSizePercentage: parseFloat(e.target.value) || 1,
                        maxPositionSize: state.config.sizingRules?.maxPositionSize || 2,
                        maxTotalExposure: state.config.sizingRules?.maxTotalExposure || 50,
                        baseMethod: state.config.sizingRules?.baseMethod || "fixedFractional",
                        minPositionSize: state.config.sizingRules?.minPositionSize || 0.5,
                        kellyFraction: state.config.sizingRules?.kellyFraction || "half",
                        volatilityAdjustment: state.config.sizingRules?.volatilityAdjustment || {
                          enabled: false,
                          atrPeriod: 14,
                          atrMultiplier: 1,
                        },
                        equityTrendFilter: state.config.sizingRules?.equityTrendFilter || {
                          enabled: false,
                          maPeriod: 20,
                          allocationAboveMa: 100,
                          allocationBelowMa: 50,
                        },
                      }
                    }
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="1.0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default position size as percentage of your portfolio
                </p>
                </div>

              {/* Maximum Position Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Position Size (% of portfolio)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                  min="0.1"
                  max="20"
                  value={state.config.sizingRules?.maxPositionSize || ''}
                  onChange={(e) => dispatch({ 
                    type: 'UPDATE_CONFIG', 
                    payload: { 
                        sizingRules: {
                        ...state.config.sizingRules,
                        baseSizePercentage: state.config.sizingRules?.baseSizePercentage || 1,
                        maxPositionSize: parseFloat(e.target.value) || 2,
                        maxTotalExposure: state.config.sizingRules?.maxTotalExposure || 50,
                        baseMethod: state.config.sizingRules?.baseMethod || "fixedFractional",
                        minPositionSize: state.config.sizingRules?.minPositionSize || 0.5,
                        kellyFraction: state.config.sizingRules?.kellyFraction || "half",
                        volatilityAdjustment: state.config.sizingRules?.volatilityAdjustment || {
                          enabled: false,
                          atrPeriod: 14,
                          atrMultiplier: 1,
                        },
                        equityTrendFilter: state.config.sizingRules?.equityTrendFilter || {
                          enabled: false,
                          maPeriod: 20,
                          allocationAboveMa: 100,
                          allocationBelowMa: 50,
                        },
                      }
                    }
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="2.0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum allowed position size for any single trade
                </p>
                  </div>

              {/* Maximum Total Exposure */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Total Exposure (% of portfolio)
                    </label>
                    <input
                      type="number"
                      step="1"
                  min="10"
                  max="200"
                  value={state.config.sizingRules?.maxTotalExposure || ''}
                  onChange={(e) => dispatch({ 
                    type: 'UPDATE_CONFIG', 
                    payload: { 
                        sizingRules: {
                        ...state.config.sizingRules,
                        baseSizePercentage: state.config.sizingRules?.baseSizePercentage || 1,
                        maxPositionSize: state.config.sizingRules?.maxPositionSize || 2,
                        maxTotalExposure: parseFloat(e.target.value) || 50,
                        baseMethod: state.config.sizingRules?.baseMethod || "fixedFractional",
                        minPositionSize: state.config.sizingRules?.minPositionSize || 0.5,
                        kellyFraction: state.config.sizingRules?.kellyFraction || "half",
                        volatilityAdjustment: state.config.sizingRules?.volatilityAdjustment || {
                          enabled: false,
                          atrPeriod: 14,
                          atrMultiplier: 1,
                        },
                        equityTrendFilter: state.config.sizingRules?.equityTrendFilter || {
                          enabled: false,
                          maPeriod: 20,
                          allocationAboveMa: 100,
                          allocationBelowMa: 50,
                        },
                      }
                    }
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum total exposure across all positions
                </p>
                  </div>

              {/* Sizing Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position Sizing Method
                    </label>
                <div className="space-y-2">
                  {[
                    { value: 'fixedFractional', label: 'Fixed Fractional', desc: 'Risk a fixed percentage per trade' },
                    { value: 'kelly', label: 'Kelly Criterion', desc: 'Optimize position size based on win rate and payoff ratio' },
                    { value: 'volatilityAdjusted', label: 'Volatility Adjusted', desc: 'Adjust position size based on market volatility' }
                  ].map((method) => (
                    <label key={method.value} className="flex items-start space-x-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="baseMethod"
                        value={method.value}
                        checked={state.config.sizingRules?.baseMethod === method.value}
                        onChange={(e) => dispatch({ 
                          type: 'UPDATE_CONFIG', 
                          payload: { 
                          sizingRules: {
                              ...state.config.sizingRules,
                              baseSizePercentage: state.config.sizingRules?.baseSizePercentage || 1,
                              maxPositionSize: state.config.sizingRules?.maxPositionSize || 2,
                              maxTotalExposure: state.config.sizingRules?.maxTotalExposure || 50,
                              baseMethod: e.target.value as "fixedFractional" | "kelly" | "volatilityAdjusted",
                              minPositionSize: state.config.sizingRules?.minPositionSize || 0.5,
                              kellyFraction: state.config.sizingRules?.kellyFraction || "half",
                              volatilityAdjustment: state.config.sizingRules?.volatilityAdjustment || {
                                enabled: false,
                                atrPeriod: 14,
                                atrMultiplier: 1,
                              },
                              equityTrendFilter: state.config.sizingRules?.equityTrendFilter || {
                                enabled: false,
                                maPeriod: 20,
                                allocationAboveMa: 100,
                                allocationBelowMa: 50,
                              },
                            }
                          }
                        })}
                        className="text-blue-600 mt-1"
                      />
                      <div>
                        <div className="font-medium">{method.label}</div>
                        <div className="text-sm text-gray-500">{method.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Show calculated recommendations if available */}
              {state.suggestedFractions.fixedFractional && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                  <h4 className="font-medium text-green-900 mb-2">Recommended Position Sizes:</h4>
                  <div className="space-y-1 text-sm text-green-800">
                    {state.suggestedFractions.fixedFractional && (
                      <p>• Fixed Fractional: {(state.suggestedFractions.fixedFractional * 100).toFixed(1)}% per trade</p>
                    )}
                    {state.suggestedFractions.fullKelly && (
                      <p>• Full Kelly: {(state.suggestedFractions.fullKelly * 100).toFixed(1)}% per trade</p>
                    )}
                    {state.suggestedFractions.halfKelly && (
                      <p>• Half Kelly: {(state.suggestedFractions.halfKelly * 100).toFixed(1)}% per trade (recommended)</p>
                    )}
                  </div>
                  <p className="text-xs text-green-700 mt-2">
                    Consider using these calculated values as your base position size.
                  </p>
                  </div>
              )}

              {/* Show warning if sizing is too high */}
              {state.sizingWarning && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-yellow-800 text-sm">{state.sizingWarning}</p>
                </div>
              )}
            </div>
          </div>
        );

      case 6:
        return (
          <div>
            <h3 className="text-lg font-medium mb-4">Step 6: Review & Confirm</h3>
            <p className="text-gray-600 mb-6">
              Review your goal sizing configuration and confirm to save your settings.
            </p>
            <div className="space-y-6">
              {/* Goal Summary */}
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="font-medium text-gray-900 mb-3">Goal Summary</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Goal Type:</span> {state.config.goalType}</div>
                  {state.config.goalType === 'capitalObjective' && state.config.capitalObjectiveParameters && (
                    <>
                      <div><span className="font-medium">Current Balance:</span> ${state.config.capitalObjectiveParameters.currentBalance?.toLocaleString()}</div>
                      <div><span className="font-medium">Target Balance:</span> ${state.config.capitalObjectiveParameters.targetBalance?.toLocaleString()}</div>
                      <div><span className="font-medium">Time Horizon:</span> {state.config.capitalObjectiveParameters.timeHorizonMonths} months</div>
                                    </>
                                )}
                        </div>
              </div>

              {/* Trade Statistics Summary */}
              {state.config.tradeStatistics && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-3">Trade Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Win Rate:</span> {state.config.tradeStatistics.winRate}%</div>
                    <div><span className="font-medium">Payoff Ratio:</span> {state.config.tradeStatistics.payoffRatio}</div>
                    <div><span className="font-medium">Number of Trades:</span> {state.config.tradeStatistics.numTrades}</div>
                  </div>
                            </div>
                        )}

              {/* Position Sizing Rules Summary */}
              {state.config.sizingRules && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-3">Position Sizing Rules</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Base Position Size:</span> {state.config.sizingRules.baseSizePercentage}% of portfolio</div>
                    <div><span className="font-medium">Maximum Position Size:</span> {state.config.sizingRules.maxPositionSize}% of portfolio</div>
                    <div><span className="font-medium">Maximum Total Exposure:</span> {state.config.sizingRules.maxTotalExposure}% of portfolio</div>
                    <div><span className="font-medium">Sizing Method:</span> {state.config.sizingRules.baseMethod}</div>
                  </div>
                            </div>
              )}

              {/* Calculated Recommendations */}
              {state.suggestedFractions.fixedFractional && (
                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="font-medium text-blue-900 mb-3">Calculated Recommendations</h4>
                  <div className="space-y-1 text-sm text-blue-800">
                    {state.suggestedFractions.fixedFractional && (
                      <div>• Fixed Fractional: {(state.suggestedFractions.fixedFractional * 100).toFixed(1)}% per trade</div>
                    )}
                    {state.suggestedFractions.fullKelly && (
                      <div>• Full Kelly: {(state.suggestedFractions.fullKelly * 100).toFixed(1)}% per trade</div>
                    )}
                    {state.suggestedFractions.halfKelly && (
                      <div>• Half Kelly: {(state.suggestedFractions.halfKelly * 100).toFixed(1)}% per trade (recommended)</div>
                    )}
                        </div>
                              </div>
                            )}

              {/* Warning if present */}
              {state.sizingWarning && (
                <div className="bg-yellow-50 p-4 rounded-md">
                  <h4 className="font-medium text-yellow-900 mb-2">Important Notice</h4>
                  <p className="text-yellow-800 text-sm">{state.sizingWarning}</p>
                              </div>
                            )}

              <div className="bg-green-50 p-4 rounded-md">
                <h4 className="font-medium text-green-900 mb-2">Ready to Save</h4>
                <p className="text-green-800 text-sm">
                  Your goal sizing configuration is complete and ready to be saved. Click "Finish" to apply these settings to your trading strategy.
                </p>
                </div>
            </div>
          </div>
        );

      default:
        return (
          <div>
            <h3 className="text-lg font-medium mb-4">Step {state.currentStep}</h3>
            <p>Step content for step {state.currentStep} - Implementation in progress...</p>
          </div>
        );
    }
  };

  // Show loading if saving
  if (isSavingConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <span className="text-blue-700 font-semibold">Saving your configuration...</span>
        </div>
        </div>
      </div>
    );
  }

  // Main render - no Modal wrapper, full page
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {state.showIntro ? "Welcome!" : "Goal-Driven Sizing Wizard"}
              </h1>
              {!state.showIntro && (
                <p className="text-sm text-gray-500 mt-1">
                  Step {state.currentStep} of {state.config.goalType === 'capitalObjective' ? '7' : '6'}
                </p>
              )}
            </div>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {state.errors[state.currentStep] && !state.showIntro && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {state.errors[state.currentStep]}
            </div>
          )}
      {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between">
            <button
              onClick={handleBack}
              disabled={state.showIntro || state.currentStep <= 1}
              className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!!state.errors[state.currentStep] && !state.showIntro}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.showIntro ? 'Get Started' : state.currentStep === 7 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalSizingWizard; 