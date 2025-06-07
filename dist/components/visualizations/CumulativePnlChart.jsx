import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
var CumulativePnlChart = function (_a) {
    var trades = _a.trades;
    var chartData = useMemo(function () {
        if (!trades || trades.length === 0)
            return null;
        // Filter for closed trades with a valid P&L and closeDate
        var closedTrades = trades
            .filter(function (t) { return t.status === 'Closed' && t.tradePL !== undefined && t.closeDate; })
            .sort(function (a, b) { return new Date(a.closeDate).getTime() - new Date(b.closeDate).getTime(); });
        if (closedTrades.length === 0)
            return null;
        var dates = [];
        var cumulativePnl = [];
        var runningTotal = 0;
        closedTrades.forEach(function (trade) {
            runningTotal += trade.tradePL;
            // Ensure closeDate is valid before formatting
            if (trade.closeDate) {
                var dateString = trade.closeDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
                dates.push(dateString);
                cumulativePnl.push(runningTotal);
            }
        });
        // Explicitly type the return object as Plotly.Data
        var data = {
            x: dates,
            y: cumulativePnl,
            type: 'scatter', // No assertion needed if type is Plotly.Data
            mode: 'lines+markers', // Use string literal
            marker: { color: '#3b82f6' }, // blue-500
            line: { shape: 'linear' }, // Use string literal
            name: 'Cumulative P/L',
        };
        return data;
    }, [trades]);
    if (!chartData) {
        return <div className="text-center p-4 text-gray-500">No closed trade data available for P&L chart.</div>;
    }
    return (<Plot data={[chartData]} layout={{
            title: { text: 'Cumulative P&L Over Time' },
            xaxis: {
                title: { text: 'Close Date' },
                type: 'date',
                tickformat: '%Y-%m-%d',
            },
            yaxis: {
                title: { text: 'Cumulative P&L ($)' },
                tickprefix: '$',
            },
            margin: { l: 50, r: 50, b: 50, t: 50, pad: 4 },
            autosize: true,
        }} useResizeHandler={true} style={{ width: '100%', height: '400px' }} config={{ responsive: true }}/>);
};
export default CumulativePnlChart;
