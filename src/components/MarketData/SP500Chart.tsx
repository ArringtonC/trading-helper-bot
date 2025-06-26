import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, ColorType, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { MarketDataService, PriceDataRequest } from '../../services/MarketDataService';
import { MonitoringService } from '../../services/MonitoringService';
import { SP500PriceData } from '../../services/DatabaseService';

interface SP500ChartProps {
  marketDataService: MarketDataService;
  marketData?: SP500PriceData[]; // Optional pre-loaded data
  height?: number;
  width?: number;
  className?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  showVolume?: boolean;
  theme?: 'light' | 'dark';
  onDataUpdate?: (data: SP500PriceData[]) => void;
  onError?: (error: Error) => void;
}

interface ChartState {
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  dataPoints: number;
}

const SP500Chart: React.FC<SP500ChartProps> = ({
  marketDataService,
  marketData,
  height = 400,
  width = '100%',
  className = '',
  dateRange,
  showVolume = true,
  theme = 'light',
  onDataUpdate,
  onError
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  
  const [chartState, setChartState] = useState<ChartState>({
    isLoading: true,
    error: null,
    lastUpdate: null,
    dataPoints: 0
  });

  // Chart configuration based on theme
  const chartOptions = {
    layout: {
      background: { 
        type: ColorType.Solid, 
        color: theme === 'dark' ? '#1F2937' : '#FFFFFF' 
      },
      textColor: theme === 'dark' ? '#F9FAFB' : '#374151',
    },
    grid: {
      vertLines: { 
        color: theme === 'dark' ? '#374151' : '#E5E7EB',
        style: 1,
        visible: true
      },
      horzLines: { 
        color: theme === 'dark' ? '#374151' : '#E5E7EB',
        style: 1,
        visible: true
      }
    },
    crosshair: {
      mode: 1
    },
    timeScale: {
      borderColor: theme === 'dark' ? '#4B5563' : '#D1D5DB',
      timeVisible: true,
      secondsVisible: false
    },
    rightPriceScale: {
      borderColor: theme === 'dark' ? '#4B5563' : '#D1D5DB',
      scaleMargins: {
        top: 0.1,
        bottom: showVolume ? 0.3 : 0.1
      }
    },
    handleScroll: {
      mouseWheel: true,
      pressedMouseMove: true,
      horzTouchDrag: true,
      vertTouchDrag: true
    },
    handleScale: {
      axisPressedMouseMove: true,
      mouseWheel: true,
      pinch: true
    }
  };

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: typeof width === 'number' ? width : chartContainerRef.current.clientWidth,
      height
    });

    chartRef.current = chart;

    // Create candlestick series - use correct v5 API
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10B981', // Green for up candles
      downColor: '#EF4444', // Red for down candles
      borderUpColor: '#10B981',
      borderDownColor: '#EF4444',
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444'
    });

    candlestickSeriesRef.current = candlestickSeries;

    // Create volume series if enabled - use correct v5 API
    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
        priceFormat: {
          type: 'volume'
        },
        priceScaleId: 'volume'
      });

      volumeSeriesRef.current = volumeSeries;

      // Configure the volume price scale
      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.7,
          bottom: 0
        }
      });
    }

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candlestickSeriesRef.current = null;
        volumeSeriesRef.current = null;
      }
    };
  }, [height, showVolume, theme]);

  // Load and update chart data
  const loadChartData = async () => {
    try {
      setChartState(prev => ({ ...prev, isLoading: true, error: null }));

      // Use pre-loaded data if available, otherwise fetch from service
      let priceData: SP500PriceData[];
      
      if (marketData && marketData.length > 0) {
        priceData = marketData;
      } else {
        const request: PriceDataRequest = dateRange ? {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        } : {};
        priceData = await marketDataService.getSP500Data(request);
      }

      if (priceData.length === 0) {
        setChartState(prev => ({
          ...prev,
          isLoading: false,
          error: 'No data available for the selected date range',
          dataPoints: 0
        }));
        return;
      }

      // Convert data to TradingView format
      const candlestickData: CandlestickData[] = priceData.map(item => ({
        time: item.date as Time,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close
      }));

      const volumeData = priceData.map(item => ({
        time: item.date as Time,
        value: item.volume,
        color: item.close >= item.open ? 
          (theme === 'dark' ? '#10B981' : '#10B981') : 
          (theme === 'dark' ? '#EF4444' : '#EF4444')
      }));

      // Update series data
      if (candlestickSeriesRef.current) {
        candlestickSeriesRef.current.setData(candlestickData);
      }

      if (volumeSeriesRef.current && showVolume) {
        volumeSeriesRef.current.setData(volumeData);
      }

      // Fit content to chart
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }

      setChartState({
        isLoading: false,
        error: null,
        lastUpdate: new Date(),
        dataPoints: priceData.length
      });

      // Notify parent component
      onDataUpdate?.(priceData);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load chart data';
      setChartState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMsg,
        dataPoints: 0
      }));
      onError?.(error instanceof Error ? error : new Error(errorMsg));
    }
  };

  // Load data when component mounts or dependencies change
  useEffect(() => {
    loadChartData();
  }, [marketDataService, dateRange]);

  // Listen to market data service events
  useEffect(() => {
    const handleDataUpdate = () => {
      loadChartData();
    };

    marketDataService.on('sp500:data:updated', handleDataUpdate);
    marketDataService.on('sync:completed', handleDataUpdate);

    return () => {
      marketDataService.off('sp500:data:updated', handleDataUpdate);
      marketDataService.off('sync:completed', handleDataUpdate);
    };
  }, [marketDataService]);

  // Manual refresh function
  const refreshData = async () => {
    await loadChartData();
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: typeof width === 'number' ? `${width}px` : width,
    height: `${height}px`
  };

  return (
    <div className={`sp500-chart ${className}`} style={containerStyle}>
      {/* Chart Header */}
      <div className={`flex items-center justify-between mb-2 px-2 ${
        theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
      }`}>
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">S&P 500 Index</h3>
          {chartState.lastUpdate && (
            <span className="text-sm opacity-75">
              Last updated: {chartState.lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {chartState.dataPoints > 0 && (
            <span className="text-sm opacity-75">
              {chartState.dataPoints} data points
            </span>
          )}
          
          <button
            onClick={refreshData}
            disabled={chartState.isLoading}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              chartState.isLoading
                ? 'bg-gray-300 cursor-not-allowed'
                : theme === 'dark'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {chartState.isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {chartState.isLoading && (
        <div className={`absolute inset-0 flex items-center justify-center ${
          theme === 'dark' ? 'bg-gray-900 bg-opacity-75' : 'bg-white bg-opacity-75'
        } z-10`}>
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className={theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}>
              Loading S&P 500 data...
            </span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {chartState.error && (
        <div className={`absolute inset-0 flex items-center justify-center ${
          theme === 'dark' ? 'bg-gray-900 bg-opacity-75' : 'bg-white bg-opacity-75'
        } z-10`}>
          <div className="text-center">
            <div className="text-red-500 text-lg mb-2">⚠️ Error</div>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
              {chartState.error}
            </div>
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div 
        ref={chartContainerRef} 
        className={`w-full border rounded-md ${
          theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
        }`}
        style={{ height: `${height}px` }}
      />

      {/* Chart Controls Footer */}
      <div className={`flex items-center justify-between mt-2 px-2 text-xs ${
        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
      }`}>
        <div className="flex items-center space-x-4">
          <span>📈 S&P 500 Price Chart</span>
          {showVolume && <span>📊 Volume included</span>}
        </div>
        
        <div className="flex items-center space-x-2">
          <span>🔄 Auto-refreshes on data sync</span>
        </div>
      </div>
    </div>
  );
};

export default SP500Chart;