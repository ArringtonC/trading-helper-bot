import React, { useState } from 'react';
import { Card, Button, Form, Input, Select, Checkbox, Typography, Space, Divider, Tag, Alert } from 'antd';
import { UserOutlined, SettingOutlined, TrophyOutlined } from '@ant-design/icons';
import {
  UserExperienceAssessment,
  AssessmentResult,
  UserBehaviorMetrics,
  TradingHistoryData,
  ExplicitPreferences
} from '../../utils/assessment/UserExperienceAssessment';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

interface AssessmentFormData {
  // Behavior
  timeSpentInApp: number;
  featuresUsed: string[];
  errorRate: number;
  tutorialProgress: number;
  
  // Trading
  tradingExperienceYears: number;
  accountSize: number;
  instrumentsTraded: string[];
  winRate: number;
  totalTrades: number;
  
  // Preferences
  selfReportedLevel: string;
  preferredRiskLevel: string;
  preferredComplexity: string;
  hasCompletedOnboarding: boolean;
}

const AssessmentTest: React.FC = () => {
  const [form] = Form.useForm();
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(false);

  const assessment = new UserExperienceAssessment();

  const handleAssess = async (values: AssessmentFormData) => {
    setLoading(true);
    
    try {
      const behavior: Partial<UserBehaviorMetrics> = {
        timeSpentInApp: values.timeSpentInApp || 0,
        featuresUsed: values.featuresUsed || [],
        errorRate: (values.errorRate || 0) / 100, // Convert percentage to decimal
        tutorialProgress: values.tutorialProgress || 0,
        complexFeaturesAccessed: values.featuresUsed?.filter(f => 
          ['rule-engine', 'api-connections', 'advanced-analytics', 'ai-analysis'].includes(f)
        ) || []
      };

      const trading: Partial<TradingHistoryData> = {
        tradingExperienceYears: values.tradingExperienceYears || 0,
        accountSize: values.accountSize || 0,
        instrumentsTraded: values.instrumentsTraded || [],
        winRate: (values.winRate || 0) / 100, // Convert percentage to decimal
        totalTrades: values.totalTrades || 0,
        hasLiveTradingExperience: (values.totalTrades || 0) > 0
      };

      const preferences: Partial<ExplicitPreferences> = {
        selfReportedLevel: values.selfReportedLevel as any,
        preferredRiskLevel: values.preferredRiskLevel as any,
        preferredComplexity: values.preferredComplexity as any,
        hasCompletedOnboarding: values.hasCompletedOnboarding || false
      };

      const assessmentResult = assessment.assessUser(behavior, trading, preferences);
      setResult(assessmentResult);
    } catch (error) {
      console.error('Assessment error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'learning': return 'green';
      case 'import': return 'orange';
      case 'broker': return 'red';
      default: return 'default';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'conservative': return 'blue';
      case 'moderate': return 'orange';
      case 'aggressive': return 'red';
      default: return 'default';
    }
  };

  const presetScenarios = [
    {
      name: 'Complete Beginner',
      values: {
        timeSpentInApp: 30,
        featuresUsed: ['position-sizing'],
        errorRate: 40,
        tutorialProgress: 25,
        tradingExperienceYears: 0,
        accountSize: 1000,
        instrumentsTraded: [],
        winRate: 0,
        totalTrades: 0,
        selfReportedLevel: '',
        preferredRiskLevel: '',
        preferredComplexity: '',
        hasCompletedOnboarding: false
      }
    },
    {
      name: 'Intermediate Trader',
      values: {
        timeSpentInApp: 200,
        featuresUsed: ['position-sizing', 'visualizer', 'analytics'],
        errorRate: 10,
        tutorialProgress: 80,
        tradingExperienceYears: 1.5,
        accountSize: 15000,
        instrumentsTraded: ['stocks', 'options'],
        winRate: 55,
        totalTrades: 50,
        selfReportedLevel: '',
        preferredRiskLevel: '',
        preferredComplexity: 'moderate',
        hasCompletedOnboarding: true
      }
    },
    {
      name: 'Advanced User',
      values: {
        timeSpentInApp: 800,
        featuresUsed: ['position-sizing', 'analytics', 'rule-engine', 'ai-analysis'],
        errorRate: 2,
        tutorialProgress: 100,
        tradingExperienceYears: 8,
        accountSize: 150000,
        instrumentsTraded: ['stocks', 'options', 'futures'],
        winRate: 68,
        totalTrades: 500,
        selfReportedLevel: '',
        preferredRiskLevel: 'aggressive',
        preferredComplexity: 'broker',
        hasCompletedOnboarding: true
      }
    }
  ];

  const loadPreset = (preset: any) => {
    form.setFieldsValue(preset.values);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>
        <SettingOutlined /> User Experience Assessment Test
      </Title>
      <Paragraph>
        Test the User Experience Assessment system by entering user data and seeing how the system
        categorizes users and determines appropriate defaults.
      </Paragraph>

      <Space style={{ marginBottom: 24 }}>
        {presetScenarios.map((preset, index) => (
          <Button key={index} onClick={() => loadPreset(preset)}>
            Load {preset.name}
          </Button>
        ))}
      </Space>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Input Form */}
        <Card title={<><UserOutlined /> Assessment Input</>}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleAssess}
            initialValues={{
              timeSpentInApp: 0,
              featuresUsed: [],
              errorRate: 20,
              tutorialProgress: 0,
              tradingExperienceYears: 0,
              accountSize: 0,
              instrumentsTraded: [],
              winRate: 50,
              totalTrades: 0,
              hasCompletedOnboarding: false
            }}
          >
            <Title level={4}>User Behavior</Title>
            <Form.Item name="timeSpentInApp" label="Time Spent in App (minutes)">
              <Input type="number" min={0} />
            </Form.Item>

            <Form.Item name="featuresUsed" label="Features Used">
              <Select mode="multiple" placeholder="Select features">
                <Option value="position-sizing">Position Sizing</Option>
                <Option value="tutorial">Tutorial</Option>
                <Option value="visualizer">Visualizer</Option>
                <Option value="analytics">Analytics</Option>
                <Option value="options-trading">Options Trading</Option>
                <Option value="rule-engine">Rule Engine</Option>
                <Option value="api-connections">API Connections</Option>
                <Option value="advanced-analytics">Advanced Analytics</Option>
                <Option value="ai-analysis">AI Analysis</Option>
              </Select>
            </Form.Item>

            <Form.Item name="errorRate" label="Error Rate (%)">
              <Input type="number" min={0} max={100} />
            </Form.Item>

            <Form.Item name="tutorialProgress" label="Tutorial Progress (%)">
              <Input type="number" min={0} max={100} />
            </Form.Item>

            <Divider />
            <Title level={4}>Trading History</Title>
            
            <Form.Item name="tradingExperienceYears" label="Trading Experience (years)">
              <Input type="number" min={0} step={0.5} />
            </Form.Item>

            <Form.Item name="accountSize" label="Account Size ($)">
              <Input type="number" min={0} />
            </Form.Item>

            <Form.Item name="instrumentsTraded" label="Instruments Traded">
              <Select mode="multiple" placeholder="Select instruments">
                <Option value="stocks">Stocks</Option>
                <Option value="options">Options</Option>
                <Option value="futures">Futures</Option>
                <Option value="forex">Forex</Option>
              </Select>
            </Form.Item>

            <Form.Item name="winRate" label="Win Rate (%)">
              <Input type="number" min={0} max={100} />
            </Form.Item>

            <Form.Item name="totalTrades" label="Total Trades">
              <Input type="number" min={0} />
            </Form.Item>

            <Divider />
            <Title level={4}>Preferences</Title>

            <Form.Item name="selfReportedLevel" label="Self-Reported Level">
              <Select placeholder="Select level" allowClear>
                <Option value="learning">Beginner</Option>
                <Option value="import">Intermediate</Option>
                <Option value="broker">Advanced</Option>
              </Select>
            </Form.Item>

            <Form.Item name="preferredRiskLevel" label="Preferred Risk Level">
              <Select placeholder="Select risk level" allowClear>
                <Option value="conservative">Conservative</Option>
                <Option value="moderate">Moderate</Option>
                <Option value="aggressive">Aggressive</Option>
              </Select>
            </Form.Item>

            <Form.Item name="preferredComplexity" label="Preferred Complexity">
              <Select placeholder="Select complexity" allowClear>
                <Option value="simple">Simple</Option>
                <Option value="moderate">Moderate</Option>
                <Option value="broker">Advanced</Option>
              </Select>
            </Form.Item>

            <Form.Item name="hasCompletedOnboarding" valuePropName="checked">
              <Checkbox>Has Completed Onboarding</Checkbox>
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={loading} block>
              Run Assessment
            </Button>
          </Form>
        </Card>

        {/* Results */}
        <Card title={<><TrophyOutlined /> Assessment Results</>}>
          {result ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Title level={4}>User Classification</Title>
                <Space>
                  <Text strong>Level:</Text>
                  <Tag color={getLevelColor(result.userLevel)}>{result.userLevel.toUpperCase()}</Tag>
                  <Text strong>Confidence:</Text>
                  <Tag>{(result.confidence * 100).toFixed(1)}%</Tag>
                </Space>
              </div>

              <div>
                <Title level={4}>Risk Profile</Title>
                <Space direction="vertical">
                  <Space>
                    <Text strong>Level:</Text>
                    <Tag color={getRiskColor(result.riskProfile.level)}>
                      {result.riskProfile.level.toUpperCase()}
                    </Tag>
                  </Space>
                  <Text>
                    <strong>Default Risk:</strong> {result.riskProfile.defaultRiskPercent}% |{' '}
                    <strong>Max Risk:</strong> {result.riskProfile.maxRiskPercent}% |{' '}
                    <strong>Kelly Fraction:</strong> {result.riskProfile.kellyFraction}
                  </Text>
                  <Text>
                    <strong>VIX Adjustment:</strong> {result.riskProfile.vixAdjustmentEnabled ? 'Enabled' : 'Disabled'}
                  </Text>
                  <Paragraph italic>{result.riskProfile.description}</Paragraph>
                </Space>
              </div>

              <div>
                <Title level={4}>Recommendations</Title>
                <ul>
                  {result.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>

              <div>
                <Title level={4}>Suggested Features</Title>
                <Space wrap>
                  {result.suggestedFeatures.map((feature, index) => (
                    <Tag key={index}>{feature}</Tag>
                  ))}
                </Space>
              </div>

              <div>
                <Title level={4}>Onboarding</Title>
                <Text>
                  Should show onboarding: {result.shouldShowOnboarding ? 'Yes' : 'No'}
                </Text>
              </div>

              {result.warningFlags.length > 0 && (
                <div>
                  <Title level={4}>Warning Flags</Title>
                  {result.warningFlags.map((warning, index) => (
                    <Alert
                      key={index}
                      message={warning}
                      type="warning"
                      showIcon
                      style={{ marginBottom: 8 }}
                    />
                  ))}
                </div>
              )}

              <div>
                <Title level={4}>Reasoning</Title>
                <ul>
                  {result.reasoning.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            </Space>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Text type="secondary">
                Fill out the form and click "Run Assessment" to see results
              </Text>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AssessmentTest; 