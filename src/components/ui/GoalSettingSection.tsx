import React, { useState, useEffect } from 'react';

export interface TradingGoal {
  currentBalance: number;
  targetBalance: number;
  timeframe: string;
}

interface GoalSettingSectionProps {
  initialGoal?: TradingGoal;
  onGoalChange: (goal: TradingGoal) => void;
  className?: string;
}

// Calculation functions
const calculateRequiredReturn = (current: number, target: number, timeframe: string): number => {
  const months = parseFloat(timeframe);
  const years = months / 12;
  const totalReturn = (target / current) - 1;
  return (totalReturn / years) * 100;
};

const calculatePerTradeReturn = (current: number, target: number, timeframe: string, tradesPerMonth: number = 20): number => {
  const months = parseFloat(timeframe);
  const totalTrades = months * tradesPerMonth;
  const totalGrowthNeeded = target / current;
  const perTradeMultiplier = Math.pow(totalGrowthNeeded, 1 / totalTrades);
  return (perTradeMultiplier - 1) * 100;
};

export const GoalSettingSection: React.FC<GoalSettingSectionProps> = ({
  initialGoal,
  onGoalChange,
  className = ''
}) => {
  const [currentBalance, setCurrentBalance] = useState(initialGoal?.currentBalance || 6000);
  const [targetBalance, setTargetBalance] = useState(initialGoal?.targetBalance || 12000);
  const [timeframe, setTimeframe] = useState(initialGoal?.timeframe || '12');

  const requiredReturn = calculateRequiredReturn(currentBalance, targetBalance, timeframe);
  const requiredPerTrade = calculatePerTradeReturn(currentBalance, targetBalance, timeframe);

  // Update parent when values change
  useEffect(() => {
    onGoalChange({
      currentBalance,
      targetBalance,
      timeframe
    });
  }, [currentBalance, targetBalance, timeframe, onGoalChange]);

  const handleCurrentBalanceChange = (value: number) => {
    setCurrentBalance(value);
  };

  const handleTargetBalanceChange = (value: number) => {
    setTargetBalance(value);
  };

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
  };

  return (
    <div className={`goal-setting-section prominent ${className}`}>
      <h3 className="section-title">📈 Set Your Growth Goal</h3>
      
      <div className="goal-inputs">
        <div className="input-group">
          <label htmlFor="current-balance">Starting Balance</label>
          <div className="input-wrapper">
            <span className="currency-symbol">$</span>
            <input 
              id="current-balance"
              type="number" 
              value={currentBalance}
              onChange={(e) => handleCurrentBalanceChange(Number(e.target.value))}
              min="100"
              step="100"
              className="balance-input"
            />
          </div>
        </div>
        
        <div className="input-group">
          <label htmlFor="target-balance">Target Balance</label>
          <div className="input-wrapper">
            <span className="currency-symbol">$</span>
            <input 
              id="target-balance"
              type="number" 
              value={targetBalance}
              onChange={(e) => handleTargetBalanceChange(Number(e.target.value))}
              min={currentBalance + 100}
              step="100"
              className="balance-input"
            />
          </div>
        </div>
        
        <div className="input-group">
          <label htmlFor="timeframe">Timeframe</label>
          <select 
            id="timeframe"
            value={timeframe}
            onChange={(e) => handleTimeframeChange(e.target.value)}
            className="timeframe-select"
          >
            <option value="6">6 months</option>
            <option value="12">12 months</option>
            <option value="18">18 months</option>
            <option value="24">24 months</option>
            <option value="36">36 months</option>
          </select>
        </div>
      </div>
      
      <div className="goal-requirements">
        <div className="requirement-card">
          <span className="label">Required Annual Return:</span>
          <span className={`value ${requiredReturn > 50 ? 'warning' : requiredReturn > 100 ? 'danger' : 'success'}`}>
            {requiredReturn.toFixed(1)}%
          </span>
        </div>
        <div className="requirement-card">
          <span className="label">Required Per-Trade Return:</span>
          <span className={`value ${requiredPerTrade > 2 ? 'warning' : requiredPerTrade > 5 ? 'danger' : 'success'}`}>
            {requiredPerTrade.toFixed(3)}%
          </span>
        </div>
        <div className="requirement-card">
          <span className="label">Growth Needed:</span>
          <span className="value growth">
            {((targetBalance / currentBalance - 1) * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {requiredReturn > 100 && (
        <div className="goal-warning">
          ⚠️ This goal requires {requiredReturn.toFixed(0)}% annual returns, which may be unrealistic. 
          Consider extending your timeframe or adjusting your target.
        </div>
      )}

      <style>
        {`
        .goal-setting-section.prominent {
          border: 2px solid #667eea;
          background: linear-gradient(145deg, #f8f9ff 0%, #e8edff 100%);
          padding: 24px;
          border-radius: 12px;
          margin: 24px 0;
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15);
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: bold;
          color: #4a5568;
          margin: 0 0 20px 0;
          text-align: center;
        }

        .goal-inputs {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
        }

        .input-group label {
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 8px;
          font-size: 0.9rem;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .currency-symbol {
          position: absolute;
          left: 12px;
          color: #667eea;
          font-weight: bold;
          z-index: 1;
        }

        .balance-input {
          width: 100%;
          padding: 12px 12px 12px 28px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.2s ease;
          background: white;
        }

        .balance-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .timeframe-select {
          width: 100%;
          padding: 12px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          background: white;
          transition: all 0.2s ease;
        }

        .timeframe-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .goal-requirements {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-top: 20px;
        }

        .requirement-card {
          background: white;
          padding: 16px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-align: center;
          border: 1px solid #e2e8f0;
        }

        .requirement-card .label {
          font-size: 0.85rem;
          color: #718096;
          font-weight: 500;
        }

        .requirement-card .value {
          font-size: 1.4rem;
          font-weight: bold;
        }

        .requirement-card .value.success {
          color: #38a169;
        }

        .requirement-card .value.warning {
          color: #d69e2e;
        }

        .requirement-card .value.danger {
          color: #e53e3e;
        }

        .requirement-card .value.growth {
          color: #667eea;
        }

        .goal-warning {
          background: #fed7d7;
          border: 1px solid #feb2b2;
          color: #c53030;
          padding: 12px 16px;
          border-radius: 8px;
          margin-top: 16px;
          font-size: 0.9rem;
          text-align: center;
        }

        @media (max-width: 768px) {
          .goal-inputs {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .goal-requirements {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }
        `}
      </style>
    </div>
  );
}; 