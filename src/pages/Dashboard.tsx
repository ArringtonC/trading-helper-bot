import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Account } from '../types/account';
import { Projection } from '../types/account';
import { AccountService } from '../services/AccountService';
import { ProjectionService } from '../services/ProjectionService';
import { OptionService } from '../services/OptionService';
import { OptionTrade } from '../types/options';
import AccountCard from '../components/AccountCard';
import ProjectionChart from '../components/ProjectionChart';
import ProjectionSummary from '../components/ProjectionSummary';
import OptionsSummary from '../components/options/OptionsSummary';
import OptionsAnalysisCard from '../components/options/OptionsAnalysisCard';
import ExpirationCalendar from '../components/options/ExpirationCalendar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import CumulativeReturnsChart from '../components/CumulativeReturnsChart';
import EnhancedFilterControls from '../components/EnhancedFilterControls';
import { safeParseDate, formatDateForDisplay } from '../utils/dateUtils';
import { PortfolioStats } from '../types/portfolio';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getDb } from '../services/db';
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

interface PerformanceDataPoint {
  date: string;
  value: number;
}

// Static data for the performance chart
const performanceData: PerformanceDataPoint[] = [
  { date: '2024-01', value: 1000 },
  { date: '2024-02', value: 1200 },
  { date: '2024-03', value: 1150 },
  { date: '2024-04', value: 1300 },
];

interface TradeRow {
  dateTime: string;  // "YYYY-MM-DD, hh:mm:ss"
  tradePL: number;
}

/**
 * Integrated Dashboard component
 */
