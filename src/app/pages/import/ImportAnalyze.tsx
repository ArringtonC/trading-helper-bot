/**
 * @fileoverview Import & Analyze Page - IBKR Statement Processing & Rule Engine Integration
 * 
 * This page provides a comprehensive interface for importing and analyzing IBKR (Interactive Brokers)
 * activity statements. It integrates with the rule engine for real-time trade evaluation and 
 * provides ML-powered recommendations for trading strategies.
 * 
 * Key Features:
 * - Secure drag-and-drop file upload with validation
 * - Real-time IBKR statement parsing and data extraction
 * - Integrated rule engine for batch trade evaluation
 * - ML recommendations via HMM (Hidden Markov Model) service
 * - Interactive debugging and analysis tools
 * 
 * Architecture:
 * - Uses custom hooks for modular state management
 * - Persistent configuration storage via IndexedDB
 * - Event-driven rule evaluation with real-time feedback
 * - Comprehensive error handling and user feedback
 * 
 * @author Trading Helper Bot Team
 * @version 1.0.0
 * @since 2024-Q4
 */

import React, { useState, useEffect } from 'react';
import { IBKRActivityStatementParser } from '../../../features/broker-integration/services/brokers/parsers/IBKRActivityStatementParser';

import { useRuleEngine } from '../../../shared/hooks/useRuleEngine';
import { useMLRecommendations } from '../../../shared/hooks/useMLRecommendations';
import { usePersistentState } from '../../../shared/hooks/usePersistentState';
import SecureDragDropUpload from '../../../shared/components/ImportAnalyze/SecureDragDropUpload';
import EnhancedTradesTable from '../../../shared/components/ImportAnalyze/EnhancedTradesTable';
import RuleEvaluationControls from '../../../shared/components/ImportAnalyze/RuleEvaluationControls';
import DebugSection from '../../../shared/components/ImportAnalyze/DebugSection';

/**
 * Configuration interface for rule engine evaluation settings.
 * Controls how trades are evaluated and what rules are applied.
 * 
 * @interface RuleConfiguration
 */
interface RuleConfiguration {
  /** Maximum position size allowed (percentage of account) */
  maxPositionSize: number;
  /** Enable detection of consecutive loss patterns */
  enableBackToBackLossDetection: boolean;
  /** Enable cost basis validation checks */
  enableCostBasisChecks: boolean;
  /** Automatically evaluate rules when new data is uploaded */
  autoEvaluateOnUpload: boolean;
  /** Rule evaluation processing mode */
  evaluationMode: 'auto' | 'batch' | 'single';
}

/**
 * Default configuration for rule evaluation.
 * Optimized for balanced risk management and comprehensive analysis.
 * 
 * @constant {RuleConfiguration}
 */
const DEFAULT_CONFIG: RuleConfiguration = {
  maxPositionSize: 10,
  enableBackToBackLossDetection: true,
  enableCostBasisChecks: true,
  autoEvaluateOnUpload: true,
  evaluationMode: 'auto'
};

/**
 * Import & Analyze Page Component
 * 
 * Main component that orchestrates IBKR statement import, parsing, and analysis.
 * Integrates multiple subsystems including file upload, rule engine, and ML recommendations.
 * 
 * @component
 * @returns {JSX.Element} The rendered Import & Analyze page
 * 
 * @example
 * ```tsx
 * // Used in App.tsx routing
 * <Route path="/import-analyze" element={<ImportAnalyze />} />
 * ```
 */
