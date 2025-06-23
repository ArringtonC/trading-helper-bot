import React from 'react';
import { Account } from '../types/account';
import { Projection } from '../types/account';

interface ProjectionSummaryProps {
  account: Account;
  projections: Projection[];
}

const ProjectionSummary: React.FC<ProjectionSummaryProps> = ({ account, projections }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
      <h2 className="text-lg font-medium text-gray-800">Projection Summary</h2>
      <div className="mt-2 space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Starting Balance:</span>
          <span className="font-medium">${account.balance.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Monthly Deposit:</span>
          <span className="font-medium">
            {account.monthlyDeposit ? `$${account.monthlyDeposit.toFixed(2)}` : 'Not set'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Remaining Deposits:</span>
          <span className="font-medium">
            {projections.length}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Year-End Balance:</span>
          <span className="font-medium text-green-600">
            ${projections.length > 0 ? projections[projections.length - 1].balance.toFixed(2) : '0.00'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProjectionSummary; 