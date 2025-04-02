import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Account } from '../types/account';
import { Projection } from '../types/account';
import { AccountService } from '../services/AccountService';
import { ProjectionService } from '../services/ProjectionService';
import { OptionService } from '../services/OptionService';
import { OptionTrade, OptionPortfolioStats } from '../types/options';
import AccountCard from '../components/AccountCard';
import ProjectionChart from '../components/ProjectionChart';
import ProjectionSummary from '../components/ProjectionSummary';
import OptionsSummary from '../components/options/OptionsSummary';
import OptionsAnalysisCard from '../components/options/OptionsAnalysisCard';
import ExpirationCalendar from '../components/options/ExpirationCalendar';

/**
 * Integrated Dashboard component
 */
const Dashboard: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [projections, setProjections] = useState<Projection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [optionsStats, setOptionsStats] = useState<OptionPortfolioStats | null>(null);
  const [openPositions, setOpenPositions] = useState<OptionTrade[]>([]);
  const [closedPositions, setClosedPositions] = useState<OptionTrade[]>([]);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Load accounts on component mount
  useEffect(() => {
    const loadAccounts = () => {
      try {
        const loadedAccounts = AccountService.getAccounts();
        setAccounts(loadedAccounts);
        
        // Select account based on URL param or first account
        const params = new URLSearchParams(location.search);
        const accountId = params.get('accountId');
        
        if (accountId && loadedAccounts.some(a => a.id === accountId)) {
          setSelectedAccount(loadedAccounts.find(a => a.id === accountId) || null);
        } else if (loadedAccounts.length > 0) {
          setSelectedAccount(loadedAccounts[0]);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading accounts', error);
        setIsLoading(false);
      }
    };
    
    loadAccounts();
  }, [location.search]);
  
  // Update projections and options stats when selected account changes
  useEffect(() => {
    if (selectedAccount) {
      // Calculate projections
      const accountProjections = ProjectionService.calculateYearlyProjections(selectedAccount);
      setProjections(accountProjections);
      
      // Get options portfolio stats and positions
      try {
        const optionsPortfolio = OptionService.getOptionsPortfolio(selectedAccount.id);
        const stats = OptionService.calculateStats(optionsPortfolio);
        setOptionsStats(stats);
        
        // Get open and closed positions
        const open = optionsPortfolio.trades.filter(t => !t.closeDate);
        const closed = optionsPortfolio.trades.filter(t => t.closeDate);
        setOpenPositions(open);
        setClosedPositions(closed);
      } catch (error) {
        console.error('Error getting options stats', error);
        setOptionsStats(null);
        setOpenPositions([]);
        setClosedPositions([]);
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
  
  if (isLoading) {
    return <div>Loading accounts...</div>;
  }
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {accounts.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Account
          </label>
          <select
            value={selectedAccount?.id || ''}
            onChange={(e) => handleAccountChange(e.target.value)}
            className="w-full md:w-64 p-2 border border-gray-300 rounded shadow-sm"
          >
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {accounts.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
          <p>No accounts found. Create an account in the Settings page or import from IBKR.</p>
          <div className="mt-4 flex space-x-4">
            <Link 
              to="/settings" 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Go to Settings
            </Link>
            <Link 
              to="/import" 
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              Import Account
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Account Card */}
            {selectedAccount && (
              <AccountCard 
                account={selectedAccount}
                onAddDeposit={handleAddDeposit}
              />
            )}
            
            {/* Options Summary or Projection Summary */}
            {selectedAccount && optionsStats && optionsStats.totalTrades > 0 ? (
              <OptionsSummary 
                stats={optionsStats}
                accountId={selectedAccount.id}
              />
            ) : (
              selectedAccount && (
                <ProjectionSummary 
                  account={selectedAccount}
                  projections={projections}
                />
              )
            )}
          </div>
          
          {/* Options Analysis Card */}
          {selectedAccount && selectedAccount.type === 'IBKR' && (
            <div className="mb-6">
              <OptionsAnalysisCard
                openPositions={openPositions}
                closedPositions={closedPositions}
              />
            </div>
          )}
          
          {/* Expiration Calendar */}
          {selectedAccount && selectedAccount.type === 'IBKR' && openPositions.length > 0 && (
            <div className="mb-6">
              <ExpirationCalendar
                trades={openPositions}
                onTradeClick={handleTradeClick}
              />
            </div>
          )}
          
          {/* Projection Chart */}
          {selectedAccount && projections.length > 0 && (
            <div className="mt-6">
              <ProjectionChart projections={projections} />
            </div>
          )}
          
          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <h3 className="font-medium text-gray-700 mb-2">Quick Links</h3>
              <div className="space-y-2">
                <Link to="/import" className="block text-blue-600 hover:text-blue-800">Import Account Data</Link>
                <Link to="/options" className="block text-blue-600 hover:text-blue-800">Manage Options Trades</Link>
                <Link to="/settings" className="block text-blue-600 hover:text-blue-800">Account Settings</Link>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <h3 className="font-medium text-gray-700 mb-2">Coming Soon</h3>
              <div className="space-y-2 text-gray-500">
                <p>Futures Trading (June 2025)</p>
                <p>AI Strategy Development (September 2025)</p>
                <p>Advanced Analytics</p>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <h3 className="font-medium text-gray-700 mb-2">System Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Version:</span>
                  <span>April 2025</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Storage:</span>
                  <span className="text-green-600">Healthy</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Update:</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard; 