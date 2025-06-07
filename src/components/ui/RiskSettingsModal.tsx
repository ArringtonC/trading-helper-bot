/**
 * Risk Settings Configuration Modal
 * 
 * Provides user interface for configuring trading style-specific
 * risk settings that integrate with the gap risk rule engine.
 */

import React, { useState, useEffect } from 'react';
import Modal from './Modal/Modal';
import { TradingStyleConfig, TradingStyle, RiskTolerance } from '../../types/tradingStyleRules';
import { TradingStyleConfigService } from '../../services/TradingStyleConfigService';

interface RiskSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onSettingsUpdate?: (config: TradingStyleConfig) => void;
}

export const RiskSettingsModal: React.FC<RiskSettingsModalProps> = ({
  isOpen,
  onClose,
  userId = 'default',
  onSettingsUpdate
}) => {
  const [config, setConfig] = useState<TradingStyleConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const configService = new TradingStyleConfigService();

  // Load current configuration
  useEffect(() => {
    if (isOpen) {
      try {
        const currentConfig = configService.getConfigForUser(userId);
        setConfig(currentConfig);
        setError(null);
      } catch (err) {
        setError('Failed to load current settings');
        console.error('Error loading risk settings:', err);
      }
    }
  }, [isOpen, userId]);

  const handleSave = async () => {
    if (!config) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      configService.setUserConfig(userId, config);
      onSettingsUpdate?.(config);
      onClose();
    } catch (err) {
      setError('Failed to save settings');
      console.error('Error saving risk settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof TradingStyleConfig, value: any) => {
    if (!config) return;
    
    setConfig({
      ...config,
      [field]: value
    });
  };

  const tradingStyles: { value: TradingStyle; label: string; description: string }[] = [
    { 
      value: 'day_trading', 
      label: 'Day Trading',
      description: 'Short-term positions closed within market hours'
    },
    { 
      value: 'swing_trading', 
      label: 'Swing Trading',
      description: 'Positions held for days to weeks'
    },
    { 
      value: 'position_trading', 
      label: 'Position Trading',
      description: 'Long-term positions held for weeks to months'
    },
    { 
      value: 'scalping', 
      label: 'Scalping',
      description: 'Very short-term positions for quick profits'
    }
  ];

  const riskTolerances: { value: RiskTolerance; label: string; description: string }[] = [
    { 
      value: 'conservative', 
      label: 'Conservative',
      description: 'Low risk, stable returns'
    },
    { 
      value: 'moderate', 
      label: 'Moderate',
      description: 'Balanced risk and return'
    },
    { 
      value: 'aggressive', 
      label: 'Aggressive',
      description: 'Higher risk for potential higher returns'
    }
  ];

  if (!config) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Risk Settings">
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading settings...</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚙️ Risk Settings Configuration">
      <div className="p-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="text-red-400">⚠️</div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Trading Style Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trading Style
            </label>
            <div className="space-y-2">
              {tradingStyles.map((style) => (
                <label key={style.value} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="tradingStyle"
                    value={style.value}
                    checked={config.style === style.value}
                    onChange={(e) => handleInputChange('style', e.target.value as TradingStyle)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{style.label}</div>
                    <div className="text-sm text-gray-500">{style.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Risk Tolerance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Risk Tolerance
            </label>
            <div className="space-y-2">
              {riskTolerances.map((tolerance) => (
                <label key={tolerance.value} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="riskTolerance"
                    value={tolerance.value}
                    checked={config.riskTolerance === tolerance.value}
                    onChange={(e) => handleInputChange('riskTolerance', e.target.value as RiskTolerance)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{tolerance.label}</div>
                    <div className="text-sm text-gray-500">{tolerance.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Account Size */}
          <div>
            <label htmlFor="accountSize" className="block text-sm font-medium text-gray-700 mb-2">
              Account Size ($)
            </label>
            <input
              type="number"
              id="accountSize"
              value={config.accountSize}
              onChange={(e) => handleInputChange('accountSize', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 100000"
              min="1000"
              step="1000"
            />
          </div>

          {/* Max Position Size */}
          <div>
            <label htmlFor="maxPositionSize" className="block text-sm font-medium text-gray-700 mb-2">
              Max Position Size (% of Account)
            </label>
            <input
              type="number"
              id="maxPositionSize"
              value={config.maxPositionSize * 100}
              onChange={(e) => handleInputChange('maxPositionSize', Number(e.target.value) / 100)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 5"
              min="0.1"
              max="100"
              step="0.1"
            />
          </div>

          {/* Max Total Exposure */}
          <div>
            <label htmlFor="maxTotalExposure" className="block text-sm font-medium text-gray-700 mb-2">
              Max Total Exposure (% of Account)
            </label>
            <input
              type="number"
              id="maxTotalExposure"
              value={config.maxTotalExposure * 100}
              onChange={(e) => handleInputChange('maxTotalExposure', Number(e.target.value) / 100)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 20"
              min="0.1"
              max="100"
              step="0.1"
            />
          </div>

          {/* Typical Hold Time */}
          <div>
            <label htmlFor="typicalHoldTime" className="block text-sm font-medium text-gray-700 mb-2">
              Typical Hold Time (Days)
            </label>
            <input
              type="number"
              id="typicalHoldTime"
              value={config.typicalHoldTime}
              onChange={(e) => handleInputChange('typicalHoldTime', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 7"
              min="0.1"
              step="0.1"
            />
          </div>

          {/* Weekend Holding */}
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.weekendHoldingAllowed}
                onChange={(e) => handleInputChange('weekendHoldingAllowed', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">Allow Weekend Positions</div>
                <div className="text-sm text-gray-500">Hold positions over weekends despite gap risk</div>
              </div>
            </label>
          </div>

          {/* Max Gap Risk Score */}
          <div>
            <label htmlFor="maxGapRiskScore" className="block text-sm font-medium text-gray-700 mb-2">
              Max Gap Risk Score (0-100)
            </label>
            <input
              type="number"
              id="maxGapRiskScore"
              value={config.maxGapRiskScore}
              onChange={(e) => handleInputChange('maxGapRiskScore', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 60"
              min="0"
              max="100"
              step="1"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default RiskSettingsModal; 