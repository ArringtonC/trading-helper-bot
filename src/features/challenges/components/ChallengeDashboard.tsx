import React, { useState, useEffect } from 'react';
import { Card, Progress, Button, Typography, Row, Col, Space, Tag, Avatar, Statistic } from 'antd';
import { 
  TrophyOutlined, 
  FireOutlined, 
  RiseOutlined, 
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  AimOutlined
} from '@ant-design/icons';
import { 
  Challenge, 
  WeeklyMilestone, 
  DailyTask, 
  ChallengeProgress,
  MOCK_CHALLENGE,
  MOCK_WEEKLY_MILESTONES,
  MOCK_TODAYS_TASKS,
  MOCK_ACHIEVEMENTS
} from '../types/challenge';
import StressTracker from '../../psychology/components/StressTracker';
import EmotionalStateIndicator from '../../psychology/components/EmotionalStateIndicator';
import ProfitExtractionWidget from '../../psychology/components/ProfitExtractionWidget';
import { EmotionalState } from '../../psychology/types/psychology';

const { Title, Text } = Typography;

interface ChallengeDashboardProps {
  challengeId?: string;
  currentDay?: number;
  accountBalance?: number;
  targetAmount?: number;
  todaysTasks?: DailyTask[];
  weeklyMilestones?: WeeklyMilestone[];
  // Psychology Integration Props
  currentStress?: number;
  emotionalState?: EmotionalState;
  showPsychologyFeatures?: boolean;
}

