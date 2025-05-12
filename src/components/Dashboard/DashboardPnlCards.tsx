import React, { useState, useEffect, useCallback } from 'react';
import MetricCard from './MetricCard';
import { FetchedTrade } from '../../pages/OptionsDB'; // Assuming FetchedTrade is exported from OptionsDB or moved to types
import {
  initDatabase,
  getTrades as fetchTradesFromDB,
} from '../../services/DatabaseService';
import { useWinRate } from '../../context/WinRateContext'; // Assuming path is correct
import { useToast } from '../ui/use-toast'; // Assuming path is correct

const DashboardPnlCards: React.FC = () => {
  const [trades, setTrades] = useState<FetchedTrade[]>([]);
  const [totalRealizedPL, setTotalRealizedPL] = useState<number>(0);
  const [calculatedWinRate, setCalculatedWinRate] = useState<number>(0);
  const [openTradesCount, setOpenTradesCount] = useState<number>(0);
  const [closedTradesCount, setClosedTradesCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { setWinRate } = useWinRate();
  const { toast } = useToast();

  const calculateMetrics = useCallback((currentTrades: FetchedTrade[]) => {
    let realizedPLSum = 0;
    let winningClosedTrades = 0;
    let losingClosedTrades = 0;
    let localClosedTradeCount = 0;
    let localOpenTradesCount = 0;

    currentTrades.forEach(t => {
      if (t.openCloseIndicator === 'C' && typeof t.netAmount === 'number') {
        realizedPLSum += t.netAmount;
        localClosedTradeCount++;
        if (t.netAmount > 0) winningClosedTrades++;
        else if (t.netAmount < 0) losingClosedTrades++;
      } else if (t.openCloseIndicator === 'O' || t.openCloseIndicator === 'N/A' || t.openCloseIndicator === undefined) {
        localOpenTradesCount++;
      }
    });

    setTotalRealizedPL(realizedPLSum);
    setOpenTradesCount(localOpenTradesCount);
    setClosedTradesCount(localClosedTradeCount);

    if (localClosedTradeCount > 0) {
      const wr = (winningClosedTrades / localClosedTradeCount) * 100;
      setCalculatedWinRate(wr);
      setWinRate(wr); 
    } else {
      setCalculatedWinRate(0);
      setWinRate(0);
    }
  }, [setWinRate]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await initDatabase(); // Ensure DB is initialized
        const fetchedTrades = await fetchTradesFromDB();
        const tradesData = fetchedTrades || [];
        setTrades(tradesData);
        calculateMetrics(tradesData);
      } catch (error: any) {
        console.error("Error fetching trades for PnL cards:", error);
        toast({ title: "Error Loading P&L Data", description: error.message || "Could not load trade data for P&L cards.", variant: "destructive" });
      }
      setIsLoading(false);
    };
    loadData();
  }, [calculateMetrics, toast]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
      <MetricCard 
        title="Total Realized P&L"
        value={isLoading ? '' : totalRealizedPL}
        unit="$"
        valueColor={totalRealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}
        isLoading={isLoading}
      />
      <MetricCard 
        title="Win Rate (Closed)"
        value={isLoading ? '' : calculatedWinRate.toFixed(1)}
        unit="%"
        isLoading={isLoading}
      />
      <MetricCard 
        title="Total Trades Loaded"
        value={isLoading ? '' : trades.length}
        isLoading={isLoading}
      />
      <MetricCard 
        title="Open Trades"
        value={isLoading ? '' : openTradesCount}
        isLoading={isLoading}
      />
      <MetricCard 
        title="Closed Trades"
        value={isLoading ? '' : closedTradesCount}
        isLoading={isLoading}
      />
       <MetricCard 
        title="Unrealized P&L"
        value={isLoading ? '' : "N/A"} // Placeholder
        tooltip="Live market data required for Unrealized P&L"
        isLoading={isLoading}
      />
    </div>
  );
};

export default DashboardPnlCards; 