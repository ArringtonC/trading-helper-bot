import React, { useState, useEffect } from 'react';
import AccountCard from '../components/AccountCard';
import { Account, AccountType } from '../types/account';
import { AccountService } from '../services/AccountService';

const Accounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccount, setNewAccount] = useState<Partial<Account>>({
    name: '',
    type: AccountType.CASH,
    balance: 0,
    monthlyDeposit: 0
  });

  useEffect(() => {
    // Load accounts from storage on component mount
    const loadedAccounts = AccountService.getAccounts();
    setAccounts(loadedAccounts);
  }, []);

  const handleAddAccount = () => {
    if (newAccount.name && newAccount.type) {
      const account: Account = {
        id: Date.now().toString(),
        name: newAccount.name,
        type: newAccount.type,
        balance: newAccount.balance || 0,
        monthlyDeposit: newAccount.monthlyDeposit || 0,
        lastUpdated: new Date()
      };

      AccountService.addAccount(account);
      setAccounts(prevAccounts => [...prevAccounts, account]);
      setShowAddModal(false);
      setNewAccount({
        name: '',
        type: AccountType.CASH,
        balance: 0,
        monthlyDeposit: 0
      });
    }
  };

  const handleDeleteAccount = (id: string) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      AccountService.deleteAccount(id);
      setAccounts(prevAccounts => prevAccounts.filter(acc => acc.id !== id));
    }
  };

  const handleAddDeposit = (accountId: string, amount: number) => {
    const updatedAccount = AccountService.addDeposit(accountId, amount);
    if (updatedAccount) {
      setAccounts(prevAccounts => 
        prevAccounts.map(acc => 
          acc.id === accountId ? updatedAccount : acc
        )
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Trading Accounts</h1>
        <button 
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          onClick={() => setShowAddModal(true)}
        >
          Add New Account
        </button>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Add New Account</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Name</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Type</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={newAccount.type}
                  onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value as AccountType })}
                >
                  {Object.values(AccountType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Initial Balance</label>
                <input
                  type="number"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={newAccount.balance}
                  onChange={(e) => setNewAccount({ ...newAccount, balance: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Monthly Deposit</label>
                <input
                  type="number"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={newAccount.monthlyDeposit}
                  onChange={(e) => setNewAccount({ ...newAccount, monthlyDeposit: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAccount}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Account
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(account => (
          <div key={account.id} className="relative">
            <AccountCard 
              account={account} 
              onAddDeposit={(amount: number) => handleAddDeposit(account.id, amount)}
            />
            <button
              className="absolute top-2 right-2 text-red-600 hover:text-red-800"
              onClick={() => handleDeleteAccount(account.id)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Accounts; 