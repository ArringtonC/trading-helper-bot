import React, { useState, useMemo } from 'react';
import { useTrades } from '../../context/TradesContext';
import CumulativePnlChart from '../../components/visualizations/CumulativePnlChart';
import DecayChart from '../../components/visualizations/DecayChart';
import TradeTable from '../../components/TradeTable';
import PositionDetailView from '../../components/options/PositionDetailView';
import { OptionTrade, OptionStrategy } from '../../types/options';

const currencyFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const dateFmt = (d: Date | string | undefined) => {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
};

const InteractiveAnalytics: React.FC = () => {
  const { trades } = useTrades();

  // Filter state
  const [symbolFilter, setSymbolFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<any | null>(null);
  const [showAnnotation, setShowAnnotation] = useState(false);

  // Filtered trades
  const filteredTrades = useMemo(() => {
    let filtered = trades;
    if (symbolFilter) {
      filtered = filtered.filter(t => t.symbol.toLowerCase().includes(symbolFilter.toLowerCase()));
    }
    if (dateRange) {
      filtered = filtered.filter(t => t.tradeDate >= dateRange[0] && t.tradeDate <= dateRange[1]);
    }
    return filtered;
  }, [trades, symbolFilter, dateRange]);

  // Helper: Map FetchedTrade to OptionTrade (minimal mapping for demo)
  const mapFetchedTradeToOptionTrade = (t: any): OptionTrade => ({
    id: t.id,
    symbol: t.symbol,
    putCall: t.putCall === 'PUT' ? 'PUT' : 'CALL',
    strike: t.strikePrice || 0,
    expiry: t.expiryDate ? new Date(t.expiryDate) : new Date(t.tradeDate),
    quantity: t.quantity,
    premium: t.tradePrice || 0,
    openDate: t.tradeDate ? new Date(t.tradeDate) : new Date(),
    // Treat all trades as closed if openCloseIndicator is 'C' or missing
    closeDate: t.openCloseIndicator === 'C' || !t.openCloseIndicator ? (t.settleDate ? new Date(t.settleDate) : new Date(t.tradeDate)) : undefined,
    closePremium: undefined, // Not available in FetchedTrade
    strategy: OptionStrategy.OTHER,
    commission: t.commission || 0,
    notes: t.notes,
    tradePL: t.netAmount,
    proceeds: t.proceeds,
    status: t.openCloseIndicator === 'C' || !t.openCloseIndicator ? 'Closed' : 'Open',
    assetCategory: t.assetCategory || 'OPT',
  });

  // Use mapped OptionTrade[] for all OptionTrade components
  const optionTrades = useMemo<OptionTrade[]>(() => filteredTrades.map(mapFetchedTradeToOptionTrade), [filteredTrades]);

  // Only include trades that are actual trades (exclude assetCategory === 'CASH')
  const tradeOnlyOptionTrades = optionTrades.filter(
    t => t.assetCategory && t.assetCategory !== 'CASH'
  );

  // Summary calculations (match OptionsDB logic, but only for trades)
  const netChangeInCash = -tradeOnlyOptionTrades.reduce((sum, t) => sum + (t.tradePL ?? 0), 0);
  const closedTrades = tradeOnlyOptionTrades.filter(t => t.status === 'Closed');
  const winningTrades = closedTrades.filter(t => (t.tradePL ?? 0) > 0);
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
  const cumulativePL = tradeOnlyOptionTrades.reduce((sum, t) => sum + (t.tradePL ?? 0), 0);

  // Export handler (CSV/JSON)
  const handleExport = (format: 'csv' | 'json') => {
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(filteredTrades, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'trades.json';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Simple CSV export
      const headers = Object.keys(filteredTrades[0] || {}).join(',');
      const rows = filteredTrades.map(t => Object.values(t).join(','));
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'trades.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Annotation handler (placeholder)
  const handleAnnotation = () => {
    setShowAnnotation(true);
    setTimeout(() => setShowAnnotation(false), 2000);
  };

  // Helper: Check if a row (object) has all zero or empty values (except id/symbol)
  const isAllZeroRow = (row: any) => {
    return Object.entries(row)
      .filter(([key]) => key !== 'id' && key !== 'symbol' && key !== 'expiry' && key !== 'strike')
      .every(([, value]) => Number(value) === 0 || value === '' || value === null || value === undefined);
  };

  // Filtered trades for table/chart: only those with non-zero P&L
  const nonZeroPLTrades = tradeOnlyOptionTrades.filter(t => (t.tradePL ?? 0) !== 0);

  // Filtered symbols for heatmap: only those with at least one non-zero P&L
  const nonZeroSymbols = Array.from(new Set(nonZeroPLTrades.map(t => t.symbol)));

  // Top 10 symbols by total P&L
  const topSymbols = useMemo(() => {
    const symbolPL: Record<string, number> = {};
    tradeOnlyOptionTrades.forEach(t => {
      symbolPL[t.symbol] = (symbolPL[t.symbol] || 0) + (t.tradePL ?? 0);
    });
    return Object.entries(symbolPL)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 10);
  }, [tradeOnlyOptionTrades]);

  return (
    <div className="container mx-auto px-2 py-6 space-y-6">
      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm text-gray-500">Net Change in Cash</div>
          <div className={`text-xl font-bold ${netChangeInCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>{currencyFmt.format(netChangeInCash)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm text-gray-500">Win Rate (round-trips)</div>
          <div className="text-xl font-bold">{winRate.toFixed(1)}%</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-sm text-gray-500">Cumulative P&L</div>
          <div className={`text-xl font-bold ${cumulativePL >= 0 ? 'text-green-600' : 'text-red-600'}`}>{currencyFmt.format(cumulativePL)}</div>
        </div>
      </div>
      <h1 className="text-2xl font-bold mb-4">Interactive Analytics</h1>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center mb-4">
        <input
          type="text"
          placeholder="Filter by symbol..."
          value={symbolFilter}
          onChange={e => setSymbolFilter(e.target.value)}
          className="px-3 py-2 border rounded"
        />
        <label className="flex items-center gap-2">
          Date Range:
          <input
            type="date"
            value={dateRange ? dateRange[0] : ''}
            onChange={e => setDateRange([e.target.value, dateRange ? dateRange[1] : ''])}
            className="border rounded px-2 py-1"
          />
          <span>-</span>
          <input
            type="date"
            value={dateRange ? dateRange[1] : ''}
            onChange={e => setDateRange([dateRange ? dateRange[0] : '', e.target.value])}
            className="border rounded px-2 py-1"
          />
        </label>
        <button
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => handleExport('csv')}
        >
          Export CSV
        </button>
        <button
          className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={() => handleExport('json')}
        >
          Export JSON
        </button>
        <button
          className="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          onClick={handleAnnotation}
        >
          Annotate (Demo)
        </button>
        {showAnnotation && (
          <span className="ml-2 text-yellow-700">Annotation saved! (demo)</span>
        )}
      </div>
      {/* Main Panels: Stack vertically */}
      <div className="flex flex-col gap-6">
        {/* Cumulative P&L Chart */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Cumulative P&L</h2>
          {nonZeroPLTrades.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No trades with non-zero P&L to display.</div>
          ) : (
            <CumulativePnlChart trades={nonZeroPLTrades} />
          )}
        </div>
        {/* Top Symbols by P&L Bar Chart */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Top Symbols by Total P&L</h2>
          {topSymbols.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No symbol P&L data to display.</div>
          ) : (
            <div className="space-y-2">
              {topSymbols.map(([symbol, pl]) => (
                <div key={symbol} className="flex items-center gap-2">
                  <span className="w-24 font-mono text-xs text-gray-700">{symbol}</span>
                  <div className="flex-1 h-4 bg-gray-200 rounded">
                    <div
                      className={`h-4 rounded ${pl >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(Math.abs(pl) / Math.abs(topSymbols[0][1] || 1) * 100, 100)}%` }}
                    />
                  </div>
                  <span className={`w-20 text-right font-mono ${pl >= 0 ? 'text-green-700' : 'text-red-700'}`}>{currencyFmt.format(pl)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Feature Table */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Feature Table</h2>
          {nonZeroPLTrades.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No trades with non-zero P&L to display.</div>
          ) : (
            <TradeTable trades={nonZeroPLTrades} showActions={false} showPL={true} onView={setSelectedTrade} />
          )}
        </div>
        {/* Payoff/Decay Chart */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Payoff/Decay Chart</h2>
          <DecayChart
            underlyingPrice={nonZeroPLTrades[0]?.premium || 100}
            strike={nonZeroPLTrades[0]?.strike || 100}
            timeToExpiration={0.1}
            volatility={0.2}
            riskFreeRate={0.01}
            type={nonZeroPLTrades[0]?.putCall === 'PUT' ? 'PUT' : 'CALL'}
          />
        </div>
      </div>
      {/* Drill-down Modal */}
      {selectedTrade && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 max-w-2xl w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setSelectedTrade(null)}
              aria-label="Close"
            >
              ×
            </button>
            <PositionDetailView trade={mapFetchedTradeToOptionTrade(selectedTrade)} onClose={() => setSelectedTrade(null)} />
          </div>
        </div>
      )}
      {/* TODO: Add more advanced cross-filtering, annotation, and chart drill-down in future iterations */}
      {/* TODO: For future, improve grouping by symbol/expiry/strike for better readability */}
    </div>
  );
};

export default InteractiveAnalytics; 