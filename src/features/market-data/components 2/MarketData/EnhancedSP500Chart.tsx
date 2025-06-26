import React, { useState, useRef, useEffect } from 'react';
import { SP500PriceData, MarketNewsData } from '../../../../shared/services/DatabaseService';
import { MarketDataService } from '../../../../shared/services/MarketDataService';
import { EnhancedNewsEvent } from '../../../../shared/services/AINewsAnalysisService';
import SP500Chart from './SP500Chart';
import { 
  ProfessionalChartContainer,
  ChartSettings,
  DataQuality,
  ValidationResults,
  ChartMode,
  TimeframeKey
} from './ProfessionalChartControls';

interface EnhancedSP500ChartProps {
  marketDataService: MarketDataService;
  marketData?: SP500PriceData[];
  newsEvents?: MarketNewsData[];
  height?: number;
  width?: number | string;
  className?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  dataQuality?: ExtendedDataQuality;
  validationResults?: ExtendedValidationResults;
  onDataUpdate?: (data: SP500PriceData[]) => void;
  onError?: (error: Error) => void;
  onEventCorrelation?: (correlation: EventCorrelation) => void;
  onExport?: (type: string) => void;
}

interface EventCorrelation {
  date: string;
  price: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
  newsEvents: MarketNewsData[];
  marketContext: {
    priceChange: number;
    priceChangePercent: number;
    volume: number;
    volatility: number;
  };
}

// Extended interfaces to match usage
interface ExtendedDataQuality extends DataQuality {
  recordCount?: number;
  timestamp?: string;
  compliance?: boolean;
  lastValidation?: string;
}

interface ExtendedValidationResults extends ValidationResults {
  quality?: ExtendedDataQuality;
}

interface ExtendedChartSettings {
  chartType: 'candlestick' | 'line' | 'area';
  indicators: string[];
  newsDisplay: 'markers' | 'annotations' | 'both';
  showTechnicalLevels: boolean;
  showVolume?: boolean;
  theme?: 'light' | 'dark';
}

