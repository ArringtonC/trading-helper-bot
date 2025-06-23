// Comprehensive Validation Service for Goal Sizing Wizard and Onboarding - Task 28.2
// Provides both client-side and server-side validation with clear, actionable feedback

import { GoalSizingConfig } from '../../features/goal-setting/types/goalSizing';
import { OnboardingProgress, PhaseData } from '../../types/onboarding';
import { NormalizedTradeData } from '../types/trade';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  context?: any;
}

export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  recommendation?: string;
}

export interface ValidationSuggestion {
  field: string;
  code: string;
  message: string;
  suggestedValue?: any;
  reasoning?: string;
}

export interface BusinessRuleViolation {
  ruleId: string;
  ruleName: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  tradeId?: string;
  suggestedAction: string;
  context: any;
}

export class ValidationService {
  
  // Goal Sizing Configuration Validation
  static validateGoalSizingConfig(config: Partial<GoalSizingConfig>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // Required field validation
    if (!config.goalType) {
      errors.push({
        field: 'goalType',
        code: 'REQUIRED_FIELD',
        message: 'Please choose what you want to achieve with your trading to get started.',
        severity: 'error'
      });
    }

    // Capital objective validation
    if (config.capitalObjectiveParameters) {
      const params = config.capitalObjectiveParameters;
      
      if (params.targetBalance !== undefined && params.targetBalance <= 0) {
        errors.push({
          field: 'capitalObjectiveParameters.targetBalance',
          code: 'INVALID_VALUE',
          message: 'Please enter a target balance greater than $0 to set your goal.',
          severity: 'error'
        });
      }

      if (params.timeHorizonMonths !== undefined && (params.timeHorizonMonths < 1 || params.timeHorizonMonths > 120)) {
        errors.push({
          field: 'capitalObjectiveParameters.timeHorizonMonths',
          code: 'INVALID_RANGE',
          message: 'Please choose a timeframe between 1 month and 10 years (120 months).',
          severity: 'error'
        });
      }

      if (params.currentBalance !== undefined && params.targetBalance !== undefined) {
        if (params.currentBalance >= params.targetBalance) {
          warnings.push({
            field: 'capitalObjectiveParameters.targetBalance',
            code: 'TARGET_BELOW_CURRENT',
            message: 'Your target balance should be higher than your current balance to create a growth goal.',
            recommendation: 'Try setting a target that represents meaningful growth for your timeframe.'
          });
        }

        // Calculate required annual return
        const requiredReturn = Math.pow(params.targetBalance / params.currentBalance, 12 / params.timeHorizonMonths) - 1;
        if (requiredReturn > 0.5) { // 50% annual return
          warnings.push({
            field: 'capitalObjectiveParameters',
            code: 'HIGH_RETURN_REQUIREMENT',
            message: `To reach your goal, you'd need ${(requiredReturn * 100).toFixed(1)}% returns per year, which is quite ambitious.`,
            recommendation: 'You might want to extend your timeframe or adjust your target to make it more achievable.'
          });
        }
      }
    }

    // Trade statistics validation
    if (config.tradeStatistics) {
      const stats = config.tradeStatistics;
      
      // Win rate is stored as percentage (0-100), not decimal (0-1)
      if (stats.winRate !== undefined && (stats.winRate < 0 || stats.winRate > 100)) {
        errors.push({
          field: 'tradeStatistics.winRate',
          code: 'INVALID_RANGE',
          message: 'Please enter a valid win rate (0.01 to 1.0).',
          severity: 'error'
        });
      }

      if (stats.payoffRatio !== undefined && stats.payoffRatio <= 0) {
        errors.push({
          field: 'tradeStatistics.payoffRatio',
          code: 'INVALID_VALUE',
          message: 'Please enter a payoff ratio greater than 0 (for example, 1.5 means your average win is 1.5x your average loss).',
          severity: 'error'
        });
      }

      // Kelly Criterion validation
      if (stats.winRate !== undefined && stats.payoffRatio !== undefined) {
        // Convert win rate from percentage to decimal for Kelly calculation
        const winRateDecimal = stats.winRate / 100;
        const kellyFraction = winRateDecimal - (1 - winRateDecimal) / stats.payoffRatio;
        if (kellyFraction <= 0) {
          warnings.push({
            field: 'tradeStatistics',
            code: 'NEGATIVE_KELLY',
            message: 'Based on your win rate and payoff ratio, this strategy might not be profitable over time.',
            recommendation: 'You may want to review your trading approach or double-check these numbers.'
          });
        } else if (kellyFraction > 0.25) {
          warnings.push({
            field: 'tradeStatistics',
            code: 'HIGH_KELLY',
            message: `Your trading statistics suggest risking ${(kellyFraction * 100).toFixed(1)}% per trade, which is quite aggressive.`,
            recommendation: 'For better risk management, consider using a smaller percentage (like 25% of the suggested amount) to protect your capital.'
          });
        }
      }
    }

    // Sizing rules validation
    if (config.sizingRules) {
      const rules = config.sizingRules;
      
      if (rules.maxPositionSize !== undefined && (rules.maxPositionSize <= 0 || rules.maxPositionSize > 100)) {
        errors.push({
          field: 'sizingRules.maxPositionSize',
          code: 'INVALID_RANGE',
          message: 'Maximum position size must be between 0 and 100 (0% to 100% of portfolio).',
          severity: 'error'
        });
      }

      if (rules.maxTotalExposure !== undefined && (rules.maxTotalExposure <= 0 || rules.maxTotalExposure > 200)) {
        errors.push({
          field: 'sizingRules.maxTotalExposure',
          code: 'INVALID_RANGE',
          message: 'Maximum total exposure must be between 0 and 200 (0% to 200% of portfolio).',
          severity: 'error'
        });
      }

      if (rules.maxPositionSize !== undefined && rules.maxTotalExposure !== undefined) {
        if (rules.maxPositionSize > rules.maxTotalExposure) {
          errors.push({
            field: 'sizingRules.maxPositionSize',
            code: 'INCONSISTENT_LIMITS',
            message: 'Maximum position size cannot exceed maximum total exposure.',
            severity: 'error'
          });
        }
      }

      // Risk management suggestions
      if (rules.maxPositionSize !== undefined && rules.maxPositionSize > 10) {
        suggestions.push({
          field: 'sizingRules.maxPositionSize',
          code: 'HIGH_POSITION_SIZE',
          message: 'Position size above 10% increases concentration risk.',
          suggestedValue: 10,
          reasoning: 'Diversification principles suggest limiting individual positions to 10% or less.'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  // Onboarding Progress Validation
  static validateOnboardingProgress(progress: Partial<OnboardingProgress>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    if (!progress.phase || progress.phase < 1 || progress.phase > 3) {
      errors.push({
        field: 'phase',
        code: 'INVALID_PHASE',
        message: 'Phase must be 1, 2, or 3.',
        severity: 'error'
      });
    }

    if (!progress.currentStep) {
      errors.push({
        field: 'currentStep',
        code: 'REQUIRED_FIELD',
        message: 'Current step is required.',
        severity: 'error'
      });
    }

    if (!progress.completedSteps || !Array.isArray(progress.completedSteps)) {
      errors.push({
        field: 'completedSteps',
        code: 'INVALID_FORMAT',
        message: 'Completed steps must be an array.',
        severity: 'error'
      });
    }

    // Phase-specific validation
    if (progress.phase && progress.phaseData) {
      const phaseValidation = this.validatePhaseData(progress.phase, progress.phaseData);
      errors.push(...phaseValidation.errors);
      warnings.push(...phaseValidation.warnings);
      suggestions.push(...phaseValidation.suggestions);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  // Phase-specific data validation
  static validatePhaseData(phase: number, phaseData: PhaseData): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    switch (phase) {
      case 1:
        if (phaseData.phase1) {
          const p1 = phaseData.phase1;
          if (p1.initialFocus && !['growth', 'income', 'risk_management'].includes(p1.initialFocus)) {
            errors.push({
              field: 'phaseData.phase1.initialFocus',
              code: 'INVALID_VALUE',
              message: 'Initial focus must be growth, income, or risk_management.',
              severity: 'error'
            });
          }
        }
        break;

      case 2:
        if (phaseData.phase2) {
          const p2 = phaseData.phase2;
          if (p2.complianceScore !== undefined && (p2.complianceScore < 0 || p2.complianceScore > 100)) {
            errors.push({
              field: 'phaseData.phase2.complianceScore',
              code: 'INVALID_RANGE',
              message: 'Compliance score must be between 0 and 100.',
              severity: 'error'
            });
          }
        }
        break;

      case 3:
        // Phase 3 validation can be added here
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  // Trade Data Validation
  static validateTradeData(trades: NormalizedTradeData[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    if (!Array.isArray(trades)) {
      errors.push({
        field: 'trades',
        code: 'INVALID_FORMAT',
        message: 'Trades must be an array.',
        severity: 'error'
      });
      return { isValid: false, errors, warnings, suggestions };
    }

    trades.forEach((trade, index) => {
      const tradeErrors = this.validateSingleTrade(trade, index);
      errors.push(...tradeErrors.errors);
      warnings.push(...tradeErrors.warnings);
      suggestions.push(...tradeErrors.suggestions);
    });

    // Portfolio-level validation
    const portfolioValidation = this.validatePortfolioLevel(trades);
    errors.push(...portfolioValidation.errors);
    warnings.push(...portfolioValidation.warnings);
    suggestions.push(...portfolioValidation.suggestions);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  // Single trade validation
  static validateSingleTrade(trade: NormalizedTradeData, index: number): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    const prefix = `trades[${index}]`;

    // Required fields
    if (!trade.id) {
      errors.push({
        field: `${prefix}.id`,
        code: 'REQUIRED_FIELD',
        message: 'Trade ID is required.',
        severity: 'error'
      });
    }

    if (!trade.symbol) {
      errors.push({
        field: `${prefix}.symbol`,
        code: 'REQUIRED_FIELD',
        message: 'Symbol is required.',
        severity: 'error'
      });
    }

    if (!trade.tradeDate) {
      errors.push({
        field: `${prefix}.tradeDate`,
        code: 'REQUIRED_FIELD',
        message: 'Trade date is required.',
        severity: 'error'
      });
    }

    // Data integrity checks
    if (trade.quantity === 0) {
      warnings.push({
        field: `${prefix}.quantity`,
        code: 'ZERO_QUANTITY',
        message: 'Trade has zero quantity.',
        recommendation: 'Verify this is intentional.'
      });
    }

    if (trade.tradePrice !== undefined && trade.tradePrice < 0) {
      errors.push({
        field: `${prefix}.tradePrice`,
        code: 'NEGATIVE_PRICE',
        message: 'Trade price cannot be negative.',
        severity: 'error'
      });
    }

    // Business rule checks
    if (trade.netAmount !== undefined && Math.abs(trade.netAmount) > 1000000) {
      warnings.push({
        field: `${prefix}.netAmount`,
        code: 'LARGE_TRADE',
        message: 'Trade amount exceeds $1M.',
        recommendation: 'Verify this trade size is correct.'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  // Portfolio-level validation
  static validatePortfolioLevel(trades: NormalizedTradeData[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // Check for duplicate trades
    const tradeIds = new Set();
    const duplicates: string[] = [];
    
    trades.forEach(trade => {
      if (trade.id && tradeIds.has(trade.id)) {
        duplicates.push(trade.id);
      } else if (trade.id) {
        tradeIds.add(trade.id);
      }
    });

    if (duplicates.length > 0) {
      errors.push({
        field: 'trades',
        code: 'DUPLICATE_TRADES',
        message: `Found ${duplicates.length} duplicate trade IDs.`,
        severity: 'error',
        context: { duplicateIds: duplicates }
      });
    }

    // Check for data consistency
    const totalNetAmount = trades.reduce((sum, trade) => sum + (trade.netAmount || 0), 0);
    if (Math.abs(totalNetAmount) > 10000000) { // $10M threshold
      warnings.push({
        field: 'trades',
        code: 'HIGH_PORTFOLIO_VALUE',
        message: `Total portfolio value is ${totalNetAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}.`,
        recommendation: 'Verify this portfolio size is correct.'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  // Business Rule Validation
  static validateBusinessRules(trades: NormalizedTradeData[], config: GoalSizingConfig): BusinessRuleViolation[] {
    const violations: BusinessRuleViolation[] = [];

    if (!config.sizingRules) return violations;

    // Position size violations
    if (config.sizingRules.maxPositionSize) {
      const maxPositionValue = config.capitalObjectiveParameters?.currentBalance 
        ? config.capitalObjectiveParameters.currentBalance * config.sizingRules.maxPositionSize
        : undefined;

      if (maxPositionValue) {
        trades.forEach(trade => {
          const positionValue = Math.abs((trade.quantity || 0) * (trade.tradePrice || 0));
          if (positionValue > maxPositionValue) {
            violations.push({
              ruleId: 'MAX_POSITION_SIZE',
              ruleName: 'Maximum Position Size',
              description: `Position size of ${positionValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} exceeds limit of ${maxPositionValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}.`,
              severity: 'high',
              tradeId: trade.id,
              suggestedAction: 'Reduce position size or increase portfolio allocation limit.',
              context: { positionValue, maxPositionValue, trade }
            });
          }
        });
      }
    }

    // Risk management violations
    const consecutiveLosses = this.detectConsecutiveLosses(trades);
    if (consecutiveLosses.length > 0) {
      consecutiveLosses.forEach(sequence => {
        if (sequence.count >= 3) {
          violations.push({
            ruleId: 'CONSECUTIVE_LOSSES',
            ruleName: 'Consecutive Losses',
            description: `${sequence.count} consecutive losses detected ending with trade ${sequence.lastTradeId}.`,
            severity: 'medium',
            tradeId: sequence.lastTradeId,
            suggestedAction: 'Consider reducing position sizes or reviewing strategy.',
            context: { sequence }
          });
        }
      });
    }

    return violations;
  }

  // Helper method to detect consecutive losses
  private static detectConsecutiveLosses(trades: NormalizedTradeData[]): Array<{ count: number; lastTradeId: string }> {
    const sequences: Array<{ count: number; lastTradeId: string }> = [];
    let currentSequence = 0;
    let lastTradeId = '';

    // Sort trades by date
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.tradeDate).getTime() - new Date(b.tradeDate).getTime()
    );

    sortedTrades.forEach(trade => {
      const isLoss = (trade.netAmount || 0) < 0;
      
      if (isLoss) {
        currentSequence++;
        lastTradeId = trade.id || '';
      } else {
        if (currentSequence > 0) {
          sequences.push({ count: currentSequence, lastTradeId });
        }
        currentSequence = 0;
      }
    });

    // Don't forget the last sequence if it ends with a loss
    if (currentSequence > 0) {
      sequences.push({ count: currentSequence, lastTradeId });
    }

    return sequences;
  }

  // Data consistency validation
  static validateDataConsistency(config: GoalSizingConfig, trades: NormalizedTradeData[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // Check if trade statistics match actual trade data
    if (config.tradeStatistics && trades.length > 0) {
      const actualStats = this.calculateActualTradeStatistics(trades);
      
      const winRateDiff = Math.abs((config.tradeStatistics.winRate || 0) - actualStats.winRate);
      if (winRateDiff > 0.2) { // 20% difference
        warnings.push({
          field: 'tradeStatistics.winRate',
          code: 'STATS_MISMATCH',
          message: `Configured win rate (${((config.tradeStatistics.winRate || 0) * 100).toFixed(1)}%) differs significantly from actual (${(actualStats.winRate * 100).toFixed(1)}%).`,
          recommendation: 'Consider updating your statistics based on actual performance.'
        });
      }

      const payoffRatioDiff = Math.abs((config.tradeStatistics.payoffRatio || 0) - actualStats.payoffRatio);
      if (payoffRatioDiff > 0.5) {
        warnings.push({
          field: 'tradeStatistics.payoffRatio',
          code: 'STATS_MISMATCH',
          message: `Configured payoff ratio (${(config.tradeStatistics.payoffRatio || 0).toFixed(2)}) differs significantly from actual (${actualStats.payoffRatio.toFixed(2)}).`,
          recommendation: 'Consider updating your statistics based on actual performance.'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  // Calculate actual trade statistics
  private static calculateActualTradeStatistics(trades: NormalizedTradeData[]): { winRate: number; payoffRatio: number } {
    const closedTrades = trades.filter(t => t.netAmount !== undefined && t.netAmount !== 0);
    
    if (closedTrades.length === 0) {
      return { winRate: 0, payoffRatio: 0 };
    }

    const winners = closedTrades.filter(t => (t.netAmount || 0) > 0);
    const losers = closedTrades.filter(t => (t.netAmount || 0) < 0);
    
    const winRate = winners.length / closedTrades.length;
    
    const avgWin = winners.length > 0 
      ? winners.reduce((sum, t) => sum + (t.netAmount || 0), 0) / winners.length 
      : 0;
    
    const avgLoss = losers.length > 0 
      ? Math.abs(losers.reduce((sum, t) => sum + (t.netAmount || 0), 0) / losers.length)
      : 0;
    
    const payoffRatio = avgLoss > 0 ? avgWin / avgLoss : 0;

    return { winRate, payoffRatio };
  }
}

// Export validation utilities
export const validateGoalConfig = ValidationService.validateGoalSizingConfig;
export const validateOnboarding = ValidationService.validateOnboardingProgress;
export const validateTrades = ValidationService.validateTradeData;
export const validateBusinessRules = ValidationService.validateBusinessRules;
export const validateDataConsistency = ValidationService.validateDataConsistency; 