import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/Card';
import { Button } from '../../../../shared/components/ui/button';
import { Badge } from '../../../../shared/components/ui/Badge';
import { TrendingUp, TrendingDown, ArrowRight, Clock, Users, Star, Plus } from 'lucide-react';
import WatchlistService from '../../../../shared/services/WatchlistService';

// Create CardDescription since it doesn't exist in Card.tsx
const CardDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`text-sm text-gray-600 ${className}`}>{children}</p>
);

interface CuratedListOverviewProps {
  lists: any;
  onSelectCategory: (category: string) => void;
  getCategoryIcon: (category: string) => React.ReactNode;
  getCategoryColor: (category: string) => string;
}

const CuratedListOverview: React.FC<CuratedListOverviewProps> = ({
  lists,
  onSelectCategory,
  getCategoryIcon,
  getCategoryColor
}) => {
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatCurrency = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    return `$${value.toFixed(2)}`;
  };

  const handleAddToWatchlist = (stock: any, category: string) => {
    const success = WatchlistService.addStock({
      symbol: stock.symbol,
      name: stock.name || stock.symbol,
      price: stock.price || 100, // Default price if not available
      source: 'curated-lists',
      category: category,
      riskLevel: 'medium'
    });

    if (success) {
      // Show success feedback (you could add toast notification here)
      console.log(`Added ${stock.symbol} to watchlist`);
    }
  };

  const isInWatchlist = (symbol: string) => {
    return WatchlistService.isInWatchlist(symbol);
  };

  const listCategories = [
    { key: 'stocksOfYear', title: 'Stocks of the Year', priority: 'high' },
    { key: 'earlyOpportunities', title: 'Early Opportunities', priority: 'medium' },
    { key: 'stableDividend', title: 'Stable Dividend', priority: 'low' },
    { key: 'established', title: 'Established Leaders', priority: 'low' },
    { key: 'trending', title: 'Trending Momentum', priority: 'medium' },
    { key: 'sectorLeaders', title: 'Sector Leaders', priority: 'medium' }
  ];

  return (
    <div className="space-y-6">
      {/* Featured Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listCategories.map((category) => {
          const listData = lists[category.key];
          if (!listData) return null;

          return (
            <div 
              key={category.key}
              className={`${getCategoryColor(category.key)} hover:shadow-lg transition-all duration-300`}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(category.key)}
                      <CardTitle className="text-lg">{listData.title}</CardTitle>
                    </div>
                    <Badge 
                      variant={category.priority === 'high' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {category.priority}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">
                    {listData.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Performance Metrics */}
                  {listData.performance && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-2 bg-white/50 rounded-lg">
                        <div className="text-lg font-bold text-green-700">
                          {formatPercentage(listData.performance.ytd)}
                        </div>
                        <div className="text-xs text-gray-600">YTD Return</div>
                      </div>
                      <div className="text-center p-2 bg-white/50 rounded-lg">
                        <div className="flex items-center justify-center gap-1">
                          {listData.performance.vsSpx > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`text-lg font-bold ${
                            listData.performance.vsSpx > 0 ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {formatPercentage(Math.abs(listData.performance.vsSpx))}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">vs S&P 500</div>
                      </div>
                    </div>
                  )}

                  {/* Top Stocks with Add to Watchlist */}
                  {listData.stocks && listData.stocks.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700 mb-2">Top Picks:</div>
                      {listData.stocks.slice(0, 3).map((stock: any) => (
                        <div key={stock.symbol} className="flex items-center justify-between bg-white/50 p-2 rounded">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium">{stock.symbol}</span>
                            {stock.price && (
                              <span className="text-xs text-gray-600">${stock.price.toFixed(2)}</span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToWatchlist(stock, category.key);
                            }}
                            disabled={isInWatchlist(stock.symbol)}
                            className="h-6 px-2 text-xs"
                          >
                            {isInWatchlist(stock.symbol) ? (
                              <Star className="h-3 w-3 fill-current" />
                            ) : (
                              <Plus className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Stock Count and Update Info */}
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{listData.stocks?.length || 0} stocks</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{listData.updateFrequency}</span>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => onSelectCategory(category.key)}
                  >
                    View All Stocks
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Sector Leaders Special Section */}
      {lists.sectorLeaders && (
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getCategoryIcon('sectorLeaders')}
              Sector Leadership Overview
            </CardTitle>
            <CardDescription>
              Top 2-3 companies dominating each major sector
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(lists.sectorLeaders.sectors).map(([sector, data]: [string, any]) => (
                <div key={sector} className="bg-white/60 p-4 rounded-lg">
                  <div className="font-medium text-gray-800 capitalize mb-2">{sector}</div>
                  <div className="space-y-1">
                    {data.leaders.slice(0, 3).map((symbol: string) => (
                      <div key={symbol} className="text-sm font-mono text-blue-700">
                        {symbol}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    Performance: {formatPercentage(data.performance)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Action Cards with Add to Watchlist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg text-blue-800">Beginner-Friendly Picks</CardTitle>
            <CardDescription>
              Household names with strong fundamentals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { symbol: 'AAPL', name: 'Apple Inc.', price: 175.30, label: 'Tech Leader' },
                { symbol: 'MSFT', name: 'Microsoft Corp.', price: 395.80, label: 'Cloud Dominance' },
                { symbol: 'KO', name: 'Coca-Cola Co.', price: 62.50, label: 'Dividend King' }
              ].map((stock) => (
                <div key={stock.symbol} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{stock.symbol}</span>
                    <Badge variant="secondary" className="text-xs">{stock.label}</Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddToWatchlist(stock, 'beginner-friendly')}
                    disabled={isInWatchlist(stock.symbol)}
                    className="h-6 px-2"
                  >
                    {isInWatchlist(stock.symbol) ? (
                      <Star className="h-3 w-3 fill-current" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-4"
              onClick={() => window.location.href = '/watchlist'}
            >
              View My Watchlist
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-lg text-green-800">Quality Metrics</CardTitle>
            <CardDescription>
              Goldman Sachs "Rule of 10" criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Sales Growth</span>
                <span className="font-medium text-green-700">10%+ Annual</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Operating Profit</span>
                <span className="font-medium text-green-700">Top 30%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Market Cap</span>
                <span className="font-medium text-green-700">$10B+ Only</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4">
              Learn Quality Investing
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CuratedListOverview; 