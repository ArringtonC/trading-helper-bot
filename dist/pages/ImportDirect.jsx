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
import { parseIBKRTrades } from '../utils/specializedIBKRParser';
import { OptionStrategy } from '../types/options';
export var ImportDirect = function () {
    var _a = useState(null), file = _a[0], setFile = _a[1];
    var _b = useState([]), logs = _b[0], setLogs = _b[1];
    var _c = useState([]), trades = _c[0], setTrades = _c[1];
    var _d = useState(false), isProcessing = _d[0], setIsProcessing = _d[1];
    // Add a log entry
    var addLog = function (message) {
        setLogs(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["[".concat(new Date().toISOString(), "] ").concat(message)], false); });
        console.log(message);
    };
    // Handle file selection
    var handleFileChange = function (e) {
        var files = e.target.files;
        if (files && files.length > 0) {
            setFile(files[0]);
            addLog("File selected: ".concat(files[0].name, " (").concat(files[0].size, " bytes)"));
        }
    };
    // Read and parse the file
    var handleParseFile = function () { return __awaiter(void 0, void 0, void 0, function () {
        var content, result, accountId_1, portfolio, existingPortfolios, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!file) {
                        addLog('No file selected');
                        return [2 /*return*/];
                    }
                    setIsProcessing(true);
                    setTrades([]);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    addLog("Reading file: ".concat(file.name));
                    return [4 /*yield*/, readFileContent(file)];
                case 2:
                    content = _a.sent();
                    addLog("File read successfully (".concat(content.length, " bytes)"));
                    // Parse the file using the specialized parser
                    addLog('Starting specialized parsing...');
                    result = parseIBKRTrades(content);
                    addLog("Parsing complete. Found ".concat(result.trades.length, " trades"));
                    setTrades(result.trades);
                    // If we have trades, try to save them to localStorage
                    if (result.trades.length > 0 && result.accountId) {
                        addLog("Saving ".concat(result.trades.length, " trades to localStorage for account ").concat(result.accountId));
                        accountId_1 = "ibkr-".concat(result.accountId.replace(/\D/g, ''));
                        portfolio = {
                            accountId: accountId_1,
                            trades: result.trades.map(function (trade) { return convertToOptionTrade(trade, accountId_1); })
                        };
                        // Save to localStorage
                        try {
                            existingPortfolios = JSON.parse(localStorage.getItem('options_portfolios') || '{}');
                            // Add our portfolio
                            existingPortfolios[accountId_1] = portfolio;
                            // Save back to localStorage
                            localStorage.setItem('options_portfolios', JSON.stringify(existingPortfolios));
                            addLog("Successfully saved trades to options_portfolios for account ".concat(accountId_1));
                            addLog('Refresh the page to see the updated trades in the dashboard');
                        }
                        catch (error) {
                            addLog("Error saving to localStorage: ".concat(error));
                        }
                    }
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    addLog("Error processing file: ".concat(error_1));
                    return [3 /*break*/, 5];
                case 4:
                    setIsProcessing(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
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
    // Reset everything
    var handleReset = function () {
        setFile(null);
        setLogs([]);
        setTrades([]);
    };
    // Clear localStorage
    var handleClearStorage = function () {
        try {
            localStorage.clear();
            addLog('LocalStorage cleared successfully');
        }
        catch (error) {
            addLog("Error clearing localStorage: ".concat(error));
        }
    };
    return (<div className="max-w-4xl mx-auto p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Direct IBKR Parser</h2>
      
      <div className="mb-4">
        <label className="block mb-2">Select IBKR CSV File</label>
        <input type="file" accept=".csv" onChange={handleFileChange} className="border p-2 w-full"/>
      </div>
      
      <div className="flex space-x-2 mb-6">
        <button onClick={handleParseFile} disabled={!file || isProcessing} className={"px-4 py-2 rounded ".concat(!file || isProcessing
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700')}>
          {isProcessing ? 'Processing...' : 'Parse File'}
        </button>
        
        <button onClick={handleReset} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
          Reset
        </button>
        
        <button onClick={handleClearStorage} className="px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200">
          Clear Storage
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div>
          <h3 className="font-medium mb-2">Processing Logs</h3>
          <div className="bg-gray-100 p-3 rounded h-64 overflow-y-auto">
            {logs.length > 0 ? (<pre className="text-xs whitespace-pre-wrap">{logs.join('\n')}</pre>) : (<p className="text-gray-500 text-sm">Logs will appear here...</p>)}
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Detected Trades ({trades.length})</h3>
          <div className="bg-gray-100 p-3 rounded h-64 overflow-y-auto">
            {trades.length > 0 ? (<pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(trades, null, 2)}
              </pre>) : (<p className="text-gray-500 text-sm">Detected trades will appear here...</p>)}
          </div>
        </div>
      </div>
      
      <div className="text-sm text-gray-600">
        <p><strong>Instructions:</strong></p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Select your IBKR CSV file</li>
          <li>Click "Parse File" to process the file</li>
          <li>View the results in the logs and trades sections</li>
          <li>If trades are found, they will be saved to localStorage</li>
          <li>Refresh the page to see the trades in the dashboard</li>
        </ol>
      </div>
    </div>);
};
// Helper function to convert raw trade data to OptionTrade type
function convertToOptionTrade(trade, accountId) {
    return {
        id: "".concat(accountId, "-").concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9)),
        symbol: trade.symbol || '',
        putCall: trade.putCall || 'CALL',
        strike: trade.strike || 0,
        expiry: new Date(trade.expiry || Date.now()),
        quantity: trade.quantity || 0,
        premium: trade.premium || 0,
        openDate: new Date(trade.dateOpened || Date.now()),
        closeDate: trade.dateClosed ? new Date(trade.dateClosed) : undefined,
        closePremium: trade.closePrice || undefined,
        strategy: trade.strategy || OptionStrategy.OTHER,
        commission: trade.fees || 0,
        notes: trade.notes || '',
        status: trade.status || 'closed',
        tradePL: trade.pl || 0
    };
}
