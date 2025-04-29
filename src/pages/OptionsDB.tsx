import React, { useEffect, useState } from 'react';
import { initDatabase, getTrades, getSummary, insertTrade, insertSummary, resetDatabase, getAggregatePL } from '../services/DatabaseService';
import { parseTradeCSV } from '../utils/parseTradeCSV';

interface Trade {
  id: number;
  symbol: string;
  dateTime: string;
  quantity: number;
  proceeds: number;
  basis: number;
  commissionFee: number;
  realizedPL: number;
  unrealizedPL: number;
  tradePL: number;
  isClose?: boolean;  // Optional flag for position tracking
}

// Utility to import trades from CSV
async function importTradesFromCSV(content: string): Promise<{ success: boolean; error?: string }> {
  try {
    const trades = parseTradeCSV(content);

    if (trades.length === 0) {
      return { success: false, error: 'No valid trades found in the file.' };
    }

    for (const trade of trades) {
      const realizedPL = (trade.proceeds ?? 0) - (trade.basis ?? 0) - (trade.commissionFee ?? 0);
      const unrealizedPL = 0; // You can adjust if you support open trades differently

      await insertTrade({
        symbol: trade.symbol,
        dateTime: trade.dateTime,
        quantity: trade.quantity,
        proceeds: trade.proceeds ?? 0,
        basis: trade.basis ?? 0,
        commissionFee: trade.commissionFee ?? 0,
        realizedPL,
        unrealizedPL,
        tradePL: realizedPL + unrealizedPL,
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error('Import failed:', error);
    return { success: false, error: error.message || 'Unknown error during import.' };
  }
}

const OptionsDB: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [cumulativePL, setCumulativePL] = useState<number>(0);
  const [calculatedWinRate, setCalculatedWinRate] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  // Standalone async loader
  async function loadData() {
    try {
      setLoading(true);
      await initDatabase();
      
      // Fetch rows and aggregate in parallel
      const [rawTrades, aggregate] = await Promise.all([
        getTrades(),
        getAggregatePL()
      ]);
      
      const loadedTrades = rawTrades as Trade[];
      console.debug('Loaded trades:', loadedTrades);
      console.debug('Aggregate P&L:', aggregate);
      
      // Calculate positions and closing trades
      const withPos: Trade[] = [];
      const pos: Record<string, number> = {};

      for (const trade of loadedTrades || []) {
        const k = trade.symbol;
        const prev = pos[k] ?? 0;
        const after = prev + trade.quantity;

        // Create a new trade object with the isClose flag
        const tradeWithPos: Trade = {
          ...trade,
          isClose: after === 0 && prev !== 0
        };

        pos[k] = after;
        withPos.push(tradeWithPos);
      }

      // Calculate P&L metrics using running totals
      let accountPL = 0;
      let wins = 0;
      let closedCount = 0;

      const posCash: Record<string, number> = {};
      const posComms: Record<string, number> = {};

      for (const t of withPos) {
        const k = t.symbol;  // or symbol+expiry
        posCash[k] = (posCash[k] ?? 0) + t.proceeds;
        posComms[k] = (posComms[k] ?? 0) + t.commissionFee;

        if (t.isClose) {
          const tradePL = posCash[k] + posComms[k]; // Σ cash flow
          t.realizedPL = tradePL;                   // overwrite the bad number
          accountPL += tradePL;
          closedCount += 1;
          if (tradePL > 0) wins += 1;

          // reset running totals for this contract
          posCash[k] = 0;
          posComms[k] = 0;
        }
      }

      setTrades(withPos);
      setCumulativePL(accountPL);
      setCalculatedWinRate(closedCount ? (wins / closedCount) * 100 : 0);
      
      setDebugLogs([
        '[DEBUG] Loaded trades from DB:',
        JSON.stringify(withPos, null, 2),
        '[DEBUG] Account P&L:',
        JSON.stringify(accountPL, null, 2),
        '[DEBUG] Win Rate:',
        JSON.stringify(closedCount ? (wins / closedCount) * 100 : 0, null, 2)
      ]);
    } catch (err) {
      setError('Failed to load data from database.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  // File upload handler for import UI
  async function handleFileUpload(file: File) {
    const content = await file.text();
    const result = await importTradesFromCSV(content);
    if (!result.success) {
      let errorMsg = result.error;
      if (errorMsg === 'Invalid file format. Expected a Trade History CSV.') {
        errorMsg = 'This file does not appear to be a valid Trade Report.\nPlease export your "Trade History" CSV from your broker and try again.';
      }
      alert(`❗ Import Error: ${errorMsg}`);
      return;
    }
    alert(`✅ Trades imported successfully!`);
    await loadData(); // Refresh state after import
  }

  const loadSampleData = async () => {
    // Use the same sample trades as in Options.tsx
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const sampleTrades = [
      {
        symbol: 'SPY',
        dateTime: yesterday.toISOString(),
        quantity: 1,
        proceeds: 0,
        basis: 0,
        commissionFee: 1.25,
        realizedPL: 0,
        unrealizedPL: 150.00,
        tradePL: 150.00
      },
      {
        symbol: 'AAPL',
        dateTime: yesterday.toISOString(),
        quantity: -2,
        proceeds: 0,
        basis: 0,
        commissionFee: 2.50,
        realizedPL: 300.00,
        unrealizedPL: 0,
        tradePL: 300.00
      }
    ];

    for (const trade of sampleTrades) {
      insertTrade(trade);
    }
    insertSummary(450.00);
    // Instead of window.location.reload(), reload data in-place
    setTrades(getTrades());
    setCumulativePL(Number(getSummary()));
  };

  const handleReset = () => {
    resetDatabase();
    window.location.reload();
  };

  // Analytics calculations
  const totalPL = cumulativePL;
  const openTrades = trades.filter(t => !t.realizedPL || t.realizedPL === 0).length;
  const closedTrades = trades.filter(t => t.realizedPL && t.realizedPL !== 0).length;

  if (loading) return <div>Loading options data...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: 24 }}>
      <h1>Options Dashboard (SQLite)</h1>
      {/* Import CSV Section */}
      <div style={{ marginBottom: 24 }}>
        <input
          type="file"
          accept=".csv,.txt"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
        />
        <span style={{ marginLeft: 8, color: '#555' }}>Import trades from CSV</span>
      </div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, minWidth: 160 }} data-testid="total-pl">
          <div style={{ fontWeight: 600 }}>Total P&amp;L</div>
          <div style={{ fontSize: 24, color: totalPL >= 0 ? 'green' : 'red' }}>${totalPL.toFixed(2)}</div>
        </div>
        <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, minWidth: 160 }} data-testid="win-rate">
          <div style={{ fontWeight: 600 }}>Win Rate</div>
          <div style={{ fontSize: 24 }}>{calculatedWinRate.toFixed(1)}%</div>
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
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Debug Log (Loaded Data)</div>
        <pre style={{ fontSize: 12, color: '#333', whiteSpace: 'pre-wrap' }} data-testid="debug-log">
          {JSON.stringify(trades, null, 2)}
          {'\n'}
          {JSON.stringify(cumulativePL, null, 2)}
        </pre>
      </div>
      {/* Additional debug dump for sanity check */}
      <div>
        <h2>Debug Loaded trades</h2>
        <pre>{JSON.stringify(trades.slice(0,10), null, 2)}</pre>
      </div>
      <button onClick={loadSampleData} style={{ marginBottom: 16 }}>Load Sample Trades</button>
      <button onClick={handleReset} style={{ marginLeft: 8, marginBottom: 16 }}>Reset Database</button>
      <h2>Cumulative P&amp;L: <span style={{ color: cumulativePL >= 0 ? 'green' : 'red' }}>{cumulativePL.toFixed(2)}</span></h2>
      {/* Debug Info Section */}
      {trades && (
        <div style={{ backgroundColor: '#eef', padding: '1em', margin: '1em 0', fontFamily: 'monospace' }}>
          <h3>🔍 Debug Info</h3>
          <div><strong>Number of trades loaded:</strong> {trades.length}</div>
          {trades.length === 0 ? (
            <div style={{ color: 'red' }}>⚠️ No trades found. Please import trades first.</div>
          ) : (
            <pre>{JSON.stringify(trades.slice(0, 5), null, 2)}</pre>
          )}
        </div>
      )}
      <table border={1} cellPadding={6} cellSpacing={0} style={{ marginTop: 16, width: '100%', background: '#fff' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Symbol</th>
            <th>Date/Time</th>
            <th>Quantity</th>
            <th>Proceeds</th>
            <th>Basis</th>
            <th>Commission Fee</th>
            <th>Realized P&amp;L</th>
            <th>Unrealized P&amp;L</th>
            <th>Trade P&amp;L</th>
          </tr>
        </thead>
        <tbody>
          {trades.length === 0 ? (
            <tr><td colSpan={10} style={{ textAlign: 'center' }}>No trades found.</td></tr>
          ) : (
            trades.map(trade => (
              <tr key={trade.id}>
                <td>{trade.id}</td>
                <td>{trade.symbol}</td>
                <td>{trade.dateTime}</td>
                <td>{trade.quantity}</td>
                <td>{trade.proceeds}</td>
                <td>{trade.basis}</td>
                <td>{trade.commissionFee}</td>
                <td>{trade.realizedPL}</td>
                <td>{trade.unrealizedPL}</td>
                <td>{trade.tradePL}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OptionsDB; 