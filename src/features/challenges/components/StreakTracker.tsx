import React, { useState, useEffect } from 'react';
import {
  Card,
  Progress,
  Statistic,
  Badge,
  Button,
  Space,
  Typography,
  Tag,
  Tooltip,
  Row,
  Col,
  Modal,
  Alert
} from 'antd';
import {
  FireOutlined,
  TrophyOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  HeartOutlined,
  StarOutlined,
  CrownOutlined
} from '@ant-design/icons';
import type { ChallengeStreaks, Achievement } from '../types/challenge';

const { Title, Text, Paragraph } = Typography;

interface StreakTrackerProps {
  streaks: ChallengeStreaks;
  onStreakMilestone?: (streakType: keyof ChallengeStreaks, milestone: number) => void;
  onCelebration?: (achievement: Achievement) => void;
  className?: string;
  compact?: boolean;
}

interface StreakInfo {
  key: keyof ChallengeStreaks;
  name: string;
  emoji: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  milestones: number[];
  currentValue: number;
  maxDisplay: number;
}

const StreakTracker: React.FC<StreakTrackerProps> = ({
  streaks,
  onStreakMilestone,
  onCelebration,
  className = '',
  compact = false
}) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{
    title: string;
    description: string;
    emoji: string;
    xpReward: number;
  } | null>(null);
  const [previousStreaks, setPreviousStreaks] = useState<ChallengeStreaks | null>(null);

  const streakInfos: StreakInfo[] = [
    {
      key: 'dailyLogin',
      name: 'Daily Login',
      emoji: '🔥',
      icon: <FireOutlined />,
      color: '#ff4d4f',
      description: 'Consecutive days logging in',
      milestones: [3, 7, 14, 30, 60, 100],
      currentValue: streaks.dailyLogin,
      maxDisplay: 100
    },
    {
      key: 'taskCompletion',
      name: 'Task Master',
      emoji: '✅',
      icon: <CheckCircleOutlined />,
      color: '#52c41a',
      description: 'Consecutive days completing all tasks',
      milestones: [3, 7, 14, 21, 30],
      currentValue: streaks.taskCompletion,
      maxDisplay: 30
    },
    {
      key: 'riskDiscipline',
      name: 'Discipline Master',
      emoji: '🛡️',
      icon: <HeartOutlined />,
      color: '#1890ff',
      description: 'Consecutive days with perfect risk management',
      milestones: [5, 10, 20, 30, 50],
      currentValue: streaks.riskDiscipline,
      maxDisplay: 50
    },
    {
      key: 'platformUsage',
      name: 'Engagement',
      emoji: '⚡',
      icon: <ThunderboltOutlined />,
      color: '#fa8c16',
      description: 'Consecutive days using the platform',
      milestones: [7, 14, 30, 60, 90],
      currentValue: streaks.platformUsage,
      maxDisplay: 90
    },
    {
      key: 'profitableDays',
      name: 'Profit Streak',
      emoji: '💰',
      icon: <TrophyOutlined />,
      color: '#722ed1',
      description: 'Consecutive profitable trading days',
      milestones: [3, 5, 10, 15, 20],
      currentValue: streaks.profitableDays,
      maxDisplay: 20
    }
  ];

  // Check for new milestones
  useEffect(() => {
    if (previousStreaks) {
      streakInfos.forEach(info => {
        const currentStreak = streaks[info.key];
        const previousStreak = previousStreaks[info.key];
        
        if (currentStreak > previousStreak) {
          const newMilestones = info.milestones.filter(
            milestone => milestone <= currentStreak && milestone > previousStreak
          );
          
          newMilestones.forEach(milestone => {
            triggerMilestoneCelebration(info, milestone);
            onStreakMilestone?.(info.key, milestone);
          });
        }
      });
    }
    setPreviousStreaks(streaks);
  }, [streaks]);

  const triggerMilestoneCelebration = (streakInfo: StreakInfo, milestone: number) => {
    const celebrationMessages = {
      3: { title: 'Building Momentum!', xp: 50 },
      5: { title: 'Excellent Consistency!', xp: 75 },
      7: { title: 'Week Warrior!', xp: 100 },
      10: { title: 'Double Digit Domination!', xp: 150 },
      14: { title: 'Two Week Champion!', xp: 200 },
      20: { title: 'Legendary Consistency!', xp: 300 },
      30: { title: 'Monthly Master!', xp: 500 },
      50: { title: 'Elite Trader Status!', xp: 750 },
      60: { title: 'Unstoppable Force!', xp: 1000 },
      100: { title: 'Century Club Member!', xp: 2000 }
    };

    const celebration = celebrationMessages[milestone as keyof typeof celebrationMessages] || 
                       { title: 'Amazing Streak!', xp: milestone * 10 };

    setCelebrationData({
      title: `${streakInfo.emoji} ${celebration.title}`,
      description: `${milestone} day ${streakInfo.name.toLowerCase()} streak achieved!`,
      emoji: streakInfo.emoji,
      xpReward: celebration.xp
    });
    setShowCelebration(true);

    // Create achievement for callback
    const achievement: Achievement = {
      id: `streak-${streakInfo.key}-${milestone}`,
      name: `${streakInfo.name} ${milestone}-Day Streak`,
      description: `Achieved ${milestone} consecutive days of ${streakInfo.description.toLowerCase()}`,
      icon: streakInfo.emoji,
      category: 'STREAK',
      progress: milestone,
      target: milestone,
      unlocked: true,
      unlockedAt: new Date(),
      points: celebration.xp / 10,
      xpReward: celebration.xp,
      skillPointReward: Math.floor(milestone / 5),
      tier: milestone >= 50 ? 'LEGENDARY' : milestone >= 20 ? 'GOLD' : milestone >= 7 ? 'SILVER' : 'BRONZE'
    };

    onCelebration?.(achievement);
  };

  const getNextMilestone = (info: StreakInfo): number | null => {
    return info.milestones.find(m => m > info.currentValue) || null;
  };

  const getProgressToNextMilestone = (info: StreakInfo): number => {
    const nextMilestone = getNextMilestone(info);
    if (!nextMilestone) return 100;
    
    const previousMilestone = info.milestones
      .filter(m => m <= info.currentValue)
      .pop() || 0;
    
    const progress = info.currentValue - previousMilestone;
    const total = nextMilestone - previousMilestone;
    
    return Math.round((progress / total) * 100);
  };

  const getStreakDisplay = (info: StreakInfo) => {
    const isMaxed = info.currentValue >= info.maxDisplay;
    const nextMilestone = getNextMilestone(info);
    const progress = getProgressToNextMilestone(info);
    
    return {
      display: isMaxed ? `${info.maxDisplay}+` : info.currentValue.toString(),
      color: info.currentValue >= 7 ? info.color : '#d9d9d9',
      showProgress: !isMaxed && nextMilestone,
      progress,
      nextMilestone
    };
  };

  const getTotalStreakPower = (): number => {
    return streakInfos.reduce((total, info) => {
      const milestonesPassed = info.milestones.filter(m => m <= info.currentValue).length;
      return total + milestonesPassed * 10;
    }, 0);
  };

  const getHighestStreak = (): StreakInfo => {
    return streakInfos.reduce((highest, current) => 
      current.currentValue > highest.currentValue ? current : highest
    );
  };

  if (compact) {
    const highestStreak = getHighestStreak();
    const streakDisplay = getStreakDisplay(highestStreak);
    
    return (
      <div className={`streak-tracker-compact ${className}`}>
        <Space size="small">
          <Badge 
            count={streakDisplay.display} 
            style={{ backgroundColor: streakDisplay.color }}
            showZero
          >
            <Button 
              icon={highestStreak.icon} 
              type="text" 
              size="small"
              style={{ color: streakDisplay.color }}
            >
              Streak
            </Button>
          </Badge>
          {streakDisplay.showProgress && (
            <Tooltip title={`${highestStreak.currentValue}/${streakDisplay.nextMilestone} to next milestone`}>
              <Progress 
                type="circle" 
                size={24} 
                percent={streakDisplay.progress} 
                showInfo={false}
                strokeColor={highestStreak.color}
                trailColor="#f0f0f0"
              />
            </Tooltip>
          )}
        </Space>
      </div>
    );
  }

  return (
    <Card className={`streak-tracker ${className}`} title="🔥 Streak Power">
      {/* Header Stats */}
      <div className="mb-4">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Statistic
              title="Total Streak Power"
              value={getTotalStreakPower()}
              prefix={<StarOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="Longest Active Streak"
              value={getHighestStreak().currentValue}
              suffix="days"
              prefix={<CrownOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
        </Row>
      </div>

      {/* Individual Streaks */}
      <div className="space-y-4">
        {streakInfos.map(info => {
          const streakDisplay = getStreakDisplay(info);
          const isActive = info.currentValue > 0;
          
          return (
            <div key={info.key} className="streak-item p-3 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div 
                    className="flex items-center justify-center w-10 h-10 rounded-full"
                    style={{ 
                      backgroundColor: isActive ? `${info.color}20` : '#f5f5f5',
                      color: isActive ? info.color : '#d9d9d9'
                    }}
                  >
                    <Text className="text-lg">{info.emoji}</Text>
                  </div>
                  <div>
                    <Text strong className={isActive ? '' : 'text-gray-400'}>
                      {info.name}
                    </Text>
                    <br />
                    <Text type="secondary" className="text-sm">
                      {info.description}
                    </Text>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <Badge 
                      count={streakDisplay.display} 
                      style={{ 
                        backgroundColor: streakDisplay.color,
                        fontSize: '14px',
                        minWidth: '32px',
                        height: '24px',
                        lineHeight: '22px'
                      }}
                      showZero
                    />
                    {info.currentValue >= 3 && (
                      <Tag color={info.color} className="border-0">
                        <FireOutlined /> Hot
                      </Tag>
                    )}
                  </div>
                </div>
              </div>
              
              {streakDisplay.showProgress && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <Text className="text-xs text-gray-500">
                      Progress to {streakDisplay.nextMilestone} days
                    </Text>
                    <Text className="text-xs font-medium" style={{ color: info.color }}>
                      {info.currentValue}/{streakDisplay.nextMilestone}
                    </Text>
                  </div>
                  <Progress 
                    percent={streakDisplay.progress} 
                    showInfo={false}
                    strokeColor={{
                      '0%': info.color,
                      '100%': info.color,
                    }}
                    trailColor="#f0f0f0"
                    size="small"
                  />
                </div>
              )}
              
              {/* Milestones */}
              {info.currentValue > 0 && (
                <div className="mt-2">
                  <div className="flex flex-wrap gap-1">
                    {info.milestones.map(milestone => {
                      const achieved = info.currentValue >= milestone;
                      return (
                        <Tag
                          key={milestone}
                          color={achieved ? info.color : 'default'}
                          className={`text-xs ${achieved ? 'border-0' : ''}`}
                          style={{
                            opacity: achieved ? 1 : 0.5,
                            fontSize: '10px',
                            padding: '1px 4px',
                            lineHeight: '16px'
                          }}
                        >
                          {achieved && <CheckCircleOutlined className="mr-1" />}
                          {milestone}d
                        </Tag>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Streak Tips */}
      <Alert
        message="🔥 Streak Tips"
        description={
          <ul className="mt-2 space-y-1 text-sm">
            <li>• Complete daily tasks to build your Task Master streak</li>
            <li>• Log in daily to maintain your fire streak 🔥</li>
            <li>• Perfect risk management builds Discipline Master status</li>
            <li>• Consistent platform usage unlocks bonus XP multipliers</li>
          </ul>
        }
        type="info"
        showIcon={false}
        className="mt-4"
      />

      {/* Celebration Modal */}
      <Modal
        title={null}
        visible={showCelebration}
        onOk={() => setShowCelebration(false)}
        onCancel={() => setShowCelebration(false)}
        footer={[
          <Button key="continue" type="primary" onClick={() => setShowCelebration(false)}>
            Continue Streak! 🔥
          </Button>
        ]}
        centered
        width={400}
      >
        {celebrationData && (
          <div className="text-center py-4">
            <div className="text-6xl mb-4">{celebrationData.emoji}</div>
            <Title level={3} className="mb-2">{celebrationData.title}</Title>
            <Paragraph className="text-lg mb-4">{celebrationData.description}</Paragraph>
            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 p-4 rounded-lg">
              <div className="flex items-center justify-center space-x-2">
                <StarOutlined style={{ color: '#faad14', fontSize: '20px' }} />
                <Text strong className="text-lg">+{celebrationData.xpReward} XP Bonus!</Text>
                <StarOutlined style={{ color: '#faad14', fontSize: '20px' }} />
              </div>
            </div>
            <Paragraph className="mt-4 text-sm text-gray-600">
              Keep up the amazing consistency! Your dedication is the key to trading success.
            </Paragraph>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default StreakTracker;
export type { StreakTrackerProps };
