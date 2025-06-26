/**
 * Stress Tracker Component
 * Daily stress level input with performance correlation tracking
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Slider,
  Button,
  Input,
  Row,
  Col,
  Tag,
  Typography,
  Space,
  Alert,
  Progress,
  Tooltip,
  message,
  Statistic
} from 'antd';
import {
  HeartOutlined,
  ThunderboltOutlined,
  FireOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { EmotionalState, StressMetrics, StressCorrelationData } from '../types/psychology';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface StressTrackerProps {
  onStressUpdate?: (stressData: EmotionalState) => void;
  currentStress?: number;
  stressHistory?: StressCorrelationData[];
  className?: string;
}

const StressTracker: React.FC<StressTrackerProps> = ({
  onStressUpdate,
  currentStress = 5,
  stressHistory = [],
  className = ''
}) => {
  const [stressLevel, setStressLevel] = useState(currentStress);
  const [confidence, setConfidence] = useState(7);
  const [emotionalState, setEmotionalState] = useState<EmotionalState['current']>('FOCUSED');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock stress history for demonstration
  const mockStressHistory = stressHistory.length > 0 ? stressHistory : Array.from({ length: 14 }, (_, i) => ({
    stressLevel: 3 + Math.sin(i * 0.5) * 2 + Math.random() * 2,
    winRate: 65 - (3 + Math.sin(i * 0.5) * 2 + Math.random() * 2) * 2,
    profitFactor: 1.8 - (3 + Math.sin(i * 0.5) * 2 + Math.random() * 2) * 0.1,
    decisionQuality: 85 - (3 + Math.sin(i * 0.5) * 2 + Math.random() * 2) * 3,
    date: new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000)
  }));

  const getStressColor = (stress: number) => {
    if (stress <= 3) return '#52c41a'; // Green - Optimal
    if (stress <= 5) return '#1890ff'; // Blue - Good
    if (stress <= 7) return '#fa8c16'; // Orange - Moderate
    return '#ff4d4f'; // Red - High stress
  };

  const getStressDescription = (stress: number) => {
    if (stress <= 2) return 'Very Calm';
    if (stress <= 4) return 'Calm & Focused';
    if (stress <= 6) return 'Moderate Stress';
    if (stress <= 8) return 'High Stress';
    return 'Very High Stress';
  };

  const getEmotionalStateFromStress = (stress: number): EmotionalState['current'] => {
    if (stress <= 3) return 'CALM';
    if (stress <= 5) return 'FOCUSED';
    if (stress <= 7) return 'STRESSED';
    return 'PANICKED';
  };

  const getOptimalRangeRecommendation = () => {
    const avgWinRate = mockStressHistory.reduce((sum, item) => sum + item.winRate, 0) / mockStressHistory.length;
    const optimalStressData = mockStressHistory.filter(item => item.winRate > avgWinRate);
    
    if (optimalStressData.length > 0) {
      const avgOptimalStress = optimalStressData.reduce((sum, item) => sum + item.stressLevel, 0) / optimalStressData.length;
      return {
        optimal: avgOptimalStress,
        range: { min: avgOptimalStress - 1, max: avgOptimalStress + 1 }
      };
    }
    
    return { optimal: 4, range: { min: 3, max: 5 } };
  };

  const optimalRange = getOptimalRangeRecommendation();

  useEffect(() => {
    const newEmotionalState = getEmotionalStateFromStress(stressLevel);
    setEmotionalState(newEmotionalState);
  }, [stressLevel]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const stressData: EmotionalState = {
      current: emotionalState,
      stressLevel,
      confidence,
      timestamp: new Date(),
      notes: notes.trim() || undefined
    };

    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      
      if (onStressUpdate) {
        onStressUpdate(stressData);
      }

      message.success('Stress level logged successfully');
      
      // Reset notes but keep stress level for continuous tracking
      setNotes('');

      // Provide feedback based on stress level
      if (stressLevel > 7) {
        message.warning('High stress detected. Consider taking a break or reducing position sizes.');
      } else if (stressLevel >= optimalRange.range.min && stressLevel <= optimalRange.range.max) {
        message.success('You\'re in your optimal stress range for trading!');
      }

    } catch (error) {
      message.error('Failed to log stress level');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card 
      className={`stress-tracker ${className}`}
      title={
        <Space>
          <HeartOutlined style={{ color: getStressColor(stressLevel) }} />
          <span>Stress & Emotional State Tracker</span>
          <Tag color={getStressColor(stressLevel)}>
            Level {stressLevel}: {getStressDescription(stressLevel)}
          </Tag>
        </Space>
      }
      size="small"
    >
      <Row gutter={[16, 16]}>
        {/* Current Stress Input */}
        <Col xs={24} lg={12}>
          <div className="stress-input-section">
            <div className="mb-4">
              <Text strong>Current Stress Level (1-10)</Text>
              <Tooltip title="1 = Very Calm, 5 = Normal, 10 = Extremely Stressed">
                <div className="mt-2">
                  <Slider
                    min={1}
                    max={10}
                    value={stressLevel}
                    onChange={setStressLevel}
                    marks={{
                      1: { style: { color: '#52c41a' }, label: '😌' },
                      3: { style: { color: '#52c41a' }, label: '🙂' },
                      5: { style: { color: '#1890ff' }, label: '😐' },
                      7: { style: { color: '#fa8c16' }, label: '😰' },
                      10: { style: { color: '#ff4d4f' }, label: '😱' }
                    }}
                    trackStyle={{ backgroundColor: getStressColor(stressLevel) }}
                    handleStyle={{ borderColor: getStressColor(stressLevel) }}
                  />
                </div>
              </Tooltip>
            </div>

            <div className="mb-4">
              <Text strong>Confidence Level (1-10)</Text>
              <div className="mt-2">
                <Slider
                  min={1}
                  max={10}
                  value={confidence}
                  onChange={setConfidence}
                  marks={{
                    1: '😟',
                    5: '😐',
                    10: '😎'
                  }}
                  trackStyle={{ backgroundColor: '#1890ff' }}
                />
              </div>
            </div>

            <div className="mb-4">
              <Text strong>Emotional State</Text>
              <div className="mt-2">
                <Space wrap>
                  {['CALM', 'FOCUSED', 'STRESSED', 'PANICKED', 'EUPHORIC', 'FEARFUL'].map(state => (
                    <Tag
                      key={state}
                      color={emotionalState === state ? 'blue' : 'default'}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setEmotionalState(state as EmotionalState['current'])}
                    >
                      {state}
                    </Tag>
                  ))}
                </Space>
              </div>
            </div>

            <div className="mb-4">
              <Text strong>Notes (Optional)</Text>
              <TextArea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How are you feeling? Any specific triggers or concerns?"
                rows={3}
                maxLength={200}
                showCount
              />
            </div>

            <Button
              type="primary"
              onClick={handleSubmit}
              loading={isSubmitting}
              block
              icon={<CheckCircleOutlined />}
            >
              Log Current State
            </Button>
          </div>
        </Col>

        {/* Stress Analysis & Recommendations */}
        <Col xs={24} lg={12}>
          <div className="stress-analysis-section">
            {/* Current Status */}
            <div className="mb-4">
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Current Stress"
                    value={stressLevel}
                    suffix="/ 10"
                    valueStyle={{ color: getStressColor(stressLevel) }}
                    prefix={
                      stressLevel <= 3 ? <SafetyOutlined /> :
                      stressLevel <= 7 ? <WarningOutlined /> : <FireOutlined />
                    }
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Confidence"
                    value={confidence}
                    suffix="/ 10"
                    valueStyle={{ color: confidence >= 7 ? '#52c41a' : confidence >= 5 ? '#1890ff' : '#fa8c16' }}
                  />
                </Col>
              </Row>
            </div>

            {/* Optimal Range Indicator */}
            <div className="mb-4">
              <Text strong>Your Optimal Stress Range</Text>
              <div className="mt-2">
                <Progress
                  percent={(stressLevel / 10) * 100}
                  strokeColor={
                    stressLevel >= optimalRange.range.min && stressLevel <= optimalRange.range.max
                      ? '#52c41a' : '#fa8c16'
                  }
                  format={() => `${optimalRange.range.min.toFixed(1)} - ${optimalRange.range.max.toFixed(1)}`}
                />
                <Text type="secondary" className="text-xs">
                  Based on your historical performance correlation
                </Text>
              </div>
            </div>

            {/* Recommendations */}
            <div className="mb-4">
              {stressLevel > 8 && (
                <Alert
                  message="Critical Stress Level"
                  description="Consider taking a break. Avoid trading decisions until stress reduces below 7."
                  type="error"
                  showIcon
                  icon={<FireOutlined />}
                />
              )}
              
              {stressLevel > 6 && stressLevel <= 8 && (
                <Alert
                  message="High Stress Detected"
                  description="Reduce position sizes by 50%. Focus on high-probability setups only."
                  type="warning"
                  showIcon
                  icon={<WarningOutlined />}
                />
              )}
              
              {stressLevel >= optimalRange.range.min && stressLevel <= optimalRange.range.max && (
                <Alert
                  message="Optimal Trading Zone"
                  description="You're in your peak performance zone. Great time for execution!"
                  type="success"
                  showIcon
                  icon={<CheckCircleOutlined />}
                />
              )}
              
              {stressLevel < 3 && (
                <Alert
                  message="Very Low Stress"
                  description="You're very calm. Ensure you're still alert and focused on the markets."
                  type="info"
                  showIcon
                  icon={<SafetyOutlined />}
                />
              )}
            </div>

            {/* Stress History Chart */}
            <div>
              <Text strong>Stress vs Performance (14 Days)</Text>
              <div className="mt-2" style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockStressHistory.slice(-7).map(item => ({
                    date: item.date.toLocaleDateString(),
                    stress: item.stressLevel,
                    winRate: item.winRate
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" domain={[0, 10]} />
                    <YAxis yAxisId="right" orientation="right" domain={[40, 80]} />
                    <RechartsTooltip
                      formatter={(value, name) => [
                        name === 'stress' ? `${value.toFixed(1)}` : `${value.toFixed(1)}%`,
                        name === 'stress' ? 'Stress Level' : 'Win Rate'
                      ]}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="stress"
                      stroke="#ff4d4f"
                      fill="#ff4d4f"
                      fillOpacity={0.3}
                      name="stress"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="winRate"
                      stroke="#52c41a"
                      strokeWidth={2}
                      name="winRate"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default StressTracker;