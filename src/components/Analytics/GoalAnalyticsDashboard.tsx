import React, { useState, useEffect, useMemo } from 'react';
import { useGoalSizing } from '../../context/GoalSizingContext';
import { GoalSizingConfig } from '../../types/goalSizing';
import { DatabaseService } from '../../services/DatabaseService';
import UnifiedAnalyticsEngine from '../../utils/analytics/UnifiedAnalyticsEngine';
import { NormalizedTradeData } from '../../types/trade';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card } from '../ui/Card';
import { Button } from '../ui/button';
import { Alert } from '../ui/alert';

interface GoalPerformanceMetrics {
  targetReturn: number;
  actualReturn: number;
  targetTimeFrame: number;
  actualTimeFrame: number;
  targetWinRate: number;
  actualWinRate: number;
  targetDrawdown: number;
  actualDrawdown: number;
  goalAchievementScore: number;
  performanceGap: number;
}

interface PlanVsRealityData {
  goalMetrics: GoalPerformanceMetrics;
  tradeStatistics: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    avgPosition: number;
    maxPosition: number;
    adherenceScore: number;
  };
  timeSeriesData: Array<{
    date: string;
    plannedCumulative: number;
    actualCumulative: number;
    gap: number;
  }>;
  sizeComplianceData: Array<{
    period: string;
    plannedSize: number;
    actualSize: number;
    compliance: number;
  }>;
}

interface GoalAnalyticsDashboardProps {
  className?: string;
  showDetailedView?: boolean;
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const GoalAnalyticsDashboard: React.FC<GoalAnalyticsDashboardProps> = ({
  className = '',
  showDetailedView = true,
  timeRange = 'month'
}) => {
  const { config, isLoading: configLoading } = useGoalSizing();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planVsRealityData, setPlanVsRealityData] = useState<PlanVsRealityData | null>(null);
  const [trades, setTrades] = useState<NormalizedTradeData[]>([]);

