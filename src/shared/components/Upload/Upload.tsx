import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { handleUpload } from '../../utils/handleUpload'; // Import the refactored handleUpload
import ReconciliationReport from '../Reconciliation/ReconciliationReport'; // Import the report component
import { ReconciliationResult } from '../../services/ReconciliationService'; // Import the result type

// Define the structure for the summary state
interface SummaryState {
  trades: number;
  positions: number;
  open: number;
  closed: number;
  realizedPL: number;
}

const Upload: React.FC = () => {
  const [summary, setSummary] = useState<SummaryState>({ trades: 0, positions: 0, open: 0, closed: 0, realizedPL: 0 });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // State for reconciliation results
  const [reconciliationResult, setReconciliationResult] = useState<ReconciliationResult | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      setError('Please select a file.');
      return;
    }
    // Reset reconciliation result before new upload
    setReconciliationResult(null);
    // Call the refactored handleUpload, passing state setters
    const result = await handleUpload(
      acceptedFiles,
      () => {}, // setTrades (no-op)
      () => {}, // setPositions (no-op)
      setSummary,
      setError,
      setIsLoading
    );
    // Store the returned reconciliation result
    setReconciliationResult(result);

  }, []); // Empty dependency array means this doesn't rely on component state/props

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: true, // Allow multiple files for reconciliation
  });

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Upload Trade/Position Data</h1>

      <div
        {...getRootProps()}
        className={`p-10 border-2 border-dashed rounded-lg text-center cursor-pointer 
                    ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
                    hover:border-gray-400 transition-colors`}
      >
        <input {...getInputProps()} />
        {
          isDragActive ?
            <p className="text-blue-600">Drop the files here ...</p> :
            <p className="text-gray-600">Drag 'n' drop trade/position CSV files here, or click to select files. (Optional: Drop authoritative P&L CSV as the second file for reconciliation)</p>
        }
      </div>

      {isLoading && (
        <div className="flex justify-center items-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="ml-2 text-gray-600">Processing files...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Display Summary - Conditionally show based on trades or positions */} 
      {(summary.trades > 0 || summary.positions > 0) && !isLoading && !error && (
          <div className="p-4 border rounded shadow-md bg-white">
              <h2 className="text-lg font-semibold mb-2">Import Summary</h2>
              <p>Trades Imported: {summary.trades}</p>
              <p>Positions Imported: {summary.positions}</p>
              {/* Only show trade counts if trades were imported */}
              {summary.trades > 0 && (
                  <>
                      <p>Open Trades: {summary.open}</p>
                      <p>Closed Trades: {summary.closed}</p>
                      <p>Realized P&L: ${summary.realizedPL.toFixed(2)}</p>
                  </>
              )}
          </div>
      )}

      {/* Conditionally render Reconciliation Report */} 
      <ReconciliationReport 
        result={reconciliationResult}
        isLoading={false} // Loading is handled above for the whole upload process
        error={null} // Errors specific to the report generation aren't handled here yet
      />

      {/* Optionally display raw trades/positions (for debugging) */}
      {/* ... */}

    </div>
  );
};

export default Upload; 