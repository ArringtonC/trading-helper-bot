import React from 'react';
import { VirtualPortfolio, UserPreferences, MESFeatureFlags } from '../types';

interface TradingSimulatorProps {
  virtualPortfolio: VirtualPortfolio;
  userPreferences: UserPreferences;
  onPortfolioUpdate: (portfolio: Partial<VirtualPortfolio>) => void;
  onTradeComplete: (trade: any) => void;
  onPositionUpdate: (positionId: string, updates: any) => void;
  featureFlags: MESFeatureFlags;
}

const TradingSimulator: React.FC<TradingSimulatorProps> = ({
  virtualPortfolio,
  userPreferences,
  onPortfolioUpdate,
  onTradeComplete,
  onPositionUpdate,
  featureFlags
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          💹 Trading Simulator
        </h2>
        <p className="text-gray-600 mb-6">
          The advanced trading simulator is currently under development. This will include real-time market data, 
          interactive charts, and a full trading interface.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Coming Soon Features:</h3>
          <ul className="text-sm text-blue-600 space-y-1">
            <li>• Real-time MES futures price feeds</li>
            <li>• Interactive trading charts with EMA indicators</li>
            <li>• Order placement and position management</li>
            <li>• Risk management tools and alerts</li>
            <li>• Performance tracking and analytics</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TradingSimulator; 