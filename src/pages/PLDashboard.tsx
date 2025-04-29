import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  TooltipItem
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getSummary, getTrades } from '../services/DatabaseService';
import { fmtUsd } from '../utils/formatters';
import { Card, Typography, Box } from '@mui/material';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TradeRow {
  dateTime: string;  // "YYYY-MM-DD, hh:mm:ss"
  tradePL: number;
}

interface ChartDataset {
  label: string;
  data: number[];
  fill: boolean;
  tension: number;
  borderColor: string;
  backgroundColor: string;
}

export const PLDashboard: React.FC = () => {
  const [userName, setUserName] = useState('Trader');  
  const [balance, setBalance] = useState(0);
  const [chartData, setChartData] = useState<ChartData<'line', number[]>>({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    // Load account balance from summary
    const summary = Number(getSummary());
    setBalance(summary);

    // Load trades to build an equity curve
    const trades = getTrades();
    
    // accumulate tradePL into cumulative series
    let running = 0;
    const byDate: Record<string, number> = {};
    trades.forEach((trade: TradeRow) => {
      const day = trade.dateTime.split(',')[0]; // e.g. "2025-04-10"
      running += trade.tradePL;
      byDate[day] = running;
    });

    const labels = Object.keys(byDate);
    const data = labels.map(d => byDate[d]);

    setChartData({
      labels,
      datasets: [
        {
          label: 'Cumulative P&L',
          data,
          fill: false,
          tension: 0.1,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
        },
      ],
    });
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {userName}!
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
        <Card sx={{ p: 2, minWidth: 200 }}>
          <Typography variant="subtitle2">Account Balance</Typography>
          <Typography variant="h5" sx={{ color: balance >= 0 ? '#4CAF50' : '#f44336' }}>
            {fmtUsd(balance)}
          </Typography>
        </Card>
      </Box>

      <Card sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          P&L Over Time
        </Typography>
        <Line
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { 
                title: { display: true, text: 'Date' },
                grid: { display: false }
              },
              y: { 
                title: { display: true, text: 'P&L (USD)' },
                grid: { color: 'rgba(0,0,0,0.1)' }
              },
            },
            plugins: { 
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (context: TooltipItem<'line'>) => 
                    `P&L: ${fmtUsd(context.parsed.y)}`
                }
              }
            },
          }}
          style={{ height: '400px' }}
        />
      </Card>
    </Box>
  );
}; 