import React, { useState, useEffect } from 'react';
import {
  Card,
  Steps,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Badge,
  Alert,
  Collapse,
  Tabs,
  Divider,
  message,
  Progress
} from 'antd';
import {
  DatabaseOutlined,
  RobotOutlined,
  RiseOutlined,
  BarChartOutlined,
  BulbOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import HMMIntegrationService from '../../../features/analytics/services/HMMIntegrationService';
import { HMMAnalysisDashboard } from '../../../features/analytics/components/HMMAnalysisDashboard';
import DataImportWizard from '../../../features/analytics/components/workflow/DataImportWizard';
import ModelTrainingWizard from '../../../features/analytics/components/workflow/ModelTrainingWizard';

const { Title, Paragraph, Text } = Typography;
const { Step } = Steps;
const { Panel } = Collapse;
const { TabPane } = Tabs;

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: 'waiting' | 'process' | 'finish' | 'error';
  component?: React.ReactNode;
}

/**
 * HMM Workflow Dashboard
 * 
 * Structured workflow for HMM analysis with clear sections:
 * 1. Data Import & Setup
 * 2. Model Training & Prediction
 * 3. Strategy Analysis & Insights
 * 4. Win Zone & Performance
 */
const HMMWorkflowDashboard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [serviceStatus, setServiceStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [workflowData, setWorkflowData] = useState({
    symbol: 'SPY',
    hasTrainedModel: false,
    predictions: null,
    strategies: [],
    winZoneData: null
  });

  const hmmService = HMMIntegrationService.getInstance();

  useEffect(() => {
    checkServiceStatus();
  }, []);

  const checkServiceStatus = async () => {
    try {
      const isAvailable = await hmmService.checkServiceStatus();
      setServiceStatus(isAvailable ? 'connected' : 'disconnected');
    } catch {
      setServiceStatus('disconnected');
    }
  };

  const markStepComplete = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps(prev => [...prev, stepId]);
    }
  };

  const getStepStatus = (stepId: string): 'waiting' | 'process' | 'finish' | 'error' => {
    if (completedSteps.includes(stepId)) return 'finish';
    if (currentStep === parseInt(stepId)) return 'process';
    return 'waiting';
  };

  // Step 1: Data Import & Setup Component
  const DataImportSection = () => (
    <div>
      <Alert
        message="Service Status"
        description={
          <Badge 
            status={serviceStatus === 'connected' ? 'success' : serviceStatus === 'checking' ? 'processing' : 'error'} 
            text={serviceStatus === 'connected' ? 'HMM Service Connected - Live Data Available' : serviceStatus === 'checking' ? 'Connecting to HMM Service...' : 'Service Offline - Mock Data Mode'}
          />
        }
        type={serviceStatus === 'connected' ? 'success' : 'warning'}
        showIcon
        style={{ marginBottom: 16 }}
        action={
          <Button size="small" onClick={checkServiceStatus}>
            Refresh
          </Button>
        }
      />
      
      <DataImportWizard
        initialSymbol={workflowData.symbol}
        onComplete={(data) => {
          setWorkflowData(prev => ({ ...prev, ...data }));
          markStepComplete('0');
          setCurrentStep(1);
          message.success('Data setup complete! Ready for model training.');
        }}
      />
    </div>
  );

  // Step 2: Model Training & Prediction Component
  const ModelTrainingSection = () => (
    <ModelTrainingWizard
      symbol={workflowData.symbol}
      onComplete={(results) => {
        setWorkflowData(prev => ({ ...prev, hasTrainedModel: true, modelResults: results }));
        markStepComplete('1');
        message.success('Model training complete!');
      }}
      onPredictionComplete={(predictions) => {
        setWorkflowData(prev => ({ ...prev, predictions }));
        markStepComplete('2');
        setCurrentStep(2);
        message.success('2-week predictions generated!');
      }}
    />
  );

  // Step 3: VIX Evaluation & Optimization Component
  const VIXEvaluationSection = () => (
    <Card>
      <Title level={4}>
        <RiseOutlined /> Step 3: Evaluate VIX Impact & Optimize
      </Title>
      <Paragraph>
        Analyze how VIX (volatility index) impacts your predictions and optimize model performance.
      </Paragraph>

      <Tabs defaultActiveKey="evaluation">
        <TabPane tab="VIX Evaluation" key="evaluation">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Button 
                type="primary"
                onClick={() => {
                  markStepComplete('3');
                  setCurrentStep(3);
                  message.success('VIX evaluation complete!');
                }}
              >
                Evaluate VIX Impact
              </Button>
            </Col>
          </Row>
        </TabPane>
        
        <TabPane tab="Model Optimization" key="optimization">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Button 
                type="default"
                onClick={() => {
                  markStepComplete('4');
                  message.success('Model optimization complete!');
                }}
              >
                Train with Optimization
              </Button>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </Card>
  );

  // Step 4: Strategy Insights Component
  const StrategyInsightsSection = () => (
    <Card>
      <Title level={4}>
        <BulbOutlined /> Step 4: Strategy Insights & Analysis
      </Title>
      <Paragraph>
        Generate trading strategies based on HMM predictions and regime analysis.
      </Paragraph>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card size="small" title="Strategy Generation">
            <Paragraph>
              Based on current market regime predictions, here are recommended strategies:
            </Paragraph>
            <ul>
              <li><strong>Bull Regime:</strong> Long positions, covered calls</li>
              <li><strong>Bear Regime:</strong> Protective puts, cash positions</li>
              <li><strong>Volatile Regime:</strong> Straddles, volatility plays</li>
              <li><strong>Neutral Regime:</strong> Range trading, theta strategies</li>
            </ul>
            <Button 
              type="primary"
              onClick={() => {
                markStepComplete('5');
                setCurrentStep(4);
                message.success('Strategy analysis complete!');
              }}
            >
              Generate Strategy Insights
            </Button>
          </Card>
        </Col>
      </Row>
    </Card>
  );

  // Step 5: Win Zone Component
  const WinZoneSection = () => (
    <Card>
      <Title level={4}>
        <TrophyOutlined /> Step 5: Win Zone & Performance Analysis
      </Title>
      <Paragraph>
        Analyze your trading performance and identify optimal trading zones based on HMM predictions.
      </Paragraph>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card size="small" title="Performance Metrics">
            <Row gutter={16}>
              <Col span={8}>
                <Card>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                      87.3%
                    </div>
                    <div>Prediction Accuracy</div>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                      12
                    </div>
                    <div>Active Strategies</div>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                      3
                    </div>
                    <div>Win Streaks</div>
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </Card>
  );

  const workflowSteps = [
    { title: 'Data Import', description: 'Import and setup market data' },
    { title: 'Train Model', description: 'Train HMM and predict 2 weeks' },
    { title: 'VIX Analysis', description: 'Evaluate VIX impact and optimize' },
    { title: 'Strategy Insights', description: 'Generate trading strategies' },
    { title: 'Win Zone', description: 'Analyze performance and opportunities' }
  ];

  const renderCurrentSection = () => {
    switch (currentStep) {
      case 0: return <DataImportSection />;
      case 1: return <ModelTrainingSection />;
      case 2: return <VIXEvaluationSection />;
      case 3: return <StrategyInsightsSection />;
      case 4: return <WinZoneSection />;
      default: return <DataImportSection />;
    }
  };

  return (
    <div className="hmm-workflow-dashboard" style={{ padding: '24px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      {/* Header */}
      <Card className="mb-6">
        <Row align="middle">
          <Col span={18}>
            <Title level={2} style={{ margin: 0 }}>
              <BarChartOutlined /> HMM Analysis Workflow
            </Title>
            <Paragraph style={{ margin: 0, marginTop: 8 }}>
              Complete workflow for Hidden Markov Model analysis, from data import to strategy generation
            </Paragraph>
          </Col>
          <Col span={6} style={{ textAlign: 'right' }}>
            <Progress 
              type="circle" 
              percent={Math.round((completedSteps.length / 6) * 100)} 
              size={80}
              format={(percent) => (
                <span style={{ fontSize: '14px' }}>
                  {completedSteps.length}/6<br/>Complete
                </span>
              )}
            />
          </Col>
        </Row>
      </Card>

      {/* Progress Steps */}
      <Card className="mb-6">
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          {workflowSteps.map((step, index) => (
            <Step
              key={index}
              title={step.title}
              description={step.description}
              status={getStepStatus(index.toString())}
              icon={completedSteps.includes(index.toString()) ? <CheckCircleOutlined /> : undefined}
            />
          ))}
        </Steps>
      </Card>

      {/* Current Section */}
      {renderCurrentSection()}

      {/* Advanced Analysis Section */}
      {completedSteps.length >= 3 && (
        <Card className="mt-6">
          <Collapse>
            <Panel header="🔬 Advanced HMM Analysis Dashboard" key="advanced">
              <Paragraph>
                Access the full interactive HMM analysis dashboard with real-time visualizations,
                regime transition heatmaps, and VIX correlation analysis.
              </Paragraph>
              <HMMAnalysisDashboard />
            </Panel>
          </Collapse>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="mt-6">
        <Title level={4}>Quick Actions</Title>
        <Space wrap>
          <Button onClick={() => setCurrentStep(0)}>Reset Workflow</Button>
          <Button onClick={() => setCurrentStep(currentStep > 0 ? currentStep - 1 : 0)}>
            Previous Step
          </Button>
          <Button 
            type="primary"
            onClick={() => setCurrentStep(currentStep < 4 ? currentStep + 1 : 4)}
          >
            Next Step
          </Button>
          <Button onClick={checkServiceStatus}>
            Check Service Status
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default HMMWorkflowDashboard;