import React, { useState, useEffect, useMemo } from 'react';
// Dynamic import for Plotly to reduce main bundle size
// import Plot from 'react-plotly.js';
import { OptionTrade } from '../../types/options';

interface CumulativePnlChartProps {
  trades: OptionTrade[];
}

const CumulativePnlChart: React.FC<CumulativePnlChartProps> = ({ trades }) => {
  const [Plot, setPlot] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Dynamically import Plotly only when component is used
    const loadPlotly = async () => {
      try {
        const plotlyModule = await import(
          /* webpackChunkName: "vendors-plotly" */
          'react-plotly.js'
        );
        setPlot(() => plotlyModule.default);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load Plotly:', err);
        setError('Failed to load chart library');
        setIsLoading(false);
      }
    };

    loadPlotly();
  }, []);

  const chartData = useMemo(() => {
    if (!trades || trades.length === 0) return null;

    // Filter for closed trades with a valid P&L and closeDate
    const closedTrades = trades
      .filter(t => t.status === 'Closed' && t.tradePL !== undefined && t.closeDate)
      .sort((a, b) => new Date(a.closeDate!).getTime() - new Date(b.closeDate!).getTime());

    if (closedTrades.length === 0) return null;

    const dates: string[] = [];
    const cumulativePnl: number[] = [];
    let runningTotal = 0;

    closedTrades.forEach(trade => {
      runningTotal += trade.tradePL!;
      // Ensure closeDate is valid before formatting
      if (trade.closeDate) {
        const dateString = trade.closeDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        dates.push(dateString);
        cumulativePnl.push(runningTotal);
      }
    });

    // Explicitly type the return object as Plotly.Data
    const data: Plotly.Data = {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading chart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <p className="text-sm text-gray-500 mt-1">Chart could not be loaded</p>
        </div>
      </div>
    );
  }

  if (!Plot) {
    return null;
  }

  if (!chartData) {
    return <div className="text-center p-4 text-gray-500">No closed trade data available for P&L chart.</div>;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <Plot
        data={[chartData]}
        layout={{
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
        }}
        useResizeHandler={true}
        style={{ width: '100%', height: '400px' }}
        config={{ responsive: true }}
      />
    </div>
  );
};

export default CumulativePnlChart; 