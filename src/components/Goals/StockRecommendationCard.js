/**
 * StockRecommendationCard - Displays stock recommendations with goal alignment
 * 
 * Research Integration:
 * - Goal-alignment scores with >80% accuracy target
 * - AI-generated explanations for stock-goal matching
 * - Real-time mismatch detection with educational warnings
 * - Confidence ratings based on genetic algorithm predictions
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const StockRecommendationCard = ({ 
  stock, 
  onSelect, 
  onViewDetails, 
  onEducationClick,
  isSelected = false,
  showDetailedView = false 
}) => {
  const [showWarnings, setShowWarnings] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Calculate visual indicators based on research metrics
  const alignmentColor = useMemo(() => {
    const score = stock.alignmentScore?.overall || 0;
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.6) return 'text-blue-600 bg-blue-50';
    if (score >= 0.4) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  }, [stock.alignmentScore?.overall]);

  const riskColor = useMemo(() => {
    const level = stock.riskAssessment?.level || 'medium';
    if (level === 'low') return 'text-green-600 bg-green-100';
    if (level === 'medium') return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  }, [stock.riskAssessment?.level]);

  const confidenceStars = useMemo(() => {
    const confidence = stock.predictionConfidence || 0;
    return Math.round(confidence * 5);
  }, [stock.predictionConfidence]);

  const formatPercentage = (value) => `${(value * 100).toFixed(1)}%`;
  const formatCurrency = (value) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const hasHighSeverityWarnings = stock.warnings?.some(w => w.severity === 'high') || false;
  const hasMediumSeverityWarnings = stock.warnings?.some(w => w.severity === 'medium') || false;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`
        relative bg-white rounded-xl shadow-lg border-2 transition-all duration-200
        ${isSelected ? 'border-blue-500 shadow-xl' : 'border-gray-200 hover:border-gray-300'}
        ${hasHighSeverityWarnings ? 'ring-2 ring-red-200' : ''}
      `}
    >
      {/* Header Section */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-gray-900">{stock.symbol}</h3>
              <span className="text-sm text-gray-500">{stock.name}</span>
              
              {/* Warning Badge */}
              {hasHighSeverityWarnings && (
                <ExclamationTriangleIcon 
                  className="w-5 h-5 text-red-500 cursor-pointer hover:text-red-700"
                  onClick={() => setShowWarnings(true)}
                />
              )}
              
              {hasMediumSeverityWarnings && !hasHighSeverityWarnings && (
                <ExclamationTriangleIcon 
                  className="w-5 h-5 text-yellow-500 cursor-pointer hover:text-yellow-700"
                  onClick={() => setShowWarnings(true)}
                />
              )}
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-600 capitalize">{stock.sector}</span>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-600">{formatCurrency(stock.market_data?.market_cap)}</span>
            </div>
          </div>

          {/* Recommendation Strength Stars */}
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <StarIcon
                key={i}
                className={`w-4 h-4 ${
                  i < confidenceStars ? 'text-yellow-400 fill-current' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          {/* Goal Alignment Score */}
          <div className={`p-3 rounded-lg ${alignmentColor}`}>
            <div className="text-xs font-medium text-gray-600 mb-1">Goal Alignment</div>
            <div className="text-lg font-bold">
              {formatPercentage(stock.alignmentScore?.overall || 0)}
            </div>
            <div className="text-xs opacity-75">
              {stock.alignmentScore?.confidence ? 
                `${formatPercentage(stock.alignmentScore.confidence)} confidence` : 
                'Calculated'}
            </div>
          </div>

          {/* Risk Assessment */}
          <div className={`p-3 rounded-lg ${riskColor}`}>
            <div className="text-xs font-medium text-gray-600 mb-1">Risk Level</div>
            <div className="text-lg font-bold capitalize">
              {stock.riskAssessment?.level || 'Medium'}
            </div>
            <div className="text-xs opacity-75">
              {stock.riskAssessment?.score ? 
                `${formatPercentage(stock.riskAssessment.score)} score` : 
                'Assessed'}
            </div>
          </div>

          {/* Recommendation Strength */}
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
            <div className="text-xs font-medium text-gray-600 mb-1">Strength</div>
            <div className="text-lg font-bold capitalize">
              {stock.recommendationStrength || 'Moderate'}
            </div>
            <div className="text-xs opacity-75">
              {formatPercentage(stock.predictionConfidence || 0.7)} ML confidence
            </div>
          </div>
        </div>
      </div>

      {/* Key Factors Section */}
      {stock.alignmentScore?.factorScores && (
        <div className="px-6 pb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Key Alignment Factors</h4>
          <div className="space-y-2">
            {Object.entries(stock.alignmentScore.factorScores)
              .sort(([,a], [,b]) => b.score - a.score)
              .slice(0, 3)
              .map(([factor, data]) => (
                <div key={factor} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 capitalize">
                    {factor.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{data.value}</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${data.score * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* AI Explanation Section */}
      <div className="px-6 pb-4">
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          <InformationCircleIcon className="w-4 h-4" />
          {showExplanation ? 'Hide AI Analysis' : 'View AI Analysis'}
        </button>
        
        <AnimatePresence>
          {showExplanation && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 p-4 bg-blue-50 rounded-lg text-sm text-gray-700 leading-relaxed"
            >
              {stock.explanation || 'AI analysis is being generated...'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="px-6 pb-6">
        <div className="flex gap-3">
          <button
            onClick={() => onSelect(stock)}
            disabled={hasHighSeverityWarnings}
            className={`
              flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors
              ${hasHighSeverityWarnings 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : isSelected
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }
            `}
          >
            {isSelected ? 'Selected' : 'Select Stock'}
          </button>
          
          <button
            onClick={() => onViewDetails(stock)}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Details
          </button>
        </div>

        {/* Warning Summary */}
        {stock.warnings && stock.warnings.length > 0 && (
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-gray-500">
              {stock.warnings.length} warning{stock.warnings.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setShowWarnings(true)}
              className="text-blue-600 hover:text-blue-800"
            >
              Review warnings
            </button>
          </div>
        )}
      </div>

      {/* Warning Modal */}
      <AnimatePresence>
        {showWarnings && (
          <WarningModal
            stock={stock}
            onClose={() => setShowWarnings(false)}
            onEducationClick={onEducationClick}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * Warning Modal with Educational Content
 * Research: Educational content for misaligned choices with bias mitigation
 */
const WarningModal = ({ stock, onClose, onEducationClick }) => {
  const highSeverityWarnings = stock.warnings?.filter(w => w.severity === 'high') || [];
  const mediumSeverityWarnings = stock.warnings?.filter(w => w.severity === 'medium') || [];
  const lowSeverityWarnings = stock.warnings?.filter(w => w.severity === 'low') || [];

  const getWarningIcon = (severity) => {
    switch (severity) {
      case 'high': return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'medium': return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      default: return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const getWarningColor = (severity) => {
    switch (severity) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">
              Risk Assessment: {stock.symbol}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Warning Sections */}
        <div className="p-6 space-y-6">
          {/* High Severity Warnings */}
          {highSeverityWarnings.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5" />
                Critical Warnings
              </h4>
              <div className="space-y-3">
                {highSeverityWarnings.map((warning, index) => (
                  <WarningCard 
                    key={index} 
                    warning={warning} 
                    onEducationClick={onEducationClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Medium Severity Warnings */}
          {mediumSeverityWarnings.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-yellow-700 mb-4 flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5" />
                Important Considerations
              </h4>
              <div className="space-y-3">
                {mediumSeverityWarnings.map((warning, index) => (
                  <WarningCard 
                    key={index} 
                    warning={warning} 
                    onEducationClick={onEducationClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Low Severity Warnings */}
          {lowSeverityWarnings.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-blue-700 mb-4 flex items-center gap-2">
                <InformationCircleIcon className="w-5 h-5" />
                Additional Information
              </h4>
              <div className="space-y-3">
                {lowSeverityWarnings.map((warning, index) => (
                  <WarningCard 
                    key={index} 
                    warning={warning} 
                    onEducationClick={onEducationClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Educational Footer */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h5 className="font-medium text-blue-900 mb-2">Learn More</h5>
            <p className="text-sm text-blue-700 mb-3">
              Understanding these warnings can help you make better investment decisions aligned with your goals.
            </p>
            <button
              onClick={() => onEducationClick && onEducationClick(stock.warnings)}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 underline"
            >
              Access Educational Resources →
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            {highSeverityWarnings.length === 0 && (
              <button
                onClick={() => {
                  onClose();
                  // Could trigger selection despite warnings
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Proceed Anyway
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/**
 * Individual Warning Card Component
 */
const WarningCard = ({ warning, onEducationClick }) => {
  const getWarningIcon = (severity) => {
    switch (severity) {
      case 'high': return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'medium': return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      default: return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const getWarningColor = (severity) => {
    switch (severity) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getWarningColor(warning.severity)}`}>
      <div className="flex items-start gap-3">
        {getWarningIcon(warning.severity)}
        <div className="flex-1">
          <h5 className="font-medium text-gray-900 mb-1 capitalize">
            {warning.type.replace(/_/g, ' ')} Warning
          </h5>
          <p className="text-sm text-gray-700 mb-2">{warning.message}</p>
          {warning.action && (
            <p className="text-sm font-medium text-gray-900">
              <span className="text-gray-600">Recommended action:</span> {warning.action}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockRecommendationCard; 