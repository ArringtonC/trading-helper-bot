import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Zap,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

interface RiskAssessmentPanelProps {
  riskMetrics: {
    alpha: number;
    beta: number;
    rSquared: number;
    standardDeviation: number;
    sharpeRatio: number;
    portfolioRisk: number;
  } | null;
  positions: Array<{
    symbol: string;
    name: string;
    sector: string;
    weight: number;
    beta: number;
    risk: 'low' | 'medium' | 'high';
  }>;
}

const RiskAssessmentPanel: React.FC<RiskAssessmentPanelProps> = ({
  riskMetrics,
  positions
}) => {
  const getRiskMetricColor = (value: number, metric: string) => {
    switch (metric) {
      case 'alpha':
        if (value > 0.02) return 'text-green-600 bg-green-100';
        if (value < -0.02) return 'text-red-600 bg-red-100';
        return 'text-yellow-600 bg-yellow-100';
      
      case 'beta':
        if (value >= 0.8 && value <= 1.2) return 'text-green-600 bg-green-100';
        if (value > 1.5 || value < 0.5) return 'text-red-600 bg-red-100';
        return 'text-yellow-600 bg-yellow-100';
      
      case 'rSquared':
        if (value > 0.85) return 'text-green-600 bg-green-100';
        if (value < 0.7) return 'text-red-600 bg-red-100';
        return 'text-yellow-600 bg-yellow-100';
      
      case 'sharpeRatio':
        if (value > 1.0) return 'text-green-600 bg-green-100';
        if (value < 0.5) return 'text-red-600 bg-red-100';
        return 'text-yellow-600 bg-yellow-100';
      
      case 'standardDeviation':
        if (value < 0.15) return 'text-green-600 bg-green-100';
        if (value > 0.25) return 'text-red-600 bg-red-100';
        return 'text-yellow-600 bg-yellow-100';
      
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskMetricExplanation = (metric: string) => {
    switch (metric) {
      case 'alpha':
        return 'Measures excess return versus market benchmark. Positive alpha indicates outperformance.';
      case 'beta':
        return 'Measures sensitivity to market movements. Beta of 1.0 moves with market, >1.0 is more volatile.';
      case 'rSquared':
        return 'Shows correlation with market (0-1). Higher values indicate portfolio moves similarly to market.';
      case 'sharpeRatio':
        return 'Risk-adjusted return measure. Higher values indicate better returns per unit of risk.';
      case 'standardDeviation':
        return 'Measures portfolio volatility. Lower values indicate more stable returns.';
      default:
        return '';
    }
  };

  const getRiskMetricIcon = (metric: string) => {
    switch (metric) {
      case 'alpha': return TrendingUp;
      case 'beta': return BarChart3;
      case 'rSquared': return Target;
      case 'sharpeRatio': return Zap;
      case 'standardDeviation': return Shield;
      default: return Info;
    }
  };

  const formatMetricValue = (value: number, metric: string) => {
    switch (metric) {
      case 'alpha':
        return `${(value * 100).toFixed(2)}%`;
      case 'standardDeviation':
        return `${(value * 100).toFixed(1)}%`;
      case 'rSquared':
        return value.toFixed(3);
      default:
        return value.toFixed(2);
    }
  };

  if (!riskMetrics) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Five-Factor Risk Assessment
          </h3>
        </div>
        <div className="p-6 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const metrics = [
    { key: 'alpha', label: 'Alpha (α)', value: riskMetrics.alpha },
    { key: 'beta', label: 'Beta (β)', value: riskMetrics.beta },
    { key: 'rSquared', label: 'R-Squared (R²)', value: riskMetrics.rSquared },
    { key: 'sharpeRatio', label: 'Sharpe Ratio', value: riskMetrics.sharpeRatio },
    { key: 'standardDeviation', label: 'Standard Deviation (σ)', value: riskMetrics.standardDeviation }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          Five-Factor Risk Assessment
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Comprehensive analysis of your portfolio's risk characteristics
        </p>
      </div>

      <div className="p-6">
        {/* Risk Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {metrics.map(({ key, label, value }) => {
            const Icon = getRiskMetricIcon(key);
            const colorClass = getRiskMetricColor(value, key);
            
            return (
              <div key={key} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">{label}</span>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${colorClass}`}>
                    {formatMetricValue(value, key)}
                  </div>
                </div>
                
                <p className="text-xs text-gray-600 leading-relaxed">
                  {getRiskMetricExplanation(key)}
                </p>
                
                {/* Visual indicator bar */}
                <div className="mt-3">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        colorClass.includes('green') ? 'bg-green-500' :
                        colorClass.includes('yellow') ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ 
                        width: `${Math.min(100, Math.max(10, 
                          key === 'alpha' ? Math.abs(value * 1000) + 50 :
                          key === 'beta' ? Math.min(value * 50, 100) :
                          key === 'rSquared' ? value * 100 :
                          key === 'sharpeRatio' ? Math.min(value * 50, 100) :
                          key === 'standardDeviation' ? 100 - (value * 300) : 50
                        ))}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Portfolio Risk Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-2">Risk Assessment Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Market Sensitivity:</strong> Portfolio beta of {riskMetrics.beta.toFixed(2)} indicates{' '}
                  {riskMetrics.beta > 1.2 ? 'high' : riskMetrics.beta < 0.8 ? 'low' : 'moderate'} market sensitivity.
                </div>
                <div>
                  <strong>Risk-Adjusted Performance:</strong> Sharpe ratio of {riskMetrics.sharpeRatio.toFixed(2)}{' '}
                  {riskMetrics.sharpeRatio > 1.0 ? 'indicates excellent' : 
                   riskMetrics.sharpeRatio > 0.5 ? 'shows adequate' : 'suggests poor'} risk-adjusted returns.
                </div>
                <div>
                  <strong>Market Correlation:</strong> R-squared of {riskMetrics.rSquared.toFixed(3)}{' '}
                  {riskMetrics.rSquared > 0.85 ? 'shows high correlation' : 
                   riskMetrics.rSquared > 0.7 ? 'indicates moderate correlation' : 'suggests low correlation'} with market.
                </div>
                <div>
                  <strong>Volatility Level:</strong> Standard deviation of {(riskMetrics.standardDeviation * 100).toFixed(1)}%{' '}
                  {riskMetrics.standardDeviation < 0.15 ? 'indicates low volatility' : 
                   riskMetrics.standardDeviation < 0.25 ? 'shows moderate volatility' : 'suggests high volatility'}.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Position Risk Breakdown */}
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Position Risk Breakdown</h4>
          <div className="space-y-3">
            {positions.slice(0, 5).map((position) => (
              <div key={position.symbol} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-700">{position.symbol}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{position.symbol}</div>
                    <div className="text-sm text-gray-600">{position.sector}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">{position.weight.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">Weight</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">β {position.beta.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">Beta</div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    position.risk === 'low' ? 'text-green-600 bg-green-100' :
                    position.risk === 'medium' ? 'text-yellow-600 bg-yellow-100' :
                    'text-red-600 bg-red-100'
                  }`}>
                    {position.risk.toUpperCase()}
                  </div>
                </div>
              </div>
            ))}
            
            {positions.length > 5 && (
              <div className="text-center text-gray-500 text-sm py-2">
                And {positions.length - 5} more positions...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskAssessmentPanel; 