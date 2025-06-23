import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import PositionsTable from '../../../features/trading/components/PositionsTable';
import { Alert, AlertDescription, AlertTitle } from '../../../shared/components/ui/alert';
import { Button } from '../../../shared/components/ui/button';
import { Progress } from '../../../shared/components/ui/progress';
import { useToast } from '../../../shared/components/ui/use-toast';
import CsvPreviewGrid from '../../../shared/components/Upload/CsvPreviewGrid';
import DropZone from '../../../shared/components/Upload/DropZone';
import { useTrades } from '../../../features/trading/hooks/TradesContext';
import { useWinRate } from '../../../shared/context/WinRateContext';
import { processCsvStream, StreamProcessingStats } from '../../../shared/services/CsvProcessingService';
import { getDb, getSummary, getTrades, insertNormalizedTrades, insertSummary } from '../../../shared/services/DatabaseService';
import { NormalizedTradeData } from '../../../shared/types/trade';
import { computeRoundTripMetrics } from '../../../features/trading/utils/tradeUtils';

console.log('OptionsDB component rendered');

// Helper to safely format numbers for table display
const formatNumber = (val: any, digits = 2) => {
  const num = typeof val === 'number' ? val : parseFloat(val);
  return isNaN(num) ? '0.00' : num.toFixed(digits);
};

// Define types for the upload steps for better state management
type UploadStep = 'idle' | 'fileDropped' | 'previewing' | 'confirmedPreview' | 'processing' | 'completed' | 'error';

// This type represents the data structure as returned by the current getTrades() in DatabaseService
export interface FetchedTrade {
  id: string;
  importTimestamp?: string;
  broker: string;
  accountId?: string;
  tradeDate: string;
  settleDate?: string;
  symbol: string;
  dateTime?: string;
  description?: string;
  assetCategory: string;
  action?: string;
  quantity: number;
  tradePrice: number;
  currency: string;
  proceeds?: number | undefined;
  cost?: number | undefined;
  commission?: number | undefined;
  fees?: number | undefined;
  netAmount: number;
  openCloseIndicator?: string;
  costBasis?: number | undefined;
  optionSymbol?: string;
  expiryDate?: string;
  strikePrice?: number | undefined;
  putCall?: string;
  multiplier?: number;
  orderID?: string;
  executionID?: string;
  notes?: string;
  rawCsvRow?: any;
}

