/**
 * Position Limit Recommendations UI Component
 * 
 * This component displays intelligent position limit recommendations based on
 * user profile and trading characteristics, with educational tooltips and warnings.
 */

import React, { useState, useEffect } from 'react';
import { generatePositionLimitRecommendations, validateUserPositionLimits, UserProfile, RecommendationResult } from '../../utils/positionLimitEngine';
import { GoalSizingConfig } from '../../types/goalSizing';

interface PositionLimitRecommendationsProps {
  config: GoalSizingConfig;
  onLimitsChange: (maxPositionSize: number, maxTotalExposure: number) => void;
  accountSize?: number;
}

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-50 max-w-xs">
          <div className="text-center">{text}</div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
};

const PositionLimitRecommendations: React.FC<PositionLimitRecommendationsProps> = ({
  config,
  onLimitsChange,
  accountSize
}) => {
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Convert GoalSizingConfig to UserProfile
  const getUserProfile = (): UserProfile | null => {
    if (!config.goalType) return null;

    const profile: UserProfile = {
      accountSize: accountSize || config.capitalObjectiveParameters?.currentBalance || 10000,
      riskTolerance: (config.goalParameters?.riskTolerance as 'conservative' | 'moderate' | 'aggressive') || 'moderate',
      tradingStrategy: 'swing_trading', // Default - could be made configurable
      experienceLevel: 'import', // Default - could be made configurable 
      goalType: config.goalType as 'growth' | 'income' | 'preservation' | 'capital_objective'
    };

    if (config.capitalObjectiveParameters) {
      profile.capitalObjectiveParameters = {
        currentBalance: config.capitalObjectiveParameters.currentBalance || 10000,
        targetBalance: config.capitalObjectiveParameters.targetBalance || 20000,
        timeHorizonMonths: config.capitalObjectiveParameters.timeHorizonMonths || 12
      };
    }

    return profile;
  };

  // Generate recommendations when profile changes
  useEffect(() => {
    const profile = getUserProfile();
    if (profile) {
      try {
        const result = generatePositionLimitRecommendations(profile);
        setRecommendations(result);
      } catch (error) {
        console.error('Error generating recommendations:', error);
        setRecommendations(null);
      }
    }
  }, [config.goalType, config.goalParameters?.riskTolerance, config.capitalObjectiveParameters, accountSize]);

  // Apply recommendations to the config
  const applyRecommendations = () => {
    if (recommendations) {
      onLimitsChange(
        recommendations.recommended.maxPositionSize,
        recommendations.recommended.maxTotalExposure
      );
    }
  };

  // Get warning severity color
  const getWarningSeverityColor = (severity: 'info' | 'warning' | 'critical') => {
    switch (severity) {
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Check if current limits differ from recommendations
  const hasUserOverride = recommendations && (
    (config.sizingRules?.maxPositionSize || 0) !== recommendations.recommended.maxPositionSize ||
    (config.sizingRules?.maxTotalExposure || 0) !== recommendations.recommended.maxTotalExposure
  );

  if (!recommendations) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-blue-700">Complete your goal setup to see position limit recommendations</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Recommendation Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h4 className="font-semibold text-blue-800">AI-Powered Position Limit Recommendations</h4>
            <Tooltip text="These recommendations are based on your risk tolerance, trading strategy, and industry best practices. They are suggestions, not financial advice.">
              <span className="text-blue-500 cursor-help">(?)</span>
            </Tooltip>
          </div>
          <button
            onClick={() => setShowRecommendations(!showRecommendations)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showRecommendations ? 'Hide Details' : 'Show Details'}
          </button>
        </div>

        {/* Quick Recommendations Summary */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Recommended Max Position</div>
            <div className="text-lg font-bold text-blue-700">{recommendations.recommended.maxPositionSize}%</div>
            <div className="text-xs text-gray-600">${((recommendations.recommended.maxPositionSize / 100) * (accountSize || 10000)).toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Recommended Max Exposure</div>
            <div className="text-lg font-bold text-blue-700">{recommendations.recommended.maxTotalExposure}%</div>
            <div className="text-xs text-gray-600">${((recommendations.recommended.maxTotalExposure / 100) * (accountSize || 10000)).toLocaleString()}</div>
          </div>
        </div>

        {/* Apply Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={applyRecommendations}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Apply Recommendations
          </button>
          {hasUserOverride && (
            <span className="text-xs text-orange-600 font-medium">Custom values detected</span>
          )}
        </div>
      </div>

      {/* Detailed Recommendations */}
      {showRecommendations && (
        <div className="space-y-4">
          {/* Rationale */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h5 className="font-semibold text-gray-800 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Recommendation Rationale
            </h5>
            <div className="text-sm text-gray-700 space-y-2">
              <div><strong>Method:</strong> {recommendations.rationale.primary}</div>
              <div><strong>Key Factors:</strong></div>
              <ul className="list-disc list-inside ml-4 space-y-1">
                {recommendations.rationale.factors.map((factor: string, index: number) => (
                  <li key={index}>{factor}</li>
                ))}
              </ul>
              {recommendations.adjustments.applied.length > 0 && (
                <>
                  <div><strong>Applied Adjustments:</strong></div>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    {recommendations.adjustments.applied.map((adjustment: string, index: number) => (
                      <li key={index}>{adjustment}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          {/* Warnings */}
          {recommendations.comparison.warnings && recommendations.comparison.warnings.length > 0 && (
            <div className="space-y-2">
              {recommendations.comparison.warnings.map((warning: any, index: number) => (
                <div key={index} className={`border rounded-lg p-3 ${getWarningSeverityColor(warning.severity)}`}>
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <div className="font-semibold text-sm">{warning.message}</div>
                      <div className="text-sm mt-1">{warning.recommendation}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Best Practices */}
          {recommendations.bestPractices.applicableRules && recommendations.bestPractices.applicableRules.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h5 className="font-semibold text-green-800 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Best Practices
              </h5>
              <ul className="text-sm text-green-700 space-y-1">
                {recommendations.bestPractices.applicableRules.map((rule: any, index: number) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>{rule.title}: {rule.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded border">
        <strong>Disclaimer:</strong> These are educational suggestions based on industry best practices and should not be considered financial advice. 
        Always consider your individual circumstances and consult with qualified professionals before making investment decisions.
      </div>
    </div>
  );
};

export default PositionLimitRecommendations; 
 
 
 