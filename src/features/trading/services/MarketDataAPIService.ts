/**
 * Market Data API Service for Enhanced Screening
 * Integrates multiple market data providers for comprehensive stock screening
 */

export interface MarketDataProvider {
  name: string;
  baseUrl: string;
  apiKey: string;
  rateLimit: number; // requests per minute
  endpoints: {
    quote: string;
    fundamentals: string;
    technicals: string;
    news: string;
    earnings: string;
  };
}

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  peRatio?: number;
  high52Week: number;
  low52Week: number;
  lastUpdated: Date;
}

export interface FundamentalData {
  symbol: string;
  marketCap: number;
  peRatio?: number;
  pegRatio?: number;
  pbRatio?: number;
  psRatio?: number;
  debtToEquity: number;
  currentRatio: number;
  quickRatio: number;
  roe: number;
  roa: number;
  grossMargin: number;
  operatingMargin: number;
  netMargin: number;
  revenueGrowth: number;
  epsGrowth: number;
  dividendYield?: number;
  payoutRatio?: number;
  bookValuePerShare: number;
  tangibleBookValue: number;
  lastUpdated: Date;
}

export interface TechnicalData {
  symbol: string;
  rsi14: number;
  rsi30?: number;
  macd: {
    line: number;
    signal: number;
    histogram: number;
  };
  movingAverages: {
    sma20: number;
    sma50: number;
    sma200: number;
    ema12: number;
    ema26: number;
  };
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
  };
  stochastic: {
    k: number;
    d: number;
  };
  atr: number;
  adx: number;
  williamsR: number;
  cci: number;
  support: number;
  resistance: number;
  lastUpdated: Date;
}

export interface NewsData {
  id: string;
  symbol: string;
  headline: string;
  summary: string;
  source: string;
  publishedAt: Date;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  relevanceScore: number;
  url: string;
}

export interface EarningsData {
  symbol: string;
  reportDate: Date;
  fiscalPeriod: string;
  estimatedEPS: number;
  actualEPS?: number;
  surprise?: number;
  surprisePercent?: number;
  revenue: number;
  revenueEstimate: number;
}

export interface ScreeningDataBundle {
  quote: StockQuote;
  fundamentals: FundamentalData;
  technicals: TechnicalData;
  news: NewsData[];
  earnings: EarningsData[];
  lastUpdated: Date;
}

export interface APIRateLimit {
  provider: string;
  endpoint: string;
  requestsRemaining: number;
  resetTime: Date;
}

export class MarketDataAPIService {
  private providers: Map<string, MarketDataProvider> = new Map();
  private rateLimits: Map<string, APIRateLimit> = new Map();
  private cache: Map<string, { data: any; expiry: Date }> = new Map();
  private defaultProvider: string = 'alphavantage';
  
  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Alpha Vantage
    this.providers.set('alphavantage', {
      name: 'Alpha Vantage',
      baseUrl: 'https://www.alphavantage.co/query',
      apiKey: process.env.REACT_APP_ALPHA_VANTAGE_API_KEY || 'demo',
      rateLimit: 5, // 5 requests per minute for free tier
      endpoints: {
        quote: '?function=GLOBAL_QUOTE',
        fundamentals: '?function=OVERVIEW',
        technicals: '?function=RSI&function=MACD&function=SMA',
        news: '?function=NEWS_SENTIMENT',
        earnings: '?function=EARNINGS'
      }
    });

    // IEX Cloud
    this.providers.set('iexcloud', {
      name: 'IEX Cloud',
      baseUrl: 'https://cloud.iexapis.com/stable',
      apiKey: process.env.REACT_APP_IEX_CLOUD_API_KEY || 'demo',
      rateLimit: 100, // Higher rate limit
      endpoints: {
        quote: '/stock/{symbol}/quote',
        fundamentals: '/stock/{symbol}/stats',
        technicals: '/stock/{symbol}/indicator/{indicator}',
        news: '/stock/{symbol}/news',
        earnings: '/stock/{symbol}/earnings'
      }
    });

