/**
 * Educational Visualizer Engine - Interactive Visual Learning for New Traders
 * Provides hands-on, visual learning experiences with real-time feedback
 */

export type VisualizationType = 'options-payoff' | 'position-sizing' | 'kelly-criterion' | 'correlation-matrix' | 'vix-risk' | 'portfolio-risk';

export interface VisualizationConfig {
  id: string;
  type: VisualizationType;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  parameters: { [key: string]: any };
  learningGoals: string[];
  interactionTypes: InteractionType[];
}

export type InteractionType = 'slider' | 'input' | 'dropdown' | 'checkbox' | 'drag' | 'click' | 'hover';

export interface VisualizationData {
  chartData: any[];
  annotations: Annotation[];
  highlights: Highlight[];
  insights: Insight[];
}

export interface Annotation {
  id: string;
  x: number;
  y: number;
  text: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  showOnHover?: boolean;
}

export interface Highlight {
  id: string;
  area: { x: number; y: number; width: number; height: number };
  color: string;
  opacity: number;
  label?: string;
}

export interface Insight {
  id: string;
  category: 'risk' | 'opportunity' | 'education' | 'warning';
  title: string;
  description: string;
  confidence: number; // 0-1
  relevance: number; // 0-1
}

export interface InteractionEvent {
  type: string;
  timestamp: Date;
  data: any;
  userId?: string;
  visualizationId: string;
}

export interface LearningAnalytics {
  timeSpent: number;
  interactionCount: number;
  conceptsExplored: string[];
  mistakesCount: number;
  hintsUsed: number;
  completionPercentage: number;
  learningVelocity: number; // concepts per minute
}

/**
 * Educational Visualizer Engine
 * Manages interactive visualizations for educational content
 */
export default class EducationalVisualizerEngine {
  private visualizations: Map<string, VisualizationConfig> = new Map();
  private userInteractions: Map<string, InteractionEvent[]> = new Map();
  private analytics: Map<string, LearningAnalytics> = new Map();

  constructor() {
    this.initializeVisualizations();
  }

  /**
   * Initialize built-in visualizations
   */
  private initializeVisualizations(): void {
    // Options Payoff Diagram Visualizer
    const optionsPayoffViz: VisualizationConfig = {
      id: 'options-payoff-basic',
      type: 'options-payoff',
      title: 'Interactive Options Payoff Diagram',
      description: 'Explore how different option strategies perform at various stock prices',
      difficulty: 'beginner',
      parameters: {
        strategyType: 'long-call',
        strikePrice: 100,
        premium: 5,
        stockPriceRange: [80, 120],
        expirationDate: '2024-03-15',
        currentPrice: 105
      },
      learningGoals: [
        'Understand profit/loss at different stock prices',
        'See the impact of premium on breakeven point',
        'Visualize maximum profit and loss scenarios'
      ],
      interactionTypes: ['slider', 'dropdown', 'hover']
    };

    // Position Sizing Calculator Visualizer
    const positionSizingViz: VisualizationConfig = {
      id: 'position-sizing-calculator',
      type: 'position-sizing',
      title: 'Dynamic Position Sizing Calculator',
      description: 'Learn optimal position sizing with real-time risk visualization',
      difficulty: 'beginner',
      parameters: {
        accountSize: 10000,
        riskPercentage: 2,
        stopLossDistance: 5,
        entryPrice: 100,
        showRiskVisualization: true
      },
      learningGoals: [
        'Calculate appropriate position size',
        'Understand risk percentage impact',
        'Visualize account preservation strategies'
      ],
      interactionTypes: ['slider', 'input', 'hover']
    };

    // Kelly Criterion Visualizer
    const kellyViz: VisualizationConfig = {
      id: 'kelly-criterion-simulator',
      type: 'kelly-criterion',
      title: 'Kelly Criterion Simulator',
      description: 'Simulate trading outcomes with different position sizing methods',
      difficulty: 'intermediate',
      parameters: {
        winRate: 0.6,
        avgWin: 100,
        avgLoss: 50,
        initialCapital: 10000,
        numberOfTrades: 100,
        showComparison: true
      },
      learningGoals: [
        'Compare Kelly vs fixed sizing',
        'Understand growth optimization',
        'See risk of over-betting'
      ],
      interactionTypes: ['slider', 'checkbox', 'click']
    };

    // Correlation Matrix Visualizer
    const correlationViz: VisualizationConfig = {
      id: 'correlation-matrix',
      type: 'correlation-matrix',
      title: 'Portfolio Correlation Matrix',
      description: 'Visualize correlations between different positions and sectors',
      difficulty: 'intermediate',
      parameters: {
        assets: ['SPY', 'QQQ', 'IWM', 'TLT', 'GLD'],
        timeframe: '1Y',
        showHeatmap: true,
        highlightThreshold: 0.7
      },
      learningGoals: [
        'Identify highly correlated positions',
        'Understand diversification benefits',
        'Recognize sector concentration risk'
      ],
      interactionTypes: ['hover', 'click', 'dropdown']
    };

    // VIX Risk Analyzer
    const vixRiskViz: VisualizationConfig = {
      id: 'vix-risk-analyzer',
      type: 'vix-risk',
      title: 'VIX and Volatility Risk Analyzer',
      description: 'Analyze how VIX levels affect option positions',
      difficulty: 'advanced',
      parameters: {
        currentVix: 20,
        optionType: 'call',
        timeToExpiration: 30,
        impliedVolatility: 0.25,
        delta: 0.5,
        vega: 0.15
      },
      learningGoals: [
        'Understand VIX impact on options',
        'Learn about volatility risk',
        'Analyze Greeks sensitivity'
      ],
      interactionTypes: ['slider', 'input', 'hover']
    };

    // Add visualizations to the system
    this.visualizations.set(optionsPayoffViz.id, optionsPayoffViz);
    this.visualizations.set(positionSizingViz.id, positionSizingViz);
    this.visualizations.set(kellyViz.id, kellyViz);
    this.visualizations.set(correlationViz.id, correlationViz);
    this.visualizations.set(vixRiskViz.id, vixRiskViz);
  }

