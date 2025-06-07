import React from 'react';
import { TradingGoal } from './GoalSettingSection';

interface PositionSizingResults {
  perTradeReturn?: number;
  monthlyReturn?: number;
  tradesPerMonth?: number;
  riskPerTrade?: number;
  expectedWinRate?: number;
  averageWinAmount?: number;
}

interface GoalAwarePositionSizingProps {
  goal: TradingGoal;
  currentCalculations: PositionSizingResults;
  className?: string;
}

// Progress calculation functions
const calculateProgressMetrics = (goal: TradingGoal, currentCalculations: PositionSizingResults) => {
  const { currentBalance, targetBalance, timeframe } = goal;
  const { perTradeReturn = 0.5, tradesPerMonth = 20 } = currentCalculations;
  
  const percentComplete = Math.min((currentBalance / targetBalance) * 100, 100);
  const amountRemaining = Math.max(targetBalance - currentBalance, 0);
  
  // Calculate months to goal at current performance
  const monthlyGrowthRate = Math.pow(1 + (perTradeReturn / 100), tradesPerMonth) - 1;
  const monthsToGoal = monthlyGrowthRate > 0 ? 
    Math.log(targetBalance / currentBalance) / Math.log(1 + monthlyGrowthRate) : 
    Infinity;
  
  const targetTimeframe = parseFloat(timeframe);
  const isOnTrack = monthsToGoal <= targetTimeframe;
  
  return {
    percentComplete,
    amountRemaining,
    monthsToGoal: Math.ceil(monthsToGoal),
    isOnTrack,
    monthlyGrowthRate: monthlyGrowthRate * 100,
    targetTimeframe
  };
};

