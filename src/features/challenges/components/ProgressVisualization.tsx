import React, { useMemo } from 'react';
import {
  Card,
  Progress,
  Row,
  Col,
  Statistic,
  Tag,
  Badge,
  Tooltip,
  Space,
  Typography,
  Divider,
  Alert
} from 'antd';
import {
  TrophyOutlined,
  FireOutlined,
  SafetyOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StarOutlined,
  HeartOutlined,
  ThunderboltOutlined,
  CrownOutlined
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import type {
  Challenge,
  WeeklyMilestone,
  PerformanceMetrics,
  ChallengeStreaks
} from '../types/challenge';

const { Title, Text, Paragraph } = Typography;

interface ProgressVisualizationProps {
  challenge: Challenge;
  weeklyMilestones: WeeklyMilestone[];
  performanceMetrics: PerformanceMetrics;
  streaks: ChallengeStreaks;
}

const COLORS = {
  success: '#52c41a',
  warning: '#faad14',
  danger: '#ff4d4f',
  primary: '#1890ff',
  purple: '#722ed1',
  gold: '#fadb14'
};

const SETUP_QUALITY_COLORS = {
  'A+': '#52c41a',
  'A': '#73d13d',
  'B': '#faad14',
  'C': '#ff7a45',
  'F': '#ff4d4f'
};

export const ProgressVisualization: React.FC<ProgressVisualizationProps> = ({
  challenge,
  weeklyMilestones,
  performanceMetrics,
  streaks
}) => {
  const progressPercentage = useMemo(() => {
    const progress = ((challenge.currentAmount - challenge.startingAmount) / 
                     (challenge.targetAmount - challenge.startingAmount)) * 100;
    return Math.max(0, Math.min(100, progress));
  }, [challenge]);

  const patienceTrendData = useMemo(() => {
    // Mock data for patience score trend
    return Array.from({ length: challenge.currentDay }, (_, i) => ({
      day: i + 1,
      patienceScore: Math.min(10, 5 + Math.random() * 3 + (i * 0.1)),
      trades: Math.floor(Math.random() * 3)
    }));
  }, [challenge.currentDay]);

  const setupQualityData = useMemo(() => {
    const { setupQuality } = performanceMetrics;
    return Object.entries(setupQuality)
      .filter(([_, value]) => value > 0)
      .map(([key, value]) => ({
        name: key.toUpperCase(),
        value: value,
        percentage: (value / performanceMetrics.totalTrades) * 100
      }));
  }, [performanceMetrics]);

  const weeklyProgressData = useMemo(() => {
    return weeklyMilestones.map(milestone => ({
      week: `Week ${milestone.weekNumber}`,
      target: milestone.targetAmount,
      actual: milestone.actualAmount || challenge.currentAmount,
      status: milestone.status
    }));
  }, [weeklyMilestones, challenge.currentAmount]);

  const skillMetricsData = useMemo(() => [
    {
      metric: 'Patience',
      value: performanceMetrics.patienceScore * 10,
      fullMark: 100
    },
    {
      metric: 'Strategy Adherence',
      value: performanceMetrics.strategyAdherence,
      fullMark: 100
    },
    {
      metric: 'Risk Discipline',
      value: Math.min(100, (2 - performanceMetrics.averageRiskPerTrade) * 100),
      fullMark: 100
    },
    {
      metric: 'Setup Quality',
      value: ((performanceMetrics.setupQuality.aPlus + performanceMetrics.setupQuality.a) / 
              performanceMetrics.totalTrades) * 100,
      fullMark: 100
    },
    {
      metric: 'Trade Selectivity',
      value: Math.min(100, (2 - performanceMetrics.averageTradesPerDay) * 50),
      fullMark: 100
    }
  ], [performanceMetrics]);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return COLORS.success;
    if (percentage >= 75) return COLORS.primary;
    if (percentage >= 50) return COLORS.warning;
    return COLORS.danger;
  };

  const getPatienceMessage = () => {
    if (performanceMetrics.averageTradesPerDay <= 0.5) {
      return { text: "Master of Patience! 🧘", color: COLORS.success };
    } else if (performanceMetrics.averageTradesPerDay <= 1) {
      return { text: "Excellent Restraint! 💎", color: COLORS.primary };
    } else if (performanceMetrics.averageTradesPerDay <= 2) {
      return { text: "Good Discipline 👍", color: COLORS.warning };
    }
    return { text: "Consider Being More Selective", color: COLORS.danger };
  };

  const patienceMessage = getPatienceMessage();

  return (
    <div className="progress-visualization">
      {/* Header with Overall Progress */}
      <Card className="mb-4">
        <Row align="middle" justify="space-between">
          <Col>
            <Space direction="vertical" size={0}>
              <Title level={3} className="mb-0">
                <TrophyOutlined className="mr-2" style={{ color: COLORS.gold }} />
                Challenge Progress - Day {challenge.currentDay} of {challenge.totalDays}
              </Title>
              <Text type="secondary">
                {challenge.totalDays - challenge.currentDay} days remaining
              </Text>
            </Space>
          </Col>
          <Col>
            <Badge
              count={`$${challenge.currentAmount.toLocaleString()}`}
              style={{ 
                backgroundColor: getProgressColor(progressPercentage),
                fontSize: '18px',
                padding: '4px 12px',
                height: 'auto'
              }}
            />
          </Col>
        </Row>
      </Card>

      {/* Financial Progress */}
      <Card 
        title={
          <Space>
            <RiseOutlined style={{ color: COLORS.primary }} />
            Financial Progress
          </Space>
        }
        className="mb-4"
      >
        <div className="mb-4">
          <Text strong>
            ${challenge.startingAmount.toLocaleString()} → ${challenge.currentAmount.toLocaleString()} / ${challenge.targetAmount.toLocaleString()}
          </Text>
          <Progress
            percent={progressPercentage}
            status={progressPercentage >= 100 ? 'success' : 'active'}
            strokeColor={{
              '0%': COLORS.primary,
              '100%': progressPercentage >= 100 ? COLORS.success : COLORS.purple
            }}
            format={percent => `${percent.toFixed(1)}%`}
          />
          <Text type="secondary">
            Gain: ${(challenge.currentAmount - challenge.startingAmount).toLocaleString()} 
            ({((challenge.currentAmount - challenge.startingAmount) / challenge.startingAmount * 100).toFixed(1)}%)
          </Text>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyProgressData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <RechartsTooltip 
              formatter={(value: any) => `$${Number(value).toLocaleString()}`}
            />
            <Bar dataKey="target" fill={COLORS.warning} opacity={0.5} />
            <Bar dataKey="actual" fill={COLORS.primary} />
          </BarChart>
        </ResponsiveContainer>

        <Row gutter={16} className="mt-4">
          {weeklyMilestones.map((milestone, index) => (
            <Col span={6} key={milestone.id}>
              <Card size="small">
                <Statistic
                  title={`Week ${milestone.weekNumber}`}
                  value={milestone.actualAmount || 0}
                  prefix="$"
                  suffix={
                    milestone.status === 'ACHIEVED' ? 
                      <CheckCircleOutlined style={{ color: COLORS.success }} /> :
                      milestone.status === 'IN_PROGRESS' ?
                        <ClockCircleOutlined style={{ color: COLORS.warning }} /> :
                        null
                  }
                />
                <Progress
                  percent={milestone.actualAmount ? 
                    (milestone.actualAmount / milestone.targetAmount) * 100 : 0}
                  showInfo={false}
                  size="small"
                  status={milestone.status === 'ACHIEVED' ? 'success' : 'active'}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Skill Development Metrics */}
      <Card 
        title={
          <Space>
            <StarOutlined style={{ color: COLORS.purple }} />
            Skill Development Metrics
          </Space>
        }
        className="mb-4"
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <div className="mb-4">
              <Title level={5}>Patience & Trade Selectivity</Title>
              <Space direction="vertical" className="w-full">
                <Alert
                  message={patienceMessage.text}
                  type={progressPercentage >= 75 ? 'success' : 'warning'}
                  showIcon
                  icon={<HeartOutlined />}
                />
                
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="Avg Trades/Day"
                      value={performanceMetrics.averageTradesPerDay}
                      precision={1}
                      valueStyle={{ 
                        color: performanceMetrics.averageTradesPerDay <= 2 ? 
                          COLORS.success : COLORS.danger 
                      }}
                      suffix={
                        <Tooltip title="Target: 0-2 trades per day">
                          <Tag color={performanceMetrics.averageTradesPerDay <= 2 ? 'success' : 'error'}>
                            {performanceMetrics.averageTradesPerDay <= 2 ? 'On Target' : 'High'}
                          </Tag>
                        </Tooltip>
                      }
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="No-Trade Days"
                      value={performanceMetrics.noTradeDays}
                      valueStyle={{ color: COLORS.purple }}
                      suffix={
                        <Tooltip title="Days with zero trades - a sign of patience!">
                          <CrownOutlined style={{ color: COLORS.gold }} />
                        </Tooltip>
                      }
                    />
                  </Col>
                </Row>

                <div>
                  <Text strong>Patience Score Trend</Text>
                  <ResponsiveContainer width="100%" height={150}>
                    <AreaChart data={patienceTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis domain={[0, 10]} />
                      <RechartsTooltip />
                      <Area 
                        type="monotone" 
                        dataKey="patienceScore" 
                        stroke={COLORS.purple}
                        fill={COLORS.purple}
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Space>
            </div>
          </Col>

          <Col xs={24} lg={12}>
            <div className="mb-4">
              <Title level={5}>Setup Quality Distribution</Title>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={setupQualityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage.toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {setupQualityData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={SETUP_QUALITY_COLORS[entry.name as keyof typeof SETUP_QUALITY_COLORS]} 
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              <Space wrap className="mt-2">
                {setupQualityData.map((quality) => (
                  <Tag 
                    key={quality.name}
                    color={SETUP_QUALITY_COLORS[quality.name as keyof typeof SETUP_QUALITY_COLORS]}
                  >
                    {quality.name}: {quality.value} trades
                  </Tag>
                ))}
              </Space>
            </div>
          </Col>
        </Row>

        <Divider />

        {/* Skill Radar Chart */}
        <div>
          <Title level={5} className="text-center mb-4">Overall Skill Assessment</Title>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={skillMetricsData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="Skills"
                dataKey="value"
                stroke={COLORS.purple}
                fill={COLORS.purple}
                fillOpacity={0.6}
              />
              <RechartsTooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* System Adherence */}
      <Card
        title={
          <Space>
            <SafetyOutlined style={{ color: COLORS.success }} />
            System Adherence
          </Space>
        }
        className="mb-4"
      >
        <Row gutter={[16, 16]}>
          <Col xs={12} md={6}>
            <Card className="text-center">
              <FireOutlined style={{ fontSize: 24, color: COLORS.danger }} />
              <Statistic
                title="Daily Login Streak"
                value={streaks.dailyLogin}
                suffix="days"
                valueStyle={{ color: COLORS.success }}
              />
              <Progress 
                percent={100} 
                showInfo={false} 
                strokeColor={COLORS.success}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card className="text-center">
              <CheckCircleOutlined style={{ fontSize: 24, color: COLORS.success }} />
              <Statistic
                title="Task Completion"
                value={streaks.taskCompletion}
                suffix={`/ ${challenge.currentDay * 6}`}
                valueStyle={{ color: COLORS.primary }}
              />
              <Progress 
                percent={(streaks.taskCompletion / (challenge.currentDay * 6)) * 100} 
                showInfo={false}
                strokeColor={COLORS.primary}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card className="text-center">
              <SafetyOutlined style={{ fontSize: 24, color: COLORS.gold }} />
              <Statistic
                title="Risk Discipline"
                value={streaks.riskDiscipline}
                suffix="days"
                valueStyle={{ color: COLORS.purple }}
              />
              <Progress 
                percent={100} 
                showInfo={false}
                strokeColor={COLORS.purple}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card className="text-center">
              <ThunderboltOutlined style={{ fontSize: 24, color: COLORS.primary }} />
              <Statistic
                title="Strategy Adherence"
                value={performanceMetrics.strategyAdherence}
                suffix="%"
                valueStyle={{ 
                  color: performanceMetrics.strategyAdherence >= 80 ? 
                    COLORS.success : COLORS.warning 
                }}
              />
              <Progress 
                percent={performanceMetrics.strategyAdherence} 
                showInfo={false}
                strokeColor={
                  performanceMetrics.strategyAdherence >= 80 ? 
                    COLORS.success : COLORS.warning
                }
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Performance Metrics */}
      <Card
        title={
          <Space>
            <TrophyOutlined style={{ color: COLORS.gold }} />
            Performance Metrics
          </Space>
        }
        className="mb-4"
      >
        <Row gutter={[16, 16]}>
          <Col xs={12} md={8}>
            <Statistic
              title="Win Rate"
              value={performanceMetrics.winRate}
              precision={1}
              suffix="%"
              valueStyle={{ 
                color: performanceMetrics.winRate >= 50 ? COLORS.success : COLORS.danger 
              }}
            />
          </Col>
          <Col xs={12} md={8}>
            <Statistic
              title="Profit Factor"
              value={performanceMetrics.profitFactor}
              precision={2}
              valueStyle={{ 
                color: performanceMetrics.profitFactor >= 1.5 ? COLORS.success : COLORS.warning 
              }}
            />
          </Col>
          <Col xs={12} md={8}>
            <Statistic
              title="Avg Risk/Trade"
              value={performanceMetrics.averageRiskPerTrade}
              precision={1}
              suffix="%"
              valueStyle={{ 
                color: performanceMetrics.averageRiskPerTrade <= 2 ? COLORS.success : COLORS.danger 
              }}
            />
          </Col>
        </Row>

        <Divider />

        <Row gutter={[16, 16]}>
          <Col xs={12} md={6}>
            <Text strong>Best A+ Trade Example</Text>
            <Card size="small" className="mt-2" style={{ backgroundColor: '#f0f9ff' }}>
              <Space direction="vertical" size="small">
                <Text>AAPL - Breakout Trade</Text>
                <Text type="secondary">Setup Quality: A+</Text>
                <Text type="success">+$450 (2.25%)</Text>
                <Text className="text-xs">Perfect entry at support with volume confirmation</Text>
              </Space>
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Text strong>Learning from Mistakes</Text>
            <Card size="small" className="mt-2" style={{ backgroundColor: '#fff1f0' }}>
              <Space direction="vertical" size="small">
                <Text>TSLA - FOMO Trade</Text>
                <Text type="secondary">Setup Quality: F</Text>
                <Text type="danger">-$200 (1%)</Text>
                <Text className="text-xs">Chased without waiting for pullback</Text>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Next Milestones & Recommendations */}
      <Card
        title={
          <Space>
            <RiseOutlined style={{ color: COLORS.primary }} />
            Next Milestones & Recommendations
          </Space>
        }
      >
        <Space direction="vertical" size="middle" className="w-full">
          <Alert
            message="Week 2 Target"
            description={`Need +$${(15000 - challenge.currentAmount).toLocaleString()} in ${14 - challenge.currentDay} days`}
            type="info"
            showIcon
          />

          <div>
            <Title level={5}>Recommendations for Success</Title>
            <Space direction="vertical" size="small">
              {performanceMetrics.averageTradesPerDay > 2 && (
                <Alert
                  message="Reduce Trading Frequency"
                  description="You're averaging more than 2 trades per day. Focus on quality over quantity."
                  type="warning"
                  showIcon
                />
              )}
              {performanceMetrics.patienceScore < 7 && (
                <Alert
                  message="Improve Patience Score"
                  description="Wait for A+ setups only. No trades is better than bad trades."
                  type="info"
                  showIcon
                />
              )}
              {performanceMetrics.strategyAdherence < 80 && (
                <Alert
                  message="Stick to Your Strategy"
                  description="Your strategy adherence is below 80%. Review and recommit to your buy box criteria."
                  type="warning"
                  showIcon
                />
              )}
              <Alert
                message="Celebrate Your Progress!"
                description={`You've had ${performanceMetrics.noTradeDays} no-trade days showing excellent discipline!`}
                type="success"
                showIcon
              />
            </Space>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default ProgressVisualization;