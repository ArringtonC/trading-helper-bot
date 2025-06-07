/**
 * GrowthProjectionEngine - A comprehensive class for handling growth projection calculations
 * Implements proper compound growth formula: FV = P(1 + r)^n where r = (Final/Principal)^(1/n) - 1
 */

export interface GrowthProjectionInput {
  initialValue: number;
  finalValue: number;
  numberOfTrades: number;
  timeHorizonYears?: number; // Optional, for annualized calculations
}

export interface GrowthProjectionResult {
  perTradeReturn: number; // Decimal format (e.g., 0.02084 for 2.084%)
  perTradeReturnPercent: number; // Percentage format (e.g., 2.084)
  totalReturnPercent: number; // Total return as percentage
  annualizedReturn?: number; // Only if timeHorizonYears provided
  compoundedValue: number; // Final value after compounding
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationRules {
  minTrades: number;
  maxTrades: number;
  minReturnPercent: number; // e.g., -50 for -50%
  maxReturnPercent: number; // e.g., 200 for 200%
  minInitialValue: number;
  maxInitialValue: number;
  accuracyTolerance: number; // e.g., 0.0001 for 0.01%
}

export class GrowthProjectionEngine {
  private validationRules: ValidationRules;

  constructor(customRules?: Partial<ValidationRules>) {
    this.validationRules = {
      minTrades: 1,
      maxTrades: 1000,
      minReturnPercent: -50,
      maxReturnPercent: 200,
      minInitialValue: 0.01,
      maxInitialValue: 1e12, // 1 trillion
      accuracyTolerance: 0.0001, // 0.01% tolerance
      ...customRules
    };
  }

