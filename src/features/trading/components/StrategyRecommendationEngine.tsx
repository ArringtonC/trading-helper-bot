/**
 * Strategy Recommendation Engine - Component 4
 * 
 * Professional trading strategy recommendation system with real-time market analysis,
 * personalized user profiling, and Challenge RPG integration.
 * 
 * Features:
 * - Real-time market condition monitoring (VIX, volatility, trend, sentiment)
 * - Intelligent strategy matching based on user profile and market conditions
 * - Interactive strategy cards with confidence scores and educational content
 * - Challenge system XP rewards and progression tracking
 * - Performance comparison and strategy filtering
 * - Mobile-responsive design with professional styling
 * 
 * @author Claude Code
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './StrategyRecommendationEngine.css';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Tag,
  Progress,
  Statistic,
  Select,
  Slider,
  Input,
  Switch,
  Badge,
  Alert,
  Tabs,
  Table,
  Tooltip,
  Modal,
  Form,
  Radio,
  InputNumber,
  Divider,
  Avatar,
  List,
  Empty,
  Spin,
  notification
} from 'antd';
import {
  TrophyOutlined,
  FireOutlined,
  RiseOutlined,
  FallOutlined,
  ThunderboltOutlined,
  AimOutlined,
  StarOutlined,
  BulbOutlined,
  SettingOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  InfoCircleOutlined,
  PlayCircleOutlined,
  BookOutlined,
  BarChartOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  LineChartOutlined,
  AlertOutlined,
  SmileOutlined,
  MehOutlined,
  FrownOutlined
} from '@ant-design/icons';
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
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  TradingStrategyService,
  tradingStrategyService,
  TradingStrategy,
  StrategyRecommendation,
  MarketEnvironment,
  UserProfile,
  StrategyPerformance,
  EstimatedPerformance,
  StrategyCategory,
  RiskLevel,
  TimeHorizon,
  MarketCondition,
  SkillCategory
} from '../services/TradingStrategyService';
import { VolatilityRegime } from '../../../shared/services/MarketAnalysisService';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

// ===== Component Props =====

interface StrategyRecommendationEngineProps {
  userId?: string;
  className?: string;
  showMarketDashboard?: boolean;
  showUserProfile?: boolean;
  showPerformanceComparison?: boolean;
  maxRecommendations?: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
  onStrategySelected?: (strategy: TradingStrategy) => void;
  onXPEarned?: (amount: number, source: string) => void;
}

// ===== Market Data Types =====

interface MarketDataPoint {
  timestamp: string;
  vix: number;
  spyPrice: number;
  volume: number;
  sentiment: number;
}

interface VolatilityMetrics {
  current: number;
  average: number;
  percentile: number;
  trend: 'RISING' | 'FALLING' | 'STABLE';
}

// ===== Filter and Sort Types =====

interface FilterOptions {
  categories: StrategyCategory[];
  riskLevels: RiskLevel[];
  timeHorizons: TimeHorizon[];
  skillLevels: string[];
  minConfidence: number;
  maxComplexity: number;
  availableTimeOnly: boolean;
  accountSizeOnly: boolean;
}

type SortOption = 'confidence' | 'xp-potential' | 'difficulty' | 'win-rate' | 'risk-reward';
type SortDirection = 'asc' | 'desc';

// ===== Main Component =====

const StrategyRecommendationEngine: React.FC<StrategyRecommendationEngineProps> = ({
  userId = 'default-user',
  className,
  showMarketDashboard = true,
  showUserProfile = true,
  showPerformanceComparison = true,
  maxRecommendations = 8,
  autoRefresh = true,
  refreshInterval = 60000, // 1 minute
  onStrategySelected,
  onXPEarned
}) => {
  // ===== State Management =====
  
  const [loading, setLoading] = useState(false);
  const [marketEnvironment, setMarketEnvironment] = useState<MarketEnvironment | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [recommendations, setRecommendations] = useState<StrategyRecommendation[]>([]);
  const [allStrategies, setAllStrategies] = useState<TradingStrategy[]>([]);
  const [userPerformance, setUserPerformance] = useState<StrategyPerformance[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<TradingStrategy | null>(null);
  const [activeTab, setActiveTab] = useState('recommendations');
  
  // Market Data State
  const [marketData, setMarketData] = useState<MarketDataPoint[]>([]);
  const [volatilityMetrics, setVolatilityMetrics] = useState<VolatilityMetrics | null>(null);
  
  // Filter and Sort State
  const [filters, setFilters] = useState<FilterOptions>({
    categories: [],
    riskLevels: [],
    timeHorizons: [],
    skillLevels: [],
    minConfidence: 30,
    maxComplexity: 10,
    availableTimeOnly: false,
    accountSizeOnly: false
  });
  const [sortBy, setSortBy] = useState<SortOption>('confidence');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // UI State
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [strategyDetailModalVisible, setStrategyDetailModalVisible] = useState(false);
  const [performanceModalVisible, setPerformanceModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ===== Data Loading and Refresh =====

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      // Load market environment
      const environment = await tradingStrategyService.detectMarketEnvironment();
      setMarketEnvironment(environment);

      // Load all strategies
      const strategies = tradingStrategyService.getAllStrategies();
      setAllStrategies(strategies);

      // Initialize or load user profile
      const profile = await initializeUserProfile();
      setUserProfile(profile);

      // Load user performance data
      const performance = tradingStrategyService.getStrategyPerformance(userId);
      setUserPerformance(performance);

      // Generate mock market data
      const mockMarketData = generateMockMarketData();
      setMarketData(mockMarketData);

      // Calculate volatility metrics
      const volMetrics = calculateVolatilityMetrics(mockMarketData);
      setVolatilityMetrics(volMetrics);

      // Get recommendations
      if (profile && environment) {
        await refreshRecommendations(environment, profile);
      }

    } catch (error) {
      console.error('Error loading initial data:', error);
      notification.error({
        message: 'Data Loading Error',
        description: 'Failed to load market data and recommendations. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const refreshRecommendations = useCallback(async (
    environment?: MarketEnvironment, 
    profile?: UserProfile
  ) => {
    if (!environment && !marketEnvironment) return;
    if (!profile && !userProfile) return;

    setRefreshing(true);
    try {
      const recs = await tradingStrategyService.getRecommendedStrategies(
        environment || marketEnvironment!,
        profile || userProfile!,
        maxRecommendations
      );
      setRecommendations(recs);
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
      notification.error({
        message: 'Recommendation Error',
        description: 'Failed to update strategy recommendations.',
      });
    } finally {
      setRefreshing(false);
    }
  }, [marketEnvironment, userProfile, maxRecommendations]);

  const initializeUserProfile = async (): Promise<UserProfile> => {
    // In a real app, this would load from database/API
    // For now, return a default profile that can be customized
    return {
      userId,
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
        [SkillCategory.STRESS_MANAGEMENT]: 5,
        [SkillCategory.PROFIT_PROTECTION]: 6,
        [SkillCategory.DISCIPLINE_CONTROL]: 7
      },
      tradingGoals: ['Consistent Profits', 'Risk Management', 'Skill Development'],
      avoidedStrategies: [],
      preferredStrategies: [],
      challengeParticipation: true,
      currentStrategyClass: 'DALIO_WARRIOR'
    };
  };

  // ===== Mock Data Generation =====

  const generateMockMarketData = (): MarketDataPoint[] => {
    const data: MarketDataPoint[] = [];
    const now = new Date();
    
    for (let i = 30; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      data.push({
        timestamp: timestamp.toISOString().split('T')[0],
        vix: 15 + Math.random() * 20 + Math.sin(i * 0.1) * 5,
        spyPrice: 450 + Math.random() * 30 + Math.sin(i * 0.05) * 10,
        volume: 80000000 + Math.random() * 40000000,
        sentiment: 0.3 + Math.random() * 0.4 + Math.sin(i * 0.15) * 0.2
      });
    }
    
    return data;
  };

  const calculateVolatilityMetrics = (data: MarketDataPoint[]): VolatilityMetrics => {
    if (data.length === 0) {
      return { current: 0, average: 0, percentile: 0, trend: 'STABLE' };
    }

    const vixValues = data.map(d => d.vix);
    const current = vixValues[vixValues.length - 1];
    const average = vixValues.reduce((sum, val) => sum + val, 0) / vixValues.length;
    
    // Calculate percentile (simplified)
    const sorted = [...vixValues].sort((a, b) => a - b);
    const percentile = (sorted.indexOf(current) / sorted.length) * 100;
    
    // Determine trend
    const recent = vixValues.slice(-5);
    const earlier = vixValues.slice(-10, -5);
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, val) => sum + val, 0) / earlier.length;
    
    let trend: 'RISING' | 'FALLING' | 'STABLE' = 'STABLE';
    const diff = recentAvg - earlierAvg;
    if (Math.abs(diff) > 1) {
      trend = diff > 0 ? 'RISING' : 'FALLING';
    }

    return { current, average, percentile, trend };
  };

  // ===== Filtering and Sorting =====

  const filteredAndSortedRecommendations = useMemo(() => {
    let filtered = [...recommendations];

    // Apply filters
    if (filters.categories.length > 0) {
      filtered = filtered.filter(rec => 
        filters.categories.includes(rec.strategy.category)
      );
    }

    if (filters.riskLevels.length > 0) {
      filtered = filtered.filter(rec => 
        filters.riskLevels.includes(rec.strategy.riskLevel)
      );
    }

    if (filters.timeHorizons.length > 0) {
      filtered = filtered.filter(rec => 
        filters.timeHorizons.includes(rec.strategy.timeHorizon)
      );
    }

    if (filters.skillLevels.length > 0) {
      filtered = filtered.filter(rec => 
        filters.skillLevels.includes(rec.strategy.skillLevel)
      );
    }

    filtered = filtered.filter(rec => 
      rec.confidenceScore >= filters.minConfidence
    );

    if (filters.maxComplexity < 10) {
      filtered = filtered.filter(rec => 
        rec.strategy.difficultyRating <= filters.maxComplexity
      );
    }

    if (filters.availableTimeOnly && userProfile) {
      filtered = filtered.filter(rec => 
        rec.strategy.timeCommitmentMinutes <= userProfile.timeAvailabilityMinutes
      );
    }

    if (filters.accountSizeOnly && userProfile) {
      filtered = filtered.filter(rec => 
        rec.strategy.minAccountSize <= userProfile.accountSize
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'confidence':
          comparison = a.confidenceScore - b.confidenceScore;
          break;
        case 'xp-potential':
          comparison = a.xpPotential - b.xpPotential;
          break;
        case 'difficulty':
          comparison = a.strategy.difficultyRating - b.strategy.difficultyRating;
          break;
        case 'win-rate':
          comparison = a.estimatedPerformance.expectedWinRate - b.estimatedPerformance.expectedWinRate;
          break;
        case 'risk-reward':
          comparison = a.estimatedPerformance.expectedProfitFactor - b.estimatedPerformance.expectedProfitFactor;
          break;
        default:
          comparison = a.confidenceScore - b.confidenceScore;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [recommendations, filters, sortBy, sortDirection, userProfile]);

  // ===== Event Handlers =====

  const handleStrategySelect = (strategy: TradingStrategy) => {
    setSelectedStrategy(strategy);
    setStrategyDetailModalVisible(true);
    onStrategySelected?.(strategy);
  };

  const handleTryStrategy = (recommendation: StrategyRecommendation) => {
    // Award XP for trying new strategy
    const xpAmount = Math.floor(recommendation.xpPotential * 0.1); // 10% of potential XP for trying
    onXPEarned?.(xpAmount, `Trying Strategy: ${recommendation.strategy.name}`);
    
    notification.success({
      message: 'Strategy Started!',
      description: `You've started using ${recommendation.strategy.name}. Earned ${xpAmount} XP!`,
      icon: <TrophyOutlined style={{ color: '#52c41a' }} />
    });

    onStrategySelected?.(recommendation.strategy);
  };

  const handleProfileUpdate = (values: any) => {
    if (!userProfile) return;

    const updatedProfile: UserProfile = {
      ...userProfile,
      ...values,
      skillLevels: {
        ...userProfile.skillLevels,
        ...values.skillLevels
      }
    };

    setUserProfile(updatedProfile);
    setProfileModalVisible(false);
    
    // Refresh recommendations with new profile
    if (marketEnvironment) {
      refreshRecommendations(marketEnvironment, updatedProfile);
    }

    notification.success({
      message: 'Profile Updated',
      description: 'Your trading profile has been updated. Recommendations refreshed!',
    });
  };

  // ===== Auto Refresh Setup =====

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (marketEnvironment && userProfile) {
        refreshRecommendations();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshRecommendations, marketEnvironment, userProfile]);

  // ===== Render Market Dashboard =====

  const renderMarketDashboard = () => {
    if (!showMarketDashboard || !marketEnvironment || !volatilityMetrics) return null;

    const getSentimentIcon = (sentiment: string) => {
      switch (sentiment) {
        case 'BULLISH': return <SmileOutlined style={{ color: '#52c41a' }} />;
        case 'BEARISH': return <FrownOutlined style={{ color: '#ff4d4f' }} />;
        default: return <MehOutlined style={{ color: '#faad14' }} />;
      }
    };

    const getTrendIcon = (trend: string) => {
      switch (trend) {
        case 'UPTREND': return <RiseOutlined style={{ color: '#52c41a' }} />;
        case 'DOWNTREND': return <FallOutlined style={{ color: '#ff4d4f' }} />;
        default: return <LineChartOutlined style={{ color: '#1890ff' }} />;
      }
    };

    const getVolatilityColor = (vix: number) => {
      if (vix < 20) return '#52c41a';
      if (vix < 30) return '#faad14';
      return '#ff4d4f';
    };

    return (
      <Card 
        title={
          <Space>
            <BarChartOutlined />
            <span>Market Environment</span>
            <Badge 
              status={refreshing ? 'processing' : 'success'} 
              text={refreshing ? 'Updating...' : 'Live'} 
            />
          </Space>
        }
        className="mb-4"
        extra={
          <Button 
            type="text" 
            icon={<ThunderboltOutlined />}
            loading={refreshing}
            onClick={() => refreshRecommendations()}
          >
            Refresh
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="VIX (Fear Index)"
              value={volatilityMetrics.current.toFixed(1)}
              precision={1}
              valueStyle={{ color: getVolatilityColor(volatilityMetrics.current) }}
              prefix={<AlertOutlined />}
              suffix={
                <Tag color={volatilityMetrics.trend === 'RISING' ? 'red' : 
                           volatilityMetrics.trend === 'FALLING' ? 'green' : 'blue'}>
                  {volatilityMetrics.trend}
                </Tag>
              }
            />
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Market Trend"
              value={marketEnvironment.trendDirection}
              prefix={getTrendIcon(marketEnvironment.trendDirection)}
              valueStyle={{ 
                color: marketEnvironment.trendDirection === 'UPTREND' ? '#52c41a' : 
                       marketEnvironment.trendDirection === 'DOWNTREND' ? '#ff4d4f' : '#1890ff'
              }}
            />
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Market Sentiment"
              value={marketEnvironment.marketSentiment}
              prefix={getSentimentIcon(marketEnvironment.marketSentiment)}
              valueStyle={{ 
                color: marketEnvironment.marketSentiment === 'BULLISH' ? '#52c41a' : 
                       marketEnvironment.marketSentiment === 'BEARISH' ? '#ff4d4f' : '#faad14'
              }}
            />
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Volatility Regime"
              value={marketEnvironment.volatilityRegime}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ 
                color: marketEnvironment.volatilityRegime === VolatilityRegime.HIGH ? '#ff4d4f' : 
                       marketEnvironment.volatilityRegime === VolatilityRegime.LOW ? '#52c41a' : '#faad14'
              }}
            />
          </Col>
        </Row>

        {/* Market Chart */}
        <div className="mt-4" style={{ height: '200px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={marketData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: number, name: string) => [
                  typeof value === 'number' ? value.toFixed(2) : value,
                  name === 'vix' ? 'VIX' : name === 'sentiment' ? 'Sentiment' : name
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="vix" 
                stroke="#ff4d4f" 
                fill="#ff4d4f" 
                fillOpacity={0.3}
                name="VIX"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Market Alerts */}
        {marketEnvironment.vixLevel > 25 && (
          <Alert
            message="High Volatility Alert"
            description="VIX is elevated. Consider defensive strategies and tighter risk management."
            type="warning"
            icon={<ExclamationCircleOutlined />}
            className="mt-3"
          />
        )}

        {marketEnvironment.marketCondition === MarketCondition.BEAR_MARKET && (
          <Alert
            message="Bear Market Conditions"
            description="Consider value strategies and defensive positioning."
            type="error"
            icon={<FallOutlined />}
            className="mt-3"
          />
        )}
      </Card>
    );
  };

  // ===== Render User Profile Section =====

  const renderUserProfileSection = () => {
    if (!showUserProfile || !userProfile) return null;

    const skillData = Object.entries(userProfile.skillLevels).map(([skill, level]) => ({
      skill: skill.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      level,
      fullMark: 10
    }));

    return (
      <Card 
        title={
          <Space>
            <SettingOutlined />
            <span>Trading Profile</span>
          </Space>
        }
        className="mb-4"
        extra={
          <Button 
            type="primary" 
            icon={<SettingOutlined />}
            onClick={() => setProfileModalVisible(true)}
          >
            Edit Profile
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>Account Size: </Text>
                <Text>${userProfile.accountSize.toLocaleString()}</Text>
              </div>
              <div>
                <Text strong>Experience Level: </Text>
                <Tag color="blue">{userProfile.experienceLevel}</Tag>
              </div>
              <div>
                <Text strong>Risk Tolerance: </Text>
                <Tag color={
                  userProfile.riskTolerance === RiskLevel.VERY_LOW ? 'green' :
                  userProfile.riskTolerance === RiskLevel.LOW ? 'lime' :
                  userProfile.riskTolerance === RiskLevel.MODERATE ? 'orange' :
                  userProfile.riskTolerance === RiskLevel.HIGH ? 'red' : 'purple'
                }>
                  {userProfile.riskTolerance.replace('_', ' ')}
                </Tag>
              </div>
              <div>
                <Text strong>Daily Time Available: </Text>
                <Text>{userProfile.timeAvailabilityMinutes} minutes</Text>
              </div>
              <div>
                <Text strong>Strategy Class: </Text>
                <Tag color="gold">{userProfile.currentStrategyClass?.replace('_', ' ') || 'None'}</Tag>
              </div>
            </Space>
          </Col>
          
          <Col xs={24} md={12}>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={skillData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 8 }} />
                  <Radar
                    name="Skill Level"
                    dataKey="level"
                    stroke="#1890ff"
                    fill="#1890ff"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Col>
        </Row>
      </Card>
    );
  };

  // ===== Render Strategy Recommendations =====

  const renderStrategyCard = (recommendation: StrategyRecommendation) => {
    const { strategy, confidenceScore, reasons, warnings, estimatedPerformance, xpPotential } = recommendation;
    
    const getRiskColor = (riskLevel: RiskLevel) => {
      switch (riskLevel) {
        case RiskLevel.VERY_LOW: return '#52c41a';
        case RiskLevel.LOW: return '#73d13d';
        case RiskLevel.MODERATE: return '#faad14';
        case RiskLevel.HIGH: return '#ff7a45';
        case RiskLevel.VERY_HIGH: return '#ff4d4f';
        default: return '#1890ff';
      }
    };

    const getConfidenceColor = (score: number) => {
      if (score >= 80) return '#52c41a';
      if (score >= 60) return '#faad14';
      return '#ff4d4f';
    };

    return (
      <Card
        key={strategy.id}
        className="strategy-card mb-3"
        bodyStyle={{ padding: '16px' }}
        hoverable
        actions={[
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<InfoCircleOutlined />}
              onClick={() => handleStrategySelect(strategy)}
            >
              Details
            </Button>
          </Tooltip>,
          <Tooltip title="Try This Strategy">
            <Button 
              type="primary" 
              icon={<PlayCircleOutlined />}
              onClick={() => handleTryStrategy(recommendation)}
            >
              Try Strategy
            </Button>
          </Tooltip>,
          strategy.educationalContent && (
            <Tooltip title="Learn More">
              <Button 
                type="text" 
                icon={<BookOutlined />}
                onClick={() => {
                  setSelectedStrategy(strategy);
                  setStrategyDetailModalVisible(true);
                }}
              >
                Learn
              </Button>
            </Tooltip>
          )
        ].filter(Boolean)}
      >
        <div className="strategy-card-header mb-3">
          <div className="flex items-center justify-between">
            <div>
              <Title level={4} className="mb-1">{strategy.name}</Title>
              <Tag color="blue">{strategy.category.replace('_', ' ')}</Tag>
              <Tag color={getRiskColor(strategy.riskLevel)}>
                {strategy.riskLevel.replace('_', ' ')} Risk
              </Tag>
              <Tag color="purple">{strategy.timeHorizon.replace('_', ' ')}</Tag>
            </div>
            <div className="text-right">
              <div className="mb-1">
                <Text strong style={{ color: getConfidenceColor(confidenceScore) }}>
                  {confidenceScore}% Match
                </Text>
              </div>
              <Progress 
                percent={confidenceScore} 
                size="small" 
                strokeColor={getConfidenceColor(confidenceScore)}
                showInfo={false}
              />
            </div>
          </div>
        </div>

        <Paragraph className="mb-3 text-gray-600">
          {strategy.description}
        </Paragraph>

        <Row gutter={16} className="mb-3">
          <Col span={8}>
            <Statistic
              title="Win Rate"
              value={estimatedPerformance.expectedWinRate}
              precision={0}
              suffix="%"
              valueStyle={{ fontSize: 16 }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Profit Factor"
              value={estimatedPerformance.expectedProfitFactor}
              precision={1}
              valueStyle={{ fontSize: 16 }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="XP Potential"
              value={xpPotential}
              suffix="XP"
              prefix={<TrophyOutlined />}
              valueStyle={{ fontSize: 16, color: '#faad14' }}
            />
          </Col>
        </Row>

        <Row gutter={16} className="mb-3">
          <Col span={12}>
            <div className="text-sm">
              <Text type="secondary">Min Account: </Text>
              <Text>${strategy.minAccountSize.toLocaleString()}</Text>
            </div>
          </Col>
          <Col span={12}>
            <div className="text-sm">
              <Text type="secondary">Time Needed: </Text>
              <Text>{strategy.timeCommitmentMinutes}min/day</Text>
            </div>
          </Col>
        </Row>

        <div className="mb-3">
          <div className="flex items-center mb-2">
            <CheckCircleOutlined className="text-green-500 mr-2" />
            <Text strong>Why It's Recommended:</Text>
          </div>
          <ul className="pl-4 text-sm">
            {reasons.slice(0, 2).map((reason, index) => (
              <li key={index} className="text-green-600">{reason}</li>
            ))}
          </ul>
        </div>

        {warnings.length > 0 && (
          <div>
            <div className="flex items-center mb-2">
              <ExclamationCircleOutlined className="text-yellow-500 mr-2" />
              <Text strong>Considerations:</Text>
            </div>
            <ul className="pl-4 text-sm">
              {warnings.slice(0, 2).map((warning, index) => (
                <li key={index} className="text-yellow-600">{warning}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    );
  };

  // ===== Render Filter Controls =====

  const renderFilterControls = () => (
    <Card title={<Space><FilterOutlined />Filters</Space>} className="mb-4">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <div className="mb-3">
            <Text strong>Categories:</Text>
            <Select
              mode="multiple"
              placeholder="Select categories"
              style={{ width: '100%', marginTop: 4 }}
              value={filters.categories}
              onChange={(values) => setFilters(prev => ({ ...prev, categories: values }))}
            >
              {Object.values(StrategyCategory).map(cat => (
                <Option key={cat} value={cat}>{cat.replace('_', ' ')}</Option>
              ))}
            </Select>
          </div>
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <div className="mb-3">
            <Text strong>Risk Levels:</Text>
            <Select
              mode="multiple"
              placeholder="Select risk levels"
              style={{ width: '100%', marginTop: 4 }}
              value={filters.riskLevels}
              onChange={(values) => setFilters(prev => ({ ...prev, riskLevels: values }))}
            >
              {Object.values(RiskLevel).map(risk => (
                <Option key={risk} value={risk}>{risk.replace('_', ' ')}</Option>
              ))}
            </Select>
          </div>
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <div className="mb-3">
            <Text strong>Time Horizons:</Text>
            <Select
              mode="multiple"
              placeholder="Select time frames"
              style={{ width: '100%', marginTop: 4 }}
              value={filters.timeHorizons}
              onChange={(values) => setFilters(prev => ({ ...prev, timeHorizons: values }))}
            >
              {Object.values(TimeHorizon).map(time => (
                <Option key={time} value={time}>{time.replace('_', ' ')}</Option>
              ))}
            </Select>
          </div>
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <div className="mb-3">
            <Text strong>Min Confidence: {filters.minConfidence}%</Text>
            <Slider
              min={0}
              max={100}
              value={filters.minConfidence}
              onChange={(value) => setFilters(prev => ({ ...prev, minConfidence: value }))}
              className="mt-2"
            />
          </div>
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <div className="mb-3">
            <Text strong>Max Complexity: {filters.maxComplexity}/10</Text>
            <Slider
              min={1}
              max={10}
              value={filters.maxComplexity}
              onChange={(value) => setFilters(prev => ({ ...prev, maxComplexity: value }))}
              className="mt-2"
            />
          </div>
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <Space direction="vertical">
            <div>
              <Switch
                checked={filters.availableTimeOnly}
                onChange={(checked) => setFilters(prev => ({ ...prev, availableTimeOnly: checked }))}
              />
              <Text className="ml-2">Match Available Time</Text>
            </div>
            <div>
              <Switch
                checked={filters.accountSizeOnly}
                onChange={(checked) => setFilters(prev => ({ ...prev, accountSizeOnly: checked }))}
              />
              <Text className="ml-2">Match Account Size</Text>
            </div>
          </Space>
        </Col>
      </Row>
      
      <div className="mt-3">
        <Space>
          <Text strong>Sort by:</Text>
          <Select
            value={sortBy}
            onChange={setSortBy}
            style={{ width: 150 }}
          >
            <Option value="confidence">Confidence</Option>
            <Option value="xp-potential">XP Potential</Option>
            <Option value="difficulty">Difficulty</Option>
            <Option value="win-rate">Win Rate</Option>
            <Option value="risk-reward">Risk/Reward</Option>
          </Select>
          
          <Button
            icon={<SortAscendingOutlined />}
            onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
          >
            {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
          </Button>
          
          <Button 
            onClick={() => setFilters({
              categories: [],
              riskLevels: [],
              timeHorizons: [],
              skillLevels: [],
              minConfidence: 30,
              maxComplexity: 10,
              availableTimeOnly: false,
              accountSizeOnly: false
            })}
          >
            Clear Filters
          </Button>
        </Space>
      </div>
    </Card>
  );

  // ===== Render Performance Comparison =====

  const renderPerformanceComparison = () => {
    if (!showPerformanceComparison || userPerformance.length === 0) return null;

    const performanceData = userPerformance.map(perf => {
      const strategy = allStrategies.find(s => s.id === perf.strategyId);
      return {
        name: strategy?.name || perf.strategyId,
        winRate: perf.winRate,
        profitFactor: perf.profitFactor,
        totalTrades: perf.totalTrades,
        totalPnL: perf.totalPnL,
        xpEarned: perf.totalXPEarned
      };
    });

    return (
      <Card 
        title={<Space><BarChartOutlined />Performance History</Space>}
        className="mb-4"
      >
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <RechartsTooltip />
              <Bar dataKey="winRate" fill="#52c41a" name="Win Rate %" />
              <Bar dataKey="profitFactor" fill="#1890ff" name="Profit Factor" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    );
  };

  // ===== Render Profile Modal =====

  const renderProfileModal = () => {
    if (!userProfile) return null;

    return (
      <Modal
        title="Edit Trading Profile"
        visible={profileModalVisible}
        onCancel={() => setProfileModalVisible(false)}
        width={600}
        footer={null}
      >
        <Form
          layout="vertical"
          initialValues={userProfile}
          onFinish={handleProfileUpdate}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Account Size"
                name="accountSize"
                rules={[{ required: true, message: 'Please enter account size' }]}
              >
                <InputNumber
                  min={1000}
                  max={10000000}
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\$\s?|(,*)/g, '') as any}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                label="Daily Time Available (minutes)"
                name="timeAvailabilityMinutes"
                rules={[{ required: true, message: 'Please enter time availability' }]}
              >
                <InputNumber min={15} max={480} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Experience Level"
                name="experienceLevel"
                rules={[{ required: true, message: 'Please select experience level' }]}
              >
                <Radio.Group>
                  <Radio value="BEGINNER">Beginner</Radio>
                  <Radio value="INTERMEDIATE">Intermediate</Radio>
                  <Radio value="ADVANCED">Advanced</Radio>
                  <Radio value="EXPERT">Expert</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                label="Risk Tolerance"
                name="riskTolerance"
                rules={[{ required: true, message: 'Please select risk tolerance' }]}
              >
                <Select>
                  {Object.values(RiskLevel).map(risk => (
                    <Option key={risk} value={risk}>
                      {risk.replace('_', ' ')}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item label="Trading Goals">
            <Form.Item name="tradingGoals" noStyle>
              <Select mode="tags" placeholder="Enter your trading goals">
                <Option value="Consistent Profits">Consistent Profits</Option>
                <Option value="Risk Management">Risk Management</Option>
                <Option value="Skill Development">Skill Development</Option>
                <Option value="Portfolio Growth">Portfolio Growth</Option>
                <Option value="Income Generation">Income Generation</Option>
              </Select>
            </Form.Item>
          </Form.Item>
          
          <Divider>Skill Levels (1-10)</Divider>
          
          {Object.entries(userProfile.skillLevels).map(([skill, level]) => (
            <Form.Item
              key={skill}
              label={skill.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
              name={['skillLevels', skill]}
            >
              <Slider min={1} max={10} marks={{ 1: '1', 5: '5', 10: '10' }} />
            </Form.Item>
          ))}
          
          <Form.Item className="mt-6">
            <Space>
              <Button type="primary" htmlType="submit">
                Update Profile
              </Button>
              <Button onClick={() => setProfileModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    );
  };

  // ===== Render Strategy Detail Modal =====

  const renderStrategyDetailModal = () => {
    if (!selectedStrategy) return null;

    return (
      <Modal
        title={selectedStrategy.name}
        visible={strategyDetailModalVisible}
        onCancel={() => {
          setStrategyDetailModalVisible(false);
          setSelectedStrategy(null);
        }}
        width={800}
        footer={[
          <Button key="close" onClick={() => setStrategyDetailModalVisible(false)}>
            Close
          </Button>,
          <Button 
            key="try" 
            type="primary" 
            icon={<PlayCircleOutlined />}
            onClick={() => {
              const rec = recommendations.find(r => r.strategy.id === selectedStrategy.id);
              if (rec) handleTryStrategy(rec);
              setStrategyDetailModalVisible(false);
            }}
          >
            Try This Strategy
          </Button>
        ]}
      >
        <div>
          <Paragraph>{selectedStrategy.description}</Paragraph>
          
          <Row gutter={16} className="mb-4">
            <Col span={8}>
              <Statistic
                title="Estimated Win Rate"
                value={selectedStrategy.winRateEstimate}
                suffix="%"
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Profit Factor"
                value={selectedStrategy.profitFactor}
                precision={1}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Difficulty"
                value={`${selectedStrategy.difficultyRating}/10`}
              />
            </Col>
          </Row>
          
          <Tabs defaultActiveKey="overview">
            <TabPane tab="Overview" key="overview">
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Text strong>Category: </Text>
                  <Tag color="blue">{selectedStrategy.category.replace('_', ' ')}</Tag>
                </div>
                <div>
                  <Text strong>Risk Level: </Text>
                  <Tag color="orange">{selectedStrategy.riskLevel.replace('_', ' ')}</Tag>
                </div>
                <div>
                  <Text strong>Time Horizon: </Text>
                  <Tag color="purple">{selectedStrategy.timeHorizon.replace('_', ' ')}</Tag>
                </div>
                <div>
                  <Text strong>Minimum Account Size: </Text>
                  <Text>${selectedStrategy.minAccountSize.toLocaleString()}</Text>
                </div>
                <div>
                  <Text strong>Daily Time Commitment: </Text>
                  <Text>{selectedStrategy.timeCommitmentMinutes} minutes</Text>
                </div>
              </Space>
            </TabPane>
            
            <TabPane tab="Entry/Exit Signals" key="signals">
              <Row gutter={16}>
                <Col span={12}>
                  <Title level={5}>Entry Signals</Title>
                  <ul>
                    {selectedStrategy.entrySignals.map((signal, index) => (
                      <li key={index}>{signal}</li>
                    ))}
                  </ul>
                </Col>
                <Col span={12}>
                  <Title level={5}>Exit Signals</Title>
                  <ul>
                    {selectedStrategy.exitSignals.map((signal, index) => (
                      <li key={index}>{signal}</li>
                    ))}
                  </ul>
                </Col>
              </Row>
            </TabPane>
            
            <TabPane tab="Indicators" key="indicators">
              <Row gutter={16}>
                <Col span={12}>
                  <Title level={5}>Required Indicators</Title>
                  <Space size="small" wrap>
                    {selectedStrategy.requiredIndicators.map((indicator, index) => (
                      <Tag key={index} color="red">{indicator}</Tag>
                    ))}
                  </Space>
                </Col>
                <Col span={12}>
                  <Title level={5}>Optional Indicators</Title>
                  <Space size="small" wrap>
                    {selectedStrategy.optionalIndicators.map((indicator, index) => (
                      <Tag key={index} color="blue">{indicator}</Tag>
                    ))}
                  </Space>
                </Col>
              </Row>
            </TabPane>
            
            {selectedStrategy.educationalContent && (
              <TabPane tab="Learning" key="learning">
                <div>
                  <Title level={5}>Overview</Title>
                  <Paragraph>{selectedStrategy.educationalContent.overview}</Paragraph>
                  
                  <Title level={5}>Key Principles</Title>
                  <ul>
                    {selectedStrategy.educationalContent.keyPrinciples.map((principle, index) => (
                      <li key={index}>{principle}</li>
                    ))}
                  </ul>
                  
                  <Title level={5}>Common Mistakes</Title>
                  <ul>
                    {selectedStrategy.educationalContent.commonMistakes.map((mistake, index) => (
                      <li key={index} className="text-red-600">{mistake}</li>
                    ))}
                  </ul>
                  
                  <Title level={5}>Tips</Title>
                  <ul>
                    {selectedStrategy.educationalContent.tips.map((tip, index) => (
                      <li key={index} className="text-green-600">{tip}</li>
                    ))}
                  </ul>
                </div>
              </TabPane>
            )}
          </Tabs>
        </div>
      </Modal>
    );
  };

  // ===== Main Render =====

  if (loading) {
    return (
      <div className={`strategy-recommendation-engine ${className || ''}`}>
        <Card>
          <div className="text-center py-8">
            <Spin size="large" />
            <div className="mt-4">
              <Text>Loading market data and generating recommendations...</Text>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`strategy-recommendation-engine ${className || ''}`}>
      {renderMarketDashboard()}
      {renderUserProfileSection()}

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane 
          tab={
            <Space>
              <StarOutlined />
              <span>Recommendations</span>
              <Badge count={filteredAndSortedRecommendations.length} />
            </Space>
          } 
          key="recommendations"
        >
          {renderFilterControls()}
          
          {filteredAndSortedRecommendations.length === 0 ? (
            <Card>
              <Empty
                description="No strategies match your current filters"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" onClick={() => setFilters({
                  categories: [],
                  riskLevels: [],
                  timeHorizons: [],
                  skillLevels: [],
                  minConfidence: 30,
                  maxComplexity: 10,
                  availableTimeOnly: false,
                  accountSizeOnly: false
                })}>
                  Clear Filters
                </Button>
              </Empty>
            </Card>
          ) : (
            <Row gutter={[16, 16]}>
              {filteredAndSortedRecommendations.map((recommendation) => (
                <Col key={recommendation.strategy.id} xs={24} lg={12} xxl={8}>
                  {renderStrategyCard(recommendation)}
                </Col>
              ))}
            </Row>
          )}
        </TabPane>
        
        {showPerformanceComparison && (
          <TabPane 
            tab={
              <Space>
                <BarChartOutlined />
                <span>Performance</span>
              </Space>
            } 
            key="performance"
          >
            {renderPerformanceComparison()}
          </TabPane>
        )}
        
        <TabPane 
          tab={
            <Space>
              <BulbOutlined />
              <span>All Strategies</span>
              <Badge count={allStrategies.length} />
            </Space>
          } 
          key="all-strategies"
        >
          <List
            dataSource={allStrategies}
            renderItem={(strategy) => (
              <List.Item
                actions={[
                  <Button 
                    type="text" 
                    icon={<InfoCircleOutlined />}
                    onClick={() => handleStrategySelect(strategy)}
                  >
                    Details
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<AimOutlined />} />}
                  title={strategy.name}
                  description={
                    <Space>
                      <Tag color="blue">{strategy.category.replace('_', ' ')}</Tag>
                      <Tag color="orange">{strategy.riskLevel.replace('_', ' ')}</Tag>
                      <Text type="secondary">{strategy.description}</Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </TabPane>
      </Tabs>

      {renderProfileModal()}
      {renderStrategyDetailModal()}
    </div>
  );
};

export default StrategyRecommendationEngine;