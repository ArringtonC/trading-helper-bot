/**
 * TieredRiskManager - Level-Based Risk Management System
 * 
 * Research Integration:
 * - Fixed percentage risk as most popular professional method
 * - Volatility-based position sizing for advanced accounts
 * - Account level specific risk parameters
 * - Dynamic risk adjustment based on performance
 */

import { ACCOUNT_LEVELS, RISK_PARAMETERS } from './AccountLevelSystem';

/**
 * Risk Calculation Methods
 */
const RISK_METHODS = {
  FIXED_PERCENTAGE: 'fixed_percentage',
  VOLATILITY_BASED: 'volatility_based',
  KELLY_CRITERION: 'kelly_criterion',
  VALUE_AT_RISK: 'value_at_risk'
};

/**
 * Position Sizing Models
 */
const POSITION_SIZING_MODELS = {
  SIMPLE: 'simple',           // Basic percentage of account
  ATR_BASED: 'atr_based',     // Average True Range based
  VOLATILITY: 'volatility',   // Historical volatility based
  CORRELATION: 'correlation'  // Portfolio correlation adjusted
};

/**
 * Risk Adjustment Factors
 */
const RISK_ADJUSTMENT_FACTORS = {
  MARKET_VOLATILITY: {
    LOW: 0.8,     // VIX < 15
    NORMAL: 1.0,  // VIX 15-25
    HIGH: 1.2,    // VIX 25-35
    EXTREME: 1.5  // VIX > 35
  },
  ACCOUNT_PERFORMANCE: {
    EXCELLENT: 0.9,   // Recent performance > 20%
    GOOD: 1.0,        // Recent performance 10-20%
    AVERAGE: 1.1,     // Recent performance 0-10%
    POOR: 1.3,        // Recent performance < 0%
    TERRIBLE: 1.5     // Recent performance < -10%
  },
  POSITION_CORRELATION: {
    LOW: 0.9,      // Correlation < 0.3
    MEDIUM: 1.0,   // Correlation 0.3-0.7
    HIGH: 1.2      // Correlation > 0.7
  }
};

export class TieredRiskManager {
  constructor() {
    this.riskCalculations = [];
    this.performanceHistory = [];
    this.marketConditions = {
      volatility: 'NORMAL',
      trend: 'NEUTRAL',
      lastUpdated: Date.now()
    };
  }

  /**
   * Calculate position size based on account level and risk parameters
   */
  async calculatePositionSize(accountLevel, accountData, tradeData) {
    try {
      const riskParams = RISK_PARAMETERS[accountLevel];
      if (!riskParams) {
        throw new Error(`Invalid account level: ${accountLevel}`);
      }

      const calculation = {
        accountLevel,
        accountBalance: accountData.balance || 0,
        riskPerTrade: riskParams.riskPerTrade,
        maxPositionSize: riskParams.maxPositionSize,
        timestamp: Date.now()
      };

      // Select appropriate risk method based on account level
      const riskMethod = this.selectRiskMethod(accountLevel, riskParams);
      calculation.riskMethod = riskMethod;

      // Calculate base position size
      const basePositionSize = await this.calculateBasePositionSize(
        riskMethod, 
        calculation, 
        tradeData, 
        riskParams
      );

      // Apply risk adjustments
      const adjustedPositionSize = this.applyRiskAdjustments(
        basePositionSize, 
        accountLevel, 
        accountData, 
        tradeData
      );

      // Enforce level-specific constraints
      const finalPositionSize = this.enforceConstraints(
        adjustedPositionSize, 
        riskParams, 
        accountData, 
        tradeData
      );

      calculation.basePositionSize = basePositionSize;
      calculation.adjustedPositionSize = adjustedPositionSize;
      calculation.finalPositionSize = finalPositionSize;
      calculation.constraints = this.getAppliedConstraints(riskParams, tradeData);

      // Store calculation for analysis
      this.riskCalculations.push(calculation);

      return {
        positionSize: finalPositionSize,
        dollarAmount: finalPositionSize * (tradeData.price || 0),
        sharesOrContracts: Math.floor((finalPositionSize * accountData.balance) / (tradeData.price || 1)),
        riskAmount: calculation.riskPerTrade * accountData.balance,
        stopLossPrice: this.calculateStopLoss(tradeData, calculation.riskPerTrade, accountData.balance),
        calculation,
        recommendations: this.generateRiskRecommendations(calculation, tradeData)
      };
    } catch (error) {
      console.error('Position size calculation failed:', error);
      throw error;
    }
  }