const ImportAnalyze: React.FC = () => {
  // ===== STATE MANAGEMENT =====
  /** Currently selected file for processing */
  const [file, setFile] = useState<File | null>(null);
  /** Parsing operation status indicator */
  const [parsing, setParsing] = useState(false);
  /** Parsed statement data and metadata */
  const [parseResult, setParseResult] = useState<any | null>(null);
  /** Error message from parsing or validation operations */
  const [error, setError] = useState<string | null>(null);

  // ===== PERSISTENT CONFIGURATION =====
  /** 
   * Rule configuration with persistent storage.
   * Automatically syncs with IndexedDB for user preference persistence.
   */
  const [ruleConfig] = usePersistentState<RuleConfiguration>('ruleEvaluationConfig', DEFAULT_CONFIG);

  // ===== CUSTOM HOOKS INTEGRATION =====
  /** 
   * Rule engine hook providing batch evaluation capabilities.
   * Handles trade rule processing and result aggregation.
   */
  const { batchResults, isEvaluating, evaluateRules, clearResults } = useRuleEngine(ruleConfig);
  
  /** 
   * ML recommendations hook for advanced trading insights.
   * Integrates with HMM service for pattern recognition and strategy suggestions.
   */
  const { mlRecommendations, mlLoading, mlError, getMLRecommendations } = useMLRecommendations();

  // ===== EVENT HANDLERS =====
  
  /**
   * Handles file selection from upload component.
   * Resets parsing state and errors when new file is selected.
   * 
   * @param {File | null} file - The selected file or null to clear
   */
  const handleFileChange = (file: File | null) => {
    setFile(file);
    if (file) {
      setParseResult(null);
      setError(null);
    }
  };

  /**
   * Processes the selected IBKR statement file.
   * Performs comprehensive parsing and extracts trading data with debug information.
   * 
   * @async
   * @function handleParse
   * @throws {Error} When file parsing fails or statement format is invalid
   */
  const handleParse = async () => {
    if (!file) return;
    
    setParsing(true);
    setError(null);
    setParseResult(null);
    
    try {
      // Read file content as text
      const content = await file.text();
      
      // Initialize IBKR parser with comprehensive debug logging
      const parser = new IBKRActivityStatementParser(content);
      
      // Parse statement and extract trading data
      const result = parser.parse();
      
      // Combine parsed data with debug information for troubleshooting
      setParseResult({ ...result, debug: parser.getDebugState() });
    } catch (err: any) {
      setError(err.message || 'Failed to parse statement');
    } finally {
      setParsing(false);
    }
  };

  /**
   * Initiates ML recommendation generation for parsed trading data.
   * Leverages HMM service for pattern analysis and trading strategy suggestions.
   */
  const handleGetMLRecommendations = () => {
    getMLRecommendations(parseResult);
  };

  // ===== EFFECTS =====
  
  /**
   * Auto-evaluation effect - triggers rule evaluation when new data is parsed.
   * Only executes if auto-evaluation is enabled in configuration.
   * 
   * Dependencies: parseResult, evaluateRules, ruleConfig.autoEvaluateOnUpload
   */
  useEffect(() => {
    if (parseResult && ruleConfig.autoEvaluateOnUpload) {
      console.log('PARSE RESULT:', parseResult);
      evaluateRules(parseResult);
    }
  }, [parseResult, evaluateRules, ruleConfig.autoEvaluateOnUpload]);

  // ===== RENDER =====
  return (
    <div className="container py-4">
      <h2 className="mb-4">Import & Analyze IBKR Statement</h2>
      
      {/* File Upload Section - Secure drag-and-drop with validation */}
      <SecureDragDropUpload
        file={file}
        parsing={parsing}
        error={error}
        onFileChange={handleFileChange}
        onParse={handleParse}
      />

      {/* Rule Evaluation Controls - Only show when data is available */}
      {parseResult && (
        <RuleEvaluationControls
          isEvaluating={isEvaluating}
          batchResults={batchResults}
          onEvaluateRules={() => evaluateRules(parseResult)}
          onClearResults={clearResults}
          parseResult={parseResult}
        />
      )}

      {/* Results Section - Trading data analysis and insights */}
      {parseResult && (
        <>
          {/* Enhanced trades table with rule evaluation integration */}
          <EnhancedTradesTable
            trades={parseResult.trades || []}
            batchResults={batchResults}
          />
          
          {/* Debug and ML recommendations section */}
          <DebugSection
            parseResult={parseResult}
            onGetMLRecommendations={handleGetMLRecommendations}
            mlLoading={mlLoading}
            mlError={mlError}
            mlRecommendations={mlRecommendations}
          />
        </>
      )}
    </div>
  );
};

export default ImportAnalyze; 