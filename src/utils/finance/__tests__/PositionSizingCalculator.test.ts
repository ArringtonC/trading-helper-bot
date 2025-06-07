import { PositionSizingCalculator, PositionSizingInput } from '../PositionSizingCalculator';

describe('PositionSizingCalculator', () => {
  describe('Kelly Criterion Calculation', () => {
    it('should calculate Kelly Criterion correctly with fractional implementation', () => {
      // Test case: 60% win rate, 1.5:1 reward ratio
      const kelly = PositionSizingCalculator.calculateKellyCriterion(60, 150, 100, 0.25);
      
      // Expected: p=0.6, b=1.5, kelly = (0.6 * 2.5 - 1) / 1.5 = 0.5 / 1.5 = 0.333
      // Fractional (25%): 0.333 * 0.25 = 0.083, capped at 5% = 0.05
      expect(kelly).toBe(0.05);
    });

    it('should return 0 for negative Kelly results', () => {
      // Test case: 45% win rate, 2:1 reward ratio (negative expectancy)
      const kelly = PositionSizingCalculator.calculateKellyCriterion(45, 200, 100, 0.25);
      
      // Expected: p=0.45, b=2, kelly = (0.45 * 3 - 1) / 2 = 0.35 / 2 = 0.175
      // This should be positive, let's test a truly negative case
      const negativeKelly = PositionSizingCalculator.calculateKellyCriterion(30, 100, 100, 0.25);
      
      // Expected: p=0.3, b=1, kelly = (0.3 * 2 - 1) / 1 = -0.4 / 1 = -0.4
      // Fractional should be max(0, -0.4 * 0.25) = 0
      expect(negativeKelly).toBe(0);
    });

    it('should cap Kelly at 5% maximum', () => {
      // Test case with very high Kelly result
      const kelly = PositionSizingCalculator.calculateKellyCriterion(80, 300, 100, 1.0);
      
      // This should result in a high Kelly value, but capped at 5%
      expect(kelly).toBe(0.05);
    });
  });

  describe('VIX Scaling', () => {
    it('should apply correct VIX multipliers', () => {
      expect(PositionSizingCalculator.getVIXMultiplier(12)).toBe(1.0);   // Low volatility
      expect(PositionSizingCalculator.getVIXMultiplier(20)).toBe(0.75);  // Moderate volatility
      expect(PositionSizingCalculator.getVIXMultiplier(30)).toBe(0.5);   // High volatility
      expect(PositionSizingCalculator.getVIXMultiplier(40)).toBe(0.25);  // Extreme volatility
    });

    it('should calculate position size with VIX adjustment', () => {
      const accountBalance = 10000;
      const riskPercent = 2;
      const maxLossPerContract = 100;
      
      // Low VIX (12) - no reduction
      const lowVixSize = PositionSizingCalculator.calculatePositionSize(
        accountBalance, riskPercent, maxLossPerContract, 12
      );
      expect(lowVixSize).toBe(2); // (10000 * 2% * 1.0) / 100 = 2
      
      // High VIX (30) - 50% reduction
      const highVixSize = PositionSizingCalculator.calculatePositionSize(
        accountBalance, riskPercent, maxLossPerContract, 30
      );
      expect(highVixSize).toBe(1); // (10000 * 2% * 0.5) / 100 = 1
    });
  });

  describe('Input Validation', () => {
    const validInput: PositionSizingInput = {
      accountBalance: 10000,
      winRate: 60,
      avgWin: 150,
      avgLoss: 100,
      riskProfile: 'moderate'
    };

    it('should validate win rate between 5-95%', () => {
      const invalidLow = { ...validInput, winRate: 3 };
      const invalidHigh = { ...validInput, winRate: 97 };
      
      const resultLow = PositionSizingCalculator.validateInputs(invalidLow);
      const resultHigh = PositionSizingCalculator.validateInputs(invalidHigh);
      
      expect(resultLow.isValid).toBe(false);
      expect(resultLow.errors).toContain('Win rate must be between 5% and 95%');
      expect(resultHigh.isValid).toBe(false);
      expect(resultHigh.errors).toContain('Win rate must be between 5% and 95%');
    });

    it('should enforce maximum 5% risk per trade', () => {
      const invalidRisk = { ...validInput, maxRiskPerTrade: 7 };
      
      const result = PositionSizingCalculator.validateInputs(invalidRisk);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Risk per trade cannot exceed 5%');
    });

    it('should enforce minimum $2000 account size', () => {
      const invalidAccount = { ...validInput, accountBalance: 1500 };
      
      const result = PositionSizingCalculator.validateInputs(invalidAccount);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Minimum account size is $2,000');
    });

    it('should warn about extreme VIX levels', () => {
      const extremeVix = { ...validInput, currentVIX: 40 };
      
      const result = PositionSizingCalculator.validateInputs(extremeVix);
      
      expect(result.warnings).toContain('Extreme volatility detected (VIX > 35). Position sizes will be significantly reduced.');
    });

    it('should warn about negative Kelly results', () => {
      const negativeKelly = { ...validInput, winRate: 30, avgWin: 100, avgLoss: 100 };
      
      const result = PositionSizingCalculator.validateInputs(negativeKelly);
      
      expect(result.warnings).toContain('Negative Kelly result indicates unfavorable risk/reward ratio. Consider reviewing strategy.');
    });
  });

  describe('Main Calculation', () => {
    it('should calculate position sizing correctly for conservative profile', () => {
      const input: PositionSizingInput = {
        accountBalance: 10000,
        winRate: 60,
        avgWin: 150,
        avgLoss: 100,
        riskProfile: 'conservative'
      };
      
      const result = PositionSizingCalculator.calculate(input);
      
      expect(result.riskProfile.name).toBe('conservative');
      expect(result.recommendedPositionSize).toBeLessThanOrEqual(1.0); // Conservative max
      expect(result.maxPositionSize).toBeLessThanOrEqual(5); // Never exceed 5%
      expect(result.validation.isValid).toBe(true);
    });

    it('should apply VIX adjustment when provided', () => {
      const input: PositionSizingInput = {
        accountBalance: 10000,
        winRate: 60,
        avgWin: 150,
        avgLoss: 100,
        riskProfile: 'moderate',
        currentVIX: 30 // High volatility
      };
      
      const result = PositionSizingCalculator.calculate(input);
      
      expect(result.vixAdjustedSize).toBeLessThan(result.recommendedPositionSize);
      expect(result.vixAdjustedSize).toBe(result.recommendedPositionSize * 0.5); // 50% reduction for VIX 30
    });

    it('should calculate risk amount in dollars correctly', () => {
      const input: PositionSizingInput = {
        accountBalance: 10000,
        winRate: 60,
        avgWin: 150,
        avgLoss: 100,
        riskProfile: 'moderate'
      };
      
      const result = PositionSizingCalculator.calculate(input);
      
      const expectedRiskAmount = input.accountBalance * (result.vixAdjustedSize / 100);
      expect(result.riskAmount).toBe(expectedRiskAmount);
    });
  });

  describe('Compound Growth Calculation', () => {
    it('should calculate compound growth correctly for user example', () => {
      // Fix for user example: $6000 → $6347 over 27 trades = 0.2084% per trade return
      const result = PositionSizingCalculator.calculateCompoundGrowth(6000, 6347, 27);
      
      expect(result.perTradeReturnPercent).toBeCloseTo(0.2084, 3);
      expect(result.verification).toBe(true);
      expect(result.finalValue).toBeCloseTo(6347, 0);
    });

    it('should handle edge cases correctly', () => {
      // No growth case
      const noGrowth = PositionSizingCalculator.calculateCompoundGrowth(1000, 1000, 100);
      expect(noGrowth.perTradeReturn).toBe(0);
      expect(noGrowth.verification).toBe(true);
      
      // Single trade double
      const singleTrade = PositionSizingCalculator.calculateCompoundGrowth(2000, 4000, 1);
      expect(singleTrade.perTradeReturn).toBe(1.0); // 100% return
      expect(singleTrade.verification).toBe(true);
    });

    it('should calculate annualized returns correctly', () => {
      const result = PositionSizingCalculator.calculateCompoundGrowth(10000, 12000, 52);
      
      // Should calculate based on 52 trades per year
      const expectedAnnualized = Math.pow(1 + result.perTradeReturn, 52) - 1;
      expect(result.annualizedReturn).toBeCloseTo(expectedAnnualized, 6);
    });
  });

  describe('Risk Profiles', () => {
    it('should return correct risk profile data', () => {
      const conservative = PositionSizingCalculator.getRiskProfile('conservative');
      
      expect(conservative.name).toBe('conservative');
      expect(conservative.riskPerTrade.default).toBe(0.75);
      expect(conservative.kellyFraction).toBe(0.25);
      expect(conservative.maxDrawdown).toBe(0.05);
    });

    it('should return all risk profiles', () => {
      const profiles = PositionSizingCalculator.getAllRiskProfiles();
      
      expect(profiles).toHaveLength(3);
      expect(profiles.map(p => p.name)).toEqual(['conservative', 'moderate', 'aggressive']);
    });
  });

  describe('Mathematical Accuracy Tests', () => {
    const testCases = [
      { winRate: 60, avgWin: 150, avgLoss: 100, expected: 0.05 }, // Capped at 5%
      { winRate: 45, avgWin: 200, avgLoss: 100, expected: 0.025 }, // 25% fractional
      { winRate: 55, avgWin: 120, avgLoss: 100, expected: 0.025 } // 25% fractional
    ];

    testCases.forEach(({ winRate, avgWin, avgLoss, expected }, index) => {
      it(`should pass mathematical test case ${index + 1}`, () => {
        const result = PositionSizingCalculator.calculateKellyCriterion(winRate, avgWin, avgLoss, 0.25);
        expect(result).toBeCloseTo(expected, 3);
      });
    });
  });

  describe('Compound Growth Test Cases', () => {
    const growthTestCases = [
      { principal: 6000, final: 6347, trades: 27, tolerance: 0.000001 },
      { principal: 10000, final: 8000, trades: 20, tolerance: 0.000001 }
    ];

    growthTestCases.forEach(({ principal, final, trades, tolerance }, index) => {
      it(`should pass compound growth test case ${index + 1}`, () => {
        const result = PositionSizingCalculator.calculateCompoundGrowth(principal, final, trades);
        
        // Verify the calculation is accurate within tolerance
        expect(Math.abs(result.finalValue - final)).toBeLessThan(tolerance);
        expect(result.verification).toBe(true);
      });
    });
  });

  describe('VIX Scaling Test Cases', () => {
    const vixTestCases = [
      { vix: 12, expected: 1.0 },
      { vix: 20, expected: 0.75 },
      { vix: 30, expected: 0.5 },
      { vix: 40, expected: 0.25 }
    ];

    vixTestCases.forEach(({ vix, expected }, index) => {
      it(`should pass VIX scaling test case ${index + 1}`, () => {
        const result = PositionSizingCalculator.getVIXMultiplier(vix);
        expect(result).toBe(expected);
      });
    });
  });
}); 