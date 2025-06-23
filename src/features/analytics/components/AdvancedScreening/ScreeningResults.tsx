import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/Card';
import { Badge } from '../../../../shared/components/ui/Badge';
import { Button } from '../../../../shared/components/ui/button';
import { 
  ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, TrendingDown,
  Star, Shield, Clock, BarChart3, Target, Download,
  RefreshCw, AlertTriangle, CheckCircle2, Info,
  DollarSign, Percent, Activity, ChevronUp, ChevronDown, Plus
} from 'lucide-react';
import { ScreenedStock } from '../../../../shared/services/TechnicalFundamentalScreener';
import { UserExperienceLevel } from '../../../../shared/utils/ux/UXLayersController';
import WatchlistService from '../../../../shared/services/WatchlistService';

interface ScreeningResultsProps {
  results: ScreenedStock[];
  userLevel: UserExperienceLevel;
  isLoading: boolean;
  onExport: (format: 'csv' | 'json') => void;
  onRescreen: () => void;
}

type SortField = 'symbol' | 'price' | 'marketCap' | 'overallScore' | 'rsiAccuracy' | 'recommendation';
type SortDirection = 'asc' | 'desc';

const ScreeningResults: React.FC<ScreeningResultsProps> = ({
  results,
  userLevel,
  isLoading,
  onExport,
  onRescreen
}) => {
  const [sortField, setSortField] = useState<SortField>('overallScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedStock, setSelectedStock] = useState<string | null>(null);

  // Watchlist functionality
  const handleAddToWatchlist = (stock: ScreenedStock) => {
    const success = WatchlistService.addStock({
      symbol: stock.symbol,
      name: stock.name,
      price: stock.price,
      source: 'screening',
      riskLevel: stock.riskLevel as 'low' | 'medium' | 'high'
    });

    if (success) {
      console.log(`Added ${stock.symbol} to watchlist`);
    }
  };

  const isInWatchlist = (symbol: string) => {
    return WatchlistService.isInWatchlist(symbol);
  };

  // Sorting functionality
  const sortedResults = useMemo(() => {
    if (!results.length) return [];
    
    return [...results].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      // Handle nested properties
      if (sortField === 'rsiAccuracy') {
        aValue = a.rsiAccuracy;
        bValue = b.rsiAccuracy;
      }
      
      // Convert to numbers for comparison if needed
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [results, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Get recommendation styling
  const getRecommendationStyle = (recommendation: string) => {
    switch (recommendation) {
      case 'strong_buy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'buy':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'hold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'sell':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'strong_sell':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get risk level styling
  const getRiskStyle = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-50 text-green-700';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700';
      case 'high':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  // Format market cap
  const formatMarketCap = (value: number) => {
    if (value >= 1_000_000_000_000) {
      return `$${(value / 1_000_000_000_000).toFixed(1)}T`;
    } else if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(1)}B`;
    } else if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(0)}M`;
    }
    return `$${value.toLocaleString()}`;
  };

  // Get summary statistics
  const getSummaryStats = () => {
    if (!results.length) return null;
    
    const strongBuys = results.filter(s => s.recommendation === 'strong_buy').length;
    const buys = results.filter(s => s.recommendation === 'buy').length;
    const holds = results.filter(s => s.recommendation === 'hold').length;
    
    const avgScore = results.reduce((sum, s) => sum + s.overallScore, 0) / results.length;
    const avgRsiAccuracy = results.reduce((sum, s) => sum + s.rsiAccuracy, 0) / results.length;
    
    const riskDistribution = results.reduce((acc, s) => {
      acc[s.riskLevel] = (acc[s.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      strongBuys,
      buys,
      holds,
      avgScore: avgScore.toFixed(1),
      avgRsiAccuracy: (avgRsiAccuracy * 100).toFixed(1),
      riskDistribution
    };
  };

  const summaryStats = getSummaryStats();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Market Data</h3>
          <p className="text-gray-600">Applying research-backed filters...</p>
        </div>
      </div>
    );
  }

  // No results state
  if (!results.length) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Found</h3>
        <p className="text-gray-600 mb-4">
          No stocks match your current screening criteria. Try adjusting your filters or using a template.
        </p>
        <Button onClick={onRescreen} variant="outline">
          Adjust Filters
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      {summaryStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">Strong Buys</span>
            </div>
            <div className="text-2xl font-bold text-green-700">{summaryStats.strongBuys}</div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Buys</span>
            </div>
            <div className="text-2xl font-bold text-blue-700">{summaryStats.buys}</div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-900">Holds</span>
            </div>
            <div className="text-2xl font-bold text-yellow-700">{summaryStats.holds}</div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Avg Score</span>
            </div>
            <div className="text-2xl font-bold text-purple-700">{summaryStats.avgScore}</div>
          </div>
          
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-900">RSI Accuracy</span>
            </div>
            <div className="text-2xl font-bold text-indigo-700">{summaryStats.avgRsiAccuracy}%</div>
          </div>
        </div>
      )}

      {/* Results Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Screening Results ({results.length} stocks)
            </CardTitle>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onExport('csv')}>
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" onClick={() => onExport('json')}>
                <Download className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  {[
                    { key: 'symbol', label: 'Symbol' },
                    { key: 'price', label: 'Price' },
                    { key: 'marketCap', label: 'Market Cap' },
                    { key: 'overallScore', label: 'Score' },
                    { key: 'recommendation', label: 'Rating' },
                    { key: 'rsiAccuracy', label: 'RSI Accuracy' },
                    { key: 'watchlist', label: 'Watchlist' }
                  ].map((column) => (
                    <th
                      key={column.key}
                      className={`text-left py-3 px-4 font-medium text-gray-700 ${
                        column.key === 'watchlist' ? '' : 'cursor-pointer hover:bg-gray-50'
                      }`}
                      {...(column.key !== 'watchlist' && {
                        onClick: () => handleSort(column.key as SortField)
                      })}
                    >
                      <div className="flex items-center gap-1">
                        {column.label}
                        {column.key !== 'watchlist' && sortField === column.key ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : column.key !== 'watchlist' ? (
                          <ArrowUpDown className="h-3 w-3 text-gray-400" />
                        ) : null}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              
              <tbody>
                {sortedResults.map((stock) => (
                  <React.Fragment key={stock.symbol}>
                    <tr
                      onClick={() => setSelectedStock(selectedStock === stock.symbol ? null : stock.symbol)}
                      className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                        selectedStock === stock.symbol ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-semibold text-gray-900">{stock.symbol}</div>
                          <div className="text-sm text-gray-600 truncate max-w-32">
                            {stock.name}
                          </div>
                        </div>
                      </td>
                      
                      <td className="py-3 px-4">
                        <div className="font-medium">${stock.price.toFixed(2)}</div>
                        <div className="text-sm text-gray-500">{stock.sector}</div>
                      </td>
                      
                      <td className="py-3 px-4">
                        <div className="font-medium">{formatMarketCap(stock.marketCap)}</div>
                        <Badge className={`text-xs ${getRiskStyle(stock.riskLevel)}`}>
                          {stock.riskLevel} risk
                        </Badge>
                      </td>
                      
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="text-lg font-bold">{stock.overallScore}</div>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${stock.overallScore}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      
                      <td className="py-3 px-4">
                        <Badge className={`${getRecommendationStyle(stock.recommendation)}`}>
                          {stock.recommendation.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">
                            {(stock.rsiAccuracy * 100).toFixed(0)}%
                          </span>
                          {stock.rsiAccuracy >= 0.72 && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          RSI: {stock.technical.rsi14.toFixed(1)}
                        </div>
                      </td>
                      
                      <td className="py-3 px-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToWatchlist(stock);
                          }}
                          disabled={isInWatchlist(stock.symbol)}
                          className="h-8 px-3"
                        >
                          {isInWatchlist(stock.symbol) ? (
                            <Star className="h-4 w-4 fill-current" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                    
                    {/* Expanded row details */}
                    {selectedStock === stock.symbol && (
                      <tr className="bg-blue-50">
                        <td colSpan={7} className="py-4 px-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Technical</h4>
                              <div className="space-y-1 text-sm">
                                <div>RSI: {stock.technical.rsi14.toFixed(1)}</div>
                                <div>MACD: {stock.technical.macd.line.toFixed(2)}</div>
                                <div>Volume: {(stock.technical.volume.avgVolume / 1000000).toFixed(1)}M</div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Fundamental</h4>
                              <div className="space-y-1 text-sm">
                                <div>D/E: {stock.fundamental.debtToEquity.toFixed(2)}</div>
                                <div>PEG: {stock.fundamental.pegRatio.toFixed(2)}</div>
                                <div>Rev Growth: {(stock.fundamental.revenueGrowth * 100).toFixed(1)}%</div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Research</h4>
                              <div className="space-y-1 text-sm">
                                <div>RSI Accuracy: {(stock.rsiAccuracy * 100).toFixed(1)}%</div>
                                <div>MACD Effectiveness: {(stock.macdEffectiveness * 100).toFixed(1)}%</div>
                                <div>Time Horizon: {stock.timeHorizon}</div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Scores</h4>
                              <div className="space-y-1 text-sm">
                                <div>Technical: {stock.technicalScore}</div>
                                <div>Fundamental: {stock.fundamentalScore}</div>
                                <div>Overall: {stock.overallScore}</div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Level-specific insights */}
                          {userLevel === 'learning' && (
                            <div className="mt-4 p-3 bg-blue-100 border border-blue-200 rounded-lg">
                              <div className="text-sm text-blue-800">
                                <Info className="h-4 w-4 inline mr-1" />
                                <strong>Beginner Insight:</strong> This {stock.riskLevel}-risk stock is 
                                {stock.recommendation === 'buy' || stock.recommendation === 'strong_buy' 
                                  ? ' showing positive signals' 
                                  : ' in a neutral position'}. 
                                Consider your risk tolerance and portfolio allocation.
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Research Validation Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            Research Validation Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">RSI Effectiveness</h4>
              <div className="text-2xl font-bold text-green-700 mb-1">
                {summaryStats ? summaryStats.avgRsiAccuracy : '0'}%
              </div>
              <div className="text-sm text-green-600">
                Research: 75% oversold, 72% overbought accuracy
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">MACD Optimization</h4>
              <div className="text-sm text-blue-700">
                Trending markets: Higher effectiveness
                <br />
                Range-bound: RSI preferred
              </div>
            </div>
            
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Moving Averages</h4>
              <div className="text-sm text-purple-700">
                Golden Cross strategy: 5.4% historical returns
                <br />
                50/200 MA crossover validation
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScreeningResults; 