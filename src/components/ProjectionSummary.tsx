import React from 'react';
import { Account, Projection } from '../types/account';
import { ProjectionService } from '../services/ProjectionService';

interface ProjectionSummaryProps {
  account: Account;
  projections: Projection[];
}

const ProjectionSummary: React.FC<ProjectionSummaryProps> = ({ account, projections }) => {
  const summary = ProjectionService.calculateProjectionSummary(account, projections);
  
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
          <span className="font-medium">${account.monthlyDeposit?.toFixed(2) || '0.00'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Remaining Deposits:</span>
          <span className="font-medium">{summary.numDeposits}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total Deposits:</span>
          <span className="font-medium">${summary.totalDeposits.toFixed(2)}</span>
        </div>
        <div className="flex justify-between border-t pt-2 mt-2">
          <span className="text-gray-600 font-semibold">Year-End Balance:</span>
          <span className="font-medium text-green-600">
            ${summary.finalBalance.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProjectionSummary; 