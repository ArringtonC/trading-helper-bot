import React, { useState } from 'react';
import { Card, Typography, Button, Space, Alert, Tabs, Row, Col, Statistic, Tag } from 'antd';
import { 
  DatabaseOutlined, 
  BarChartOutlined, 
  BulbOutlined, 
  TrophyOutlined, 
  RocketOutlined,
  FireOutlined,
  AimOutlined
} from '@ant-design/icons';
import { useFeatureFlags } from '../../../config/featureFlags';
import StrategyRecommendationEngine from '../../../features/trading/components/StrategyRecommendationEngine';
import StrategyBacktestDashboard from '../../../features/analytics/components/StrategyBacktestDashboard';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

/**
 * Trading Strategy Database Page - Component 4
 * 
 * Comprehensive strategy library with recommendation engine and backtesting capabilities.
 * Provides $50 value through advanced trading intelligence normally available only in expensive platforms.
 */
const TradingStrategyDatabasePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('strategies');
  const featureFlags = useFeatureFlags();

  return (
    <div className="trading-strategy-database-page">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-lg mb-6">
        <Space align="center" size="large">
          <DatabaseOutlined style={{ fontSize: '2rem' }} />
          <div>
            <Title level={2} style={{ color: 'white', margin: 0 }}>
              🎯 Trading Strategy Database
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.9)', margin: 0 }}>
              Component 4: Advanced strategy selection, optimization, and backtesting tools
            </Paragraph>
          </div>
        </Space>
      </div>

      {/* Component 4 Value Alert */}
      <Alert
        message="🎯 Component 4: Trading Strategy Database Complete!"
        description="Advanced strategy recommendation engine with backtesting capabilities - replaces $200+ trading platform subscriptions with personalized strategy intelligence"
        type="success"
        showIcon
        className="mb-6"
        action={
          <Space>
            <Tag color="green">$50 Value</Tag>
            <Tag color="blue">90% of $497 Goal</Tag>
          </Space>
        }
      />

      {/* Quick Stats */}
      <Card className="mb-6">
        <Row gutter={[24, 16]}>
          <Col xs={12} sm={6}>
            <Statistic
              title="Strategies Available"
              value={15}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Strategy Categories"
              value={6}
              prefix={<AimOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Backtest Metrics"
              value={15}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="XP Potential"
              value={500}
              suffix="XP"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
        </Row>
      </Card>

      {/* Main Content Tabs */}
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        size="large"
        className="mb-6"
      >
        <TabPane
          tab={
            <Space>
              <BulbOutlined />
              Strategy Recommendations
              <Tag color="green" size="small">AI-Powered</Tag>
            </Space>
          }
          key="strategies"
        >
          <div className="space-y-6">
            <Alert
              message="🤖 AI-Powered Strategy Recommendations"
              description="Get personalized strategy suggestions based on current market conditions, your risk profile, and account size"
              type="info"
              showIcon
              className="mb-6"
            />
            
            <StrategyRecommendationEngine />
          </div>
        </TabPane>

        <TabPane
          tab={
            <Space>
              <BarChartOutlined />
              Strategy Backtesting
              <Tag color="blue" size="small">Professional</Tag>
            </Space>
          }
          key="backtesting"
        >
          <div className="space-y-6">
            <Alert
              message="📊 Professional Backtesting Suite"
              description="Analyze historical performance with institutional-grade metrics including Sharpe ratio, max drawdown, and risk-adjusted returns"
              type="info"
              showIcon
              className="mb-6"
            />
            
            <StrategyBacktestDashboard />
          </div>
        </TabPane>

        <TabPane
          tab={
            <Space>
              <DatabaseOutlined />
              Strategy Library
            </Space>
          }
          key="library"
        >
          <div className="space-y-6">
            <Alert
              message="📚 Strategy Knowledge Base"
              description="Comprehensive library of trading strategies with detailed explanations, setup guides, and performance statistics"
              type="info"
              showIcon
              className="mb-6"
            />
            
            {/* Strategy Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  category: 'Momentum',
                  icon: '🚀',
                  count: 3,
                  description: 'Trend-following strategies for strong directional moves',
                  avgWinRate: '65%',
                  riskLevel: 'Medium-High'
                },
                {
                  category: 'Value',
                  icon: '💎',
                  count: 2,
                  description: 'Buy undervalued assets and hold for recovery',
                  avgWinRate: '70%',
                  riskLevel: 'Low-Medium'
                },
                {
                  category: 'Growth',
                  icon: '📈',
                  count: 2,
                  description: 'Focus on companies with expanding earnings',
                  avgWinRate: '68%',
                  riskLevel: 'Medium'
                },
                {
                  category: 'Swing',
                  icon: '🎯',
                  count: 3,
                  description: 'Multi-day positions capturing price swings',
                  avgWinRate: '62%',
                  riskLevel: 'Medium'
                },
                {
                  category: 'Scalping',
                  icon: '⚡',
                  count: 3,
                  description: 'Quick profits from small price movements',
                  avgWinRate: '58%',
                  riskLevel: 'High'
                },
                {
                  category: 'Mean Reversion',
                  icon: '🔄',
                  count: 2,
                  description: 'Trade back to statistical averages',
                  avgWinRate: '72%',
                  riskLevel: 'Low-Medium'
                }
              ].map((category) => (
                <Card
                  key={category.category}
                  hoverable
                  className="text-center h-full"
                  bodyStyle={{ padding: '24px 16px' }}
                >
                  <div className="text-4xl mb-3">{category.icon}</div>
                  <Title level={4} className="mb-2">{category.category}</Title>
                  <Paragraph type="secondary" className="mb-4 text-sm">
                    {category.description}
                  </Paragraph>
                  
                  <Space direction="vertical" size="small" className="w-full">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Strategies:</span>
                      <span className="text-xs font-medium">{category.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Avg Win Rate:</span>
                      <span className="text-xs font-medium text-green-600">{category.avgWinRate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Risk Level:</span>
                      <Tag size="small" color={
                        category.riskLevel.includes('High') ? 'red' :
                        category.riskLevel.includes('Medium') ? 'orange' : 'green'
                      }>
                        {category.riskLevel}
                      </Tag>
                    </div>
                  </Space>

                  <Button type="primary" size="small" className="mt-4 w-full">
                    View Strategies
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </TabPane>

        <TabPane
          tab={
            <Space>
              <RocketOutlined />
              Getting Started
            </Space>
          }
          key="getting-started"
        >
          <div className="space-y-6">
            <Card title="🚀 Quick Start Guide" className="mb-6">
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <Title level={5} className="mb-2">1. Set Up Your Profile</Title>
                  <Paragraph className="mb-0 text-sm">
                    Configure your account size, risk tolerance, and trading experience in the Strategy Recommendations tab
                  </Paragraph>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <Title level={5} className="mb-2">2. Get AI Recommendations</Title>
                  <Paragraph className="mb-0 text-sm">
                    Our AI analyzes current market conditions and suggests the best strategies for your profile
                  </Paragraph>
                </div>
                
                <div className="border-l-4 border-purple-500 pl-4">
                  <Title level={5} className="mb-2">3. Backtest Strategies</Title>
                  <Paragraph className="mb-0 text-sm">
                    Use our professional backtesting suite to analyze historical performance before risking real money
                  </Paragraph>
                </div>
                
                <div className="border-l-4 border-orange-500 pl-4">
                  <Title level={5} className="mb-2">4. Start Paper Trading</Title>
                  <Paragraph className="mb-0 text-sm">
                    Test your chosen strategies in simulation mode to build confidence and track performance
                  </Paragraph>
                </div>
              </div>
            </Card>

            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <Card title="🎯 Best Practices" size="small">
                  <ul className="text-sm space-y-2">
                    <li>✅ Always backtest before live trading</li>
                    <li>✅ Start with lower risk strategies</li>
                    <li>✅ Match strategies to market conditions</li>
                    <li>✅ Track performance metrics regularly</li>
                    <li>✅ Adjust position sizing based on volatility</li>
                  </ul>
                </Card>
              </Col>
              
              <Col xs={24} md={12}>
                <Card title="⚠️ Common Mistakes" size="small">
                  <ul className="text-sm space-y-2">
                    <li>❌ Using strategies in wrong market conditions</li>
                    <li>❌ Over-leveraging positions</li>
                    <li>❌ Ignoring risk management rules</li>
                    <li>❌ Not tracking performance metrics</li>
                    <li>❌ Switching strategies too frequently</li>
                  </ul>
                </Card>
              </Col>
            </Row>
          </div>
        </TabPane>
      </Tabs>

      {/* Action Buttons */}
      <Card className="text-center">
        <Space size="large" wrap>
          <Button 
            type="primary" 
            size="large" 
            icon={<BulbOutlined />}
            onClick={() => setActiveTab('strategies')}
          >
            Get Strategy Recommendations
          </Button>
          <Button 
            size="large" 
            icon={<BarChartOutlined />}
            onClick={() => setActiveTab('backtesting')}
          >
            Start Backtesting
          </Button>
          <Button 
            size="large" 
            icon={<TrophyOutlined />}
            href="/challenge/dashboard"
          >
            Back to Challenge
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default TradingStrategyDatabasePage;