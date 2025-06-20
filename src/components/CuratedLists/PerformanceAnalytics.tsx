import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/button';
import { Badge } from '../ui/Badge';
import { BarChart3, TrendingUp, Target, Calendar, RefreshCw } from 'lucide-react';

const PerformanceAnalytics = ({ service, lists, selectedListId, onListSelect }: any) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1Y');
  const [updateStats, setUpdateStats] = useState({ listsUpdated: 0, stocksAdded: 0, stocksRemoved: 0, performanceImpact: 0 });

  const timeframes = ['1M', '3M', '6M', '1Y'];

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;

  const performanceData = service.calculateListPerformance('overall', selectedTimeframe);

  const handleSimulateUpdate = () => {
    const stats = service.simulateWeeklyUpdate();
    setUpdateStats(stats);
  };

  return (
    <div className="space-y-6">
      {/* Timeframe Selection */}
      <div className="flex items-center gap-4">
        <span className="font-medium">Time Period:</span>
        <div className="flex gap-2">
          {timeframes.map((timeframe) => (
            <Button
              key={timeframe}
              variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
              className="px-3 py-1"
              onClick={() => setSelectedTimeframe(timeframe)}
            >
              {timeframe}
            </Button>
          ))}
        </div>
      </div>

      {/* Overall Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-700">
                  {formatPercentage(performanceData.return)}
                </div>
                <div className="text-sm text-green-600">Portfolio Return</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-700">
                  {formatPercentage(performanceData.benchmark)}
                </div>
                <div className="text-sm text-blue-600">S&P 500 Benchmark</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-700">
                  +{formatPercentage(performanceData.outperformance)}
                </div>
                <div className="text-sm text-purple-600">Outperformance</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Performance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Category Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(lists).map(([categoryKey, listData]: [string, any]) => {
              if (!listData.performance) return null;
              
              return (
                <div key={categoryKey} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{listData.title}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {listData.updateFrequency}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-700">
                        {formatPercentage(listData.performance.ytd)}
                      </div>
                      <div className="text-xs text-gray-600">YTD Return</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">vs S&P 500</div>
                      <div className={`font-medium ${
                        listData.performance.vsSpx > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {listData.performance.vsSpx > 0 ? '+' : ''}
                        {formatPercentage(listData.performance.vsSpx)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Win Rate</div>
                      <div className="font-medium text-blue-600">
                        {formatPercentage(listData.performance.winRate)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Stocks</div>
                      <div className="font-medium">
                        {listData.stocks?.length || 0}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Update Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Update Simulation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleSimulateUpdate}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Simulate Weekly Update
              </Button>
              
              {updateStats && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Lists Updated:</span>
                    <span className="font-medium">{updateStats.listsUpdated}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stocks Added:</span>
                    <span className="font-medium text-green-600">+{updateStats.stocksAdded}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stocks Removed:</span>
                    <span className="font-medium text-red-600">-{updateStats.stocksRemoved}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Performance Impact:</span>
                    <span className="font-medium text-blue-600">
                      +{formatPercentage(updateStats.performanceImpact)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Genetic Algorithm Validation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-700">28.41%</div>
                <div className="text-sm text-purple-600">Genetic Algorithm Return</div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Validation Status:</span>
                  <Badge variant="default" className="bg-green-600">
                    Passed
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Quality Control:</span>
                  <span className="font-medium text-green-600">✓ Active</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Review:</span>
                  <span className="font-medium">Weekly</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Risk-Adjusted Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold">1.85</div>
              <div className="text-sm text-gray-600">Sharpe Ratio</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold">12.5%</div>
              <div className="text-sm text-gray-600">Volatility</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold">-8.2%</div>
              <div className="text-sm text-gray-600">Max Drawdown</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold">0.92</div>
              <div className="text-sm text-gray-600">Beta</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceAnalytics; 