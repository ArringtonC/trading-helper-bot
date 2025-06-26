/**
 * Monday Range Quest Component
 * 
 * Interactive quest for calculating Monday range and setting up battle zones
 * Integrates with Sunday Planning Quest and Challenge RPG system
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Steps,
  Button,
  Row,
  Col,
  Statistic,
  Alert,
  Typography,
  Space,
  Tag,
  Progress,
  notification,
  Tooltip,
  Badge
} from 'antd';
import {
  AimOutlined,
  CalculatorOutlined,
  BellOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  FireOutlined,
  WarningOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { MondayRangeCalculator, MondayRangeData } from '../../market-data/services/MondayRangeCalculator';

const { Title, Text } = Typography;
const { Step } = Steps;

interface MondayRangeQuestProps {
  symbol?: string;
  onQuestComplete?: (xpEarned: number, rangeData: MondayRangeData) => void;
  onXPUpdate?: (xp: number, source: string) => void;
  className?: string;
}

const MondayRangeQuest: React.FC<MondayRangeQuestProps> = ({
  symbol = 'SPY',
  onQuestComplete,
  onXPUpdate,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [mondayRange, setMondayRange] = useState<MondayRangeData | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [questComplete, setQuestComplete] = useState(false);
  const [totalXP, setTotalXP] = useState(0);
  const [stepProgress, setStepProgress] = useState<boolean[]>([false, false, false, false]);

  const calculator = MondayRangeCalculator.getInstance();

  const questSteps = [
    {
      title: 'Calculate Range',
      description: 'Calculate Monday\'s battlefield range',
      xpReward: 15,
      icon: <CalculatorOutlined />
    },
    {
      title: 'Analyze Volatility',
      description: 'Determine Boss Battle vs Standard mode',
      xpReward: 10,
      icon: <FireOutlined />
    },
    {
      title: 'Set Breakout Alerts',
      description: 'Configure breakout monitoring system',
      xpReward: 15,
      icon: <BellOutlined />
    },
    {
      title: 'Battle Preparation',
      description: 'Complete Monday range setup',
      xpReward: 10,
      icon: <AimOutlined />
    }
  ];

  const executeStep = async (stepIndex: number) => {
    setIsCalculating(true);

    try {
      switch (stepIndex) {
        case 0:
          await executeRangeCalculation();
          break;
        case 1:
          await executeVolatilityAnalysis();
          break;
        case 2:
          await executeBreakoutSetup();
          break;
        case 3:
          await completeBattlePreparation();
          break;
      }

      // Mark step as complete and award XP
      const newProgress = [...stepProgress];
      newProgress[stepIndex] = true;
      setStepProgress(newProgress);

      const stepXP = questSteps[stepIndex].xpReward;
      const newTotalXP = totalXP + stepXP;
      setTotalXP(newTotalXP);

      if (onXPUpdate) {
        onXPUpdate(stepXP, `Monday Range Quest - ${questSteps[stepIndex].title}`);
      }

      notification.success({
        message: `Step ${stepIndex + 1} Complete!`,
        description: `+${stepXP} XP earned for ${questSteps[stepIndex].title}`,
        icon: <TrophyOutlined style={{ color: '#52c41a' }} />
      });

      // Move to next step
      if (stepIndex < questSteps.length - 1) {
        setCurrentStep(stepIndex + 1);
      } else {
        // Quest complete
        setQuestComplete(true);
        if (onQuestComplete && mondayRange) {
          onQuestComplete(newTotalXP, mondayRange);
        }
        
        notification.success({
          message: '🎉 Monday Range Quest Complete!',
          description: `Total XP earned: ${newTotalXP}. Battle zones are now active!`,
          duration: 0
        });
      }

    } catch (error) {
      notification.error({
        message: 'Quest Step Failed',
        description: 'There was an error executing this step. Please try again.'
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const executeRangeCalculation = async () => {
    // Simulate calculation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const range = await calculator.calculateMondayRange(symbol);
    setMondayRange(range);
  };

  const executeVolatilityAnalysis = async () => {
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (mondayRange) {
      const analysis = calculator.analyzeRange(mondayRange);
      console.log('Volatility analysis complete:', analysis);
    }
  };

  const executeBreakoutSetup = async () => {
    // Simulate setup delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In production, this would configure real alerts
    console.log('Breakout alerts configured');
  };

  const completeBattlePreparation = async () => {
    // Simulate final preparation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('Battle preparation complete');
  };

  const getVolatilityModeInfo = () => {
    if (!mondayRange) return null;

    const isBossBattle = mondayRange.volatilityMode === 'BOSS_BATTLE';
    return {
      mode: mondayRange.volatilityMode,
      color: isBossBattle ? '#ff4d4f' : '#1890ff',
      icon: isBossBattle ? '🔥' : '⚔️',
      description: isBossBattle 
        ? 'High volatility detected - reduce position sizes by 50%'
        : 'Normal volatility - standard position sizing applies'
    };
  };

  const volatilityInfo = getVolatilityModeInfo();

  return (
    <Card 
      className={`monday-range-quest ${className}`}
      title={
        <Space>
          <AimOutlined />
          <span>Monday Range Quest</span>
          {questComplete && <Badge count="COMPLETE" style={{ backgroundColor: '#52c41a' }} />}
        </Space>
      }
      extra={
        <Space>
          <Text strong>Total XP: {totalXP}</Text>
          {volatilityInfo && (
            <Tag color={volatilityInfo.color === '#ff4d4f' ? 'red' : 'blue'}>
              {volatilityInfo.icon} {volatilityInfo.mode}
            </Tag>
          )}
        </Space>
      }
    >
      {/* Quest Progress */}
      <div className="mb-6">
        <Steps 
          current={currentStep} 
          size="small"
          items={questSteps.map((step, index) => ({
            title: step.title,
            description: `+${step.xpReward} XP`,
            icon: stepProgress[index] ? <CheckCircleOutlined /> : step.icon,
            status: stepProgress[index] ? 'finish' : index === currentStep ? 'process' : 'wait'
          }))}
        />
      </div>

      {/* Current Step Details */}
      {!questComplete && (
        <Card size="small" className="mb-6">
          <Row align="middle" gutter={[16, 16]}>
            <Col span={16}>
              <Title level={4} className="m-0">
                {questSteps[currentStep].icon} {questSteps[currentStep].title}
              </Title>
              <Text type="secondary">
                {questSteps[currentStep].description}
              </Text>
            </Col>
            <Col span={8} className="text-right">
              <Button 
                type="primary" 
                size="large"
                loading={isCalculating}
                onClick={() => executeStep(currentStep)}
                icon={<ThunderboltOutlined />}
              >
                Execute (+{questSteps[currentStep].xpReward} XP)
              </Button>
            </Col>
          </Row>
        </Card>
      )}

      {/* Range Results */}
      {mondayRange && (
        <Card size="small" className="mb-4" title="📊 Monday Range Results">
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Statistic
                title="Range Size"
                value={mondayRange.range}
                precision={2}
                suffix="pts"
                valueStyle={{ 
                  color: mondayRange.volatilityMode === 'BOSS_BATTLE' ? '#ff4d4f' : '#52c41a' 
                }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Monday High"
                value={mondayRange.high}
                prefix="$"
                precision={2}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Monday Low"
                value={mondayRange.low}
                prefix="$"
                precision={2}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Upper Breakout"
                value={mondayRange.breakoutLevels.upperBreakout}
                prefix="$"
                precision={2}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
          </Row>

          {volatilityInfo && (
            <Alert
              message={volatilityInfo.mode}
              description={volatilityInfo.description}
              type={volatilityInfo.mode === 'BOSS_BATTLE' ? 'warning' : 'info'}
              showIcon
              icon={volatilityInfo.mode === 'BOSS_BATTLE' ? <WarningOutlined /> : <CheckCircleOutlined />}
              className="mt-4"
            />
          )}
        </Card>
      )}

      {/* Quest Complete Summary */}
      {questComplete && (
        <Card size="small">
          <Row align="middle" gutter={[16, 16]}>
            <Col span={16}>
              <Space direction="vertical">
                <Title level={4} className="m-0">
                  🎉 Quest Complete!
                </Title>
                <Text>
                  Monday range analysis complete. Battle zones are now active for the week.
                </Text>
                <Space>
                  <Tag color="green">Range Calculated</Tag>
                  <Tag color="blue">Alerts Configured</Tag>
                  <Tag color="purple">Battle Ready</Tag>
                </Space>
              </Space>
            </Col>
            <Col span={8} className="text-right">
              <Statistic
                title="Total XP Earned"
                value={totalXP}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#52c41a', fontSize: '24px' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* Battle Recommendations */}
      {mondayRange && questComplete && (
        <Card size="small" className="mt-4" title="⚔️ Battle Recommendations">
          <ul>
            <li>{mondayRange.recommendedStrategy}</li>
            <li>Monitor breakout levels: ${mondayRange.breakoutLevels.upperBreakout.toFixed(2)} (up) / ${mondayRange.breakoutLevels.lowerBreakout.toFixed(2)} (down)</li>
            <li>Target zones: ${mondayRange.breakoutLevels.upperTarget1.toFixed(2)} and ${mondayRange.breakoutLevels.lowerTarget1.toFixed(2)}</li>
            <li>Market condition: {mondayRange.marketCondition} - adjust strategy accordingly</li>
          </ul>
        </Card>
      )}
    </Card>
  );
};

export default MondayRangeQuest;