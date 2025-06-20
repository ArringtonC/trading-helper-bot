import React from 'react';

/**
 * GoalMatchIndicator Component - Research-backed goal alignment visualization
 * 
 * Based on research findings:
 * - Goal-first approach delivers 400+ basis points performance improvement
 * - Five primary goal categories with specific indicators
 * - Visual feedback improves user decision-making
 * - Color-blind accessible design with patterns and text
 */
export const GoalMatchIndicator = ({
  alignment,
  confidence = 0,
  userLevel = 'beginner',
  showDetails = false,
  compact = false
}) => {
  // Goal types based on research (32% Income, 28% Growth, 25% Preservation, 10% Learning, 5% Active)
  const goalTypes = {
    'income-generation': {
      label: 'Income Generation',
      color: '#4CAF50',
      icon: '💰',
      pattern: 'diagonal-right',
      description: 'Dividend-focused steady income'
    },
    'growth-seeking': {
      label: 'Growth Seeking', 
      color: '#2196F3',
      icon: '📈',
      pattern: 'upward-arrows',
      description: 'Capital appreciation potential'
    },
    'capital-preservation': {
      label: 'Capital Preservation',
      color: '#FF9800',
      icon: '🛡️',
      pattern: 'dots',
      description: 'Low-risk wealth protection'
    },
    'learning-practice': {
      label: 'Learning & Practice',
      color: '#9C27B0',
      icon: '🎓',
      pattern: 'horizontal',
      description: 'Educational investment value'
    },
    'active-trading': {
      label: 'Active Trading',
      color: '#F44336',
      icon: '⚡',
      pattern: 'crosshatch',
      description: 'High-frequency trading opportunities'
    }
  };

  if (!alignment || !goalTypes[alignment.type]) {
    return null;
  }

  const goalData = goalTypes[alignment.type];
  const matchScore = alignment.score || 0;
  const matchPercentage = Math.round(matchScore * 100);

  // Confidence level styling
  const getConfidenceLevel = (conf) => {
    if (conf >= 0.8) return { level: 'high', label: 'High Confidence' };
    if (conf >= 0.6) return { level: 'medium', label: 'Medium Confidence' };
    return { level: 'low', label: 'Low Confidence' };
  };

  const confidenceData = getConfidenceLevel(confidence);

  return (
    <div className={`
      goal-match-indicator 
      ${compact ? 'compact' : 'full'}
      ${userLevel}
      confidence-${confidenceData.level}
    `}>
      {/* Primary Goal Match Display */}
      <div className="goal-match-primary">
        <div className="goal-identity">
          <span 
            className="goal-icon"
            role="img"
            aria-label={goalData.label}
          >
            {goalData.icon}
          </span>
          
          <div className="goal-info">
            <span className="goal-label">{goalData.label}</span>
            {!compact && (
              <span className="goal-description">{goalData.description}</span>
            )}
          </div>
        </div>

        {/* Match Score Visualization */}
        <div className="match-score-container">
          <div className="match-score-visual">
            {/* Progress ring for match percentage */}
            <svg className="match-ring" width="60" height="60" viewBox="0 0 60 60">
              <circle
                cx="30"
                cy="30"
                r="25"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="4"
              />
              <circle
                cx="30"
                cy="30"
                r="25"
                fill="none"
                stroke={goalData.color}
                strokeWidth="4"
                strokeDasharray={`${matchPercentage * 1.57} 157`}
                strokeDashoffset="39.25"
                strokeLinecap="round"
                transform="rotate(-90 30 30)"
                className="match-progress"
              />
              {/* Pattern overlay for accessibility */}
              <circle
                cx="30"
                cy="30"
                r="25"
                fill="none"
                stroke="url(#pattern-overlay)"
                strokeWidth="2"
                strokeDasharray={`${matchPercentage * 1.57} 157`}
                strokeDashoffset="39.25"
                strokeLinecap="round"
                transform="rotate(-90 30 30)"
                opacity="0.3"
              />
            </svg>
            
            {/* Match percentage text */}
            <div className="match-percentage">
              <span className="percentage-value">{matchPercentage}%</span>
              <span className="percentage-label">Match</span>
            </div>
          </div>

          {/* Confidence indicator */}
          <div className={`confidence-indicator ${confidenceData.level}`}>
            <div className="confidence-dots">
              {[1, 2, 3].map(dot => (
                <div 
                  key={dot}
                  className={`confidence-dot ${confidence >= (dot * 0.33) ? 'active' : 'inactive'}`}
                  style={{ backgroundColor: confidence >= (dot * 0.33) ? goalData.color : '#e5e7eb' }}
                />
              ))}
            </div>
            {!compact && (
              <span className="confidence-label">{confidenceData.label}</span>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Match Factors */}
      {showDetails && alignment.factors && (
        <div className="match-factors">
          <h4>Why This Matches Your Goals:</h4>
          <div className="factors-list">
            {alignment.factors.map((factor, index) => (
              <div key={index} className="factor-item">
                <div className="factor-strength">
                  <div 
                    className="strength-bar"
                    style={{ 
                      width: `${factor.weight * 100}%`,
                      backgroundColor: goalData.color
                    }}
                  />
                </div>
                <span className="factor-text">{factor.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Action Indicators for beginners */}
      {userLevel === 'beginner' && matchScore >= 0.7 && (
        <div className="beginner-guidance">
          <div className="guidance-badge">
            <span className="guidance-icon">✨</span>
            <span className="guidance-text">Strong Match for Your Goals</span>
          </div>
        </div>
      )}

      {/* SVG Pattern Definitions for Accessibility */}
      <svg width="0" height="0">
        <defs>
          <pattern id="pattern-overlay" patternUnits="userSpaceOnUse" width="4" height="4">
            <rect width="4" height="4" fill="none"/>
            <path d="M 0,4 l 4,-4 M -1,1 l 2,-2 M 3,5 l 2,-2" stroke={goalData.color} strokeWidth="1"/>
          </pattern>
        </defs>
      </svg>

      {/* Screen reader content */}
      <div className="sr-only">
        Goal alignment: {goalData.label} with {matchPercentage}% match score.
        Confidence level: {confidenceData.label}.
        {alignment.factors && `Key factors: ${alignment.factors.map(f => f.description).join(', ')}.`}
      </div>
    </div>
  );
};

/**
 * GoalMatchBadge - Compact version for cards and lists
 */
export const GoalMatchBadge = ({ alignment, compact = true }) => {
  if (!alignment) return null;

  const goalIcons = {
    'income-generation': '💰',
    'growth-seeking': '📈', 
    'capital-preservation': '🛡️',
    'learning-practice': '🎓',
    'active-trading': '⚡'
  };

  const matchScore = Math.round((alignment.score || 0) * 100);
  const icon = goalIcons[alignment.type];

  return (
    <span className={`goal-match-badge ${alignment.type} ${compact ? 'compact' : ''}`}>
      <span className="badge-icon" role="img" aria-label={alignment.type}>
        {icon}
      </span>
      <span className="badge-score">{matchScore}%</span>
    </span>
  );
};

/**
 * GoalMatchChart - For portfolio overview and analytics
 */
export const GoalMatchChart = ({ stocks, userGoals }) => {
  const goalDistribution = stocks.reduce((acc, stock) => {
    if (stock.goalAlignment) {
      const goalType = stock.goalAlignment.type;
      acc[goalType] = (acc[goalType] || 0) + 1;
    }
    return acc;
  }, {});

  const averageMatches = Object.entries(goalDistribution).map(([goalType, count]) => {
    const relevantStocks = stocks.filter(s => s.goalAlignment?.type === goalType);
    const avgMatch = relevantStocks.reduce((sum, stock) => sum + (stock.goalAlignment.score || 0), 0) / relevantStocks.length;
    
    return {
      goalType,
      count,
      averageMatch: avgMatch * 100,
      percentage: (count / stocks.length) * 100
    };
  });

  return (
    <div className="goal-match-chart">
      <h3>Goal Alignment Overview</h3>
      <div className="chart-container">
        {averageMatches.map(({ goalType, count, averageMatch, percentage }) => (
          <div key={goalType} className="goal-chart-item">
            <GoalMatchBadge alignment={{ type: goalType, score: averageMatch / 100 }} compact={false} />
            <div className="chart-stats">
              <span className="stock-count">{count} stocks</span>
              <span className="average-match">{averageMatch.toFixed(1)}% avg match</span>
              <span className="portfolio-percentage">{percentage.toFixed(1)}% of portfolio</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GoalMatchIndicator; 