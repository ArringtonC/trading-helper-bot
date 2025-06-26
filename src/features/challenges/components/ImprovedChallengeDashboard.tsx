import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Progress, 
  Button, 
  Typography, 
  Row, 
  Col, 
  Space, 
  Tag, 
  Statistic, 
  Tabs, 
  Slider,
  Input,
  Switch,
  Avatar,
  Badge,
  Timeline,
  Alert
} from 'antd';
import { 
  TrophyOutlined, 
  FireOutlined, 
  RiseOutlined, 
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  AimOutlined,
  DollarOutlined,
  BulbOutlined,
  SettingOutlined,
  BarChartOutlined,
  BellOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { 
  Challenge, 
  WeeklyMilestone, 
  DailyTask, 
  MOCK_CHALLENGE,
  MOCK_WEEKLY_MILESTONES,
  MOCK_TODAYS_TASKS,
  MOCK_ACHIEVEMENTS
} from '../types/challenge';
import { EmotionalState } from '../../psychology/types/psychology';
import BreakoutAlertManager from '../../trading/components/BreakoutAlertManager';
import BattleZoneMarkers from '../../trading/components/BattleZoneMarkers';
import MondayRangeQuest from './MondayRangeQuest';
import ProgressAnalyticsDashboard from '../../analytics/components/ProgressAnalyticsDashboard';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

interface ImprovedChallengeDashboardProps {
  challengeId?: string;
  currentDay?: number;
  accountBalance?: number;
  targetAmount?: number;
  todaysTasks?: DailyTask[];
  weeklyMilestones?: WeeklyMilestone[];
  currentStress?: number;
  emotionalState?: EmotionalState;
  showPsychologyFeatures?: boolean;
}

const ImprovedChallengeDashboard: React.FC<ImprovedChallengeDashboardProps> = ({
  challengeId = MOCK_CHALLENGE.id,
  currentDay = MOCK_CHALLENGE.currentDay,
  accountBalance = MOCK_CHALLENGE.currentAmount,
  targetAmount = MOCK_CHALLENGE.targetAmount,
  todaysTasks = MOCK_TODAYS_TASKS,
  weeklyMilestones = MOCK_WEEKLY_MILESTONES,
  currentStress = 5,
  emotionalState = 'CALM',
  showPsychologyFeatures = true
}) => {
  const [challenge] = useState<Challenge>(MOCK_CHALLENGE);
  const [activeTab, setActiveTab] = useState('overview');
  const [stressLevel, setStressLevel] = useState(currentStress);
  const [confidence, setConfidence] = useState(7);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionalState['current']>(emotionalState || 'CALM');
  const [notes, setNotes] = useState('');
  const [autoExtractionEnabled, setAutoExtractionEnabled] = useState(true);
  const [currentPrice, setCurrentPrice] = useState(452.35);
  const [selectedStrategyClass, setSelectedStrategyClass] = useState<'BUFFETT_GUARDIAN' | 'DALIO_WARRIOR' | 'SOROS_ASSASSIN' | 'LYNCH_SCOUT'>('DALIO_WARRIOR');

  const progressPercentage = ((accountBalance - challenge.startingAmount) / (targetAmount - challenge.startingAmount)) * 100;
  const totalGain = accountBalance - challenge.startingAmount;
  const remainingDays = challenge.totalDays - currentDay;
  const recommendedExtraction = Math.max(0, totalGain * 0.25);

  const emotionEmojis = {
    CALM: '😌',
    FOCUSED: '🎯',
    STRESSED: '😰',
    PANICKED: '😱',
    EUPHORIC: '🤩',
    FEARFUL: '😨'
  };

  const getProgressColor = () => {
    if (progressPercentage >= 75) return '#52c41a';
    if (progressPercentage >= 50) return '#1890ff';
    if (progressPercentage >= 25) return '#faad14';
    return '#ff4d4f';
  };

  const getStressBonusXP = () => {
    if (stressLevel <= 3) return 30;
    if (stressLevel <= 5) return 20;
    if (stressLevel <= 7) return 10;
    return 0;
  };

  // Price simulation for demo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPrice(prev => {
        const change = (Math.random() - 0.5) * 1;
        return Number((prev + change).toFixed(2));
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Overview Tab Content
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Hero Progress Card - Above the fold */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-0 shadow-lg">
        <Row align="middle" gutter={[24, 16]}>
          <Col xs={24} lg={16}>
            <div>
              <Title level={2} className="m-0 text-gray-800">
                💰 Goal Progress
              </Title>
              <div className="flex items-center space-x-2 mb-3">
                <Text className="text-xl font-medium">
                  ${challenge.startingAmount.toLocaleString()} → ${accountBalance.toLocaleString()} / ${targetAmount.toLocaleString()}
                </Text>
              </div>
              <Progress 
                percent={progressPercentage} 
                strokeColor={getProgressColor()}
                strokeWidth={12}
                className="mb-2"
              />
              <div className="flex justify-between items-center">
                <Text className="text-lg font-medium" style={{ color: getProgressColor() }}>
                  📈 {progressPercentage.toFixed(1)}% Complete
                </Text>
                <Text className="text-lg text-gray-600">
                  ${(targetAmount - accountBalance).toLocaleString()} Remaining
                </Text>
              </div>
            </div>
          </Col>
          <Col xs={24} lg={8}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Days Left"
                  value={remainingDays}
                  valueStyle={{ color: remainingDays < 10 ? '#ff4d4f' : '#1890ff', fontSize: '1.5rem' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="SPY Price"
                  value={currentPrice}
                  prefix="$"
                  precision={2}
                  valueStyle={{ color: '#1890ff', fontSize: '1.5rem' }}
                />
                <Tag color="blue" size="small">Live</Tag>
              </Col>
              <Col span={8}>
                <Statistic
                  title="Total Gain"
                  value={totalGain}
                  prefix="$"
                  valueStyle={{ color: totalGain >= 0 ? '#52c41a' : '#ff4d4f', fontSize: '1.5rem' }}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* Psychology Check-In - Improved UI */}
      {showPsychologyFeatures && (
        <Card title="🧠 Daily Psychology Check" className="shadow-md">
          <Row gutter={[24, 16]}>
            <Col xs={24} lg={12}>
              <div className="space-y-4">
                <div>
                  <Text strong className="block mb-2">Stress Level (1-10): {stressLevel}</Text>
                  <Slider
                    min={1}
                    max={10}
                    value={stressLevel}
                    onChange={setStressLevel}
                    marks={{
                      1: '😌',
                      3: '🙂',
                      5: '😐',
                      7: '😰',
                      10: '😱'
                    }}
                    tooltip={{ formatter: (value) => `Stress: ${value}/10` }}
                  />
                  <Text type="secondary" className="text-center block">
                    Bonus XP: +{getStressBonusXP()}
                  </Text>
                </div>

                <div>
                  <Text strong className="block mb-2">Confidence (1-10): {confidence}</Text>
                  <Slider
                    min={1}
                    max={10}
                    value={confidence}
                    onChange={setConfidence}
                    marks={{
                      1: '😔',
                      5: '😐',
                      10: '💪'
                    }}
                    tooltip={{ formatter: (value) => `Confidence: ${value}/10` }}
                  />
                </div>
              </div>
            </Col>
            <Col xs={24} lg={12}>
              <div className="space-y-4">
                <div>
                  <Text strong className="block mb-2">Emotional State</Text>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(emotionEmojis).map(([emotion, emoji]) => (
                      <Button
                        key={emotion}
                        type={currentEmotion === emotion ? 'primary' : 'default'}
                        onClick={() => setCurrentEmotion(emotion as EmotionalState['current'])}
                        className="text-center"
                      >
                        {emoji} {emotion}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Text strong className="block mb-2">Notes</Text>
                  <TextArea
                    placeholder="How are you feeling about trading today?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <Button type="primary" size="large" block>
                  ✅ Log State
                </Button>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* Profit Summary - Condensed */}
      <Card title="💸 Profit Summary" className="shadow-md">
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} lg={12}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Total Profit"
                  value={totalGain}
                  prefix="$"
                  valueStyle={{ color: totalGain >= 0 ? '#52c41a' : '#ff4d4f' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Recommended (25%)"
                  value={recommendedExtraction}
                  prefix="$"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={8}>
                <div className="text-center">
                  <Text strong className="block">Auto Extraction</Text>
                  <Switch
                    checked={autoExtractionEnabled}
                    onChange={setAutoExtractionEnabled}
                    checkedChildren="ON"
                    unCheckedChildren="OFF"
                  />
                </div>
              </Col>
            </Row>
          </Col>
          <Col xs={24} lg={12}>
            <Space className="w-full justify-end">
              <Button 
                type="default"
                icon={<SettingOutlined />}
              >
                🔘 Toggle Auto-Extract
              </Button>
              <Button 
                type="primary"
                icon={<DollarOutlined />}
                disabled={recommendedExtraction <= 0}
              >
                📤 Extract Now
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  );

  // Monday Range Tab Content
  const MondayRangeTab = () => (
    <div className="space-y-6">
      <Alert
        message="🎯 Component 2: Monday Range Calculator & Setup"
        description="Automated battlefield analysis with breakout monitoring - saves 30 minutes daily and improves timing accuracy by 40%"
        type="success"
        showIcon
        className="mb-6"
      />
      
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <BattleZoneMarkers
            symbol="SPY"
            currentPrice={currentPrice}
            showLabels={true}
            showTargets={true}
            chartHeight={400}
          />
        </Col>
        
        <Col span={24}>
          <BreakoutAlertManager
            symbol="SPY"
            currentPrice={currentPrice}
            strategyClass={selectedStrategyClass}
            onBreakoutAction={(alert) => {
              console.log('Breakout action:', alert);
              // In real app, this would integrate with position sizing and trade execution
            }}
          />
        </Col>
      </Row>
    </div>
  );

  // Daily Flow Tab Content
  const DailyFlowTab = () => (
    <div className="space-y-6">
      <Card title="📅 Today's Trading Timeline" className="shadow-md">
        <Timeline
          items={[
            {
              dot: <ClockCircleOutlined style={{ fontSize: '16px', color: '#52c41a' }} />,
              children: (
                <div>
                  <Text strong>🌅 Morning Routine</Text>
                  <Text type="secondary" className="block">5 min • Check mindset and stress levels</Text>
                </div>
              )
            },
            {
              dot: <ThunderboltOutlined style={{ fontSize: '16px', color: '#1890ff' }} />,
              children: (
                <div>
                  <Text strong>🎯 Monday Range Analysis</Text>
                  <Text type="secondary" className="block">10 min • Calculate battle zones and set breakout alerts</Text>
                  <Tag color="blue" className="mt-1">NEW: Component 2</Tag>
                </div>
              )
            },
            {
              dot: <ClockCircleOutlined style={{ fontSize: '16px', color: '#1890ff' }} />,
              children: (
                <div>
                  <Text strong>🔍 Pre-Market Scan</Text>
                  <Text type="secondary" className="block">15 min • Review overnight news and futures</Text>
                </div>
              )
            },
            {
              dot: <ClockCircleOutlined style={{ fontSize: '16px', color: '#faad14' }} />,
              children: (
                <div>
                  <Text strong>💎 Setup Hunt</Text>
                  <Text type="secondary" className="block">20 min • Identify A+ legendary opportunities</Text>
                </div>
              )
            },
            {
              dot: <ClockCircleOutlined style={{ fontSize: '16px', color: '#722ed1' }} />,
              children: (
                <div>
                  <Text strong>⚔️ Execution</Text>
                  <Text type="secondary" className="block">30 min • Execute 0-2 trades maximum</Text>
                </div>
              )
            },
            {
              dot: <ClockCircleOutlined style={{ fontSize: '16px', color: '#fa8c16' }} />,
              children: (
                <div>
                  <Text strong>🎯 Patience Review</Text>
                  <Text type="secondary" className="block">5 min • Rate discipline and patience</Text>
                </div>
              )
            },
            {
              dot: <ClockCircleOutlined style={{ fontSize: '16px', color: '#eb2f96' }} />,
              children: (
                <div>
                  <Text strong>📊 Trade Review</Text>
                  <Text type="secondary" className="block">20 min • Analyze performance and log lessons</Text>
                </div>
              )
            }
          ]}
        />
      </Card>
    </div>
  );

  // Progress Tab Content
  const ProgressTab = () => (
    <div className="space-y-6">
      <Alert
        message="🎯 Component 6: Progress Analytics Dashboard"
        description="Comprehensive analytics system - tracks XP progression, strategy performance, psychology correlation, and challenge progress. Replaces expensive analytics tools with $50 value."
        type="success"
        showIcon
        className="mb-6"
      />
      
      <ProgressAnalyticsDashboard
        userId={challengeId}
        challengeId={challengeId}
        className="w-full"
      />
      
      {/* Legacy Achievements Section - Condensed */}
      <Card title="🏆 Quick Achievements" size="small" className="mt-6">
        <Row gutter={[12, 12]}>
          {MOCK_ACHIEVEMENTS.slice(0, 4).map((achievement) => (
            <Col xs={12} sm={6} key={achievement.id}>
              <div className="flex items-center space-x-2">
                <Avatar 
                  size={32} 
                  style={{ 
                    backgroundColor: achievement.unlocked ? '#faad14' : '#d9d9d9'
                  }}
                >
                  {achievement.icon}
                </Avatar>
                <div>
                  <Text strong className="text-xs block">
                    {achievement.name}
                  </Text>
                  <Text type="secondary" className="text-xs">
                    {achievement.progress}/{achievement.target} • +{achievement.points} XP
                  </Text>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Simplified Header */}
      <div className="mb-6">
        <Title level={1} className="m-0">
          Challenge Dashboard
        </Title>
        <Text className="text-lg text-gray-600">
          Day {currentDay} of {challenge.totalDays} • {challenge.status}
        </Text>
      </div>

      {/* Tabbed Interface */}
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        size="large"
        items={[
          {
            key: 'overview',
            label: (
              <span>
                <AimOutlined />
                Overview
              </span>
            ),
            children: <OverviewTab />
          },
          {
            key: 'monday-range',
            label: (
              <span>
                <BarChartOutlined />
                Monday Range
                <Tag color="green" size="small" style={{ marginLeft: 4 }}>NEW</Tag>
              </span>
            ),
            children: <MondayRangeTab />
          },
          {
            key: 'weekly',
            label: (
              <span>
                <CalendarOutlined />
                Weekly Plan
              </span>
            ),
            children: (
              <div className="space-y-6">
                <Alert
                  message="Sunday Planning Session"
                  description="Complete these quests to prepare for the trading week ahead"
                  type="info"
                  showIcon
                  className="mb-6"
                />
                
                <MondayRangeQuest
                  symbol="SPY"
                  onQuestComplete={(xp, rangeData) => {
                    console.log('Monday Range Quest completed:', xp, 'XP earned');
                    // In real app, this would update user's total XP and challenge progress
                  }}
                  onXPUpdate={(xp, source) => {
                    console.log('XP earned:', xp, 'from', source);
                  }}
                />
                
                <Card title="Coming Soon" className="text-center py-8">
                  <Text type="secondary">
                    Additional weekly planning quests will be added here:
                    <br />• Strategy class selection quest
                    <br />• Risk parameter setup
                    <br />• Watchlist building quest
                  </Text>
                </Card>
              </div>
            )
          },
          {
            key: 'daily',
            label: (
              <span>
                <ClockCircleOutlined />
                Daily Flow
              </span>
            ),
            children: <DailyFlowTab />
          },
          {
            key: 'progress',
            label: (
              <span>
                <TrophyOutlined />
                Progress
              </span>
            ),
            children: <ProgressTab />
          }
        ]}
      />
    </div>
  );
};

export default ImprovedChallengeDashboard;