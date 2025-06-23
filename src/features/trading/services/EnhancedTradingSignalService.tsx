import { SP500PriceData, MarketNewsData } from './DatabaseService';
import { EnhancedNewsEvent } from './AINewsAnalysisService';

export interface EnhancedTradingSignal {
  signal: 'BUY' | 'ADD' | 'HOLD' | 'REDUCE' | 'SELL';
  confidence: number;
  reasoning: string;
  entryPrice: number;
  stopLoss: number;
  target: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  positionSize: number;
  ruleTriggered: string;
  drawdownFromHigh: number;
  timeframe: string;
}

export interface ActiveTrigger {
  id: string;
  type: 'BUY_SIGNAL' | 'HIGH_IMPACT_NEWS' | 'VOLATILITY_SPIKE' | 'FED_POLICY';
  title: string;
  description: string;
  confidence: number;
  timestamp: string;
  actionRequired: boolean;
}

export interface MarketConditions {
  currentPrice: number;
  allTimeHigh: number;
  drawdownFromHigh: number;
  volatilityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  support200DMA: number;
  fibonacciSupport: number;
  vixEquivalent: number;
  trendDirection: 'BULLISH' | 'BEARISH' | 'CONSOLIDATION';
}

export interface TradingAction {
  date: string;
  action: 'BUY' | 'ADD' | 'HOLD' | 'REDUCE' | 'SELL';
  price: number;
  reasoning: string;
  confidence: number;
  ruleTriggered: string;
  newsId?: number;
}

export class EnhancedTradingSignalService {
  private tradingHistory: TradingAction[] = [];
  private currentPosition = 0; // 0 = no position, 0.5 = half, 1 = full

  // Implement the -15% drawdown + positive catalyst BUY rule
  generateTradingSignal(
    priceData: SP500PriceData[], 
    newsData: MarketNewsData[], 
    enhancedNewsData: EnhancedNewsEvent[] = []
  ): EnhancedTradingSignal {
    if (priceData.length === 0) {
      return this.getDefaultSignal();
    }

    const marketConditions = this.analyzeMarketConditions(priceData);
    const currentPrice = priceData[priceData.length - 1].close;
    const drawdownFromHigh = marketConditions.drawdownFromHigh;

    // Find relevant news for current period
    const recentNews = this.getRecentNews(newsData, enhancedNewsData);
    const positiveCatalyst = this.hasPositiveCatalyst(recentNews);

    // Apply the BUY logic
    let signal: 'BUY' | 'ADD' | 'HOLD' | 'REDUCE' | 'SELL' = 'HOLD';
    let reasoning = 'Market in consolidation';
    let ruleTriggered = 'HOLD_DEFAULT';
    let confidence = 60;

    // Core BUY rule: -15% drawdown + positive catalyst
    if (drawdownFromHigh <= -15 && positiveCatalyst.isPositive) {
      if (this.currentPosition === 0) {
        signal = 'BUY';
        reasoning = `${drawdownFromHigh.toFixed(1)}% drawdown + ${positiveCatalyst.reason}`;
        ruleTriggered = 'DRAWDOWN_PLUS_CATALYST';
        confidence = positiveCatalyst.confidence;
        this.currentPosition = 0.5; // Start with half position
      } else if (this.currentPosition < 1) {
        signal = 'ADD';
        reasoning = `Adding to position: ${drawdownFromHigh.toFixed(1)}% drawdown + ${positiveCatalyst.reason}`;
        ruleTriggered = 'ADD_ON_STRENGTH';
        confidence = positiveCatalyst.confidence;
        this.currentPosition = Math.min(1, this.currentPosition + 0.25);
      }
    }
    // Fed policy reduction signal
    else if (this.hasFedReductionSignal(recentNews)) {
      signal = 'REDUCE';
      reasoning = 'Fed policy suggests risk reduction';
      ruleTriggered = 'FED_REDUCTION';
      confidence = 75;
      this.currentPosition = Math.max(0, this.currentPosition - 0.25);
    }
    // Extreme risk conditions
    else if (marketConditions.riskLevel === 'EXTREME') {
      signal = 'REDUCE';
      reasoning = 'Extreme market risk conditions detected';
      ruleTriggered = 'RISK_MANAGEMENT';
      confidence = 80;
    }

    // Calculate position sizing and stops
    const positionSize = this.calculatePositionSize(marketConditions.riskLevel);
    const stopLoss = this.calculateStopLoss(currentPrice, marketConditions);
    const target = this.calculateTarget(currentPrice, stopLoss);

    // Record the action
    this.recordTradingAction(signal, currentPrice, reasoning, confidence, ruleTriggered);

    return {
      signal,
      confidence,
      reasoning,
      entryPrice: currentPrice,
      stopLoss,
      target,
      riskLevel: marketConditions.riskLevel,
      positionSize,
      ruleTriggered,
      drawdownFromHigh,
      timeframe: '1-3 months'
    };
  }

