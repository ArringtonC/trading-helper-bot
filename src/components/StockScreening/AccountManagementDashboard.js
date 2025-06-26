import React, { useState, useEffect } from 'react';
import AccountLevelSystem from '../../services/account/AccountLevelSystem';
import RiskIndicator from './RiskIndicator';
import ProgressiveDisclosure from './ProgressiveDisclosure';

/**
 * Account Management Dashboard
 * Displays account tier information, position sizing guidelines, and regulatory compliance
 * 
 * Features:
 * - Account tier visualization with upgrade paths
 * - Real-time position sizing calculations
 * - Regulatory compliance monitoring
 * - Risk management recommendations
 * - Performance-based tier adjustments
 */
const AccountManagementDashboard = ({
  accountData,
  onAccountUpdate,
  showPositionSizing = true,
  showComplianceWarnings = true,
  className = ''
}) => {
  const [accountSystem] = useState(() => new AccountLevelSystem());
  const [accountLevel, setAccountLevel] = useState(null);
  const [positionCalculations, setPositionCalculations] = useState({});
  const [selectedStock, setSelectedStock] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);

  useEffect(() => {
    if (accountData) {
      const level = accountSystem.determineLevel(accountData);
      setAccountLevel(level);
      
      if (onAccountUpdate) {
        onAccountUpdate(level);
      }
    }
  }, [accountData, accountSystem, onAccountUpdate]);

  const calculatePositionSize = (stockData) => {
    if (!accountLevel || !accountData) return null;
    
    const calculation = accountSystem.calculateMaxPositionSize(
      accountLevel,
      stockData,
      accountData.accountBalance
    );
    
    setPositionCalculations(prev => ({
      ...prev,
      [stockData.symbol]: calculation
    }));
    
    return calculation;
  };

  const handleStockSelection = (stockData) => {
    setSelectedStock(stockData);
    calculatePositionSize(stockData);
  };

  const renderAccountTier = () => {
    if (!accountLevel) return null;
    
    const { tier, complianceChecks, upgradeThresholds } = accountLevel;
    
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Account Status</h2>
          <div className="flex items-center">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: tier.color }}
            />
            <span className="font-medium text-gray-900">{tier.name}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Account Balance</div>
            <div className="text-lg font-semibold text-gray-900">
              ${accountData.accountBalance?.toLocaleString()}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Max Position Size</div>
            <div className="text-lg font-semibold text-gray-900">
              {accountLevel.adjustedMetrics?.maxPositionPercent?.toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Risk Per Trade</div>
            <div className="text-lg font-semibold text-gray-900">
              {accountLevel.adjustedMetrics?.riskPerTrade?.toFixed(1)}%
            </div>
          </div>
        </div>
        
        {/* Account Features */}
        <ProgressiveDisclosure
          title="Account Features & Restrictions"
          variant="grouped"
          className="mb-4"
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Available Features</h4>
              <div className="space-y-2">
                {Object.entries(tier.features).map(([feature, enabled]) => (
                  <div key={feature} className="flex items-center justify-between">
                    <span className="text-gray-700 capitalize">
                      {feature.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <div className="flex items-center">
                      {enabled === true ? (
                        <span className="text-green-600">✓ Enabled</span>
                      ) : enabled === false ? (
                        <span className="text-red-600">✗ Disabled</span>
                      ) : (
                        <span className="text-yellow-600">⚠ {enabled}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {tier.restrictions.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Current Restrictions</h4>
                <div className="space-y-1">
                  {tier.restrictions.map((restriction, index) => (
                    <div key={index} className="text-sm text-orange-600">
                      • {restriction.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ProgressiveDisclosure>
        
        {/* Upgrade Information */}
        {upgradeThresholds && (
          <ProgressiveDisclosure
            title="Upgrade to Next Tier"
            variant="inline"
            className="border-blue-200 bg-blue-50"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-blue-800 font-medium">
                  Next Tier: {upgradeThresholds.nextTier.name}
                </span>
                <span className="text-blue-600">
                  ${upgradeThresholds.balanceRequired.toLocaleString()} required
                </span>
              </div>
              
              <div className="text-sm text-blue-700">
                Additional features you'll unlock:
                <ul className="list-disc list-inside ml-2 mt-1">
                  {upgradeThresholds.additionalFeatures.map((feature, index) => (
                    <li key={index}>
                      {feature.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (accountData.accountBalance / upgradeThresholds.balanceRequired) * 100)}%`
                  }}
                />
              </div>
              
              <div className="text-xs text-blue-600">
                ${(upgradeThresholds.balanceRequired - accountData.accountBalance).toLocaleString()} 
                {' '}remaining to upgrade
              </div>
            </div>
          </ProgressiveDisclosure>
        )}
      </div>
    );
  };

  const renderComplianceWarnings = () => {
    if (!showComplianceWarnings || !accountLevel?.complianceChecks) return null;
    
    const { complianceChecks } = accountLevel;
    const hasWarnings = complianceChecks.warnings.length > 0;
    
    if (!hasWarnings) return null;
    
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-yellow-600 text-xl">⚠️</span>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Regulatory Compliance Warnings
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc list-inside space-y-1">
                {complianceChecks.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
            
            {complianceChecks.requirements.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-yellow-800">Required Actions:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 mt-1">
                  {complianceChecks.requirements.map((requirement, index) => (
                    <li key={index}>{requirement}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPositionSizingCalculator = () => {
    if (!showPositionSizing) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Position Sizing Calculator</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock Symbol & Price
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Symbol (e.g., AAPL)"
                className="flex-1 p-3 border rounded-lg"
                onChange={(e) => {
                  const symbol = e.target.value.toUpperCase();
                  if (symbol.length >= 1) {
                    setSelectedStock(prev => ({ ...prev, symbol }));
                  }
                }}
              />
              <input
                type="number"
                placeholder="Price"
                className="w-32 p-3 border rounded-lg"
                onChange={(e) => {
                  const price = parseFloat(e.target.value);
                  if (price > 0) {
                    setSelectedStock(prev => ({ ...prev, stockPrice: price }));
                  }
                }}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volatility (Annual %)
              </label>
              <input
                type="number"
                placeholder="20"
                defaultValue="20"
                className="w-full p-3 border rounded-lg"
                onChange={(e) => {
                  const volatility = parseFloat(e.target.value) / 100;
                  if (volatility >= 0) {
                    setSelectedStock(prev => ({ ...prev, volatility }));
                  }
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beta
              </label>
              <input
                type="number"
                placeholder="1.0"
                defaultValue="1.0"
                step="0.1"
                className="w-full p-3 border rounded-lg"
                onChange={(e) => {
                  const beta = parseFloat(e.target.value);
                  if (beta >= 0) {
                    setSelectedStock(prev => ({ ...prev, beta }));
                  }
                }}
              />
            </div>
          </div>
          
          {selectedStock?.stockPrice && (
            <button
              onClick={() => calculatePositionSize(selectedStock)}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Calculate Position Size
            </button>
          )}
        </div>
        
        {selectedStock?.symbol && positionCalculations[selectedStock.symbol] && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">
              Position Sizing Results for {selectedStock.symbol}
            </h3>
            
            {renderPositionSizingResults(positionCalculations[selectedStock.symbol])}
          </div>
        )}
      </div>
    );
  };

  const renderPositionSizingResults = (calculation) => {
    if (!calculation) return null;
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {calculation.recommendedShares}
            </div>
            <div className="text-sm text-gray-600">Recommended Shares</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              ${calculation.maxPositionValue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Max Position Value</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {calculation.positionPercent.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Portfolio Percentage</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">Risk Amount</div>
            <div className="font-medium text-gray-900">
              ${calculation.riskAmount.toLocaleString()}
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">Suggested Stop Loss</div>
            <div className="font-medium text-gray-900">
              {(calculation.stopLossPercent * 100).toFixed(1)}%
            </div>
          </div>
        </div>
        
        <div className="text-sm text-gray-600 bg-white rounded-lg p-3">
          <strong>Reasoning:</strong> {calculation.reasoning}
        </div>
        
        <RiskIndicator
          level={calculation.positionPercent > 15 ? 'high' : 
                calculation.positionPercent > 10 ? 'medium' : 'low'}
          value={calculation.positionPercent}
          label="Position Risk Level"
          showDistribution={false}
        />
      </div>
    );
  };

  const renderRecommendations = () => {
    if (!accountLevel?.recommendations?.length) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recommendations</h2>
        
        <div className="space-y-3">
          {accountLevel.recommendations.map((rec, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                rec.priority === 'critical' ? 'border-red-200 bg-red-50' :
                rec.priority === 'high' ? 'border-orange-200 bg-orange-50' :
                'border-blue-200 bg-blue-50'
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  {rec.priority === 'critical' ? '🚨' :
                   rec.priority === 'high' ? '⚠️' : 'ℹ️'}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">{rec.title}</h3>
                  <p className="text-sm text-gray-700">{rec.description}</p>
                  {rec.priority && (
                    <div className="text-xs text-gray-500 mt-1">
                      Priority: {rec.priority}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!accountData) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600">Please connect your account to view management dashboard</div>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {renderAccountTier()}
      {renderComplianceWarnings()}
      {renderPositionSizingCalculator()}
      {renderRecommendations()}
    </div>
  );
};

export default AccountManagementDashboard; 