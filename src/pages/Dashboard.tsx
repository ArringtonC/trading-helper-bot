import React, { useState, useEffect } from 'react';
import { Account, Projection } from '../types/account';
import { AccountService } from '../services/AccountService';
import { ProjectionService } from '../services/ProjectionService';
import AccountCard from '../components/AccountCard';
import ProjectionChart from '../components/ProjectionChart';
import ProjectionSummary from '../components/ProjectionSummary';

const Dashboard: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [projections, setProjections] = useState<Projection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load accounts on component mount
  useEffect(() => {
    const loadAccounts = () => {
      try {
        const loadedAccounts = AccountService.getAccounts();
        setAccounts(loadedAccounts);
        
        // Select first account by default if available
        if (loadedAccounts.length > 0) {
          setSelectedAccount(loadedAccounts[0]);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading accounts', error);
        setIsLoading(false);
      }
    };
    
    loadAccounts();
  }, []);
  
  // Update projections when selected account changes
  useEffect(() => {
    if (selectedAccount) {
      const accountProjections = ProjectionService.calculateYearlyProjections(selectedAccount);
      setProjections(accountProjections);
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
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading accounts...</div>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {accounts.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
          <p>No accounts found. Create an account in the Accounts page.</p>
        </div>
      ) : (
        <>
          {/* Account Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Account
            </label>
            <select
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={selectedAccount?.id || ''}
              onChange={(e) => {
                const account = accounts.find(acc => acc.id === e.target.value);
                if (account) {
                  setSelectedAccount(account);
                }
              }}
            >
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Account Card */}
            {selectedAccount && (
              <AccountCard 
                account={selectedAccount}
                onAddDeposit={handleAddDeposit}
              />
            )}
            
            {/* Projection Summary */}
            {selectedAccount && (
              <ProjectionSummary 
                account={selectedAccount}
                projections={projections}
              />
            )}
          </div>
          
          {/* Projection Chart */}
          {selectedAccount && projections.length > 0 && (
            <div className="mt-6">
              <ProjectionChart projections={projections} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard; 