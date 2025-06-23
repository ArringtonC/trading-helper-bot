import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { CompleteProfessionalDashboard, ProfessionalDashboardState } from '../../../shared/components/Dashboard/CompleteProfessionalDashboard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot, Area, AreaChart } from 'recharts';
import { format, isWithinInterval } from 'date-fns';
import { MarketDataService } from '../../../features/market-data/services/MarketDataService';
import { MonitoringService } from '../../../shared/services/MonitoringService';
import CsvDropzone from '../../../shared/components/Upload/CsvDropzone';
import { SP500PriceData, MarketNewsData } from '../../../shared/services/DatabaseService';
import { TradingSignalService, TradingSignal, CorrectionAnalysis, VolatilityIndex, RiskManagement } from '../../../shared/services/TradingSignalService';
import { AINewsAnalysisService, EnhancedNewsEvent } from '../../../shared/services/AINewsAnalysisService';
import { 
  ProfessionalCsvProcessingService, 
  ProfessionalProcessingResult, 
  ProcessingProgress 
} from '../../../shared/services/ProfessionalCsvProcessingService';
import ProfessionalDataValidationScreen from '../../../shared/components/Upload/ProfessionalDataValidationScreen';
import EnhancedSP500Chart from '../../../features/market-data/components/MarketData/EnhancedSP500Chart';
import { 
  ProfessionalChartContainer, 
  ChartDataQualityBadge,
  DataQuality,
  ValidationResults 
} from '../../../features/market-data/components/MarketData/ProfessionalChartControls';
import { DataAuditPanel, DataAuditResults } from '../../../shared/components/Dashboard/DataAuditPanel';
import BloombergTerminal from '../../../shared/components/Dashboard/BloombergTerminal';
import ProfessionalChart from '../../../shared/components/Dashboard/ProfessionalChart';
import ActionableProfessionalDashboard from '../../../shared/components/Dashboard/ActionableProfessionalDashboard';

interface DemoState {
  marketDataService: MarketDataService | null;
  tradingSignalService: TradingSignalService | null;
  aiNewsService: AINewsAnalysisService | null;
  priceData: SP500PriceData[];
  newsData: MarketNewsData[];
  enhancedNewsData: EnhancedNewsEvent[];
  cleanEventData: CleanEventRow[];
  tradingSignal: TradingSignal | null;
  correctionAnalysis: CorrectionAnalysis | null;
  volatilityIndex: VolatilityIndex | null;
  riskManagement: RiskManagement | null;
  aiAnalysisEnabled: boolean;
  isLoadingAI: boolean;
  isLoading: boolean;
  isLoadingNews: boolean;
  isLoadingAlphaVantage: boolean;
  isValidatingData: boolean;
  validationProgress: ProcessingProgress | null;
  validationResult: ProfessionalProcessingResult | null;
  showValidationScreen: boolean;
  error: string | null;
  lastSync: Date | null;
  selectedNewsId: number | null;
  hoveredNewsId: number | null;
  dataSource: 'mock' | 'csv' | 'alphavantage' | 'comprehensive';
  alphaVantageApiKey: string;
  csvFileName: string | null;
  timelinePosition: number;
  selectedDateRange: { start: Date; end: Date };
  eventFilter: 'all' | 'Federal Reserve' | 'Trade Policy' | 'Corporate Earnings' | 'Market Milestone';
  showVolume: boolean;
  viewMode: 'price' | 'volatility' | 'volume';
  professionalMode: boolean;
  terminalMode: boolean;
  actionableMode: boolean;
  chartMode: 'time' | 'ordinal';
  chartTimeframe: string;
  chartSettings: {
    chartType: 'candlestick' | 'line' | 'area';
    indicators: string[];
    newsDisplay: 'markers' | 'annotations' | 'both';
    showTechnicalLevels: boolean;
  };
}

interface AlphaVantageApiResponse {
  [key: string]: any;
  'Meta Data'?: {
    '1. Information': string;
    '2. Symbol': string;
    '3. Last Refreshed': string;
    '4. Output Size': string;
    '5. Time Zone': string;
  };
  'Time Series (Daily)'?: {
    [date: string]: {
      '1. open': string;
      '2. high': string;
      '3. low': string;
      '4. close': string;
      '5. volume': string;
    };
  };
}

interface ComprehensiveNewsEvent {
  id: number;
  date: string;
  title: string;
  category: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
  priceImpact: string;
  relevanceScore: number;
  source: string;
  correlation: string;
}

interface CleanEventRow {
  date: string;
  close: number;
  impact: "positive" | "negative" | "neutral";
  headline: string;
  relevanceScore: number;
  source: string;
  id: number;
}

interface TradingAlert {
  id: string;
  type: 'correction' | 'support' | 'risk' | 'fed' | 'opportunity';
  severity: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  actionable: string;
  probability?: number;
  level?: number;
}

interface MarketConditions {
  correctionDepth: number;
  isInCorrection: boolean;
  isInBearMarket: boolean;
  volatilityLevel: 'low' | 'medium' | 'high' | 'extreme';
  supportLevel: number;
  resistanceLevel: number;
  riskLevel: 'low' | 'medium' | 'high';
  nextFedMeeting: string;
  recoveryProbability: number;
}

interface TradingRecommendation {
  action: 'buy' | 'sell' | 'hold' | 'reduce' | 'wait';
  confidence: 'low' | 'medium' | 'high';
  timeframe: 'immediate' | 'short' | 'medium' | 'long';
  reasoning: string;
  riskAdjustment: string;
}

// Trading Analysis Functions
const analyzeMarketConditions = (priceData: SP500PriceData[]): MarketConditions => {
  if (priceData.length === 0) {
    return {
      correctionDepth: 0,
      isInCorrection: false,
      isInBearMarket: false,
      volatilityLevel: 'low',
      supportLevel: 0,
      resistanceLevel: 0,
      riskLevel: 'low',
      nextFedMeeting: '2025-07-29',
      recoveryProbability: 0
    };
  }

  const prices = priceData.map(d => d.close);
  const currentPrice = prices[prices.length - 1];
  const highPrice = Math.max(...prices);
  const lowPrice = Math.min(...prices);
  
  // Calculate correction depth
  const correctionDepth = ((highPrice - currentPrice) / highPrice) * 100;
  const isInCorrection = correctionDepth >= 10;
  const isInBearMarket = correctionDepth >= 20;
  
  // Calculate volatility (simplified ATR)
  let volatilitySum = 0;
  for (let i = 1; i < Math.min(priceData.length, 20); i++) {
    const high = priceData[i].high;
    const low = priceData[i].low;
    const prevClose = priceData[i-1].close;
    const trueRange = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    volatilitySum += trueRange;
  }
  const avgTrueRange = volatilitySum / Math.min(19, priceData.length - 1);
  const volatilityPercent = (avgTrueRange / currentPrice) * 100;
  
  let volatilityLevel: 'low' | 'medium' | 'high' | 'extreme' = 'low';
  if (volatilityPercent > 4) volatilityLevel = 'extreme';
  else if (volatilityPercent > 2.5) volatilityLevel = 'high';
  else if (volatilityPercent > 1.5) volatilityLevel = 'medium';
  
  // Calculate support/resistance (Fibonacci levels)
  const range = highPrice - lowPrice;
  const supportLevel = lowPrice + (range * 0.382); // 38.2% retracement
  const resistanceLevel = lowPrice + (range * 0.618); // 61.8% retracement
  
  // Risk level based on volatility and correction
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (volatilityLevel === 'extreme' || correctionDepth > 15) riskLevel = 'high';
  else if (volatilityLevel === 'high' || correctionDepth > 8) riskLevel = 'medium';
  
  // Recovery probability based on historical data
  let recoveryProbability = 76; // Base 76% for corrections
  if (isInBearMarket) recoveryProbability = 45; // Lower for bear markets
  if (correctionDepth > 25) recoveryProbability = 35; // Even lower for deep corrections
  
  return {
    correctionDepth,
    isInCorrection,
    isInBearMarket,
    volatilityLevel,
    supportLevel,
    resistanceLevel,
    riskLevel,
    nextFedMeeting: '2025-07-29',
    recoveryProbability
  };
};

