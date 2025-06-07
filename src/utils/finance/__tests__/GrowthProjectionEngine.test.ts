/**
 * Comprehensive tests for GrowthProjectionEngine
 * Tests the corrected compound growth calculations and validation
 */

import GrowthProjectionEngine, { GrowthProjectionInput, ValidationRules } from '../GrowthProjectionEngine';

describe('GrowthProjectionEngine', () => {
  let engine: GrowthProjectionEngine;

  beforeEach(() => {
    engine = new GrowthProjectionEngine();
  });

  describe('calculateGrowthProjection', () => {
    it('should calculate correct per-trade return for user example', () => {
      const input: GrowthProjectionInput = {
        initialValue: 1000,
        finalValue: 1056.25,
        numberOfTrades: 27
      };

      const result = engine.calculateGrowthProjection(input);

      expect(result.isValid).toBe(true);
      expect(result.perTradeReturnPercent).toBeCloseTo(0.2029, 4);
      expect(result.perTradeReturn).toBeCloseTo(0.002029, 6);
      expect(result.totalReturnPercent).toBeCloseTo(5.625, 2);
      expect(result.compoundedValue).toBeCloseTo(1056.25, 2);
    });

    it('should calculate correct growth for basic example', () => {
      const input: GrowthProjectionInput = {
        initialValue: 1000,
        finalValue: 1200,
        numberOfTrades: 10
      };

      const result = engine.calculateGrowthProjection(input);

      expect(result.isValid).toBe(true);
      expect(result.totalReturnPercent).toBeCloseTo(20, 1);
      expect(result.compoundedValue).toBeCloseTo(1200, 1);
      
      // Verify compound formula: (1200/1000)^(1/10) - 1
      const expectedReturn = Math.pow(1200/1000, 1/10) - 1;
      expect(result.perTradeReturn).toBeCloseTo(expectedReturn, 6);
    });

    it('should handle negative returns correctly', () => {
      const input: GrowthProjectionInput = {
        initialValue: 1000,
        finalValue: 800,
        numberOfTrades: 5
      };

      const result = engine.calculateGrowthProjection(input);

      expect(result.isValid).toBe(true);
      expect(result.totalReturnPercent).toBeCloseTo(-20, 1);
      expect(result.perTradeReturnPercent).toBeLessThan(0);
      expect(result.compoundedValue).toBeCloseTo(800, 1);
    });

    it('should calculate annualized return when time horizon provided', () => {
      const input: GrowthProjectionInput = {
        initialValue: 1000,
        finalValue: 1200,
        numberOfTrades: 52,
        timeHorizonYears: 1
      };

      const result = engine.calculateGrowthProjection(input);

      expect(result.isValid).toBe(true);
      expect(result.annualizedReturn).toBeCloseTo(20, 1);
    });

    it('should detect accuracy issues and add warnings', () => {
      const customEngine = new GrowthProjectionEngine({ accuracyTolerance: 0.00001 });
      
      const input: GrowthProjectionInput = {
        initialValue: 1000,
        finalValue: 1000.01, // Very small change
        numberOfTrades: 1000 // Many trades
      };

      const result = customEngine.calculateGrowthProjection(input);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('input validation', () => {
    it('should reject invalid initial value', () => {
      const input: GrowthProjectionInput = {
        initialValue: -100,
        finalValue: 1200,
        numberOfTrades: 10
      };

      const result = engine.calculateGrowthProjection(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Initial value must be positive');
    });

    it('should reject invalid final value', () => {
      const input: GrowthProjectionInput = {
        initialValue: 1000,
        finalValue: -100,
        numberOfTrades: 10
      };

      const result = engine.calculateGrowthProjection(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Final value must be positive');
    });

    it('should reject invalid number of trades', () => {
      const input: GrowthProjectionInput = {
        initialValue: 1000,
        finalValue: 1200,
        numberOfTrades: 0
      };

      const result = engine.calculateGrowthProjection(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Number of trades must be at least 1');
    });

    it('should reject too many trades', () => {
      const input: GrowthProjectionInput = {
        initialValue: 1000,
        finalValue: 1200,
        numberOfTrades: 1001
      };

      const result = engine.calculateGrowthProjection(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Number of trades cannot exceed 1000');
    });

    it('should reject extreme returns', () => {
      const input: GrowthProjectionInput = {
        initialValue: 1000,
        finalValue: 5000, // 400% return
        numberOfTrades: 1
      };

      const result = engine.calculateGrowthProjection(input);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Total return cannot exceed'))).toBe(true);
    });

    it('should reject invalid time horizon', () => {
      const input: GrowthProjectionInput = {
        initialValue: 1000,
        finalValue: 1200,
        numberOfTrades: 10,
        timeHorizonYears: -1
      };

      const result = engine.calculateGrowthProjection(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Time horizon must be positive');
    });

    it('should handle NaN values', () => {
      const input: GrowthProjectionInput = {
        initialValue: NaN,
        finalValue: 1200,
        numberOfTrades: 10
      };

      const result = engine.calculateGrowthProjection(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Initial value must be a valid number');
    });

    it('should handle non-integer trades', () => {
      const input: GrowthProjectionInput = {
        initialValue: 1000,
        finalValue: 1200,
        numberOfTrades: 10.5
      };

      const result = engine.calculateGrowthProjection(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Number of trades must be a valid integer');
    });
  });

  describe('warnings generation', () => {
    it('should warn about very high per-trade returns', () => {
      const input: GrowthProjectionInput = {
        initialValue: 1000,
        finalValue: 2000,
        numberOfTrades: 1
      };

      const result = engine.calculateGrowthProjection(input);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes('Very high per-trade return'))).toBe(true);
    });

    it('should warn about very small per-trade returns', () => {
      const input: GrowthProjectionInput = {
        initialValue: 1000,
        finalValue: 1000.01,
        numberOfTrades: 10
      };

      const result = engine.calculateGrowthProjection(input);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes('Very small per-trade return'))).toBe(true);
    });

    it('should warn about large number of trades', () => {
      const input: GrowthProjectionInput = {
        initialValue: 1000,
        finalValue: 1200,
        numberOfTrades: 150
      };

      const result = engine.calculateGrowthProjection(input);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes('Large number of trades'))).toBe(true);
    });

    it('should warn about very long time horizons', () => {
      const input: GrowthProjectionInput = {
        initialValue: 1000,
        finalValue: 1200,
        numberOfTrades: 10,
        timeHorizonYears: 60
      };

      const result = engine.calculateGrowthProjection(input);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes('Very long time horizon'))).toBe(true);
    });

    it('should warn about very high annualized returns', () => {
      const input: GrowthProjectionInput = {
        initialValue: 1000,
        finalValue: 2000,
        numberOfTrades: 52,
        timeHorizonYears: 1
      };

      const result = engine.calculateGrowthProjection(input);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes('Very high annualized return'))).toBe(true);
    });
  });

  describe('projectFinalValue', () => {
    it('should project correct final value', () => {
      const finalValue = engine.projectFinalValue(1000, 2, 10);
      const expected = 1000 * Math.pow(1.02, 10);
      
      expect(finalValue).toBeCloseTo(expected, 2);
    });

    it('should handle negative returns', () => {
      const finalValue = engine.projectFinalValue(1000, -1, 5);
      const expected = 1000 * Math.pow(0.99, 5);
      
      expect(finalValue).toBeCloseTo(expected, 2);
    });
  });

  describe('calculateTradesNeeded', () => {
    it('should calculate correct number of trades needed', () => {
      const trades = engine.calculateTradesNeeded(1000, 1200, 2);
      const expected = Math.log(1200/1000) / Math.log(1.02);
      
      expect(trades).toBeCloseTo(expected, 4);
    });

    it('should handle negative returns for decreasing target', () => {
      const trades = engine.calculateTradesNeeded(1000, 800, -2);
      const expected = Math.log(800/1000) / Math.log(0.98);
      
      expect(trades).toBeCloseTo(expected, 4);
    });

    it('should throw error for impossible scenarios', () => {
      expect(() => {
        engine.calculateTradesNeeded(1000, 1200, -2);
      }).toThrow('Target value must be less than initial value for negative returns');

      expect(() => {
        engine.calculateTradesNeeded(1000, 800, 2);
      }).toThrow('Target value must be greater than initial value for positive returns');

      expect(() => {
        engine.calculateTradesNeeded(1000, 500, -100);
      }).toThrow('Per-trade return cannot be -100% or less');
    });
  });

  describe('validateUserExample', () => {
    it('should validate the specific user example correctly', () => {
      const validation = engine.validateUserExample();
      
      expect(validation.isCorrect).toBe(true);
      expect(validation.actualReturn).toBeCloseTo(0.2029, 4);
      expect(validation.expectedReturn).toBeCloseTo(0.2029, 4);
    });
  });

  describe('validation rules management', () => {
    it('should allow getting validation rules', () => {
      const rules = engine.getValidationRules();
      
      expect(rules.minTrades).toBe(1);
      expect(rules.maxTrades).toBe(1000);
      expect(rules.minReturnPercent).toBe(-50);
      expect(rules.maxReturnPercent).toBe(200);
    });

    it('should allow updating validation rules', () => {
      engine.updateValidationRules({ maxTrades: 500, minReturnPercent: -25 });
      const rules = engine.getValidationRules();
      
      expect(rules.maxTrades).toBe(500);
      expect(rules.minReturnPercent).toBe(-25);
      expect(rules.minTrades).toBe(1); // Should preserve unchanged rules
    });

    it('should use custom rules in constructor', () => {
      const customRules: Partial<ValidationRules> = {
        maxTrades: 100,
        accuracyTolerance: 0.001
      };
      
      const customEngine = new GrowthProjectionEngine(customRules);
      const rules = customEngine.getValidationRules();
      
      expect(rules.maxTrades).toBe(100);
      expect(rules.accuracyTolerance).toBe(0.001);
    });
  });

  describe('formatResult', () => {
    it('should format valid result correctly', () => {
      const input: GrowthProjectionInput = {
        initialValue: 1000,
        finalValue: 1200,
        numberOfTrades: 10,
        timeHorizonYears: 1
      };

      const result = engine.calculateGrowthProjection(input);
      const formatted = engine.formatResult(result);

      expect(formatted).toContain('Per-trade return:');
      expect(formatted).toContain('Total return:');
      expect(formatted).toContain('Final value:');
      expect(formatted).toContain('Annualized return:');
    });

    it('should format invalid result correctly', () => {
      const input: GrowthProjectionInput = {
        initialValue: -100,
        finalValue: 1200,
        numberOfTrades: 10
      };

      const result = engine.calculateGrowthProjection(input);
      const formatted = engine.formatResult(result);

      expect(formatted).toContain('Invalid calculation:');
      expect(formatted).toContain('Initial value must be positive');
    });

    it('should include warnings in formatted output', () => {
      const input: GrowthProjectionInput = {
        initialValue: 1000,
        finalValue: 2000,
        numberOfTrades: 1
      };

      const result = engine.calculateGrowthProjection(input);
      const formatted = engine.formatResult(result);

      expect(formatted).toContain('Warnings:');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle calculation errors gracefully', () => {
      // Force a calculation error by mocking Math.pow to throw
      const originalPow = Math.pow;
      Math.pow = jest.fn().mockImplementation(() => {
        throw new Error('Math error');
      });

      const input: GrowthProjectionInput = {
        initialValue: 1000,
        finalValue: 1200,
        numberOfTrades: 10
      };

      const result = engine.calculateGrowthProjection(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Calculation error: Math error');

      // Restore original Math.pow
      Math.pow = originalPow;
    });

    it('should handle very small differences accurately', () => {
      const input: GrowthProjectionInput = {
        initialValue: 1000000,
        finalValue: 1000001,
        numberOfTrades: 1
      };

      const result = engine.calculateGrowthProjection(input);

      expect(result.isValid).toBe(true);
      expect(result.perTradeReturnPercent).toBeCloseTo(0.0001, 6);
    });

    it('should handle very large numbers', () => {
      const input: GrowthProjectionInput = {
        initialValue: 1000000,
        finalValue: 2000000,
        numberOfTrades: 100
      };

      const result = engine.calculateGrowthProjection(input);

      expect(result.isValid).toBe(true);
      expect(result.compoundedValue).toBeCloseTo(2000000, 0);
    });
  });

  describe('accuracy verification', () => {
    it('should maintain accuracy within tolerance for all calculations', () => {
      const testCases = [
        { initial: 1000, final: 1056.25, trades: 27 },
        { initial: 5000, final: 6000, trades: 52 },
        { initial: 10000, final: 8000, trades: 20 },
        { initial: 1500, final: 2000, trades: 15 }
      ];

      testCases.forEach(testCase => {
        const input: GrowthProjectionInput = {
          initialValue: testCase.initial,
          finalValue: testCase.final,
          numberOfTrades: testCase.trades
        };

        const result = engine.calculateGrowthProjection(input);
        
        expect(result.isValid).toBe(true);
        
        // Verify accuracy by checking if compounded value matches final value
        const accuracy = Math.abs(result.compoundedValue - testCase.final) / testCase.final;
        expect(accuracy).toBeLessThan(0.0001); // Less than 0.01% error
      });
    });
  });
});