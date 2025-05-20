import React, { useEffect, useState, useCallback } from 'react';
import { initDatabase, getTrades, getSummary, insertSummary, resetDatabase, getAggregatePL, insertNormalizedTrades } from '../services/DatabaseService';
import { parseTradeCSV, isTradeCSV, isPositionCSV } from '../utils/parseTradeCSV';
import { DataGrid } from '@mui/x-data-grid';
import { TRADE_COLUMNS } from '../components/columns';
import { useWinRate } from '../context/WinRateContext';
import { handleUpload } from '../utils/handleUpload';
import PositionsTable from '../components/PositionsTable';
import { NormalizedTradeData, BrokerType, AssetCategory, PutCall, OpenCloseIndicator } from '../types/trade';
import CsvDropzone from '../components/Upload/CsvDropzone';
import CsvPreviewGrid from '../components/Upload/CsvPreviewGrid';
import { processCsvStream, StreamProcessingStats, ProcessedChunkResult } from '../services/CsvProcessingService';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Terminal } from "lucide-react"
import { Progress } from "../components/ui/progress";
import { TradesDataGrid } from '../components/TradesDataGrid';
import { useToast } from "../components/ui/use-toast";
import DropZone from '../components/Upload/DropZone';
import { Position } from '../utils/parsePositionCSV';
import { ReconciliationResult } from '../services/ReconciliationService';
import { useTrades } from '../context/TradesContext';
import { computeRoundTripMetrics } from '../utils/tradeUtils';

console.log('OptionsDB component rendered');

// Helper to safely format numbers for table display
const formatNumber = (val: any, digits = 2) => {
  const num = typeof val === 'number' ? val : parseFloat(val);
  return isNaN(num) ? '0.00' : num.toFixed(digits);
};

// Optional: Helper to clean up date strings
const cleanDate = (dt: string) => dt.replace(',', '');

// Define types for the upload steps for better state management
type UploadStep = 'idle' | 'fileDropped' | 'previewing' | 'confirmedPreview' | 'processing' | 'completed' | 'error';

// This type represents the data structure as returned by the current getTrades() in DatabaseService
export interface FetchedTrade {
  id: string;
  tradeDate: string;
  broker: string;
  symbol: string;
  assetCategory: string;
  quantity: number;
  tradePrice: number;
  currency: string;
  netAmount: number;
  openCloseIndicator?: string; // From DB, could be 'O', 'C', or null/undefined
  commission?: number;
  fees?: number;
  proceeds?: number;
  cost?: number;
  optionSymbol?: string;
  expiryDate?: string;
  strikePrice?: number;
  putCall?: string; // From DB, could be 'P', 'C', or null/undefined
  multiplier?: number;
  // Fields NOT currently in getTrades(): importTimestamp, accountId, settleDate, description, action, orderID, executionID, notes, rawCsvRowJson
}

