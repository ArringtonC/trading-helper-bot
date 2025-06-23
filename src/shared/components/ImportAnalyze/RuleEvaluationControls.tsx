/**
 * @fileoverview Rule Evaluation Controls Component - Configuration & Management Interface
 * 
 * This component provides a comprehensive control panel for managing trading rule evaluation
 * settings, triggering batch analyses, and monitoring rule compliance results. It serves as
 * the central interface for configuring risk management parameters and controlling when
 * and how rule evaluations are performed.
 * 
 * Key Features:
 * - Multiple evaluation modes (Auto, Batch, Manual) with different triggering behaviors
 * - Persistent configuration storage using localStorage for user preferences
 * - Real-time rule violation monitoring and summary statistics
 * - Advanced configuration panel for fine-tuning rule parameters
 * - Integration with rule evaluation engine for batch processing
 * - Visual feedback and status indicators for evaluation progress
 * 
 * Configuration Management:
 * - Position sizing limits and thresholds
 * - Risk detection toggles (back-to-back losses, cost basis checks)
 * - Evaluation timing preferences (auto vs manual)
 * - Persistent storage of user preferences across sessions
 * 
 * Evaluation Modes:
 * - Auto: Automatic evaluation when files are uploaded
 * - Batch: Manual trigger for processing all trades together
 * - Manual: Single-trade evaluation with real-time feedback
 * 
 * Integration Points:
 * - Import & Analyze Page: Primary configuration interface
 * - Rule Engine: Triggers batch evaluation with current settings
 * - Local Storage: Persists user preferences and evaluation history
 * 
 * @author Trading Helper Bot Team
 * @version 2.1.0
 * @since 2024-Q4
 */

import React, { useState, useEffect } from 'react';

/**
 * Rule evaluation mode configuration interface.
 * Defines the available evaluation modes and their characteristics.
 * 
 * @interface RuleEvaluationMode
 */
interface RuleEvaluationMode {
  /** Unique identifier for the evaluation mode */
  id: 'auto' | 'batch' | 'single';
  /** Human-readable label for UI display */
  label: string;
  /** Detailed description of mode behavior */
  description: string;
  /** Emoji icon for visual identification */
  icon: string;
}

/**
 * Complete rule configuration interface.
 * Encompasses all configurable parameters for rule evaluation behavior.
 * 
 * @interface RuleConfiguration
 */
interface RuleConfiguration {
  /** Maximum allowed position size (percentage or absolute value) */
  maxPositionSize: number;
  /** Whether to detect and flag consecutive losing trades */
  enableBackToBackLossDetection: boolean;
  /** Whether to enforce cost basis sizing rules */
  enableCostBasisChecks: boolean;
  /** Whether to automatically evaluate rules when files are uploaded */
  autoEvaluateOnUpload: boolean;
  /** Current evaluation mode selection */
  evaluationMode: 'auto' | 'batch' | 'single';
}

/**
 * Props interface for the RuleEvaluationControls component.
 * Defines the external dependencies and callback functions.
 * 
 * @interface RuleEvaluationControlsProps
 */
interface RuleEvaluationControlsProps {
  /** Whether rule evaluation is currently in progress */
  isEvaluating: boolean;
  /** Array of batch evaluation results or null if no evaluation performed */
  batchResults: any[] | null;
  /** Callback function to trigger rule evaluation */
  onEvaluateRules: () => void;
  /** Callback function to clear current evaluation results */
  onClearResults: () => void;
  /** Parsed trade data available for evaluation */
  parseResult: any;
}

/**
 * Available evaluation modes with their configurations.
 * Defines the three primary evaluation strategies and their behaviors.
 * 
 * @constant {RuleEvaluationMode[]} EVALUATION_MODES
 */
const EVALUATION_MODES: RuleEvaluationMode[] = [
  {
    id: 'auto',
    label: 'Auto',
    description: 'Automatically evaluate rules when files are uploaded',
    icon: '⚡'
  },
  {
    id: 'batch',
    label: 'Batch',
    description: 'Process all trades together for maximum accuracy',
    icon: '📦'
  },
  {
    id: 'single',
    label: 'Manual',
    description: 'Manual evaluation with real-time feedback',
    icon: '🎯'
  }
];

