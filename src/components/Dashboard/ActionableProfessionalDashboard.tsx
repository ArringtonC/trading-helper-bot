import React, { useState, useEffect } from 'react';
import { SP500PriceData, MarketNewsData } from '../../services/DatabaseService';
import { EnhancedNewsEvent } from '../../services/AINewsAnalysisService';
import { 
  EnhancedTradingSignalService, 
  EnhancedTradingSignal, 
  ActiveTrigger, 
  MarketConditions 
} from '../../services/EnhancedTradingSignalService';
import ProfessionalChart from './ProfessionalChart';

interface ActionableProfessionalDashboardProps {
  priceData: SP500PriceData[];
  newsData: MarketNewsData[];
  enhancedNewsData: EnhancedNewsEvent[];
  onExit?: () => void;
}

const ActionableProfessionalDashboard: React.FC<ActionableProfessionalDashboardProps> = ({
  priceData,
  newsData,
  enhancedNewsData,
  onExit
}) => {
  const [tradingService] = useState(() => new EnhancedTradingSignalService());
  const [tradingSignal, setTradingSignal] = useState<EnhancedTradingSignal | null>(null);
  const [activeTriggers, setActiveTriggers] = useState<ActiveTrigger[]>([]);
  const [marketConditions, setMarketConditions] = useState<MarketConditions | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (priceData.length > 0) {
      // Generate enhanced trading signal
      const signal = tradingService.generateTradingSignal(priceData, newsData, enhancedNewsData);
      setTradingSignal(signal);

      // Analyze market conditions
      const conditions = tradingService.analyzeMarketConditions(priceData);
      setMarketConditions(conditions);

      // Generate active triggers
      const triggers = tradingService.generateActiveTriggers(conditions, enhancedNewsData);
      setActiveTriggers(triggers);
    }
  }, [priceData, newsData, enhancedNewsData, tradingService]);

  const refreshData = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      if (priceData.length > 0) {
        const signal = tradingService.generateTradingSignal(priceData, newsData, enhancedNewsData);
        setTradingSignal(signal);
        
        const conditions = tradingService.analyzeMarketConditions(priceData);
        setMarketConditions(conditions);
        
        const triggers = tradingService.generateActiveTriggers(conditions, enhancedNewsData);
        setActiveTriggers(triggers);
      }
      setRefreshing(false);
    }, 1000);
  };

  if (!tradingSignal || !marketConditions) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading Professional Trading Dashboard...</p>
        </div>
      </div>
    );
  }

  const currentPrice = priceData[priceData.length - 1]?.close || 0;
  const successRate = tradingService.getSuccessRate();
  const tradingHistory = tradingService.getTradingHistory();

  // Color coding for signals
  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY': return 'text-green-400';
      case 'ADD': return 'text-green-300';
      case 'HOLD': return 'text-yellow-400';
      case 'REDUCE': return 'text-orange-400';
      case 'SELL': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-400';
      case 'MEDIUM': return 'text-yellow-400';
      case 'HIGH': return 'text-orange-400';
      case 'EXTREME': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
      {/* Professional Header */}
      <div className="bg-black border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-bold text-orange-400">📊 PROFESSIONAL TRADING TERMINAL</h1>
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-green-400">SPX {currentPrice.toFixed(2)}</span>
              <span className={getRiskColor(marketConditions.riskLevel)}>
                {marketConditions.drawdownFromHigh.toFixed(1)}% from ATH
              </span>
              <span className="text-blue-400">VIX: {marketConditions.vixEquivalent.toFixed(1)}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm disabled:opacity-50"
            >
              {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
            </button>
            {onExit && (
              <button
                onClick={onExit}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm"
              >
                ← Exit Terminal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - Chart & Analysis */}
        <div className="flex-1 p-4 space-y-4">
          {/* Chart Section */}
          <div className="bg-black rounded border border-gray-700 h-96">
            <div className="p-3 border-b border-gray-700">
              <h3 className="text-sm font-semibold text-orange-400">S&P 500 PRICE CHART</h3>
            </div>
            <div className="p-4">
              <ProfessionalChart 
                priceData={priceData} 
                width={800} 
                height={320}
                theme="professional"
              />
            </div>
          </div>

          {/* Key Levels & Technical Analysis */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 rounded border border-gray-700 p-4">
              <h4 className="text-sm font-semibold text-orange-400 mb-3">KEY LEVELS</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Current:</span>
                  <span className="text-white font-mono">{currentPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">200-DMA Support:</span>
                  <span className="text-green-400 font-mono">{marketConditions.support200DMA.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Fibonacci Support:</span>
                  <span className="text-green-400 font-mono">{marketConditions.fibonacciSupport.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Stop Loss:</span>
                  <span className="text-red-400 font-mono">{tradingSignal.stopLoss.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Target:</span>
                  <span className="text-blue-400 font-mono">{tradingSignal.target.toFixed(0)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded border border-gray-700 p-4">
              <h4 className="text-sm font-semibold text-orange-400 mb-3">RISK METRICS</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Volatility:</span>
                  <span className={getRiskColor(marketConditions.volatilityLevel)}>
                    {marketConditions.volatilityLevel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Risk Level:</span>
                  <span className={getRiskColor(marketConditions.riskLevel)}>
                    {marketConditions.riskLevel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">VIX Equivalent:</span>
                  <span className="text-white font-mono">{marketConditions.vixEquivalent.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Trend:</span>
                  <span className={
                    marketConditions.trendDirection === 'BULLISH' ? 'text-green-400' :
                    marketConditions.trendDirection === 'BEARISH' ? 'text-red-400' : 'text-yellow-400'
                  }>
                    {marketConditions.trendDirection}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Position Size:</span>
                  <span className="text-white font-mono">{tradingSignal.positionSize}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Signals & Triggers */}
        <div className="w-96 p-4 space-y-4 border-l border-gray-700">
          {/* Trading Signal */}
          <div className="bg-black rounded border border-gray-700 p-4">
            <h4 className="text-sm font-semibold text-orange-400 mb-3">TRADING SIGNAL</h4>
            <div className="space-y-3">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getSignalColor(tradingSignal.signal)} mb-1`}>
                  {tradingSignal.signal}
                </div>
                <div className="text-sm text-gray-400">
                  Confidence: {tradingSignal.confidence}%
                </div>
              </div>
              <div className="border-t border-gray-700 pt-3">
                <p className="text-sm text-gray-300 mb-2">{tradingSignal.reasoning}</p>
                <div className="text-xs text-gray-500">
                  Rule: {tradingSignal.ruleTriggered} | {tradingSignal.timeframe}
                </div>
              </div>
            </div>
          </div>

          {/* Active Triggers */}
          <div className="bg-gray-800 rounded border border-gray-700 p-4">
            <h4 className="text-sm font-semibold text-orange-400 mb-3">
              ACTIVE TRIGGERS ({activeTriggers.length})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {activeTriggers.length === 0 ? (
                <p className="text-xs text-gray-500">No active triggers</p>
              ) : (
                activeTriggers.map((trigger) => (
                  <div 
                    key={trigger.id} 
                    className={`p-2 rounded border ${
                      trigger.actionRequired ? 'border-red-500 bg-red-900/20' : 'border-gray-600 bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-white">{trigger.title}</span>
                      <span className="text-xs text-gray-400">{trigger.confidence}%</span>
                    </div>
                    <p className="text-xs text-gray-300">{trigger.description}</p>
                    <div className="text-xs text-gray-500 mt-1">{trigger.timestamp}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-gray-800 rounded border border-gray-700 p-4">
            <h4 className="text-sm font-semibold text-orange-400 mb-3">PERFORMANCE</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Trading History:</span>
                <span className="text-white">{tradingHistory.length} actions</span>
              </div>
              {successRate !== null ? (
                <div className="flex justify-between">
                  <span className="text-gray-400">Success Rate:</span>
                  <span className="text-green-400">{successRate.toFixed(1)}%</span>
                </div>
              ) : (
                <div className="text-xs text-gray-500">
                  Success rate hidden until ≥20 trades completed
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Drawdown:</span>
                <span className="text-red-400">{marketConditions.drawdownFromHigh.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Recent News Summary */}
          <div className="bg-gray-800 rounded border border-gray-700 p-4">
            <h4 className="text-sm font-semibold text-orange-400 mb-3">
              AI NEWS ANALYSIS ({enhancedNewsData.length})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {enhancedNewsData.slice(0, 5).map((news, index) => (
                <div key={index} className="p-2 bg-gray-700/50 rounded">
                  <div className="text-xs text-white mb-1 line-clamp-2">
                    {news.title}
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={
                      news.aiAnalysis?.impactLevel === 'HIGH' ? 'text-red-400' :
                      news.aiAnalysis?.impactLevel === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400'
                    }>
                      {news.aiAnalysis?.impactLevel} Impact
                    </span>
                    <span className="text-gray-400">
                      {news.aiAnalysis?.confidence}% conf
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data Validation Panel */}
          <div className="bg-gray-800 rounded border border-gray-700 p-4">
            <h4 className="text-sm font-semibold text-orange-400 mb-3">DATA HEALTH</h4>
            <div className="space-y-1 text-xs">
              <div className={`flex justify-between ${priceData.length > 0 ? 'text-green-400' : 'text-red-400'}`}>
                <span>Price Data:</span>
                <span>{priceData.length} records</span>
              </div>
              <div className={`flex justify-between ${marketConditions.vixEquivalent >= 9 ? 'text-green-400' : 'text-red-400'}`}>
                <span>VIX Range:</span>
                <span>{marketConditions.vixEquivalent >= 9 ? 'VALID' : 'INVALID'}</span>
              </div>
              <div className={`flex justify-between ${enhancedNewsData.length > 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                <span>AI Analysis:</span>
                <span>{enhancedNewsData.length > 0 ? 'ACTIVE' : 'LIMITED'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionableProfessionalDashboard; 