    // Yahoo Finance (unofficial API)
    this.providers.set('yahoo', {
      name: 'Yahoo Finance',
      baseUrl: 'https://query1.finance.yahoo.com/v8/finance',
      apiKey: '', // No API key required
      rateLimit: 2000, // High rate limit
      endpoints: {
        quote: '/quote?symbols={symbol}',
        fundamentals: '/quote?symbols={symbol}&modules=defaultKeyStatistics,financialData',
        technicals: '/chart/{symbol}?indicators=macd,rsi,sma',
        news: '/news?symbols={symbol}',
        earnings: '/quote?symbols={symbol}&modules=earnings'
      }
    });

    // Polygon.io
    this.providers.set('polygon', {
      name: 'Polygon.io',
      baseUrl: 'https://api.polygon.io',
      apiKey: process.env.REACT_APP_POLYGON_API_KEY || 'demo',
      rateLimit: 5, // Free tier
      endpoints: {
        quote: '/v2/snapshot/locale/us/markets/stocks/tickers/{symbol}',
        fundamentals: '/vX/reference/financials?ticker={symbol}',
        technicals: '/v1/indicators/{indicator}/ticker/{symbol}',
        news: '/v2/reference/news?ticker={symbol}',
        earnings: '/vX/reference/financials?ticker={symbol}&filing_date.gte={date}'
      }
    });
  }

  /**
   * Get comprehensive stock data for screening
   */
  async getStockData(symbol: string, useCache: boolean = true): Promise<ScreeningDataBundle> {
    const cacheKey = `stockData_${symbol}`;
    
    // Check cache first
    if (useCache) {
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return cached as ScreeningDataBundle;
      }
    }

    try {
      // Fetch data from multiple sources in parallel
      const [quote, fundamentals, technicals, news, earnings] = await Promise.allSettled([
        this.getQuote(symbol),
        this.getFundamentals(symbol),
        this.getTechnicals(symbol),
        this.getNews(symbol, 5), // Get 5 recent news items
        this.getEarnings(symbol)
      ]);

      const bundle: ScreeningDataBundle = {
        quote: quote.status === 'fulfilled' ? quote.value : this.getEmptyQuote(symbol),
        fundamentals: fundamentals.status === 'fulfilled' ? fundamentals.value : this.getEmptyFundamentals(symbol),
        technicals: technicals.status === 'fulfilled' ? technicals.value : this.getEmptyTechnicals(symbol),
        news: news.status === 'fulfilled' ? news.value : [],
        earnings: earnings.status === 'fulfilled' ? earnings.value : [],
        lastUpdated: new Date()
      };

      // Cache the result for 5 minutes
      this.setCacheData(cacheKey, bundle, 5);

      return bundle;

    } catch (error) {
      console.error(`Error fetching stock data for ${symbol}:`, error);
      throw new Error(`Failed to fetch stock data for ${symbol}`);
    }
  }

  /**
   * Get real-time stock quote
   */
  async getQuote(symbol: string): Promise<StockQuote> {
    const provider = this.getAvailableProvider('quote');
    
    try {
      switch (provider) {
        case 'alphavantage':
          return await this.getAlphaVantageQuote(symbol);
        case 'iexcloud':
          return await this.getIEXQuote(symbol);
        case 'yahoo':
          return await this.getYahooQuote(symbol);
        case 'polygon':
          return await this.getPolygonQuote(symbol);
        default:
          throw new Error('No available provider for quotes');
      }
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      // Try fallback provider
      if (provider !== 'yahoo') {
        try {
          return await this.getYahooQuote(symbol);
        } catch (fallbackError) {
          console.error(`Fallback quote fetch failed for ${symbol}:`, fallbackError);
        }
      }
      return this.getEmptyQuote(symbol);
    }
  }

  /**
   * Get fundamental data
   */
  async getFundamentals(symbol: string): Promise<FundamentalData> {
    const provider = this.getAvailableProvider('fundamentals');
    
    try {
      switch (provider) {
        case 'alphavantage':
          return await this.getAlphaVantageFundamentals(symbol);
        case 'iexcloud':
          return await this.getIEXFundamentals(symbol);
        case 'yahoo':
          return await this.getYahooFundamentals(symbol);
        case 'polygon':
          return await this.getPolygonFundamentals(symbol);
        default:
          throw new Error('No available provider for fundamentals');
      }
    } catch (error) {
      console.error(`Error fetching fundamentals for ${symbol}:`, error);
      return this.getEmptyFundamentals(symbol);
    }
  }

  /**
   * Get technical indicators
   */
  async getTechnicals(symbol: string): Promise<TechnicalData> {
    const provider = this.getAvailableProvider('technicals');
    
    try {
      switch (provider) {
        case 'alphavantage':
          return await this.getAlphaVantageTechnicals(symbol);
        case 'iexcloud':
          return await this.getIEXTechnicals(symbol);
        case 'yahoo':
          return await this.getYahooTechnicals(symbol);
        case 'polygon':
          return await this.getPolygonTechnicals(symbol);
        default:
          throw new Error('No available provider for technicals');
      }
    } catch (error) {
      console.error(`Error fetching technicals for ${symbol}:`, error);
      return this.getEmptyTechnicals(symbol);
    }
  }

  /**
   * Get news data
   */
  async getNews(symbol: string, limit: number = 10): Promise<NewsData[]> {
    const provider = this.getAvailableProvider('news');
    
    try {
      switch (provider) {
        case 'alphavantage':
          return await this.getAlphaVantageNews(symbol, limit);
        case 'iexcloud':
          return await this.getIEXNews(symbol, limit);
        case 'yahoo':
          return await this.getYahooNews(symbol, limit);
        case 'polygon':
          return await this.getPolygonNews(symbol, limit);
        default:
          return [];
      }
    } catch (error) {
      console.error(`Error fetching news for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Get earnings data
   */
  async getEarnings(symbol: string): Promise<EarningsData[]> {
    const provider = this.getAvailableProvider('earnings');
    
    try {
      switch (provider) {
        case 'alphavantage':
          return await this.getAlphaVantageEarnings(symbol);
        case 'iexcloud':
          return await this.getIEXEarnings(symbol);
        case 'yahoo':
          return await this.getYahooEarnings(symbol);
        case 'polygon':
          return await this.getPolygonEarnings(symbol);
        default:
          return [];
      }
    } catch (error) {
      console.error(`Error fetching earnings for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Batch fetch data for multiple symbols
   */
  async getBatchStockData(symbols: string[], batchSize: number = 5): Promise<Map<string, ScreeningDataBundle>> {
    const results = new Map<string, ScreeningDataBundle>();
    
    // Process in batches to respect rate limits
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const batchPromises = batch.map(symbol => 
        this.getStockData(symbol).catch(error => {
          console.warn(`Failed to fetch data for ${symbol}:`, error);
          return null;
        })
      );
      
      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result) {
          results.set(batch[index], result);
        }
      });
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < symbols.length) {
        await this.delay(1000); // 1 second delay
      }
    }
    
    return results;
  }

  // Provider-specific implementations (simplified for demo)
  private async getAlphaVantageQuote(symbol: string): Promise<StockQuote> {
    // Mock implementation - would make actual API call
    return this.generateMockQuote(symbol);
  }

  private async getIEXQuote(symbol: string): Promise<StockQuote> {
    // Mock implementation - would make actual API call
    return this.generateMockQuote(symbol);
  }

  private async getYahooQuote(symbol: string): Promise<StockQuote> {
    // Mock implementation - would make actual API call
    return this.generateMockQuote(symbol);
  }

  private async getPolygonQuote(symbol: string): Promise<StockQuote> {
    // Mock implementation - would make actual API call
    return this.generateMockQuote(symbol);
  }

  // Similar mock implementations for other data types...
  private async getAlphaVantageFundamentals(symbol: string): Promise<FundamentalData> {
    return this.generateMockFundamentals(symbol);
  }

  private async getAlphaVantageTechnicals(symbol: string): Promise<TechnicalData> {
    return this.generateMockTechnicals(symbol);
  }

  private async getAlphaVantageNews(symbol: string, limit: number): Promise<NewsData[]> {
    return this.generateMockNews(symbol, limit);
  }

  private async getAlphaVantageEarnings(symbol: string): Promise<EarningsData[]> {
    return this.generateMockEarnings(symbol);
  }

  // Utility methods
  private getAvailableProvider(endpoint: string): string {
    // Simple round-robin or rate limit aware provider selection
    return this.defaultProvider;
  }

  private checkRateLimit(provider: string, endpoint: string): boolean {
    const key = `${provider}_${endpoint}`;
    const limit = this.rateLimits.get(key);
    
    if (!limit) return true;
    
    if (new Date() > limit.resetTime) {
      this.rateLimits.delete(key);
      return true;
    }
    
    return limit.requestsRemaining > 0;
  }

  private updateRateLimit(provider: string, endpoint: string): void {
    const key = `${provider}_${endpoint}`;
    const existing = this.rateLimits.get(key);
    
    if (existing) {
      existing.requestsRemaining = Math.max(0, existing.requestsRemaining - 1);
    } else {
      const providerConfig = this.providers.get(provider);
      if (providerConfig) {
        this.rateLimits.set(key, {
          provider,
          endpoint,
          requestsRemaining: providerConfig.rateLimit - 1,
          resetTime: new Date(Date.now() + 60000) // Reset in 1 minute
        });
      }
    }
  }

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > new Date()) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCacheData(key: string, data: any, minutesToLive: number): void {
    const expiry = new Date(Date.now() + minutesToLive * 60000);
    this.cache.set(key, { data, expiry });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Mock data generators
  private generateMockQuote(symbol: string): StockQuote {
    const basePrice = 100 + Math.random() * 400;
    const change = (Math.random() - 0.5) * 10;
    
    return {
      symbol,
      price: Math.round(basePrice * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round((change / basePrice) * 10000) / 100,
      volume: Math.floor(Math.random() * 10000000),
      avgVolume: Math.floor(Math.random() * 5000000),
      marketCap: Math.floor(Math.random() * 500000000000),
      peRatio: 15 + Math.random() * 25,
      high52Week: basePrice * (1.2 + Math.random() * 0.3),
      low52Week: basePrice * (0.5 + Math.random() * 0.3),
      lastUpdated: new Date()
    };
  }

  private generateMockFundamentals(symbol: string): FundamentalData {
    return {
      symbol,
      marketCap: Math.floor(Math.random() * 500000000000),
      peRatio: 15 + Math.random() * 25,
      pegRatio: 0.5 + Math.random() * 2,
      pbRatio: 1 + Math.random() * 5,
      psRatio: 0.5 + Math.random() * 8,
      debtToEquity: Math.random() * 2,
      currentRatio: 1 + Math.random() * 3,
      quickRatio: 0.5 + Math.random() * 2,
      roe: 5 + Math.random() * 25,
      roa: 2 + Math.random() * 15,
      grossMargin: 20 + Math.random() * 50,
      operatingMargin: 5 + Math.random() * 30,
      netMargin: 2 + Math.random() * 20,
      revenueGrowth: -10 + Math.random() * 40,
      epsGrowth: -20 + Math.random() * 60,
      dividendYield: Math.random() * 6,
      payoutRatio: 20 + Math.random() * 60,
      bookValuePerShare: 10 + Math.random() * 50,
      tangibleBookValue: 5 + Math.random() * 40,
      lastUpdated: new Date()
    };
  }

  private generateMockTechnicals(symbol: string): TechnicalData {
    const price = 100 + Math.random() * 400;
    
    return {
      symbol,
      rsi14: 20 + Math.random() * 60,
      rsi30: 25 + Math.random() * 50,
      macd: {
        line: (Math.random() - 0.5) * 5,
        signal: (Math.random() - 0.5) * 4,
        histogram: (Math.random() - 0.5) * 2
      },
      movingAverages: {
        sma20: price * (0.95 + Math.random() * 0.1),
        sma50: price * (0.9 + Math.random() * 0.2),
        sma200: price * (0.8 + Math.random() * 0.4),
        ema12: price * (0.96 + Math.random() * 0.08),
        ema26: price * (0.92 + Math.random() * 0.16)
      },
      bollinger: {
        upper: price * 1.1,
        middle: price,
        lower: price * 0.9
      },
      stochastic: {
        k: 20 + Math.random() * 60,
        d: 25 + Math.random() * 50
      },
      atr: 1 + Math.random() * 8,
      adx: 15 + Math.random() * 60,
      williamsR: -80 + Math.random() * 60,
      cci: -200 + Math.random() * 400,
      support: price * (0.95 - Math.random() * 0.1),
      resistance: price * (1.05 + Math.random() * 0.1),
      lastUpdated: new Date()
    };
  }

  private generateMockNews(symbol: string, limit: number): NewsData[] {
    const news: NewsData[] = [];
    const headlines = [
      `${symbol} Reports Strong Q3 Earnings`,
      `Analysts Upgrade ${symbol} on Innovation`,
      `${symbol} Announces Strategic Partnership`,
      `Market Volatility Affects ${symbol}`,
      `${symbol} CEO Discusses Future Growth`
    ];
    
    for (let i = 0; i < Math.min(limit, headlines.length); i++) {
      news.push({
        id: `news_${symbol}_${i}`,
        symbol,
        headline: headlines[i],
        summary: `This is a summary of news about ${symbol}...`,
        source: ['Reuters', 'Bloomberg', 'CNBC', 'WSJ'][Math.floor(Math.random() * 4)],
        publishedAt: new Date(Date.now() - Math.random() * 86400000 * 7), // Last 7 days
        sentiment: ['POSITIVE', 'NEGATIVE', 'NEUTRAL'][Math.floor(Math.random() * 3)] as any,
        relevanceScore: 0.6 + Math.random() * 0.4,
        url: `https://example.com/news/${symbol}/${i}`
      });
    }
    
    return news;
  }

  private generateMockEarnings(symbol: string): EarningsData[] {
    return [
      {
        symbol,
        reportDate: new Date(Date.now() + Math.random() * 90 * 86400000), // Next 90 days
        fiscalPeriod: 'Q4 2024',
        estimatedEPS: 1 + Math.random() * 3,
        actualEPS: undefined,
        surprise: undefined,
        surprisePercent: undefined,
        revenue: 1000000000 + Math.random() * 9000000000,
        revenueEstimate: 1100000000 + Math.random() * 8000000000
      }
    ];
  }

  private getEmptyQuote(symbol: string): StockQuote {
    return {
      symbol,
      price: 0,
      change: 0,
      changePercent: 0,
      volume: 0,
      avgVolume: 0,
      marketCap: 0,
      high52Week: 0,
      low52Week: 0,
      lastUpdated: new Date()
    };
  }

  private getEmptyFundamentals(symbol: string): FundamentalData {
    return {
      symbol,
      marketCap: 0,
      debtToEquity: 0,
      currentRatio: 0,
      quickRatio: 0,
      roe: 0,
      roa: 0,
      grossMargin: 0,
      operatingMargin: 0,
      netMargin: 0,
      revenueGrowth: 0,
      epsGrowth: 0,
      bookValuePerShare: 0,
      tangibleBookValue: 0,
      lastUpdated: new Date()
    };
  }

  private getEmptyTechnicals(symbol: string): TechnicalData {
    return {
      symbol,
      rsi14: 50,
      macd: { line: 0, signal: 0, histogram: 0 },
      movingAverages: { sma20: 0, sma50: 0, sma200: 0, ema12: 0, ema26: 0 },
      bollinger: { upper: 0, middle: 0, lower: 0 },
      stochastic: { k: 50, d: 50 },
      atr: 0,
      adx: 25,
      williamsR: -50,
      cci: 0,
      support: 0,
      resistance: 0,
      lastUpdated: new Date()
    };
  }

  // Additional utility methods for provider management
  public setDefaultProvider(provider: string): void {
    if (this.providers.has(provider)) {
      this.defaultProvider = provider;
    } else {
      throw new Error(`Unknown provider: ${provider}`);
    }
  }

  public getProviderStatus(): Array<{ name: string; available: boolean; rateLimit: string }> {
    return Array.from(this.providers.values()).map(provider => ({
      name: provider.name,
      available: this.checkRateLimit(provider.name, 'quote'),
      rateLimit: `${provider.rateLimit} req/min`
    }));
  }

  public clearCache(): void {
    this.cache.clear();
  }
}

export default MarketDataAPIService;