  /**
   * Select appropriate risk calculation method based on account level
   */
  selectRiskMethod(accountLevel, riskParams) {
    switch (accountLevel) {
      case ACCOUNT_LEVELS.BEGINNER:
        return RISK_METHODS.FIXED_PERCENTAGE; // Simple and consistent

      case ACCOUNT_LEVELS.INTERMEDIATE:
        return riskParams.volatilityBasedSizing ? 
          RISK_METHODS.VOLATILITY_BASED : 
          RISK_METHODS.FIXED_PERCENTAGE;

      case ACCOUNT_LEVELS.ADVANCED:
        return RISK_METHODS.VOLATILITY_BASED; // Most sophisticated

      default:
        return RISK_METHODS.FIXED_PERCENTAGE;
    }
  }

  /**
   * Calculate base position size using selected method
   */
  async calculateBasePositionSize(riskMethod, calculation, tradeData, riskParams) {
    switch (riskMethod) {
      case RISK_METHODS.FIXED_PERCENTAGE:
        return this.calculateFixedPercentageSize(calculation, tradeData, riskParams);

      case RISK_METHODS.VOLATILITY_BASED:
        return await this.calculateVolatilityBasedSize(calculation, tradeData, riskParams);

      case RISK_METHODS.KELLY_CRITERION:
        return await this.calculateKellySize(calculation, tradeData, riskParams);

      case RISK_METHODS.VALUE_AT_RISK:
        return await this.calculateVaRSize(calculation, tradeData, riskParams);

      default:
        return this.calculateFixedPercentageSize(calculation, tradeData, riskParams);
    }
  }

  /**
   * Fixed percentage position sizing (most popular professional method)
   */
  calculateFixedPercentageSize(calculation, tradeData, riskParams) {
    const accountBalance = calculation.accountBalance;
    const riskPerTrade = calculation.riskPerTrade;
    const entryPrice = tradeData.price || tradeData.entryPrice || 0;
    const stopLossPrice = tradeData.stopLoss || (entryPrice * 0.98); // Default 2% stop

    if (entryPrice <= 0 || stopLossPrice <= 0) {
      return riskParams.maxPositionSize * 0.5; // Conservative fallback
    }

    const riskPerShare = Math.abs(entryPrice - stopLossPrice);
    const totalRiskAmount = accountBalance * riskPerTrade;
    
    if (riskPerShare <= 0) {
      return riskParams.maxPositionSize * 0.5;
    }

    const sharesBasedOnRisk = totalRiskAmount / riskPerShare;
    const positionValue = sharesBasedOnRisk * entryPrice;
    const positionSize = positionValue / accountBalance;

    return Math.min(positionSize, riskParams.maxPositionSize);
  }

  /**
   * Volatility-based position sizing for intermediate/advanced accounts
   */
  async calculateVolatilityBasedSize(calculation, tradeData, riskParams) {
    const baseSize = this.calculateFixedPercentageSize(calculation, tradeData, riskParams);
    
    // Get volatility data (would typically come from market data service)
    const volatility = await this.getAssetVolatility(tradeData.symbol);
    const marketVolatility = await this.getMarketVolatility();

    // Adjust for volatility
    const volatilityAdjustment = this.calculateVolatilityAdjustment(volatility, marketVolatility);
    const adjustedSize = baseSize * volatilityAdjustment;

    return Math.min(adjustedSize, riskParams.maxPositionSize);
  }

  /**
   * Kelly Criterion position sizing (for advanced accounts with historical data)
   */
  async calculateKellySize(calculation, tradeData, riskParams) {
    // Requires historical win rate and average win/loss data
    const historicalData = await this.getHistoricalPerformance(tradeData.strategy);
    
    if (!historicalData || historicalData.totalTrades < 20) {
      // Fallback to fixed percentage if insufficient data
      return this.calculateFixedPercentageSize(calculation, tradeData, riskParams);
    }

    const winRate = historicalData.winRate;
    const avgWin = historicalData.avgWin;
    const avgLoss = Math.abs(historicalData.avgLoss);

    if (avgLoss <= 0) {
      return this.calculateFixedPercentageSize(calculation, tradeData, riskParams);
    }

    // Kelly formula: f = (bp - q) / b
    // where b = avg win / avg loss, p = win rate, q = 1 - p
    const b = avgWin / avgLoss;
    const p = winRate;
    const q = 1 - p;
    
    const kellyFraction = (b * p - q) / b;
    
    // Apply conservative scaling and caps
    const conservativeKelly = Math.max(0, Math.min(kellyFraction * 0.25, riskParams.maxPositionSize));
    
    return conservativeKelly;
  }

