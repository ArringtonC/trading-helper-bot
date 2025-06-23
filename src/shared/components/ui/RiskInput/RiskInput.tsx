// Enhanced Risk Input Component - Smart defaults, tooltips, and dynamic feedback
// Provides educational guidance and real-time risk assessment

import React, { useState, useEffect, useCallback } from 'react';
import { InformationCircleIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface RiskInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  type: 'positionSize' | 'maxExposure' | 'winRate' | 'payoffRatio' | 'accountSize';
  defaultValue?: number;
  explanation?: string;
  min?: number;
  max?: number;
  unit?: string;
  className?: string;
  disabled?: boolean;
}

interface RiskFeedback {
  type: 'safe' | 'caution' | 'warning' | 'danger';
  message: string;
  suggestion?: string;
  example?: string;
}

const RiskInput: React.FC<RiskInputProps> = ({
  label,
  value,
  onChange,
  type,
  defaultValue,
  explanation,
  min = 0,
  max = 100,
  unit = '%',
  className = '',
  disabled = false
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [feedback, setFeedback] = useState<RiskFeedback | null>(null);

  // Smart defaults based on type
  const getSmartDefault = (): number => {
    if (defaultValue !== undefined) return defaultValue;
    
    switch (type) {
      case 'positionSize': return 5; // 5% safe default
      case 'maxExposure': return 100; // 100% no leverage
      case 'winRate': return 0.5; // 50% win rate
      case 'payoffRatio': return 1.5; // 1.5:1 risk/reward
      case 'accountSize': return 10000; // $10,000 default account size
      default: return 0;
    }
  };

  // Educational content for tooltips
  const getEducationalContent = (): { title: string; content: string; learnMore: string } => {
    switch (type) {
      case 'positionSize':
        return {
          title: 'Position Size',
          content: 'Start with 1-5% to limit risk per trade. This controls how much of your account you risk on each position.',
          learnMore: 'Professional traders rarely risk more than 2% per trade to preserve capital during losing streaks.'
        };
      case 'maxExposure':
        return {
          title: 'Total Exposure',
          content: '>100% means using leverage. Beginners: stay under 150%. This is your total market exposure across all positions.',
          learnMore: 'Higher exposure amplifies both gains and losses. Start conservative until you understand the risks.'
        };
      case 'winRate':
        return {
          title: 'Win Rate',
          content: 'Percentage of trades that are profitable. Enter as decimal (0.6 = 60%). Most strategies have 40-70% win rates.',
          learnMore: 'A high win rate doesn\'t guarantee profitability - payoff ratio matters more than frequency.'
        };
      case 'payoffRatio':
        return {
          title: 'Payoff Ratio',
          content: 'Average win ÷ average loss. 1.5 means wins are 1.5x larger than losses. Higher is better for long-term success.',
          learnMore: 'Even with a 40% win rate, a 2:1 payoff ratio can be very profitable over time.'
        };
      case 'accountSize':
        return {
          title: 'Account Size',
          content: 'Your total trading capital in dollars. This is the base amount used to calculate position sizes and risk limits.',
          learnMore: 'Start with an amount you can afford to lose. Never trade with money needed for living expenses or emergencies.'
        };
      default:
        return { title: '', content: '', learnMore: '' };
    }
  };

  // Dynamic risk assessment
  const assessRisk = useCallback((inputValue: number): RiskFeedback => {
    switch (type) {
      case 'positionSize':
        if (inputValue <= 2) {
          return {
            type: 'safe',
            message: 'Conservative and safe for long-term growth',
            example: `At ${inputValue}%, you could lose 10 trades and still have ${(100 - inputValue * 10).toFixed(0)}% of your account.`
          };
        } else if (inputValue <= 5) {
          return {
            type: 'caution',
            message: 'Moderate risk - good for experienced traders',
            example: `At ${inputValue}%, losing 5 trades would cost ~${(inputValue * 5).toFixed(0)}% of your account.`
          };
        } else if (inputValue <= 10) {
          return {
            type: 'warning',
            message: 'High risk - requires excellent risk management',
            suggestion: 'Consider reducing to 2-5% for better capital preservation',
            example: `Risk Alert: ${inputValue}% per trade means losing 5 trades could wipe out ~${Math.round(100 - Math.pow(1 - inputValue/100, 5) * 100)}% of your account.`
          };
        } else {
          return {
            type: 'danger',
            message: 'Extremely high risk - not recommended',
            suggestion: 'Reduce to ≤5% to protect your trading capital',
            example: `Danger: At ${inputValue}%, just 2-3 losing trades could devastate your account.`
          };
        }

      case 'maxExposure':
        if (inputValue <= 100) {
          return {
            type: 'safe',
            message: 'No leverage - safest approach for beginners',
            example: 'You\'re only risking your own capital with no borrowed money.'
          };
        } else if (inputValue <= 150) {
          return {
            type: 'caution',
            message: 'Moderate leverage - manageable for experienced traders',
            example: `${inputValue}% exposure means you're using ${(inputValue - 100).toFixed(0)}% leverage.`
          };
        } else if (inputValue <= 200) {
          return {
            type: 'warning',
            message: 'High leverage - requires careful monitoring',
            suggestion: 'Consider reducing exposure or using tighter stop losses',
            example: `${inputValue}% exposure amplifies both gains and losses by ${(inputValue/100).toFixed(1)}x.`
          };
        } else {
          return {
            type: 'danger',
            message: 'Maximum exposure exceeded',
            suggestion: 'Reduce to ≤200% for safety, or contact support to override',
            example: 'Extreme leverage can lead to rapid account depletion during market volatility.'
          };
        }

      case 'winRate':
        if (inputValue < 0 || inputValue > 1) {
          return {
            type: 'danger',
            message: 'Invalid win rate',
            suggestion: 'Enter a decimal between 0 and 1 (e.g., 0.6 for 60%)',
            example: 'Win rate should be expressed as a decimal: 0.5 = 50%, 0.75 = 75%'
          };
        } else if (inputValue >= 0.7) {
          return {
            type: 'safe',
            message: 'Excellent win rate - focus on maintaining consistency',
            example: `${(inputValue * 100).toFixed(0)}% win rate is very strong if sustainable.`
          };
        } else if (inputValue >= 0.5) {
          return {
            type: 'caution',
            message: 'Good win rate - ensure your payoff ratio supports profitability',
            example: `${(inputValue * 100).toFixed(0)}% wins means ${((1-inputValue) * 100).toFixed(0)}% losses - payoff ratio is crucial.`
          };
        } else {
          return {
            type: 'warning',
            message: 'Lower win rate - you need a strong payoff ratio (>2:1)',
            suggestion: 'Focus on cutting losses quickly and letting winners run',
            example: `With ${(inputValue * 100).toFixed(0)}% wins, you need big winners to overcome frequent small losses.`
          };
        }

      case 'payoffRatio':
        if (inputValue <= 0) {
          return {
            type: 'danger',
            message: 'Invalid payoff ratio',
            suggestion: 'Enter a value greater than 0 (e.g., 1.5 means wins are 1.5x losses)',
            example: 'Payoff ratio = Average Win ÷ Average Loss'
          };
        } else if (inputValue >= 2) {
          return {
            type: 'safe',
            message: 'Excellent payoff ratio - strong foundation for profitability',
            example: `2:1 ratio means your average win is ${inputValue}x your average loss.`
          };
        } else if (inputValue >= 1.5) {
          return {
            type: 'caution',
            message: 'Good payoff ratio - sustainable with decent win rate',
            example: `${inputValue}:1 ratio provides good profit potential with 50%+ win rate.`
          };
        } else if (inputValue >= 1) {
          return {
            type: 'warning',
            message: 'Low payoff ratio - you need a high win rate (>60%)',
            suggestion: 'Try to improve by taking profits later or cutting losses earlier',
            example: `${inputValue}:1 ratio requires winning more than 60% of trades to be profitable.`
          };
        } else {
          return {
            type: 'danger',
            message: 'Poor payoff ratio - losses exceed wins on average',
            suggestion: 'Focus on risk management - cut losses quickly and let winners run',
            example: 'When losses are bigger than wins, even high win rates can be unprofitable.'
          };
        }

      case 'accountSize':
        if (inputValue < 1000) {
          return {
            type: 'warning',
            message: 'Small account size - consider paper trading first',
            suggestion: 'Build up more capital or practice with a demo account',
            example: 'Small accounts have limited diversification and higher relative transaction costs.'
          };
        } else if (inputValue <= 10000) {
          return {
            type: 'caution',
            message: 'Good starting account size for learning',
            example: `$${inputValue.toLocaleString()} allows for proper position sizing and risk management.`
          };
        } else if (inputValue <= 100000) {
          return {
            type: 'safe',
            message: 'Excellent account size for active trading',
            example: `$${inputValue.toLocaleString()} provides good flexibility for diversification and position sizing.`
          };
        } else {
          return {
            type: 'safe',
            message: 'Large account - consider professional management',
            example: `$${inputValue.toLocaleString()} may benefit from institutional-grade risk management tools.`
          };
        }

      default:
        return { type: 'safe', message: '' };
    }
  }, [type]);

  // Update feedback when value changes
  useEffect(() => {
    setFeedback(assessRisk(value));
  }, [value, assessRisk]);

  const handleReset = () => {
    const smartDefault = getSmartDefault();
    onChange(smartDefault);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value) || 0;
    onChange(newValue);
  };

  const educationalContent = getEducationalContent();
  const feedbackColors = {
    safe: 'text-green-700 bg-green-50 border-green-200',
    caution: 'text-blue-700 bg-blue-50 border-blue-200',
    warning: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    danger: 'text-red-700 bg-red-50 border-red-200'
  };

  const feedbackIcons = {
    safe: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
    caution: <InformationCircleIcon className="h-5 w-5 text-blue-500" />,
    warning: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />,
    danger: <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Input Label with Tooltip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <InformationCircleIcon className="h-4 w-4" />
            </button>
            
            {/* Tooltip */}
            {showTooltip && (
              <div className="absolute z-10 w-64 p-3 mt-1 text-sm bg-gray-900 text-white rounded-lg shadow-lg -left-32">
                <div className="font-medium mb-1">{educationalContent.title}</div>
                <div className="text-gray-300">{educationalContent.content}</div>
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            )}
          </div>
        </div>
        
        {/* Reset Button */}
        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
        >
          Restore safe defaults
        </button>
      </div>

      {/* Input Field */}
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          step={type === 'winRate' ? 0.01 : type === 'accountSize' ? 100 : 1}
          disabled={disabled}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder={`Enter ${label.toLowerCase()}`}
        />
        {unit && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">{unit}</span>
          </div>
        )}
      </div>

      {/* Dynamic Feedback */}
      {feedback && feedback.message && (
        <div className={`p-3 rounded-lg border ${feedbackColors[feedback.type]}`}>
          <div className="flex items-start space-x-2">
            <div className="flex-shrink-0 mt-0.5">
              {feedbackIcons[feedback.type]}
            </div>
            <div className="flex-1 space-y-2">
              <div className="text-sm font-medium">{feedback.message}</div>
              
              {feedback.suggestion && (
                <div className="text-xs">
                  <span className="font-medium">Suggestion:</span> {feedback.suggestion}
                </div>
              )}
              
              {feedback.example && (
                <div className="text-xs italic">
                  {feedback.example}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Expandable "Why this matters?" Section */}
      <div className="border-t border-gray-200 pt-2">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-gray-600 hover:text-gray-800 transition-colors flex items-center space-x-1"
        >
          <span>Why this matters?</span>
          <svg 
            className={`h-3 w-3 transform transition-transform ${showDetails ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showDetails && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-700">
            {educationalContent.learnMore}
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskInput; 