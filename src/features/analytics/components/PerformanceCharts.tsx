import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Statistic,
  Row,
  Col,
  Select,
  DatePicker,
  Spin,
  Alert
} from 'antd';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUpOutlined,
  TrendingDownOutlined,
  DollarOutlined,
  PercentageOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { PerformanceMetrics, WinRateAnalysis } from '../../../services/AnalyticsDataService';
import { NormalizedTradeData } from '../../../types/trade';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

interface PerformanceChartsProps {
  trades: NormalizedTradeData[];
  performanceMetrics: PerformanceMetrics;
  winRateAnalysis: WinRateAnalysis;
  loading?: boolean;
  className?: string;
}

interface CumulativePnLData {
  date: string;
  cumulativePnL: number;
  dailyPnL: number;
  tradeCount: number;
}

interface DrawdownData {
  date: string;
  drawdown: number;
  highWaterMark: number;
}

const PerformanceCharts: React.FC<PerformanceChartsProps> = ({
  trades,
  performanceMetrics,
  winRateAnalysis,
  loading = false,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('cumulative');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [cumulativePnLData, setCumulativePnLData] = useState<CumulativePnLData[]>([]);
  const [drawdownData, setDrawdownData] = useState<DrawdownData[]>([]);

  useEffect(() => {
    if (trades.length > 0) {
      generateCumulativePnLData();
      generateDrawdownData();
    }
  }, [trades, timeRange]);

  const generateCumulativePnLData = () => {
    const filteredTrades = filterTradesByTimeRange(trades, timeRange);
    const sortedTrades = filteredTrades
      .filter(trade => trade.netAmount !== null && trade.netAmount !== undefined)
      .sort((a, b) => new Date(a.tradeDate).getTime() - new Date(b.tradeDate).getTime());

    const dailyData: { [date: string]: { pnl: number; count: number } } = {};
    
    sortedTrades.forEach(trade => {
      const date = new Date(trade.tradeDate).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { pnl: 0, count: 0 };
      }
      dailyData[date].pnl += trade.netAmount!;
      dailyData[date].count += 1;
    });

    let cumulativePnL = 0;
    const result: CumulativePnLData[] = Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => {
        cumulativePnL += data.pnl;
        return {
          date,
          cumulativePnL: Math.round(cumulativePnL * 100) / 100,
          dailyPnL: Math.round(data.pnl * 100) / 100,
          tradeCount: data.count
        };
      });

    setCumulativePnLData(result);
  };

  const generateDrawdownData = () => {
    let peak = 0;
    let runningTotal = 0;
    
    const result: DrawdownData[] = cumulativePnLData.map(data => {
      runningTotal = data.cumulativePnL;
      if (runningTotal > peak) {
        peak = runningTotal;
      }
      const drawdown = ((peak - runningTotal) / Math.max(peak, 1)) * 100;
      
      return {
        date: data.date,
        drawdown: Math.round(drawdown * 100) / 100,
        highWaterMark: Math.round(peak * 100) / 100
      };
    });
    
    setDrawdownData(result);
  };

  const filterTradesByTimeRange = (trades: NormalizedTradeData[], range: string): NormalizedTradeData[] => {
    if (range === 'all') return trades;
    
    const now = new Date();
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    return trades.filter(trade => new Date(trade.tradeDate) >= cutoffDate);
  };

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

  const getMetricColor = (value: number, isPercentage = false) => {
    if (value > 0) return '#52c41a';
    if (value < 0) return '#ff4d4f';
    return '#d9d9d9';
  };

  const renderMetricCard = (title: string, value: number, icon: any, formatter: (v: number) => string) => (
    <Card size="small" className="text-center">
      <Statistic
        title={title}
        value={value}
        formatter={(val) => formatter(val as number)}
        valueStyle={{ color: getMetricColor(value) }}
        prefix={icon}
      />
    </Card>
  );

  const winLossData = [
    { name: 'Wins', value: performanceMetrics.winningTrades, fill: '#52c41a' },
    { name: 'Losses', value: performanceMetrics.losingTrades, fill: '#ff4d4f' }
  ];

  if (loading) {
    return (
      <Card className={`performance-charts ${className}`}>
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (trades.length === 0) {
    return (
      <Card className={`performance-charts ${className}`}>
        <Alert
          message="No Trading Data"
          description="Start trading to see your performance analytics."
          type="info"
          showIcon
        />
      </Card>
    );
  }

  return (
    <Card className={`performance-charts ${className}`} title="📊 Performance Analytics">
      {/* Key Metrics Row */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={6}>
          {renderMetricCard('Total P&L', performanceMetrics.totalPnL, <DollarOutlined />, formatCurrency)}
        </Col>
        <Col xs={12} sm={6}>
          {renderMetricCard('Win Rate', performanceMetrics.winRate, <PercentageOutlined />, formatPercentage)}
        </Col>
        <Col xs={12} sm={6}>
          {renderMetricCard('Profit Factor', performanceMetrics.profitFactor, <TrendingUpOutlined />, (v) => v.toFixed(2))}
        </Col>
        <Col xs={12} sm={6}>
          {renderMetricCard('Sharpe Ratio', performanceMetrics.sharpeRatio, <BarChartOutlined />, (v) => v.toFixed(2))}
        </Col>
      </Row>

      {/* Time Range Selector */}
      <div className="mb-4 flex justify-between items-center">
        <Select
          value={timeRange}
          onChange={setTimeRange}
          style={{ width: 120 }}
        >
          <Select.Option value="7d">7 Days</Select.Option>
          <Select.Option value="30d">30 Days</Select.Option>
          <Select.Option value="90d">90 Days</Select.Option>
          <Select.Option value="all">All Time</Select.Option>
        </Select>
      </div>

      {/* Chart Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Cumulative P&L" key="cumulative">
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={cumulativePnLData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip 
                formatter={(value, name) => [formatCurrency(value as number), name]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="cumulativePnL"
                stroke="#1890ff"
                fill="#1890ff"
                fillOpacity={0.3}
                name="Cumulative P&L"
              />
            </AreaChart>
          </ResponsiveContainer>
        </TabPane>

        <TabPane tab="Daily P&L" key="daily">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={cumulativePnLData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip 
                formatter={(value, name) => [formatCurrency(value as number), name]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Bar
                dataKey="dailyPnL"
                fill={(entry) => entry.dailyPnL > 0 ? '#52c41a' : '#ff4d4f'}
                name="Daily P&L"
              />
            </BarChart>
          </ResponsiveContainer>
        </TabPane>

        <TabPane tab="Drawdown" key="drawdown">
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={drawdownData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={formatPercentage} />
              <Tooltip 
                formatter={(value, name) => [formatPercentage(value as number), name]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="drawdown"
                stroke="#ff4d4f"
                fill="#ff4d4f"
                fillOpacity={0.3}
                name="Drawdown %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </TabPane>

        <TabPane tab="Win/Loss Distribution" key="distribution">
          <Row gutter={16}>
            <Col span={12}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={winLossData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                  >
                    {winLossData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Col>
            <Col span={12}>
              <div className="space-y-4">
                <Statistic
                  title="Average Win"
                  value={performanceMetrics.avgWin}
                  formatter={formatCurrency}
                  valueStyle={{ color: '#52c41a' }}
                />
                <Statistic
                  title="Average Loss"
                  value={performanceMetrics.avgLoss}
                  formatter={formatCurrency}
                  valueStyle={{ color: '#ff4d4f' }}
                />
                <Statistic
                  title="Risk/Reward Ratio"
                  value={performanceMetrics.riskRewardRatio}
                  formatter={(val) => `${val}:1`}
                />
                <Statistic
                  title="Best Trade"
                  value={performanceMetrics.bestTrade}
                  formatter={formatCurrency}
                  valueStyle={{ color: '#52c41a' }}
                />
                <Statistic
                  title="Worst Trade"
                  value={performanceMetrics.worstTrade}
                  formatter={formatCurrency}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </div>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Win Rate Analysis" key="winrate">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={winRateAnalysis.monthlyWinRates}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatPercentage} domain={[0, 100]} />
              <Tooltip 
                formatter={(value, name) => [formatPercentage(value as number), name]}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Bar
                dataKey="winRate"
                fill="#1890ff"
                name="Win Rate %"
              />
            </BarChart>
          </ResponsiveContainer>
          
          <div className="mt-4">
            <Alert
              message={`Trend Analysis: ${winRateAnalysis.trendAnalysis}`}
              type={winRateAnalysis.trendAnalysis === 'IMPROVING' ? 'success' : 
                    winRateAnalysis.trendAnalysis === 'DECLINING' ? 'warning' : 'info'}
              showIcon
            />
          </div>
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default PerformanceCharts;
export type { PerformanceChartsProps };