  analyzeMarketConditions(priceData: SP500PriceData[]): MarketConditions {
    const prices = priceData.map(d => d.close);
    const currentPrice = prices[prices.length - 1];
    const allTimeHigh = Math.max(...prices);
    const drawdownFromHigh = ((currentPrice - allTimeHigh) / allTimeHigh) * 100;

    // Calculate 200-day moving average (or use available data)
    const ma200Days = Math.min(200, prices.length);
    const support200DMA = prices.slice(-ma200Days).reduce((sum, price) => sum + price, 0) / ma200Days;

    // Calculate Fibonacci support (0.618 retracement)
    const lowPrice = Math.min(...prices);
    const range = allTimeHigh - lowPrice;
    const fibonacciSupport = allTimeHigh - (range * 0.618);

    // Calculate volatility for VIX equivalent
    const volatility = this.calculateVolatility(priceData);
    const vixEquivalent = volatility * 100; // Convert to VIX-like scale

    // Determine consistent risk levels based on volatility AND drawdown
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
    let volatilityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';

    if (vixEquivalent < 20 && Math.abs(drawdownFromHigh) < 10) {
      riskLevel = volatilityLevel = 'LOW';
    } else if (vixEquivalent < 30 && Math.abs(drawdownFromHigh) < 15) {
      riskLevel = volatilityLevel = 'MEDIUM';
    } else if (vixEquivalent < 40 && Math.abs(drawdownFromHigh) < 25) {
      riskLevel = volatilityLevel = 'HIGH';
    } else {
      riskLevel = volatilityLevel = 'EXTREME';
    }

    // Determine trend
    const shortMA = prices.slice(-20).reduce((sum, price) => sum + price, 0) / 20;
    const longMA = prices.slice(-50).reduce((sum, price) => sum + price, 0) / 50;
    let trendDirection: 'BULLISH' | 'BEARISH' | 'CONSOLIDATION';
    
    if (shortMA > longMA * 1.02) {
      trendDirection = 'BULLISH';
    } else if (shortMA < longMA * 0.98) {
      trendDirection = 'BEARISH';
    } else {
      trendDirection = 'CONSOLIDATION';
    }

    return {
      currentPrice,
      allTimeHigh,
      drawdownFromHigh,
      volatilityLevel,
      riskLevel,
      support200DMA,
      fibonacciSupport,
      vixEquivalent,
      trendDirection
    };
  }

  generateActiveTriggers(
    marketConditions: MarketConditions,
    enhancedNewsData: EnhancedNewsEvent[] = []
  ): ActiveTrigger[] {
    const triggers: ActiveTrigger[] = [];
    const now = new Date();

    // High-impact news triggers
    const highImpactNews = enhancedNewsData.filter(news => 
      news.aiAnalysis?.impactLevel === 'HIGH'
    );

    highImpactNews.forEach((news, index) => {
      triggers.push({
        id: `high-impact-${index}`,
        type: 'HIGH_IMPACT_NEWS',
        title: `High-Impact: ${news.title.substring(0, 50)}...`,
        description: `AI Confidence: ${news.aiAnalysis?.confidence}% | Impact: ${news.aiAnalysis?.marketCorrelation}`,
        confidence: news.aiAnalysis?.confidence || 70,
        timestamp: now.toLocaleTimeString(),
        actionRequired: news.aiAnalysis?.tradingRecommendation?.includes('BUY') || false
      });
    });

    // BUY signal triggers
    if (marketConditions.drawdownFromHigh <= -15) {
      triggers.push({
        id: 'buy-signal',
        type: 'BUY_SIGNAL',
        title: 'Buy the Dip Signal Active',
        description: `${marketConditions.drawdownFromHigh.toFixed(1)}% drawdown from highs - watch for positive catalysts`,
        confidence: 85,
        timestamp: now.toLocaleTimeString(),
        actionRequired: true
      });
    }

    // Volatility triggers
    if (marketConditions.riskLevel === 'EXTREME') {
      triggers.push({
        id: 'volatility-extreme',
        type: 'VOLATILITY_SPIKE',
        title: 'Extreme Volatility Alert',
        description: `VIX equivalent: ${marketConditions.vixEquivalent.toFixed(1)} - Consider risk reduction`,
        confidence: 90,
        timestamp: now.toLocaleTimeString(),
        actionRequired: true
      });
    }

    return triggers;
  }