  /**
   * Get all available visualizations
   */
  getVisualizations(): VisualizationConfig[] {
    return Array.from(this.visualizations.values());
  }

  /**
   * Get visualization by ID
   */
  getVisualization(id: string): VisualizationConfig | undefined {
    return this.visualizations.get(id);
  }

  /**
   * Get visualizations by type
   */
  getVisualizationsByType(type: VisualizationType): VisualizationConfig[] {
    return this.getVisualizations().filter(viz => viz.type === type);
  }

  /**
   * Get visualizations by difficulty
   */
  getVisualizationsByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): VisualizationConfig[] {
    return this.getVisualizations().filter(viz => viz.difficulty === difficulty);
  }

  /**
   * Generate visualization data based on parameters
   */
  generateVisualizationData(id: string, parameters?: { [key: string]: any }): VisualizationData {
    const config = this.getVisualization(id);
    if (!config) {
      throw new Error(`Visualization ${id} not found`);
    }

    const finalParams = { ...config.parameters, ...parameters };

    switch (config.type) {
      case 'options-payoff':
        return this.generateOptionsPayoffData(finalParams);
      case 'position-sizing':
        return this.generatePositionSizingData(finalParams);
      case 'kelly-criterion':
        return this.generateKellyData(finalParams);
      case 'correlation-matrix':
        return this.generateCorrelationData(finalParams);
      case 'vix-risk':
        return this.generateVixRiskData(finalParams);
      default:
        throw new Error(`Unsupported visualization type: ${config.type}`);
    }
  }

  /**
   * Generate options payoff diagram data
   */
  private generateOptionsPayoffData(params: any): VisualizationData {
    const { strategyType, strikePrice, premium, stockPriceRange, currentPrice } = params;
    const [minPrice, maxPrice] = stockPriceRange;
    const priceStep = (maxPrice - minPrice) / 100;
    
    const chartData = [];
    for (let price = minPrice; price <= maxPrice; price += priceStep) {
      let profitLoss = 0;
      
      switch (strategyType) {
        case 'long-call':
          profitLoss = Math.max(price - strikePrice, 0) - premium;
          break;
        case 'long-put':
          profitLoss = Math.max(strikePrice - price, 0) - premium;
          break;
        case 'short-call':
          profitLoss = premium - Math.max(price - strikePrice, 0);
          break;
        case 'short-put':
          profitLoss = premium - Math.max(strikePrice - price, 0);
          break;
      }
      
      chartData.push({
        stockPrice: price,
        profitLoss,
        breakEven: Math.abs(profitLoss) < 0.1
      });
    }

    const breakEvenPrice = strategyType.includes('call') 
      ? strikePrice + premium 
      : strikePrice - premium;

    return {
      chartData,
      annotations: [
        {
          id: 'breakeven',
          x: breakEvenPrice,
          y: 0,
          text: `Break Even: $${breakEvenPrice.toFixed(2)}`,
          type: 'info'
        },
        {
          id: 'current-price',
          x: currentPrice,
          y: chartData.find(d => Math.abs(d.stockPrice - currentPrice) < priceStep)?.profitLoss || 0,
          text: `Current: $${currentPrice}`,
          type: 'success'
        }
      ],
      highlights: [
        {
          id: 'profit-zone',
          area: { x: breakEvenPrice, y: 0, width: maxPrice - breakEvenPrice, height: 100 },
          color: 'green',
          opacity: 0.1,
          label: 'Profit Zone'
        }
      ],
      insights: [
        {
          id: 'max-loss',
          category: 'risk',
          title: 'Maximum Loss',
          description: `Maximum loss is limited to the premium paid: $${premium}`,
          confidence: 1,
          relevance: 1
        },
        {
          id: 'breakeven-analysis',
          category: 'education',
          title: 'Break Even Point',
          description: `Stock needs to move ${Math.abs(currentPrice - breakEvenPrice).toFixed(2)} points to break even`,
          confidence: 1,
          relevance: 0.9
        }
      ]
    };
  }

  /**
   * Generate position sizing data
   */
  private generatePositionSizingData(params: any): VisualizationData {
    const { accountSize, riskPercentage, stopLossDistance, entryPrice } = params;
    
    const riskAmount = accountSize * (riskPercentage / 100);
    const positionSize = Math.floor(riskAmount / stopLossDistance);
    const totalInvestment = positionSize * entryPrice;
    const investmentPercentage = (totalInvestment / accountSize) * 100;

    const chartData = [
      { category: 'Safe Capital', value: accountSize - riskAmount, percentage: 100 - riskPercentage },
      { category: 'Risk Capital', value: riskAmount, percentage: riskPercentage }
    ];

    const scenarios = [];
    for (let risk = 0.5; risk <= 10; risk += 0.5) {
      const scenarioRisk = accountSize * (risk / 100);
      const scenarioPosition = Math.floor(scenarioRisk / stopLossDistance);
      scenarios.push({
        riskPercentage: risk,
        positionSize: scenarioPosition,
        maxLoss: scenarioRisk,
        surviveTrades: Math.floor(100 / risk) // Approximate trades before account blown
      });
    }

    return {
      chartData: [...chartData, ...scenarios],
      annotations: [
        {
          id: 'recommended-risk',
          x: 2,
          y: 0,
          text: 'Recommended: 1-2%',
          type: 'success'
        },
        {
          id: 'danger-zone',
          x: 5,
          y: 0,
          text: 'Danger Zone: >5%',
          type: 'danger'
        }
      ],
      highlights: [
        {
          id: 'safe-zone',
          area: { x: 0, y: 0, width: 2, height: 100 },
          color: 'green',
          opacity: 0.1,
          label: 'Safe Zone'
        }
      ],
      insights: [
        {
          id: 'position-size',
          category: 'education',
          title: 'Calculated Position Size',
          description: `Based on your risk tolerance, you should buy ${positionSize} shares`,
          confidence: 1,
          relevance: 1
        },
        {
          id: 'investment-percentage',
          category: 'risk',
          title: 'Capital Allocation',
          description: `This represents ${investmentPercentage.toFixed(1)}% of your account`,
          confidence: 1,
          relevance: 0.8
        }
      ]
    };
  }

  /**
   * Generate Kelly Criterion simulation data
   */
  private generateKellyData(params: any): VisualizationData {
    const { winRate, avgWin, avgLoss, initialCapital, numberOfTrades } = params;
    
    // Calculate Kelly percentage
    const kellyPercentage = (winRate * avgWin - (1 - winRate) * avgLoss) / avgWin;
    const safeKelly = Math.max(0, Math.min(kellyPercentage * 0.5, 0.25)); // Half Kelly, capped at 25%

    // Simulate trades
    const kellyResults = this.simulateTrading(initialCapital, numberOfTrades, winRate, avgWin, avgLoss, safeKelly);
    const fixedResults = this.simulateTrading(initialCapital, numberOfTrades, winRate, avgWin, avgLoss, 0.02); // 2% fixed

    const chartData = kellyResults.map((value, index) => ({
      trade: index,
      kellyMethod: value,
      fixedMethod: fixedResults[index],
      difference: value - fixedResults[index]
    }));

    return {
      chartData,
      annotations: [
        {
          id: 'kelly-percentage',
          x: numberOfTrades / 2,
          y: Math.max(...kellyResults),
          text: `Kelly %: ${(safeKelly * 100).toFixed(1)}%`,
          type: 'info'
        }
      ],
      highlights: [],
      insights: [
        {
          id: 'kelly-advantage',
          category: 'opportunity',
          title: 'Kelly Advantage',
          description: `Kelly method shows ${((kellyResults[kellyResults.length - 1] / fixedResults[fixedResults.length - 1] - 1) * 100).toFixed(1)}% better performance`,
          confidence: 0.8,
          relevance: 1
        },
        {
          id: 'volatility-warning',
          category: 'warning',
          title: 'Volatility Risk',
          description: 'Kelly method has higher volatility - consider using half-Kelly for safety',
          confidence: 0.9,
          relevance: 0.8
        }
      ]
    };
  }

  /**
   * Generate correlation matrix data
   */
  private generateCorrelationData(params: any): VisualizationData {
    const { assets } = params;
    
    // Generate sample correlation data (in real app, this would come from market data)
    const correlationMatrix = [];
    for (let i = 0; i < assets.length; i++) {
      const row = [];
      for (let j = 0; j < assets.length; j++) {
        if (i === j) {
          row.push(1);
        } else {
          // Generate realistic correlation values
          const correlation = Math.random() * 0.8 + 0.1; // 0.1 to 0.9
          row.push(Number(correlation.toFixed(2)));
        }
      }
      correlationMatrix.push(row);
    }

    const chartData = [];
    for (let i = 0; i < assets.length; i++) {
      for (let j = 0; j < assets.length; j++) {
        chartData.push({
          x: assets[i],
          y: assets[j],
          correlation: correlationMatrix[i][j],
          risk: correlationMatrix[i][j] > 0.7 ? 'high' : correlationMatrix[i][j] > 0.4 ? 'medium' : 'low'
        });
      }
    }

    const highCorrelations = chartData.filter(d => d.correlation > 0.7 && d.x !== d.y);

    return {
      chartData,
      annotations: [],
      highlights: highCorrelations.map((item, index) => ({
        id: `high-corr-${index}`,
        area: { x: 0, y: 0, width: 1, height: 1 }, // Will be positioned by component
        color: 'red',
        opacity: 0.3,
        label: `High Correlation: ${item.correlation}`
      })),
      insights: [
        {
          id: 'diversification',
          category: 'risk',
          title: 'Diversification Analysis',
          description: `Found ${highCorrelations.length} high correlation pairs that may indicate concentration risk`,
          confidence: 0.9,
          relevance: 1
        }
      ]
    };
  }

  /**
   * Generate VIX risk analysis data
   */
  private generateVixRiskData(params: any): VisualizationData {
    const { currentVix, optionType, timeToExpiration, impliedVolatility, delta, vega } = params;
    
    const vixScenarios = [];
    for (let vix = 10; vix <= 50; vix += 2) {
      const volChange = (vix - currentVix) / 100; // Simplified VIX to vol relationship
      const newIV = impliedVolatility + volChange;
      const vegaImpact = vega * volChange * 100; // Vega impact per 1% vol change
      
      vixScenarios.push({
        vix,
        impliedVol: newIV,
        vegaImpact,
        totalImpact: vegaImpact,
        scenario: vix < 20 ? 'Low Vol' : vix < 30 ? 'Normal' : 'High Vol'
      });
    }

    return {
      chartData: vixScenarios,
      annotations: [
        {
          id: 'current-vix',
          x: currentVix,
          y: 0,
          text: `Current VIX: ${currentVix}`,
          type: 'info'
        }
      ],
      highlights: [
        {
          id: 'high-vol-zone',
          area: { x: 30, y: -100, width: 20, height: 200 },
          color: 'red',
          opacity: 0.1,
          label: 'High Volatility Risk'
        }
      ],
      insights: [
        {
          id: 'vix-sensitivity',
          category: 'risk',
          title: 'Volatility Sensitivity',
          description: `Your position will gain/lose $${Math.abs(vega * 10).toFixed(2)} for each 10% change in volatility`,
          confidence: 0.9,
          relevance: 1
        }
      ]
    };
  }

  /**
   * Simulate trading with different position sizing methods
   */
  private simulateTrading(
    initialCapital: number,
    trades: number,
    winRate: number,
    avgWin: number,
    avgLoss: number,
    sizingPercentage: number
  ): number[] {
    const results = [initialCapital];
    let capital = initialCapital;

    for (let i = 0; i < trades; i++) {
      const isWin = Math.random() < winRate;
      const positionSize = capital * sizingPercentage;
      
      if (isWin) {
        capital += positionSize * (avgWin / 100);
      } else {
        capital -= positionSize * (avgLoss / 100);
      }
      
      results.push(Math.max(0, capital)); // Can't go below zero
    }

    return results;
  }

  /**
   * Record user interaction
   */
  recordInteraction(event: InteractionEvent): void {
    const userId = event.userId || 'anonymous';
    const userInteractions = this.userInteractions.get(userId) || [];
    userInteractions.push(event);
    this.userInteractions.set(userId, userInteractions);

    this.updateAnalytics(userId, event);
  }

  /**
   * Update learning analytics
   */
  private updateAnalytics(userId: string, event: InteractionEvent): void {
    const analytics = this.analytics.get(userId) || {
      timeSpent: 0,
      interactionCount: 0,
      conceptsExplored: [],
      mistakesCount: 0,
      hintsUsed: 0,
      completionPercentage: 0,
      learningVelocity: 0
    };

    analytics.interactionCount++;
    
    // Update based on event type
    if (event.type === 'concept-explored') {
      if (!analytics.conceptsExplored.includes(event.data.concept)) {
        analytics.conceptsExplored.push(event.data.concept);
      }
    } else if (event.type === 'mistake') {
      analytics.mistakesCount++;
    } else if (event.type === 'hint-used') {
      analytics.hintsUsed++;
    }

    this.analytics.set(userId, analytics);
  }

  /**
   * Get learning analytics for a user
   */
  getAnalytics(userId: string): LearningAnalytics | undefined {
    return this.analytics.get(userId);
  }

  /**
   * Get recommended next visualization based on user progress
   */
  getRecommendedVisualization(userId: string, currentLevel: 'beginner' | 'intermediate' | 'advanced'): VisualizationConfig | null {
    const userInteractions = this.userInteractions.get(userId) || [];
    const completedVisualizations = new Set(
      userInteractions
        .filter(event => event.type === 'completed')
        .map(event => event.visualizationId)
    );

    const availableVisualizations = this.getVisualizationsByDifficulty(currentLevel)
      .filter(viz => !completedVisualizations.has(viz.id))
             .sort((a, b) => {
         // Prioritize based on type (options first for beginners)
         const typeOrder: Record<VisualizationType, number> = { 
           'options-payoff': 1, 
           'position-sizing': 2, 
           'kelly-criterion': 3, 
           'correlation-matrix': 4, 
           'vix-risk': 5,
           'portfolio-risk': 6
         };
         return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
       });

    return availableVisualizations[0] || null;
  }
} 