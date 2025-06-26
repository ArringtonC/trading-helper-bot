import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Tabs,
  Table,
  Badge,
  Button,
  Select,
  Switch,
  Progress,
  Statistic,
  Alert,
  Space,
  Row,
  Col,
  Drawer,
  Form,
  InputNumber,
  notification,
  Tag,
  Tooltip,
  Modal,
  List,
  Typography,
  Divider,
  Timeline,
  Empty,
  Spin,
  message,
  Descriptions
} from 'antd';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  ComposedChart,
  Scatter
} from 'recharts';
import {
  BellOutlined,
  SettingOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  FallOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FireOutlined,
  StarOutlined,
  SoundOutlined,
  EyeOutlined,
  FilterOutlined,
  HistoryOutlined,
  RocketOutlined,
  BookOutlined,
  ExperimentOutlined
} from '@ant-design/icons';
import { PatternRecognitionService } from '../../../services/PatternRecognitionService';
import { ChallengeService } from '../../../services/ChallengeService';
import { useAuth } from '../../../hooks/useAuth';
import { formatCurrency, formatPercentage } from '../../../utils/formatters';
import './PatternRecognitionDashboard.css';

const { TabPane } = Tabs;
const { Text, Title, Paragraph } = Typography;
const { Option } = Select;

interface Pattern {
  id: string;
  type: string;
  symbol: string;
  confidence: number;
  direction: 'bullish' | 'bearish' | 'neutral';
  priceTarget: number;
  stopLoss: number;
  timeframe: string;
  detectedAt: Date;
  status: 'active' | 'completed' | 'failed';
  successRate: number;
  xpReward: number;
}

interface PatternAlert {
  id: string;
  patternId: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
  read: boolean;
  actionTaken: boolean;
}

interface PatternPerformance {
  patternType: string;
  totalDetected: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  avgReturn: number;
  bestReturn: number;
  worstReturn: number;
}

interface AlertSettings {
  enableSound: boolean;
  enableVisual: boolean;
  minConfidence: number;
  priorityFilter: string[];
  patternTypes: string[];
  symbols: string[];
}

const PatternRecognitionDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('live');
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [alerts, setAlerts] = useState<PatternAlert[]>([]);
  const [performance, setPerformance] = useState<PatternPerformance[]>([]);
  const [loading, setLoading] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    enableSound: true,
    enableVisual: true,
    minConfidence: 70,
    priorityFilter: ['high', 'medium', 'low'],
    patternTypes: [],
    symbols: []
  });
  const [xpProgress, setXpProgress] = useState({
    current: 0,
    nextLevel: 1000,
    level: 1,
    recentXP: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [realtimePrice, setRealtimePrice] = useState<number>(0);

  const patternRecognitionService = useMemo(() => new PatternRecognitionService(), []);
  const challengeService = useMemo(() => new ChallengeService(), []);

  // Load initial data
  useEffect(() => {
    loadPatterns();
    loadAlerts();
    loadPerformance();
    loadXPProgress();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      loadPatterns();
      updateRealtimePrice();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadPatterns = async () => {
    try {
      setLoading(true);
      const data = await patternRecognitionService.getActivePatterns();
      setPatterns(data);
      
      // Generate chart data from patterns
      const chartPoints = generateChartData(data);
      setChartData(chartPoints);
    } catch (error) {
      message.error('Failed to load patterns');
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const data = await patternRecognitionService.getAlerts();
      setAlerts(data);
      
      // Check for new high-priority alerts
      const newHighPriorityAlerts = data.filter(
        alert => !alert.read && alert.priority === 'high'
      );
      
      if (newHighPriorityAlerts.length > 0 && alertSettings.enableVisual) {
        notification.warning({
          message: 'New Pattern Alert!',
          description: `${newHighPriorityAlerts.length} high-priority pattern(s) detected`,
          icon: <BellOutlined style={{ color: '#ff4d4f' }} />,
          placement: 'topRight'
        });
      }
      
      if (newHighPriorityAlerts.length > 0 && alertSettings.enableSound) {
        playAlertSound();
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const loadPerformance = async () => {
    try {
      const data = await patternRecognitionService.getPatternPerformance();
      setPerformance(data);
    } catch (error) {
      console.error('Failed to load performance:', error);
    }
  };

  const loadXPProgress = async () => {
    try {
      const progress = await challengeService.getUserProgress(user?.id);
      setXpProgress(progress);
    } catch (error) {
      console.error('Failed to load XP progress:', error);
    }
  };

  const updateRealtimePrice = () => {
    // Simulate real-time price updates
    setRealtimePrice(prev => prev + (Math.random() - 0.5) * 2);
  };

  const generateChartData = (patterns: Pattern[]) => {
    // Generate sample chart data with pattern overlays
    const baseData = Array.from({ length: 100 }, (_, i) => ({
      time: new Date(Date.now() - (100 - i) * 60000).toISOString(),
      price: 100 + Math.sin(i / 10) * 10 + Math.random() * 5,
      volume: Math.random() * 1000000
    }));

    // Add pattern markers
    patterns.forEach(pattern => {
      const index = Math.floor(Math.random() * baseData.length);
      baseData[index] = {
        ...baseData[index],
        pattern: pattern.type,
        confidence: pattern.confidence,
        direction: pattern.direction
      };
    });

    return baseData;
  };

  const playAlertSound = () => {
    const audio = new Audio('/sounds/alert.mp3');
    audio.play().catch(e => console.error('Failed to play alert sound:', e));
  };

  const handlePatternAction = async (pattern: Pattern, action: 'accept' | 'reject') => {
    try {
      await patternRecognitionService.handlePatternAction(pattern.id, action);
      
      if (action === 'accept') {
        // Award XP for accepting pattern
        await challengeService.awardXP(user?.id, pattern.xpReward);
        setXpProgress(prev => ({
          ...prev,
          current: prev.current + pattern.xpReward,
          recentXP: pattern.xpReward
        }));
        
        message.success(`Pattern accepted! +${pattern.xpReward} XP`);
      }
      
      loadPatterns();
      loadAlerts();
    } catch (error) {
      message.error('Failed to process pattern action');
    }
  };

  const markAlertAsRead = async (alertId: string) => {
    try {
      await patternRecognitionService.markAlertAsRead(alertId);
      loadAlerts();
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const saveAlertSettings = async () => {
    try {
      await patternRecognitionService.updateAlertSettings(alertSettings);
      message.success('Alert settings saved');
      setSettingsVisible(false);
    } catch (error) {
      message.error('Failed to save settings');
    }
  };

  const renderLivePatterns = () => (
    <div className="live-patterns-container">
      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card title="Real-Time Pattern Detection" className="pattern-chart-card">
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                />
                <YAxis yAxisId="price" orientation="left" />
                <YAxis yAxisId="volume" orientation="right" />
                <RechartsTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload[0]) {
                      const data = payload[0].payload;
                      return (
                        <div className="custom-tooltip">
                          <p>Price: {formatCurrency(data.price)}</p>
                          <p>Volume: {data.volume?.toLocaleString()}</p>
                          {data.pattern && (
                            <>
                              <Divider style={{ margin: '8px 0' }} />
                              <p><strong>Pattern: {data.pattern}</strong></p>
                              <p>Confidence: {data.confidence}%</p>
                              <p>Direction: <Tag color={data.direction === 'bullish' ? 'green' : 'red'}>
                                {data.direction}
                              </Tag></p>
                            </>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Area
                  yAxisId="volume"
                  type="monotone"
                  dataKey="volume"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                />
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="price"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  dot={false}
                />
                {/* Pattern markers */}
                <Scatter
                  yAxisId="price"
                  dataKey="pattern"
                  fill="#ff4d4f"
                  shape={(props: any) => {
                    if (props.payload.pattern) {
                      return (
                        <circle
                          cx={props.cx}
                          cy={props.cy}
                          r={8}
                          fill={props.payload.direction === 'bullish' ? '#52c41a' : '#ff4d4f'}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      );
                    }
                    return null;
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        
        <Col span={8}>
          <Card 
            title="Active Patterns" 
            extra={<Badge count={patterns.filter(p => p.status === 'active').length} />}
            className="active-patterns-card"
          >
            <List
              dataSource={patterns.filter(p => p.status === 'active')}
              renderItem={pattern => (
                <List.Item
                  actions={[
                    <Button 
                      type="primary" 
                      size="small" 
                      icon={<CheckCircleOutlined />}
                      onClick={() => handlePatternAction(pattern, 'accept')}
                    >
                      Trade
                    </Button>,
                    <Button 
                      size="small" 
                      icon={<CloseCircleOutlined />}
                      onClick={() => handlePatternAction(pattern, 'reject')}
                    >
                      Skip
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div className={`pattern-icon ${pattern.direction}`}>
                        {pattern.direction === 'bullish' ? <RiseOutlined /> : <FallOutlined />}
                      </div>
                    }
                    title={
                      <Space>
                        <Text strong>{pattern.type}</Text>
                        <Tag color={pattern.confidence > 80 ? 'green' : 'orange'}>
                          {pattern.confidence}% confidence
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size="small">
                        <Text>{pattern.symbol} - {pattern.timeframe}</Text>
                        <Space>
                          <Text type="secondary">Target: {formatCurrency(pattern.priceTarget)}</Text>
                          <Text type="secondary">Stop: {formatCurrency(pattern.stopLoss)}</Text>
                        </Space>
                        <Space>
                          <Tag icon={<TrophyOutlined />} color="gold">
                            +{pattern.xpReward} XP
                          </Tag>
                          <Tag icon={<FireOutlined />} color="blue">
                            {pattern.successRate}% success rate
                          </Tag>
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: <Empty description="No active patterns" /> }}
            />
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="Pattern Detection Feed" className="pattern-feed-card">
            <Timeline mode="left">
              {patterns.slice(0, 10).map(pattern => (
                <Timeline.Item
                  key={pattern.id}
                  color={pattern.direction === 'bullish' ? 'green' : 'red'}
                  label={new Date(pattern.detectedAt).toLocaleTimeString()}
                >
                  <Card size="small" className="pattern-timeline-card">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Space justify="space-between" style={{ width: '100%' }}>
                        <Text strong>{pattern.type} Pattern Detected</Text>
                        <Badge 
                          status={pattern.status === 'active' ? 'processing' : 'default'} 
                          text={pattern.status}
                        />
                      </Space>
                      <Space>
                        <Tag>{pattern.symbol}</Tag>
                        <Tag>{pattern.timeframe}</Tag>
                        <Tag color={pattern.confidence > 80 ? 'green' : 'orange'}>
                          {pattern.confidence}% confidence
                        </Tag>
                      </Space>
                      <Progress 
                        percent={pattern.confidence} 
                        strokeColor={pattern.confidence > 80 ? '#52c41a' : '#faad14'}
                        size="small"
                      />
                    </Space>
                  </Card>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderAlerts = () => (
    <div className="alerts-container">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card
            title="Pattern Alerts"
            extra={
              <Space>
                <Select
                  mode="multiple"
                  placeholder="Filter by priority"
                  style={{ width: 200 }}
                  defaultValue={alertSettings.priorityFilter}
                  onChange={(values) => setAlertSettings({ ...alertSettings, priorityFilter: values })}
                >
                  <Option value="high">High Priority</Option>
                  <Option value="medium">Medium Priority</Option>
                  <Option value="low">Low Priority</Option>
                </Select>
                <Button icon={<FilterOutlined />}>More Filters</Button>
              </Space>
            }
          >
            <Table
              dataSource={alerts.filter(a => alertSettings.priorityFilter.includes(a.priority))}
              columns={[
                {
                  title: 'Time',
                  dataIndex: 'timestamp',
                  key: 'timestamp',
                  render: (timestamp: Date) => new Date(timestamp).toLocaleString(),
                  width: 150
                },
                {
                  title: 'Alert',
                  dataIndex: 'message',
                  key: 'message',
                  render: (message: string, record: PatternAlert) => (
                    <Space>
                      {!record.read && <Badge dot />}
                      <Text>{message}</Text>
                    </Space>
                  )
                },
                {
                  title: 'Priority',
                  dataIndex: 'priority',
                  key: 'priority',
                  render: (priority: string) => (
                    <Tag color={
                      priority === 'high' ? 'red' : 
                      priority === 'medium' ? 'orange' : 
                      'blue'
                    }>
                      {priority.toUpperCase()}
                    </Tag>
                  ),
                  width: 100
                },
                {
                  title: 'Status',
                  key: 'status',
                  render: (_: any, record: PatternAlert) => (
                    <Space>
                      <Tag color={record.read ? 'default' : 'blue'}>
                        {record.read ? 'Read' : 'Unread'}
                      </Tag>
                      {record.actionTaken && (
                        <Tag color="green" icon={<CheckCircleOutlined />}>
                          Action Taken
                        </Tag>
                      )}
                    </Space>
                  ),
                  width: 200
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: (_: any, record: PatternAlert) => (
                    <Space>
                      <Button 
                        size="small" 
                        icon={<EyeOutlined />}
                        onClick={() => {
                          markAlertAsRead(record.id);
                          const pattern = patterns.find(p => p.id === record.patternId);
                          if (pattern) setSelectedPattern(pattern);
                        }}
                      >
                        View
                      </Button>
                      <Button 
                        size="small" 
                        type="primary"
                        icon={<ThunderboltOutlined />}
                        disabled={record.actionTaken}
                      >
                        Trade
                      </Button>
                    </Space>
                  ),
                  width: 150
                }
              ]}
              pagination={{ pageSize: 10 }}
              rowKey="id"
              className="alerts-table"
            />
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Alerts Today"
              value={alerts.filter(a => 
                new Date(a.timestamp).toDateString() === new Date().toDateString()
              ).length}
              prefix={<BellOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Unread Alerts"
              value={alerts.filter(a => !a.read).length}
              valueStyle={{ color: '#1890ff' }}
              prefix={<Badge dot />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Actions Taken"
              value={alerts.filter(a => a.actionTaken).length}
              valueStyle={{ color: '#52c41a' }}
              suffix={`/ ${alerts.length}`}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderPerformance = () => (
    <div className="performance-container">
      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card title="Pattern Success Rates">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="patternType" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="successRate" fill="#52c41a" name="Success Rate %" />
                <Bar dataKey="totalDetected" fill="#1890ff" name="Total Detected" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        
        <Col span={8}>
          <Card title="Top Performing Patterns">
            <List
              dataSource={performance.sort((a, b) => b.successRate - a.successRate).slice(0, 5)}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<TrophyOutlined style={{ fontSize: 24, color: '#faad14' }} />}
                    title={item.patternType}
                    description={
                      <Space direction="vertical" size="small">
                        <Progress 
                          percent={item.successRate} 
                          strokeColor="#52c41a"
                          format={percent => `${percent}% success`}
                        />
                        <Text type="secondary">
                          {item.successCount}/{item.totalDetected} successful
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="Pattern Returns Analysis">
            <Table
              dataSource={performance}
              columns={[
                {
                  title: 'Pattern Type',
                  dataIndex: 'patternType',
                  key: 'patternType',
                  render: (text: string) => <Text strong>{text}</Text>
                },
                {
                  title: 'Total Detected',
                  dataIndex: 'totalDetected',
                  key: 'totalDetected',
                  sorter: (a, b) => a.totalDetected - b.totalDetected
                },
                {
                  title: 'Success Rate',
                  dataIndex: 'successRate',
                  key: 'successRate',
                  render: (rate: number) => (
                    <Progress 
                      percent={rate} 
                      size="small" 
                      strokeColor={rate > 70 ? '#52c41a' : rate > 50 ? '#faad14' : '#ff4d4f'}
                    />
                  ),
                  sorter: (a, b) => a.successRate - b.successRate
                },
                {
                  title: 'Avg Return',
                  dataIndex: 'avgReturn',
                  key: 'avgReturn',
                  render: (value: number) => (
                    <Text type={value > 0 ? 'success' : 'danger'}>
                      {formatPercentage(value)}
                    </Text>
                  ),
                  sorter: (a, b) => a.avgReturn - b.avgReturn
                },
                {
                  title: 'Best Return',
                  dataIndex: 'bestReturn',
                  key: 'bestReturn',
                  render: (value: number) => (
                    <Text type="success">{formatPercentage(value)}</Text>
                  )
                },
                {
                  title: 'Worst Return',
                  dataIndex: 'worstReturn',
                  key: 'worstReturn',
                  render: (value: number) => (
                    <Text type="danger">{formatPercentage(value)}</Text>
                  )
                }
              ]}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card 
            title="Challenge RPG Integration" 
            extra={<Tag icon={<TrophyOutlined />} color="gold">Level {xpProgress.level}</Tag>}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text>XP Progress to Next Level</Text>
                <Progress 
                  percent={(xpProgress.current / xpProgress.nextLevel) * 100}
                  status="active"
                  format={() => `${xpProgress.current} / ${xpProgress.nextLevel} XP`}
                />
                {xpProgress.recentXP > 0 && (
                  <Text type="success" style={{ display: 'block', marginTop: 8 }}>
                    +{xpProgress.recentXP} XP earned from recent patterns!
                  </Text>
                )}
              </div>
              
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title="Patterns Mastered"
                    value={performance.filter(p => p.successRate > 80).length}
                    prefix={<StarOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Total XP Earned"
                    value={xpProgress.current}
                    prefix={<TrophyOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Win Streak"
                    value={5}
                    prefix={<FireOutlined />}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Achievements"
                    value="12/50"
                    prefix={<RocketOutlined />}
                  />
                </Col>
              </Row>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderSettings = () => (
    <div className="settings-container">
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Alert Configuration">
            <Form
              layout="vertical"
              initialValues={alertSettings}
              onFinish={saveAlertSettings}
            >
              <Form.Item label="Notifications">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space justify="space-between" style={{ width: '100%' }}>
                    <Text>Enable Sound Alerts</Text>
                    <Switch 
                      checked={alertSettings.enableSound}
                      onChange={(checked) => setAlertSettings({ ...alertSettings, enableSound: checked })}
                    />
                  </Space>
                  <Space justify="space-between" style={{ width: '100%' }}>
                    <Text>Enable Visual Notifications</Text>
                    <Switch 
                      checked={alertSettings.enableVisual}
                      onChange={(checked) => setAlertSettings({ ...alertSettings, enableVisual: checked })}
                    />
                  </Space>
                </Space>
              </Form.Item>
              
              <Form.Item label="Minimum Confidence Level">
                <InputNumber
                  min={0}
                  max={100}
                  value={alertSettings.minConfidence}
                  onChange={(value) => setAlertSettings({ ...alertSettings, minConfidence: value || 70 })}
                  formatter={value => `${value}%`}
                  parser={value => value!.replace('%', '')}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              
              <Form.Item label="Pattern Types to Monitor">
                <Select
                  mode="multiple"
                  placeholder="Select pattern types"
                  style={{ width: '100%' }}
                  value={alertSettings.patternTypes}
                  onChange={(values) => setAlertSettings({ ...alertSettings, patternTypes: values })}
                >
                  <Option value="head-and-shoulders">Head and Shoulders</Option>
                  <Option value="double-top">Double Top</Option>
                  <Option value="double-bottom">Double Bottom</Option>
                  <Option value="triangle">Triangle</Option>
                  <Option value="flag">Flag</Option>
                  <Option value="wedge">Wedge</Option>
                  <Option value="cup-and-handle">Cup and Handle</Option>
                </Select>
              </Form.Item>
              
              <Form.Item label="Symbols to Watch">
                <Select
                  mode="tags"
                  placeholder="Add symbols"
                  style={{ width: '100%' }}
                  value={alertSettings.symbols}
                  onChange={(values) => setAlertSettings({ ...alertSettings, symbols: values })}
                />
              </Form.Item>
              
              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  Save Settings
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="Pattern Education">
            <List
              dataSource={[
                {
                  title: 'Head and Shoulders',
                  description: 'A reversal pattern that signals a security is likely to move against the previous trend.',
                  icon: <BookOutlined />
                },
                {
                  title: 'Double Top/Bottom',
                  description: 'Reversal patterns that occur after an extended trend and signal a shift in trend direction.',
                  icon: <ExperimentOutlined />
                },
                {
                  title: 'Triangle Patterns',
                  description: 'Continuation patterns that show a period of consolidation before the price continues.',
                  icon: <RiseOutlined />
                },
                {
                  title: 'Cup and Handle',
                  description: 'A bullish continuation pattern that marks a consolidation period followed by a breakout.',
                  icon: <RocketOutlined />
                }
              ]}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={item.icon}
                    title={item.title}
                    description={item.description}
                  />
                  <Button type="link">Learn More</Button>
                </List.Item>
              )}
            />
            
            <Divider />
            
            <Alert
              message="Pro Tip"
              description="Combine pattern recognition with other technical indicators for higher confidence trades. Never rely on patterns alone!"
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="Strategy Recommendations">
            <Table
              dataSource={[
                {
                  strategy: 'Conservative',
                  minConfidence: 85,
                  riskReward: '1:3',
                  positionSize: '1-2%',
                  suitablePatterns: ['Cup and Handle', 'Triangle']
                },
                {
                  strategy: 'Moderate',
                  minConfidence: 75,
                  riskReward: '1:2',
                  positionSize: '2-3%',
                  suitablePatterns: ['Double Bottom', 'Flag', 'Wedge']
                },
                {
                  strategy: 'Aggressive',
                  minConfidence: 65,
                  riskReward: '1:1.5',
                  positionSize: '3-5%',
                  suitablePatterns: ['All Patterns']
                }
              ]}
              columns={[
                {
                  title: 'Strategy',
                  dataIndex: 'strategy',
                  key: 'strategy',
                  render: (text: string) => <Text strong>{text}</Text>
                },
                {
                  title: 'Min Confidence',
                  dataIndex: 'minConfidence',
                  key: 'minConfidence',
                  render: (value: number) => `${value}%`
                },
                {
                  title: 'Risk:Reward',
                  dataIndex: 'riskReward',
                  key: 'riskReward'
                },
                {
                  title: 'Position Size',
                  dataIndex: 'positionSize',
                  key: 'positionSize'
                },
                {
                  title: 'Suitable Patterns',
                  dataIndex: 'suitablePatterns',
                  key: 'suitablePatterns',
                  render: (patterns: string[]) => (
                    <Space wrap>
                      {patterns.map(p => <Tag key={p}>{p}</Tag>)}
                    </Space>
                  )
                }
              ]}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  return (
    <div className="pattern-recognition-dashboard">
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card className="dashboard-header">
            <Row align="middle" justify="space-between">
              <Col>
                <Space align="center">
                  <Title level={3} style={{ margin: 0 }}>Pattern Recognition Alert System</Title>
                  <Badge 
                    count={patterns.filter(p => p.status === 'active').length} 
                    style={{ backgroundColor: '#52c41a' }}
                  >
                    <Tag color="green">LIVE</Tag>
                  </Badge>
                </Space>
              </Col>
              <Col>
                <Space>
                  <Tooltip title="Real-time price">
                    <Statistic
                      value={realtimePrice || 100}
                      precision={2}
                      prefix="$"
                      valueStyle={{ fontSize: 20 }}
                    />
                  </Tooltip>
                  <Button 
                    icon={<SettingOutlined />} 
                    onClick={() => setSettingsVisible(true)}
                  >
                    Settings
                  </Button>
                  <Button 
                    type="primary" 
                    icon={<HistoryOutlined />}
                  >
                    Pattern History
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        className="pattern-tabs"
      >
        <TabPane 
          tab={
            <span>
              <ThunderboltOutlined />
              Live Patterns
            </span>
          } 
          key="live"
        >
          {loading ? <Spin size="large" /> : renderLivePatterns()}
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <BellOutlined />
              Alerts
              <Badge 
                count={alerts.filter(a => !a.read).length} 
                style={{ marginLeft: 8 }}
              />
            </span>
          } 
          key="alerts"
        >
          {renderAlerts()}
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <TrophyOutlined />
              Performance
            </span>
          } 
          key="performance"
        >
          {renderPerformance()}
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <SettingOutlined />
              Settings
            </span>
          } 
          key="settings"
        >
          {renderSettings()}
        </TabPane>
      </Tabs>

      <Drawer
        title="Settings"
        placement="right"
        width={400}
        onClose={() => setSettingsVisible(false)}
        visible={settingsVisible}
      >
        {renderSettings()}
      </Drawer>

      <Modal
        title="Pattern Details"
        visible={!!selectedPattern}
        onCancel={() => setSelectedPattern(null)}
        footer={[
          <Button key="cancel" onClick={() => setSelectedPattern(null)}>
            Close
          </Button>,
          <Button 
            key="trade" 
            type="primary" 
            icon={<ThunderboltOutlined />}
            onClick={() => selectedPattern && handlePatternAction(selectedPattern, 'accept')}
          >
            Execute Trade
          </Button>
        ]}
        width={600}
      >
        {selectedPattern && (
          <div className="pattern-details">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Pattern Type" span={2}>
                {selectedPattern.type}
              </Descriptions.Item>
              <Descriptions.Item label="Symbol">
                {selectedPattern.symbol}
              </Descriptions.Item>
              <Descriptions.Item label="Timeframe">
                {selectedPattern.timeframe}
              </Descriptions.Item>
              <Descriptions.Item label="Direction">
                <Tag color={selectedPattern.direction === 'bullish' ? 'green' : 'red'}>
                  {selectedPattern.direction}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Confidence">
                <Progress percent={selectedPattern.confidence} />
              </Descriptions.Item>
              <Descriptions.Item label="Price Target">
                {formatCurrency(selectedPattern.priceTarget)}
              </Descriptions.Item>
              <Descriptions.Item label="Stop Loss">
                {formatCurrency(selectedPattern.stopLoss)}
              </Descriptions.Item>
              <Descriptions.Item label="Success Rate">
                {selectedPattern.successRate}%
              </Descriptions.Item>
              <Descriptions.Item label="XP Reward">
                <Tag icon={<TrophyOutlined />} color="gold">
                  +{selectedPattern.xpReward} XP
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PatternRecognitionDashboard;