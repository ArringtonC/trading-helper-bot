/**
 * Breakout Alert Manager Component
 * 
 * Real-time monitoring and alerts for Monday range breakouts
 * Integrates with Challenge RPG system for XP rewards
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Alert,
  List,
  Button,
  Tag,
  Space,
  Row,
  Col,
  Statistic,
  Progress,
  Typography,
  notification,
  Badge,
  Switch,
  Modal,
  Tooltip,
  Avatar
} from 'antd';
import {
  BellOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  FallOutlined,
  FireOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  WarningOutlined,
  TrophyOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { MondayRangeCalculator, BreakoutAlert, MondayRangeData } from '../../market-data/services/MondayRangeCalculator';

const { Title, Text } = Typography;

interface BreakoutAlertManagerProps {
  symbol?: string;
  currentPrice?: number;
  onBreakoutAction?: (alert: BreakoutAlert) => void;
  strategyClass?: 'BUFFETT_GUARDIAN' | 'DALIO_WARRIOR' | 'SOROS_ASSASSIN' | 'LYNCH_SCOUT';
  className?: string;
}

const BreakoutAlertManager: React.FC<BreakoutAlertManagerProps> = ({
  symbol = 'SPY',
  currentPrice: propCurrentPrice,
  onBreakoutAction,
  strategyClass = 'DALIO_WARRIOR',
  className = ''
}) => {
  const [alerts, setAlerts] = useState<BreakoutAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [mondayRange, setMondayRange] = useState<MondayRangeData | null>(null);
  const [currentPrice, setCurrentPrice] = useState(propCurrentPrice || 450);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<BreakoutAlert | null>(null);

  const calculator = MondayRangeCalculator.getInstance();

  // Initialize Monday range calculation
  useEffect(() => {
    const initializeRange = async () => {
      try {
        const range = await calculator.calculateMondayRange(symbol);
        setMondayRange(range);
      } catch (error) {
        console.error('Error calculating Monday range:', error);
        notification.error({
          message: 'Range Calculation Error',
          description: 'Failed to calculate Monday range. Please try again.'
        });
      }
    };

    initializeRange();
  }, [symbol]);

  // Mock price updates for demonstration
  useEffect(() => {
    if (!isMonitoring || propCurrentPrice) return;

    const priceInterval = setInterval(() => {
      setCurrentPrice(prev => {
        // Simulate realistic price movement
        const change = (Math.random() - 0.5) * 0.5;
        return Number((prev + change).toFixed(2));
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(priceInterval);
  }, [isMonitoring, propCurrentPrice]);

  // Update current price from props
  useEffect(() => {
    if (propCurrentPrice) {
      setCurrentPrice(propCurrentPrice);
    }
  }, [propCurrentPrice]);

  // Setup breakout monitoring
  useEffect(() => {
    if (!isMonitoring || !mondayRange) return;

    const handleBreakoutAlert = (alert: BreakoutAlert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 10)); // Keep last 10 alerts
      
      // Play sound if enabled
      if (audioEnabled) {
        playAlertSound();
      }

      // Show notification
      notification.open({
        message: `🚨 Breakout Alert: ${alert.actionSignal}`,
        description: `${symbol} ${alert.breakoutType === 'ABOVE_HIGH' ? 'broke above' : 'broke below'} Monday's ${alert.breakoutType === 'ABOVE_HIGH' ? 'high' : 'low'} at $${alert.currentPrice.toFixed(2)}`,
        icon: alert.breakoutType === 'ABOVE_HIGH' ? <RiseOutlined style={{ color: '#52c41a' }} /> : <FallOutlined style={{ color: '#ff4d4f' }} />,
        duration: 0,
        btn: (
          <Button 
            type="primary" 
            size="small"
            onClick={() => handleAlertAction(alert)}
          >
            Take Action
          </Button>
        )
      });
    };

    calculator.on('breakoutAlert', handleBreakoutAlert);

    // Start monitoring with price callback
    calculator.startBreakoutMonitoring(async () => currentPrice, 5000);

    return () => {
      calculator.off('breakoutAlert', handleBreakoutAlert);
      calculator.stopBreakoutMonitoring();
    };
  }, [isMonitoring, mondayRange, currentPrice, symbol, audioEnabled]);

  const handleAlertAction = (alert: BreakoutAlert) => {
    setSelectedAlert(alert);
    setShowAlertModal(true);
    
    if (onBreakoutAction) {
      onBreakoutAction(alert);
    }
  };

  const playAlertSound = () => {
    // In a real app, play an alert sound
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhByCH0fPTgjMGHGm98ueETgwNTqzn775iFQZChNT0ynosCSiCzvXajzkIHWi+8OWcTgwOUqzl67VhEAU6lNn1x3kqBi6Fz/LPhzQGHG6+8OaWT');
    audio.play().catch(e => console.log('Audio play failed:', e));
  };

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    if (!isMonitoring) {
      notification.info({
        message: 'Monitoring Started',
        description: 'Breakout monitoring is now active. You will receive alerts when price breaks Monday\'s range.',
        icon: <PlayCircleOutlined style={{ color: '#1890ff' }} />
      });
    } else {
      notification.info({
        message: 'Monitoring Stopped',
        description: 'Breakout monitoring has been paused.',
        icon: <PauseCircleOutlined style={{ color: '#faad14' }} />
      });
    }
  };

  const getStrategyCompatibility = (alert: BreakoutAlert): { compatible: boolean; reason: string } => {
    const compatibility = {
      BUFFETT_GUARDIAN: {
        LONG_ATTACK: false,
        SHORT_ATTACK: false,
        reason: 'Value investors don\'t chase breakouts'
      },
      DALIO_WARRIOR: {
        LONG_ATTACK: true,
        SHORT_ATTACK: true,
        reason: 'Perfect for trend-following strategies'
      },
      SOROS_ASSASSIN: {
        LONG_ATTACK: alert.volatilityMode === 'BOSS_BATTLE',
        SHORT_ATTACK: alert.volatilityMode === 'BOSS_BATTLE',
        reason: 'Only trades high volatility breakouts'
      },
      LYNCH_SCOUT: {
        LONG_ATTACK: true,
        SHORT_ATTACK: false,
        reason: 'Growth investors prefer long positions'
      }
    };

    const strategyConfig = compatibility[strategyClass];
    return {
      compatible: strategyConfig[alert.actionSignal],
      reason: strategyConfig.reason
    };
  };

  const getPriceFromBreakout = (price: number, breakout: number): string => {
    const distance = Math.abs(price - breakout);
    const percent = ((distance / breakout) * 100).toFixed(2);
    return `${distance.toFixed(2)} (${percent}%)`;
  };

  return (
    <>
      <Card 
        className={`breakout-alert-manager ${className}`}
        title={
          <Space>
            <BellOutlined />
            <span>Monday Range Breakout Monitor</span>
            {mondayRange && (
              <Tag color={mondayRange.volatilityMode === 'BOSS_BATTLE' ? 'red' : 'blue'}>
                {mondayRange.volatilityMode === 'BOSS_BATTLE' ? '🔥 BOSS BATTLE' : '⚔️ STANDARD'}
              </Tag>
            )}
          </Space>
        }
        extra={
          <Space>
            <Tooltip title={audioEnabled ? 'Mute alerts' : 'Enable alert sounds'}>
              <Button
                type="text"
                icon={audioEnabled ? <BellOutlined /> : <CloseCircleOutlined />}
                onClick={() => setAudioEnabled(!audioEnabled)}
              />
            </Tooltip>
            <Switch
              checked={isMonitoring}
              onChange={toggleMonitoring}
              checkedChildren="ON"
              unCheckedChildren="OFF"
            />
          </Space>
        }
      >
        {/* Current Status */}
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="Current Price"
                value={currentPrice}
                prefix="$"
                precision={2}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="Monday Range"
                value={mondayRange?.range || 0}
                precision={2}
                suffix="pts"
                valueStyle={{ 
                  color: mondayRange?.volatilityMode === 'BOSS_BATTLE' ? '#ff4d4f' : '#52c41a' 
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="Active Alerts"
                value={alerts.length}
                prefix={<FireOutlined />}
                valueStyle={{ color: alerts.length > 0 ? '#fa8c16' : '#8c8c8c' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Battle Zone Status */}
        {mondayRange && (
          <div className="mb-4">
            <Title level={5}>Battle Zone Status</Title>
            <Row gutter={[16, 8]}>
              <Col span={12}>
                <div className="flex items-center justify-between">
                  <Text>Upper Breakout:</Text>
                  <Text strong>${mondayRange.breakoutLevels.upperBreakout.toFixed(2)}</Text>
                </div>
                <Progress
                  percent={Math.min(100, ((currentPrice - mondayRange.low) / mondayRange.range) * 100)}
                  strokeColor="#52c41a"
                  showInfo={false}
                />
                <Text type="secondary" className="text-xs">
                  Distance: {getPriceFromBreakout(currentPrice, mondayRange.breakoutLevels.upperBreakout)}
                </Text>
              </Col>
              <Col span={12}>
                <div className="flex items-center justify-between">
                  <Text>Lower Breakout:</Text>
                  <Text strong>${mondayRange.breakoutLevels.lowerBreakout.toFixed(2)}</Text>
                </div>
                <Progress
                  percent={Math.min(100, ((mondayRange.high - currentPrice) / mondayRange.range) * 100)}
                  strokeColor="#ff4d4f"
                  showInfo={false}
                />
                <Text type="secondary" className="text-xs">
                  Distance: {getPriceFromBreakout(currentPrice, mondayRange.breakoutLevels.lowerBreakout)}
                </Text>
              </Col>
            </Row>
          </div>
        )}

        {/* Alert List */}
        <div>
          <Title level={5}>Recent Alerts</Title>
          {alerts.length === 0 ? (
            <Alert
              message="No breakouts detected"
              description={isMonitoring ? "Monitoring active. You'll be notified when price breaks Monday's range." : "Start monitoring to receive breakout alerts."}
              type="info"
              showIcon
            />
          ) : (
            <List
              dataSource={alerts}
              renderItem={(alert) => {
                const compatibility = getStrategyCompatibility(alert);
                return (
                  <List.Item
                    actions={[
                      <Button
                        key="action"
                        type={compatibility.compatible ? "primary" : "default"}
                        icon={<ThunderboltOutlined />}
                        onClick={() => handleAlertAction(alert)}
                        disabled={!compatibility.compatible}
                      >
                        Action
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Badge
                          count={`+${alert.xpReward} XP`}
                          style={{ backgroundColor: '#52c41a' }}
                        >
                          {alert.breakoutType === 'ABOVE_HIGH' ? (
                            <Avatar 
                              icon={<RiseOutlined />} 
                              style={{ backgroundColor: '#52c41a' }}
                            />
                          ) : (
                            <Avatar 
                              icon={<FallOutlined />} 
                              style={{ backgroundColor: '#ff4d4f' }}
                            />
                          )}
                        </Badge>
                      }
                      title={
                        <Space>
                          <Text strong>{alert.actionSignal}</Text>
                          <Tag color={alert.volatilityMode === 'BOSS_BATTLE' ? 'red' : 'blue'}>
                            {alert.volatilityMode}
                          </Tag>
                          {compatibility.compatible && (
                            <Tag color="green">Strategy Match</Tag>
                          )}
                        </Space>
                      }
                      description={
                        <div>
                          <Text>
                            {symbol} broke {alert.breakoutType === 'ABOVE_HIGH' ? 'above' : 'below'} ${alert.breakoutLevel.toFixed(2)} at ${alert.currentPrice.toFixed(2)}
                          </Text>
                          <br />
                          <Text type="secondary" className="text-xs">
                            {new Date(alert.timestamp).toLocaleTimeString()} • Confidence: {(alert.confidence * 100).toFixed(0)}%
                          </Text>
                          {!compatibility.compatible && (
                            <div>
                              <Text type="warning" className="text-xs">
                                <WarningOutlined /> {compatibility.reason}
                              </Text>
                            </div>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          )}
        </div>
      </Card>

      {/* Alert Action Modal */}
      <Modal
        title="Execute Breakout Trade"
        open={showAlertModal}
        onCancel={() => setShowAlertModal(false)}
        footer={null}
        width={600}
      >
        {selectedAlert && (
          <div>
            <Alert
              message={selectedAlert.actionSignal}
              description={`Execute ${selectedAlert.actionSignal === 'LONG_ATTACK' ? 'long' : 'short'} position based on Monday range breakout`}
              type={selectedAlert.actionSignal === 'LONG_ATTACK' ? 'success' : 'error'}
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="Entry Price"
                  value={selectedAlert.currentPrice}
                  prefix="$"
                  precision={2}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="XP Reward"
                  value={selectedAlert.xpReward}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>

            <div className="mt-4">
              <Title level={5}>Recommended Targets</Title>
              {mondayRange && (
                <ul>
                  <li>Target 1: ${selectedAlert.actionSignal === 'LONG_ATTACK' ? mondayRange.breakoutLevels.upperTarget1.toFixed(2) : mondayRange.breakoutLevels.lowerTarget1.toFixed(2)}</li>
                  <li>Target 2: ${selectedAlert.actionSignal === 'LONG_ATTACK' ? mondayRange.breakoutLevels.upperTarget2.toFixed(2) : mondayRange.breakoutLevels.lowerTarget2.toFixed(2)}</li>
                  <li>Stop Loss: ${selectedAlert.breakoutLevel.toFixed(2)}</li>
                </ul>
              )}
            </div>

            <Space className="mt-4">
              <Button 
                type="primary" 
                icon={<ThunderboltOutlined />}
                onClick={() => {
                  // In real app, this would execute the trade
                  notification.success({
                    message: 'Trade Executed',
                    description: `${selectedAlert.actionSignal} position opened at $${selectedAlert.currentPrice.toFixed(2)}`
                  });
                  setShowAlertModal(false);
                }}
              >
                Execute Trade
              </Button>
              <Button onClick={() => setShowAlertModal(false)}>
                Cancel
              </Button>
            </Space>
          </div>
        )}
      </Modal>
    </>
  );
};

export default BreakoutAlertManager;