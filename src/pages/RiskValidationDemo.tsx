// Risk Validation Demo Page - Showcase enhanced UX features
// Demonstrates smart defaults, educational tooltips, and dynamic feedback

import React, { useState } from 'react';
import RiskDashboard from '../components/ui/RiskDashboard/RiskDashboard';
import RiskInput from '../components/ui/RiskInput/RiskInput';
import { 
  simulateLossSequence, 
  calculateKelly, 
  generateEducationalExample,
  formatPercentage,
  formatCurrency 
} from '../utils/riskCalculations';

const RiskValidationDemo: React.FC = () => {
  const [demoValues, setDemoValues] = useState({
    positionSize: 5,
    maxExposure: 100,
    winRate: 0.6,
    payoffRatio: 1.5,
    accountSize: 10000
  });

  const [showComparison, setShowComparison] = useState(false);

  // Test scenarios for demonstration
  const testScenarios = [
    {
      name: "Conservative Trader",
      values: { positionSize: 2, maxExposure: 100, winRate: 0.6, payoffRatio: 1.5, accountSize: 10000 }
    },
    {
      name: "Moderate Risk",
      values: { positionSize: 5, maxExposure: 150, winRate: 0.55, payoffRatio: 1.8, accountSize: 25000 }
    },
    {
      name: "Aggressive Trader",
      values: { positionSize: 10, maxExposure: 200, winRate: 0.5, payoffRatio: 2.0, accountSize: 50000 }
    },
    {
      name: "High Risk (Warning)",
      values: { positionSize: 25, maxExposure: 300, winRate: 0.45, payoffRatio: 1.2, accountSize: 5000 }
    }
  ];

  const applyScenario = (scenario: typeof testScenarios[0]) => {
    setDemoValues(scenario.values);
  };

  const kellyAnalysis = calculateKelly(demoValues.winRate, demoValues.payoffRatio);
  const lossScenario = simulateLossSequence(demoValues.positionSize, 5);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Enhanced Risk Validation System
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Experience our improved trading risk validation with smart defaults, educational tooltips, 
            and dynamic feedback that helps traders make informed decisions.
          </p>
        </div>

        {/* Quick Test Scenarios */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Test Scenarios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {testScenarios.map((scenario, index) => (
              <button
                key={index}
                onClick={() => applyScenario(scenario)}
                className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
              >
                <h3 className="font-medium text-gray-900 mb-2">{scenario.name}</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Position: {scenario.values.positionSize}%</div>
                  <div>Exposure: {scenario.values.maxExposure}%</div>
                  <div>Win Rate: {(scenario.values.winRate * 100).toFixed(0)}%</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Risk Dashboard */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Interactive Risk Dashboard</h2>
              <RiskDashboard
                initialValues={demoValues}
                onValuesChange={setDemoValues}
              />
            </div>
          </div>

          {/* Analysis Panel */}
          <div className="space-y-6">
            {/* Kelly Analysis */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Kelly Analysis</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Kelly Fraction:</span>
                  <span className="font-medium">{formatPercentage(kellyAnalysis.kellyFraction)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recommended:</span>
                  <span className="font-medium">{formatPercentage(kellyAnalysis.recommendedSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Risk Level:</span>
                  <span className={`font-medium capitalize ${
                    kellyAnalysis.riskLevel === 'conservative' ? 'text-green-600' :
                    kellyAnalysis.riskLevel === 'moderate' ? 'text-blue-600' :
                    kellyAnalysis.riskLevel === 'aggressive' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {kellyAnalysis.riskLevel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Profitable:</span>
                  <span className={`font-medium ${kellyAnalysis.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {kellyAnalysis.isPositive ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Loss Simulation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Loss Simulation</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Scenario:</span>
                  <span className="ml-2 font-medium">5 consecutive losses</span>
                </div>
                <div>
                  <span className="text-gray-600">Account Loss:</span>
                  <span className="ml-2 font-medium text-red-600">
                    {formatPercentage(lossScenario.accountLossPercent)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Remaining Capital:</span>
                  <span className="ml-2 font-medium">
                    {formatCurrency((lossScenario.remainingCapital / 100) * demoValues.accountSize)}
                  </span>
                </div>
              </div>
            </div>

            {/* Educational Examples */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Real-World Impact</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Position Risk:</h4>
                  <p className="text-gray-600">
                    {generateEducationalExample('positionSize', demoValues.positionSize, { 
                      accountSize: demoValues.accountSize 
                    })}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Leverage Impact:</h4>
                  <p className="text-gray-600">
                    {generateEducationalExample('leverage', demoValues.maxExposure, { 
                      accountSize: demoValues.accountSize 
                    })}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Kelly Guidance:</h4>
                  <p className="text-gray-600">
                    {generateEducationalExample('kelly', 0, { 
                      winRate: demoValues.winRate, 
                      payoffRatio: demoValues.payoffRatio 
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Individual Component Showcase */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Individual Component Showcase</h2>
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showComparison ? 'Hide' : 'Show'} Before/After Comparison
            </button>
          </div>

          {showComparison && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Before: Basic Input */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">❌ Before: Basic Input</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position Size (%)
                    </label>
                    <input
                      type="number"
                      value={demoValues.positionSize}
                      onChange={(e) => setDemoValues(prev => ({ ...prev, positionSize: Number(e.target.value) }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    Basic input with no guidance or feedback
                  </div>
                </div>
              </div>

              {/* After: Enhanced Input */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">✅ After: Enhanced Input</h3>
                <RiskInput
                  label="Position Size"
                  value={demoValues.positionSize}
                  onChange={(value) => setDemoValues(prev => ({ ...prev, positionSize: value }))}
                  type="positionSize"
                  min={0.1}
                  max={50}
                  unit="%"
                />
              </div>
            </div>
          )}

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Defaults</h3>
                <p className="text-sm text-gray-600">
                  Pre-filled with safe, professional defaults. One-click reset to conservative settings.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Educational Tooltips</h3>
                <p className="text-sm text-gray-600">
                  Hover over info icons for instant education. Expandable "Why this matters?" sections.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Dynamic Feedback</h3>
                <p className="text-sm text-gray-600">
                  Real-time risk assessment with color-coded warnings and actionable suggestions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Implementation Notes */}
        <div className="mt-12 bg-gray-100 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Implementation Highlights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">User Experience Improvements:</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Friendly, conversational validation messages</li>
                <li>• Real-time loss scenario calculations</li>
                <li>• Kelly Criterion integration with safety recommendations</li>
                <li>• Progressive disclosure (basic → advanced settings)</li>
                <li>• One-click application of safe defaults</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Technical Features:</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Debounced validation (300ms) for performance</li>
                <li>• TypeScript interfaces for type safety</li>
                <li>• Modular component architecture</li>
                <li>• Comprehensive risk calculation utilities</li>
                <li>• Accessible tooltips and keyboard navigation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskValidationDemo; 