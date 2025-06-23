import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import PerformanceSummary from '../../shared/components/PerformanceSummary';
import { Account } from '../../types/account';
import { AccountService } from '../../shared/services/AccountService';

const data = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 700 },
  { name: 'Jun', value: 900 },
];

const DashboardWidget: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [performanceData, setPerformanceData] = useState({
    monthToDatePnL: 0,
    yearToDatePnL: 0,
    totalPnL: 0
  });

  // Load account data
  const loadAccountData = async () => {
    try {
      const accounts = await AccountService.getAccounts();
      setAccounts(accounts);
      
      // Extract performance data from accounts if available
      if (accounts.length > 0) {
        const mainAccount = accounts[0];
        setPerformanceData({
          monthToDatePnL: mainAccount.monthToDatePnL || 0,
          yearToDatePnL: mainAccount.yearToDatePnL || 0,
          totalPnL: mainAccount.totalPnL || 0
        });
      }
      
      console.log('Dashboard loaded accounts:', accounts);
    } catch (error) {
      console.error('Error loading account data:', error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadAccountData();
    
    // Set up event listener for dashboard refresh
    const handleRefresh = () => {
      console.log('Dashboard refresh event received');
      loadAccountData();
    };
    
    window.addEventListener('dashboard-refresh', handleRefresh);
    
    // Check for localStorage flag periodically
    const checkInterval = setInterval(() => {
      const refreshFlag = localStorage.getItem('dashboard-refresh-flag');
      if (refreshFlag === 'true') {
        console.log('Dashboard refresh flag detected');
        localStorage.removeItem('dashboard-refresh-flag');
        loadAccountData();
      }
    }, 1000);
    
    return () => {
      window.removeEventListener('dashboard-refresh', handleRefresh);
      clearInterval(checkInterval);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900">Total Trades</h3>
          <p className="text-3xl font-bold text-blue-600">24</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900">Win Rate</h3>
          <p className="text-3xl font-bold text-green-600">65%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900">Profit/Loss</h3>
          <p className="text-3xl font-bold text-green-600">+$1,234</p>
        </div>
      </div>

      {/* Performance Summary Component */}
      <PerformanceSummary 
        monthToDatePnL={performanceData.monthToDatePnL}
        yearToDatePnL={performanceData.yearToDatePnL}
        totalPnL={performanceData.totalPnL}
      />

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Chart</h3>
        <div className="h-64">
          <LineChart width={800} height={250} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#3B82F6" />
          </LineChart>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">BTC/USD</span>
            <span className="text-green-600">+2.5%</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">ETH/USD</span>
            <span className="text-red-600">-1.2%</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600">SOL/USD</span>
            <span className="text-green-600">+5.8%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardWidget; 