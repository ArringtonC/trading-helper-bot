import React, { useState, useEffect } from 'react';
import {
  Card,
  Steps,
  Button,
  Form,
  Select,
  InputNumber,
  DatePicker,
  Table,
  Tag,
  Typography,
  Row,
  Col,
  Space,
  Statistic,
  Alert,
  Divider,
  List,
  Radio,
  message,
  Progress
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  LineChartOutlined,
  CalendarOutlined,
  WarningOutlined,
  SaveOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { Challenge, WeeklyPlan, EconomicEvent } from '../types/challenge';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface WeeklyPlanningWizardProps {
  challengeId: string;
  currentWeek: number;
  accountBalance: number;
  openPositions: any[];
  onComplete?: (planData: WeeklyPlan) => void;
  onSaveDraft?: (planData: Partial<WeeklyPlan>) => void;
}

interface MarketAnalysisData {
  recommendedStrategies: {
    primary: string;
    secondary?: string;
    reasoning: string;
  };
  marketConditions: {
    spyTrend: string;
    vixLevel: number;
    marketRegime: string;
    volatilityLevel: string;
  };
  economicEvents: EconomicEvent[];
  watchlistSuggestions: {
    symbol: string;
    reason: string;
    strategy: string;
  }[];
  riskLevel: string;
}

interface Position {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  riskExposure: number;
}

interface PlanningFormData {
  // Step 1 - Account Review
  startingBalance: number;
  currentBalance: number;
  weeklyPnL: number;
  openPositions: Position[];
  totalRiskExposure: number;
  
  // Step 2 - Market Research
  economicEvents: EconomicEvent[];
  earnings: string[];
  marketTrend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS' | 'VOLATILE';
  vixLevel: number;
  sectorRotation: string;
  
  // Step 3 - Strategy Selection
  selectedStrategies: string[];
  marketCondition: 'BULLISH' | 'BEARISH' | 'SIDEWAYS' | 'VOLATILE';
  primaryStrategy: string;
  
  // Step 4 - Game Plan
  weeklyTarget: number;
  dailyTarget: number;
  maxRiskPerTrade: number;
  maxTotalRisk: number;
  watchlist: string[];
  focusAreas: string[];
}

const WeeklyPlanningWizard: React.FC<WeeklyPlanningWizardProps> = ({
  challengeId,
  currentWeek,
  accountBalance,
  openPositions = [],
  onComplete,
  onSaveDraft
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [planningData, setPlanningData] = useState<Partial<PlanningFormData>>({
    startingBalance: accountBalance,
    currentBalance: accountBalance,
    weeklyPnL: 0,
    openPositions: openPositions as Position[],
    totalRiskExposure: 0,
    weeklyTarget: 2500,
    dailyTarget: 500,
    maxRiskPerTrade: 2,
    maxTotalRisk: 10,
    marketCondition: 'BULLISH',
    selectedStrategies: [],
    watchlist: [],
    focusAreas: []
  });
  const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysisData | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Calculate total risk exposure
  useEffect(() => {
    const totalRisk = openPositions.reduce((sum, pos) => sum + (pos.riskExposure || 0), 0);
    setPlanningData(prev => ({ ...prev, totalRiskExposure: totalRisk }));
  }, [openPositions]);

  // Calculate weekly P&L (mock calculation)
  useEffect(() => {
    const weeklyPnL = accountBalance - (planningData.startingBalance || accountBalance);
    setPlanningData(prev => ({ ...prev, weeklyPnL }));
  }, [accountBalance, planningData.startingBalance]);

  // Load market analysis data
  useEffect(() => {
    loadMarketAnalysis();
  }, []);

  const loadMarketAnalysis = async () => {
    setAnalysisLoading(true);
    try {
      // Try to load latest analysis data
      const response = await fetch('/data/market-analysis/latest-analysis.json');
      if (response.ok) {
        const data = await response.json();
        setMarketAnalysis({
          recommendedStrategies: data.recommendedStrategies,
          marketConditions: data.marketConditions,
          economicEvents: data.economicEvents,
          watchlistSuggestions: data.watchlistSuggestions,
          riskLevel: data.riskLevel
        });
        message.success('🎮 Market analysis loaded successfully!');
      } else {
        // If no analysis available, show option to run scripts
        message.info('💡 No market analysis found. Run scripts for optimal planning!');
      }
    } catch (error) {
      console.error('Failed to load market analysis:', error);
      message.warning('⚠️ Using default analysis. Consider running market analysis scripts.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const runMarketAnalysis = async () => {
    setAnalysisLoading(true);
    message.info('🎮 Running market analysis scripts...');
    
    try {
      // This would trigger the backend to run the analysis scripts
      // For now, we'll simulate it
      setTimeout(() => {
        message.success('✅ Market analysis complete! Refreshing data...');
        loadMarketAnalysis();
      }, 3000);
    } catch (error) {
      message.error('❌ Failed to run market analysis');
      setAnalysisLoading(false);
    }
  };

  const handleNext = async () => {
    try {
      const values = await form.validateFields();
      setPlanningData(prev => ({ ...prev, ...values }));
      
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        // Complete planning
        handleCompletePlanning();
      }
    } catch (error) {
      message.error('Please fill in all required fields');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveDraft = () => {
    const currentValues = form.getFieldsValue();
    const draftData = { ...planningData, ...currentValues };
    
    if (onSaveDraft) {
      onSaveDraft(draftData);
      message.success('Draft saved successfully');
    }
  };

  const handleCompletePlanning = () => {
    const weeklyPlan: WeeklyPlan = {
      id: `plan-${Date.now()}`,
      challengeId,
      weekNumber: currentWeek,
      weekStartDate: dayjs().startOf('week').toDate(),
      weekTarget: planningData.weeklyTarget || 2500,
      dailyTarget: planningData.dailyTarget || 500,
      maxRiskPerTrade: planningData.maxRiskPerTrade || 2,
      maxTotalRisk: planningData.maxTotalRisk || 10,
      selectedStrategies: planningData.selectedStrategies || [],
      watchlist: planningData.watchlist || [],
      marketCondition: planningData.marketCondition || 'BULLISH',
      focusAreas: planningData.focusAreas || [],
      economicEvents: planningData.economicEvents || [],
      createdAt: new Date()
    };

    if (onComplete) {
      onComplete(weeklyPlan);
      message.success('Weekly planning completed successfully!');
    }
  };

  // Step 1: Account Review Component
  const AccountReviewStep = () => (
    <Card title={`📊 Account Review - Week ${currentWeek}`}>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Statistic
            title="Starting Balance"
            value={planningData.startingBalance}
            prefix="$"
            precision={2}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Current Balance"
            value={accountBalance}
            prefix="$"
            precision={2}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Weekly P&L"
            value={planningData.weeklyPnL}
            prefix="$"
            precision={2}
            valueStyle={{
              color: planningData.weeklyPnL >= 0 ? '#3f8600' : '#cf1322'
            }}
            suffix={planningData.weeklyPnL >= 0 ? '✅' : '❌'}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Total Risk Exposure"
            value={planningData.totalRiskExposure}
            suffix="%"
            precision={1}
            valueStyle={{
              color: planningData.totalRiskExposure > 10 ? '#cf1322' : '#3f8600'
            }}
          />
        </Col>
      </Row>

      <Divider />

      <Title level={5}>Open Positions ({openPositions.length})</Title>
      {openPositions.length > 0 ? (
        <Table
          dataSource={openPositions}
          columns={[
            {
              title: 'Symbol',
              dataIndex: 'symbol',
              key: 'symbol',
              render: (symbol: string) => <Tag color="blue">{symbol}</Tag>
            },
            {
              title: 'Quantity',
              dataIndex: 'quantity',
              key: 'quantity'
            },
            {
              title: 'P&L',
              dataIndex: 'pnl',
              key: 'pnl',
              render: (pnl: number) => (
                <Text type={pnl >= 0 ? 'success' : 'danger'}>
                  ${pnl.toFixed(2)}
                </Text>
              )
            },
            {
              title: 'Risk %',
              dataIndex: 'riskExposure',
              key: 'riskExposure',
              render: (risk: number) => `${risk.toFixed(1)}%`
            }
          ]}
          pagination={false}
          size="small"
        />
      ) : (
        <Alert
          message="No open positions"
          description="You're starting the week with a clean slate!"
          type="info"
          showIcon
        />
      )}

      <Divider />

      <Alert
        message="Week Review"
        description={
          planningData.weeklyPnL >= 0
            ? "Great job! You're profitable this week. Keep focusing on quality setups."
            : "This week was challenging. Remember: preservation of capital is key. Focus on A+ setups only."
        }
        type={planningData.weeklyPnL >= 0 ? 'success' : 'warning'}
        showIcon
      />
    </Card>
  );

  // Step 2: Market Research Component
  const MarketResearchStep = () => (
    <Card title="📈 Upcoming Week Analysis">
      <Form form={form} layout="vertical">
        <Title level={5}>Economic Events</Title>
        <Form.Item name="economicEvents">
          <List
            dataSource={[
              { date: 'Monday', event: 'Housing Starts', impact: 'MEDIUM' },
              { date: 'Wednesday', event: 'Fed Meeting', impact: 'HIGH' },
              { date: 'Friday', event: 'Jobs Report', impact: 'HIGH' }
            ]}
            renderItem={item => (
              <List.Item>
                <Row style={{ width: '100%' }}>
                  <Col span={6}><Text strong>{item.date}</Text></Col>
                  <Col span={12}>{item.event}</Col>
                  <Col span={6}>
                    <Tag color={
                      item.impact === 'HIGH' ? 'red' : 
                      item.impact === 'MEDIUM' ? 'orange' : 'green'
                    }>
                      {item.impact}
                    </Tag>
                  </Col>
                </Row>
              </List.Item>
            )}
          />
        </Form.Item>

        <Divider />

        <Title level={5}>Market Trend Analysis</Title>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Form.Item
              name="marketTrend"
              label="Overall Market Trend"
              rules={[{ required: true, message: 'Please select market trend' }]}
            >
              <Radio.Group>
                <Radio.Button value="BULLISH">Bullish 📈</Radio.Button>
                <Radio.Button value="BEARISH">Bearish 📉</Radio.Button>
                <Radio.Button value="SIDEWAYS">Sideways ➡️</Radio.Button>
                <Radio.Button value="VOLATILE">Volatile 🎢</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="vixLevel"
              label="VIX Level"
              rules={[{ required: true, message: 'Please enter VIX level' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="e.g., 18.3"
                min={0}
                max={100}
                precision={1}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="sectorRotation"
          label="Leading Sectors"
          rules={[{ required: true, message: 'Please identify leading sectors' }]}
        >
          <Select
            mode="multiple"
            placeholder="Select leading sectors"
            style={{ width: '100%' }}
          >
            <Option value="tech">Technology</Option>
            <Option value="finance">Financials</Option>
            <Option value="healthcare">Healthcare</Option>
            <Option value="energy">Energy</Option>
            <Option value="consumer">Consumer</Option>
            <Option value="industrials">Industrials</Option>
          </Select>
        </Form.Item>

        <Alert
          message="Market Analysis Summary"
          description="Based on economic events and market conditions, focus on defensive strategies during Fed announcement day."
          type="info"
          showIcon
          icon={<LineChartOutlined />}
        />
      </Form>
    </Card>
  );

  // Step 3: Strategy Selection Component
  const StrategySelectionStep = () => {
    const marketCondition = form.getFieldValue('marketTrend') || 'BULLISH';
    
    const strategyRecommendations = {
      BULLISH: [
        { name: 'Warren Buffett - Value Accumulation', recommended: true, reason: 'Strong earnings, reasonable P/E' },
        { name: 'Ray Dalio - Trend Following', recommended: true, reason: 'Momentum continuation' },
        { name: 'George Soros - Contrarian', recommended: false, reason: 'No major reversal signals' }
      ],
      BEARISH: [
        { name: 'George Soros - Contrarian', recommended: true, reason: 'Look for oversold bounces' },
        { name: 'Paul Tudor Jones - Range Trading', recommended: true, reason: 'Volatility creates opportunities' },
        { name: 'Warren Buffett - Value Accumulation', recommended: false, reason: 'Wait for better prices' }
      ],
      SIDEWAYS: [
        { name: 'Paul Tudor Jones - Range Trading', recommended: true, reason: 'Perfect for range-bound markets' },
        { name: 'Ray Dalio - Diversification', recommended: true, reason: 'Spread risk across sectors' },
        { name: 'Momentum Trading', recommended: false, reason: 'Lack of clear trend' }
      ],
      VOLATILE: [
        { name: 'Risk Management Focus', recommended: true, reason: 'Reduce position sizes' },
        { name: 'Options Strategies', recommended: true, reason: 'Use volatility to your advantage' },
        { name: 'Day Trading', recommended: false, reason: 'Too risky in volatile conditions' }
      ]
    };

    return (
      <Card title="🎯 Famous Trader Strategy Selection">
        <Alert
          message="Skill Building Focus"
          description="Remember: Master ONE strategy before adding another. Quality over quantity!"
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Title level={5}>Market Condition: <Tag color="blue">{marketCondition}</Tag></Title>
        
        <Paragraph>
          Based on your market analysis, here are the recommended strategies:
        </Paragraph>

        <Form form={form} layout="vertical">
          <Form.Item
            name="primaryStrategy"
            label="Select Your PRIMARY Strategy (Choose ONE)"
            rules={[{ required: true, message: 'Please select your primary strategy' }]}
          >
            <Radio.Group style={{ width: '100%' }}>
              {strategyRecommendations[marketCondition]?.map((strategy, index) => (
                <Card
                  key={index}
                  style={{ 
                    marginBottom: 16, 
                    borderColor: strategy.recommended ? '#52c41a' : '#d9d9d9'
                  }}
                >
                  <Radio value={strategy.name} style={{ width: '100%' }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Space>
                        {strategy.recommended ? (
                          <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        ) : (
                          <ClockCircleOutlined style={{ color: '#d9d9d9' }} />
                        )}
                        <Text strong>{strategy.name}</Text>
                      </Space>
                      <Text type="secondary">{strategy.reason}</Text>
                    </Space>
                  </Radio>
                </Card>
              ))}
            </Radio.Group>
          </Form.Item>

          <Alert
            message="One Strategy Rule"
            description="Focus on executing your chosen strategy perfectly. No strategy hopping! Patience and consistency lead to mastery."
            type="info"
            showIcon
            icon={<WarningOutlined />}
          />
        </Form>
      </Card>
    );
  };

  // Step 4: Weekly Game Plan Component
  const GamePlanStep = () => (
    <Card title="📋 Week Trading Plan">
      <Form form={form} layout="vertical">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Form.Item
              name="weeklyTarget"
              label="Weekly Target"
              rules={[{ required: true, message: 'Please set weekly target' }]}
              initialValue={2500}
            >
              <InputNumber
                style={{ width: '100%' }}
                prefix="$"
                min={0}
                step={100}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="dailyTarget"
              label="Daily Target"
              rules={[{ required: true, message: 'Please set daily target' }]}
              initialValue={500}
            >
              <InputNumber
                style={{ width: '100%' }}
                prefix="$"
                min={0}
                step={50}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="maxRiskPerTrade"
              label="Max Risk per Trade"
              rules={[{ required: true, message: 'Please set max risk' }]}
              initialValue={2}
            >
              <InputNumber
                style={{ width: '100%' }}
                suffix="%"
                min={0.5}
                max={5}
                step={0.5}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="maxTotalRisk"
              label="Max Total Risk"
              rules={[{ required: true, message: 'Please set total risk limit' }]}
              initialValue={10}
            >
              <InputNumber
                style={{ width: '100%' }}
                suffix="%"
                min={5}
                max={20}
                step={1}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <Form.Item
          name="watchlist"
          label="Watchlist (5-10 stocks maximum)"
          rules={[
            { required: true, message: 'Please add stocks to watchlist' },
            { 
              validator: (_, value) => {
                if (value && value.length > 10) {
                  return Promise.reject('Maximum 10 stocks allowed - focus on quality!');
                }
                if (value && value.length < 5) {
                  return Promise.reject('Minimum 5 stocks needed for opportunities');
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <Select
            mode="tags"
            placeholder="Add stock symbols (e.g., AAPL, MSFT)"
            style={{ width: '100%' }}
          >
            <Option value="AAPL">AAPL - Apple (Earnings Tuesday)</Option>
            <Option value="MSFT">MSFT - Microsoft</Option>
            <Option value="NVDA">NVDA - Nvidia (AI Leader)</Option>
            <Option value="SPY">SPY - S&P 500 ETF</Option>
            <Option value="QQQ">QQQ - Nasdaq ETF</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="focusAreas"
          label="Weekly Focus Areas"
        >
          <Select
            mode="multiple"
            placeholder="Select focus areas"
            style={{ width: '100%' }}
          >
            <Option value="patience">Patience - Wait for A+ setups only</Option>
            <Option value="risk">Risk Management - Never exceed 2%</Option>
            <Option value="strategy">Strategy Discipline - Stick to the plan</Option>
            <Option value="journaling">Trade Journaling - Document everything</Option>
            <Option value="education">Skill Building - One strategy mastery</Option>
            <Option value="stress_management">🧘 Stress Management - Monitor emotional state</Option>
            <Option value="profit_protection">💰 Profit Protection - Monthly extraction targets</Option>
            <Option value="discipline_control">🗿 Discipline Control - Hard position limits</Option>
            <Option value="behavioral_analysis">🔍 Behavioral Analysis - Pattern recognition</Option>
          </Select>
        </Form.Item>

        <Alert
          message="Weekly Schedule"
          description={
            <List
              size="small"
              dataSource={[
                'Monday: SP500 range analysis + setup',
                'Tuesday: AAPL earnings reaction',
                'Wednesday: Fed meeting impact (reduce risk)',
                'Thursday: Position adjustments',
                'Friday: Weekly review + next week prep'
              ]}
              renderItem={item => <List.Item>{item}</List.Item>}
            />
          }
          type="info"
        />

        <Divider />

        <Alert
          message="Remember: Quality Over Quantity"
          description="Your goal is to become a master of ONE strategy. No trades is better than bad trades. Celebrate patience!"
          type="success"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Form>
    </Card>
  );

  const steps = [
    {
      title: 'Account Review',
      icon: <BarChartOutlined />,
      content: <AccountReviewStep />
    },
    {
      title: 'Market Research',
      icon: <LineChartOutlined />,
      content: <MarketResearchStep />
    },
    {
      title: 'Strategy Selection',
      icon: <CheckCircleOutlined />,
      content: <StrategySelectionStep />
    },
    {
      title: 'Weekly Game Plan',
      icon: <CalendarOutlined />,
      content: <GamePlanStep />
    }
  ];

  return (
    <div className="weekly-planning-wizard">
      <Card>
        <Title level={3}>
          <CalendarOutlined /> Sunday Planning Session - Week {currentWeek}
        </Title>
        <Paragraph type="secondary">
          Time to plan your week! Take 30-45 minutes to prepare for success.
        </Paragraph>

        {/* Market Analysis Integration */}
        <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f0f9ff' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Text strong>🎮 RPG Market Analysis</Text>
                {marketAnalysis ? (
                  <Tag color="green">✅ Analysis Loaded</Tag>
                ) : (
                  <Tag color="orange">⚠️ No Analysis</Tag>
                )}
              </Space>
            </Col>
            <Col>
              <Space>
                <Button 
                  type="primary" 
                  size="small"
                  loading={analysisLoading}
                  onClick={runMarketAnalysis}
                  disabled={analysisLoading}
                >
                  🚀 Run Analysis Scripts
                </Button>
                <Button 
                  size="small"
                  onClick={loadMarketAnalysis}
                  disabled={analysisLoading}
                >
                  🔄 Refresh Data
                </Button>
              </Space>
            </Col>
          </Row>
          
          {marketAnalysis && (
            <div style={{ marginTop: 8 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Text type="secondary">Recommended Strategy:</Text>
                  <br />
                  <Tag color="blue">{marketAnalysis.recommendedStrategies.primary}</Tag>
                </Col>
                <Col span={8}>
                  <Text type="secondary">Market Regime:</Text>
                  <br />
                  <Tag color={marketAnalysis.marketConditions.marketRegime === 'RISK_ON' ? 'green' : 'red'}>
                    {marketAnalysis.marketConditions.marketRegime}
                  </Tag>
                </Col>
                <Col span={8}>
                  <Text type="secondary">Risk Level:</Text>
                  <br />
                  <Tag color={marketAnalysis.riskLevel === 'LOW' ? 'green' : marketAnalysis.riskLevel === 'HIGH' ? 'red' : 'orange'}>
                    {marketAnalysis.riskLevel}
                  </Tag>
                </Col>
              </Row>
            </div>
          )}
          
          {!marketAnalysis && (
            <Alert
              message="💡 Pro Tip"
              description="Run the market analysis scripts for AI-powered strategy recommendations, risk assessment, and optimal watchlist suggestions!"
              type="info"
              showIcon
              style={{ marginTop: 8 }}
            />
          )}
        </Card>

        <Steps
          current={currentStep}
          items={steps.map((step, index) => ({
            title: step.title,
            icon: step.icon,
            status: index < currentStep ? 'finish' : index === currentStep ? 'process' : 'wait'
          }))}
          style={{ marginBottom: 32 }}
        />

        <div className="steps-content" style={{ minHeight: 400 }}>
          {steps[currentStep].content}
        </div>

        <Divider />

        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button
                icon={<SaveOutlined />}
                onClick={handleSaveDraft}
              >
                Save Draft
              </Button>
              <Text type="secondary">
                Progress: {Math.round((currentStep + 1) / steps.length * 100)}%
              </Text>
            </Space>
          </Col>
          <Col>
            <Space>
              {currentStep > 0 && (
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={handlePrevious}
                >
                  Previous
                </Button>
              )}
              {currentStep < steps.length - 1 ? (
                <Button
                  type="primary"
                  icon={<ArrowRightOutlined />}
                  onClick={handleNext}
                >
                  Continue to {steps[currentStep + 1].title}
                </Button>
              ) : (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleNext}
                >
                  Complete Planning
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default WeeklyPlanningWizard;