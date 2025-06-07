import React from 'react';

interface GoalProgressHeaderProps {
  currentBalance: number;
  targetBalance: number;
  timeframe: string;
  monthsRemaining?: number;
  className?: string;
}

export const GoalProgressHeader: React.FC<GoalProgressHeaderProps> = ({
  currentBalance,
  targetBalance,
  timeframe,
  monthsRemaining,
  className = ''
}) => {
  const progressPercent = Math.min((currentBalance / targetBalance) * 100, 100);
  const remaining = Math.max(targetBalance - currentBalance, 0);
  
  return (
    <div className={`goal-progress-header ${className}`}>
      <div className="goal-summary">
        <h2 className="goal-title">🎯 Your Trading Goal</h2>
        <div className="goal-amounts">
          <span className="current">${currentBalance.toLocaleString()}</span>
          <span className="arrow">→</span>
          <span className="target">${targetBalance.toLocaleString()}</span>
        </div>
        <div className="goal-timeline">
          Target: {timeframe} | ${remaining.toLocaleString()} to go
        </div>
      </div>
      
      <div className="progress-visualization">
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="progress-labels">
            <span>0%</span>
            <span className="current-progress">{progressPercent.toFixed(1)}%</span>
            <span>100%</span>
          </div>
        </div>
        
        <div className="timeline-estimate">
          📅 {monthsRemaining ? 
            `Estimated completion: ${monthsRemaining} months` : 
            'Set your strategy to see timeline'
          }
        </div>
      </div>
      
      <style>
        {`
        .goal-progress-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 24px;
          border-radius: 12px;
          margin-bottom: 24px;
          box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
        }

        .goal-title {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0 0 12px 0;
          text-align: center;
        }

        .goal-amounts {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          font-size: 2rem;
          font-weight: bold;
          margin: 8px 0;
        }

        .goal-amounts .current {
          color: #ffd700;
        }

        .goal-amounts .arrow {
          color: #ffd700;
          font-size: 1.5rem;
        }

        .goal-amounts .target {
          color: #00ff88;
        }

        .goal-timeline {
          text-align: center;
          font-size: 1.1rem;
          margin-bottom: 20px;
          opacity: 0.9;
        }

        .progress-bar-container {
          margin: 16px 0;
        }

        .progress-bar {
          width: 100%;
          height: 12px;
          background: rgba(255,255,255,0.2);
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #00ff88 0%, #00ccff 100%);
          transition: width 0.3s ease;
          border-radius: 6px;
        }

        .progress-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          opacity: 0.8;
        }

        .current-progress {
          font-weight: bold;
          color: #ffd700;
        }

        .timeline-estimate {
          text-align: center;
          font-size: 1rem;
          margin-top: 12px;
          padding: 8px 16px;
          background: rgba(255,255,255,0.1);
          border-radius: 20px;
          display: inline-block;
          margin-left: 50%;
          transform: translateX(-50%);
        }

        @media (max-width: 768px) {
          .goal-amounts {
            font-size: 1.5rem;
            flex-direction: column;
            gap: 8px;
          }
          
          .goal-amounts .arrow {
            transform: rotate(90deg);
          }
        }
        `}
      </style>
    </div>
  );
}; 