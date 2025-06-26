import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Tabs,
  Button,
  Select,
  DatePicker,
  Spin,
  Alert,
  Statistic,
  Progress
} from 'antd';
import {
  DashboardOutlined,
  TrophyOutlined,
  FireOutlined,
  BarChartOutlined,
  CalendarOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { 
  AnalyticsDataService, 
  PerformanceMetrics, 
  WinRateAnalysis, 
  RPGProgress, 
  StreakData, 
  UserActivity, 
  DateRange 
} from '../../../services/AnalyticsDataService';
import { 
  Challenge, 
  ChallengeProgress, 
  MOCK_CHALLENGE,
  MOCK_WEEKLY_MILESTONES,
  MOCK_TODAYS_TASKS,
  MOCK_ACHIEVEMENTS
} from '../../challenges/types/challenge';
import { NormalizedTradeData } from '../../../types/trade';
import PerformanceCharts from './PerformanceCharts';
import XPProgressChart from './XPProgressChart';
import StreakVisualization from './StreakVisualization';
import WinRateAnalysisChart from './WinRateAnalysis';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

interface ChallengeAnalyticsDashboardProps {
  challengeId?: string;
  className?: string;
}

const ChallengeAnalyticsDashboard: React.FC<ChallengeAnalyticsDashboardProps> = ({
  challengeId,
  className = ''
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
    endDate: new Date()
  });
  
  // Analytics state
  const [trades, setTrades] = useState<NormalizedTradeData[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [winRateAnalysis, setWinRateAnalysis] = useState<WinRateAnalysis | null>(null);
  const [rpgProgress, setRPGProgress] = useState<RPGProgress | null>(null);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  
  // Challenge state
  const [challenge, setChallenge] = useState<Challenge>(MOCK_CHALLENGE);
  const [challengeProgress, setChallengeProgress] = useState<ChallengeProgress | null>(null);

  const analyticsService = new AnalyticsDataService();

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange, challengeId]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Load trade data
      const tradesData = await analyticsService.getAllTrades();
      setTrades(tradesData);

      // Calculate performance metrics
      const metrics = analyticsService.calculatePerformanceMetrics(tradesData);
      setPerformanceMetrics(metrics);

      // Generate win rate analysis
      const winRateData = await analyticsService.generateWinRateAnalysis(dateRange);
      setWinRateAnalysis(winRateData);

      // Create RPG progress from challenge
      const rpgData = analyticsService.createRPGProgressData(challenge);
      setRPGProgress(rpgData);

      // Generate mock user activities for streak calculation
      const mockActivities = generateMockUserActivities();
      const streakMetrics = analyticsService.calculateStreakMetrics(mockActivities);
      setStreakData(streakMetrics);

      // Create challenge progress summary
      const progressData = createChallengeProgress(challenge, metrics);
      setChallengeProgress(progressData);

    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockUserActivities = (): UserActivity[] => {
    const activities: UserActivity[] = [];
    const daysBack = 30;
    
    for (let i = 0; i < daysBack; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Generate login activities (85% chance per day)
      if (Math.random() > 0.15) {
        activities.push({
          date,
          type: 'LOGIN',
          value: 1
        });
      }
      
      // Generate task completion activities (70% chance per day)
      if (Math.random() > 0.30) {
        activities.push({
          date,
          type: 'TASK_COMPLETION',
          value: Math.floor(Math.random() * 5) + 1 // 1-5 tasks
        });
      }
      
      // Generate platform usage (60% chance per day)
      if (Math.random() > 0.40) {
        activities.push({
          date,
          type: 'PLATFORM_USE',
          value: Math.floor(Math.random() * 60) + 10 // 10-70 minutes
        });
      }
      
      // Generate trade activities (40% chance per day)
      if (Math.random() > 0.60) {
        activities.push({
          date,
          type: 'TRADE',
          value: Math.random() > 0.5 ? 1 : -1 // Profitable or losing day
        });
      }
    }
    
    return activities.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const createChallengeProgress = (challenge: Challenge, metrics: PerformanceMetrics): ChallengeProgress => {
    const daysElapsed = Math.floor((new Date().getTime() - challenge.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const progressPercent = ((challenge.currentAmount - challenge.startingAmount) / (challenge.targetAmount - challenge.startingAmount)) * 100;
    
    return {
      challenge,
      currentBalance: challenge.currentAmount,
      todaysProgress: Math.random() * 500 - 250, // Mock daily progress
      weeklyProgress: Math.random() * 2000 - 1000, // Mock weekly progress
      overallProgress: progressPercent,
      daysRemaining: challenge.totalDays - daysElapsed,
      onTrackForTarget: progressPercent >= (daysElapsed / challenge.totalDays) * 100,
      weeklyMilestones: MOCK_WEEKLY_MILESTONES,
      recentTasks: MOCK_TODAYS_TASKS,
      streaks: {
        dailyLogin: streakData?.loginStreak.current || 0,
        taskCompletion: streakData?.taskCompletionStreak.current || 0,
        riskDiscipline: streakData?.riskDisciplineStreak.current || 0,
        platformUsage: streakData?.platformUsageStreak.current || 0,
        profitableDays: streakData?.profitableDaysStreak.current || 0
      },
      achievements: MOCK_ACHIEVEMENTS.filter(a => a.unlocked)
    };
  };

  const refreshData = () => {
    loadAnalyticsData();
  };

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setDateRange({
        startDate: dates[0].toDate(),
        endDate: dates[1].toDate()
      });
    }
  };

  if (loading && !performanceMetrics) {
    return (
      <Card className={`challenge-analytics-dashboard ${className}`}>
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={`challenge-analytics-dashboard ${className}`}
      title={
        <div className="flex justify-between items-center">
          <span>🏆 Challenge Analytics Dashboard</span>
          <div className="flex items-center space-x-2">
            <RangePicker
              value={[dateRange.startDate as any, dateRange.endDate as any]}
              onChange={handleDateRangeChange}
              size="small"
            />
            <Button 
              type="primary" 
              icon={<ReloadOutlined />} 
              onClick={refreshData}
              loading={loading}
              size="small"
            >
              Refresh
            </Button>
          </div>
        </div>
      }
    >
      {/* Challenge Overview Header */}
      {challengeProgress && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={12} sm={6}>
            <Card size="small" className="text-center">
              <Statistic
                title="Challenge Progress"
                value={challengeProgress.overallProgress}
                precision={1}
                suffix="%"
                prefix={<TrophyOutlined />}
                valueStyle={{ 
                  color: challengeProgress.onTrackForTarget ? '#52c41a' : '#fa8c16' 
                }}
              />
              <Progress 
                percent={challengeProgress.overallProgress} 
                strokeColor={challengeProgress.onTrackForTarget ? '#52c41a' : '#fa8c16'}
                showInfo={false}
                size="small"
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" className="text-center">
              <Statistic
                title="Days Remaining"
                value={challengeProgress.daysRemaining}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" className="text-center">
              <Statistic
                title="Current Level"
                value={challenge.characterLevel}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" className="text-center">
              <Statistic
                title="Total XP"
                value={challenge.totalXP}
                prefix={<FireOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Track Status Alert */}
      {challengeProgress && (
        <Alert
          message={
            challengeProgress.onTrackForTarget
              ? '🎯 On Track for Target!'
              : '⚠️ Behind Target Pace'
          }
          description={
            challengeProgress.onTrackForTarget
              ? 'Great work! You\'re ahead of schedule to reach your challenge goal.'
              : 'Consider increasing your daily performance or extending your timeline.'
          }
          type={challengeProgress.onTrackForTarget ? 'success' : 'warning'}
          showIcon
          className="mb-6"
        />
      )}

      {/* Analytics Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={<span><BarChartOutlined />Performance</span>} key="performance">
          {performanceMetrics && winRateAnalysis && (
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <PerformanceCharts
                  trades={trades}
                  performanceMetrics={performanceMetrics}
                  winRateAnalysis={winRateAnalysis}
                  loading={loading}
                />
              </Col>
            </Row>
          )}
        </TabPane>

        <TabPane tab={<span><TrophyOutlined />RPG Progress</span>} key="rpg">
          {rpgProgress && (
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <XPProgressChart rpgProgress={rpgProgress} />
              </Col>
            </Row>
          )}
        </TabPane>

        <TabPane tab={<span><FireOutlined />Streaks</span>} key="streaks">
          {streakData && (
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <StreakVisualization streakData={streakData} />
              </Col>
            </Row>
          )}
        </TabPane>

        <TabPane tab={<span><DashboardOutlined />Win Rate</span>} key="winrate">
          {winRateAnalysis && (
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <WinRateAnalysisChart
                  winRateAnalysis={winRateAnalysis}
                  trades={trades}
                />
              </Col>
            </Row>
          )}
        </TabPane>

        <TabPane tab={<span><TrophyOutlined />Combined View</span>} key="overview">
          <Row gutter={[16, 16]}>
            {/* RPG Progress - Top Half */}
            <Col xs={24} lg={12}>
              {rpgProgress && <XPProgressChart rpgProgress={rpgProgress} />}
            </Col>
            
            {/* Streaks - Top Half */}
            <Col xs={24} lg={12}>
              {streakData && <StreakVisualization streakData={streakData} />}
            </Col>
            
            {/* Performance Charts - Bottom */}
            <Col span={24}>
              {performanceMetrics && winRateAnalysis && (
                <PerformanceCharts
                  trades={trades}
                  performanceMetrics={performanceMetrics}
                  winRateAnalysis={winRateAnalysis}
                  loading={loading}
                />
              )}
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default ChallengeAnalyticsDashboard;
export type { ChallengeAnalyticsDashboardProps };