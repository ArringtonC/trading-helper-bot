/**
 * Behavioral Analytics Dashboard Component
 * Comprehensive psychology tracking and behavioral pattern analysis
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Tabs,
  Progress,
  Statistic,
  Tag,
  Alert,
  Typography,
  Space,
  Button,
  Select,
  DatePicker,
  List,
  Tooltip,
  Badge
} from 'antd';
import {
  HeartOutlined,
  TrophyOutlined,
  WarningOutlined,
  FireOutlined,
  SafetyOutlined,
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts';
import {
  BehavioralPattern,
  DisciplineMetrics,
  StressCorrelationData,
  PsychologyAchievement,
  EmotionalState
} from '../types/psychology';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

interface BehavioralAnalyticsDashboardProps {
  behavioralPatterns?: BehavioralPattern[];
  disciplineMetrics?: DisciplineMetrics;
  stressCorrelation?: StressCorrelationData[];
  achievements?: PsychologyAchievement[];
  emotionalHistory?: EmotionalState[];
  className?: string;
}

const BehavioralAnalyticsDashboard: React.FC<BehavioralAnalyticsDashboardProps> = ({
  behavioralPatterns = [],
  disciplineMetrics,
  stressCorrelation = [],
  achievements = [],
  emotionalHistory = [],
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Mock data for demonstration
  const mockDisciplineMetrics: DisciplineMetrics = disciplineMetrics || {
    positionSizeCompliance: 87,
    stopLossCompliance: 92,
    strategyAdherence: 78,
    weeklyOptionsAvoidance: 94,
    overallDisciplineScore: 88,
    consecutiveDisciplinedDays: 23,
    disciplineStreak: {
      current: 23,
      best: 35,
      category: 'SKILLED'
    }
  };

  const mockBehavioralPatterns: BehavioralPattern[] = behavioralPatterns.length > 0 ? behavioralPatterns : [
    {
      pattern: 'REVENGE_TRADING',
      frequency: 3,
      impact: -750,
      lastOccurrence: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      trend: 'IMPROVING',
      interventionSuggestions: [
        'Take a 30-minute break after any loss',
        'Stick to predetermined position sizes',
        'Use stop-loss orders consistently'
      ]
    },
    {
      pattern: 'FOMO_ENTRY',
      frequency: 7,
      impact: -1050,
      lastOccurrence: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      trend: 'STABLE',
      interventionSuggestions: [
        'Wait for pullbacks before entering',
        'Set price alerts instead of watching constantly',
        'Stick to your predetermined watchlist'
      ]
    },
    {
      pattern: 'PANIC_EXIT',
      frequency: 2,
      impact: -400,
      lastOccurrence: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      trend: 'IMPROVING',
      interventionSuggestions: [
        'Set stop-losses when entering positions',
        'Use position sizing to reduce emotional impact',
        'Practice breathing exercises during drawdowns'
      ]
    }
  ];

  const mockStressCorrelation: StressCorrelationData[] = stressCorrelation.length > 0 ? stressCorrelation : 
    Array.from({ length: 30 }, (_, i) => ({
      stressLevel: 3 + Math.sin(i * 0.2) * 2 + Math.random() * 2,
      winRate: 65 - (3 + Math.sin(i * 0.2) * 2 + Math.random() * 2) * 2,
      profitFactor: 1.8 - (3 + Math.sin(i * 0.2) * 2 + Math.random() * 2) * 0.1,
      decisionQuality: 85 - (3 + Math.sin(i * 0.2) * 2 + Math.random() * 2) * 3,
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
    }));

  const mockAchievements: PsychologyAchievement[] = achievements.length > 0 ? achievements : [
    {
      id: 'zen_trader_30',
      category: 'STRESS_MANAGEMENT',
      name: 'Zen Trader',
      description: 'Maintain stress level below 5 for 30 days',
      criteria: 'stress_level < 5 for 30 consecutive days',
      xpReward: 500,
      unlockedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      progress: 100,
      milestones: [
        { threshold: 7, description: '7 days of low stress', achieved: true },
        { threshold: 15, description: '2 weeks of discipline', achieved: true },
        { threshold: 30, description: 'Full month mastery', achieved: true }
      ]
    },
    {
      id: 'profit_protector',
      category: 'PROFIT_PROTECTION',
      name: 'Profit Protector',
      description: 'Extract profits for 3 consecutive months',
      criteria: 'monthly_extraction for 3 months',
      xpReward: 750,
      progress: 67,
      milestones: [
        { threshold: 1, description: 'First extraction', achieved: true },
        { threshold: 2, description: 'Building discipline', achieved: true },
        { threshold: 3, description: 'Consistent protection', achieved: false }
      ]
    },
    {
      id: 'iron_discipline',
      category: 'DISCIPLINE',
      name: 'Iron Discipline',
      description: '100% compliance with 1% rule for 60 days',
      criteria: 'position_size <= 1% for 60 days',
      xpReward: 1000,
      progress: 38,
      milestones: [
        { threshold: 15, description: 'Starting strong', achieved: true },
        { threshold: 30, description: 'Building habits', achieved: true },
        { threshold: 60, description: 'Iron discipline', achieved: false }
      ]
    }
  ];

  // Chart color schemes
  const stressColors = ['#52c41a', '#faad14', '#fa8c16', '#ff4d4f'];
  const patternColors = ['#ff4d4f', '#fa8c16', '#faad14', '#52c41a'];

  const getPatternIcon = (pattern: string) => {
    switch (pattern) {
      case 'REVENGE_TRADING': return '⚔️';
      case 'FOMO_ENTRY': return '🏃';
      case 'PANIC_EXIT': return '😱';
      case 'OVERSIZE_POSITIONS': return '📏';
      case 'WEEKLY_OPTIONS_ADDICTION': return '🎰';
      default: return '📊';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'IMPROVING': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'WORSENING': return <WarningOutlined style={{ color: '#ff4d4f' }} />;
      case 'STABLE': return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      default: return <ClockCircleOutlined />;
    }
  };

  return (
    <Card 
      className={`behavioral-analytics-dashboard ${className}`}
      title={
        <Space>
          <HeartOutlined style={{ color: '#1890ff' }} />
          <span>Behavioral Analytics Dashboard</span>
          <Badge count={mockBehavioralPatterns.filter(p => p.trend === 'WORSENING').length} />
        </Space>
      }
      size="small"
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* Overview Tab */}
        <TabPane tab={<span><BarChartOutlined />Overview</span>} key="overview">
          <Row gutter={[16, 16]}>
            {/* Key Metrics */}
            <Col xs={24} lg={16}>
              <Card title="📊 Key Discipline Metrics" size="small">
                <Row gutter={[16, 16]}>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="Overall Score"
                      value={mockDisciplineMetrics.overallDisciplineScore}
                      suffix="/100"
                      valueStyle={{ 
                        color: mockDisciplineMetrics.overallDisciplineScore >= 80 ? '#52c41a' : 
                               mockDisciplineMetrics.overallDisciplineScore >= 60 ? '#faad14' : '#ff4d4f' 
                      }}
                      prefix={<TrophyOutlined />}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="Position Compliance"
                      value={mockDisciplineMetrics.positionSizeCompliance}
                      suffix="%"
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="Stop Loss Usage"
                      value={mockDisciplineMetrics.stopLossCompliance}
                      suffix="%"
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="Weekly Options Avoided"
                      value={mockDisciplineMetrics.weeklyOptionsAvoidance}
                      suffix="%"
                      valueStyle={{ color: '#722ed1' }}
                    />
                  </Col>
                </Row>

                <div className="mt-4">
                  <Text strong>Discipline Streak: </Text>
                  <Tag color="blue">
                    {mockDisciplineMetrics.consecutiveDisciplinedDays} days ({mockDisciplineMetrics.disciplineStreak.category})
                  </Tag>
                  <Text type="secondary" className="ml-2">
                    Best: {mockDisciplineMetrics.disciplineStreak.best} days
                  </Text>
                </div>
              </Card>
            </Col>

            {/* Discipline Progress Circle */}
            <Col xs={24} lg={8}>
              <Card title="🎯 Discipline Progress" size="small">
                <div className="text-center">
                  <Progress
                    type="circle"
                    percent={mockDisciplineMetrics.overallDisciplineScore}
                    strokeColor={{
                      '0%': '#ff4d4f',
                      '60%': '#faad14',
                      '80%': '#52c41a'
                    }}
                    width={120}
                    format={percent => (
                      <div className="text-center">
                        <div className="text-lg font-bold">{percent}%</div>
                        <div className="text-xs text-gray-500">Discipline</div>
                      </div>
                    )}
                  />
                  <div className="mt-2">
                    <Tag color={
                      mockDisciplineMetrics.disciplineStreak.category === 'MASTER' ? 'gold' :
                      mockDisciplineMetrics.disciplineStreak.category === 'DISCIPLINED' ? 'green' :
                      mockDisciplineMetrics.disciplineStreak.category === 'SKILLED' ? 'blue' : 'default'
                    }>
                      {mockDisciplineMetrics.disciplineStreak.category}
                    </Tag>
                  </div>
                </div>
              </Card>
            </Col>

            {/* Behavioral Patterns */}
            <Col span={24}>
              <Card title="🧠 Behavioral Patterns" size="small">
                <Row gutter={[16, 16]}>
                  {mockBehavioralPatterns.map((pattern, index) => (
                    <Col xs={24} sm={8} key={index}>
                      <Card size="small" className="h-full">
                        <div className="text-center mb-2">
                          <div style={{ fontSize: '24px' }}>{getPatternIcon(pattern.pattern)}</div>
                          <Text strong>{pattern.pattern.replace(/_/g, ' ')}</Text>
                        </div>
                        <div className="mb-2">
                          <div className="flex justify-between">
                            <Text>Frequency:</Text>
                            <Text strong>{pattern.frequency}</Text>
                          </div>
                          <div className="flex justify-between">
                            <Text>Impact:</Text>
                            <Text strong style={{ color: '#ff4d4f' }}>
                              ${pattern.impact}
                            </Text>
                          </div>
                          <div className="flex justify-between">
                            <Text>Trend:</Text>
                            <Space>
                              {getTrendIcon(pattern.trend)}
                              <Text>{pattern.trend}</Text>
                            </Space>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          Last: {pattern.lastOccurrence.toLocaleDateString()}
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* Stress Analysis Tab */}
        <TabPane tab={<span><HeartOutlined />Stress Analysis</span>} key="stress">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card title="📈 Stress vs Performance Correlation" size="small">
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart data={mockStressCorrelation}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="stressLevel" 
                        name="Stress Level"
                        domain={[0, 10]}
                        label={{ value: 'Stress Level', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        dataKey="winRate" 
                        name="Win Rate"
                        domain={[40, 80]}
                        label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft' }}
                      />
                      <RechartsTooltip 
                        formatter={(value, name) => [
                          `${(value as number).toFixed(1)}${name === 'winRate' ? '%' : ''}`,
                          name === 'stressLevel' ? 'Stress Level' : 'Win Rate'
                        ]}
                      />
                      <Scatter 
                        dataKey="winRate" 
                        fill="#1890ff"
                        name="Performance"
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <Alert
                  message="Stress Correlation Analysis"
                  description="Your optimal stress range appears to be 3-5 for maximum performance. High stress (>7) significantly impacts win rate."
                  type="info"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              </Card>
            </Col>

            <Col span={24}>
              <Card title="📊 Stress Level Trends (30 Days)" size="small">
                <div style={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockStressCorrelation.slice(-14)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis domain={[0, 10]} />
                      <RechartsTooltip 
                        labelFormatter={(date) => new Date(date).toLocaleDateString()}
                        formatter={(value) => [`${(value as number).toFixed(1)}`, 'Stress Level']}
                      />
                      <Area
                        type="monotone"
                        dataKey="stressLevel"
                        stroke="#fa8c16"
                        fill="#fa8c16"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* Achievements Tab */}
        <TabPane tab={<span><TrophyOutlined />Achievements</span>} key="achievements">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card title="🏆 Psychology Achievements" size="small">
                <Row gutter={[16, 16]}>
                  {mockAchievements.map((achievement, index) => (
                    <Col xs={24} sm={12} lg={8} key={achievement.id}>
                      <Card 
                        size="small" 
                        className={`h-full ${achievement.unlockedAt ? 'border-green-500' : ''}`}
                        style={{ 
                          borderColor: achievement.unlockedAt ? '#52c41a' : '#d9d9d9',
                          backgroundColor: achievement.unlockedAt ? '#f6ffed' : 'white'
                        }}
                      >
                        <div className="text-center mb-3">
                          <div style={{ fontSize: '32px' }}>
                            {achievement.unlockedAt ? '🏆' : '🔒'}
                          </div>
                          <Title level={5} className="mb-1">
                            {achievement.name}
                          </Title>
                          <Text type="secondary" className="text-sm">
                            {achievement.description}
                          </Text>
                        </div>

                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <Text strong>Progress</Text>
                            <Text strong>{achievement.progress}%</Text>
                          </div>
                          <Progress
                            percent={achievement.progress}
                            strokeColor={achievement.unlockedAt ? '#52c41a' : '#1890ff'}
                            showInfo={false}
                          />
                        </div>

                        <div className="mb-3">
                          <Text strong>Milestones:</Text>
                          <div className="mt-1">
                            {achievement.milestones.map((milestone, i) => (
                              <div key={i} className="flex items-center text-sm mb-1">
                                <CheckCircleOutlined 
                                  style={{ 
                                    color: milestone.achieved ? '#52c41a' : '#d9d9d9',
                                    marginRight: '4px'
                                  }} 
                                />
                                <Text type={milestone.achieved ? 'success' : 'secondary'}>
                                  {milestone.description}
                                </Text>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <Tag color={
                            achievement.category === 'STRESS_MANAGEMENT' ? 'green' :
                            achievement.category === 'PROFIT_PROTECTION' ? 'blue' :
                            achievement.category === 'DISCIPLINE' ? 'purple' : 'default'
                          }>
                            {achievement.category.replace(/_/g, ' ')}
                          </Tag>
                          <Space>
                            <ThunderboltOutlined style={{ color: '#faad14' }} />
                            <Text strong>{achievement.xpReward} XP</Text>
                          </Space>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* Patterns Tab */}
        <TabPane tab={<span><LineChartOutlined />Detailed Patterns</span>} key="patterns">
          <Row gutter={[16, 16]}>
            {mockBehavioralPatterns.map((pattern, index) => (
              <Col xs={24} lg={12} key={index}>
                <Card 
                  title={
                    <Space>
                      <span>{getPatternIcon(pattern.pattern)}</span>
                      <span>{pattern.pattern.replace(/_/g, ' ')}</span>
                      {getTrendIcon(pattern.trend)}
                    </Space>
                  }
                  size="small"
                >
                  <div className="mb-4">
                    <Row gutter={16}>
                      <Col span={8}>
                        <Statistic
                          title="Frequency"
                          value={pattern.frequency}
                          valueStyle={{ color: '#1890ff' }}
                        />
                      </Col>
                      <Col span={8}>
                        <Statistic
                          title="Impact"
                          value={Math.abs(pattern.impact)}
                          prefix="-$"
                          valueStyle={{ color: '#ff4d4f' }}
                        />
                      </Col>
                      <Col span={8}>
                        <Statistic
                          title="Trend"
                          value={pattern.trend}
                          valueStyle={{ 
                            color: pattern.trend === 'IMPROVING' ? '#52c41a' :
                                   pattern.trend === 'WORSENING' ? '#ff4d4f' : '#faad14'
                          }}
                        />
                      </Col>
                    </Row>
                  </div>

                  <div className="mb-4">
                    <Text strong>Intervention Suggestions:</Text>
                    <List
                      size="small"
                      dataSource={pattern.interventionSuggestions}
                      renderItem={item => (
                        <List.Item style={{ padding: '4px 0', border: 'none' }}>
                          <Text>• {item}</Text>
                        </List.Item>
                      )}
                    />
                  </div>

                  <div>
                    <Text type="secondary" className="text-xs">
                      Last occurrence: {pattern.lastOccurrence.toLocaleDateString()}
                    </Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default BehavioralAnalyticsDashboard;