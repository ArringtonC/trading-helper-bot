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
import React, { useState } from 'react';
import { extractIBKRPnLData, extractTradesWithActualPnL } from '../utils/importUtils';
import { AccountService } from '../services/AccountService';
import { OptionService } from '../services/OptionService';
import { formatCurrency } from '../utils/formatters';
import { AccountType } from '../types/account';
/**
 * Component for importing IBKR statements with direct P&L extraction
 */
var IBKRStatementImport = function () {
    var _a = useState(null), file = _a[0], setFile = _a[1];
    var _b = useState(false), parsing = _b[0], setParsing = _b[1];
    var _c = useState(null), result = _c[0], setResult = _c[1];
    var _d = useState(''), accountId = _d[0], setAccountId = _d[1];
    var _e = useState(''), accountName = _e[0], setAccountName = _e[1];
    var handleFileChange = function (e) {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };
    var handleImport = function () { return __awaiter(void 0, void 0, void 0, function () {
        var fileContent, pnlData, _a, trades, stats, portfolio, tradesWithPortfolio, successCount, _i, tradesWithPortfolio_1, trade, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!file) {
                        setResult({
                            success: false,
                            message: 'Please select a file to import'
                        });
                        return [2 /*return*/];
                    }
                    if (!accountId || !accountName) {
                        setResult({
                            success: false,
                            message: 'Please enter account information'
                        });
                        return [2 /*return*/];
                    }
                    setParsing(true);
                    setResult(null);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, file.text()];
                case 2:
                    fileContent = _b.sent();
                    pnlData = extractIBKRPnLData(fileContent);
                    _a = extractTradesWithActualPnL(fileContent), trades = _a.trades, stats = _a.stats;
                    // Create or update account
                    AccountService.addAccount({
                        id: accountId,
                        name: accountName,
                        type: AccountType.IBKR,
                        balance: pnlData.realizedTotal + pnlData.unrealizedTotal,
                        lastUpdated: new Date(),
                        created: new Date()
                    });
                    portfolio = OptionService.getOptionsPortfolio(accountId);
                    if (portfolio) {
                        tradesWithPortfolio = trades.map(function (trade) { return (__assign({}, trade
                        // Using actual realized P&L values from broker directly
                        )); });
                        successCount = 0;
                        for (_i = 0, tradesWithPortfolio_1 = tradesWithPortfolio; _i < tradesWithPortfolio_1.length; _i++) {
                            trade = tradesWithPortfolio_1[_i];
                            try {
                                OptionService.addTrade(accountId, trade);
                                successCount++;
                            }
                            catch (error) {
                                console.error("Failed to add trade ".concat(trade.id, ":"), error);
                            }
                        }
                        setResult({
                            success: true,
                            message: "Successfully imported ".concat(successCount, " of ").concat(trades.length, " trades with actual P&L data"),
                            pnlData: __assign(__assign({}, pnlData), { spyRealizedPL: stats.totalPL, openPL: stats.openPL, combinedPL: stats.combinedPL, winRate: stats.winRate }),
                            tradeCount: successCount
                        });
                    }
                    else {
                        setResult({
                            success: false,
                            message: 'Failed to get portfolio for account'
                        });
                    }
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _b.sent();
                    console.error('Import error:', error_1);
                    setResult({
                        success: false,
                        message: "Error importing file: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error')
                    });
                    return [3 /*break*/, 5];
                case 4:
                    setParsing(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (<div className="card mb-4">
      <div className="card-header">
        <h5>IBKR Statement Import (with Direct P&L)</h5>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <label htmlFor="accountId" className="form-label">Account ID</label>
          <input type="text" className="form-control" id="accountId" value={accountId} onChange={function (e) { return setAccountId(e.target.value); }} placeholder="Enter account ID"/>
        </div>
        
        <div className="mb-3">
          <label htmlFor="accountName" className="form-label">Account Name</label>
          <input type="text" className="form-control" id="accountName" value={accountName} onChange={function (e) { return setAccountName(e.target.value); }} placeholder="Enter account name"/>
        </div>
        
        <div className="mb-3">
          <label htmlFor="statementFile" className="form-label">IBKR Activity Statement CSV</label>
          <input type="file" className="form-control" id="statementFile" accept=".csv" onChange={handleFileChange}/>
          <div className="form-text">
            Upload your IBKR activity statement in CSV format to import trades with direct P&L values.
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleImport} disabled={parsing || !file}>
          {parsing ? 'Importing...' : 'Import Statement'}
        </button>

        {result && (<div className={"alert mt-3 ".concat(result.success ? 'alert-success' : 'alert-danger')}>
            <p>{result.message}</p>
            
            {result.success && result.pnlData && (<div className="mt-2">
                <h6>P&L Summary:</h6>
                <ul className="mb-0">
                  <li>Realized P&L: {formatCurrency(result.pnlData.realizedTotal)}</li>
                  <li>Unrealized P&L: {formatCurrency(result.pnlData.unrealizedTotal)}</li>
                  <li>Fees: {formatCurrency(result.pnlData.totalFees)}</li>
                  <li>SPY Realized P&L (net): {formatCurrency(result.pnlData.spyRealizedPL)}</li>
                  <li>Open Positions P&L: {formatCurrency(result.pnlData.openPL)}</li>
                  <li>Combined P&L: {formatCurrency(result.pnlData.combinedPL)}</li>
                  <li>Win Rate: {result.pnlData.winRate}</li>
                  <li>Trades Imported: {result.tradeCount}</li>
                </ul>
              </div>)}
          </div>)}
      </div>
    </div>);
};
export default IBKRStatementImport;
