import React, { useState, useEffect } from 'react';
import VolatilityAnalysisService, { VolatilitySnapshot, PortfolioVolatilityAnalysis } from '../../services/VolatilityAnalysisService';
import { VolatilityDashboard } from '../Dashboard/VolatilityDashboard';

const VolatilityDashboardDemo: React.FC = () => {
  const [volatilityService] = useState(() => new VolatilityAnalysisService());
  const [isLoadingRealData, setIsLoadingRealData] = useState(false);
  const [realDataEnabled, setRealDataEnabled] = useState(false);
  const [portfolioData, setPortfolioData] = useState<PortfolioVolatilityAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRealVolatilityData = async (symbol: string) => {
    if (!realDataEnabled) return null;
    
    try {
      setIsLoadingRealData(true);
      setError(null);
      
      const analysis = await volatilityService.getSymbolAnalysis({
        symbol,
        includeVIXCorrelation: true
      });
      
      console.log(`✅ Real volatility data for ${symbol}:`, analysis);
      return analysis;
    } catch (err) {
      const errorMessage = `Failed to fetch real data for ${symbol}: ${err}`;
      console.error('❌', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoadingRealData(false);
    }
  };

  const fetchPortfolioAnalysis = async (symbols: string[]) => {
    if (!realDataEnabled) return;
    
    try {
      setIsLoadingRealData(true);
      setError(null);
      
      console.log(`🔄 Fetching portfolio analysis for: ${symbols.join(', ')}`);
      
      const portfolioAnalysis = await volatilityService.getPortfolioAnalysis({
        symbols,
        includeCorrelationMatrix: true
      });
      
      console.log('✅ Portfolio analysis complete:', portfolioAnalysis);
      setPortfolioData(portfolioAnalysis);
      
      return portfolioAnalysis;
    } catch (err) {
      const errorMessage = `Failed to fetch portfolio analysis: ${err}`;
      console.error('❌', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoadingRealData(false);
    }
  };

  const [selectedSymbols, setSelectedSymbols] = useState(['SPY', 'QQQ', 'AAPL']);
  
  useEffect(() => {
    // Auto-load portfolio data when real data is enabled
    if (realDataEnabled && selectedSymbols.length > 0) {
      fetchPortfolioAnalysis(selectedSymbols);
    }
  }, [realDataEnabled, selectedSymbols]);

  const availableSymbols = volatilityService.getAvailableSymbols();
  const serviceStats = volatilityService.getServiceStats();

  const handleSymbolChange = (symbols: string[]) => {
    setSelectedSymbols(symbols);
    if (realDataEnabled) {
      fetchPortfolioAnalysis(symbols);
    }
  };

  const handleRealDataToggle = () => {
    setRealDataEnabled(!realDataEnabled);
    setError(null);
    if (!realDataEnabled) {
      // Will trigger useEffect to load data
    } else {
      setPortfolioData(null);
    }
  };

  const refreshData = () => {
    if (realDataEnabled && selectedSymbols.length > 0) {
      volatilityService.clearCaches();
      fetchPortfolioAnalysis(selectedSymbols);
    }
  };

  return (
    <div className="space-y-6">
      {/* Demo Controls */}
      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          🧪 Volatility Analysis Demo - Task 21.3
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Real Data Controls */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRealDataToggle}
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  realDataEnabled
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-500 text-white hover:bg-gray-600'
                }`}
                disabled={isLoadingRealData}
              >
                {realDataEnabled ? '🟢 Real Data ON' : '🔴 Real Data OFF'}
              </button>
              
              {realDataEnabled && (
                <button
                  onClick={refreshData}
                  disabled={isLoadingRealData}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  🔄 Refresh
                </button>
              )}
            </div>

            {isLoadingRealData && (
              <div className="text-blue-600 font-medium">
                ⏳ Loading real market data...
              </div>
            )}

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                ❌ {error}
              </div>
            )}
          </div>

          {/* Symbol Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Portfolio Symbols:
            </label>
            <div className="flex flex-wrap gap-2">
              {availableSymbols.map(symbol => (
                <label key={symbol} className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={selectedSymbols.includes(symbol)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleSymbolChange([...selectedSymbols, symbol]);
                      } else {
                        handleSymbolChange(selectedSymbols.filter(s => s !== symbol));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{symbol}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Service Statistics */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <details className="cursor-pointer">
            <summary className="text-sm font-medium text-gray-600">
              📊 Service Statistics
            </summary>
            <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-3 rounded">
              <div>Cache Size: {serviceStats.dataService.cacheSize} entries</div>
              <div>Active Requests: {serviceStats.activeRequests}</div>
              <div>Last API Call: {serviceStats.dataService.lastApiCall || 'None'}</div>
              <div>Real-time Updates: {serviceStats.config.enableRealTimeUpdates ? 'Enabled' : 'Disabled'}</div>
            </div>
          </details>
        </div>
      </div>

      {/* Portfolio Analysis Results */}
      {portfolioData && (
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            📈 Live Portfolio Analysis Results
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-xs text-blue-600 font-medium">Avg IV Percentile</div>
              <div className="text-lg font-bold text-blue-900">
                {(portfolioData.portfolioMetrics.averageIVPercentile * 100).toFixed(1)}%
              </div>
            </div>
            
            <div className="bg-purple-50 p-3 rounded">
              <div className="text-xs text-purple-600 font-medium">Portfolio Vol</div>
              <div className="text-lg font-bold text-purple-900">
                {(portfolioData.portfolioMetrics.portfolioVolatility * 100).toFixed(1)}%
              </div>
            </div>
            
            <div className="bg-green-50 p-3 rounded">
              <div className="text-xs text-green-600 font-medium">Diversification</div>
              <div className="text-lg font-bold text-green-900">
                {portfolioData.portfolioMetrics.diversificationRatio.toFixed(2)}
              </div>
            </div>
            
            <div className="bg-orange-50 p-3 rounded">
              <div className="text-xs text-orange-600 font-medium">Data Quality</div>
              <div className="text-sm font-bold text-orange-900">
                {portfolioData.snapshots.map(s => s.dataQuality.dataSource).join(', ')}
              </div>
            </div>
          </div>

          {/* Individual Symbol Details */}
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-800">Symbol Details:</h4>
            {portfolioData.snapshots.map(snapshot => (
              <div key={snapshot.symbol} className="text-sm bg-gray-50 p-3 rounded">
                <div className="font-medium">{snapshot.symbol}: ${snapshot.currentPrice.toFixed(2)}</div>
                <div className="text-gray-600">
                  IV: {(snapshot.analysis.ivPercentile.percentile).toFixed(1)}% | 
                  ATR: {snapshot.analysis.atr.value.toFixed(2)} | 
                  Regime: {snapshot.analysis.marketRegime} | 
                  Data: {snapshot.dataQuality.priceDataPoints} points ({snapshot.dataQuality.dataSource})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Dashboard Component */}
      <VolatilityDashboard />

      {/* Data Source Information */}
      <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
        <h4 className="font-semibold text-yellow-800 mb-2">📡 Data Sources</h4>
        <div className="text-sm text-yellow-700 space-y-1">
          <div>• <strong>Real Data ON:</strong> Yahoo Finance API → CSV Fallback → Mock Generation</div>
          <div>• <strong>Real Data OFF:</strong> Uses existing mock data from VolatilityDashboard</div>
          <div>• <strong>Features:</strong> 5min caching, rate limiting, data validation, correlation analysis</div>
          <div>• <strong>Calculations:</strong> IV Percentile, ATR, Bollinger Bands, VIX correlation, market regime detection</div>
        </div>
      </div>
    </div>
  );
};

export default VolatilityDashboardDemo; 