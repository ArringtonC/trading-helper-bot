import React, { useState } from 'react';
import { RiskCalculation } from '../../types/Tutorial';

interface RiskPercentageDemoProps {
  accountBalance: number;
  onComplete: () => void;
  onRiskChange?: (risk: number) => void;
}

const RiskPercentageDemo: React.FC<RiskPercentageDemoProps> = ({
  accountBalance = 6000,
  onComplete,
  onRiskChange
}) => {
  const [selectedRisk, setSelectedRisk] = useState(2);

  const calculateRiskMetrics = (riskPercent: number): RiskCalculation => {
    const riskAmount = accountBalance * (riskPercent / 100);
    const survivesLosses = Math.floor(100 / riskPercent);
    const monthsToZero = Math.floor(survivesLosses / 20); // Assuming 20 trades per month
    
    let safetyLevel: RiskCalculation['safetyLevel'];
    if (riskPercent <= 1) safetyLevel = 'very-safe';
    else if (riskPercent <= 2) safetyLevel = 'safe';
    else if (riskPercent <= 5) safetyLevel = 'moderate';
    else if (riskPercent <= 10) safetyLevel = 'risky';
    else safetyLevel = 'dangerous';

    return {
      riskAmount,
      survivesLosses,
      monthsToZero,
      safetyLevel
    };
  };

  const handleRiskChange = (newRisk: number) => {
    setSelectedRisk(newRisk);
    onRiskChange?.(newRisk);
  };

  const calculations = calculateRiskMetrics(selectedRisk);

  const getSafetyColor = (level: RiskCalculation['safetyLevel']) => {
    switch (level) {
      case 'very-safe': return '#28a745';
      case 'safe': return '#20c997';
      case 'moderate': return '#ffc107';
      case 'risky': return '#fd7e14';
      case 'dangerous': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getSafetyMessage = (level: RiskCalculation['safetyLevel']) => {
    switch (level) {
      case 'very-safe': return "🟢 Very Safe - You're nearly invincible!";
      case 'safe': return "🟡 Safe - Good survival rate";
      case 'moderate': return "🟠 Moderate Risk - Be careful";
      case 'risky': return "🔴 High Risk - Danger zone!";
      case 'dangerous': return "💀 Extremely Dangerous - Account killer!";
      default: return "Unknown risk level";
    }
  };

  const getHealthSegments = () => {
    const totalSegments = 20;
    const safeSegments = Math.min(totalSegments, Math.floor(calculations.survivesLosses / 5));
    
    return Array.from({ length: totalSegments }, (_, i) => (
      <div 
        key={i}
        className={`health-segment ${i < safeSegments ? 'safe' : 'danger'}`}
        style={{
          backgroundColor: i < safeSegments ? getSafetyColor(calculations.safetyLevel) : '#dc3545'
        }}
      />
    ));
  };

  return (
    <div className="risk-demo">
      <h4 className="demo-title">🎮 Risk Simulator</h4>
      <p className="demo-description">
        Drag the slider to see how risk percentage affects your account survival:
      </p>
      
      <div className="risk-slider-container">
        <div className="risk-slider">
          <input 
            type="range" 
            min="0.5" 
            max="15" 
            step="0.5"
            value={selectedRisk}
            onChange={(e) => handleRiskChange(Number(e.target.value))}
            className="slider"
            style={{
              background: `linear-gradient(to right, ${getSafetyColor(calculations.safetyLevel)} 0%, ${getSafetyColor(calculations.safetyLevel)} ${(selectedRisk / 15) * 100}%, #ddd ${(selectedRisk / 15) * 100}%, #ddd 100%)`
            }}
          />
          <div className="risk-display">
            <span className="risk-value">{selectedRisk}%</span>
            <span className="risk-label">Risk per Trade</span>
          </div>
        </div>
      </div>
      
      <div className="survival-stats">
        <div className="stat-card">
          <div className="stat-value">${calculations.riskAmount.toFixed(0)}</div>
          <div className="stat-label">Risk per trade</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{calculations.survivesLosses}</div>
          <div className="stat-label">Losing trades you can survive</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{calculations.monthsToZero}</div>
          <div className="stat-label">Months to zero (worst case)</div>
        </div>
      </div>
      
      <div className="risk-visualization">
        <div className="account-health-bar">
          {getHealthSegments()}
        </div>
        <p 
          className="risk-assessment"
          style={{ color: getSafetyColor(calculations.safetyLevel) }}
        >
          {getSafetyMessage(calculations.safetyLevel)}
        </p>
      </div>

      <div className="learning-insights">
        <h5>💡 What This Means:</h5>
        <ul>
          <li>
            <strong>Risk Amount:</strong> You'll lose ${calculations.riskAmount.toFixed(0)} on each bad trade
          </li>
          <li>
            <strong>Survival Rate:</strong> You can handle {calculations.survivesLosses} consecutive losses
          </li>
          <li>
            <strong>Time Buffer:</strong> Even with bad luck, you have {calculations.monthsToZero} months to improve
          </li>
        </ul>
      </div>
      
      <button 
        className={`complete-step ${selectedRisk > 5 ? 'disabled' : 'enabled'}`}
        onClick={onComplete}
        disabled={selectedRisk > 5}
      >
        {selectedRisk > 5 
          ? "Choose a safer risk level first! (≤5%)" 
          : "I understand risk percentages! ✅"
        }
      </button>
    </div>
  );
};

export default RiskPercentageDemo; 