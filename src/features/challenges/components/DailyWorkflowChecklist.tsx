import React, { useState, useMemo, useEffect } from 'react';
import {
  Card,
  Checkbox,
  Progress,
  Button,
  Space,
  Typography,
  Badge,
  Tag,
  Alert,
  Slider,
  Input,
  Radio,
  message,
  Tooltip,
  Divider,
  Row,
  Col,
  Modal,
  Statistic,
  Timeline,
  Collapse
} from 'antd';
import {
  ClockCircleOutlined,
  TrophyOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  FireOutlined,
  RiseOutlined,
  FallOutlined,
  CoffeeOutlined,
  LineChartOutlined,
  SafetyOutlined,
  StarOutlined,
  ThunderboltOutlined,
  SettingOutlined,
  CalendarOutlined,
  BulbOutlined
} from '@ant-design/icons';
import type { DailyTask, TradeQualityAssessment, BuyBoxCriteria, Challenge, ChallengeStreaks, Achievement } from '../types/challenge';
import DailyWorkflowTemplateEngine, { type WorkflowPreferences } from './DailyWorkflowTemplateEngine';
import StreakTracker from './StreakTracker';
import WeekendEducationModule from './WeekendEducationModule';
import WorkflowCustomizer from './WorkflowCustomizer';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface DailyWorkflowChecklistProps {
  challengeId: string;
  currentDay: number;
  dayType: 'SUNDAY' | 'MONDAY' | 'EXECUTION' | 'FRIDAY' | 'WEEKEND';
  todaysTasks?: DailyTask[];
  challenge: Challenge;
  streaks: ChallengeStreaks;
  onTaskComplete: (taskId: string, data?: any) => void;
  onPatienceScoreUpdate?: (score: number) => void;
  onTradeQualityUpdate?: (assessment: TradeQualityAssessment) => void;
  onXPEarned?: (xp: number, source: string) => void;
  onAchievementUnlocked?: (achievement: Achievement) => void;
  onStreakMilestone?: (streakType: keyof ChallengeStreaks, milestone: number) => void;
  todaysTrades?: number;
  buyBoxCriteria?: BuyBoxCriteria;
  preferences?: WorkflowPreferences;
  onPreferencesChange?: (preferences: WorkflowPreferences) => void;
}

