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
import { getSummary, getTrades, initDatabase } from '../services/DatabaseService';
import { fmtUsd } from '../utils/formatters';
import { Card, Typography, Box, CircularProgress, useTheme } from '@mui/material';

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

export const PLDashboard: React.FC = () => {
  const theme = useTheme();
  const [userName] = useState('Trader');
  const [accountValue, setAccountValue] = useState<number>(6694.75); // Set initial value from CSV
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [chartData, setChartData] = useState<ChartData<'line', number[]>>({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        await initDatabase();
        
        // Load trades to build an equity curve
        const rawTrades = await getTrades();
        // Map to expected TradeRow shape
        const trades = rawTrades.map((t: any) => ({
          ...t,
          dateTime: t.tradeDate || '',
          tradePL: t.netAmount || 0,
        }));
        
        if (trades.length) {
          let running = 0;
          const byDate: Record<string, number> = {};
          trades.forEach(({ dateTime, tradePL }) => {
            const [day] = dateTime.split(','); // TODO: Use proper date parsing
            running += tradePL;
            byDate[day] = running;
          });

          const labels = Object.keys(byDate);
          setChartData({
            labels,
            datasets: [
              {
                label: 'Cumulative P&L',
                data: labels.map(d => byDate[d]),
                fill: false,
                tension: 0.1,
                borderColor: theme.palette.success.main,
                backgroundColor: theme.palette.success.light,
              },
            ],
          });
        }
      } catch (err: any) {
        console.error('Error loading dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [theme.palette.success.main, theme.palette.success.light]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" p={4}>
        <Typography color="error" variant="h6">
          Oops! Something went wrong.
        </Typography>
        <Typography>{error}</Typography>
      </Box>
    );
  }

  if (!chartData.datasets.length) {
    return (
      <Box textAlign="center" p={4}>
        <Typography variant="h6">No trades to display yet.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {userName}!
      </Typography>

      <Card sx={{ p: 2, mb: 4, maxWidth: 300 }}>
        <Typography variant="subtitle2">Account Value</Typography>
        <Typography 
          variant="h5" 
          sx={{ color: theme => accountValue >= 0 ? theme.palette.success.main : theme.palette.error.main }}
        >
          {fmtUsd(accountValue)}
        </Typography>
      </Card>

      <Card sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          P&L Over Time
        </Typography>
        <Box sx={{ height: 400, position: 'relative' }}>
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
                  grid: { color: theme.palette.divider }
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
          />
        </Box>
      </Card>
    </Box>
  );
}; 