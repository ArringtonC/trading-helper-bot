import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Space, Alert, Tabs, Row, Col, Statistic, Tag, Badge, Progress } from 'antd';
import { 
  ThunderboltOutlined, 
  BellOutlined, 
  TrophyOutlined, 
  RocketOutlined,
  BarChartOutlined,
  FireOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
  HistoryOutlined,
  SettingOutlined,
  StarOutlined,
  EyeOutlined,
  AimOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useFeatureFlags } from '../../../config/featureFlags';
import PatternRecognitionDashboard from '../../../features/market-data/components/PatternRecognitionDashboard';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

/**
 * Pattern Recognition Page - Component 7
 * 
 * Main landing page for advanced pattern recognition alerts and analysis.
 * Provides $50 value through real-time pattern detection and trading signals.
 * Completes the full $497 package with professional-grade chart pattern analysis.
 */
const PatternRecognitionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [componentStats, setComponentStats] = useState({
    totalValue: 497,
    component7Value: 50,
    completionPercentage: 100,
    patternsDetected: 0,
    successRate: 0,
    totalXP: 0
  });
  const featureFlags = useFeatureFlags();

  useEffect(() => {
    // Load component statistics and achievements
    loadComponentStats();
  }, []);

  const loadComponentStats = () => {
    // Simulate loading component statistics
    setComponentStats({
      totalValue: 497,
      component7Value: 50,
      completionPercentage: 100,
      patternsDetected: 247,
      successRate: 78,
      totalXP: 2450
    });
  };

  const renderHeroSection = () => (
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-8 rounded-lg mb-6">
      <Row align="middle" justify="space-between">
        <Col>
          <Space align="center" size="large">
            <ThunderboltOutlined style={{ fontSize: '3rem' }} />
            <div>
              <Title level={1} style={{ color: 'white', margin: 0, fontSize: '2.5rem' }}>
                🎯 Pattern Recognition Alerts
              </Title>
              <Paragraph style={{ color: 'rgba(255,255,255,0.9)', margin: '8px 0 0 0', fontSize: '1.2rem' }}>
                Component 7: Real-time chart pattern detection with AI-powered trading signals
              </Paragraph>
            </div>
          </Space>
        </Col>
        <Col>
          <Card className="bg-white/10 border-white/20" style={{ minWidth: 200 }}>
            <Space direction="vertical" align="center" style={{ width: '100%' }}>
              <Text style={{ color: 'white', fontSize: '1.1rem' }}>Component 7 Value</Text>
              <Title level={2} style={{ color: '#ffd700', margin: 0 }}>
                ${componentStats.component7Value}
              </Title>
              <Progress
                percent={componentStats.completionPercentage}
                showInfo={false}
                strokeColor="#ffd700"
                trailColor="rgba(255,255,255,0.2)"
              />
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                {componentStats.completionPercentage}% Complete
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderValueProposition = () => (
    <Alert
      message="🏆 MILESTONE ACHIEVED: Full $497 Package Complete!"
      description={
        <div>
          <Paragraph className="mb-2">
            <strong>Component 7 delivers the final piece:</strong> Professional-grade pattern recognition 
            with real-time alerts, backtested performance metrics, and RPG-style achievement tracking.
          </Paragraph>
          <Space wrap>
            <Tag color="gold" icon={<TrophyOutlined />}>
              All 7 Components Complete
            </Tag>
            <Tag color="green" icon={<CheckCircleOutlined />}>
              ${componentStats.totalValue} Total Value
            </Tag>
            <Tag color="blue" icon={<StarOutlined />}>
              {componentStats.patternsDetected}+ Patterns Detected
            </Tag>
            <Tag color="purple" icon={<FireOutlined />}>
              {componentStats.successRate}% Success Rate
            </Tag>
          </Space>
        </div>
      }
      type="success"
      showIcon
      className="mb-6"
    />
  );

  const renderQuickStats = () => (
    <Card className="mb-6">
      <Row gutter={[24, 16]}>
        <Col xs={12} sm={6}>
          <Statistic
            title="Patterns Detected Today"
            value={15}
            prefix={<EyeOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="Active Alerts"
            value={8}
            prefix={<BellOutlined />}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="Success Rate"
            value={componentStats.successRate}
            suffix="%"
            prefix={<AimOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="XP Earned"
            value={componentStats.totalXP}
            prefix={<TrophyOutlined />}
            valueStyle={{ color: '#722ed1' }}
          />
        </Col>
      </Row>
    </Card>
  );

  const renderFeatureHighlights = () => (
    <Card title="🚀 Component 7 Features" className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            icon: '🎯',
            title: 'Real-Time Detection',
            description: 'Advanced algorithms scan charts continuously for pattern formations',
            status: 'active'
          },
          {
            icon: '📊',
            title: 'Backtested Performance',
            description: 'Historical success rates and risk metrics for each pattern type',
            status: 'active'
          },
          {
            icon: '🔔',
            title: 'Smart Alerts',
            description: 'Customizable notifications with confidence levels and risk parameters',
            status: 'active'
          },
          {
            icon: '🎮',
            title: 'RPG Integration',
            description: 'Earn XP and achievements for successful pattern recognition',
            status: 'active'
          },
          {
            icon: '📈',
            title: 'Multi-Timeframe',
            description: 'Pattern detection across multiple chart timeframes simultaneously',
            status: 'active'
          },
          {
            icon: '🎪',
            title: 'Pattern Education',
            description: 'Learn about each pattern type with detailed explanations and examples',
            status: 'active'
          }
        ].map((feature, index) => (
          <Card
            key={index}
            size="small"
            className="text-center h-full"
            bodyStyle={{ padding: '16px 12px' }}
          >
            <div className="text-3xl mb-2">{feature.icon}</div>
            <Title level={5} className="mb-2">{feature.title}</Title>
            <Paragraph type="secondary" className="text-xs mb-3">
              {feature.description}
            </Paragraph>
            <Badge status="success" text="ACTIVE" />
          </Card>
        ))}
      </div>
    </Card>
  );

  const renderNavigationLinks = () => (
    <Card title="🔗 Related Components" className="mb-6">
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Link to="/trading/strategy-database">
            <Card 
              hoverable
              size="small"
              className="text-center h-full border-blue-200 hover:border-blue-400"
            >
              <DatabaseOutlined style={{ fontSize: '1.5rem', color: '#1890ff' }} />
              <Title level={5} className="mt-2 mb-1">Strategy Database</Title>
              <Text type="secondary" className="text-xs">Component 4</Text>
            </Card>
          </Link>
        </Col>
        <Col xs={12} md={6}>
          <Link to="/challenge/dashboard">
            <Card 
              hoverable
              size="small"
              className="text-center h-full border-green-200 hover:border-green-400"
            >
              <RocketOutlined style={{ fontSize: '1.5rem', color: '#52c41a' }} />
              <Title level={5} className="mt-2 mb-1">Challenge Dashboard</Title>
              <Text type="secondary" className="text-xs">Main Hub</Text>
            </Card>
          </Link>
        </Col>
        <Col xs={12} md={6}>
          <Link to="/trading/risk-management">
            <Card 
              hoverable
              size="small"
              className="text-center h-full border-orange-200 hover:border-orange-400"
            >
              <SettingOutlined style={{ fontSize: '1.5rem', color: '#fa8c16' }} />
              <Title level={5} className="mt-2 mb-1">Risk Management</Title>
              <Text type="secondary" className="text-xs">Component 5</Text>
            </Card>
          </Link>
        </Col>
        <Col xs={12} md={6}>
          <Link to="/component7-test">
            <Card 
              hoverable
              size="small"
              className="text-center h-full border-purple-200 hover:border-purple-400"
            >
              <ThunderboltOutlined style={{ fontSize: '1.5rem', color: '#722ed1' }} />
              <Title level={5} className="mt-2 mb-1">Test Component 7</Title>
              <Text type="secondary" className="text-xs">Testing</Text>
            </Card>
          </Link>
        </Col>
      </Row>
    </Card>
  );

  const renderAchievementShowcase = () => (
    <Card title="🏆 Achievement Showcase" className="mb-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Alert
            message="🎉 Package Complete!"
            description="You've unlocked all 7 components of the $497 trading education package. You now have access to professional-grade tools that typically cost thousands of dollars."
            type="success"
            showIcon
            className="mb-4"
          />
          
          <div className="bg-gradient-to-r from-gold-50 to-yellow-50 p-4 rounded-lg border border-gold-200">
            <Title level={4} className="text-center mb-3">
              <TrophyOutlined className="mr-2" style={{ color: '#ffd700' }} />
              Master Trader Status
            </Title>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <Text strong>Total Value</Text>
                <div className="text-2xl font-bold text-green-600">${componentStats.totalValue}</div>
              </div>
              <div>
                <Text strong>Components</Text>
                <div className="text-2xl font-bold text-blue-600">7/7</div>
              </div>
            </div>
          </div>
        </Col>
        
        <Col xs={24} md={12}>
          <Card title="📋 Component Checklist" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              {[
                { name: 'Challenge RPG System', value: '$100', complete: true },
                { name: 'Range Calculator', value: '$47', complete: true },
                { name: 'Goal Setting System', value: '$50', complete: true },
                { name: 'Strategy Database', value: '$50', complete: true },
                { name: 'Risk Management', value: '$50', complete: true },
                { name: 'Market Data Dashboard', value: '$100', complete: true },
                { name: 'Pattern Recognition', value: '$50', complete: true }
              ].map((component, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <Space>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    <Text>{component.name}</Text>
                  </Space>
                  <Space>
                    <Tag color="green">{component.value}</Tag>
                    <Badge status="success" />
                  </Space>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </Card>
  );

  return (
    <div className="pattern-recognition-page">
      {/* Hero Section */}
      {renderHeroSection()}

      {/* Value Proposition */}
      {renderValueProposition()}

      {/* Quick Stats */}
      {renderQuickStats()}

      {/* Achievement Showcase */}
      {renderAchievementShowcase()}

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
              <ThunderboltOutlined />
              Live Dashboard
              <Badge count={8} size="small" />
            </Space>
          }
          key="dashboard"
        >
          <div className="space-y-6">
            <Alert
              message="🎯 Real-Time Pattern Recognition"
              description="Advanced AI algorithms continuously scan charts for profitable pattern formations with backtested success rates"
              type="info"
              showIcon
              className="mb-6"
            />
            
            <PatternRecognitionDashboard />
          </div>
        </TabPane>

        <TabPane
          tab={
            <Space>
              <BarChartOutlined />
              Features Overview
            </Space>
          }
          key="features"
        >
          <div className="space-y-6">
            <Alert
              message="📊 Component 7 Feature Set"
              description="Comprehensive pattern recognition suite with real-time alerts, backtesting, and RPG integration"
              type="info"
              showIcon
              className="mb-6"
            />
            
            {renderFeatureHighlights()}
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
                  <Title level={5} className="mb-2">1. Configure Alert Settings</Title>
                  <Paragraph className="mb-0 text-sm">
                    Set up your pattern preferences, confidence levels, and notification preferences in the dashboard settings
                  </Paragraph>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <Title level={5} className="mb-2">2. Monitor Live Patterns</Title>
                  <Paragraph className="mb-0 text-sm">
                    Watch real-time pattern detection with confidence scores and historical success rates
                  </Paragraph>
                </div>
                
                <div className="border-l-4 border-purple-500 pl-4">
                  <Title level={5} className="mb-2">3. Act on High-Confidence Signals</Title>
                  <Paragraph className="mb-0 text-sm">
                    Execute trades on patterns with 75%+ confidence and strong historical performance
                  </Paragraph>
                </div>
                
                <div className="border-l-4 border-orange-500 pl-4">
                  <Title level={5} className="mb-2">4. Track Performance & Earn XP</Title>
                  <Paragraph className="mb-0 text-sm">
                    Monitor your pattern recognition success rate and earn XP for correct identifications
                  </Paragraph>
                </div>
              </div>
            </Card>

            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <Card title="✅ Best Practices" size="small">
                  <ul className="text-sm space-y-2">
                    <li>✅ Focus on high-confidence patterns (75%+)</li>
                    <li>✅ Combine with other technical indicators</li>
                    <li>✅ Use proper position sizing and risk management</li>
                    <li>✅ Monitor multiple timeframes for confirmation</li>
                    <li>✅ Keep detailed records of pattern outcomes</li>
                  </ul>
                </Card>
              </Col>
              
              <Col xs={24} md={12}>
                <Card title="⚠️ Common Mistakes" size="small">
                  <ul className="text-sm space-y-2">
                    <li>❌ Trading low-confidence patterns</li>
                    <li>❌ Ignoring market context and conditions</li>
                    <li>❌ Over-leveraging on pattern signals</li>
                    <li>❌ Not setting proper stop losses</li>
                    <li>❌ Chasing patterns after breakout</li>
                  </ul>
                </Card>
              </Col>
            </Row>
          </div>
        </TabPane>

        <TabPane
          tab={
            <Space>
              <DatabaseOutlined />
              Navigation
            </Space>
          }
          key="navigation"
        >
          <div className="space-y-6">
            <Alert
              message="🔗 Complete Trading Suite"
              description="Access all components of your $497 trading education package through these integrated tools"
              type="info"
              showIcon
              className="mb-6"
            />
            
            {renderNavigationLinks()}
          </div>
        </TabPane>
      </Tabs>

      {/* Action Buttons */}
      <Card className="text-center">
        <Space size="large" wrap>
          <Button 
            type="primary" 
            size="large" 
            icon={<ThunderboltOutlined />}
            onClick={() => setActiveTab('dashboard')}
          >
            Open Live Dashboard
          </Button>
          <Button 
            size="large" 
            icon={<SettingOutlined />}
            onClick={() => setActiveTab('dashboard')}
          >
            Configure Alerts
          </Button>
          <Button 
            size="large" 
            icon={<HistoryOutlined />}
            href="/component7-test"
          >
            Test Component 7
          </Button>
          <Button 
            size="large" 
            icon={<RocketOutlined />}
            href="/challenge/dashboard"
          >
            Back to Challenge Hub
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default PatternRecognitionPage;