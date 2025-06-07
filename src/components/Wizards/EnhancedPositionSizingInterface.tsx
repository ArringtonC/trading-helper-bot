/**
 * Enhanced Position Sizing Interface with Research-Driven Implementation
 * Integrates Kelly Criterion, VIX scaling, risk profiles, and comprehensive validation
 */

import React, { useState, useEffect, useMemo } from 'react';
import { PositionSizingCalculator, PositionSizingInput, PositionSizingResult } from '../../utils/finance/PositionSizingCalculator';
import { GrowthProjectionEngine, GrowthProjectionInput } from '../../utils/finance/GrowthProjectionEngine';

interface EnhancedPositionSizingProps {
  accountBalance: number;
  onPositionSizeChange?: (result: PositionSizingResult) => void;
  onGrowthProjectionChange?: (projection: any) => void;
  initialValues?: Partial<PositionSizingInput>;
  showAdvancedOptions?: boolean;
}

interface VIXData {
  current: number;
  lastUpdated: string;
  trend: 'up' | 'down' | 'stable';
}

export const EnhancedPositionSizingInterface: React.FC<EnhancedPositionSizingProps> = ({
  accountBalance,
  onPositionSizeChange,
  onGrowthProjectionChange,
  initialValues,
  showAdvancedOptions = false
}) => {
  // Core position sizing state
  const [input, setInput] = useState<PositionSizingInput>({
    accountBalance,
    winRate: initialValues?.winRate || 55,
    avgWin: initialValues?.avgWin || 150,
    avgLoss: initialValues?.avgLoss || 100,
    riskProfile: initialValues?.riskProfile || 'moderate',
    currentVIX: initialValues?.currentVIX || 20,
    maxRiskPerTrade: initialValues?.maxRiskPerTrade || undefined
  });

  // Growth projection state
  const [growthInput, setGrowthInput] = useState<GrowthProjectionInput>({
    initialValue: accountBalance,
    finalValue: accountBalance * 1.1, // 10% growth default
    numberOfTrades: 50
  });

  // UI state
  const [showAdvanced, setShowAdvanced] = useState(showAdvancedOptions);
  const [vixData, setVixData] = useState<VIXData>({
    current: 20,
    lastUpdated: new Date().toISOString(),
    trend: 'stable'
  });

  // Calculate position sizing results
  const positionResult = useMemo(() => {
    return PositionSizingCalculator.calculate(input);
  }, [input]);

  // Calculate growth projection
  const growthEngine = useMemo(() => new GrowthProjectionEngine(), []);
  const growthResult = useMemo(() => {
    return growthEngine.calculateGrowthProjection(growthInput);
  }, [growthInput, growthEngine]);

  // Update parent components when results change
  useEffect(() => {
    onPositionSizeChange?.(positionResult);
  }, [positionResult, onPositionSizeChange]);

  useEffect(() => {
    onGrowthProjectionChange?.(growthResult);
  }, [growthResult, onGrowthProjectionChange]);

  // Update account balance when prop changes
  useEffect(() => {
    setInput(prev => ({ ...prev, accountBalance }));
    setGrowthInput(prev => ({ ...prev, initialValue: accountBalance }));
  }, [accountBalance]);

  // Handle input changes
  const updateInput = (updates: Partial<PositionSizingInput>) => {
    setInput(prev => ({ ...prev, ...updates }));
  };

  const updateGrowthInput = (updates: Partial<GrowthProjectionInput>) => {
    setGrowthInput(prev => ({ ...prev, ...updates }));
  };

  // Risk profile descriptions
  const riskProfiles = {
    conservative: {
      name: 'Conservative',
      description: '0.5-1% risk per trade, 25% Kelly fraction',
      color: 'text-green-600 bg-green-50 border-green-200'
    },
    moderate: {
      name: 'Moderate', 
      description: '1-2% risk per trade, 35% Kelly fraction',
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    aggressive: {
      name: 'Aggressive',
      description: '2-3% risk per trade, 50% Kelly fraction', 
      color: 'text-red-600 bg-red-50 border-red-200'
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Enhanced Position Sizing Calculator
        </h3>
        <p className="text-gray-600">
          Research-driven position sizing with Kelly Criterion, VIX scaling, and comprehensive risk management
        </p>
      </div>

      {/* Account Information */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Account Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Balance
            </label>
            <div className="text-2xl font-bold text-green-600">
              ${accountBalance.toLocaleString()}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current VIX Level
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-semibold">{vixData.current}</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                vixData.current < 15 ? 'bg-green-100 text-green-800' :
                vixData.current < 25 ? 'bg-yellow-100 text-yellow-800' :
                vixData.current < 35 ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }`}>
                {vixData.current < 15 ? 'Low Vol' :
                 vixData.current < 25 ? 'Normal' :
                 vixData.current < 35 ? 'High Vol' : 'Extreme'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Profile Selection */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Risk Profile</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(riskProfiles).map(([key, profile]) => (
            <label
              key={key}
              className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                input.riskProfile === key 
                  ? profile.color 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="riskProfile"
                value={key}
                checked={input.riskProfile === key}
                onChange={(e) => updateInput({ riskProfile: e.target.value as any })}
                className="sr-only"
              />
              <div className="font-medium">{profile.name}</div>
              <div className="text-sm text-gray-600 mt-1">{profile.description}</div>
            </label>
          ))}
        </div>
      </div>

      {/* Trading Statistics */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Trading Statistics</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Win Rate (%)
            </label>
            <input
              type="number"
              min="5"
              max="95"
              value={input.winRate}
              onChange={(e) => updateInput({ winRate: Number(e.target.value) })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Valid range: 5-95%</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Average Win ($)
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={input.avgWin}
              onChange={(e) => updateInput({ avgWin: Number(e.target.value) })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Average Loss ($)
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={input.avgLoss}
              onChange={(e) => updateInput({ avgLoss: Number(e.target.value) })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Advanced Options</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom VIX Level
              </label>
              <input
                type="number"
                min="5"
                max="100"
                value={input.currentVIX}
                onChange={(e) => updateInput({ currentVIX: Number(e.target.value) })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Risk Per Trade (%)
              </label>
              <input
                type="number"
                min="0.1"
                max="5"
                step="0.1"
                value={input.maxRiskPerTrade || ''}
                onChange={(e) => updateInput({ maxRiskPerTrade: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Auto (based on profile)"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum 5% allowed</p>
            </div>
          </div>
        </div>
      )}

      {/* Position Sizing Results */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Position Sizing Results</h4>
        
        {/* Validation Errors */}
        {positionResult.validation.errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <h5 className="font-medium text-red-800 mb-1">Validation Errors:</h5>
            <ul className="text-sm text-red-700 space-y-1">
              {positionResult.validation.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Validation Warnings */}
        {positionResult.validation.warnings.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <h5 className="font-medium text-yellow-800 mb-1">Warnings:</h5>
            <ul className="text-sm text-yellow-700 space-y-1">
              {positionResult.validation.warnings.map((warning, index) => (
                <li key={index}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Recommended Size</div>
            <div className="text-xl font-bold text-blue-900">
              {positionResult.recommendedPositionSize.toFixed(2)}%
            </div>
            <div className="text-sm text-blue-700">
              ${positionResult.riskAmount.toFixed(0)}
            </div>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm text-green-600 font-medium">VIX Adjusted</div>
            <div className="text-xl font-bold text-green-900">
              {positionResult.vixAdjustedSize.toFixed(2)}%
            </div>
            <div className="text-sm text-green-700">
              ${(accountBalance * positionResult.vixAdjustedSize / 100).toFixed(0)}
            </div>
          </div>
          
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-sm text-purple-600 font-medium">Kelly Fraction</div>
            <div className="text-xl font-bold text-purple-900">
              {(positionResult.kellyFraction * 100).toFixed(2)}%
            </div>
            <div className="text-sm text-purple-700">
              Fractional: {(positionResult.fractionalKelly * 100).toFixed(2)}%
            </div>
          </div>
          
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-sm text-red-600 font-medium">Maximum Size</div>
            <div className="text-xl font-bold text-red-900">
              {positionResult.maxPositionSize.toFixed(2)}%
            </div>
            <div className="text-sm text-red-700">
              Safety limit
            </div>
          </div>
        </div>
      </div>

      {/* Growth Projection */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Growth Projection</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Final Value ($)
            </label>
            <input
              type="number"
              min={accountBalance}
              value={growthInput.finalValue}
              onChange={(e) => updateGrowthInput({ finalValue: Number(e.target.value) })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Trades
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              value={growthInput.numberOfTrades}
              onChange={(e) => updateGrowthInput({ numberOfTrades: Number(e.target.value) })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Growth Results */}
        {growthResult.isValid && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-indigo-50 p-3 rounded-lg">
              <div className="text-sm text-indigo-600 font-medium">Per Trade Return</div>
              <div className="text-xl font-bold text-indigo-900">
                {growthResult.perTradeReturnPercent.toFixed(4)}%
              </div>
            </div>
            <div className="bg-teal-50 p-3 rounded-lg">
              <div className="text-sm text-teal-600 font-medium">Annualized Return</div>
              <div className="text-xl font-bold text-teal-900">
                {growthResult.annualizedReturn !== undefined ? `${growthResult.annualizedReturn.toFixed(2)}%` : 'N/A'}
              </div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="text-sm text-orange-600 font-medium">Total Return</div>
              <div className="text-xl font-bold text-orange-900">
                {growthResult.totalReturnPercent.toFixed(2)}%
              </div>
            </div>
          </div>
        )}

        {/* Growth Validation Errors */}
        {!growthResult.isValid && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <h5 className="font-medium text-red-800 mb-1">Growth Projection Errors:</h5>
            <ul className="text-sm text-red-700 space-y-1">
              {growthResult.errors.map((error: string, index: number) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Toggle Advanced Options */}
      <div className="text-center">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
        </button>
      </div>
    </div>
  );
}; 