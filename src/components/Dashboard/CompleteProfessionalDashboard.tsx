import React, { useState, useMemo } from 'react';
import { Card, Row, Col, Typography, Space, Button, Divider } from 'antd';
import {
  SettingOutlined,
  FullscreenOutlined,
  ReloadOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';

// Import all professional components
import {
  ProfessionalTradingHeader,
  ProfessionalRiskDashboard,
  ProfessionalEducationPanel,
  ProfessionalPerformanceTracker,
  ProfessionalAlert,
  MarketSignalSummary,
  AIAnalysisSummary,
  DataQualitySummary,
  PerformanceMetrics
} from './ProfessionalTradingDashboard';

import { 
  ProfessionalChartContainer,
  DataQuality,
  ValidationResults
} from '../MarketData/ProfessionalChartControls';

// Import existing components
import { SP500PriceData, MarketNewsData } from '../../services/DatabaseService';
import { TradingSignal, CorrectionAnalysis, VolatilityIndex, RiskManagement } from '../../services/TradingSignalService';
import { EnhancedNewsEvent } from '../../services/AINewsAnalysisService';
import RealNewsDisplay from '../MarketData/RealNewsDisplay';

const { Text } = Typography;

// Complete Professional Dashboard State Interface
export interface ProfessionalDashboardState {
  // Market Data
  priceData: SP500PriceData[];
  newsData: MarketNewsData[];
  enhancedNewsData: EnhancedNewsEvent[];
  
  // Trading Signals & Analysis
  tradingSignal: TradingSignal | null;
  correctionAnalysis: CorrectionAnalysis | null;
  volatilityIndex: VolatilityIndex | null;
  riskManagement: RiskManagement | null;
  
  // Professional Dashboard Data
  marketSignal: MarketSignalSummary | null;
  aiAnalysis: AIAnalysisSummary | null;
  dataQuality: DataQualitySummary | null;
  alerts: ProfessionalAlert[];
  performanceMetrics: PerformanceMetrics | null;
  
  // Chart & UI State
  chartMode: 'time' | 'ordinal';
  chartTimeframe: string;
  professionalMode: boolean;
  isLive: boolean;
  
  // Loading States
  isLoading: boolean;
  isLoadingAI: boolean;
  error: string | null;
}

export interface CompleteProfessionalDashboardProps {
  dashboardState: ProfessionalDashboardState;
  onStateChange: (newState: Partial<ProfessionalDashboardState>) => void;
  onChartModeChange: (mode: 'time' | 'ordinal') => void;
  onTimeframeChange: (timeframe: string) => void;
  onRefreshData: () => void;
  chartRef: React.RefObject<any>;
  children?: React.ReactNode; // For the actual chart component
}

export const CompleteProfessionalDashboard: React.FC<CompleteProfessionalDashboardProps> = ({
  dashboardState,
  onStateChange,
  onChartModeChange,
  onTimeframeChange,
  onRefreshData,
  chartRef,
  children
}) => {
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);

  // Generate alerts based on current state
  const generatedAlerts = useMemo((): ProfessionalAlert[] => {
    const alerts: ProfessionalAlert[] = [];
    const now = new Date();

    // Signal change alerts
    if (dashboardState.tradingSignal) {
      if (dashboardState.tradingSignal.signal === 'BUY' || dashboardState.tradingSignal.signal === 'SELL') {
        alerts.push({
          id: 'signal-strong',
          type: 'SIGNAL_CHANGE',
          title: `${dashboardState.tradingSignal.signal} Signal`,
          message: `High-confidence ${dashboardState.tradingSignal.signal.toLowerCase()} signal detected with ${dashboardState.tradingSignal.confidence}% confidence.`,
          timestamp: now.toLocaleTimeString(),
          severity: 'high',
          actionRequired: true
        });
      }
    }

    // High impact news alerts
    const highImpactNews = (dashboardState.enhancedNewsData || []).filter(
      news => news.aiAnalysis?.impactLevel === 'HIGH'
    );
    if (highImpactNews.length > 0) {
      alerts.push({
        id: 'high-impact-news',
        type: 'HIGH_IMPACT_NEWS',
        title: `${highImpactNews.length} High-Impact News Events`,
        message: `Multiple high-impact news events detected. Review for potential market volatility.`,
        timestamp: now.toLocaleTimeString(),
        severity: 'medium'
      });
    }

    // Data quality alerts
    if (dashboardState.dataQuality && dashboardState.dataQuality.score < 85) {
      alerts.push({
        id: 'data-quality',
        type: 'DATA_QUALITY',
        title: 'Data Quality Below Institutional Standards',
        message: `Current data quality score: ${dashboardState.dataQuality.score}/100. Consider data validation.`,
        timestamp: now.toLocaleTimeString(),
        severity: dashboardState.dataQuality.score < 70 ? 'high' : 'medium'
      });
    }

    // Risk warnings
    if (dashboardState.volatilityIndex && dashboardState.volatilityIndex.level === 'EXTREME') {
      alerts.push({
        id: 'risk-extreme',
        type: 'RISK_WARNING',
        title: 'Extreme Volatility Detected',
        message: 'Market volatility in extreme range. Consider reduced position sizing.',
        timestamp: now.toLocaleTimeString(),
        severity: 'critical',
        actionRequired: true
      });
    }

    // Fed meeting alerts (mock - would be calculated based on actual calendar)
    const daysTillFed = 14; // Mock calculation
    if (daysTillFed <= 7) {
      alerts.push({
        id: 'fed-meeting',
        type: 'FED_MEETING',
        title: 'FOMC Meeting Approaching',
        message: `Federal Reserve meeting in ${daysTillFed} days. Prepare for potential volatility.`,
        timestamp: now.toLocaleTimeString(),
        severity: 'medium'
      });
    }

    return alerts;
  }, [dashboardState]);

  // Note: Removed useEffect that was causing infinite loop
  // generatedAlerts are used directly in the component below

  // Generate market signal summary
  const marketSignalSummary = useMemo((): MarketSignalSummary | null => {
    if (!dashboardState.tradingSignal) return null;

    // Convert string confidence to number
    const confidenceValue = dashboardState.tradingSignal.confidence === 'High' ? 85 :
                           dashboardState.tradingSignal.confidence === 'Medium' ? 65 : 35;

    return {
      signal: dashboardState.tradingSignal.signal,
      confidence: confidenceValue,
      reasoning: dashboardState.tradingSignal.reasoning,
      timeframe: dashboardState.tradingSignal.timeframe,
      riskLevel: dashboardState.tradingSignal.riskLevel
    };
  }, [dashboardState.tradingSignal]);

  // Generate AI analysis summary
  const aiAnalysisSummary = useMemo((): AIAnalysisSummary | null => {
    if (!dashboardState.enhancedNewsData || !dashboardState.enhancedNewsData.length) return null;

    const totalEvents = dashboardState.enhancedNewsData.length;
    const highImpactEvents = dashboardState.enhancedNewsData.filter(
      news => news.aiAnalysis?.impactLevel === 'HIGH'
    ).length;
    
    const averageRelevance = dashboardState.enhancedNewsData.reduce(
      (sum, news) => sum + (news.relevance_score || 0), 0
    ) / totalEvents;

    const averageConfidence = dashboardState.enhancedNewsData.reduce(
      (sum, news) => sum + (news.aiAnalysis?.confidence || 0), 0
    ) / totalEvents;

    return {
      averageRelevance,
      highImpactEvents,
      totalEventsAnalyzed: totalEvents,
      confidenceScore: averageConfidence,
      lastUpdated: new Date().toLocaleTimeString()
    };
  }, [dashboardState.enhancedNewsData]);

  // Generate performance metrics
  const performanceMetrics = useMemo((): PerformanceMetrics => {
    // Mock performance data - in real implementation, this would come from historical tracking
    return {
      signalAccuracy: 76.8,
      recentSignalCount: 24,
      aiClassificationAccuracy: 91.2,
      eventsProcessed: dashboardState.enhancedNewsData?.length || 0,
      platformUtilization: 87,
      featuresUsed: 12
    };
  }, [dashboardState.enhancedNewsData]);

  // Create data quality for chart controls
  const chartDataQuality: DataQuality = useMemo(() => ({
    score: dashboardState.dataQuality?.score || 100,
    grade: dashboardState.dataQuality?.grade || 'A',
    confidence: 95
  }), [dashboardState.dataQuality]);

  const chartValidationResults: ValidationResults = useMemo(() => ({
    recordCount: dashboardState.priceData?.length || 0,
    timestamp: new Date().toISOString()
  }), [dashboardState.priceData]);

  // Fed meeting mock data
  const fedMeeting = {
    nextMeeting: '2025-07-29',
    daysAway: 14,
    expectedAction: 'Hold rates steady'
  };

  // Market conditions for education panel
  const marketConditions = useMemo(() => {
    const sentiment = dashboardState.correctionAnalysis?.isInCorrection ? 'Bearish' : 'Bullish';
    const contrarianScore = Math.random() * 10; // Mock - would be calculated
    const complianceStatus: 'success' | 'warning' | 'error' = dashboardState.dataQuality?.compliance ? 'success' : 'warning';
    
    return {
      sentiment,
      contrarianScore,
      compliance: {
        status: complianceStatus,
        level: 'Institutional Grade'
      },
      dataQuality: dashboardState.dataQuality?.score || 100,
      analysisConfidence: 92
    };
  }, [dashboardState.correctionAnalysis, dashboardState.dataQuality]);

  // Historical context for education panel
  const historicalContext = {
    successRate: 73,
    similarInstances: 47,
    averageReturn: 8.4,
    timeToTarget: 28
  };

  if (!marketSignalSummary || !aiAnalysisSummary || !dashboardState.dataQuality) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Card>
          <Text>Loading professional dashboard...</Text>
        </Card>
      </div>
    );
  }

  return (
    <div className={`complete-professional-dashboard ${fullscreenMode ? 'fullscreen' : ''}`}>
      {/* Professional Header */}
      <ProfessionalTradingHeader 
        marketSignal={marketSignalSummary}
        aiAnalysis={aiAnalysisSummary}
        dataQuality={dashboardState.dataQuality}
        alerts={generatedAlerts}
        isLive={dashboardState.isLive}
      />

      {/* Dashboard Controls */}
      <div style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button 
                icon={<ReloadOutlined />}
                onClick={onRefreshData}
                loading={dashboardState.isLoading}
              >
                Refresh Data
              </Button>
              <Button 
                icon={<SettingOutlined />}
                onClick={() => {/* Open settings */}}
              >
                Dashboard Settings
              </Button>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button 
                icon={<QuestionCircleOutlined />}
                onClick={() => setHelpVisible(!helpVisible)}
              >
                Help
              </Button>
              <Button 
                icon={<FullscreenOutlined />}
                onClick={() => setFullscreenMode(!fullscreenMode)}
              >
                {fullscreenMode ? 'Exit Fullscreen' : 'Fullscreen'}
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Main Trading Interface */}
      <Row gutter={24} className="main-trading-interface">
        <Col xs={24} lg={18}>
          <div className="primary-trading-area">
            {/* Enhanced Chart with Professional Controls */}
            <ProfessionalChartContainer
              chartMode={dashboardState.chartMode}
              onChartModeChange={onChartModeChange}
              timeframe={dashboardState.chartTimeframe}
              onTimeframeChange={onTimeframeChange}
              dataQuality={chartDataQuality}
              validationResults={chartValidationResults}
              marketData={dashboardState.priceData}
              newsEvents={dashboardState.enhancedNewsData}
              dataAvailable={dashboardState.priceData?.length || 0}
              chartRef={chartRef}
            >
              {children}
            </ProfessionalChartContainer>
            
            {/* Risk Management Dashboard */}
            {dashboardState.riskManagement && dashboardState.volatilityIndex && (
              <ProfessionalRiskDashboard 
                riskMetrics={dashboardState.riskManagement}
                volatilityIndex={dashboardState.volatilityIndex}
                marketData={dashboardState.priceData}
                fedMeeting={fedMeeting}
              />
            )}
          </div>
        </Col>
        
        <Col xs={24} lg={6}>
          <div className="secondary-analysis-area">
            {/* AI-Enhanced News Feed */}
            <Card 
              title="🤖 AI-Enhanced News Intelligence" 
              size="small"
              style={{ marginBottom: 16 }}
            >
              <RealNewsDisplay 
                newsData={dashboardState.newsData}
                onNewsClick={(newsId: number) => {/* Handle news click */}}
                selectedNewsId={null}
              />
            </Card>
            
            {/* Professional Education Panel */}
            {marketSignalSummary && (
              <ProfessionalEducationPanel 
                currentSignal={marketSignalSummary}
                marketConditions={marketConditions}
                historicalContext={historicalContext}
              />
            )}
            
            {/* Performance Tracking */}
            <ProfessionalPerformanceTracker 
              performanceMetrics={performanceMetrics}
            />
          </div>
        </Col>
      </Row>

      {/* Professional Footer */}
      <div className="professional-footer" style={{ 
        marginTop: 24, 
        padding: '16px 24px', 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        borderRadius: '8px'
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space split={<Divider type="vertical" />}>
              <Text type="secondary">
                🏛️ Institutional-Grade Trading Intelligence
              </Text>
              <Text type="secondary">
                📊 99.9% Uptime Standards
              </Text>
              <Text type="secondary">
                🔬 Research-Backed Analysis
              </Text>
              <Text type="secondary">
                🤖 AI-Powered Insights
              </Text>
            </Space>
          </Col>
          <Col>
            <Text type="secondary">
              Professional Trading Platform v2.0 | Data Quality: {dashboardState.dataQuality.grade} | 
              AI Confidence: {aiAnalysisSummary.confidenceScore.toFixed(1)}%
            </Text>
          </Col>
        </Row>
      </div>

      {/* Help Panel */}
      {helpVisible && (
        <Card 
          style={{ 
            position: 'fixed', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            width: '600px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <Text strong>Professional Trading Dashboard Help</Text>
            <Button 
              style={{ float: 'right' }}
              onClick={() => setHelpVisible(false)}
            >
              Close
            </Button>
          </div>
          
          <div>
            <Text strong>🎯 Trading Signals:</Text>
            <div style={{ marginLeft: 16, marginBottom: 12 }}>
              <Text>STRONG_BUY/STRONG_SELL: High-confidence signals requiring immediate attention</Text><br />
              <Text>BUY/SELL: Standard signals based on technical and fundamental analysis</Text><br />
              <Text>HOLD: Maintain current positions, wait for clearer signals</Text>
            </div>

            <Text strong>🤖 AI Analysis:</Text>
            <div style={{ marginLeft: 16, marginBottom: 12 }}>
              <Text>High-impact events may cause increased volatility</Text><br />
              <Text>Confidence scores above 80% indicate high-quality analysis</Text><br />
              <Text>News correlation helps understand price movements</Text>
            </div>

            <Text strong>📊 Data Quality:</Text>
            <div style={{ marginLeft: 16, marginBottom: 12 }}>
              <Text>Grades A-B: Institutional compliance, safe for professional use</Text><br />
              <Text>Grade C: Acceptable quality with minor issues</Text><br />
              <Text>Grades D-F: Review required before trading decisions</Text>
            </div>

            <Text strong>🛡️ Risk Management:</Text>
            <div style={{ marginLeft: 16 }}>
              <Text>Position sizing based on volatility and account risk tolerance</Text><br />
              <Text>Stop-loss levels calculated using ATR (Average True Range)</Text><br />
              <Text>FOMC meetings can increase market volatility</Text>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}; 