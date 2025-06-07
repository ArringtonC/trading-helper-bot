/**
 * Enhanced Position Sizing Calculator with Research-Driven Implementation
 * Implements Kelly Criterion, VIX scaling, risk profiles, and comprehensive validation
 */

export interface RiskProfile {
  name: 'conservative' | 'moderate' | 'aggressive';
  riskPerTrade: { min: number; max: number; default: number };
  kellyFraction: number;
  maxDrawdown: number;
  description: string;
}

export interface PositionSizingInput {
  accountBalance: number;
  winRate: number; // 5-95% only
  avgWin: number;
  avgLoss: number;
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
  currentVIX?: number;
  maxRiskPerTrade?: number; // Override default, max 5%
}

export interface PositionSizingResult {
  kellyFraction: number;
  fractionalKelly: number;
  recommendedPositionSize: number;
  vixAdjustedSize: number;
  maxPositionSize: number;
  riskAmount: number;
  validation: ValidationResult;
  riskProfile: RiskProfile;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class PositionSizingCalculator {
  private static readonly RISK_PROFILES: Record<string, RiskProfile> = {
    conservative: {
      name: 'conservative',
      riskPerTrade: { min: 0.5, max: 1.0, default: 0.75 },
      kellyFraction: 0.25,
      maxDrawdown: 0.05,
      description: "0.5-1% risk per trade, 25% Kelly fraction"
    },
    moderate: {
      name: 'moderate',
      riskPerTrade: { min: 1.0, max: 2.0, default: 1.5 },
      kellyFraction: 0.35,
      maxDrawdown: 0.10,
      description: "1-2% risk per trade, 35% Kelly fraction"
    },
    aggressive: {
      name: 'aggressive',
      riskPerTrade: { min: 2.0, max: 3.0, default: 2.5 },
      kellyFraction: 0.50,
      maxDrawdown: 0.15,
      description: "2-3% risk per trade, 50% Kelly fraction"
    }
  };

  private static readonly VALIDATION_RULES = {
    minWinRate: 5,
    maxWinRate: 95,
    maxRiskPerTrade: 5,
    minAccountSize: 2000,
    minAvgWin: 0.01,
    minAvgLoss: 0.01
  };

  /**
   * Calculate Kelly Criterion with fractional implementation (25-50%)
   * Formula: f* = p(b+1)-1/b with fractional implementation
   */
  public static calculateKellyCriterion(
    winRate: number,
    avgWin: number,
    avgLoss: number,
    fractionalMultiplier: number = 0.25
  ): number {
    const p = winRate / 100; // Convert percentage to decimal
    const b = avgWin / avgLoss; // Reward to risk ratio
    const kelly = (p * (b + 1) - 1) / b;
    
    // Apply fractional Kelly (25-50% of full Kelly)
    const fractionalKelly = Math.max(0, kelly * fractionalMultiplier);
    
    // Cap at 5% maximum risk per trade
    return Math.min(fractionalKelly, 0.05);
  }

  /**
   * VIX-based position size scaling
   * <15 VIX (100%), 15-25 (75%), 25-35 (50%), >35 (25%)
   */
  public static getVIXMultiplier(vix: number): number {
    if (vix < 15) return 1.0;      // 100% - Low volatility
    if (vix < 25) return 0.75;     // 75% - Moderate volatility
    if (vix < 35) return 0.5;      // 50% - High volatility
    return 0.25;                   // 25% - Extreme volatility
  }

  /**
   * Calculate position size with VIX adjustment
   * Position Sizing: Contracts = (Account Balance × Risk%) / (Max Loss per Contract × Volatility Multiplier)
   */
  public static calculatePositionSize(
    accountBalance: number,
    riskPercent: number,
    maxLossPerContract: number,
    currentVIX: number = 20
  ): number {
    const vixMultiplier = this.getVIXMultiplier(currentVIX);
    const adjustedRisk = riskPercent * vixMultiplier;
    const riskAmount = accountBalance * (adjustedRisk / 100);
    
    return Math.floor(riskAmount / maxLossPerContract);
  }

  /**
   * Comprehensive validation of trading inputs
   */
  public static validateInputs(input: PositionSizingInput): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Win rate validation (5-95% only)
    if (input.winRate < this.VALIDATION_RULES.minWinRate || input.winRate > this.VALIDATION_RULES.maxWinRate) {
      errors.push(`Win rate must be between ${this.VALIDATION_RULES.minWinRate}% and ${this.VALIDATION_RULES.maxWinRate}%`);
    }

    // Maximum 5% risk per trade
    if (input.maxRiskPerTrade && input.maxRiskPerTrade > this.VALIDATION_RULES.maxRiskPerTrade) {
      errors.push(`Risk per trade cannot exceed ${this.VALIDATION_RULES.maxRiskPerTrade}%`);
    }

    // Minimum $2000 account size
    if (input.accountBalance < this.VALIDATION_RULES.minAccountSize) {
      errors.push(`Minimum account size is $${this.VALIDATION_RULES.minAccountSize.toLocaleString()}`);
    }

    // Average win/loss validation
    if (input.avgWin < this.VALIDATION_RULES.minAvgWin) {
      errors.push("Average win must be greater than $0.01");
    }

    if (input.avgLoss < this.VALIDATION_RULES.minAvgLoss) {
      errors.push("Average loss must be greater than $0.01");
    }

    // Risk profile warnings
    const profile = this.RISK_PROFILES[input.riskProfile];
    if (input.maxRiskPerTrade && input.maxRiskPerTrade > profile.riskPerTrade.max) {
      warnings.push(`Risk per trade (${input.maxRiskPerTrade}%) exceeds ${input.riskProfile} profile maximum (${profile.riskPerTrade.max}%)`);
    }

    // VIX warnings
    if (input.currentVIX && input.currentVIX > 35) {
      warnings.push("Extreme volatility detected (VIX > 35). Position sizes will be significantly reduced.");
    } else if (input.currentVIX && input.currentVIX > 25) {
      warnings.push("High volatility detected (VIX > 25). Position sizes will be reduced.");
    }

    // Negative Kelly results warning
    const kelly = this.calculateKellyCriterion(input.winRate, input.avgWin, input.avgLoss, 1.0);
    if (kelly <= 0) {
      warnings.push("Negative Kelly result indicates unfavorable risk/reward ratio. Consider reviewing strategy.");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Main calculation method that combines all components
   */
  public static calculate(input: PositionSizingInput): PositionSizingResult {
    const validation = this.validateInputs(input);
    const riskProfile = this.RISK_PROFILES[input.riskProfile];
    
    // Calculate Kelly fractions
    const fullKelly = this.calculateKellyCriterion(input.winRate, input.avgWin, input.avgLoss, 1.0);
    const fractionalKelly = this.calculateKellyCriterion(
      input.winRate, 
      input.avgWin, 
      input.avgLoss, 
      riskProfile.kellyFraction
    );

    // Determine risk per trade
    const maxRiskPerTrade = Math.min(
      input.maxRiskPerTrade || riskProfile.riskPerTrade.default,
      this.VALIDATION_RULES.maxRiskPerTrade
    );

    // Calculate recommended position size (smaller of Kelly or risk profile default)
    const kellyBasedSize = fractionalKelly * 100; // Convert to percentage
    const profileBasedSize = riskProfile.riskPerTrade.default;
    const recommendedPositionSize = Math.min(kellyBasedSize, profileBasedSize, maxRiskPerTrade);

    // Apply VIX adjustment if provided
    const vixAdjustedSize = input.currentVIX 
      ? recommendedPositionSize * this.getVIXMultiplier(input.currentVIX)
      : recommendedPositionSize;

    // Calculate risk amount in dollars
    const riskAmount = input.accountBalance * (vixAdjustedSize / 100);

    // Set maximum position size (never exceed 5%)
    const maxPositionSize = Math.min(maxRiskPerTrade, this.VALIDATION_RULES.maxRiskPerTrade);

    return {
      kellyFraction: fullKelly,
      fractionalKelly,
      recommendedPositionSize,
      vixAdjustedSize,
      maxPositionSize,
      riskAmount,
      validation,
      riskProfile
    };
  }

  /**
   * Calculate compound growth with accurate formula
   * FV = P(1 + r)^n where r = (Final/Principal)^(1/n) - 1
   */
  public static calculateCompoundGrowth(
    principal: number,
    finalValue: number,
    numberOfTrades: number
  ): {
    perTradeReturn: number;
    perTradeReturnPercent: number;
    annualizedReturn: number;
    finalValue: number;
    verification: boolean;
  } {
    const r = Math.pow(finalValue / principal, 1 / numberOfTrades) - 1;
    const calculatedFinalValue = principal * Math.pow(1 + r, numberOfTrades);
    
    return {
      perTradeReturn: r,
      perTradeReturnPercent: r * 100,
      annualizedReturn: Math.pow(1 + r, 52) - 1, // Assuming 52 trades per year
      finalValue: calculatedFinalValue,
      verification: Math.abs(finalValue - calculatedFinalValue) < 0.01
    };
  }

  /**
   * Get risk profile by name
   */
  public static getRiskProfile(name: 'conservative' | 'moderate' | 'aggressive'): RiskProfile {
    return this.RISK_PROFILES[name];
  }

  /**
   * Get all available risk profiles
   */
  public static getAllRiskProfiles(): RiskProfile[] {
    return Object.values(this.RISK_PROFILES);
  }
} 