import React from 'react';
import { TutorialProgress as TutorialProgressType } from '../../types/Tutorial';

interface TutorialProgressProps {
  currentStep: number;
  totalSteps: number;
  stepsCompleted: number;
  xpEarned: number;
  className?: string;
}

const TutorialProgress: React.FC<TutorialProgressProps> = ({
  currentStep,
  totalSteps,
  stepsCompleted,
  xpEarned,
  className = ''
}) => {
  const progressPercent = (stepsCompleted / totalSteps) * 100;

  const getBadgeStatus = (stepIndex: number) => {
    if (stepIndex < stepsCompleted) return 'completed';
    if (stepIndex === currentStep - 1) return 'active';
    return 'locked';
  };

  const getBadgeIcon = (stepIndex: number) => {
    const status = getBadgeStatus(stepIndex);
    switch (status) {
      case 'completed': return '✅';
      case 'active': return '🎯';
      case 'locked': return '🔒';
      default: return '🔒';
    }
  };

  return (
    <div className={`tutorial-progress ${className}`}>
      <div className="progress-header">
        <h3 className="progress-title">🎮 Position Sizing Mastery</h3>
        <div className="step-indicator">
          Step {currentStep} of {totalSteps}
        </div>
      </div>
      
      <div className="progress-bar-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="progress-percentage">
          {Math.round(progressPercent)}% Complete
        </div>
      </div>
      
      <div className="progress-badges">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div 
            key={i}
            className={`badge badge-${getBadgeStatus(i)}`}
            title={`Step ${i + 1}: ${getBadgeStatus(i)}`}
          >
            {getBadgeIcon(i)}
          </div>
        ))}
      </div>
      
      <div className="xp-counter">
        🏆 {xpEarned} XP earned
        {stepsCompleted > 0 && (
          <span className="xp-breakdown">
            ({stepsCompleted} × 100 XP)
          </span>
        )}
      </div>

      {stepsCompleted === totalSteps && (
        <div className="completion-celebration">
          🎉 Tutorial Complete! You're now a Position Sizing Master! 🎉
        </div>
      )}
    </div>
  );
};

export default TutorialProgress; 