const OptionsDB: React.FC = () => {
  const { trades, setTrades } = useTrades();
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { setWinRate } = useWinRate();
  const [viewMode, setViewMode] = useState<'trades' | 'positions'>('trades');
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [uploadStep, setUploadStep] = useState<UploadStep>('idle');
  
  const [processingStats, setProcessingStats] = useState<StreamProcessingStats | null>(null);
  const [finalErrorMessages, setFinalErrorMessages] = useState<string[]>([]);
  const [finalWarningMessages, setFinalWarningMessages] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);

  // Memoize normalizedTrades to prevent unnecessary effect triggers
  const normalizedTrades = useMemo(
    () => trades.filter((t) => typeof t === 'object' && t !== null && 'importTimestamp' in t),
    [trades]
  );

  // Memoized metrics calculations
  const metrics = useMemo(() => {
    if (!normalizedTrades || normalizedTrades.length === 0) {
      return {
        totalTradesCount: 0,
        openTradesCount: 0,
        closedTradesCount: 0,
        roundTrips: [],
        grossPLRT: 0,
        totalFeesRT: 0,
        netPLRT: 0,
        winRateRT: 0,
        netChangeInCashOverall: 0,
        cashAdjustmentTotalValue: 0,
      };
    }

    const rtMetrics = computeRoundTripMetrics(normalizedTrades as NormalizedTradeData[]);
    
    const grossPLRT = rtMetrics.roundTrips.reduce((sum, rt) => {
      const mult = rt.close.multiplier ?? rt.open.multiplier ?? 100;
      const direction = rt.open.quantity > 0 ? 1 : -1;
      const qty = Math.abs(rt.open.quantity);
      const gross = (rt.close.tradePrice - rt.open.tradePrice) * mult * direction * qty;
      return sum + gross;
    }, 0);

    const totalFeesRT = rtMetrics.roundTrips.reduce((sum, rt) => {
      const openFees = (rt.open.commission ?? 0) + (rt.open.fees ?? 0);
      const closeFees = (rt.close.commission ?? 0) + (rt.close.fees ?? 0);
      return sum + openFees + closeFees;
    }, 0);

    const netPLRT = grossPLRT - totalFeesRT;
    
    const netChangeInCashOverall = -normalizedTrades.reduce((sum, t) => sum + (t.netAmount ?? 0), 0);
    const cashAdjustments = normalizedTrades.filter(t => t.assetCategory === 'CASH');
    const cashAdjustmentTotalValue = cashAdjustments.reduce((sum, t) => sum + (t.netAmount ?? 0), 0);

    return {
      totalTradesCount: normalizedTrades.length,
      openTradesCount: normalizedTrades.filter(t => t.openCloseIndicator === 'O' || t.openCloseIndicator === 'N/A' || t.openCloseIndicator === undefined).length,
      closedTradesCount: normalizedTrades.filter(t => t.openCloseIndicator === 'C').length,
      roundTrips: rtMetrics.roundTrips,
      openRoundTripTrades: rtMetrics.openTrades,
      closedRoundTripTrades: rtMetrics.closedTrades,
      grossPLRT,
      totalFeesRT,
      netPLRT,
      winRateRT: rtMetrics.winRate,
      netChangeInCashOverall,
      cashAdjustmentTotalValue,
    };
  }, [normalizedTrades]);

  const hasSetWinRate = useRef(false);

  useEffect(() => {
    const newWinRate = metrics.winRateRT !== undefined ? metrics.winRateRT * 100 : null;
    if (!hasSetWinRate.current && newWinRate !== null) {
      setWinRate(newWinRate);
      hasSetWinRate.current = true;
    }
  }, [metrics.winRateRT, setWinRate]);

  useEffect(() => {
  }, [metrics]);

  useEffect(() => {
  }, [trades]);

  useEffect(() => {
  }, [normalizedTrades]);

  const fetchAndProcessInitialData = useCallback(async () => {
    setLoading(true);
    try {
      await getDb();
      const fetchedTradesFromDB: FetchedTrade[] = (await getTrades()).map((t: any) => ({
        ...t,
        commission: t.commission === null ? undefined : t.commission,
        fees: t.fees === null ? undefined : t.fees,
        proceeds: t.proceeds === null ? undefined : t.proceeds,
        cost: t.cost === null ? undefined : t.cost,
        strikePrice: t.strikePrice === null ? undefined : t.strikePrice,
        costBasis: t.costBasis === null ? undefined : t.costBasis,
      }));
      // Only update if data actually changed
      if (JSON.stringify(fetchedTradesFromDB) !== JSON.stringify(trades)) {
        setTrades(fetchedTradesFromDB || []);
      }
      await getSummary();
    } catch (error: any) {
      setError(error.message || 'Could not load initial trade data.');
      toast({ title: "Error", description: "Could not load initial trade data.", variant: "destructive" });
      setTrades([]);
    }
    setLoading(false);
  }, [toast, setTrades, trades]);

  useEffect(() => {
    fetchAndProcessInitialData();
  }, [fetchAndProcessInitialData]);

  const resetUploadState = () => {
    setCurrentFile(null);
    setUploadStep('idle');
    setProcessingStats(null);
    setFinalErrorMessages([]);
    setFinalWarningMessages([]);
  };

  const handleConfirmAndImport = useCallback(async () => {
    if (!currentFile) return;
    setUploadStep('processing');
    setProcessingStats({ totalRowsProcessed: 0, successfulRows: 0, errorCount: 0, warningCount: 0, progressPercent: 0, currentStatusMessage: 'Starting import...' });
    setFinalErrorMessages([]);
    setFinalWarningMessages([]);
    let allStreamedTrades: NormalizedTradeData[] = [];

    processCsvStream(
      currentFile,
      (stats) => {
        setProcessingStats(prevStats => ({ ...prevStats, ...stats }));
      },
      (chunkResult) => {
        allStreamedTrades.push(...chunkResult.data);
        if (chunkResult.errors.length > 0) {
            setFinalErrorMessages(prev => [...prev, ...chunkResult.errors.map(e => `Row ${e.rowIndexInFile}: ${e.message}`)]);
        }
        if (chunkResult.warnings.length > 0) {
            setFinalWarningMessages(prev => [...prev, ...chunkResult.warnings.flatMap(w => w.messages.map(m => `Row ${w.rowIndexInFile}: ${m}`))]);
        }
      },
      async (finalStats, _allValidTradesFromStream_ignored) => {
        setProcessingStats(finalStats);
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

  return (
    <div style={{ padding: 24 }}>
      <div className="flex gap-4 mb-4">
        <button onClick={() => setViewMode('trades')}>Trades</button>
        <button onClick={() => setViewMode('positions')}>Positions</button>
      </div>

      {viewMode === 'trades' && (
        <div>
          <h1>Options Dashboard (SQLite)</h1>
          {renderUploadArea()}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, minWidth: 160 }} data-testid="net-cash">
              <div style={{ fontWeight: 600 }}>Net Change in Cash</div>
              <div style={{ fontSize: 24, color: metrics.netChangeInCashOverall >= 0 ? 'green' : 'red' }}>${formatNumber(metrics.netChangeInCashOverall)}</div>
            </div>
            <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, minWidth: 160 }} data-testid="win-rate">
              <div style={{ fontWeight: 600 }}>Win Rate (round-trips)</div>
              <div style={{ fontSize: 24 }}>{formatNumber(metrics.winRateRT * 100, 1)}%</div>
            </div>
            <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, minWidth: 160 }} data-testid="open-trades">
              <div style={{ fontWeight: 600 }}>Open Trades</div>
              <div style={{ fontSize: 24 }}>{metrics.openRoundTripTrades}</div>
            </div>
            <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, minWidth: 160 }} data-testid="closed-trades">
              <div style={{ fontWeight: 600 }}>Closed Trades</div>
              <div style={{ fontSize: 24 }}>{metrics.closedRoundTripTrades}</div>
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
                    <td style={{ color: metrics.netChangeInCashOverall >= 0 ? 'green' : 'red', textAlign: 'right' }}>${formatNumber(metrics.netChangeInCashOverall)}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Other Cash Adjustments
                      <span title="Sum of all non-trade cash flows (fees, interest, etc.) from assetCategory === 'CASH'"> ⓘ</span>
                    </td>
                    <td style={{ color: metrics.cashAdjustmentTotalValue >= 0 ? 'green' : 'red', textAlign: 'right' }}>${formatNumber(metrics.cashAdjustmentTotalValue)}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Gross P&amp;L (RT, before fees)</td>
                    <td style={{ color: metrics.grossPLRT >= 0 ? 'green' : 'red', textAlign: 'right' }}>${formatNumber(metrics.grossPLRT)}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Total Commissions &amp; Fees (RT)</td>
                    <td style={{ color: metrics.totalFeesRT >= 0 ? 'red' : 'green', textAlign: 'right' }}>–${formatNumber(Math.abs(metrics.totalFeesRT))}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Net P&amp;L (RT, after fees)</td>
                    <td style={{ color: metrics.netPLRT >= 0 ? 'green' : 'red', textAlign: 'right' }}>${formatNumber(metrics.netPLRT)}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Win Rate (round-trips)</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(metrics.winRateRT * 100, 1)}%</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Total Closed Trades (round-trips)</td>
                    <td style={{ textAlign: 'right' }}>{metrics.closedRoundTripTrades}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Open Positions</td>
                    <td style={{ textAlign: 'right' }}>{metrics.openRoundTripTrades}</td>
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
                {metrics.roundTrips.map((rt: any, idx: number) => {
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
        </div>
      )}
      {viewMode === 'positions' && <PositionsTable />}
    </div>
  );
};

export default OptionsDB; 