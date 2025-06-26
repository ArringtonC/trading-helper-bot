import React, { useEffect, useState } from 'react';
import MetricCard from './MetricCard';
import { getAggregatePL, getTradeCounts, getClosedTrades } from '../../services/DatabaseService'; // Import getClosedTrades
// import { NormalizedTradeData } from '../../types/trade'; // Not directly needed here

const DashboardPnlCards: React.FC = () => {
  const [realizedPL, setRealizedPL] = useState<number | null>(null);
  const [winRate, setWinRate] = useState<number | null>(null);
  const [openTradesCount, setOpenTradesCount] = useState<number | null>(null);
  const [closedTradesCount, setClosedTradesCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch aggregate P&L from the database
        const aggregatePL = await getAggregatePL();
        setRealizedPL(aggregatePL.realizedPL);

        // Fetch trade counts
        const tradeCounts = await getTradeCounts();
        setOpenTradesCount(tradeCounts.open);
        setClosedTradesCount(tradeCounts.closed);

        // Fetch closed trades for win rate calculation
        const closedTrades = await getClosedTrades();
        if (closedTrades.length > 0) {
          const winningClosedTrades = closedTrades.filter(trade => trade.netAmount > 0).length;
          const calculatedWinRate = (winningClosedTrades / closedTrades.length) * 100;
          setWinRate(calculatedWinRate);
        } else {
          setWinRate(0); // Win rate is 0 if no closed trades
        }

      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array means this effect runs once after initial render

  // Mock data for Unrealized P&L for now
  const unrealizedPL = 0; // Placeholder

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <MetricCard
        title="Total Realized P&L"
        value={realizedPL !== null ? realizedPL.toFixed(2) : null}
        unit="$"
        isLoading={isLoading}
        // MetricCard now handles color based on value if numerical, no need for valueColor prop here
      />
      <MetricCard
        title="Win Rate"
        value={winRate !== null ? winRate.toFixed(1) : null}
        unit="%"
        isLoading={isLoading}
      />
      <MetricCard
        title="Open Trades"
        value={openTradesCount}
        isLoading={isLoading}
      />
      <MetricCard
        title="Closed Trades"
        value={closedTradesCount}
        isLoading={isLoading}
      />
      {/* Metric card for Unrealized P&L (using mock data for now) */}
       <MetricCard
        title="Total Unrealized P&L"
        value={unrealizedPL.toFixed(2)}
        unit="$"
        isLoading={isLoading} // Still show loading state while other data loads
        // TODO: Add color based on value
      />

      {error && <div className="text-red-500">{error}</div>} {/* Display error message */}
    </div>
  );
};

export default DashboardPnlCards; 