import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/Card';
import { Button } from '../../../../shared/components/ui/button';
// import { Badge } from '../../../../shared/components/ui/Badge';
import { TrendingUp, TrendingDown, Star, /* Info, ExternalLink */ } from 'lucide-react';

const CategoryDeepDive = ({ lists, selectedCategory, onSelectCategory, getCategoryIcon, getCategoryColor }: any) => {
  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatCurrency = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    return `$${value.toFixed(2)}`;
  };

  const currentList = lists[selectedCategory];
  if (!currentList) return null;

  return (
    <div className="space-y-6">
      {/* Category Selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.keys(lists).map((categoryKey) => {
          const list = lists[categoryKey];
          return (
            <Button
              key={categoryKey}
              variant={selectedCategory === categoryKey ? 'default' : 'outline'}
              className="flex items-center gap-2 p-3"
              onClick={() => onSelectCategory(categoryKey)}
            >
              {getCategoryIcon(categoryKey)}
              <span className="text-xs">{list.title}</span>
            </Button>
          );
        })}
      </div>

      {/* Selected Category Details */}
      <Card className={getCategoryColor(selectedCategory)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getCategoryIcon(selectedCategory)}
              <div>
                <CardTitle className="text-2xl">{currentList.title}</CardTitle>
                <p className="text-gray-600 mt-1">{currentList.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Update Frequency</div>
              <div className="font-medium">{currentList.updateFrequency}</div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Performance Overview */}
          {currentList.performance && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/60 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-700">
                  {formatPercentage(currentList.performance.ytd)}
                </div>
                <div className="text-sm text-gray-600">YTD Return</div>
              </div>
              <div className="bg-white/60 p-4 rounded-lg">
                <div className="flex items-center gap-1">
                  {currentList.performance.vsSpx > 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`text-2xl font-bold ${
                    currentList.performance.vsSpx > 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {formatPercentage(Math.abs(currentList.performance.vsSpx))}
                  </span>
                </div>
                <div className="text-sm text-gray-600">vs S&P 500</div>
              </div>
              <div className="bg-white/60 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">
                  {formatPercentage(currentList.performance.winRate)}
                </div>
                <div className="text-sm text-gray-600">Win Rate</div>
              </div>
              <div className="bg-white/60 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-700">
                  {currentList.stocks?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Total Stocks</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Details */}
      <div className="grid gap-4">
        <CardTitle className="text-xl">Individual Stock Analysis</CardTitle>
        {currentList.stocks?.map((stock: any, index: number) => (
          <Card key={stock.symbol} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Basic Info */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <span className="font-bold text-blue-800">{stock.symbol}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{stock.name}</h3>
                      <p className="text-sm text-gray-600">{stock.sector}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Price:</span>
                      <span className="font-medium">{formatCurrency(stock.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Change:</span>
                      <span className={`font-medium ${
                        stock.changePercent > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Market Cap:</span>
                      <span className="font-medium">{formatCurrency(stock.marketCap)}</span>
                    </div>
                  </div>
                </div>

                {/* Quality Metrics */}
                <div>
                  <h4 className="font-medium mb-3">Quality Scores</h4>
                  <div className="space-y-3">
                    {stock.qualityScore && (
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Quality Score</span>
                          <span className="text-sm font-medium">{stock.qualityScore}/10</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(stock.qualityScore / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {stock.ruleOf10Score && (
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Rule of 10 Score</span>
                          <span className="text-sm font-medium">{stock.ruleOf10Score}/10</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(stock.ruleOf10Score / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {stock.metrics && (
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span>ROIC:</span>
                          <span>{formatPercentage(stock.metrics.roic)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sales Growth:</span>
                          <span>{formatPercentage(stock.metrics.salesGrowth)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Gross Margin:</span>
                          <span>{formatPercentage(stock.metrics.grossMargin)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Investment Reasons */}
                <div>
                  <h4 className="font-medium mb-3">Key Investment Reasons</h4>
                  <div className="space-y-2">
                    {stock.reasons?.map((reason: string, reasonIndex: number) => (
                      <div key={reasonIndex} className="flex items-start gap-2">
                        <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{reason}</span>
                      </div>
                    ))}
                  </div>
                  
                  {stock.ytdReturn && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <div className="text-sm font-medium text-green-800">
                        YTD Performance: {formatPercentage(stock.ytdReturn)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CategoryDeepDive; 