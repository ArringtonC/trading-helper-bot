import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Table,
  Tabs,
  Button,
  Space,
  Statistic,
  Progress,
  Tag,
  Tooltip,
  Switch,
  Slider,
  InputNumber,
  Modal,
  Form,
  Input,
  Alert,
  Divider,
  Badge,
  Typography,
  Dropdown,
  Menu,
  notification
} from 'antd';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Brush,
  Scatter,
  Cell,
  PieChart,
  Pie,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap
} from 'recharts';
import {
  TrendingUpOutlined,
  TrendingDownOutlined,
  ExperimentOutlined,
  DashboardOutlined,
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  FundOutlined,
  RiseOutlined,
  FallOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  ExportOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  SettingOutlined,
  SwapOutlined,
  FilterOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  StarOutlined,
  FireOutlined,
  RocketOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
// import { Button } from 'react-csv'; // Removed dependency
import { useTrades } from '../../trading/hooks/TradesContext';
import { Trade } from '../../../shared/types/trade';
import { tradeFeatures } from '../../../features/core/tradeFeatures';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Title, Text, Paragraph } = Typography;

interface BacktestResult {
  date: string;
  equity: number;
  drawdown: number;
  trades: number;
  winRate: number;
  pnl: number;
  cumPnl: number;
  sharpeRatio: number;
  marketRegime: 'bull' | 'bear' | 'neutral';
  volatility: 'low' | 'medium' | 'high';
}

interface StrategyMetrics {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  maxDrawdownDuration: number;
  calmarRatio: number;
  avgWin: number;
  avgLoss: number;
  winLossRatio: number;
  expectancy: number;
  kelly: number;
  var95: number;
  cvar95: number;
  annualizedReturn: number;
  annualizedVolatility: number;
  beta: number;
  alpha: number;
  correlation: number;
}

interface StrategyConfig {
  name: string;
  type: 'momentum' | 'meanReversion' | 'trend' | 'volatility' | 'pairs' | 'options';
  parameters: Record<string, number>;
  filters: {
    minVolume?: number;
    maxVolatility?: number;
    marketCap?: string;
    sector?: string[];
  };
  riskManagement: {
    positionSize: number;
    stopLoss: number;
    takeProfit: number;
    maxPositions: number;
    maxDrawdown: number;
  };
}

interface OptimizationResult {
  parameters: Record<string, number>;
  metrics: StrategyMetrics;
  score: number;
}

