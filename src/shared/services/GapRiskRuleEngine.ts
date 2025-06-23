/**
 * Gap Risk Rule Engine
 * 
 * Evaluates positions against trading style-specific gap risk rules
 * and generates actionable recommendations.
 */

import { 
  GapRiskRule,
  GapRiskAction,
  GapRiskRuleContext,
  GapRiskEvaluationResult,
  TradingStyleGapAssessment,
  GapRiskRecommendation,
  TradingStyleConfig,
  GapRiskEngineConfig,
  MarketSession
} from '../../types/tradingStyleRules';
import { WeekendGapRiskService } from '../../features/risk-management/services/WeekendGapRiskService';
import { TradingStyleConfigService } from './TradingStyleConfigService';
import { evaluateCondition } from '../../features/trading/utils/ruleEngine/conditionEvaluator';
import { NormalizedTradeData } from '../../types/trade';
import { PositionGapRisk } from '../../features/risk-management/types/gapRisk';

export class GapRiskRuleEngine {
  private weekendGapRiskService: WeekendGapRiskService;
  private tradingStyleConfigService: TradingStyleConfigService;
  private evaluationCache: Map<string, GapRiskEvaluationResult[]> = new Map();
  private config: GapRiskEngineConfig;

  constructor(
    weekendGapRiskService: WeekendGapRiskService,
    tradingStyleConfigService: TradingStyleConfigService,
    config?: Partial<GapRiskEngineConfig>
  ) {
    this.weekendGapRiskService = weekendGapRiskService;
    this.tradingStyleConfigService = tradingStyleConfigService;
    this.config = {
      ...tradingStyleConfigService.getEngineConfig(),
      ...config
    };
  }

  /**
   * Evaluate positions against gap risk rules for a specific user
   */
  public async evaluatePositions(
    userId: string,
    positions: NormalizedTradeData[],
    rules: GapRiskRule[]
  ): Promise<TradingStyleGapAssessment> {
    const userConfig = this.tradingStyleConfigService.getConfigForUser(userId);
    const positionEvaluations: GapRiskEvaluationResult[] = [];
    let totalWeekendExposure = 0;
    let totalPositionValue = 0;

    // Check cache first
    const cacheKey = `${userId}-${Date.now()}`;
    
    for (const position of positions) {
      try {
        // Get gap risk analysis for position
        const gapRiskResult = await this.weekendGapRiskService.analyzePositionGapRisk(position);
        
        if (!gapRiskResult.success || !gapRiskResult.data) {
          console.warn(`Failed to analyze gap risk for position ${position.symbol}`);
          continue;
        }

        // Only use if data is a PositionGapRisk
        if ('positionId' in gapRiskResult.data) {
          const positionGapRisk = gapRiskResult.data as PositionGapRisk;
          const positionValue = Math.abs((position.quantity || 0) * (position.tradePrice || 0));
          totalPositionValue += positionValue;

          // Create rule evaluation context
          const context = await this.createRuleContext(position, positionGapRisk, userConfig);
          
          // If position allows weekend holding, add to weekend exposure
          if (userConfig.weekendHoldingAllowed) {
            totalWeekendExposure += positionValue;
          }

          // Evaluate applicable rules
          const applicableRules = this.getApplicableRules(rules, userConfig);
          const evaluation = await this.evaluateRulesForPosition(context, applicableRules);
          
          positionEvaluations.push(...evaluation);
        } else {
          console.warn(`Gap risk result for ${position.symbol} is not a PositionGapRisk, skipping.`);
        }
      } catch (error) {
        console.error(`Error evaluating position ${position.symbol}:`, error);
      }
    }

    // Calculate portfolio metrics
    const portfolioMetrics = this.calculatePortfolioMetrics(
      positionEvaluations,
      totalPositionValue,
      totalWeekendExposure
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(positionEvaluations, userConfig);

    // Calculate overall risk assessment
    const overallRiskScore = this.calculateOverallRiskScore(positionEvaluations);
    const riskLevel = this.getRiskLevel(overallRiskScore);

    // Create summary
    const summary = {
      totalPositionsEvaluated: positions.length,
      highRiskPositions: positionEvaluations.filter(e => e.riskLevel === 'high' || e.riskLevel === 'extreme').length,
      recommendedActions: recommendations.length,
      estimatedRiskReduction: recommendations.reduce((total, rec) => total + (rec.riskReduction || 0), 0)
    };

    return {
      userId,
      tradingStyle: userConfig,
      overallRiskScore,
      riskLevel,
      positionEvaluations,
      portfolioMetrics,
      recommendations,
      summary,
      assessmentDate: new Date(),
      validUntil: new Date(Date.now() + this.config.cacheDuration * 60000),
      version: '1.0'
    };
  }

  /**
   * Create rule evaluation context for a position
   */
  private async createRuleContext(
    position: NormalizedTradeData,
    gapRisk: PositionGapRisk,
    tradingStyle: TradingStyleConfig
  ): Promise<GapRiskRuleContext> {
    const now = new Date();
    const daysToWeekend = this.getDaysToWeekend(now);
    
    // Get volatility regime using historical price data
    const volatilityRegime = await this.getCurrentVolatilityRegime(position.symbol);

    return {
      position: {
        symbol: position.symbol,
        size: Math.abs(position.quantity || 0),
        value: Math.abs((position.quantity || 0) * (position.tradePrice || 0)),
        entryDate: new Date(position.dateTime || position.tradeDate || now),
        assetClass: position.assetCategory || 'Unknown'
      },
      gapRisk,
      portfolio: {
        totalValue: tradingStyle.accountSize,
        totalExposure: 0, // Will be calculated at portfolio level
        weekendExposure: 0, // Will be calculated at portfolio level
        positions: []
      },
      market: {
        volatilityRegime,
        daysToWeekend,
        marketSession: this.getCurrentMarketSession(now),
        vixLevel: undefined // Could be integrated if available
      },
      tradingStyle,
      timestamp: now
    };
  }

  /**
   * Get current volatility regime for a symbol
   */
  private async getCurrentVolatilityRegime(symbol: string): Promise<string> {
    try {
      // This would ideally fetch actual historical price data
      // For now, return a placeholder
      return 'Medium';
    } catch (error) {
      console.warn(`Could not determine volatility regime for ${symbol}:`, error);
      return 'Unknown';
    }
  }

  /**
   * Evaluate rules for a specific position
   */
  private async evaluateRulesForPosition(
    context: GapRiskRuleContext,
    rules: GapRiskRule[]
  ): Promise<GapRiskEvaluationResult[]> {
    const results: GapRiskEvaluationResult[] = [];

    for (const rule of rules) {
      try {
        const result = await this.evaluateRule(rule, context);
        results.push(result);
      } catch (error) {
        console.error(`Error evaluating rule ${rule.id}:`, error);
      }
    }

    return results;
  }

  /**
   * Evaluate a single rule against context
   */
  private async evaluateRule(
    rule: GapRiskRule,
    context: GapRiskRuleContext
  ): Promise<GapRiskEvaluationResult> {
    // For demonstration, assume a single condition check (expand as needed)
    const triggered = true; // Replace with actual logic using rule.gapRiskConditions
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      triggered,
      riskLevel: triggered ? 'high' : 'low',
      riskScore: triggered ? 80 : 10,
      recommendedActions: [], // Fill with GapRiskAction[] as needed
      reasoning: triggered ? 'Gap risk threshold exceeded.' : 'No significant gap risk.',
      triggers: triggered ? ['gapRiskScore'] : [],
      evaluatedAt: new Date(),
      applicableStyle: context.tradingStyle.style
    };
  }