const ChallengeDashboard: React.FC<ChallengeDashboardProps> = ({
  challengeId = MOCK_CHALLENGE.id,
  currentDay = MOCK_CHALLENGE.currentDay,
  accountBalance = MOCK_CHALLENGE.currentAmount,
  targetAmount = MOCK_CHALLENGE.targetAmount,
  todaysTasks = MOCK_TODAYS_TASKS,
  weeklyMilestones = MOCK_WEEKLY_MILESTONES,
  // Psychology defaults
  currentStress = 5,
  emotionalState = 'CALM',
  showPsychologyFeatures = true
}) => {
  const [challenge] = useState<Challenge>(MOCK_CHALLENGE);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [stressLevel, setStressLevel] = useState(currentStress);

  const progressPercentage = ((accountBalance - challenge.startingAmount) / (targetAmount - challenge.startingAmount)) * 100;
  const totalGain = accountBalance - challenge.startingAmount;
  const remainingDays = challenge.totalDays - currentDay;
  const [monthlyProfit, setMonthlyProfit] = useState(totalGain > 0 ? totalGain * 0.25 : 0);

  const handleTaskComplete = (taskId: string) => {
    if (!completedTasks.includes(taskId)) {
      setCompletedTasks([...completedTasks, taskId]);
    }
  };

  // Psychology Integration Handlers
  const handleStressUpdate = (newStress: EmotionalState | number) => {
    const stressValue = typeof newStress === 'number' ? newStress : 5;
    setStressLevel(stressValue);
  };

  const handleProfitExtraction = (amount: number, type: 'MANUAL' | 'AUTOMATIC') => {
    setMonthlyProfit(amount);
    // Add success feedback
    console.log(`Profit extraction scheduled: $${amount} (${type})`);
  };

  // Calculate psychology bonuses
  const getStressBonusXP = () => {
    if (stressLevel <= 3) return 30; // Optimal stress
    if (stressLevel <= 5) return 20; // Good stress
    if (stressLevel <= 7) return 10; // Moderate stress
    return 0; // High stress
  };

  const getPsychologyHealthColor = () => {
    if (stressLevel <= 3) return '#52c41a'; // Green
    if (stressLevel <= 5) return '#1890ff'; // Blue  
    if (stressLevel <= 7) return '#faad14'; // Orange
    return '#ff4d4f'; // Red
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'IN_PROGRESS': return 'processing';
      case 'ACHIEVED': return 'success';
      case 'MISSED': return 'error';
      default: return 'default';
    }
  };

  const getDayTypeEmoji = (dayType: string) => {
    switch (dayType) {
      case 'SUNDAY': return '📋';
      case 'MONDAY': return '🎯';
      case 'EXECUTION': return '⚡';
      case 'FRIDAY': return '📊';
      default: return '📅';
    }
  };

  return (
    <div className="challenge-dashboard" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Section */}
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-green-50">
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={2} className="m-0 text-blue-800">
              🎯 $10k → $20k Challenge
            </Title>
            <Text className="text-lg text-gray-600">
              Day {currentDay} of {challenge.totalDays} • {remainingDays} days remaining
            </Text>
          </Col>
          <Col>
            <Tag color={challenge.status === 'ACTIVE' ? 'green' : 'blue'} className="text-lg px-4 py-2">
              {challenge.status}
            </Tag>
          </Col>
        </Row>
      </Card>

      {/* Progress Section */}
      <Card title="📈 Account Progress" className="mb-6">
        <Row gutter={24}>
          <Col span={16}>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <Text strong>${challenge.startingAmount.toLocaleString()}</Text>
                <Text strong className="text-lg">
                  ${accountBalance.toLocaleString()} / ${targetAmount.toLocaleString()}
                </Text>
              </div>
              <Progress 
                percent={progressPercentage} 
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                size="large"
                className="mb-2"
              />
              <div className="flex justify-between">
                <Text type="secondary">Starting Balance</Text>
                <Text className={totalGain >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {totalGain >= 0 ? '+' : ''}${totalGain.toLocaleString()} gained
                </Text>
              </div>
            </div>
          </Col>
          <Col span={8}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Progress"
                  value={progressPercentage}
                  precision={1}
                  suffix="%"
                  valueStyle={{ color: progressPercentage > 50 ? '#3f8600' : '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Remaining"
                  value={targetAmount - accountBalance}
                  prefix="$"
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
            </Row>
          </Col>
        </Row>
        
        {progressPercentage > 60 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <Text className="text-green-700">
              🚀 Ahead of Schedule! You're performing excellently.
            </Text>
          </div>
        )}
      </Card>

      {/* Psychology Integration Section */}
      {showPsychologyFeatures && (
        <Card title="🧠 Trading Psychology Protection" className="mb-6">
          <Row gutter={24}>
            <Col span={8}>
              <Card size="small" title="Daily Stress Check">
                <StressTracker
                  onStressUpdate={handleStressUpdate}
                  currentStress={stressLevel}
                  className="mb-2"
                />
                <div className="text-center">
                  <Text style={{ color: getPsychologyHealthColor() }}>
                    Bonus XP: +{getStressBonusXP()}
                  </Text>
                </div>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" title="Emotional State">
                <EmotionalStateIndicator
                  currentState={{
                    current: emotionalState,
                    stressLevel: stressLevel,
                    confidence: 7,
                    timestamp: new Date()
                  }}
                />
                <div className="mt-2 text-center">
                  <Tag color={stressLevel <= 5 ? 'green' : 'orange'}>
                    {stressLevel <= 3 ? 'Optimal Zone' : 
                     stressLevel <= 5 ? 'Good State' : 
                     stressLevel <= 7 ? 'Caution' : 'High Risk'}
                  </Tag>
                </div>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" title="Profit Protection">
                <ProfitExtractionWidget
                  accountSize={accountBalance}
                  monthlyProfits={Math.max(0, totalGain)}
                  onExtractionExecute={handleProfitExtraction}
                />
                <div className="mt-2 text-center">
                  <Text type="secondary">
                    Protected: ${monthlyProfit.toFixed(0)}
                  </Text>
                </div>
              </Card>
            </Col>
          </Row>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <Row align="middle" justify="space-between">
              <Col>
                <Text className="text-blue-700">
                  🏆 Psychology bonuses active • Stress management: +{getStressBonusXP()} XP
                </Text>
              </Col>
              <Col>
                <Button 
                  size="small" 
                  type="link"
                  onClick={() => window.location.href = '/page-psychology-test'}
                >
                  View Psychology Lab →
                </Button>
              </Col>
            </Row>
          </div>
        </Card>
      )}

      <Row gutter={24}>
        {/* Today's Objectives */}
        <Col span={12}>
          <Card 
            title={
              <Space>
                {getDayTypeEmoji(todaysTasks[0]?.dayType || 'EXECUTION')}
                Today's Objectives ({todaysTasks[0]?.dayType || 'Execution'})
              </Space>
            }
            className="h-full"
          >
            <div className="space-y-3">
              {todaysTasks.map((task, index) => (
                <div 
                  key={task.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    task.status === 'COMPLETED' ? 'bg-green-50 border-green-200' :
                    task.status === 'IN_PROGRESS' ? 'bg-blue-50 border-blue-200' :
                    'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => task.status === 'PENDING' && handleTaskComplete(task.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {task.status === 'COMPLETED' ? (
                          <CheckCircleOutlined className="text-green-500" />
                        ) : task.status === 'IN_PROGRESS' ? (
                          <ClockCircleOutlined className="text-blue-500" />
                        ) : (
                          <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                        )}
                        <Text strong className={task.status === 'COMPLETED' ? 'line-through text-gray-500' : ''}>
                          {task.title}
                        </Text>
                      </div>
                      <Text type="secondary" className="text-sm block mt-1">
                        {task.description}
                      </Text>
                      <div className="flex items-center space-x-2 mt-1">
                        <Tag size="small" color={getStatusColor(task.category)}>
                          {task.category.replace('_', ' ')}
                        </Tag>
                        <Text type="secondary" className="text-xs">
                          ~{task.estimatedMinutes}min
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <Text className="text-sm text-blue-700">
                Progress: {todaysTasks.filter(t => t.status === 'COMPLETED').length}/{todaysTasks.length} tasks completed
              </Text>
              <Progress 
                percent={(todaysTasks.filter(t => t.status === 'COMPLETED').length / todaysTasks.length) * 100}
                size="small"
                className="mt-1"
              />
            </div>
          </Card>
        </Col>

        {/* Weekly Milestones */}
        <Col span={12}>
          <Card 
            title={
              <Space>
                <AimOutlined />
                Weekly Milestones
              </Space>
            }
            className="h-full"
          >
            <div className="space-y-4">
              {weeklyMilestones.map((milestone, index) => (
                <div key={milestone.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Text strong>Week {milestone.weekNumber}</Text>
                      <Tag color={getStatusColor(milestone.status)}>
                        {milestone.status === 'ACHIEVED' ? '✅' :
                         milestone.status === 'IN_PROGRESS' ? '🎯' :
                         milestone.status === 'MISSED' ? '❌' : '⏳'}
                      </Tag>
                    </div>
                    <Text className="text-sm text-gray-600">
                      Target: ${milestone.targetAmount.toLocaleString()}
                      {milestone.actualAmount && (
                        <span className={milestone.actualAmount >= milestone.targetAmount ? 'text-green-600' : 'text-orange-600'}>
                          {' '} • Actual: ${milestone.actualAmount.toLocaleString()}
                        </span>
                      )}
                    </Text>
                    <Text type="secondary" className="text-xs">
                      Due: {milestone.dueDate.toLocaleDateString()}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card title="🚀 Quick Links" className="mt-6">
        <Row gutter={16}>
          <Col span={6}>
            <Button 
              type="primary" 
              block 
              size="large"
              onClick={() => window.location.href = '/sp500-professional'}
            >
              SP500 Professional
            </Button>
          </Col>
          <Col span={6}>
            <Button 
              block 
              size="large"
              onClick={() => window.location.href = '/learning/famous-traders'}
            >
              Famous Traders
            </Button>
          </Col>
          <Col span={6}>
            <Button 
              block 
              size="large"
              onClick={() => window.location.href = '/watchlist'}
            >
              Watchlist
            </Button>
          </Col>
          <Col span={6}>
            <Button 
              block 
              size="large"
              onClick={() => window.location.href = '/position-sizing'}
            >
              Position Sizing
            </Button>
          </Col>
        </Row>
        
        <Row gutter={16} className="mt-4">
          <Col span={6}>
            <Button 
              block 
              size="large" 
              type="primary"
              onClick={() => window.location.href = '/sunday-planning-quest'}
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              🏴‍☠️ Sunday Quest
            </Button>
          </Col>
          <Col span={6}>
            <Button block size="large" type="dashed">
              Weekly Plan
            </Button>
          </Col>
          <Col span={6}>
            <Button block size="large" type="dashed">
              Progress Report
            </Button>
          </Col>
          <Col span={6}>
            <Button block size="large" type="dashed">
              Settings
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Achievement Preview */}
      <Card title="🏆 Recent Achievements" className="mt-6">
        <Row gutter={16}>
          {MOCK_ACHIEVEMENTS.slice(0, 3).map((achievement) => (
            <Col span={8} key={achievement.id}>
              <div className={`p-4 border rounded-lg text-center ${
                achievement.unlocked ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="text-2xl mb-2">{achievement.icon}</div>
                <Text strong className={achievement.unlocked ? 'text-yellow-700' : 'text-gray-500'}>
                  {achievement.name}
                </Text>
                <div className="mt-1">
                  <Text type="secondary" className="text-xs">
                    {achievement.description}
                  </Text>
                </div>
                <div className="mt-2">
                  <Progress 
                    percent={(achievement.progress / achievement.target) * 100}
                    size="small"
                    strokeColor={achievement.unlocked ? '#faad14' : '#d9d9d9'}
                  />
                  <Text type="secondary" className="text-xs">
                    {achievement.progress}/{achievement.target} • {achievement.points} pts
                  </Text>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
};

export default ChallengeDashboard;