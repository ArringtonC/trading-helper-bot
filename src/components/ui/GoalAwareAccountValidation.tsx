import React from 'react';
import { TradingGoal } from './GoalSettingSection';
import { AccountValidationResult } from '../../utils/finance/AccountValidationEngine';

interface GoalAwareAccountValidationProps {
  goal: TradingGoal;
  validation: AccountValidationResult;
  onAction: (action: string) => void;
  className?: string;
}

// Calculate required account size for specific goal
const calculateRequiredAccountForGoal = (goal: TradingGoal) => {
  const { currentBalance, targetBalance, timeframe } = goal;
  const growthNeeded = (targetBalance / currentBalance) - 1;
  const months = parseFloat(timeframe);
  const monthlyReturnNeeded = Math.pow(1 + growthNeeded, 1 / months) - 1;
  
  // Conservative estimate: need 3x the risk amount for safe trading
  // Assuming 2% monthly return is achievable with 1.5% risk per trade
  const safeMonthlyReturn = 0.02; // 2%
  const riskPerTrade = 0.015; // 1.5%
  
  if (monthlyReturnNeeded > safeMonthlyReturn * 2) {
    // Goal is too aggressive for current balance
    const minimumAccountForGoal = targetBalance / Math.pow(1 + safeMonthlyReturn, months);
    const feasibleTimeframe = Math.log(targetBalance / currentBalance) / Math.log(1 + safeMonthlyReturn);
    const feasibleGoal = currentBalance * Math.pow(1 + safeMonthlyReturn, months);
    
    return {
      minimum: minimumAccountForGoal,
      feasibleTimeframe: Math.ceil(feasibleTimeframe),
      feasibleGoal,
      isRealistic: false
    };
  }
  
  return {
    minimum: currentBalance,
    feasibleTimeframe: months,
    feasibleGoal: targetBalance,
    isRealistic: true
  };
};

