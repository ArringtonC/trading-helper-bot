import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Tag,
  Tabs,
  Alert,
  Timeline
} from 'antd';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell
} from 'recharts';
import {
  FireOutlined,
  TrophyOutlined,
  CalendarOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  ShieldOutlined
} from '@ant-design/icons';
import { StreakData } from '../../../services/AnalyticsDataService';

const { TabPane } = Tabs;

interface StreakVisualizationProps {
  streakData: StreakData;
  className?: string;
}

const StreakVisualization: React.FC<StreakVisualizationProps> = ({
  streakData,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Prepare radar chart data for all streaks
  const radarData = [
    {
      subject: 'Login',
      current: streakData.loginStreak.current,
      best: streakData.loginStreak.best,
      fullMark: Math.max(streakData.loginStreak.best, 30)
    },
    {
      subject: 'Tasks',
      current: streakData.taskCompletionStreak.current,
      best: streakData.taskCompletionStreak.best,
      fullMark: Math.max(streakData.taskCompletionStreak.best, 30)
    },
    {
      subject: 'Risk Control',
      current: streakData.riskDisciplineStreak.current,
      best: streakData.riskDisciplineStreak.best,
      fullMark: Math.max(streakData.riskDisciplineStreak.best, 30)
    },
    {
      subject: 'Platform Use',
      current: streakData.platformUsageStreak.current,
      best: streakData.platformUsageStreak.best,
      fullMark: Math.max(streakData.platformUsageStreak.best, 30)
    },
    {
      subject: 'Profitable Days',
      current: streakData.profitableDaysStreak.current,
      best: streakData.profitableDaysStreak.best,
      fullMark: Math.max(streakData.profitableDaysStreak.best, 20)
    }
  ];

  // Simulate historical streak data for trend visualization
  const generateHistoricalData = (current: number, category: string) => {
    const data = [];
    const daysBack = 30;
    
    for (let i = daysBack; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      
      let value = 0;
      if (i <= current) {
        value = current - i + 1;
      }
      
      data.push({
        date: day.toISOString().split('T')[0],
        value,
        category
      });
    }
    return data;
  };

  const getStreakColor = (current: number, category: string) => {
    if (current >= 30) return '#ff4d4f'; // Red for legendary
    if (current >= 14) return '#722ed1'; // Purple for impressive  
    if (current >= 7) return '#1890ff';  // Blue for solid
    if (current >= 3) return '#52c41a';  // Green for building
    return '#d9d9d9'; // Gray for getting started
  };

  const getStreakIcon = (category: string) => {
    switch (category) {
      case 'LEGENDARY': return <TrophyOutlined style={{ color: '#ff4d4f' }} />;
      case 'IMPRESSIVE': return <FireOutlined style={{ color: '#722ed1' }} />;
      case 'SOLID': return <RiseOutlined style={{ color: '#1890ff' }} />;
      case 'BUILDING': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      default: return <CalendarOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  const getMotivationColor = (score: number) => {
    if (score >= 20) return 'success';
    if (score >= 15) return 'processing';
    if (score >= 10) return 'warning';
    return 'default';
  };

  const loginHistoryData = generateHistoricalData(streakData.loginStreak.current, 'Login');
  const taskHistoryData = generateHistoricalData(streakData.taskCompletionStreak.current, 'Tasks');

  const streakSummaryData = [
    {
      name: 'Login',
      current: streakData.loginStreak.current,
      best: streakData.loginStreak.best,
      category: streakData.loginStreak.category,
      color: getStreakColor(streakData.loginStreak.current, streakData.loginStreak.category)
    },
    {
      name: 'Tasks',
      current: streakData.taskCompletionStreak.current,
      best: streakData.taskCompletionStreak.best,
      category: streakData.taskCompletionStreak.category,
      color: getStreakColor(streakData.taskCompletionStreak.current, streakData.taskCompletionStreak.category)
    },
    {
      name: 'Risk Discipline',
      current: streakData.riskDisciplineStreak.current,
      best: streakData.riskDisciplineStreak.best,
      category: streakData.riskDisciplineStreak.category,
      color: getStreakColor(streakData.riskDisciplineStreak.current, streakData.riskDisciplineStreak.category)
    },
    {
      name: 'Platform Usage',
      current: streakData.platformUsageStreak.current,
      best: streakData.platformUsageStreak.best,
      category: streakData.platformUsageStreak.category,
      color: getStreakColor(streakData.platformUsageStreak.current, streakData.platformUsageStreak.category)
    },
    {
      name: 'Profitable Days',
      current: streakData.profitableDaysStreak.current,
      best: streakData.profitableDaysStreak.best,
      category: streakData.profitableDaysStreak.category,
      color: getStreakColor(streakData.profitableDaysStreak.current, streakData.profitableDaysStreak.category)
    }
  ];

  return (
    <Card 
      className={`streak-visualization ${className}`} 
      title="🔥 Habit Tracking & Streaks"
    >
      {/* Overall Score and Motivation */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} md={12}>
          <Card size="small">
            <Statistic
              title="Overall Streak Score"
              value={streakData.overallScore}
              precision={1}
              prefix={<FireOutlined />}
              suffix="/ 30"
              valueStyle={{ 
                color: streakData.overallScore >= 20 ? '#ff4d4f' : 
                       streakData.overallScore >= 15 ? '#722ed1' :
                       streakData.overallScore >= 10 ? '#1890ff' : '#52c41a'
              }}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Alert
            message="Motivation Boost"
            description={streakData.motivation}
            type={getMotivationColor(streakData.overallScore)}
            showIcon
            icon={<FireOutlined />}
          />
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="📊 Overview" key="overview">
          <Row gutter={16}>
            {/* Streak Radar Chart */}
            <Col xs={24} lg={12}>
              <Card size="small" title="🎯 Streak Performance Radar">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 'dataMax']} 
                      tick={false}
                    />
                    <Radar
                      name="Current Streak"
                      dataKey="current"
                      stroke="#1890ff"
                      fill="#1890ff"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Best Streak"
                      dataKey="best"
                      stroke="#52c41a"
                      fill="transparent"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            {/* Streak Summary Cards */}
            <Col xs={24} lg={12}>
              <div className="space-y-4">
                {streakSummaryData.map((streak, index) => (
                  <Card key={index} size="small">
                    <Row align="middle">
                      <Col span={6}>
                        <div className="text-center">
                          {getStreakIcon(streak.category)}
                          <div className="text-xs text-gray-600 mt-1">
                            {streak.category}
                          </div>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div>
                          <div className="font-medium">{streak.name}</div>
                          <Progress
                            percent={(streak.current / Math.max(streak.best, 30)) * 100}
                            strokeColor={streak.color}
                            showInfo={false}
                            size="small"
                          />
                        </div>
                      </Col>
                      <Col span={6} className="text-right">
                        <div className="text-lg font-bold" style={{ color: streak.color }}>
                          {streak.current}
                        </div>
                        <div className="text-xs text-gray-600">
                          Best: {streak.best}
                        </div>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </div>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="📈 Trends" key="trends">
          <Row gutter={[16, 16]}>
            {/* Login Streak Trend */}
            <Col xs={24} lg={12}>
              <Card size="small" title="🚪 Login Streak Trend (30 Days)">
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={loginHistoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                      formatter={(value) => [`${value} days`, 'Streak Length']}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#1890ff"
                      fill="#1890ff"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            {/* Task Completion Trend */}
            <Col xs={24} lg={12}>
              <Card size="small" title="✅ Task Completion Trend (30 Days)">
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={taskHistoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                      formatter={(value) => [`${value} days`, 'Streak Length']}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#52c41a"
                      fill="#52c41a"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            {/* Comparative Streak Chart */}
            <Col span={24}>
              <Card size="small" title="📊 Streak Comparison">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={streakSummaryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="current" name="Current Streak" radius={[4, 4, 0, 0]}>
                      {streakSummaryData.map((entry, index) => (
                        <Cell key={`cell-current-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                    <Bar dataKey="best" name="Best Streak" fill="transparent" stroke="#d9d9d9" strokeWidth={2} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="🎯 Milestones" key="milestones">
          <Row gutter={16}>
            <Col xs={24} lg={12}>
              <Card size="small" title="🏆 Streak Milestones">
                <Timeline>
                  <Timeline.Item 
                    color={streakData.loginStreak.current >= 30 ? 'green' : 'gray'}
                    dot={streakData.loginStreak.current >= 30 ? <TrophyOutlined /> : <CalendarOutlined />}
                  >
                    <div>
                      <strong>30-Day Login Legend</strong>
                      <div className="text-gray-600">
                        {streakData.loginStreak.current >= 30 ? '✅ Achieved!' : 
                         `${30 - streakData.loginStreak.current} days to go`}
                      </div>
                    </div>
                  </Timeline.Item>
                  
                  <Timeline.Item 
                    color={streakData.taskCompletionStreak.current >= 14 ? 'blue' : 'gray'}
                    dot={streakData.taskCompletionStreak.current >= 14 ? <FireOutlined /> : <CheckCircleOutlined />}
                  >
                    <div>
                      <strong>2-Week Task Master</strong>
                      <div className="text-gray-600">
                        {streakData.taskCompletionStreak.current >= 14 ? '✅ Achieved!' : 
                         `${14 - streakData.taskCompletionStreak.current} days to go`}
                      </div>
                    </div>
                  </Timeline.Item>
                  
                  <Timeline.Item 
                    color={streakData.riskDisciplineStreak.current >= 21 ? 'purple' : 'gray'}
                    dot={streakData.riskDisciplineStreak.current >= 21 ? <ShieldOutlined /> : <ShieldOutlined />}
                  >
                    <div>
                      <strong>Risk Management Pro</strong>
                      <div className="text-gray-600">
                        {streakData.riskDisciplineStreak.current >= 21 ? '✅ Achieved!' : 
                         `${21 - streakData.riskDisciplineStreak.current} days to go`}
                      </div>
                    </div>
                  </Timeline.Item>
                  
                  <Timeline.Item 
                    color={streakData.profitableDaysStreak.current >= 10 ? 'gold' : 'gray'}
                    dot={streakData.profitableDaysStreak.current >= 10 ? <RiseOutlined /> : <RiseOutlined />}
                  >
                    <div>
                      <strong>Profitable Streak Warrior</strong>
                      <div className="text-gray-600">
                        {streakData.profitableDaysStreak.current >= 10 ? '✅ Achieved!' : 
                         `${10 - streakData.profitableDaysStreak.current} days to go`}
                      </div>
                    </div>
                  </Timeline.Item>
                </Timeline>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card size="small" title="💡 Streak Building Tips">
                <div className="space-y-3">
                  {streakData.loginStreak.current < 7 && (
                    <Alert
                      message="Login Consistency"
                      description="Set a daily reminder to check your portfolio at the same time each day"
                      type="info"
                      showIcon
                      icon={<CalendarOutlined />}
                    />
                  )}
                  
                  {streakData.taskCompletionStreak.current < 5 && (
                    <Alert
                      message="Task Completion"
                      description="Start with 2-3 daily tasks to build the habit before adding more"
                      type="warning"
                      showIcon
                      icon={<CheckCircleOutlined />}
                    />
                  )}
                  
                  {streakData.riskDisciplineStreak.current < 3 && (
                    <Alert
                      message="Risk Discipline"
                      description="Never risk more than 2% per trade to maintain your risk discipline streak"
                      type="error"
                      showIcon
                      icon={<ShieldOutlined />}
                    />
                  )}
                  
                  {streakData.overallScore >= 15 && (
                    <Alert
                      message="Excellent Progress!"
                      description="You're building outstanding trading habits. Keep up the momentum!"
                      type="success"
                      showIcon
                      icon={<TrophyOutlined />}
                    />
                  )}
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default StreakVisualization;
export type { StreakVisualizationProps };