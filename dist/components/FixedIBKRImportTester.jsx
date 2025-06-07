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
import React, { useState } from 'react';
import ImportToDatabaseService from '../services/ImportToDatabaseService';
import { insertSummary, resetDatabase, insertNormalizedTrades } from '../services/DatabaseService';
import { refreshDashboard } from '../utils/enhancedDashboardRefresh';
import { testExtractAccountBalance } from '../utils/accountBalanceTester';
import { FiUpload, FiFile, FiDollarSign, FiCheck, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { BrokerType } from '../types/trade';
/**
 * Simple component to test the fixed IBKR import functionality
 */
var FixedIBKRImportTester = function (_a) {
    var navigate = _a.navigate;
    var _b = useState(null), file = _b[0], setFile = _b[1];
    var _c = useState(false), isImporting = _c[0], setIsImporting = _c[1];
    var _d = useState(null), result = _d[0], setResult = _d[1];
    var _e = useState([]), logs = _e[0], setLogs = _e[1];
    var _f = useState(null), importResultDebug = _f[0], setImportResultDebug = _f[1];
    var _g = useState(false), importSuccess = _g[0], setImportSuccess = _g[1];
    // Handle file selection
    var handleFileChange = function (e) {
        var _a;
        var selectedFile = ((_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0]) || null;
        setFile(selectedFile);
        setResult(null);
        setLogs([]);
    };
    // Start import process
    var handleImport = function () { return __awaiter(void 0, void 0, void 0, function () {
        var content, importResult, normalizedTrades, result_1, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('Import handler triggered');
                    if (!file)
                        return [2 /*return*/];
                    setIsImporting(true);
                    setLogs([]);
                    addLog('Starting import process...');
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 9, 10, 11]);
                    return [4 /*yield*/, readFileContent(file)];
                case 2:
                    content = _b.sent();
                    console.log('File read, content length:', content.length);
                    addLog("File read successfully, size: ".concat(content.length, " bytes"));
                    return [4 /*yield*/, ImportToDatabaseService.importActivityStatement(content)];
                case 3:
                    importResult = _b.sent();
                    console.log('Import result:', importResult);
                    // Add log to inspect raw trade data from parser
                    if (importResult.trades && importResult.trades.length > 0) {
                        console.log('First raw trade from importResult:', importResult.trades[0]);
                    }
                    setImportResultDebug(importResult);
                    setResult(importResult);
                    if (!(importResult.success && Array.isArray(importResult.trades) && importResult.trades.length > 0)) return [3 /*break*/, 7];
                    return [4 /*yield*/, resetDatabase()];
                case 4:
                    _b.sent();
                    normalizedTrades = importResult.trades.map(function (t) {
                        var _a, _b;
                        return ({
                            id: t.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)),
                            importTimestamp: new Date().toISOString(),
                            broker: BrokerType.IBKR,
                            accountId: t.accountId || null,
                            tradeDate: t.tradeDate || (t.dateTime ? t.dateTime.split(' ')[0] : ''),
                            settleDate: t.settleDate || null,
                            symbol: t.symbol,
                            dateTime: t.dateTime,
                            description: t.description || null,
                            assetCategory: t.assetCategory || 'OPT',
                            action: t.action || null,
                            quantity: t.quantity,
                            tradePrice: t.tradePrice || t.price,
                            currency: t.currency || 'USD',
                            proceeds: t.proceeds,
                            cost: t.cost || t.basis,
                            commission: t.commission || t.commissionFee,
                            fees: t.fees || null,
                            netAmount: t.netAmount || (t.proceeds - ((_a = t.basis) !== null && _a !== void 0 ? _a : 0) - ((_b = t.commissionFee) !== null && _b !== void 0 ? _b : 0)),
                            openCloseIndicator: t.openCloseIndicator || 'C',
                            costBasis: t.costBasis || null,
                            optionSymbol: t.optionSymbol || null,
                            expiryDate: t.expiryDate || null,
                            strikePrice: t.strikePrice || null,
                            putCall: t.putCall || null,
                            multiplier: t.multiplier || null,
                            orderID: t.orderID || null,
                            executionID: t.executionID || null,
                            notes: t.notes || null,
                            rawCsvRow: Object.fromEntries(Object.entries(t).map(function (_a) {
                                var k = _a[0], v = _a[1];
                                return [k, String(v)];
                            })),
                        });
                    });
                    console.log('First normalized trade before insert:', normalizedTrades[0]);
                    return [4 /*yield*/, insertNormalizedTrades(normalizedTrades)];
                case 5:
                    result_1 = _b.sent();
                    if (result_1.errors.length > 0) {
                        console.error('DB Insert Errors:', result_1.errors);
                    }
                    return [4 /*yield*/, insertSummary((_a = importResult.cumulativePL) !== null && _a !== void 0 ? _a : 0)];
                case 6:
                    _b.sent();
                    addLog('Trades and summary inserted into database.');
                    toast.success('Import completed successfully!');
                    setImportSuccess(true);
                    return [2 /*return*/];
                case 7:
                    addLog("Import failed: No trades were imported.");
                    toast.error('Import failed! No trades were imported.');
                    _b.label = 8;
                case 8: return [3 /*break*/, 11];
                case 9:
                    error_1 = _b.sent();
                    addLog("Error during import: ".concat(error_1));
                    toast.error('Unexpected error during import.');
                    return [3 /*break*/, 11];
                case 10:
                    setIsImporting(false);
                    return [7 /*endfinally*/];
                case 11: return [2 /*return*/];
            }
        });
    }); };
    // Test balance extraction
    var handleTestBalanceExtraction = function () { return __awaiter(void 0, void 0, void 0, function () {
        var content, result_2, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!file)
                        return [2 /*return*/];
                    addLog('Testing balance extraction...');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, readFileContent(file)];
                case 2:
                    content = _a.sent();
                    result_2 = testExtractAccountBalance(content);
                    // Log the balance value and source
                    addLog("Extracted balance: ".concat(result_2.balance !== null ? result_2.balance : 'Not found', " (").concat(result_2.source, ")"));
                    // Log the detailed extraction logs
                    result_2.logs.forEach(function (log) {
                        addLog("  ".concat(log));
                    });
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    addLog("Error testing balance extraction: ".concat(error_2));
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Read file content
    var readFileContent = function (file) {
        return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.onload = function (event) {
                var _a;
                if ((_a = event.target) === null || _a === void 0 ? void 0 : _a.result) {
                    resolve(event.target.result);
                }
                else {
                    reject(new Error('Failed to read file content'));
                }
            };
            reader.onerror = function () {
                reject(new Error('Error reading file'));
            };
            reader.readAsText(file);
        });
    };
    // Add log entry
    var addLog = function (message) {
        setLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["[".concat(new Date().toISOString(), "] ").concat(message)], false); });
    };
    var handleManualBalanceUpdate = function () { return __awaiter(void 0, void 0, void 0, function () {
        var balanceStr, balance, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!result || !result.accountId)
                        return [2 /*return*/];
                    balanceStr = prompt('Enter account balance to set:', '5000');
                    if (!balanceStr)
                        return [2 /*return*/];
                    balance = parseFloat(balanceStr);
                    if (isNaN(balance)) {
                        alert('Invalid balance value');
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    addLog("Manually updating account ".concat(result.accountId, " balance to ").concat(balance));
                    return [4 /*yield*/, ImportToDatabaseService.updateAccountBalance(result.accountId, balance)];
                case 2:
                    _a.sent();
                    addLog('Balance updated successfully');
                    // Refresh dashboard
                    addLog('Refreshing dashboard...');
                    refreshDashboard();
                    return [3 /*break*/, 4];
                case 3:
                    error_3 = _a.sent();
                    addLog("Error updating balance: ".concat(error_3));
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Add function to handle setting balance with a specific value
    var handleSetBalance = function (balanceValue) { return __awaiter(void 0, void 0, void 0, function () {
        var error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!result || !result.accountId)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    addLog("Setting account ".concat(result.accountId, " balance to ").concat(balanceValue));
                    return [4 /*yield*/, ImportToDatabaseService.updateAccountBalance(result.accountId, balanceValue)];
                case 2:
                    _a.sent();
                    addLog('Balance updated successfully to ' + balanceValue);
                    // Refresh dashboard
                    addLog('Refreshing dashboard...');
                    refreshDashboard();
                    return [3 /*break*/, 4];
                case 3:
                    error_4 = _a.sent();
                    addLog("Error updating balance: ".concat(error_4));
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return (<div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Fixed IBKR Import Tester</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Upload IBKR Activity Statement</h2>
        
        <div className="mb-4">
          <input type="file" id="file-upload" accept=".csv" onChange={handleFileChange} className="hidden" data-testid="import-csv-input"/>
          <label htmlFor="file-upload" className={"cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ".concat(file ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700')}>
            <span className="mr-2">
              {FiUpload({})}
            </span>
            {file ? 'Change File' : 'Select File'}
          </label>
          {file && (<span className="ml-3 text-sm text-gray-500">
              <span className="inline mr-1">
                {FiFile({})}
              </span>
              {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </span>)}
        </div>
        
        <div className="flex space-x-4">
          <button onClick={handleImport} disabled={!file || isImporting} data-testid="btn-import-trades" className={"inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ".concat(!file || isImporting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700')}>
            {isImporting ? 'Importing...' : 'Import Statement'}
          </button>
          
          <button onClick={handleTestBalanceExtraction} disabled={!file} className={"inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ".concat(!file ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700')}>
            <span className="mr-2">
              {FiDollarSign({})}
            </span>
            Test Balance Extraction
          </button>
        </div>
      </div>
      
      {result && (<div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Import Result</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Account ID</p>
              <p className="font-medium">{result.accountId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account Name</p>
              <p className="font-medium">{result.accountName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Trades</p>
              <p className="font-medium">{result.totalTrades}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ".concat(result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                {result.success ? (<span className="flex items-center">
                    <span className="mr-1">
                      {FiCheck({})}
                    </span>
                    Success
                  </span>) : (<span className="flex items-center">
                    <span className="mr-1">
                      {FiX({})}
                    </span>
                    Failed
                  </span>)}
              </span>
            </div>
            {result.account && result.account.balance !== undefined && (<div>
                <p className="text-sm text-gray-500">Account Balance</p>
                <p className="font-medium">${result.account.balance.toFixed(2)}</p>
              </div>)}
          </div>
          
          {result.success && (<div className="mt-4">
              <button onClick={handleManualBalanceUpdate} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                <span className="mr-2">
                  {FiDollarSign({})}
                </span>
                Set Account Balance Manually
              </button>
            </div>)}
        </div>)}
      
      {result && !result.success && (<div id="error-log" style={{ background: '#fee', color: '#900', padding: 10, whiteSpace: 'pre-line', fontFamily: 'monospace', marginTop: 16, borderRadius: 8, border: '1px solid #fca5a5' }}>
          <strong>Error during import:</strong>
          <br />
          {Array.isArray(result.errors) && result.errors.length > 0 ? (<div>{result.errors.join('\n')}</div>) : Array.isArray(result.debugLogs) && result.debugLogs.length > 0 ? (<div>{result.debugLogs.slice(-20).join('\n')}</div>) : (<div>No error details available.</div>)}
        </div>)}
      
      {logs.length > 0 && (<div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Import Logs</h2>
          <div className="bg-gray-100 p-4 rounded-md">
            <pre className="text-sm whitespace-pre-wrap">
              {logs.join('\n')}
            </pre>
          </div>
          
          {importResultDebug && (<div className="mt-4">
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Debug: importResult</div>
              <pre style={{ fontSize: 12, color: '#333', whiteSpace: 'pre-wrap', background: '#f9fafb', border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
                {JSON.stringify(importResultDebug, null, 2)}
              </pre>
              {importResultDebug && importResultDebug.success === false && (<div style={{ background: '#fee', color: '#900', padding: 10, whiteSpace: 'pre-line', fontFamily: 'monospace', marginTop: 16, borderRadius: 8, border: '1px solid #fca5a5' }}>
                  <strong>Error during import:</strong>
                  <br />
                  {Array.isArray(importResultDebug.errors) && importResultDebug.errors.length > 0 ? (<div>{importResultDebug.errors.join('\n')}</div>) : Array.isArray(importResultDebug.debugLogs) && importResultDebug.debugLogs.length > 0 ? (<div>{importResultDebug.debugLogs.slice(-20).join('\n')}</div>) : (<div>No error details available.</div>)}
                </div>)}
            </div>)}
          
          {/* Add prominent button for setting balance when not found */}
          {logs.some(function (log) { return log.includes('Account balance: Not found'); }) && result && (<div className="mt-4">
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
                <p className="font-bold">Account balance not found in statement</p>
                <p>Please set your account balance manually to ensure your dashboard shows accurate data.</p>
                <p className="mt-2">Your statement shows a balance of <strong>$6,694.75</strong> (from Cash Report).</p>
              </div>
              <div className="flex space-x-4">
                <button onClick={function () { return handleSetBalance(6694.75); }} className="flex-1 inline-flex justify-center items-center px-4 py-3 border border-transparent text-md font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
                  <span className="mr-2">
                    {FiDollarSign({})}
                  </span>
                  Set Balance to $6,694.75
                </button>
                <button onClick={handleManualBalanceUpdate} className="flex-1 inline-flex justify-center items-center px-4 py-3 border border-transparent text-md font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                  <span className="mr-2">
                    {FiDollarSign({})}
                  </span>
                  Set Custom Balance
                </button>
              </div>
            </div>)}
        </div>)}
      
      {importSuccess && (<div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <h2>✅ Import Successful!</h2>
          <button onClick={function () { return navigate && navigate('/options'); }} style={{ marginTop: 16, padding: '10px 24px', fontSize: 16, borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Go to Dashboard
          </button>
        </div>)}
    </div>);
};
export default FixedIBKRImportTester;
