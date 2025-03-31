import React, { useState, useEffect } from 'react';
import { Account, AccountType } from '../types/account';
import { AccountService } from '../services/AccountService';

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
  
  // Export capabilities
  const handleExportCapabilities = () => {
    AccountService.exportCapabilities();
    alert('Capabilities export will be implemented in a future update.');
  };
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h2 className="text-xl font-medium text-gray-800 mb-4">Account Settings</h2>
        
        {selectedAccount ? (
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">Account Name</label>
              <input 
                type="text" 
                value={selectedAccount.name}
                onChange={(e) => handleAccountUpdate('name', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2">Account Type</label>
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
              <label className="block text-gray-700 mb-2">Monthly Deposit Amount</label>
              <input 
                type="number" 
                value={selectedAccount.monthlyDeposit || 0}
                onChange={(e) => handleAccountUpdate('monthlyDeposit', Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
          </div>
        ) : (
          <p>No account selected</p>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mt-6">
        <h2 className="text-xl font-medium text-gray-800 mb-4">System Settings</h2>
        
        <div>
          <button 
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            onClick={handleExportCapabilities}
          >
            Export Capabilities
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings; 