  /**
   * Value at Risk based position sizing
   */
  async calculateVaRSize(calculation, tradeData, riskParams) {
    // This would require sophisticated risk modeling
    // For now, implement a simplified version
    const baseSize = this.calculateFixedPercentageSize(calculation, tradeData, riskParams);
    
    // Apply conservative adjustment for VaR-based sizing
    const varAdjustment = 0.8; // More conservative than fixed percentage
    
    return baseSize * varAdjustment;
  }

  /**
   * Apply risk adjustments based on market conditions and account performance
   */
  applyRiskAdjustments(basePositionSize, accountLevel, accountData, tradeData) {
    let adjustedSize = basePositionSize;

    // Market volatility adjustment
    const volatilityAdjustment = this.getVolatilityAdjustment();
    adjustedSize *= volatilityAdjustment;

    // Account performance adjustment
    const performanceAdjustment = this.getPerformanceAdjustment(accountData);
    adjustedSize *= performanceAdjustment;

    // Position correlation adjustment (for advanced accounts)
    if (accountLevel === ACCOUNT_LEVELS.ADVANCED) {
      const correlationAdjustment = this.getCorrelationAdjustment(accountData, tradeData);
      adjustedSize *= correlationAdjustment;
    }

    // Sector concentration adjustment
    const sectorAdjustment = this.getSectorConcentrationAdjustment(accountData, tradeData);
    adjustedSize *= sectorAdjustment;

    return adjustedSize;
  }

  /**
   * Get market volatility adjustment factor
   */
  getVolatilityAdjustment() {
    // This would typically use real VIX data
    const currentVolatility = this.marketConditions.volatility || 'NORMAL';
    return RISK_ADJUSTMENT_FACTORS.MARKET_VOLATILITY[currentVolatility] || 1.0;
  }

  /**
   * Get account performance adjustment factor
   */
  getPerformanceAdjustment(accountData) {
    const recentPerformance = this.calculateRecentPerformance(accountData);
    
    if (recentPerformance > 0.20) return RISK_ADJUSTMENT_FACTORS.ACCOUNT_PERFORMANCE.EXCELLENT;
    if (recentPerformance > 0.10) return RISK_ADJUSTMENT_FACTORS.ACCOUNT_PERFORMANCE.GOOD;
    if (recentPerformance > 0.00) return RISK_ADJUSTMENT_FACTORS.ACCOUNT_PERFORMANCE.AVERAGE;
    if (recentPerformance > -0.10) return RISK_ADJUSTMENT_FACTORS.ACCOUNT_PERFORMANCE.POOR;
    return RISK_ADJUSTMENT_FACTORS.ACCOUNT_PERFORMANCE.TERRIBLE;
  }

  /**
   * Get position correlation adjustment for portfolio risk
   */
  getCorrelationAdjustment(accountData, tradeData) {
    const currentPositions = accountData.currentPositions || [];
    const newAsset = tradeData.symbol;

    if (currentPositions.length === 0) {
      return RISK_ADJUSTMENT_FACTORS.POSITION_CORRELATION.LOW;
    }

    // Calculate average correlation with existing positions
    // This is simplified - would use actual correlation data in production
    const sectorCorrelation = this.estimateSectorCorrelation(currentPositions, newAsset);
    
    if (sectorCorrelation < 0.3) return RISK_ADJUSTMENT_FACTORS.POSITION_CORRELATION.LOW;
    if (sectorCorrelation < 0.7) return RISK_ADJUSTMENT_FACTORS.POSITION_CORRELATION.MEDIUM;
    return RISK_ADJUSTMENT_FACTORS.POSITION_CORRELATION.HIGH;
  }

