/**
 * Funding Plan Modal Component
 * Shows detailed funding timeline with milestones and trading capacity
 */

import React, { useState, useEffect } from 'react';
import { AccountValidationEngine, FundingPlan } from '../../utils/finance/AccountValidationEngine';

interface FundingPlanModalProps {
  currentBalance: number;
  targetBalance: number;
  onClose: () => void;
  isOpen: boolean;
}

export const FundingPlanModal: React.FC<FundingPlanModalProps> = ({
  currentBalance,
  targetBalance,
  onClose,
  isOpen
}) => {
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [fundingPlan, setFundingPlan] = useState<FundingPlan | null>(null);

  useEffect(() => {
    if (isOpen && currentBalance < targetBalance) {
      const plan = AccountValidationEngine.createFundingPlan(
        currentBalance,
        targetBalance,
        monthlyContribution
      );
      setFundingPlan(plan);
    }
  }, [currentBalance, targetBalance, monthlyContribution, isOpen]);

  const scenarios = AccountValidationEngine.calculateFundingScenarios(currentBalance, targetBalance);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center">
                📈 Account Funding Plan
              </h2>
              <p className="text-blue-100 mt-1">
                Build your trading capital systematically
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Funding Scenarios */}
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold mb-4">📊 Funding Scenarios</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {scenarios.map((scenario, idx) => (
                <button
                  key={idx}
                  onClick={() => setMonthlyContribution(scenario.monthlyContribution)}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    monthlyContribution === scenario.monthlyContribution
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-sm">{scenario.scenario}</div>
                  <div className="text-lg font-bold text-blue-600">
                    ${scenario.monthlyContribution}
                  </div>
                  <div className="text-xs text-gray-600">
                    {scenario.timeToTarget} months
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Amount Input */}
            <div className="flex items-center space-x-4">
              <label className="font-medium">Custom Monthly Contribution:</label>
              <input
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 w-32"
                min="50"
                step="50"
              />
              <span className="text-gray-600">per month</span>
            </div>
          </div>

          {fundingPlan && (
            <>
              {/* Plan Summary */}
              <div className="p-6 border-b bg-gray-50">
                <h3 className="text-lg font-semibold mb-4">📋 Plan Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {fundingPlan.totalMonths}
                    </div>
                    <div className="text-sm text-gray-600">Months to Target</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      ${fundingPlan.totalContributions.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Contributions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      ${Math.round(fundingPlan.summary.finalTradingCapacity.moderatePositionSize).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Final Position Size</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {fundingPlan.summary.finalTradingCapacity.maxConcurrentTrades}
                    </div>
                    <div className="text-sm text-gray-600">Max Concurrent Trades</div>
                  </div>
                </div>
              </div>

              {/* Milestones */}
              {fundingPlan.milestones.length > 0 && (
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold mb-4">🎯 Key Milestones</h3>
                  <div className="space-y-3">
                    {fundingPlan.milestones.map((milestone, idx) => (
                      <div key={idx} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        <div className="w-16 text-center">
                          <div className="text-sm font-semibold text-blue-600">
                            Month {milestone.month}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{milestone.description}</div>
                          <div className="text-sm text-gray-600">{milestone.achievement}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">
                            ${Math.round(milestone.tradingCapacity.moderatePositionSize).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-600">per trade</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline Table */}
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">📅 Monthly Timeline</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3">Month</th>
                        <th className="text-right p-3">Contribution</th>
                        <th className="text-right p-3">Balance</th>
                        <th className="text-right p-3">Conservative</th>
                        <th className="text-right p-3">Moderate</th>
                        <th className="text-right p-3">Aggressive</th>
                        <th className="text-right p-3">Max Trades</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fundingPlan.timeline.slice(0, 12).map((month, idx) => (
                        <tr key={idx} className={`border-b ${idx % 2 === 0 ? 'bg-gray-25' : ''}`}>
                          <td className="p-3 font-medium">
                            {month.month === 0 ? 'Current' : `Month ${month.month}`}
                          </td>
                          <td className="p-3 text-right">
                            {month.contribution > 0 ? `$${month.contribution.toLocaleString()}` : '-'}
                          </td>
                          <td className="p-3 text-right font-semibold">
                            ${month.balance.toLocaleString()}
                          </td>
                          <td className="p-3 text-right">
                            ${Math.round(month.tradingCapacity.conservativePositionSize).toLocaleString()}
                          </td>
                          <td className="p-3 text-right">
                            ${Math.round(month.tradingCapacity.moderatePositionSize).toLocaleString()}
                          </td>
                          <td className="p-3 text-right">
                            ${Math.round(month.tradingCapacity.aggressivePositionSize).toLocaleString()}
                          </td>
                          <td className="p-3 text-right">
                            {month.tradingCapacity.maxConcurrentTrades}
                          </td>
                        </tr>
                      ))}
                      {fundingPlan.timeline.length > 12 && (
                        <tr className="border-b bg-blue-50">
                          <td className="p-3 text-center text-gray-600" colSpan={7}>
                            ... {fundingPlan.timeline.length - 12} more months to reach target
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 border-t bg-gray-50 flex justify-between">
                <div className="text-sm text-gray-600">
                  <p>💡 <strong>Pro Tip:</strong> Start with paper trading while building capital</p>
                  <p>📚 Use the funding period to study strategies and improve skills</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Implement save funding plan functionality
                      onClose();
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Save Plan
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FundingPlanModal; 