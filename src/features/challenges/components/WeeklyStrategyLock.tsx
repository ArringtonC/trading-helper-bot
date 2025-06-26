/**
 * Weekly Strategy Class Lock System
 * Prevents mid-week strategy switching to build discipline
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Alert,
  Typography,
  Space,
  Tag,
  Modal,
  Progress,
  Statistic,
  Row,
  Col,
  message
} from 'antd';
import {
  LockOutlined,
  UnlockOutlined,
  WarningOutlined,
  TrophyOutlined,
  FireOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

export type StrategyClass = 'BUFFETT_GUARDIAN' | 'DALIO_WARRIOR' | 'SOROS_ASSASSIN' | 'LYNCH_SCOUT';

interface WeeklyStrategyLockProps {
  currentStrategy: StrategyClass;
  weekStartDate: Date;
  onStrategyChange?: (strategy: StrategyClass) => void;
  adherenceStreak?: number;
  masteryLevel?: number;
  className?: string;
}

const WeeklyStrategyLock: React.FC<WeeklyStrategyLockProps> = ({
  currentStrategy,
  weekStartDate,
  onStrategyChange,
  adherenceStreak = 0,
  masteryLevel = 1,
  className = ''
}) => {
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [selectedNewStrategy, setSelectedNewStrategy] = useState<StrategyClass>(currentStrategy);

  const getStrategyConfig = (strategy: StrategyClass) => {
    const configs = {
      BUFFETT_GUARDIAN: {
        name: 'Buffett Guardian',
        icon: '🛡️',
        color: '#52c41a',
        description: 'Value investing with defensive positioning'
      },
      DALIO_WARRIOR: {
        name: 'Dalio Warrior',
        icon: '⚔️',
        color: '#1890ff',
        description: 'Risk parity and trend-following'
      },
      SOROS_ASSASSIN: {
        name: 'Soros Assassin',
        icon: '🗡️',
        color: '#722ed1',
        description: 'Contrarian timing and market inefficiencies'
      },
      LYNCH_SCOUT: {
        name: 'Lynch Scout',
        icon: '🏹',
        color: '#fa8c16',
        description: 'Growth discovery and fundamental research'
      }
    };
    return configs[strategy];
  };

  const currentConfig = getStrategyConfig(currentStrategy);

  // Calculate days since week start
  const daysSinceWeekStart = Math.floor((new Date().getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemainingInWeek = Math.max(0, 7 - daysSinceWeekStart);
  const isWeekLocked = daysSinceWeekStart > 0 && daysRemainingInWeek > 0;

  // Calculate XP penalties for switching
  const calculateSwitchingPenalty = () => {
    const basePenalty = 50; // Base XP loss
    const streakPenalty = adherenceStreak * 25; // Penalty based on current streak
    const masteryPenalty = masteryLevel * 30; // Penalty based on mastery level
    return basePenalty + streakPenalty + masteryPenalty;
  };

  const switchingPenalty = calculateSwitchingPenalty();

  const handleStrategyChangeRequest = () => {
    if (!isWeekLocked) {
      // Allow free change on Sunday
      setShowChangeModal(true);
      return;
    }

    // Hard lock during the week with severe penalties
    Modal.confirm({
      title: 'Break Weekly Strategy Lock?',
      content: (
        <div>
          <Alert
            message="WARNING: SEVERE PENALTIES"
            description={`Breaking your weekly strategy commitment will result in:`}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <ul>
            <li><strong>XP Loss:</strong> -{switchingPenalty} XP penalty</li>
            <li><strong>Streak Reset:</strong> Current {adherenceStreak}-day streak lost</li>
            <li><strong>Mastery Reset:</strong> {currentConfig.name} progress reset</li>
            <li><strong>Achievement Loss:</strong> Strategy-specific achievements disabled</li>
          </ul>
          <Alert
            message="Most profitable traders stick to ONE strategy for months"
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        </div>
      ),
      okText: 'Yes, Break Lock (Accept Penalties)',
      cancelText: 'Stay Committed',
      okButtonProps: { danger: true },
      onOk: () => {
        setShowChangeModal(true);
      },
      onCancel: () => {
        message.success('Good choice! Discipline is the key to profitability.');
      }
    });
  };

  const confirmStrategyChange = () => {
    const penalties = [];
    
    if (isWeekLocked) {
      penalties.push(`-${switchingPenalty} XP`);
      penalties.push('Streak reset');
      penalties.push('Mastery progress lost');
    }

    if (onStrategyChange) {
      onStrategyChange(selectedNewStrategy);
    }

    setShowChangeModal(false);
    
    if (penalties.length > 0) {
      message.warning(`Strategy changed with penalties: ${penalties.join(', ')}`);
    } else {
      message.success('Strategy updated for new week!');
    }
  };

  const strategyOptions: StrategyClass[] = ['BUFFETT_GUARDIAN', 'DALIO_WARRIOR', 'SOROS_ASSASSIN', 'LYNCH_SCOUT'];

  return (
    <>
      <Card 
        className={`weekly-strategy-lock ${className}`}
        title={
          <Space>
            {isWeekLocked ? <LockOutlined style={{ color: '#ff4d4f' }} /> : <UnlockOutlined style={{ color: '#52c41a' }} />}
            <span>Weekly Strategy Lock</span>
            {isWeekLocked && <Tag color="red">LOCKED</Tag>}
          </Space>
        }
        extra={
          <Space>
            <Text type="secondary">
              {daysRemainingInWeek > 0 ? `${daysRemainingInWeek} days left` : 'Week complete'}
            </Text>
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          {/* Current Strategy Display */}
          <Col span={12}>
            <Card size="small" className="text-center">
              <div style={{ fontSize: '48px', marginBottom: 8 }}>
                {currentConfig.icon}
              </div>
              <Title level={4} style={{ color: currentConfig.color, margin: 0 }}>
                {currentConfig.name}
              </Title>
              <Text type="secondary" className="block">
                {currentConfig.description}
              </Text>
              
              <div className="mt-4">
                <Progress
                  type="circle"
                  percent={(masteryLevel / 10) * 100}
                  width={60}
                  strokeColor={currentConfig.color}
                  format={() => `${masteryLevel}/10`}
                />
                <div className="mt-2">
                  <Text strong>Mastery Level</Text>
                </div>
              </div>
            </Card>
          </Col>

          {/* Lock Status & Stats */}
          <Col span={12}>
            <div className="space-y-4">
              <Card size="small">
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="Adherence Streak"
                      value={adherenceStreak}
                      suffix="days"
                      prefix={<FireOutlined />}
                      valueStyle={{ color: '#fa8c16' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Week Progress"
                      value={Math.max(0, daysSinceWeekStart)}
                      suffix="/ 7 days"
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                </Row>
              </Card>

              {/* Lock Status Alert */}
              {isWeekLocked ? (
                <Alert
                  message="Strategy Locked for This Week"
                  description={`Committed to ${currentConfig.name} until Sunday. Switching now incurs ${switchingPenalty} XP penalty.`}
                  type="warning"
                  showIcon
                  icon={<LockOutlined />}
                />
              ) : (
                <Alert
                  message="Free Strategy Change Available"
                  description="Sunday planning period - you can change strategy without penalties."
                  type="success"
                  showIcon
                  icon={<UnlockOutlined />}
                />
              )}

              {/* Action Button */}
              <Button
                type={isWeekLocked ? "danger" : "primary"}
                block
                size="large"
                onClick={handleStrategyChangeRequest}
                icon={isWeekLocked ? <WarningOutlined /> : <UnlockOutlined />}
              >
                {isWeekLocked ? `Change Strategy (-${switchingPenalty} XP)` : 'Change Strategy'}
              </Button>
            </div>
          </Col>
        </Row>

        {/* Adherence Bonuses */}
        <div className="mt-4">
          <Title level={5}>Strategy Adherence Bonuses</Title>
          <Row gutter={8}>
            <Col span={6}>
              <Tag color={adherenceStreak >= 7 ? 'green' : 'default'}>
                7-day: +25 XP weekly
              </Tag>
            </Col>
            <Col span={6}>
              <Tag color={adherenceStreak >= 14 ? 'green' : 'default'}>
                14-day: +50 XP bonus
              </Tag>
            </Col>
            <Col span={6}>
              <Tag color={adherenceStreak >= 30 ? 'gold' : 'default'}>
                30-day: Class mastery
              </Tag>
            </Col>
            <Col span={6}>
              <Tag color={adherenceStreak >= 90 ? 'purple' : 'default'}>
                90-day: Legendary status
              </Tag>
            </Col>
          </Row>
        </div>
      </Card>

      {/* Strategy Change Modal */}
      <Modal
        title={isWeekLocked ? "Change Strategy (With Penalties)" : "Select New Strategy"}
        open={showChangeModal}
        onCancel={() => setShowChangeModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowChangeModal(false)}>
            Cancel
          </Button>,
          <Button 
            key="confirm" 
            type="primary" 
            danger={isWeekLocked}
            onClick={confirmStrategyChange}
            disabled={selectedNewStrategy === currentStrategy}
          >
            {isWeekLocked ? `Confirm Change (-${switchingPenalty} XP)` : 'Confirm Change'}
          </Button>
        ]}
        width={600}
      >
        {isWeekLocked && (
          <Alert
            message="Penalty Warning"
            description={`Changing strategy mid-week will result in ${switchingPenalty} XP loss and streak reset.`}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          {strategyOptions.map((strategy) => {
            const config = getStrategyConfig(strategy);
            const isSelected = selectedNewStrategy === strategy;
            const isCurrent = strategy === currentStrategy;
            
            return (
              <Card
                key={strategy}
                size="small"
                className={`cursor-pointer transition-all ${
                  isSelected ? 'border-blue-500 bg-blue-50' : 
                  isCurrent ? 'border-green-500 bg-green-50' : 
                  'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedNewStrategy(strategy)}
              >
                <div className="text-center">
                  <div style={{ fontSize: '32px', marginBottom: 8 }}>
                    {config.icon}
                  </div>
                  <Text strong style={{ color: config.color }}>
                    {config.name}
                  </Text>
                  <div className="mt-2">
                    <Text type="secondary" className="text-xs">
                      {config.description}
                    </Text>
                  </div>
                  {isCurrent && (
                    <Tag color="green" className="mt-2">
                      Current
                    </Tag>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </Modal>
    </>
  );
};

export default WeeklyStrategyLock;