const OptionsDB: React.FC = () => {
  const { trades, setTrades } = useTrades();
  const [cumulativePL, setCumulativePL] = useState<number>(0);
  const [totalPL, setTotalPL] = useState<number>(0);
  const [calculatedWinRate, setCalculatedWinRate] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { setWinRate } = useWinRate();
  const [viewMode, setViewMode] = useState<'trades' | 'positions'>('trades');
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [uploadStep, setUploadStep] = useState<UploadStep>('idle');
  
  // For CsvPreviewGrid - this might be simplified if CsvPreviewGrid handles its own parsing from File prop
  const [previewData, setPreviewData] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  
  const [processingStats, setProcessingStats] = useState<StreamProcessingStats | null>(null);
  const [processedChunksLog, setProcessedChunksLog] = useState<ProcessedChunkResult[]>([]);
  const [finalErrorMessages, setFinalErrorMessages] = useState<string[]>([]);
  const [finalWarningMessages, setFinalWarningMessages] = useState<string[]>([]);
  const [importedTradesCount, setImportedTradesCount] = useState<number>(0);

  const [isLoadingTrades, setIsLoadingTrades] = useState(false);

  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);

  // State for handleUpload
  const [uploadedTrades, setUploadedTrades] = useState<NormalizedTradeData[]>([]);
  const [uploadedPositions, setUploadedPositions] = useState<Position[]>([]);
  const [uploadSummary, setUploadSummary] = useState<{ trades: number; positions: number; open: number; closed: number; realizedPL: number } | null>(null);
  const [reconciliationReport, setReconciliationReport] = useState<ReconciliationResult | null>(null);

  const fetchAndProcessInitialData = useCallback(async () => {
    setLoading(true);
    setIsLoadingTrades(true);
    try {
      await initDatabase();
      const fetchedTrades: FetchedTrade[] = await getTrades();
      console.log('[DEBUG fetchAndProcessInitialData] Trades loaded from DB:', fetchedTrades);
      setTrades(fetchedTrades || []);
      
      const summary = await getSummary();
      setCumulativePL(Number(summary));
      console.log('Set cumulativePL in state:', Number(summary));

      // P&L and WinRate calculation based on NormalizedTradeData
      // This is a simplified P&L based on netAmount of presumed closing trades.
      // A more robust P&L requires matching open/close trades or relying on broker-provided realized P&L.
      let realizedPLSum = 0;
      let winningClosedTrades = 0;
      let losingClosedTrades = 0;

      fetchedTrades.forEach(t => {
        // Consider a trade realized P&L if it's a closing transaction and netAmount is available
        // Or if a specific realizedP&L field were part of NormalizedTradeData (it is not currently)
        if (t.openCloseIndicator === 'C' && typeof t.netAmount === 'number') {
            // Assuming positive netAmount on close is profit, negative is loss.
            // This depends heavily on how netAmount is populated by the mapping logic.
            realizedPLSum += t.netAmount;
            if (t.netAmount > 0) winningClosedTrades++;
            if (t.netAmount < 0) losingClosedTrades++;
        }
      });
      setTotalPL(realizedPLSum); // Update total P&L based on this logic

      if (winningClosedTrades + losingClosedTrades > 0) {
        const wr = (winningClosedTrades / (winningClosedTrades + losingClosedTrades)) * 100;
        setCalculatedWinRate(wr);
        setWinRate(wr); 
      } else {
        setCalculatedWinRate(0);
        setWinRate(0);
      }

    } catch (error: any) {
      setError(error.message || 'Could not load initial trade data.');
      toast({ title: "Error", description: "Could not load initial trade data.", variant: "destructive" });
      setTrades([]);
    }
    setLoading(false);
    setIsLoadingTrades(false);
  }, [toast, setWinRate]);

  useEffect(() => {
    fetchAndProcessInitialData();
  }, []); // Only run once on mount to prevent infinite loop

  const resetUploadState = () => {
    setCurrentFile(null);
    setPreviewData(null);
    setUploadStep('idle');
    setProcessingStats(null);
    setProcessedChunksLog([]);
    setFinalErrorMessages([]);
    setFinalWarningMessages([]);
    setImportedTradesCount(0);
    setDebugLogs([]);
  };

  const handleFileDropped = useCallback(async (file: File) => {
    setCurrentFile(file);
    setUploadStep('previewing'); 
    setDebugLogs(prev => [...prev, `File dropped: ${file.name}`]);
  }, []);

  const handleConfirmAndImport = useCallback(async () => {
    console.log('handleConfirmAndImport called');
    if (!currentFile) return;
    setUploadStep('processing');
    setProcessingStats({ totalRowsProcessed: 0, successfulRows: 0, errorCount: 0, warningCount: 0, progressPercent: 0, currentStatusMessage: 'Starting import...' });
    setFinalErrorMessages([]);
    setFinalWarningMessages([]);
    setProcessedChunksLog([]);
    let allStreamedTrades: NormalizedTradeData[] = [];

    processCsvStream(
      currentFile,
      (stats) => {
        setProcessingStats(prevStats => ({ ...prevStats, ...stats }));
        setDebugLogs(prev => [...prev, `Progress: ${stats.progressPercent.toFixed(2)}%, Status: ${stats.currentStatusMessage}`]);
      },
      (chunkResult) => {
        allStreamedTrades.push(...chunkResult.data);
        setProcessedChunksLog(prev => [...prev, chunkResult]);
        if (chunkResult.errors.length > 0) {
            setFinalErrorMessages(prev => [...prev, ...chunkResult.errors.map(e => `Row ${e.rowIndexInFile}: ${e.message}`)]);
        }
        if (chunkResult.warnings.length > 0) {
            setFinalWarningMessages(prev => [...prev, ...chunkResult.warnings.flatMap(w => w.messages.map(m => `Row ${w.rowIndexInFile}: ${m}`))]);
        }
      },
      async (finalStats, _allValidTradesFromStream_ignored) => {
        setProcessingStats(finalStats);
        setDebugLogs(prev => [...prev, `Stream complete. ${allStreamedTrades.length} valid trades found by stream processor.`]);
        if (allStreamedTrades.length > 0) {
          try {
            setProcessingStats(prev => ({ ...prev!, currentStatusMessage: 'Inserting trades into database...' }));
            // Debug: log all netAmount values before calculating cumulativePL
            console.log('All streamed trades for PL calculation:', allStreamedTrades.map(t => t.netAmount));
            
            // Apply robust netAmount calculation for options if needed
            const tradesWithCalculatedNet = allStreamedTrades.map(trade => {
                if (trade.assetCategory === 'OPT' && (trade.netAmount === null || trade.netAmount === undefined || isNaN(trade.netAmount))) {
                    // Apply the robust calculation for options if netAmount is missing or NaN
                    const quantity = trade.quantity ?? 0;
                    const tradePrice = trade.tradePrice ?? 0;
                    const multiplier = trade.multiplier ?? 100; // Default multiplier to 100 for options
                    const commissionFee = (trade.commission ?? 0) + (trade.fees ?? 0); // Sum commission and fees
                    
                    // Calculate netAmount using the formula: (tradePrice * quantity * multiplier) - commissionFee
                    // Ensure calculations handle potential floating point issues if necessary, or rely on toFixed later.
                    const calculatedNet = (tradePrice * quantity * multiplier) - commissionFee;
                    console.log(`Calculating netAmount for option trade ${trade.symbol}: (${tradePrice} * ${quantity} * ${multiplier}) - ${commissionFee} = ${calculatedNet}`);
                    return { ...trade, netAmount: calculatedNet };
                } else {
                    // Use existing netAmount or 0 for other asset categories or if netAmount is already valid
                     console.log(`Using existing netAmount for trade ${trade.symbol}: ${trade.netAmount}`);
                    return { ...trade, netAmount: trade.netAmount ?? 0 };
                }
            });

            // Calculate cumulativePL from tradesWithCalculatedNet and update summary
            const calculatedPL = tradesWithCalculatedNet.reduce((sum, t) => sum + (t.netAmount ?? 0), 0);
            await insertSummary(calculatedPL);
            console.log('Inserted summary with cumulativePL:', calculatedPL);
            const summary = await getSummary();
            console.log('Fetched summary after insert:', summary);
            setImportedTradesCount(allStreamedTrades.length);
            toast({ title: "Import Successful", description: `${allStreamedTrades.length} trades imported.` });
            setUploadStep('completed');
            setProcessingStats(prev => ({ ...prev!, currentStatusMessage: `Import finished. ${allStreamedTrades.length} trades added.`}));
            fetchAndProcessInitialData();

            // --- DEBUG: Check trades in DB after insert ---
            const insertResult = await insertNormalizedTrades(tradesWithCalculatedNet);
            console.log('insertResult:', insertResult);
            if (insertResult.successCount > 0) {
              console.log(`${insertResult.successCount} trades inserted into the database successfully.`);
              // --- DEBUG: Check trades in DB after insert ---
              const tradesInDb = await getTrades();
              console.log('[DEBUG after insert] Trades in DB:', tradesInDb);
            } else {
              setUploadStep('completed'); 
              setProcessingStats(prev => ({ ...prev!, currentStatusMessage: 'Processing complete. No new valid trades to import.'}));
              toast({ title: "Processing Complete", description: "No new valid trades found to import." });
            }
          } catch (dbError: any) {
            setUploadStep('error');
            setFinalErrorMessages(prev => [...prev, `Database operation failed: ${dbError.message}`]);
            setProcessingStats(prev => ({ ...prev!, currentStatusMessage: 'Database error.'}));
            setError(dbError.message || 'Database error.');
            toast({ title: "Database Error", description: dbError.message, variant: "destructive" });
          }
        } else {
          setUploadStep('completed'); 
          setProcessingStats(prev => ({ ...prev!, currentStatusMessage: 'Processing complete. No new valid trades to import.'}));
          toast({ title: "Processing Complete", description: "No new valid trades found to import." });
        }
      },
      (streamError) => {
        setUploadStep('error');
        setFinalErrorMessages(prev => [...prev, `CSV Processing error: ${streamError.message}`]);
        setProcessingStats(prev => ({ ...prev!, currentStatusMessage: 'Critical CSV processing error.'}));
        setError(streamError.message || 'CSV processing error.');
        toast({ title: "CSV Error", description: streamError.message, variant: "destructive" });
      }
    );
  }, [currentFile, fetchAndProcessInitialData, toast]);

  const renderUploadArea = () => (
    <div className="mb-6 p-4 border rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-3">Import Trades CSV</h2>
      {uploadStep === 'idle' && (
        <DropZone
          onFileUpload={async (file) => {
            if (!file) {
              setError('No file provided by DropZone.');
              return;
            }
            // Set current file and move to previewing step
            setCurrentFile(file);
            setUploadStep('previewing'); // <-- Move to previewing after file drop
            setDebugLogs(prev => [...prev, `File dropped: ${file.name}`]);
          }}
          className="mt-2"
        />
      )}

      {(uploadStep === 'previewing') && currentFile && (
        <div className="mt-4">
          <h3 className="text-lg font-medium">File: {currentFile.name}</h3>
          <CsvPreviewGrid file={currentFile} maxRows={10} className="mt-2 max-h-96 overflow-y-auto"/>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleConfirmAndImport}>Confirm & Import</Button>
            <Button variant="outline" onClick={resetUploadState}>Cancel</Button>
          </div>
        </div>
      )}

      {(uploadStep === 'processing' || uploadStep === 'completed' || uploadStep === 'error') && processingStats && (
        <div className="mt-4">
          <h3 className="text-lg font-medium">Import Status: {processingStats.currentStatusMessage}</h3>
          {uploadStep === 'processing' && (
             <Progress value={processingStats.progressPercent} className="w-full mt-2" />
          )}
          <p className="text-sm mt-1">{processingStats.successfulRows} of {processingStats.totalRowsProcessed} rows processed successfully.</p>
          {(processingStats.warningCount > 0 || finalWarningMessages.length > 0) && 
            <Alert variant="default" className="mt-2 bg-yellow-50 border-yellow-300">
                <span role="img" aria-label="terminal" className="h-4 w-4 mr-1">🖥️</span>
                <AlertTitle className="text-yellow-700">Warnings ({finalWarningMessages.length})</AlertTitle>
                <AlertDescription className="text-yellow-600 max-h-40 overflow-y-auto">
                    {finalWarningMessages.slice(0, 10).map((warn, i) => <div key={`warn-${i}`}>{warn}</div>)}
                    {finalWarningMessages.length > 10 && <div>And {finalWarningMessages.length - 10} more warnings...</div>}
                </AlertDescription>
            </Alert>
          }
          {(processingStats.errorCount > 0 || finalErrorMessages.length > 0) && 
            <Alert variant="destructive" className="mt-2">
                <span role="img" aria-label="terminal" className="h-4 w-4 mr-1">🖥️</span>
                <AlertTitle>Errors ({finalErrorMessages.length})</AlertTitle>
                <AlertDescription className="max-h-40 overflow-y-auto">
                    {finalErrorMessages.slice(0,10).map((err, i) => <div key={`err-${i}`}>{err}</div>)}
                    {finalErrorMessages.length > 10 && <div>And {finalErrorMessages.length - 10} more errors...</div>}
                </AlertDescription>
            </Alert>
          }
          {(uploadStep === 'completed' || uploadStep === 'error') && (
            <Button onClick={resetUploadState} className="mt-4">Import Another File</Button>
          )}
        </div>
      )}
    </div>
  );

  if (loading) return <div>Loading options data...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  console.log('📊 Trades passed to table:', trades.slice(0, 5));

  // Calculate summary card values based on current 'trades' state (NormalizedTradeData[])
  const totalTrades = trades.length;
  // Adjust open/closed trades logic based on NormalizedTradeData
  const openTrades = trades.filter(t => t.openCloseIndicator === 'O' || t.openCloseIndicator === 'N/A' || t.openCloseIndicator === undefined ).length;
  const closedTrades = trades.filter(t => t.openCloseIndicator === 'C').length;

  // --- Round-trip metrics for options dashboard ---
  const roundTripMetrics = computeRoundTripMetrics(trades as NormalizedTradeData[]);

  // --- Enhanced round-trip summary calculations ---
  const grossPL = roundTripMetrics.roundTrips.reduce((sum, rt) => {
    // Gross P&L before fees: (close.tradePrice - open.tradePrice) * multiplier * direction
    const mult = rt.close.multiplier ?? rt.open.multiplier ?? 100;
    const direction = rt.open.quantity > 0 ? 1 : -1;
    const qty = Math.abs(rt.open.quantity);
    const gross = (rt.close.tradePrice - rt.open.tradePrice) * mult * direction * qty;
    return sum + gross;
  }, 0);
  const totalFees = roundTripMetrics.roundTrips.reduce((sum, rt) => {
    const openFees = (rt.open.commission ?? 0) + (rt.open.fees ?? 0);
    const closeFees = (rt.close.commission ?? 0) + (rt.close.fees ?? 0);
    return sum + openFees + closeFees;
  }, 0);
  const netPL = grossPL - totalFees;

  // --- Net Change in Cash: sum of netAmount for all trades (all cash-impacting transactions), sign flipped to match broker statement ---
  const netChangeInCash = -trades.reduce((sum, t) => sum + (t.netAmount ?? 0), 0);
  // --- Other Cash Adjustments: sum of netAmount for assetCategory === 'CASH' ---
  const cashAdjustments = trades.filter(t => t.assetCategory === 'CASH');
  const cashAdjustmentTotal = cashAdjustments.reduce((sum, t) => sum + (t.netAmount ?? 0), 0);

  return (
    <div style={{ padding: 24 }}>
      <div className="flex gap-4 mb-4">
        <button onClick={() => setViewMode('trades')}>Trades</button>
        <button onClick={() => setViewMode('positions')}>Positions</button>
      </div>

      {viewMode === 'trades' && (
        <>
      <h1>Options Dashboard (SQLite)</h1>
      {renderUploadArea()}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, minWidth: 160 }} data-testid="net-cash">
          <div style={{ fontWeight: 600 }}>Net Change in Cash</div>
          <div style={{ fontSize: 24, color: netChangeInCash >= 0 ? 'green' : 'red' }}>${formatNumber(netChangeInCash)}</div>
        </div>
        <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, minWidth: 160 }} data-testid="win-rate">
          <div style={{ fontWeight: 600 }}>Win Rate (round-trips)</div>
          <div style={{ fontSize: 24 }}>{formatNumber(roundTripMetrics.winRate * 100, 1)}%</div>
        </div>
        <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, minWidth: 160 }} data-testid="open-trades">
          <div style={{ fontWeight: 600 }}>Open Trades</div>
          <div style={{ fontSize: 24 }}>{roundTripMetrics.openTrades}</div>
        </div>
        <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, minWidth: 160 }} data-testid="closed-trades">
          <div style={{ fontWeight: 600 }}>Closed Trades</div>
          <div style={{ fontSize: 24 }}>{roundTripMetrics.closedTrades}</div>
        </div>
      </div>
      {/* --- Round-Trip Metrics Section --- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#e8f5e9', padding: 16, borderRadius: 8, minWidth: 400 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Round-Trip Summary</div>
          <table style={{ width: '100%', fontSize: 15 }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>Net Change in Cash
                  <span title="Matches your broker statement's cash change (ending cash minus starting cash minus deposits)"> ⓘ</span>
                </td>
                <td style={{ color: netChangeInCash >= 0 ? 'green' : 'red', textAlign: 'right' }}>${formatNumber(netChangeInCash)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Other Cash Adjustments
                  <span title="Sum of all non-trade cash flows (fees, interest, etc.) from assetCategory === 'CASH'"> ⓘ</span>
                </td>
                <td style={{ color: cashAdjustmentTotal >= 0 ? 'green' : 'red', textAlign: 'right' }}>${formatNumber(cashAdjustmentTotal)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Gross P&amp;L (before fees)</td>
                <td style={{ color: grossPL >= 0 ? 'green' : 'red', textAlign: 'right' }}>${formatNumber(grossPL)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Total Commissions &amp; Fees</td>
                <td style={{ color: totalFees >= 0 ? 'red' : 'green', textAlign: 'right' }}>–${formatNumber(Math.abs(totalFees))}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Net P&amp;L (after fees)</td>
                <td style={{ color: netPL >= 0 ? 'green' : 'red', textAlign: 'right' }}>${formatNumber(netPL)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Win Rate (round-trips)</td>
                <td style={{ textAlign: 'right' }}>{formatNumber(roundTripMetrics.winRate * 100, 1)}%</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Total Closed Trades (round-trips)</td>
                <td style={{ textAlign: 'right' }}>{roundTripMetrics.closedTrades}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Open Positions</td>
                <td style={{ textAlign: 'right' }}>{roundTripMetrics.openTrades}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {/* --- Round-Trip Table --- */}
      <div style={{ background: '#f9fbe7', border: '1px solid #eee', borderRadius: 8, padding: 16, marginBottom: 24 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Round-Trip Table</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Symbol</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Open Date</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Close Date</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #ccc' }}>Gross P&amp;L</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #ccc' }}>Fees</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #ccc' }}>Net P&amp;L</th>
            </tr>
          </thead>
          <tbody>
            {roundTripMetrics.roundTrips.map((rt: any, idx: number) => {
              const mult = rt.close.multiplier ?? rt.open.multiplier ?? 100;
              const direction = rt.open.quantity > 0 ? 1 : -1;
              const qty = Math.abs(rt.open.quantity);
              const gross = (rt.close.tradePrice - rt.open.tradePrice) * mult * direction * qty;
              const openFees = (rt.open.commission ?? 0) + (rt.open.fees ?? 0);
              const closeFees = (rt.close.commission ?? 0) + (rt.close.fees ?? 0);
              const fees = openFees + closeFees;
              const net = gross - fees;
              return (
                <tr key={idx}>
                  <td>{rt.open.symbol}</td>
                  <td>{rt.open.tradeDate}</td>
                  <td>{rt.close.tradeDate}</td>
                  <td style={{ color: gross >= 0 ? 'green' : 'red', textAlign: 'right' }}>{formatNumber(gross)}</td>
                  <td style={{ color: fees >= 0 ? 'red' : 'green', textAlign: 'right' }}>{formatNumber(fees)}</td>
                  <td style={{ color: net >= 0 ? 'green' : 'red', textAlign: 'right' }}>{formatNumber(net)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
        </>
          )}
      {viewMode === 'positions' && <PositionsTable />}
    </div>
  );
};

export default OptionsDB; 