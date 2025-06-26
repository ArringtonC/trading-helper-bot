/**
 * Emotional State Indicator Component
 * Real-time emotional state display with trading recommendations
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Tag,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Progress,
  Alert,
  Tooltip,
  Badge,
  Modal,
  message
} from 'antd';
import {
  HeartOutlined,
  ThunderboltOutlined,
  FireOutlined,
  SafetyOutlined,
  WarningOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { EmotionalState, PanicDetectionResult } from '../types/psychology';

const { Text, Title } = Typography;

interface EmotionalStateIndicatorProps {
  currentState?: EmotionalState;
  panicDetection?: PanicDetectionResult;
  onBreatherModeActivate?: () => void;
  onEmergencyStop?: () => void;
  tradingEnabled?: boolean;
  className?: string;
}

const EmotionalStateIndicator: React.FC<EmotionalStateIndicatorProps> = ({
  currentState,
  panicDetection,
  onBreatherModeActivate,
  onEmergencyStop,
  tradingEnabled = true,
  className = ''
}) => {
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [blinkingAlert, setBlinkingAlert] = useState(false);

  // Mock data if not provided
  const mockState: EmotionalState = {
    current: currentState?.current || 'FOCUSED',
    stressLevel: currentState?.stressLevel || 4,
    confidence: currentState?.confidence || 7,
    timestamp: currentState?.timestamp ? new Date(currentState.timestamp) : new Date(),
    notes: currentState?.notes
  };

  const mockPanicDetection: PanicDetectionResult = panicDetection || {
    isPanicking: false,
    riskLevel: 'LOW',
    triggers: [],
    recommendations: ['Maintain current approach'],
    shouldBlockTrading: false
  };
  
  // Ensure arrays are always defined
  if (!mockPanicDetection.triggers) {
    mockPanicDetection.triggers = [];
  }
  if (!mockPanicDetection.recommendations) {
    mockPanicDetection.recommendations = [];
  }

  useEffect(() => {
    // Blink alert for critical states
    if (mockPanicDetection.riskLevel === 'CRITICAL' || mockState.current === 'PANICKED') {
      const interval = setInterval(() => {
        setBlinkingAlert(prev => !prev);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setBlinkingAlert(false);
    }
  }, [mockPanicDetection.riskLevel, mockState.current]);

  const getEmotionalStateConfig = (state: EmotionalState['current']) => {
    const configs = {
      CALM: {
        color: '#52c41a',
        icon: '😌',
        description: 'Calm & Relaxed',
        riskLevel: 'LOW',
        tradingAdvice: 'Great time for patient setups and strategic decisions'
      },
      FOCUSED: {
        color: '#1890ff',
        icon: '🎯',
        description: 'Focused & Sharp',
        riskLevel: 'LOW',
        tradingAdvice: 'Optimal state for executing planned trades'
      },
      STRESSED: {
        color: '#fa8c16',
        icon: '😰',
        description: 'Stressed',
        riskLevel: 'MEDIUM',
        tradingAdvice: 'Reduce position sizes, avoid complex strategies'
      },
      PANICKED: {
        color: '#ff4d4f',
        icon: '😱',
        description: 'Panicked',
        riskLevel: 'CRITICAL',
        tradingAdvice: 'STOP TRADING - Take a break immediately'
      },
      EUPHORIC: {
        color: '#722ed1',
        icon: '🤩',
        description: 'Euphoric',
        riskLevel: 'HIGH',
        tradingAdvice: 'Beware of overconfidence - stick to your plan'
      },
      FEARFUL: {
        color: '#eb2f96',
        icon: '😨',
        description: 'Fearful',
        riskLevel: 'HIGH',
        tradingAdvice: 'Consider taking a break or reducing exposure'
      }
    };
    return configs[state] || configs.FOCUSED;
  };

  const stateConfig = getEmotionalStateConfig(mockState.current);

  const handleBreatherMode = () => {
    Modal.confirm({
      title: 'Activate Breather Mode?',
      content: 'This will pause trading for 30 minutes and guide you through a stress reduction exercise.',
      okText: 'Activate Breather Mode',
      cancelText: 'Cancel',
      onOk: () => {
        if (onBreatherModeActivate) {
          onBreatherModeActivate();
        }
        message.success('Breather Mode activated. Trading paused for 30 minutes.');
      }
    });
  };

  const handleEmergencyStop = () => {
    // HARD STOP - No confirmation when PANICKED
    if (mockState.current === 'PANICKED' || mockPanicDetection.riskLevel === 'CRITICAL') {
      if (onEmergencyStop) {
        onEmergencyStop();
      }
      message.error('EMERGENCY STOP ACTIVATED - Trading disabled for your protection. 30-minute cooldown required.');
      // Force immediate action without modal
      return;
    }
    // Only show confirmation for non-critical states
    setShowEmergencyModal(true);
  };

  const confirmEmergencyStop = () => {
    if (onEmergencyStop) {
      onEmergencyStop();
    }
    setShowEmergencyModal(false);
    message.warning('Emergency stop activated. All trading has been disabled.');
  };

  const getStressLevelColor = (level: number) => {
    if (level <= 3) return '#52c41a';
    if (level <= 5) return '#1890ff';
    if (level <= 7) return '#fa8c16';
    return '#ff4d4f';
  };

  return (
    <>
      <Card 
        className={`emotional-state-indicator ${className} ${blinkingAlert ? 'animate-pulse' : ''}`}
        title={
          <Space>
            <HeartOutlined style={{ color: stateConfig.color }} />
            <span>Emotional State Monitor</span>
            <Badge 
              status={
                mockPanicDetection.riskLevel === 'CRITICAL' ? 'error' :
                mockPanicDetection.riskLevel === 'HIGH' ? 'warning' :
                mockPanicDetection.riskLevel === 'MEDIUM' ? 'processing' : 'success'
              }
              text={mockPanicDetection.riskLevel}
            />
          </Space>
        }
        size="small"
        extra={
          <Space>
            {!tradingEnabled && (
              <Tag color="red" icon={<PauseCircleOutlined />}>
                Trading Paused
              </Tag>
            )}
            {tradingEnabled && (
              <Tag color="green" icon={<PlayCircleOutlined />}>
                Trading Active
              </Tag>
            )}
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          {/* Current Emotional State */}
          <Col xs={24} sm={12}>
            <div className="text-center mb-4">
              <div style={{ fontSize: '48px', marginBottom: 8 }}>
                {stateConfig.icon}
              </div>
              <Title level={4} style={{ color: stateConfig.color, margin: 0 }}>
                {stateConfig.description}
              </Title>
              <Text type="secondary">
                Updated: {mockState.timestamp.toLocaleTimeString()}
              </Text>
            </div>

            <div className="mb-4">
              <Row gutter={16}>
                <Col span={12}>
                  <div className="text-center">
                    <Text strong>Stress Level</Text>
                    <div style={{ fontSize: '24px', color: getStressLevelColor(mockState.stressLevel) }}>
                      {mockState.stressLevel}/10
                    </div>
                    <Progress
                      percent={(mockState.stressLevel / 10) * 100}
                      strokeColor={getStressLevelColor(mockState.stressLevel)}
                      showInfo={false}
                      size="small"
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <div className="text-center">
                    <Text strong>Confidence</Text>
                    <div style={{ fontSize: '24px', color: '#1890ff' }}>
                      {mockState.confidence}/10
                    </div>
                    <Progress
                      percent={(mockState.confidence / 10) * 100}
                      strokeColor="#1890ff"
                      showInfo={false}
                      size="small"
                    />
                  </div>
                </Col>
              </Row>
            </div>
          </Col>

          {/* Trading Recommendations */}
          <Col xs={24} sm={12}>
            <div className="mb-4">
              <Text strong>Trading Recommendations</Text>
              <div className="mt-2">
                <Alert
                  message={stateConfig.tradingAdvice}
                  type={
                    stateConfig.riskLevel === 'CRITICAL' ? 'error' :
                    stateConfig.riskLevel === 'HIGH' ? 'warning' :
                    stateConfig.riskLevel === 'MEDIUM' ? 'warning' : 'success'
                  }
                  showIcon
                  icon={
                    stateConfig.riskLevel === 'CRITICAL' ? <ExclamationCircleOutlined /> :
                    stateConfig.riskLevel === 'HIGH' ? <WarningOutlined /> : <SafetyOutlined />
                  }
                />
              </div>
            </div>

            {/* Panic Detection Alerts */}
            {mockPanicDetection.triggers.length > 0 && (
              <div className="mb-4">
                <Text strong>Active Triggers</Text>
                <div className="mt-2">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {mockPanicDetection.triggers.map((trigger, index) => (
                      <Alert
                        key={index}
                        message={trigger.type.replace(/_/g, ' ')}
                        description={trigger.description}
                        type={trigger.severity === 'CRITICAL' ? 'error' : 'warning'}
                        showIcon
                        size="small"
                      />
                    ))}
                  </Space>
                </div>
              </div>
            )}

            {/* Control Buttons */}
            <div className="mb-4">
              <Space direction="vertical" style={{ width: '100%' }}>
                {(mockState.stressLevel > 6 || mockPanicDetection.riskLevel === 'HIGH') && (
                  <Button
                    type="primary"
                    icon={<PauseCircleOutlined />}
                    onClick={handleBreatherMode}
                    block
                    style={{ backgroundColor: '#1890ff' }}
                  >
                    Activate Breather Mode (30 min)
                  </Button>
                )}

                {mockPanicDetection.shouldBlockTrading && (
                  <Button
                    danger
                    icon={<ExclamationCircleOutlined />}
                    onClick={handleEmergencyStop}
                    block
                  >
                    {mockState.current === 'PANICKED' ? 'HARD STOP - NO OVERRIDE' : 'Emergency Stop Trading'}
                  </Button>
                )}

                {mockState.current === 'PANICKED' && (
                  <Alert
                    message="TRADING SUSPENDED"
                    description="System automatically disabled trading. 30-minute mandatory cooldown in effect."
                    type="error"
                    showIcon
                    icon={<ExclamationCircleOutlined />}
                  />
                )}
              </Space>
            </div>
          </Col>
        </Row>

        {/* Additional Recommendations */}
        {mockPanicDetection.recommendations.length > 0 && (
          <div className="mt-4">
            <Text strong>AI Recommendations</Text>
            <ul className="mt-2">
              {mockPanicDetection.recommendations.map((rec, index) => (
                <li key={index}>
                  <Text type="secondary">{rec}</Text>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Notes Section */}
        {mockState.notes && (
          <div className="mt-4">
            <Text strong>Current Notes</Text>
            <div className="mt-2">
              <Text italic>"{mockState.notes}"</Text>
            </div>
          </div>
        )}
      </Card>

      {/* Emergency Stop Confirmation Modal */}
      <Modal
        title="Emergency Stop Trading"
        open={showEmergencyModal}
        onOk={confirmEmergencyStop}
        onCancel={() => setShowEmergencyModal(false)}
        okText="Stop Trading"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <Alert
          message="Warning"
          description="This will immediately disable all trading functionality. You will need to manually re-enable trading when you're ready to continue."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <p>Are you sure you want to activate emergency stop?</p>
        <ul>
          <li>All pending orders will be cancelled</li>
          <li>Position sizing will be disabled</li>
          <li>Market scanning will be paused</li>
          <li>You'll receive a cooldown period recommendation</li>
        </ul>
      </Modal>
    </>
  );
};

export default EmotionalStateIndicator;