  /**
   * Get sector concentration adjustment
   */
  getSectorConcentrationAdjustment(accountData, tradeData) {
    const currentPositions = accountData.currentPositions || [];
    const newSector = tradeData.sector;

    if (!newSector || currentPositions.length === 0) {
      return 1.0;
    }

    // Calculate current sector exposure
    const totalValue = currentPositions.reduce((sum, pos) => sum + (pos.value || 0), 0);
    const sectorValue = currentPositions
      .filter(pos => pos.sector === newSector)
      .reduce((sum, pos) => sum + (pos.value || 0), 0);

    const sectorConcentration = totalValue > 0 ? sectorValue / totalValue : 0;

    // Reduce position size if sector is already heavily weighted
    if (sectorConcentration > 0.40) return 0.5; // 50% reduction
    if (sectorConcentration > 0.25) return 0.7; // 30% reduction
    if (sectorConcentration > 0.15) return 0.9; // 10% reduction
    
    return 1.0; // No adjustment
  }

  /**
   * Enforce account level constraints
   */
  enforceConstraints(positionSize, riskParams, accountData, tradeData) {
    let finalSize = positionSize;

    // Maximum position size constraint
    finalSize = Math.min(finalSize, riskParams.maxPositionSize);

    // Minimum volume constraint
    if (tradeData.volume && tradeData.volume < riskParams.minVolume) {
      finalSize *= 0.5; // Reduce size for low volume assets
    }

    // Price range constraints
    if (riskParams.priceRange) {
      const price = tradeData.price || 0;
      if (price < riskParams.priceRange.min || price > riskParams.priceRange.max) {
        return 0; // No position allowed outside price range
      }
    }

    // Beta constraint (for stocks)
    if (tradeData.beta && tradeData.beta > riskParams.maxBeta) {
      finalSize *= 0.6; // Reduce size for high beta stocks
    }

    // Sector restrictions
    if (riskParams.allowedSectors !== 'all' && Array.isArray(riskParams.allowedSectors)) {
      if (tradeData.sector && !riskParams.allowedSectors.includes(tradeData.sector)) {
        return 0; // No position allowed in restricted sectors
      }
    }

    // Maximum concurrent positions
    const currentPositions = accountData.currentPositions || [];
    if (currentPositions.length >= riskParams.maxConcurrentPositions) {
      return 0; // No new positions if at limit
    }

    // Account balance minimum
    const minPositionValue = 100; // Minimum $100 position
    const accountBalance = accountData.balance || 0;
    const minPositionSize = minPositionValue / accountBalance;
    
    if (finalSize * accountBalance < minPositionValue) {
      return 0; // Position too small to be meaningful
    }

    return Math.max(finalSize, minPositionSize);
  }

  /**
   * Calculate stop loss price based on risk parameters
   */
  calculateStopLoss(tradeData, riskPerTrade, accountBalance) {
    const entryPrice = tradeData.price || tradeData.entryPrice || 0;
    const direction = tradeData.direction || 'long';
    
    if (entryPrice <= 0) return null;

    // Use provided stop loss if available
    if (tradeData.stopLoss) {
      return tradeData.stopLoss;
    }

    // Calculate based on risk per trade
    const maxRiskDollar = accountBalance * riskPerTrade;
    const positionValue = (tradeData.positionSize || 0.05) * accountBalance;
    
    if (positionValue <= 0) return null;

    const maxRiskPerShare = maxRiskDollar / (positionValue / entryPrice);
    
    if (direction === 'long') {
      return Math.max(entryPrice - maxRiskPerShare, entryPrice * 0.95); // Max 5% stop
    } else {
      return Math.min(entryPrice + maxRiskPerShare, entryPrice * 1.05); // Max 5% stop
    }
  }

