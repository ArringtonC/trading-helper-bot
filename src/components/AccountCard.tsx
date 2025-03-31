import React from 'react';
import { Account, AccountType } from '../types/account';

interface AccountCardProps {
  account: Account;
  onAddDeposit: (amount: number) => void;
}

const AccountCard: React.FC<AccountCardProps> = ({ account, onAddDeposit }) => {
  const getAccountTypeColor = (type: AccountType) => {
    switch (type) {
      case AccountType.CASH:
        return 'bg-blue-100 text-blue-800';
      case AccountType.IBKR:
        return 'bg-green-100 text-green-800';
      case AccountType.NINJA_TRADER:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
      <div className="flex justify-between items-start">
        <h2 className="text-lg font-medium text-gray-800">{account.name}</h2>
        <span className={`px-2 py-1 rounded-full text-sm font-medium ${getAccountTypeColor(account.type)}`}>
          {account.type}
        </span>
      </div>
      
      <div className="mt-4">
        <p className="text-2xl font-bold">${account.balance.toLocaleString()}</p>
        <p className="text-sm text-gray-500">
          Last updated: {account.lastUpdated.toLocaleDateString()}
        </p>
      </div>
      
      {account.monthlyDeposit && account.monthlyDeposit > 0 && (
        <div className="mt-4">
          <button 
            className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
            onClick={() => onAddDeposit(account.monthlyDeposit || 0)}
          >
            Add Monthly Deposit (${account.monthlyDeposit.toLocaleString()})
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountCard; 