const StrategyBacktestDashboard: React.FC = () => {
  const { trades } = useTrades();
  const [selectedStrategy, setSelectedStrategy] = useState<string>('momentum');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(1, 'year'),
    dayjs()
  ]);
  const [timePeriod, setTimePeriod] = useState<string>('1Y');
  const [marketFilter, setMarketFilter] = useState<string>('all');
  const [volatilityFilter, setVolatilityFilter] = useState<string>('all');
  const [comparisonStrategies, setComparisonStrategies] = useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isPaperTrading, setIsPaperTrading] = useState(false);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[]>([]);
  const [selectedOptimization, setSelectedOptimization] = useState<OptimizationResult | null>(null);

  // Strategy configurations
  const strategies: Record<string, StrategyConfig> = {
    momentum: {
      name: 'Momentum Strategy',
      type: 'momentum',
      parameters: {
        lookback: 20,
        threshold: 0.02,
        holdingPeriod: 5
      },
      filters: {
        minVolume: 1000000,
        maxVolatility: 0.3
      },
      riskManagement: {
        positionSize: 0.1,
        stopLoss: 0.02,
        takeProfit: 0.05,
        maxPositions: 10,
        maxDrawdown: 0.15
      }
    },
    meanReversion: {
      name: 'Mean Reversion Strategy',
      type: 'meanReversion',
      parameters: {
        bbPeriod: 20,
        bbStdDev: 2,
        rsiPeriod: 14,
        oversoldLevel: 30,
        overboughtLevel: 70
      },
      filters: {
        minVolume: 500000,
        maxVolatility: 0.25
      },
      riskManagement: {
        positionSize: 0.08,
        stopLoss: 0.015,
        takeProfit: 0.03,
        maxPositions: 15,
        maxDrawdown: 0.12
      }
    },
    trend: {
      name: 'Trend Following Strategy',
      type: 'trend',
      parameters: {
        fastMA: 10,
        slowMA: 30,
        atrPeriod: 14,
        atrMultiplier: 2
      },
      filters: {
        minVolume: 2000000,
        marketCap: 'large'
      },
      riskManagement: {
        positionSize: 0.15,
        stopLoss: 0.03,
        takeProfit: 0.1,
        maxPositions: 8,
        maxDrawdown: 0.2
      }
    }
  };

  // Generate backtest data
  const backtestData = useMemo(() => {
    const data: BacktestResult[] = [];
    let equity = 100000;
    let cumPnl = 0;
    const days = dateRange[1].diff(dateRange[0], 'days');
    
    for (let i = 0; i <= days; i++) {
      const date = dateRange[0].add(i, 'day');
      const dayOfYear = date.dayOfYear();
      
      // Simulate market conditions
      const marketRegime = dayOfYear % 100 < 60 ? 'bull' : dayOfYear % 100 < 80 ? 'bear' : 'neutral';
      const volatility = dayOfYear % 50 < 15 ? 'low' : dayOfYear % 50 < 35 ? 'medium' : 'high';
      
      // Simulate strategy performance based on market conditions
      let dayReturn = 0;
      const strategy = strategies[selectedStrategy];
      
      if (marketRegime === 'bull' && strategy.type === 'trend') {
        dayReturn = (Math.random() - 0.3) * 0.02;
      } else if (marketRegime === 'bear' && strategy.type === 'meanReversion') {
        dayReturn = (Math.random() - 0.4) * 0.015;
      } else if (volatility === 'high' && strategy.type === 'volatility') {
        dayReturn = (Math.random() - 0.35) * 0.025;
      } else {
        dayReturn = (Math.random() - 0.5) * 0.01;
      }
      
      // Apply filters
      if (marketFilter !== 'all' && marketRegime !== marketFilter) {
        dayReturn *= 0.5;
      }
      if (volatilityFilter !== 'all' && volatility !== volatilityFilter) {
        dayReturn *= 0.7;
      }
      
      const pnl = equity * dayReturn;
      cumPnl += pnl;
      equity += pnl;
      
      const drawdown = equity < 100000 ? (100000 - equity) / 100000 : 0;
      const trades = Math.floor(Math.random() * 10) + 1;
      const winRate = 0.45 + Math.random() * 0.2;
      
      data.push({
        date: date.format('YYYY-MM-DD'),
        equity,
        drawdown,
        trades,
        winRate,
        pnl,
        cumPnl,
        sharpeRatio: cumPnl / (equity * 0.15) * Math.sqrt(252),
        marketRegime,
        volatility
      });
    }
    
    return data;
  }, [selectedStrategy, dateRange, marketFilter, volatilityFilter]);

  // Calculate strategy metrics
  const strategyMetrics = useMemo((): StrategyMetrics => {
    if (backtestData.length === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        profitFactor: 0,
        sharpeRatio: 0,
        sortinoRatio: 0,
        maxDrawdown: 0,
        maxDrawdownDuration: 0,
        calmarRatio: 0,
        avgWin: 0,
        avgLoss: 0,
        winLossRatio: 0,
        expectancy: 0,
        kelly: 0,
        var95: 0,
        cvar95: 0,
        annualizedReturn: 0,
        annualizedVolatility: 0,
        beta: 0,
        alpha: 0,
        correlation: 0
      };
    }

    const returns = backtestData.map(d => d.pnl / 100000);
    const positiveReturns = returns.filter(r => r > 0);
    const negativeReturns = returns.filter(r => r < 0);
    
    const totalTrades = backtestData.reduce((sum, d) => sum + d.trades, 0);
    const winRate = backtestData.reduce((sum, d) => sum + d.winRate, 0) / backtestData.length;
    const avgWin = positiveReturns.length > 0 ? positiveReturns.reduce((a, b) => a + b, 0) / positiveReturns.length : 0;
    const avgLoss = negativeReturns.length > 0 ? Math.abs(negativeReturns.reduce((a, b) => a + b, 0) / negativeReturns.length) : 0;
    const profitFactor = avgLoss > 0 ? (avgWin * winRate) / (avgLoss * (1 - winRate)) : 0;
    
    const maxDrawdown = Math.max(...backtestData.map(d => d.drawdown));
    const annualizedReturn = (backtestData[backtestData.length - 1].equity / 100000 - 1) * (252 / backtestData.length);
    const dailyVolatility = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - annualizedReturn / 252, 2), 0) / returns.length);
    const annualizedVolatility = dailyVolatility * Math.sqrt(252);
    
    const sharpeRatio = annualizedVolatility > 0 ? annualizedReturn / annualizedVolatility : 0;
    const downsideReturns = returns.filter(r => r < 0);
    const downsideVolatility = Math.sqrt(downsideReturns.reduce((sum, r) => sum + r * r, 0) / downsideReturns.length) * Math.sqrt(252);
    const sortinoRatio = downsideVolatility > 0 ? annualizedReturn / downsideVolatility : 0;
    
    const calmarRatio = maxDrawdown > 0 ? annualizedReturn / maxDrawdown : 0;
    const winLossRatio = avgLoss > 0 ? avgWin / avgLoss : 0;
    const expectancy = avgWin * winRate - avgLoss * (1 - winRate);
    const kelly = winRate - (1 - winRate) / winLossRatio;
    
    // Calculate VaR and CVaR
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const var95Index = Math.floor(sortedReturns.length * 0.05);
    const var95 = sortedReturns[var95Index] || 0;
    const cvar95 = sortedReturns.slice(0, var95Index).reduce((a, b) => a + b, 0) / var95Index || 0;
    
    return {
      totalTrades,
      winRate,
      profitFactor,
      sharpeRatio,
      sortinoRatio,
      maxDrawdown,
      maxDrawdownDuration: 30, // Placeholder
      calmarRatio,
      avgWin,
      avgLoss,
      winLossRatio,
      expectancy,
      kelly,
      var95,
      cvar95,
      annualizedReturn,
      annualizedVolatility,
      beta: 0.85, // Placeholder
      alpha: 0.02, // Placeholder
      correlation: 0.75 // Placeholder
    };
  }, [backtestData]);

  // Monthly returns for heatmap
  const monthlyReturns = useMemo(() => {
    const monthlyData: Record<string, Record<string, number>> = {};
    
    backtestData.forEach(day => {
      const date = dayjs(day.date);
      const year = date.year();
      const month = date.format('MMM');
      
      if (!monthlyData[year]) {
        monthlyData[year] = {};
      }
      
      monthlyData[year][month] = (monthlyData[year][month] || 0) + day.pnl;
    });
    
    return Object.entries(monthlyData).map(([year, months]) => ({
      year,
      ...months
    }));
  }, [backtestData]);

  // Risk metrics for radar chart
  const riskMetrics = [
    { metric: 'Sharpe Ratio', value: Math.min(strategyMetrics.sharpeRatio * 33, 100), fullMark: 100 },
    { metric: 'Win Rate', value: strategyMetrics.winRate * 100, fullMark: 100 },
    { metric: 'Profit Factor', value: Math.min(strategyMetrics.profitFactor * 25, 100), fullMark: 100 },
    { metric: 'Risk Control', value: (1 - strategyMetrics.maxDrawdown) * 100, fullMark: 100 },
    { metric: 'Consistency', value: Math.min(strategyMetrics.calmarRatio * 20, 100), fullMark: 100 },
    { metric: 'Expectancy', value: Math.min(strategyMetrics.expectancy * 1000, 100), fullMark: 100 }
  ];

  // Handle time period change
  const handleTimePeriodChange = (period: string) => {
    setTimePeriod(period);
    const end = dayjs();
    let start = end;
    
    switch (period) {
      case '1M':
        start = end.subtract(1, 'month');
        break;
      case '3M':
        start = end.subtract(3, 'month');
        break;
      case '6M':
        start = end.subtract(6, 'month');
        break;
      case '1Y':
        start = end.subtract(1, 'year');
        break;
      case '2Y':
        start = end.subtract(2, 'year');
        break;
      case 'All':
        start = dayjs('2020-01-01');
        break;
    }
    
    setDateRange([start, end]);
  };

  // Run optimization
  const runOptimization = async () => {
    setIsOptimizing(true);
    
    // Simulate optimization process
    setTimeout(() => {
      const results: OptimizationResult[] = [];
      const strategy = strategies[selectedStrategy];
      
      // Generate parameter combinations
      for (let i = 0; i < 20; i++) {
        const parameters: Record<string, number> = {};
        
        Object.entries(strategy.parameters).forEach(([key, value]) => {
          // Vary parameters by ±50%
          parameters[key] = value * (0.5 + Math.random());
        });
        
        // Simulate metrics for this parameter set
        const metrics: StrategyMetrics = {
          ...strategyMetrics,
          sharpeRatio: Math.random() * 3,
          winRate: 0.4 + Math.random() * 0.3,
          profitFactor: 0.8 + Math.random() * 2,
          maxDrawdown: Math.random() * 0.3,
          annualizedReturn: -0.1 + Math.random() * 0.5
        };
        
        const score = metrics.sharpeRatio * 0.3 + 
                     metrics.winRate * 0.2 + 
                     metrics.profitFactor * 0.2 + 
                     (1 - metrics.maxDrawdown) * 0.2 +
                     metrics.annualizedReturn * 0.1;
        
        results.push({ parameters, metrics, score });
      }
      
      // Sort by score
      results.sort((a, b) => b.score - a.score);
      setOptimizationResults(results);
      setIsOptimizing(false);
      
      notification.success({
        message: 'Optimization Complete',
        description: `Found ${results.length} parameter combinations. Best Sharpe: ${results[0].metrics.sharpeRatio.toFixed(2)}`,
        icon: <CheckCircleOutlined />
      });
    }, 3000);
  };

  // Export performance report
  const exportReport = () => {
    const report = {
      strategy: strategies[selectedStrategy].name,
      dateRange: `${dateRange[0].format('YYYY-MM-DD')} to ${dateRange[1].format('YYYY-MM-DD')}`,
      metrics: strategyMetrics,
      backtestData: backtestData,
      monthlyReturns: monthlyReturns,
      optimizationResults: optimizationResults.slice(0, 5)
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backtest_report_${selectedStrategy}_${dayjs().format('YYYY-MM-DD')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    notification.success({
      message: 'Report Exported',
      description: 'Backtest report has been downloaded successfully.',
      icon: <DownloadOutlined />
    });
  };

  // Calculate Challenge XP
  const calculateXP = () => {
    let xp = 0;
    
    // XP for running backtest
    xp += 50;
    
    // XP for good performance
    if (strategyMetrics.sharpeRatio > 1) xp += 100;
    if (strategyMetrics.winRate > 0.6) xp += 75;
    if (strategyMetrics.maxDrawdown < 0.1) xp += 80;
    
    // XP for using advanced features
    if (comparisonStrategies.length > 0) xp += 30;
    if (optimizationResults.length > 0) xp += 150;
    if (showAdvancedMetrics) xp += 20;
    
    return xp;
  };

  return (
    <div className="strategy-backtest-dashboard">
      {/* Header */}
      <Card className="mb-6">
        <Row gutter={[16, 16]} align="middle">
          <Col flex="auto">
            <Space direction="vertical" size={0}>
              <Title level={3} className="mb-0">
                <ExperimentOutlined className="mr-2" />
                Strategy Backtesting Dashboard
              </Title>
              <Text type="secondary">
                Test and optimize your trading strategies with institutional-grade analytics
              </Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Badge count={`${calculateXP()} XP`} style={{ backgroundColor: '#52c41a' }}>
                <Button icon={<FireOutlined />} type="text">
                  Challenge Progress
                </Button>
              </Badge>
              <Button
                icon={<ExportOutlined />}
                onClick={exportReport}
              >
                Export Report
              </Button>
              <Switch
                checked={isPaperTrading}
                onChange={setIsPaperTrading}
                checkedChildren="Paper Trading"
                unCheckedChildren="Backtest"
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Strategy Selection and Controls */}
      <Card className="mb-4">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Select
              value={selectedStrategy}
              onChange={setSelectedStrategy}
              style={{ width: '100%' }}
              placeholder="Select Strategy"
            >
              {Object.entries(strategies).map(([key, strategy]) => (
                <Option key={key} value={key}>
                  <Space>
                    {strategy.type === 'momentum' && <RocketOutlined />}
                    {strategy.type === 'meanReversion' && <SyncOutlined />}
                    {strategy.type === 'trend' && <LineChartOutlined />}
                    {strategy.name}
                  </Space>
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              value={timePeriod}
              onChange={handleTimePeriodChange}
              style={{ width: '100%' }}
              placeholder="Time Period"
            >
              <Option value="1M">1 Month</Option>
              <Option value="3M">3 Months</Option>
              <Option value="6M">6 Months</Option>
              <Option value="1Y">1 Year</Option>
              <Option value="2Y">2 Years</Option>
              <Option value="All">All Time</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              value={marketFilter}
              onChange={setMarketFilter}
              style={{ width: '100%' }}
              placeholder="Market Regime"
            >
              <Option value="all">All Markets</Option>
              <Option value="bull">Bull Markets Only</Option>
              <Option value="bear">Bear Markets Only</Option>
              <Option value="neutral">Neutral Markets Only</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              value={volatilityFilter}
              onChange={setVolatilityFilter}
              style={{ width: '100%' }}
              placeholder="Volatility"
            >
              <Option value="all">All Volatility</Option>
              <Option value="low">Low Volatility</Option>
              <Option value="medium">Medium Volatility</Option>
              <Option value="high">High Volatility</Option>
            </Select>
          </Col>
        </Row>
        <Row gutter={[16, 16]} className="mt-4">
          <Col xs={24} md={12}>
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={12}>
            <Space>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                loading={isOptimizing}
                onClick={runOptimization}
              >
                Optimize Parameters
              </Button>
              <Button
                icon={<SwapOutlined />}
                onClick={() => {
                  Modal.info({
                    title: 'Strategy Comparison',
                    content: 'Select strategies to compare side-by-side',
                    onOk() {}
                  });
                }}
              >
                Compare Strategies
              </Button>
              <Switch
                checked={showAdvancedMetrics}
                onChange={setShowAdvancedMetrics}
                checkedChildren="Advanced"
                unCheckedChildren="Basic"
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Key Metrics Summary */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Total Return"
              value={strategyMetrics.annualizedReturn * 100}
              precision={2}
              suffix="%"
              valueStyle={{ color: strategyMetrics.annualizedReturn > 0 ? '#3f8600' : '#cf1322' }}
              prefix={strategyMetrics.annualizedReturn > 0 ? <RiseOutlined /> : <FallOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Sharpe Ratio"
              value={strategyMetrics.sharpeRatio}
              precision={2}
              valueStyle={{ color: strategyMetrics.sharpeRatio > 1 ? '#3f8600' : '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Win Rate"
              value={strategyMetrics.winRate * 100}
              precision={1}
              suffix="%"
              valueStyle={{ color: strategyMetrics.winRate > 0.5 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Max Drawdown"
              value={strategyMetrics.maxDrawdown * 100}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#cf1322' }}
              prefix={<FallOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Profit Factor"
              value={strategyMetrics.profitFactor}
              precision={2}
              valueStyle={{ color: strategyMetrics.profitFactor > 1.5 ? '#3f8600' : '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Total Trades"
              value={strategyMetrics.totalTrades}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Charts Tabs */}
      <Card className="mb-4">
        <Tabs defaultActiveKey="equity">
          <TabPane tab="Equity Curve" key="equity">
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={backtestData}>
                <defs>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#1890ff" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip
                  formatter={(value: any) => [`$${value.toLocaleString()}`, 'Equity']}
                />
                <ReferenceLine y={100000} stroke="#666" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke="#1890ff"
                  fillOpacity={1}
                  fill="url(#colorEquity)"
                />
                <Brush dataKey="date" height={30} stroke="#1890ff" />
              </AreaChart>
            </ResponsiveContainer>
          </TabPane>
          
          <TabPane tab="Drawdown" key="drawdown">
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={backtestData}>
                <defs>
                  <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff4d4f" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ff4d4f" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                <RechartsTooltip
                  formatter={(value: any) => [`${(value * 100).toFixed(2)}%`, 'Drawdown']}
                />
                <Area
                  type="monotone"
                  dataKey="drawdown"
                  stroke="#ff4d4f"
                  fillOpacity={1}
                  fill="url(#colorDrawdown)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabPane>
          
          <TabPane tab="Monthly Returns" key="monthly">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={monthlyReturns}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                <RechartsTooltip />
                <Legend />
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, idx) => (
                  <Bar 
                    key={month} 
                    dataKey={month} 
                    fill={`hsl(${idx * 30}, 70%, 50%)`}
                    stackId="monthly"
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </TabPane>
          
          <TabPane tab="Risk Metrics" key="risk">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={riskMetrics}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Strategy Performance"
                      dataKey="value"
                      stroke="#1890ff"
                      fill="#1890ff"
                      fillOpacity={0.6}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </Col>
              <Col xs={24} md={12}>
                <Card title="Risk Analysis" bordered={false}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>VaR (95%): </Text>
                      <Text type="danger">{(strategyMetrics.var95 * 100).toFixed(2)}%</Text>
                    </div>
                    <div>
                      <Text strong>CVaR (95%): </Text>
                      <Text type="danger">{(strategyMetrics.cvar95 * 100).toFixed(2)}%</Text>
                    </div>
                    <div>
                      <Text strong>Volatility: </Text>
                      <Text>{(strategyMetrics.annualizedVolatility * 100).toFixed(2)}%</Text>
                    </div>
                    <div>
                      <Text strong>Beta: </Text>
                      <Text>{strategyMetrics.beta.toFixed(2)}</Text>
                    </div>
                    <div>
                      <Text strong>Correlation: </Text>
                      <Text>{strategyMetrics.correlation.toFixed(2)}</Text>
                    </div>
                    <Divider />
                    <Alert
                      type={strategyMetrics.calmarRatio > 1 ? "success" : "warning"}
                      message={`Calmar Ratio: ${strategyMetrics.calmarRatio.toFixed(2)}`}
                      description="Risk-adjusted return relative to maximum drawdown"
                    />
                  </Space>
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>

      {/* Advanced Metrics */}
      {showAdvancedMetrics && (
        <Card title="Advanced Performance Metrics" className="mb-4">
          <Row gutter={[16, 16]}>
            <Col xs={12} md={6}>
              <Statistic
                title="Sortino Ratio"
                value={strategyMetrics.sortinoRatio}
                precision={2}
                valueStyle={{ color: strategyMetrics.sortinoRatio > 1.5 ? '#3f8600' : '#faad14' }}
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title="Win/Loss Ratio"
                value={strategyMetrics.winLossRatio}
                precision={2}
                valueStyle={{ color: strategyMetrics.winLossRatio > 2 ? '#3f8600' : '#faad14' }}
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title="Expectancy"
                value={strategyMetrics.expectancy * 100}
                precision={2}
                suffix="%"
                prefix="$"
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title="Kelly Criterion"
                value={strategyMetrics.kelly * 100}
                precision={1}
                suffix="%"
                tooltip="Optimal position size"
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* Optimization Results */}
      {optimizationResults.length > 0 && (
        <Card title="Parameter Optimization Results" className="mb-4">
          <Table
            dataSource={optimizationResults.slice(0, 10)}
            columns={[
              {
                title: 'Rank',
                dataIndex: 'rank',
                key: 'rank',
                render: (_, __, index) => (
                  <Badge count={index + 1} style={{ backgroundColor: index === 0 ? '#52c41a' : '#1890ff' }} />
                )
              },
              {
                title: 'Parameters',
                dataIndex: 'parameters',
                key: 'parameters',
                render: (params) => (
                  <Space size="small" wrap>
                    {Object.entries(params).map(([key, value]) => (
                      <Tag key={key}>{key}: {(value as number).toFixed(2)}</Tag>
                    ))}
                  </Space>
                )
              },
              {
                title: 'Sharpe Ratio',
                dataIndex: ['metrics', 'sharpeRatio'],
                key: 'sharpe',
                render: (value) => <Text strong>{value.toFixed(2)}</Text>,
                sorter: (a, b) => a.metrics.sharpeRatio - b.metrics.sharpeRatio
              },
              {
                title: 'Return',
                dataIndex: ['metrics', 'annualizedReturn'],
                key: 'return',
                render: (value) => (
                  <Text type={value > 0 ? 'success' : 'danger'}>
                    {(value * 100).toFixed(2)}%
                  </Text>
                )
              },
              {
                title: 'Max DD',
                dataIndex: ['metrics', 'maxDrawdown'],
                key: 'drawdown',
                render: (value) => <Text type="danger">{(value * 100).toFixed(1)}%</Text>
              },
              {
                title: 'Score',
                dataIndex: 'score',
                key: 'score',
                render: (score) => (
                  <Progress
                    percent={score * 100}
                    size="small"
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                )
              },
              {
                title: 'Action',
                key: 'action',
                render: (_, record) => (
                  <Button
                    size="small"
                    type="link"
                    onClick={() => setSelectedOptimization(record)}
                  >
                    Apply
                  </Button>
                )
              }
            ]}
            pagination={{ pageSize: 5 }}
            size="small"
          />
        </Card>
      )}

      {/* Paper Trading Panel */}
      {isPaperTrading && (
        <Card title="Paper Trading Simulation" className="mb-4">
          <Alert
            message="Paper Trading Mode Active"
            description="Your strategy is running in simulation mode. No real trades will be executed."
            type="info"
            showIcon
            icon={<ExperimentOutlined />}
            className="mb-4"
          />
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="Simulated Balance"
                  value={backtestData[backtestData.length - 1]?.equity || 100000}
                  prefix="$"
                  precision={2}
                />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="Open Positions"
                  value={Math.floor(Math.random() * 5) + 1}
                  suffix="/ 10"
                />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="Today's P&L"
                  value={backtestData[backtestData.length - 1]?.pnl || 0}
                  prefix="$"
                  precision={2}
                  valueStyle={{ 
                    color: (backtestData[backtestData.length - 1]?.pnl || 0) > 0 ? '#3f8600' : '#cf1322' 
                  }}
                />
              </Card>
            </Col>
          </Row>
        </Card>
      )}

      {/* Export Options */}
      <Card title="Export & Integration" className="mb-4">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button icon={<DownloadOutlined />} block onClick={exportReport}>
                Download Full Report (JSON)
              </Button>
              <Button
                data={backtestData}
                filename={`backtest_data_${selectedStrategy}_${dayjs().format('YYYY-MM-DD')}.csv`}
              >
                <Button icon={<ExportOutlined />} block>
                  Export Data (CSV)
                </Button>
              </Button>
              <Button icon={<ShareAltOutlined />} block>
                Share Strategy Results
              </Button>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Alert
              message="Challenge Integration"
              description={`You've earned ${calculateXP()} XP from this backtesting session!`}
              type="success"
              showIcon
              action={
                <Button size="small" type="primary">
                  View Challenges
                </Button>
              }
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default StrategyBacktestDashboard;