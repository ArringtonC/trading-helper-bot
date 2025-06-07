import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from 'recharts';
var PayoffChart = function (_a) {
    var strike = _a.strike, premium = _a.premium, type = _a.type, quantity = _a.quantity, _b = _a.priceRange, priceRange = _b === void 0 ? { min: strike * 0.8, max: strike * 1.2, steps: 41 } : _b, simulatedPrice = _a.simulatedPrice // Destructure the new prop
    ;
    var calculatePayoffData = useMemo(function () {
        var data = [];
        var stepSize = (priceRange.max - priceRange.min) / (priceRange.steps - 1);
        var multiplier = 100; // Standard option contract multiplier
        for (var i = 0; i < priceRange.steps; i++) {
            var currentPrice = priceRange.min + i * stepSize;
            var intrinsicValue = 0;
            if (type === 'CALL') {
                intrinsicValue = Math.max(0, currentPrice - strike);
            }
            else { // PUT
                intrinsicValue = Math.max(0, strike - currentPrice);
            }
            // P/L per share = (Intrinsic Value at Expiry - Premium Paid) * sign(quantity)
            // Total P/L = P/L per share * abs(quantity) * multiplier
            // Note: For short positions (quantity < 0), the premium is received, so we subtract intrinsic value from premium.
            var plPerShare = void 0;
            if (quantity > 0) { // Long position
                plPerShare = intrinsicValue - premium;
            }
            else { // Short position
                plPerShare = premium - intrinsicValue;
            }
            var totalPL = plPerShare * Math.abs(quantity) * multiplier;
            data.push({ price: currentPrice, pl: totalPL });
        }
        console.log("Calculated Payoff Data:", data.slice(0, 5)); // Debug log
        return data;
    }, [strike, premium, type, quantity, priceRange]);
    // Find min/max P/L for Y-axis domain
    var plValues = calculatePayoffData.map(function (d) { return d.pl; });
    var minY = Math.min.apply(Math, plValues);
    var maxY = Math.max.apply(Math, plValues);
    // Add some padding to the Y-axis
    var yDomainPadding = Math.max(Math.abs(minY), Math.abs(maxY)) * 0.1;
    var yDomain = [Math.floor(minY - yDomainPadding), Math.ceil(maxY + yDomainPadding)];
    // Find the data point closest to the simulated price for the ReferenceDot
    var simulatedDataPoint = useMemo(function () {
        if (simulatedPrice === undefined || !calculatePayoffData)
            return null;
        return calculatePayoffData.reduce(function (prev, curr) {
            return Math.abs(curr.price - simulatedPrice) < Math.abs(prev.price - simulatedPrice) ? curr : prev;
        });
    }, [calculatePayoffData, simulatedPrice]);
    return (<div className="w-full h-96 border rounded p-4 shadow-sm bg-white">
      <h2 className="text-lg font-semibold mb-4 text-center">Payoff at Expiration</h2>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={calculatePayoffData} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3"/>
          <XAxis dataKey="price" type="number" domain={['dataMin', 'dataMax']} label={{ value: 'Underlying Price at Expiration', position: 'insideBottom', dy: 15 }} tickFormatter={function (tick) { return "$".concat(tick.toFixed(0)); }}/>
          <YAxis label={{ value: 'Profit/Loss', angle: -90, position: 'insideLeft' }} tickFormatter={function (tick) { return "$".concat(tick.toFixed(0)); }}/>
          <Tooltip formatter={function (value, name, props) { return ["$".concat(value.toFixed(2)), 'P/L']; }} labelFormatter={function (label) { return "Price: $".concat(label.toFixed(2)); }}/>
          {/* <Legend /> */}
          <Line type="monotone" dataKey="pl" stroke="#3b82f6" strokeWidth={2} dot={false} name="Profit/Loss"/>
          {/* Zero P/L line */}
          <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3"/>
          {/* Strike price line */}
          <ReferenceLine x={strike} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Strike", position: "insideTopRight", fill: "#ef4444" }}/>
          
          {/* Vertical line for simulated price */}
          {simulatedPrice !== undefined && (<ReferenceLine x={simulatedPrice} stroke="#22c55e" strokeDasharray="4 4" label={{ value: "Sim: $".concat(simulatedPrice.toFixed(0)), position: 'top', fill: '#22c55e' }}/>)}
          {/* Dot on the payoff line for simulated price */}
          {simulatedDataPoint && (<ReferenceDot x={simulatedDataPoint.price} y={simulatedDataPoint.pl} r={5} fill="#22c55e" stroke="white" isFront={true} label={{ value: "$".concat(simulatedDataPoint.pl.toFixed(0)), position: 'top', fill: '#22c55e' }}/>)}
        </LineChart>
      </ResponsiveContainer>
    </div>);
};
export default PayoffChart;
