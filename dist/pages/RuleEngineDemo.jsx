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
import { evaluateAndExecuteRules } from '../utils/ruleEngine/ruleEngineCore';
import { useTrades } from '../context/TradesContext';
import RuleEditor from '../components/RuleEditor';
// Sample rule: Reduce position size by 50% if two consecutive losses
var rules = [
    {
        id: 'loss-throttle',
        name: 'Two-Loss Throttle',
        description: 'Reduce position size after 2 consecutive losses',
        type: 'throttle',
        enabled: true,
        conditions: {
            and: [
                { field: 'consecutiveLosses', operator: '>=', value: 2 },
                { field: 'accountBalance', operator: '>', value: 1000 }
            ]
        },
        actions: [
            {
                type: 'reducePositionSize',
                parameters: { byPercent: 50 },
                executeAt: 2000 // Delay execution by 2 seconds
            }
        ],
        metadata: {
            version: '1.0',
            createdBy: 'demo',
            createdAt: new Date().toISOString()
        }
    }
];
function computeContextForTrade(trades, selectedIndex) {
    var consecutiveLosses = 0;
    var accountBalance = 0;
    if (!trades)
        return { consecutiveLosses: consecutiveLosses, accountBalance: accountBalance };
    for (var i = 0; i <= selectedIndex; i++) {
        var trade = trades[i];
        if (!trade || typeof trade.netAmount !== 'number')
            continue;
        accountBalance += trade.netAmount;
        if (trade.netAmount < 0) {
            consecutiveLosses++;
        }
        else {
            consecutiveLosses = 0;
        }
    }
    return { consecutiveLosses: consecutiveLosses, accountBalance: accountBalance };
}
export default function RuleEngineDemo() {
    var trades = useTrades().trades;
    var _a = useState(null), selectedTradeIndex = _a[0], setSelectedTradeIndex = _a[1];
    var _b = useState(0), consecutiveLosses = _b[0], setConsecutiveLosses = _b[1];
    var _c = useState(5000), accountBalance = _c[0], setAccountBalance = _c[1];
    var _d = useState([]), log = _d[0], setLog = _d[1];
    var _e = useState(false), isEvaluating = _e[0], setIsEvaluating = _e[1];
    var _f = useState(null), batchResults = _f[0], setBatchResults = _f[1];
    var _g = useState(false), isBatchEvaluating = _g[0], setIsBatchEvaluating = _g[1];
    var _h = useState(rules[0]), currentRule = _h[0], setCurrentRule = _h[1];
    // Debug: log isEvaluating on every render
    console.log('Render: isEvaluating =', isEvaluating);
    console.log('Button render: isEvaluating =', isEvaluating, '| disabled prop =', isEvaluating);
    // Context with mock functions
    var context = {
        currentPositionSize: 100,
        setPositionSize: function (size) { return addLog("[Context] Set position size to ".concat(size)); },
        notify: function (msg) { return addLog("[Context] Notify: ".concat(msg)); }
    };
    // Helper to add to log
    function addLog(msg) {
        setLog(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["[".concat(new Date().toLocaleTimeString(), "] ").concat(msg)], false); });
    }
    // Event emitter
    var onEvent = function (_a) {
        var rule = _a.rule, action = _a.action;
        addLog("[EventEmitter] Rule triggered: ".concat(rule.name, ", Action: ").concat(action.type));
    };
    // Logger
    var logger = {
        info: function (msg, meta) { return addLog("[Logger][INFO] ".concat(msg)); },
        error: function (msg, err) { return addLog("[Logger][ERROR] ".concat(msg, " ").concat(err ? JSON.stringify(err) : '')); },
        ruleMatched: function (rule, data) { return addLog("[Logger][MATCHED] Rule: ".concat(rule.name)); },
        actionExecuted: function (action, rule) { return addLog("[Logger][ACTION] Executed: ".concat(action.type, " for rule ").concat(rule.name)); }
    };
    // Single trade evaluation
    function handleEvaluate() {
        return __awaiter(this, void 0, void 0, function () {
            var inputData, _a, cl, ab, err_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        setIsEvaluating(true);
                        setLog([]);
                        setBatchResults(null);
                        if (selectedTradeIndex !== null && trades[selectedTradeIndex]) {
                            _a = computeContextForTrade(trades, selectedTradeIndex), cl = _a.consecutiveLosses, ab = _a.accountBalance;
                            inputData = __assign({ consecutiveLosses: cl, accountBalance: ab }, trades[selectedTradeIndex]);
                        }
                        else {
                            inputData = { consecutiveLosses: consecutiveLosses, accountBalance: accountBalance };
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, 4, 5]);
                        addLog('Starting rule evaluation...');
                        return [4 /*yield*/, evaluateAndExecuteRules([currentRule], inputData, context, { onEvent: onEvent, logger: logger })];
                    case 2:
                        _b.sent();
                        addLog('Rule evaluation completed.');
                        return [3 /*break*/, 5];
                    case 3:
                        err_1 = _b.sent();
                        addLog('Error during rule evaluation: ' + (err_1 instanceof Error ? err_1.message : String(err_1)));
                        return [3 /*break*/, 5];
                    case 4:
                        setIsEvaluating(false);
                        addLog('setIsEvaluating(false) called.');
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    // Batch evaluation for all trades
    function handleBatchEvaluate() {
        return __awaiter(this, void 0, void 0, function () {
            var results, _loop_1, i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setIsBatchEvaluating(true);
                        setLog([]);
                        setBatchResults(null);
                        results = [];
                        _loop_1 = function (i) {
                            var _b, cl, ab, inputData, ruleTriggered, actionTaken, localLog, batchLogger, err_2;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        _b = computeContextForTrade(trades, i), cl = _b.consecutiveLosses, ab = _b.accountBalance;
                                        inputData = __assign({ consecutiveLosses: cl, accountBalance: ab }, trades[i]);
                                        ruleTriggered = false;
                                        actionTaken = null;
                                        localLog = [];
                                        batchLogger = {
                                            ruleMatched: function () { ruleTriggered = true; },
                                            actionExecuted: function (action) { actionTaken = action.type; },
                                            info: function (msg) { return localLog.push(msg); },
                                            error: function (msg) { return localLog.push(msg); }
                                        };
                                        _c.label = 1;
                                    case 1:
                                        _c.trys.push([1, 3, , 4]);
                                        return [4 /*yield*/, evaluateAndExecuteRules([currentRule], inputData, context, { logger: batchLogger })];
                                    case 2:
                                        _c.sent();
                                        return [3 /*break*/, 4];
                                    case 3:
                                        err_2 = _c.sent();
                                        localLog.push('Error: ' + (err_2 instanceof Error ? err_2.message : String(err_2)));
                                        return [3 /*break*/, 4];
                                    case 4:
                                        results.push({
                                            index: i,
                                            symbol: trades[i].symbol,
                                            tradeDate: trades[i].tradeDate,
                                            netAmount: trades[i].netAmount,
                                            consecutiveLosses: cl,
                                            accountBalance: ab,
                                            ruleTriggered: ruleTriggered,
                                            actionTaken: actionTaken,
                                            localLog: localLog
                                        });
                                        return [2 /*return*/];
                                }
                            });
                        };
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < trades.length)) return [3 /*break*/, 4];
                        return [5 /*yield**/, _loop_1(i)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4:
                        setBatchResults(results);
                        setIsBatchEvaluating(false);
                        addLog('Batch evaluation completed.');
                        return [2 /*return*/];
                }
            });
        });
    }
    // Show computed context for selected trade
    var computedContext = null;
    if (selectedTradeIndex !== null && trades[selectedTradeIndex]) {
        var _j = computeContextForTrade(trades, selectedTradeIndex), cl = _j.consecutiveLosses, ab = _j.accountBalance;
        computedContext = (<div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded">
        <div className="text-sm text-blue-800">Computed for selected trade:</div>
        <div className="text-xs text-blue-700">Consecutive Losses: <b>{cl}</b></div>
        <div className="text-xs text-blue-700">Account Balance: <b>${ab.toFixed(2)}</b></div>
      </div>);
    }
    // Count how many trades triggered the rule in batch mode
    var batchTriggeredCount = batchResults ? batchResults.filter(function (r) { return r.ruleTriggered; }).length : 0;
    return (<div className="max-w-3xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h1 className="text-2xl font-bold mb-4">Rule Engine Demo</h1>
      <div className="mb-4 flex gap-2 items-center">
        <div>
          <span className="font-semibold">Loaded Trades:</span> {trades.length}
        </div>
        <button onClick={function () { return setLog([]); }} className="ml-4 px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300">
          Clear Log
        </button>
        <button onClick={handleBatchEvaluate} disabled={isEvaluating || isBatchEvaluating || trades.length === 0} className="ml-2 px-2 py-1 text-xs bg-green-200 rounded hover:bg-green-300 disabled:opacity-50">
          {isBatchEvaluating ? 'Batch Evaluating...' : 'Batch Evaluate All Trades'}
        </button>
      </div>
      {trades.length > 0 && (<div className="mb-2">
          <label className="block mb-1 font-medium">Select Trade for Rule Input</label>
          <select value={selectedTradeIndex !== null && selectedTradeIndex !== void 0 ? selectedTradeIndex : ''} onChange={function (e) { return setSelectedTradeIndex(e.target.value === '' ? null : Number(e.target.value)); }} className="border rounded px-2 py-1 w-full" disabled={isEvaluating || isBatchEvaluating}>
            <option value="">-- Manual Input --</option>
            {trades.slice(0, 50).map(function (trade, i) { return (<option key={trade.id} value={i}>
                {trade.symbol} | {trade.tradeDate} | Net: {trade.netAmount}
              </option>); })}
          </select>
          <div className="text-xs text-gray-500 mt-1">(Showing first 50 trades)</div>
        </div>)}
      {computedContext}
      {selectedTradeIndex === null && (<>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Consecutive Losses</label>
            <input type="number" min={0} value={consecutiveLosses} onChange={function (e) { return setConsecutiveLosses(Number(e.target.value)); }} className="border rounded px-2 py-1 w-full" disabled={isEvaluating || isBatchEvaluating}/>
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Account Balance</label>
            <input type="number" min={0} value={accountBalance} onChange={function (e) { return setAccountBalance(Number(e.target.value)); }} className="border rounded px-2 py-1 w-full" disabled={isEvaluating || isBatchEvaluating}/>
          </div>
        </>)}
      {/* The button is disabled only when isEvaluating or isBatchEvaluating is true */}
      <button onClick={handleEvaluate} disabled={isEvaluating || isBatchEvaluating} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
        {isEvaluating && (<svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>)}
        {isEvaluating ? 'Evaluating...' : 'Evaluate Rules'}
      </button>
      {/* Batch results table */}
      {batchResults && (<div className="mt-6">
          <h2 className="font-semibold mb-2">Batch Evaluation Results</h2>
          <div className="mb-2 text-sm text-blue-700">{batchTriggeredCount} of {batchResults.length} trades triggered the rule.</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 py-1 border">#</th>
                  <th className="px-2 py-1 border">Symbol</th>
                  <th className="px-2 py-1 border">Date</th>
                  <th className="px-2 py-1 border">Net</th>
                  <th className="px-2 py-1 border">Consec. Losses</th>
                  <th className="px-2 py-1 border">Acct Bal</th>
                  <th className="px-2 py-1 border">Triggered</th>
                  <th className="px-2 py-1 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {batchResults.map(function (r, i) { return (<tr key={i} className={r.ruleTriggered ? 'bg-green-50' : ''}>
                    <td className="px-2 py-1 border">{i + 1}</td>
                    <td className="px-2 py-1 border">{r.symbol}</td>
                    <td className="px-2 py-1 border">{r.tradeDate}</td>
                    <td className="px-2 py-1 border">{typeof r.netAmount === 'number' ? r.netAmount.toFixed(2) : r.netAmount}</td>
                    <td className="px-2 py-1 border">{r.consecutiveLosses}</td>
                    <td className="px-2 py-1 border">${r.accountBalance.toFixed(2)}</td>
                    <td className="px-2 py-1 border text-center">{r.ruleTriggered ? '✅' : ''}</td>
                    <td className="px-2 py-1 border">{r.actionTaken || ''}</td>
                  </tr>); })}
              </tbody>
            </table>
          </div>
        </div>)}
      <div className="mt-6">
        <h2 className="font-semibold mb-2">Event Log</h2>
        <div className="bg-gray-100 rounded p-3 h-48 overflow-y-auto text-sm font-mono">
          {log.length === 0 ? <div className="text-gray-400">No events yet.</div> :
            log.map(function (line, i) { return <div key={i}>{line}</div>; })}
        </div>
      </div>

      {/* Rule Editor Section */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h2 className="text-xl font-semibold mb-3">Rule Editor</h2>
        <RuleEditor initialRule={currentRule} onChange={function (updatedRule) { return setCurrentRule(updatedRule); }}/>
        <div className="mt-4 p-2 bg-gray-50 border border-gray-200 rounded">
          <h3 className="text-sm font-medium text-gray-700 mb-1">Live Rule Object:</h3>
          <pre className="text-xs text-gray-600 overflow-auto">
            {JSON.stringify(currentRule, null, 2)}
          </pre>
        </div>
      </div>
      {/* End Rule Editor Section */}
    </div>);
}
