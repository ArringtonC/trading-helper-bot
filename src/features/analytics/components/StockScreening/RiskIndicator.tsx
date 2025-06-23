import React from 'react';

// Type definitions
type RiskLevel = 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
type RiskSize = 'small' | 'medium' | 'large';

interface RiskLevelConfig {
  color: string;
  pattern: string;
  label: string;
  description: string;
  range: [number, number];
  symbol: string;
  text: string;
}

interface RiskIndicatorProps {
  level?: RiskLevel;
  value?: number;
  showPattern?: boolean;
  showNumeric?: boolean;
  size?: RiskSize;
  compact?: boolean;
  label?: string;
  showDistribution?: boolean;
}

interface RiskBadgeProps {
  level?: RiskLevel;
  value?: number;
  compact?: boolean;
}

interface RiskChartProps {
  stocks: any[];
  userLevel: 'beginner' | 'advanced';
}

/**
 * RiskIndicator Component - Color-blind accessible risk visualization
 * 
 * Based on accessibility research:
 * - 1 in 12 men and 1 in 200 women are color blind
 * - Patterns + text labels alongside colors improve accessibility
 * - Color range: Green #A5D796 to Red #B90D0D (research-backed)
 */

// Shared risk levels configuration
const riskLevels: Record<RiskLevel, RiskLevelConfig> = {
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
const getRiskLevel = (numericValue: number): RiskLevel => {
  if (numericValue <= 2) return 'very-low';
  if (numericValue <= 4) return 'low';
  if (numericValue <= 6) return 'moderate';
  if (numericValue <= 8) return 'high';
  return 'very-high';
};

export const RiskIndicator: React.FC<RiskIndicatorProps> = ({ 
  level, 
  value, 
  showPattern = true, 
  showNumeric = false,
  size = 'medium',
  compact = false,
  label,
  showDistribution = false
}) => {
  const currentLevel = level || getRiskLevel(value || 0);
  const riskData = riskLevels[currentLevel];
  const numericValue = value || 0;

  const sizeClasses = {
    small: 'h-4 w-16',
    medium: 'h-6 w-20', 
    large: 'h-8 w-24'
  };

  return (
    <div className={`risk-indicator ${size} ${compact ? 'compact' : ''}`}>
      {/* Label */}
      {label && !compact && (
        <div className="risk-label">
          <span className="label-text">{label}</span>
        </div>
      )}

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
            <div className={`risk-pattern pattern-${riskData.pattern}`} />
          )}
          
          {/* Text indicator for accessibility */}
          <span className="risk-text-indicator">
            {riskData.text}
          </span>
        </div>

        {/* Numeric Value Display */}
        {showNumeric && (
          <span className="risk-numeric">
            {numericValue.toFixed(1)}/10
          </span>
        )}
      </div>

      {/* Risk Level Label */}
      {!compact && (
        <div className="risk-details">
          <span className="risk-level-label">{riskData.label}</span>
          <span className="risk-description">{riskData.description}</span>
        </div>
      )}

      {/* Risk Distribution Chart (for portfolio view) */}
      {showDistribution && (
        <div className="risk-distribution">
          <div className="distribution-bar">
            {Object.entries(riskLevels).map(([levelKey, levelData]) => {
              const isActive = levelKey === currentLevel;
              return (
                <div
                  key={levelKey}
                  className={`distribution-segment ${isActive ? 'active' : ''}`}
                  style={{ backgroundColor: levelData.color }}
                  title={levelData.label}
                />
              );
            })}
          </div>
          <div className="distribution-labels">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * RiskBadge - Compact version for table views
 */
export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, value, compact = true }) => {
  return (
    <RiskIndicator 
      level={level}
      value={value}
      size="small"
      compact={compact}
      showPattern={true}
    />
  );
};

/**
 * RiskChart - Risk distribution visualization for portfolios
 */
export const RiskChart: React.FC<RiskChartProps> = ({ stocks, userLevel }) => {
  // Calculate risk distribution
  const riskDistribution = stocks.reduce((acc, stock) => {
    const riskLevel = stock.riskLevel || getRiskLevel(stock.riskScore || 5);
    acc[riskLevel] = (acc[riskLevel] || 0) + 1;
    return acc;
  }, {} as Record<RiskLevel, number>);

  const totalStocks = stocks.length;

  return (
    <div className={`risk-chart ${userLevel}`}>
      <h3 className="chart-title">Portfolio Risk Distribution</h3>
      
      <div className="risk-distribution-chart">
        {Object.entries(riskLevels).map(([levelKey, levelData]) => {
          const count = riskDistribution[levelKey as RiskLevel] || 0;
          const percentage = totalStocks > 0 ? (count / totalStocks) * 100 : 0;
          
          return (
            <div key={levelKey} className="risk-segment">
              <div className="segment-bar">
                <div
                  className={`segment-fill pattern-${levelData.pattern}`}
                  style={{
                    height: `${percentage}%`,
                    backgroundColor: levelData.color
                  }}
                />
              </div>
              <div className="segment-info">
                <span className="segment-symbol">{levelData.symbol}</span>
                <span className="segment-count">{count}</span>
                <span className="segment-label">{levelData.text}</span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Summary Statistics */}
      <div className="risk-summary">
        <div className="summary-item">
          <span className="summary-label">Total Stocks</span>
          <span className="summary-value">{totalStocks}</span>
        </div>
        
        <div className="summary-item">
          <span className="summary-label">Avg Risk Level</span>
          <span className="summary-value">
            {totalStocks > 0 ? (
              riskLevels[getRiskLevel(
                stocks.reduce((sum, stock) => sum + (stock.riskScore || 5), 0) / totalStocks
              )].text
            ) : 'N/A'}
          </span>
        </div>
      </div>
      
      {/* Beginner Guidance */}
      {userLevel === 'beginner' && totalStocks > 0 && (
        <div className="risk-guidance">
          <h4 className="guidance-title">💡 Risk Management Tips</h4>
          <ul className="guidance-list">
            <li>Diversify across different risk levels</li>
            <li>Start with lower-risk investments</li>
            <li>Never invest more than you can afford to lose</li>
            <li>Consider your time horizon and goals</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export { getRiskLevel, riskLevels };
export default RiskIndicator;