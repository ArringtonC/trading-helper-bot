/**
 * Trading Style Configuration Service
 * 
 * Manages user trading style preferences and configurations
 * for gap risk analysis and rule engine evaluation.
 */

import { 
  TradingStyle, 
  RiskTolerance, 
  TradingStyleConfig,
  GapRiskEngineConfig
} from '../../types/tradingStyleRules';
import { GapMagnitude } from '../../types/gapRisk';
import { STRATEGY_GUIDELINES } from '../data/positionSizingBestPractices';

export class TradingStyleConfigService {
  private userConfigs: Map<string, TradingStyleConfig> = new Map();
  private engineConfig: GapRiskEngineConfig;

  constructor(engineConfig?: Partial<GapRiskEngineConfig>) {
    this.engineConfig = {
      ...this.getDefaultEngineConfig(),
      ...engineConfig
    };
  }

  /**
   * Get default trading style configuration for a specific style
   */
  public getDefaultConfigForStyle(style: TradingStyle, riskTolerance: RiskTolerance = 'moderate'): TradingStyleConfig {
    const strategyData = STRATEGY_GUIDELINES[style];
    
    const baseConfig: TradingStyleConfig = {
      style,
      riskTolerance,
      maxPositionSize: strategyData.maxPositionSize,
      maxTotalExposure: strategyData.maxTotalExposure,
      typicalHoldTime: this.getTypicalHoldTime(style),
      weekendHoldingAllowed: this.isWeekendHoldingAllowed(style),
      maxGapRiskScore: this.getMaxGapRiskScore(style, riskTolerance),
      acceptableGapMagnitudes: this.getAcceptableGapMagnitudes(style, riskTolerance),
      accountSize: 50000, // Default account size
      availableBuyingPower: 45000, // 90% of account size
      strategyParameters: this.getDefaultStrategyParameters(style)
    };

    return this.adjustForRiskTolerance(baseConfig, riskTolerance);
  }

  /**
   * Get user-specific trading style configuration
   */
  public getUserConfig(userId: string): TradingStyleConfig | null {
    return this.userConfigs.get(userId) || null;
  }

  /**
   * Set user trading style configuration
   */
  public setUserConfig(userId: string, config: TradingStyleConfig): void {
    // Validate configuration
    this.validateConfig(config);
    
    // Store configuration
    this.userConfigs.set(userId, { ...config });
  }

  /**
   * Update specific fields of user configuration
   */
  public updateUserConfig(userId: string, updates: Partial<TradingStyleConfig>): TradingStyleConfig {
    const currentConfig = this.getUserConfig(userId);
    if (!currentConfig) {
      throw new Error(`No configuration found for user ${userId}`);
    }

    const updatedConfig = { ...currentConfig, ...updates };
    this.setUserConfig(userId, updatedConfig);
    return updatedConfig;
  }

  /**
   * Get configuration for user or default for style
   */
  public getConfigForUser(userId: string, fallbackStyle?: TradingStyle, fallbackRiskTolerance?: RiskTolerance): TradingStyleConfig {
    const userConfig = this.getUserConfig(userId);
    if (userConfig) {
      return userConfig;
    }

    if (fallbackStyle) {
      return this.getDefaultConfigForStyle(fallbackStyle, fallbackRiskTolerance);
    }

    // Default to moderate swing trading if no style specified
    return this.getDefaultConfigForStyle('swing_trading', 'moderate');
  }

  /**
   * Get engine configuration
   */
  public getEngineConfig(): GapRiskEngineConfig {
    return { ...this.engineConfig };
  }

  /**
   * Update engine configuration
   */
  public updateEngineConfig(updates: Partial<GapRiskEngineConfig>): void {
    this.engineConfig = { ...this.engineConfig, ...updates };
  }

  /**
   * Get all supported trading styles with their descriptions
   */
  public getSupportedTradingStyles(): Array<{ style: TradingStyle; description: string; holdTime: number }> {
    return [
      {
        style: 'day_trading',
        description: 'Intraday positions closed before market close',
        holdTime: 0.5
      },
      {
        style: 'scalping',
        description: 'Very short-term trades lasting minutes to hours',
        holdTime: 0.1
      },
      {
        style: 'swing_trading',
        description: 'Multi-day positions lasting days to weeks',
        holdTime: 7
      },
      {
        style: 'position_trading',
        description: 'Long-term positions lasting weeks to months',
        holdTime: 60
      }
    ];
  }

  /**
   * Determine if a trading style typically allows weekend holding
   */
  private isWeekendHoldingAllowed(style: TradingStyle): boolean {
    switch (style) {
      case 'day_trading':
      case 'scalping':
        return false; // These styles typically close before weekends
      case 'swing_trading':
      case 'position_trading':
        return true; // These styles often hold through weekends
      default:
        return false;
    }
  }

  /**
   * Get typical holding time for a trading style (in days)
   */
  private getTypicalHoldTime(style: TradingStyle): number {
    switch (style) {
      case 'scalping':
        return 0.1; // Hours
      case 'day_trading':
        return 0.5; // Half day max
      case 'swing_trading':
        return 7; // About a week
      case 'position_trading':
        return 60; // About 2 months
      default:
        return 1;
    }
  }

  /**
   * Get maximum acceptable gap risk score for style and risk tolerance
   */
  private getMaxGapRiskScore(style: TradingStyle, riskTolerance: RiskTolerance): number {
    const baseScores = {
      scalping: 30,
      day_trading: 40,
      swing_trading: 60,
      position_trading: 80
    };

    const riskMultipliers = {
      conservative: 0.7,
      moderate: 1.0,
      aggressive: 1.3
    };

    return Math.min(100, baseScores[style] * riskMultipliers[riskTolerance]);
  }

