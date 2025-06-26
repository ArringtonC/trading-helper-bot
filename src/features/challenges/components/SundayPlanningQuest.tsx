/**
 * Sunday Planning Quest Component
 * 
 * Transforms Sunday planning into an engaging RPG quest that integrates with
 * WeeklyMarketScanService to provide automated strategy scans and watchlist building.
 * 
 * Features:
 * - 4-stage progressive quest system (50 XP total)
 * - Strategy class selection with real-time scan previews
 * - Interactive watchlist builder with drag-and-drop
 * - XP rewards and progress tracking
 * - Boss-prep theme with RPG styling
 * - Psychology integration for stress management
 * 
 * Quest Stages:
 * 1. Character Assessment (10 XP) - Review stats and performance
 * 2. Market Intelligence (15 XP) - SP500 analysis and economic events  
 * 3. Strategy Loadout (15 XP) - Select strategy class and scan markets
 * 4. Weekly Planning (10 XP) - Build watchlist and set position sizing
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Progress, 
  Button, 
  Typography, 
  Row, 
  Col, 
  Space, 
  Tag, 
  Divider,
  Alert,
  Statistic,
  Badge,
  Table,
  Tooltip,
  Spin,
  notification,
  Select,
  InputNumber,
  List,
  Avatar,
  Empty,
  Steps,
  Modal
} from 'antd';
import { 
  TrophyOutlined,
  FireOutlined,
  AimOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  SearchOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StarOutlined,
  DragOutlined,
  PlusOutlined,
  DeleteOutlined,
  BarChartOutlined,
  DollarOutlined,
  AlertOutlined,
  BulbOutlined
} from '@ant-design/icons';

// Type imports
import { 
  Challenge, 
  DailyTask, 
  XPEvent,
  CharacterProgression,
  WeeklyPlan,
  PerformanceMetrics
} from '../types/challenge';
import { 
  WeeklyMarketScanService,
  ScanResult,
  WeeklyScanData,
  StrategyClass
} from '../../market-data/services/WeeklyMarketScanService';
import { MonitoringService } from '../../../shared/services/MonitoringService';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

// Quest Stage Interface
interface QuestStage {
  id: number;
  title: string;
  description: string;
  xpReward: number;
  icon: React.ReactNode;
  status: 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED';
  requirements?: string[];
  completedAt?: Date;
}

// Watchlist Stock Interface
interface WatchlistStock {
  symbol: string;
  companyName: string;
  price: number;
  confidenceScore: number;
  setupQuality: 'A+' | 'A' | 'B' | 'C';
  xpReward: number;
  reasoning: string[];
  alertLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  selected: boolean;
}

// Component Props
interface SundayPlanningQuestProps {
  challenge?: Challenge;
  characterProgression?: CharacterProgression;
  performanceMetrics?: PerformanceMetrics;
  weeklyPlan?: WeeklyPlan;
  onXPGained?: (xp: number, source: string) => void;
  onQuestCompleted?: (totalXP: number) => void;
  onWatchlistUpdated?: (watchlist: string[]) => void;
  onWeeklyPlanUpdated?: (plan: Partial<WeeklyPlan>) => void;
}

const SundayPlanningQuest: React.FC<SundayPlanningQuestProps> = ({
  challenge,
  characterProgression,
  performanceMetrics,
  weeklyPlan,
  onXPGained,
  onQuestCompleted,
  onWatchlistUpdated,
  onWeeklyPlanUpdated
}) => {
  // State Management
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [questStages, setQuestStages] = useState<QuestStage[]>([]);
  const [selectedStrategyClass, setSelectedStrategyClass] = useState<StrategyClass>('BUFFETT_GUARDIAN');
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [watchlist, setWatchlist] = useState<WatchlistStock[]>([]);
  const [weeklyTarget, setWeeklyTarget] = useState<number>(1000);
  const [maxRiskPerTrade, setMaxRiskPerTrade] = useState<number>(100);
  const [totalXPEarned, setTotalXPEarned] = useState<number>(0);
  const [marketScanService, setMarketScanService] = useState<WeeklyMarketScanService | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyScanData | null>(null);
  const [showStrategyModal, setShowStrategyModal] = useState(false);

  // Initialize WeeklyMarketScanService
  useEffect(() => {
    const initializeService = async () => {
      try {
        const monitoring = new MonitoringService();
        await monitoring.initialize();
        
        const service = new WeeklyMarketScanService(monitoring);
        await service.initialize();
        
        setMarketScanService(service);
      } catch (error) {
        console.error('Failed to initialize WeeklyMarketScanService:', error);
        notification.error({
          message: 'Service Initialization Failed',
          description: 'Unable to load market scanning service. Using mock data.',
        });
      }
    };

    initializeService();
  }, []);

  // Initialize Quest Stages
  useEffect(() => {
    const stages: QuestStage[] = [
      {
        id: 0,
        title: '🏴‍☠️ Character Assessment',
        description: 'Review your trading stats, performance metrics, and skill progression',
        xpReward: 10,
        icon: <SafetyOutlined />,
        status: 'AVAILABLE',
        requirements: ['Review current stats', 'Assess skill gaps', 'Check achievement progress']
      },
      {
        id: 1,
        title: '🔍 Market Intelligence Gathering',
        description: 'Scout economic events, analyze SP500 trends, and assess market conditions',
        xpReward: 15,
        icon: <SearchOutlined />,
        status: 'LOCKED',
        requirements: ['Review economic calendar', 'Analyze market sentiment', 'Identify key events']
      },
      {
        id: 2,
        title: '⚔️ Strategy Loadout Selection',
        description: 'Choose your PRIMARY strategy class and scan for legendary opportunities',
        xpReward: 15,
        icon: <ThunderboltOutlined />,
        status: 'LOCKED',
        requirements: ['Select strategy class', 'Run market scan', 'Analyze opportunities']
      },
      {
        id: 3,
        title: '📋 Weekly Quest Planning',
        description: 'Build your watchlist, set profit targets, and configure position sizing',
        xpReward: 10,
        icon: <AimOutlined />,
        status: 'LOCKED',
        requirements: ['Create watchlist', 'Set weekly target', 'Configure risk limits']
      }
    ];

    setQuestStages(stages);
  }, []);

  // Strategy Class Definitions
  const strategyClasses = [
    {
      key: 'BUFFETT_GUARDIAN' as StrategyClass,
      name: 'Buffett Guardian',
      icon: '🏰',
      description: 'Defensive value investing with strong fundamentals',
      color: '#52c41a',
      strengths: ['Risk Management', 'Long-term Stability', 'Dividend Income'],
      criteria: 'P/E < 15, ROE > 15%, Debt/Equity < 0.5'
    },
    {
      key: 'DALIO_WARRIOR' as StrategyClass,
      name: 'Dalio Warrior',
      icon: '⚡',
      description: 'Momentum-based trend following with systematic approach',
      color: '#1890ff',
      strengths: ['Trend Capture', 'Momentum Trading', 'Risk Parity'],
      criteria: 'RSI 40-60, Momentum > 5%, Volume > 150%'
    },
    {
      key: 'SOROS_ASSASSIN' as StrategyClass,
      name: 'Soros Assassin',
      icon: '🗡️',
      description: 'Contrarian plays and volatility opportunities',
      color: '#722ed1',
      strengths: ['Volatility Trading', 'Contrarian Entries', 'Market Psychology'],
      criteria: 'RSI < 30, Volatility > 25%, Price-Volume Divergence'
    },
    {
      key: 'LYNCH_SCOUT' as StrategyClass,
      name: 'Lynch Scout',
      icon: '🔍',
      description: 'Growth discovery and emerging opportunities',
      color: '#fa8c16',
      strengths: ['Growth Identification', 'Small-Mid Cap', 'Fundamental Analysis'],
      criteria: 'PEG < 1.0, Earnings Growth > 20%, Market Cap < $10B'
    }
  ];

  // Stage Completion Handlers
  const completeStage = useCallback((stageId: number) => {
    setQuestStages(prev => prev.map(stage => {
      if (stage.id === stageId) {
        const updatedStage = { 
          ...stage, 
          status: 'COMPLETED' as const, 
          completedAt: new Date() 
        };
        
        // Award XP
        setTotalXPEarned(prev => prev + stage.xpReward);
        onXPGained?.(stage.xpReward, `Sunday Quest: ${stage.title}`);
        
        // Unlock next stage
        if (stageId < prev.length - 1) {
          const nextStage = prev.find(s => s.id === stageId + 1);
          if (nextStage) {
            nextStage.status = 'AVAILABLE';
          }
        }
        
        return updatedStage;
      }
      return stage;
    }));

    // Auto-advance to next stage
    if (stageId < questStages.length - 1) {
      setCurrentStage(stageId + 1);
    } else {
      // Quest completed!
      const totalXP = questStages.reduce((sum, stage) => sum + stage.xpReward, 0);
      onQuestCompleted?.(totalXP);
      notification.success({
        message: '🎉 Sunday Quest Completed!',
        description: `You've earned ${totalXP} XP and prepared for an epic trading week!`,
        duration: 5
      });
    }
  }, [questStages, onXPGained, onQuestCompleted]);

  // Market Scan Handler
  const runMarketScan = useCallback(async (strategyClass: StrategyClass) => {
    if (!marketScanService) {
      // Use mock data if service not available
      const mockResults: ScanResult[] = [
        {
          symbol: 'AAPL',
          companyName: 'Apple Inc.',
          price: 185.50,
          marketCap: 2800000000000,
          sector: 'Technology',
          industry: 'Consumer Electronics',
          pe: 28.5,
          roe: 22.4,
          debtToEquity: 0.31,
          rsi: 45.2,
          priceChange1D: 1.2,
          priceChange1W: 3.4,
          priceChange1M: 8.7,
          volume: 45000000,
          volumeAvg: 52000000,
          peg: 1.8,
          earningsGrowth: 15.2,
          revenueGrowth: 12.3,
          volatility: 23.1,
          strategyClass,
          confidenceScore: 85,
          reasoning: ['Strong fundamentals', 'Solid balance sheet', 'Market leader position'],
          alertLevel: 'HIGH',
          xpReward: 40,
          setupQuality: 'A',
          scanDate: new Date(),
          lastUpdated: new Date()
        }
      ];
      setScanResults(mockResults);
      return;
    }

    setIsScanning(true);
    try {
      const results = await marketScanService.runWeeklyScan(strategyClass);
      setScanResults(results);
      
      // Get comprehensive weekly data
      const weeklyData = await marketScanService.getScanResults('default', strategyClass);
      setWeeklyData(weeklyData);
      
      notification.success({
        message: 'Market Scan Complete!',
        description: `Found ${results.length} opportunities for ${strategyClass} strategy`,
      });
    } catch (error) {
      console.error('Market scan failed:', error);
      notification.error({
        message: 'Scan Failed',
        description: 'Unable to complete market scan. Please try again.',
      });
    } finally {
      setIsScanning(false);
    }
  }, [marketScanService]);

  // Watchlist Management
  const addToWatchlist = useCallback((stock: ScanResult) => {
    const watchlistStock: WatchlistStock = {
      symbol: stock.symbol,
      companyName: stock.companyName,
      price: stock.price,
      confidenceScore: stock.confidenceScore,
      setupQuality: stock.setupQuality,
      xpReward: stock.xpReward,
      reasoning: stock.reasoning,
      alertLevel: stock.alertLevel,
      selected: true
    };

    setWatchlist(prev => {
      const exists = prev.find(item => item.symbol === stock.symbol);
      if (exists) return prev;
      
      const newWatchlist = [...prev, watchlistStock];
      onWatchlistUpdated?.(newWatchlist.map(item => item.symbol));
      return newWatchlist;
    });
  }, [onWatchlistUpdated]);

  const removeFromWatchlist = useCallback((symbol: string) => {
    setWatchlist(prev => {
      const newWatchlist = prev.filter(item => item.symbol !== symbol);
      onWatchlistUpdated?.(newWatchlist.map(item => item.symbol));
      return newWatchlist;
    });
  }, [onWatchlistUpdated]);

  // Render Quest Stages
  const renderQuestProgress = () => (
    <Card className="mb-6">
      <div className="mb-4">
        <Title level={3} className="text-center mb-2">
          🏴‍☠️ Sunday Planning Quest
        </Title>
        <Text className="text-center block text-gray-600 mb-4">
          Strategic Planning Session • 7:00-9:00 PM • 50 XP Total
        </Text>
        
        <Steps current={currentStage} size="small">
          {questStages.map((stage, index) => (
            <Step
              key={stage.id}
              title={stage.title}
              description={`${stage.xpReward} XP`}
              status={
                stage.status === 'COMPLETED' ? 'finish' :
                stage.status === 'IN_PROGRESS' ? 'process' :
                stage.status === 'AVAILABLE' ? 'wait' : 'wait'
              }
              icon={stage.status === 'COMPLETED' ? <CheckCircleOutlined /> : stage.icon}
            />
          ))}
        </Steps>
      </div>
      
      <Row gutter={16}>
        <Col span={12}>
          <Statistic
            title="XP Earned"
            value={totalXPEarned}
            suffix="/ 50 XP"
            valueStyle={{ color: totalXPEarned > 30 ? '#3f8600' : '#1890ff' }}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Weekly XP Potential"
            value={weeklyData?.totalXPReward || 0}
            suffix="XP"
            valueStyle={{ color: '#fa8c16' }}
          />
        </Col>
      </Row>
      
      <Progress 
        percent={(totalXPEarned / 50) * 100}
        strokeColor={{
          '0%': '#108ee9',
          '100%': '#87d068',
        }}
        className="mt-4"
      />
    </Card>
  );

  // Stage 1: Character Assessment
  const renderCharacterAssessment = () => (
    <Card 
      title={
        <Space>
          <SafetyOutlined style={{ color: '#52c41a' }} />
          Character Assessment
          <Tag color="green">10 XP</Tag>
        </Space>
      }
      className="mb-6"
    >
      <Row gutter={24}>
        <Col span={12}>
          <Card size="small" title="📊 Performance Stats">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Current Level"
                  value={characterProgression?.currentLevel || 8}
                  suffix="/ 20"
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Total XP"
                  value={characterProgression?.totalXP || 2850}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
            </Row>
            
            <Divider />
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Text>Win Rate:</Text>
                <Text strong>{performanceMetrics?.winRate?.toFixed(1) || '68.5'}%</Text>
              </div>
              <div className="flex justify-between">
                <Text>Profit Factor:</Text>
                <Text strong className="text-green-600">
                  {performanceMetrics?.profitFactor?.toFixed(2) || '1.45'}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text>Max Drawdown:</Text>
                <Text strong className="text-orange-600">
                  {performanceMetrics?.maxDrawdown?.toFixed(1) || '12.5'}%
                </Text>
              </div>
            </div>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card size="small" title="⚡ Skill Progression">
            <div className="space-y-3">
              {Object.entries(characterProgression?.allocatedSkillPoints || {
                patience: 7,
                riskManagement: 9,
                setupQuality: 6,
                strategyAdherence: 8,
                stressManagement: 5,
                profitProtection: 4,
                disciplineControl: 6
              }).map(([skill, level]) => (
                <div key={skill} className="flex items-center justify-between">
                  <Text className="capitalize">
                    {skill.replace(/([A-Z])/g, ' $1').trim()}:
                  </Text>
                  <div className="flex items-center space-x-2">
                    <Progress 
                      percent={(level / 10) * 100} 
                      size="small" 
                      className="w-20" 
                    />
                    <Text strong>{level}/10</Text>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
      
      <Alert
        message="Assessment Complete!"
        description="Your character shows strong risk management skills but could improve stress management and profit protection. Consider focusing on these areas this week."
        type="info"
        showIcon
        className="mt-4"
      />
      
      <div className="mt-4 text-center">
        <Button 
          type="primary" 
          size="large"
          onClick={() => completeStage(0)}
          disabled={questStages[0]?.status === 'COMPLETED'}
        >
          Complete Assessment (+10 XP)
        </Button>
      </div>
    </Card>
  );

  // Stage 2: Market Intelligence
  const renderMarketIntelligence = () => (
    <Card 
      title={
        <Space>
          <SearchOutlined style={{ color: '#1890ff' }} />
          Market Intelligence Gathering
          <Tag color="blue">15 XP</Tag>
        </Space>
      }
      className="mb-6"
    >
      <Row gutter={24}>
        <Col span={12}>
          <Card size="small" title="📅 Economic Events">
            <List
              size="small"
              dataSource={[
                { event: 'Fed Meeting Minutes', impact: 'HIGH', date: 'Wed 2:00 PM' },
                { event: 'CPI Data Release', impact: 'HIGH', date: 'Thu 8:30 AM' },
                { event: 'Unemployment Claims', impact: 'MEDIUM', date: 'Thu 8:30 AM' },
                { event: 'Consumer Sentiment', impact: 'MEDIUM', date: 'Fri 10:00 AM' }
              ]}
              renderItem={(item) => (
                <List.Item>
                  <div className="flex justify-between w-full">
                    <Text>{item.event}</Text>
                    <Space>
                      <Tag color={item.impact === 'HIGH' ? 'red' : 'orange'}>
                        {item.impact}
                      </Tag>
                      <Text type="secondary">{item.date}</Text>
                    </Space>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        
        <Col span={12}>
          <Card size="small" title="📈 Market Sentiment">
            <div className="space-y-3">
              <div className="flex justify-between">
                <Text>SP500 Trend:</Text>
                <Tag color="green">BULLISH</Tag>
              </div>
              <div className="flex justify-between">
                <Text>VIX Level:</Text>
                <Text strong>18.5</Text>
              </div>
              <div className="flex justify-between">
                <Text>Sector Rotation:</Text>
                <Text>Tech → Financials</Text>
              </div>
              <div className="flex justify-between">
                <Text>Volume:</Text>
                <Text className="text-green-600">Above Average</Text>
              </div>
            </div>
            
            <Divider />
            
            <Alert
              message="Market Analysis"
              description="Bullish sentiment with moderate volatility. Tech sector showing rotation to financials. Good environment for momentum strategies."
              type="success"
              size="small"
            />
          </Card>
        </Col>
      </Row>
      
      <div className="mt-4 text-center">
        <Button 
          type="primary" 
          size="large"
          onClick={() => completeStage(1)}
          disabled={questStages[1]?.status === 'COMPLETED'}
        >
          Intelligence Gathered (+15 XP)
        </Button>
      </div>
    </Card>
  );

  // Stage 3: Strategy Loadout Selection
  const renderStrategySelection = () => (
    <Card 
      title={
        <Space>
          <ThunderboltOutlined style={{ color: '#fa8c16' }} />
          Strategy Loadout Selection
          <Tag color="orange">15 XP</Tag>
        </Space>
      }
      className="mb-6"
    >
      {/* Strategy Class Selector */}
      <div className="mb-6">
        <Title level={4}>Choose Your Strategy Class</Title>
        <Row gutter={16}>
          {strategyClasses.map((strategy) => (
            <Col span={6} key={strategy.key}>
              <Card
                size="small"
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedStrategyClass === strategy.key 
                    ? 'border-2 border-blue-500 shadow-lg' 
                    : 'border border-gray-200'
                }`}
                onClick={() => setSelectedStrategyClass(strategy.key)}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{strategy.icon}</div>
                  <Title level={5} style={{ color: strategy.color }}>
                    {strategy.name}
                  </Title>
                  <Text type="secondary" className="text-xs">
                    {strategy.description}
                  </Text>
                  
                  <Divider />
                  
                  <div className="text-left">
                    <Text strong className="text-xs">Strengths:</Text>
                    {strategy.strengths.map((strength, idx) => (
                      <div key={idx}>
                        <Text className="text-xs">• {strength}</Text>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-2 text-left">
                    <Text strong className="text-xs">Criteria:</Text>
                    <Text className="text-xs block">{strategy.criteria}</Text>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Market Scan Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <Title level={4}>Market Scan Results</Title>
          <Space>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => runMarketScan(selectedStrategyClass)}
              loading={isScanning}
            >
              Run Scan
            </Button>
            <Button
              icon={<EyeOutlined />}
              onClick={() => setShowStrategyModal(true)}
            >
              Strategy Details
            </Button>
          </Space>
        </div>

        {isScanning && (
          <div className="text-center py-8">
            <Spin size="large" />
            <div className="mt-4">
              <Text>Scanning markets for {selectedStrategyClass} opportunities...</Text>
            </div>
          </div>
        )}

        {scanResults.length > 0 && !isScanning && (
          <div>
            <Alert
              message={`Found ${scanResults.length} opportunities!`}
              description={`${weeklyData?.qualifyingStocks || scanResults.length} stocks passed screening criteria. Total XP potential: ${weeklyData?.totalXPReward || 0} XP`}
              type="success"
              showIcon
              className="mb-4"
            />

            <Table
              dataSource={scanResults}
              pagination={{ pageSize: 5 }}
              size="small"
              rowKey="symbol"
              columns={[
                {
                  title: 'Symbol',
                  dataIndex: 'symbol',
                  key: 'symbol',
                  render: (symbol: string, record: ScanResult) => (
                    <Space>
                      <Text strong>{symbol}</Text>
                      <Tag color={
                        record.setupQuality === 'A+' ? 'purple' :
                        record.setupQuality === 'A' ? 'green' :
                        record.setupQuality === 'B' ? 'blue' : 'orange'
                      }>
                        {record.setupQuality}
                      </Tag>
                    </Space>
                  )
                },
                {
                  title: 'Confidence',
                  dataIndex: 'confidenceScore',
                  key: 'confidence',
                  render: (score: number) => (
                    <Progress 
                      percent={score} 
                      size="small" 
                      strokeColor={
                        score >= 90 ? '#722ed1' :
                        score >= 80 ? '#52c41a' :
                        score >= 70 ? '#1890ff' : '#faad14'
                      }
                    />
                  )
                },
                {
                  title: 'XP Reward',
                  dataIndex: 'xpReward',
                  key: 'xp',
                  render: (xp: number) => (
                    <Tag color="gold">{xp} XP</Tag>
                  )
                },
                {
                  title: 'Alert',
                  dataIndex: 'alertLevel',
                  key: 'alert',
                  render: (level: string) => (
                    <Tag color={
                      level === 'CRITICAL' ? 'red' :
                      level === 'HIGH' ? 'orange' :
                      level === 'MEDIUM' ? 'blue' : 'default'
                    }>
                      {level}
                    </Tag>
                  )
                },
                {
                  title: 'Action',
                  key: 'action',
                  render: (_, record: ScanResult) => (
                    <Button
                      size="small"
                      type="link"
                      icon={<PlusOutlined />}
                      onClick={() => addToWatchlist(record)}
                    >
                      Add to Watchlist
                    </Button>
                  )
                }
              ]}
              expandable={{
                expandedRowRender: (record: ScanResult) => (
                  <div className="p-4 bg-gray-50">
                    <Title level={5}>Analysis Reasoning:</Title>
                    <ul>
                      {record.reasoning.map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )
              }}
            />
          </div>
        )}
      </div>

      <div className="text-center">
        <Button 
          type="primary" 
          size="large"
          onClick={() => completeStage(2)}
          disabled={questStages[2]?.status === 'COMPLETED' || scanResults.length === 0}
        >
          Strategy Selected (+15 XP)
        </Button>
      </div>
    </Card>
  );

  // Stage 4: Weekly Planning
  const renderWeeklyPlanning = () => (
    <Card 
      title={
        <Space>
          <AimOutlined style={{ color: '#52c41a' }} />
          Weekly Quest Planning
          <Tag color="green">10 XP</Tag>
        </Space>
      }
      className="mb-6"
    >
      <Row gutter={24}>
        <Col span={12}>
          <Card size="small" title="📋 Watchlist Builder">
            {watchlist.length > 0 ? (
              <List
                dataSource={watchlist}
                renderItem={(stock) => (
                  <List.Item
                    actions={[
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removeFromWatchlist(stock.symbol)}
                      />
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar style={{ 
                          backgroundColor: 
                            stock.setupQuality === 'A+' ? '#722ed1' :
                            stock.setupQuality === 'A' ? '#52c41a' :
                            stock.setupQuality === 'B' ? '#1890ff' : '#faad14'
                        }}>
                          {stock.setupQuality}
                        </Avatar>
                      }
                      title={
                        <Space>
                          <Text strong>{stock.symbol}</Text>
                          <Tag color="gold">{stock.xpReward} XP</Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <Text type="secondary">${stock.price.toFixed(2)}</Text>
                          <br />
                          <Progress 
                            percent={stock.confidenceScore} 
                            size="small" 
                            className="mt-1"
                          />
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty 
                description="No stocks in watchlist yet"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <Text className="text-sm text-blue-700">
                Watchlist: {watchlist.length}/10 stocks • 
                Total XP: {watchlist.reduce((sum, stock) => sum + stock.xpReward, 0)} XP
              </Text>
            </div>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card size="small" title="🎯 Quest Configuration">
            <div className="space-y-4">
              <div>
                <Text strong>Weekly Profit Target:</Text>
                <InputNumber
                  value={weeklyTarget}
                  onChange={(value) => setWeeklyTarget(value || 1000)}
                  prefix="$"
                  size="large"
                  className="w-full mt-2"
                  min={100}
                  max={5000}
                  step={100}
                />
              </div>
              
              <div>
                <Text strong>Max Risk Per Trade:</Text>
                <InputNumber
                  value={maxRiskPerTrade}
                  onChange={(value) => setMaxRiskPerTrade(value || 100)}
                  prefix="$"
                  size="large"
                  className="w-full mt-2"
                  min={50}
                  max={500}
                  step={25}
                />
              </div>

              <Divider />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Text>Daily Target:</Text>
                  <Text strong>${(weeklyTarget / 5).toFixed(0)}</Text>
                </div>
                <div className="flex justify-between">
                  <Text>Risk %:</Text>
                  <Text strong>
                    {((maxRiskPerTrade / (challenge?.currentAmount || 13450)) * 100).toFixed(1)}%
                  </Text>
                </div>
                <div className="flex justify-between">
                  <Text>Weekly XP Potential:</Text>
                  <Text strong className="text-orange-600">
                    {watchlist.reduce((sum, stock) => sum + stock.xpReward, 0)} XP
                  </Text>
                </div>
              </div>
            </div>
            
            <Alert
              message="Risk Check"
              description={
                maxRiskPerTrade > (challenge?.currentAmount || 13450) * 0.02 
                  ? "⚠️ Risk per trade exceeds 2% - consider reducing position size"
                  : "✅ Risk management looks good - within 2% rule"
              }
              type={maxRiskPerTrade > (challenge?.currentAmount || 13450) * 0.02 ? "warning" : "success"}
              size="small"
              className="mt-4"
            />
          </Card>
        </Col>
      </Row>
      
      <div className="mt-6 text-center">
        <Button 
          type="primary" 
          size="large"
          onClick={() => {
            completeStage(3);
            onWeeklyPlanUpdated?.({
              weekTarget: weeklyTarget,
              maxRiskPerTrade,
              selectedStrategies: [selectedStrategyClass],
              watchlist: watchlist.map(stock => stock.symbol)
            });
          }}
          disabled={questStages[3]?.status === 'COMPLETED' || watchlist.length === 0}
        >
          Complete Weekly Planning (+10 XP)
        </Button>
      </div>
    </Card>
  );

  // Strategy Details Modal
  const renderStrategyModal = () => {
    const selectedStrategy = strategyClasses.find(s => s.key === selectedStrategyClass);
    
    return (
      <Modal
        title={
          <Space>
            <span style={{ fontSize: '24px' }}>{selectedStrategy?.icon}</span>
            {selectedStrategy?.name} Strategy
          </Space>
        }
        open={showStrategyModal}
        onCancel={() => setShowStrategyModal(false)}
        footer={null}
        width={800}
      >
        <div className="space-y-4">
          <div>
            <Title level={4}>Strategy Overview</Title>
            <Paragraph>{selectedStrategy?.description}</Paragraph>
          </div>
          
          <div>
            <Title level={4}>Core Strengths</Title>
            <ul>
              {selectedStrategy?.strengths.map((strength, idx) => (
                <li key={idx}>{strength}</li>
              ))}
            </ul>
          </div>
          
          <div>
            <Title level={4}>Screening Criteria</Title>
            <Text code>{selectedStrategy?.criteria}</Text>
          </div>
          
          {weeklyData && (
            <div>
              <Title level={4}>This Week's Outlook</Title>
              <Alert
                message={weeklyData.weeklyTheme}
                description={`Market sentiment: ${weeklyData.overallMarketSentiment} • ${weeklyData.qualifyingStocks} qualifying stocks found`}
                type="info"
                showIcon
              />
              
              <div className="mt-4">
                <Title level={5}>Recommended Actions:</Title>
                <ul>
                  {weeklyData.recommendedActions.map((action, idx) => (
                    <li key={idx}>{action}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </Modal>
    );
  };

  // Main Render
  return (
    <div className="sunday-planning-quest" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {renderQuestProgress()}
      
      {currentStage === 0 && questStages[0]?.status !== 'COMPLETED' && renderCharacterAssessment()}
      {currentStage === 1 && questStages[1]?.status !== 'COMPLETED' && renderMarketIntelligence()}
      {currentStage === 2 && questStages[2]?.status !== 'COMPLETED' && renderStrategySelection()}
      {currentStage === 3 && questStages[3]?.status !== 'COMPLETED' && renderWeeklyPlanning()}
      
      {/* Show completed stages in summary */}
      {questStages.filter(s => s.status === 'COMPLETED').length > 0 && (
        <Card title="✅ Completed Quest Stages" className="mt-6">
          <Row gutter={16}>
            {questStages
              .filter(s => s.status === 'COMPLETED')
              .map((stage) => (
                <Col span={6} key={stage.id}>
                  <Card size="small" className="bg-green-50 border-green-200">
                    <div className="text-center">
                      <CheckCircleOutlined className="text-green-500 text-2xl mb-2" />
                      <Text strong className="block">{stage.title}</Text>
                      <Tag color="green">{stage.xpReward} XP</Tag>
                      <div className="mt-2">
                        <Text type="secondary" className="text-xs">
                          Completed: {stage.completedAt?.toLocaleTimeString()}
                        </Text>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
          </Row>
        </Card>
      )}

      {/* Quest Complete Summary */}
      {questStages.every(s => s.status === 'COMPLETED') && (
        <Card className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <div className="text-center">
            <Title level={2} className="text-green-700">
              🎉 Sunday Quest Complete!
            </Title>
            <Paragraph className="text-lg">
              You've successfully prepared for the trading week ahead and earned <strong>50 XP</strong>!
            </Paragraph>
            
            <Row gutter={16} className="mt-6">
              <Col span={8}>
                <Statistic
                  title="Total XP Earned"
                  value={totalXPEarned}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<TrophyOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Watchlist Stocks"
                  value={watchlist.length}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<StarOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Weekly XP Potential"
                  value={watchlist.reduce((sum, stock) => sum + stock.xpReward, 0)}
                  valueStyle={{ color: '#fa8c16' }}
                  prefix={<FireOutlined />}
                />
              </Col>
            </Row>
            
            <div className="mt-6">
              <Button type="primary" size="large" href="/challenge-dashboard">
                Return to Challenge Dashboard
              </Button>
            </div>
          </div>
        </Card>
      )}

      {renderStrategyModal()}
    </div>
  );
};

export default SundayPlanningQuest;