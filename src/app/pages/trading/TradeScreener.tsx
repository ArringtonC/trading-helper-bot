import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandButton from '../../../shared/components/ui/BrandButton';
import BrandCard from '../../../shared/components/ui/BrandCard';
import StatusBadge from '../../../shared/components/ui/StatusBadge';
import { rateLimitCheck } from '../../../shared/utils/rateLimiter';

// Types for the trade screener
interface MarketScanCriteria {
  symbols: string[];
  minPrice: number;
  maxPrice: number;
  minVolume: number;
  timeframe: '1m' | '5m' | '15m' | '1h' | '1d';
  indicators: string[];
  markets: string[];
}

interface TradingOpportunity {
  id: string;
  symbol: string;
  signal: 'BUY' | 'SELL' | 'WATCH';
  strength: number; // 1-10
  price: number;
  volume: number;
  indicators: {
    rsi: number;
    macd: number;
    moving_avg: number;
  };
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  strategy: string;
  confidence: number;
  lastUpdate: Date;
  reasoning: string[];
}

interface FilterCriteria {
  signalType: string[];
  riskLevel: string[];
  minStrength: number;
  minConfidence: number;
  strategies: string[];
}

const TradeScreener: React.FC = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [scanCriteria, setScanCriteria] = useState<MarketScanCriteria>({
    symbols: ['SPY', 'QQQ', 'AAPL', 'MSFT', 'TSLA'],
    minPrice: 10,
    maxPrice: 1000,
    minVolume: 100000,
    timeframe: '1h',
    indicators: ['RSI', 'MACD', 'SMA_20'],
    markets: ['stocks', 'options']
  });
  
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({
    signalType: ['BUY', 'SELL'],
    riskLevel: ['LOW', 'MEDIUM'],
    minStrength: 5,
    minConfidence: 60,
    strategies: ['momentum', 'reversal', 'breakout']
  });

  const [opportunities, setOpportunities] = useState<TradingOpportunity[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<TradingOpportunity | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<{symbol: string, message: string, timestamp: Date}[]>([]);

  // Simulated market data - In real implementation, this would connect to actual data feeds
  const generateMockOpportunities = (): TradingOpportunity[] => {
    const mockData: TradingOpportunity[] = [
      {
        id: '1',
        symbol: 'AAPL',
        signal: 'BUY',
        strength: 8,
        price: 185.50,
        volume: 2500000,
        indicators: { rsi: 35, macd: 0.5, moving_avg: 182.30 },
        risk: 'MEDIUM',
        strategy: 'momentum',
        confidence: 85,
        lastUpdate: new Date(),
        reasoning: ['RSI oversold', 'MACD bullish crossover', 'Strong volume surge']
      },
      {
        id: '2',
        symbol: 'TSLA',
        signal: 'SELL',
        strength: 7,
        price: 245.80,
        volume: 1800000,
        indicators: { rsi: 75, macd: -0.3, moving_avg: 248.90 },
        risk: 'HIGH',
        strategy: 'reversal',
        confidence: 78,
        lastUpdate: new Date(),
        reasoning: ['RSI overbought', 'Price below MA', 'Bearish divergence']
      },
      {
        id: '3',
        symbol: 'SPY',
        signal: 'WATCH',
        strength: 6,
        price: 485.20,
        volume: 5200000,
        indicators: { rsi: 50, macd: 0.1, moving_avg: 484.75 },
        risk: 'LOW',
        strategy: 'breakout',
        confidence: 65,
        lastUpdate: new Date(),
        reasoning: ['Consolidation pattern', 'Volume building', 'Key resistance level']
      },
      {
        id: '4',
        symbol: 'QQQ',
        signal: 'BUY',
        strength: 9,
        price: 398.75,
        volume: 3100000,
        indicators: { rsi: 40, macd: 0.8, moving_avg: 395.20 },
        risk: 'LOW',
        strategy: 'momentum',
        confidence: 92,
        lastUpdate: new Date(),
        reasoning: ['Strong momentum', 'Volume confirmation', 'Tech sector strength']
      }
    ];
    return mockData;
  };

  // Filter opportunities based on criteria
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(opp => {
      return (
        filterCriteria.signalType.includes(opp.signal) &&
        filterCriteria.riskLevel.includes(opp.risk) &&
        opp.strength >= filterCriteria.minStrength &&
        opp.confidence >= filterCriteria.minConfidence &&
        filterCriteria.strategies.includes(opp.strategy)
      );
    });
  }, [opportunities, filterCriteria]);

  // Scan for trading opportunities
  const runMarketScan = async () => {
    const rateLimitResult = rateLimitCheck('calculation');
    if (!rateLimitResult.allowed) {
      alert(rateLimitResult.reason);
      return;
    }

    setIsScanning(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newOpportunities = generateMockOpportunities();
      setOpportunities(newOpportunities);
      
      // Generate alerts for high-strength opportunities
      const highStrengthOpps = newOpportunities.filter(opp => opp.strength >= 8);
      const newAlerts = highStrengthOpps.map(opp => ({
        symbol: opp.symbol,
        message: `${opp.signal} signal detected with ${opp.strength}/10 strength`,
        timestamp: new Date()
      }));
      
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 10)); // Keep last 10 alerts
      
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setIsScanning(false);
    }
  };

  // Add/remove from watchlist
  const toggleWatchlist = (symbol: string) => {
    setWatchlist(prev => 
      prev.includes(symbol)
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  // Get signal color
  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY': return 'text-green-600 bg-green-50';
      case 'SELL': return 'text-red-600 bg-red-50';
      case 'WATCH': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Get risk color
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'HIGH': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Auto-refresh opportunities every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isScanning) {
        runMarketScan();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isScanning]);

  // Initial scan on component mount
  useEffect(() => {
    runMarketScan();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trade Finder & Opportunity Screener</h1>
          <p className="text-gray-600 mt-1">
            Discover and analyze trading opportunities with advanced market scanning
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <StatusBadge 
            status={isScanning ? 'warning' : 'success'}
          >
            {isScanning ? 'Scanning...' : 'Ready'}
          </StatusBadge>
          <BrandButton
            variant="primary"
            onClick={runMarketScan}
            disabled={isScanning}
            className="flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>{isScanning ? 'Scanning Markets...' : 'Run Market Scan'}</span>
          </BrandButton>
        </div>
      </div>

      {/* Quick Actions */}
      <BrandCard variant="elevated" className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions:</h3>
          <BrandButton
            variant="secondary"
            size="sm"
            onClick={() => navigate('/rule-engine-demo')}
          >
            Configure Rules
          </BrandButton>
          <BrandButton
            variant="secondary"
            size="sm"
            onClick={() => navigate('/weekend-gap-risk')}
          >
            Risk Analysis
          </BrandButton>
          <BrandButton
            variant="secondary"
            size="sm"
            onClick={() => navigate('/volatility-demo')}
          >
            Volatility Dashboard
          </BrandButton>
        </div>
      </BrandCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scan Configuration */}
        <div className="lg:col-span-1">
          <BrandCard variant="bordered" className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Scan Configuration</h3>
            
            {/* Symbols */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Symbols to Scan
              </label>
              <div className="flex flex-wrap gap-2">
                {scanCriteria.symbols.map(symbol => (
                  <span key={symbol} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    {symbol}
                  </span>
                ))}
              </div>
            </div>

            {/* Timeframe */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeframe
              </label>
              <select 
                value={scanCriteria.timeframe}
                onChange={(e) => setScanCriteria(prev => ({
                  ...prev, 
                  timeframe: e.target.value as any
                }))}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="1m">1 Minute</option>
                <option value="5m">5 Minutes</option>
                <option value="15m">15 Minutes</option>
                <option value="1h">1 Hour</option>
                <option value="1d">1 Day</option>
              </select>
            </div>

            {/* Price Range */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={scanCriteria.minPrice}
                  onChange={(e) => setScanCriteria(prev => ({
                    ...prev,
                    minPrice: parseFloat(e.target.value) || 0
                  }))}
                  className="border border-gray-300 rounded px-3 py-2"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={scanCriteria.maxPrice}
                  onChange={(e) => setScanCriteria(prev => ({
                    ...prev,
                    maxPrice: parseFloat(e.target.value) || 1000
                  }))}
                  className="border border-gray-300 rounded px-3 py-2"
                />
              </div>
            </div>

            {/* Indicators */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Technical Indicators
              </label>
              <div className="space-y-2">
                {['RSI', 'MACD', 'SMA_20', 'EMA_50', 'Bollinger Bands'].map(indicator => (
                  <label key={indicator} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={scanCriteria.indicators.includes(indicator)}
                      onChange={(e) => {
                        setScanCriteria(prev => ({
                          ...prev,
                          indicators: e.target.checked
                            ? [...prev.indicators, indicator]
                            : prev.indicators.filter(i => i !== indicator)
                        }));
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{indicator}</span>
                  </label>
                ))}
              </div>
            </div>
          </BrandCard>

          {/* Filter Configuration */}
          <BrandCard variant="bordered" className="p-4 mt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Criteria</h3>
            
            {/* Signal Types */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Signal Types
              </label>
              <div className="space-y-2">
                {['BUY', 'SELL', 'WATCH'].map(signal => (
                  <label key={signal} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filterCriteria.signalType.includes(signal)}
                      onChange={(e) => {
                        setFilterCriteria(prev => ({
                          ...prev,
                          signalType: e.target.checked
                            ? [...prev.signalType, signal]
                            : prev.signalType.filter(s => s !== signal)
                        }));
                      }}
                      className="mr-2"
                    />
                    <span className={`text-sm px-2 py-1 rounded ${getSignalColor(signal)}`}>
                      {signal}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Minimum Strength */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Strength: {filterCriteria.minStrength}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={filterCriteria.minStrength}
                onChange={(e) => setFilterCriteria(prev => ({
                  ...prev,
                  minStrength: parseInt(e.target.value)
                }))}
                className="w-full"
              />
            </div>

            {/* Minimum Confidence */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Confidence: {filterCriteria.minConfidence}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={filterCriteria.minConfidence}
                onChange={(e) => setFilterCriteria(prev => ({
                  ...prev,
                  minConfidence: parseInt(e.target.value)
                }))}
                className="w-full"
              />
            </div>
          </BrandCard>
        </div>

        {/* Opportunities List */}
        <div className="lg:col-span-2">
          <BrandCard variant="elevated" className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Trading Opportunities ({filteredOpportunities.length})
              </h3>
              <div className="text-sm text-gray-500">
                Last updated: {opportunities.length > 0 ? new Date().toLocaleTimeString() : 'Never'}
              </div>
            </div>

            {filteredOpportunities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.469-.935-6.072-2.455M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p>No opportunities match your current criteria</p>
                <p className="text-sm mt-1">Try adjusting your filters or running a new scan</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOpportunities.map((opportunity) => (
                  <div
                    key={opportunity.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedOpportunity?.id === opportunity.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedOpportunity(
                      selectedOpportunity?.id === opportunity.id ? null : opportunity
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {opportunity.symbol}
                          </h4>
                          <span className={`px-2 py-1 rounded text-sm font-medium ${getSignalColor(opportunity.signal)}`}>
                            {opportunity.signal}
                          </span>
                          <span className="text-sm text-gray-600">
                            ${opportunity.price.toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Strength: {opportunity.strength}/10</span>
                          <span>Confidence: {opportunity.confidence}%</span>
                          <span className={getRiskColor(opportunity.risk)}>
                            Risk: {opportunity.risk}
                          </span>
                          <span>Strategy: {opportunity.strategy}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <BrandButton
                          variant={watchlist.includes(opportunity.symbol) ? "primary" : "outline"}
                          size="sm"
                          onClick={() => {
                            toggleWatchlist(opportunity.symbol);
                          }}
                        >
                          {watchlist.includes(opportunity.symbol) ? '★' : '☆'}
                        </BrandButton>
                        <BrandButton
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            navigate(`/visualizer?symbol=${opportunity.symbol}`);
                          }}
                        >
                          Analyze
                        </BrandButton>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedOpportunity?.id === opportunity.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">Technical Indicators</h5>
                            <div className="space-y-1 text-sm">
                              <div>RSI: {opportunity.indicators.rsi}</div>
                              <div>MACD: {opportunity.indicators.macd}</div>
                              <div>Moving Avg: ${opportunity.indicators.moving_avg}</div>
                            </div>
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">Signal Reasoning</h5>
                            <ul className="space-y-1 text-sm">
                              {opportunity.reasoning.map((reason, idx) => (
                                <li key={idx} className="flex items-center">
                                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                  {reason}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex space-x-2">
                          <BrandButton
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(`/rule-engine-demo?symbol=${opportunity.symbol}&signal=${opportunity.signal}`)}
                          >
                            Create Rule
                          </BrandButton>
                          <BrandButton
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/analysis?symbol=${opportunity.symbol}`)}
                          >
                            AI Analysis
                          </BrandButton>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </BrandCard>
        </div>
      </div>

      {/* Alerts & Watchlist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <BrandCard variant="bordered" className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
          {alerts.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent alerts</p>
          ) : (
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <span className="font-medium text-gray-900">{alert.symbol}</span>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {alert.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </BrandCard>

        {/* Watchlist */}
        <BrandCard variant="bordered" className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Watchlist</h3>
          {watchlist.length === 0 ? (
            <p className="text-gray-500 text-sm">No symbols in watchlist</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {watchlist.map(symbol => (
                <span
                  key={symbol}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center space-x-1"
                >
                  <span>{symbol}</span>
                  <button
                    onClick={() => toggleWatchlist(symbol)}
                    className="text-blue-600 hover:text-blue-800 ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </BrandCard>
      </div>
    </div>
  );
};

export default TradeScreener; 