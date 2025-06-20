/**
 * Position Sizing Foundation Page
 * Primary landing page with comprehensive account validation and funding recommendations
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AccountValidationEngine } from '../../utils/finance/AccountValidationEngine';
import { PositionSizingCalculator } from '../../utils/finance/PositionSizingCalculator';
import { EnhancedPositionSizingInterface } from '../../components/Wizards/EnhancedPositionSizingInterface';
import FundingPlanModal from '../../components/ui/FundingPlanModal';
import StreamlinedDashboard from '../../components/ui/StreamlinedDashboard';
import { UserExperienceLevel } from '../../utils/ux/UXLayersController';
import { GoalProgressHeader } from '../../components/ui/GoalProgressHeader';
import { GoalSettingSection } from '../../components/ui/GoalSettingSection';
import { GoalAwarePositionSizing } from '../../components/ui/GoalAwarePositionSizing';
import { GoalAwareAccountValidation } from '../../components/ui/GoalAwareAccountValidation';
import { TradingGoal, TradingGoals } from '../../types/goalSizing';

// Value proposition header component
const PositionSizingHeader: React.FC = () => (
  <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 px-6 mb-8">
    <div className="max-w-6xl mx-auto text-center">
      <h1 className="text-4xl md:text-5xl font-bold mb-4">
        🎯 Trade Smarter with Math-Driven Position Sizing
      </h1>
      <p className="text-xl md:text-2xl text-blue-100 mb-6">
        Prevent 85% of Trading Failures with Research-Backed Risk Management
      </p>
      <div className="flex flex-wrap justify-center gap-6 text-sm md:text-base">
        <div className="flex items-center space-x-2">
          <span className="text-green-300">✅</span>
          <span>Kelly Criterion Optimization</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-green-300">📊</span>
          <span>VIX-Adjusted Sizing</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-green-300">⚡</span>
          <span>Real-Time Risk Calculations</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-green-300">🛡️</span>
          <span>Account Size Validation</span>
        </div>
      </div>
    </div>
  </header>
);

// Account size education component
const AccountSizeEducation: React.FC = () => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
    <h3 className="text-lg font-semibold text-blue-800 mb-3">
      💡 Why Account Size Matters for Position Sizing
    </h3>
    <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700">
      <div>
        <h4 className="font-medium mb-2">Underfunded Accounts Lead To:</h4>
        <ul className="space-y-1">
          <li>• Oversized positions relative to account</li>
          <li>• Inability to diversify properly</li>
          <li>• Higher risk of account blow-ups</li>
          <li>• Emotional trading due to large swings</li>
        </ul>
      </div>
      <div>
        <h4 className="font-medium mb-2">Properly Funded Accounts Enable:</h4>
        <ul className="space-y-1">
          <li>• Consistent position sizing</li>
          <li>• Multiple concurrent opportunities</li>
          <li>• Better risk-adjusted returns</li>
          <li>• Psychological comfort for better decisions</li>
        </ul>
      </div>
    </div>
  </div>
);

// Next steps component for successful validation
const NextStepsComponent: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => (
  <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-6">
    <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
      ✅ Ready for Next Step
    </h3>
    <p className="text-green-700 mb-4">
      Your account size supports safe position sizing. Continue your trading journey:
    </p>
    <div className="flex flex-wrap gap-3">
      <button
        onClick={() => onNavigate('/visualizer')}
        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
      >
        📈 Apply to Strategy Visualizer →
      </button>
      <button
        onClick={() => onNavigate('/options')}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        📊 Explore Options Strategies →
      </button>
      <button
        onClick={() => onNavigate('/settings')}
        className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
      >
        ⚙️ Configure Advanced Settings →
      </button>
    </div>
  </div>
);

export const PositionSizingFoundation: React.FC = () => {
  const navigate = useNavigate();
  
  // State for trading goal (central focus)
  const [tradingGoal, setTradingGoal] = useState<TradingGoal>({
    currentBalance: 6000,
    targetBalance: 12000,
    timeframe: '12'
  });
  
  // State for position sizing parameters
  const [riskProfile, setRiskProfile] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  
  // State for position sizing results
  const [positionSizingResults, setPositionSizingResults] = useState({
    perTradeReturn: 0.5,
    monthlyReturn: 2.0,
    tradesPerMonth: 20,
    riskPerTrade: 1.5,
    expectedWinRate: 0.6,
    averageWinAmount: 150
  });
  
  // State for legacy trading goals (for compatibility)
  const [tradingGoals] = useState<TradingGoals>({
    targetMonthlyIncome: 500,
    expectedWinRate: 0.6,
    averageWinAmount: 150,
    tradingFrequency: 'weekly' as const,
    riskTolerance: 'moderate' as const
  });
  
  // State for modals and UI
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [showEducation, setShowEducation] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [userLevel, setUserLevel] = useState<UserExperienceLevel>('import');
  
  // Calculate validation results
  const riskProfile_data = PositionSizingCalculator.getRiskProfile(riskProfile);
  const riskPercent = riskProfile_data.riskPerTrade.default;
  
  // Use a reasonable fixed target trade size for validation (e.g., $50-100 risk per trade)
  // This represents a typical options trade risk amount
  const targetTradeSize = 75;
  
  const validation = AccountValidationEngine.validateAccountForGoals(
    tradingGoal.currentBalance,
    riskPercent,
    targetTradeSize,
    tradingGoals
  );

  // Handle goal changes
  const handleGoalChange = useCallback((newGoal: TradingGoal) => {
    setTradingGoal(newGoal);
  }, []);

  // Handle position sizing results changes
  const handlePositionSizingChange = useCallback((results: any) => {
    setPositionSizingResults(prev => ({
      ...prev,
      ...results
    }));
  }, []);

  // Calculate months remaining for goal
  const calculateMonthsRemaining = useCallback(() => {
    const { currentBalance, targetBalance } = tradingGoal;
    const { monthlyReturn = 2.0 } = positionSizingResults;
    
    if (monthlyReturn <= 0) return undefined;
    
    const monthsNeeded = Math.log(targetBalance / currentBalance) / Math.log(1 + (monthlyReturn / 100));
    return Math.ceil(monthsNeeded);
  }, [tradingGoal, positionSizingResults]);

  // Handle action buttons from validation alert
  const handleValidationAction = (action: string) => {
    switch (action) {
      case 'showFundingPlan':
      case 'showFundingTimeline':
        setShowFundingModal(true);
        break;
      case 'adjustRisk':
        // Automatically adjust to conservative risk profile
        setRiskProfile('conservative');
        break;
      case 'enablePaperMode':
        // TODO: Implement paper trading mode
        alert('Paper trading mode will be implemented in the next update!');
        break;
      case 'showEducation':
        setShowEducation(true);
        break;
      case 'acceptCurrentBalance':
        // User accepts current balance, no action needed
        break;
      case 'fundAccount':
        setShowFundingModal(true);
        break;
      case 'extendTimeline':
        // Extend timeline to more realistic timeframe
        setTradingGoal((prev: TradingGoal) => ({ ...prev, timeframe: '24' }));
        break;
      case 'lowerGoal':
        // Lower goal to more achievable amount
        const feasibleGoal = tradingGoal.currentBalance * Math.pow(1.02, parseFloat(tradingGoal.timeframe));
        setTradingGoal((prev: TradingGoal) => ({ ...prev, targetBalance: Math.round(feasibleGoal) }));
        break;
      case 'paperTrading':
        alert('Paper trading mode will be implemented in the next update!');
        break;
      case 'proceedWithCaution':
        // User chooses to proceed with current setup
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  // Handle navigation
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PositionSizingHeader />
      
      <div className="max-w-6xl mx-auto px-6 pb-12">
        {/* PROMINENT GOAL PROGRESS HEADER */}
        <GoalProgressHeader
          currentBalance={tradingGoal.currentBalance}
          targetBalance={tradingGoal.targetBalance}
          timeframe={`${tradingGoal.timeframe} months`}
          monthsRemaining={calculateMonthsRemaining()}
        />

        {/* PROMINENT GOAL SETTING SECTION */}
        <GoalSettingSection
          initialGoal={tradingGoal}
          onGoalChange={handleGoalChange}
        />

        {/* GOAL-AWARE ACCOUNT VALIDATION */}
        <GoalAwareAccountValidation
          goal={tradingGoal}
          validation={validation}
          onAction={handleValidationAction}
        />

        {/* Account Size Education (show if not optimal or if user requested) */}
        {(!validation.isOptimal || showEducation) && <AccountSizeEducation />}
        
        {/* Main Position Sizing Calculator */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            📊 Position Sizing Calculator
          </h2>
          
          {/* Risk Profile Selection */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Risk Profile
            </label>
            <div className="flex space-x-4">
              {(['conservative', 'moderate', 'aggressive'] as const).map((profile) => (
                <button
                  key={profile}
                  onClick={() => setRiskProfile(profile)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    riskProfile === profile
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {profile.charAt(0).toUpperCase() + profile.slice(1)}
                  <span className="block text-xs">
                    {profile === 'conservative' && '0.75% risk'}
                    {profile === 'moderate' && '1.5% risk'}
                    {profile === 'aggressive' && '2.5% risk'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Enhanced Position Sizing Interface */}
          <EnhancedPositionSizingInterface
            accountBalance={tradingGoal.currentBalance}
            initialValues={{
              riskProfile: riskProfile,
              accountBalance: tradingGoal.currentBalance
            }}
            onPositionSizeChange={handlePositionSizingChange}
          />
        </div>

        {/* GOAL-AWARE POSITION SIZING PROGRESS */}
        <GoalAwarePositionSizing
          goal={tradingGoal}
          currentCalculations={positionSizingResults}
        />

        {/* Analytics Dashboard for Validated Accounts */}
        {validation.isViable && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                📊 Portfolio Analytics Preview
              </h3>
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  showAnalytics
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
              </button>
            </div>
            
            {showAnalytics ? (
              <StreamlinedDashboard
                userLevel={userLevel}
                onUserLevelChange={setUserLevel}
                className="border-t border-gray-200 pt-4"
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-4">
                  Get a preview of your portfolio analytics with consolidated risk metrics, 
                  performance tracking, and market analysis.
                </p>
                <p className="text-sm">
                  Click "Show Analytics" to explore the streamlined dashboard with progressive disclosure.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Next Steps for Validated Accounts */}
        {validation.isViable && (
          <NextStepsComponent onNavigate={handleNavigate} />
        )}

        {/* Funding Plan Modal */}
        <FundingPlanModal
          currentBalance={tradingGoal.currentBalance}
          targetBalance={validation.calculations.recommendedAccount}
          onClose={() => setShowFundingModal(false)}
          isOpen={showFundingModal}
        />
      </div>
    </div>
  );
};

export default PositionSizingFoundation; 