export const GoalAwarePositionSizing: React.FC<GoalAwarePositionSizingProps> = ({
  goal,
  currentCalculations,
  className = ''
}) => {
  const { currentBalance, targetBalance } = goal;
  const progressToGoal = calculateProgressMetrics(goal, currentCalculations);

  const handleOptimizeStrategy = () => {
    // This would open a modal or navigate to strategy optimization
    alert('Strategy optimization feature coming soon! This will help you adjust your position sizing to meet your timeline goals.');
  };

  return (
    <div className={`goal-aware-sizing ${className}`}>
      <div className="goal-progress-card">
        <h4 className="card-title">🎯 Progress Toward ${targetBalance.toLocaleString()}</h4>
        
        <div className="progress-metrics">
          <div className="metric">
            <span className="label">Current Progress:</span>
            <span className="value progress">{progressToGoal.percentComplete.toFixed(1)}%</span>
          </div>
          <div className="metric">
            <span className="label">Amount Remaining:</span>
            <span className="value amount">${progressToGoal.amountRemaining.toLocaleString()}</span>
          </div>
          <div className="metric">
            <span className="label">At Current Rate:</span>
            <span className="value timeline">
              {progressToGoal.monthsToGoal === Infinity ? 
                'No growth projected' : 
                `${progressToGoal.monthsToGoal} months to goal`
              }
            </span>
          </div>
          <div className="metric">
            <span className="label">Monthly Growth Rate:</span>
            <span className="value growth">{progressToGoal.monthlyGrowthRate.toFixed(2)}%</span>
          </div>
        </div>
        
        <div className="goal-timeline-bar">
          <div className="timeline-progress">
            <div 
              className="timeline-fill"
              style={{ width: `${Math.min(progressToGoal.percentComplete, 100)}%` }}
            />
          </div>
          <div className="timeline-labels">
            <span className="start-label">${currentBalance.toLocaleString()}</span>
            <span className="end-label">${targetBalance.toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      <div className="goal-status-section">
        {progressToGoal.isOnTrack ? (
          <div className="goal-status success">
            <div className="status-icon">✅</div>
            <div className="status-content">
              <h5>On Track to Reach Your ${targetBalance.toLocaleString()} Goal</h5>
              <p>
                Your current strategy should reach the goal in {progressToGoal.monthsToGoal} months, 
                which is {progressToGoal.targetTimeframe - progressToGoal.monthsToGoal} months ahead of schedule!
              </p>
            </div>
          </div>
        ) : (
          <div className="goal-status warning">
            <div className="status-icon">⚠️</div>
            <div className="status-content">
              <h5>Current Strategy May Take {progressToGoal.monthsToGoal} Months</h5>
              <p>
                This is {progressToGoal.monthsToGoal - progressToGoal.targetTimeframe} months longer than your {progressToGoal.targetTimeframe}-month target. 
                Consider optimizing your strategy or adjusting your timeline.
              </p>
              <button 
                className="adjust-strategy-btn"
                onClick={handleOptimizeStrategy}
              >
                Optimize Strategy for Goal
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="strategy-insights">
        <h5>📊 Strategy Insights</h5>
        <div className="insights-grid">
          <div className="insight-card">
            <span className="insight-label">Per-Trade Return Needed:</span>
            <span className="insight-value">
              {((Math.pow(goal.targetBalance / goal.currentBalance, 1 / (parseFloat(goal.timeframe) * 20)) - 1) * 100).toFixed(3)}%
            </span>
          </div>
          <div className="insight-card">
            <span className="insight-label">Current Per-Trade:</span>
            <span className="insight-value">
              {(currentCalculations.perTradeReturn || 0).toFixed(3)}%
            </span>
          </div>
          <div className="insight-card">
            <span className="insight-label">Gap to Goal:</span>
            <span className={`insight-value ${progressToGoal.isOnTrack ? 'positive' : 'negative'}`}>
              {progressToGoal.isOnTrack ? 'Ahead' : 'Behind'} by {Math.abs(progressToGoal.monthsToGoal - progressToGoal.targetTimeframe)} months
            </span>
          </div>
        </div>
      </div>

      <style>
        {`
        .goal-aware-sizing {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          overflow: hidden;
          margin: 24px 0;
        }

        .goal-progress-card {
          padding: 24px;
          background: linear-gradient(145deg, #f7fafc 0%, #edf2f7 100%);
          border-bottom: 1px solid #e2e8f0;
        }

        .card-title {
          font-size: 1.25rem;
          font-weight: bold;
          color: #2d3748;
          margin: 0 0 20px 0;
          text-align: center;
        }

        .progress-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
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
          font-size: 1.1rem;
          font-weight: bold;
        }

        .metric .value.progress {
          color: #667eea;
        }

        .metric .value.amount {
          color: #e53e3e;
        }

        .metric .value.timeline {
          color: #d69e2e;
        }

        .metric .value.growth {
          color: #38a169;
        }

        .goal-timeline-bar {
          margin-top: 16px;
        }

        .timeline-progress {
          width: 100%;
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .timeline-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          transition: width 0.3s ease;
          border-radius: 4px;
        }

        .timeline-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: #718096;
        }

        .goal-status-section {
          padding: 20px 24px;
        }

        .goal-status {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid;
        }

        .goal-status.success {
          background: #f0fff4;
          border-color: #9ae6b4;
          color: #22543d;
        }

        .goal-status.warning {
          background: #fffaf0;
          border-color: #fbd38d;
          color: #744210;
        }

        .status-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .status-content h5 {
          margin: 0 0 8px 0;
          font-size: 1.1rem;
          font-weight: bold;
        }

        .status-content p {
          margin: 0 0 12px 0;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .adjust-strategy-btn {
          background: #667eea;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .adjust-strategy-btn:hover {
          background: #5a67d8;
        }

        .strategy-insights {
          padding: 20px 24px;
          background: #f8f9fa;
          border-top: 1px solid #e2e8f0;
        }

        .strategy-insights h5 {
          margin: 0 0 16px 0;
          font-size: 1.1rem;
          font-weight: bold;
          color: #2d3748;
        }

        .insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
        }

        .insight-card {
          background: white;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 4px;
          text-align: center;
        }

        .insight-label {
          font-size: 0.8rem;
          color: #718096;
          font-weight: 500;
        }

        .insight-value {
          font-size: 1rem;
          font-weight: bold;
          color: #2d3748;
        }

        .insight-value.positive {
          color: #38a169;
        }

        .insight-value.negative {
          color: #e53e3e;
        }

        @media (max-width: 768px) {
          .progress-metrics {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          
          .insights-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          
          .goal-status {
            flex-direction: column;
            gap: 12px;
          }
        }
        `}
      </style>
    </div>
  );
}; 