/**
 * Default rule configuration values.
 * Provides sensible defaults for first-time users and fallback values.
 * 
 * @constant {RuleConfiguration} DEFAULT_CONFIG
 */
const DEFAULT_CONFIG: RuleConfiguration = {
  maxPositionSize: 10,
  enableBackToBackLossDetection: true,
  enableCostBasisChecks: true,
  autoEvaluateOnUpload: true,
  evaluationMode: 'auto'
};

/**
 * RuleEvaluationControls Component
 * 
 * A comprehensive control panel for managing trading rule evaluation settings and
 * triggering batch analyses. Provides both basic and advanced configuration options
 * with persistent storage of user preferences. Integrates with the rule evaluation
 * engine to provide real-time feedback and violation monitoring.
 * 
 * The component manages three primary concerns:
 * 1. Configuration Management: User settings and preferences
 * 2. Evaluation Control: Triggering and monitoring rule evaluation
 * 3. Results Display: Summary statistics and violation counts
 * 
 * Features persistent configuration storage, real-time status updates, and
 * responsive design for both desktop and mobile interfaces.
 * 
 * @component
 * @param {RuleEvaluationControlsProps} props - Component props
 * @returns {JSX.Element} The rendered rule evaluation controls panel
 * 
 * @example
 * ```tsx
 * <RuleEvaluationControls
 *   isEvaluating={evaluationInProgress}
 *   batchResults={currentResults}
 *   onEvaluateRules={handleEvaluateRules}
 *   onClearResults={handleClearResults}
 *   parseResult={parsedTradeData}
 * />
 * ```
 */
