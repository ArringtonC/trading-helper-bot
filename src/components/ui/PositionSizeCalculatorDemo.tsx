import React, { useState, useEffect } from 'react';
import { PositionSizeCalculation } from '../../types/Tutorial';

interface PositionSizeCalculatorDemoProps {
  initialAccount?: number;
  initialRisk?: number;
  onComplete: () => void;
  onCalculationChange?: (calculation: PositionSizeCalculation) => void;
}

const PositionSizeCalculatorDemo: React.FC<PositionSizeCalculatorDemoProps> = ({
  initialAccount = 6000,
  initialRisk = 1.5,
  onComplete,
  onCalculationChange
}) => {
  const [account, setAccount] = useState(initialAccount);
  const [risk, setRisk] = useState(initialRisk);
  const [maxLoss, setMaxLoss] = useState(200);

  const calculatePositionSize = (): PositionSizeCalculation => {
    const riskAmount = account * (risk / 100);
    const positionSize = riskAmount / maxLoss;
    const contracts = Math.floor(positionSize);
    const totalRisk = contracts * maxLoss;
    const actualRiskPercentage = (totalRisk / account) * 100;

    const formulaSteps = [
      `Step 1: Calculate risk amount = $${account.toLocaleString()} × ${risk}% = $${riskAmount.toFixed(0)}`,
      `Step 2: Calculate position size = $${riskAmount.toFixed(0)} ÷ $${maxLoss} = ${positionSize.toFixed(2)}`,
      `Step 3: Round down for safety = ${contracts} contracts`,
      `Step 4: Verify total risk = ${contracts} × $${maxLoss} = $${totalRisk.toLocaleString()} (${actualRiskPercentage.toFixed(1)}% of account)`
    ];

    return {
      positionSize,
      contracts,
      totalRisk,
      riskPercentage: actualRiskPercentage,
      formulaSteps
    };
  };

  const calculation = calculatePositionSize();

  useEffect(() => {
    onCalculationChange?.(calculation);
  }, [account, risk, maxLoss]);

  const getFormulaColor = (step: number) => {
    const colors = ['#007bff', '#28a745', '#ffc107', '#17a2b8'];
    return colors[step] || '#6c757d';
  };

  const isCalculationValid = calculation.contracts > 0 && calculation.riskPercentage <= 5;

  return (
    <div className="position-calc-demo">
      <h4 className="demo-title">🧮 Position Size Calculator</h4>
      
      <div className="formula-explanation">
        <h5>The Magic Formula:</h5>
        <div className="formula-visual">
          <div className="formula-parts">
            <span className="formula-part account" style={{ backgroundColor: '#007bff20', color: '#007bff' }}>
              Account Balance
            </span>
            <span className="operator">×</span>
            <span className="formula-part risk" style={{ backgroundColor: '#28a74520', color: '#28a745' }}>
              Risk %
            </span>
            <span className="operator">÷</span>
            <span className="formula-part loss" style={{ backgroundColor: '#ffc10720', color: '#ffc107' }}>
              Max Loss
            </span>
            <span className="operator">=</span>
            <span className="formula-part result" style={{ backgroundColor: '#17a2b820', color: '#17a2b8' }}>
              Position Size
            </span>
          </div>
        </div>
      </div>
      
      <div className="calculator-inputs">
        <div className="input-group">
          <label htmlFor="account-input">
            Account Balance: <strong>${account.toLocaleString()}</strong>
          </label>
          <input 
            id="account-input"
            type="range" 
            min="2000" 
            max="50000" 
            step="1000"
            value={account}
            onChange={(e) => setAccount(Number(e.target.value))}
            className="slider account-slider"
          />
          <div className="slider-labels">
            <span>$2K</span>
            <span>$50K</span>
          </div>
        </div>
        
        <div className="input-group">
          <label htmlFor="risk-input">
            Risk Percentage: <strong>{risk}%</strong>
          </label>
          <input 
            id="risk-input"
            type="range" 
            min="0.5" 
            max="5" 
            step="0.1"
            value={risk}
            onChange={(e) => setRisk(Number(e.target.value))}
            className="slider risk-slider"
          />
          <div className="slider-labels">
            <span>0.5%</span>
            <span>5%</span>
          </div>
        </div>
        
        <div className="input-group">
          <label htmlFor="loss-input">
            Max Loss per Contract: <strong>${maxLoss}</strong>
          </label>
          <input 
            id="loss-input"
            type="range" 
            min="50" 
            max="500" 
            step="25"
            value={maxLoss}
            onChange={(e) => setMaxLoss(Number(e.target.value))}
            className="slider loss-slider"
          />
          <div className="slider-labels">
            <span>$50</span>
            <span>$500</span>
          </div>
        </div>
      </div>
      
      <div className="calculation-result">
        <div className="calculation-steps">
          {calculation.formulaSteps.map((step, index) => (
            <div 
              key={index}
              className="calculation-step"
              style={{ 
                borderLeft: `4px solid ${getFormulaColor(index)}`,
                backgroundColor: `${getFormulaColor(index)}10`
              }}
            >
              {step}
            </div>
          ))}
        </div>
        
        <div className={`result-card ${isCalculationValid ? 'valid' : 'invalid'}`}>
          <h4>Your Position Size: {calculation.contracts} contracts</h4>
          <div className="result-details">
            <p>
              <strong>Total Risk:</strong> ${calculation.totalRisk.toLocaleString()} 
              ({calculation.riskPercentage.toFixed(1)}% of account)
            </p>
            <p>
              <strong>Risk per Contract:</strong> ${maxLoss}
            </p>
            <p>
              <strong>Safety Check:</strong> 
              <span className={calculation.riskPercentage <= 3 ? 'safe' : calculation.riskPercentage <= 5 ? 'moderate' : 'risky'}>
                {calculation.riskPercentage <= 3 ? ' ✅ Very Safe' : 
                 calculation.riskPercentage <= 5 ? ' ⚠️ Moderate Risk' : ' ❌ Too Risky'}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="learning-insights">
        <h5>💡 Key Insights:</h5>
        <ul>
          <li>
            <strong>Always round down:</strong> {calculation.positionSize.toFixed(2)} becomes {calculation.contracts} contracts for safety
          </li>
          <li>
            <strong>Verify your math:</strong> {calculation.contracts} × ${maxLoss} = ${calculation.totalRisk.toLocaleString()} total risk
          </li>
          <li>
            <strong>Stay disciplined:</strong> Never exceed your planned risk percentage
          </li>
        </ul>
      </div>
      
      <div className="understanding-check">
        <p className="check-question">
          <strong>Quick Check:</strong> If this trade goes completely wrong, you'll lose ${calculation.totalRisk.toLocaleString()}. 
          Can you handle that emotionally and financially?
        </p>
        <button 
          className={`complete-step ${!isCalculationValid ? 'disabled' : 'enabled'}`}
          onClick={onComplete}
          disabled={!isCalculationValid}
        >
          {!isCalculationValid 
            ? calculation.contracts === 0 
              ? "Increase account size or reduce max loss!" 
              : "Reduce risk - this is too dangerous!"
            : "Yes, I can handle that risk! ✅"
          }
        </button>
      </div>
    </div>
  );
};

export default PositionSizeCalculatorDemo; 