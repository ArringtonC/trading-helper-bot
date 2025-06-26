import React, { useState, useCallback } from 'react';
import { Breadcrumb, Card, Space, Typography, Button, message, Modal } from 'antd';
import { Link } from 'react-router-dom';
import { HomeOutlined, CalculatorOutlined, TrophyOutlined, FireOutlined } from '@ant-design/icons';
import PositionSizingArena from '../../../features/tools/components/PositionSizingCalculator/PositionSizingArena';
import { PositionSizingInput, PositionSizingResult } from '../../../utils/finance/PositionSizingCalculator';

const { Title, Paragraph, Text } = Typography;

interface CalculationHistory {
  id: string;
  timestamp: Date;
  inputs: PositionSizingInput;
  results: PositionSizingResult;
}

const PositionSizingCalculatorPage: React.FC = () => {
  const [calculationHistory, setCalculationHistory] = useState<CalculationHistory[]>([]);
  const [showXPModal, setShowXPModal] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);
  const [totalXP, setTotalXP] = useState(() => {
    const saved = localStorage.getItem('positionCalculatorXP');
    return saved ? parseInt(saved, 10) : 0;
  });

  const handleSaveCalculation = useCallback((calculation: PositionSizingResult & { inputs: PositionSizingInput }) => {
    const newCalculation: CalculationHistory = {
      id: Date.now().toString(),
      timestamp: new Date(),
      inputs: calculation.inputs,
      results: calculation
    };

    setCalculationHistory(prev => [newCalculation, ...prev.slice(0, 9)]); // Keep last 10

    // Award XP for usage
    let xpAwarded = 15; // Base XP for using calculator
    
    // Bonus XP for conservative settings
    if (calculation.inputs.riskProfile === 'conservative') {
      xpAwarded += 25;
    }

    setEarnedXP(xpAwarded);
    setShowXPModal(true);

    message.success(`Calculation saved! You earned ${xpAwarded} XP!`);

    // Store in localStorage for persistence
    try {
      localStorage.setItem('positionSizingCalculations', JSON.stringify([newCalculation, ...calculationHistory.slice(0, 9)]));
    } catch (error) {
      console.warn('Could not save to localStorage:', error);
    }
  }, [calculationHistory]);

  const handleExportCalculation = useCallback((calculation: PositionSizingResult & { inputs: PositionSizingInput }) => {
    const exportData = {
      timestamp: new Date().toISOString(),
      inputs: calculation.inputs,
      results: {
        recommendedPositionSize: calculation.recommendedPositionSize,
        vixAdjustedSize: calculation.vixAdjustedSize,
        riskAmount: calculation.riskAmount,
        kellyFraction: calculation.kellyFraction,
        fractionalKelly: calculation.fractionalKelly,
        maxPositionSize: calculation.maxPositionSize,
        riskProfile: calculation.riskProfile.name
      }
    };

    // Create downloadable file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `position-sizing-calculation-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    message.success('Calculation exported successfully!');
  }, []);

  // Handler for arena mode XP
  const handleArenaXPEarned = useCallback((xp: number) => {
    const newTotal = totalXP + xp;
    setTotalXP(newTotal);
    localStorage.setItem('positionCalculatorXP', newTotal.toString());
  }, [totalXP]);

  // Handler for arena calculation
  const handleArenaCalculation = useCallback((results: PositionSizingResult) => {
    // Convert to the format expected by save calculation
    const calculation = {
      ...results,
      inputs: {
        accountBalance: 10000, // We'll need to pass these through properly
        winRate: 55,
        avgWin: 2.5,
        avgLoss: 1.5,
        riskProfile: 'conservative' as const,
        currentVIX: 20
      }
    };
    
    // Save to history
    handleSaveCalculation(calculation);
  }, [handleSaveCalculation]);

  // Load calculation history from localStorage on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('positionSizingCalculations');
      if (saved) {
        const parsed = JSON.parse(saved);
        setCalculationHistory(parsed.map((calc: any) => ({
          ...calc,
          timestamp: new Date(calc.timestamp)
        })));
      }
    } catch (error) {
      console.warn('Could not load from localStorage:', error);
    }
  }, []);

  return (
    <div className="position-sizing-calculator-page">
      {/* Breadcrumb Navigation */}
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item>
          <Link to="/">
            <HomeOutlined />
            <span className="ml-1">Home</span>
          </Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <CalculatorOutlined />
          <span className="ml-1">Tools</span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>Position Sizing Calculator</Breadcrumb.Item>
      </Breadcrumb>

      {/* Page Header */}
      <Card className="mb-6">
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div className="flex justify-between items-start">
            <div className="flex-grow">
              <Title level={2} className="mb-2">
                <FireOutlined className="mr-2" />
                Position Sizing Arena
              </Title>
              <Paragraph className="text-lg text-gray-600">
                Risk smart. Win more. Level up. Transform your trading with gamified position sizing!
              </Paragraph>
              <Space>
                <Text type="secondary">💡 <strong>Tip:</strong> Use conservative settings to earn bonus XP!</Text>
                <Text type="secondary">🏆 <strong>Rewards:</strong> 15 XP per calculation, +25 XP for conservative profiles</Text>
              </Space>
            </div>
            <div className="ml-4">
              <Space direction="vertical" align="center">
                <Text>Total XP</Text>
                <Text strong style={{ fontSize: '24px' }}>{totalXP}</Text>
                <Text type="secondary" className="text-xs">Level {Math.floor(totalXP / 100) + 1}</Text>
              </Space>
            </div>
          </div>
        </Space>
      </Card>

      {/* Arena Interface */}
      <PositionSizingArena
        onCalculate={handleArenaCalculation}
        onXPEarned={handleArenaXPEarned}
        onSaveCalculation={handleSaveCalculation}
        onExportCalculation={handleExportCalculation}
        initialXP={totalXP}
      />

      {/* Recent Calculations History */}
      {calculationHistory.length > 0 && (
        <Card title="Recent Calculations" className="mt-6">
          <div className="space-y-3">
            {calculationHistory.slice(0, 5).map((calc) => (
              <div key={calc.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <Text strong>
                      ${calc.inputs.accountBalance.toLocaleString()} account, {calc.inputs.winRate}% win rate
                    </Text>
                    <br />
                    <Text type="secondary">
                      Risk Profile: {calc.inputs.riskProfile} | 
                      Recommended: {calc.results.recommendedPositionSize.toFixed(2)}% | 
                      Risk Amount: ${calc.results.riskAmount.toFixed(2)}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {calc.timestamp.toLocaleString()}
                    </Text>
                  </div>
                  <Button 
                    size="small" 
                    onClick={() => handleExportCalculation({ ...calc.results, inputs: calc.inputs })}
                  >
                    Export
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* XP Award Modal */}
      <Modal
        title={
          <Space>
            <TrophyOutlined style={{ color: '#faad14' }} />
            <span>XP Earned!</span>
          </Space>
        }
        open={showXPModal}
        onOk={() => setShowXPModal(false)}
        onCancel={() => setShowXPModal(false)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setShowXPModal(false)}>
            Awesome!
          </Button>
        ]}
      >
        <div className="text-center py-4">
          <div className="text-4xl mb-4">🎉</div>
          <Title level={3}>+{earnedXP} XP</Title>
          <Paragraph>
            Great job using the Position Sizing Calculator! You're building good risk management habits.
          </Paragraph>
          {earnedXP > 15 && (
            <Paragraph>
              <Text type="success">
                <strong>Bonus XP earned for using conservative settings!</strong>
              </Text>
            </Paragraph>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default PositionSizingCalculatorPage;