const RuleEvaluationControls: React.FC<RuleEvaluationControlsProps> = ({
  isEvaluating,
  batchResults,
  onEvaluateRules,
  onClearResults,
  parseResult
}) => {
  // ===== STATE MANAGEMENT =====
  /** Current rule configuration with user preferences */
  const [config, setConfig] = useState<RuleConfiguration>(DEFAULT_CONFIG);
  /** Toggle state for showing/hiding advanced configuration options */
  const [showAdvanced, setShowAdvanced] = useState(false);
  /** Timestamp of the most recent rule evaluation for tracking */
  const [lastEvaluationTime, setLastEvaluationTime] = useState<Date | null>(null);

  // ===== PERSISTENCE & INITIALIZATION =====
  /**
   * Loads persistent configuration and evaluation history from localStorage on component mount.
   * Merges saved configuration with defaults to handle partial saves and version updates.
   * Also restores the last evaluation timestamp for user reference.
   * 
   * This effect runs only once on mount to initialize the component state.
   */
  useEffect(() => {
    // Load and parse saved rule configuration
    const savedConfig = localStorage.getItem('ruleEvaluationConfig');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        // Merge with defaults to handle missing keys and version updates
        setConfig({ ...DEFAULT_CONFIG, ...parsed });
      } catch (error) {
        console.warn('Failed to load saved rule configuration:', error);
        // Fall back to default configuration on parse error
      }
    }

    // Restore last evaluation timestamp for user reference
    const lastEvalTime = localStorage.getItem('lastRuleEvaluationTime');
    if (lastEvalTime) {
      setLastEvaluationTime(new Date(lastEvalTime));
    }
  }, []);

  /**
   * Persists configuration changes to localStorage whenever the config state updates.
   * Ensures user preferences are maintained across browser sessions and page reloads.
   * 
   * This effect runs whenever the config object changes.
   */
  useEffect(() => {
    localStorage.setItem('ruleEvaluationConfig', JSON.stringify(config));
  }, [config]);

  /**
   * Updates evaluation timestamp whenever new batch results are received.
   * Tracks when evaluations were performed for user awareness and debugging.
   * 
   * This effect runs whenever batchResults changes and contains data.
   */
  useEffect(() => {
    if (batchResults && batchResults.length > 0) {
      const now = new Date();
      setLastEvaluationTime(now);
      localStorage.setItem('lastRuleEvaluationTime', now.toISOString());
    }
  }, [batchResults]);

  // ===== EVENT HANDLERS =====
  /**
   * Updates a specific configuration parameter with type safety.
   * Provides a centralized way to modify configuration while maintaining immutability.
   * 
   * @param {keyof RuleConfiguration} key - The configuration key to update
   * @param {any} value - The new value for the configuration parameter
   */
  const handleConfigChange = (key: keyof RuleConfiguration, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  /**
   * Triggers rule evaluation by calling the parent component's evaluation function.
   * Serves as a wrapper to potentially add additional logic or validation in the future.
   */
  const handleEvaluate = () => {
    onEvaluateRules();
  };

  /**
   * Clears current evaluation results and resets evaluation history.
   * Removes both in-memory state and persistent storage of evaluation data.
   */
  const handleClear = () => {
    onClearResults();
    localStorage.removeItem('lastRuleEvaluationTime');
    setLastEvaluationTime(null);
  };

  // ===== COMPUTED VALUES =====
  /**
   * Analyzes batch results to generate summary statistics for display.
   * Calculates key metrics including total trades, rule violations, and loss patterns.
   * 
   * @returns {object|null} Summary statistics object or null if no results available
   * @returns {number} totalTrades - Total number of trades analyzed
   * @returns {number} triggeredRules - Number of trades that violated rules
   * @returns {number} backToBackLosses - Number of trades flagged for consecutive losses
   */
  const getRuleStatusSummary = () => {
    if (!batchResults) return null;
    
    const totalTrades = batchResults.length;
    const triggeredRules = batchResults.filter(r => r.ruleTriggered).length;
    const backToBackLosses = batchResults.filter(r => r.lossFlag).length;
    
    return { totalTrades, triggeredRules, backToBackLosses };
  };

  /** Generated summary statistics for the current batch results */
  const statusSummary = getRuleStatusSummary();

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Rule Evaluation Controls</h3>
          <p className="text-sm text-gray-600">Configure and manage trading rule evaluation</p>
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
        >
          {showAdvanced ? '🔽 Hide Advanced' : '🔧 Advanced Settings'}
        </button>
      </div>

      {/* Evaluation Mode Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Evaluation Mode</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {EVALUATION_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleConfigChange('evaluationMode', mode.id)}
              className={`p-4 border rounded-lg text-left transition-colors ${
                config.evaluationMode === mode.id
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">{mode.icon}</span>
                <span className="font-medium">{mode.label}</span>
              </div>
              <p className="text-xs">{mode.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Configuration */}
      {showAdvanced && (
        <div className="space-y-4 border-t pt-4">
          <h4 className="font-medium text-gray-900">Rule Configuration</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Position Size
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={config.maxPositionSize}
                onChange={(e) => handleConfigChange('maxPositionSize', parseInt(e.target.value) || 10)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.enableBackToBackLossDetection}
                  onChange={(e) => handleConfigChange('enableBackToBackLossDetection', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Back-to-back loss detection</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.enableCostBasisChecks}
                  onChange={(e) => handleConfigChange('enableCostBasisChecks', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Cost basis size checks</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.autoEvaluateOnUpload}
                  onChange={(e) => handleConfigChange('autoEvaluateOnUpload', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Auto-evaluate on file upload</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-3">
          <button
            onClick={handleEvaluate}
            disabled={isEvaluating || !parseResult}
            className={`px-6 py-2 font-medium rounded-lg transition-colors ${
              isEvaluating || !parseResult
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isEvaluating ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                Evaluating...
              </>
            ) : (
              <>🔍 Evaluate Rules</>
            )}
          </button>
          
          {batchResults && (
            <button
              onClick={handleClear}
              className="px-4 py-2 font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
            >
              🗑️ Clear Results
            </button>
          )}
        </div>

        {/* Status Summary */}
        {statusSummary && (
          <div className="text-sm text-gray-600 space-y-1">
            <div>📊 {statusSummary.totalTrades} trades analyzed</div>
            {statusSummary.triggeredRules > 0 && (
              <div className="text-red-600">⚠️ {statusSummary.triggeredRules} rule violations</div>
            )}
            {statusSummary.backToBackLosses > 0 && (
              <div className="text-amber-600">🔔 {statusSummary.backToBackLosses} back-to-back losses</div>
            )}
          </div>
        )}
      </div>

      {/* Last Evaluation Time */}
      {lastEvaluationTime && (
        <div className="text-xs text-gray-500 border-t pt-3">
          Last evaluation: {lastEvaluationTime.toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default RuleEvaluationControls; 
 
 
 