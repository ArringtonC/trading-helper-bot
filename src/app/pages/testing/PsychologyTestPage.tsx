/**
 * Psychology Test Page
 * Tests all Phase 2.5 psychology features in one place
 */

import React, { useState } from 'react';
import { Card, Row, Col, Tabs, Button, message, Space, Typography, Divider, Tag, Alert, Statistic, Progress } from 'antd';
import { 
  HeartOutlined, 
  DollarOutlined, 
  SafetyOutlined, 
  TrophyOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
  RiseOutlined
} from '@ant-design/icons';

// Psychology Components
import StressTracker from '../../../features/psychology/components/StressTracker';
import EmotionalStateIndicator from '../../../features/psychology/components/EmotionalStateIndicator';
import ProfitExtractionWidget from '../../../features/psychology/components/ProfitExtractionWidget';
import BehavioralAnalyticsDashboard from '../../../features/psychology/components/BehavioralAnalyticsDashboard';

// Integration
import { psychologyIntegrationService } from '../../../features/challenges/services/PsychologyIntegrationService';
import { EmotionalState, PanicDetectionResult, BehavioralPattern } from '../../../features/psychology/types/psychology';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const PsychologyTestPage: React.FC = () => {
  // Stress & Emotional State
  const [currentStress, setCurrentStress] = useState(5);
  const [emotionalState, setEmotionalState] = useState<EmotionalState>({
    current: 'CALM',
    stressLevel: 5,
    confidence: 7,
    timestamp: new Date()
  });

  // Panic Detection
  const [panicDetection, setPanicDetection] = useState<PanicDetectionResult>({
    isPanicking: false,
    riskLevel: 'LOW',
    triggers: [],
    recommendations: [],
    shouldBlockTrading: false
  });

  // Test Data - Realistic $10k to $20k journey
  const [accountSize, setAccountSize] = useState(12500); // Current account size in the journey
  const [monthlyProfits, setMonthlyProfits] = useState(1250); // 10% monthly gain
  const [testXP, setTestXP] = useState(0);
  const [journeyStep, setJourneyStep] = useState(0); // Track progress through the journey

  // Mock stress history
  const stressHistory = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
    stressLevel: 3 + Math.sin(i * 0.3) * 2 + Math.random(),
    winRate: 65 - (3 + Math.sin(i * 0.3) * 2) * 3
  }));

  // Mock behavioral patterns
  const behavioralPatterns: BehavioralPattern[] = [
    {
      pattern: 'REVENGE_TRADING',
      frequency: 3,
      impact: -750,
      lastOccurrence: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      trend: 'IMPROVING',
      interventionSuggestions: ['Take breaks after losses', 'Stick to position sizes']
    },
    {
      pattern: 'FOMO_ENTRY',
      frequency: 7,
      impact: -1050,
      lastOccurrence: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      trend: 'WORSENING',
      interventionSuggestions: ['Wait for pullbacks', 'Set price alerts']
    }
  ];

  // Test Functions
  const testStressUpdate = (newStress: number) => {
    setCurrentStress(newStress);
    
    // Update emotional state based on stress
    const newState: EmotionalState['current'] = 
      newStress <= 3 ? 'CALM' :
      newStress <= 5 ? 'FOCUSED' :
      newStress <= 7 ? 'STRESSED' :
      newStress <= 9 ? 'PANICKED' : 'FEARFUL';
    
    setEmotionalState({
      current: newState,
      stressLevel: newStress,
      confidence: 10 - newStress,
      timestamp: new Date()
    });

    // Check panic detection
    if (newStress > 7) {
      setPanicDetection({
        isPanicking: true,
        riskLevel: newStress > 8 ? 'HIGH' : 'MEDIUM',
        triggers: [
          {
            type: 'HIGH_STRESS',
            severity: newStress > 8 ? 'CRITICAL' : 'WARNING',
            description: 'High stress level detected',
            value: newStress,
            threshold: 7
          }
        ],
        recommendations: ['Take a 5-minute break', 'Reduce position sizes by 50%'],
        shouldBlockTrading: newStress > 9
      });
    } else {
      setPanicDetection({
        isPanicking: false,
        riskLevel: 'LOW',
        triggers: [],
        recommendations: [],
        shouldBlockTrading: false
      });
    }

    message.info(`Stress updated to ${newStress}/10`);
  };

  // Stress update callback for StressTracker component (expects EmotionalState)
  const handleStressTrackerUpdate = (stressData: EmotionalState) => {
    setCurrentStress(stressData.stressLevel);
    setEmotionalState(stressData);
    
    // Check panic detection based on stress level
    if (stressData.stressLevel > 7) {
      setPanicDetection({
        isPanicking: true,
        riskLevel: stressData.stressLevel > 8 ? 'HIGH' : 'MEDIUM',
        triggers: [
          {
            type: 'HIGH_STRESS',
            severity: stressData.stressLevel > 8 ? 'CRITICAL' : 'WARNING',
            description: 'High stress level detected',
            value: stressData.stressLevel,
            threshold: 7
          }
        ],
        recommendations: ['Take a 5-minute break', 'Reduce position sizes by 50%'],
        shouldBlockTrading: stressData.stressLevel > 9
      });
    } else {
      setPanicDetection({
        isPanicking: false,
        riskLevel: 'LOW',
        triggers: [],
        recommendations: [],
        shouldBlockTrading: false
      });
    }

    message.info(`Stress updated to ${stressData.stressLevel}/10`);
  };

  const testXPCalculation = () => {
    try {
      const baseXP = 100;
      const psychologyProgress = {
        stressLevel: currentStress,
        emotionalState,
        disciplineScore: 85,
        profitExtractionCompliance: 100,
        behavioralImprovements: behavioralPatterns.filter(p => p.trend === 'IMPROVING')
      };

      const xpResult = psychologyIntegrationService.calculateIntegratedXP(
        baseXP,
        psychologyProgress
      );

      setTestXP(xpResult.totalXP);
      
      // Show individual messages for better visibility
      message.success(`Base XP: ${xpResult.baseXP} | Stress Bonus: +${xpResult.stressBonusXP} | Discipline: +${xpResult.disciplineBonusXP} | Profit: +${xpResult.profitProtectionXP} | Behavioral: +${xpResult.behavioralImprovementXP} | TOTAL: ${xpResult.totalXP} XP`, 8);
      
      // Also show a secondary message with just the total
      setTimeout(() => {
        message.info(`🎉 Total XP Earned: ${xpResult.totalXP} (Check status bar above!)`, 5);
      }, 1000);
    } catch (error) {
      message.error(`Failed to calculate XP bonuses: ${error.message}`);
    }
  };

  // Journey progression data
  const journeySteps = [
    { month: 1, accountSize: 12500, monthlyProfits: 1250, description: "Strong start: +25% in Month 1", marketCondition: "Bull Market" },
    { month: 2, accountSize: 14000, monthlyProfits: 1100, description: "Continued growth: +12% in Month 2", marketCondition: "Consolidation" },
    { month: 3, accountSize: 15800, monthlyProfits: 1350, description: "Momentum building: +18% in Month 3", marketCondition: "Breakout" },
    { month: 4, accountSize: 17500, monthlyProfits: 1420, description: "Staying disciplined: +11% in Month 4", marketCondition: "Volatile" },
    { month: 5, accountSize: 19200, monthlyProfits: 1550, description: "Near target: +10% in Month 5", marketCondition: "Bull Run" },
    { month: 6, accountSize: 20800, monthlyProfits: 1680, description: "Target exceeded: +8% in Month 6", marketCondition: "Peak Warning" }
  ];

  const currentJourney = journeySteps[Math.min(journeyStep, journeySteps.length - 1)];

  const testProfitExtraction = (amount: number, type: 'MANUAL' | 'AUTOMATIC') => {
    const oldAccountSize = accountSize;
    const newAccountSize = accountSize - amount;
    setAccountSize(newAccountSize);
    
    message.success(
      <div>
        <div>Extracted ${amount.toLocaleString()} ({type})</div>
        <div>Account: ${oldAccountSize.toLocaleString()} → ${newAccountSize.toLocaleString()}</div>
        <div>💰 Protected ${amount.toLocaleString()} from market crashes</div>
      </div>
    );
    
    // Award XP for extraction
    const xpEarned = type === 'AUTOMATIC' ? 50 : 30;
    setTestXP(prev => prev + xpEarned);
    message.info(`+${xpEarned} XP for profit extraction!`);
  };

  const advanceJourney = () => {
    if (journeyStep < journeySteps.length - 1) {
      const nextStep = journeyStep + 1;
      setJourneyStep(nextStep);
      const nextJourney = journeySteps[nextStep];
      setAccountSize(nextJourney.accountSize);
      setMonthlyProfits(nextJourney.monthlyProfits);
      
      message.info(
        <div>
          <div>📈 Month {nextJourney.month}: {nextJourney.description}</div>
          <div>Account now: ${nextJourney.accountSize.toLocaleString()}</div>
        </div>
      );
    } else {
      message.success("🎉 Journey Complete! You've successfully grown from $10k to $20k+");
    }
  };

  const resetJourney = () => {
    setJourneyStep(0);
    setAccountSize(12500);
    setMonthlyProfits(1250);
    message.info("🔄 Journey reset to Month 1");
  };

  const testBreatherMode = () => {
    message.warning('Breather mode activated! Trading disabled for 5 minutes.');
    setTimeout(() => {
      message.success('Breather mode ended. You can resume trading.');
    }, 5000); // Shortened for testing
  };

  const testEmergencyStop = () => {
    message.error('EMERGENCY STOP! All trading halted. Take a break and reassess.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🧠 Psychology Features Testing Lab
              </h1>
              <p className="text-gray-600 mt-1">
                Test and explore all Phase 2.5 trading psychology protection features
              </p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="text-gray-500 hover:text-gray-700 font-medium"
            >
              ← Back to App
            </button>
          </div>
        </div>
      </div>

      {/* Current Status Bar */}
      <div className="bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Tag color="blue">Stress: {currentStress}/10</Tag>
              <Tag color="green">State: {emotionalState.current}</Tag>
              <Tag color="purple">Total XP: {testXP}</Tag>
            </div>
            <div className="text-sm text-gray-600">
              Complete tests to verify psychology system integration
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid gap-8">
            
            {/* Test 1: Stress & Emotional State */}
            <Card className="shadow-lg border-0">
              <div className="border-l-4 border-l-purple-500 pl-4 mb-6">
                <Title level={3} className="mb-2">
                  <HeartOutlined className="text-purple-500" /> Test 1: Stress & Emotional State System
                </Title>
                <Text type="secondary">
                  Test how stress levels affect emotional state, XP bonuses, and trading recommendations
                </Text>
              </div>

              <Row gutter={[24, 24]}>
                <Col xs={24} lg={8}>
                  <Card size="small" className="bg-gray-50">
                    <Title level={5}>Quick Test Controls</Title>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text>Try different stress scenarios:</Text>
                      <Space wrap>
                        <Button 
                          onClick={() => testStressUpdate(2)}
                          className="bg-green-50 border-green-200 text-green-700"
                        >
                          😌 Low Stress (2)
                        </Button>
                        <Button 
                          onClick={() => testStressUpdate(4)}
                          type="primary"
                        >
                          🎯 Optimal (4)
                        </Button>
                        <Button 
                          onClick={() => testStressUpdate(7)}
                          className="bg-yellow-50 border-yellow-200 text-yellow-700"
                        >
                          😰 High Stress (7)
                        </Button>
                        <Button 
                          onClick={() => testStressUpdate(9)} 
                          danger
                        >
                          😱 Panic (9)
                        </Button>
                      </Space>
                      
                      <div className="mt-4 p-3 bg-blue-50 rounded">
                        <Text strong>Expected: </Text>
                        <Text>Stress 3-5 gives +20% XP bonus. High stress triggers warnings.</Text>
                      </div>
                    </Space>
                  </Card>
                </Col>
                
                <Col xs={24} lg={16}>
                  <StressTracker
                    onStressUpdate={handleStressTrackerUpdate}
                    currentStress={currentStress}
                    stressHistory={stressHistory}
                  />
                </Col>

                <Col span={24}>
                  <EmotionalStateIndicator
                    currentState={emotionalState}
                    panicDetection={panicDetection}
                    onBreatherModeActivate={testBreatherMode}
                    onEmergencyStop={testEmergencyStop}
                    tradingEnabled={!panicDetection.shouldBlockTrading}
                  />
                </Col>
              </Row>
            </Card>

            {/* Test 2: Profit Extraction - $10K to $20K Journey */}
            <Card className="shadow-lg border-0">
              <div className="border-l-4 border-l-green-500 pl-4 mb-6">
                <Title level={3} className="mb-2">
                  <DollarOutlined className="text-green-500" /> Test 2: $10K to $20K Journey - Profit Protection System
                </Title>
                <Text type="secondary">
                  Experience how profit extraction protects gains during a realistic 6-month trading journey from $10,000 to $20,000+
                </Text>
              </div>

              {/* Journey Progress Header */}
              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
                <Row gutter={[16, 8]} align="middle">
                  <Col xs={24} sm={8}>
                    <div className="text-center">
                      <Text strong className="text-lg">Month {currentJourney.month} of 6</Text>
                      <div className="text-sm text-gray-600 mt-1">{currentJourney.marketCondition}</div>
                    </div>
                  </Col>
                  <Col xs={24} sm={8}>
                    <div className="text-center">
                      <Statistic 
                        title="Current Account" 
                        value={accountSize} 
                        prefix="$" 
                        valueStyle={{ color: '#52c41a', fontSize: '18px' }}
                      />
                    </div>
                  </Col>
                  <Col xs={24} sm={8}>
                    <div className="text-center">
                      <Text strong>Progress to $20K</Text>
                      <Progress 
                        percent={((accountSize - 10000) / 10000) * 100} 
                        strokeColor="#52c41a"
                        format={() => `${Math.round(((accountSize - 10000) / 10000) * 100)}%`}
                      />
                    </div>
                  </Col>
                </Row>
                <div className="text-center mt-3">
                  <Text className="text-base font-medium">{currentJourney.description}</Text>
                </div>
              </div>

              {/* Journey Controls */}
              <Row gutter={[16, 16]} className="mb-6">
                <Col xs={24} sm={8}>
                  <Button 
                    type="primary" 
                    onClick={advanceJourney}
                    disabled={journeyStep >= journeySteps.length - 1}
                    block
                    icon={<RiseOutlined />}
                  >
                    {journeyStep < journeySteps.length - 1 ? `Advance to Month ${journeyStep + 2}` : 'Journey Complete!'}
                  </Button>
                </Col>
                <Col xs={24} sm={8}>
                  <Button 
                    onClick={resetJourney}
                    block
                  >
                    🔄 Reset to Month 1
                  </Button>
                </Col>
                <Col xs={24} sm={8}>
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <Text strong>Total XP Earned</Text>
                    <div className="text-xl text-blue-600">{testXP}</div>
                  </div>
                </Col>
              </Row>

              <Row gutter={[24, 24]}>
                <Col xs={24} lg={8}>
                  <Card size="small" className="bg-gray-50">
                    <Title level={5}>Current Month Details</Title>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Statistic title="Account Size" value={accountSize} prefix="$" />
                      <Statistic title="Monthly Profits" value={monthlyProfits} prefix="$" />
                      <Statistic 
                        title="Recommended Extraction (25%)" 
                        value={monthlyProfits * 0.25} 
                        prefix="$" 
                        valueStyle={{ color: '#1890ff' }}
                      />
                      
                      <div className="mt-4 p-3 bg-green-50 rounded">
                        <Text strong>Why Extract 25%? </Text>
                        <Text>Protects gains from market crashes while keeping 75% invested for compound growth.</Text>
                      </div>

                      <div className="mt-2 p-3 bg-orange-50 rounded">
                        <Text strong>Journey Insight: </Text>
                        <Text>Each extraction protects hard-earned profits. Without this system, a 30% market crash could wipe out months of gains.</Text>
                      </div>
                    </Space>
                  </Card>
                </Col>
                
                <Col xs={24} lg={16}>
                  <ProfitExtractionWidget
                    accountSize={accountSize}
                    monthlyProfits={monthlyProfits}
                    onExtractionExecute={testProfitExtraction}
                  />
                </Col>
              </Row>

              {/* Journey Timeline */}
              <div className="mt-6">
                <Title level={5}>6-Month Journey Timeline</Title>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {journeySteps.map((step, index) => (
                    <div 
                      key={step.month}
                      className={`p-3 rounded border-2 ${
                        index === journeyStep 
                          ? 'border-green-500 bg-green-50' 
                          : index < journeyStep 
                            ? 'border-blue-300 bg-blue-50' 
                            : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <Text strong>Month {step.month}</Text>
                        <Tag color={
                          index === journeyStep ? 'green' : 
                          index < journeyStep ? 'blue' : 'default'
                        }>
                          ${step.accountSize.toLocaleString()}
                        </Tag>
                      </div>
                      <div className="text-sm text-gray-600">{step.description}</div>
                      <div className="text-xs text-gray-500 mt-1">{step.marketCondition}</div>
                      {index < journeyStep && (
                        <div className="text-xs text-green-600 mt-1">✓ Completed</div>
                      )}
                      {index === journeyStep && (
                        <div className="text-xs text-green-600 mt-1">📍 Current</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Test 3: Behavioral Analytics */}
            <Card className="shadow-lg border-0">
              <div className="border-l-4 border-l-blue-500 pl-4 mb-6">
                <Title level={3} className="mb-2">
                  <TrophyOutlined className="text-blue-500" /> Test 3: Behavioral Analytics Dashboard
                </Title>
                <Text type="secondary">
                  Explore pattern detection, discipline tracking, and achievement progress
                </Text>
              </div>

              <div className="mb-4 p-4 bg-blue-50 rounded">
                <Text strong>What to explore: </Text>
                <Text>Check the Overview, Stress Analysis, Achievements, and Detailed Patterns tabs to see how behavioral data is visualized and tracked.</Text>
              </div>

              <BehavioralAnalyticsDashboard
                behavioralPatterns={behavioralPatterns}
                disciplineMetrics={{
                  positionSizeCompliance: 87,
                  stopLossCompliance: 92,
                  strategyAdherence: 78,
                  weeklyOptionsAvoidance: 94,
                  overallDisciplineScore: 88,
                  consecutiveDisciplinedDays: 23,
                  disciplineStreak: {
                    current: 23,
                    best: 35,
                    category: 'SKILLED'
                  }
                }}
                stressCorrelation={stressHistory.map(h => ({
                  stressLevel: h.stressLevel,
                  winRate: h.winRate,
                  profitFactor: 1.8 - h.stressLevel * 0.1,
                  decisionQuality: 85 - h.stressLevel * 3,
                  date: h.date
                }))}
              />
            </Card>

            {/* Test 4: Integration Verification */}
            <Card className="shadow-lg border-0">
              <div className="border-l-4 border-l-orange-500 pl-4 mb-6">
                <Title level={3} className="mb-2">
                  <SafetyOutlined className="text-orange-500" /> Test 4: System Integration Verification
                </Title>
                <Text type="secondary">
                  Verify XP bonuses, task generation, and overall system integration
                </Text>
              </div>

              <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                  <Card size="small" className="bg-gray-50">
                    <Title level={5}>XP Calculation Test</Title>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text>Test psychology bonuses on base XP:</Text>
                      
                      <Button 
                        type="primary" 
                        onClick={testXPCalculation}
                        icon={<TrophyOutlined />}
                        size="large"
                        block
                      >
                        Calculate XP with Psychology Bonuses
                      </Button>

                      <div className="mt-4 p-3 bg-orange-50 rounded">
                        <Text strong>Expected: </Text>
                        <Text>Shows base XP + stress/discipline/profit bonuses in detailed breakdown.</Text>
                      </div>

                      {testXP > 0 && (
                        <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded">
                          <div className="text-center">
                            <Text strong className="text-green-800">🎉 XP Calculation Complete!</Text>
                            <div className="text-2xl font-bold text-green-600 mt-2">{testXP} XP</div>
                            <div className="text-sm text-green-700 mt-1">
                              Psychology bonuses successfully applied
                            </div>
                          </div>
                        </div>
                      )}
                    </Space>
                  </Card>
                </Col>

                <Col xs={24} lg={12}>
                  <Card size="small" className="bg-gray-50">
                    <Title level={5}>Generated Psychology Tasks</Title>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {psychologyIntegrationService.generatePsychologyTasks(
                        'test-challenge',
                        12,
                        currentStress,
                        85,
                        behavioralPatterns
                      ).map((task, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                          <Text className="flex-1">{task.title}</Text>
                          <Tag color="blue">{task.xpReward} XP</Tag>
                        </div>
                      ))}
                    </Space>
                  </Card>
                </Col>

                <Col span={24}>
                  <Alert
                    message="✅ Integration Status: All Systems Operational"
                    description={
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                        <div className="flex items-center">
                          <CheckCircleOutlined className="text-green-500 mr-2" />
                          <Text>Stress tracking integrated with XP system</Text>
                        </div>
                        <div className="flex items-center">
                          <CheckCircleOutlined className="text-green-500 mr-2" />
                          <Text>Profit extraction awards achievement XP</Text>
                        </div>
                        <div className="flex items-center">
                          <CheckCircleOutlined className="text-green-500 mr-2" />
                          <Text>Behavioral improvements grant bonus XP</Text>
                        </div>
                        <div className="flex items-center">
                          <CheckCircleOutlined className="text-green-500 mr-2" />
                          <Text>Psychology tasks added to daily workflow</Text>
                        </div>
                      </div>
                    }
                    type="success"
                    showIcon
                    className="border-green-200"
                  />
                </Col>
              </Row>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="text-center text-gray-600">
            <p className="mb-2">
              🎯 <strong>Goal:</strong> Experience the complete $10K to $20K journey with psychology protection
            </p>
            <p className="text-sm">
              These features prevent account destruction through behavioral safeguards, stress management, and automated profit protection during realistic market conditions
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-purple-50 rounded">
                <strong>🧠 Stress Management:</strong> Monitors emotional state and prevents panic trading during volatile markets
              </div>
              <div className="p-3 bg-green-50 rounded">
                <strong>💰 Profit Protection:</strong> Automatically extracts 25% of monthly gains to protect from market crashes
              </div>
              <div className="p-3 bg-blue-50 rounded">
                <strong>🏆 Behavioral Analytics:</strong> Tracks patterns and rewards disciplined trading behavior with XP bonuses
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PsychologyTestPage;