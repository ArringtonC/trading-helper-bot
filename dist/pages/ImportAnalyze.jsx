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
import React, { useState, useEffect } from 'react';
import { IBKRActivityStatementParser } from '../services/IBKRActivityStatementParser';
import { TradesDataGrid } from '../components/TradesDataGrid';
import AccountCard from '../components/AccountCard';
import { AccountType } from '../types/account';
import { evaluateAndExecuteRules } from '../utils/ruleEngine/ruleEngineCore';
var ImportAnalyze = function () {
    var _a;
    var _b = useState(null), file = _b[0], setFile = _b[1];
    var _c = useState(false), parsing = _c[0], setParsing = _c[1];
    var _d = useState(null), parseResult = _d[0], setParseResult = _d[1];
    var _e = useState(null), error = _e[0], setError = _e[1];
    var _f = useState([]), ruleLog = _f[0], setRuleLog = _f[1];
    var _g = useState(false), isEvaluating = _g[0], setIsEvaluating = _g[1];
    var _h = useState(null), batchResults = _h[0], setBatchResults = _h[1];
    var _j = useState(false), isBatchEvaluating = _j[0], setIsBatchEvaluating = _j[1];
    var handleFileChange = function (e) {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setParseResult(null);
            setError(null);
        }
    };
    var handleParse = function () { return __awaiter(void 0, void 0, void 0, function () {
        var content, parser, result, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!file)
                        return [2 /*return*/];
                    setParsing(true);
                    setError(null);
                    setParseResult(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, file.text()];
                case 2:
                    content = _a.sent();
                    parser = new IBKRActivityStatementParser(content);
                    result = parser.parse();
                    setParseResult(__assign(__assign({}, result), { debug: parser.getDebugState() }));
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _a.sent();
                    setError(err_1.message || 'Failed to parse statement');
                    return [3 /*break*/, 5];
                case 4:
                    setParsing(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    // Helper to map parser account to AccountCard type
    var getAccountCardData = function (account) {
        return {
            id: account.accountId || 'unknown',
            name: account.accountName || 'Unknown',
            type: AccountType.IBKR,
            balance: account.balance || 0,
            lastUpdated: new Date(),
            created: new Date(),
            monthlyDeposit: 0,
        };
    };
    // Updated positions table to show rule triggered
    var renderPositionsTable = function (positions, batchResults) {
        if (batchResults === void 0) { batchResults = []; }
        if (!positions || !positions.length)
            return <div>No positions to display.</div>;
        return (<div className="overflow-x-auto mt-2">
        <table className="min-w-full border text-xs">
          <thead>
            <tr>
              <th className="border px-2 py-1">Symbol</th>
              <th className="border px-2 py-1">Qty</th>
              <th className="border px-2 py-1">Cost Basis</th>
              <th className="border px-2 py-1">Market Value</th>
              <th className="border px-2 py-1">Unrealized P/L</th>
              <th className="border px-2 py-1">Rule Triggered</th>
            </tr>
          </thead>
          <tbody>
            {positions.map(function (pos, i) {
                var batch = batchResults === null || batchResults === void 0 ? void 0 : batchResults.find(function (r) { return r.symbol === pos.symbol && r.quantity === pos.quantity; });
                return (<tr key={i}>
                  <td className="border px-2 py-1">{pos.symbol}</td>
                  <td className="border px-2 py-1">{pos.quantity}</td>
                  <td className="border px-2 py-1">{pos.costBasis}</td>
                  <td className="border px-2 py-1">{pos.marketValue}</td>
                  <td className="border px-2 py-1">{pos.unrealizedPL}</td>
                  <td className="border px-2 py-1">{(batch === null || batch === void 0 ? void 0 : batch.ruleTriggered) ? 'Yes' : ''}</td>
                </tr>);
            })}
          </tbody>
        </table>
      </div>);
    };
    function addRuleLog(msg) {
        setRuleLog(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["[".concat(new Date().toLocaleTimeString(), "] ").concat(msg)], false); });
    }
    var context = {
        currentPositionSize: 100,
        setPositionSize: function (size) { return addRuleLog("[Context] Set position size to ".concat(size)); },
        notify: function (msg) { return addRuleLog("[Context] Notify: ".concat(msg)); }
    };
    var onEvent = function (_a) {
        var rule = _a.rule, action = _a.action;
        addRuleLog("[EventEmitter] Rule triggered: ".concat(rule.name, ", Action: ").concat(action.type));
    };
    var logger = {
        info: function (msg, meta) { return addRuleLog("[Logger][INFO] ".concat(msg)); },
        error: function (msg, err) { return addRuleLog("[Logger][ERROR] ".concat(msg, " ").concat(err ? JSON.stringify(err) : '')); },
        ruleMatched: function (rule, data) { return addRuleLog("[Logger][MATCHED] Rule: ".concat(rule.name)); },
        actionExecuted: function (action, rule) { return addRuleLog("[Logger][ACTION] Executed: ".concat(action.type, " for rule ").concat(rule.name)); }
    };
    // Compute context for a position using trades (consecutive losses, account balance)
    function computeContextForPosition(pos, trades) {
        if (trades === void 0) { trades = []; }
        var consecutiveLosses = 0;
        var accountBalance = 0;
        // Filter trades for this symbol
        var symbolTrades = trades.filter(function (t) { return t.symbol === pos.symbol; });
        // Calculate account balance for this symbol
        accountBalance = symbolTrades.reduce(function (sum, t) { return sum + (t.netAmount || 0); }, 0);
        // Calculate most recent consecutive losses (from end)
        for (var i = symbolTrades.length - 1; i >= 0; i--) {
            var trade = symbolTrades[i];
            if (trade.netAmount < 0) {
                consecutiveLosses++;
            }
            else {
                break;
            }
        }
        return __assign({ consecutiveLosses: consecutiveLosses, accountBalance: accountBalance }, pos);
    }
    // After parsing, automatically evaluate rules on first position and then batch
    useEffect(function () {
        if (parseResult && parseResult.positions && parseResult.positions.length > 0) {
            // Only trigger if not already evaluating
            if (!isEvaluating && !isBatchEvaluating && !batchResults) {
                (function () { return __awaiter(void 0, void 0, void 0, function () {
                    var pos, inputData, err_2, results, _loop_1, i;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                setIsEvaluating(true);
                                setRuleLog([]);
                                setBatchResults(null);
                                pos = parseResult.positions[0];
                                inputData = computeContextForPosition(pos, parseResult.trades || []);
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 3, 4, 5]);
                                addRuleLog('Starting rule evaluation...');
                                return [4 /*yield*/, evaluateAndExecuteRules(sampleRules, inputData, context, { onEvent: onEvent, logger: logger })];
                            case 2:
                                _a.sent();
                                addRuleLog('Rule evaluation completed.');
                                return [3 /*break*/, 5];
                            case 3:
                                err_2 = _a.sent();
                                addRuleLog('Error during rule evaluation: ' + (err_2 instanceof Error ? err_2.message : String(err_2)));
                                return [3 /*break*/, 5];
                            case 4:
                                setIsEvaluating(false);
                                return [7 /*endfinally*/];
                            case 5:
                                // Now batch evaluate all positions
                                setIsBatchEvaluating(true);
                                results = [];
                                _loop_1 = function (i) {
                                    var pos_1, inputData_1, consecutiveLosses, accountBalance, ruleTriggered, actionTaken, localLog, batchLogger, err_3;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                pos_1 = parseResult.positions[i];
                                                inputData_1 = computeContextForPosition(pos_1, parseResult.trades || []);
                                                consecutiveLosses = inputData_1.consecutiveLosses, accountBalance = inputData_1.accountBalance;
                                                ruleTriggered = false;
                                                actionTaken = null;
                                                localLog = [];
                                                batchLogger = {
                                                    ruleMatched: function () { ruleTriggered = true; },
                                                    actionExecuted: function (action) { actionTaken = action.type; },
                                                    info: function (msg) { return localLog.push(msg); },
                                                    error: function (msg) { return localLog.push(msg); }
                                                };
                                                _b.label = 1;
                                            case 1:
                                                _b.trys.push([1, 3, , 4]);
                                                return [4 /*yield*/, evaluateAndExecuteRules(sampleRules, inputData_1, context, { logger: batchLogger })];
                                            case 2:
                                                _b.sent();
                                                return [3 /*break*/, 4];
                                            case 3:
                                                err_3 = _b.sent();
                                                localLog.push('Error: ' + (err_3 instanceof Error ? err_3.message : String(err_3)));
                                                return [3 /*break*/, 4];
                                            case 4:
                                                results.push({
                                                    index: i,
                                                    symbol: pos_1.symbol,
                                                    quantity: pos_1.quantity,
                                                    consecutiveLosses: consecutiveLosses,
                                                    accountBalance: accountBalance,
                                                    ruleTriggered: ruleTriggered,
                                                    actionTaken: actionTaken,
                                                    localLog: localLog
                                                });
                                                return [2 /*return*/];
                                        }
                                    });
                                };
                                i = 0;
                                _a.label = 6;
                            case 6:
                                if (!(i < parseResult.positions.length)) return [3 /*break*/, 9];
                                return [5 /*yield**/, _loop_1(i)];
                            case 7:
                                _a.sent();
                                _a.label = 8;
                            case 8:
                                i++;
                                return [3 /*break*/, 6];
                            case 9:
                                setBatchResults(results);
                                setIsBatchEvaluating(false);
                                addRuleLog('Batch evaluation completed.');
                                return [2 /*return*/];
                        }
                    });
                }); })();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parseResult]);
    // Sample rule for demo (now triggers on costBasis < 0)
    var sampleRules = [
        {
            id: 'cost-basis-throttle',
            name: 'Cost Basis Throttle',
            description: 'Reduce position size if cost basis is negative',
            type: 'throttle',
            enabled: true,
            conditions: {
                and: [
                    { field: 'costBasis', operator: '<', value: 0 }
                ]
            },
            actions: [
                {
                    type: 'reducePositionSize',
                    parameters: { byPercent: 50 },
                    executeAt: 2000
                }
            ],
            metadata: {
                version: '1.0',
                createdBy: 'demo',
                createdAt: new Date().toISOString()
            }
        }
    ];
    return (<div className="container py-4">
      <h2 className="mb-4">Import & Analyze IBKR Statement</h2>
      <div className="card mb-4">
        <div className="card-body">
          <label htmlFor="ibkr-file" className="form-label">Upload IBKR Activity Statement (CSV or TXT)</label>
          <input type="file" className="form-control mb-2" id="ibkr-file" accept=".csv,.txt" onChange={handleFileChange}/>
          <button className="btn btn-primary" onClick={handleParse} disabled={!file || parsing}>
            {parsing ? 'Parsing...' : 'Parse Statement'}
          </button>
          {error && <div className="alert alert-danger mt-3">{error}</div>}
        </div>
      </div>

      {parseResult && (<>
          <div className="row mb-4">
            <div className="col-md-4">
              <AccountCard account={getAccountCardData(parseResult.account)} onAddDeposit={function () { }}/>
            </div>
            <div className="col-md-8">
              <h5>Positions</h5>
              {renderPositionsTable(parseResult.positions || [], batchResults || [])}
              {/* TODO: Refactor PositionsTable to accept a prop for direct use here. */}
            </div>
          </div>
          <div className="mb-4">
            <h5>Trades</h5>
            <TradesDataGrid trades={parseResult.trades || []}/>
          </div>
          {/* Debug logs (optional, for devs) */}
          <details className="mb-4">
            <summary>Parser Debug Logs</summary>
            <pre style={{ maxHeight: 200, overflow: 'auto', fontSize: 12 }}>
              {(_a = parseResult.debug) === null || _a === void 0 ? void 0 : _a.join('\n')}
            </pre>
          </details>
        </>)}

      {/* Rule Engine Evaluation Section */}
      <div className="card mt-4">
        <div className="card-header">
          <h5>Rule Engine Evaluation</h5>
        </div>
        <div className="card-body">
          <div className="mb-2">
            <strong>Rule:</strong> {sampleRules[0].name} - {sampleRules[0].description}
          </div>
          <div className="mb-2">
            <strong>Log:</strong>
            <pre style={{ maxHeight: 120, overflow: 'auto', fontSize: 12 }}>{ruleLog.join('\n')}</pre>
          </div>
          {batchResults && (<div className="mt-3">
              <h6>Batch Results</h6>
              <table className="table table-sm table-bordered">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Symbol</th>
                    <th>Qty</th>
                    <th>Consec. Losses</th>
                    <th>Acct. Balance</th>
                    <th>Rule Triggered</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {batchResults.map(function (r, i) { return (<tr key={i}>
                      <td>{r.index + 1}</td>
                      <td>{r.symbol}</td>
                      <td>{r.quantity}</td>
                      <td>{r.consecutiveLosses}</td>
                      <td>{r.accountBalance}</td>
                      <td>{r.ruleTriggered ? 'Yes' : 'No'}</td>
                      <td>{r.actionTaken || '-'}</td>
                    </tr>); })}
                </tbody>
              </table>
              <div className="alert alert-success mt-3">Task Complete: All positions have been evaluated.</div>
            </div>)}
          {/* TODO: Support real rule set or allow rule import from file or database */}
        </div>
      </div>

      {/* Debug Log Viewer */}
      {parseResult && parseResult.debug && (<div className="mt-4">
          <h3>Parser Debug Log</h3>
          <pre style={{ maxHeight: 200, overflow: 'auto', background: '#f8f8f8', padding: 8 }}>
            {parseResult.debug.join('\n')}
          </pre>
        </div>)}
      {/* Key Debug Info Area */}
      {parseResult && parseResult.parserInstance && parseResult.parserInstance.getKeyDebugInfo && (<div className="mt-4">
          <h3>What the parser is looking for:</h3>
          <pre style={{ maxHeight: 200, overflow: 'auto', background: '#e8f5e9', padding: 8 }}>
            {parseResult.parserInstance.getKeyDebugInfo().join('\n')}
          </pre>
        </div>)}
    </div>);
};
export default ImportAnalyze;
