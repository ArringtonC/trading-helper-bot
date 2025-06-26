import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Badge,
  Button,
  Space,
  Typography,
  Alert,
  Divider,
  Drawer,
  Timeline,
  Collapse,
  Progress
} from 'antd';
import {
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CalendarOutlined,
  BellOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  BookOutlined,
  TrophyOutlined,
  ArrowUpOutlined
} from '@ant-design/icons';
import { SP500PriceData } from '../../services/DatabaseService';
import { VolatilityIndex, RiskManagement } from '../../services/TradingSignalService';

const { Title, Text } = Typography;
const { Panel } = Collapse;

// Types for Professional Dashboard
export interface ProfessionalAlert {
  id: string;
  type: 'SIGNAL_CHANGE' | 'HIGH_IMPACT_NEWS' | 'DATA_QUALITY' | 'RISK_WARNING' | 'FED_MEETING';
  title: string;
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  actionRequired?: boolean;
}

export interface MarketSignalSummary {
  signal: 'BUY' | 'SELL' | 'HOLD' | 'REDUCE' | 'WAIT';
  confidence: number;
  reasoning: string;
  timeframe: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AIAnalysisSummary {
  averageRelevance: number;
  highImpactEvents: number;
  totalEventsAnalyzed: number;
  confidenceScore: number;
  lastUpdated: string;
}

export interface DataQualitySummary {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  compliance: boolean;
  lastValidation: string;
}

export interface PerformanceMetrics {
  signalAccuracy: number;
  recentSignalCount: number;
  aiClassificationAccuracy: number;
  eventsProcessed: number;
  platformUtilization: number;
  featuresUsed: number;
}

// Professional Trading Header Component
export interface ProfessionalTradingHeaderProps {
  marketSignal: MarketSignalSummary;
  aiAnalysis: AIAnalysisSummary;
  dataQuality: DataQualitySummary;
  alerts: ProfessionalAlert[];
  isLive: boolean;
}

export const ProfessionalTradingHeader: React.FC<ProfessionalTradingHeaderProps> = ({
  marketSignal,
  aiAnalysis,
  dataQuality,
  alerts,
  isLive
}) => {
  const getSignalColor = (signal: string): string => {
    switch (signal) {
      case 'STRONG_BUY': return '#52c41a';
      case 'BUY': return '#73d13d';
      case 'HOLD': return '#faad14';
      case 'SELL': return '#ff7875';
      case 'STRONG_SELL': return '#ff4d4f';
      default: return '#8c8c8c';
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return '#52c41a';
    if (confidence >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const getQualityColor = (score: number): string => {
    if (score >= 85) return '#52c41a';
    if (score >= 70) return '#faad14';
    return '#ff4d4f';
  };

  return (
    <div className="professional-trading-header" style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '16px 24px',
      borderRadius: '8px',
      marginBottom: '24px',
      color: 'white'
    }}>
      <Row gutter={24} align="middle">
        <Col xs={24} sm={24} md={6} lg={6}>
          <div className="platform-branding">
            <Title level={3} style={{ margin: 0, color: 'white' }}>
              📊 S&P 500 Professional
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
              Institutional Trading Intelligence
            </Text>
            <div style={{ marginTop: 4 }}>
              <Badge 
                status={isLive ? 'processing' : 'default'} 
                text={isLive ? 'LIVE MARKET' : 'MARKET CLOSED'}
                style={{ color: 'white' }}
              />
            </div>
          </div>
        </Col>
        
        <Col xs={24} sm={24} md={12} lg={12}>
          <div className="live-market-status">
            <Row gutter={16}>
              <Col xs={8} sm={8}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Current Signal</span>}
                  value={marketSignal.signal}
                  valueStyle={{ 
                    color: getSignalColor(marketSignal.signal),
                    fontSize: '20px',
                    fontWeight: 'bold'
                  }}
                  suffix={
                    <div style={{ marginTop: 4 }}>
                      <Badge 
                        count={`${marketSignal.confidence}% Confidence`}
                        style={{ 
                          backgroundColor: getConfidenceColor(marketSignal.confidence),
                          fontSize: '10px'
                        }}
                      />
                    </div>
                  }
                />
              </Col>
              
              <Col xs={8} sm={8}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>AI Analysis Score</span>}
                  value={aiAnalysis.averageRelevance}
                  precision={1}
                  suffix="/ 10"
                  valueStyle={{ color: '#52c41a', fontSize: '18px' }}
                />
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>
                  {aiAnalysis.totalEventsAnalyzed} events analyzed
                </Text>
              </Col>
              
              <Col xs={8} sm={8}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Data Quality</span>}
                  value={dataQuality.grade}
                  valueStyle={{ 
                    color: getQualityColor(dataQuality.score),
                    fontSize: '18px'
                  }}
                  suffix={<span style={{ fontSize: '12px' }}>({dataQuality.score}/100)</span>}
                />
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>
                  {dataQuality.compliance ? '✅ Compliant' : '⚠️ Review Required'}
                </Text>
              </Col>
            </Row>
          </div>
        </Col>
        