  /**
   * Get applicable rules based on trading style
   */
  private getApplicableRules(rules: GapRiskRule[], tradingStyle: TradingStyleConfig): GapRiskRule[] {
    return rules.filter(rule =>
      rule.applicableStyles.includes(tradingStyle.style) &&
      rule.applicableRiskTolerance.includes(tradingStyle.riskTolerance)
    );
  }

  /**
   * Calculate portfolio-level metrics
   */
  private calculatePortfolioMetrics(
    evaluations: GapRiskEvaluationResult[],
    totalValue: number,
    weekendExposure: number
  ) {
    const highRiskCount = evaluations.filter(e => e.riskLevel === 'high' || e.riskLevel === 'extreme').length;
    const concentrationRisk = weekendExposure / totalValue;
    return {
      totalWeekendExposure: weekendExposure,
      concentrationRisk,
      diversificationScore: Math.max(0, 1 - concentrationRisk)
    };
  }

  /**
   * Generate recommendations based on evaluations
   */
  private generateRecommendations(
    evaluations: GapRiskEvaluationResult[],
    tradingStyle: TradingStyleConfig
  ): GapRiskRecommendation[] {
    // Example: create a recommendation for each triggered evaluation
    return evaluations.filter(e => e.triggered).map(evaluation => ({
      priority: evaluation.riskLevel === 'extreme' ? 'critical' : evaluation.riskLevel,
      action: evaluation.recommendedActions[0]?.type || 'send_alert',
      description: evaluation.reasoning,
      reasoning: evaluation.reasoning,
      metadata: {
        ruleId: evaluation.ruleId,
        evaluatedAt: evaluation.evaluatedAt
      }
    }));
  }

  /**
   * Calculate overall risk score
   */
  private calculateOverallRiskScore(evaluations: GapRiskEvaluationResult[]): number {
    if (evaluations.length === 0) return 0;
    
    const riskLevelWeights = { low: 1, medium: 2.5, high: 4, extreme: 5 };
    const totalWeight = evaluations.reduce((sum, e) => sum + riskLevelWeights[e.riskLevel], 0);
    
    return Math.min(10, totalWeight / evaluations.length);
  }

  /**
   * Get risk level from score
   */
  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'extreme' {
    if (score >= 4.5) return 'extreme';
    if (score >= 3.5) return 'high';
    if (score >= 2.0) return 'medium';
    return 'low';
  }

  /**
   * Get days until weekend
   */
  private getDaysToWeekend(date: Date): number {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 ? 0 : dayOfWeek === 6 ? 0 : 6 - dayOfWeek;
  }

  /**
   * Get current market session
   */
  private getCurrentMarketSession(date: Date): MarketSession {
    const hour = date.getHours();
    if (hour >= 9 && hour < 16) return 'regular_hours';
    if (hour >= 4 && hour < 9) return 'pre_market';
    if (hour >= 16 && hour < 20) return 'after_hours';
    return 'weekend';
  }

  /**
   * Update the engine configuration
   */
  public updateConfig(newConfig: Partial<GapRiskEngineConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig
    };
  }

  /**
   * Clear the evaluation cache
   */
  public clearCache(): void {
    this.evaluationCache.clear();
  }
}