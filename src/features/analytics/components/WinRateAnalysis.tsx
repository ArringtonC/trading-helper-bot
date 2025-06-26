import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Tabs,
  Table,
  Tag,
  Progress,
  Alert,
  Select,
  DatePicker
} from 'antd';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';
import {
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  PercentageOutlined
} from '@ant-design/icons';
import { WinRateAnalysis } from '../../../services/AnalyticsDataService';
import { NormalizedTradeData } from '../../../types/trade';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

interface WinRateAnalysisProps {
  winRateAnalysis: WinRateAnalysis;
  trades: NormalizedTradeData[];
  className?: string;
}

const WinRateAnalysisChart: React.FC<WinRateAnalysisProps> = ({
  winRateAnalysis,
  trades,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('all');

  // Prepare win/loss distribution data
  const winLossData = [
    { name: 'Winning Trades', value: winRateAnalysis.monthlyWinRates.reduce((sum, month) => sum + (month.trades * month.winRate / 100), 0), fill: '#52c41a' },
    { name: 'Losing Trades', value: winRateAnalysis.monthlyWinRates.reduce((sum, month) => sum + (month.trades * (100 - month.winRate) / 100), 0), fill: '#ff4d4f' }
  ];

  // Prepare symbol performance table data
  const symbolTableData = winRateAnalysis.symbolWinRates.map((symbol, index) => ({
    key: index,
    symbol: symbol.symbol,
    winRate: symbol.winRate,
    trades: symbol.trades,
    grade: getWinRateGrade(symbol.winRate),
    performance: symbol.winRate >= 60 ? 'excellent' : symbol.winRate >= 50 ? 'good' : symbol.winRate >= 40 ? 'average' : 'poor'
  }));

  // Prepare time of day analysis
  const timeOfDayChartData = winRateAnalysis.timeOfDayWinRates.map(hour => ({
    hour: `${hour.hour}:00`,
    winRate: hour.winRate,
    trades: hour.trades,
    volume: hour.trades // Using trades as volume proxy
  }));

  function getWinRateGrade(winRate: number): string {
    if (winRate >= 70) return 'A+';
    if (winRate >= 60) return 'A';
    if (winRate >= 50) return 'B';
    if (winRate >= 40) return 'C';
    return 'D';
  }

  function getGradeColor(grade: string): string {
    switch (grade) {
      case 'A+': return '#722ed1';
      case 'A': return '#52c41a';
      case 'B': return '#1890ff';
      case 'C': return '#fa8c16';
      case 'D': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  }

  function getTrendColor(trend: string): string {
    switch (trend) {
      case 'IMPROVING': return '#52c41a';
      case 'DECLINING': return '#ff4d4f';
      case 'STABLE': return '#1890ff';
      default: return '#d9d9d9';
    }
  }

  function getTrendIcon(trend: string) {
    switch (trend) {
      case 'IMPROVING': return <RiseOutlined />;
      case 'DECLINING': return <FallOutlined />;
      case 'STABLE': return <ClockCircleOutlined />;
      default: return <ClockCircleOutlined />;
    }
  }

  // Calculate additional metrics
  const totalTrades = winRateAnalysis.monthlyWinRates.reduce((sum, month) => sum + month.trades, 0);
  const averageMonthlyWinRate = winRateAnalysis.monthlyWinRates.length > 0 
    ? winRateAnalysis.monthlyWinRates.reduce((sum, month) => sum + month.winRate, 0) / winRateAnalysis.monthlyWinRates.length
    : 0;

  // Table columns for symbol analysis
  const symbolColumns = [
    {
      title: 'Symbol',
      dataIndex: 'symbol',
      key: 'symbol',
      render: (symbol: string) => <span className="font-mono font-bold">{symbol}</span>
    },
    {
      title: 'Win Rate',
      dataIndex: 'winRate',
      key: 'winRate',
      render: (winRate: number) => (
        <div className="flex items-center space-x-2">
          <Progress 
            percent={winRate} 
            size="small" 
            strokeColor={winRate >= 60 ? '#52c41a' : winRate >= 50 ? '#1890ff' : '#ff4d4f'}
            showInfo={false}
            style={{ width: 60 }}
          />
          <span className="font-medium">{winRate.toFixed(1)}%</span>
        </div>
      ),
      sorter: (a: any, b: any) => a.winRate - b.winRate
    },
    {
      title: 'Trades',
      dataIndex: 'trades',
      key: 'trades',
      sorter: (a: any, b: any) => a.trades - b.trades
    },
    {
      title: 'Grade',
      dataIndex: 'grade',
      key: 'grade',
      render: (grade: string) => (
        <Tag color={getGradeColor(grade)} className="font-bold">
          {grade}
        </Tag>
      )
    },
    {
      title: 'Performance',
      dataIndex: 'performance',
      key: 'performance',
      render: (performance: string) => {
        const config = {
          excellent: { color: 'success', text: 'Excellent' },
          good: { color: 'processing', text: 'Good' },
          average: { color: 'warning', text: 'Average' },
          poor: { color: 'error', text: 'Needs Work' }
        };
        const { color, text } = config[performance as keyof typeof config] || config.average;
        return <Tag color={color}>{text}</Tag>;
      }
    }
  ];

  return (
    <Card 
      className={`win-rate-analysis ${className}`} 
      title="🎯 Win Rate & Success Analysis"
    >
      {/* Key Metrics Overview */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={6}>
          <Card size="small" className="text-center">
            <Statistic
              title="Overall Win Rate"
              value={winRateAnalysis.overallWinRate}
              precision={1}
              suffix="%"
              prefix={<PercentageOutlined />}
              valueStyle={{ 
                color: winRateAnalysis.overallWinRate >= 60 ? '#52c41a' : 
                       winRateAnalysis.overallWinRate >= 50 ? '#1890ff' : '#ff4d4f' 
              }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" className="text-center">
            <Statistic
              title="Total Analyzed"
              value={totalTrades}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" className="text-center">
            <Statistic
              title="Monthly Average"
              value={averageMonthlyWinRate}
              precision={1}
              suffix="%"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" className="text-center">
            <div className="mb-2">
              <span className="text-gray-600 text-sm">Trend Analysis</span>
            </div>
            <Tag 
              color={getTrendColor(winRateAnalysis.trendAnalysis)}
              icon={getTrendIcon(winRateAnalysis.trendAnalysis)}
              className="text-lg px-3 py-1"
            >
              {winRateAnalysis.trendAnalysis}
            </Tag>
          </Card>
        </Col>
      </Row>

      {/* Trend Alert */}
      <div className="mb-6">
        <Alert
          message={`Win Rate Trend: ${winRateAnalysis.trendAnalysis}`}
          description={
            winRateAnalysis.trendAnalysis === 'IMPROVING' 
              ? 'Great work! Your trading consistency is improving over time.'
              : winRateAnalysis.trendAnalysis === 'DECLINING'
              ? 'Focus on quality setups and review your recent trades for improvement opportunities.'
              : 'Your win rate is stable. Consider strategies to push it higher with better setups.'
          }
          type={
            winRateAnalysis.trendAnalysis === 'IMPROVING' ? 'success' :
            winRateAnalysis.trendAnalysis === 'DECLINING' ? 'warning' : 'info'
          }
          showIcon
        />
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="📈 Monthly Trends" key="overview">
          <Row gutter={16}>
            <Col xs={24} lg={16}>
              <Card size="small" title="📊 Monthly Win Rate Evolution">
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={winRateAnalysis.monthlyWinRates}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" domain={[0, 100]} />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'winRate' ? `${value}%` : value,
                        name === 'winRate' ? 'Win Rate' : 'Trade Count'
                      ]}
                    />
                    <Legend />
                    <Bar 
                      yAxisId="right" 
                      dataKey="trades" 
                      fill="#e6f7ff" 
                      stroke="#1890ff"
                      strokeWidth={2}
                      name="Trade Count" 
                    />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="winRate" 
                      stroke="#52c41a" 
                      strokeWidth={3}
                      dot={{ fill: '#52c41a', strokeWidth: 2, r: 6 }}
                      name="Win Rate %" 
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            
            <Col xs={24} lg={8}>
              <Card size="small" title="🥧 Win/Loss Distribution">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={winLossData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    >
                      {winLossData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded mr-2" />
                      Winning Trades
                    </span>
                    <span className="font-medium">{Math.round(winLossData[0].value)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded mr-2" />
                      Losing Trades
                    </span>
                    <span className="font-medium">{Math.round(winLossData[1].value)}</span>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="📋 Symbol Breakdown" key="symbols">
          <Card size="small" title="🔍 Symbol Performance Analysis">
            <Table
              dataSource={symbolTableData}
              columns={symbolColumns}
              pagination={{ pageSize: 10 }}
              size="small"
              scroll={{ x: 800 }}
            />
          </Card>
          
          {symbolTableData.length > 0 && (
            <Row gutter={16} className="mt-4">
              <Col span={24}>
                <Card size="small" title="📊 Top Performers vs Underperformers">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={symbolTableData.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="symbol" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Win Rate']} />
                      <Bar 
                        dataKey="winRate" 
                        radius={[4, 4, 0, 0]}
                        fill={(entry: any) => entry.winRate >= 60 ? '#52c41a' : entry.winRate >= 50 ? '#1890ff' : '#ff4d4f'}
                      >
                        {symbolTableData.slice(0, 10).map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.winRate >= 60 ? '#52c41a' : entry.winRate >= 50 ? '#1890ff' : '#ff4d4f'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>
          )}
        </TabPane>

        <TabPane tab="⏰ Time Analysis" key="timing">
          {timeOfDayChartData.length > 0 ? (
            <Row gutter={16}>
              <Col span={24}>
                <Card size="small" title="🕐 Win Rate by Time of Day">
                  <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart data={timeOfDayChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis yAxisId="left" domain={[0, 100]} />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'winRate' ? `${value}%` : value,
                          name === 'winRate' ? 'Win Rate' : name === 'trades' ? 'Trade Count' : 'Volume'
                        ]}
                      />
                      <Legend />
                      <Bar 
                        yAxisId="right" 
                        dataKey="trades" 
                        fill="#e6f7ff" 
                        stroke="#1890ff"
                        name="Trade Count" 
                      />
                      <Line 
                        yAxisId="left" 
                        type="monotone" 
                        dataKey="winRate" 
                        stroke="#52c41a" 
                        strokeWidth={3}
                        dot={{ fill: '#52c41a', strokeWidth: 2, r: 4 }}
                        name="Win Rate %" 
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>
          ) : (
            <Alert
              message="Insufficient Time Data"
              description="More trades with time stamps are needed to analyze time-of-day patterns."
              type="info"
              showIcon
            />
          )}
        </TabPane>

        <TabPane tab="🎯 Optimization" key="optimization">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card size="small" title="💡 Improvement Opportunities">
                <div className="space-y-3">
                  {winRateAnalysis.overallWinRate < 50 && (
                    <Alert
                      message="Win Rate Below 50%"
                      description="Focus on higher-quality setups and risk management. Consider reducing position sizes until consistency improves."
                      type="warning"
                      showIcon
                    />
                  )}
                  
                  {symbolTableData.filter(s => s.winRate < 40).length > 0 && (
                    <Alert
                      message="Underperforming Symbols"
                      description={`${symbolTableData.filter(s => s.winRate < 40).length} symbols have win rates below 40%. Consider avoiding these or adjusting your strategy.`}
                      type="error"
                      showIcon
                    />
                  )}
                  
                  {winRateAnalysis.trendAnalysis === 'DECLINING' && (
                    <Alert
                      message="Declining Trend"
                      description="Recent performance shows declining win rate. Review your recent trades and consider taking a break to reset."
                      type="warning"
                      showIcon
                    />
                  )}
                  
                  {winRateAnalysis.overallWinRate >= 60 && (
                    <Alert
                      message="Excellent Performance!"
                      description="Your win rate is above 60%. Focus on maintaining consistency and consider gradually increasing position sizes."
                      type="success"
                      showIcon
                    />
                  )}
                </div>
              </Card>
            </Col>
            
            <Col xs={24} lg={12}>
              <Card size="small" title="📈 Performance Insights">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Best Performing Symbols</h4>
                    {symbolTableData.filter(s => s.winRate >= 60).slice(0, 3).map((symbol, index) => (
                      <div key={index} className="flex justify-between items-center py-1">
                        <span className="font-mono">{symbol.symbol}</span>
                        <Tag color="success">{symbol.winRate.toFixed(1)}%</Tag>
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Focus Areas</h4>
                    {symbolTableData.filter(s => s.winRate < 50 && s.trades >= 5).slice(0, 3).map((symbol, index) => (
                      <div key={index} className="flex justify-between items-center py-1">
                        <span className="font-mono">{symbol.symbol}</span>
                        <Tag color="warning">{symbol.winRate.toFixed(1)}%</Tag>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="text-sm text-gray-600">
                      <strong>Key Insight:</strong> {
                        winRateAnalysis.overallWinRate >= 60 
                          ? 'Maintain your excellent consistency and consider scaling up.'
                          : winRateAnalysis.overallWinRate >= 50
                          ? 'You\'re on the right track. Focus on eliminating low-probability setups.'
                          : 'Prioritize quality over quantity. Reduce trade frequency and focus on A+ setups only.'
                      }
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default WinRateAnalysisChart;
export type { WinRateAnalysisProps };