var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import React, { useEffect, useState, useCallback } from 'react';
import { initDatabase, getTrades, getSummary, insertNormalizedTrades } from '../services/DatabaseService';
import { useWinRate } from '../context/WinRateContext';
import { handleUpload } from '../utils/handleUpload';
import PositionsTable from '../components/PositionsTable';
import CsvPreviewGrid from '../components/Upload/CsvPreviewGrid';
import { processCsvStream } from '../services/CsvProcessingService';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Progress } from "../components/ui/progress";
import { TradesDataGrid } from '../components/TradesDataGrid';
import { useToast } from "../components/ui/use-toast";
import DropZone from '../components/Upload/DropZone';
import { useTrades } from '../context/TradesContext';
// Helper to safely format numbers for table display
var formatNumber = function (val, digits) {
    if (digits === void 0) { digits = 2; }
    var num = typeof val === 'number' ? val : parseFloat(val);
    return isNaN(num) ? '0.00' : num.toFixed(digits);
};
// Optional: Helper to clean up date strings
var cleanDate = function (dt) { return dt.replace(',', ''); };
var OptionsDB = function () {
    var _a = useTrades(), trades = _a.trades, setTrades = _a.setTrades;
    var _b = useState(0), cumulativePL = _b[0], setCumulativePL = _b[1];
    var _c = useState(0), totalPL = _c[0], setTotalPL = _c[1];
    var _d = useState(0), calculatedWinRate = _d[0], setCalculatedWinRate = _d[1];
    var _e = useState(true), loading = _e[0], setLoading = _e[1];
    var toast = useToast().toast;
    var setWinRate = useWinRate().setWinRate;
    var _f = useState('trades'), viewMode = _f[0], setViewMode = _f[1];
    var _g = useState(null), currentFile = _g[0], setCurrentFile = _g[1];
    var _h = useState('idle'), uploadStep = _h[0], setUploadStep = _h[1];
    // For CsvPreviewGrid - this might be simplified if CsvPreviewGrid handles its own parsing from File prop
    var _j = useState(null), previewData = _j[0], setPreviewData = _j[1];
    var _k = useState(null), processingStats = _k[0], setProcessingStats = _k[1];
    var _l = useState([]), processedChunksLog = _l[0], setProcessedChunksLog = _l[1];
    var _m = useState([]), finalErrorMessages = _m[0], setFinalErrorMessages = _m[1];
    var _o = useState([]), finalWarningMessages = _o[0], setFinalWarningMessages = _o[1];
    var _p = useState(0), importedTradesCount = _p[0], setImportedTradesCount = _p[1];
    var _q = useState(false), isLoadingTrades = _q[0], setIsLoadingTrades = _q[1];
    var _r = useState([]), debugLogs = _r[0], setDebugLogs = _r[1];
    var _s = useState(null), error = _s[0], setError = _s[1];
    // State for handleUpload
    var _t = useState([]), uploadedTrades = _t[0], setUploadedTrades = _t[1];
    var _u = useState([]), uploadedPositions = _u[0], setUploadedPositions = _u[1];
    var _v = useState(null), uploadSummary = _v[0], setUploadSummary = _v[1];
    var _w = useState(null), reconciliationReport = _w[0], setReconciliationReport = _w[1];
    var fetchAndProcessInitialData = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var fetchedTrades, summary, realizedPLSum_1, winningClosedTrades_1, losingClosedTrades_1, wr, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setIsLoadingTrades(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, initDatabase()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, getTrades()];
                case 3:
                    fetchedTrades = _a.sent();
                    setTrades(fetchedTrades || []);
                    return [4 /*yield*/, getSummary()];
                case 4:
                    summary = _a.sent();
                    setCumulativePL(Number(summary));
                    realizedPLSum_1 = 0;
                    winningClosedTrades_1 = 0;
                    losingClosedTrades_1 = 0;
                    fetchedTrades.forEach(function (t) {
                        // Consider a trade realized P&L if it's a closing transaction and netAmount is available
                        // Or if a specific realizedP&L field were part of NormalizedTradeData (it is not currently)
                        if (t.openCloseIndicator === 'C' && typeof t.netAmount === 'number') {
                            // Assuming positive netAmount on close is profit, negative is loss.
                            // This depends heavily on how netAmount is populated by the mapping logic.
                            realizedPLSum_1 += t.netAmount;
                            if (t.netAmount > 0)
                                winningClosedTrades_1++;
                            if (t.netAmount < 0)
                                losingClosedTrades_1++;
                        }
                    });
                    setTotalPL(realizedPLSum_1); // Update total P&L based on this logic
                    if (winningClosedTrades_1 + losingClosedTrades_1 > 0) {
                        wr = (winningClosedTrades_1 / (winningClosedTrades_1 + losingClosedTrades_1)) * 100;
                        setCalculatedWinRate(wr);
                        setWinRate(wr);
                    }
                    else {
                        setCalculatedWinRate(0);
                        setWinRate(0);
                    }
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    setError(error_1.message || 'Could not load initial trade data.');
                    toast({ title: "Error", description: "Could not load initial trade data.", variant: "destructive" });
                    setTrades([]);
                    return [3 /*break*/, 6];
                case 6:
                    setLoading(false);
                    setIsLoadingTrades(false);
                    return [2 /*return*/];
            }
        });
    }); }, [toast, setWinRate]);
    useEffect(function () {
        fetchAndProcessInitialData();
    }, []); // Only run once on mount to prevent infinite loop
    var resetUploadState = function () {
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
    var handleFileDropped = useCallback(function (file) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            setCurrentFile(file);
            setUploadStep('previewing');
            setDebugLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["File dropped: ".concat(file.name)], false); });
            return [2 /*return*/];
        });
    }); }, []);
    var handleConfirmAndImport = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var allStreamedTrades;
        return __generator(this, function (_a) {
            if (!currentFile)
                return [2 /*return*/];
            setUploadStep('processing');
            setProcessingStats({ totalRowsProcessed: 0, successfulRows: 0, errorCount: 0, warningCount: 0, progressPercent: 0, currentStatusMessage: 'Starting import...' });
            setFinalErrorMessages([]);
            setFinalWarningMessages([]);
            setProcessedChunksLog([]);
            allStreamedTrades = [];
            processCsvStream(currentFile, function (stats) {
                setProcessingStats(function (prevStats) { return (__assign(__assign({}, prevStats), stats)); });
                setDebugLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["Progress: ".concat(stats.progressPercent.toFixed(2), "%, Status: ").concat(stats.currentStatusMessage)], false); });
            }, function (chunkResult) {
                allStreamedTrades.push.apply(allStreamedTrades, chunkResult.data);
                setProcessedChunksLog(function (prev) { return __spreadArray(__spreadArray([], prev, true), [chunkResult], false); });
                if (chunkResult.errors.length > 0) {
                    setFinalErrorMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), chunkResult.errors.map(function (e) { return "Row ".concat(e.rowIndexInFile, ": ").concat(e.message); }), true); });
                }
                if (chunkResult.warnings.length > 0) {
                    setFinalWarningMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), chunkResult.warnings.flatMap(function (w) { return w.messages.map(function (m) { return "Row ".concat(w.rowIndexInFile, ": ").concat(m); }); }), true); });
                }
            }, function (finalStats, _allValidTradesFromStream_ignored) { return __awaiter(void 0, void 0, void 0, function () {
                var dbResult_1, dbError_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            setProcessingStats(finalStats);
                            setDebugLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["Stream complete. ".concat(allStreamedTrades.length, " valid trades found by stream processor.")], false); });
                            if (!(allStreamedTrades.length > 0)) return [3 /*break*/, 5];
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            setProcessingStats(function (prev) { return (__assign(__assign({}, prev), { currentStatusMessage: 'Inserting trades into database...' })); });
                            return [4 /*yield*/, insertNormalizedTrades(allStreamedTrades)];
                        case 2:
                            dbResult_1 = _a.sent();
                            setImportedTradesCount(dbResult_1.successCount);
                            if (dbResult_1.errors.length > 0) {
                                setFinalErrorMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), dbResult_1.errors.map(function (e) { return "DB Insert Error (Trade ID ".concat(e.tradeId || 'N/A', "): ").concat(e.error); }), true); });
                            }
                            toast({ title: "Import Successful", description: "".concat(dbResult_1.successCount, " trades imported.") });
                            setUploadStep('completed');
                            setProcessingStats(function (prev) { return (__assign(__assign({}, prev), { currentStatusMessage: "Import finished. ".concat(dbResult_1.successCount, " trades added.") })); });
                            fetchAndProcessInitialData();
                            return [3 /*break*/, 4];
                        case 3:
                            dbError_1 = _a.sent();
                            setUploadStep('error');
                            setFinalErrorMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["Database operation failed: ".concat(dbError_1.message)], false); });
                            setProcessingStats(function (prev) { return (__assign(__assign({}, prev), { currentStatusMessage: 'Database error.' })); });
                            setError(dbError_1.message || 'Database error.');
                            toast({ title: "Database Error", description: dbError_1.message, variant: "destructive" });
                            return [3 /*break*/, 4];
                        case 4: return [3 /*break*/, 6];
                        case 5:
                            setUploadStep('completed');
                            setProcessingStats(function (prev) { return (__assign(__assign({}, prev), { currentStatusMessage: 'Processing complete. No new valid trades to import.' })); });
                            toast({ title: "Processing Complete", description: "No new valid trades found to import." });
                            _a.label = 6;
                        case 6: return [2 /*return*/];
                    }
                });
            }); }, function (streamError) {
                setUploadStep('error');
                setFinalErrorMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["CSV Processing error: ".concat(streamError.message)], false); });
                setProcessingStats(function (prev) { return (__assign(__assign({}, prev), { currentStatusMessage: 'Critical CSV processing error.' })); });
                setError(streamError.message || 'CSV processing error.');
                toast({ title: "CSV Error", description: streamError.message, variant: "destructive" });
            });
            return [2 /*return*/];
        });
    }); }, [currentFile, fetchAndProcessInitialData, toast]);
    var renderUploadArea = function () { return (<div className="mb-6 p-4 border rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-3">Import Trades CSV</h2>
      {uploadStep === 'idle' && (<DropZone onFileUpload={function (file) { return __awaiter(void 0, void 0, void 0, function () {
                var result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!file) {
                                setError('No file provided by DropZone.');
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, handleUpload([file], setUploadedTrades, setUploadedPositions, setUploadSummary, setError, setLoading)];
                        case 1:
                            result = _a.sent();
                            setReconciliationReport(result);
                            fetchAndProcessInitialData();
                            return [2 /*return*/];
                    }
                });
            }); }} className="mt-2"/>)}

      {(uploadStep === 'previewing') && currentFile && (<div className="mt-4">
          <h3 className="text-lg font-medium">File: {currentFile.name}</h3>
          <CsvPreviewGrid file={currentFile} maxRows={10} className="mt-2 max-h-96 overflow-y-auto"/>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleConfirmAndImport}>Confirm & Import</Button>
            <Button variant="outline" onClick={resetUploadState}>Cancel</Button>
          </div>
        </div>)}

      {(uploadStep === 'processing' || uploadStep === 'completed' || uploadStep === 'error') && processingStats && (<div className="mt-4">
          <h3 className="text-lg font-medium">Import Status: {processingStats.currentStatusMessage}</h3>
          {uploadStep === 'processing' && (<Progress value={processingStats.progressPercent} className="w-full mt-2"/>)}
          <p className="text-sm mt-1">{processingStats.successfulRows} of {processingStats.totalRowsProcessed} rows processed successfully.</p>
          {(processingStats.warningCount > 0 || finalWarningMessages.length > 0) &&
                <Alert variant="default" className="mt-2 bg-yellow-50 border-yellow-300">
                <span role="img" aria-label="terminal" className="h-4 w-4 mr-1">🖥️</span>
                <AlertTitle className="text-yellow-700">Warnings ({finalWarningMessages.length})</AlertTitle>
                <AlertDescription className="text-yellow-600 max-h-40 overflow-y-auto">
                    {finalWarningMessages.slice(0, 10).map(function (warn, i) { return <div key={"warn-".concat(i)}>{warn}</div>; })}
                    {finalWarningMessages.length > 10 && <div>And {finalWarningMessages.length - 10} more warnings...</div>}
                </AlertDescription>
            </Alert>}
          {(processingStats.errorCount > 0 || finalErrorMessages.length > 0) &&
                <Alert variant="destructive" className="mt-2">
                <span role="img" aria-label="terminal" className="h-4 w-4 mr-1">🖥️</span>
                <AlertTitle>Errors ({finalErrorMessages.length})</AlertTitle>
                <AlertDescription className="max-h-40 overflow-y-auto">
                    {finalErrorMessages.slice(0, 10).map(function (err, i) { return <div key={"err-".concat(i)}>{err}</div>; })}
                    {finalErrorMessages.length > 10 && <div>And {finalErrorMessages.length - 10} more errors...</div>}
                </AlertDescription>
            </Alert>}
          {(uploadStep === 'completed' || uploadStep === 'error') && (<Button onClick={resetUploadState} className="mt-4">Import Another File</Button>)}
        </div>)}
    </div>); };
    if (loading)
        return <div>Loading options data...</div>;
    if (error)
        return <div style={{ color: 'red' }}>{error}</div>;
    console.log('📊 Trades passed to table:', trades.slice(0, 5));
    // Calculate summary card values based on current 'trades' state (NormalizedTradeData[])
    var totalTrades = trades.length;
    // Adjust open/closed trades logic based on NormalizedTradeData
    var openTrades = trades.filter(function (t) { return t.openCloseIndicator === 'O' || t.openCloseIndicator === 'N/A' || t.openCloseIndicator === undefined; }).length;
    var closedTrades = trades.filter(function (t) { return t.openCloseIndicator === 'C'; }).length;
    return (<div style={{ padding: 24 }}>
      <div className="flex gap-4 mb-4">
        <button onClick={function () { return setViewMode('trades'); }}>Trades</button>
        <button onClick={function () { return setViewMode('positions'); }}>Positions</button>
      </div>

      {viewMode === 'trades' && (<>
      <h1>Options Dashboard (SQLite)</h1>
      {renderUploadArea()}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, minWidth: 160 }} data-testid="total-pl">
          <div style={{ fontWeight: 600 }}>Total P&amp;L</div>
              <div style={{ fontSize: 24, color: totalPL >= 0 ? 'green' : 'red' }}>${formatNumber(totalPL)}</div>
        </div>
        <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, minWidth: 160 }} data-testid="win-rate">
          <div style={{ fontWeight: 600 }}>Win Rate</div>
              <div style={{ fontSize: 24 }}>{formatNumber(calculatedWinRate, 1)}%</div>
        </div>
        <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, minWidth: 160 }} data-testid="open-trades">
          <div style={{ fontWeight: 600 }}>Open Trades</div>
          <div style={{ fontSize: 24 }}>{openTrades}</div>
        </div>
        <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, minWidth: 160 }} data-testid="closed-trades">
          <div style={{ fontWeight: 600 }}>Closed Trades</div>
          <div style={{ fontSize: 24 }}>{closedTrades}</div>
        </div>
      </div>
      {/* Debug log section */}
      <div style={{ background: '#f9fafb', border: '1px solid #eee', borderRadius: 8, padding: 16, marginBottom: 24 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Debug Log (Parsed CSV Data)</div>
            <pre style={{ fontSize: 12, color: '#333', whiteSpace: 'pre-wrap' }}>
              {debugLogs.join('\n')}
        </pre>
      </div>
      {/* Additional debug dump for sanity check */}
      <div>
        <h2>Debug Loaded trades</h2>
        <pre>{JSON.stringify(trades.slice(0, 10), null, 2)}</pre>
      </div>
      {/* <button onClick={loadSampleData} style={{ marginBottom: 16 }}>Load Sample Trades</button>
            <button onClick={handleReset} style={{ marginLeft: 8, marginBottom: 16 }}>Reset Database</button> */}
      <h2>Cumulative P&amp;L: <span style={{ color: cumulativePL >= 0 ? 'green' : 'red' }}>{formatNumber(cumulativePL)}</span></h2>
      {/* Debug Info Section */}
      {trades && (<div style={{ backgroundColor: '#eef', padding: '1em', margin: '1em 0', fontFamily: 'monospace' }}>
          <h3>🔍 Debug Info</h3>
          <div><strong>Number of trades loaded:</strong> {trades.length}</div>
          {trades.length === 0 ? (<div style={{ color: 'red' }}>⚠️ No trades found. Please import trades first.</div>) : (<pre>{JSON.stringify(trades.slice(0, 5), null, 2)}</pre>)}
        </div>)}
            <TradesDataGrid trades={trades}/>
        </>)}
      {viewMode === 'positions' && <PositionsTable />}
    </div>);
};
export default OptionsDB;
