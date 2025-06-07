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
import React, { useState } from 'react';
import { IBKRService } from '../services/IBKRService';
import { AccountService } from '../services/AccountService';
import { OptionService } from '../services/OptionService';
import { Upload, Typography } from 'antd';
var Title = Typography.Title, Text = Typography.Text;
var Dragger = Upload.Dragger;
// Function to analyze IBKR content
function analyzeIBKRContent(content) {
    var logs = [];
    var sections = {};
    // Add a log function that can be used throughout the analysis
    var log = function (message) {
        logs.push("[".concat(new Date().toISOString(), "] ").concat(message));
    };
    logs.push("File content length: ".concat(content.length, " bytes"));
    // Check if this is even a CSV file
    if (!content.includes(',')) {
        logs.push('WARNING: Content does not appear to be CSV format (no commas found)');
    }
    // Split into lines for analysis
    var lines = content.split('\n');
    logs.push("File contains ".concat(lines.length, " lines"));
    // Log the first few lines to see the file structure
    logs.push('File starts with:');
    for (var i = 0; i < Math.min(10, lines.length); i++) {
        logs.push("Line ".concat(i + 1, ": ").concat(lines[i]));
    }
    // Look for common IBKR sections and their variants
    var sectionPatterns = [
        { name: 'Statement', patterns: ['Statement,Header', 'Statement,Data', 'Statement, Header'] },
        { name: 'Account', patterns: ['Account Information,Header', 'Account Information,Data', 'Account Information'] },
        { name: 'Trades', patterns: ['Trades,Header', 'Trades,Data', 'Trade', 'Trade List', 'TradeConfirm'] },
        { name: 'Positions', patterns: ['Positions,Header', 'Open Positions,Header', 'Position'] },
        { name: 'Cash Report', patterns: ['Cash Report,Header', 'Cash Report'] }
    ];
    // Check for each section pattern
    sectionPatterns.forEach(function (section) {
        section.patterns.forEach(function (pattern) {
            var count = 0;
            for (var i = 0; i < lines.length; i++) {
                if (lines[i].includes(pattern)) {
                    count++;
                    if (count === 1) {
                        logs.push("Found \"".concat(pattern, "\" at line ").concat(i + 1, ": ").concat(lines[i]));
                        // Log next few lines for context
                        logs.push('Next lines:');
                        for (var j = 1; j <= 3; j++) {
                            if (i + j < lines.length) {
                                logs.push("  Line ".concat(i + j + 1, ": ").concat(lines[i + j]));
                            }
                        }
                    }
                }
            }
            if (count > 0) {
                sections["".concat(section.name, ":").concat(pattern)] = count;
                logs.push("Total occurrences of \"".concat(pattern, "\": ").concat(count));
            }
        });
    });
    // Check for critical data patterns
    var dataPatterns = [
        { name: 'Orders', pattern: /Order/i },
        { name: 'Trades', pattern: /Trade/i },
        { name: 'OptionSymbol', pattern: /\d+([CP])\d+/ },
        { name: 'DataDiscriminator', pattern: /DataDiscriminator/i },
        { name: 'AccountID', pattern: /U\d{7}/ }
    ];
    dataPatterns.forEach(function (pattern) {
        var matches = content.match(new RegExp(pattern.pattern, 'g'));
        var count = matches ? matches.length : 0;
        logs.push("Found ".concat(count, " occurrences of ").concat(pattern.name, " pattern"));
        if (count > 0 && pattern.name === 'OptionSymbol') {
            logs.push("Example option symbols: ".concat(matches.slice(0, 3).join(', ')));
        }
    });
    // Try to find the "Trades" section specifically and analyze its structure
    var tradesHeaderIndex = lines.findIndex(function (line) { return line.includes('Trades,Header'); });
    if (tradesHeaderIndex !== -1) {
        logs.push("Analyzing Trades section starting at line ".concat(tradesHeaderIndex + 1));
        // Look for the column headers (typically the line after Trades,Header)
        if (tradesHeaderIndex + 1 < lines.length) {
            var columnsLine = lines[tradesHeaderIndex + 1];
            logs.push("Trades columns: ".concat(columnsLine));
            // Look for essential columns
            var columns_1 = columnsLine.split(',').map(function (col) { return col.trim().toLowerCase(); });
            var essentialColumns = ['symbol', 'date', 'quantity', 'price', 'discriminator'];
            essentialColumns.forEach(function (col) {
                var found = columns_1.some(function (c) { return c.includes(col); });
                logs.push("Essential column '".concat(col, "' ").concat(found ? 'found' : 'NOT FOUND'));
            });
            // Check for the first data row
            if (tradesHeaderIndex + 2 < lines.length) {
                logs.push("First data row: ".concat(lines[tradesHeaderIndex + 2]));
            }
        }
    }
    else {
        logs.push('WARNING: No specific "Trades,Header" section found');
        // Try to find anything trade-related
        var tradeRelatedIndex = lines.findIndex(function (line) {
            return line.toLowerCase().includes('trade') ||
                line.toLowerCase().includes('order') ||
                line.toLowerCase().includes('fill');
        });
        if (tradeRelatedIndex !== -1) {
            logs.push("Found potential trade-related line at ".concat(tradeRelatedIndex + 1, ": ").concat(lines[tradeRelatedIndex]));
            // Look at surrounding lines
            for (var i = Math.max(0, tradeRelatedIndex - 2); i <= Math.min(lines.length - 1, tradeRelatedIndex + 2); i++) {
                if (i !== tradeRelatedIndex) {
                    logs.push("  Line ".concat(i + 1, ": ").concat(lines[i]));
                }
            }
        }
    }
    return { logs: logs, sections: sections };
}
/**
 * Enhanced form component for importing IBKR account data with analysis capabilities
 */