export const Dashboard: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [projections, setProjections] = useState<Projection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [optionsStats, setOptionsStats] = useState<PortfolioStats | null>(null);
  const [openPositions, setOpenPositions] = useState<OptionTrade[]>([]);
  const [closedPositions, setClosedPositions] = useState<OptionTrade[]>([]);
  const [trades, setTrades] = useState<OptionTrade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<OptionTrade[]>([]);
  const [filters, setFilters] = useState({
    dateRange: null as [Date, Date] | null,
    strategies: [] as string[],
    expirations: [] as string[],
    groupBy: 'strategy' as 'strategy' | 'expiration' | 'none'
  });
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const [userName, setUserName] = useState('Trader');  
  const [balance, setBalance] = useState(0);
  const [chartData, setChartData] = useState<{ labels: string[]; datasets: any[] }>({
    labels: [],
    datasets: [],
  });
  
  // Load accounts on component mount
  useEffect(() => {
    // Function to load account data
    const loadAccountData = async () => {
      try {
        const accounts = await AccountService.getAccounts();
        setAccounts(accounts);
        console.log('Dashboard loaded accounts:', accounts);
        
        // Select account based on URL param or first account
        const params = new URLSearchParams(location.search);
        const accountId = params.get('accountId');
        
        if (accountId && accounts.some(a => a.id === accountId)) {
          setSelectedAccount(accounts.find(a => a.id === accountId) || null);
        } else if (accounts.length > 0) {
          setSelectedAccount(accounts[0]);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading account data:', error);
        setIsLoading(false);
      }
    };
    
    // Load data initially
    loadAccountData();
    
    // Set up event listener for dashboard refresh
    const handleDataUpdate = () => {
      console.log('Dashboard received data update event');
      loadAccountData();
    };
    
    window.addEventListener('dashboard-data-updated', handleDataUpdate);
    
    // Also check localStorage for refresh flag
    const checkRefreshFlag = () => {
      try {
        const refreshNeeded = localStorage.getItem('dashboard-refresh-needed');
        if (refreshNeeded) {
          const refreshTime = parseInt(refreshNeeded);
          const lastCheck = parseInt(localStorage.getItem('last-refresh-check') || '0');
          
          if (refreshTime > lastCheck) {
            console.log('Dashboard refresh triggered via localStorage flag');
            localStorage.setItem('last-refresh-check', Date.now().toString());
            loadAccountData();
          }
        }
      } catch (error) {
        console.error('Error checking refresh flag:', error);
      }
    };
    
    // Check refresh flag periodically
    const intervalId = setInterval(checkRefreshFlag, 2000);
    
    // Clean up
    return () => {
      window.removeEventListener('dashboard-data-updated', handleDataUpdate);
      clearInterval(intervalId);
    };
  }, [location.search]);
  
  // Fetch trades data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Get trades from the demo portfolio
        const portfolio = OptionService.getOptionsPortfolio('demo1');
        console.log('👀 Portfolio cumulativePL:', portfolio.cumulativePL);
        console.log('👀 First three tradePLs:', portfolio.trades.slice(0,3).map(t => t.tradePL));
        setTrades(portfolio.trades);
        setFilteredTrades(portfolio.trades);
        // Store the cumulative P&L
        setCumulativePL(portfolio.cumulativePL || 0);
      } catch (error) {
        console.error('Error fetching trades:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Add state for cumulative P&L
  const [cumulativePL, setCumulativePL] = useState<number>(0);

  // Update projections and options stats when selected account changes
  useEffect(() => {
    if (selectedAccount) {
      // Calculate projections
      const accountProjections = ProjectionService.calculateYearlyProjections(selectedAccount);
      setProjections(accountProjections);
      
      // Get options portfolio stats and positions
      try {
        const optionsPortfolio = OptionService.getOptionsPortfolio(selectedAccount.id);
        const stats = OptionService.calculateStats(selectedAccount.id);
        setOptionsStats(stats);
        
        // Get open and closed positions
        const open = optionsPortfolio.trades.filter(t => !t.closeDate);
        const closed = optionsPortfolio.trades.filter(t => t.closeDate);
        setOpenPositions(open);
        setClosedPositions(closed);
        // Update cumulative P&L from the portfolio
        setCumulativePL(optionsPortfolio.cumulativePL || 0);
      } catch (error) {
        console.error('Error getting options stats', error);
        setOptionsStats(null);
        setOpenPositions([]);
        setClosedPositions([]);
        setCumulativePL(0);
      }
    }
  }, [selectedAccount]);
  
  // Handle adding a deposit to the selected account
  const handleAddDeposit = () => {
    if (selectedAccount && selectedAccount.monthlyDeposit) {
      const updatedAccount = AccountService.addDeposit(
        selectedAccount.id,
        selectedAccount.monthlyDeposit
      );
      
      if (updatedAccount) {
        // Update the selected account with new balance
        setSelectedAccount(updatedAccount);
        
        // Update the account in the accounts list
        setAccounts(prevAccounts => 
          prevAccounts.map(acc => 
            acc.id === updatedAccount.id ? updatedAccount : acc
          )
        );
        
        // Recalculate projections
        const updatedProjections = ProjectionService.calculateYearlyProjections(updatedAccount);
        setProjections(updatedProjections);
      }
    }
  };
  
  // Handle account selection change
  const handleAccountChange = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (account) {
      setSelectedAccount(account);
      
      // Update URL without navigating
      const url = new URL(window.location.href);
      url.searchParams.set('accountId', accountId);
      window.history.pushState({}, '', url.toString());
    }
  };

  // Handle trade click in calendar
  const handleTradeClick = (trade: OptionTrade) => {
    navigate(`/options?tradeId=${trade.id}`);
  };
  
  // Apply filters
  useEffect(() => {
    let result = [...trades];

    // Apply date range filter
    if (filters.dateRange) {
      const [startDate, endDate] = filters.dateRange;
      result = result.filter(trade => {
        const tradeDate = safeParseDate(trade.closeDate || trade.openDate);
        if (!tradeDate) return false;
        return tradeDate >= startDate && tradeDate <= endDate;
      });
    }

    // Apply strategy filter
    if (filters.strategies.length > 0) {
      result = result.filter(trade => 
        filters.strategies.includes(trade.strategy || 'Unknown')
      );
    }

    // Apply expiration filter
    if (filters.expirations.length > 0) {
      result = result.filter(trade => {
        const expirationMonth = formatDateForDisplay(
          safeParseDate(trade.expiry), 
          'MMM yyyy'
        );
        return filters.expirations.includes(expirationMonth);
      });
    }

    setFilteredTrades(result);
  }, [filters, trades]);
  
  // Calculate total premium
  const calculateTotalPremium = (trades: OptionTrade[]): number => {
    return trades.reduce((sum, t) => {
      const closePremium = t.closePremium || 0;
      const openPremium = t.premium || 0;
      return sum + (closePremium - openPremium);
    }, 0);
  };

  // Calculate win rate
  const calculateWinRate = (trades: OptionTrade[]): number => {
    if (trades.length === 0) return 0;
    const winningTrades = trades.filter(t => (t.closePremium || 0) > (t.premium || 0)).length;
    return Math.round((winningTrades / trades.length) * 100);
  };
  
  useEffect(() => {
    const db = getDb();

    // Load account balance from summary table
    db.get<{ cumulativePL: number }>(
      `SELECT cumulativePL FROM summary WHERE id = 1`
    ).then(row => {
      if (row) setBalance(row.cumulativePL);
    });

    // Load trades to build an equity curve
    db.all<TradeRow>(
      `SELECT dateTime, tradePL FROM trades ORDER BY dateTime`
    ).then(rows => {
      // accumulate tradePL into cumulative series
      let running = 0;
      const byDate: Record<string, number> = {};
      rows.forEach(({ dateTime, tradePL }) => {
        const day = dateTime.split(',')[0]; // e.g. "2025-04-10"
        running += tradePL;
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
    });
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6" data-testid="dashboard-title">Dashboard</h1>
      {isLoading ? (
        <div data-testid="loading">Loading accounts...</div>
      ) : (
        <>
          {/* Quick Links Section */}
          <div className="mb-8" data-testid="quick-links-section">
            <h2 className="text-2xl font-bold mb-4">Quick Links</h2>
            <div className="flex space-x-4">
              <Link to="/import" className="text-blue-600 hover:text-blue-800">
                Import Account Data
              </Link>
              {/* Add more quick links as needed */}
            </div>
          </div>

          {/* Rest of your dashboard content */}
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
                        label: (context) => `P&L: ${fmtUsd(context.parsed.y)}`
                      }
                    }
                  },
                }}
                style={{ height: '400px' }}
              />
            </Card>
        </>
      )}
    </div>
  );
}; 