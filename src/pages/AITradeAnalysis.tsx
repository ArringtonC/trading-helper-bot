import React, { useState, useEffect } from 'react';
import { getTrades, initDatabase } from '../services/DatabaseService';
import { OptionsService } from '../services/OptionsService';
import { useWinRate } from '../context/WinRateContext';

const AITradeAnalysis = () => {
  const [analysis, setAnalysis] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { winRate } = useWinRate();

  useEffect(() => {
    // Load and analyze trades
    const loadAndAnalyzeTrades = async () => {
      try {
        setIsLoading(true);
        await initDatabase();
        const tradesData = await getTrades();
        if (tradesData.length > 0) {
          const analysisText = generateAnalysis(tradesData, winRate);
          setAnalysis(analysisText);
        } else {
          setAnalysis("No trade data available for analysis.");
        }
      } catch (error) {
        console.error("Error loading trades:", error);
        setAnalysis("Error loading trade data. Please check your database connection.");
      } finally {
        setIsLoading(false);
      }
    };
    loadAndAnalyzeTrades();
  }, [winRate]);

  const generateAnalysis = (tradesData: any[], winRateOverride: number | null = null): string => {
    const closedTrades = tradesData.filter(t => t.isClose);
    const winningTrades = closedTrades.filter(t => Number(t.tradePL) > 0);
    // Use winRate from context if available
    const winRateToUse = winRateOverride !== null ? winRateOverride : (closedTrades.length ? (winningTrades.length / closedTrades.length) * 100 : 0);
    // Calculate total P&L
    const totalPL = tradesData.reduce((sum: number, t: any) => sum + Number(t.tradePL), 0);
    // Generate analysis text
    let analysisText = `AI Trade Analysis (${tradesData.length} trades)\n\n`;
    analysisText += `Overall Performance: ${totalPL >= 0 ? "Profitable" : "Unprofitable"} with a total P&L of $${totalPL.toFixed(2)}. `;
    analysisText += `Win rate (closed trades): ${winRateToUse.toFixed(1)}%.\n\n`;
    // Symbol performance analysis
    const symbolPerformance: { [symbol: string]: { trades: number; pl: number } } = {};
    tradesData.forEach((trade: any) => {
      if (!symbolPerformance[trade.symbol]) {
        symbolPerformance[trade.symbol] = {
          trades: 0,
          pl: 0
        };
      }
      symbolPerformance[trade.symbol].trades++;
      symbolPerformance[trade.symbol].pl += Number(trade.tradePL);
    });
    // Symbol breakdown
    analysisText += `Symbol Breakdown: `;
    Object.entries(symbolPerformance).forEach(([symbol, data]) => {
      analysisText += `${symbol}: $${data.pl.toFixed(2)} (${data.trades} trades), `;
    });
    analysisText = analysisText.slice(0, -2) + ".\n\n";
    // Find best and worst performers
    let bestSymbol = '';
    let worstSymbol = '';
    let bestPL = -Infinity;
    let worstPL = Infinity;
    Object.entries(symbolPerformance).forEach(([symbol, data]) => {
      if (data.pl > bestPL) {
        bestPL = data.pl;
        bestSymbol = symbol;
      }
      if (data.pl < worstPL) {
        worstPL = data.pl;
        worstSymbol = symbol;
      }
    });
    if (bestSymbol) {
      analysisText += `Best performer: ${bestSymbol} with +$${bestPL.toFixed(2)}. `;
    }
    if (worstSymbol) {
      analysisText += `Worst performer: ${worstSymbol} with $${worstPL.toFixed(2)}.\n\n`;
    }
    // Recommendations based on win rate
    analysisText += "Recommendations:\n";
    if (winRateToUse >= 70) {
      analysisText += "• You have a strong win rate. Maintain your discipline while looking for opportunities to scale.\n";
    } else if (winRateToUse >= 50) {
      analysisText += "• Your win rate is good. Focus on increasing your position sizes on high-conviction trades.\n";
    } else {
      analysisText += "• Consider refining your entry criteria or improving your risk management.\n";
    }
    if (bestSymbol) {
      analysisText += `• ${bestSymbol} is your strongest performer. Consider focusing more on your strategy for this instrument.\n`;
    }
    if (worstSymbol && worstPL < 0) {
      analysisText += `• Review your approach to ${worstSymbol} which has been underperforming.\n`;
    }
    return analysisText;
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-3">AI Trading Insights</h2>
      
      {isLoading ? (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2 w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
        </div>
      ) : (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <pre className="whitespace-pre-wrap text-sm font-mono">{analysis}</pre>
        </div>
      )}
    </div>
  );
};

export default AITradeAnalysis; 