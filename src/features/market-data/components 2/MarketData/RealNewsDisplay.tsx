import React from 'react';
import { MarketNewsData } from '../../../../shared/services/DatabaseService';

interface RealNewsDisplayProps {
  newsData: MarketNewsData[];
  selectedNewsId: number | null;
  onNewsClick: (newsId: number) => void;
  isLoading?: boolean;
}

const RealNewsDisplay: React.FC<RealNewsDisplayProps> = ({
  newsData,
  selectedNewsId,
  onNewsClick,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span>Loading market news...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">📰 Market News Events</h2>
        <span className="text-sm text-gray-500">
          {newsData.length} events
        </span>
      </div>
      
      <div className="space-y-4">
        {newsData.map((news) => (
          <div
            key={news.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedNewsId === news.id
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
            onClick={() => {
              if (news.id !== undefined) {
                onNewsClick(news.id);
              }
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {news.title}
                </h3>
                <p className="text-gray-700 mb-3">
                  {news.description}
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center space-x-1">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        news.impact_type === 'positive' ? 'bg-green-500' :
                        news.impact_type === 'negative' ? 'bg-red-500' : 'bg-gray-500'
                      }`}
                    />
                    <span className="capitalize">{news.impact_type} Impact</span>
                  </span>
                  <span>Relevance: {news.relevance_score}/10</span>
                  {news.distanceFromHighs !== undefined && news.distanceFromHighs !== null && (
                    <span className={`font-medium ${
                      news.distanceFromHighs >= -5 ? 'text-green-600' :
                      news.distanceFromHighs >= -15 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {news.distanceFromHighs >= 0 ? '+' : ''}{news.distanceFromHighs}% from highs
                    </span>
                  )}
                  <span>{news.source}</span>
                  <span>{new Date(news.date).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="ml-4">
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  news.category === 'fed_policy' ? 'bg-blue-100 text-blue-800' :
                  news.category === 'tariff' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {news.category.replace('_', ' ')}
                </span>
              </div>
            </div>
            
            {selectedNewsId === news.id && (
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-sm text-blue-600 mb-2">
                  📍 This event is highlighted on the chart above
                </p>
                {news.distanceFromHighs !== undefined && news.currentPrice && news.allTimeHigh && (
                  <div className="text-sm text-gray-600 mb-2 p-2 bg-gray-50 rounded">
                    <strong>Market Context:</strong> S&P 500 was at {news.currentPrice.toLocaleString()} 
                    ({news.distanceFromHighs >= 0 ? '+' : ''}{news.distanceFromHighs}% from all-time high of {news.allTimeHigh.toLocaleString()})
                    {news.distanceFromHighs <= -20 && <span className="text-red-600 font-medium"> - Bear Market Territory</span>}
                    {news.distanceFromHighs > -20 && news.distanceFromHighs <= -10 && <span className="text-yellow-600 font-medium"> - Correction Territory</span>}
                    {news.distanceFromHighs > -5 && <span className="text-green-600 font-medium"> - Near All-Time Highs</span>}
                  </div>
                )}
                {news.url && (
                  <a
                    href={news.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Read more at {news.source} →
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RealNewsDisplay; 