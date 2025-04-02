import React, { useState, useEffect } from 'react';
import { Account, AccountType } from '../types/account';
import { AccountService } from '../services/AccountService';
import ExportCapabilitiesButton from '../components/ExportCapabilitiesButton';

const Settings: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  
  // Load accounts on component mount
  useEffect(() => {
    const loadedAccounts = AccountService.getAccounts();
    setAccounts(loadedAccounts);
    
    if (loadedAccounts.length > 0) {
      setSelectedAccount(loadedAccounts[0]);
    }
  }, []);
  
  // Handle account field updates
  const handleAccountUpdate = (field: keyof Account, value: any) => {
    if (!selectedAccount) return;
    
    const updatedAccount = {
      ...selectedAccount,
      [field]: value
    };
    
    setSelectedAccount(updatedAccount);
    
    // Save to storage
    AccountService.updateAccount(updatedAccount);
    
    // Update accounts list
    setAccounts(prevAccounts => 
      prevAccounts.map(acc => 
        acc.id === updatedAccount.id ? updatedAccount : acc
      )
    );
  };
  
  // Handle account selection change
  const handleAccountSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const accountId = e.target.value;
    const account = accounts.find(a => a.id === accountId);
    
    if (account) {
      setSelectedAccount(account);
    }
  };
  
  // Handle creating a new account
  const handleCreateAccount = () => {
    const newAccount: Account = {
      id: `account-${Date.now()}`,
      name: 'New Account',
      type: AccountType.CASH,
      balance: 0,
      lastUpdated: new Date(),
      monthlyDeposit: 100
    };
    
    AccountService.addAccount(newAccount);
    
    // Refresh accounts list
    const updatedAccounts = AccountService.getAccounts();
    setAccounts(updatedAccounts);
    setSelectedAccount(newAccount);
  };
  
  // Handle deleting an account
  const handleDeleteAccount = () => {
    if (!selectedAccount) return;
    
    if (window.confirm(`Are you sure you want to delete account "${selectedAccount.name}"?`)) {
      AccountService.deleteAccount(selectedAccount.id);
      
      // Refresh accounts list
      const updatedAccounts = AccountService.getAccounts();
      setAccounts(updatedAccounts);
      
      // Select first account if available, or null if no accounts left
      setSelectedAccount(updatedAccounts.length > 0 ? updatedAccounts[0] : null);
    }
  };
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Account Settings */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h2 className="text-xl font-medium text-gray-800 mb-4">Account Settings</h2>
            
            {/* Account Selector */}
            <div className="mb-6 flex items-end gap-4">
              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Account
                </label>
                <select
                  value={selectedAccount?.id || ''}
                  onChange={handleAccountSelectionChange}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={handleCreateAccount}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add Account
              </button>
            </div>
            
            {selectedAccount ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Name
                  </label>
                  <input 
                    type="text" 
                    value={selectedAccount.name}
                    onChange={(e) => handleAccountUpdate('name', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Type
                  </label>
                  <select
                    value={selectedAccount.type}
                    onChange={(e) => handleAccountUpdate('type', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value={AccountType.CASH}>Cash</option>
                    <option value={AccountType.IBKR}>Interactive Brokers</option>
                    <option value={AccountType.NINJA_TRADER}>NinjaTrader</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Balance
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input 
                      type="number" 
                      value={selectedAccount.balance}
                      onChange={(e) => handleAccountUpdate('balance', Number(e.target.value))}
                      className="w-full pl-7 p-2 border border-gray-300 rounded"
                      step="0.01"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Deposit Amount
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input 
                      type="number" 
                      value={selectedAccount.monthlyDeposit || 0}
                      onChange={(e) => handleAccountUpdate('monthlyDeposit', Number(e.target.value))}
                      className="w-full pl-7 p-2 border border-gray-300 rounded"
                      step="0.01"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Used for projecting future account balances
                  </p>
                </div>
                
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <button
                    onClick={handleDeleteAccount}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                <p>No accounts found. Click "Add Account" to create one.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* System Settings */}
        <div>
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h2 className="text-xl font-medium text-gray-800 mb-4">System Settings</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Capabilities Export</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Export the current capabilities and configuration of your Trading Helper Bot.
                </p>
                <ExportCapabilitiesButton className="w-full" />
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Data Management</h3>
                <div className="space-y-2">
                  <button 
                    className="w-full px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      if (window.confirm('This will download all your data as a backup file. Continue?')) {
                        alert('Backup functionality will be available in a future update.');
                      }
                    }}
                  >
                    Backup Data
                  </button>
                  
                  <button 
                    className="w-full px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      if (window.confirm('This will restore your data from a backup file. Current data will be overwritten. Continue?')) {
                        alert('Restore functionality will be available in a future update.');
                      }
                    }}
                  >
                    Restore Data
                  </button>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Application Information</h3>
                <div className="text-sm text-gray-600">
                  <p>Version: April 2025 Release</p>
                  <p>Last Updated: April 30, 2025</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 