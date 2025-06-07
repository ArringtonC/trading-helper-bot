import { 
  kellyFraction, 
  kellyFromWinRate, 
  calculatePositionSize 
} from '../kelly';

describe('Kelly Criterion Position Sizing', () => {
  describe('kellyFraction', () => {
    it('should return 0 for zero variance', () => {
      const result = kellyFraction(0.1, 0);
      expect(result).toBe(0);
    });

    it('should return 0 for negative expected return', () => {
      const result = kellyFraction(-0.1, 0.2);
      expect(result).toBe(0);
    });

    it('should return 0 for zero expected return', () => {
      const result = kellyFraction(0, 0.2);
      expect(result).toBe(0);
    });

    it('should calculate correct Kelly fraction for positive expected return', () => {
      const expectedReturn = 0.1; // 10% expected return
      const variance = 0.04; // 4% variance
      
      const result = kellyFraction(expectedReturn, variance);
      
      // Full Kelly = 0.1 / 0.04 = 2.5
      // Half Kelly = 2.5 / 2 = 1.25
      // Clamped to max 0.5 = 0.5
      expect(result).toBe(0.5);
    });

    it('should apply half-Kelly constraint', () => {
      const expectedReturn = 0.05; // 5% expected return
      const variance = 0.1; // 10% variance
      
      const result = kellyFraction(expectedReturn, variance);
      
      // Full Kelly = 0.05 / 0.1 = 0.5
      // Half Kelly = 0.5 / 2 = 0.25
      expect(result).toBe(0.25);
    });

    it('should never exceed 50% allocation', () => {
      const expectedReturn = 1.0; // 100% expected return
      const variance = 0.01; // 1% variance
      
      const result = kellyFraction(expectedReturn, variance);
      
      expect(result).toBe(0.5); // Clamped to maximum
    });

    it('should handle small positive expected returns', () => {
      const expectedReturn = 0.001; // 0.1% expected return
      const variance = 0.1; // 10% variance
      
      const result = kellyFraction(expectedReturn, variance);
      
      // Full Kelly = 0.001 / 0.1 = 0.01
      // Half Kelly = 0.01 / 2 = 0.005
      expect(result).toBeCloseTo(0.005, 4);
    });
  });

  describe('kellyFromWinRate', () => {
    it('should return 0 for invalid win rates', () => {
      expect(kellyFromWinRate(0, 100, 50)).toBe(0); // 0% win rate
      expect(kellyFromWinRate(1, 100, 50)).toBe(0); // 100% win rate
      expect(kellyFromWinRate(-0.1, 100, 50)).toBe(0); // Negative win rate
      expect(kellyFromWinRate(1.1, 100, 50)).toBe(0); // > 100% win rate
    });

    it('should return 0 for invalid win/loss amounts', () => {
      expect(kellyFromWinRate(0.6, 0, 50)).toBe(0); // Zero avg win
      expect(kellyFromWinRate(0.6, -100, 50)).toBe(0); // Negative avg win
      expect(kellyFromWinRate(0.6, 100, 0)).toBe(0); // Zero avg loss
      expect(kellyFromWinRate(0.6, 100, -50)).toBe(0); // Negative avg loss
    });

    it('should return 0 for negative expected return', () => {
      const winRate = 0.3; // 30% win rate
      const avgWin = 100;
      const avgLoss = 200; // Large losses
      
      const result = kellyFromWinRate(winRate, avgWin, avgLoss);
      
      // Expected return = 0.3 * 100 - 0.7 * 200 = 30 - 140 = -110 (negative)
      expect(result).toBe(0);
    });

    it('should calculate correct Kelly fraction for profitable strategy', () => {
      const winRate = 0.6; // 60% win rate
      const avgWin = 100;
      const avgLoss = 50;
      
      const result = kellyFromWinRate(winRate, avgWin, avgLoss);
      
      // Expected return = 0.6 * 100 - 0.4 * 50 = 60 - 20 = 40
      // b = avgWin / avgLoss = 100 / 50 = 2
      // Full Kelly = (b * p - q) / b = (2 * 0.6 - 0.4) / 2 = (1.2 - 0.4) / 2 = 0.4
      // Half Kelly = 0.4 / 2 = 0.2
      expect(result).toBeCloseTo(0.2, 4);
    });

    it('should apply half-Kelly constraint', () => {
      const winRate = 0.9; // 90% win rate
      const avgWin = 100;
      const avgLoss = 10; // Small losses
      
      const result = kellyFromWinRate(winRate, avgWin, avgLoss);
      
      // This should result in a high Kelly fraction that gets clamped
      expect(result).toBeLessThanOrEqual(0.5);
    });

    it('should handle edge case of break-even strategy', () => {
      const winRate = 0.5; // 50% win rate
      const avgWin = 100;
      const avgLoss = 100; // Equal win/loss
      
      const result = kellyFromWinRate(winRate, avgWin, avgLoss);
      
      // Expected return = 0.5 * 100 - 0.5 * 100 = 0
      expect(result).toBe(0);
    });
  });

  describe('calculatePositionSize', () => {
    it('should calculate position size based on Kelly fraction', () => {
      const kellyFrac = 0.1; // 10% Kelly
      const accountSize = 100000; // $100k account
      
      const result = calculatePositionSize(kellyFrac, accountSize);
      
      expect(result).toBe(2000); // min(10000, 2000) = 2000 (2% max risk)
    });

    it('should respect maximum risk constraint', () => {
      const kellyFrac = 0.5; // 50% Kelly (very high)
      const accountSize = 100000; // $100k account
      const maxRisk = 0.01; // 1% max risk
      
      const result = calculatePositionSize(kellyFrac, accountSize, maxRisk);
      
      expect(result).toBe(1000); // min(50000, 1000) = 1000
    });

    it('should use Kelly size when smaller than max risk', () => {
      const kellyFrac = 0.005; // 0.5% Kelly (very conservative)
      const accountSize = 100000; // $100k account
      
      const result = calculatePositionSize(kellyFrac, accountSize);
      
      expect(result).toBe(500); // min(500, 2000) = 500
    });

    it('should handle zero Kelly fraction', () => {
      const kellyFrac = 0;
      const accountSize = 100000;
      
      const result = calculatePositionSize(kellyFrac, accountSize);
      
      expect(result).toBe(0);
    });

    it('should handle custom max risk parameter', () => {
      const kellyFrac = 0.1; // 10% Kelly
      const accountSize = 50000; // $50k account
      const maxRisk = 0.05; // 5% max risk
      
      const result = calculatePositionSize(kellyFrac, accountSize, maxRisk);
      
      expect(result).toBe(2500); // min(5000, 2500) = 2500
    });

    it('should handle small account sizes', () => {
      const kellyFrac = 0.02; // 2% Kelly
      const accountSize = 1000; // $1k account
      
      const result = calculatePositionSize(kellyFrac, accountSize);
      
      expect(result).toBe(20); // min(20, 20) = 20
    });
  });
}); 
 
 
 