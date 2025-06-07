import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
// Attempt to import the black-scholes library
// Note: Since it's an older library, it might not have default export or types.
// We might need to use require or adjust the import.
// const bs = require('black-scholes'); // CommonJS style if import fails
import * as bs from 'black-scholes'; // Try ES module import
var DecayChart = function (_a) {
    var underlyingPrice = _a.underlyingPrice, strike = _a.strike, timeToExpiration = _a.timeToExpiration, // This prop now reflects remaining time
    volatility = _a.volatility, // This prop reflects simulated volatility
    riskFreeRate = _a.riskFreeRate, type = _a.type, _b = _a.steps // More steps for smoother decay curve
    , steps = _b === void 0 ? 31 : _b // More steps for smoother decay curve
    ;
    var calculateDecayData = useMemo(function () {
        var data = [];
        if (timeToExpiration <= 0)
            return data; // No decay if time is 0 or less
        var totalOriginalTime = timeToExpiration; // Keep track if needed, but calculation uses current remaining time
        var stepSizeInYears = timeToExpiration / (steps - 1);
        for (var i = 0; i < steps; i++) {
            // Calculate time *remaining* at this step (decreases from timeToExpiration to 0)
            var T = timeToExpiration - (i * stepSizeInYears);
            var daysRemaining = Math.round(T * 365);
            var optionPrice = 0;
            try {
                // Calculate price using the current remaining time (T) and potentially simulated volatility
                optionPrice = bs.blackScholes(underlyingPrice, strike, Math.max(T, 0.00001), // Ensure T is slightly above 0 for calculation
                volatility, // Use the passed volatility (which might be simulated)
                riskFreeRate, type.toLowerCase());
            }
            catch (error) {
                console.error("Black-Scholes calculation failed for step ".concat(i, " (T=").concat(T, "):"), error);
                optionPrice = 0; // Assign a default value on error
            }
            data.push({
                daysRemaining: daysRemaining,
                value: optionPrice
            });
        }
        // Ensure data is sorted by daysRemaining ascending for the chart
        return data.sort(function (a, b) { return a.daysRemaining - b.daysRemaining; });
    }, [underlyingPrice, strike, timeToExpiration, volatility, riskFreeRate, type, steps]);
    // Find the data point corresponding to the current state (which is the end of the line)
    var currentDataPoint = useMemo(function () {
        if (!calculateDecayData || calculateDecayData.length === 0)
            return null;
        // The point with the max daysRemaining represents the current value
        return calculateDecayData.reduce(function (max, point) { return point.daysRemaining > max.daysRemaining ? point : max; }, calculateDecayData[0]);
    }, [calculateDecayData]);
    return (<div className="w-full h-96 border rounded p-4 shadow-sm bg-white">
      <h2 className="text-lg font-semibold mb-4 text-center">Theoretical Value Decay</h2>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={calculateDecayData} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3"/>
          <XAxis dataKey="daysRemaining" type="number" domain={['dataMin', 'dataMax']} label={{ value: 'Days Remaining Until Expiration', position: 'insideBottom', dy: 15 }} tickFormatter={function (tick) { return "".concat(tick); }} reversed={true} // Show time decreasing from left to right
    />
          <YAxis label={{ value: 'Option Value', angle: -90, position: 'insideLeft' }} tickFormatter={function (tick) { return "$".concat(tick.toFixed(2)); }} domain={['auto', 'auto']}/>
          <Tooltip formatter={function (value) { return "$".concat(value.toFixed(2)); }} labelFormatter={function (label) { return "".concat(label, " Days Left"); }}/>
          {/* <Legend /> */}
          <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Value"/>

          {/* Dot showing the current calculated value based on sliders */}
          {currentDataPoint && (<ReferenceDot x={currentDataPoint.daysRemaining} y={currentDataPoint.value} r={5} fill="#8b5cf6" stroke="white" isFront={true} label={{ value: "$".concat(currentDataPoint.value.toFixed(2)), position: 'top', fill: '#8b5cf6' }}/>)}
        </LineChart>
      </ResponsiveContainer>
    </div>);
};
export default DecayChart;
