// Enhanced Risk Dashboard - Comprehensive UX for trading risk validation
// Combines smart defaults, educational content, and dynamic feedback

import React, { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, CheckCircleIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import RiskInput from '../RiskInput/RiskInput';
import { 
  generateRiskSummary, 
  calculateKelly, 
  generateEducationalExample,
  formatPercentage
} from '../../../utils/riskCalculations';

interface RiskDashboardProps {
  initialValues?: {
    positionSize?: number;
    maxExposure?: number;
    winRate?: number;
    payoffRatio?: number;
    accountSize?: number;
  };
  onValuesChange?: (values: RiskValues) => void;
  className?: string;
}

interface RiskValues {
  positionSize: number;
  maxExposure: number;
  winRate: number;
  payoffRatio: number;
  accountSize: number;
}

const RiskDashboard: React.FC<RiskDashboardProps> = ({
  initialValues = {},
  onValuesChange,
  className = ''
}) => {
  const [values, setValues] = useState<RiskValues>({
    positionSize: initialValues.positionSize || 5,
    maxExposure: initialValues.maxExposure || 100,
    winRate: initialValues.winRate || 0.5,
    payoffRatio: initialValues.payoffRatio || 1.5,
    accountSize: initialValues.accountSize || 10000
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [riskSummary, setRiskSummary] = useState<any>(null);

  // Update risk summary when values change
  useEffect(() => {
    const summary = generateRiskSummary(
      values.positionSize,
      values.maxExposure,
      values.winRate,
      values.payoffRatio
    );
    setRiskSummary(summary);
    
    if (onValuesChange) {
      onValuesChange(values);
    }
  }, [values, onValuesChange]);

  const updateValue = (field: keyof RiskValues, value: number) => {
    setValues(prev => ({ ...prev, [field]: value }));
  };

  const resetToSafeDefaults = () => {
    setValues({
      positionSize: 2,
      maxExposure: 100,
      winRate: 0.5,
      payoffRatio: 1.5,
      accountSize: values.accountSize // Keep current account size
    });
  };

  const applyKellyRecommendation = () => {
    const kelly = calculateKelly(values.winRate, values.payoffRatio);
    if (kelly.isPositive) {
      updateValue('positionSize', kelly.recommendedSize);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-700 bg-green-50 border-green-200';
      case 'medium': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'high': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'extreme': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'medium': return <LightBulbIcon className="h-5 w-5 text-blue-500" />;
      case 'high': return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'extreme': return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Quick Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Risk Configuration</h3>
          <p className="text-sm text-gray-600">Let's keep your account safe while maximizing growth potential</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={resetToSafeDefaults}
            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
          >
            Safe Defaults
          </button>
          <button
            onClick={applyKellyRecommendation}
            className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
            disabled={!riskSummary?.kellyAnalysis?.isPositive}
          >
            Apply Kelly
          </button>
        </div>
      </div>

      {/* Account Size Input */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <RiskInput
          label="Account Size"
          value={values.accountSize}
          onChange={(value) => updateValue('accountSize', value)}
          type="accountSize"
          min={1000}
          max={10000000}
          unit="$"
          explanation="Your total trading capital"
        />
      </div>

      {/* Primary Risk Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RiskInput
          label="Position Size"
          value={values.positionSize}
          onChange={(value) => updateValue('positionSize', value)}
          type="positionSize"
          min={0.1}
          max={50}
          unit="%"
        />
        
        <RiskInput
          label="Maximum Exposure"
          value={values.maxExposure}
          onChange={(value) => updateValue('maxExposure', value)}
          type="maxExposure"
          min={10}
          max={300}
          unit="%"
        />
      </div>

      {/* Advanced Settings Toggle */}
      <div className="border-t border-gray-200 pt-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          <span>Advanced Settings (Trading Statistics)</span>
          <svg 
            className={`h-4 w-4 transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showAdvanced && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <RiskInput
              label="Win Rate"
              value={values.winRate}
              onChange={(value) => updateValue('winRate', value)}
              type="winRate"
              min={0.1}
              max={0.95}
              unit=""
            />
            
            <RiskInput
              label="Payoff Ratio"
              value={values.payoffRatio}
              onChange={(value) => updateValue('payoffRatio', value)}
              type="payoffRatio"
              min={0.1}
              max={10}
              unit=":1"
            />
          </div>
        )}
      </div>

      {/* Risk Summary Dashboard */}
      {riskSummary && (
        <div className="space-y-4">
          {/* Overall Risk Level */}
          <div className={`p-4 rounded-lg border ${getRiskColor(riskSummary.overallRisk)}`}>
            <div className="flex items-center space-x-3">
              {getRiskIcon(riskSummary.overallRisk)}
              <div>
                <h4 className="font-medium capitalize">
                  {riskSummary.overallRisk} Risk Level
                </h4>
                <p className="text-sm mt-1">
                  {riskSummary.overallRisk === 'low' && 'Your configuration looks conservative and safe for long-term growth.'}
                  {riskSummary.overallRisk === 'medium' && 'Moderate risk level - good balance between growth and safety.'}
                  {riskSummary.overallRisk === 'high' && 'High risk configuration - requires careful monitoring and discipline.'}
                  {riskSummary.overallRisk === 'extreme' && 'Extreme risk detected - consider adjusting your settings for better capital preservation.'}
                </p>
              </div>
            </div>
          </div>

          {/* Educational Examples */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Real-World Impact</h4>
            <div className="space-y-2 text-sm text-blue-700">
              <div>
                <span className="font-medium">Position Risk:</span> {' '}
                {generateEducationalExample('positionSize', values.positionSize, { accountSize: values.accountSize })}
              </div>
              <div>
                <span className="font-medium">Leverage Impact:</span> {' '}
                {generateEducationalExample('leverage', values.maxExposure, { accountSize: values.accountSize })}
              </div>
              {showAdvanced && (
                <div>
                  <span className="font-medium">Kelly Analysis:</span> {' '}
                  {generateEducationalExample('kelly', 0, { 
                    winRate: values.winRate, 
                    payoffRatio: values.payoffRatio 
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Warnings */}
          {riskSummary.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">⚠️ Risk Warnings</h4>
              <ul className="space-y-1 text-sm text-yellow-700">
                {riskSummary.warnings.map((warning: string, index: number) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {riskSummary.suggestions.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">💡 Suggestions</h4>
              <ul className="space-y-1 text-sm text-green-700">
                {riskSummary.suggestions.map((suggestion: string, index: number) => (
                  <li key={index}>• {suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Kelly Analysis Details */}
          {showAdvanced && riskSummary.kellyAnalysis && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">📊 Kelly Criterion Analysis</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Kelly Fraction:</span>
                  <span className="ml-2 font-medium">{formatPercentage(riskSummary.kellyAnalysis.kellyFraction)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Recommended Size:</span>
                  <span className="ml-2 font-medium">{formatPercentage(riskSummary.kellyAnalysis.recommendedSize)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Risk Level:</span>
                  <span className="ml-2 font-medium capitalize">{riskSummary.kellyAnalysis.riskLevel}</span>
                </div>
                <div>
                  <span className="text-gray-600">Profitable:</span>
                  <span className="ml-2 font-medium">{riskSummary.kellyAnalysis.isPositive ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RiskDashboard; 