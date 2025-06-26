/**
 * Strategy Recommendation Engine Demo
 * 
 * Demonstration component showing how to integrate the Strategy Recommendation Engine
 * with the Challenge RPG system and other app features.
 * 
 * @author Claude Code
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { Card, Row, Col, Typography, Space, Button, notification, message } from 'antd';
import { TrophyOutlined, DollarOutlined, BookOutlined } from '@ant-design/icons';
import StrategyRecommendationEngine from './StrategyRecommendationEngine';
import { TradingStrategy } from '../services/TradingStrategyService';

const { Title, Text } = Typography;

interface DemoProps {
  className?: string;
}

const StrategyRecommendationEngineDemo: React.FC<DemoProps> = ({ className }) => {
  const [userXP, setUserXP] = useState(1250);
  const [selectedStrategy, setSelectedStrategy] = useState<TradingStrategy | null>(null);
  const [challengeProgress, setChallengeProgress] = useState({
    currentAmount: 12500,
    targetAmount: 20000,
    daysRemaining: 18
  });

  // Handle when user selects a strategy
  const handleStrategySelected = (strategy: TradingStrategy) => {
    setSelectedStrategy(strategy);
    
    notification.success({
      message: 'Strategy Selected!',
      description: `You've selected ${strategy.name}. Time to put it into action!`,
      icon: <TrophyOutlined style={{ color: '#52c41a' }} />
    });
  };

  // Handle XP rewards from strategy actions
  const handleXPEarned = (amount: number, source: string) => {
    setUserXP(prev => prev + amount);
    
    message.success({
      content: `+${amount} XP from ${source}`,
      icon: <TrophyOutlined style={{ color: '#faad14' }} />,
      duration: 3
    });

    // Simulate challenge progress update
    if (source.includes('Strategy:')) {
      setChallengeProgress(prev => ({
        ...prev,
        currentAmount: prev.currentAmount + Math.random() * 100 // Simulate small progress
      }));
    }
  };

  return (
    <div className={`strategy-recommendation-demo ${className || ''}`}>
      {/* Demo Header */}
      <Card className="mb-4">
        <div style={{ textAlign: 'center' }}>
          <Title level={2}>Strategy Recommendation Engine</Title>
          <Text type="secondary">
            AI-powered strategy recommendations based on real-time market conditions 
            and your personal trading profile
          </Text>
        </div>
      </Card>

      {/* Challenge Integration Display */}
      <Card title="Challenge Progress & XP Tracking" className="mb-4">
        <Row gutter={16}>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                {userXP.toLocaleString()}
              </div>
              <Text type="secondary">Total XP</Text>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                ${challengeProgress.currentAmount.toLocaleString()}
              </div>
              <Text type="secondary">Current Balance</Text>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                {challengeProgress.daysRemaining}
              </div>
              <Text type="secondary">Days Remaining</Text>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
                {selectedStrategy ? '1' : '0'}
              </div>
              <Text type="secondary">Active Strategy</Text>
            </div>
          </Col>
        </Row>
        
        {selectedStrategy && (
          <div className="mt-4" style={{ 
            background: '#f6ffed', 
            border: '1px solid #b7eb8f', 
            borderRadius: '6px', 
            padding: '12px' 
          }}>
            <Space>
              <TrophyOutlined style={{ color: '#52c41a' }} />
              <Text strong>Currently Using: {selectedStrategy.name}</Text>
              <Text type="secondary">({selectedStrategy.category.replace('_', ' ')})</Text>
            </Space>
          </div>
        )}
      </Card>

      {/* Main Strategy Recommendation Engine */}
      <StrategyRecommendationEngine
        userId="demo-user"
        showMarketDashboard={true}
        showUserProfile={true}
        showPerformanceComparison={true}
        maxRecommendations={6}
        autoRefresh={true}
        refreshInterval={30000} // 30 seconds for demo
        onStrategySelected={handleStrategySelected}
        onXPEarned={handleXPEarned}
        className="strategy-engine-main"
      />

      {/* Integration Examples */}
      <Card title="Integration Examples" className="mt-4">
        <Row gutter={16}>
          <Col span={8}>
            <Card size="small" title="Challenge System" style={{ height: '100%' }}>
              <Space direction="vertical" size="small">
                <div>
                  <TrophyOutlined style={{ color: '#faad14' }} />
                  <Text className="ml-2">XP rewards for trying strategies</Text>
                </div>
                <div>
                  <DollarOutlined style={{ color: '#52c41a' }} />
                  <Text className="ml-2">Performance tracking</Text>
                </div>
                <div>
                  <BookOutlined style={{ color: '#1890ff' }} />
                  <Text className="ml-2">Skill development points</Text>
                </div>
              </Space>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" title="Market Integration" style={{ height: '100%' }}>
              <Space direction="vertical" size="small">
                <Text>• Real-time VIX monitoring</Text>
                <Text>• Market sentiment analysis</Text>
                <Text>• Volatility regime detection</Text>
                <Text>• Strategy adaptation alerts</Text>
              </Space>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" title="User Experience" style={{ height: '100%' }}>
              <Space direction="vertical" size="small">
                <Text>• Personalized recommendations</Text>
                <Text>• Mobile-responsive design</Text>
                <Text>• Educational content</Text>
                <Text>• Performance comparison</Text>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Usage Instructions */}
      <Card title="How to Use" className="mt-4">
        <ol style={{ paddingLeft: '20px' }}>
          <li><Text>Review the <strong>Market Environment</strong> dashboard to understand current conditions</Text></li>
          <li><Text>Check your <strong>Trading Profile</strong> and update it as needed</Text></li>
          <li><Text>Browse <strong>Recommended Strategies</strong> based on your profile and market conditions</Text></li>
          <li><Text>Use <strong>Filters</strong> to narrow down strategies by category, risk level, or time commitment</Text></li>
          <li><Text>Click <strong>"Try Strategy"</strong> to start using a strategy and earn XP</Text></li>
          <li><Text>Monitor your <strong>Performance</strong> and adapt strategies as markets change</Text></li>
        </ol>
      </Card>
    </div>
  );
};

export default StrategyRecommendationEngineDemo;