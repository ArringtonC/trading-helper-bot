import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot } from 'recharts';
// Attempt to import the black-scholes library
// Note: Since it's an older library, it might not have default export or types.
// We might need to use require or adjust the import.
// const bs = require('black-scholes'); // CommonJS style if import fails
import * as bs from 'black-scholes'; // Try ES module import

interface DecayChartProps {
  underlyingPrice: number;
  strike: number;
  timeToExpiration: number; // THIS will now be the *remaining* time based on slider
  volatility: number; // Can be the *simulated* volatility from slider
  riskFreeRate: number;
  type: 'CALL' | 'PUT';
  steps?: number;
}

// Define the structure for our calculated data points
interface DecayDataPoint {
  daysRemaining: number;
  value: number;
}

const DecayChart: React.FC<DecayChartProps> = ({
  underlyingPrice,
  strike,
  timeToExpiration, // This prop now reflects remaining time
  volatility, // This prop reflects simulated volatility
  riskFreeRate,
  type,
  steps = 31 // More steps for smoother decay curve
}) => {

  const calculateDecayData = useMemo((): DecayDataPoint[] => {
    const data: DecayDataPoint[] = [];
    if (timeToExpiration <= 0) return data; // No decay if time is 0 or less
    
    const totalOriginalTime = timeToExpiration; // Keep track if needed, but calculation uses current remaining time
    const stepSizeInYears = timeToExpiration / (steps - 1);

    for (let i = 0; i < steps; i++) {
      // Calculate time *remaining* at this step (decreases from timeToExpiration to 0)
      const T = timeToExpiration - (i * stepSizeInYears);
      const daysRemaining = Math.round(T * 365);
      
      let optionPrice = 0;
      try {
        // Calculate price using the current remaining time (T) and potentially simulated volatility
        optionPrice = bs.blackScholes(
          underlyingPrice,
          strike,
          Math.max(T, 0.00001), // Ensure T is slightly above 0 for calculation
          volatility, // Use the passed volatility (which might be simulated)
          riskFreeRate,
          type.toLowerCase() as 'call' | 'put'
        );
      } catch (error) {
        console.error(`Black-Scholes calculation failed for step ${i} (T=${T}):`, error);
        optionPrice = 0; // Assign a default value on error
      }

      data.push({ 
        daysRemaining: daysRemaining, 
        value: optionPrice 
      });
    }
    // Ensure data is sorted by daysRemaining ascending for the chart
    return data.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [underlyingPrice, strike, timeToExpiration, volatility, riskFreeRate, type, steps]);

  // Find the data point corresponding to the current state (which is the end of the line)
  const currentDataPoint = useMemo(() => {
     if (!calculateDecayData || calculateDecayData.length === 0) return null;
     // The point with the max daysRemaining represents the current value
     return calculateDecayData.reduce((max, point) => point.daysRemaining > max.daysRemaining ? point : max, calculateDecayData[0]);
   }, [calculateDecayData]);

  return (
    <div className="w-full h-96 border rounded p-4 shadow-sm bg-white">
      <h2 className="text-lg font-semibold mb-4 text-center">Theoretical Value Decay</h2>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={calculateDecayData} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="daysRemaining"
            type="number"
            domain={['dataMin', 'dataMax']}
            label={{ value: 'Days Remaining Until Expiration', position: 'insideBottom', dy: 15 }}
            tickFormatter={(tick) => `${tick}`}
            reversed={true} // Show time decreasing from left to right
          />
          <YAxis 
             label={{ value: 'Option Value', angle: -90, position: 'insideLeft' }}
             tickFormatter={(tick) => `$${tick.toFixed(2)}`}
             domain={['auto', 'auto']}
          />
          <Tooltip 
             formatter={(value: number) => `$${value.toFixed(2)}`} 
             labelFormatter={(label) => `${label} Days Left`}
           />
          {/* <Legend /> */}
          <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Value" />

          {/* Dot showing the current calculated value based on sliders */}
          {currentDataPoint && (
             <ReferenceDot 
              x={currentDataPoint.daysRemaining} 
              y={currentDataPoint.value} 
              r={5} 
              fill="#8b5cf6" 
              stroke="white" 
              isFront={true}
              label={{ value: `$${currentDataPoint.value.toFixed(2)}`, position: 'top', fill: '#8b5cf6' }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(DecayChart); 