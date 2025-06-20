import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  Eye,
  Calculator,
  BookOpen,
  RefreshCw,
  ArrowRight,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import RiskAssessmentPanel from '../../components/Risk/RiskAssessmentPanel';
import PortfolioRiskOverview from '../../components/Risk/PortfolioRiskOverview';
import RiskEducationPanel from '../../components/Risk/RiskEducationPanel';
import CorrelationHeatmap from '../../components/Risk/CorrelationHeatmap';
import RiskFilteringEngine from '../../components/Risk/RiskFilteringEngine';
import VIXMonitor from '../../components/Risk/VIXMonitor';
import RiskIntegratedScreeningService from '../../services/RiskIntegratedScreeningService';

interface RiskMetrics {
  alpha: number;
  beta: number;
  rSquared: number;
  standardDeviation: number;
  sharpeRatio: number;
  portfolioRisk: number;
  vixLevel: number;
  sectorConcentration: { [sector: string]: number };
  correlationMatrix: { [key: string]: { [key: string]: number } };
}

interface PortfolioPosition {
  symbol: string;
  name: string;
  sector: string;
  weight: number;
  beta: number;
  debtToEquity: number;
  currentRatio: number;
  price: number;
  risk: 'low' | 'medium' | 'high';
}

const RiskManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<'overview' | 'analysis' | 'simulation'>('overview');
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [portfolioPositions, setPortfolioPositions] = useState<PortfolioPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [riskService] = useState(() => new RiskIntegratedScreeningService());
  const [refreshing, setRefreshing] = useState(false);
  const [riskAlerts, setRiskAlerts] = useState<string[]>([]);

  // Demo portfolio data
  const demoPositions: PortfolioPosition[] = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      sector: 'Technology',
      weight: 15.2,
      beta: 1.24,
      debtToEquity: 1.73,
      currentRatio: 1.07,
      price: 182.52,
      risk: 'medium'
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      sector: 'Technology',
      weight: 12.8,
      beta: 0.91,
      debtToEquity: 0.35,
      currentRatio: 2.48,
      price: 378.85,
      risk: 'low'
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      sector: 'Technology',
      weight: 10.5,
      beta: 1.06,
      debtToEquity: 0.11,
      currentRatio: 2.93,
      price: 139.69,
      risk: 'medium'
    },
    {
      symbol: 'JNJ',
      name: 'Johnson & Johnson',
      sector: 'Healthcare',
      weight: 8.3,
      beta: 0.68,
      debtToEquity: 0.46,
      currentRatio: 1.13,
      price: 160.89,
      risk: 'low'
    },
    {
      symbol: 'BRK-B',
      name: 'Berkshire Hathaway',
      sector: 'Financial',
      weight: 7.9,
      beta: 0.84,
      debtToEquity: 0.28,
      currentRatio: 1.43,
      price: 434.24,
      risk: 'low'
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      sector: 'Automotive',
      weight: 6.2,
      beta: 2.42,
      debtToEquity: 0.08,
      currentRatio: 1.29,
      price: 248.50,
      risk: 'high'
    },
    {
      symbol: 'V',
      name: 'Visa Inc.',
      sector: 'Financial',
      weight: 5.8,
      beta: 0.98,
      debtToEquity: 0.68,
      currentRatio: 1.65,
      price: 267.44,
      risk: 'medium'
    },
    {
      symbol: 'JPM',
      name: 'JPMorgan Chase',
      sector: 'Financial',
      weight: 5.4,
      beta: 1.15,
      debtToEquity: 1.49,
      currentRatio: 1.28,
      price: 179.32,
      risk: 'medium'
    }
  ];

  useEffect(() => {
    initializeRiskData();
  }, []);

  const initializeRiskData = async () => {
    setLoading(true);
    try {
      // Simulate API call with demo data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPortfolioPositions(demoPositions);
      
      // Calculate risk metrics
      const metrics = await riskService.calculatePortfolioRisk(demoPositions);
      setRiskMetrics({ ...metrics, sectorConcentration: (metrics.sectorConcentration || { "Technology": 0 }) as { [sector: string]: number }, correlationMatrix: (metrics.correlationMatrix || { "SPY": { "SPY": 1.0 } }) as { [key: string]: { [key: string]: number } } });
      
      // Check for risk alerts
      const alerts = riskService.checkRiskAlerts(demoPositions, metrics);
      setRiskAlerts(alerts);
      
    } catch (error) {
      console.error('Error loading risk data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await initializeRiskData();
    setRefreshing(false);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getOverallRiskLevel = () => {
    if (!riskMetrics) return 'unknown';
    const { portfolioRisk } = riskMetrics;
    if (portfolioRisk < 30) return 'low';
    if (portfolioRisk < 70) return 'medium';
    return 'high';
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Risk Alerts */}
      {riskAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-800">Risk Alerts</h3>
          </div>
          <ul className="space-y-2">
            {riskAlerts.map((alert, index) => (
              <li key={index} className="text-sm text-red-700 flex items-start gap-2">
                <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                {alert}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Portfolio Risk Overview */}
      <PortfolioRiskOverview 
        riskMetrics={riskMetrics}
        positions={portfolioPositions}
        loading={loading}
      />

      {/* Quick Risk Summary */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Risk Assessment Summary
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(getOverallRiskLevel())}`}>
                {getOverallRiskLevel().toUpperCase()} RISK
              </div>
              <p className="text-sm text-gray-500 mt-2">Overall Portfolio Risk</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {riskMetrics?.sharpeRatio.toFixed(2) || '--'}
              </div>
              <p className="text-sm text-gray-500">Sharpe Ratio</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {riskMetrics?.beta.toFixed(2) || '--'}
              </div>
              <p className="text-sm text-gray-500">Portfolio Beta</p>
            </div>
          </div>
        </div>
      </div>

      {/* VIX Monitor */}
      <VIXMonitor />

      {/* Risk Education */}
      <RiskEducationPanel />
    </div>
  );

  const renderAnalysisTab = () => (
    <div className="space-y-6">
      {/* Five-Factor Risk Assessment */}
      <RiskAssessmentPanel 
        riskMetrics={riskMetrics}
        positions={portfolioPositions}
      />

      {/* Correlation Analysis */}
      <CorrelationHeatmap 
        correlationMatrix={riskMetrics?.correlationMatrix || {}}
        positions={portfolioPositions}
      />

      {/* Risk Filtering Engine */}
      <RiskFilteringEngine 
        positions={portfolioPositions}
        onFiltersApplied={(filteredPositions: any) => {
          console.log('Filtered positions:', filteredPositions);
        }}
      />
    </div>
  );

  const renderSimulationTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-purple-500" />
            Portfolio Impact Simulation
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Simulate the impact of adding new positions to your portfolio
          </p>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500 py-12">
            <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h4 className="text-lg font-medium mb-2">Portfolio Simulation</h4>
            <p className="text-sm mb-4">
              Advanced portfolio simulation features coming soon. Test how new positions 
              affect your overall risk profile.
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Try Demo Simulation
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading risk assessment data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="h-8 w-8 text-blue-600" />
                Risk Management Center
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Comprehensive portfolio risk assessment and monitoring
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => navigate('/learning')}
                className="text-gray-500 hover:text-gray-700 font-medium"
              >
                ← Back to Learning
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            {[
              { key: 'overview', label: 'Risk Overview', icon: Eye },
              { key: 'analysis', label: 'Live Analysis', icon: BarChart3 },
              { key: 'simulation', label: 'Portfolio Simulation', icon: Target }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setCurrentView(key as any)}
                className={`flex items-center gap-2 px-4 py-4 border-b-2 font-medium transition-colors ${
                  currentView === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {currentView === 'overview' && renderOverviewTab()}
        {currentView === 'analysis' && renderAnalysisTab()}
        {currentView === 'simulation' && renderSimulationTab()}
      </div>
    </div>
  );
};

export default RiskManagementPage; 