export const GoalAwareAccountValidation: React.FC<GoalAwareAccountValidationProps> = ({
  goal,
  validation,
  onAction,
  className = ''
}) => {
  const { currentBalance, targetBalance, timeframe } = goal;
  const goalRequirements = calculateRequiredAccountForGoal(goal);
  
  // Check if account is too small for the specific goal
  const isAccountTooSmallForGoal = !goalRequirements.isRealistic;
  
  if (isAccountTooSmallForGoal) {
    return (
      <div className={`goal-validation-alert critical ${className}`}>
        <div className="alert-header">
          <h3 className="alert-title">⚠️ Account Too Small for ${targetBalance.toLocaleString()} Goal</h3>
          <div className="goal-summary">
            ${currentBalance.toLocaleString()} → ${targetBalance.toLocaleString()} in {timeframe} months
          </div>
        </div>
        
        <div className="alert-content">
          <p className="alert-message">
            To safely reach ${targetBalance.toLocaleString()} in {timeframe} months, 
            you need at least ${goalRequirements.minimum.toLocaleString()}.
          </p>
          
          <div className="goal-metrics">
            <div className="metric">
              <span className="label">Required Monthly Return:</span>
              <span className="value danger">
                {(((targetBalance / currentBalance) ** (1 / parseFloat(timeframe)) - 1) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="metric">
              <span className="label">Realistic Monthly Return:</span>
              <span className="value success">2.0%</span>
            </div>
          </div>
        </div>
        
        <div className="goal-funding-options">
          <h4>Choose Your Path Forward:</h4>
          <div className="options-grid">
            <button 
              className="option-btn primary"
              onClick={() => onAction('fundAccount')}
            >
              <div className="option-icon">💰</div>
              <div className="option-content">
                <div className="option-title">Fund Account</div>
                <div className="option-subtitle">
                  Add ${(goalRequirements.minimum - currentBalance).toLocaleString()} to reach minimum
                </div>
              </div>
            </button>
            
            <button 
              className="option-btn secondary"
              onClick={() => onAction('extendTimeline')}
            >
              <div className="option-icon">📅</div>
              <div className="option-content">
                <div className="option-title">Extend Timeline</div>
                <div className="option-subtitle">
                  {goalRequirements.feasibleTimeframe} months for realistic growth
                </div>
              </div>
            </button>
            
            <button 
              className="option-btn secondary"
              onClick={() => onAction('lowerGoal')}
            >
              <div className="option-icon">🎯</div>
              <div className="option-content">
                <div className="option-title">Adjust Goal</div>
                <div className="option-subtitle">
                  ${goalRequirements.feasibleGoal.toLocaleString()} is achievable in {timeframe} months
                </div>
              </div>
            </button>
            
            <button 
              className="option-btn tertiary"
              onClick={() => onAction('paperTrading')}
            >
              <div className="option-icon">📝</div>
              <div className="option-content">
                <div className="option-title">Practice First</div>
                <div className="option-subtitle">
                  Paper trade while building capital
                </div>
              </div>
            </button>
          </div>
        </div>

        <style>
          {`
          .goal-validation-alert.critical {
            background: linear-gradient(145deg, #fed7d7 0%, #feb2b2 100%);
            border: 2px solid #e53e3e;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
            box-shadow: 0 4px 20px rgba(229, 62, 62, 0.2);
          }

          .alert-header {
            text-align: center;
            margin-bottom: 20px;
          }

          .alert-title {
            font-size: 1.5rem;
            font-weight: bold;
            color: #742a2a;
            margin: 0 0 8px 0;
          }

          .goal-summary {
            font-size: 1.1rem;
            color: #822727;
            font-weight: 600;
          }

          .alert-content {
            background: white;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid #e53e3e;
          }

          .alert-message {
            color: #742a2a;
            font-size: 1rem;
            margin: 0 0 16px 0;
            text-align: center;
          }

          .goal-metrics {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }

          .metric {
            display: flex;
            flex-direction: column;
            gap: 4px;
            text-align: center;
          }

          .metric .label {
            font-size: 0.85rem;
            color: #718096;
            font-weight: 500;
          }

          .metric .value {
            font-size: 1.2rem;
            font-weight: bold;
          }

          .metric .value.danger {
            color: #e53e3e;
          }

          .metric .value.success {
            color: #38a169;
          }

          .goal-funding-options h4 {
            color: #742a2a;
            margin: 0 0 16px 0;
            text-align: center;
            font-size: 1.1rem;
          }

          .options-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
          }

          .option-btn {
            background: white;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 12px;
            text-align: left;
          }

          .option-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }

          .option-btn.primary {
            border-color: #667eea;
            background: linear-gradient(145deg, #f7fafc 0%, #edf2f7 100%);
          }

          .option-btn.primary:hover {
            border-color: #5a67d8;
            background: linear-gradient(145deg, #edf2f7 0%, #e2e8f0 100%);
          }

          .option-btn.secondary {
            border-color: #d69e2e;
          }

          .option-btn.secondary:hover {
            border-color: #b7791f;
          }

          .option-btn.tertiary {
            border-color: #718096;
          }

          .option-btn.tertiary:hover {
            border-color: #4a5568;
          }

          .option-icon {
            font-size: 1.5rem;
            flex-shrink: 0;
          }

          .option-content {
            flex: 1;
          }

          .option-title {
            font-weight: bold;
            color: #2d3748;
            margin-bottom: 4px;
          }

          .option-subtitle {
            font-size: 0.85rem;
            color: #718096;
            line-height: 1.3;
          }

          @media (max-width: 768px) {
            .options-grid {
              grid-template-columns: 1fr;
              gap: 8px;
            }
            
            .goal-metrics {
              grid-template-columns: 1fr;
              gap: 12px;
            }
          }
          `}
        </style>
      </div>
    );
  }

  // If account meets goal requirements but fails general validation
  if (!validation.isViable) {
    return (
      <div className={`goal-validation-alert warning ${className}`}>
        <div className="alert-header">
          <h3 className="alert-title">💡 Account Meets Goal but Needs More for Safe Trading</h3>
        </div>
        
        <div className="alert-content">
          <p>
            Your ${currentBalance.toLocaleString()} account can theoretically reach your ${targetBalance.toLocaleString()} goal, 
            but you need ${validation.calculations.shortfall.toLocaleString()} more for safe position sizing.
          </p>
        </div>
        
        <div className="goal-funding-options">
          <div className="options-grid">
            <button 
              className="option-btn primary"
              onClick={() => onAction('showFundingPlan')}
            >
              <div className="option-icon">📊</div>
              <div className="option-content">
                <div className="option-title">View Funding Plan</div>
                <div className="option-subtitle">See timeline to safe trading</div>
              </div>
            </button>
            
            <button 
              className="option-btn secondary"
              onClick={() => onAction('proceedWithCaution')}
            >
              <div className="option-icon">⚠️</div>
              <div className="option-content">
                <div className="option-title">Proceed with Caution</div>
                <div className="option-subtitle">Start with smaller positions</div>
              </div>
            </button>
          </div>
        </div>

        <style>
          {`
          .goal-validation-alert.warning {
            background: linear-gradient(145deg, #fefcbf 0%, #faf089 100%);
            border: 2px solid #d69e2e;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
            box-shadow: 0 4px 20px rgba(214, 158, 46, 0.2);
          }
          `}
        </style>
      </div>
    );
  }

  // Account is good for both goal and general trading
  return (
    <div className={`goal-validation-alert success ${className}`}>
      <div className="alert-header">
        <h3 className="alert-title">✅ Account Ready for Your ${targetBalance.toLocaleString()} Goal</h3>
      </div>
      
      <div className="alert-content">
        <p>
          Your account size supports both your trading goal and safe position sizing practices. 
          You're ready to begin implementing your strategy!
        </p>
      </div>

      <style>
        {`
        .goal-validation-alert.success {
          background: linear-gradient(145deg, #c6f6d5 0%, #9ae6b4 100%);
          border: 2px solid #38a169;
          border-radius: 12px;
          padding: 24px;
          margin: 24px 0;
          box-shadow: 0 4px 20px rgba(56, 161, 105, 0.2);
        }

        .goal-validation-alert.success .alert-title {
          color: #22543d;
        }

        .goal-validation-alert.success .alert-content {
          background: white;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #38a169;
        }

        .goal-validation-alert.success .alert-content p {
          color: #22543d;
          margin: 0;
          text-align: center;
        }
        `}
      </style>
    </div>
  );
}; 