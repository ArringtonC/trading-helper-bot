import React, { useState } from 'react';
import { Card, Typography, Button, Space, message } from 'antd';
import { Link } from 'react-router-dom';
import { ArrowLeftOutlined, CheckCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { 
  DailyWorkflowChecklist, 
  MOCK_CHALLENGE, 
  type ChallengeStreaks, 
  type Achievement, 
  type WorkflowPreferences 
} from '../../../features/challenges/components';

const { Title, Paragraph } = Typography;

/**
 * Daily Workflow Page
 * 
 * Enhanced daily workflow checklist page with gamification, streaks, and customization.
 */
const DailyWorkflowPage: React.FC = () => {
  const [preferences, setPreferences] = useState<WorkflowPreferences>({
    wakeUpTime: '06:30',
    marketPrepTime: 60,
    tradingStyle: 'DAY_TRADING',
    experienceLevel: 'INTERMEDIATE',
    focusAreas: ['RISK_MANAGEMENT', 'PSYCHOLOGY'],
    weekendEducation: true
  });
  
  const [dailyXP, setDailyXP] = useState(0);
  
  // Mock streaks data
  const mockStreaks: ChallengeStreaks = {
    dailyLogin: 12,
    taskCompletion: 8,
    riskDiscipline: 15,
    platformUsage: 20,
    profitableDays: 4
  };
  
  const handleTaskComplete = (taskId: string, data?: any) => {
    console.log('Task completed:', taskId, data);
    message.success('Task completed! Keep building those habits!');
  };
  
  const handleXPEarned = (xp: number, source: string) => {
    setDailyXP(prev => prev + xp);
    message.success(`+${xp} XP earned from ${source}!`);
  };
  
  const handleAchievementUnlocked = (achievement: Achievement) => {
    message.success({
      content: `Achievement Unlocked: ${achievement.name}!`,
      duration: 5,
      style: { marginTop: '10vh' }
    });
  };
  
  const handleStreakMilestone = (streakType: keyof ChallengeStreaks, milestone: number) => {
    message.success(`Streak milestone: ${milestone} day ${streakType} streak!`);
  };
  
  const handlePreferencesChange = (newPreferences: WorkflowPreferences) => {
    setPreferences(newPreferences);
    // In a real app, this would save to backend/localStorage
    console.log('Preferences updated:', newPreferences);
  };
  
  const getCurrentDayType = (): 'SUNDAY' | 'MONDAY' | 'EXECUTION' | 'FRIDAY' | 'WEEKEND' => {
    const today = new Date().getDay();
    switch (today) {
      case 0: return 'SUNDAY';
      case 1: return 'MONDAY';
      case 5: return 'FRIDAY';
      case 6: return 'WEEKEND';
      default: return 'EXECUTION';
    }
  };
  
  return (
    <div className="daily-workflow-page">
      {/* Header with Navigation */}
      <div className="mb-6">
        <Space>
          <Link to="/challenge">
            <Button icon={<ArrowLeftOutlined />} type="text">
              Back to Challenge Dashboard
            </Button>
          </Link>
        </Space>
        
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 text-white p-6 rounded-lg mt-4">
          <Space align="center" size="large">
            <CheckCircleOutlined style={{ fontSize: '2rem' }} />
            <div className="flex-1">
              <Title level={2} style={{ color: 'white', margin: 0 }}>
                📈 Enhanced Daily Workflow
              </Title>
              <Paragraph style={{ color: 'rgba(255,255,255,0.9)', margin: 0 }}>
                Build legendary trading habits with gamified workflows, streak tracking, and personalized education
              </Paragraph>
            </div>
            <div className="text-right">
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Today's XP</div>
              <div style={{ color: '#ffd700', fontSize: '24px', fontWeight: 'bold' }}>+{dailyXP}</div>
            </div>
          </Space>
        </div>
      </div>

      {/* Enhanced Daily Workflow */}
      <DailyWorkflowChecklist 
        challengeId={MOCK_CHALLENGE.id}
        currentDay={MOCK_CHALLENGE.currentDay}
        dayType={getCurrentDayType()}
        challenge={MOCK_CHALLENGE}
        streaks={mockStreaks}
        onTaskComplete={handleTaskComplete}
        onPatienceScoreUpdate={(score) => console.log('Patience score:', score)}
        onTradeQualityUpdate={(assessment) => console.log('Trade quality:', assessment)}
        onXPEarned={handleXPEarned}
        onAchievementUnlocked={handleAchievementUnlocked}
        onStreakMilestone={handleStreakMilestone}
        todaysTrades={0}
        preferences={preferences}
        onPreferencesChange={handlePreferencesChange}
      />
      
      {/* Enhanced Navigation */}
      <Card className="mt-6">
        <div className="flex items-center justify-between">
          <div>
            <Title level={4} className="mb-2">Continue Your Journey</Title>
            <Space wrap>
              <Button type="primary">
                <Link to="/challenge/planning">📋 Weekly Planning</Link>
              </Button>
              <Button>
                <Link to="/challenge/progress">📈 View Progress</Link>
              </Button>
              <Button>
                <Link to="/challenge">🏠 Dashboard</Link>
              </Button>
            </Space>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Character Level</div>
            <div className="text-2xl font-bold text-purple-600">{MOCK_CHALLENGE.characterLevel}</div>
            <div className="text-xs text-gray-500">Total XP: {MOCK_CHALLENGE.totalXP.toLocaleString()}</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DailyWorkflowPage;