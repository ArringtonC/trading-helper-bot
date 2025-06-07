import { useState, useCallback } from 'react';
import { predictHMMRegimes } from '../services/HMMService';

export const useMLRecommendations = () => {
  const [mlRecommendations, setMlRecommendations] = useState<any[] | null>(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState<string | null>(null);

  // Helper to extract a date string from a trade object
  const getTradeDate = useCallback((trade: any): string => {
    const d = trade.tradeDate || trade.openDate || trade.executionDate;
    if (!d) return '';
    if (typeof d === 'string') return d.split('T')[0];
    if (d instanceof Date) return d.toISOString().split('T')[0];
    return '';
  }, []);

  const getMLRecommendations = useCallback(async (parseResult: any) => {
    if (!parseResult) return;
    
    setMlLoading(true);
    setMlError(null);
    setMlRecommendations(null);
    
    // Use optionTrades if present, else trades
    const tradesArr = parseResult.optionTrades?.length ? parseResult.optionTrades : parseResult.trades;
    if (!tradesArr?.length) {
      setMlError('No trades available for ML recommendation.');
      setMlLoading(false);
      return;
    }
    
    const symbol = tradesArr[0].symbol || 'SPY';
    const startDate = getTradeDate(tradesArr[0]);
    const endDate = getTradeDate(tradesArr[tradesArr.length - 1]);
    
    // Debug log for ML params
    console.log('ML DEBUG:', {
      tradesArr,
      first: tradesArr[0],
      last: tradesArr[tradesArr.length - 1]
    });
    
    if (!symbol || !startDate || !endDate) {
      setMlError('Missing required parameters for ML backend (symbol, startDate, endDate).');
      setMlLoading(false);
      return;
    }
    
    try {
      const response = await predictHMMRegimes({
        symbol,
        startDate,
        endDate,
        trade_data: tradesArr,
        return_probabilities: true
      });
      
      if (response && Array.isArray((response as any).recommendations)) {
        setMlRecommendations((response as any).recommendations);
      } else {
        setMlRecommendations([]);
        setMlError('No recommendations returned from ML backend.');
      }
    } catch (err: any) {
      setMlError(err.message || 'Failed to get ML recommendations');
    } finally {
      setMlLoading(false);
    }
  }, [getTradeDate]);

  return {
    mlRecommendations,
    mlLoading,
    mlError,
    getMLRecommendations
  };
}; 
 
 
 