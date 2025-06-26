/**
 * Trading Strategy Dashboard Component
 * 
 * Demonstrates the comprehensive Trading Strategy Database Service
 * with real-time strategy recommendations, performance tracking,
 * and Challenge RPG system integration.
 */

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Select, Spin, Alert, Progress, Tag, Typography, Divider, Statistic } from 'antd';
import { 
  TrophyOutlined, 
  FireOutlined, 
  ShieldOutlined, 
  TargetOutlined,
  ThunderboltOutlined,
  BookOutlined,
  StarOutlined
} from '@ant-design/icons';
import {
  tradingStrategyService,
  TradingStrategy,
  StrategyRecommendation,
  MarketEnvironment,
  UserProfile,
  StrategyCategory,
  RiskLevel,
  TimeHorizon,
  SkillCategory,
  StrategyPerformance
} from '../services/TradingStrategyService';
import { VolatilityRegime } from '../../../shared/services/MarketAnalysisService';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// Mock user profile for demo
const DEMO_USER_PROFILE: UserProfile = {
  userId: 'demo-user-001',
  accountSize: 25000,
  experienceLevel: 'INTERMEDIATE',
  riskTolerance: RiskLevel.MODERATE,
  timeAvailabilityMinutes: 60,
  preferredTimeframes: [TimeHorizon.SWING, TimeHorizon.DAY_TRADE],
  skillLevels: {
    [SkillCategory.PATIENCE]: 6,
    [SkillCategory.RISK_MANAGEMENT]: 7,
    [SkillCategory.SETUP_QUALITY]: 5,
    [SkillCategory.STRATEGY_ADHERENCE]: 6,
    [SkillCategory.STRESS_MANAGEMENT]: 4,
    [SkillCategory.PROFIT_PROTECTION]: 5,
    [SkillCategory.DISCIPLINE_CONTROL]: 6
  },
  tradingGoals: ['Consistent profitability', 'Risk management'],
  avoidedStrategies: [],
  preferredStrategies: [],
  challengeParticipation: true,
  currentStrategyClass: 'BUFFETT_GUARDIAN'
};