        <Col xs={24} sm={24} md={6} lg={6}>
          <div className="professional-alerts" style={{ textAlign: 'right' }}>
            <ProfessionalAlertCenter alerts={alerts} />
          </div>
        </Col>
      </Row>
    </div>
  );
};

// Professional Alert Center Component
export interface ProfessionalAlertCenterProps {
  alerts: ProfessionalAlert[];
}

export const ProfessionalAlertCenter: React.FC<ProfessionalAlertCenterProps> = ({ alerts }) => {
  const [alertsVisible, setAlertsVisible] = useState(false);
  
  const alertTypes = {
    SIGNAL_CHANGE: { color: '#1890ff', icon: <ArrowUpOutlined /> },
    HIGH_IMPACT_NEWS: { color: '#faad14', icon: <ExclamationCircleOutlined /> },
    DATA_QUALITY: { color: '#52c41a', icon: <CheckCircleOutlined /> },
    RISK_WARNING: { color: '#ff4d4f', icon: <WarningOutlined /> },
    FED_MEETING: { color: '#722ed1', icon: <CalendarOutlined /> }
  };

  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical').length;
  const highAlerts = alerts.filter(alert => alert.severity === 'high').length;

  return (
    <div className="professional-alert-center">
      <Badge count={alerts.length} size="small" style={{ backgroundColor: criticalAlerts > 0 ? '#ff4d4f' : '#52c41a' }}>
        <Button
          type="primary"
          ghost
          icon={<BellOutlined />}
          onClick={() => setAlertsVisible(true)}
          className="alerts-button"
          style={{ color: 'white', borderColor: 'white' }}
        >
          Professional Alerts
        </Button>
      </Badge>

      <Drawer
        title={
          <Space>
            <ThunderboltOutlined />
            <span>Professional Trading Alerts</span>
          </Space>
        }
        placement="right"
        onClose={() => setAlertsVisible(false)}
        open={alertsVisible}
        width={450}
      >
        <div style={{ marginBottom: 16 }}>
          <Row gutter={8}>
            <Col span={8}>
              <Statistic 
                title="Critical" 
                value={criticalAlerts} 
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<WarningOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title="High Priority" 
                value={highAlerts} 
                valueStyle={{ color: '#faad14' }}
                prefix={<ExclamationCircleOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title="Total Active" 
                value={alerts.length} 
                valueStyle={{ color: '#1890ff' }}
                prefix={<BellOutlined />}
              />
            </Col>
          </Row>
        </div>

        <Timeline>
          {alerts.map((alert, index) => (
            <Timeline.Item
              key={alert.id}
              color={alertTypes[alert.type]?.color}
              dot={alertTypes[alert.type]?.icon}
            >
              <div className="alert-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <Text strong>{alert.title}</Text>
                    <Badge 
                      color={alert.severity === 'critical' ? '#ff4d4f' : alert.severity === 'high' ? '#faad14' : '#52c41a'}
                      text={alert.severity.toUpperCase()}
                      style={{ marginLeft: 8 }}
                    />
                  </div>
                  {alert.actionRequired && (
                    <Button size="small" type="primary">Action Required</Button>
                  )}
                </div>
                <div style={{ marginTop: 4, marginBottom: 8 }}>
                  <Text>{alert.message}</Text>
                </div>
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  {alert.timestamp}
                </Text>
              </div>
            </Timeline.Item>
          ))}
        </Timeline>

        {alerts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: 16 }} />
            <div>
              <Text strong>All Systems Operational</Text>
              <br />
              <Text type="secondary">No active alerts at this time</Text>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

// Professional Risk Dashboard Component
export interface ProfessionalRiskDashboardProps {
  riskMetrics: RiskManagement;
  volatilityIndex: VolatilityIndex;
  marketData: SP500PriceData[];
  fedMeeting: {
    nextMeeting: string;
    daysAway: number;
    expectedAction: string;
  };
}

export const ProfessionalRiskDashboard: React.FC<ProfessionalRiskDashboardProps> = ({
  riskMetrics,
  volatilityIndex,
  marketData,
  fedMeeting
}) => {
  const getVolatilityColor = (level: string): string => {
    switch (level.toLowerCase()) {
      case 'low': return '#52c41a';
      case 'medium': return '#faad14';
      case 'high': return '#ff7875';
      case 'extreme': return '#ff4d4f';
      default: return '#8c8c8c';
    }
  };

  const getRiskAlertType = (risk: string): 'success' | 'info' | 'warning' | 'error' => {
    switch (risk.toLowerCase()) {
      case 'low': return 'success';
      case 'medium': return 'info';
      case 'high': return 'warning';
      default: return 'error';
    }
  };

  const currentPrice = marketData[marketData.length - 1]?.close || 0;
  const riskAmount = riskMetrics.riskAmount || 0;
  const recommendedShares = riskMetrics.recommendedShares || 0;
  const riskPercent = recommendedShares > 0 ? ((riskAmount / (recommendedShares * currentPrice)) * 100).toFixed(1) : '0.0';

  return (
    <Card 
      title={
        <Space>
          <SafetyOutlined style={{ color: '#1890ff' }} />
          <span>Professional Risk Management</span>
        </Space>
      }
      className="risk-dashboard"
      extra={
        <Button size="small" icon={<SettingOutlined />}>
          Risk Settings
        </Button>
      }
      style={{ marginBottom: 24 }}
    >
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <div className="risk-metric" style={{ textAlign: 'center', padding: '16px' }}>
            <Text type="secondary">Position Size Recommendation</Text>
            <div className="risk-value" style={{ marginTop: 8 }}>
              <Text strong style={{ fontSize: '20px', display: 'block' }}>
                {recommendedShares} shares
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Risk: ${riskAmount.toLocaleString()} ({riskPercent}%)
              </Text>
            </div>
          </div>
        </Col>
        
        <Col xs={24} sm={8}>
          <div className="risk-metric" style={{ textAlign: 'center', padding: '16px' }}>
            <Text type="secondary">Stop-Loss Level</Text>
            <div className="risk-value" style={{ marginTop: 8 }}>
              <Text strong style={{ fontSize: '20px', display: 'block' }}>
                ${riskMetrics.stopLossLevel || 0}
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                ATR-based ({riskMetrics.atrMultiplier || 2}x)
              </Text>
            </div>
          </div>
        </Col>
        
        <Col xs={24} sm={8}>
          <div className="risk-metric" style={{ textAlign: 'center', padding: '16px' }}>
            <Text type="secondary">Volatility Regime</Text>
            <div className="risk-value" style={{ marginTop: 8 }}>
              <Badge 
                color={getVolatilityColor(volatilityIndex.level)}
                text={volatilityIndex.level.toUpperCase()}
                style={{ fontSize: '14px' }}
              />
              <div style={{ marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Next FOMC: {fedMeeting.daysAway} days
                </Text>
              </div>
            </div>
          </div>
        </Col>
      </Row>
      
      <Divider />
      
      <div className="professional-recommendations">
        <Alert
          type={getRiskAlertType(volatilityIndex.level)}
          message={`${volatilityIndex.level.toUpperCase()} Risk Environment Detected`}
          description={`Current volatility: ${(volatilityIndex.value || 0).toFixed(2)}% (${volatilityIndex.percentile || 0}th percentile). Recommended position sizing: ${recommendedShares} shares with stop-loss at $${riskMetrics.stopLossLevel || 0}.`}
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Row gutter={8}>
          <Col span={12}>
            <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#f0f2f5', borderRadius: '4px' }}>
              <Text strong>Risk-Reward Ratio</Text>
              <div style={{ fontSize: '18px', color: '#1890ff', marginTop: 4 }}>
                1:{(riskMetrics.rewardRiskRatio || 0).toFixed(1)}
              </div>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#f0f2f5', borderRadius: '4px' }}>
              <Text strong>Max Portfolio Risk</Text>
              <div style={{ fontSize: '18px', color: '#52c41a', marginTop: 4 }}>
                {riskMetrics.maxRiskPercent || 2}%
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </Card>
  );
};

// Professional Education Panel Component
export interface ProfessionalEducationPanelProps {
  currentSignal: MarketSignalSummary;
  marketConditions: {
    sentiment: string;
    contrarianScore: number;
    compliance: {
      status: 'success' | 'warning' | 'error';
      level: string;
    };
    dataQuality: number;
    analysisConfidence: number;
  };
  historicalContext: {
    successRate: number;
    similarInstances: number;
    averageReturn: number;
    timeToTarget: number;
  };
}

export const ProfessionalEducationPanel: React.FC<ProfessionalEducationPanelProps> = ({
  currentSignal,
  marketConditions,
  historicalContext
}) => {
  return (
    <Card 
      title={
        <Space>
          <BookOutlined style={{ color: '#722ed1' }} />
          <span>Professional Trading Context</span>
        </Space>
      }
      className="education-panel"
      size="small"
      style={{ marginBottom: 16 }}
    >
      <Collapse ghost size="small">
        <Panel header="Why This Signal?" key="signal">
          <div className="educational-content">
            <Text>{currentSignal.reasoning}</Text>
            <div className="historical-context" style={{ marginTop: 12, padding: '8px', backgroundColor: '#f6ffed', borderRadius: '4px' }}>
              <Row gutter={8}>
                <Col span={12}>
                  <Text strong style={{ color: '#52c41a' }}>Success Rate</Text>
                  <div style={{ fontSize: '16px' }}>{historicalContext.successRate}%</div>
                </Col>
                <Col span={12}>
                  <Text strong style={{ color: '#1890ff' }}>Historical Cases</Text>
                  <div style={{ fontSize: '16px' }}>{historicalContext.similarInstances} since 1950</div>
                </Col>
              </Row>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  Average return: {historicalContext.averageReturn}% over {historicalContext.timeToTarget} days
                </Text>
              </div>
            </div>
          </div>
        </Panel>
        
        <Panel header="Market Psychology" key="psychology">
          <div className="psychology-insights">
            <Text>Current market sentiment: <strong>{marketConditions.sentiment}</strong></Text>
            <div className="contrarian-indicators" style={{ marginTop: 8 }}>
              <Text type="secondary">Contrarian Opportunity Score: </Text>
              <Progress 
                percent={marketConditions.contrarianScore * 10} 
                size="small" 
                strokeColor={marketConditions.contrarianScore > 7 ? '#52c41a' : '#faad14'}
                showInfo={false}
              />
              <Text strong style={{ marginLeft: 8 }}>{marketConditions.contrarianScore}/10</Text>
            </div>
            <div style={{ marginTop: 8, fontSize: '11px', color: '#8c8c8c' }}>
              Higher scores indicate potential contrarian opportunities when sentiment is extreme
            </div>
          </div>
        </Panel>
        
        <Panel header="Professional Standards" key="standards">
          <div className="professional-standards">
            <Row gutter={8} align="middle">
              <Col span={12}>
                <Text>Institutional Compliance</Text>
                <div>
                  <Badge 
                    status={marketConditions.compliance.status} 
                    text={marketConditions.compliance.level}
                  />
                </div>
              </Col>
              <Col span={12}>
                <Text>Analysis Quality</Text>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                  {marketConditions.analysisConfidence}%
                </div>
              </Col>
            </Row>
            <div className="standards-details" style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                Data Quality: {marketConditions.dataQuality}% | 
                Analysis Confidence: {marketConditions.analysisConfidence}% |
                Professional Standards: Bloomberg-level
              </Text>
            </div>
          </div>
        </Panel>
      </Collapse>
    </Card>
  );
};

// Professional Performance Tracker Component
export interface ProfessionalPerformanceTrackerProps {
  performanceMetrics: PerformanceMetrics;
}

export const ProfessionalPerformanceTracker: React.FC<ProfessionalPerformanceTrackerProps> = ({
  performanceMetrics
}) => {
  return (
    <Card 
      title={
        <Space>
          <TrophyOutlined style={{ color: '#faad14' }} />
          <span>Professional Performance Metrics</span>
        </Space>
      }
      className="performance-tracker"
      size="small"
    >
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <div style={{ textAlign: 'center', padding: '12px' }}>
            <Statistic
              title="Signal Accuracy"
              value={performanceMetrics.signalAccuracy}
              precision={1}
              suffix="%"
              valueStyle={{ 
                color: performanceMetrics.signalAccuracy > 70 ? '#52c41a' : '#faad14',
                fontSize: '18px'
              }}
            />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Last {performanceMetrics.recentSignalCount} signals
            </Text>
          </div>
        </Col>
        
        <Col xs={24} sm={8}>
          <div style={{ textAlign: 'center', padding: '12px' }}>
            <Statistic
              title="AI Classification"
              value={performanceMetrics.aiClassificationAccuracy}
              precision={1}
              suffix="% accuracy"
              valueStyle={{ color: '#1890ff', fontSize: '18px' }}
            />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {performanceMetrics.eventsProcessed} events analyzed
            </Text>
          </div>
        </Col>
        
        <Col xs={24} sm={8}>
          <div style={{ textAlign: 'center', padding: '12px' }}>
            <Statistic
              title="Platform Utilization"
              value={performanceMetrics.platformUtilization}
              suffix="/ 100"
              valueStyle={{ color: '#722ed1', fontSize: '18px' }}
            />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {performanceMetrics.featuresUsed} professional features used
            </Text>
          </div>
        </Col>
      </Row>
      
      <div style={{ marginTop: 12, padding: '8px', backgroundColor: '#f0f2f5', borderRadius: '4px' }}>
        <Text strong style={{ fontSize: '12px' }}>Performance Benchmark</Text>
        <div style={{ marginTop: 4 }}>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Exceeding institutional benchmarks: Signal accuracy &gt;70%, AI precision &gt;90%, Platform engagement &gt;80%
          </Text>
        </div>
      </div>
    </Card>
  );
}; 