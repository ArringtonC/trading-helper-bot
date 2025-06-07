var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import React, { useState, useMemo } from 'react';
import PayoffChart from '../components/visualizations/PayoffChart';
import DecayChart from '../components/visualizations/DecayChart';
import GoalSizingWizard from '../components/Wizards/GoalSizingWizard';
var StrategyVisualizer = function () {
    // Initialize state with default values (e.g., for a long call)
    var _a = useState({
        underlyingPrice: 100,
        strike: 100,
        premium: 2.50,
        type: 'CALL',
        quantity: 1,
        timeToExpiration: 0.25, // 3 months
        volatility: 0.30, // 30%
        riskFreeRate: 0.02 // 2%
    }), inputs = _a[0], setInputs = _a[1];
    // State for the scenario sliders - initialize based on inputs
    var _b = useState(function () { return ({
        simulatedPrice: inputs.underlyingPrice,
        simulatedVolatility: inputs.volatility,
        simulatedTimeElapsed: 0 // Start at 0 time elapsed
    }); }), scenario = _b[0], setScenario = _b[1];
    // State to control the visibility of the Goal Sizing Wizard
    var _c = useState(false), isWizardOpen = _c[0], setIsWizardOpen = _c[1];
    // Handler for input changes
    var handleInputChange = function (e) {
        var _a;
        var _b = e.target, name = _b.name, value = _b.value, type = _b.type;
        var isNumberInput = type === 'number';
        var newInputs = __assign(__assign({}, inputs), (_a = {}, _a[name] = isNumberInput ? parseFloat(value) : value, _a));
        setInputs(newInputs);
        // Also reset scenario sliders when core inputs change
        // (except maybe keep time elapsed? Depends on desired UX)
        if (name === 'underlyingPrice') {
            setScenario(function (prev) { return (__assign(__assign({}, prev), { simulatedPrice: parseFloat(value) })); });
        }
        if (name === 'volatility') {
            setScenario(function (prev) { return (__assign(__assign({}, prev), { simulatedVolatility: parseFloat(value) / 100 })); });
        }
        // Reset time slider if total time changes
        if (name === 'timeToExpiration') {
            setScenario(function (prev) { return (__assign(__assign({}, prev), { simulatedTimeElapsed: Math.min(prev.simulatedTimeElapsed, parseFloat(value)) })); });
        }
    };
    // Handler for scenario slider changes
    var handleScenarioChange = function (e) {
        var _a = e.target, name = _a.name, value = _a.value;
        setScenario(function (prevScenario) {
            var _a;
            return (__assign(__assign({}, prevScenario), (_a = {}, _a[name] = parseFloat(value), _a)));
        });
    };
    // Handler to open the wizard
    var handleOpenWizard = function () {
        setIsWizardOpen(true);
    };
    // Handler to close the wizard
    var handleCloseWizard = function () {
        setIsWizardOpen(false);
    };
    // Handler for when the wizard is completed
    var handleWizardComplete = function (config) {
        console.log('Goal Sizing Wizard Completed with config:', config);
        // TODO: Do something with the completed configuration (e.g., save it, apply it)
        setIsWizardOpen(false); // Close the wizard on completion
    };
    // Calculate remaining time for the decay chart based on the slider
    var timeRemainingForDecay = useMemo(function () {
        return Math.max(0, inputs.timeToExpiration - scenario.simulatedTimeElapsed);
    }, [inputs.timeToExpiration, scenario.simulatedTimeElapsed]);
    // Define min/max for price slider dynamically
    var priceSliderMin = useMemo(function () { return Math.floor(inputs.strike * 0.7); }, [inputs.strike]);
    var priceSliderMax = useMemo(function () { return Math.ceil(inputs.strike * 1.3); }, [inputs.strike]);
    return (<div className="p-6 space-y-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Strategy Visualizer</h1>
      
      {/* Button to open the Goal Sizing Wizard */}
      <div className="flex justify-center">
        <button onClick={handleOpenWizard} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
          Open Goal Sizing Wizard
        </button>
      </div>
      
      {/* Input Form Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded shadow-sm bg-white">
        {/* Column 1 */}
        <div className="space-y-2">
          <label htmlFor="underlyingPrice" className="block text-sm font-medium text-gray-700">Underlying Price</label>
          <input type="number" name="underlyingPrice" id="underlyingPrice" value={inputs.underlyingPrice} onChange={handleInputChange} step="0.01" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
          
          <label htmlFor="strike" className="block text-sm font-medium text-gray-700">Strike Price</label>
          <input type="number" name="strike" id="strike" value={inputs.strike} onChange={handleInputChange} step="0.5" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
        </div>
        {/* Column 2 */}
        <div className="space-y-2">
           <label htmlFor="premium" className="block text-sm font-medium text-gray-700">Premium (Cost/Credit)</label>
          <input type="number" name="premium" id="premium" value={inputs.premium} onChange={handleInputChange} step="0.01" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
          
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity (Contracts)</label>
          <input type="number" name="quantity" id="quantity" value={inputs.quantity} onChange={handleInputChange} step="1" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
        </div>
        {/* Column 3 */}
        <div className="space-y-2">
           <label htmlFor="timeToExpiration" className="block text-sm font-medium text-gray-700">Time to Expiry (Years)</label>
          <input type="number" name="timeToExpiration" id="timeToExpiration" value={inputs.timeToExpiration} onChange={handleInputChange} step="0.01" max="5" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
         
          <label htmlFor="volatility" className="block text-sm font-medium text-gray-700">Volatility (%)</label>
          <input type="number" name="volatility" id="volatility" value={inputs.volatility * 100} onChange={function (e) { return handleInputChange({ target: { name: 'volatility', value: (parseFloat(e.target.value) / 100).toString(), type: 'number' } }); }} step="1" min="0" max="200" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>
        </div>
        {/* Column 4 */}
        <div className="space-y-2">
          <label htmlFor="riskFreeRate" className="block text-sm font-medium text-gray-700">Risk-Free Rate (%)</label>
          <input type="number" name="riskFreeRate" id="riskFreeRate" value={inputs.riskFreeRate * 100} onChange={function (e) { return handleInputChange({ target: { name: 'riskFreeRate', value: (parseFloat(e.target.value) / 100).toString(), type: 'number' } }); }} step="0.1" min="0" max="20" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"/>

          <label htmlFor="type" className="block text-sm font-medium text-gray-700">Option Type</label>
          <select name="type" id="type" value={inputs.type} onChange={handleInputChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
            <option value="CALL">Call</option>
            <option value="PUT">Put</option>
          </select>
        </div>
      </div>
      
      {/* Scenario Sliders Section */}
      <div className="p-4 border rounded shadow-sm bg-white space-y-4">
        <h2 className="text-xl font-semibold mb-3">What-If Scenarios</h2>
        {/* Price Slider */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
          <label htmlFor="simulatedPrice" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-0 whitespace-nowrap">Sim. Price: <span className="font-normal">{scenario.simulatedPrice.toFixed(2)}</span></label>
          <input type="range" name="simulatedPrice" id="simulatedPrice" min={priceSliderMin} max={priceSliderMax} step={(priceSliderMax - priceSliderMin) / 100} value={scenario.simulatedPrice} onChange={handleScenarioChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"/>
        </div>
        {/* Volatility Slider */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
           <label htmlFor="simulatedVolatility" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-0 whitespace-nowrap">Sim. Vol: <span className="font-normal">{(scenario.simulatedVolatility * 100).toFixed(1)}%</span></label>
           <input type="range" name="simulatedVolatility" id="simulatedVolatility" min="0.01" max="2.00" step="0.01" value={scenario.simulatedVolatility} onChange={handleScenarioChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"/>
        </div>
        {/* Time Slider */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
          <label htmlFor="simulatedTimeElapsed" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-0 whitespace-nowrap">Time Elapsed: <span className="font-normal">{(scenario.simulatedTimeElapsed * 365).toFixed(0)}/{(inputs.timeToExpiration * 365).toFixed(0)}d</span></label>
          <input type="range" name="simulatedTimeElapsed" id="simulatedTimeElapsed" min="0" max={inputs.timeToExpiration} step={inputs.timeToExpiration > 0 ? inputs.timeToExpiration / 100 : 0.01} value={scenario.simulatedTimeElapsed} onChange={handleScenarioChange} disabled={inputs.timeToExpiration <= 0} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"/>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <PayoffChart {...inputs} simulatedPrice={scenario.simulatedPrice} // Pass simulated price
    />
        <DecayChart {...inputs} timeToExpiration={timeRemainingForDecay} // Pass calculated remaining time
     volatility={scenario.simulatedVolatility} // Pass simulated volatility
    /> 
      </div>

      {/* Render the Goal Sizing Wizard */}
      <GoalSizingWizard isOpen={isWizardOpen} onClose={handleCloseWizard} onComplete={handleWizardComplete}/>

    </div>);
};
export default StrategyVisualizer;
