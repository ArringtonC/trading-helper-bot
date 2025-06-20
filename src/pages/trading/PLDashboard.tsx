import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  TooltipItem
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getTrades, initDatabase } from '../../services/DatabaseService';
import { fmtUsd } from '../../utils/formatters';
import { toast } from 'react-toastify';
import { connectToIBKR, disconnectFromIBKR, subscribeToIBKREvents, requestIBKRAccountSummary, getIBKRPositions, getIBKROrders, getIBKRExecutions } from '../../services/BrokerService';
import { computeRoundTripMetrics } from '../../utils/tradeUtils';
import { NormalizedTradeData } from '../../types/trade';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const PLDashboard: React.FC = () => {
  const [userName] = useState('Trader');
  const [accountValue] = useState<number>(6694.75); // Set initial value from CSV
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [chartData, setChartData] = useState<ChartData<'line', number[]>>({
    labels: [],
    datasets: [],
  });

  // IBKR Connection State
  const [isIBKRConnecting, setIsIBKRConnecting] = useState(false);
  const [ibkrConnectionStatus, setIbkrConnectionStatus] = useState('Disconnected');
  const [ibkrError, setIbkrError] = useState<string | null>(null);

  // Deduplicated account summary by tag
  const [ibkrAccountSummaryMap, setIbkrAccountSummaryMap] = useState<Record<string, { value: string; currency: string }>>({});

  // IBKR Positions State
  const [ibkrPositions, setIbkrPositions] = useState<any[]>([]);
  const [ibkrPositionsLoading, setIbkrPositionsLoading] = useState(false);
  const [ibkrPositionsError, setIbkrPositionsError] = useState<string | null>(null);

  // IBKR Orders State
  const [ibkrOrders, setIbkrOrders] = useState<any[]>([]);
  const [ibkrOrdersLoading, setIbkrOrdersLoading] = useState(false);
  const [ibkrOrdersError, setIbkrOrdersError] = useState<string | null>(null);

  // IBKR Executions State
  const [ibkrExecutions, setIbkrExecutions] = useState<any[]>([]);
  const [ibkrExecutionsLoading, setIbkrExecutionsLoading] = useState(false);
  const [ibkrExecutionsError, setIbkrExecutionsError] = useState<string | null>(null);

  const [roundTripMetrics, setRoundTripMetrics] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(undefined); // Clear previous errors
        await initDatabase();
        
        // Load trades to build an equity curve
        const rawTrades = await getTrades();
        // Map to expected TradeRow shape
        const trades = rawTrades.map((t: any) => ({
          ...t,
          dateTime: t.tradeDate || '',
          tradePL: t.netAmount || 0,
        }));
        // --- Debug: Log raw trades ---
        console.log('[PLDashboard] Raw trades loaded:', trades);
        
        if (trades.length) {
          let running = 0;
          const byDate: Record<string, number> = {};
          trades.forEach(({ dateTime, tradePL }) => {
            const [day] = dateTime.split(','); // TODO: Use proper date parsing
            running += tradePL;
            byDate[day] = running;
          });

          const labels = Object.keys(byDate);
          setChartData({
            labels,
            datasets: [
              {
                label: 'Cumulative P&L',
                data: labels.map(d => byDate[d]),
                fill: false,
                tension: 0.1,
                borderColor: '#10b981',
                backgroundColor: '#dcfce7',
              },
            ],
          });

          // --- Compute round-trip metrics ---
          const metrics = computeRoundTripMetrics(trades as NormalizedTradeData[]);
          setRoundTripMetrics(metrics);
          // --- Debug: Log round-trip metrics and each pair ---
          console.log('[PLDashboard] Round-trip metrics:', metrics);
          if (metrics && metrics.roundTrips) {
            metrics.roundTrips.forEach((rt: any, idx: number) => {
              console.log(`[PLDashboard] Round-trip #${idx + 1}:`, {
                open: rt.open,
                close: rt.close,
                pl: rt.pl
              });
            });
          }
        } else {
          // Explicitly set chartData to empty if no trades, to distinguish from loading state
          setChartData({ labels: [], datasets: [] }); 
        }
      } catch (err: any) {
        console.error('Error loading dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Accumulate account summary rows on event
  useEffect(() => {
    const unsubscribe = subscribeToIBKREvents((eventData) => {
      if (eventData.type === 'account-summary') {
        setIbkrAccountSummaryMap(prev => ({
          ...prev,
          [eventData.data.tag]: { value: eventData.data.value, currency: eventData.data.currency }
        }));
        console.log('[PLDashboard] Received account summary row:', eventData.data);
      } else if (eventData.type === 'connection-status') {
        setIbkrConnectionStatus(eventData.status === 'connected'
          ? 'Connected'
          : eventData.status === 'disconnected'
          ? 'Disconnected'
          : eventData.status === 'error'
          ? 'Connection Error'
          : eventData.status || 'Unknown');
        if (eventData.status === 'error') {
          setIbkrError(eventData.message || 'Unknown IBKR connection error');
        } else {
          setIbkrError(null);
        }
      } else if (eventData.type === 'error') {
        setIbkrError(eventData.message || 'Unknown IBKR error');
      } else {
        toast.info(`Received IBKR event: ${eventData.type}`);
        console.log('[PLDashboard] Unhandled IBKR event:', eventData);
      }
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Clear summary map on disconnect
  useEffect(() => {
    if (ibkrConnectionStatus !== 'Connected') {
      setIbkrAccountSummaryMap({});
    }
  }, [ibkrConnectionStatus]);

  // IBKR Connection Handlers
  const handleConnectIBKR = async () => {
    console.log('[PLDashboard] IBKR Connect button clicked');
    setIsIBKRConnecting(true);
    setIbkrError(null);
    setIbkrConnectionStatus('Connecting...');
    try {
      const success = await connectToIBKR();
      if (success) {
        setIbkrConnectionStatus('Connection attempt successful. Check console for logs.');
        // In a real scenario, you'd wait for a 'connected' event or check status
        toast.success('IBKR connection process initiated.');
      } else {
        setIbkrConnectionStatus('Failed to initiate connection.');
        setIbkrError('Could not initiate IBKR connection. Check console.');
        toast.error('Failed to initiate IBKR connection.');
      }
    } catch (error: any) {
      console.error('Error connecting to IBKR:', error);
      setIbkrConnectionStatus('Connection Error');
      setIbkrError(error.message || 'An unknown error occurred during connection.');
      toast.error(`IBKR Connection Error: ${error.message}`);
    }
    setIsIBKRConnecting(false);
  };

  const handleDisconnectIBKR = async () => {
    console.log('[PLDashboard] IBKR Disconnect button clicked');
    try {
      await disconnectFromIBKR();
      setIbkrConnectionStatus('Disconnected');
      toast.info('Disconnected from IBKR.');
    } catch (error: any) {
      console.error('Error disconnecting from IBKR:', error);
      setIbkrError(error.message || 'An unknown error occurred during disconnection.');
      toast.error(`IBKR Disconnection Error: ${error.message}`);
    }
  };

  const handleRequestAccountSummary = async () => {
    const result = await requestIBKRAccountSummary();
    if (result.success) {
      toast.success('Account summary request sent!');
    } else {
      toast.error('Failed to request account summary: ' + result.message);
    }
  };

  const handleRequestPositions = async () => {
    setIbkrPositionsLoading(true);
    setIbkrPositionsError(null);
    try {
      const result = await getIBKRPositions();
      console.log('[PLDashboard] IBKR Positions result:', result);
      if (result.success && result.positions) {
        setIbkrPositions(result.positions);
      } else {
        setIbkrPositions([]);
        setIbkrPositionsError(result.message || 'Failed to fetch positions.');
      }
    } catch (err: any) {
      setIbkrPositions([]);
      setIbkrPositionsError(err.message || 'Failed to fetch positions.');
    } finally {
      setIbkrPositionsLoading(false);
    }
  };

  const handleRequestOrders = async () => {
    setIbkrOrdersLoading(true);
    setIbkrOrdersError(null);
    try {
      const result = await getIBKROrders();
      console.log('[PLDashboard] IBKR Orders result:', result);
      if (result.success && result.orders) {
        setIbkrOrders(result.orders);
      } else {
        setIbkrOrders([]);
        setIbkrOrdersError(result.message || 'Failed to fetch orders.');
      }
    } catch (err: any) {
      setIbkrOrders([]);
      setIbkrOrdersError(err.message || 'Failed to fetch orders.');
    } finally {
      setIbkrOrdersLoading(false);
    }
  };

  const handleRequestExecutions = async () => {
    setIbkrExecutionsLoading(true);
    setIbkrExecutionsError(null);
    try {
      const result = await getIBKRExecutions();
      console.log('[PLDashboard] IBKR Executions result:', result);
      if (result.success && result.executions) {
        setIbkrExecutions(result.executions);
      } else {
        setIbkrExecutions([]);
        setIbkrExecutionsError(result.message || 'Failed to fetch executions.');
      }
    } catch (err: any) {
      setIbkrExecutions([]);
      setIbkrExecutionsError(err.message || 'Failed to fetch executions.');
    } finally {
      setIbkrExecutionsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Welcome, {userName}!
      </h1>

      {/* IBKR Connection Test Section - Always visible */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">IBKR Connection Test</h2>
        <p className="text-sm text-gray-600 mb-2">Status: {ibkrConnectionStatus}</p>
        {ibkrError && <p className="text-sm text-red-600 mb-2">Error: {ibkrError}</p>}
        <div className="flex gap-2 flex-wrap">
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleConnectIBKR} 
            disabled={isIBKRConnecting || ibkrConnectionStatus.startsWith('Connection attempt successful')}
          >
            {isIBKRConnecting ? 'Connecting...' : 'Connect to IBKR'}
          </button>
          <button 
            className="px-4 py-2 border border-red-600 text-red-600 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleDisconnectIBKR}
            disabled={ibkrConnectionStatus === 'Disconnected' || isIBKRConnecting}
          >
            Disconnect from IBKR
          </button>
          <button
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleRequestAccountSummary}
            disabled={ibkrConnectionStatus.toLowerCase() !== 'connected'}
          >
            Request Account Summary
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Ensure your IBKR Gateway/TWS is running and configured for API access.
        </p>
      </div>

      {/* IBKR Account Summary Section - always visible */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">IBKR Account Summary</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left border-b border-gray-300 pb-2">Tag</th>
              <th className="text-left border-b border-gray-300 pb-2">Value</th>
              <th className="text-left border-b border-gray-300 pb-2">Currency</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(ibkrAccountSummaryMap).length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center text-gray-500 py-4">
                  No account summary data received yet.
                </td>
              </tr>
            ) : (
              Object.entries(ibkrAccountSummaryMap).map(([tag, { value, currency }]) => (
                <tr key={tag}>
                  <td className="py-1">{tag}</td>
                  <td className="py-1">{value}</td>
                  <td className="py-1">{currency}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* IBKR Positions Section */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">IBKR Positions</h2>
        <button
          className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          onClick={handleRequestPositions}
          disabled={ibkrConnectionStatus.toLowerCase() !== 'connected' || ibkrPositionsLoading}
        >
          {ibkrPositionsLoading ? 'Loading...' : 'Request Positions'}
        </button>
        {ibkrPositionsError && (
          <p className="text-red-600 text-sm mb-2">{ibkrPositionsError}</p>
        )}
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left border-b border-gray-300 pb-2">Symbol</th>
              <th className="text-left border-b border-gray-300 pb-2">Quantity</th>
              <th className="text-left border-b border-gray-300 pb-2">Avg Price</th>
              <th className="text-left border-b border-gray-300 pb-2">Account</th>
            </tr>
          </thead>
          <tbody>
            {ibkrPositions.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-gray-500 py-4">
                  No positions to display.
                </td>
              </tr>
            ) : (
              ibkrPositions.map((pos, idx) => (
                <tr key={idx}>
                  <td className="py-1">{pos.contract?.symbol || '-'}</td>
                  <td className="py-1">{pos.pos}</td>
                  <td className="py-1">{pos.avgCost}</td>
                  <td className="py-1">{pos.account}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* IBKR Orders Section */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">IBKR Open Orders</h2>
        <button
          className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          onClick={handleRequestOrders}
          disabled={ibkrConnectionStatus.toLowerCase() !== 'connected' || ibkrOrdersLoading}
        >
          {ibkrOrdersLoading ? 'Loading...' : 'Request Orders'}
        </button>
        {ibkrOrdersError && (
          <p className="text-red-600 text-sm mb-2">{ibkrOrdersError}</p>
        )}
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left border-b border-gray-300 pb-2">Order ID</th>
              <th className="text-left border-b border-gray-300 pb-2">Symbol</th>
              <th className="text-left border-b border-gray-300 pb-2">Action</th>
              <th className="text-left border-b border-gray-300 pb-2">Quantity</th>
              <th className="text-left border-b border-gray-300 pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {ibkrOrders.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-500 py-4">
                  No open orders to display.
                </td>
              </tr>
            ) : (
              ibkrOrders.map((order, idx) => (
                <tr key={idx}>
                  <td className="py-1">{order.orderId}</td>
                  <td className="py-1">{order.contract?.symbol || '-'}</td>
                  <td className="py-1">{order.order?.action || '-'}</td>
                  <td className="py-1">{order.order?.totalQuantity || '-'}</td>
                  <td className="py-1">{order.orderState?.status || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* IBKR Executions Section */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">IBKR Order History</h2>
        <button
          className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          onClick={handleRequestExecutions}
          disabled={ibkrConnectionStatus.toLowerCase() !== 'connected' || ibkrExecutionsLoading}
        >
          {ibkrExecutionsLoading ? 'Loading...' : 'Request Order History'}
        </button>
        {ibkrExecutionsError && (
          <p className="text-red-600 text-sm mb-2">{ibkrExecutionsError}</p>
        )}
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left border-b border-gray-300 pb-2">Exec ID</th>
              <th className="text-left border-b border-gray-300 pb-2">Symbol</th>
              <th className="text-left border-b border-gray-300 pb-2">Action</th>
              <th className="text-left border-b border-gray-300 pb-2">Quantity</th>
              <th className="text-left border-b border-gray-300 pb-2">Price</th>
              <th className="text-left border-b border-gray-300 pb-2">Time</th>
            </tr>
          </thead>
          <tbody>
            {ibkrExecutions.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-gray-500 py-4">
                  No executions to display.
                </td>
              </tr>
            ) : (
              ibkrExecutions.map((exec, idx) => (
                <tr key={idx}>
                  <td className="py-1">{exec.execution?.execId || '-'}</td>
                  <td className="py-1">{exec.contract?.symbol || '-'}</td>
                  <td className="py-1">{exec.execution?.side || '-'}</td>
                  <td className="py-1">{exec.execution?.shares || '-'}</td>
                  <td className="py-1">{exec.execution?.price || '-'}</td>
                  <td className="py-1">{exec.execution?.time || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Conditional rendering for chart and account value */}
      {isLoading && (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {!isLoading && error && (
        <div className="text-center p-8 mb-6">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Oops! Something went wrong loading P&L data.
          </h2>
          <p className="text-gray-600">{error}</p>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {chartData.datasets.length > 0 && chartData.labels && chartData.labels.length > 0 ? (
            <>
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6 max-w-sm">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Account Value</h3>
                <p className={`text-2xl font-bold ${accountValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {fmtUsd(accountValue)}
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  P&L Over Time
                </h3>
                <div className="h-96 relative">
                  <Line
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        x: { 
                          title: { display: true, text: 'Date' },
                          grid: { display: false }
                        },
                        y: { 
                          title: { display: true, text: 'P&L (USD)' },
                          grid: { color: '#e5e7eb' }
                        },
                      },
                      plugins: { 
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: (context: TooltipItem<'line'>) => 
                              `P&L: ${fmtUsd(context.parsed.y)}`
                          }
                        }
                      },
                    }}
                  />
                </div>
              </div>

              {/* --- Round-Trip Metrics Section --- */}
              {roundTripMetrics && (
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Round-Trip Analytics</h2>
                  <ul className="space-y-1 mb-4">
                    <li>Total P&L: {fmtUsd(roundTripMetrics.totalPL)}</li>
                    <li>Win Rate: {(roundTripMetrics.winRate * 100).toFixed(1)}%</li>
                    <li>Closed Trades: {roundTripMetrics.closedTrades}</li>
                    <li>Open Trades: {roundTripMetrics.openTrades}</li>
                  </ul>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Round Trips</h3>
                  <div className="max-h-72 overflow-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className="text-left border-b border-gray-300 pb-2">Symbol</th>
                          <th className="text-left border-b border-gray-300 pb-2">Open Date</th>
                          <th className="text-left border-b border-gray-300 pb-2">Close Date</th>
                          <th className="text-left border-b border-gray-300 pb-2">P&L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roundTripMetrics.roundTrips.map((rt: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-1">{rt.open.symbol}</td>
                            <td className="py-1">{rt.open.tradeDate}</td>
                            <td className="py-1">{rt.close.tradeDate}</td>
                            <td className={`py-1 ${rt.pl > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {fmtUsd(rt.pl)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center p-8 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">No P&L data to display yet.</h2>
              <p className="text-gray-600">Please import a CSV file with trade data.</p> 
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PLDashboard; 
 
 
 