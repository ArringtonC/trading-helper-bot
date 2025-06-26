/**
 * TemplateMatchingInterface - Main interface for intelligent goal-to-stock matching
 * 
 * Research Integration:
 * - Seamless integration with Goal Assessment System
 * - 28.41% returns using genetic algorithms and template-based evolution
 * - TS-Deep-LtM algorithm achieving 30% higher returns than benchmarks
 * - Real-time goal-stock alignment with >80% accuracy target
 * - Educational interventions for bias mitigation
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChartBarIcon,
  CogIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BeakerIcon,
  TrophyIcon,
  AcademicCapIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

import GoalBasedTemplateSystem from '../../services/goals/GoalBasedTemplateSystem';
import StockRecommendationCard from './StockRecommendationCard';
import { useGoalFirstFlow } from '../../hooks/useGoalFirstFlow';

/**
 * Template Matching Interface Component
 */
const TemplateMatchingInterface = ({ 
  userGoals = [],
  accountInfo = {},
  onStockSelect,
  onEducationRequest,
  className = ""
}) => {
  // State management
  const [templateSystem] = useState(() => new GoalBasedTemplateSystem());
  const [recommendations, setRecommendations] = useState([]);
  const [selectedStocks, setSelectedStocks] = useState(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [templateMetrics, setTemplateMetrics] = useState(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Hook integration with Goal Assessment System
  const { updateProgressData } = useGoalFirstFlow();

  // Matching preferences
  const [preferences, setPreferences] = useState({
    maxResults: 10,
    maxPerGoal: 5,
    riskTolerance: 'balanced',
    enableResearch: true,
    minimumAlignment: 0.6
  });

  // Initialize template system
  useEffect(() => {
    const initializeSystem = async () => {
      try {
        // Listen for template evolution events
        templateSystem.on('template_evolved', (metrics) => {
          setTemplateMetrics(metrics);
          console.log('Template evolved:', metrics);
        });

        templateSystem.on('recommendations_generated', (metrics) => {
          updateProgressData('template_matching', {
            averageAlignment: metrics.averageAlignment,
            recommendationCount: metrics.recommendationCount,
            timestamp: Date.now()
          });
        });

        templateSystem.on('ml_models_initialized', () => {
          console.log('ML models initialized successfully');
        });

      } catch (error) {
        console.error('Failed to initialize template system:', error);
        setError('Failed to initialize template matching system');
      }
    };

    initializeSystem();

    return () => {
      templateSystem.removeAllListeners();
    };
  }, [templateSystem, updateProgressData]);

  // Generate recommendations when goals change
  useEffect(() => {
    if (userGoals.length > 0) {
      generateRecommendations();
    }
  }, [userGoals, accountInfo, preferences, generateRecommendations]);

  /**
   * Generate stock recommendations using genetic algorithms and TS-Deep-LtM
   * Research: >80% accuracy target for goal-stock alignment
   */
  const generateRecommendations = useCallback(async () => {
    if (userGoals.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      // Generate recommendations using the template system
      const recs = await templateSystem.generateRecommendations(
        userGoals,
        accountInfo,
        preferences
      );

      setRecommendations(recs);

      // Update goal flow data
      updateProgressData('stock_recommendations', {
        recommendationCount: recs.length,
        averageAlignment: recs.reduce((sum, r) => {
          const stockCount = r.stocks?.length || 0;
          if (stockCount === 0) return sum;
          const avgAlignment = r.stocks.reduce((s, stock) => s + stock.alignmentScore?.overall || 0, 0) / stockCount;
          return sum + avgAlignment;
        }, 0) / recs.length,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      setError('Failed to generate stock recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [userGoals, accountInfo, preferences, templateSystem, updateProgressData]);

  /**
   * Handle stock selection with validation
   */
  const handleStockSelect = useCallback((stock) => {
    const newSelected = new Map(selectedStocks);
    
    if (selectedStocks.has(stock.symbol)) {
      newSelected.delete(stock.symbol);
    } else {
      newSelected.set(stock.symbol, {
        ...stock,
        selectedAt: Date.now(),
        goalId: stock.goalId
      });
    }
    
    setSelectedStocks(newSelected);
    
    if (onStockSelect) {
      onStockSelect(Array.from(newSelected.values()));
    }
  }, [selectedStocks, onStockSelect]);

  /**
   * Handle educational content requests
   */
  const handleEducationRequest = useCallback((warnings) => {
    if (onEducationRequest) {
      onEducationRequest({
        type: 'risk_warnings',
        warnings,
        context: 'stock_selection'
      });
    }
  }, [onEducationRequest]);

  // Compute summary statistics
  const summaryStats = useMemo(() => {
    const allStocks = recommendations.flatMap(r => r.stocks || []);
    const totalStocks = allStocks.length;
    const avgAlignment = totalStocks > 0 ? 
      allStocks.reduce((sum, s) => sum + (s.alignmentScore?.overall || 0), 0) / totalStocks : 0;
    
    const riskDistribution = allStocks.reduce((acc, stock) => {
      const level = stock.riskAssessment?.level || 'medium';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});

    const strongRecommendations = allStocks.filter(s => s.recommendationStrength === 'strong').length;

    return {
      totalRecommendations: totalStocks,
      averageAlignment: avgAlignment,
      riskDistribution,
      strongRecommendations,
      selectedCount: selectedStocks.size
    };
  }, [recommendations, selectedStocks]);

  if (userGoals.length === 0) {
    return (
      <div className={`bg-blue-50 rounded-xl p-8 text-center ${className}`}>
        <BeakerIcon className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Complete Goal Assessment First
        </h3>
        <p className="text-blue-700">
          Define your investment goals to receive personalized stock recommendations 
          based on advanced genetic algorithms and machine learning.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ChartBarIcon className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Intelligent Stock Matching
              </h2>
              <p className="text-gray-600">
                Powered by genetic algorithms and deep learning (TS-Deep-LtM)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <CogIcon className="w-4 h-4" />
              Settings
            </button>
            
            <button
              onClick={generateRecommendations}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Generating...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">
              {summaryStats.totalRecommendations}
            </div>
            <div className="text-sm text-blue-700">Total Matches</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">
              {(summaryStats.averageAlignment * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-green-700">Avg Alignment</div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">
              {summaryStats.strongRecommendations}
            </div>
            <div className="text-sm text-purple-700">Strong Picks</div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {summaryStats.selectedCount}
            </div>
            <div className="text-sm text-yellow-700">Selected</div>
          </div>
        </div>

        {/* Research Metrics Badge */}
        {templateMetrics && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
          >
            <TrophyIcon className="w-5 h-5 text-green-600" />
            <div className="text-sm">
              <span className="font-medium text-green-900">Template Evolution:</span>
              <span className="text-green-700 ml-2">
                +{templateMetrics.improvementPct?.toFixed(1)}% performance improvement detected
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Advanced Settings Panel */}
      <AnimatePresence>
        {showAdvancedSettings && (
          <AdvancedSettingsPanel 
            preferences={preferences}
            onPreferencesChange={setPreferences}
            onClose={() => setShowAdvancedSettings(false)}
          />
        )}
      </AnimatePresence>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3"
        >
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="text-red-700">{error}</div>
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-blue-50 rounded-xl p-8 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <ArrowPathIcon className="w-6 h-6 text-blue-600 animate-spin" />
            <span className="text-lg font-medium text-blue-900">
              Generating Recommendations
            </span>
          </div>
          <p className="text-blue-700">
            Our genetic algorithms are analyzing thousands of potential matches...
          </p>
        </motion.div>
      )}

      {/* Recommendations by Goal */}
      {!isLoading && recommendations.length > 0 && (
        <div className="space-y-8">
          {recommendations.map((recommendation) => (
            <RecommendationSection
              key={recommendation.goalId}
              recommendation={recommendation}
              selectedStocks={selectedStocks}
              onStockSelect={handleStockSelect}
              onEducationRequest={handleEducationRequest}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && recommendations.length === 0 && !error && (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <InformationCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Recommendations Available
          </h3>
          <p className="text-gray-600 mb-4">
            We couldn't find suitable stock matches for your current goals and account configuration.
          </p>
          <button
            onClick={generateRecommendations}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Individual Recommendation Section by Goal
 */
const RecommendationSection = ({ 
  recommendation, 
  selectedStocks, 
  onStockSelect, 
  onEducationRequest 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Handle account requirement errors
  if (recommendation.type === 'account_requirement_error') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-50 border border-red-200 rounded-xl p-6"
      >
        <div className="flex items-start gap-4">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Account Requirement Issue
            </h3>
            <p className="text-red-700 mb-4">{recommendation.error}</p>
            
            {recommendation.warnings?.map((warning, index) => (
              <div key={index} className="bg-red-100 border border-red-200 rounded-lg p-3 mb-3">
                <div className="text-sm font-medium text-red-900 mb-1">
                  {warning.type.replace(/_/g, ' ').toUpperCase()}
                </div>
                <div className="text-sm text-red-700">{warning.message}</div>
                {warning.action && (
                  <div className="text-sm text-red-800 font-medium mt-2">
                    Action: {warning.action}
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={() => onEducationRequest(recommendation.warnings)}
              className="text-sm font-medium text-red-600 hover:text-red-800 underline flex items-center gap-1"
            >
              <AcademicCapIcon className="w-4 h-4" />
              Learn More About Requirements
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  const stocks = recommendation.stocks || [];
  const hasValidStocks = stocks.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden"
    >
      {/* Goal Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {recommendation.goalTitle}
            </h3>
            <p className="text-gray-600 capitalize">
              {recommendation.goalCategory.replace(/_/g, ' ')} • {stocks.length} matches found
            </p>
            
            {recommendation.averageAlignmentScore && (
              <div className="mt-2 text-sm text-blue-600">
                Average alignment: {(recommendation.averageAlignmentScore * 100).toFixed(1)}%
              </div>
            )}
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>

        {/* Template Evolution Metrics */}
        {recommendation.templateEvolutionMetrics && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm font-medium text-blue-900 mb-1">
              Template Performance (Genetic Algorithm)
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-blue-700">Success Rate:</span>
                <span className="font-medium ml-1">
                  {(recommendation.templateEvolutionMetrics.successRate * 100).toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-blue-700">Avg Return:</span>
                <span className="font-medium ml-1">
                  {(recommendation.templateEvolutionMetrics.averageReturn * 100).toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-blue-700">Sample Size:</span>
                <span className="font-medium ml-1">
                  {recommendation.templateEvolutionMetrics.sampleSize}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stock Recommendations */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-6"
          >
            {hasValidStocks ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {stocks.map((stock) => (
                  <StockRecommendationCard
                    key={stock.symbol}
                    stock={stock}
                    isSelected={selectedStocks.has(stock.symbol)}
                    onSelect={onStockSelect}
                    onViewDetails={(stock) => console.log('View details:', stock)}
                    onEducationClick={onEducationRequest}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <InformationCircleIcon className="w-8 h-8 mx-auto mb-2" />
                <p>No suitable stocks found for this goal.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * Advanced Settings Panel
 */
const AdvancedSettingsPanel = ({ preferences, onPreferencesChange, onClose }) => {
  const handleChange = (key, value) => {
    onPreferencesChange(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Advanced Settings</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Results per Goal
          </label>
          <select
            value={preferences.maxPerGoal}
            onChange={(e) => handleChange('maxPerGoal', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={3}>3 stocks</option>
            <option value={5}>5 stocks</option>
            <option value={8}>8 stocks</option>
            <option value={10}>10 stocks</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Alignment Score
          </label>
          <select
            value={preferences.minimumAlignment}
            onChange={(e) => handleChange('minimumAlignment', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={0.4}>40% (Relaxed)</option>
            <option value={0.6}>60% (Balanced)</option>
            <option value={0.7}>70% (Selective)</option>
            <option value={0.8}>80% (Strict)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Risk Tolerance
          </label>
          <select
            value={preferences.riskTolerance}
            onChange={(e) => handleChange('riskTolerance', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="conservative">Conservative</option>
            <option value="balanced">Balanced</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={preferences.enableResearch}
              onChange={(e) => handleChange('enableResearch', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Enable Research Mode (TS-Deep-LtM)
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Uses advanced AI for enhanced stock analysis
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default TemplateMatchingInterface;