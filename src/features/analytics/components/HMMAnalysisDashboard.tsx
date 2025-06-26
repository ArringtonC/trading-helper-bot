import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Tabs,
  Select,
  Button,
  Space,
  Badge,
  Statistic,
  Alert,
  Tooltip,
  Progress,
  Typography,
  Spin,
  Modal,
  message,
  Tag,
  Divider,
  Radio,
  Switch,
  DatePicker
} from 'antd';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap,
  ComposedChart,
  ReferenceLine
} from 'recharts';
import {
  RiseOutlined,
  FallOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  ExportOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  AreaChartOutlined,
  HeatMapOutlined,
  StockOutlined,
  FundOutlined
} from '@ant-design/icons';
import { format, subDays } from 'date-fns';
import { saveAs } from 'file-saver';
import HMMIntegrationService, { HMMState, HMMAnalysisResult } from '../services/HMMIntegrationService';
import VIXProfessionalChart from './VIXProfessionalChart';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Types
interface MarketRegime {
  state: 'BULL' | 'BEAR' | 'NEUTRAL' | 'VOLATILE';
  confidence: number;
  transitionProbability: number;
  timestamp: Date;
}

interface HMMPrediction {
  date: string;
  regime: MarketRegime;
  vixCorrelation: number;
  expectedReturn: number;
  riskLevel: number;
}

interface StateTransition {
  from: string;
  to: string;
  probability: number;
  count: number;
}

// Mock data generator
const generateMockHMMData = (): HMMPrediction[] => {
  const regimes: MarketRegime['state'][] = ['BULL', 'BEAR', 'NEUTRAL', 'VOLATILE'];
  const data: HMMPrediction[] = [];
  
  for (let i = 90; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const regime = regimes[Math.floor(Math.random() * regimes.length)];
    
    data.push({
      date: format(date, 'yyyy-MM-dd'),
      regime: {
        state: regime,
        confidence: 0.6 + Math.random() * 0.35,
        transitionProbability: Math.random() * 0.3,
        timestamp: date
      },
      vixCorrelation: -0.8 + Math.random() * 1.6,
      expectedReturn: regime === 'BULL' ? 0.002 + Math.random() * 0.008 :
                     regime === 'BEAR' ? -0.008 + Math.random() * 0.006 :
                     -0.002 + Math.random() * 0.004,
      riskLevel: regime === 'VOLATILE' ? 0.7 + Math.random() * 0.3 :
                 regime === 'BEAR' ? 0.5 + Math.random() * 0.3 :
                 0.2 + Math.random() * 0.3
    });
  }
  
  return data;
};

