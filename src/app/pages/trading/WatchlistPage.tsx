import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../../shared/components/ui/Card';
import { Badge } from '../../../shared/components/ui/Badge';
import { Button } from '../../../shared/components/ui/button';
import { 
  Star, 
  Trash2, 
  DollarSign, 
  BarChart3,
  PieChart,
  Target,
  Calendar,
  RefreshCw
} from 'lucide-react';
import WatchlistService, { Watchlist } from '../../../shared/services/WatchlistService';

const WatchlistPage: React.FC = () => {
  const [watchlist, setWatchlist] = useState<Watchlist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = () => {
    setLoading(true);
    try {
      const mainWatchlist = WatchlistService.getMainWatchlist();
      setWatchlist(mainWatchlist);
    } catch (error) {
      console.error('Error loading watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStock = (symbol: string) => {
    const success = WatchlistService.removeStock(symbol);
    if (success) {
      loadWatchlist();
    }
  };

  const handleClearWatchlist = () => {
    if (window.confirm('Are you sure you want to clear all stocks from your watchlist?')) {
      const success = WatchlistService.clearWatchlist();
      if (success) {
        loadWatchlist();
      }
    }
  };

  const getRiskBadgeColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'curated-lists': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'screening': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'template-matching': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const summary = watchlist ? WatchlistService.getWatchlistSummary() : null;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading your watchlist...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Star className="h-8 w-8 text-yellow-500" />
            My Watchlist
          </h1>
          <p className="text-gray-600 mt-2">
            Stocks you've selected for further research and investment
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={loadWatchlist} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {watchlist && watchlist.stocks.length > 0 && (
            <Button 
              onClick={handleClearWatchlist} 
              variant="outline" 
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      {summary && summary.totalStocks > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-700">{summary.totalStocks}</div>
                  <div className="text-sm text-blue-600">Total Stocks</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-700">${summary.avgPrice.toFixed(0)}</div>
                  <div className="text-sm text-green-600">Avg Price</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-purple-700">
                    {Math.max(...Object.values(summary.riskDistribution))}
                  </div>
                  <div className="text-sm text-purple-600">
                    Highest Risk Count
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold text-orange-700">
                    {Object.keys(summary.sourceDistribution).length}
                  </div>
                  <div className="text-sm text-orange-600">Sources</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stocks List */}
      {watchlist && watchlist.stocks.length === 0 ? (
        <Card className="bg-gray-50">
          <CardContent className="p-12 text-center">
            <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Your watchlist is empty</h3>
            <p className="text-gray-600 mb-6">
              Start by visiting our stock screening pages to add stocks to your watchlist
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button 
                onClick={() => window.location.href = '/curated-lists'} 
                variant="outline"
              >
                Browse Curated Lists
              </Button>
              <Button 
                onClick={() => window.location.href = '/advanced-screening'}
                variant="outline"
              >
                AI Stock Screener
              </Button>
              <Button 
                onClick={() => window.location.href = '/template-matching'}
                variant="outline"
              >
                Template Matching
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {watchlist?.stocks.map((stock) => (
            <Card key={stock.symbol} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{stock.symbol}</h3>
                      <Badge className={`text-xs ${getRiskBadgeColor(stock.riskLevel)}`}>
                        {stock.riskLevel || 'medium'} risk
                      </Badge>
                      <Badge className={`text-xs ${getSourceBadgeColor(stock.source)}`}>
                        {stock.source.replace('-', ' ')}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-700 font-medium mb-3">{stock.name}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-gray-600">Price:</span>
                        <span className="font-medium">${stock.price.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="text-gray-600">Added:</span>
                        <span className="font-medium">{stock.addedAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveStock(stock.symbol)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WatchlistPage;