  // Load and analyze data
  useEffect(() => {
    const loadAnalyticsData = async () => {
      if (!config || configLoading) return;

      try {
        setIsLoading(true);
        setError(null);

        // Load trades from database
        const dbService = new DatabaseService();
        await dbService.init();
        
        // Get unified analytics
        const analyticsEngine = new UnifiedAnalyticsEngine({
          userLevel: 'advanced',
          enabledModules: ['position-summary', 'basic-risk', 'trade-performance'],
          layout: 'detailed',
          refreshInterval: 30000
        });

        const unifiedResults = await analyticsEngine.getConsolidatedAnalytics();
        
        // Extract normalized trades from the analytics service for analysis
        const analyticsDataService = new (await import('../../services/AnalyticsDataService')).AnalyticsDataService();
        const normalizedTrades = await analyticsDataService.getAllTrades();
        setTrades(normalizedTrades);

        // Calculate plan vs reality metrics
        const planVsReality = calculatePlanVsRealityMetrics(config, normalizedTrades);
        setPlanVsRealityData(planVsReality);

      } catch (err) {
        console.error('Error loading analytics data:', err);
        setError('Failed to load analytics data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalyticsData();
  }, [config, configLoading, timeRange]);

  const calculatePlanVsRealityMetrics = (
    goalConfig: GoalSizingConfig,
    tradeData: NormalizedTradeData[]
  ): PlanVsRealityData => {
    const closedTrades = tradeData.filter(trade => trade.netAmount !== 0);
    const totalTrades = closedTrades.length;
    
    // Calculate actual performance metrics
    const totalPnL = closedTrades.reduce((sum, trade) => sum + (trade.netAmount || 0), 0);
    const winningTrades = closedTrades.filter(trade => (trade.netAmount || 0) > 0);
    const actualWinRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
    
    // Estimate actual return (simplified - would need account balance history for accuracy)
    const accountBalance = goalConfig.capitalObjectiveParameters?.currentBalance || 10000;
    const actualReturn = (totalPnL / accountBalance) * 100;
    
    // Calculate drawdown (simplified)
    let peak = 0;
    let maxDrawdown = 0;
    let cumulative = 0;
    
    closedTrades.forEach(trade => {
      cumulative += trade.netAmount || 0;
      if (cumulative > peak) {
        peak = cumulative;
      }
      const drawdown = ((peak - cumulative) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    // Calculate position sizing compliance
    const avgPositionSize = closedTrades.length > 0 
      ? closedTrades.reduce((sum, trade) => sum + Math.abs(trade.netAmount || 0), 0) / closedTrades.length 
      : 0;
    const maxPositionSize = Math.max(...closedTrades.map(trade => Math.abs(trade.netAmount || 0)));
    
    // Calculate adherence score (0-100)
    const targetMaxPosition = (goalConfig.sizingRules.maxPositionSize / 100) * accountBalance;
    const sizeCompliance = maxPositionSize <= targetMaxPosition ? 100 : 
      Math.max(0, 100 - ((maxPositionSize - targetMaxPosition) / targetMaxPosition) * 100);
    
    const winRateTarget = goalConfig.tradeStatistics?.winRate || 50;
    const winRateCompliance = Math.max(0, 100 - Math.abs(actualWinRate - winRateTarget) * 2);
    
    const adherenceScore = (sizeCompliance + winRateCompliance) / 2;

    // Goal achievement score
    const targetReturn = goalConfig.goalParameters?.targetReturn || 10;
    const returnScore = actualReturn >= targetReturn ? 100 : (actualReturn / targetReturn) * 100;
    
    const targetDrawdown = goalConfig.goalParameters?.drawdownTolerance || 5;
    const drawdownScore = maxDrawdown <= targetDrawdown ? 100 : 
      Math.max(0, 100 - ((maxDrawdown - targetDrawdown) / targetDrawdown) * 100);
    
    const goalAchievementScore = (returnScore + drawdownScore + winRateCompliance) / 3;

    // Generate time series data (simplified - daily cumulative)
    const timeSeriesData = generateTimeSeriesData(closedTrades, targetReturn, accountBalance);
    
    // Generate size compliance data
    const sizeComplianceData = generateSizeComplianceData(closedTrades, goalConfig);

    return {
      goalMetrics: {
        targetReturn,
        actualReturn,
        targetTimeFrame: goalConfig.goalParameters?.timeFrame || 12,
        actualTimeFrame: calculateActualTimeFrame(closedTrades),
        targetWinRate: winRateTarget,
        actualWinRate,
        targetDrawdown,
        actualDrawdown: maxDrawdown,
        goalAchievementScore,
        performanceGap: actualReturn - targetReturn
      },
      tradeStatistics: {
        totalTrades,
        winningTrades: winningTrades.length,
        losingTrades: totalTrades - winningTrades.length,
        avgPosition: avgPositionSize,
        maxPosition: maxPositionSize,
        adherenceScore
      },
      timeSeriesData,
      sizeComplianceData
    };
  };

  const generateTimeSeriesData = (trades: NormalizedTradeData[], targetReturn: number, accountBalance: number) => {
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.tradeDate).getTime() - new Date(b.tradeDate).getTime()
    );

    let cumulative = 0;
    const data: Array<{date: string; plannedCumulative: number; actualCumulative: number; gap: number}> = [];
    
    sortedTrades.forEach((trade, index) => {
      cumulative += trade.netAmount || 0;
      const daysElapsed = index + 1;
      const plannedDaily = (targetReturn / 100 * accountBalance) / 365;
      const plannedCumulative = plannedDaily * daysElapsed;
      
      data.push({
        date: new Date(trade.tradeDate).toLocaleDateString(),
        plannedCumulative,
        actualCumulative: cumulative,
        gap: cumulative - plannedCumulative
      });
    });

    return data.slice(-30); // Last 30 data points
  };

  const generateSizeComplianceData = (trades: NormalizedTradeData[], config: GoalSizingConfig) => {
    const accountBalance = config.capitalObjectiveParameters?.currentBalance || 10000;
    const targetSize = (config.sizingRules.baseSizePercentage / 100) * accountBalance;
    
    // Group trades by week
    const weeklyData = new Map<string, number[]>();
    
    trades.forEach(trade => {
      const date = new Date(trade.tradeDate);
      const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, []);
      }
      weeklyData.get(weekKey)!.push(Math.abs(trade.netAmount || 0));
    });

    return Array.from(weeklyData.entries()).map(([week, sizes]) => {
      const avgSize = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
      const compliance = Math.min(100, (targetSize / avgSize) * 100);
      
      return {
        period: new Date(week).toLocaleDateString(),
        plannedSize: targetSize,
        actualSize: avgSize,
        compliance
      };
    }).slice(-8); // Last 8 weeks
  };

  const calculateActualTimeFrame = (trades: NormalizedTradeData[]): number => {
    if (trades.length === 0) return 0;
    
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.tradeDate).getTime() - new Date(b.tradeDate).getTime()
    );
    
    const firstTrade = new Date(sortedTrades[0].tradeDate);
    const lastTrade = new Date(sortedTrades[sortedTrades.length - 1].tradeDate);
    const monthsDiff = (lastTrade.getTime() - firstTrade.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    return Math.max(1, Math.round(monthsDiff));
  };

  const renderGoalOverview = () => {
    if (!planVsRealityData) return null;

    const { goalMetrics } = planVsRealityData;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-sm text-gray-500">Goal Achievement</div>
          <div className={`text-2xl font-bold ${
            goalMetrics.goalAchievementScore >= 80 ? 'text-green-600' :
            goalMetrics.goalAchievementScore >= 60 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {goalMetrics.goalAchievementScore.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">Overall performance vs plan</div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-500">Return Performance</div>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${
              goalMetrics.performanceGap >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {goalMetrics.actualReturn.toFixed(2)}%
            </span>
            <span className="text-sm text-gray-400">
              (Target: {goalMetrics.targetReturn}%)
            </span>
          </div>
          <div className={`text-xs ${
            goalMetrics.performanceGap >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {goalMetrics.performanceGap >= 0 ? '+' : ''}{goalMetrics.performanceGap.toFixed(2)}% vs target
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-500">Win Rate</div>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${
              goalMetrics.actualWinRate >= goalMetrics.targetWinRate ? 'text-green-600' : 'text-red-600'
            }`}>
              {goalMetrics.actualWinRate.toFixed(1)}%
            </span>
            <span className="text-sm text-gray-400">
              (Target: {goalMetrics.targetWinRate}%)
            </span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-gray-500">Max Drawdown</div>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${
              goalMetrics.actualDrawdown <= goalMetrics.targetDrawdown ? 'text-green-600' : 'text-red-600'
            }`}>
              {goalMetrics.actualDrawdown.toFixed(2)}%
            </span>
            <span className="text-sm text-gray-400">
              (Limit: {goalMetrics.targetDrawdown}%)
            </span>
          </div>
        </Card>
      </div>
    );
  };

