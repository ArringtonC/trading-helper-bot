/**
 * Enhanced Weekly Planning Wizard with Market Scan Integration
 * Combines traditional planning with AI-powered screening results from famous trader strategies
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Steps,
  Button,
  Form,
  Select,
  InputNumber,
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
  Progress,
  Tooltip,
  Badge,
  Tabs,
  Spin
} from 'antd';
import {
  CheckCircleOutlined,
  DollarOutlined,
  LineChartOutlined,
  CalendarOutlined,
  WarningOutlined,
  SaveOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined,
  ArrowLeftOutlined,
  BarChartOutlined,
  SearchOutlined,
  BulbOutlined,
  TrophyOutlined,
  FireOutlined
} from '@ant-design/icons';
import { Challenge, WeeklyPlan, EconomicEvent } from '../../challenges/types/challenge';
import EnhancedTechnicalFundamentalScreener, { 
  EnhancedScreenedStock,
  EnhancedScreeningTemplate,
  EnhancedScreeningCriteria
} from '../services/EnhancedTechnicalFundamentalScreener';
import MarketDataAPIService, { ScreeningDataBundle } from '../services/MarketDataAPIService';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface EnhancedWeeklyPlanningWizardProps {
  challengeId: string;
  currentWeek: number;
  accountBalance: number;
  openPositions: any[];
  onComplete?: (planData: WeeklyPlan) => void;
  onSaveDraft?: (planData: Partial<WeeklyPlan>) => void;
}

interface ScreeningResults {
  stocks: EnhancedScreenedStock[];
  template: EnhancedScreeningTemplate;
  lastUpdated: Date;
  totalScanned: number;
}

interface MarketScanData {
  buffettStocks: EnhancedScreenedStock[];
  sorosStocks: EnhancedScreenedStock[];
  dalioStocks: EnhancedScreenedStock[];
  ptjStocks: EnhancedScreenedStock[];
  hybridStocks: EnhancedScreenedStock[];
  scanMetadata: {
    totalSymbols: number;
    scanDuration: number;
    lastScan: Date;
    marketCondition: string;
  };
}

const EnhancedWeeklyPlanningWizard: React.FC<EnhancedWeeklyPlanningWizardProps> = ({
  challengeId,
  currentWeek,
  accountBalance,
  openPositions = [],
  onComplete,
  onSaveDraft
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [screeningResults, setScreeningResults] = useState<ScreeningResults | null>(null);
  const [marketScanData, setMarketScanData] = useState<MarketScanData | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('HYBRID');
  const [planningData, setPlanningData] = useState<any>({
    startingBalance: accountBalance,
    currentBalance: accountBalance,
    weeklyTarget: 2500,
    dailyTarget: 500,
    maxRiskPerTrade: 2,
    maxTotalRisk: 10,
    watchlist: [],
    focusAreas: []
  });

  const screener = new EnhancedTechnicalFundamentalScreener();
  const marketDataService = new MarketDataAPIService();

  useEffect(() => {
    // Load any cached screening results
    loadCachedResults();
  }, []);

  const loadCachedResults = async () => {
    try {
      // Check for cached screening results from the last 4 hours
      const cached = localStorage.getItem('weeklyScreeningResults');
      if (cached) {
        const parsed = JSON.parse(cached);
        const cacheAge = Date.now() - new Date(parsed.timestamp).getTime();
        if (cacheAge < 4 * 60 * 60 * 1000) { // 4 hours
          setMarketScanData(parsed.data);
          message.success('Loaded cached screening results');
        }
      }
    } catch (error) {
      console.warn('Failed to load cached results:', error);
    }
  };

  const runMarketScan = async () => {
    setScanLoading(true);
    message.info('🔍 Running comprehensive market scan with famous trader strategies...');

    try {
      // Get all famous trader templates
      const templates = screener.getFamousTraderTemplates();
      const scanResults: MarketScanData = {
        buffettStocks: [],
        sorosStocks: [],
        dalioStocks: [],
        ptjStocks: [],
        hybridStocks: [],
        scanMetadata: {
          totalSymbols: 500, // Mock - would be actual scan size
          scanDuration: 0,
          lastScan: new Date(),
          marketCondition: 'BULLISH'
        }
      };

      const startTime = Date.now();

      // Run screening for each strategy
      for (const template of templates) {
        const results = await screener.screenWithFamousTraderCriteria(template.criteria);
        
        switch (template.strategy) {
          case 'BUFFETT':
            scanResults.buffettStocks = results.slice(0, 10); // Top 10
            break;
          case 'SOROS':
            scanResults.sorosStocks = results.slice(0, 10);
            break;
          case 'DALIO':
            scanResults.dalioStocks = results.slice(0, 10);
            break;
          case 'PTJ':
            scanResults.ptjStocks = results.slice(0, 10);
            break;
          case 'HYBRID':
            scanResults.hybridStocks = results.slice(0, 15); // More hybrid results
            break;
        }
      }

      scanResults.scanMetadata.scanDuration = Date.now() - startTime;
      setMarketScanData(scanResults);

      // Cache results
      localStorage.setItem('weeklyScreeningResults', JSON.stringify({
        data: scanResults,
        timestamp: new Date().toISOString()
      }));

      message.success(`✅ Market scan complete! Found ${scanResults.hybridStocks.length + scanResults.buffettStocks.length + scanResults.sorosStocks.length} opportunities`);

    } catch (error) {
      console.error('Market scan failed:', error);
      message.error('❌ Market scan failed. Using cached data if available.');
    } finally {
      setScanLoading(false);
    }
  };

  const handleStrategyChange = (strategy: string) => {
    setSelectedStrategy(strategy);
    
    // Auto-populate watchlist based on selected strategy
    if (marketScanData) {
      let recommendedStocks: EnhancedScreenedStock[] = [];
      
      switch (strategy) {
        case 'BUFFETT':
          recommendedStocks = marketScanData.buffettStocks.slice(0, 8);
          break;
        case 'SOROS':
          recommendedStocks = marketScanData.sorosStocks.slice(0, 8);
          break;
        case 'DALIO':
          recommendedStocks = marketScanData.dalioStocks.slice(0, 8);
          break;
        case 'PTJ':
          recommendedStocks = marketScanData.ptjStocks.slice(0, 8);
          break;
        case 'HYBRID':
          recommendedStocks = marketScanData.hybridStocks.slice(0, 8);
          break;
      }
      
      const watchlist = recommendedStocks.map(stock => stock.symbol);
      form.setFieldsValue({ watchlist });
      setPlanningData(prev => ({ ...prev, watchlist }));
    }
  };

  // Enhanced Market Scan Step
  const MarketScanStep = () => (
    <Card title="🔍 AI-Powered Market Scan">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Alert
            message="Weekly Market Screening"
            description="Run comprehensive scans using famous trader strategies to identify high-probability opportunities for the coming week."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Button
            type="primary"
            size="large"
            icon={<SearchOutlined />}
            loading={scanLoading}
            onClick={runMarketScan}
            block
          >
            {scanLoading ? 'Scanning Markets...' : 'Run Weekly Market Scan'}
          </Button>
        </Col>
        <Col span={12}>
          <Statistic
            title="Last Scan"
            value={marketScanData ? dayjs(marketScanData.scanMetadata.lastScan).fromNow() : 'Never'}
            prefix={<ClockCircleOutlined />}
          />
        </Col>
      </Row>

      {scanLoading && (
        <Card size="small" style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>Scanning {marketScanData?.scanMetadata.totalSymbols || 500} symbols across famous trader strategies...</Text>
          </div>
        </Card>
      )}

      {marketScanData && !scanLoading && (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Statistic
                title="Total Scanned"
                value={marketScanData.scanMetadata.totalSymbols}
                prefix={<BarChartOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Scan Duration"
                value={marketScanData.scanMetadata.scanDuration / 1000}
                suffix="sec"
                precision={1}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Buffett Picks"
                value={marketScanData.buffettStocks.length}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="PTJ Signals"
                value={marketScanData.ptjStocks.length}
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
          </Row>

          <Tabs defaultActiveKey="hybrid">
            <TabPane tab={<span><TrophyOutlined />Hybrid Strategy ({marketScanData.hybridStocks.length})</span>} key="hybrid">
              <ScanResultsTable stocks={marketScanData.hybridStocks} strategy="HYBRID" />
            </TabPane>
            <TabPane tab={<span>📈 Buffett ({marketScanData.buffettStocks.length})</span>} key="buffett">
              <ScanResultsTable stocks={marketScanData.buffettStocks} strategy="BUFFETT" />
            </TabPane>
            <TabPane tab={<span>🎯 Soros ({marketScanData.sorosStocks.length})</span>} key="soros">
              <ScanResultsTable stocks={marketScanData.sorosStocks} strategy="SOROS" />
            </TabPane>
            <TabPane tab={<span>⚖️ Dalio ({marketScanData.dalioStocks.length})</span>} key="dalio">
              <ScanResultsTable stocks={marketScanData.dalioStocks} strategy="DALIO" />
            </TabPane>
            <TabPane tab={<span>⚡ PTJ ({marketScanData.ptjStocks.length})</span>} key="ptj">
              <ScanResultsTable stocks={marketScanData.ptjStocks} strategy="PTJ" />
            </TabPane>
          </Tabs>
        </div>
      )}
    </Card>
  );

  // Scan Results Table Component
  const ScanResultsTable = ({ stocks, strategy }: { stocks: EnhancedScreenedStock[], strategy: string }) => {
    const columns = [
      {
        title: 'Symbol',
        dataIndex: 'symbol',
        key: 'symbol',
        render: (symbol: string, record: EnhancedScreenedStock) => (
          <Space>
            <Tag color="blue">{symbol}</Tag>
            <Tooltip title={record.name}>
              <BulbOutlined style={{ color: '#1890ff' }} />
            </Tooltip>
          </Space>
        )
      },
      {
        title: 'Score',
        dataIndex: 'overallScore',
        key: 'score',
        render: (score: number) => (
          <Progress
            type="circle"
            size={40}
            percent={score}
            strokeColor={score >= 80 ? '#52c41a' : score >= 60 ? '#1890ff' : '#fa8c16'}
          />
        ),
        sorter: (a: EnhancedScreenedStock, b: EnhancedScreenedStock) => a.overallScore - b.overallScore
      },
      {
        title: 'Price',
        dataIndex: 'price',
        key: 'price',
        render: (price: number) => `$${price.toFixed(2)}`
      },
      {
        title: 'Market Cap',
        dataIndex: 'marketCap',
        key: 'marketCap',
        render: (cap: number) => {
          if (cap > 1e12) return `$${(cap / 1e12).toFixed(1)}T`;
          if (cap > 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
          return `$${(cap / 1e6).toFixed(0)}M`;
        }
      },
      {
        title: 'Strategy Score',
        key: 'strategyScore',
        render: (record: EnhancedScreenedStock) => {
          const scores = record.famousTraderScores;
          let score = 0;
          let color = '#d9d9d9';
          
          switch (strategy) {
            case 'BUFFETT':
              score = scores.buffett;
              color = score >= 70 ? '#52c41a' : '#fa8c16';
              break;
            case 'SOROS':
              score = scores.soros;
              color = score >= 70 ? '#722ed1' : '#fa8c16';
              break;
            case 'DALIO':
              score = scores.dalio;
              color = score >= 70 ? '#1890ff' : '#fa8c16';
              break;
            case 'PTJ':
              score = scores.ptj;
              color = score >= 70 ? '#ff4d4f' : '#fa8c16';
              break;
            case 'HYBRID':
              score = record.overallScore;
              color = score >= 70 ? '#52c41a' : '#fa8c16';
              break;
          }
          
          return <Tag color={color}>{score}/100</Tag>;
        }
      },
      {
        title: 'Risk Level',
        dataIndex: 'riskLevel',
        key: 'riskLevel',
        render: (risk: string) => {
          const colors = {
            'LOW': 'green',
            'MEDIUM': 'blue',
            'HIGH': 'orange',
            'VERY_HIGH': 'red'
          };
          return <Tag color={colors[risk as keyof typeof colors]}>{risk}</Tag>;
        }
      },
      {
        title: 'Recommendation',
        dataIndex: 'recommendation',
        key: 'recommendation',
        render: (rec: string) => {
          const colors = {
            'STRONG_BUY': 'green',
            'BUY': 'blue',
            'HOLD': 'orange',
            'SELL': 'red',
            'STRONG_SELL': 'red'
          };
          return <Tag color={colors[rec as keyof typeof colors]}>{rec}</Tag>;
        }
      }
    ];

    return (
      <Table
        dataSource={stocks}
        columns={columns}
        rowKey="symbol"
        size="small"
        pagination={{ pageSize: 5 }}
        scroll={{ x: 800 }}
      />
    );
  };

  // Enhanced Strategy Selection with Scan Integration
  const EnhancedStrategySelectionStep = () => {
    const getStrategyRecommendation = (strategy: string) => {
      if (!marketScanData) return 'Run market scan for personalized recommendations';
      
      const stockCounts = {
        'BUFFETT': marketScanData.buffettStocks.length,
        'SOROS': marketScanData.sorosStocks.length,
        'DALIO': marketScanData.dalioStocks.length,
        'PTJ': marketScanData.ptjStocks.length,
        'HYBRID': marketScanData.hybridStocks.length
      };
      
      const count = stockCounts[strategy as keyof typeof stockCounts];
      
      if (count === 0) return 'No opportunities found in current market conditions';
      if (count <= 3) return `Limited opportunities (${count} stocks) - consider alternative strategies`;
      if (count <= 7) return `Good opportunities (${count} stocks) - solid choice for this week`;
      return `Excellent opportunities (${count} stocks) - optimal strategy for current conditions`;
    };

    return (
      <Card title="🎯 AI-Enhanced Strategy Selection">
        <Alert
          message="Strategy Selection Based on Market Scan"
          description="Choose your strategy based on AI analysis of current market conditions and available opportunities."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form form={form} layout="vertical">
          <Form.Item
            name="primaryStrategy"
            label="Select Your PRIMARY Strategy"
            rules={[{ required: true, message: 'Please select your primary strategy' }]}
          >
            <Radio.Group 
              style={{ width: '100%' }} 
              onChange={(e) => handleStrategyChange(e.target.value)}
            >
              {[
                { key: 'HYBRID', name: 'Multi-Strategy Hybrid', icon: '🏆', color: '#52c41a' },
                { key: 'BUFFETT', name: 'Warren Buffett Value', icon: '📈', color: '#1890ff' },
                { key: 'SOROS', name: 'George Soros Macro', icon: '🎯', color: '#722ed1' },
                { key: 'DALIO', name: 'Ray Dalio All Weather', icon: '⚖️', color: '#fa8c16' },
                { key: 'PTJ', name: 'Paul Tudor Jones Contrarian', icon: '⚡', color: '#ff4d4f' }
              ].map((strategy) => (
                <Card
                  key={strategy.key}
                  style={{ 
                    marginBottom: 16, 
                    borderColor: selectedStrategy === strategy.key ? strategy.color : '#d9d9d9',
                    backgroundColor: selectedStrategy === strategy.key ? `${strategy.color}10` : 'white'
                  }}
                >
                  <Radio value={strategy.key} style={{ width: '100%' }}>
                    <Row justify="space-between" align="middle">
                      <Col span={16}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Space>
                            <span style={{ fontSize: '18px' }}>{strategy.icon}</span>
                            <Text strong>{strategy.name}</Text>
                            {marketScanData && (
                              <Badge
                                count={
                                  strategy.key === 'BUFFETT' ? marketScanData.buffettStocks.length :
                                  strategy.key === 'SOROS' ? marketScanData.sorosStocks.length :
                                  strategy.key === 'DALIO' ? marketScanData.dalioStocks.length :
                                  strategy.key === 'PTJ' ? marketScanData.ptjStocks.length :
                                  marketScanData.hybridStocks.length
                                }
                                style={{ backgroundColor: strategy.color }}
                              />
                            )}
                          </Space>
                          <Text type="secondary">{getStrategyRecommendation(strategy.key)}</Text>
                        </Space>
                      </Col>
                      <Col span={8} style={{ textAlign: 'right' }}>
                        {marketScanData && (
                          <Progress
                            type="circle"
                            size={50}
                            percent={Math.min(100, (strategy.key === 'BUFFETT' ? marketScanData.buffettStocks.length :
                              strategy.key === 'SOROS' ? marketScanData.sorosStocks.length :
                              strategy.key === 'DALIO' ? marketScanData.dalioStocks.length :
                              strategy.key === 'PTJ' ? marketScanData.ptjStocks.length :
                              marketScanData.hybridStocks.length) * 10)}
                            strokeColor={strategy.color}
                          />
                        )}
                      </Col>
                    </Row>
                  </Radio>
                </Card>
              ))}
            </Radio.Group>
          </Form.Item>

          {marketScanData && selectedStrategy && (
            <Alert
              message="Auto-Generated Watchlist"
              description={`Based on your ${selectedStrategy} strategy selection, we've automatically populated your watchlist with the top-scoring opportunities from the market scan.`}
              type="success"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </Form>
      </Card>
    );
  };

  // Enhanced Game Plan with Scan Results
  const EnhancedGamePlanStep = () => (
    <Card title="📋 AI-Enhanced Weekly Game Plan">
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
          label={
            <Space>
              <span>AI-Generated Watchlist</span>
              {marketScanData && selectedStrategy && (
                <Tag color="green">Auto-populated from {selectedStrategy} scan</Tag>
              )}
            </Space>
          }
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
            mode="multiple"
            placeholder="Your AI-recommended watchlist will appear here"
            style={{ width: '100%' }}
            optionLabelProp="label"
          >
            {marketScanData && selectedStrategy && (() => {
              const stocks = selectedStrategy === 'BUFFETT' ? marketScanData.buffettStocks :
                           selectedStrategy === 'SOROS' ? marketScanData.sorosStocks :
                           selectedStrategy === 'DALIO' ? marketScanData.dalioStocks :
                           selectedStrategy === 'PTJ' ? marketScanData.ptjStocks :
                           marketScanData.hybridStocks;
              
              return stocks.slice(0, 10).map(stock => (
                <Option 
                  key={stock.symbol} 
                  value={stock.symbol}
                  label={
                    <Space>
                      <span>{stock.symbol}</span>
                      <Tag color="green">{stock.overallScore}/100</Tag>
                    </Space>
                  }
                >
                  <Space>
                    <span>{stock.symbol}</span>
                    <span>-</span>
                    <span>{stock.name}</span>
                    <Tag color="green">Score: {stock.overallScore}</Tag>
                    <Tag color="blue">{stock.recommendation}</Tag>
                  </Space>
                </Option>
              ));
            })()}
          </Select>
        </Form.Item>

        {marketScanData && selectedStrategy && (
          <Alert
            message="AI Recommendations Summary"
            description={
              <List
                size="small"
                dataSource={[
                  `Strategy: ${selectedStrategy} selected based on ${
                    selectedStrategy === 'BUFFETT' ? marketScanData.buffettStocks.length :
                    selectedStrategy === 'SOROS' ? marketScanData.sorosStocks.length :
                    selectedStrategy === 'DALIO' ? marketScanData.dalioStocks.length :
                    selectedStrategy === 'PTJ' ? marketScanData.ptjStocks.length :
                    marketScanData.hybridStocks.length
                  } opportunities`,
                  `Market Condition: ${marketScanData.scanMetadata.marketCondition}`,
                  `Scan Quality: ${marketScanData.scanMetadata.totalSymbols} symbols analyzed`,
                  `Last Updated: ${dayjs(marketScanData.scanMetadata.lastScan).format('MMM DD, YYYY HH:mm')}`
                ]}
                renderItem={item => <List.Item>• {item}</List.Item>}
              />
            }
            type="info"
            showIcon
          />
        )}

        <Divider />

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
            <Option value="scanning">Market Scanning - Use AI recommendations</Option>
            <Option value="journaling">Trade Journaling - Document everything</Option>
          </Select>
        </Form.Item>

        <Alert
          message="AI-Powered Weekly Success Plan"
          description="Your watchlist has been automatically generated using advanced screening algorithms based on famous trader strategies. Focus on these high-probability opportunities while maintaining strict risk management."
          type="success"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Form>
    </Card>
  );

  const handleNext = async () => {
    try {
      const values = await form.validateFields();
      setPlanningData(prev => ({ ...prev, ...values }));
      
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
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

  const handleCompletePlanning = () => {
    const weeklyPlan: WeeklyPlan = {
      id: `enhanced-plan-${Date.now()}`,
      challengeId,
      weekNumber: currentWeek,
      weekStartDate: dayjs().startOf('week').toDate(),
      weekTarget: planningData.weeklyTarget || 2500,
      dailyTarget: planningData.dailyTarget || 500,
      maxRiskPerTrade: planningData.maxRiskPerTrade || 2,
      maxTotalRisk: planningData.maxTotalRisk || 10,
      selectedStrategies: [selectedStrategy],
      watchlist: planningData.watchlist || [],
      marketCondition: marketScanData?.scanMetadata.marketCondition as any || 'BULLISH',
      focusAreas: planningData.focusAreas || [],
      economicEvents: [],
      createdAt: new Date()
    };

    if (onComplete) {
      onComplete(weeklyPlan);
      message.success('🎉 AI-Enhanced Weekly Planning Complete!');
    }
  };

  const steps = [
    {
      title: 'Market Scan',
      icon: <SearchOutlined />,
      content: <MarketScanStep />
    },
    {
      title: 'Strategy Selection',
      icon: <TrophyOutlined />,
      content: <EnhancedStrategySelectionStep />
    },
    {
      title: 'Game Plan',
      icon: <CalendarOutlined />,
      content: <EnhancedGamePlanStep />
    }
  ];

  return (
    <div className="enhanced-weekly-planning-wizard">
      <Card>
        <Title level={3}>
          <FireOutlined /> AI-Powered Weekly Planning - Week {currentWeek}
        </Title>
        <Paragraph type="secondary">
          Enhanced planning with famous trader strategies and AI-powered market scanning.
        </Paragraph>

        <Steps
          current={currentStep}
          items={steps.map((step, index) => ({
            title: step.title,
            icon: step.icon,
            status: index < currentStep ? 'finish' : index === currentStep ? 'process' : 'wait'
          }))}
          style={{ marginBottom: 32 }}
        />

        <div className="steps-content" style={{ minHeight: 500 }}>
          {steps[currentStep].content}
        </div>

        <Divider />

        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button
                icon={<SaveOutlined />}
                onClick={() => {
                  const currentValues = form.getFieldsValue();
                  const draftData = { ...planningData, ...currentValues };
                  if (onSaveDraft) {
                    onSaveDraft(draftData);
                    message.success('Draft saved successfully');
                  }
                }}
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
                  Complete AI Planning
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default EnhancedWeeklyPlanningWizard;