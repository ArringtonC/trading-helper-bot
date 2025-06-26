import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Tabs,
  Alert,
  Button,
  Select,
  Switch,
  Statistic,
  Progress,
  Tag,
  Tooltip,
  Space,
  Modal,
  message
} from 'antd';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  ShieldOutlined,
  WarningOutlined,
  SafetyOutlined,
  AlertOutlined,
  DashboardOutlined,
  FireOutlined,
  ReloadOutlined,
  HeartOutlined,
  PauseCircleOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import riskService, { RiskDataPayload } from '../../../shared/services/RiskService';
import { 
  generateRiskSummary, 
  analyzeLeverage, 
  calculateKelly,
  simulateLossSequence,
  formatPercentage,
  formatCurrency
} from '../../../shared/utils/riskCalculations';
import { NormalizedTradeData } from '../../../types/trade';
import StressTracker from '../../psychology/components/StressTracker';
import EmotionalStateIndicator from '../../psychology/components/EmotionalStateIndicator';
import { EmotionalState, PanicDetectionResult } from '../../psychology/types/psychology';

const { TabPane } = Tabs;

interface RiskDashboardProps {
  trades?: NormalizedTradeData[];
  accountSize?: number;
  currentPositions?: any[];
  className?: string;
}

interface PTJRiskMetrics {
  maxLoss: number;
  maxGain: number;
  riskReward: number;
  riskOfCapital: number;
  passesPTJRule: boolean;
  adjustedSize: number;
}

interface RiskAlerts {
  critical: string[];
  warnings: string[];
  info: string[];
}

