/**
 * @fileoverview Debug Section Component - Development & Analysis Tools Interface
 * 
 * This component provides a collapsible debug interface for developers and advanced users
 * to inspect raw parsing results, debug logs, and ML recommendations during IBKR statement
 * analysis. It serves as a diagnostic tool for troubleshooting parsing issues and
 * understanding the internal workings of the analysis pipeline.
 * 
 * Key Features:
 * - Collapsible interface to keep UI clean for regular users
 * - Raw JSON display of parse results with formatted output
 * - Parser debug logs for troubleshooting parsing issues
 * - ML recommendation integration with error handling
 * - Responsive design with scrollable content areas
 * - Loading states and error feedback for ML operations
 * 
 * Use Cases:
 * - Development debugging and testing
 * - Advanced user analysis and verification
 * - Troubleshooting parsing failures
 * - ML model validation and testing
 * - Export data verification
 * 
 * Integration Points:
 * - Import & Analyze Page: Primary debug interface
 * - IBKR Parser Service: Displays parsing output and debug logs
 * - ML/HMM Service: Shows machine learning recommendations
 * - Error Handling: Displays parsing and ML service errors
 * 
 * @author Trading Helper Bot Team
 * @version 2.1.0
 * @since 2024-Q4
 */

import React from 'react';

/**
 * Props interface for the DebugSection component.
 * Defines the data inputs and callback functions required for debug functionality.
 * 
 * @interface DebugSectionProps
 */
interface DebugSectionProps {
  /** Raw parsing result object from IBKR statement processing (null if no file parsed) */
  parseResult: any | null;
  /** Callback function to trigger ML recommendation generation */
  onGetMLRecommendations: () => void;
  /** Loading state indicator for ML recommendation requests */
  mlLoading: boolean;
  /** Error message from ML service operations (null if no error) */
  mlError: string | null;
  /** Array of ML recommendations or null if none generated */
  mlRecommendations: any[] | null;
}

/**
 * DebugSection Component
 * 
 * A developer-focused debug interface that provides transparent access to internal
 * processing data, parsing results, and ML analysis outputs. The component uses
 * HTML details/summary elements for a clean, collapsible interface that doesn't
 * clutter the main user experience while providing powerful diagnostic capabilities.
 * 
 * The component handles three primary data sources:
 * 1. Raw Parse Results: Complete parsing output with metadata
 * 2. Debug Logs: Parser-generated diagnostic messages
 * 3. ML Recommendations: Machine learning analysis results
 * 
 * All data is displayed in formatted JSON with appropriate scrolling and sizing
 * to handle large datasets without breaking the layout.
 * 
 * @component
 * @param {DebugSectionProps} props - Component props
 * @returns {JSX.Element} The rendered debug section interface
 * 
 * @example
 * ```tsx
 * <DebugSection
 *   parseResult={rawParsingData}
 *   onGetMLRecommendations={handleMLRequest}
 *   mlLoading={isMLProcessing}
 *   mlError={mlServiceError}
 *   mlRecommendations={currentRecommendations}
 * />
 * ```
 */
const DebugSection: React.FC<DebugSectionProps> = ({
  parseResult,
  onGetMLRecommendations,
  mlLoading,
  mlError,
  mlRecommendations
}) => {
  return (
    // Main collapsible container - keeps debug info hidden by default
    <details className="mt-6">
      <summary className="font-semibold text-gray-700">Advanced / Debug</summary>
      
      {/* Raw Parse Result Display - Only shown when data is available */}
      {parseResult && (
        <div className="mt-4">
          <h4>Debug: Raw Parse Result</h4>
          {/* 
            Pre-formatted JSON display with constrained height and scrolling
            Background color and padding for readability
            Small font size to fit more data in limited space
          */}
          <pre style={{ 
            maxHeight: 300, 
            overflow: 'auto', 
            background: '#f0f0f0', 
            fontSize: 12, 
            padding: 8 
          }}>
            {JSON.stringify(parseResult, null, 2)}
          </pre>
        </div>
      )}
      
      {/* Nested Debug Logs Section - Secondary collapsible for parser diagnostics */}
      <details className="mb-4">
        <summary>Parser Debug Logs</summary>
        {/* 
          Debug logs display with smaller height constraint
          Shows parser-generated diagnostic messages
          Handles cases where debug logs may not exist
        */}
        <pre style={{ maxHeight: 200, overflow: 'auto', fontSize: 12 }}>
          {parseResult?.debug?.join('\n')}
        </pre>
      </details>
      
      {/* ML Recommendations Section - Interactive analysis tools */}
      <div className="mt-4">
        {/* 
          ML trigger button with comprehensive state handling:
          - Disabled when loading or no parse data available
          - Visual feedback for loading state with spinner text
          - Hover effects for interactive feedback
        */}
        <button 
          className="mt-3 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50" 
          onClick={onGetMLRecommendations}
          disabled={mlLoading || !parseResult}
        >
          {mlLoading ? 'Loading...' : 'Get ML Recommendations'}
        </button>
        
        {/* ML Error Display - Shows service errors with appropriate styling */}
        {mlError && (
          <div className="mt-2 p-2 bg-red-50 text-red-700 rounded text-sm">
            {mlError}
          </div>
        )}
        
        {/* ML Recommendations Results - Formatted JSON output */}
        {mlRecommendations && mlRecommendations.length > 0 && (
          <div className="mt-4">
            <h5 className="font-semibold text-gray-700">ML Recommendations:</h5>
            {/* 
              Formatted ML output with constrained height
              Gray background for distinction from other debug content
              Extra small font for dense data display
            */}
            <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(mlRecommendations, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </details>
  );
};

export default DebugSection; 
 
 
 