import React from 'react';
import { MESFuturesTutorialProps } from './types';

const LegacyTutorial: React.FC<MESFuturesTutorialProps> = ({
  onComplete,
  onNext,
  userLevel = 'learning'
}) => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            📈 MES Futures Trading Tutorial (Legacy Version)
          </h1>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              Enhanced Tutorial Available
            </h3>
            <p className="text-blue-700">
              A comprehensive enhanced tutorial with detailed modules, interactive content, 
              and real-world trading insights is available. Enable enhanced features in settings 
              to access the full learning experience.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                📚 Basic MES Futures Overview
              </h2>
              <p className="text-gray-600 mb-4">
                Micro E-mini S&P 500 (MES) futures are a smaller version of the popular E-mini S&P 500 futures, 
                designed for retail traders and smaller accounts.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Contract size: $5 × S&P 500 Index</li>
                <li>Minimum tick: 0.25 points ($1.25)</li>
                <li>Day trading margin: ~$50 per contract</li>
                <li>Overnight margin: ~$2,500 per contract</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                📈 20/50 EMA Strategy Basics
              </h2>
              <p className="text-gray-600 mb-4">
                The 20/50 EMA crossover strategy uses two exponential moving averages to identify trend changes:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Buy when 20 EMA crosses above 50 EMA</li>
                <li>Sell when 20 EMA crosses below 50 EMA</li>
                <li>Use proper risk management with stop losses</li>
                <li>Consider market conditions and volume</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                🛡️ Basic Risk Management
              </h2>
              <p className="text-gray-600 mb-4">
                Essential risk management principles for MES futures trading:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Never risk more than 2% of account per trade</li>
                <li>Use stop losses on every trade</li>
                <li>Start with small position sizes</li>
                <li>Understand margin requirements</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                ⚠️ Important Disclaimers
              </h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Risk Warning:</strong> Futures trading involves substantial risk of loss and is not suitable for all investors. 
                  Past performance is not indicative of future results. Always consult with a financial advisor before trading.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Legacy tutorial for {userLevel} level traders
            </div>
            <div className="space-x-4">
              {onNext && (
                <button
                  onClick={onNext}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continue
                </button>
              )}
              {onComplete && (
                <button
                  onClick={onComplete}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Complete Tutorial
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegacyTutorial; 