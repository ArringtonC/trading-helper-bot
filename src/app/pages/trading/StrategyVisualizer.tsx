import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PayoffChart from '../../../shared/components/visualizations/PayoffChart';
import DecayChart from '../../../shared/components/visualizations/DecayChart';
import { loadSetting } from '../../../shared/services/SettingsService';

interface StrategyInputs {
  underlyingPrice: number;
  strike: number;
  premium: number;
  type: 'CALL' | 'PUT';
  quantity: number;
  timeToExpiration: number;
  volatility: number;
  riskFreeRate: number;
}

interface ScenarioState {
  simulatedPrice: number;
  simulatedVolatility: number;
  simulatedTimeElapsed: number; // Time elapsed since now (in years)
}

const StrategyVisualizer: React.FC = () => {
  const navigate = useNavigate();
  
  // Check if user is basic level from settings
  const userExperience = loadSetting('userExperience') || 'basic';
  const isBasicUser = userExperience === 'basic';

  const [inputs, setInputs] = useState<StrategyInputs>({
    underlyingPrice: 100,
    strike: 105,
    premium: 3.50,
    type: 'CALL',
    quantity: 1,
    timeToExpiration: 0.25, // 3 months
    volatility: 0.20, // 20%
    riskFreeRate: 0.05 // 5%
  });

  const [scenario, setScenario] = useState<ScenarioState>({
    simulatedPrice: 100,
    simulatedVolatility: 0.20,
    simulatedTimeElapsed: 0 // Time that has passed
  });

  // Price range for charts and slider
  const priceSliderMin = Math.max(5, inputs.strike * 0.6);
  const priceSliderMax = inputs.strike * 1.4;
  const payoffPriceRange = { min: priceSliderMin, max: priceSliderMax, steps: 100 };
  
  // Calculate time remaining for decay chart
  const timeRemainingForDecay = Math.max(0.001, inputs.timeToExpiration - scenario.simulatedTimeElapsed);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
    
    // Update scenario price to match underlying price when it changes
    if (name === 'underlyingPrice') {
      setScenario(prev => ({
        ...prev,
        simulatedPrice: parseFloat(value) || 100
      }));
    }
  };

  const handleScenarioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setScenario(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleOpenWizard = () => {
    navigate('/goal-sizing');
  };

  // Preset strategies for basic users
  const presetStrategies = [
    {
      name: "Conservative Call",
      description: "Low risk call option",
      type: 'CALL' as const,
      strike: 105,
      premium: 2.50
    },
    {
      name: "Moderate Call",
      description: "Balanced risk/reward",
      type: 'CALL' as const,
      strike: 110,
      premium: 1.75
    },
    {
      name: "Conservative Put", 
      description: "Protective put strategy",
      type: 'PUT' as const,
      strike: 95,
      premium: 2.00
    },
    {
      name: "Moderate Put",
      description: "Bearish protection",
      type: 'PUT' as const,
      strike: 90,
      premium: 1.25
    }
  ];

  const loadPreset = (preset: typeof presetStrategies[0]) => {
    setInputs(prev => ({
      ...prev,
      type: preset.type,
      strike: preset.strike,
      premium: preset.premium
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header with improved branding */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Strategy Visualizer</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {isBasicUser 
              ? "Visualize your options strategy with simple, clear charts. See exactly how your trade will perform." 
              : "Advanced options strategy visualization with payoff diagrams and what-if analysis."
            }
          </p>
        </div>

        {/* Quick Action Bar */}
        <div className="mb-8 flex justify-center space-x-4">
          <button
            onClick={handleOpenWizard}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 002 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
            </svg>
            Set Trading Goals
          </button>
          
          {!isBasicUser && (
            <button
              onClick={() => navigate('/unified-dashboard')}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              Dashboard
            </button>
          )}
        </div>

        {/* Strategy Presets for Basic Users */}
        {isBasicUser && (
          <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Quick Start Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {presetStrategies.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => loadPreset(preset)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left"
                >
                  <h4 className="font-medium text-gray-900 mb-1">{preset.name}</h4>
                  <p className="text-sm text-gray-500 mb-2">{preset.description}</p>
                  <div className="text-xs text-blue-600">
                    Strike: ${preset.strike} • Premium: ${preset.premium}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      
        {/* Enhanced Input Form Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Strategy Parameters</h2>
            <p className="text-sm text-gray-500 mt-1">Configure your options position details</p>
          </div>
          
          <div className="p-6">
            <div className={`grid gap-6 ${isBasicUser ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'}`}>
              {/* Essential inputs for all users */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="underlyingPrice" className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Price
                    <span className="text-gray-400 ml-1">($)</span>
                  </label>
                  <input 
                    type="number" 
                    name="underlyingPrice" 
                    id="underlyingPrice" 
                    value={inputs.underlyingPrice} 
                    onChange={handleInputChange} 
                    step="0.01" 
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                
                <div>
                  <label htmlFor="strike" className="block text-sm font-medium text-gray-700 mb-2">
                    Strike Price
                    <span className="text-gray-400 ml-1">($)</span>
                  </label>
                  <input 
                    type="number" 
                    name="strike" 
                    id="strike" 
                    value={inputs.strike} 
                    onChange={handleInputChange} 
                    step="0.5" 
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="premium" className="block text-sm font-medium text-gray-700 mb-2">
                    Premium Cost
                    <span className="text-gray-400 ml-1">($)</span>
                  </label>
                  <input 
                    type="number" 
                    name="premium" 
                    id="premium" 
                    value={inputs.premium} 
                    onChange={handleInputChange} 
                    step="0.01" 
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">Option Type</label>
                  <select 
                    name="type" 
                    id="type" 
                    value={inputs.type} 
                    onChange={handleInputChange} 
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="CALL">Call (Bullish)</option>
                    <option value="PUT">Put (Bearish)</option>
                  </select>
                </div>
              </div>
              
              {/* Advanced inputs for intermediate/advanced users */}
              {!isBasicUser && (
                <>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">Contracts</label>
                      <input 
                        type="number" 
                        name="quantity" 
                        id="quantity" 
                        value={inputs.quantity} 
                        onChange={handleInputChange} 
                        step="1" 
                        min="1"
                        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="timeToExpiration" className="block text-sm font-medium text-gray-700 mb-2">
                        Time to Expiry
                        <span className="text-gray-400 ml-1">(years)</span>
                      </label>
                      <input 
                        type="number" 
                        name="timeToExpiration" 
                        id="timeToExpiration" 
                        value={inputs.timeToExpiration} 
                        onChange={handleInputChange} 
                        step="0.01" 
                        max="5" 
                        min="0.01"
                        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="volatility" className="block text-sm font-medium text-gray-700 mb-2">
                        Volatility
                        <span className="text-gray-400 ml-1">(%)</span>
                      </label>
                      <input 
                        type="number" 
                        name="volatility" 
                        id="volatility" 
                        value={inputs.volatility * 100} 
                        onChange={(e) => handleInputChange({ target: { name: 'volatility', value: (parseFloat(e.target.value) / 100).toString(), type: 'number' } } as any)} 
                        step="1" 
                        min="0" 
                        max="200" 
                        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <label htmlFor="riskFreeRate" className="block text-sm font-medium text-gray-700 mb-2">
                        Risk-Free Rate
                        <span className="text-gray-400 ml-1">(%)</span>
                      </label>
                      <input 
                        type="number" 
                        name="riskFreeRate" 
                        id="riskFreeRate" 
                        value={inputs.riskFreeRate * 100} 
                        onChange={(e) => handleInputChange({ target: { name: 'riskFreeRate', value: (parseFloat(e.target.value) / 100).toString(), type: 'number' } } as any)} 
                        step="0.1" 
                        min="0" 
                        max="20" 
                        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Scenario Sliders Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">What-If Scenarios</h2>
            <p className="text-sm text-gray-500 mt-1">
              {isBasicUser 
                ? "See how your strategy performs under different market conditions"
                : "Advanced scenario analysis with real-time parameter adjustments"
              }
            </p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Price Scenario */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                <label htmlFor="simulatedPrice" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-0">
                  Stock Price at Expiration
                </label>
                <div className="text-lg font-semibold text-blue-600">
                  ${scenario.simulatedPrice.toFixed(2)}
                </div>
              </div>
              <input 
                type="range" 
                name="simulatedPrice" 
                id="simulatedPrice"
                min={priceSliderMin}
                max={priceSliderMax}
                step={(priceSliderMax - priceSliderMin) / 100}
                value={scenario.simulatedPrice} 
                onChange={handleScenarioChange} 
                className="w-full h-3 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, 
                    #fca5a5 0%, 
                    #fcd34d ${((inputs.strike - priceSliderMin) / (priceSliderMax - priceSliderMin)) * 100}%, 
                    #86efac 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>${priceSliderMin}</span>
                <span className="font-medium">Strike: ${inputs.strike}</span>
                <span>${priceSliderMax}</span>
              </div>
            </div>
            
            {/* Advanced scenarios for non-basic users */}
            {!isBasicUser && (
              <>
                {/* Volatility Scenario */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                    <label htmlFor="simulatedVolatility" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-0">
                      Implied Volatility
                    </label>
                    <div className="text-lg font-semibold text-purple-600">
                      {(scenario.simulatedVolatility * 100).toFixed(1)}%
                    </div>
                  </div>
                  <input 
                    type="range" 
                    name="simulatedVolatility" 
                    id="simulatedVolatility"
                    min="0.01"
                    max="2.00"
                    step="0.01" 
                    value={scenario.simulatedVolatility} 
                    onChange={handleScenarioChange} 
                    className="w-full h-3 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1%</span>
                    <span>200%</span>
                  </div>
                </div>
                
                {/* Time Decay Scenario */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                    <label htmlFor="simulatedTimeElapsed" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-0">
                      Time Until Expiration
                    </label>
                    <div className="text-lg font-semibold text-orange-600">
                      {(scenario.simulatedTimeElapsed * 365).toFixed(0)}/{(inputs.timeToExpiration * 365).toFixed(0)} days
                    </div>
                  </div>
                  <input 
                    type="range" 
                    name="simulatedTimeElapsed" 
                    id="simulatedTimeElapsed"
                    min="0"
                    max={inputs.timeToExpiration} 
                    step={inputs.timeToExpiration > 0 ? inputs.timeToExpiration / 100 : 0.01}
                    value={scenario.simulatedTimeElapsed} 
                    onChange={handleScenarioChange} 
                    disabled={inputs.timeToExpiration <= 0}
                    className="w-full h-3 bg-gradient-to-r from-green-200 to-red-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Today</span>
                    <span>Expiration</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Enhanced Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Payoff Chart */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Profit & Loss at Expiration</h3>
              <p className="text-sm text-gray-500 mt-1">
                {isBasicUser 
                  ? "How much you'll make or lose at different stock prices"
                  : "Strategy payoff diagram showing P&L across price ranges"
                }
              </p>
            </div>
            <div className="p-6">
              <PayoffChart
                strike={inputs.strike}
                premium={inputs.premium}
                type={inputs.type}
                quantity={inputs.quantity}
                priceRange={payoffPriceRange}
                simulatedPrice={scenario.simulatedPrice}
              />
            </div>
          </div>
          
          {/* Time Decay Chart - Only for advanced users or simplified for basic */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {isBasicUser ? "Time Value Decay" : "Options Value Over Time"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {isBasicUser 
                  ? "How your option loses value as time passes"
                  : "Time decay analysis showing value erosion"
                }
              </p>
            </div>
            <div className="p-6">
              <DecayChart
                underlyingPrice={scenario.simulatedPrice}
                strike={inputs.strike}
                timeToExpiration={timeRemainingForDecay}
                volatility={scenario.simulatedVolatility}
                riskFreeRate={inputs.riskFreeRate}
                type={inputs.type}
              />
            </div>
          </div>
        </div>

        {/* Strategy Summary for Basic Users */}
        {isBasicUser && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Strategy Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Current Position</h4>
                <p className="text-2xl font-bold text-blue-600">
                  {inputs.type === 'CALL' ? 'Long Call' : 'Long Put'}
                </p>
                <p className="text-sm text-gray-500">
                  {inputs.quantity} contract{inputs.quantity > 1 ? 's' : ''} × ${inputs.premium}
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Break-Even Price</h4>
                <p className="text-2xl font-bold text-green-600">
                  ${inputs.type === 'CALL' 
                    ? (inputs.strike + inputs.premium).toFixed(2)
                    : (inputs.strike - inputs.premium).toFixed(2)
                  }
                </p>
                <p className="text-sm text-gray-500">
                  Stock needs to be {inputs.type === 'CALL' ? 'above' : 'below'} this price
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Max Risk</h4>
                <p className="text-2xl font-bold text-red-600">
                  ${(inputs.premium * inputs.quantity * 100).toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">
                  Maximum you can lose
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Educational Tips for Basic Users */}
        {isBasicUser && (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Trading Tips
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p className="text-blue-800">
                  <strong>Calls:</strong> You profit when the stock price goes above your break-even price.
                </p>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p className="text-blue-800">
                  <strong>Puts:</strong> You profit when the stock price goes below your break-even price.
                </p>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p className="text-blue-800">
                  <strong>Time Decay:</strong> Options lose value as they get closer to expiration, especially if they're out-of-the-money.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>
            Trading Helper Bot • Strategy Visualizer • 
            Remember: Options trading involves risk and is not suitable for all investors.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StrategyVisualizer; 