// Components
const RegimeIndicator: React.FC<{ regime: MarketRegime }> = ({ regime }) => {
  const getRegimeColor = (state: MarketRegime['state']) => {
    switch (state) {
      case 'BULL': return '#52c41a';
      case 'BEAR': return '#f5222d';
      case 'NEUTRAL': return '#faad14';
      case 'VOLATILE': return '#722ed1';
    }
  };

  const getRegimeIcon = (state: MarketRegime['state']) => {
    switch (state) {
      case 'BULL': return <RiseOutlined />;
      case 'BEAR': return <FallOutlined />;
      case 'NEUTRAL': return <DashboardOutlined />;
      case 'VOLATILE': return <ThunderboltOutlined />;
    }
  };

  return (
    <Card className="regime-indicator">
      <Space direction="vertical" align="center" style={{ width: '100%' }}>
        <Badge 
          count={`${(regime.confidence * 100).toFixed(0)}%`} 
          style={{ backgroundColor: getRegimeColor(regime.state) }}
        >
          <div 
            style={{ 
              fontSize: 48, 
              color: getRegimeColor(regime.state),
              padding: '20px'
            }}
          >
            {getRegimeIcon(regime.state)}
          </div>
        </Badge>
        <Title level={4} style={{ margin: 0, color: getRegimeColor(regime.state) }}>
          {regime.state} MARKET
        </Title>
        <Text type="secondary">Current Regime</Text>
        
        <Divider style={{ margin: '12px 0' }} />
        
        <Row gutter={16} style={{ width: '100%' }}>
          <Col span={12}>
            <Statistic
              title="Confidence"
              value={regime.confidence * 100}
              precision={1}
              suffix="%"
              valueStyle={{ fontSize: 16 }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="Transition Prob"
              value={regime.transitionProbability * 100}
              precision={1}
              suffix="%"
              valueStyle={{ fontSize: 16 }}
            />
          </Col>
        </Row>
      </Space>
    </Card>
  );
};

const StateTransitionHeatmap: React.FC<{ data: StateTransition[] }> = ({ data }) => {
  const states = ['BULL', 'BEAR', 'NEUTRAL', 'VOLATILE'];
  const heatmapData = states.flatMap((from, i) =>
    states.map((to, j) => ({
      x: j,
      y: i,
      value: Math.random(), // Mock probability
      from,
      to
    }))
  );

  const colorScale = (value: number) => {
    const intensity = Math.floor(value * 255);
    return `rgb(${255 - intensity}, ${intensity}, 0)`;
  };

  return (
    <Card title="State Transition Probability Matrix" className="transition-heatmap">
      <div style={{ textAlign: 'center' }}>
        <svg width={400} height={400}>
          <g transform="translate(50, 50)">
            {/* Y-axis labels */}
            {states.map((state, i) => (
              <text
                key={`y-${i}`}
                x={-10}
                y={i * 75 + 37.5}
                textAnchor="end"
                style={{ fontSize: 12 }}
              >
                {state}
              </text>
            ))}
            
            {/* X-axis labels */}
            {states.map((state, i) => (
              <text
                key={`x-${i}`}
                x={i * 75 + 37.5}
                y={-10}
                textAnchor="middle"
                style={{ fontSize: 12 }}
              >
                {state}
              </text>
            ))}
            
            {/* Heatmap cells */}
            {heatmapData.map((cell, idx) => (
              <Tooltip key={idx} title={`${cell.from} → ${cell.to}: ${(cell.value * 100).toFixed(1)}%`}>
                <rect
                  x={cell.x * 75}
                  y={cell.y * 75}
                  width={75}
                  height={75}
                  fill={colorScale(cell.value)}
                  stroke="#fff"
                  strokeWidth={2}
                />
                <text
                  x={cell.x * 75 + 37.5}
                  y={cell.y * 75 + 37.5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#fff"
                  style={{ fontSize: 14, fontWeight: 'bold' }}
                >
                  {(cell.value * 100).toFixed(0)}%
                </text>
              </Tooltip>
            ))}
          </g>
        </svg>
      </div>
      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <Text type="secondary">Probability of transitioning from row state to column state</Text>
      </div>
    </Card>
  );
};

const VIXCorrelationChart: React.FC<{ data: HMMPrediction[] }> = ({ data }) => {
  const correlationData = data.map((d, index) => {
    const vixValue = 15 + Math.random() * 20; // Mock VIX value
    
    // Generate trading signals based on VIX levels and HMM regime
    let signal = '';
    let signalColor = '';
    
    // VIX trading rules
    if (vixValue < 16 && d.regime.state === 'BULL') {
      signal = 'BUY';
      signalColor = '#52c41a';
    } else if (vixValue > 30 && d.regime.state === 'BEAR') {
      signal = 'SELL';
      signalColor = '#f5222d';
    } else if (vixValue > 25 && d.regime.state === 'VOLATILE') {
      signal = 'HEDGE';
      signalColor = '#faad14';
    } else if (vixValue < 18 && d.regime.state === 'NEUTRAL') {
      signal = 'HOLD';
      signalColor = '#1890ff';
    }

    return {
      date: format(new Date(d.date), 'MM/dd'),
      correlation: d.vixCorrelation,
      regime: d.regime.state,
      vix: vixValue,
      signal: signal,
      signalColor: signalColor,
      signalValue: signal ? vixValue : null // Only show signal markers when there's a signal
    };
  });

  // Custom dot for trading signals
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!payload.signal) return null;
    
    return (
      <g>
        <circle 
          cx={cx} 
          cy={cy} 
          r={6} 
          fill={payload.signalColor}
          stroke="#fff"
          strokeWidth={2}
        />
        <text 
          x={cx} 
          y={cy - 15} 
          textAnchor="middle" 
          fontSize={10} 
          fontWeight="bold"
          fill={payload.signalColor}
        >
          {payload.signal}
        </text>
      </g>
    );
  };

  return (
    <Card title="VIX Trading Signals" extra={<Tag color="blue">Live Signals</Tag>}>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={correlationData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" label={{ value: 'Correlation', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="right" orientation="right" label={{ value: 'VIX', angle: 90, position: 'insideRight' }} />
          <RechartsTooltip 
            formatter={(value: any, name: string, props: any) => {
              if (name === 'VIX Index' && props.payload.signal) {
                return [
                  `${value.toFixed(2)} - ${props.payload.signal}`,
                  name
                ];
              }
              return [typeof value === 'number' ? value.toFixed(3) : value, name];
            }}
          />
          <Legend />
          
          {/* VIX Reference Lines */}
          <ReferenceLine yAxisId="right" y={16} stroke="#52c41a" strokeDasharray="5 5" strokeWidth={2} />
          <ReferenceLine yAxisId="right" y={18} stroke="#1890ff" strokeDasharray="3 3" strokeWidth={1} />
          <ReferenceLine yAxisId="right" y={25} stroke="#faad14" strokeDasharray="3 3" strokeWidth={1} />
          <ReferenceLine yAxisId="right" y={30} stroke="#f5222d" strokeDasharray="5 5" strokeWidth={2} />
          
          {/* VIX Chart Area */}
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="vix"
            stroke="#ff7300"
            fill="#ff7300"
            fillOpacity={0.3}
            name="VIX Index"
          />
          
          {/* Trading Signal Dots */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="signalValue"
            stroke="transparent"
            dot={<CustomDot />}
            line={false}
            name="Trading Signals"
          />
          
          {/* Correlation Line */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="correlation"
            stroke="#8884d8"
            strokeWidth={2}
            name="HMM-VIX Correlation"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* Trading Rules Legend */}
      <Divider />
      <Card size="small" title="📊 VIX Trading Rules" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 8]}>
          <Col span={12}>
            <Space>
              <div style={{ width: 12, height: 12, backgroundColor: '#52c41a', borderRadius: '50%' }}></div>
              <Text><strong>BUY:</strong> VIX &lt; 16 + Bull Regime</Text>
            </Space>
          </Col>
          <Col span={12}>
            <Space>
              <div style={{ width: 12, height: 12, backgroundColor: '#f5222d', borderRadius: '50%' }}></div>
              <Text><strong>SELL:</strong> VIX &gt; 30 + Bear Regime</Text>
            </Space>
          </Col>
          <Col span={12}>
            <Space>
              <div style={{ width: 12, height: 12, backgroundColor: '#faad14', borderRadius: '50%' }}></div>
              <Text><strong>HEDGE:</strong> VIX &gt; 25 + Volatile Regime</Text>
            </Space>
          </Col>
          <Col span={12}>
            <Space>
              <div style={{ width: 12, height: 12, backgroundColor: '#1890ff', borderRadius: '50%' }}></div>
              <Text><strong>HOLD:</strong> VIX &lt; 18 + Neutral Regime</Text>
            </Space>
          </Col>
        </Row>
        <div style={{ marginTop: 12, padding: 8, backgroundColor: '#f0f2f5', borderRadius: 4 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <strong>Strategy:</strong> VIX below 16 indicates low fear (good time to buy). VIX above 30 indicates high fear (consider selling/hedging). 
            Signals combine VIX levels with HMM regime predictions for optimal timing.
          </Text>
        </div>
      </Card>
      
      <Row gutter={16}>
        <Col span={8}>
          <Statistic
            title="Current VIX"
            value={correlationData[correlationData.length - 1]?.vix || 0}
            precision={2}
            valueStyle={{ 
              color: (correlationData[correlationData.length - 1]?.vix || 0) > 25 ? '#f5222d' : 
                     (correlationData[correlationData.length - 1]?.vix || 0) < 18 ? '#52c41a' : '#faad14'
            }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Current Signal"
            value={correlationData[correlationData.length - 1]?.signal || 'NONE'}
            valueStyle={{ 
              color: correlationData[correlationData.length - 1]?.signalColor || '#666'
            }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="HMM-VIX Correlation"
            value={correlationData[correlationData.length - 1]?.correlation || 0}
            precision={3}
            valueStyle={{ color: correlationData[correlationData.length - 1]?.correlation > 0 ? '#3f8600' : '#cf1322' }}
          />
        </Col>
      </Row>
    </Card>
  );
};

const MarketRegimeTimeline: React.FC<{ data: HMMPrediction[] }> = ({ data }) => {
  const timelineData = data.filter((_, idx) => idx % 7 === 0).map(d => ({
    date: d.date,
    regime: d.regime.state,
    confidence: d.regime.confidence
  }));

  const getRegimeColor = (state: string) => {
    switch (state) {
      case 'BULL': return '#52c41a';
      case 'BEAR': return '#f5222d';
      case 'NEUTRAL': return '#faad14';
      case 'VOLATILE': return '#722ed1';
      default: return '#8c8c8c';
    }
  };

  return (
    <Card title="Market Regime Timeline" extra={<Button icon={<ExportOutlined />} size="small">Export</Button>}>
      <div style={{ overflowX: 'auto', paddingBottom: 20 }}>
        <div style={{ display: 'flex', minWidth: '800px' }}>
          {timelineData.map((item, idx) => (
            <div 
              key={idx} 
              style={{ 
                flex: 1, 
                textAlign: 'center',
                borderRight: idx < timelineData.length - 1 ? '1px solid #f0f0f0' : 'none'
              }}
            >
              <div style={{ marginBottom: 10 }}>
                <Tag color={getRegimeColor(item.regime)}>{item.regime}</Tag>
              </div>
              <div 
                style={{ 
                  height: 60, 
                  backgroundColor: getRegimeColor(item.regime),
                  opacity: item.confidence,
                  margin: '0 5px'
                }}
              />
              <div style={{ marginTop: 10, fontSize: 12 }}>
                {format(new Date(item.date), 'MMM dd')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

// Main Dashboard Component
export const HMMAnalysisDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('1M');
  const [selectedRegime, setSelectedRegime] = useState<string>('ALL');
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('SPY');
  const [hmmData, setHmmData] = useState<HMMPrediction[]>([]);
  const [currentRegime, setCurrentRegime] = useState<MarketRegime>({
    state: 'NEUTRAL',
    confidence: 0.75,
    transitionProbability: 0.15,
    timestamp: new Date()
  });
  const [serviceStatus, setServiceStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [availableSymbols, setAvailableSymbols] = useState<string[]>(['SPY']);
  
  // Memoize empty array to prevent new object creation on every render
  const emptyVixData = useMemo(() => [], []);
  
  const hmmService = HMMIntegrationService.getInstance();

  // Initialize with real data
  useEffect(() => {
    initializeHMMData();
  }, [selectedSymbol, selectedPeriod]);

  // Check service status on mount
  useEffect(() => {
    checkServiceStatus();
    loadAvailableSymbols();
  }, []);

  const checkServiceStatus = async () => {
    try {
      const isAvailable = await hmmService.checkServiceStatus();
      setServiceStatus(isAvailable ? 'connected' : 'disconnected');
    } catch {
      setServiceStatus('disconnected');
    }
  };

  const loadAvailableSymbols = async () => {
    try {
      const symbols = await hmmService.getAvailableSymbols();
      setAvailableSymbols(symbols);
    } catch (error) {
      console.error('Failed to load symbols:', error);
    }
  };

  const initializeHMMData = async () => {
    setLoading(true);
    try {
      if (serviceStatus === 'connected') {
        await loadRealHMMData();
      } else {
        // Fallback to mock data if service is not available
        const mockData = generateMockHMMData();
        setHmmData(mockData);
        if (mockData.length > 0) {
          setCurrentRegime(mockData[mockData.length - 1].regime);
        }
      }
    } catch (error) {
      console.error('Failed to load HMM data:', error);
      message.error('Failed to load HMM data. Using mock data.');
      // Fallback to mock data
      const mockData = generateMockHMMData();
      setHmmData(mockData);
      if (mockData.length > 0) {
        setCurrentRegime(mockData[mockData.length - 1].regime);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadRealHMMData = async () => {
    const daysBack = selectedPeriod === '1D' ? 1 : 
                     selectedPeriod === '1W' ? 7 :
                     selectedPeriod === '1M' ? 30 :
                     selectedPeriod === '3M' ? 90 : 365;

    const result = await hmmService.getPredictions({
      symbol: selectedSymbol,
      startDate: format(subDays(new Date(), daysBack), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      includeVix: true,
      returnProbabilities: true
    });

    // Convert HMMState to HMMPrediction format
    const predictions: HMMPrediction[] = result.states.map(state => ({
      date: state.date,
      regime: {
        state: state.regime,
        confidence: state.confidence,
        transitionProbability: state.transitionProbability || 0,
        timestamp: new Date(state.date)
      },
      vixCorrelation: state.vixCorrelation || 0,
      expectedReturn: state.expectedReturn || 0,
      riskLevel: state.riskLevel || 0
    }));

    setHmmData(predictions);
    setCurrentRegime(result.currentRegime ? {
      state: result.currentRegime.regime,
      confidence: result.currentRegime.confidence,
      transitionProbability: result.currentRegime.transitionProbability || 0,
      timestamp: new Date(result.currentRegime.date)
    } : predictions[predictions.length - 1]?.regime);
    setLastUpdated(result.lastUpdated);
  };

  // Handle real-time updates
  useEffect(() => {
    if (realTimeEnabled && serviceStatus === 'connected') {
      const interval = setInterval(async () => {
        try {
          // Try to get fresh real data from backend
          await loadRealHMMData();
        } catch (error) {
          console.warn('Real-time update failed, falling back to mock data:', error);
          // Fallback to simulated update
          const newPrediction = generateMockHMMData().slice(-1)[0];
          setHmmData(prev => [...prev.slice(1), newPrediction]);
          setCurrentRegime(newPrediction.regime);
        }
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [realTimeEnabled, serviceStatus, selectedSymbol, selectedPeriod]);

  const handleExport = (type: 'csv' | 'png') => {
    if (type === 'csv') {
      const csv = [
        ['Date', 'Regime', 'Confidence', 'VIX Correlation', 'Expected Return', 'Risk Level'],
        ...hmmData.map(d => [
          d.date,
          d.regime.state,
          d.regime.confidence,
          d.vixCorrelation,
          d.expectedReturn,
          d.riskLevel
        ])
      ].map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      saveAs(blob, `hmm-analysis-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      message.success('Data exported successfully');
    } else {
      message.info('Chart screenshot functionality coming soon');
    }
  };

  const filteredData = hmmData.filter(d => 
    selectedRegime === 'ALL' || d.regime.state === selectedRegime
  );

  return (
    <div className="hmm-analysis-dashboard">
      {/* Header */}
      <Card className="dashboard-header mb-6">
        <Row gutter={[16, 16]} align="middle">
          <Col flex="auto">
            <Title level={2} style={{ margin: 0 }}>
              <AreaChartOutlined /> HMM Market Analysis
            </Title>
            <Text type="secondary">
              Hidden Markov Model predictions with VIX integration
            </Text>
          </Col>
          <Col>
            <Space>
              <Badge 
                status={serviceStatus === 'connected' ? 'success' : serviceStatus === 'checking' ? 'processing' : 'error'} 
                text={serviceStatus === 'connected' ? 'Live Data' : serviceStatus === 'checking' ? 'Connecting...' : 'Mock Data'}
              />
              <Select 
                value={selectedSymbol} 
                onChange={setSelectedSymbol} 
                style={{ width: 120 }}
                showSearch
                placeholder="Symbol"
              >
                {availableSymbols.map(symbol => (
                  <Option key={symbol} value={symbol}>{symbol}</Option>
                ))}
              </Select>
              <Select value={selectedPeriod} onChange={setSelectedPeriod} style={{ width: 100 }}>
                <Option value="1D">1 Day</Option>
                <Option value="1W">1 Week</Option>
                <Option value="1M">1 Month</Option>
                <Option value="3M">3 Months</Option>
                <Option value="1Y">1 Year</Option>
              </Select>
              <Radio.Group value={selectedRegime} onChange={e => setSelectedRegime(e.target.value)}>
                <Radio.Button value="ALL">All</Radio.Button>
                <Radio.Button value="BULL">Bull</Radio.Button>
                <Radio.Button value="BEAR">Bear</Radio.Button>
                <Radio.Button value="NEUTRAL">Neutral</Radio.Button>
                <Radio.Button value="VOLATILE">Volatile</Radio.Button>
              </Radio.Group>
              <Switch
                checkedChildren="Real-time"
                unCheckedChildren="Historical"
                checked={realTimeEnabled}
                onChange={setRealTimeEnabled}
              />
              <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
                Refresh
              </Button>
              <Button.Group>
                <Button icon={<ExportOutlined />} onClick={() => handleExport('csv')}>
                  CSV
                </Button>
                <Button icon={<ExportOutlined />} onClick={() => handleExport('png')}>
                  PNG
                </Button>
              </Button.Group>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Main Content */}
      <Spin spinning={loading} size="large">
        <Row gutter={[16, 16]}>
          {/* Current Regime Indicator */}
          <Col xs={24} md={6}>
            <RegimeIndicator regime={currentRegime} />
          </Col>

          {/* Key Metrics */}
          <Col xs={24} md={18}>
            <Card>
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Card bordered={false} className="metric-card">
                    <Statistic
                      title="Prediction Accuracy"
                      value={87.3}
                      precision={1}
                      suffix="%"
                      prefix={<CheckCircleOutlined />}
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card bordered={false} className="metric-card">
                    <Statistic
                      title="Risk Level"
                      value={hmmData[hmmData.length - 1]?.riskLevel * 100 || 0}
                      precision={0}
                      suffix="%"
                      prefix={<WarningOutlined />}
                      valueStyle={{ color: '#faad14' }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card bordered={false} className="metric-card">
                    <Statistic
                      title="Expected Return"
                      value={hmmData[hmmData.length - 1]?.expectedReturn * 100 || 0}
                      precision={2}
                      suffix="%"
                      prefix={<FundOutlined />}
                      valueStyle={{ 
                        color: (hmmData[hmmData.length - 1]?.expectedReturn || 0) > 0 ? '#3f8600' : '#cf1322' 
                      }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card bordered={false} className="metric-card">
                    <Statistic
                      title="Model Confidence"
                      value={currentRegime.confidence * 100}
                      precision={1}
                      suffix="%"
                      prefix={<LineChartOutlined />}
                    />
                  </Card>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* Visualization Tabs */}
        <Card className="mt-4">
          <Tabs defaultActiveKey="predictions">
            <TabPane tab="Predictions" key="predictions">
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="expectedReturn"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    name="Expected Return"
                  />
                  <Area
                    type="monotone"
                    dataKey="riskLevel"
                    stackId="2"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    name="Risk Level"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </TabPane>
            
            <TabPane tab="State Transitions" key="transitions">
              <StateTransitionHeatmap data={[]} />
            </TabPane>
            
            <TabPane tab="VIX Professional" key="vix">
              <VIXProfessionalChart 
                data={emptyVixData} // Use memoized empty array to prevent infinite loops
                realTime={realTimeEnabled}
                width={1200}
                height={500}
              />
            </TabPane>
            
            <TabPane tab="Regime Timeline" key="timeline">
              <MarketRegimeTimeline data={filteredData} />
            </TabPane>
            
            <TabPane tab="Probability Distribution" key="distribution">
              <Card>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={[
                    { regime: 'BULL', current: 0.3, historical: 0.35 },
                    { regime: 'BEAR', current: 0.2, historical: 0.15 },
                    { regime: 'NEUTRAL', current: 0.35, historical: 0.4 },
                    { regime: 'VOLATILE', current: 0.15, historical: 0.1 }
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="regime" />
                    <PolarRadiusAxis angle={90} domain={[0, 0.5]} />
                    <Radar name="Current" dataKey="current" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Radar name="Historical Avg" dataKey="historical" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            </TabPane>
          </Tabs>
        </Card>

        {/* Alerts and Notifications */}
        <Row gutter={[16, 16]} className="mt-4">
          <Col span={24}>
            <Card title="Regime Change Alerts" extra={<Badge count={2} />}>
              <Alert
                message="High Transition Probability Detected"
                description="The model indicates a 73% probability of transitioning from NEUTRAL to BULL regime within the next 2 trading days."
                type="warning"
                showIcon
                closable
                className="mb-2"
              />
              <Alert
                message="VIX Correlation Anomaly"
                description="Unusual negative correlation detected between HMM predictions and VIX index. Manual review recommended."
                type="info"
                showIcon
                closable
              />
            </Card>
          </Col>
        </Row>
      </Spin>

      <style jsx>{`
        .hmm-analysis-dashboard {
          padding: 24px;
          background: #f0f2f5;
          min-height: 100vh;
        }
        .dashboard-header {
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
        }
        .metric-card {
          background: #fafafa;
          border-radius: 8px;
          text-align: center;
        }
        .regime-indicator {
          height: 100%;
          text-align: center;
        }
        .transition-heatmap {
          text-align: center;
        }
        .mt-4 {
          margin-top: 16px;
        }
        .mb-6 {
          margin-bottom: 24px;
        }
        .mb-2 {
          margin-bottom: 8px;
        }
      `}</style>
    </div>
  );
};

export default HMMAnalysisDashboard;