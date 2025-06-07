import React, { useState, useEffect } from 'react';

interface Trade {
  id: string;
  symbol: string;
  action: 'buy' | 'sell';
  price: number;
  quantity: number;
  timestamp: Date;
  emotionalState: string;
  profit?: number;
}

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

const EMOTIONS = [
  'Confident',
  'Anxious',
  'Greedy',
  'Fearful',
  'Neutral',
  'Excited',
  'Frustrated',
  'Calm'
];

const MOCK_SYMBOLS = ['AAPL', 'TSLA', 'SPY', 'QQQ', 'MSFT'];

export const PsychologicalTradingSimulator: React.FC = () => {
  const [balance, setBalance] = useState(10000);
  const [positions, setPositions] = useState<{[symbol: string]: number}>({});
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [quantity, setQuantity] = useState(1);
  const [emotionalState, setEmotionalState] = useState('Neutral');
  const [marketData, setMarketData] = useState<{[symbol: string]: MarketData}>({});
  const [showEmotionPrompt, setShowEmotionPrompt] = useState(false);
  const [pendingTrade, setPendingTrade] = useState<any>(null);

  // Generate mock market data
  useEffect(() => {
    const generateMarketData = () => {
      const data: {[symbol: string]: MarketData} = {};
      MOCK_SYMBOLS.forEach(symbol => {
        const basePrice = {
          'AAPL': 150,
          'TSLA': 200,
          'SPY': 400,
          'QQQ': 350,
          'MSFT': 300
        }[symbol] || 100;
        
        const change = (Math.random() - 0.5) * 10;
        const price = basePrice + change;
        
        data[symbol] = {
          symbol,
          price: Math.round(price * 100) / 100,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round((change / basePrice) * 10000) / 100
        };
      });
      setMarketData(data);
    };

    generateMarketData();
    const interval = setInterval(generateMarketData, 3000);
    return () => clearInterval(interval);
  }, []);

  const executeTrade = (action: 'buy' | 'sell') => {
    const currentPrice = marketData[selectedSymbol]?.price || 100;
    const totalCost = currentPrice * quantity;

    if (action === 'buy' && totalCost > balance) {
      alert('Insufficient balance!');
      return;
    }

    if (action === 'sell' && (positions[selectedSymbol] || 0) < quantity) {
      alert('Insufficient shares!');
      return;
    }

    // Show emotion prompt before executing trade
    setPendingTrade({ action, currentPrice, totalCost });
    setShowEmotionPrompt(true);
  };

  const confirmTrade = () => {
    if (!pendingTrade) return;

    const { action, currentPrice, totalCost } = pendingTrade;
    
    const trade: Trade = {
      id: Date.now().toString(),
      symbol: selectedSymbol,
      action,
      price: currentPrice,
      quantity,
      timestamp: new Date(),
      emotionalState
    };

    if (action === 'buy') {
      setBalance(prev => prev - totalCost);
      setPositions(prev => ({
        ...prev,
        [selectedSymbol]: (prev[selectedSymbol] || 0) + quantity
      }));
    } else {
      setBalance(prev => prev + totalCost);
      setPositions(prev => ({
        ...prev,
        [selectedSymbol]: (prev[selectedSymbol] || 0) - quantity
      }));
      
      // Calculate profit for sell trades
      const buyTrades = trades.filter(t => t.symbol === selectedSymbol && t.action === 'buy');
      if (buyTrades.length > 0) {
        const avgBuyPrice = buyTrades.reduce((sum, t) => sum + t.price, 0) / buyTrades.length;
        trade.profit = (currentPrice - avgBuyPrice) * quantity;
      }
    }

    setTrades(prev => [trade, ...prev]);
    setShowEmotionPrompt(false);
    setPendingTrade(null);
    setQuantity(1);
  };

  const getEmotionalPatterns = () => {
    const patterns: {[emotion: string]: {trades: number, avgProfit: number, winRate: number}} = {};
    
    EMOTIONS.forEach(emotion => {
      const emotionTrades = trades.filter(t => t.emotionalState === emotion && t.action === 'sell');
      const profits = emotionTrades.map(t => t.profit || 0);
      const wins = profits.filter(p => p > 0).length;
      
      patterns[emotion] = {
        trades: emotionTrades.length,
        avgProfit: profits.length > 0 ? profits.reduce((a, b) => a + b, 0) / profits.length : 0,
        winRate: emotionTrades.length > 0 ? (wins / emotionTrades.length) * 100 : 0
      };
    });
    
    return patterns;
  };

  const totalPortfolioValue = balance + Object.entries(positions).reduce((total, [symbol, qty]) => {
    const price = marketData[symbol]?.price || 0;
    return total + (price * qty);
  }, 0);

  const totalProfit = totalPortfolioValue - 10000;
  const patterns = getEmotionalPatterns();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🧠 Psychological Trading Simulator
        </h1>
        <p className="text-gray-600">
          Practice trading while tracking your emotional patterns and decision-making
        </p>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Cash Balance</h3>
          <p className="text-2xl font-bold text-green-600">${balance.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Portfolio Value</h3>
          <p className="text-2xl font-bold text-blue-600">${totalPortfolioValue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total P&L</h3>
          <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${totalProfit.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Trades</h3>
          <p className="text-2xl font-bold text-gray-900">{trades.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trading Interface */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Trading Interface</h2>
          
          {/* Market Data */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Market Data</h3>
            <div className="space-y-2">
              {MOCK_SYMBOLS.map(symbol => {
                const data = marketData[symbol];
                if (!data) return null;
                
                return (
                  <div 
                    key={symbol}
                    className={`flex justify-between items-center p-2 rounded cursor-pointer ${
                      selectedSymbol === symbol ? 'bg-blue-100' : 'bg-gray-50'
                    }`}
                    onClick={() => setSelectedSymbol(symbol)}
                  >
                    <span className="font-medium">{symbol}</span>
                    <div className="text-right">
                      <div className="font-medium">${data.price}</div>
                      <div className={`text-sm ${data.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.change >= 0 ? '+' : ''}{data.change} ({data.changePercent}%)
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trade Form */}
          <div className="border-t pt-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selected Symbol: {selectedSymbol}
              </label>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Price: ${marketData[selectedSymbol]?.price || 0}
              </label>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => executeTrade('buy')}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
              >
                Buy ${((marketData[selectedSymbol]?.price || 0) * quantity).toFixed(2)}
              </button>
              <button
                onClick={() => executeTrade('sell')}
                disabled={(positions[selectedSymbol] || 0) < quantity}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-400"
              >
                Sell {quantity} shares
              </button>
            </div>

            {/* Current Positions */}
            {Object.keys(positions).length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Positions</h4>
                {Object.entries(positions).map(([symbol, qty]) => (
                  qty > 0 && (
                    <div key={symbol} className="flex justify-between text-sm">
                      <span>{symbol}</span>
                      <span>{qty} shares</span>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Emotional Patterns Analysis */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Emotional Trading Patterns</h2>
          
          <div className="space-y-3">
            {Object.entries(patterns).map(([emotion, data]) => (
              <div key={emotion} className="border-b pb-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{emotion}</span>
                  <span className="text-sm text-gray-500">{data.trades} trades</span>
                </div>
                {data.trades > 0 && (
                  <div className="text-sm text-gray-600 mt-1">
                    <div>Avg Profit: ${data.avgProfit.toFixed(2)}</div>
                    <div>Win Rate: {data.winRate.toFixed(1)}%</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Recent Trades */}
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Recent Trades</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {trades.slice(0, 10).map(trade => (
                <div key={trade.id} className="text-sm border-b pb-2">
                  <div className="flex justify-between">
                    <span className={trade.action === 'buy' ? 'text-green-600' : 'text-red-600'}>
                      {trade.action.toUpperCase()} {trade.symbol}
                    </span>
                    <span>{trade.emotionalState}</span>
                  </div>
                  <div className="text-gray-500">
                    {trade.quantity} @ ${trade.price} 
                    {trade.profit !== undefined && (
                      <span className={trade.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {' '}(P&L: ${trade.profit.toFixed(2)})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Emotion Selection Modal */}
      {showEmotionPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">How are you feeling about this trade?</h3>
            <p className="text-gray-600 mb-4">
              Select your emotional state before executing this trade. This helps track patterns.
            </p>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              {EMOTIONS.map(emotion => (
                <button
                  key={emotion}
                  onClick={() => setEmotionalState(emotion)}
                  className={`p-2 text-sm rounded border ${
                    emotionalState === emotion 
                      ? 'bg-blue-100 border-blue-500' 
                      : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  {emotion}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowEmotionPrompt(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={confirmTrade}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md"
              >
                Execute Trade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PsychologicalTradingSimulator; 