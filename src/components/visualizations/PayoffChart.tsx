import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from 'recharts';

interface PayoffChartProps {
  strike: number;
  premium: number;
  type: 'CALL' | 'PUT';
  quantity: number; // Positive for long, negative for short
  priceRange?: { min: number; max: number; steps: number };
  simulatedPrice?: number; // Optional prop for the vertical line
}

// Define the structure for our calculated data points
interface PayoffDataPoint {
  price: number;
  pl: number;
}

const PayoffChart: React.FC<PayoffChartProps> = ({
  strike,
  premium,
  type,
  quantity,
  priceRange,
  simulatedPrice // Destructure the new prop
}) => {

  // Use memoized default price range to prevent infinite re-renders
  const effectivePriceRange = useMemo(() => {
    return priceRange || { min: strike * 0.8, max: strike * 1.2, steps: 41 };
  }, [priceRange, strike]);

  const calculatePayoffData = useMemo((): PayoffDataPoint[] => {
    const data: PayoffDataPoint[] = [];
    const stepSize = (effectivePriceRange.max - effectivePriceRange.min) / (effectivePriceRange.steps - 1);
    const multiplier = 100; // Standard option contract multiplier

    for (let i = 0; i < effectivePriceRange.steps; i++) {
      const currentPrice = effectivePriceRange.min + i * stepSize;
      let intrinsicValue = 0;

      if (type === 'CALL') {
        intrinsicValue = Math.max(0, currentPrice - strike);
      } else { // PUT
        intrinsicValue = Math.max(0, strike - currentPrice);
      }

      // P/L per share = (Intrinsic Value at Expiry - Premium Paid) * sign(quantity)
      // Total P/L = P/L per share * abs(quantity) * multiplier
      // Note: For short positions (quantity < 0), the premium is received, so we subtract intrinsic value from premium.
      let plPerShare: number;
      if (quantity > 0) { // Long position
         plPerShare = intrinsicValue - premium;
      } else { // Short position
         plPerShare = premium - intrinsicValue;
      }

       const totalPL = plPerShare * Math.abs(quantity) * multiplier;


      data.push({ price: currentPrice, pl: totalPL });
    }
    return data;
  }, [strike, premium, type, quantity, effectivePriceRange]);

  // Find min/max P/L for Y-axis domain (calculated but not used in current implementation)
  // const plValues = calculatePayoffData.map(d => d.pl);
  // const minY = Math.min(...plValues);
  // const maxY = Math.max(...plValues);
  // Add some padding to the Y-axis
  // const yDomainPadding = Math.max(Math.abs(minY), Math.abs(maxY)) * 0.1;
  // const yDomain = [Math.floor(minY - yDomainPadding), Math.ceil(maxY + yDomainPadding)];

  // Find the data point closest to the simulated price for the ReferenceDot
  const simulatedDataPoint = useMemo(() => {
    if (simulatedPrice === undefined || !calculatePayoffData) return null;
    return calculatePayoffData.reduce((prev, curr) => 
      Math.abs(curr.price - simulatedPrice) < Math.abs(prev.price - simulatedPrice) ? curr : prev
    );
  }, [calculatePayoffData, simulatedPrice]);

  return (
    <div className="w-full h-96 border rounded p-4 shadow-sm bg-white">
      <h2 className="text-lg font-semibold mb-4 text-center">Payoff at Expiration</h2>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={calculatePayoffData} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="price" 
            type="number" 
            domain={['dataMin', 'dataMax']} 
            label={{ value: 'Underlying Price at Expiration', position: 'insideBottom', dy: 15 }}
            tickFormatter={(tick) => `$${tick.toFixed(0)}`}
          />
          <YAxis 
            label={{ value: 'Profit/Loss', angle: -90, position: 'insideLeft' }}
            tickFormatter={(tick) => `$${tick.toFixed(0)}`}
          />
          <Tooltip 
             formatter={(value: number, name: string, props) => [`$${value.toFixed(2)}`, 'P/L']} 
             labelFormatter={(label) => `Price: $${label.toFixed(2)}`}
          />
          {/* <Legend /> */}
          <Line type="monotone" dataKey="pl" stroke="#3b82f6" strokeWidth={2} dot={false} name="Profit/Loss" />
          {/* Zero P/L line */}
          <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
          {/* Strike price line */}
          <ReferenceLine x={strike} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Strike", position: "insideTopRight", fill: "#ef4444" }} />
          
          {/* Vertical line for simulated price */}
          {simulatedPrice !== undefined && (
            <ReferenceLine x={simulatedPrice} stroke="#22c55e" strokeDasharray="4 4" label={{ value: `Sim: $${simulatedPrice.toFixed(0)}`, position: 'top', fill: '#22c55e' }} />
          )}
          {/* Dot on the payoff line for simulated price */}
          {simulatedDataPoint && (
            <ReferenceDot 
              x={simulatedDataPoint.price} 
              y={simulatedDataPoint.pl} 
              r={5} 
              fill="#22c55e" 
              stroke="white" 
              isFront={true}
              label={{ value: `$${simulatedDataPoint.pl.toFixed(0)}`, position: 'top', fill: '#22c55e' }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PayoffChart; 