  /**
   * Get acceptable gap magnitudes for style and risk tolerance
   */
  private getAcceptableGapMagnitudes(style: TradingStyle, riskTolerance: RiskTolerance): GapMagnitude[] {
    if (style === 'day_trading' || style === 'scalping') {
      // Short-term styles avoid weekend gaps entirely
      return [];
    }

    switch (riskTolerance) {
      case 'conservative':
        return [GapMagnitude.SMALL];
      case 'moderate':
        return [GapMagnitude.SMALL, GapMagnitude.MEDIUM];
      case 'aggressive':
        return [GapMagnitude.SMALL, GapMagnitude.MEDIUM, GapMagnitude.LARGE];
      default:
        return [GapMagnitude.SMALL];
    }
  }

  /**
   * Get default strategy-specific parameters
   */
  private getDefaultStrategyParameters(style: TradingStyle): Record<string, any> {
    switch (style) {
      case 'scalping':
        return {
          maxTradesPerDay: 50,
          targetProfitPips: 5,
          stopLossPips: 3,
          timeoutMinutes: 30
        };
      case 'day_trading':
        return {
          maxTradesPerDay: 10,
          targetProfitPercent: 2,
          stopLossPercent: 1,
          closeBeforeMarketEnd: true
        };
      case 'swing_trading':
        return {
          maxConcurrentPositions: 8,
          targetProfitPercent: 10,
          stopLossPercent: 5,
          rebalanceFrequency: 'weekly'
        };
      case 'position_trading':
        return {
          maxConcurrentPositions: 15,
          targetProfitPercent: 25,
          stopLossPercent: 10,
          rebalanceFrequency: 'monthly'
        };
      default:
        return {};
    }
  }

  /**
   * Adjust configuration based on risk tolerance
   */
  private adjustForRiskTolerance(config: TradingStyleConfig, riskTolerance: RiskTolerance): TradingStyleConfig {
    const riskMultipliers = {
      conservative: { position: 0.7, exposure: 0.7 },
      moderate: { position: 1.0, exposure: 1.0 },
      aggressive: { position: 1.3, exposure: 1.3 }
    };

    const multiplier = riskMultipliers[riskTolerance];
    
    return {
      ...config,
      maxPositionSize: Math.min(config.maxPositionSize * multiplier.position, 15), // Cap at 15%
      maxTotalExposure: Math.min(config.maxTotalExposure * multiplier.exposure, 100), // Cap at 100%
      riskTolerance
    };
  }

  /**
   * Validate trading style configuration
   */
  private validateConfig(config: TradingStyleConfig): void {
    if (config.maxPositionSize <= 0 || config.maxPositionSize > 25) {
      throw new Error('Max position size must be between 0 and 25%');
    }

    if (config.maxTotalExposure <= 0 || config.maxTotalExposure > 200) {
      throw new Error('Max total exposure must be between 0 and 200%');
    }

    if (config.accountSize <= 0) {
      throw new Error('Account size must be positive');
    }

    if (config.availableBuyingPower > config.accountSize * 4) {
      throw new Error('Available buying power cannot exceed 4x account size');
    }

    if (config.maxGapRiskScore < 0 || config.maxGapRiskScore > 100) {
      throw new Error('Max gap risk score must be between 0 and 100');
    }

    if (config.typicalHoldTime < 0) {
      throw new Error('Typical hold time must be non-negative');
    }
  }

  /**
   * Get default engine configuration
   */
  private getDefaultEngineConfig(): GapRiskEngineConfig {
    return {
      enableRealTimeEvaluation: true,
      evaluationInterval: 15, // 15 minutes
      
      globalRiskThresholds: {
        low: 25,
        medium: 50,
        high: 75,
        extreme: 90
      },
      
      autoExecuteActions: false, // Require manual approval for safety
      requireApprovalForHighRisk: true,
      
      notificationChannels: ['email', 'push'],
      alertThresholds: {
        info: 40,
        warning: 65,
        critical: 85
      },
      
      cacheDuration: 10, // 10 minutes
      maxConcurrentEvaluations: 50,
      
      integrations: {
        weekendGapRiskService: true,
        marketAnalysisService: true,
        riskService: true
      }
    };
  }

  /**
   * Calculate position size based on style and risk parameters
   */
  public calculateRecommendedPositionSize(
    config: TradingStyleConfig, 
    riskScore: number, 
    currentPrice: number
  ): number {
    // Base position size from configuration
    let positionSize = config.maxPositionSize;
    
    // Adjust based on gap risk score
    const riskAdjustment = Math.max(0.1, 1 - (riskScore / 100));
    positionSize *= riskAdjustment;
    
    // Apply style-specific constraints
    positionSize = this.applyStyleConstraints(positionSize, config.style);
    
    // Calculate dollar amount
    const positionValue = (config.accountSize * positionSize / 100);
    const shares = Math.floor(positionValue / currentPrice);
    
    return Math.max(1, shares); // At least 1 share
  }

  /**
   * Apply trading style specific position size constraints
   */
  private applyStyleConstraints(positionSize: number, style: TradingStyle): number {
    const styleConstraints = {
      scalping: 2,    // Very small positions
      day_trading: 5, // Small positions  
      swing_trading: 8, // Moderate positions
      position_trading: 12 // Larger positions allowed
    };

    return Math.min(positionSize, styleConstraints[style]);
  }
} 