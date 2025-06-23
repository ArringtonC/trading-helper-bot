/**
 * Account Validation Alert Component
 * Displays account size warnings and funding recommendations
 */

import React from 'react';
import { AccountValidationResult } from '../../../utils/finance/AccountValidationEngine';

interface AccountValidationAlertProps {
  validation: AccountValidationResult;
  onAction: (action: string) => void;
  className?: string;
}

export const AccountValidationAlert: React.FC<AccountValidationAlertProps> = ({
  validation,
  onAction,
  className = ''
}) => {
  const { recommendations } = validation;

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIconForSeverity = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '⚠️';
      case 'warning':
        return '💡';
      case 'success':
        return '✅';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={`rounded-lg border-2 p-6 mb-6 ${getSeverityStyles(recommendations.severity)} ${className}`}>
      {/* Header */}
      <div className="flex items-start space-x-3 mb-4">
        <span className="text-2xl flex-shrink-0 mt-1">
          {getIconForSeverity(recommendations.severity)}
        </span>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">
            {recommendations.title}
          </h3>
          <p className="text-sm leading-relaxed">
            {recommendations.message}
          </p>
        </div>
      </div>

      {/* Account Details */}
      <div className="bg-white bg-opacity-50 rounded-md p-4 mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Current Balance:</span>
            <span className="ml-2">${validation.calculations.minimumViableAccount > 0 ? 
              (validation.calculations.minimumViableAccount - validation.calculations.shortfall).toLocaleString() : 
              '0'}</span>
          </div>
          <div>
            <span className="font-medium">Minimum Viable:</span>
            <span className="ml-2">${validation.calculations.minimumViableAccount.toLocaleString()}</span>
          </div>
          {validation.calculations.shortfall > 0 && (
            <div>
              <span className="font-medium">Shortfall:</span>
              <span className="ml-2 text-red-600 font-semibold">
                ${validation.calculations.shortfall.toLocaleString()}
              </span>
            </div>
          )}
          {validation.calculations.recommendedAccount > validation.calculations.minimumViableAccount && (
            <div>
              <span className="font-medium">Recommended:</span>
              <span className="ml-2">${validation.calculations.recommendedAccount.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">Recommendations:</h4>
        <ul className="space-y-1 text-sm">
          {recommendations.recommendations.map((rec, idx) => (
            <li key={idx} className="flex items-start space-x-2">
              <span className="text-xs mt-1">•</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      {recommendations.actions && recommendations.actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {recommendations.actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => onAction(action.action)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                action.primary
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {action.text}
            </button>
          ))}
        </div>
      )}

      {/* Progress Indicator for Critical Cases */}
      {recommendations.severity === 'critical' && validation.calculations.shortfall > 0 && (
        <div className="mt-4 pt-4 border-t border-current border-opacity-20">
          <div className="flex items-center justify-between text-xs mb-1">
            <span>Account Funding Progress</span>
            <span>
              {Math.round(((validation.calculations.minimumViableAccount - validation.calculations.shortfall) / validation.calculations.minimumViableAccount) * 100)}%
            </span>
          </div>
          <div className="w-full bg-white bg-opacity-30 rounded-full h-2">
            <div
              className="bg-current h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.max(5, ((validation.calculations.minimumViableAccount - validation.calculations.shortfall) / validation.calculations.minimumViableAccount) * 100)}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountValidationAlert; 