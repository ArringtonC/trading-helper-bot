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
import React, { useState } from 'react';
import { IBKRService } from '../services/IBKRService';
import { AccountService } from '../services/AccountService';
import { OptionService } from '../services/OptionService';
/**
 * Form component for importing IBKR account data
 */
var IBKRImportForm = function (_a) {
    var onImportComplete = _a.onImportComplete, onCancel = _a.onCancel;
    var _b = useState(null), file = _b[0], setFile = _b[1];
    var _c = useState(false), isLoading = _c[0], setIsLoading = _c[1];
    var _d = useState(null), error = _d[0], setError = _d[1];
    var _e = useState(null), importSummary = _e[0], setImportSummary = _e[1];
    // Handle file selection
    var handleFileChange = function (e) {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };
    // Read file contents
    var readFileContent = function (file) {
        return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.onload = function (event) {
                if (event.target) {
                    resolve(event.target.result);
                }
                else {
                    reject(new Error('Error reading file'));
                }
            };
            reader.onerror = function () {
                reject(new Error('Error reading file'));
            };
            reader.readAsText(file);
        });
    };
    // Process the import
    var handleImport = function () { return __awaiter(void 0, void 0, void 0, function () {
        var content, parsedResult, account_1, optionTrades, positionsLength, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!file) {
                        setError('Please select a file to import');
                        return [2 /*return*/];
                    }
                    setIsLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, readFileContent(file)];
                case 2:
                    content = _a.sent();
                    return [4 /*yield*/, IBKRService.parseActivityStatement(content)];
                case 3:
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
                    return [3 /*break*/, 6];
                case 4:
                    err_1 = _a.sent();
                    setError(err_1.message);
                    setImportSummary(null);
                    return [3 /*break*/, 6];
                case 5:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    return (<div className="bg-white p-6 rounded-lg shadow border border-gray-200" data-testid="import-form">
      <h2 className="text-xl font-bold mb-4">Import IBKR Account</h2>
      
      {!importSummary ? (<div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select IBKR Statement File (CSV or Excel)
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col rounded-lg border-2 border-dashed border-gray-300 w-full h-40 p-10 group text-center cursor-pointer">
                <div className="h-full w-full text-center flex flex-col items-center justify-center">
                  {file ? (<>
                      <p className="text-gray-700 font-semibold">
                        {file.name}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {(file.size / 1024).toFixed(0)} KB
                      </p>
                      <button type="button" onClick={function () { return setFile(null); }} className="mt-2 text-xs text-red-600 hover:text-red-800" data-testid="remove-file-btn">
                        Remove file
                      </button>
                    </>) : (<>
                      <svg className="w-10 h-10 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                      </svg>
                      <p className="text-gray-500 text-sm mt-2">
                        Drag and drop file here, or click to select
                      </p>
                      <p className="text-gray-400 text-xs">
                        Supported formats: CSV, Excel
                      </p>
                    </>)}
                </div>
                <input type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFileChange} data-testid="file-input"/>
              </label>
            </div>
          </div>
          
          {error && (<div className="p-3 bg-red-50 text-red-700 rounded-md border border-red-200" data-testid="error-message">
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
            {onCancel && (<button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" data-testid="cancel-btn">
                Cancel
              </button>)}
            <button type="button" onClick={handleImport} disabled={!file || isLoading} className={"px-4 py-2 text-sm font-medium text-white rounded-md ".concat(!file || isLoading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700')} data-testid="btn-import-trades">
              {isLoading ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>) : (<div className="space-y-4" data-testid="import-summary">
          <div className="bg-green-50 p-4 rounded-md border border-green-200">
            <h3 className="text-green-800 font-medium">Import Successful!</h3>
            <p className="text-green-700 mt-1">
              Account {importSummary.accountName} has been imported successfully.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Import Summary</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>Total Positions: {importSummary.totalPositions}</li>
              <li>Options Positions: {importSummary.optionsPositions}</li>
              <li>Stock Positions: {importSummary.stockPositions}</li>
            </ul>
          </div>
          
          {onCancel && (<div className="flex justify-end">
              <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" data-testid="close-btn">
                Close
              </button>
            </div>)}
        </div>)}
    </div>);
};
export default IBKRImportForm;