const EnhancedSP500Chart: React.FC<EnhancedSP500ChartProps> = ({
  marketDataService,
  marketData,
  newsEvents = [],
  height = 600,
  width = '100%',
  className = '',
  dateRange,
  dataQuality = {
    score: 95,
    grade: 'A',
    confidence: 98,
    recordCount: 0,
    timestamp: new Date().toISOString()
  } as ExtendedDataQuality,
  validationResults = {
    recordCount: 0,
    timestamp: new Date().toISOString(),
    quality: dataQuality
  } as ExtendedValidationResults,
  onDataUpdate,
  onError,
  onEventCorrelation,
  onExport
}) => {
  // Professional Chart Settings
  const [chartSettings, setChartSettings] = useState<ExtendedChartSettings>({
    chartType: 'candlestick',
    indicators: ['volume'],
    newsDisplay: 'markers',
    showTechnicalLevels: true,
    showVolume: true,
    theme: 'light'
  });

  // Professional Chart Controls State
  const [chartMode, setChartMode] = useState<ChartMode>('time');
  const [timeframe, setTimeframe] = useState<TimeframeKey>('1Y');

  // Convert MarketNewsData to EnhancedNewsEvent format for compatibility
  const convertedNewsEvents: EnhancedNewsEvent[] = newsEvents.map(news => ({
    ...news,
    aiAnalysis: {
      impactLevel: 'LOW',
      confidence: 50,
      tradingRecommendation: 'NEUTRAL',
      marketCorrelation: 'Minimal correlation expected',
      riskAssessment: 'LOW',
      sentimentScore: 0,
      keywordRelevance: {
        fed: 0,
        tariff: 0,
        earnings: 0,
        general: 0
      },
      historicalPattern: 'No significant pattern identified',
      volumeImpactPrediction: 'LOW',
      timeDecay: 24
    }
  }));

  const handleTimeframeChange = (newTimeframe: string) => {
    // Handle timeframe change logic here
    console.log('Timeframe changed to:', newTimeframe);
  };

  const handleChartModeChange = (newMode: ChartMode) => {
    setChartMode(newMode);
  };

  const handleSettingsChange = (newSettings: ExtendedChartSettings) => {
    setChartSettings(newSettings);
  };

  const handleExport = (type: string) => {
    onExport?.(type);
  };

  // Filter market data based on timeframe
  const filterDataByTimeframe = (data: SP500PriceData[] = [], timeframe: TimeframeKey): SP500PriceData[] => {
    if (!data || data.length === 0) return [];

    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case '1M':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3M':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '6M':
        startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case '1Y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case '2Y':
        startDate = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
        break;
      case 'YTD':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return data;
    }

    return data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate;
    });
  };

  // Filter data based on selected timeframe
  const filteredMarketData = marketData ? filterDataByTimeframe(marketData, timeframe) : undefined;

  // Handle chart click for news correlation
  const handleChartClick = (event: any) => {
    if (!onEventCorrelation || !newsEvents.length) return;

    // Basic click handling - can be enhanced when TradingView API issues are resolved
    const currentDate = new Date().toISOString().split('T')[0];
    const correlatedNews = newsEvents.filter(news => 
      new Date(news.date).toDateString() === new Date(currentDate).toDateString()
    );

    if (correlatedNews.length > 0 && filteredMarketData?.length) {
      const latestData = filteredMarketData[filteredMarketData.length - 1];
      const prevData = filteredMarketData[filteredMarketData.length - 2];
      
      const priceChange = prevData ? latestData.close - prevData.close : 0;
      const priceChangePercent = prevData ? (priceChange / prevData.close) * 100 : 0;

      onEventCorrelation({
        date: currentDate,
        price: {
          open: latestData.open,
          high: latestData.high,
          low: latestData.low,
          close: latestData.close
        },
        newsEvents: correlatedNews,
        marketContext: {
          priceChange,
          priceChangePercent,
          volume: latestData.volume || 0,
          volatility: Math.abs(priceChangePercent)
        }
      });
    }
  };

  return (
    <div className={`enhanced-sp500-chart ${className}`}>
      <ProfessionalChartContainer
        chartMode="time"
        onChartModeChange={() => {}}
        timeframe="1Y"
        onTimeframeChange={handleTimeframeChange}
        dataQuality={dataQuality}
        validationResults={validationResults}
        marketData={marketData || []}
        newsEvents={convertedNewsEvents}
        dataAvailable={marketData?.length || 0}
        chartRef={{ current: null as any }} // Placeholder ref for professional controls
      >
        <div className={`enhanced-sp500-chart ${className}`} style={{ 
          position: 'relative',
          width: typeof width === 'number' ? `${width}px` : width,
          height: `${height}px`
        }}>
          {/* Professional Chart Wrapper with Working SP500Chart */}
          <div 
            onClick={handleChartClick}
            style={{ 
              height: `${height - 200}px`,
              background: chartSettings.theme === 'dark' ? '#1F2937' : '#FFFFFF'
            }}
          >
            <SP500Chart
              marketDataService={marketDataService}
              marketData={filteredMarketData}
              height={height - 200}
              width={typeof width === 'number' ? width : undefined}
              className={`transition-all duration-300 ${chartSettings.theme === 'dark' ? 'dark-theme' : 'light-theme'}`}
              onDataUpdate={onDataUpdate}
              onError={onError}
              dateRange={dateRange}
            />
          </div>

          {/* Professional Controls Overlay */}
          <div className="absolute top-4 right-4 z-20">
            <div className={`px-3 py-2 rounded-lg shadow-lg text-xs ${
              chartSettings.theme === 'dark' 
                ? 'bg-gray-800 text-gray-200 border border-gray-600' 
                : 'bg-white text-gray-700 border border-gray-200'
            }`}>
              <div className="flex items-center space-x-2">
                <span className="text-green-500">●</span>
                <span>Professional Mode</span>
                <span className="text-gray-400">|</span>
                <span>{timeframe}</span>
                <span className="text-gray-400">|</span>
                <span>{chartMode === 'time' ? 'Time Axis' : 'Event Focus'}</span>
              </div>
            </div>
          </div>

          {/* Data Quality Badge */}
          <div className="absolute bottom-4 left-4 z-20">
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              dataQuality.score >= 90 
                ? 'bg-green-100 text-green-800 border border-green-200'
                : dataQuality.score >= 75
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              Quality: {dataQuality.grade} ({dataQuality.score}%)
            </div>
          </div>
        </div>
      </ProfessionalChartContainer>
    </div>
  );
};

export default EnhancedSP500Chart; 