  /**
   * Calculate per-trade return using compound growth formula
   * Formula: r = (Final/Principal)^(1/n) - 1
   */
  calculateGrowthProjection(input: GrowthProjectionInput): GrowthProjectionResult {
    const result: GrowthProjectionResult = {
      perTradeReturn: 0,
      perTradeReturnPercent: 0,
      totalReturnPercent: 0,
      compoundedValue: 0,
      isValid: false,
      errors: [],
      warnings: []
    };

    // Validation
    const validationErrors = this.validateInput(input);
    if (validationErrors.length > 0) {
      result.errors = validationErrors;
      return result;
    }

    try {
      const { initialValue, finalValue, numberOfTrades, timeHorizonYears } = input;

      // Calculate the growth ratio
      const growthRatio = finalValue / initialValue;

      // Calculate per-trade return using compound growth formula: r = (Final/Principal)^(1/n) - 1
      const perTradeReturn = Math.pow(growthRatio, 1 / numberOfTrades) - 1;

      // Calculate total return percentage
      const totalReturnPercent = (growthRatio - 1) * 100;

      // Verify accuracy by compounding back
      const verificationValue = initialValue * Math.pow(1 + perTradeReturn, numberOfTrades);
      const accuracyError = Math.abs(verificationValue - finalValue) / finalValue;

      if (accuracyError > this.validationRules.accuracyTolerance) {
        result.warnings.push(
          `Calculation accuracy warning: ${(accuracyError * 100).toFixed(4)}% error detected`
        );
      }

      // Populate result
      result.perTradeReturn = perTradeReturn;
      result.perTradeReturnPercent = perTradeReturn * 100;
      result.totalReturnPercent = totalReturnPercent;
      result.compoundedValue = verificationValue;
      result.isValid = true;

      // Calculate annualized return if time horizon provided
      if (timeHorizonYears && timeHorizonYears > 0) {
        result.annualizedReturn = (Math.pow(growthRatio, 1 / timeHorizonYears) - 1) * 100;
      }

      // Add specific warnings for edge cases
      this.addWarnings(input, result);

    } catch (error) {
      result.errors.push(`Calculation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Calculate what final value would be achieved with given per-trade return
   */
  projectFinalValue(initialValue: number, perTradeReturnPercent: number, numberOfTrades: number): number {
    const perTradeReturn = perTradeReturnPercent / 100;
    return initialValue * Math.pow(1 + perTradeReturn, numberOfTrades);
  }

  /**
   * Calculate how many trades needed to reach target value with given per-trade return
   */
  calculateTradesNeeded(initialValue: number, targetValue: number, perTradeReturnPercent: number): number {
    const perTradeReturn = perTradeReturnPercent / 100;
    if (perTradeReturn <= -1) {
      throw new Error('Per-trade return cannot be -100% or less');
    }
    if (targetValue <= initialValue && perTradeReturn > 0) {
      throw new Error('Target value must be greater than initial value for positive returns');
    }
    if (targetValue >= initialValue && perTradeReturn < 0) {
      throw new Error('Target value must be less than initial value for negative returns');
    }

    const growthRatio = targetValue / initialValue;
    return Math.log(growthRatio) / Math.log(1 + perTradeReturn);
  }

  /**
   * Validate user example case: Calculate per-trade return for realistic scenario
   * Example: $1000 → $1056.25 in 27 trades = ~0.2029% per trade
   */
  validateUserExample(): { isCorrect: boolean; actualReturn: number; expectedReturn: number } {
    const testInput: GrowthProjectionInput = {
      initialValue: 1000,
      finalValue: 1056.25,
      numberOfTrades: 27
    };

    const result = this.calculateGrowthProjection(testInput);
    
    // Calculate expected return using the compound formula
    const expectedReturn = Math.round((Math.pow(1056.25/1000, 1/27) - 1) * 100 * 10000) / 10000;
    const actualReturn = Math.round(result.perTradeReturnPercent * 10000) / 10000;

    return {
      isCorrect: Math.abs(actualReturn - expectedReturn) < 0.0001,
      actualReturn,
      expectedReturn
    };
  }

  /**
   * Comprehensive input validation
   */
  private validateInput(input: GrowthProjectionInput): string[] {
    const errors: string[] = [];
    const { initialValue, finalValue, numberOfTrades, timeHorizonYears } = input;

    // Check for required fields
    if (typeof initialValue !== 'number' || isNaN(initialValue)) {
      errors.push('Initial value must be a valid number');
    }
    if (typeof finalValue !== 'number' || isNaN(finalValue)) {
      errors.push('Final value must be a valid number');
    }
    if (typeof numberOfTrades !== 'number' || isNaN(numberOfTrades) || !Number.isInteger(numberOfTrades)) {
      errors.push('Number of trades must be a valid integer');
    }

    // Range validations
    if (initialValue < this.validationRules.minInitialValue) {
      errors.push(`Initial value must be at least $${this.validationRules.minInitialValue}`);
    }
    if (initialValue > this.validationRules.maxInitialValue) {
      errors.push(`Initial value cannot exceed $${this.validationRules.maxInitialValue.toLocaleString()}`);
    }
    if (numberOfTrades < this.validationRules.minTrades) {
      errors.push(`Number of trades must be at least ${this.validationRules.minTrades}`);
    }
    if (numberOfTrades > this.validationRules.maxTrades) {
      errors.push(`Number of trades cannot exceed ${this.validationRules.maxTrades}`);
    }

    // Check return limits
    if (initialValue > 0) {
      const totalReturnPercent = ((finalValue - initialValue) / initialValue) * 100;
      if (totalReturnPercent < this.validationRules.minReturnPercent) {
        errors.push(`Total return cannot be less than ${this.validationRules.minReturnPercent}%`);
      }
      if (totalReturnPercent > this.validationRules.maxReturnPercent) {
        errors.push(`Total return cannot exceed ${this.validationRules.maxReturnPercent}%`);
      }
    }

    // Logical validations
    if (initialValue <= 0) {
      errors.push('Initial value must be positive');
    }
    if (finalValue <= 0) {
      errors.push('Final value must be positive');
    }
    if (timeHorizonYears !== undefined && timeHorizonYears <= 0) {
      errors.push('Time horizon must be positive');
    }

    return errors;
  }

  /**
   * Add context-specific warnings
   */
  private addWarnings(input: GrowthProjectionInput, result: GrowthProjectionResult): void {
    const { numberOfTrades, timeHorizonYears } = input;

    // Warning for very high per-trade returns
    if (Math.abs(result.perTradeReturnPercent) > 10) {
      result.warnings.push(
        `Very high per-trade return (${result.perTradeReturnPercent.toFixed(2)}%) - verify if realistic`
      );
    }

    // Warning for very small per-trade returns
    if (Math.abs(result.perTradeReturnPercent) < 0.01) {
      result.warnings.push(
        `Very small per-trade return (${result.perTradeReturnPercent.toFixed(4)}%) - consider measurement precision`
      );
    }

    // Warning for large number of trades
    if (numberOfTrades > 100) {
      result.warnings.push(
        `Large number of trades (${numberOfTrades}) - consider transaction costs and market impact`
      );
    }

    // Warning for unrealistic time horizons
    if (timeHorizonYears && timeHorizonYears > 50) {
      result.warnings.push(
        `Very long time horizon (${timeHorizonYears} years) - projections become less reliable`
      );
    }

    // Warning for very high annualized returns
    if (result.annualizedReturn && Math.abs(result.annualizedReturn) > 30) {
      result.warnings.push(
        `Very high annualized return (${result.annualizedReturn.toFixed(2)}%) - verify if sustainable`
      );
    }
  }

  /**
   * Get validation rules
   */
  getValidationRules(): ValidationRules {
    return { ...this.validationRules };
  }

  /**
   * Update validation rules
   */
  updateValidationRules(newRules: Partial<ValidationRules>): void {
    this.validationRules = { ...this.validationRules, ...newRules };
  }

  /**
   * Format result for display
   */
  formatResult(result: GrowthProjectionResult): string {
    if (!result.isValid) {
      return `Invalid calculation: ${result.errors.join(', ')}`;
    }

    let formatted = `Per-trade return: ${result.perTradeReturnPercent.toFixed(4)}%\n`;
    formatted += `Total return: ${result.totalReturnPercent.toFixed(2)}%\n`;
    formatted += `Final value: $${result.compoundedValue.toFixed(2)}`;

    if (result.annualizedReturn !== undefined) {
      formatted += `\nAnnualized return: ${result.annualizedReturn.toFixed(2)}%`;
    }

    if (result.warnings.length > 0) {
      formatted += `\nWarnings: ${result.warnings.join(', ')}`;
    }

    return formatted;
  }
}

export default GrowthProjectionEngine; 