  /**
   * Generate risk management recommendations
   */
  generateRiskRecommendations(calculation, tradeData) {
    const recommendations = [];

    // Position size recommendations
    if (calculation.finalPositionSize > 0.10) {
      recommendations.push({
        type: 'position_size',
        level: 'warning',
        message: 'Large position size detected. Consider reducing for better risk management.',
        suggestion: 'Limit individual positions to 5-8% of account balance.'
      });
    }

    // Stop loss recommendations
    if (!tradeData.stopLoss) {
      recommendations.push({
        type: 'stop_loss',
        level: 'important',
        message: 'No stop loss specified. Always define your exit point before entry.',
        suggestion: 'Set stop loss at key technical levels or maximum acceptable loss.'
      });
    }

    // Risk per trade recommendations
    if (calculation.riskPerTrade > 0.03) {
      recommendations.push({
        type: 'risk_amount',
        level: 'caution',
        message: 'Risk per trade exceeds 3%. Consider reducing for capital preservation.',
        suggestion: 'Professional traders typically risk 1-2% per trade.'
      });
    }

    // Account level specific recommendations
    if (calculation.accountLevel === ACCOUNT_LEVELS.BEGINNER) {
      recommendations.push({
        type: 'education',
        level: 'info',
        message: 'Continue learning about risk management and position sizing.',
        suggestion: 'Review trades regularly and maintain a trading journal.'
      });
    }

    return recommendations;
  }

  /**
   * Helper methods for calculations
   */
  async getAssetVolatility(symbol) {
    // Placeholder - would integrate with market data service
    return 0.25; // 25% annual volatility
  }

  async getMarketVolatility() {
    // Placeholder - would use VIX or similar
    return 0.20; // 20% market volatility
  }

  calculateVolatilityAdjustment(assetVol, marketVol) {
    const relativeVol = assetVol / marketVol;
    return Math.max(0.5, Math.min(1.5, 1 / relativeVol));
  }

  async getHistoricalPerformance(strategy) {
    // Placeholder - would query historical performance database
    return {
      totalTrades: 25,
      winRate: 0.55,
      avgWin: 0.08,
      avgLoss: -0.04
    };
  }

  calculateRecentPerformance(accountData) {
    // Placeholder - would calculate based on recent trade history
    return (accountData.recentPerformance || 0) / 100;
  }

  estimateSectorCorrelation(currentPositions, newAsset) {
    // Simplified sector correlation estimation
    const sectors = currentPositions.map(pos => pos.sector);
    const uniqueSectors = [...new Set(sectors)];
    
    // If positions are in many different sectors, correlation is likely lower
    return uniqueSectors.length > 5 ? 0.2 : 0.6;
  }

  getAppliedConstraints(riskParams, tradeData) {
    const constraints = [];

    if (riskParams.maxPositionSize) {
      constraints.push(`Maximum position size: ${(riskParams.maxPositionSize * 100).toFixed(1)}%`);
    }

    if (riskParams.minVolume) {
      constraints.push(`Minimum volume: ${riskParams.minVolume.toLocaleString()}`);
    }

    if (riskParams.priceRange) {
      constraints.push(`Price range: $${riskParams.priceRange.min}-$${riskParams.priceRange.max}`);
    }

    if (riskParams.maxBeta) {
      constraints.push(`Maximum beta: ${riskParams.maxBeta}`);
    }

    return constraints;
  }

  /**
   * Get risk calculation history
   */
  getRiskCalculationHistory(limit = 100) {
    return this.riskCalculations.slice(-limit);
  }

  /**
   * Update market conditions
   */
  updateMarketConditions(conditions) {
    this.marketConditions = {
      ...this.marketConditions,
      ...conditions,
      lastUpdated: Date.now()
    };
  }

  /**
   * Get risk management summary for account level
   */
  getRiskManagementSummary(accountLevel) {
    const riskParams = RISK_PARAMETERS[accountLevel];
    
    return {
      accountLevel,
      maxPositionSize: `${(riskParams.maxPositionSize * 100).toFixed(1)}%`,
      riskPerTrade: `${(riskParams.riskPerTrade * 100).toFixed(1)}%`,
      maxConcurrentPositions: riskParams.maxConcurrentPositions,
      requireStopLoss: riskParams.requireStopLoss,
      sophisticatedStrategies: riskParams.sophisticatedStrategies || false,
      riskMethod: this.selectRiskMethod(accountLevel, riskParams),
      constraints: {
        minVolume: riskParams.minVolume?.toLocaleString(),
        priceRange: riskParams.priceRange ? 
          `$${riskParams.priceRange.min}-$${riskParams.priceRange.max}` : 'None',
        maxBeta: riskParams.maxBeta,
        allowedSectors: riskParams.allowedSectors === 'all' ? 
          'All sectors' : riskParams.allowedSectors?.join(', ')
      }
    };
  }
}

export default TieredRiskManager; 