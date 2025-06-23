import React, { useEffect, useState } from 'react';
import { MarketDataService, NewsDataRequest } from '../../../../shared/services/MarketDataService';
import { MarketNewsData } from '../../../../shared/services/DatabaseService';

interface MarketNewsProps {
  marketDataService: MarketDataService;
  maxItems?: number;
  categoryFilter?: 'fed_policy' | 'tariff' | 'general' | 'all';
  minRelevanceScore?: number;
  className?: string;
  theme?: 'light' | 'dark';
  showCategories?: boolean;
  showRelevanceScore?: boolean;
  selectedNewsId?: number | null;
  onNewsUpdate?: (news: MarketNewsData[]) => void;
  onNewsClick?: (newsId: number) => void;
  onNewsHover?: (newsId: number | null) => void;
  onError?: (error: Error) => void;
}

interface NewsState {
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  newsItems: MarketNewsData[];
}

const MarketNews: React.FC<MarketNewsProps> = ({
  marketDataService,
  maxItems = 10,
  categoryFilter = 'all',
  minRelevanceScore = 5,
  className = '',
  theme = 'light',
  showCategories = true,
  showRelevanceScore = true,
  selectedNewsId = null,
  onNewsUpdate,
  onNewsClick,
  onNewsHover,
  onError
}) => {
  const [newsState, setNewsState] = useState<NewsState>({
    isLoading: true,
    error: null,
    lastUpdate: null,
    newsItems: []
  });

  // Load news data
  const loadNews = async () => {
    try {
      setNewsState(prev => ({ ...prev, isLoading: true, error: null }));

      const request: NewsDataRequest = {
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        minRelevanceScore,
        limit: maxItems
      };

      const newsData = await marketDataService.getMarketNewsData(request);

      setNewsState({
        isLoading: false,
        error: null,
        lastUpdate: new Date(),
        newsItems: newsData
      });

      onNewsUpdate?.(newsData);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load news';
      setNewsState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMsg,
        newsItems: []
      }));
      onError?.(error instanceof Error ? error : new Error(errorMsg));
    }
  };

  // Load news when component mounts or dependencies change
  useEffect(() => {
    loadNews();
  }, [marketDataService, maxItems, categoryFilter, minRelevanceScore]);

  // Listen to market data service events
  useEffect(() => {
    const handleNewsUpdate = () => {
      loadNews();
    };

    marketDataService.on('news:data:updated', handleNewsUpdate);
    marketDataService.on('sync:completed', handleNewsUpdate);

    return () => {
      marketDataService.off('news:data:updated', handleNewsUpdate);
      marketDataService.off('sync:completed', handleNewsUpdate);
    };
  }, [marketDataService]);

  // Category styling
  const getCategoryStyle = (category: string) => {
    const baseClasses = 'px-2 py-1 text-xs rounded-full font-medium';
    switch (category) {
      case 'fed_policy':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'tariff':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'general':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  // Relevance score styling
  const getRelevanceScoreStyle = (score: number) => {
    if (score >= 9) return 'text-green-600 font-bold';
    if (score >= 7) return 'text-yellow-600 font-semibold';
    return 'text-gray-500';
  };

  // Format published date
  const formatPublishedDate = (dateString: string | undefined) => {
    try {
      if (!dateString) return 'Unknown';
      const date = new Date(dateString);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffHours < 48) return '1 day ago';
      return date.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  // Manual refresh
  const refreshNews = async () => {
    await loadNews();
  };

  const containerClasses = `market-news ${className} ${
    theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'
  }`;

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">📰 Market News</h3>
          {newsState.lastUpdate && (
            <span className="text-sm opacity-75">
              Updated: {newsState.lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {newsState.newsItems.length > 0 && (
            <span className="text-sm opacity-75">
              {newsState.newsItems.length} articles
            </span>
          )}
          
          <button
            onClick={refreshNews}
            disabled={newsState.isLoading}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              newsState.isLoading
                ? 'bg-gray-300 cursor-not-allowed'
                : theme === 'dark'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {newsState.isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {newsState.isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span>Loading market news...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {newsState.error && (
        <div className="p-4 text-center">
          <div className="text-red-500 text-lg mb-2">⚠️ Error</div>
          <div className="text-sm mb-4">{newsState.error}</div>
          <button
            onClick={refreshNews}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* News Items */}
      {!newsState.isLoading && !newsState.error && (
        <div className="space-y-4 p-4">
          {newsState.newsItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📭</div>
              <div>No news articles found for the current filters</div>
            </div>
          ) : (
            newsState.newsItems.map((item, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                  theme === 'dark' ? 'border-gray-600 hover:shadow-gray-700' : 'border-gray-200'
                }`}
              >
                {/* Article Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-1 leading-tight">
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {item.title}
                        </a>
                      ) : (
                        item.title
                      )}
                    </h4>
                    
                    <div className="flex items-center space-x-3 text-sm">
                      <span className="font-medium">{item.source}</span>
                      <span className="opacity-75">•</span>
                      <span className="opacity-75">
                        {formatPublishedDate(item.published_at || '')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {showCategories && (
                      <span className={getCategoryStyle(item.category)}>
                        {item.category.replace('_', ' ').toUpperCase()}
                      </span>
                    )}
                    
                    {showRelevanceScore && (
                      <div className="text-right">
                        <div className="text-xs opacity-75">Relevance</div>
                        <div className={`text-sm ${getRelevanceScoreStyle(item.relevance_score)}`}>
                          {item.relevance_score}/10
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Article Description */}
                <p className="text-sm opacity-90 mb-3 leading-relaxed">
                  {item.description}
                </p>

                {/* Article Footer */}
                <div className="flex items-center justify-between text-xs opacity-75">
                  <div className="flex items-center space-x-4">
                    {item.impact_type && (
                      <span className={`px-2 py-1 rounded ${
                        item.impact_type === 'positive' 
                          ? 'bg-green-100 text-green-700' 
                          : item.impact_type === 'negative'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {item.impact_type}
                      </span>
                    )}
                    
                    {item.keywords && (
                      <div className="flex items-center space-x-1">
                        <span>🏷️</span>
                        <span>
                          {JSON.parse(item.keywords || '[]').slice(0, 3).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div>Article #{index + 1}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Footer */}
      <div className={`px-4 py-2 border-t text-xs opacity-75 ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            Showing articles with relevance ≥ {minRelevanceScore}
            {categoryFilter !== 'all' && ` in ${categoryFilter.replace('_', ' ')}`}
          </div>
          <div>🔄 Auto-refreshes on data sync</div>
        </div>
      </div>
    </div>
  );
};

export default MarketNews; 