var EnhancedIBKRImportForm = function (_a) {
    var onImportComplete = _a.onImportComplete, onCancel = _a.onCancel, onLogMessage = _a.onLogMessage;
    var _b = useState([]), files = _b[0], setFiles = _b[1];
    var _c = useState(false), isLoading = _c[0], setIsLoading = _c[1];
    var _d = useState(null), error = _d[0], setError = _d[1];
    var _e = useState(null), importSummary = _e[0], setImportSummary = _e[1];
    var _f = useState([]), debugLogs = _f[0], setDebugLogs = _f[1];
    var _g = useState(false), showDebugLogs = _g[0], setShowDebugLogs = _g[1];
    var _h = useState(null), selectedFileContent = _h[0], setSelectedFileContent = _h[1];
    var _j = useState(false), showRawContent = _j[0], setShowRawContent = _j[1];
    // Add a log function that can be used throughout the component
    var log = function (message) {
        console.log("[EnhancedIBKRImportForm] ".concat(message));
        if (onLogMessage) {
            onLogMessage(message);
        }
    };
    // Handle file selection
    var handleFileChange = function (e) {
        if (e.target.files && e.target.files.length > 0) {
            var newFiles = [];
            Array.from(e.target.files).forEach(function (file) {
                var reader = new FileReader();
                reader.onload = function (event) {
                    if (event.target && event.target.result) {
                        var content = event.target.result;
                        var newFile_1 = {
                            id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
                            name: file.name,
                            content: content,
                            status: { status: 'pending', message: 'File loaded, ready for import' }
                        };
                        setFiles(function (prev) { return __spreadArray(__spreadArray([], prev, true), [newFile_1], false); });
                        log("File selected: ".concat(file.name, " (").concat(file.size, " bytes)"));
                    }
                };
                reader.readAsText(file);
            });
            setError(null);
        }
    };
    // Analyze file content
    var handleAnalyzeFile = function (fileId) {
        var file = files.find(function (f) { return f.id === fileId; });
        if (file && file.content) {
            var logs = analyzeIBKRContent(file.content).logs;
            setDebugLogs(logs);
            setShowDebugLogs(true);
            log("Analyzing file: ".concat(file.name));
        }
    };
    // View raw file content
    var viewRawFileContent = function (fileStatus) {
        if (fileStatus.content) {
            setSelectedFileContent(fileStatus.content);
            setShowRawContent(true);
        }
    };
    // Process the import
    var handleImport = function (fileId) { return __awaiter(void 0, void 0, void 0, function () {
        var file, parsedResult, account_1, optionTrades, positionsLength, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    file = files.find(function (f) { return f.id === fileId; });
                    if (!file)
                        return [2 /*return*/];
                    log("Starting import for file: ".concat(file.name));
                    // Update file status to processing
                    setFiles(function (prev) { return prev.map(function (f) {
                        return f.id === fileId
                            ? __assign(__assign({}, f), { status: __assign(__assign({}, f.status), { status: 'processing', message: 'Importing...' }) }) : f;
                    }); });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, IBKRService.parseActivityStatement(file.content)];
                case 2:
                    parsedResult = _a.sent();
                    if (parsedResult.errors && parsedResult.errors.length > 0) {
                        throw new Error("Parsing failed: ".concat(parsedResult.errors.join(', ')));
                    }
                    // Convert to internal account model
                    if (!parsedResult.account) {
                        throw new Error('No account information found in the imported file');
                    }
                    account_1 = IBKRService.convertToAccount(parsedResult.account);
                    // Save account to storage
                    AccountService.addAccount(account_1);
                    optionTrades = IBKRService.convertToOptionTrades(parsedResult);
                    // Save option trades
                    optionTrades.forEach(function (trade) {
                        OptionService.addTrade(account_1.id, trade);
                    });
                    positionsLength = Array.isArray(parsedResult.positions) ? parsedResult.positions.length : 0;
                    setImportSummary({
                        accountName: account_1.name,
                        totalPositions: positionsLength,
                        optionsPositions: optionTrades.length,
                        stockPositions: positionsLength - optionTrades.length,
                        completed: true
                    });
                    // Notify parent component
                    if (onImportComplete) {
                        onImportComplete();
                    }
                    log("Import successful for file: ".concat(file.name));
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    setError(error_1.message);
                    setFiles(function (prev) { return prev.map(function (f) {
                        return f.id === fileId
                            ? __assign(__assign({}, f), { status: { status: 'error', message: error_1.message } }) : f;
                    }); });
                    log("Import failed for file: ".concat(file.name, " - ").concat(error_1.message));
                    return [3 /*break*/, 5];
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    // Remove a file
    var handleRemoveFile = function (fileId) {
        var file = files.find(function (f) { return f.id === fileId; });
        if (file) {
            log("Removing file: ".concat(file.name));
        }
        setFiles(function (prev) { return prev.filter(function (f) { return f.id !== fileId; }); });
    };
    return (<div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <h2 className="text-xl font-bold mb-4">Import IBKR Account</h2>
      
      {!importSummary ? (<div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select IBKR Statement Files (CSV or Excel)
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col rounded-lg border-2 border-dashed border-gray-300 w-full h-40 p-10 group text-center cursor-pointer">
                <div className="h-full w-full text-center flex flex-col items-center justify-center">
                  <svg className="w-10 h-10 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                  <p className="text-gray-500 text-sm mt-2">
                    Drag and drop files here, or click to select
                  </p>
                  <p className="text-gray-400 text-xs">
                    Supported formats: CSV, Excel
                  </p>
                </div>
                <input type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFileChange} multiple/>
              </label>
            </div>
          </div>
          
          {files.length > 0 && (<div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Files</h3>
              <div className="border rounded-md divide-y">
                {files.map(function (file) { return (<div key={file.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-gray-500">{file.status.message}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button type="button" onClick={function () { return handleAnalyzeFile(file.id); }} className="text-blue-600 hover:text-blue-800 text-xs">
                        Analyze
                      </button>
                      {file.status.status === 'success' && (<button type="button" onClick={function () { return viewRawFileContent(file.status); }} className="text-green-600 hover:text-green-800 text-xs">
                          View
                        </button>)}
                      {file.status.status === 'pending' && (<button type="button" onClick={function () { return handleImport(file.id); }} className="text-blue-600 hover:text-blue-800 text-xs" disabled={isLoading}>
                          Import
                        </button>)}
                      <button type="button" onClick={function () { return handleRemoveFile(file.id); }} className="text-red-600 hover:text-red-800 text-xs">
                        Remove
                      </button>
                    </div>
                  </div>); })}
              </div>
            </div>)}
          
          {error && (<div className="p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
              {error}
            </div>)}
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Import Information</h3>
            <ul className="text-xs text-gray-600 space-y-1 list-disc pl-5">
              <li>This will import your IBKR account positions and balances</li>
              <li>Options positions will be added to your options portfolio</li>
              <li>Stock positions will be tracked in your account</li>
              <li>Your existing accounts will not be modified</li>
              <li>For best results, use an Activity Statement or Portfolio Analyst export</li>
            </ul>
          </div>
          
          <div className="flex justify-end space-x-3">
            {onCancel && (<button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                Cancel
              </button>)}
          </div>
        </div>) : (<div className="space-y-6">
          <div className="p-4 bg-green-50 text-green-700 rounded-md border border-green-200">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span className="font-medium">Import Successful!</span>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Import Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Account Name:</span>
                <span className="font-medium">{importSummary.accountName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Positions:</span>
                <span className="font-medium">{importSummary.totalPositions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Options Positions:</span>
                <span className="font-medium">{importSummary.optionsPositions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Stock Positions:</span>
                <span className="font-medium">{importSummary.stockPositions}</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={function () {
                setFiles([]);
                setImportSummary(null);
            }} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              Import Another File
            </button>
            <button type="button" onClick={function () {
                if (onImportComplete) {
                    onImportComplete();
                }
            }} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              View Account
            </button>
          </div>
        </div>)}
      
      {/* Debug Logs Modal */}
      {showDebugLogs && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">File Analysis</h3>
              <button type="button" onClick={function () { return setShowDebugLogs(false); }} className="text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-grow bg-gray-50 p-4 rounded-md font-mono text-xs">
              {debugLogs.map(function (log, index) { return (<div key={index} className="mb-1">
                  {log}
                </div>); })}
            </div>
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={function () { return setShowDebugLogs(false); }} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                Close
              </button>
            </div>
          </div>
        </div>)}
      
      {/* Raw Content Modal */}
      {showRawContent && selectedFileContent && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Raw File Content</h3>
              <button type="button" onClick={function () { return setShowRawContent(false); }} className="text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-grow bg-gray-50 p-4 rounded-md font-mono text-xs whitespace-pre">
              {selectedFileContent}
            </div>
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={function () { return setShowRawContent(false); }} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                Close
              </button>
            </div>
          </div>
        </div>)}
    </div>);
};
export default EnhancedIBKRImportForm;
