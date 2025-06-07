import React from 'react';
import { Link } from 'react-router-dom';
var AccountCard = function (_a) {
    var account = _a.account, onAddDeposit = _a.onAddDeposit;
    return (<div className="bg-white p-4 rounded-lg shadow border border-gray-200">
      <h2 className="text-lg font-medium text-gray-800">{account.name}</h2>
      <p className="text-gray-500 text-sm">Type: {account.type}</p>
      <div className="mt-4">
        <p className="text-2xl font-bold">${account.balance.toFixed(2)}</p>
        <p className="text-sm text-gray-500">
          Last updated: {account.lastUpdated.toLocaleDateString()}
        </p>
      </div>
      
      <div className="flex justify-between items-center mt-4">
        <h2 className="text-lg font-medium text-gray-900">Account Balance</h2>
        {account.monthlyDeposit && account.monthlyDeposit > 0 && (<button onClick={function () { return onAddDeposit(account.monthlyDeposit || 0); }} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
            Add Monthly Deposit (${account.monthlyDeposit.toLocaleString()})
          </button>)}
      </div>
      
      {account.type === 'IBKR' && (<div className="mt-4">
          <Link to="/options" className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 inline-block">
            View Positions
          </Link>
        </div>)}
    </div>);
};
export default AccountCard;
