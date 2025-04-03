import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { OptionTrade } from '../types/options';
import { Account } from '../types/account';
import { AccountService } from '../services/AccountService';
import { OptionService } from '../services/OptionService';
import { OptionsTradingView } from './OptionsTradingView';
import { initializeSampleData } from '../utils/sampleData';
import { checkTradesInLocalStorage } from '../utils/debugUtils';
import { debugLog } from '../utils/debugUtils';

const Options: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [trades, setTrades] = useState<OptionTrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const location = useLocation();
  
  // Load accounts on mount
  useEffect(() => {
    const loadAccounts = () => {
      try {
        const loadedAccounts = AccountService.getAccounts();
        debugLog('Loaded accounts', loadedAccounts);
        setAccounts(loadedAccounts);
        
        if (loadedAccounts.length > 0) {
          // Check if accountId is in the URL query params
          const params = new URLSearchParams(location.search);
          const accountId = params.get('accountId');
          
          if (accountId && loadedAccounts.some(a => a.id === accountId)) {
            setSelectedAccountId(accountId);
          } else {
            setSelectedAccountId(loadedAccounts[0].id);
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading accounts', error);
        setIsLoading(false);
      }
    };
    
    loadAccounts();
  }, [location.search]);
  
  // Initialize sample data if needed
  useEffect(() => {
    initializeSampleData();
    checkTradesInLocalStorage();
  }, []);
  
  // Load trades when account changes
  useEffect(() => {
    if (selectedAccountId) {
      try {
        const portfolio = OptionService.getOptionsPortfolio(selectedAccountId);
        debugLog('Portfolio for selected account', portfolio);
        setTrades(portfolio.trades);
      } catch (error) {
        console.error('Error loading trades:', error);
      }
    }
  }, [selectedAccountId]);

  const handleAccountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAccountId(e.target.value);
  };

  const handleCloseTrade = (tradeId: string) => {
    try {
      const closeData = {
        closeDate: new Date(),
        closePremium: 0 // This should be provided by the user through a form
      };
      OptionService.closeTrade(selectedAccountId, tradeId, closeData);
      const portfolio = OptionService.getOptionsPortfolio(selectedAccountId);
      setTrades(portfolio.trades);
    } catch (error) {
      console.error('Error closing trade:', error);
    }
  };

  const handleEditTrade = (tradeId: string) => {
    // TODO: Implement edit trade functionality
    console.log('Edit trade:', tradeId);
  };

  const handleDeleteTrade = (tradeId: string) => {
    try {
      OptionService.deleteTrade(selectedAccountId, tradeId);
      const portfolio = OptionService.getOptionsPortfolio(selectedAccountId);
      setTrades(portfolio.trades);
    } catch (error) {
      console.error('Error deleting trade:', error);
    }
  };

  const handleViewTrade = (trade: OptionTrade) => {
    // TODO: Implement view trade functionality
    console.log('View trade:', trade);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <select
          className="w-full md:w-auto px-4 py-2 border rounded-lg"
          value={selectedAccountId}
          onChange={handleAccountChange}
        >
          {accounts.map(account => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </div>

      <OptionsTradingView
        trades={trades}
        onCloseTrade={handleCloseTrade}
        onEditTrade={handleEditTrade}
        onDeleteTrade={handleDeleteTrade}
        onViewTrade={handleViewTrade}
      />
    </div>
  );
};

export default Options; 