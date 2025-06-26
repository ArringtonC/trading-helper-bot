/**
 * Profit Extraction Widget Component
 * Monthly profit extraction reminders and automation
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Progress,
  Button,
  Statistic,
  Row,
  Col,
  Alert,
  Typography,
  Space,
  Tag,
  Modal,
  InputNumber,
  Tooltip,
  message,
  List,
  Divider
} from 'antd';
import {
  DollarOutlined,
  SafetyOutlined,
  TrophyOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ProfitExtractionConfig, ProfitExtractionAnalysis, ProfitExtractionEvent } from '../types/psychology';

const { Title, Text } = Typography;

interface ProfitExtractionWidgetProps {
  accountSize: number;
  monthlyProfits: number;
  config?: ProfitExtractionConfig;
  extractionHistory?: ProfitExtractionEvent[];
  onExtractionExecute?: (amount: number, type: 'MANUAL' | 'AUTOMATIC') => void;
  className?: string;
}

const ProfitExtractionWidget: React.FC<ProfitExtractionWidgetProps> = ({
  accountSize,
  monthlyProfits,
  config,
  extractionHistory = [],
  onExtractionExecute,
  className = ''
}) => {
  const [showExtractionModal, setShowExtractionModal] = useState(false);
  const [customExtractionAmount, setCustomExtractionAmount] = useState(0);
  const [extractionConfig, setExtractionConfig] = useState<ProfitExtractionConfig>(
    config || {
      monthlyExtractionTarget: 25, // 25% of monthly profits
      autoExtractionEnabled: true, // DEFAULT TO AUTOMATIC - HARD PROTECTION
      minProfitThreshold: 500, // Lower threshold for more frequent protection
      emergencyExtractionTriggers: ['Market crash >20%', 'VIX >40', 'Account drawdown >15%'],
      reinvestmentStrategy: 'MODERATE'
    }
  );

  // Mock historical data for demonstration
  const mockExtractionHistory = extractionHistory.length > 0 ? extractionHistory : [
    {
      id: '1',
      date: new Date(2024, 0, 31),
      amount: 2500,
      accountSizeBefore: 102500,
      accountSizeAfter: 100000,
      extractionType: 'MANUAL',
      reason: 'Monthly profit protection',
      marketCondition: 'BULLISH'
    },
    {
      id: '2',
      date: new Date(2024, 1, 29),
      amount: 1800,
      accountSizeBefore: 108000,
      accountSizeAfter: 106200,
      extractionType: 'AUTOMATIC',
      reason: 'Scheduled monthly extraction',
      marketCondition: 'NEUTRAL'
    }
  ];

  const calculateExtractionRecommendation = () => {
    const extractionRate = extractionConfig.monthlyExtractionTarget / 100;
    const baseExtraction = monthlyProfits * extractionRate;
    
    // Apply safety checks
    if (monthlyProfits < extractionConfig.minProfitThreshold) {
      return {
        recommendedAmount: 0,
        reasoning: [`Monthly profits ($${monthlyProfits}) below minimum threshold ($${extractionConfig.minProfitThreshold})`],
        canExtract: false
      };
    }

    const remainingCapital = accountSize - baseExtraction;
    const minimumCapital = accountSize * 0.8;
    
    let adjustedExtraction = baseExtraction;
    const reasoning: string[] = [];

    if (remainingCapital < minimumCapital) {
      adjustedExtraction = accountSize - minimumCapital;
      reasoning.push('Adjusted to maintain 80% capital buffer');
    }

    if (adjustedExtraction > 0) {
      reasoning.push(`Extracting ${extractionConfig.monthlyExtractionTarget}% of monthly profits`);
      reasoning.push('Protects gains from market volatility');
      reasoning.push('Allows continued compound growth');
    }

    return {
      recommendedAmount: Math.max(0, adjustedExtraction),
      reasoning,
      canExtract: adjustedExtraction > 0
    };
  };

  const extractionRecommendation = calculateExtractionRecommendation();

  const calculateProtectionBenefit = () => {
    const totalExtracted = mockExtractionHistory.reduce((sum, ext) => sum + ext.amount, 0);
    // Simulate market crash protection (30% average protection)
    return totalExtracted * 0.3;
  };

  const calculateCompoundGrowthBenefit = () => {
    const totalExtracted = mockExtractionHistory.reduce((sum, ext) => sum + ext.amount, 0);
    // Assume 5% annual safe return on extracted funds
    return totalExtracted * 0.05;
  };

  const getExtractionProgress = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const thisMonthExtractions = mockExtractionHistory.filter(ext => 
      ext.date.toISOString().slice(0, 7) === currentMonth
    );
    const extractedThisMonth = thisMonthExtractions.reduce((sum, ext) => sum + ext.amount, 0);
    const targetExtraction = extractionRecommendation.recommendedAmount;
    
    return {
      extracted: extractedThisMonth,
      target: targetExtraction,
      progress: targetExtraction > 0 ? (extractedThisMonth / targetExtraction) * 100 : 0
    };
  };

  const extractionProgress = getExtractionProgress();

  const handleExtractionExecute = (amount: number, type: 'MANUAL' | 'AUTOMATIC') => {
    if (onExtractionExecute) {
      onExtractionExecute(amount, type);
    }
    
    message.success(`Extracted $${amount.toLocaleString()} successfully`);
    setShowExtractionModal(false);
  };

  // Chart data for extraction history
  const chartData = mockExtractionHistory.slice(-6).map(ext => ({
    month: ext.date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    extracted: ext.amount,
    accountSize: ext.accountSizeBefore,
    protection: ext.amount * 0.3 // Mock protection benefit
  }));

  return (
    <>
      <Card 
        className={`profit-extraction-widget ${className}`}
        title={
          <Space>
            <DollarOutlined style={{ color: '#52c41a' }} />
            <span>Profit Extraction System</span>
            <Tag color="green">Auto-Protection</Tag>
          </Space>
        }
        size="small"
      >
        {/* Current Month Status */}
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={12}>
            <Card size="small" className="text-center">
              <Statistic
                title="Monthly Profits"
                value={monthlyProfits}
                prefix="$"
                precision={0}
                valueStyle={{ color: monthlyProfits > 0 ? '#52c41a' : '#ff4d4f' }}
              />
              <div className="text-xs text-gray-500 mt-1">
                Current month performance
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card size="small" className="text-center">
              <Statistic
                title="Recommended Extraction"
                value={extractionRecommendation.recommendedAmount}
                prefix="$"
                precision={0}
                valueStyle={{ color: '#1890ff' }}
              />
              <div className="text-xs text-gray-500 mt-1">
                {extractionConfig.monthlyExtractionTarget}% of profits
              </div>
            </Card>
          </Col>
        </Row>

        {/* Extraction Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <Text strong>Monthly Extraction Progress</Text>
            <Text type="secondary">
              ${extractionProgress.extracted.toLocaleString()} / ${extractionProgress.target.toLocaleString()}
            </Text>
          </div>
          <Progress
            percent={Math.min(100, extractionProgress.progress)}
            strokeColor={extractionProgress.progress >= 100 ? '#52c41a' : '#1890ff'}
            trailColor="#f0f0f0"
          />
          {extractionProgress.progress >= 100 && (
            <div className="text-center mt-2">
              <Tag color="green" icon={<CheckCircleOutlined />}>
                Monthly extraction target achieved!
              </Tag>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <Row gutter={[8, 8]} className="mb-4">
          <Col xs={24} sm={12}>
            <Button
              type="primary"
              icon={<DollarOutlined />}
              onClick={() => setShowExtractionModal(true)}
              disabled={!extractionRecommendation.canExtract}
              block
            >
              Extract Profits
            </Button>
          </Col>
          <Col xs={24} sm={12}>
            <Button
              type={extractionConfig.autoExtractionEnabled ? 'default' : 'dashed'}
              icon={extractionConfig.autoExtractionEnabled ? <CheckCircleOutlined /> : <WarningOutlined />}
              onClick={() => {
                // Make it HARD to disable auto-extraction
                if (extractionConfig.autoExtractionEnabled) {
                  Modal.confirm({
                    title: 'Disable Profit Protection?',
                    content: 'WARNING: This removes automatic profit protection. Most traders who disable this feature lose their gains within 3 months. Are you absolutely certain?',
                    okText: 'Yes, Disable Protection',
                    cancelText: 'Keep Protection Active',
                    okButtonProps: { danger: true },
                    onOk: () => {
                      setExtractionConfig({
                        ...extractionConfig,
                        autoExtractionEnabled: false
                      });
                      message.warning('Profit protection disabled - Be extremely careful!');
                    }
                  });
                } else {
                  setExtractionConfig({
                    ...extractionConfig,
                    autoExtractionEnabled: true
                  });
                  message.success('Profit protection re-enabled - Smart choice!');
                }
              }}
              block
            >
              {extractionConfig.autoExtractionEnabled ? 'Protection: ON' : 'UNPROTECTED'}
            </Button>
          </Col>
        </Row>

        {/* Recommendations */}
        {extractionRecommendation.reasoning.length > 0 && (
          <Alert
            message="Extraction Recommendation"
            description={
              <List
                size="small"
                dataSource={extractionRecommendation.reasoning}
                renderItem={item => <List.Item style={{ padding: '4px 0', border: 'none' }}>• {item}</List.Item>}
              />
            }
            type={extractionRecommendation.canExtract ? 'success' : 'warning'}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Statistics */}
        <Row gutter={[16, 8]} className="mb-4">
          <Col xs={12} sm={6}>
            <Statistic
              title="Total Protected"
              value={mockExtractionHistory.reduce((sum, ext) => sum + ext.amount, 0)}
              prefix="$"
              precision={0}
              valueStyle={{ fontSize: '14px', color: '#52c41a' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Crash Protection"
              value={calculateProtectionBenefit()}
              prefix="$"
              precision={0}
              valueStyle={{ fontSize: '14px', color: '#fa8c16' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Safe Returns"
              value={calculateCompoundGrowthBenefit()}
              prefix="$"
              precision={0}
              valueStyle={{ fontSize: '14px', color: '#1890ff' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Extractions"
              value={mockExtractionHistory.length}
              valueStyle={{ fontSize: '14px', color: '#722ed1' }}
            />
          </Col>
        </Row>

        <Divider />

        {/* Extraction History Chart */}
        <div>
          <Text strong>Recent Extraction History</Text>
          <div style={{ height: 200, marginTop: 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip
                  formatter={(value, name) => [
                    `$${(value as number).toLocaleString()}`,
                    name === 'extracted' ? 'Extracted' : 'Protection Benefit'
                  ]}
                />
                <Bar dataKey="extracted" fill="#52c41a" name="extracted" />
                <Bar dataKey="protection" fill="#fa8c16" name="protection" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Benefits Summary */}
        <div className="mt-4">
          <Alert
            message="Smart Profit Protection"
            description="Automatic extraction protects your gains from market volatility while allowing continued compound growth on your trading capital."
            type="info"
            showIcon
            icon={<SafetyOutlined />}
          />
        </div>
      </Card>

      {/* Extraction Modal */}
      <Modal
        title="Execute Profit Extraction"
        open={showExtractionModal}
        onCancel={() => setShowExtractionModal(false)}
        footer={null}
        width={600}
      >
        <div className="mb-4">
          <Alert
            message="Recommended Extraction"
            description={
              <div>
                <div className="mb-2">
                  <Text strong>Amount: ${extractionRecommendation.recommendedAmount.toLocaleString()}</Text>
                </div>
                <List
                  size="small"
                  dataSource={extractionRecommendation.reasoning}
                  renderItem={item => <List.Item style={{ padding: '2px 0', border: 'none' }}>• {item}</List.Item>}
                />
              </div>
            }
            type="info"
            showIcon
          />
        </div>

        <div className="mb-4">
          <Text strong>Custom Extraction Amount</Text>
          <InputNumber
            style={{ width: '100%', marginTop: 8 }}
            value={customExtractionAmount}
            onChange={(value) => setCustomExtractionAmount(value || 0)}
            prefix="$"
            min={0}
            max={monthlyProfits}
            placeholder="Enter custom amount"
          />
          <div className="text-xs text-gray-500 mt-1">
            Maximum: ${monthlyProfits.toLocaleString()} (current month profits)
          </div>
        </div>

        <Row gutter={[8, 8]}>
          <Col span={12}>
            <Button
              type="primary"
              onClick={() => handleExtractionExecute(extractionRecommendation.recommendedAmount, 'AUTOMATIC')}
              disabled={!extractionRecommendation.canExtract}
              block
            >
              Extract Recommended
            </Button>
          </Col>
          <Col span={12}>
            <Button
              type="default"
              onClick={() => handleExtractionExecute(customExtractionAmount, 'MANUAL')}
              disabled={customExtractionAmount <= 0}
              block
            >
              Extract Custom Amount
            </Button>
          </Col>
        </Row>

        <div className="mt-4 text-center">
          <Text type="secondary" className="text-xs">
            Extracted funds are moved to your secure savings account for protection from market volatility
          </Text>
        </div>
      </Modal>
    </>
  );
};

export default ProfitExtractionWidget;