const TradingStrategyDashboard: React.FC = () => {
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [recommendations, setRecommendations] = useState<StrategyRecommendation[]>([]);
  const [marketEnvironment, setMarketEnvironment] = useState<MarketEnvironment | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<StrategyCategory | 'ALL'>('ALL');
  const [loading, setLoading] = useState(false);
  const [userProfile] = useState<UserProfile>(DEMO_USER_PROFILE);
  const [performance, setPerformance] = useState<StrategyPerformance[]>([]);

  useEffect(() => {
    loadStrategies();
    loadMarketEnvironment();
    loadRecommendations();
    loadPerformanceData();
  }, []);

  const loadStrategies = () => {
    const allStrategies = tradingStrategyService.getAllStrategies();
    setStrategies(allStrategies);
  };

  const loadMarketEnvironment = async () => {
    setLoading(true);
    try {
      const environment = await tradingStrategyService.detectMarketEnvironment();
      setMarketEnvironment(environment);
    } catch (error) {
      console.error('Error loading market environment:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    if (!marketEnvironment) return;
    
    try {
      const recs = await tradingStrategyService.getRecommendedStrategies(
        marketEnvironment,
        userProfile,
        5
      );
      setRecommendations(recs);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const loadPerformanceData = () => {
    const performanceData = tradingStrategyService.getStrategyPerformance(userProfile.userId);
    setPerformance(performanceData);
  };

  const filteredStrategies = selectedCategory === 'ALL' 
    ? strategies 
    : strategies.filter(s => s.category === selectedCategory);

  const getRiskColor = (riskLevel: RiskLevel): string => {
    switch (riskLevel) {
      case RiskLevel.VERY_LOW: return '#52c41a';
      case RiskLevel.LOW: return '#73d13d';
      case RiskLevel.MODERATE: return '#faad14';
      case RiskLevel.HIGH: return '#ff7a45';
      case RiskLevel.VERY_HIGH: return '#ff4d4f';
      default: return '#d9d9d9';
    }
  };

  const getCategoryIcon = (category: StrategyCategory) => {
    switch (category) {
      case StrategyCategory.MOMENTUM: return <ThunderboltOutlined />;
      case StrategyCategory.VALUE: return <ShieldOutlined />;
      case StrategyCategory.GROWTH: return <TrophyOutlined />;
      case StrategyCategory.SWING: return <TargetOutlined />;
      case StrategyCategory.SCALPING: return <FireOutlined />;
      case StrategyCategory.MEAN_REVERSION: return <StarOutlined />;
      default: return <BookOutlined />;
    }
  };

  const getSkillLevelColor = (level: string): string => {
    switch (level) {
      case 'BEGINNER': return '#52c41a';
      case 'INTERMEDIATE': return '#faad14';
      case 'ADVANCED': return '#ff7a45';
      case 'EXPERT': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  };

  const renderMarketEnvironment = () => {
    if (!marketEnvironment) return null;

    return (
      <Card title="Market Environment" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="Market Condition"
              value={marketEnvironment.marketCondition.replace('_', ' ')}
              prefix={<TrophyOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Volatility Regime"
              value={marketEnvironment.volatilityRegime}
              valueStyle={{ color: marketEnvironment.volatilityRegime === VolatilityRegime.HIGH ? '#cf1322' : '#3f8600' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="VIX Level"
              value={marketEnvironment.vixLevel}
              precision={1}
              suffix="%"
            />
          </Col>
        </Row>
        <Divider />
        <Row gutter={16}>
          <Col span={12}>
            <Text strong>Trend Direction: </Text>
            <Tag color={marketEnvironment.trendDirection === 'UPTREND' ? 'green' : 'red'}>
              {marketEnvironment.trendDirection}
            </Tag>
          </Col>
          <Col span={12}>
            <Text strong>Market Sentiment: </Text>
            <Tag color={marketEnvironment.marketSentiment === 'BULLISH' ? 'green' : 'orange'}>
              {marketEnvironment.marketSentiment}
            </Tag>
          </Col>
        </Row>
      </Card>
    );
  };

  const renderRecommendations = () => {
    if (recommendations.length === 0) return null;

    return (
      <Card title="🎯 Personalized Strategy Recommendations" style={{ marginBottom: 16 }}>
        {recommendations.map((rec, index) => (
          <Card
            key={rec.strategy.id}
            size="small"
            style={{ marginBottom: 12, border: '1px solid #d9d9d9' }}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  #{index + 1} {getCategoryIcon(rec.strategy.category)} {rec.strategy.name}
                </span>
                <Progress
                  type="circle"
                  size={60}
                  percent={rec.confidenceScore}
                  format={(percent) => `${percent}%`}
                  strokeColor={percent => percent! > 80 ? '#52c41a' : percent! > 60 ? '#faad14' : '#ff4d4f'}
                />
              </div>
            }
          >
            <Row gutter={16}>
              <Col span={16}>
                <Paragraph>{rec.strategy.description}</Paragraph>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Why recommended:</Text>
                  <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                    {rec.reasons.slice(0, 3).map((reason, idx) => (
                      <li key={idx}><Text type="secondary">{reason}</Text></li>
                    ))}
                  </ul>
                </div>
                {rec.warnings.length > 0 && (
                  <Alert
                    type="warning"
                    size="small"
                    message={rec.warnings.join(', ')}
                    showIcon
                  />
                )}
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Statistic
                    title="XP Potential"
                    value={rec.xpPotential}
                    prefix={<StarOutlined />}
                    valueStyle={{ color: '#faad14' }}
                  />
                  <Divider />
                  <Tag color={getRiskColor(rec.strategy.riskLevel)}>
                    {rec.strategy.riskLevel.replace('_', ' ')}
                  </Tag>
                  <Tag color={getSkillLevelColor(rec.strategy.skillLevel)}>
                    {rec.strategy.skillLevel}
                  </Tag>
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">
                      Min. Account: ${rec.strategy.minAccountSize.toLocaleString()}
                    </Text>
                  </div>
                  <div>
                    <Text type="secondary">
                      Time: {rec.strategy.timeCommitmentMinutes}min/day
                    </Text>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        ))}
      </Card>
    );
  };

  const renderStrategyGrid = () => {
    return (
      <Card 
        title="📚 Strategy Database" 
        extra={
          <Select
            value={selectedCategory}
            onChange={setSelectedCategory}
            style={{ width: 150 }}
          >
            <Option value="ALL">All Categories</Option>
            {Object.values(StrategyCategory).map(cat => (
              <Option key={cat} value={cat}>
                {getCategoryIcon(cat)} {cat}
              </Option>
            ))}
          </Select>
        }
      >
        <Row gutter={16}>
          {filteredStrategies.map(strategy => (
            <Col key={strategy.id} span={8} style={{ marginBottom: 16 }}>
              <Card
                size="small"
                hoverable
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {getCategoryIcon(strategy.category)}
                    <Text strong>{strategy.name}</Text>
                    {strategy.isCustom && <Tag color="purple">Custom</Tag>}
                  </div>
                }
                extra={
                  <Tag color={getSkillLevelColor(strategy.skillLevel)}>
                    {strategy.skillLevel}
                  </Tag>
                }
              >
                <Paragraph ellipsis={{ rows: 2 }}>{strategy.description}</Paragraph>
                
                <Row gutter={8} style={{ marginBottom: 8 }}>
                  <Col span={12}>
                    <Text type="secondary">Win Rate:</Text>
                    <div><Text strong>{strategy.winRateEstimate}%</Text></div>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">Profit Factor:</Text>
                    <div><Text strong>{strategy.profitFactor}</Text></div>
                  </Col>
                </Row>

                <Row gutter={8} style={{ marginBottom: 8 }}>
                  <Col span={12}>
                    <Text type="secondary">Risk Level:</Text>
                    <div>
                      <Tag size="small" color={getRiskColor(strategy.riskLevel)}>
                        {strategy.riskLevel.replace('_', ' ')}
                      </Tag>
                    </div>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">Time Horizon:</Text>
                    <div><Text>{strategy.timeHorizon.replace('_', ' ')}</Text></div>
                  </Col>
                </Row>

                <Row gutter={8}>
                  <Col span={12}>
                    <Text type="secondary">Min Account:</Text>
                    <div><Text>${strategy.minAccountSize.toLocaleString()}</Text></div>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">XP Multiplier:</Text>
                    <div><Text strong style={{ color: '#faad14' }}>{strategy.xpMultiplier}x</Text></div>
                  </Col>
                </Row>

                <Divider style={{ margin: '8px 0' }} />
                
                <div>
                  <Text type="secondary">Skills: </Text>
                  {strategy.skillCategories.slice(0, 2).map(skill => (
                    <Tag key={skill} size="small">{skill.replace('_', ' ')}</Tag>
                  ))}
                  {strategy.skillCategories.length > 2 && (
                    <Tag size="small">+{strategy.skillCategories.length - 2} more</Tag>
                  )}
                </div>

                {strategy.educationalContent && (
                  <div style={{ marginTop: 8 }}>
                    <Button size="small" icon={<BookOutlined />}>
                      Learn More
                    </Button>
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    );
  };

  const renderPerformanceOverview = () => {
    if (performance.length === 0) return null;

    const totalTrades = performance.reduce((sum, p) => sum + p.totalTrades, 0);
    const totalPnL = performance.reduce((sum, p) => sum + p.totalPnL, 0);
    const avgWinRate = performance.reduce((sum, p) => sum + p.winRate, 0) / performance.length;

    return (
      <Card title="📊 Performance Overview" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="Total Trades"
              value={totalTrades}
              prefix={<TargetOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Total P&L"
              value={totalPnL}
              precision={2}
              prefix="$"
              valueStyle={{ color: totalPnL >= 0 ? '#3f8600' : '#cf1322' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Average Win Rate"
              value={avgWinRate}
              precision={1}
              suffix="%"
              valueStyle={{ color: avgWinRate >= 50 ? '#3f8600' : '#faad14' }}
            />
          </Col>
        </Row>
      </Card>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Loading trading strategies...</Text>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>🎯 Trading Strategy Command Center</Title>
      <Paragraph>
        Comprehensive strategy database with AI-powered recommendations, 
        performance tracking, and Challenge RPG integration.
      </Paragraph>

      {renderMarketEnvironment()}
      {renderPerformanceOverview()}
      {renderRecommendations()}
      {renderStrategyGrid()}

      <Card style={{ marginTop: 16 }} bodyStyle={{ textAlign: 'center' }}>
        <Title level={4}>🚀 Ready to Level Up Your Trading?</Title>
        <Paragraph>
          Choose a strategy, start trading, and earn XP as you master the markets!
          Join the Challenge RPG system for additional rewards and progression tracking.
        </Paragraph>
        <Button type="primary" size="large" icon={<TrophyOutlined />}>
          Start Trading Challenge
        </Button>
      </Card>
    </div>
  );
};

export default TradingStrategyDashboard;