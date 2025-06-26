import React from 'react';
import {
  PieChart,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  AlertTriangle,
  CheckCircle,
  Activity
} from 'lucide-react';

interface PortfolioRiskOverviewProps {
  riskMetrics: {
    portfolioRisk: number;
    beta: number;
    sharpeRatio: number;
    vixLevel: number;
    sectorConcentration: { [sector: string]: number };
  } | null;
  positions: Array<{
    symbol: string;
    name: string;
    sector: string;
    weight: number;
    risk: 'low' | 'medium' | 'high';
  }>;
  loading: boolean;
}

const PortfolioRiskOverview: React.FC<PortfolioRiskOverviewProps> = ({
  riskMetrics,
  positions,
  loading
}) => {
  const getOverallRiskLevel = () => {
    if (!riskMetrics) return 'unknown';
    const { portfolioRisk } = riskMetrics;
    if (portfolioRisk < 30) return 'low';
    if (portfolioRisk < 70) return 'medium';
    return 'high';
  };

  const getRiskGradient = () => {
    const riskLevel = getOverallRiskLevel();
    switch (riskLevel) {
      case 'low': return 'from-green-100 to-green-200';
      case 'medium': return 'from-yellow-100 to-yellow-200';
      case 'high': return 'from-red-100 to-red-200';
      default: return 'from-gray-100 to-gray-200';
    }
  };

  const getSectorColor = (sector: string) => {
    const colors: { [key: string]: string } = {
      'Technology': 'bg-blue-500',
      'Healthcare': 'bg-green-500',
      'Financial': 'bg-yellow-500',
      'Automotive': 'bg-purple-500',
      'Consumer': 'bg-pink-500',
      'Energy': 'bg-orange-500',
      'Utilities': 'bg-gray-500'
    };
    return colors[sector] || 'bg-gray-400';
  };

  const calculatePositionsByRisk = () => {
    const riskCounts = { low: 0, medium: 0, high: 0 };
    positions.forEach(pos => {
      riskCounts[pos.risk]++;
    });
    return riskCounts;
  };

  if (loading || !riskMetrics) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Portfolio Risk Overview
          </h3>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const riskCounts = calculatePositionsByRisk();
  const overallRisk = getOverallRiskLevel();

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          Portfolio Risk Overview
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Real-time assessment of your portfolio's risk profile
        </p>
      </div>

      <div className="p-6">
        {/* Overall Risk Score */}
        <div className={`bg-gradient-to-r ${getRiskGradient()} rounded-lg p-6 mb-6`}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-2xl font-bold text-gray-900">
                {riskMetrics.portfolioRisk.toFixed(0)}/100
              </h4>
              <p className="text-gray-700 font-medium">Overall Risk Score</p>
              <p className="text-sm text-gray-600 mt-1">
                {overallRisk === 'low' && 'Conservative portfolio with controlled risk exposure'}
                {overallRisk === 'medium' && 'Balanced risk profile with moderate exposure'}
                {overallRisk === 'high' && 'Aggressive portfolio with elevated risk factors'}
              </p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold ${
                overallRisk === 'low' ? 'text-green-700 bg-green-200' :
                overallRisk === 'medium' ? 'text-yellow-700 bg-yellow-200' :
                'text-red-700 bg-red-200'
              }`}>
                {overallRisk.toUpperCase()} RISK
              </div>
            </div>
          </div>
          
          {/* Risk Score Bar */}
          <div className="mt-4">
            <div className="bg-white bg-opacity-50 rounded-full h-3">
              <div 
                className={`h-3 rounded-full ${
                  overallRisk === 'low' ? 'bg-green-600' :
                  overallRisk === 'medium' ? 'bg-yellow-600' : 'bg-red-600'
                }`}
                style={{ width: `${riskMetrics.portfolioRisk}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>Conservative</span>
              <span>Moderate</span>
              <span>Aggressive</span>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{riskMetrics.beta.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Portfolio Beta</div>
            <div className={`text-xs mt-1 ${
              riskMetrics.beta >= 0.8 && riskMetrics.beta <= 1.2 ? 'text-green-600' :
              'text-yellow-600'
            }`}>
              {riskMetrics.beta > 1.2 ? 'High Sensitivity' : 
               riskMetrics.beta < 0.8 ? 'Low Sensitivity' : 'Market Aligned'}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{riskMetrics.sharpeRatio.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Sharpe Ratio</div>
            <div className={`text-xs mt-1 ${
              riskMetrics.sharpeRatio > 1.0 ? 'text-green-600' :
              riskMetrics.sharpeRatio > 0.5 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {riskMetrics.sharpeRatio > 1.0 ? 'Excellent' : 
               riskMetrics.sharpeRatio > 0.5 ? 'Good' : 'Poor'}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Activity className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{riskMetrics.vixLevel.toFixed(1)}</div>
            <div className="text-sm text-gray-600">VIX Level</div>
            <div className={`text-xs mt-1 ${
              riskMetrics.vixLevel < 20 ? 'text-green-600' :
              riskMetrics.vixLevel < 30 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {riskMetrics.vixLevel < 20 ? 'Low Volatility' : 
               riskMetrics.vixLevel < 30 ? 'Moderate Volatility' : 'High Volatility'}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <PieChart className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{positions.length}</div>
            <div className="text-sm text-gray-600">Positions</div>
            <div className="text-xs text-gray-500 mt-1">
              {Object.keys(riskMetrics.sectorConcentration).length} Sectors
            </div>
          </div>
        </div>

        {/* Sector Concentration */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-purple-600" />
            Sector Concentration
          </h4>
          <div className="space-y-3">
            {Object.entries(riskMetrics.sectorConcentration)
              .sort(([,a], [,b]) => b - a)
              .map(([sector, percentage]) => (
                <div key={sector} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded ${getSectorColor(sector)}`} />
                    <span className="font-medium text-gray-900">{sector}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getSectorColor(sector)}`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-12 text-right">
                      {percentage.toFixed(1)}%
                    </span>
                    {percentage > 40 && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Risk Distribution */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Position Risk Distribution</h4>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(riskCounts).map(([riskLevel, count]) => (
              <div key={riskLevel} className="text-center">
                <div className={`w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl font-bold ${
                  riskLevel === 'low' ? 'bg-green-100 text-green-700' :
                  riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {count}
                </div>
                <div className="text-sm font-medium text-gray-900 capitalize">{riskLevel} Risk</div>
                <div className="text-xs text-gray-500">
                  {positions.length > 0 ? ((count / positions.length) * 100).toFixed(0) : 0}% of portfolio
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Alerts Summary */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h5 className="font-medium text-blue-900">Risk Monitoring Active</h5>
              <p className="text-sm text-blue-700 mt-1">
                Portfolio is being monitored for concentration risk, volatility changes, 
                and market correlation shifts. Alerts will be displayed when risk thresholds are exceeded.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioRiskOverview; 