const DailyWorkflowChecklist: React.FC<DailyWorkflowChecklistProps> = ({
  challengeId,
  currentDay,
  dayType,
  todaysTasks: externalTasks,
  challenge,
  streaks,
  onTaskComplete,
  onPatienceScoreUpdate,
  onTradeQualityUpdate,
  onXPEarned,
  onAchievementUnlocked,
  onStreakMilestone,
  todaysTrades = 0,
  buyBoxCriteria,
  preferences,
  onPreferencesChange
}) => {
  const [templateEngine] = useState(() => new DailyWorkflowTemplateEngine());
  const [todaysTasks, setTodaysTasks] = useState<DailyTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{
    title: string;
    description: string;
    xpEarned: number;
    achievement?: Achievement;
  } | null>(null);
  const [morningPatienceScore, setMorningPatienceScore] = useState<number>(7);
  const [endOfDayPatienceScore, setEndOfDayPatienceScore] = useState<number>(7);
  const [setupQuality, setSetupQuality] = useState<'A+' | 'A' | 'B' | 'C' | 'F' | ''>('');
  const [lessonsLearned, setLessonsLearned] = useState<string>('');
  const [buyBoxChecklist, setBuyBoxChecklist] = useState<Record<string, boolean>>({});
  const [showNoTradeModal, setShowNoTradeModal] = useState(false);
  const [currentTimeSlot, setCurrentTimeSlot] = useState<string>('');
  const [dailyXPEarned, setDailyXPEarned] = useState(0);
  const [weekendEducationOpen, setWeekendEducationOpen] = useState(false);

  // Initialize tasks from template engine
  useEffect(() => {
    if (externalTasks && externalTasks.length > 0) {
      setTodaysTasks(externalTasks);
      setCompletedTasks(new Set(externalTasks.filter(task => task.status === 'COMPLETED').map(task => task.id)));
    } else {
      // Generate tasks from template engine
      const generatedTasks = templateEngine.generateDailyTasks(
        challenge,
        currentDay,
        dayType,
        preferences
      );
      setTodaysTasks(generatedTasks);
      setCompletedTasks(new Set());
    }
  }, [challenge, currentDay, dayType, preferences, externalTasks, templateEngine]);

  // Update current time slot
  useEffect(() => {
    const updateTimeSlot = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const currentTime = hours * 60 + minutes;
      
      if (currentTime < 9 * 60 + 30) {
        setCurrentTimeSlot('🌅 Pre-Market Preparation');
      } else if (currentTime < 16 * 60) {
        setCurrentTimeSlot('⚔️ Combat Phase');
      } else if (currentTime < 17 * 60) {
        setCurrentTimeSlot('📊 Post-Market Analysis');
      } else {
        setCurrentTimeSlot('🌙 Evening Reflection');
      }
    };
    
    updateTimeSlot();
    const interval = setInterval(updateTimeSlot, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  const categoryColors: Record<string, string> = {
    'PRE_MARKET': '#1890ff',
    'MARKET_HOURS': '#52c41a',
    'POST_MARKET': '#722ed1',
    'ANALYSIS': '#fa8c16',
    'PLANNING': '#13c2c2',
    'SKILL_BUILDING': '#eb2f96'
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    'PRE_MARKET': <CoffeeOutlined />,
    'MARKET_HOURS': <LineChartOutlined />,
    'POST_MARKET': <SafetyOutlined />,
    'ANALYSIS': <RiseOutlined />,
    'PLANNING': <FallOutlined />,
    'SKILL_BUILDING': <TrophyOutlined />
  };

  const getDayTitle = () => {
    const titles = {
      'SUNDAY': `📅 Sunday Planning Day - Day ${currentDay}`,
      'MONDAY': `📊 Monday Setup Day - Day ${currentDay}`,
      'EXECUTION': `📈 Execution Day - Day ${currentDay}`,
      'FRIDAY': `📋 Friday Review Day - Day ${currentDay}`,
      'WEEKEND': `🏖️ Weekend Day - Day ${currentDay}`
    };
    return titles[dayType];
  };

  const getDayDescription = () => {
    const descriptions = {
      'SUNDAY': 'Plan your week, review last week, prepare strategies',
      'MONDAY': 'Analyze ranges, no major positions, set up for the week',
      'EXECUTION': '🎯 SLOW DOWN - Hunt A+ setups only - 0-2 trades max',
      'FRIDAY': 'Review performance, close day trades, prepare for weekend',
      'WEEKEND': 'Rest, learn, prepare for next week'
    };
    return descriptions[dayType];
  };

  const progress = useMemo(() => {
    return Math.round((completedTasks.size / todaysTasks.length) * 100);
  }, [completedTasks, todaysTasks]);

  const estimatedTimeRemaining = useMemo(() => {
    return todaysTasks
      .filter(task => !completedTasks.has(task.id))
      .reduce((sum, task) => sum + task.estimatedMinutes, 0);
  }, [todaysTasks, completedTasks]);

  const handleTaskComplete = (taskId: string) => {
    const task = todaysTasks.find(t => t.id === taskId);
    if (!task) return;

    if (completedTasks.has(taskId)) {
      // Uncomplete task
      setCompletedTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
      setDailyXPEarned(prev => prev - (task.xpReward + (task.bonusXP || 0)));
    } else {
      // Complete task
      setCompletedTasks(prev => new Set(prev).add(taskId));
      
      // Calculate XP with bonuses
      const baseXP = task.xpReward;
      const bonusXP = task.bonusXP || 0;
      const streakBonus = getStreakBonus();
      const totalXP = baseXP + bonusXP + streakBonus;
      
      setDailyXPEarned(prev => prev + totalXP);
      onXPEarned?.(totalXP, `Task: ${task.title}`);
      
      // Show celebration for significant XP gains
      if (totalXP >= 50) {
        triggerCelebration({
          title: `🎉 Great Work!`,
          description: `Completed: ${task.title}`,
          xpEarned: totalXP
        });
      }
      
      // Special handling for specific tasks
      if (task.title.includes('patience check')) {
        onPatienceScoreUpdate?.(morningPatienceScore);
      }
      
      if (task.title.includes('Execute 0-2 A+ setups') || task.title.includes('Combat Execution')) {
        if (todaysTrades === 0) {
          // Patience bonus
          const patienceBonus = 25;
          onXPEarned?.(patienceBonus, 'Patience Bonus - No Trade Day');
          setShowNoTradeModal(true);
        }
      }
      
      // Check for completion milestones
      checkCompletionMilestones(completedTasks.size + 1);
    }

    onTaskComplete(taskId);
  };
  
  const getStreakBonus = (): number => {
    const taskStreak = streaks.taskCompletion;
    if (taskStreak >= 30) return 15;
    if (taskStreak >= 14) return 10;
    if (taskStreak >= 7) return 5;
    return 0;
  };
  
  const triggerCelebration = (data: {
    title: string;
    description: string;
    xpEarned: number;
    achievement?: Achievement;
  }) => {
    setCelebrationData(data);
    setShowCelebration(true);
  };
  
  const checkCompletionMilestones = (completedCount: number) => {
    const totalTasks = todaysTasks.length;
    const progressPercent = (completedCount / totalTasks) * 100;
    
    // 50% completion milestone
    if (progressPercent === 50) {
      const achievement: Achievement = {
        id: `halfway-${Date.now()}`,
        name: 'Halfway Hero',
        description: 'Completed 50% of daily tasks',
        icon: '🏃‍♂️',
        category: 'MILESTONE',
        progress: 1,
        target: 1,
        unlocked: true,
        unlockedAt: new Date(),
        points: 25,
        xpReward: 50,
        skillPointReward: 1,
        tier: 'BRONZE'
      };
      onAchievementUnlocked?.(achievement);
      triggerCelebration({
        title: '🏃‍♂️ Halfway Hero!',
        description: 'You\'re halfway through your daily workflow!',
        xpEarned: 50,
        achievement
      });
    }
    
    // 100% completion milestone
    if (progressPercent === 100) {
      const achievement: Achievement = {
        id: `perfect-day-${Date.now()}`,
        name: 'Perfect Day',
        description: 'Completed all daily tasks',
        icon: '🌟',
        category: 'COMPLETION',
        progress: 1,
        target: 1,
        unlocked: true,
        unlockedAt: new Date(),
        points: 100,
        xpReward: 100,
        skillPointReward: 3,
        tier: 'GOLD'
      };
      onAchievementUnlocked?.(achievement);
      triggerCelebration({
        title: '🌟 Perfect Day!',
        description: 'All daily tasks completed! You\'re building incredible discipline!',
        xpEarned: 100,
        achievement
      });
    }
  };

  const handleSetupQualitySubmit = () => {
    if (!setupQuality) {
      message.warning('Please grade your setup quality');
      return;
    }

    const assessment: TradeQualityAssessment = {
      tradeId: `trade-${Date.now()}`,
      setupQuality,
      buyBoxMatch: Object.values(buyBoxChecklist).filter(v => v).length / Object.keys(buyBoxChecklist).length * 100,
      criteriaChecklist: buyBoxChecklist,
      patienceScore: endOfDayPatienceScore,
      notes: lessonsLearned,
      lessonsLearned
    };

    onTradeQualityUpdate?.(assessment);
    message.success('Trade quality assessment saved!');
  };

  const renderTaskItem = (task: DailyTask) => {
    const isCompleted = completedTasks.has(task.id);
    const isInProgress = task.status === 'IN_PROGRESS';

    return (
      <div
        key={task.id}
        className={`
          p-4 mb-3 rounded-lg border transition-all duration-200
          ${isCompleted ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}
          ${isInProgress ? 'border-blue-400 shadow-sm' : ''}
          hover:shadow-md
        `}
      >
        <div className="flex items-start space-x-3">
          <Checkbox
            checked={isCompleted}
            onChange={() => handleTaskComplete(task.id)}
            className="mt-1"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <Tag color={categoryColors[task.category]}>
                  {categoryIcons[task.category]} {task.category.replace('_', ' ')}
                </Tag>
                <Text strong className={isCompleted ? 'line-through text-gray-500' : ''}>
                  {task.title}
                </Text>
                {task.required && <Badge status="error" text="Required" />}
              </div>
              <div className="flex items-center space-x-2">
                <ClockCircleOutlined className="text-gray-400" />
                <Text type="secondary">{task.estimatedMinutes} min</Text>
              </div>
            </div>
            <Paragraph className="mb-0 text-gray-600" ellipsis={{ rows: 2 }}>
              {task.description}
            </Paragraph>

            {/* Special UI for specific tasks */}
            {task.title.includes('Morning patience check') && !isCompleted && (
              <div className="mt-3 p-3 bg-blue-50 rounded">
                <Text>Rate your patience level this morning (1-10):</Text>
                <Slider
                  min={1}
                  max={10}
                  value={morningPatienceScore}
                  onChange={setMorningPatienceScore}
                  marks={{
                    1: '1',
                    5: '5',
                    10: '10'
                  }}
                />
                <Text type="secondary">
                  {morningPatienceScore >= 8 ? '🧘 Excellent mindset!' : 
                   morningPatienceScore >= 6 ? '👍 Good patience level' : 
                   '⚠️ Consider waiting for better setups'}
                </Text>
              </div>
            )}

            {task.title.includes('Execute 0-2 A+ setups') && (
              <div className="mt-3">
                {todaysTrades === 0 && (
                  <Alert
                    message="No trades today? That's GREAT! 🎉"
                    description="Remember: No trades is better than bad trades. Quality over quantity!"
                    type="success"
                    showIcon
                    icon={<TrophyOutlined />}
                  />
                )}
                {todaysTrades > 2 && (
                  <Alert
                    message="Trade limit exceeded!"
                    description="You've made more than 2 trades today. Review your discipline."
                    type="error"
                    showIcon
                  />
                )}
              </div>
            )}

            {task.title.includes('End-of-day review') && !isCompleted && (
              <div className="mt-3 p-3 bg-purple-50 rounded space-y-3">
                <div>
                  <Text strong>Grade today's setups:</Text>
                  <Radio.Group
                    value={setupQuality}
                    onChange={e => setSetupQuality(e.target.value)}
                    className="mt-2"
                  >
                    <Radio.Button value="A+">A+ 🌟</Radio.Button>
                    <Radio.Button value="A">A 👍</Radio.Button>
                    <Radio.Button value="B">B 🤔</Radio.Button>
                    <Radio.Button value="C">C 😕</Radio.Button>
                    <Radio.Button value="F">F 😞</Radio.Button>
                  </Radio.Group>
                </div>

                <div>
                  <Text strong>End-of-day patience score:</Text>
                  <Slider
                    min={1}
                    max={10}
                    value={endOfDayPatienceScore}
                    onChange={setEndOfDayPatienceScore}
                    marks={{
                      1: '1',
                      5: '5',
                      10: '10'
                    }}
                  />
                </div>

                <div>
                  <Text strong>Lessons learned today:</Text>
                  <TextArea
                    rows={3}
                    value={lessonsLearned}
                    onChange={e => setLessonsLearned(e.target.value)}
                    placeholder="What did you learn? What will you do differently tomorrow?"
                  />
                </div>

                <Button type="primary" onClick={handleSetupQualitySubmit}>
                  Save Assessment
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTasksByCategory = () => {
    const tasksByCategory = todaysTasks.reduce((acc, task) => {
      if (!acc[task.category]) acc[task.category] = [];
      acc[task.category].push(task);
      return acc;
    }, {} as Record<string, DailyTask[]>);

    const categoryOrder = ['PRE_MARKET', 'MARKET_HOURS', 'POST_MARKET', 'ANALYSIS', 'PLANNING', 'SKILL_BUILDING'];

    return categoryOrder.map(category => {
      const tasks = tasksByCategory[category];
      if (!tasks || tasks.length === 0) return null;

      return (
        <div key={category} className="mb-6">
          <Title level={5} className="mb-3">
            {categoryIcons[category]} {category.replace(/_/g, ' ')}
          </Title>
          {tasks.sort((a, b) => a.sortOrder - b.sortOrder).map(renderTaskItem)}
        </div>
      );
    });
  };

  if (dayType === 'WEEKEND' && weekendEducationOpen) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <Button onClick={() => setWeekendEducationOpen(false)}>
            ← Back to Workflow
          </Button>
          <StreakTracker streaks={streaks} onStreakMilestone={onStreakMilestone} compact />
        </div>
        <WeekendEducationModule
          challenge={challenge}
          currentDay={currentDay}
          onModuleComplete={(moduleId, xp) => onXPEarned?.(xp, `Education Module: ${moduleId}`)}
          onSkillPointsEarned={(skill, points) => console.log(`Skill points earned: ${skill} +${points}`)}
        />
      </div>
    );
  }

  return (
    <div className="daily-workflow-checklist space-y-6">
      {/* Enhanced Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <Title level={3} className="mb-0">{getDayTitle()}</Title>
              <Badge count={currentTimeSlot} style={{ backgroundColor: '#1890ff' }} />
            </div>
            <Paragraph type="secondary" className="text-lg mb-0">
              {getDayDescription()}
            </Paragraph>
          </div>
          <div className="flex items-center space-x-4">
            <StreakTracker streaks={streaks} onStreakMilestone={onStreakMilestone} compact />
            <Button 
              icon={<SettingOutlined />} 
              onClick={() => setShowCustomizer(true)}
              type="text"
            >
              Customize
            </Button>
          </div>
        </div>
        
        {/* Daily XP Progress */}
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Statistic
              title="Today's XP"
              value={dailyXPEarned}
              prefix={<StarOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Progress"
              value={progress}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Time Left"
              value={estimatedTimeRemaining}
              suffix="min"
              prefix={<ClockCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Character Level"
              value={challenge.characterLevel}
              prefix={<TrophyOutlined style={{ color: '#722ed1' }} />}
            />
          </Col>
        </Row>
      </Card>

      {/* Weekend Education Option */}
      {dayType === 'WEEKEND' && (
        <Alert
          message="🎓 Weekend Skill Building Available"
          description="Take advantage of your weekend to build trading skills with educational modules."
          type="info"
          action={
            <Button 
              size="small" 
              type="primary"
              onClick={() => setWeekendEducationOpen(true)}
            >
              Start Learning
            </Button>
          }
          showIcon
        />
      )}

      {/* Main Workflow Card */}
      <Card title={`📋 Daily Workflow - ${getDayTitle()}`}>
        <div className="mb-6">

        {dayType === 'EXECUTION' && (
          <Alert
            message="🎯 LEGENDARY WARRIOR PRINCIPLES"
            description={
              <div>
                <div className="mb-3">
                  <Text strong>Combat Rules for {challenge.selectedStrategyClass.replace('_', ' ')} Class:</Text>
                </div>
                <ul className="space-y-1">
                  <li>• Hunt only LEGENDARY setups (A+ grade) - No common trades!</li>
                  <li>• Maximum 2 battles per day - Quality over quantity</li>
                  <li>• No trades = Patience Master bonus XP (+25)</li>
                  <li>• Stick to your class strategy for bonus multipliers</li>
                  <li>• Risk never exceeds 1% per battle</li>
                </ul>
                <div className="mt-3 p-2 bg-yellow-50 rounded">
                  <Text className="text-sm">
                    💡 <strong>Pro Tip:</strong> Every skipped bad setup makes you stronger. 
                    Patience is your ultimate weapon!
                  </Text>
                </div>
              </div>
            }
            type="warning"
            showIcon
            icon={<ThunderboltOutlined />}
            className="mb-4"
          />
        )}

        <Row gutter={16} className="mb-4">
          <Col span={8}>
            <Card size="small" className="bg-gradient-to-r from-green-50 to-green-100">
              <div className="flex items-center justify-between">
                <Text type="secondary">Progress</Text>
                <Text strong style={{ color: '#52c41a' }}>{progress}%</Text>
              </div>
              <Progress percent={progress} showInfo={false} strokeColor="#52c41a" />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" className="bg-gradient-to-r from-orange-50 to-orange-100">
              <div className="flex items-center justify-between">
                <Text type="secondary">Time Remaining</Text>
                <Text strong style={{ color: '#fa8c16' }}>{estimatedTimeRemaining} min</Text>
              </div>
              <Progress 
                percent={Math.max(0, 100 - (estimatedTimeRemaining / todaysTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0) * 100))} 
                showInfo={false} 
                strokeColor="#fa8c16"
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" className="bg-gradient-to-r from-purple-50 to-purple-100">
              <div className="flex items-center justify-between">
                <Text type="secondary">XP Progress</Text>
                <Text strong style={{ color: '#722ed1' }}>+{dailyXPEarned}</Text>
              </div>
              <Progress 
                percent={Math.min(100, (dailyXPEarned / 500) * 100)} 
                showInfo={false} 
                strokeColor="#722ed1"
              />
            </Card>
          </Col>
        </Row>
      </div>

      <Divider />

      <div className="task-list">
        {renderTasksByCategory()}
      </div>

      <Divider />

      <div className="flex justify-between items-center">
        <Space>
          <Button 
            type="primary" 
            icon={<CheckCircleOutlined />}
            disabled={completedTasks.size !== todaysTasks.length}
            className="bg-gradient-to-r from-green-500 to-green-600 border-0"
          >
            Complete Day (+100 XP)
          </Button>
          <Button 
            icon={<FireOutlined />}
            onClick={() => message.success('Progress saved!')}
          >
            Save Progress
          </Button>
          {dayType === 'WEEKEND' && (
            <Button 
              icon={<BulbOutlined />}
              onClick={() => setWeekendEducationOpen(true)}
            >
              Skill Building
            </Button>
          )}
        </Space>
        <Space>
          <div className="text-right">
            <div className="text-xs text-gray-500">Daily XP</div>
            <div className="font-bold text-lg" style={{ color: '#faad14' }}>+{dailyXPEarned}</div>
          </div>
          <StreakTracker 
            streaks={streaks} 
            onStreakMilestone={onStreakMilestone}
            onCelebration={onAchievementUnlocked}
            compact 
          />
        </Space>
      </div>
      </Card>

      {/* Customizer Modal */}
      <Modal
        title="🛠️ Customize Your Workflow"
        visible={showCustomizer}
        onCancel={() => setShowCustomizer(false)}
        footer={null}
        width={900}
      >
        <WorkflowCustomizer
          challenge={challenge}
          preferences={preferences || {
            tradingStyle: 'DAY_TRADING',
            experienceLevel: 'INTERMEDIATE',
            focusAreas: [],
            weekendEducation: true
          }}
          onPreferencesChange={onPreferencesChange || (() => {})}
          onSave={() => {
            setShowCustomizer(false);
            message.success('Workflow customized!');
          }}
        />
      </Modal>

      {/* Enhanced Celebration Modal */}
      <Modal
        title={null}
        visible={showCelebration}
        onOk={() => setShowCelebration(false)}
        onCancel={() => setShowCelebration(false)}
        footer={[
          <Button key="continue" type="primary" onClick={() => setShowCelebration(false)}>
            Continue Building! 🚀
          </Button>
        ]}
        centered
        width={400}
      >
        {celebrationData && (
          <div className="text-center py-6">
            <div className="text-6xl mb-4">🎉</div>
            <Title level={3} className="mb-2">{celebrationData.title}</Title>
            <Paragraph className="text-lg mb-4">{celebrationData.description}</Paragraph>
            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 p-4 rounded-lg mb-4">
              <div className="flex items-center justify-center space-x-2">
                <StarOutlined style={{ color: '#faad14', fontSize: '24px' }} />
                <Text strong className="text-xl">+{celebrationData.xpEarned} XP!</Text>
                <StarOutlined style={{ color: '#faad14', fontSize: '24px' }} />
              </div>
            </div>
            {celebrationData.achievement && (
              <Alert
                message={`🏆 Achievement Unlocked: ${celebrationData.achievement.name}`}
                description={celebrationData.achievement.description}
                type="success"
                showIcon
                className="mb-4"
              />
            )}
            <Paragraph className="text-sm text-gray-600">
              Keep building those trading habits! Every completed task makes you a stronger trader.
            </Paragraph>
          </div>
        )}
      </Modal>

      {/* Enhanced No-Trade Modal */}
      <Modal
        title="🧘‍♂️ Patience Master Achievement!"
        visible={showNoTradeModal}
        onOk={() => setShowNoTradeModal(false)}
        onCancel={() => setShowNoTradeModal(false)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setShowNoTradeModal(false)}>
            Continue the Journey! 🚀
          </Button>
        ]}
        centered
        width={500}
      >
        <div className="text-center py-6">
          <div className="text-6xl mb-4">🧘‍♂️</div>
          <Title level={3} className="mb-4">Legendary Patience Displayed!</Title>
          <Paragraph className="text-lg mb-4">
            No trades today means you waited for legendary setups and didn't force anything.
            This is the mark of a true {challenge.selectedStrategyClass.replace('_', ' ')} warrior!
          </Paragraph>
          
          <div className="bg-gradient-to-r from-green-100 to-blue-100 p-4 rounded-lg mb-4">
            <div className="space-y-2">
              <Alert
                message="🏆 Achievement: Patience Master"
                type="success"
                showIcon={false}
                className="border-0 bg-transparent"
              />
              <div className="flex items-center justify-center space-x-2">
                <StarOutlined style={{ color: '#faad14', fontSize: '20px' }} />
                <Text strong className="text-lg">+25 Bonus XP!</Text>
                <StarOutlined style={{ color: '#faad14', fontSize: '20px' }} />
              </div>
              <Text className="text-sm text-gray-600">
                Patience streak: {streaks.riskDiscipline} days
              </Text>
            </div>
          </div>
          
          <div className="text-left">
            <Title level={5}>Why This Matters:</Title>
            <ul className="space-y-1 text-sm">
              <li>• 90% of profitable traders wait for perfect setups</li>
              <li>• Your discipline prevents costly mistakes</li>
              <li>• Patience compounds into massive long-term gains</li>
              <li>• You\'re building the mindset of elite traders</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DailyWorkflowChecklist;