import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/button';
import { 
  BarChart3, TrendingUp, Target, Calendar, Award,
  ArrowUpRight, ArrowDownRight, Clock, Percent,
  CheckCircle2, AlertTriangle, Info, Activity
} from 'lucide-react';
import TechnicalFundamentalScreener, { 
  ScreeningTemplate, 
  ScreenedStock
} from '../../services/TechnicalFundamentalScreener';
import { UserExperienceLevel } from '../../utils/ux/UXLayersController';

interface ValidationData {
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  avgHoldingPeriod: number;
}

interface PerformanceValidationProps {
  templates: ScreeningTemplate[];
  screener: TechnicalFundamentalScreener;
  userLevel: UserExperienceLevel;
  currentResults: ScreenedStock[];
}

const PerformanceValidation: React.FC<PerformanceValidationProps> = ({
  templates,
  screener,
  userLevel,
  currentResults
}) => {
  const [validationData, setValidationData] = useState<Record<string, ValidationData>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Load validation data for all templates
  useEffect(() => {
    const loadValidationData = async () => {
      setIsValidating(true);
      const data: Record<string, ValidationData> = {};
      
      for (const template of templates) {
        try {
          const validation = await screener.validateScreeningPerformance(template);
          data[template.id] = validation;
        } catch (error) {
          console.error(`Validation error for ${template.id}:`, error);
        }
      }
      
      setValidationData(data);
      setIsValidating(false);
    };
    
    if (templates.length > 0) {
      loadValidationData();
    }
  }, [templates, screener]);

  // Get performance comparison with benchmark
  const getPerformanceComparison = () => {
    const spxReturn = 0.084; // S&P 500 baseline
    const results = Object.entries(validationData).map(([templateId, data]) => {
      const template = templates.find(t => t.id === templateId);
      return {
        template,
        data,
        outperformance: data.annualizedReturn - spxReturn,
        riskAdjustedReturn: data.sharpeRatio
      };
    });
    
    return results.sort((a, b) => b.outperformance - a.outperformance);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    const percentage = (value * 100).toFixed(1);
    return `${value >= 0 ? '+' : ''}${percentage}%`;
  };

  // Get risk rating
  const getRiskRating = (sharpeRatio: number, maxDrawdown: number) => {
    if (sharpeRatio > 0.8 && maxDrawdown < 0.15) return 'Low';
    if (sharpeRatio > 0.5 && maxDrawdown < 0.25) return 'Medium';
    return 'High';
  };

  // Get risk styling
  const getRiskStyle = (rating: string) => {
    switch (rating) {
      case 'Low':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'High':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const performanceComparison = getPerformanceComparison();

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Best Strategy</span>
          </div>
          {performanceComparison.length > 0 && (
            <div>
              <div className="font-bold text-blue-700">
                {performanceComparison[0].template?.name}
              </div>
              <div className="text-sm text-blue-600">
                {formatPercentage(performanceComparison[0].outperformance)} vs S&P 500
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">Avg Return</span>
          </div>
          <div className="font-bold text-green-700 text-xl">
            {performanceComparison.length > 0 
              ? formatPercentage(performanceComparison.reduce((sum, p) => sum + p.data.annualizedReturn, 0) / performanceComparison.length)
              : '0%'
            }
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Avg Sharpe</span>
          </div>
          <div className="font-bold text-purple-700 text-xl">
            {performanceComparison.length > 0 
              ? (performanceComparison.reduce((sum, p) => sum + p.data.sharpeRatio, 0) / performanceComparison.length).toFixed(2)
              : '0.00'
            }
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-900">Strategies</span>
          </div>
          <div className="font-bold text-yellow-700 text-xl">
            {templates.length}
          </div>
        </div>
      </div>

      {/* Strategy Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Strategy Performance Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isValidating ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
              <div className="text-gray-600">Validating strategies...</div>
            </div>
          ) : (
            <div className="space-y-4">
              {performanceComparison.map(({ template, data, outperformance }, index) => {
                if (!template) return null;
                
                const riskRating = getRiskRating(data.sharpeRatio, data.maxDrawdown);
                
                return (
                  <div
                    key={template.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedTemplate === template.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTemplate(
                      selectedTemplate === template.id ? null : template.id
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {index === 0 && <Award className="h-4 w-4 text-yellow-600" />}
                          <span className="font-semibold text-gray-900">{template.name}</span>
                        </div>
                        <Badge className={`text-xs ${getRiskStyle(riskRating)}`}>
                          {riskRating} Risk
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`font-bold ${outperformance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(data.annualizedReturn)}
                          </div>
                          <div className="text-xs text-gray-500">Annual Return</div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`font-bold flex items-center gap-1 ${outperformance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {outperformance >= 0 ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            {formatPercentage(outperformance)}
                          </div>
                          <div className="text-xs text-gray-500">vs S&P 500</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Performance Metrics Bar */}
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Sharpe Ratio</div>
                        <div className="font-medium">{data.sharpeRatio.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Max Drawdown</div>
                        <div className="font-medium">{formatPercentage(data.maxDrawdown)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Win Rate</div>
                        <div className="font-medium">{formatPercentage(data.winRate)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Avg Hold</div>
                        <div className="font-medium">{data.avgHoldingPeriod} days</div>
                      </div>
                    </div>
                    
                    {/* Expanded Details */}
                    {selectedTemplate === template.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Strategy Details</h4>
                          <div className="text-sm text-gray-600 mb-3">{template.description}</div>
                          
                          {/* Performance Chart Placeholder */}
                          <div className="bg-gray-50 border rounded-lg p-4 mb-4">
                            <div className="flex items-center justify-center h-32 text-gray-500">
                              <BarChart3 className="h-8 w-8 mr-2" />
                              <span>Performance Chart (Implementation placeholder)</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Level-specific insights */}
                        {userLevel === 'learning' && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="text-sm text-blue-800">
                              <Info className="h-4 w-4 inline mr-1" />
                              <strong>Beginner Insight:</strong> This {template.name} strategy 
                              {outperformance >= 0 
                                ? ` outperformed the market by ${formatPercentage(outperformance)} with ${riskRating.toLowerCase()} risk.`
                                : ` underperformed by ${formatPercentage(Math.abs(outperformance))} - consider safer alternatives.`
                              }
                            </div>
                          </div>
                        )}
                        
                        {userLevel === 'import' && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h5 className="font-medium text-gray-900 mb-2">Risk Metrics</h5>
                              <div className="space-y-1 text-sm">
                                <div>Volatility: {(data.maxDrawdown * 2).toFixed(1)}%</div>
                                <div>Risk-Adj Return: {(data.annualizedReturn / Math.abs(data.maxDrawdown)).toFixed(2)}</div>
                                <div>Consistency: {data.winRate > 0.6 ? 'High' : data.winRate > 0.45 ? 'Medium' : 'Low'}</div>
                              </div>
                            </div>
                            
                            <div>
                              <h5 className="font-medium text-gray-900 mb-2">Research Validation</h5>
                              <div className="space-y-1 text-sm">
                                <div>RSI Accuracy: 75%/72%</div>
                                <div>MACD Effectiveness: 68%-74%</div>
                                <div>MA Crossover: +5.4% returns</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Screening Performance */}
      {currentResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Current Screening Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Portfolio Composition</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Strong Buys:</span>
                    <span className="font-medium">
                      {currentResults.filter(s => s.recommendation === 'strong_buy').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Buys:</span>
                    <span className="font-medium">
                      {currentResults.filter(s => s.recommendation === 'buy').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Score:</span>
                    <span className="font-medium">
                      {(currentResults.reduce((sum, s) => sum + s.overallScore, 0) / currentResults.length).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Risk Distribution</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Low Risk:</span>
                    <span className="font-medium">
                      {currentResults.filter(s => s.riskLevel === 'low').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medium Risk:</span>
                    <span className="font-medium">
                      {currentResults.filter(s => s.riskLevel === 'medium').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>High Risk:</span>
                    <span className="font-medium">
                      {currentResults.filter(s => s.riskLevel === 'high').length}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">Research Validation</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Avg RSI Accuracy:</span>
                    <span className="font-medium">
                      {(currentResults.reduce((sum, s) => sum + s.rsiAccuracy, 0) / currentResults.length * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>MACD Effectiveness:</span>
                    <span className="font-medium">
                      {(currentResults.reduce((sum, s) => sum + s.macdEffectiveness, 0) / currentResults.length * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    <span className="text-green-700 text-xs">Research-validated indicators</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Research Methodology */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" />
            Research Methodology
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Technical Indicator Accuracy</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">RSI Oversold (&lt;30)</span>
                  <Badge className="bg-green-100 text-green-800">75% Accuracy</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">RSI Overbought (&gt;70)</span>
                  <Badge className="bg-green-100 text-green-800">72% Accuracy</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">MACD Trending Markets</span>
                  <Badge className="bg-blue-100 text-blue-800">74% Effective</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">Golden Cross (50/200 MA)</span>
                  <Badge className="bg-yellow-100 text-yellow-800">+5.4% Returns</Badge>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Fundamental Criteria</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">Benjamin Graham D/E &lt;1.1</span>
                  <Badge className="bg-purple-100 text-purple-800">Quality Filter</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">Current Ratio &gt;1.5</span>
                  <Badge className="bg-purple-100 text-purple-800">Liquidity</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">Revenue Growth &gt;5%</span>
                  <Badge className="bg-indigo-100 text-indigo-800">Growth</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">PEG Ratio &lt;2.0</span>
                  <Badge className="bg-indigo-100 text-indigo-800">Value</Badge>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <Info className="h-4 w-4 inline mr-1" />
              <strong>Note:</strong> All performance data is based on historical backtesting and research studies. 
              Past performance does not guarantee future results. These tools are for educational purposes 
              and should not be considered as investment advice.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceValidation; 