const RiskDashboard: React.FC<RiskDashboardProps> = ({
  trades = [],
  accountSize = 100000,
  currentPositions = [],
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [realTimeRisk, setRealTimeRisk] = useState<RiskDataPayload | null>(null);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlerts>({ critical: [], warnings: [], info: [] });
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [positionSize, setPositionSize] = useState(2); // Default 2% position size
  const [totalExposure, setTotalExposure] = useState(100); // Default 100% exposure
  
  // Sample win rate and payoff ratio for calculations
  const [winRate, setWinRate] = useState(0.65); // 65% win rate
  const [payoffRatio, setPayoffRatio] = useState(2.5); // 2.5:1 payoff ratio

  // Psychology state
  const [currentEmotionalState, setCurrentEmotionalState] = useState<EmotionalState>({
    current: 'FOCUSED',
    stressLevel: 4,
    confidence: 7,
    timestamp: new Date()
  });
  const [tradingBlocked, setTradingBlocked] = useState(false);
  const [breatherModeActive, setBreatherModeActive] = useState(false);
  const [consecutiveLosses, setConsecutiveLosses] = useState(0);
  const [panicDetection, setPanicDetection] = useState<PanicDetectionResult>({
    isPanicking: false,
    riskLevel: 'LOW',
    triggers: [],
    recommendations: [],
    shouldBlockTrading: false
  });

  useEffect(() => {
    // Connect to risk service for real-time data
    riskService.connect();
    
    const unsubscribe = riskService.onRiskData((data) => {
      setRealTimeRisk(data);
      evaluateRiskAlerts(data);
    });

    return () => {
      unsubscribe();
      riskService.disconnect();
    };
  }, []);

  useEffect(() => {
    // Recalculate alerts when position size or exposure changes
    evaluateRiskAlerts(realTimeRisk);
    evaluatePanicDetection();
  }, [positionSize, totalExposure, winRate, payoffRatio, currentEmotionalState, consecutiveLosses]);

  // Anti-panic detection and prevention
  const evaluatePanicDetection = () => {
    const triggers: any[] = [];
    let riskLevel: PanicDetectionResult['riskLevel'] = 'LOW';
    let shouldBlockTrading = false;

    // High stress detection
    if (currentEmotionalState.stressLevel > 8) {
      triggers.push({
        type: 'HIGH_STRESS',
        severity: 'CRITICAL',
        description: `Critical stress level: ${currentEmotionalState.stressLevel}/10`,
        value: currentEmotionalState.stressLevel,
        threshold: 8
      });
      riskLevel = 'CRITICAL';
      shouldBlockTrading = true;
    } else if (currentEmotionalState.stressLevel > 6) {
      triggers.push({
        type: 'HIGH_STRESS',
        severity: 'WARNING',
        description: `Elevated stress level: ${currentEmotionalState.stressLevel}/10`,
        value: currentEmotionalState.stressLevel,
        threshold: 6
      });
      riskLevel = riskLevel === 'LOW' ? 'MEDIUM' : riskLevel;
    }

    // Consecutive losses detection
    if (consecutiveLosses >= 3) {
      triggers.push({
        type: 'CONSECUTIVE_LOSSES',
        severity: 'CRITICAL',
        description: `${consecutiveLosses} consecutive losses detected`,
        value: consecutiveLosses,
        threshold: 3
      });
      riskLevel = 'CRITICAL';
      shouldBlockTrading = true;
    } else if (consecutiveLosses >= 2) {
      triggers.push({
        type: 'CONSECUTIVE_LOSSES',
        severity: 'WARNING',
        description: `${consecutiveLosses} consecutive losses - risk of revenge trading`,
        value: consecutiveLosses,
        threshold: 2
      });
      riskLevel = riskLevel === 'LOW' ? 'HIGH' : riskLevel;
    }

    // Emotional state detection
    if (currentEmotionalState.current === 'PANICKED') {
      triggers.push({
        type: 'PANIC_STATE',
        severity: 'CRITICAL',
        description: 'Emotional state indicates panic',
        value: 1,
        threshold: 1
      });
      riskLevel = 'CRITICAL';
      shouldBlockTrading = true;
    } else if (['FEARFUL', 'EUPHORIC'].includes(currentEmotionalState.current)) {
      triggers.push({
        type: 'EMOTIONAL_EXTREME',
        severity: 'WARNING',
        description: `Extreme emotional state: ${currentEmotionalState.current}`,
        value: 1,
        threshold: 1
      });
      riskLevel = riskLevel === 'LOW' ? 'HIGH' : riskLevel;
    }

    // Position size escalation detection
    if (positionSize > 5) {
      triggers.push({
        type: 'POSITION_SIZE_ESCALATION',
        severity: positionSize > 10 ? 'CRITICAL' : 'WARNING',
        description: `Position size exceeding safe limits: ${positionSize}%`,
        value: positionSize,
        threshold: 5
      });
      if (positionSize > 10) {
        riskLevel = 'CRITICAL';
        shouldBlockTrading = true;
      } else {
        riskLevel = riskLevel === 'LOW' ? 'HIGH' : riskLevel;
      }
    }

    const recommendations = generatePanicRecommendations(triggers, riskLevel);

    setPanicDetection({
      isPanicking: riskLevel === 'CRITICAL',
      riskLevel,
      triggers,
      recommendations,
      shouldBlockTrading
    });

    // Auto-block trading if conditions are met
    if (shouldBlockTrading && !tradingBlocked) {
      setTradingBlocked(true);
      message.error('Trading temporarily blocked due to high-risk conditions');
    }
  };

  const generatePanicRecommendations = (triggers: any[], riskLevel: string): string[] => {
    const recommendations: string[] = [];

    if (riskLevel === 'CRITICAL') {
      recommendations.push('STOP TRADING IMMEDIATELY');
      recommendations.push('Take a 30-minute break minimum');
      recommendations.push('Consider ending trading session for the day');
    }

    if (triggers.some(t => t.type === 'HIGH_STRESS')) {
      recommendations.push('Reduce position sizes by 50%');
      recommendations.push('Focus only on A+ setups');
      recommendations.push('Consider stress reduction techniques');
    }

    if (triggers.some(t => t.type === 'CONSECUTIVE_LOSSES')) {
      recommendations.push('Review what went wrong with recent trades');
      recommendations.push('Stick to your trading plan strictly');
      recommendations.push('Do not chase losses with larger positions');
    }

    if (triggers.some(t => t.type === 'EMOTIONAL_EXTREME')) {
      recommendations.push('Take time to center yourself emotionally');
      recommendations.push('Avoid impulsive decisions');
      recommendations.push('Consider waiting for emotional equilibrium');
    }

    if (recommendations.length === 0) {
      recommendations.push('Risk levels are within acceptable ranges');
      recommendations.push('Continue with disciplined execution');
    }

    return recommendations;
  };

  const handleStressUpdate = (stressData: EmotionalState) => {
    setCurrentEmotionalState(stressData);
  };

  const handleBreatherModeActivate = () => {
    setBreatherModeActive(true);
    setTradingBlocked(true);
    message.info('Breather Mode activated - 30 minute cooldown period started');
    
    // Auto-disable after 30 minutes
    setTimeout(() => {
      setBreatherModeActive(false);
      Modal.confirm({
        title: 'Breather Mode Complete',
        content: 'Your 30-minute cooldown is complete. Do you feel ready to resume trading?',
        okText: 'Resume Trading',
        cancelText: 'Extend Break',
        onOk: () => {
          setTradingBlocked(false);
          message.success('Trading resumed');
        },
        onCancel: () => {
          message.info('Break extended - manually resume when ready');
        }
      });
    }, 30 * 60 * 1000); // 30 minutes
  };

  const handleEmergencyStop = () => {
    setTradingBlocked(true);
    setConsecutiveLosses(0);
    message.error('Emergency stop activated - all trading disabled');
  };

  const evaluateRiskAlerts = (riskData: RiskDataPayload | null) => {
    const critical: string[] = [];
    const warnings: string[] = [];
    const info: string[] = [];

    // Position size risk alerts
    if (positionSize > 10) {
      critical.push(`Position size of ${positionSize}% exceeds safe limits`);
    } else if (positionSize > 5) {
      warnings.push(`Position size of ${positionSize}% requires careful monitoring`);
    }

    // Total exposure alerts
    const leverageAnalysis = analyzeLeverage(totalExposure);
    if (leverageAnalysis.liquidationRisk === 'extreme') {
      critical.push(`Extreme leverage detected: ${leverageAnalysis.leverage}x`);
    } else if (leverageAnalysis.liquidationRisk === 'high') {
      warnings.push(`High leverage: ${leverageAnalysis.leverage}x - consider reducing exposure`);
    }

    // PTJ Rule violation
    const ptjMetrics = calculatePTJRiskMetrics();
    if (!ptjMetrics.passesPTJRule) {
      warnings.push('Trade violates PTJ 5:1 rule - risk/reward ratio insufficient');
    }

    // Kelly Criterion analysis
    const kelly = calculateKelly(winRate, payoffRatio);
    if (!kelly.isPositive) {
      critical.push('Strategy appears unprofitable based on current metrics');
    } else if (kelly.riskLevel === 'dangerous') {
      warnings.push('Kelly Criterion suggests high risk - reduce position size');
    }

    // Real-time Greeks alerts (if available)
    if (riskData) {
      if (Math.abs(riskData.delta) > 0.8) {
        warnings.push(`High delta exposure: ${riskData.delta.toFixed(2)}`);
      }
      if (riskData.theta < -50) {
        warnings.push(`High time decay: ${riskData.theta.toFixed(2)} per day`);
      }
      if (riskData.vega > 300) {
        warnings.push(`High volatility risk: ${riskData.vega.toFixed(0)}`);
      }
    }

    // Consecutive loss simulation
    const lossSimulation = simulateLossSequence(positionSize, 5, 100);
    if (lossSimulation.accountLossPercent > 25) {
      warnings.push(`5 consecutive losses could cost ${lossSimulation.accountLossPercent.toFixed(1)}% of account`);
    }

    // Good practices info
    if (positionSize <= 2 && totalExposure <= 100 && kelly.isPositive) {
      info.push('Risk management parameters within safe ranges');
    }

    setRiskAlerts({ critical, warnings, info });
  };

  const calculatePTJRiskMetrics = (): PTJRiskMetrics => {
    const entryPrice = 100; // Mock entry price
    const stopPrice = 95;   // Mock stop price
    const targetPrice = 120; // Mock target price
    const positionValue = (positionSize / 100) * accountSize;
    
    const maxLoss = Math.abs(entryPrice - stopPrice) * (positionValue / entryPrice);
    const maxGain = Math.abs(targetPrice - entryPrice) * (positionValue / entryPrice);
    const riskReward = maxGain / maxLoss;
    const riskOfCapital = maxLoss / accountSize;
    
    // PTJ's 5:1 rule - never risk more than 1% to make less than 5%
    const passesPTJRule = riskReward >= 5 && riskOfCapital <= 0.01;
    
    const adjustedSize = passesPTJRule ? positionSize : 
      Math.min(positionSize, (accountSize * 0.01) / Math.abs(entryPrice - stopPrice) * entryPrice / accountSize * 100);

    return {
      maxLoss,
      maxGain,
      riskReward,
      riskOfCapital,
      passesPTJRule,
      adjustedSize
    };
  };

  const refreshRiskData = () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      evaluateRiskAlerts(realTimeRisk);
      setRefreshing(false);
    }, 1000);
  };

  const getRiskScoreColor = (score: number) => {
    if (score <= 30) return '#52c41a'; // Green
    if (score <= 60) return '#fa8c16'; // Orange
    return '#ff4d4f'; // Red
  };

  const calculateOverallRiskScore = () => {
    let score = 0;
    
    // Position size factor (0-30 points)
    score += Math.min(30, positionSize * 3);
    
    // Leverage factor (0-25 points)
    const leverageRisk = analyzeLeverage(totalExposure);
    if (leverageRisk.liquidationRisk === 'extreme') score += 25;
    else if (leverageRisk.liquidationRisk === 'high') score += 20;
    else if (leverageRisk.liquidationRisk === 'medium') score += 10;
    else score += 5;
    
    // Kelly factor (0-20 points)
    const kelly = calculateKelly(winRate, payoffRatio);
    if (!kelly.isPositive) score += 20;
    else if (kelly.riskLevel === 'dangerous') score += 15;
    else if (kelly.riskLevel === 'aggressive') score += 10;
    else score += 5;
    
    // PTJ rule factor (0-15 points)
    const ptj = calculatePTJRiskMetrics();
    if (!ptj.passesPTJRule) score += 15;
    else score += 5;
    
    // Alert factor (0-10 points)
    score += riskAlerts.critical.length * 5 + riskAlerts.warnings.length * 2;
    
    return Math.min(100, score);
  };

  const riskScore = calculateOverallRiskScore();
  const ptjMetrics = calculatePTJRiskMetrics();
  const kellyMetrics = calculateKelly(winRate, payoffRatio);
  const leverageMetrics = analyzeLeverage(totalExposure);

  // Sample data for charts
  const riskTrendData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    riskScore: 40 + Math.sin(i * 0.5) * 20 + Math.random() * 10,
    exposure: 80 + Math.sin(i * 0.3) * 15 + Math.random() * 10,
    volatility: 25 + Math.cos(i * 0.4) * 10 + Math.random() * 5
  }));

  const riskBreakdownData = [
    { category: 'Position Size', current: positionSize * 10, safe: 20, fill: positionSize > 5 ? '#ff4d4f' : '#52c41a' },
    { category: 'Leverage', current: leverageMetrics.leverage * 20, safe: 20, fill: leverageMetrics.liquidationRisk === 'high' || leverageMetrics.liquidationRisk === 'extreme' ? '#ff4d4f' : '#52c41a' },
    { category: 'Kelly Risk', current: Math.abs(kellyMetrics.kellyFraction), safe: 10, fill: kellyMetrics.riskLevel === 'dangerous' ? '#ff4d4f' : '#52c41a' },
    { category: 'Greeks', current: realTimeRisk ? Math.abs(realTimeRisk.delta) * 100 : 30, safe: 50, fill: '#1890ff' }
  ];

  return (
    <Card 
      className={`risk-dashboard ${className}`}
      title={
        <div className="flex justify-between items-center">
          <span>🛡️ Risk Management Dashboard</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm">Alerts:</span>
            <Switch 
              checked={alertsEnabled} 
              onChange={setAlertsEnabled}
              size="small"
            />
            <Button 
              type="primary" 
              icon={<ReloadOutlined />} 
              onClick={refreshRiskData}
              loading={refreshing}
              size="small"
            >
              Refresh
            </Button>
          </div>
        </div>
      }
    >
      {/* Critical Alerts */}
      {alertsEnabled && (riskAlerts.critical.length > 0 || riskAlerts.warnings.length > 0) && (
        <Row gutter={[16, 16]} className="mb-6">
          {riskAlerts.critical.length > 0 && (
            <Col span={24}>
              <Alert
                message="Critical Risk Alert"
                description={
                  <ul>
                    {riskAlerts.critical.map((alert, index) => (
                      <li key={index}>{alert}</li>
                    ))}
                  </ul>
                }
                type="error"
                showIcon
                icon={<AlertOutlined />}
                closable
              />
            </Col>
          )}
          {riskAlerts.warnings.length > 0 && (
            <Col span={24}>
              <Alert
                message="Risk Warnings"
                description={
                  <ul>
                    {riskAlerts.warnings.map((alert, index) => (
                      <li key={index}>{alert}</li>
                    ))}
                  </ul>
                }
                type="warning"
                showIcon
                icon={<WarningOutlined />}
                closable
              />
            </Col>
          )}
        </Row>
      )}

      {/* Risk Score Overview */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={6}>
          <Card size="small" className="text-center">
            <Statistic
              title="Overall Risk Score"
              value={riskScore}
              suffix="/ 100"
              valueStyle={{ color: getRiskScoreColor(riskScore) }}
              prefix={<ShieldOutlined />}
            />
            <Progress
              percent={riskScore}
              strokeColor={getRiskScoreColor(riskScore)}
              showInfo={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" className="text-center">
            <Statistic
              title="PTJ Rule"
              value={ptjMetrics.passesPTJRule ? "PASS" : "FAIL"}
              valueStyle={{ color: ptjMetrics.passesPTJRule ? '#52c41a' : '#ff4d4f' }}
              prefix={ptjMetrics.passesPTJRule ? <SafetyOutlined /> : <WarningOutlined />}
            />
            <div className="text-xs text-gray-600 mt-1">
              R:R {ptjMetrics.riskReward.toFixed(1)}:1
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" className="text-center">
            <Statistic
              title="Position Risk"
              value={ptjMetrics.riskOfCapital * 100}
              precision={2}
              suffix="%"
              valueStyle={{ 
                color: ptjMetrics.riskOfCapital > 0.02 ? '#ff4d4f' : 
                       ptjMetrics.riskOfCapital > 0.01 ? '#fa8c16' : '#52c41a' 
              }}
              prefix={<DashboardOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" className="text-center">
            <Statistic
              title="Total Exposure"
              value={totalExposure}
              suffix="%"
              valueStyle={{ 
                color: leverageMetrics.liquidationRisk === 'extreme' ? '#ff4d4f' :
                       leverageMetrics.liquidationRisk === 'high' ? '#fa8c16' : '#52c41a'
              }}
              prefix={<FireOutlined />}
            />
            <Tag 
              color={
                leverageMetrics.liquidationRisk === 'extreme' ? 'red' :
                leverageMetrics.liquidationRisk === 'high' ? 'orange' : 
                leverageMetrics.liquidationRisk === 'medium' ? 'blue' : 'green'
              }
              size="small"
            >
              {leverageMetrics.liquidationRisk.toUpperCase()}
            </Tag>
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={<span><HeartOutlined />Psychology</span>} key="psychology">
          <Row gutter={[16, 16]}>
            {/* Emotional State Monitor */}
            <Col span={24}>
              <EmotionalStateIndicator
                currentState={currentEmotionalState}
                panicDetection={panicDetection}
                onBreatherModeActivate={handleBreatherModeActivate}
                onEmergencyStop={handleEmergencyStop}
                tradingEnabled={!tradingBlocked}
              />
            </Col>

            {/* Stress Tracker */}
            <Col span={24}>
              <StressTracker
                onStressUpdate={handleStressUpdate}
                currentStress={currentEmotionalState.stressLevel}
              />
            </Col>

            {/* Trading Controls */}
            <Col span={24}>
              <Card title="🎮 Trading Control Panel" size="small">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Button
                      type={tradingBlocked ? 'default' : 'primary'}
                      danger={tradingBlocked}
                      icon={tradingBlocked ? <PauseCircleOutlined /> : <ThunderboltOutlined />}
                      onClick={() => {
                        if (tradingBlocked) {
                          Modal.confirm({
                            title: 'Resume Trading?',
                            content: 'Are you sure you want to resume trading? Make sure you\'re in a good emotional state.',
                            onOk: () => {
                              setTradingBlocked(false);
                              message.success('Trading resumed');
                            }
                          });
                        } else {
                          setTradingBlocked(true);
                          message.info('Trading paused');
                        }
                      }}
                      block
                    >
                      {tradingBlocked ? 'Resume Trading' : 'Pause Trading'}
                    </Button>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Button
                      type="default"
                      icon={<HeartOutlined />}
                      onClick={() => {
                        setConsecutiveLosses(prev => prev + 1);
                        message.info(`Consecutive losses: ${consecutiveLosses + 1}`);
                      }}
                      block
                    >
                      Simulate Loss (Test)
                    </Button>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Button
                      type="default"
                      onClick={() => {
                        setConsecutiveLosses(0);
                        setCurrentEmotionalState(prev => ({
                          ...prev,
                          current: 'FOCUSED',
                          stressLevel: 4,
                          timestamp: new Date()
                        }));
                        message.success('Psychology state reset');
                      }}
                      block
                    >
                      Reset State
                    </Button>
                  </Col>
                </Row>

                {breatherModeActive && (
                  <Alert
                    message="Breather Mode Active"
                    description="Take this time to relax and reset. Trading will be re-enabled in 30 minutes."
                    type="info"
                    showIcon
                    icon={<PauseCircleOutlined />}
                    style={{ marginTop: 16 }}
                  />
                )}

                {tradingBlocked && !breatherModeActive && (
                  <Alert
                    message="Trading Blocked"
                    description="Trading is currently disabled due to risk conditions. Review your emotional state before resuming."
                    type="warning"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                )}
              </Card>
            </Col>
          </Row>
        </TabPane>
        
        <TabPane tab={<span><DashboardOutlined />Overview</span>} key="overview">
          <Row gutter={[16, 16]}>
            {/* Risk Breakdown Chart */}
            <Col xs={24} lg={12}>
              <Card size="small" title="📊 Risk Component Breakdown">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={riskBreakdownData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <RechartsTooltip 
                      formatter={(value, name) => [
                        `${value}`,
                        name === 'current' ? 'Current Level' : 'Safe Level'
                      ]}
                    />
                    <Bar dataKey="current" name="Current Level">
                      {riskBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                    <Bar dataKey="safe" fill="#e6f7ff" stroke="#1890ff" name="Safe Level" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            {/* Real-time Greeks */}
            <Col xs={24} lg={12}>
              <Card size="small" title="⚡ Real-time Greeks">
                {realTimeRisk ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold" style={{ color: Math.abs(realTimeRisk.delta) > 0.5 ? '#ff4d4f' : '#52c41a' }}>
                          {realTimeRisk.delta.toFixed(3)}
                        </div>
                        <div className="text-sm text-gray-600">Delta</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold" style={{ color: realTimeRisk.theta < -30 ? '#ff4d4f' : '#52c41a' }}>
                          {realTimeRisk.theta.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">Theta</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold" style={{ color: realTimeRisk.gamma > 0.05 ? '#ff4d4f' : '#52c41a' }}>
                          {realTimeRisk.gamma.toFixed(3)}
                        </div>
                        <div className="text-sm text-gray-600">Gamma</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold" style={{ color: realTimeRisk.vega > 200 ? '#ff4d4f' : '#52c41a' }}>
                          {realTimeRisk.vega.toFixed(0)}
                        </div>
                        <div className="text-sm text-gray-600">Vega</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      Last updated: {new Date(realTimeRisk.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Connecting to real-time risk data...
                  </div>
                )}
              </Card>
            </Col>

            {/* 24-Hour Risk Trend */}
            <Col span={24}>
              <Card size="small" title="📈 24-Hour Risk Trend">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={riskTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" tickFormatter={(hour) => `${hour}:00`} />
                    <YAxis />
                    <RechartsTooltip 
                      labelFormatter={(hour) => `Time: ${hour}:00`}
                      formatter={(value, name) => [
                        `${value.toFixed(1)}`,
                        name === 'riskScore' ? 'Risk Score' :
                        name === 'exposure' ? 'Exposure %' : 'Volatility %'
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="riskScore"
                      stackId="1"
                      stroke="#ff4d4f"
                      fill="#ff4d4f"
                      fillOpacity={0.3}
                      name="Risk Score"
                    />
                    <Area
                      type="monotone"
                      dataKey="exposure"
                      stackId="2"
                      stroke="#1890ff"
                      fill="#1890ff"
                      fillOpacity={0.3}
                      name="Exposure %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab={<span><ShieldOutlined />PTJ Rules</span>} key="ptj">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card size="small" title="🎯 Paul Tudor Jones Risk Rules">
                <div className="space-y-4">
                  <Alert
                    message="PTJ 5:1 Rule"
                    description="Never risk more than 1% to make less than 5%"
                    type={ptjMetrics.passesPTJRule ? 'success' : 'error'}
                    showIcon
                    icon={ptjMetrics.passesPTJRule ? <SafetyOutlined /> : <WarningOutlined />}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Statistic
                      title="Max Risk"
                      value={ptjMetrics.maxLoss}
                      formatter={(val) => formatCurrency(val as number)}
                      valueStyle={{ color: '#ff4d4f' }}
                    />
                    <Statistic
                      title="Max Gain"
                      value={ptjMetrics.maxGain}
                      formatter={(val) => formatCurrency(val as number)}
                      valueStyle={{ color: '#52c41a' }}
                    />
                    <Statistic
                      title="Risk:Reward"
                      value={ptjMetrics.riskReward}
                      precision={1}
                      suffix=":1"
                      valueStyle={{ 
                        color: ptjMetrics.riskReward >= 5 ? '#52c41a' : '#ff4d4f' 
                      }}
                    />
                    <Statistic
                      title="Capital Risk"
                      value={ptjMetrics.riskOfCapital * 100}
                      precision={2}
                      suffix="%"
                      valueStyle={{ 
                        color: ptjMetrics.riskOfCapital <= 0.01 ? '#52c41a' : '#ff4d4f' 
                      }}
                    />
                  </div>
                  
                  {!ptjMetrics.passesPTJRule && (
                    <Alert
                      message="PTJ Rule Violation"
                      description={`Suggested position size adjustment: ${ptjMetrics.adjustedSize.toFixed(1)}%`}
                      type="warning"
                      showIcon
                    />
                  )}
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card size="small" title="⚙️ Risk Parameters">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Position Size (%)</label>
                    <Select
                      value={positionSize}
                      onChange={setPositionSize}
                      style={{ width: '100%' }}
                      options={[
                        { value: 0.5, label: '0.5%' },
                        { value: 1, label: '1%' },
                        { value: 2, label: '2%' },
                        { value: 3, label: '3%' },
                        { value: 5, label: '5%' },
                        { value: 10, label: '10%' },
                        { value: 15, label: '15%' },
                        { value: 20, label: '20%' }
                      ]}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Total Exposure (%)</label>
                    <Select
                      value={totalExposure}
                      onChange={setTotalExposure}
                      style={{ width: '100%' }}
                      options={[
                        { value: 50, label: '50%' },
                        { value: 75, label: '75%' },
                        { value: 100, label: '100%' },
                        { value: 125, label: '125%' },
                        { value: 150, label: '150%' },
                        { value: 200, label: '200%' },
                        { value: 300, label: '300%' }
                      ]}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Win Rate</label>
                    <Select
                      value={winRate}
                      onChange={setWinRate}
                      style={{ width: '100%' }}
                      options={[
                        { value: 0.40, label: '40%' },
                        { value: 0.50, label: '50%' },
                        { value: 0.60, label: '60%' },
                        { value: 0.65, label: '65%' },
                        { value: 0.70, label: '70%' },
                        { value: 0.75, label: '75%' },
                        { value: 0.80, label: '80%' }
                      ]}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Payoff Ratio</label>
                    <Select
                      value={payoffRatio}
                      onChange={setPayoffRatio}
                      style={{ width: '100%' }}
                      options={[
                        { value: 1.0, label: '1:1' },
                        { value: 1.5, label: '1.5:1' },
                        { value: 2.0, label: '2:1' },
                        { value: 2.5, label: '2.5:1' },
                        { value: 3.0, label: '3:1' },
                        { value: 4.0, label: '4:1' },
                        { value: 5.0, label: '5:1' }
                      ]}
                    />
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab={<span><AlertOutlined />Alerts</span>} key="alerts">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card size="small" title="🔔 Risk Alert System">
                {riskAlerts.critical.length === 0 && riskAlerts.warnings.length === 0 && riskAlerts.info.length === 0 ? (
                  <Alert
                    message="All Systems Green"
                    description="No risk alerts detected. Risk parameters are within safe ranges."
                    type="success"
                    showIcon
                    icon={<SafetyOutlined />}
                  />
                ) : (
                  <div className="space-y-4">
                    {riskAlerts.critical.map((alert, index) => (
                      <Alert
                        key={`critical-${index}`}
                        message="Critical Risk"
                        description={alert}
                        type="error"
                        showIcon
                        icon={<AlertOutlined />}
                      />
                    ))}
                    
                    {riskAlerts.warnings.map((alert, index) => (
                      <Alert
                        key={`warning-${index}`}
                        message="Risk Warning"
                        description={alert}
                        type="warning"
                        showIcon
                        icon={<WarningOutlined />}
                      />
                    ))}
                    
                    {riskAlerts.info.map((alert, index) => (
                      <Alert
                        key={`info-${index}`}
                        message="Risk Info"
                        description={alert}
                        type="info"
                        showIcon
                      />
                    ))}
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default RiskDashboard;
export type { RiskDashboardProps };