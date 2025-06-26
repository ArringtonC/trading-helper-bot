import React from 'react';

/**
 * RiskIndicator Component - Color-blind accessible risk visualization
 * 
 * Based on accessibility research:
 * - 1 in 12 men and 1 in 200 women are color blind
 * - Patterns + text labels alongside colors improve accessibility
 * - Color range: Green #A5D796 to Red #B90D0D (research-backed)
 */

// Shared risk levels configuration
const riskLevels = {
  'very-low': { 
    color: '#A5D796', 
    pattern: 'dots', 
    label: 'Very Low Risk',
    description: 'Conservative investment',
    range: [0, 2],
    symbol: '●',
    text: 'VL'
  },
  'low': { 
    color: '#C8E6A0', 
    pattern: 'diagonal-light', 
    label: 'Low Risk',
    description: 'Stable with minimal volatility',
    range: [2, 4],
    symbol: '◐',
    text: 'L'
  },
  'moderate': { 
    color: '#F4E8A3', 
    pattern: 'horizontal', 
    label: 'Moderate Risk',
    description: 'Balanced risk-reward',
    range: [4, 6],
    symbol: '◒',
    text: 'M'
  },
  'high': { 
    color: '#F5B969', 
    pattern: 'diagonal-heavy', 
    label: 'High Risk',
    description: 'Higher volatility potential',
    range: [6, 8],
    symbol: '◑',
    text: 'H'
  },
  'very-high': { 
    color: '#B90D0D', 
    pattern: 'crosshatch', 
    label: 'Very High Risk',
    description: 'Significant volatility expected',
    range: [8, 10],
    symbol: '○',
    text: 'VH'
  }
};

// Utility function to determine risk level from numeric value
const getRiskLevel = (numericValue) => {
  if (numericValue <= 2) return 'very-low';
  if (numericValue <= 4) return 'low';
  if (numericValue <= 6) return 'moderate';
  if (numericValue <= 8) return 'high';
  return 'very-high';
};

export const RiskIndicator = ({ 
  level, 
  value, 
  showPattern = true, 
  showNumeric = false,
  size = 'medium' 
}) => {
  const currentLevel = level || getRiskLevel(value || 0);
  const riskData = riskLevels[currentLevel];

  const sizeClasses = {
    small: 'h-4 w-16',
    medium: 'h-6 w-20', 
    large: 'h-8 w-24'
  };

  return (
    <div className={`risk-indicator ${size}`}>
      {/* Visual Risk Bar with Pattern */}
      <div className="risk-visual-container">
        <div 
          className={`
            risk-bar 
            ${sizeClasses[size]}
            ${showPattern ? `pattern-${riskData.pattern}` : ''}
          `}
          style={{ backgroundColor: riskData.color }}
          role="img"
          aria-label={`${riskData.label} - ${riskData.description}`}
        >
          {/* Pattern overlay for color-blind accessibility */}
          {showPattern && (
            <div className={`pattern-overlay pattern-${riskData.pattern}`} />
          )}
          
          {/* Numeric value overlay */}
          {showNumeric && value && (
            <span className="risk-value-overlay">
              {value.toFixed(1)}
            </span>
          )}
        </div>
        
        {/* Risk level scale indicators */}
        <div className="risk-scale">
          {Object.keys(riskLevels).map((levelKey, index) => (
            <div 
              key={levelKey}
              className={`scale-marker ${levelKey === currentLevel ? 'active' : ''}`}
              title={riskLevels[levelKey].label}
            />
          ))}
        </div>
      </div>

      {/* Text Label - Always visible for accessibility */}
      <div className="risk-text-info">
        <span className="risk-label">{riskData.label}</span>
        {showNumeric && value && (
          <span className="risk-numeric">({value.toFixed(1)}/10)</span>
        )}
      </div>

      {/* Detailed description for screen readers */}
      <span className="sr-only">
        Risk assessment: {riskData.label}. {riskData.description}.
        {value && ` Numeric score: ${value.toFixed(1)} out of 10.`}
      </span>
    </div>
  );
};

/**
 * RiskBadge - Compact version for cards and tables
 */
export const RiskBadge = ({ level, value, compact = false }) => {
  const currentLevel = level || getRiskLevel(value || 0);
  const riskData = riskLevels[currentLevel];

  return (
    <span 
      className={`risk-badge ${compact ? 'compact' : ''} risk-${currentLevel}`}
      style={{ color: riskData.color }}
      title={`Risk Level: ${currentLevel.replace('-', ' ').toUpperCase()}`}
    >
      <span className="risk-symbol" aria-hidden="true">
        {riskData.symbol}
      </span>
      <span className="risk-text">
        {compact ? riskData.text : currentLevel.replace('-', ' ').toUpperCase()}
      </span>
    </span>
  );
};

/**
 * RiskChart - Full visualization for detailed views
 */
export const RiskChart = ({ stocks, userLevel = 'beginner' }) => {
  // Local risk levels for chart colors
  const chartRiskLevels = {
    'very-low': { color: '#A5D796' },
    'low': { color: '#C8E6A0' },
    'moderate': { color: '#F4E8A3' },
    'high': { color: '#F5B969' },
    'very-high': { color: '#B90D0D' }
  };

  const distribution = stocks.reduce((acc, stock) => {
    const level = stock.riskLevel || 'moderate';
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="risk-chart">
      <h3>Risk Distribution</h3>
      <div className="risk-distribution">
        {Object.entries(distribution).map(([level, count]) => (
          <div key={level} className="risk-distribution-item">
            <RiskBadge level={level} />
            <span className="count">{count} stocks</span>
            <div 
              className="distribution-bar"
              style={{ 
                width: `${(count / stocks.length) * 100}%`,
                backgroundColor: chartRiskLevels[level]?.color 
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RiskIndicator; 