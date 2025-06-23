import React, { useState } from 'react';
import { evaluateAndExecuteRules, RuleEventEmitter, RuleEngineLogger } from '../../../features/trading/utils/ruleEngine/ruleEngineCore';
import { Rule } from '../../../types/RuleSchema';
import { ActionContext } from '../../../features/trading/utils/ruleEngine/actionExecutor';
import { useTrades } from '../../../features/trading/hooks/TradesContext';
import RuleEditor from '../../../features/trading/components/RuleEditor';

// Sample rule: Reduce position size by 50% if two consecutive losses
const rules: Rule[] = [
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

function computeContextForTrade(trades: { netAmount?: number }[], selectedIndex: number) {
  let consecutiveLosses = 0;
  let accountBalance = 0;
  if (!trades) return { consecutiveLosses, accountBalance };
  for (let i = 0; i <= selectedIndex; i++) {
    const trade = trades[i];
    if (!trade || typeof trade.netAmount !== 'number') continue;
    accountBalance += trade.netAmount;
    if (trade.netAmount < 0) {
      consecutiveLosses++;
    } else {
      consecutiveLosses = 0;
    }
  }
  return { consecutiveLosses, accountBalance };
}

export default function RuleEngineDemo() {
  const { trades } = useTrades();
  const [selectedTradeIndex, setSelectedTradeIndex] = useState<number | null>(null);
  const [consecutiveLosses, setConsecutiveLosses] = useState(0);
  const [accountBalance, setAccountBalance] = useState(5000);
  const [log, setLog] = useState<string[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [batchResults, setBatchResults] = useState<any[] | null>(null);
  const [isBatchEvaluating, setIsBatchEvaluating] = useState(false);
  const [currentRule, setCurrentRule] = useState<Rule>(rules[0]);

  // Debug: log isEvaluating on every render
  console.log('Render: isEvaluating =', isEvaluating);
  console.log('Button render: isEvaluating =', isEvaluating, '| disabled prop =', isEvaluating);

  // Context with mock functions
  const context: ActionContext = {
    currentPositionSize: 100,
    setPositionSize: (size) => addLog(`[Context] Set position size to ${size}`),
    notify: (msg) => addLog(`[Context] Notify: ${msg}`)
  };

  // Helper to add to log
  function addLog(msg: string) {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }

  // Event emitter
  const onEvent: RuleEventEmitter = ({ rule, action }) => {
    addLog(`[EventEmitter] Rule triggered: ${rule.name}, Action: ${action.type}`);
  };

  // Logger
  const logger: RuleEngineLogger = {
    info: (msg, meta) => addLog(`[Logger][INFO] ${msg}`),
    error: (msg, err) => addLog(`[Logger][ERROR] ${msg} ${err ? JSON.stringify(err) : ''}`),
    ruleMatched: (rule, data) => addLog(`[Logger][MATCHED] Rule: ${rule.name}`),
    actionExecuted: (action, rule) => addLog(`[Logger][ACTION] Executed: ${action.type} for rule ${rule.name}`)
  };

  // Single trade evaluation
  async function handleEvaluate() {
    setIsEvaluating(true);
    setLog([]);
    setBatchResults(null);
    let inputData: Record<string, any>;
    if (selectedTradeIndex !== null && trades[selectedTradeIndex]) {
      const { consecutiveLosses: cl, accountBalance: ab } = computeContextForTrade(trades, selectedTradeIndex);
      inputData = {
        consecutiveLosses: cl,
        accountBalance: ab,
        ...trades[selectedTradeIndex]
      };
    } else {
      inputData = { consecutiveLosses, accountBalance };
    }
    try {
      addLog('Starting rule evaluation...');
      await evaluateAndExecuteRules(
        [currentRule],
        inputData,
        context,
        { onEvent, logger }
      );
      addLog('Rule evaluation completed.');
    } catch (err) {
      addLog('Error during rule evaluation: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsEvaluating(false);
      addLog('setIsEvaluating(false) called.');
    }
  }

  // Batch evaluation for all trades
  async function handleBatchEvaluate() {
    setIsBatchEvaluating(true);
    setLog([]);
    setBatchResults(null);
    const results: any[] = [];
    for (let i = 0; i < trades.length; i++) {
      const { consecutiveLosses: cl, accountBalance: ab } = computeContextForTrade(trades, i);
      const inputData = {
        consecutiveLosses: cl,
        accountBalance: ab,
        ...trades[i]
      };
      let ruleTriggered = false;
      let actionTaken = null;
      let localLog: string[] = [];
      // Local logger for this trade
      const batchLogger: RuleEngineLogger = {
        ruleMatched: () => { ruleTriggered = true; },
        actionExecuted: (action) => { actionTaken = action.type; },
        info: (msg) => localLog.push(msg),
        error: (msg) => localLog.push(msg)
      };
      try {
        await evaluateAndExecuteRules(
          [currentRule],
          inputData,
          context,
          { logger: batchLogger }
        );
      } catch (err) {
        localLog.push('Error: ' + (err instanceof Error ? err.message : String(err)));
      }
      results.push({
        index: i,
        symbol: trades[i].symbol,
        tradeDate: trades[i].tradeDate,
        netAmount: trades[i].netAmount,
        consecutiveLosses: cl,
        accountBalance: ab,
        ruleTriggered,
        actionTaken,
        localLog
      });
    }
    setBatchResults(results);
    setIsBatchEvaluating(false);
    addLog('Batch evaluation completed.');
  }

  // Show computed context for selected trade
  let computedContext = null;
  if (selectedTradeIndex !== null && trades[selectedTradeIndex]) {
    const { consecutiveLosses: cl, accountBalance: ab } = computeContextForTrade(trades, selectedTradeIndex);
    computedContext = (
      <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded">
        <div className="text-sm text-blue-800">Computed for selected trade:</div>
        <div className="text-xs text-blue-700">Consecutive Losses: <b>{cl}</b></div>
        <div className="text-xs text-blue-700">Account Balance: <b>${ab.toFixed(2)}</b></div>
      </div>
    );
  }

  // Count how many trades triggered the rule in batch mode
  const batchTriggeredCount = batchResults ? batchResults.filter(r => r.ruleTriggered).length : 0;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h1 className="text-2xl font-bold mb-4">Rule Engine Demo</h1>
      <div className="mb-4 flex gap-2 items-center">
        <div>
          <span className="font-semibold">Loaded Trades:</span> {trades.length}
        </div>
        <button
          onClick={() => setLog([])}
          className="ml-4 px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
        >
          Clear Log
        </button>
        <button
          onClick={handleBatchEvaluate}
          disabled={isEvaluating || isBatchEvaluating || trades.length === 0}
          className="ml-2 px-2 py-1 text-xs bg-green-200 rounded hover:bg-green-300 disabled:opacity-50"
        >
          {isBatchEvaluating ? 'Batch Evaluating...' : 'Batch Evaluate All Trades'}
        </button>
      </div>
      {trades.length > 0 && (
        <div className="mb-2">
          <label className="block mb-1 font-medium">Select Trade for Rule Input</label>
          <select
            value={selectedTradeIndex ?? ''}
            onChange={e => setSelectedTradeIndex(e.target.value === '' ? null : Number(e.target.value))}
            className="border rounded px-2 py-1 w-full"
            disabled={isEvaluating || isBatchEvaluating}
          >
            <option value="">-- Manual Input --</option>
            {trades.slice(0, 50).map((trade, i) => (
              <option key={trade.id} value={i}>
                {trade.symbol} | {trade.tradeDate} | Net: {trade.netAmount}
              </option>
            ))}
          </select>
          <div className="text-xs text-gray-500 mt-1">(Showing first 50 trades)</div>
        </div>
      )}
      {computedContext}
      {selectedTradeIndex === null && (
        <>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Consecutive Losses</label>
            <input
              type="number"
              min={0}
              value={consecutiveLosses}
              onChange={e => setConsecutiveLosses(Number(e.target.value))}
              className="border rounded px-2 py-1 w-full"
              disabled={isEvaluating || isBatchEvaluating}
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Account Balance</label>
            <input
              type="number"
              min={0}
              value={accountBalance}
              onChange={e => setAccountBalance(Number(e.target.value))}
              className="border rounded px-2 py-1 w-full"
              disabled={isEvaluating || isBatchEvaluating}
            />
          </div>
        </>
      )}
      {/* The button is disabled only when isEvaluating or isBatchEvaluating is true */}
      <button
        onClick={handleEvaluate}
        disabled={isEvaluating || isBatchEvaluating}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
      >
        {isEvaluating && (
          <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
        {isEvaluating ? 'Evaluating...' : 'Evaluate Rules'}
      </button>
      {/* Batch results table */}
      {batchResults && (
        <div className="mt-6">
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
                {batchResults.map((r, i) => (
                  <tr key={i} className={r.ruleTriggered ? 'bg-green-50' : ''}>
                    <td className="px-2 py-1 border">{i + 1}</td>
                    <td className="px-2 py-1 border">{r.symbol}</td>
                    <td className="px-2 py-1 border">{r.tradeDate}</td>
                    <td className="px-2 py-1 border">{typeof r.netAmount === 'number' ? r.netAmount.toFixed(2) : r.netAmount}</td>
                    <td className="px-2 py-1 border">{r.consecutiveLosses}</td>
                    <td className="px-2 py-1 border">${r.accountBalance.toFixed(2)}</td>
                    <td className="px-2 py-1 border text-center">{r.ruleTriggered ? '✅' : ''}</td>
                    <td className="px-2 py-1 border">{r.actionTaken || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="mt-6">
        <h2 className="font-semibold mb-2">Event Log</h2>
        <div className="bg-gray-100 rounded p-3 h-48 overflow-y-auto text-sm font-mono">
          {log.length === 0 ? <div className="text-gray-400">No events yet.</div> :
            log.map((line, i) => <div key={i}>{line}</div>)}
        </div>
      </div>

      {/* Rule Editor Section */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h2 className="text-xl font-semibold mb-3">Rule Editor</h2>
        <RuleEditor
          initialRule={currentRule}
          onChange={(updatedRule: Rule) => setCurrentRule(updatedRule)}
        />
        <div className="mt-4 p-2 bg-gray-50 border border-gray-200 rounded">
          <h3 className="text-sm font-medium text-gray-700 mb-1">Live Rule Object:</h3>
          <pre className="text-xs text-gray-600 overflow-auto">
            {JSON.stringify(currentRule, null, 2)}
          </pre>
        </div>
      </div>
      {/* End Rule Editor Section */}
    </div>
  );
} 