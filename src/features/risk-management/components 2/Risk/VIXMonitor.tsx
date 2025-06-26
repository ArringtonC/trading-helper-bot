import React, { useState, useEffect } from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Eye,
  BarChart3,
  Zap
} from 'lucide-react';

interface VIXMonitorProps {}

const VIXMonitor: React.FC<VIXMonitorProps> = () => {
  const [vixData, setVixData] = useState({
    current: 18.5,
    change: -0.8,
    changePercent: -4.2,
    level: 'low' as 'low' | 'moderate' | 'high' | 'extreme',
    trend: 'down' as 'up' | 'down' | 'stable'
  });

  const [historicalData, setHistoricalData] = useState([
    { date: '2024-01-15', value: 16.2, level: 'low' },
    { date: '2024-01-16', value: 17.8, level: 'low' },
    { date: '2024-01-17', value: 19.4, level: 'low' },
    { date: '2024-01-18', value: 18.9, level: 'low' },
    { date: '2024-01-19', value: 18.5, level: 'low' }
  ]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Simulate real-time VIX updates
    const interval = setInterval(() => {
      const variation = (Math.random() - 0.5) * 2; // ±1 point variation
      const newValue = Math.max(10, Math.min(50, vixData.current + variation));
      const change = newValue - vixData.current;
      const changePercent = (change / vixData.current) * 100;
      
      setVixData(prev => ({
        ...prev,
        current: parseFloat(newValue.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        level: getVIXLevel(newValue),
        trend: change > 0.1 ? 'up' : change < -0.1 ? 'down' : 'stable'
      }));
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [vixData.current]);

  const getVIXLevel = (value: number): 'low' | 'moderate' | 'high' | 'extreme' => {
    if (value < 20) return 'low';
    if (value < 30) return 'moderate';
    if (value < 40) return 'high';
    return 'extreme';
  };

  const getVIXLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'extreme': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getVIXGradient = (level: string) => {
    switch (level) {
      case 'low': return 'from-green-100 to-green-200';
      case 'moderate': return 'from-yellow-100 to-yellow-200';
      case 'high': return 'from-orange-100 to-orange-200';
      case 'extreme': return 'from-red-100 to-red-200';
      default: return 'from-gray-100 to-gray-200';
    }
  };

  const getVIXDescription = (level: string) => {
    switch (level) {
      case 'low':
        return 'Market volatility is low, indicating investor confidence and stable conditions.';
      case 'moderate':
        return 'Moderate volatility suggests some market uncertainty but manageable risk levels.';
      case 'high':
        return 'High volatility indicates significant market stress and increased risk.';
      case 'extreme':
        return 'Extreme volatility suggests panic conditions and very high market risk.';
      default:
        return 'VIX level assessment unavailable.';
    }
  };

  const getVIXRecommendations = (level: string) => {
    switch (level) {
      case 'low':
        return [
          'Consider taking on slightly more risk for higher returns',
          'Good time for rebalancing portfolios',
          'Monitor for complacency in market positioning'
        ];
      case 'moderate':
        return [
          'Maintain current risk levels',
          'Watch for trend changes in volatility',
          'Consider defensive positioning if volatility increases'
        ];
      case 'high':
        return [
          'Reduce portfolio risk exposure',
          'Increase cash positions',
          'Avoid leveraged investments',
          'Focus on quality, defensive stocks'
        ];
      case 'extreme':
        return [
          'Move to defensive positioning immediately',
          'Consider hedging strategies',
          'Avoid new equity positions',
          'Maintain high cash reserves'
        ];
      default:
        return [];
    }
  };

  const refreshVIXData = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate new random VIX value
    const newValue = 15 + Math.random() * 20; // Random between 15-35
    const change = newValue - vixData.current;
    const changePercent = (change / vixData.current) * 100;
    
    setVixData({
      current: parseFloat(newValue.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      level: getVIXLevel(newValue),
      trend: change > 0.1 ? 'up' : change < -0.1 ? 'down' : 'stable'
    });
    
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-500" />
              VIX Monitor (Fear Index)
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Real-time market volatility and investor sentiment tracking
            </p>
          </div>
          <button
            onClick={refreshVIXData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Eye className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Live Data
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Current VIX Display */}
        <div className={`bg-gradient-to-r ${getVIXGradient(vixData.level)} rounded-lg p-6 mb-6`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h4 className="text-3xl font-bold text-gray-900">
                  {vixData.current.toFixed(2)}
                </h4>
                <div className="flex items-center gap-2">
                  {vixData.trend === 'up' ? (
                    <TrendingUp className="h-5 w-5 text-red-600" />
                  ) : vixData.trend === 'down' ? (
                    <TrendingDown className="h-5 w-5 text-green-600" />
                  ) : (
                    <BarChart3 className="h-5 w-5 text-gray-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    vixData.change >= 0 ? 'text-red-700' : 'text-green-700'
                  }`}>
                    {vixData.change >= 0 ? '+' : ''}{vixData.change.toFixed(2)} 
                    ({vixData.changePercent >= 0 ? '+' : ''}{vixData.changePercent.toFixed(1)}%)
                  </span>
                </div>
              </div>
              <p className="text-gray-700 font-medium">Current VIX Level</p>
              <p className="text-sm text-gray-600 mt-1">
                {getVIXDescription(vixData.level)}
              </p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold ${getVIXLevelColor(vixData.level)}`}>
                {vixData.level.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* VIX Level Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`rounded-lg p-4 text-center ${vixData.level === 'low' ? 'bg-green-100 border-2 border-green-300' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="font-bold text-green-700">Low (0-20)</div>
            <div className="text-sm text-green-600">Calm Markets</div>
          </div>
          <div className={`rounded-lg p-4 text-center ${vixData.level === 'moderate' ? 'bg-yellow-100 border-2 border-yellow-300' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-center mb-2">
              <Eye className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="font-bold text-yellow-700">Moderate (20-30)</div>
            <div className="text-sm text-yellow-600">Some Uncertainty</div>
          </div>
          <div className={`rounded-lg p-4 text-center ${vixData.level === 'high' ? 'bg-orange-100 border-2 border-orange-300' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div className="font-bold text-orange-700">High (30-40)</div>
            <div className="text-sm text-orange-600">Market Stress</div>
          </div>
          <div className={`rounded-lg p-4 text-center ${vixData.level === 'extreme' ? 'bg-red-100 border-2 border-red-300' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-center mb-2">
              <Zap className="h-5 w-5 text-red-600" />
            </div>
            <div className="font-bold text-red-700">Extreme (40+)</div>
            <div className="text-sm text-red-600">Panic Conditions</div>
          </div>
        </div>

        {/* VIX Recommendations */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Portfolio Recommendations</h4>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <ul className="space-y-2">
              {getVIXRecommendations(vixData.level).map((recommendation, index) => (
                <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recent VIX Trend */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">5-Day VIX Trend</h4>
          <div className="space-y-2">
            {historicalData.map((dataPoint, index) => (
              <div key={dataPoint.date} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700">
                  {new Date(dataPoint.date).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-900">
                    {dataPoint.value.toFixed(2)}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getVIXLevelColor(dataPoint.level)}`}>
                    {dataPoint.level.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* VIX Education */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">About the VIX</h4>
          <p className="text-sm text-gray-600 mb-3">
            The VIX (Volatility Index) measures expected volatility in the S&P 500 index over the next 30 days. 
            It's calculated from options prices and is often called the "fear index" because it tends to spike 
            during market uncertainty and decline during calm periods.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-gray-800 mb-1">Key Facts:</h5>
              <ul className="text-gray-600 space-y-1">
                <li>• Based on S&P 500 options prices</li>
                <li>• Represents 30-day expected volatility</li>
                <li>• Inverse correlation with stock prices</li>
                <li>• Can spike rapidly during crises</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-800 mb-1">Historical Context:</h5>
              <ul className="text-gray-600 space-y-1">
                <li>• Normal range: 12-20</li>
                <li>• 2008 Crisis peak: ~80</li>
                <li>• COVID-19 peak: ~82</li>
                <li>• Bull market lows: ~9-11</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VIXMonitor; 