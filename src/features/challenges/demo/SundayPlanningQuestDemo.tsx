/**
 * Sunday Planning Quest Demo Page
 * 
 * Demonstrates the complete Sunday Planning Quest experience with:
 * - Live WeeklyMarketScanService integration
 * - RPG-style quest progression 
 * - Strategy class selection and scanning
 * - Interactive watchlist building
 * - XP rewards and challenge integration
 */

import React, { useState } from 'react';
import { Card, Typography, Space, Button, Alert, Row, Col } from 'antd';
import { RocketOutlined, TrophyOutlined, FireOutlined } from '@ant-design/icons';

import SundayPlanningQuest from '../components/SundayPlanningQuest';
import { 
  MOCK_CHALLENGE, 
  MOCK_TODAYS_TASKS,
  Challenge,
  CharacterProgression,
  PerformanceMetrics,
  WeeklyPlan
} from '../types/challenge';

const { Title, Text, Paragraph } = Typography;

const SundayPlanningQuestDemo: React.FC = () => {
  const [totalXP, setTotalXP] = useState(0);
  const [questCompleted, setQuestCompleted] = useState(false);
  const [currentWatchlist, setCurrentWatchlist] = useState<string[]>([]);

  // Mock character progression data
  const mockCharacterProgression: CharacterProgression = {
    currentLevel: 8,
    totalXP: 2850,
    xpToNextLevel: 150,
    availableSkillPoints: 5,
    allocatedSkillPoints: {
      patience: 7,
      riskManagement: 9,
      setupQuality: 6,
      strategyAdherence: 8,
      stressManagement: 5,
      profitProtection: 4,
      disciplineControl: 6
    },
    unlockedAbilities: ['Risk Calculator', 'Strategy Scanner', 'Patience Tracker'],
    strategyClassMastery: {
      'BUFFETT_GUARDIAN': {
        level: 3,
        xp: 450,
        unlockedAbilities: ['Value Screening', 'Dividend Focus']
      },
      'DALIO_WARRIOR': {
        level: 2,
        xp: 280,
        unlockedAbilities: ['Momentum Detection']
      }
    }
  };

  // Mock performance metrics
  const mockPerformanceMetrics: PerformanceMetrics = {
    totalTrades: 45,
    winningTrades: 31,
    losingTrades: 14,
    winRate: 68.9,
    averageWin: 125.50,
    averageLoss: -78.30,
    profitFactor: 1.45,
    averageRiskPerTrade: 1.8,
    maxDrawdown: 12.5,
    consecutiveWins: 5,
    consecutiveLosses: 2,
    strategyPerformance: {
      'BUFFETT_GUARDIAN': {
        strategyName: 'Buffett Guardian',
        trades: 28,
        winRate: 75.0,
        totalPnL: 2850,
        averagePnL: 101.79
      },
      'DALIO_WARRIOR': {
        strategyName: 'Dalio Warrior', 
        trades: 17,
        winRate: 58.8,
        totalPnL: 1180,
        averagePnL: 69.41
      }
    },
    averageTradesPerDay: 2.1,
    noTradeDays: 8,
    patienceScore: 7.2,
    setupQuality: {
      aPlus: 8,
      a: 15,
      b: 18,
      c: 4,
      f: 0
    },
    strategyAdherence: 92.5
  };

  // Mock weekly plan
  const mockWeeklyPlan: WeeklyPlan = {
    id: 'week-plan-001',
    challengeId: 'challenge-001',
    weekNumber: 2,
    weekStartDate: new Date(),
    weekTarget: 1000,
    dailyTarget: 200,
    maxRiskPerTrade: 100,
    maxTotalRisk: 300,
    selectedStrategies: ['BUFFETT_GUARDIAN'],
    watchlist: ['AAPL', 'MSFT', 'GOOGL'],
    marketCondition: 'BULLISH',
    focusAreas: ['Value Stocks', 'Dividend Growth'],
    economicEvents: [
      {
        date: new Date('2024-06-19'),
        time: '2:00 PM',
        event: 'Fed Meeting Minutes',
        impact: 'HIGH',
        description: 'Federal Reserve policy decision'
      }
    ],
    createdAt: new Date()
  };

  // Event Handlers
  const handleXPGained = (xp: number, source: string) => {
    setTotalXP(prev => prev + xp);
    console.log(`XP Gained: +${xp} from ${source}`);
  };

  const handleQuestCompleted = (totalXP: number) => {
    setQuestCompleted(true);
    console.log(`Quest completed! Total XP: ${totalXP}`);
  };

  const handleWatchlistUpdated = (watchlist: string[]) => {
    setCurrentWatchlist(watchlist);
    console.log('Watchlist updated:', watchlist);
  };

  const handleWeeklyPlanUpdated = (plan: Partial<WeeklyPlan>) => {
    console.log('Weekly plan updated:', plan);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Demo Header */}
      <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="text-center">
          <Title level={1} className="mb-2">
            🏴‍☠️ Sunday Planning Quest Demo
          </Title>
          <Paragraph className="text-lg text-gray-600 mb-4">
            Experience the complete Sunday planning transformation - from 3 hours of manual work to an engaging RPG quest!
          </Paragraph>
          
          <Row gutter={24} className="mb-4">
            <Col span={8}>
              <Card size="small" className="text-center">
                <RocketOutlined className="text-2xl text-blue-500 mb-2" />
                <Text strong className="block">WeeklyMarketScanService</Text>
                <Text type="secondary">Automated strategy scanning</Text>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" className="text-center">
                <TrophyOutlined className="text-2xl text-gold-500 mb-2" />
                <Text strong className="block">50 XP Quest</Text>
                <Text type="secondary">4-stage progressive quest</Text>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" className="text-center">
                <FireOutlined className="text-2xl text-orange-500 mb-2" />
                <Text strong className="block">Challenge Integration</Text>
                <Text type="secondary">Full RPG system integration</Text>
              </Card>
            </Col>
          </Row>

          <Alert
            message="Demo Features"
            description="This demo includes live market scanning, strategy class selection, watchlist building, and XP tracking. All data integrates with the $10K→$20K Challenge system."
            type="info"
            showIcon
            className="text-left"
          />
        </div>
      </Card>

      {/* Demo Stats */}
      <Card title="📊 Demo Progress" className="mb-6">
        <Row gutter={24}>
          <Col span={6}>
            <Card size="small" className="text-center">
              <Text type="secondary">XP Earned This Session</Text>
              <Title level={3} className="text-blue-600 m-0">{totalXP}</Title>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" className="text-center">
              <Text type="secondary">Quest Status</Text>
              <Title level={3} className={questCompleted ? "text-green-600 m-0" : "text-orange-600 m-0"}>
                {questCompleted ? 'Complete' : 'In Progress'}
              </Title>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" className="text-center">
              <Text type="secondary">Watchlist Size</Text>
              <Title level={3} className="text-purple-600 m-0">{currentWatchlist.length}</Title>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" className="text-center">
              <Text type="secondary">Integration Status</Text>
              <Title level={3} className="text-green-600 m-0">Active</Title>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Main Quest Component */}
      <SundayPlanningQuest
        challenge={MOCK_CHALLENGE}
        characterProgression={mockCharacterProgression}
        performanceMetrics={mockPerformanceMetrics}
        weeklyPlan={mockWeeklyPlan}
        onXPGained={handleXPGained}
        onQuestCompleted={handleQuestCompleted}
        onWatchlistUpdated={handleWatchlistUpdated}
        onWeeklyPlanUpdated={handleWeeklyPlanUpdated}
      />

      {/* Demo Footer */}
      <Card title="🎯 Implementation Summary" className="mt-6">
        <Row gutter={24}>
          <Col span={12}>
            <Title level={4}>Key Features Implemented</Title>
            <ul className="space-y-2">
              <li>✅ 4-stage progressive quest system (50 XP total)</li>
              <li>✅ WeeklyMarketScanService integration</li>
              <li>✅ Strategy class selection with real-time scanning</li>
              <li>✅ Interactive watchlist builder with drag-and-drop</li>
              <li>✅ XP rewards and progress tracking</li>
              <li>✅ Challenge Dashboard integration</li>
              <li>✅ Psychology features integration</li>
              <li>✅ Boss-prep RPG theming</li>
            </ul>
          </Col>
          <Col span={12}>
            <Title level={4}>Business Value</Title>
            <ul className="space-y-2">
              <li>💰 Replaces $200/week analyst costs</li>
              <li>⏰ Saves 3 hours/week manual scanning</li>
              <li>🎯 Transforms work into engaging XP quest</li>
              <li>📈 Integrates with challenge progression system</li>
              <li>🔄 Automated Sunday planning workflow</li>
              <li>🎮 Increases user engagement and retention</li>
              <li>📊 Provides structured weekly planning</li>
              <li>🛡️ Includes risk management validation</li>
            </ul>
          </Col>
        </Row>
        
        <div className="mt-6 text-center">
          <Space>
            <Button type="primary" href="/challenge-dashboard">
              View Challenge Dashboard
            </Button>
            <Button href="/famous-traders">
              Explore Famous Traders
            </Button>
            <Button href="/market-scan-service">
              Market Scan Service
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default SundayPlanningQuestDemo;