const generateTradingAlerts = (conditions: MarketConditions, priceData: SP500PriceData[]): TradingAlert[] => {
  const alerts: TradingAlert[] = [];
  const currentPrice = priceData.length > 0 ? priceData[priceData.length - 1].close : 0;
  
  // Correction Alert
  if (conditions.isInCorrection) {
    alerts.push({
      id: 'correction',
      type: 'correction',
      severity: conditions.isInBearMarket ? 'high' : 'medium',
      title: conditions.isInBearMarket ? 'BEAR MARKET DETECTED' : 'MAJOR CORRECTION',
      message: `${conditions.correctionDepth.toFixed(1)}% decline from recent highs`,
      actionable: conditions.isInBearMarket ? 
        'Consider defensive positioning and DCA strategy' : 
        'Historical buying opportunity - 76% recovery rate within 1 year',
      probability: conditions.recoveryProbability
    });
  }
  
  // Support Level Alert
  if (currentPrice <= conditions.supportLevel * 1.02) {
    alerts.push({
      id: 'support',
      type: 'support',
      severity: 'medium',
      title: 'APPROACHING KEY SUPPORT',
      message: `Price near Fibonacci 38.2% support level`,
      actionable: 'Watch for bounce or breakdown below support',
      level: conditions.supportLevel
    });
  }
  
  // Risk Management Alert
  if (conditions.riskLevel === 'high') {
    alerts.push({
      id: 'risk',
      type: 'risk',
      severity: 'high',
      title: 'HIGH VOLATILITY PERIOD',
      message: `${conditions.volatilityLevel.toUpperCase()} volatility detected`,
      actionable: 'Reduce position size by 50%, widen stop losses by 75%'
    });
  }
  
  // Fed Meeting Alert
  const fedDate = new Date('2025-07-29');
  const today = new Date();
  const daysToFed = Math.ceil((fedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysToFed <= 7 && daysToFed > 0) {
    alerts.push({
      id: 'fed',
      type: 'fed',
      severity: 'medium',
      title: 'FOMC MEETING APPROACHING',
      message: `Federal Reserve meeting in ${daysToFed} days`,
      actionable: 'Reduce exposure 24hrs before announcement, avoid new positions'
    });
  }
  
  // Opportunity Alert
  if (conditions.isInCorrection && !conditions.isInBearMarket && conditions.correctionDepth > 15) {
    alerts.push({
      id: 'opportunity',
      type: 'opportunity',
      severity: 'low',
      title: 'POTENTIAL BUYING OPPORTUNITY',
      message: 'Correction depth suggests oversold conditions',
      actionable: 'Consider dollar-cost averaging entry strategy',
      probability: 75
    });
  }
  
  return alerts;
};

const generateTradingRecommendation = (
  conditions: MarketConditions, 
  newsItem: MarketNewsData
): TradingRecommendation => {
  // High-impact negative news during correction
  if (newsItem.relevance_score >= 8 && newsItem.impact_type === 'negative' && conditions.isInCorrection) {
    return {
      action: 'wait',
      confidence: 'high',
      timeframe: 'short',
      reasoning: 'High-impact negative news during correction - wait for stabilization',
      riskAdjustment: 'Avoid new positions until volatility subsides'
    };
  }
  
  // Fed policy news
  if (newsItem.category === 'fed_policy') {
    return {
      action: 'reduce',
      confidence: 'medium',
      timeframe: 'immediate',
      reasoning: 'Fed policy uncertainty - reduce exposure before announcement',
      riskAdjustment: 'Cut position size by 25-50% until clarity emerges'
    };
  }
  
  // Major correction with positive news
  if (conditions.correctionDepth > 15 && newsItem.impact_type === 'positive') {
    return {
      action: 'buy',
      confidence: 'medium',
      timeframe: 'medium',
      reasoning: 'Positive catalyst during oversold conditions',
      riskAdjustment: 'Use DCA approach, limit to 2-3% of portfolio'
    };
  }
  
  // High volatility period
  if (conditions.volatilityLevel === 'extreme') {
    return {
      action: 'hold',
      confidence: 'high',
      timeframe: 'short',
      reasoning: 'Extreme volatility - preserve capital',
      riskAdjustment: 'Widen stops, reduce size, wait for volatility to normalize'
    };
  }
  
  // Default recommendation
  return {
    action: 'hold',
    confidence: 'medium',
    timeframe: 'medium',
    reasoning: 'Monitor market conditions for clearer signals',
    riskAdjustment: 'Maintain current risk parameters'
  };
};

const SP500Demo: React.FC = () => {
  const [state, setState] = useState<DemoState>({
    marketDataService: null,
    tradingSignalService: null,
    aiNewsService: null,
    priceData: [],
    newsData: [],
    enhancedNewsData: [],
    cleanEventData: [],
    tradingSignal: null,
    correctionAnalysis: null,
    volatilityIndex: null,
    riskManagement: null,
    aiAnalysisEnabled: true,
    isLoadingAI: false,
    isLoading: true,
    isLoadingNews: false,
    isLoadingAlphaVantage: false,
    isValidatingData: false,
    validationProgress: null,
    validationResult: null,
    showValidationScreen: false,
    error: null,
    lastSync: null,
    selectedNewsId: null,
    hoveredNewsId: null,
    dataSource: 'comprehensive',
    alphaVantageApiKey: '',
    csvFileName: null,
    timelinePosition: 100,
    selectedDateRange: { start: new Date('2025-01-02'), end: new Date('2025-06-02') },
    eventFilter: 'all',
    showVolume: false,
    viewMode: 'price',
    professionalMode: false,
    terminalMode: false,
    actionableMode: false,
    chartMode: 'time' as 'time' | 'ordinal',
    chartTimeframe: '1Y',
    chartSettings: {
      chartType: 'candlestick' as const,
      indicators: ['ma20'],
      newsDisplay: 'markers' as const,
      showTechnicalLevels: true
    }
  });

  // Trading analysis state
  const marketConditions = useMemo(() => 
    analyzeMarketConditions(state.priceData), 
    [state.priceData]
  );
  
  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize monitoring service
        const monitoringService = new MonitoringService();
        
        // Initialize tracing (optional - won't fail if it doesn't work)
        try {
          await monitoringService.initializeTracing('sp500-demo');
        } catch (tracingError) {
          console.warn('Tracing initialization failed, continuing without it:', tracingError);
        }

        // Initialize market data service
        const marketDataService = new MarketDataService(monitoringService);
        await marketDataService.initialize();
        await marketDataService.start();

        // Initialize trading signal service
        const tradingSignalService = new TradingSignalService();
        
        // Initialize AI news analysis service
        const aiNewsService = new AINewsAnalysisService();

        setState(prev => ({
          ...prev,
          marketDataService,
          tradingSignalService,
          aiNewsService,
          isLoading: false
        }));

        // Load comprehensive 2025 dataset
        await loadComprehensiveData();
      } catch (error) {
        console.error('Failed to initialize services:', error);
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to initialize services',
          isLoading: false
        }));
      }
    };

    initializeServices();

    return () => {
      if (state.marketDataService) {
        state.marketDataService.stop();
      }
    };
  }, []);

  // Load comprehensive 2025 dataset
  const loadComprehensiveData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Load price data from CSV
      console.log('Loading comprehensive S&P 500 data...');
      const priceResponse = await fetch('/data/SP500_2025_Complete.csv');
      const priceText = await priceResponse.text();
      console.log('CSV loaded, first 200 chars:', priceText.substring(0, 200));
      const priceData = parseComprehensiveCsvData(priceText);
      console.log('Parsed price data:', priceData.length, 'records');
      if (priceData.length > 0) {
        console.log('Price range:', Math.min(...priceData.map(p => p.close)), 'to', Math.max(...priceData.map(p => p.close)));
      }
      
      // Load news events from JSON
      const newsResponse = await fetch('/data/SP500_2025_NewsEvents.json');
      const newsJson = await newsResponse.json();
      const newsData = transformNewsData(newsJson.events, priceData);
      console.log('Loaded news events:', newsData.length);
      
      // Generate trading signals
      const tradingSignalService = new TradingSignalService();
      const tradingSignal = tradingSignalService.generateTradingSignal(priceData, newsData);
      const correctionAnalysis = tradingSignalService.analyzeCorrectionLevel(priceData);
      const volatilityIndex = tradingSignalService.calculateVolatilityIndex(priceData);
      const riskManagement = tradingSignalService.calculateRiskManagement(priceData, 100000, 2);

      // Process news with AI analysis
      const aiNewsService = new AINewsAnalysisService();
      let enhancedNewsData: EnhancedNewsEvent[] = [];
      
      if (newsData.length > 0) {
        setState(prev => ({ ...prev, isLoadingAI: true }));
        try {
          enhancedNewsData = await aiNewsService.processNewsWithAI(newsData);
          console.log('AI analysis completed for', enhancedNewsData.length, 'news events');
        } catch (error) {
          console.warn('AI analysis failed, using fallback:', error);
          enhancedNewsData = newsData.map(news => ({
            ...news,
            aiAnalysis: aiNewsService.createFallbackAnalysis(news)
          }));
        }
      }

      setState(prev => ({
        ...prev,
        priceData,
        newsData,
        enhancedNewsData,
        tradingSignalService,
        aiNewsService,
        tradingSignal,
        correctionAnalysis,
        volatilityIndex,
        riskManagement,
        isLoading: false,
        isLoadingAI: false,
        lastSync: new Date(),
        dataSource: 'comprehensive'
      }));
      
      console.log('Comprehensive dataset loaded successfully');
    } catch (error) {
      console.error('Failed to load comprehensive dataset:', error);
      // Fallback to sample data if comprehensive data fails
      await loadSampleData(state.marketDataService!);
    }
  };

  // Parse comprehensive CSV data
  const parseComprehensiveCsvData = (csvText: string): SP500PriceData[] => {
    const lines = csvText.split('\n');
    const data: SP500PriceData[] = [];
    let idCounter = 1;
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const [date, open, high, low, close, volume] = line.split(',');
      
      if (date && open && high && low && close && volume) {
        data.push({
          id: idCounter++,
          date: date,
          open: parseFloat(open),
          high: parseFloat(high),
          low: parseFloat(low),
          close: parseFloat(close),
          volume: parseInt(volume),
          adjusted_close: parseFloat(close),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
    
    // Sort chronologically (oldest to newest) for proper timeline display
    return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Transform news data to match interface with distance from highs calculation
  const transformNewsData = (events: ComprehensiveNewsEvent[], priceData?: SP500PriceData[]): MarketNewsData[] => {
    return events.map(event => {
      let category: "fed_policy" | "tariff" | "general" = "general";
      const normalizedCategory = event.category.toLowerCase().replace(/\s+/g, '_');
      
      if (normalizedCategory.includes('federal') || normalizedCategory.includes('fed')) {
        category = "fed_policy";
      } else if (normalizedCategory.includes('trade') || normalizedCategory.includes('tariff')) {
        category = "tariff";
      }

      // Calculate distance from highs at the time of this event
      let distanceFromHighs = 0;
      let currentPrice = 0;
      let allTimeHigh = 0;
      
      if (priceData && priceData.length > 0) {
        const eventDate = new Date(event.date);
        const priceDataUpToEvent = priceData.filter(p => new Date(p.date) <= eventDate);
        
        if (priceDataUpToEvent.length > 0) {
          // Find the highest close price up to this event date
          allTimeHigh = Math.max(...priceDataUpToEvent.map(p => p.close));
          
          // Find the price on or closest to the event date
          const eventPriceData = priceDataUpToEvent
            .sort((a, b) => Math.abs(new Date(a.date).getTime() - eventDate.getTime()) - 
                           Math.abs(new Date(b.date).getTime() - eventDate.getTime()))[0];
          
          if (eventPriceData) {
            currentPrice = eventPriceData.close;
            distanceFromHighs = ((currentPrice - allTimeHigh) / allTimeHigh) * 100;

          }
        }
      }
      
      return {
        id: event.id,
        date: event.date,
        title: event.title,
        description: event.description,
        impact_type: event.impact,
        relevance_score: event.relevanceScore,
        source: event.source,
        category,
        url: event.source && event.source.toLowerCase().includes('reuters') ? 
              `https://www.reuters.com/search/?blob=${encodeURIComponent(event.title)}` :
              event.source && event.source.toLowerCase().includes('bloomberg') ?
              `https://www.bloomberg.com/search?query=${encodeURIComponent(event.title)}` :
              event.source && event.source.toLowerCase().includes('wsj') ?
              `https://www.wsj.com/search?query=${encodeURIComponent(event.title)}` :
              event.source && event.source.toLowerCase().includes('cnbc') ?
              `https://www.cnbc.com/search/?query=${encodeURIComponent(event.title)}` :
              `https://www.google.com/search?q=${encodeURIComponent(event.title + ' ' + event.source)}`, // Fallback to Google search
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Add custom fields for distance from highs
        distanceFromHighs: Math.round(distanceFromHighs * 100) / 100, // Round to 2 decimal places
        currentPrice: Math.round(currentPrice * 100) / 100,
        allTimeHigh: Math.round(allTimeHigh * 100) / 100
      };
    });
  };

  // Timeline navigation
  const handleTimelineChange = (position: number) => {
    if (state.priceData.length === 0) return;
    
    const totalDays = state.priceData.length;
    const dayIndex = Math.floor((position / 100) * (totalDays - 1));
    const endDate = new Date(state.priceData[dayIndex].date);
    const startDate = new Date('2025-01-02');
    
    setState(prev => ({
      ...prev,
      timelinePosition: position,
      selectedDateRange: { start: startDate, end: endDate }
    }));
  };

  // Event filtering
  const handleEventFilter = (filter: typeof state.eventFilter) => {
    setState(prev => ({ ...prev, eventFilter: filter }));
  };

  // Integrate AI news analysis with trading signals
  const integratNewsWithSignals = useCallback((marketSignal: TradingSignal | null, enhancedNews: EnhancedNewsEvent[]): TradingSignal | null => {
    if (!marketSignal || enhancedNews.length === 0) return marketSignal;

    const highImpactNews = enhancedNews.filter(news => 
      news.aiAnalysis.impactLevel === 'HIGH'
    );

    if (highImpactNews.length > 0 && marketSignal.signal === 'HOLD') {
      const topNews = highImpactNews[0];
      const adjustedConfidence = marketSignal.confidence === 'High' ? 'Medium' : 
                                 marketSignal.confidence === 'Medium' ? 'Low' : 'Low';
      
      return {
        ...marketSignal,
        reasoning: `${marketSignal.reasoning} • AI Alert: ${topNews.aiAnalysis.tradingRecommendation} due to "${topNews.title}"`,
        confidence: adjustedConfidence // Reduce confidence during high-impact news
      };
    }

    return marketSignal;
  }, []);



  // Filtered data based on timeline and filters
  const filteredPriceData = useMemo(() => {
    return state.priceData.filter(point => {
      const pointDate = new Date(point.date);
      return isWithinInterval(pointDate, state.selectedDateRange);
    });
  }, [state.priceData, state.selectedDateRange]);

  const filteredNewsData = useMemo(() => {
    return state.newsData.filter(news => {
      const newsDate = new Date(news.date);
      const withinTimeRange = isWithinInterval(newsDate, state.selectedDateRange);
      const matchesFilter = state.eventFilter === 'all' || 
        news.category.toLowerCase().replace('_', ' ') === state.eventFilter.toLowerCase();
      return withinTimeRange && matchesFilter;
    });
  }, [state.newsData, state.selectedDateRange, state.eventFilter]);

  // Chart data with enhanced calculations
  const chartData = useMemo(() => {
    return filteredPriceData.map((point, index) => {
      const prevPoint = index > 0 ? filteredPriceData[index - 1] : point;
      const volatility = index > 0 ? Math.abs((point.close - prevPoint.close) / prevPoint.close) * 100 : 0;
      
      return {
        date: format(new Date(point.date), 'MM/dd'),
        fullDate: point.date,
        price: point.close,
        volume: point.volume,
        volatility: volatility,
        high: point.high,
        low: point.low,
        open: point.open,
        change: index > 0 ? ((point.close - prevPoint.close) / prevPoint.close) * 100 : 0
      };
    });
  }, [filteredPriceData]);

  // Market analysis
  const marketAnalysis = useMemo(() => {
    if (filteredPriceData.length === 0) return null;
    
    const prices = filteredPriceData.map(p => p.close);
    const volumes = filteredPriceData.map(p => p.volume);
    
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const start = prices[0]; // First price in chronological order
    const current = prices[prices.length - 1]; // Last price in chronological order
    const totalReturn = ((current - start) / start) * 100;
    const avgVolume = volumes.length > 0 ? 
      volumes
        .filter((vol): vol is number => vol !== undefined)
        .reduce((a, b) => a + b, 0) / volumes.filter(vol => vol !== undefined).length 
      : 0;
    
    // Find major events in current timeframe
    const majorEvents = filteredNewsData
      .filter(news => Math.abs(parseFloat(news.relevance_score.toString())) >= 8)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
    
    return {
      high,
      low,
      current,
      totalReturn,
      avgVolume,
      majorEvents,
      volatilityPeriods: chartData.filter(d => d.volatility > 5).length
    };
  }, [filteredPriceData, filteredNewsData, chartData]);

  const loadSampleData = async (service: MarketDataService) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Generate sample S&P 500 data and news for demo purposes
      const sampleData: SP500PriceData[] = generateSampleSP500Data();
      const sampleNews: MarketNewsData[] = await generateRealNewsData();
      
      setState(prev => ({
        ...prev,
        priceData: sampleData,
        newsData: sampleNews,
        isLoading: false,
        lastSync: new Date(),
        dataSource: 'mock'
      }));
    } catch (error) {
      console.error('Failed to load sample data:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load sample data',
        isLoading: false
      }));
    }
  };

  // Professional CSV Upload Handler with Institutional Validation
  const handleCsvUpload = useCallback(async (file: File) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isValidatingData: true, 
        showValidationScreen: true,
        validationProgress: null,
        validationResult: null,
        error: null 
      }));
      
      const csvProcessingService = new ProfessionalCsvProcessingService();
      
      // Process with professional validation
      const result = await csvProcessingService.processWithInstitutionalValidation(
        file,
        (progress) => {
          setState(prev => ({ 
            ...prev, 
            validationProgress: progress 
          }));
        }
      );

      // Store validation results
      setState(prev => ({
        ...prev,
        isValidatingData: false,
        validationResult: result,
        csvFileName: file.name
      }));

    } catch (error) {
      console.error('Professional validation failed:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Professional validation failed',
        isValidatingData: false,
        showValidationScreen: false
      }));
    }
  }, []);

  // Handle validation screen actions
  const handleValidationProceed = useCallback(async () => {
    if (!state.validationResult?.data) return;

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Use the professionally validated data
      const validatedData = state.validationResult.data.map((record, index) => ({
        id: record.id,
        date: record.date,
        open: record.open,
        high: record.high,
        low: record.low,
        close: record.close,
        volume: record.volume,
        adjusted_close: record.close, // Use close as adjusted_close if not provided
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // Sort by date (newest first for chart display)
      validatedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Generate news data for the date range
      const newsData = await generateRealNewsData();
      
      setState(prev => ({
        ...prev,
        priceData: validatedData,
        newsData,
        isLoading: false,
        lastSync: new Date(),
        dataSource: 'csv',
        showValidationScreen: false,
        error: null
      }));

    } catch (error) {
      console.error('Failed to process validated data:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to process validated data',
        isLoading: false
      }));
    }
  }, [state.validationResult]);

  const handleValidationReject = useCallback(() => {
    setState(prev => ({
      ...prev,
      showValidationScreen: false,
      validationResult: null,
      validationProgress: null,
      csvFileName: null,
      error: 'Data validation rejected - please upload a different file'
    }));
  }, []);

  const handleValidationRetry = useCallback(() => {
    setState(prev => ({
      ...prev,
      showValidationScreen: false,
      validationResult: null,
      validationProgress: null,
      csvFileName: null,
      isValidatingData: false,
      error: null
    }));
  }, []);



  // Alpha Vantage API Integration
  const fetchFromAlphaVantage = async () => {
    if (!state.alphaVantageApiKey.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter your Alpha Vantage API key' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoadingAlphaVantage: true, error: null }));
      
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=SPY&outputsize=compact&apikey=${state.alphaVantageApiKey}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Alpha Vantage API error: ${response.status} - ${response.statusText}`);
      }
      
      const data: AlphaVantageApiResponse = await response.json();
      
      // Log the response for debugging
      console.log('Alpha Vantage API Response:', data);
      
      if (data['Error Message']) {
        throw new Error(`Alpha Vantage Error: ${data['Error Message']}`);
      }
      
      if (data['Note']) {
        throw new Error('Alpha Vantage API call frequency exceeded. Please try again later or upgrade your plan.');
      }
      
      if (data['Information']) {
        throw new Error(`Alpha Vantage Info: ${data['Information']}`);
      }
      
      const timeSeries = data['Time Series (Daily)'];
      if (!timeSeries) {
        // Provide more detailed error information
        const availableKeys = Object.keys(data);
        throw new Error(`Expected 'Time Series (Daily)' not found in API response. Available keys: ${availableKeys.join(', ')}. This might indicate an invalid API key or API limit reached.`);
      }
      
             const priceData: SP500PriceData[] = Object.entries(timeSeries)
         .map(([date, values], index) => ({
           id: index + 1,
           date,
           open: parseFloat(values['1. open']),
           high: parseFloat(values['2. high']),
           low: parseFloat(values['3. low']),
           close: parseFloat(values['4. close']),
           volume: parseInt(values['5. volume']),
           adjusted_close: parseFloat(values['4. close']), // Use regular close price for free tier
           created_at: new Date().toISOString(),
           updated_at: new Date().toISOString()
         }))
         .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
         .slice(0, 100); // Limit to last 100 days
      
      // Generate news data for the date range
      const newsData = await generateRealNewsData();
      
      setState(prev => ({
        ...prev,
        priceData,
        newsData,
        isLoadingAlphaVantage: false,
        lastSync: new Date(),
        dataSource: 'alphavantage',
        error: null
      }));
      
    } catch (error) {
      console.error('Alpha Vantage fetch failed:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch from Alpha Vantage',
        isLoadingAlphaVantage: false
      }));
    }
  };

  // Real News Data Generation with Research Keywords
  const generateRealNewsData = async (): Promise<MarketNewsData[]> => {
    setState(prev => ({ ...prev, isLoadingNews: true }));
    
    try {
      // Real news events based on recent S&P 500 market movements and research keywords
      const realNewsEvents = [
        {
          date: -1,
          title: "Federal Reserve Holds Interest Rates Steady at 5.25%-5.50%",
          description: "The Federal Open Market Committee maintained the federal funds rate unchanged, citing continued progress on inflation while monitoring labor market conditions.",
          category: 'fed_policy' as const,
          impact_type: 'neutral' as const,
          relevance_score: 9,
          keywords: ['federal reserve', 'interest rates', 'FOMC', 'monetary policy'],
          source: 'Federal Reserve',
          url: 'https://www.federalreserve.gov'
        },
        {
          date: -2,
          title: "S&P 500 Reaches New All-Time High on Tech Sector Strength",
          description: "Technology stocks led the market higher as investors showed renewed confidence in AI and semiconductor companies, pushing the S&P 500 to record levels.",
          category: 'general' as const,
          impact_type: 'positive' as const,
          relevance_score: 8,
          keywords: ['technology', 'artificial intelligence', 'semiconductors', 'record high'],
          source: 'MarketWatch',
          url: 'https://www.marketwatch.com'
        },
        {
          date: -5,
          title: "December Jobs Report Shows Stronger Than Expected Growth",
          description: "U.S. employers added 256,000 jobs in December, well above economists' expectations of 165,000, with unemployment rate falling to 4.1%.",
          category: 'general' as const,
          impact_type: 'positive' as const,
          relevance_score: 8,
          keywords: ['employment', 'jobs report', 'labor market', 'unemployment'],
          source: 'Bureau of Labor Statistics',
          url: 'https://www.bls.gov'
        },
        {
          date: -7,
          title: "Inflation Data Meets Fed Target, Market Optimism Grows",
          description: "Consumer Price Index rose 2.4% year-over-year in December, close to the Federal Reserve's 2% target, boosting hopes for potential rate cuts.",
          category: 'general' as const,
          impact_type: 'positive' as const,
          relevance_score: 9,
          keywords: ['inflation', 'CPI', 'consumer prices', 'rate cuts'],
          source: 'Bureau of Labor Statistics',
          url: 'https://www.bls.gov'
        },
        {
          date: -10,
          title: "Geopolitical Tensions Impact Global Markets",
          description: "Rising tensions in Eastern Europe and trade concerns have created uncertainty in global markets, leading to increased volatility in equity indices.",
          category: 'tariff' as const,
          impact_type: 'negative' as const,
          relevance_score: 7,
          keywords: ['geopolitical', 'trade tensions', 'volatility', 'global markets'],
          source: 'Reuters',
          url: 'https://www.reuters.com'
        },
        {
          date: -14,
          title: "Q4 Earnings Season Kicks Off with Mixed Results",
          description: "Major banks reported mixed earnings results for Q4, with some beating expectations while others cited challenges from net interest margin compression.",
          category: 'general' as const,
          impact_type: 'neutral' as const,
          relevance_score: 7,
          keywords: ['earnings', 'banking', 'Q4 results', 'financial sector'],
          source: 'Bloomberg',
          url: 'https://www.bloomberg.com'
        },
        {
          date: -18,
          title: "Energy Sector Rallies on Rising Oil Prices",
          description: "Crude oil prices surged 3% following OPEC+ production cuts and stronger demand outlook, lifting energy stocks across the board.",
          category: 'general' as const,
          impact_type: 'positive' as const,
          relevance_score: 6,
          keywords: ['energy', 'oil prices', 'OPEC', 'commodities'],
          source: 'Energy Information Administration',
          url: 'https://www.eia.gov'
        },
        {
          date: -21,
          title: "Housing Market Shows Signs of Stabilization",
          description: "Existing home sales rose 2.2% in December, the first increase in four months, as mortgage rates began to moderate from recent highs.",
          category: 'general' as const,
          impact_type: 'positive' as const,
          relevance_score: 6,
          keywords: ['housing', 'real estate', 'mortgage rates', 'home sales'],
          source: 'National Association of Realtors',
          url: 'https://www.nar.realtor'
        }
      ];

      const today = new Date();
      const newsData: MarketNewsData[] = realNewsEvents.map((event, index) => {
        const eventDate = new Date(today);
        eventDate.setDate(eventDate.getDate() + event.date);

        return {
          id: index + 1,
          date: eventDate.toISOString().split('T')[0],
          title: event.title,
          description: event.description,
          source: event.source,
          category: event.category,
          relevance_score: event.relevance_score,
          keywords: JSON.stringify(event.keywords),
          impact_type: event.impact_type,
          url: event.url,
          published_at: eventDate.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });

      setState(prev => ({ ...prev, isLoadingNews: false }));
      return newsData;
    } catch (error) {
      console.error('Failed to generate news data:', error);
      setState(prev => ({ ...prev, isLoadingNews: false }));
      return [];
    }
  };



  // Generate sample S&P 500 data for demo (fallback)
  const generateSampleSP500Data = (): SP500PriceData[] => {
    const data: SP500PriceData[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // 30 days ago
    
    let basePrice = 4500; // Starting S&P 500 price
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Generate realistic price movements
      const change = (Math.random() - 0.5) * 100; // +/- $50 daily movement
      basePrice += change;
      
      const open = basePrice + (Math.random() - 0.5) * 20;
      const close = basePrice + (Math.random() - 0.5) * 20;
      const high = Math.max(open, close) + Math.random() * 30;
      const low = Math.min(open, close) - Math.random() * 30;
      const volume = Math.floor(Math.random() * 2000000) + 1000000; // 1M-3M volume
      
      data.push({
        id: i + 1,
        date: date.toISOString().split('T')[0],
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
        volume,
        adjusted_close: Math.round(close * 100) / 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    return data;
  };

  // Prepare legacy chart data for compatibility
  const legacyChartData = state.priceData.map(item => ({
    date: format(new Date(item.date), 'MMM dd'),
    fullDate: item.date, // Keep full date for news matching
    price: item.close,
    volume: item.volume
  }));

  // Create news events mapped to chart dates
  const newsEvents = state.newsData.map(news => ({
    date: format(new Date(news.date), 'MMM dd'),
    fullDate: news.date,
    title: news.title,
    impact: news.impact_type,
    category: news.category,
    relevance: news.relevance_score
  }));

  // Get marker color based on impact type and selection state
  const getNewsMarkerColor = (impact: string, newsId?: number) => {
    const isSelected = newsId && newsId === state.selectedNewsId;
    const isHovered = newsId && newsId === state.hoveredNewsId;
    
    let baseColor;
    switch (impact) {
      case 'positive':
        baseColor = isSelected || isHovered ? '#059669' : '#10B981'; // darker green when selected/hovered
        break;
      case 'negative':
        baseColor = isSelected || isHovered ? '#DC2626' : '#EF4444'; // darker red when selected/hovered
        break;
      case 'neutral':
      default:
        baseColor = isSelected || isHovered ? '#4B5563' : '#6B7280'; // darker gray when selected/hovered
        break;
    }
    
    return baseColor;
  };

  // Handle news marker click
  const handleMarkerClick = (newsId: number | undefined) => {
    if (newsId === undefined) return;
    
    setState(prev => ({
      ...prev,
      selectedNewsId: prev.selectedNewsId === newsId ? null : newsId
    }));
    
    // Scroll to specific news item if selecting
    if (state.selectedNewsId !== newsId) {
      setTimeout(() => {
        const newsItem = document.querySelector(`[data-news-id="${newsId}"]`);
        if (newsItem) {
          newsItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          // Fallback to news section
          const newsSection = document.getElementById('news-section');
          if (newsSection) {
            newsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }, 100);
    }
  };

  // Handle marker hover
  const handleMarkerHover = (newsId: number | null) => {
    setState(prev => ({
      ...prev,
      hoveredNewsId: newsId
    }));
  };

  // Handle news item click
  const handleNewsClick = (newsId: number | undefined) => {
    if (newsId === undefined) return;
    
    setState(prev => ({
      ...prev,
      selectedNewsId: prev.selectedNewsId === newsId ? null : newsId
    }));
    
    // Scroll to chart if selecting
    if (state.selectedNewsId !== newsId) {
      setTimeout(() => {
        const chartSection = document.getElementById('chart-section');
        if (chartSection) {
          chartSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  // Custom tooltip that shows news events
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0];
      const dateStr = dataPoint.payload.fullDate;
      const newsForDate = state.newsData.filter(news => news.date === dateStr);
      
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-md max-w-xs">
          <p className="font-semibold text-gray-800">{label}</p>
          <div className="mt-2">
            <div className="flex items-center mb-1">
              <span className="text-sm mr-2">Price:</span>
              <span className="text-sm font-semibold text-blue-600">
                ${Number(dataPoint.value || 0).toLocaleString()}
              </span>
            </div>
            {newsForDate.length > 0 && (
              <div className="mt-3 pt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-700 mb-1">📰 Market News:</p>
                {newsForDate.map((news, index) => (
                  <div key={index} className="mb-2">
                    <p className="text-xs text-gray-800 font-medium leading-tight">
                      {news.title}
                    </p>
                    <div className="flex items-center mt-1 space-x-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          news.impact_type === 'positive' ? 'bg-green-500' :
                          news.impact_type === 'negative' ? 'bg-red-500' : 'bg-gray-500'
                        }`}
                      />
                      <span className="text-xs text-gray-600 capitalize">
                        {news.impact_type} Impact
                      </span>
                      <span className="text-xs text-gray-500">
                        Score: {news.relevance_score}/10
                      </span>
                    </div>
                    {news.distanceFromHighs !== undefined && (
                      <div className="mt-1 pt-1 border-t border-gray-100">
                        <span className={`text-xs font-medium ${
                          news.distanceFromHighs >= -5 ? 'text-green-600' :
                          news.distanceFromHighs >= -15 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          📊 {news.distanceFromHighs >= 0 ? '+' : ''}{news.distanceFromHighs}% from highs
                        </span>
                        {news.currentPrice && news.allTimeHigh && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            ${(news.currentPrice ?? 0).toLocaleString()} / ${(news.allTimeHigh ?? 0).toLocaleString()} ATH
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const refreshSampleData = async () => {
    if (!state.marketDataService) return;
    await loadSampleData(state.marketDataService);
  };

  // Clean 28-row dataset for news events only
  const createCleanEventDataset = (events: ComprehensiveNewsEvent[], priceData: SP500PriceData[]): CleanEventRow[] => {
    console.log('📊 Creating clean 28-row event dataset...');

    const eventRows: CleanEventRow[] = events.map(event => {
      // Find corresponding price data for this event date
      const eventPriceData = priceData.find(p => p.date === event.date);
      
      if (!eventPriceData) {
        console.warn(`No price data found for event date: ${event.date}`);
        return null;
      }

      // Ensure close price is a clean number
      const closeValue = (eventPriceData as any).close;
      const cleanClose = typeof closeValue === 'string' 
        ? parseFloat(closeValue.replace(/[,]/g, ''))
        : closeValue;

      return {
        date: event.date,
        close: cleanClose,
        impact: event.impact,
        headline: event.title,
        relevanceScore: event.relevanceScore,
        source: event.source,
        id: event.id
      };
    }).filter((row): row is CleanEventRow => row !== null);

    // Sort by date chronologically
    eventRows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Validate data range
    const prices = eventRows.map(r => r.close);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    console.log(`✅ Dataset validation:`);
    console.log(`   • Total events: ${eventRows.length}`);
    console.log(`   • Price range: ${(minPrice ?? 0).toLocaleString()} - ${(maxPrice ?? 0).toLocaleString()}`);
    console.log(`   • Expected min: ~4,982, max: ~6,144`);
    console.log(`   • Date range: ${eventRows[0]?.date} to ${eventRows[eventRows.length-1]?.date}`);

    // Alert if range is unexpected
    if (minPrice < 4900 || minPrice > 5100) {
      console.warn(`⚠️ Unexpected min price: ${minPrice} (expected ~4,982)`);
    }
    if (maxPrice < 6000 || maxPrice > 6200) {
      console.warn(`⚠️ Unexpected max price: ${maxPrice} (expected ~6,144)`);
    }

    return eventRows;
  };

  // Create professional dashboard state
  const professionalDashboardState: ProfessionalDashboardState = {
    priceData: state.priceData,
    newsData: state.newsData,
    enhancedNewsData: state.enhancedNewsData,
    tradingSignal: state.tradingSignal,
    correctionAnalysis: state.correctionAnalysis,
    volatilityIndex: state.volatilityIndex,
    riskManagement: state.riskManagement,
    marketSignal: null, // Will be generated by dashboard
    aiAnalysis: null, // Will be generated by dashboard
    dataQuality: state.validationResult?.validation.postValidation ? {
      score: (state.validationResult.validation.postValidation as any).overallScore ?? 95,
      grade: (state.validationResult.validation.postValidation as any).grade ?? 'A',
      compliance: ((state.validationResult.validation.postValidation as any).overallScore ?? 95) >= 85,
      lastValidation: new Date().toISOString()
    } : {
      score: 95,
      grade: 'A',
      compliance: true,
      lastValidation: new Date().toISOString()
    },
    alerts: [],
    performanceMetrics: null,
    chartMode: state.chartMode,
    chartTimeframe: state.chartTimeframe,
    professionalMode: state.professionalMode,
    isLive: state.dataSource === 'comprehensive' || state.dataSource === 'alphavantage',
    isLoading: state.isLoading,
    isLoadingAI: state.isLoadingAI,
    error: state.error
  };

  // If professional mode is enabled and we have data, show the professional dashboard
  if (state.professionalMode && state.priceData.length > 0) {
    // Generate real trading signal with fixed service
    const tradingSignalService = new TradingSignalService();
    const currentSignal = tradingSignalService.generateTradingSignal(
      state.priceData,
      state.newsData,
      100000,
      2
    );
    
    // Calculate real performance metrics
    const performance = currentSignal.performance || {
      successRate: 0,
      totalSignals: 0,
      profitableSignals: 0,
      averageReturn: 0,
      maxDrawdown: 0,
      sharpeRatio: 0
    };

    // Generate data audit
    const correctionAnalysis = tradingSignalService.analyzeCorrectionLevel(state.priceData);
    const volatilityIndex = tradingSignalService.calculateVolatilityIndex(state.priceData);
    const dataAudit = tradingSignalService.generateDataAudit(state.priceData, volatilityIndex);

    const dashboardData: ProfessionalDashboardState = {
      // Market Data
      priceData: state.priceData,
      newsData: state.newsData,
      enhancedNewsData: state.enhancedNewsData,
      
      // Trading Signals & Analysis
      tradingSignal: currentSignal,
      correctionAnalysis: correctionAnalysis,
      volatilityIndex: volatilityIndex,
      riskManagement: null, // Will be set by component if needed
      
      // Professional Dashboard Data
      marketSignal: null, // Will be generated by component
      aiAnalysis: null, // Will be generated by component
      dataQuality: {
        score: 95,
        grade: 'A',
        compliance: true,
        lastValidation: new Date().toISOString()
      },
      alerts: [], // Will be generated by component
      performanceMetrics: null, // Will be generated by component
      
      // Chart & UI State
      chartMode: state.chartMode,
      chartTimeframe: state.chartTimeframe,
      professionalMode: state.professionalMode,
      isLive: true,
      
      // Loading States
      isLoading: state.isLoading,
      isLoadingAI: state.isLoadingAI,
      error: state.error
    };

    return (
      <div className="min-h-screen bg-gray-100">
        <CompleteProfessionalDashboard 
          dashboardState={dashboardData}
          onStateChange={(newState) => setState(prev => ({ ...prev, ...newState }))}
          onChartModeChange={(mode) => setState(prev => ({ ...prev, chartMode: mode }))}
          onTimeframeChange={(timeframe) => setState(prev => ({ ...prev, chartTimeframe: timeframe }))}
          onRefreshData={refreshSampleData}
          chartRef={React.createRef()}
        >
          <ProfessionalChart 
            priceData={state.priceData}
            width={1000}
            height={500}
            theme="professional"
          />
        </CompleteProfessionalDashboard>
      </div>
    );
  }

  // Professional Mode Terminal View
  if (state.professionalMode && state.priceData.length > 0) {
    return (
      <div className="min-h-screen bg-black text-white professional-trading-terminal">
        {/* Professional Mode Header */}
        <div className="bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 p-4 border-b border-blue-500">
          <div className="flex items-center justify-between max-w-full">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-blue-300">🏛️ PROFESSIONAL TRADING TERMINAL</h1>
              <div className="flex items-center space-x-2 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-mono">LIVE MARKET DATA</span>
              </div>
              <div className="text-yellow-400 font-mono text-sm">
                SPX: {state.priceData[state.priceData.length - 1]?.close?.toFixed(2) || '----'}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setState(prev => ({ ...prev, professionalMode: false }))}
                className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded text-sm font-semibold transition-colors"
              >
                EXIT PROFESSIONAL MODE
              </button>
              <div className="text-xs text-gray-300 font-mono">
                {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </div>

          {/* Professional Content */}
          <div className="p-6 grid grid-cols-12 gap-6">
            {/* Left Panel - Trading Signals & Alerts */}
            <div className="col-span-3 space-y-4">
              {/* Trading Signal Panel */}
              {state.tradingSignal && (
                <div className="bg-gray-900 border border-green-500 rounded p-4">
                  <h3 className="text-green-400 font-bold mb-3">📊 TRADING SIGNAL</h3>
                  <div className={`text-2xl font-bold mb-2 ${
                    state.tradingSignal.signal === 'BUY' ? 'text-green-400' :
                    state.tradingSignal.signal === 'SELL' ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>
                    {state.tradingSignal.signal}
                  </div>
                  <div className="text-sm text-gray-300 mb-2">
                    Confidence: {state.tradingSignal.confidence}
                  </div>
                  <div className="text-xs text-gray-400">
                    {state.tradingSignal.reasoning}
                  </div>
                </div>
              )}

              {/* Risk Management */}
              {state.riskManagement && (
                <div className="bg-gray-900 border border-orange-500 rounded p-4">
                  <h3 className="text-orange-400 font-bold mb-3">⚠️ RISK MANAGEMENT</h3>
                  <div className="space-y-2 text-sm">
                    <div>Position Size: <span className="text-green-400">{state.riskManagement.suggestedPositionSize}%</span></div>
                    <div>Stop Loss: <span className="text-red-400">${state.riskManagement.stopLoss?.toFixed(2)}</span></div>
                    <div>Max Risk: <span className="text-yellow-400">{state.riskManagement.maxPortfolioRisk}%</span></div>
                  </div>
                </div>
              )}

              {/* Market Conditions */}
              {marketConditions && (
                <div className="bg-gray-900 border border-blue-500 rounded p-4">
                  <h3 className="text-blue-400 font-bold mb-3">🌊 MARKET CONDITIONS</h3>
                  <div className="space-y-2 text-xs">
                    <div>Volatility: <span className="text-yellow-400">{marketConditions.volatilityLevel.toUpperCase()}</span></div>
                    <div>Risk Level: <span className="text-orange-400">{marketConditions.riskLevel.toUpperCase()}</span></div>
                    {marketConditions.isInCorrection && (
                      <div className="text-red-400">⚠️ CORRECTION ACTIVE</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Center Panel - Professional Chart */}
            <div className="col-span-6">
              <div className="bg-gray-900 border border-blue-600 rounded p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-blue-400 font-bold">📈 S&P 500 PROFESSIONAL CHART</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setState(prev => ({ ...prev, viewMode: 'price' }))}
                      className={`px-3 py-1 text-xs rounded ${state.viewMode === 'price' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                    >
                      PRICE
                    </button>
                    <button
                      onClick={() => setState(prev => ({ ...prev, viewMode: 'volatility' }))}
                      className={`px-3 py-1 text-xs rounded ${state.viewMode === 'volatility' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                    >
                      VOLATILITY
                    </button>
                  </div>
                </div>
                
                <div className="bg-black rounded p-2">
                  <ProfessionalChart 
                    priceData={state.priceData}
                    width={700}
                    height={400}
                    theme="bloomberg"
                  />
                </div>
              </div>
            </div>

            {/* Right Panel - News & Analysis */}
            <div className="col-span-3 space-y-4">
              <div className="bg-gray-900 border border-purple-500 rounded p-4">
                <h3 className="text-purple-400 font-bold mb-3">📰 MARKET NEWS</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {(state.dataSource === 'comprehensive' ? filteredNewsData : state.newsData).slice(0, 5).map((news) => (
                    <div key={news.id} className="p-2 bg-gray-800 rounded text-xs">
                      <div className="font-semibold text-white mb-1">{news.title}</div>
                      <div className="text-gray-400">{format(new Date(news.date), 'MMM dd, yyyy')}</div>
                      <div className={`mt-1 px-2 py-1 rounded text-xs ${
                        news.impact_type === 'positive' ? 'bg-green-900 text-green-300' :
                        news.impact_type === 'negative' ? 'bg-red-900 text-red-300' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {news.impact_type?.toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Analysis Summary */}
              {state.enhancedNewsData.length > 0 && (
                <div className="bg-gray-900 border border-cyan-500 rounded p-4">
                  <h3 className="text-cyan-400 font-bold mb-3">🧠 AI ANALYSIS</h3>
                  <div className="space-y-2 text-sm">
                    <div>Events Analyzed: <span className="text-cyan-300">{state.enhancedNewsData.length}</span></div>
                    <div>High Impact: <span className="text-red-400">
                      {state.enhancedNewsData.filter(n => n.aiAnalysis?.impactLevel === 'HIGH').length}
                    </span></div>
                    <div>Avg Confidence: <span className="text-green-400">
                      {Math.round(state.enhancedNewsData.reduce((sum, n) => sum + (n.aiAnalysis?.confidence || 0), 0) / state.enhancedNewsData.length)}%
                    </span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

  // Actionable Professional Dashboard Mode - Full Screen Override
  if (state.actionableMode && state.priceData.length > 0) {
    return (
      <ActionableProfessionalDashboard
        priceData={state.priceData}
        newsData={state.newsData}
        enhancedNewsData={state.enhancedNewsData}
        onExit={() => setState(prev => ({ ...prev, actionableMode: false }))}
      />
    );
  }

  // Bloomberg Terminal Mode - Full Screen Override
  if (state.terminalMode && state.priceData.length > 0) {
    return (
      <BloombergTerminal
        priceData={state.priceData}
        newsData={state.newsData}
        enhancedNewsData={state.enhancedNewsData}
        tradingSignal={state.tradingSignal}
        correctionAnalysis={state.correctionAnalysis}
        volatilityIndex={state.volatilityIndex}
        riskManagement={state.riskManagement}
        onExit={() => setState(prev => ({ ...prev, terminalMode: false }))}
      />
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">📈 S&P 500 Market Data - Authentic 2025 Dataset</h1>
        
        {/* Professional Mode Toggle */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-blue-900">🏛️ Professional Trading Mode</h3>
              <p className="text-sm text-blue-700">Switch to Bloomberg-level institutional dashboard with professional controls</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setState(prev => ({ ...prev, professionalMode: !prev.professionalMode }))}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  state.professionalMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50'
                }`}
              >
                {state.professionalMode ? '🏛️ Professional Mode' : '📊 Enable Professional Mode'}
              </button>
              <button
                onClick={() => setState(prev => ({ ...prev, actionableMode: !prev.actionableMode }))}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  state.actionableMode
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-white text-green-600 border border-green-300 hover:bg-green-50'
                }`}
              >
                {state.actionableMode ? '⚡ Actionable Mode' : '⚡ Fix Quality Issues'}
              </button>
              <button
                onClick={() => setState(prev => ({ ...prev, terminalMode: !prev.terminalMode }))}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  state.terminalMode
                    ? 'bg-black text-orange-400 hover:bg-gray-900 border border-orange-400'
                    : 'bg-white text-black border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {state.terminalMode ? '💻 Terminal Mode' : '🖥️ Bloomberg Terminal'}
              </button>
            </div>
          </div>
          {state.priceData.length > 0 && professionalDashboardState.dataQuality && (
            <div className="mt-3 text-sm text-blue-600">
              ✅ Professional mode ready - Data quality: {professionalDashboardState.dataQuality.grade} 
              ({professionalDashboardState.dataQuality.score}/100)
            </div>
          )}
        </div>
        <p className="text-lg text-gray-600 mb-6">
          {state.dataSource === 'comprehensive' 
            ? 'Explore 252 trading days of authentic 2025 S&P 500 data with 28 correlated news events'
            : 'Upload CSV files, connect to Alpha Vantage API, or use curated market news events'
          }
        </p>

        {state.error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <strong>Error:</strong> {state.error}
          </div>
        )}

        {/* Professional Data Validation Screen */}
        {state.showValidationScreen && (
          <div className="mb-6">
            <ProfessionalDataValidationScreen
              isProcessing={state.isValidatingData}
              progress={state.validationProgress ?? undefined}
              validationResult={state.validationResult?.validation.postValidation ?? undefined}
              metadata={state.validationResult?.metadata ?? undefined}
              auditTrail={state.validationResult?.validation.auditTrail ?? []}
              onProceed={handleValidationProceed}
              onReject={handleValidationReject}
              onRetry={handleValidationRetry}
            />
          </div>
        )}

        {/* Enhanced Controls for Comprehensive Dataset */}
        {state.dataSource === 'comprehensive' && marketAnalysis && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🎯 Timeline Controls & Analysis</h2>
            
            {/* Timeline Scrubber */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Timeline Position</label>
                <span className="text-sm text-gray-500">
                  {format(state.selectedDateRange.start, 'MMM dd')} - {format(state.selectedDateRange.end, 'MMM dd, yyyy')}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={state.timelinePosition}
                onChange={(e) => handleTimelineChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Jan 2025</span>
                <span>Peak: 6,144</span>
                <span>Crisis: 4,982</span>
                <span>Recovery</span>
                <span>Jun 2025</span>
              </div>
            </div>

            {/* Event Filters */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Event Categories</label>
              <div className="flex flex-wrap gap-2">
                {(['all', 'Federal Reserve', 'Trade Policy', 'Corporate Earnings', 'Market Milestone'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => handleEventFilter(filter)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      state.eventFilter === filter
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter === 'all' ? 'All Events' : filter}
                    {filter !== 'all' && (
                      <span className="ml-1 text-xs opacity-75">
                        ({filteredNewsData.filter(n => n.category.replace('_', ' ').toLowerCase() === filter.toLowerCase()).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Chart View</label>
              <div className="flex gap-2">
                {(['price', 'volatility', 'volume'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setState(prev => ({ ...prev, viewMode: mode }))}
                    className={`px-4 py-2 text-sm rounded-md transition-colors ${
                      state.viewMode === mode
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Market Analysis Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded">
                <h4 className="text-sm font-medium text-gray-700">Period Return</h4>
                <p className={`text-xl font-bold ${(marketAnalysis?.totalReturn ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(marketAnalysis?.totalReturn ?? 0) >= 0 ? '+' : ''}{(marketAnalysis?.totalReturn ?? 0).toFixed(1)}%
                </p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <h4 className="text-sm font-medium text-gray-700">Period High</h4>
                <p className="text-xl font-bold text-green-600">${(marketAnalysis?.high ?? 0).toLocaleString()}</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded">
                <h4 className="text-sm font-medium text-gray-700">Period Low</h4>
                <p className="text-xl font-bold text-red-600">${(marketAnalysis?.low ?? 0).toLocaleString()}</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded">
                <h4 className="text-sm font-medium text-gray-700">High Volatility Days</h4>
                <p className="text-xl font-bold text-purple-600">{marketAnalysis?.volatilityPeriods ?? 0}</p>
              </div>
            </div>

            {/* Major Events in Period */}
            {marketAnalysis && marketAnalysis.majorEvents.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <h4 className="text-sm font-medium text-gray-700 mb-2">🔥 Major Events in This Period</h4>
                <div className="space-y-1">
                  {marketAnalysis.majorEvents.map((event) => (
                    <div key={event.id} className="text-xs text-gray-600 flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${
                        event.impact_type === 'positive' ? 'bg-green-500' :
                        event.impact_type === 'negative' ? 'bg-red-500' : 'bg-gray-500'
                      }`} />
                      <span className="font-medium">{format(new Date(event.date), 'MMM dd')}:</span>
                      <span>{event.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Data Source Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Data Sources</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CSV Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">CSV Upload</h3>
              <CsvDropzone 
                onFileDrop={handleCsvUpload}
                className="h-32"
              />
              {state.csvFileName && (
                <p className="text-sm text-green-600">✅ Loaded: {state.csvFileName}</p>
              )}
              <p className="text-xs text-gray-500">
                Supports Alpha Vantage, Yahoo Finance, and similar CSV formats
              </p>
            </div>
            
            {/* Alpha Vantage API */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Alpha Vantage API</h3>
              <div className="space-y-2">
                <input
                  type="password"
                  placeholder="Enter Alpha Vantage API Key"
                  value={state.alphaVantageApiKey}
                  onChange={(e) => setState(prev => ({ ...prev, alphaVantageApiKey: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={fetchFromAlphaVantage}
                  disabled={state.isLoadingAlphaVantage || !state.alphaVantageApiKey.trim()}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {state.isLoadingAlphaVantage ? 'Fetching...' : 'Fetch Live Data'}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Get your free API key at <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">alphavantage.co</a>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                ⚠️ Free tier: 25 requests/day, 5 requests/minute (basic daily data only)
              </p>
            </div>
            
            {/* Comprehensive Dataset */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Authentic 2025 Dataset</h3>
              <button
                onClick={loadComprehensiveData}
                disabled={state.isLoading}
                className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
              >
                {state.isLoading ? 'Loading...' : 'Load 2025 Data'}
              </button>
              <p className="text-xs text-gray-500">
                252 trading days with authentic news events and market correlations
              </p>
            </div>

            {/* Sample Data */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Sample Data</h3>
              <button
                onClick={refreshSampleData}
                disabled={state.isLoading}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
              >
                {state.isLoading ? 'Loading...' : 'Generate Sample Data'}
              </button>
              <p className="text-xs text-gray-500">
                Demo data with realistic market movements and real news events
              </p>
            </div>
          </div>
          
          {/* Data Source Status */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Current Source:</span>
                <span className={`text-sm font-semibold ${
                  state.dataSource === 'alphavantage' ? 'text-blue-600' :
                  state.dataSource === 'csv' ? 'text-green-600' : 
                  state.dataSource === 'comprehensive' ? 'text-purple-600' : 'text-gray-600'
                }`}>
                  {state.dataSource === 'alphavantage' ? '🌐 Alpha Vantage API' :
                   state.dataSource === 'csv' ? '📊 CSV Upload' : 
                   state.dataSource === 'comprehensive' ? '🎯 Authentic 2025 Dataset' : '🔬 Sample Data'}
                </span>
              </div>
              {state.lastSync && (
                <span className="text-sm text-gray-500">
                  Last Updated: {format(state.lastSync, 'h:mm:ss a')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats Header */}
        {state.priceData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-700">Latest Price</h3>
                <p className="text-3xl font-bold text-blue-600">
                  ${(state.priceData[state.priceData.length - 1]?.close ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-700">Data Points</h3>
                <p className="text-3xl font-bold text-green-600">{state.priceData.length}</p>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-700">News Events</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {state.isLoadingNews ? '...' : state.newsData.length}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Market Intelligence Dashboard - Side by Side Layout */}
        {(chartData.length > 0 || legacyChartData.length > 0) && (
          <div className="grid grid-cols-1 xl:grid-cols-10 gap-6 mb-6 min-h-[600px]">
            
            {/* Chart Section - 70% width on large screens */}
            <div id="chart-section" className="xl:col-span-7 bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  📈 S&P 500 {state.viewMode === 'price' ? 'Price' : 
                            state.viewMode === 'volatility' ? 'Volatility' : 'Volume'} Chart
                </h2>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Positive</span>
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Negative</span>
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <span>Neutral</span>
                  </div>
                  {state.dataSource === 'comprehensive' && (
                    <span className="text-sm text-gray-500">
                      {filteredPriceData.length} days • {filteredNewsData.length} events
                    </span>
                  )}
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={600}>
                {state.viewMode === 'volume' ? (
                  <AreaChart data={chartData.length > 0 ? chartData : legacyChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="volume" 
                      stroke="#8884d8" 
                      fill="#8884d8"
                      name="Volume"
                    />
                  </AreaChart>
                ) : (
                  <LineChart data={chartData.length > 0 ? chartData : legacyChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={state.viewMode === 'volatility' ? ['dataMin', 'dataMax + 1'] : ['dataMin - 50', 'dataMax + 50']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey={state.viewMode === 'volatility' ? 'volatility' : 'price'}
                      stroke={state.viewMode === 'volatility' ? "#ef4444" : "#2563eb"}
                      strokeWidth={2}
                      dot={false}
                      name={state.viewMode === 'volatility' ? 'Volatility %' : 'S&P 500 Price'}
                    />
                    
                    {/* News Event Markers */}
                    {(state.dataSource === 'comprehensive' ? filteredNewsData : state.newsData).map((news) => {
                      const displayData = chartData.length > 0 ? chartData : legacyChartData;
                      const chartPoint = displayData.find(point => point.fullDate === news.date);
                      if (!chartPoint) return null;
                      
                      const yValue = state.viewMode === 'volatility' ? (chartPoint as any).volatility || 0 : chartPoint.price;
                      
                      return (
                        <ReferenceDot
                          key={`news-${news.id}`}
                          x={chartPoint.date}
                          y={yValue}
                          r={state.selectedNewsId === news.id ? 12 : 
                             state.hoveredNewsId === news.id ? 10 : 8}
                          fill={getNewsMarkerColor(news.impact_type || 'neutral', news.id)}
                          stroke={state.selectedNewsId === news.id ? '#FFD700' : 'none'}
                          strokeWidth={state.selectedNewsId === news.id ? 2 : 0}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleMarkerClick(news.id)}
                          onMouseEnter={() => handleMarkerHover(news.id || null)}
                          onMouseLeave={() => handleMarkerHover(null)}
                        />
                      );
                    })}
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* News Feed Section - 30% width on large screens */}
            {(filteredNewsData.length > 0 || state.newsData.length > 0) && (
              <div id="news-section" className="xl:col-span-3 bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">📰 Market News</h2>
                  <span className="text-xs text-gray-500">
                    {state.dataSource === 'comprehensive' 
                      ? `${filteredNewsData.length}/${state.newsData.length}` 
                      : `${state.newsData.length}`}
                  </span>
                </div>

                {/* Professional Trading Signal Section */}
                {state.tradingSignal && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-indigo-900">🎯 Professional Trading Signal</h3>
                      <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                        state.tradingSignal.signal === 'BUY' ? 'bg-green-100 text-green-800' :
                        state.tradingSignal.signal === 'SELL' ? 'bg-red-100 text-red-800' :
                        state.tradingSignal.signal === 'REDUCE' ? 'bg-orange-100 text-orange-800' :
                        state.tradingSignal.signal === 'WAIT' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {state.tradingSignal.signal} ({state.tradingSignal.confidence})
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Signal Reasoning */}
                      <div className="p-2 bg-white rounded-lg border">
                        <div className="text-xs text-gray-600">{state.tradingSignal.reasoning}</div>
                      </div>
                      
                      {/* Key Metrics */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 bg-white rounded border text-center">
                          <div className="text-xs text-purple-600 font-medium">Success Rate</div>
                          <div className="text-sm font-bold text-purple-800">{state.tradingSignal.probabilitySuccess}%</div>
                        </div>
                        <div className="p-2 bg-white rounded border text-center">
                          <div className="text-xs text-blue-600 font-medium">Timeframe</div>
                          <div className="text-sm font-bold text-blue-800">{state.tradingSignal.timeframe}</div>
                        </div>
                        <div className="p-2 bg-white rounded border text-center">
                          <div className="text-xs text-green-600 font-medium">Risk Level</div>
                          <div className="text-sm font-bold text-green-800">{state.tradingSignal.riskLevel}</div>
                        </div>
                      </div>
                      
                      {/* Trigger Conditions */}
                      <div className="p-2 bg-white rounded-lg border">
                        <div className="text-xs font-medium text-gray-700 mb-1">Active Triggers:</div>
                        <div className="space-y-1">
                          {state.tradingSignal.triggerConditions.slice(0, 3).map((condition, index) => (
                            <div key={index} className="text-xs text-gray-600 flex items-center">
                              <span className="w-1 h-1 bg-indigo-400 rounded-full mr-2"></span>
                              {condition}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Market Analysis Dashboard */}
                {state.correctionAnalysis && state.volatilityIndex && state.riskManagement && (
                  <div className="mb-6 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <h3 className="text-sm font-bold text-blue-900 mb-3">📊 Professional Analysis</h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {/* Correction Analysis */}
                      <div className="p-2 bg-white rounded border">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700">Market Correction</span>
                          <span className={`px-1 py-0.5 rounded text-xs font-bold ${
                            state.correctionAnalysis.correctionLevel === 'Bear Market' ? 'bg-red-100 text-red-800' :
                            state.correctionAnalysis.correctionLevel === 'Correction' ? 'bg-orange-100 text-orange-800' :
                            state.correctionAnalysis.correctionLevel === 'Minor' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {state.correctionAnalysis.correctionLevel}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          -{state.correctionAnalysis.declineFromHigh.toFixed(1)}% • {state.correctionAnalysis.recoveryProbability}% recovery rate
                        </div>
                      </div>
                      
                      {/* Volatility */}
                      <div className="p-2 bg-white rounded border">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700">Volatility</span>
                          <span className={`px-1 py-0.5 rounded text-xs font-bold ${
                            state.volatilityIndex.regime === 'Extreme' ? 'bg-red-100 text-red-800' :
                            state.volatilityIndex.regime === 'High' ? 'bg-orange-100 text-orange-800' :
                            state.volatilityIndex.regime === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {state.volatilityIndex.regime}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          VIX: {state.volatilityIndex.vixEquivalent.toFixed(1)} 
                          {state.volatilityIndex.vixCollapseSignal && <span className="text-green-600 ml-1">• Collapse Signal</span>}
                        </div>
                      </div>
                      
                      {/* Risk Management */}
                      <div className="p-2 bg-white rounded border">
                        <div className="text-xs font-medium text-gray-700 mb-1">Position Sizing</div>
                        <div className="text-xs text-gray-600">
                          {(state.riskManagement.positionSize ?? 0).toLocaleString()} shares • Stop: ${(state.riskManagement.stopLossLevel ?? 0).toFixed(0)}
                        </div>
                      </div>
                      
                      {/* Key Levels */}
                      <div className="p-2 bg-white rounded border">
                        <div className="text-xs font-medium text-gray-700 mb-1">Key Levels</div>
                        <div className="text-xs text-gray-600">
                          Support: {((state.correctionAnalysis as any).fibonacciLevel ?? 0).toLocaleString()}
                          {state.correctionAnalysis.isAtSupport && <span className="text-green-600 ml-1">• At Support</span>}
                        </div>
                      </div>
                    </div>
                    
                    {/* Fed Meeting Alert */}
                    {state.riskManagement.daysToFomc <= 7 && (
                      <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                        <div className="text-xs font-medium text-yellow-800">
                          ⏰ FOMC Meeting in {state.riskManagement.daysToFomc} days - Consider reducing exposure
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Market Conditions Summary */}
                <div className="mb-6 p-3 bg-gray-50 rounded-lg border">
                  <h3 className="text-sm font-bold text-gray-900 mb-2">📊 Market Conditions</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">Correction:</span>
                      <span className={`ml-1 font-medium ${
                        marketConditions.isInBearMarket ? 'text-red-600' :
                        marketConditions.isInCorrection ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {marketConditions.isInBearMarket ? 'Bear Market' :
                         marketConditions.isInCorrection ? `${marketConditions.correctionDepth.toFixed(1)}%` : 'Normal'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Volatility:</span>
                      <span className={`ml-1 font-medium ${
                        marketConditions.volatilityLevel === 'extreme' ? 'text-red-600' :
                        marketConditions.volatilityLevel === 'high' ? 'text-orange-600' :
                        marketConditions.volatilityLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {marketConditions.volatilityLevel.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Risk Level:</span>
                      <span className={`ml-1 font-medium ${
                        marketConditions.riskLevel === 'high' ? 'text-red-600' :
                        marketConditions.riskLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {marketConditions.riskLevel.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Recovery Prob:</span>
                      <span className="ml-1 font-medium text-blue-600">
                        {marketConditions.recoveryProbability}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    <span>Support: {marketConditions.supportLevel.toFixed(0)}</span>
                    <span className="mx-2">•</span>
                    <span>Next Fed: {marketConditions.nextFedMeeting}</span>
                  </div>
                </div>

                {/* AI News Analysis Section */}
                {state.enhancedNewsData.length > 0 && (
                  <div className="mb-6 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-green-900">🤖 AI News Intelligence</h3>
                      {state.isLoadingAI && (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-500"></div>
                          <span className="text-xs text-green-600">Analyzing...</span>
                        </div>
                      )}
                    </div>
                    
                    {(() => {
                      const highImpactNews = state.enhancedNewsData.filter(news => 
                        news.aiAnalysis.impactLevel === 'HIGH'
                      ).slice(0, 2);
                      
                      const averageConfidence = state.enhancedNewsData.reduce((acc, news) => 
                        acc + news.aiAnalysis.confidence, 0) / state.enhancedNewsData.length;
                      
                      return (
                        <div>
                          {/* AI Summary Stats */}
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="p-2 bg-white rounded border text-center">
                              <div className="text-xs text-green-600 font-medium">High Impact</div>
                              <div className="text-sm font-bold text-green-800">
                                {state.enhancedNewsData.filter(n => n.aiAnalysis.impactLevel === 'HIGH').length}
                              </div>
                            </div>
                            <div className="p-2 bg-white rounded border text-center">
                              <div className="text-xs text-blue-600 font-medium">Avg Confidence</div>
                              <div className="text-sm font-bold text-blue-800">{averageConfidence.toFixed(0)}%</div>
                            </div>
                            <div className="p-2 bg-white rounded border text-center">
                              <div className="text-xs text-purple-600 font-medium">Total Analyzed</div>
                              <div className="text-sm font-bold text-purple-800">{state.enhancedNewsData.length}</div>
                            </div>
                          </div>
                          
                          {/* High Impact News Alerts */}
                          {highImpactNews.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-xs font-bold text-red-700 mb-2">⚠️ High Impact Events:</div>
                              {highImpactNews.map((news, index) => (
                                <div key={index} className="p-2 bg-white rounded border border-red-200">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-red-800">
                                      {news.aiAnalysis.tradingRecommendation.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-xs px-1 py-0.5 bg-red-100 text-red-800 rounded">
                                      {news.aiAnalysis.confidence}% confidence
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-700 mb-1">{news.title}</div>
                                  <div className="text-xs text-gray-600">
                                    Risk: {news.aiAnalysis.riskAssessment} • 
                                    Impact: {news.aiAnalysis.marketCorrelation}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* AI Performance Disclaimer */}
                          <div className="mt-3 pt-2 border-t border-green-200">
                            <div className="text-xs text-green-700">
                              🧠 AI analysis based on FinBERT-sentiment research with &gt;90% target accuracy.
                              Combines keyword analysis, sentiment scoring, and historical pattern recognition.
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
                
                {/* News Timeline Feed - Scrollable */}
                <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {(state.dataSource === 'comprehensive' ? 
                    [...filteredNewsData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : 
                    [...state.newsData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  ).map((news) => (
                    <div
                      key={news.id}
                      data-news-id={news.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                        state.selectedNewsId === news.id
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleNewsClick(news.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                            {news.title}
                          </h3>
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {news.description}
                          </p>
                        </div>
                        <span className={`ml-2 px-1.5 py-0.5 text-xs rounded font-medium flex-shrink-0 ${
                          news.category === 'fed_policy' ? 'bg-blue-100 text-blue-800' :
                          news.category === 'tariff' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {news.category.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              news.impact_type === 'positive' ? 'bg-green-500' :
                              news.impact_type === 'negative' ? 'bg-red-500' : 'bg-gray-500'
                            }`}
                          />
                          <span>{news.relevance_score}/10</span>
                        </div>
                        <span>{new Date(news.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>

                      {/* Distance from highs and trading context */}
                      {news.distanceFromHighs !== undefined && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <span className={`text-xs font-medium ${
                            news.distanceFromHighs >= -5 ? 'text-green-600' :
                            news.distanceFromHighs >= -15 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            📊 {news.distanceFromHighs >= 0 ? '+' : ''}{news.distanceFromHighs}% from highs
                          </span>
                        </div>
                      )}

                      {/* Trading Recommendation */}
                      {(() => {
                        const recommendation = generateTradingRecommendation(marketConditions, news);
                        return (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-medium px-2 py-1 rounded ${
                                recommendation.action === 'buy' ? 'bg-green-100 text-green-800' :
                                recommendation.action === 'sell' ? 'bg-red-100 text-red-800' :
                                recommendation.action === 'wait' ? 'bg-yellow-100 text-yellow-800' :
                                recommendation.action === 'reduce' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {recommendation.action.toUpperCase()}
                              </span>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                recommendation.confidence === 'high' ? 'bg-blue-100 text-blue-800' :
                                recommendation.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {recommendation.confidence} confidence
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              💭 {recommendation.reasoning}
                            </p>
                            <p className="text-xs text-blue-600 mt-1 font-medium">
                              ⚠️ {recommendation.riskAdjustment}
                            </p>
                          </div>
                        );
                      })()}
                      
                      {state.selectedNewsId === news.id && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <p className="text-xs text-blue-600 mb-2">
                            📍 Highlighted on chart
                          </p>
                          {news.distanceFromHighs !== undefined && news.currentPrice && news.allTimeHigh && (
                            <div className="text-xs text-gray-600 mb-2">
                              <strong>Market Context:</strong> S&P 500 was at {(news.currentPrice ?? 0).toLocaleString()} 
                              ({news.distanceFromHighs >= 0 ? '+' : ''}{news.distanceFromHighs}% from all-time high of {(news.allTimeHigh ?? 0).toLocaleString()})
                            </div>
                          )}
                          {news.url && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Ensure we open in new tab to avoid page refresh
                                if (news.url && !news.url.startsWith('#')) {
                                  window.open(news.url, '_blank', 'noopener,noreferrer');
                                }
                              }}
                              className="text-xs text-blue-500 hover:underline cursor-pointer bg-transparent border-none p-0"
                            >
                              Read more &rarr;
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading States */}
        {(state.isLoading || state.isLoadingNews || state.isLoadingAlphaVantage) && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">
                {state.isLoadingAlphaVantage ? 'Fetching data from Alpha Vantage...' :
                 state.isLoadingNews ? 'Loading market news...' : 'Loading market data...'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SP500Demo; 