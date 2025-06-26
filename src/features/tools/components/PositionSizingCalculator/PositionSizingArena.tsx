import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Progress, Input, InputNumber, Modal, Typography, Space, Tag, message, Alert, Select } from 'antd';
import { 
  TrophyOutlined, 
  ThunderboltOutlined, 
  DollarOutlined,
  LineChartOutlined,
  QuestionCircleOutlined,
  FireOutlined,
  SafetyOutlined,
  RocketOutlined,
  ExportOutlined,
  WarningOutlined,
  StopOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { PositionSizingCalculator, PositionSizingInput, PositionSizingResult } from '../../../../utils/finance/PositionSizingCalculator';
import { PositionSizeViolation, DisciplineMetrics } from '../../../psychology/types/psychology';

const { Title, Text, Paragraph } = Typography;

interface PositionSizingArenaProps {
  onCalculate?: (results: PositionSizingResult) => void;
  onXPEarned?: (xp: number) => void;
  onSaveCalculation?: (calculation: PositionSizingResult & { inputs: PositionSizingInput }) => void;
  onExportCalculation?: (calculation: PositionSizingResult & { inputs: PositionSizingInput }) => void;
  initialXP?: number;
}

const PositionSizingArena: React.FC<PositionSizingArenaProps> = ({ 
  onCalculate, 
  onXPEarned,
  onSaveCalculation,
  onExportCalculation,
  initialXP = 0 
}) => {
  // Game state
  const [xp, setXp] = useState(initialXP);
  const [level, setLevel] = useState(Math.floor(initialXP / 100) + 1);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoContent, setInfoContent] = useState({ title: '', content: '' });

  // Calculator inputs
  const [balance, setBalance] = useState(10000);
  const [winRate, setWinRate] = useState(55);
  const [avgWin, setAvgWin] = useState(2.5);
  const [avgLoss, setAvgLoss] = useState(1.5);
  const [vix, setVix] = useState(20);
  const [riskProfile, setRiskProfile] = useState<'conservative' | 'moderate' | 'aggressive'>('conservative');
  const [maxRiskPerTrade, setMaxRiskPerTrade] = useState<number | undefined>(undefined);

  // Calculation results
  const [results, setResults] = useState<PositionSizingResult | null>(null);
  const [dollarRisk, setDollarRisk] = useState(0);

  // Position Enforcement State
  const [positionBlocked, setPositionBlocked] = useState(false);
  const [violations, setViolations] = useState<PositionSizeViolation[]>([]);
  const [hardLimitsEnabled, setHardLimitsEnabled] = useState(true);
  const [disciplineScore, setDisciplineScore] = useState(85);
  const [weeklyOptionsSelected, setWeeklyOptionsSelected] = useState(false);
  const [optionExpiry, setOptionExpiry] = useState<'WEEKLY' | 'MONTHLY' | 'QUARTERLY'>('MONTHLY');

  // Calculate position size when inputs change
  useEffect(() => {
    try {
      const inputs: PositionSizingInput = {
        accountBalance: balance,
        winRate,
        avgWin,
        avgLoss,
        riskProfile,
        currentVIX: vix,
        maxRiskPerTrade
      };
      
      const result = PositionSizingCalculator.calculate(inputs);
      setResults(result);
      // Use the correct property name
      setDollarRisk(result?.riskAmount || 0);

      // Evaluate position enforcement
      evaluatePositionEnforcement(result);
    } catch (error) {
      console.error('Calculation error:', error);
      setResults(null);
      setDollarRisk(0);
    }
  }, [balance, winRate, avgWin, avgLoss, vix, riskProfile, maxRiskPerTrade, optionExpiry, hardLimitsEnabled]);

  // Position Enforcement Logic
  const evaluatePositionEnforcement = (result: PositionSizingResult | null) => {
    if (!result || !hardLimitsEnabled) {
      setViolations([]);
      setPositionBlocked(false);
      return;
    }

    const newViolations: PositionSizeViolation[] = [];
    let shouldBlock = false;

    // Calculate position size as percentage of account
    const positionSizePercent = (dollarRisk / balance) * 100;

    // Hard limit: Never exceed 2% of account
    if (positionSizePercent > 2) {
      newViolations.push({
        type: 'SIZE_EXCEEDED',
        severity: 'BLOCK',
        currentSize: positionSizePercent,
        maxAllowedSize: 2,
        suggestedSize: 2,
        reasoning: 'Position size exceeds 2% maximum limit',
        alternativeSuggestions: [
          'Reduce position size to 2% of account',
          'Use smaller position with same risk/reward setup',
          'Wait for better entry price'
        ]
      });
      shouldBlock = true;
    } else if (positionSizePercent > 1) {
      newViolations.push({
        type: 'SIZE_EXCEEDED',
        severity: 'WARNING',
        currentSize: positionSizePercent,
        maxAllowedSize: 1,
        reasoning: 'Position size exceeds recommended 1% limit',
        alternativeSuggestions: [
          'Consider reducing to 1% for better risk management',
          'Ensure stop loss is properly set',
          'Monitor position closely'
        ]
      });
    }

    // Weekly options addiction warning
    if (optionExpiry === 'WEEKLY') {
      newViolations.push({
        type: 'WEEKLY_OPTIONS_ADDICTION',
        severity: 'WARNING',
        currentSize: positionSizePercent,
        maxAllowedSize: positionSizePercent,
        reasoning: 'Weekly options are high-risk gambling instruments',
        alternativeSuggestions: [
          'Consider monthly options instead (30+ days to expiry)',
          'Weekly options have poor risk/reward profiles',
          'Focus on stocks or longer-term options'
        ]
      });
    }

    // VIX-based risk adjustment
    if (vix > 30 && positionSizePercent > 1) {
      newViolations.push({
        type: 'TOTAL_EXPOSURE_HIGH',
        severity: 'WARNING',
        currentSize: positionSizePercent,
        maxAllowedSize: 0.5,
        reasoning: `High VIX (${vix}) indicates increased market volatility`,
        alternativeSuggestions: [
          'Reduce position size during high volatility periods',
          'Consider waiting for VIX to normalize below 25',
          'Use wider stops to account for volatility'
        ]
      });
    }

    // Risk profile violation
    if (riskProfile === 'conservative' && positionSizePercent > 0.5) {
      newViolations.push({
        type: 'SIZE_EXCEEDED',
        severity: 'WARNING',
        currentSize: positionSizePercent,
        maxAllowedSize: 0.5,
        reasoning: 'Position size exceeds conservative risk profile limits',
        alternativeSuggestions: [
          'Conservative traders should risk <0.5% per trade',
          'Focus on high-probability setups only',
          'Build confidence with smaller positions first'
        ]
      });
    }

    setViolations(newViolations);
    setPositionBlocked(shouldBlock);

    // Update discipline score based on violations
    updateDisciplineScore(newViolations);
  };

  const updateDisciplineScore = (violations: PositionSizeViolation[]) => {
    let newScore = 100;
    
    violations.forEach(violation => {
      if (violation.severity === 'BLOCK') {
        newScore -= 30;
      } else if (violation.severity === 'WARNING') {
        newScore -= 10;
      }
    });

    // Weekly options penalty
    if (optionExpiry === 'WEEKLY') {
      newScore -= 15;
    }

    // VIX awareness bonus
    if (vix > 25 && (dollarRisk / balance) * 100 < 1) {
      newScore += 10;
    }

    setDisciplineScore(Math.max(0, Math.min(100, newScore)));
  };

  // Handle XP calculation and level up
  const calculateAndAwardXP = () => {
    let earnedXP = 15; // Base XP for using calculator
    
    if (riskProfile === 'conservative') {
      earnedXP += 25; // Bonus for conservative approach
      message.success('🛡️ +25 XP bonus for conservative risk management!');
    }
    
    const newTotalXP = xp + earnedXP;
    setXp(newTotalXP);
    
    // Check for level up
    const newLevel = Math.floor(newTotalXP / 100) + 1;
    if (newLevel > level) {
      setLevel(newLevel);
      message.success(`🎉 LEVEL UP! You're now Level ${newLevel}!`);
    } else {
      message.success(`⚡ +${earnedXP} XP earned!`);
    }
    
    if (onXPEarned) {
      onXPEarned(earnedXP);
    }
    
    if (onCalculate && results) {
      onCalculate(results);
    }

    // Auto-save the calculation
    if (onSaveCalculation && results) {
      const calculation = {
        ...results,
        inputs: {
          accountBalance: balance,
          winRate,
          avgWin,
          avgLoss,
          riskProfile,
          currentVIX: vix,
          maxRiskPerTrade
        }
      };
      onSaveCalculation(calculation);
    }
  };

  // Handle export functionality
  const handleExport = () => {
    if (onExportCalculation && results) {
      const calculation = {
        ...results,
        inputs: {
          accountBalance: balance,
          winRate,
          avgWin,
          avgLoss,
          riskProfile,
          currentVIX: vix,
          maxRiskPerTrade
        }
      };
      onExportCalculation(calculation);
    }
  };

  // Info popup handler
  const showInfo = (title: string, content: string) => {
    setInfoContent({ title, content });
    setShowInfoModal(true);
  };

  // Get VIX emoji based on level
  const getVIXEmoji = () => {
    if (vix < 15) return '😌';
    if (vix < 25) return '😐';
    if (vix < 35) return '😰';
    return '🔥';
  };

  // Get risk profile color
  const getRiskProfileColor = () => {
    switch (riskProfile) {
      case 'conservative': return '#52c41a';
      case 'moderate': return '#faad14';
      case 'aggressive': return '#ff4d4f';
    }
  };

  return (
    <div className="position-sizing-arena max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <Title level={1}>
          <FireOutlined /> Position Sizing Arena
        </Title>
        <Text type="secondary">Risk smart. Win more. Level up.</Text>
      </div>

      {/* XP Progress Bar */}
      <Card className="mb-6">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div className="flex justify-between items-center">
            <Text strong>Level {level} Trader</Text>
            <Tag color="gold">
              <TrophyOutlined /> {xp} XP
            </Tag>
          </div>
          <Progress 
            percent={xp % 100} 
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
            format={() => `${xp % 100}/100 XP`}
          />
          <Text type="secondary" className="text-xs">
            Level up at {Math.floor(xp / 100) * 100 + 100} XP
          </Text>
        </Space>
      </Card>

      {/* Main Calculator Card */}
      <Card 
        title={
          <Space>
            <ThunderboltOutlined />
            <span>Set Your Loadout</span>
          </Space>
        }
        className="mb-6"
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Account Balance */}
          <div>
            <Space className="mb-2">
              <Text strong>💰 Account Balance ($)</Text>
            </Space>
            <InputNumber
              style={{ width: '100%' }}
              value={balance}
              onChange={(value) => setBalance(value || 0)}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/\$\s?|(,*)/g, '')}
              min={0}
            />
          </div>

          {/* Win Rate */}
          <div>
            <Space className="mb-2">
              <Text strong>🎯 Win Rate (%)</Text>
              <QuestionCircleOutlined 
                className="cursor-pointer text-blue-500"
                onClick={() => showInfo(
                  'Win Rate',
                  'This is how often your trades are successful. 55% means 55 wins out of 100 trades.'
                )}
              />
            </Space>
            <InputNumber
              style={{ width: '100%' }}
              value={winRate}
              onChange={(value) => setWinRate(value || 0)}
              min={5}
              max={95}
              formatter={value => `${value}%`}
              parser={value => value!.replace('%', '')}
            />
          </div>

          {/* Average Win */}
          <div>
            <Space className="mb-2">
              <Text strong>💸 Average Win ($/share)</Text>
              <QuestionCircleOutlined 
                className="cursor-pointer text-blue-500"
                onClick={() => showInfo(
                  'Average Win',
                  'How much you earn per share when your trade wins. E.g., $2.50/share = $250 on 100 shares.'
                )}
              />
            </Space>
            <InputNumber
              style={{ width: '100%' }}
              value={avgWin}
              onChange={(value) => setAvgWin(value || 0)}
              min={0}
              step={0.1}
              formatter={value => `$ ${value}`}
              parser={value => value!.replace('$ ', '')}
            />
          </div>

          {/* Average Loss */}
          <div>
            <Space className="mb-2">
              <Text strong>📉 Average Loss ($/share)</Text>
              <QuestionCircleOutlined 
                className="cursor-pointer text-blue-500"
                onClick={() => showInfo(
                  'Average Loss',
                  'How much you lose per share when a trade fails. E.g., $1.50/share = $150 on 100 shares.'
                )}
              />
            </Space>
            <InputNumber
              style={{ width: '100%' }}
              value={avgLoss}
              onChange={(value) => setAvgLoss(value || 0)}
              min={0}
              step={0.1}
              formatter={value => `$ ${value}`}
              parser={value => value!.replace('$ ', '')}
            />
          </div>

          {/* Market VIX */}
          <div>
            <Space className="mb-2">
              <Text strong>🌪 Market VIX {getVIXEmoji()}</Text>
              <QuestionCircleOutlined 
                className="cursor-pointer text-blue-500"
                onClick={() => showInfo(
                  'Market VIX',
                  'The fear index. Higher VIX = more market volatility = smaller position sizes.'
                )}
              />
            </Space>
            <InputNumber
              style={{ width: '100%' }}
              value={vix}
              onChange={(value) => setVix(value || 0)}
              min={0}
              max={100}
            />
          </div>

          {/* Risk Profile */}
          <div>
            <Text strong className="mb-2 block">🧪 Risk Profile</Text>
            <select 
              value={riskProfile} 
              onChange={(e) => setRiskProfile(e.target.value as any)}
              className="w-full p-2 rounded border border-gray-300"
              style={{ borderColor: getRiskProfileColor() }}
            >
              <option value="conservative">🟢 Conservative (0.5–1%)</option>
              <option value="moderate">🟡 Moderate (1–2%)</option>
              <option value="aggressive">🔴 Aggressive (2–3%)</option>
            </select>
          </div>

          {/* Max Risk Override */}
          <div>
            <Space className="mb-2">
              <Text strong>⚠️ Max Risk Override (%)</Text>
              <QuestionCircleOutlined 
                className="cursor-pointer text-blue-500"
                onClick={() => showInfo(
                  'Max Risk Override',
                  'Override the default risk profile limit. Maximum allowed is 5% per trade. Leave empty to use profile defaults.'
                )}
              />
            </Space>
            <InputNumber
              style={{ width: '100%' }}
              value={maxRiskPerTrade}
              onChange={setMaxRiskPerTrade}
              min={0}
              max={5}
              step={0.1}
              placeholder="Optional (max 5%)"
              formatter={value => value ? `${value}%` : ''}
              parser={value => value ? parseFloat(value.replace('%', '')) : undefined}
            />
          </div>

          <Space direction="horizontal" style={{ width: '100%' }}>
            <Button 
              type="primary" 
              size="large" 
              flex={1}
              icon={<ThunderboltOutlined />}
              onClick={calculateAndAwardXP}
              style={{ flex: 1 }}
            >
              Calculate & Earn XP
            </Button>
            {results && (
              <Button 
                size="large" 
                icon={<ExportOutlined />}
                onClick={handleExport}
                title="Export calculation"
              >
                Export
              </Button>
            )}
          </Space>
        </Space>
      </Card>

      {/* Results Card */}
      <Card 
        title={
          <Space>
            <DollarOutlined />
            <span>Your Risk Amount</span>
          </Space>
        }
        className="mb-6 text-center"
      >
        <Title level={2} style={{ color: getRiskProfileColor(), margin: 0 }}>
          ${(dollarRisk || 0).toFixed(2)} per trade
        </Title>
        {results && (
          <Text type="secondary">
            {(results.vixAdjustedSize || 0).toFixed(2)}% of account
          </Text>
        )}
      </Card>

      {/* Position Enforcement Card */}
      <Card 
        title={
          <Space>
            <SafetyOutlined />
            <span>Position Enforcement</span>
            <Tag color={hardLimitsEnabled ? 'green' : 'red'}>
              {hardLimitsEnabled ? 'ENABLED' : 'DISABLED'}
            </Tag>
          </Space>
        }
        className="mb-6"
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Discipline Score */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Text strong>Discipline Score</Text>
              <Text strong style={{ color: disciplineScore >= 80 ? '#52c41a' : disciplineScore >= 60 ? '#fa8c16' : '#ff4d4f' }}>
                {disciplineScore}/100
              </Text>
            </div>
            <Progress
              percent={disciplineScore}
              strokeColor={disciplineScore >= 80 ? '#52c41a' : disciplineScore >= 60 ? '#fa8c16' : '#ff4d4f'}
              showInfo={false}
            />
          </div>

          {/* Option Expiry Selection */}
          <div>
            <Text strong>Option Expiry (Weekly Options are High Risk!)</Text>
            <div className="mt-2">
              <Select
                value={optionExpiry}
                onChange={setOptionExpiry}
                style={{ width: '100%' }}
                size="large"
              >
                <Select.Option value="WEEKLY">
                  <Space>
                    <WarningOutlined style={{ color: '#ff4d4f' }} />
                    Weekly Options (HIGH RISK!)
                  </Space>
                </Select.Option>
                <Select.Option value="MONTHLY">
                  <Space>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    Monthly Options (Recommended)
                  </Space>
                </Select.Option>
                <Select.Option value="QUARTERLY">
                  <Space>
                    <SafetyOutlined style={{ color: '#1890ff' }} />
                    Quarterly Options (Conservative)
                  </Space>
                </Select.Option>
              </Select>
            </div>
          </div>

          {/* Hard Limits Toggle */}
          <div className="flex justify-between items-center">
            <Text strong>Hard Position Limits</Text>
            <Button
              type={hardLimitsEnabled ? 'primary' : 'default'}
              onClick={() => setHardLimitsEnabled(!hardLimitsEnabled)}
              icon={hardLimitsEnabled ? <CheckCircleOutlined /> : <StopOutlined />}
            >
              {hardLimitsEnabled ? 'Enabled' : 'Disabled'}
            </Button>
          </div>

          {/* Current Position Size Display */}
          {results && (
            <div>
              <div className="flex justify-between items-center">
                <Text strong>Current Position Size</Text>
                <Text 
                  strong 
                  style={{ 
                    color: ((dollarRisk / balance) * 100) > 2 ? '#ff4d4f' : 
                           ((dollarRisk / balance) * 100) > 1 ? '#fa8c16' : '#52c41a' 
                  }}
                >
                  {((dollarRisk / balance) * 100).toFixed(2)}% of account
                </Text>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Max recommended: 1% | Hard limit: 2%
              </div>
            </div>
          )}
        </Space>
      </Card>

      {/* Violations and Warnings Card */}
      {violations.length > 0 && (
        <Card 
          title={
            <Space>
              <WarningOutlined style={{ color: '#ff4d4f' }} />
              <span>Position Violations & Warnings</span>
            </Space>
          }
          className="mb-6"
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {violations.map((violation, index) => (
              <Alert
                key={index}
                message={violation.type.replace(/_/g, ' ')}
                description={
                  <div>
                    <div className="mb-2">{violation.reasoning}</div>
                    <div className="mb-2">
                      <Text strong>Current: </Text>
                      <Text>{violation.currentSize.toFixed(2)}%</Text>
                      {violation.maxAllowedSize && (
                        <>
                          <Text strong> | Max Allowed: </Text>
                          <Text>{violation.maxAllowedSize.toFixed(2)}%</Text>
                        </>
                      )}
                    </div>
                    {violation.alternativeSuggestions && (
                      <div>
                        <Text strong>Suggestions:</Text>
                        <ul className="mt-1 ml-4">
                          {violation.alternativeSuggestions.map((suggestion, i) => (
                            <li key={i} className="text-sm">{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                }
                type={violation.severity === 'BLOCK' ? 'error' : 'warning'}
                showIcon
                icon={violation.severity === 'BLOCK' ? <StopOutlined /> : <WarningOutlined />}
              />
            ))}
          </Space>
        </Card>
      )}

      {/* Position Blocked Warning */}
      {positionBlocked && hardLimitsEnabled && (
        <Card className="mb-6">
          <Alert
            message="POSITION BLOCKED"
            description="This position exceeds safe risk limits and has been blocked. Reduce position size or adjust parameters to continue."
            type="error"
            showIcon
            icon={<StopOutlined />}
            action={
              <Button 
                size="small" 
                danger 
                onClick={() => {
                  // Auto-adjust to 2% max
                  const maxRisk = balance * 0.02;
                  setMaxRiskPerTrade(2);
                  message.info('Auto-adjusted to 2% maximum risk');
                }}
              >
                Auto-Fix
              </Button>
            }
          />
        </Card>
      )}

      {/* Extra Info Card */}
      {results && (
        <Card title="📘 Extra Info (Nice to Know)">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div className="flex justify-between">
              <Text>📊 Kelly %:</Text>
              <Text strong>{((results.kellyFraction || 0) * 100).toFixed(2)}%</Text>
            </div>
            <div className="flex justify-between">
              <Text>🔄 Recommended Size:</Text>
              <Text strong>{(results.recommendedPositionSize || 0).toFixed(2)}%</Text>
            </div>
            <div className="flex justify-between">
              <Text>⚡ VIX Adjusted:</Text>
              <Text strong>{(results.vixAdjustedSize || 0).toFixed(2)}%</Text>
            </div>
            {results.validation?.warnings && results.validation.warnings.length > 0 && (
              <div className="mt-2">
                <Text type="warning">⚠️ Warnings:</Text>
                {results.validation.warnings.map((warning, index) => (
                  <div key={index}>
                    <Text type="warning" className="text-sm">• {warning}</Text>
                  </div>
                ))}
              </div>
            )}
          </Space>
        </Card>
      )}

      {/* Info Modal */}
      <Modal
        title={infoContent.title}
        open={showInfoModal}
        onOk={() => setShowInfoModal(false)}
        onCancel={() => setShowInfoModal(false)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setShowInfoModal(false)}>
            Got it!
          </Button>
        ]}
      >
        <p>{infoContent.content}</p>
      </Modal>
    </div>
  );
};

export default PositionSizingArena;