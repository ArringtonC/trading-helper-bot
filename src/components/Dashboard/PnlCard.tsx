import React, { useState, useEffect, useCallback } from 'react';
// Import the service function and the correct type
import { getOverallPnlSummary, OverallPnlSummary } from '../../services/DatabaseService';
import eventEmitter from '../../utils/eventEmitter'; // Import event emitter

// Remove the old placeholder interface
// interface PnlData { ... }

// Interface for component props (might not need data prop anymore)
interface PnlCardProps {
  // We might remove the data prop if always fetching internally
}

// Formatting helpers remain the same
const formatCurrency = (value: number): string => {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const PnlCard: React.FC<PnlCardProps> = () => {
  const [pnlSummary, setPnlSummary] = useState<OverallPnlSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Wrap data fetching logic in useCallback
  const fetchData = useCallback(async () => {
    console.log('[DEBUG PnlCard] Fetching P&L summary...'); // Add log
    setIsLoading(true);
    setError(null);
    try {
      const summary = await getOverallPnlSummary();
      console.log('[DEBUG PnlCard] Received summary:', summary); // Add log
      setPnlSummary(summary);
    } catch (err) {
      console.error("Error fetching P&L summary:", err);
      setError('Failed to load P&L data.');
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array for useCallback

  // Effect for initial fetch on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Effect for listening to data updates
  useEffect(() => {
    const handleDataUpdate = () => {
      console.log('[DEBUG PnlCard] data-updated event received, refetching P&L...');
      fetchData();
    };

    // Corrected to use 'on' and 'off'
    const unsubscribe = eventEmitter.on('data-updated', handleDataUpdate);

    // Cleanup listener on component unmount
    return () => {
      // Use the returned unsubscribe function directly or call eventEmitter.off
      unsubscribe(); // Or eventEmitter.off('data-updated', handleDataUpdate);
    };
  }, [fetchData]);

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 md:p-6 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 md:p-6">
        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Error</h3>
        <p className="text-red-500 dark:text-red-300">{error}</p>
      </div>
    );
  }

  // Empty/No data state (after loading)
  if (!pnlSummary) {
     return (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 md:p-6">
         <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Profit & Loss</h3>
         <p className="text-gray-500 dark:text-gray-400">No P&L data available.</p>
       </div>
     );
  }
  
  // Determine positivity for styling
  const isDailyPositive = pnlSummary && pnlSummary.lastDayPnl >= 0;
  const isTotalPositive = pnlSummary && pnlSummary.totalPnl >= 0;

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 md:p-6">
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
        Profit & Loss {pnlSummary?.lastDayDate ? `(as of ${pnlSummary.lastDayDate})` : ''}
      </h3>
      
      <div className="space-y-3">
        {/* Daily P&L (Last Recorded Day) */}
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Last Recorded Day P&L</p>
          <div className="flex items-baseline space-x-2">
            <p className={`text-2xl font-bold ${isDailyPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {pnlSummary ? formatCurrency(pnlSummary.lastDayPnl) : '...'}
            </p>
            {/* Percentage display can be added back when calculation is implemented */}
            {/* <span className={`text-sm font-medium ${isDailyPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ({isDailyPositive ? '+' : ''}{formatPercent(pnlSummary.lastDayPnlPercent)})
            </span> */}
          </div>
        </div>

        {/* Total P&L */}
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Realized P&L</p>
           <div className="flex items-baseline space-x-2">
            <p className={`text-xl font-semibold ${isTotalPositive ? 'text-gray-700 dark:text-gray-300' : 'text-red-700 dark:text-red-500'}`}>
              {pnlSummary ? formatCurrency(pnlSummary.totalPnl) : '...'}
            </p>
            {/* Percentage display can be added back when calculation is implemented */}
             {/* <span className={`text-xs font-medium ${isTotalPositive ? 'text-gray-500 dark:text-gray-400' : 'text-red-600 dark:text-red-400'}`}>
              ({isTotalPositive ? '+' : ''}{formatPercent(pnlSummary.totalPnlPercent)})
            </span> */}
          </div>
        </div>
      </div>

      {/* TODO: Add Detailed View Section */}
      {/* TODO: Add Toggle Button/Link */}

    </div>
  );
};

export default PnlCard; 