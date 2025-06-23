/**
 * Weekend Gap Risk Dashboard
 * 
 * Main dashboard component for analyzing weekend gap risk across positions
 * with automated recommendations and configurable risk settings.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '../../../shared/components/ui/Card';
import { Badge } from '../../../shared/components/ui/Badge';
import { Button } from '../../../shared/components/ui/button';
import RiskSettingsModal from '../../../shared/components/ui/RiskSettingsModal';
import { WeekendGapRiskService } from '../../../shared/services/WeekendGapRiskService';
import { GapRiskRuleEngine } from '../../../shared/services/GapRiskRuleEngine';
import { TradingStyleConfigService } from '../../../shared/services/TradingStyleConfigService';
import { GapRiskExportService, ExportOptions } from '../../../shared/services/GapRiskExportService';
import { GapRiskSchedulingService } from '../../../shared/services/GapRiskSchedulingService';
import { getRulesForStyleAndRisk } from '../../../shared/utils/tradingStyleRuleTemplates';
import { 
  TradingStyleGapAssessment, 
  TradingStyleConfig, 
  GapRiskRecommendation,
} from '../../../shared/types/tradingStyleRules';
import { NormalizedTradeData, BrokerType } from '../../../shared/types/trade';

// Mock position data for development
const MOCK_POSITIONS: NormalizedTradeData[] = [
  {
    id: 'mock-1',
    importTimestamp: new Date().toISOString(),
    broker: BrokerType.IBKR,
    tradeDate: new Date().toISOString().split('T')[0],
    symbol: 'AAPL',
    quantity: 100,
    tradePrice: 150.00,
    currency: 'USD',
    netAmount: -15000,
    dateTime: new Date().toISOString(),
    assetCategory: 'STK'
  },
  {
    id: 'mock-2',
    importTimestamp: new Date().toISOString(),
    broker: BrokerType.IBKR,
    tradeDate: new Date().toISOString().split('T')[0],
    symbol: 'TSLA',
    quantity: 50,
    tradePrice: 200.00,
    currency: 'USD',
    netAmount: -10000,
    dateTime: new Date().toISOString(),
    assetCategory: 'STK'
  },
  {
    id: 'mock-3',
    importTimestamp: new Date().toISOString(),
    broker: BrokerType.IBKR,
    tradeDate: new Date().toISOString().split('T')[0],
    symbol: 'SPY',
    quantity: 200,
    tradePrice: 400.00,
    currency: 'USD',
    netAmount: -80000,
    dateTime: new Date().toISOString(),
    assetCategory: 'STK'
  }
];

type RiskLevel = 'low' | 'medium' | 'high' | 'extreme';

interface DashboardData {
  assessment: TradingStyleGapAssessment | null;
  isLoading: boolean;
  error: string | null;
}

interface WeekendGapRiskDashboardProps {
  userId?: string;
  selectedTradingStyle?: string;
}

export const WeekendGapRiskDashboard: React.FC<WeekendGapRiskDashboardProps> = ({ 
  userId = 'default',
  selectedTradingStyle 
}) => {
  console.log('WeekendGapRiskDashboard rendering with:', { userId, selectedTradingStyle });

  const [data, setData] = useState<DashboardData>({
    assessment: null,
    isLoading: true,
    error: null
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<TradingStyleConfig | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [exportInProgress, setExportInProgress] = useState(false);

  // Services
  const weekendGapService = useMemo(() => new WeekendGapRiskService(), []);
  const configService = useMemo(() => new TradingStyleConfigService(), []);
  const ruleEngine = useMemo(() => new GapRiskRuleEngine(weekendGapService, configService), [weekendGapService, configService]);
  const exportService = useMemo(() => new GapRiskExportService(), []);
  const schedulingService = useMemo(() => new GapRiskSchedulingService(ruleEngine, exportService, configService), [ruleEngine, exportService, configService]);

  const getRiskLevelColor = (level: RiskLevel): string => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      case 'extreme': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'low': return 'text-blue-600 bg-blue-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      case 'critical': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityIcon = (priority: string): string => {
    switch (priority) {
      case 'low': return 'ℹ️';
      case 'medium': return '⚠️';
      case 'high': return '🚨';
      case 'critical': return '🔥';
      default: return '📋';
    }
  };

  const loadDashboardData = useCallback(async (config?: TradingStyleConfig) => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Use provided config or get current user config
      const userConfig = config || configService.getConfigForUser('default');
      setCurrentConfig(userConfig);
      
      // Get default rules for the trading style
      const rules = getRulesForStyleAndRisk(userConfig.style, userConfig.riskTolerance);
      
      // Evaluate positions using the rule engine
      const assessment = await ruleEngine.evaluatePositions(
        'default',
        MOCK_POSITIONS,
        rules
      );
      
      setData({
        assessment,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setData({
        assessment: null,
        isLoading: false,
        error: 'Failed to load dashboard data. Please try again.'
      });
    }
  }, [ruleEngine, configService]);

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    await loadDashboardData(currentConfig || undefined);
    setIsRefreshing(false);
  }, [loadDashboardData, currentConfig]);

  const handleSettingsUpdate = useCallback(async (newConfig: TradingStyleConfig) => {
    setCurrentConfig(newConfig);
    await loadDashboardData(newConfig);
  }, [loadDashboardData]);

  const executeRecommendedAction = async (recommendation: GapRiskRecommendation) => {
    setActionInProgress(recommendation.action);
    
    try {
      // Simulate action execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would:
      // 1. Execute the recommended action via trading service
      // 2. Update position data
      // 3. Refresh dashboard with new data
      
      console.log(`Executed action: ${recommendation.action}`, recommendation);
      
      // Refresh data after action
      await refreshData();
      
    } catch (error) {
      console.error('Failed to execute action:', error);
    } finally {
      setActionInProgress(null);
    }
  };

  const exportReport = async (format: 'pdf' | 'csv') => {
    if (!data.assessment) return;
    
    setExportInProgress(true);
    try {
      const exportOptions: ExportOptions = {
        format,
        includePositions: true,
        includeRecommendations: true,
        includeCharts: format === 'pdf'
      };

      const result = await exportService.exportAssessment(
        data.assessment,
        MOCK_POSITIONS,
        exportOptions
      );

      if (result.success) {
        // In a real implementation, this would trigger a download
        console.log(`Export successful: ${result.fileName}`);
        alert(`Report exported successfully as ${result.fileName}`);
      } else {
        console.error('Export failed:', result.error);
        alert(`Export failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed due to an error');
    } finally {
      setExportInProgress(false);
    }
  };

  const setupFridaySchedule = async () => {
    try {
      const scheduleId = await schedulingService.createFridayAnalysisSchedule(
        'default',
        { 
          inApp: true, 
          email: ['user@example.com'] // In real implementation, get from user settings
        }
      );
      
      console.log(`Created Friday schedule: ${scheduleId}`);
      alert('Friday analysis schedule created successfully!');
    } catch (error) {
      console.error('Failed to create schedule:', error);
      alert('Failed to create schedule');
    }
  };

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Early return for debugging
  if (data.isLoading) {
    console.log('Component is loading...');
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">🏁 Weekend Gap Risk Dashboard</h1>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading weekend gap risk analysis...</p>
        </div>
      </div>
    );
  }

  const { assessment, error } = data;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            🏁 Weekend Gap Risk Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Friday position analysis with gap risk assessment and recommendations
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsSettingsOpen(true)}
            variant="outline"
            className="bg-gray-600 text-white hover:bg-gray-700"
          >
            ⚙️ Settings
          </Button>
          <Button
            onClick={setupFridaySchedule}
            variant="outline"
            className="bg-purple-600 text-white hover:bg-purple-700"
          >
            📅 Auto Schedule
          </Button>
          <Button
            onClick={() => exportReport('pdf')}
            disabled={exportInProgress}
            variant="outline"
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {exportInProgress ? '⟳ Exporting...' : '📄 Export PDF'}
          </Button>
          <Button
            onClick={() => exportReport('csv')}
            disabled={exportInProgress}
            variant="outline"
            className="bg-green-600 text-white hover:bg-green-700"
          >
            📊 Export CSV
          </Button>
          <Button
            onClick={refreshData}
            disabled={isRefreshing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRefreshing ? '⟳ Refreshing...' : '🔄 Refresh Data'}
          </Button>
        </div>
      </div>

      {/* Configuration Info */}
      {currentConfig && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-800">Current Configuration</h3>
              <p className="text-sm text-blue-700 mt-1">
                Trading Style: <span className="font-medium capitalize">{currentConfig.style.replace('_', ' ')}</span> | 
                Risk Tolerance: <span className="font-medium capitalize">{currentConfig.riskTolerance}</span> | 
                Account Size: <span className="font-medium">${currentConfig.accountSize.toLocaleString()}</span>
              </p>
            </div>
            <div className="text-blue-400 text-2xl">📊</div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-red-400">⚠️</div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {assessment && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Positions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {assessment.summary.totalPositionsEvaluated}
                  </p>
                </div>
                <div className="text-2xl">📊</div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Portfolio Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${(assessment.portfolioMetrics.totalWeekendExposure || 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-2xl">💰</div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">High Risk Positions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {assessment.summary.highRiskPositions}
                  </p>
                </div>
                <div className="text-2xl">⚠️</div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overall Risk Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(assessment.overallRiskScore)}
                  </p>
                </div>
                <div className="text-2xl">📈</div>
              </div>
            </Card>
          </div>

          {/* Enhanced Recommendations Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  🤖 Automated Recommendations
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  AI-generated actionable recommendations based on your trading style
                </p>
              </div>
              <div className="p-4">
                {assessment.recommendations.length > 0 ? (
                  <div className="space-y-3">
                    {assessment.recommendations
                      .sort((a, b) => {
                        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                        return priorityOrder[b.priority as keyof typeof priorityOrder] - 
                               priorityOrder[a.priority as keyof typeof priorityOrder];
                      })
                      .map((rec, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">{getPriorityIcon(rec.priority)}</span>
                              <Badge className={getPriorityColor(rec.priority)}>
                                {rec.priority.toUpperCase()}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                Risk reduction: {rec.riskReduction || 0}%
                              </span>
                            </div>
                            <h3 className="font-medium text-gray-900 mb-1">{rec.action}</h3>
                            <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                            <p className="text-xs text-gray-500">{rec.reasoning}</p>
                            {rec.timeline && (
                              <p className="text-xs text-blue-600 mt-1">Timeline: {rec.timeline}</p>
                            )}
                          </div>
                          <div className="ml-3">
                            <Button
                              onClick={() => executeRecommendedAction(rec)}
                              disabled={actionInProgress === rec.action}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm"
                            >
                              {actionInProgress === rec.action ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                  </svg>
                                  Executing...
                                </>
                              ) : (
                                '▶️ Execute'
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">✅</div>
                    <p className="text-gray-600">No recommendations at this time</p>
                    <p className="text-sm text-gray-500">Your portfolio appears to be well-positioned for the weekend</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Risk Analysis Summary */}
            <Card>
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  📊 Risk Analysis Summary
                </h2>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Overall Risk Level</span>
                      <Badge className={getRiskLevelColor(assessment.riskLevel)}>
                        {assessment.riskLevel.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          assessment.riskLevel === 'low' ? 'bg-green-500' :
                          assessment.riskLevel === 'medium' ? 'bg-yellow-500' :
                          assessment.riskLevel === 'high' ? 'bg-red-500' :
                          'bg-purple-500'
                        }`}
                        style={{ width: `${Math.min(assessment.overallRiskScore, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Weekend Exposure</span>
                      <span className="text-sm font-medium">
                        ${(assessment.portfolioMetrics.totalWeekendExposure || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Concentration Risk</span>
                      <span className="text-sm font-medium">
                        {Math.round((assessment.portfolioMetrics.concentrationRisk || 0) * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Diversification Score</span>
                      <span className="text-sm font-medium">
                        {Math.round((assessment.portfolioMetrics.diversificationScore || 0) * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Estimated Risk Reduction</span>
                      <span className="text-sm font-medium text-green-600">
                        {Math.round(assessment.summary.estimatedRiskReduction)}%
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Last updated: {assessment.assessmentDate.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Valid until: {assessment.validUntil.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Position Summary Table */}
          <Card className="mb-6">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Position Summary with Gap Risk Analysis
              </h2>
            </div>
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Symbol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Position Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gap Risk Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Risk Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expected Loss
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {MOCK_POSITIONS.map((position, index) => {
                      const evaluation = assessment.positionEvaluations.find(
                        e => e.ruleId.includes(position.symbol)
                      );
                      const positionValue = (position.quantity || 0) * (position.tradePrice || 0);
                      
                      return (
                        <tr key={position.symbol} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {position.symbol}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(position.quantity || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${(position.tradePrice || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${positionValue.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getRiskLevelColor(evaluation?.riskLevel || 'low')}>
                              {(evaluation?.riskLevel || 'low').toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {Math.round(evaluation?.riskScore || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                            ${Math.round(positionValue * 0.02).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Risk Settings Modal */}
      <RiskSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userId="default"
        onSettingsUpdate={handleSettingsUpdate}
      />
    </div>
  );
};

export default WeekendGapRiskDashboard; 