  private getRecentNews(newsData: MarketNewsData[], enhancedNewsData: EnhancedNewsEvent[]) {
    // Use enhanced news if available, otherwise regular news
    const allNews = enhancedNewsData.length > 0 ? enhancedNewsData : newsData;
    
    // Get news from last 5 days
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    
    return allNews.filter(news => new Date(news.date) >= fiveDaysAgo);
  }

  private hasPositiveCatalyst(recentNews: (MarketNewsData | EnhancedNewsEvent)[]) {
    for (const news of recentNews) {
      // Check for positive impact
      if (news.impact_type === 'positive') {
        return { isPositive: true, reason: 'positive market news', confidence: 80 };
      }

      // Check AI analysis confidence
      const enhancedNews = news as EnhancedNewsEvent;
      if (enhancedNews.aiAnalysis?.confidence && enhancedNews.aiAnalysis.confidence >= 7) {
        return { 
          isPositive: true, 
          reason: `high-confidence analysis (${enhancedNews.aiAnalysis.confidence}/10)`, 
          confidence: enhancedNews.aiAnalysis.confidence * 10 
        };
      }

      // Check for positive keywords
      const headline = news.title.toLowerCase();
      const positiveKeywords = ['pause', 'deal', 'agreement', 'stimulus', 'recovery', 'growth', 'positive'];
      
      for (const keyword of positiveKeywords) {
        if (headline.includes(keyword)) {
          return { isPositive: true, reason: `${keyword} catalyst`, confidence: 75 };
        }
      }
    }

    return { isPositive: false, reason: 'no catalyst', confidence: 50 };
  }

  private hasFedReductionSignal(recentNews: (MarketNewsData | EnhancedNewsEvent)[]) {
    return recentNews.some(news => 
      news.category === 'fed_policy' && 
      (news.title.toLowerCase().includes('reduce') || news.description?.toLowerCase().includes('reduce'))
    );
  }

  private calculateVolatility(priceData: SP500PriceData[]): number {
    if (priceData.length < 20) return 0.15; // Default
    
    const returns = [];
    for (let i = 1; i < Math.min(priceData.length, 20); i++) {
      const dailyReturn = (priceData[i].close - priceData[i-1].close) / priceData[i-1].close;
      returns.push(dailyReturn);
    }
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    
    return Math.sqrt(variance * 252); // Annualized volatility
  }

  private calculatePositionSize(riskLevel: string): number {
    switch (riskLevel) {
      case 'LOW': return 100;
      case 'MEDIUM': return 75;
      case 'HIGH': return 50;
      case 'EXTREME': return 25;
      default: return 50;
    }
  }

  private calculateStopLoss(currentPrice: number, conditions: MarketConditions): number {
    // Use 200-DMA or fibonacci support, whichever is higher (closer to current price)
    const technicalSupport = Math.max(conditions.support200DMA, conditions.fibonacciSupport);
    
    // Don't go more than 8% below current price for stop
    const maxStopDistance = currentPrice * 0.92;
    
    return Math.max(technicalSupport, maxStopDistance);
  }

  private calculateTarget(currentPrice: number, stopLoss: number): number {
    const riskAmount = currentPrice - stopLoss;
    return currentPrice + (riskAmount * 2.5); // 2.5:1 risk/reward ratio
  }

  private recordTradingAction(
    action: string, 
    price: number, 
    reasoning: string, 
    confidence: number, 
    ruleTriggered: string
  ) {
    this.tradingHistory.push({
      date: new Date().toISOString(),
      action: action as any,
      price,
      reasoning,
      confidence,
      ruleTriggered
    });
  }

  private getDefaultSignal(): EnhancedTradingSignal {
    return {
      signal: 'HOLD',
      confidence: 50,
      reasoning: 'Insufficient data for analysis',
      entryPrice: 0,
      stopLoss: 0,
      target: 0,
      riskLevel: 'MEDIUM',
      positionSize: 50,
      ruleTriggered: 'NO_DATA',
      drawdownFromHigh: 0,
      timeframe: 'N/A'
    };
  }

  // Get trading history for success rate calculation
  getTradingHistory(): TradingAction[] {
    return this.tradingHistory;
  }

  // Calculate success rate (hide if < 20 trades)
  getSuccessRate(): number | null {
    if (this.tradingHistory.length < 20) {
      return null; // Hide until we have enough data
    }
    
    // Mock calculation - would need actual PnL tracking
    const buyActions = this.tradingHistory.filter(action => 
      action.action === 'BUY' || action.action === 'ADD'
    );
    
    // Mock success rate based on confidence scores
    const avgConfidence = buyActions.reduce((sum, action) => sum + action.confidence, 0) / buyActions.length;
    return avgConfidence; // Simplified for demo
  }
} 