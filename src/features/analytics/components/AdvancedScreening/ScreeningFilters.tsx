import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/Card';
import { Badge } from '../../../../shared/components/ui/Badge';
import { Button } from '../../../../shared/components/ui/button';
import { 
  TrendingUp, BarChart3, DollarSign, Target, 
  AlertCircle, Info, ChevronDown, ChevronRight,
  Settings, Sliders, Activity, PieChart, RefreshCw, Search
} from 'lucide-react';
import { ScreeningCriteria } from '../../../../shared/services/TechnicalFundamentalScreener';
import { UserExperienceLevel } from '../../../../shared/utils/ux/UXLayersController';

interface ScreeningFiltersProps {
  criteria: ScreeningCriteria;
  onChange: (criteria: ScreeningCriteria) => void;
  userLevel: UserExperienceLevel;
  onScreen: () => void;
  isScreening: boolean;
  levelConfig: {
    title: string;
    description: string;
    maxFilters: number;
    showAdvanced: boolean;
    complexityNote: string;
  };
}

const ScreeningFilters: React.FC<ScreeningFiltersProps> = ({
  criteria,
  onChange,
  userLevel,
  onScreen,
  isScreening,
  levelConfig
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    technical: true,
    fundamental: true,
    advanced: false,
    risk: false,
    quality: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Update criteria functions
  const updateTechnical = (field: string, value: any) => {
    onChange({
      ...criteria,
      technical: {
        ...criteria.technical,
        [field]: value
      }
    });
  };

  const updateFundamental = (field: string, value: any) => {
    onChange({
      ...criteria,
      fundamental: {
        ...criteria.fundamental,
        [field]: value
      }
    });
  };

  // Add new update functions for risk and quality filters
  const updateRisk = (field: string, value: any) => {
    onChange({
      ...criteria,
      risk: {
        ...criteria.risk,
        [field]: value
      }
    });
  };

  const updateQuality = (field: string, value: any) => {
    onChange({
      ...criteria,
      quality: {
        ...criteria.quality,
        [field]: value
      }
    });
  };

  // Level-based filter configurations
  const getFilterConfig = () => {
    switch (userLevel) {
      case 'learning':
        return {
          technical: [
            { key: 'rsiRange', label: 'RSI Range (Oversold/Overbought)', type: 'range', min: 0, max: 100 },
            { key: 'priceRange', label: 'Price Range ($)', type: 'range', min: 10, max: 200 },
            { key: 'volumeThreshold', label: 'Min Daily Volume', type: 'number', min: 100000 }
          ],
          fundamental: [
            { key: 'maxDebtToEquity', label: 'Max Debt/Equity Ratio', type: 'number', max: 2.0 },
            { key: 'minCurrentRatio', label: 'Min Current Ratio', type: 'number', min: 1.0 },
            { key: 'minMarketCap', label: 'Min Market Cap ($B)', type: 'select', options: [1, 10, 50, 100] }
          ]
        };
      case 'import':
        return {
          technical: [
            { key: 'rsiRange', label: 'RSI Range', type: 'range', min: 0, max: 100 },
            { key: 'macdSignal', label: 'MACD Signal', type: 'select', options: ['any', 'bullish', 'bearish'] },
            { key: 'goldenCross', label: 'Golden Cross (50/200 MA)', type: 'boolean' },
            { key: 'priceRange', label: 'Price Range ($)', type: 'range', min: 5, max: 500 },
            { key: 'volumeThreshold', label: 'Min Daily Volume', type: 'number', min: 100000 }
          ],
          fundamental: [
            { key: 'maxDebtToEquity', label: 'Max Debt/Equity', type: 'number', max: 3.0 },
            { key: 'minCurrentRatio', label: 'Min Current Ratio', type: 'number', min: 0.8 },
            { key: 'minRevenueGrowth', label: 'Min Revenue Growth (%)', type: 'number', min: 0 },
            { key: 'maxPegRatio', label: 'Max PEG Ratio', type: 'number', max: 5.0 },
            { key: 'minMarketCap', label: 'Min Market Cap ($B)', type: 'select', options: [0.1, 1, 3, 10, 50] }
          ]
        };
      case 'broker':
        return {
          technical: [
            { key: 'rsiRange', label: 'RSI (14-period)', type: 'range', min: 0, max: 100 },
            { key: 'rsi9Range', label: 'RSI (9-period)', type: 'range', min: 0, max: 100 },
            { key: 'macdSignal', label: 'MACD Signal', type: 'select', options: ['any', 'bullish', 'bearish'] },
            { key: 'goldenCross', label: 'Golden Cross', type: 'boolean' },
            { key: 'bollingerPosition', label: 'Bollinger Band Position', type: 'select', options: ['any', 'lower', 'middle', 'upper'] },
            { key: 'priceRange', label: 'Price Range ($)', type: 'range', min: 1, max: 1000 },
            { key: 'volumeThreshold', label: 'Min Daily Volume', type: 'number', min: 10000 },
            { key: 'emaCrossover', label: 'EMA Crossover (20/50)', type: 'boolean' },
            { key: 'volumeSpike', label: 'Volume Spike (%)', type: 'number', min: 0, max: 500 },
            { key: 'volatilityRange', label: 'Volatility Range (%)', type: 'range', min: 0, max: 100 }
          ],
          fundamental: [
            { key: 'maxDebtToEquity', label: 'Max Debt/Equity', type: 'number', max: 5.0 },
            { key: 'minCurrentRatio', label: 'Min Current Ratio', type: 'number', min: 0.5 },
            { key: 'minRevenueGrowth', label: 'Min Revenue Growth (%)', type: 'number', min: -50 },
            { key: 'maxPegRatio', label: 'Max PEG Ratio', type: 'number', max: 10.0 },
            { key: 'minMarketCap', label: 'Min Market Cap ($M)', type: 'select', options: [100, 500, 1000, 3000, 10000] },
            { key: 'maxPEGRatio', label: 'Max P/E Ratio', type: 'number', max: 100 },
            { key: 'minROIC', label: 'Min ROIC (%)', type: 'number', min: -50 },
            { key: 'minProfitMargin', label: 'Min Profit Margin (%)', type: 'number', min: -50 },
            { key: 'minOperatingMargin', label: 'Min Operating Margin (%)', type: 'number', min: -50 },
            { key: 'minEarningsGrowth', label: 'Min Earnings Growth (%)', type: 'number', min: -100 },
            { key: 'maxBeta', label: 'Max Beta', type: 'number', max: 5.0 },
            { key: 'minDividendYield', label: 'Min Dividend Yield (%)', type: 'number', min: 0 }
          ],
          risk: [
            { key: 'maxDrawdown', label: 'Max Drawdown (%)', type: 'number', max: 100 },
            { key: 'minSharpeRatio', label: 'Min Sharpe Ratio', type: 'number', min: 0 },
            { key: 'maxBeta', label: 'Max Beta', type: 'number', max: 5.0 },
            { key: 'minAlpha', label: 'Min Alpha (%)', type: 'number', min: -50 },
            { key: 'maxCorrelation', label: 'Max Correlation', type: 'number', max: 1.0 }
          ],
          quality: [
            { key: 'minROE', label: 'Min ROE (%)', type: 'number', min: -50 },
            { key: 'minROA', label: 'Min ROA (%)', type: 'number', min: -50 },
            { key: 'maxDebtToEquity', label: 'Max Debt/Equity', type: 'number', max: 5.0 },
            { key: 'minInterestCoverage', label: 'Min Interest Coverage', type: 'number', min: 0 },
            { key: 'minCashFlowGrowth', label: 'Min Cash Flow Growth (%)', type: 'number', min: -100 }
          ]
        };
      default:
        return { technical: [], fundamental: [] };
    }
  };

  const filterConfig = getFilterConfig();

  // Render filter input based on type
  const renderFilterInput = (filter: any, section: 'technical' | 'fundamental' | 'risk' | 'quality') => {
    const currentValue = section === 'technical' ? criteria.technical : section === 'fundamental' ? criteria.fundamental : section === 'risk' ? criteria.risk : criteria.quality;
    const updateFn = section === 'technical' ? updateTechnical : section === 'fundamental' ? updateFundamental : section === 'risk' ? updateRisk : updateQuality;

    switch (filter.type) {
      case 'range':
        const rangeValue = (currentValue?.[filter.key as keyof typeof currentValue] || { min: 0, max: 100 }) as { min: number; max: number };
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-500">Min</label>
                <input
                  type="number"
                  min={filter.min}
                  max={filter.max}
                  value={rangeValue?.min || filter.min}
                  onChange={(e) => updateFn(filter.key, { ...rangeValue, min: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500">Max</label>
                <input
                  type="number"
                  min={filter.min}
                  max={filter.max}
                  value={rangeValue?.max || filter.max}
                  onChange={(e) => updateFn(filter.key, { ...rangeValue, max: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            
            {/* RSI Accuracy Info */}
            {filter.key === 'rsiRange' && (
              <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                <Info className="h-3 w-3 inline mr-1" />
                Research: 75% accuracy for oversold (&lt;30), 72% for overbought (&gt;70)
              </div>
            )}
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            min={filter.min || 0}
            max={filter.max || undefined}
            step={filter.step || 'any'}
            value={(currentValue?.[filter.key as keyof typeof currentValue] || 0) as number}
            onChange={(e) => updateFn(filter.key, Number(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
        );

      case 'select':
        return (
          <select
            value={(currentValue?.[filter.key as keyof typeof currentValue] || "") as string}
            onChange={(e) => updateFn(filter.key, e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
          >
            {filter.options.map((option: any) => (
              <option key={option} value={option}>
                {typeof option === 'number' && filter.key.includes('MarketCap') 
                  ? `$${option}${filter.key.includes('$B') ? 'B' : option >= 1000 ? 'B' : 'M'}`
                  : option}
              </option>
            ))}
          </select>
        );

      case 'boolean':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={(currentValue?.[filter.key as keyof typeof currentValue] || false) as boolean}
              onChange={(e) => updateFn(filter.key, e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Enable {filter.label}</span>
            
            {/* Golden Cross Info */}
            {filter.key === 'goldenCross' && (
              <div className="text-xs text-green-600 ml-2">
                (5.4% historical returns)
              </div>
            )}
          </label>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Complexity</span>
          </div>
          <div className="text-xs text-blue-700 mt-1">{levelConfig.complexityNote}</div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">Max Filters</span>
          </div>
          <div className="text-lg font-bold text-green-700">
            {levelConfig.maxFilters === Infinity ? '∞' : levelConfig.maxFilters}
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-900">RSI Range</span>
          </div>
          <div className="text-lg font-bold text-yellow-700">
            {criteria.technical.rsiRange.min}-{criteria.technical.rsiRange.max}
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Price Range</span>
          </div>
          <div className="text-lg font-bold text-purple-700">
            ${criteria.technical.priceRange.min}-${criteria.technical.priceRange.max}
          </div>
        </div>
      </div>

      {/* Technical Filters */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Technical Analysis
          </CardTitle>
          <Button
            variant="outline"
            
            onClick={() => toggleSection('technical')}
          >
            {expandedSections.technical ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CardHeader>
        {expandedSections.technical && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filterConfig.technical?.map((filter) => (
                <div key={filter.key} className="space-y-2">
                  <label className="text-sm font-medium">{filter.label}</label>
                  {renderFilterInput(filter, 'technical')}
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Fundamental Filters */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Fundamental Analysis
          </CardTitle>
          <Button
            variant="outline"
            
            onClick={() => toggleSection('fundamental')}
          >
            {expandedSections.fundamental ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CardHeader>
        {expandedSections.fundamental && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filterConfig.fundamental?.map((filter) => (
                <div key={filter.key} className="space-y-2">
                  <label className="text-sm font-medium">{filter.label}</label>
                  {renderFilterInput(filter, 'fundamental')}
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Risk Filters - Only for broker level */}
      {userLevel === 'broker' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Risk Management
            </CardTitle>
            <Button
              variant="outline"
              
              onClick={() => toggleSection('risk')}
            >
              {expandedSections.risk ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CardHeader>
          {expandedSections.risk && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filterConfig.risk?.map((filter) => (
                  <div key={filter.key} className="space-y-2">
                    <label className="text-sm font-medium">{filter.label}</label>
                    {renderFilterInput(filter, 'risk')}
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Quality Filters - Only for broker level */}
      {userLevel === 'broker' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Quality Metrics
            </CardTitle>
            <Button
              variant="outline"
              
              onClick={() => toggleSection('quality')}
            >
              {expandedSections.quality ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CardHeader>
          {expandedSections.quality && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filterConfig.quality?.map((filter) => (
                  <div key={filter.key} className="space-y-2">
                    <label className="text-sm font-medium">{filter.label}</label>
                    {renderFilterInput(filter, 'quality')}
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Screen Button */}
      <div className="flex justify-end">
        <Button
          onClick={onScreen}
          disabled={isScreening}
          className="w-full md:w-auto"
        >
          {isScreening ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Screening...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Screen Stocks
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ScreeningFilters; 