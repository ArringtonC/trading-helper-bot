// Validation Display Component - Task 28.2
// Provides clear, actionable feedback for validation errors, warnings, and suggestions

import React from 'react';
import { ValidationResult, BusinessRuleViolation } from '../../../services/ValidationService';

interface ValidationDisplayProps {
  validationResult?: ValidationResult;
  businessViolations?: BusinessRuleViolation[];
  title?: string;
  className?: string;
  showSuggestions?: boolean;
  onFixSuggestion?: (field: string, suggestedValue: any) => void;
}

const ValidationDisplay: React.FC<ValidationDisplayProps> = ({
  validationResult,
  businessViolations = [],
  title = "Validation Results",
  className = "",
  showSuggestions = true,
  onFixSuggestion
}) => {
  if (!validationResult && businessViolations.length === 0) {
    return null;
  }

  const { errors = [], warnings = [], suggestions = [] } = validationResult || {};
  const hasIssues = errors.length > 0 || warnings.length > 0 || businessViolations.length > 0;

  if (!hasIssues && suggestions.length === 0) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              All validations passed
            </h3>
            <div className="mt-1 text-sm text-green-700">
              Your configuration looks good!
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {title && (
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                {errors.length} issue{errors.length !== 1 ? 's' : ''} need{errors.length === 1 ? 's' : ''} your attention
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>
                      <span className="font-medium">{error.field}:</span> {error.message}
                      {error.context && (
                        <div className="text-xs text-red-600 mt-1">
                          Code: {error.code}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Business Rule Violations */}
      {businessViolations.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-orange-800">
                {businessViolations.length} business rule violation{businessViolations.length !== 1 ? 's' : ''}
              </h3>
              <div className="mt-2 text-sm text-orange-700">
                <ul className="space-y-2">
                  {businessViolations.map((violation, index) => (
                    <li key={index} className="border-l-2 border-orange-300 pl-3">
                      <div className="font-medium">{violation.ruleName}</div>
                      <div className="text-sm">{violation.description}</div>
                      <div className="text-xs text-orange-600 mt-1">
                        <span className="font-medium">Suggested Action:</span> {violation.suggestedAction}
                      </div>
                      {violation.tradeId && (
                        <div className="text-xs text-orange-600">
                          Trade ID: {violation.tradeId}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                {warnings.length} recommendation{warnings.length !== 1 ? 's' : ''} for you
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc pl-5 space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index}>
                      <span className="font-medium">{warning.field}:</span> {warning.message}
                      {warning.recommendation && (
                        <div className="text-xs text-yellow-600 mt-1">
                          <span className="font-medium">Tip:</span> {warning.recommendation}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                {suggestions.length} helpful tip{suggestions.length !== 1 ? 's' : ''}
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="border-l-2 border-blue-300 pl-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{suggestion.field}</div>
                          <div className="text-sm">{suggestion.message}</div>
                          {suggestion.reasoning && (
                            <div className="text-xs text-blue-600 mt-1">
                              {suggestion.reasoning}
                            </div>
                          )}
                        </div>
                        {onFixSuggestion && suggestion.suggestedValue !== undefined && (
                          <button
                            onClick={() => onFixSuggestion(suggestion.field, suggestion.suggestedValue)}
                            className="ml-3 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded transition-colors"
                          >
                            Apply Fix
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationDisplay; 