  const renderPerformanceChart = () => {
    if (!planVsRealityData?.timeSeriesData) return null;

    return (
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Plan vs Reality Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={planVsRealityData.timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value: number, name: string) => [
                `$${value.toFixed(2)}`,
                name === 'plannedCumulative' ? 'Planned' : 
                name === 'actualCumulative' ? 'Actual' : 'Gap'
              ]}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="plannedCumulative" 
              stroke="#8884d8" 
              strokeDasharray="5 5"
              name="Planned Performance"
            />
            <Line 
              type="monotone" 
              dataKey="actualCumulative" 
              stroke="#82ca9d" 
              name="Actual Performance"
            />
            <Line 
              type="monotone" 
              dataKey="gap" 
              stroke="#ff7300" 
              name="Performance Gap"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    );
  };

  const renderSizeComplianceChart = () => {
    if (!planVsRealityData?.sizeComplianceData) return null;

    return (
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Position Size Compliance</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={planVsRealityData.sizeComplianceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip 
              formatter={(value: number, name: string) => [
                name === 'compliance' ? `${value.toFixed(1)}%` : `$${value.toFixed(0)}`,
                name === 'plannedSize' ? 'Target Size' :
                name === 'actualSize' ? 'Actual Size' : 'Compliance'
              ]}
            />
            <Legend />
            <Bar dataKey="plannedSize" fill="#8884d8" name="Target Size" />
            <Bar dataKey="actualSize" fill="#82ca9d" name="Actual Size" />
            <Bar dataKey="compliance" fill="#ffc658" name="Compliance %" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    );
  };

  const renderTradeStatistics = () => {
    if (!planVsRealityData) return null;

    const { tradeStatistics } = planVsRealityData;

    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Trade Execution Analysis</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-500">Total Trades</div>
            <div className="text-xl font-bold">{tradeStatistics.totalTrades}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Winning Trades</div>
            <div className="text-xl font-bold text-green-600">{tradeStatistics.winningTrades}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Losing Trades</div>
            <div className="text-xl font-bold text-red-600">{tradeStatistics.losingTrades}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Avg Position</div>
            <div className="text-xl font-bold">${tradeStatistics.avgPosition.toFixed(0)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Max Position</div>
            <div className="text-xl font-bold">${tradeStatistics.maxPosition.toFixed(0)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Rule Adherence</div>
            <div className={`text-xl font-bold ${
              tradeStatistics.adherenceScore >= 80 ? 'text-green-600' :
              tradeStatistics.adherenceScore >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {tradeStatistics.adherenceScore.toFixed(1)}%
            </div>
          </div>
        </div>
      </Card>
    );
  };

  if (configLoading || isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded mb-6"></div>
        <div className="h-48 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <div className="font-medium">Error Loading Analytics</div>
        <div className="text-sm">{error}</div>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="mt-2"
        >
          Retry
        </Button>
      </Alert>
    );
  }

  if (!config) {
    return (
      <Alert className={className}>
        <div className="font-medium">No Goal Configuration Found</div>
        <div className="text-sm">
          Please create a goal using the Goal Sizing Wizard to view analytics.
        </div>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Goal Performance Analytics</h2>
        <div className="text-sm text-gray-500">
          Goal Type: {config.goalType} • Target: {config.goalParameters?.targetReturn}%
        </div>
      </div>

      {renderGoalOverview()}
      
      {showDetailedView && (
        <>
          {renderPerformanceChart()}
          {renderSizeComplianceChart()}
          {renderTradeStatistics()}
        </>
      )}
    </div>
  );
}; 