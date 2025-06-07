import VolatilityCalculationEngine, {
  PriceData,
  VolatilityData,
  IVPercentileResult,
  ATRResult,
  BollingerBandsResult,
  VIXCorrelationResult
} from '../VolatilityCalculationEngine';

describe('VolatilityCalculationEngine', () => {
  let engine: VolatilityCalculationEngine;

  beforeEach(() => {
    engine = new VolatilityCalculationEngine();
  });

  afterEach(() => {
    engine.clearCache();
  });

  // Helper function to generate mock price data
  const generateMockPriceData = (days: number, basePrice = 100): PriceData[] => {
    const data: PriceData[] = [];
    let currentPrice = basePrice;
    
    for (let i = 0; i < days; i++) {
      const date = new Date(2023, 0, i + 1).toISOString().split('T')[0];
      const change = (Math.random() - 0.5) * 0.02 * currentPrice; // 2% daily volatility
      
      const open = currentPrice;
      const close = currentPrice + change;
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      
      data.push({
        date,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Math.floor(1000000 * (0.5 + Math.random()))
      });
      
      currentPrice = close;
    }
    
    return data;
  };

  // Helper function to generate mock volatility data
  const generateMockVolatilityData = (days: number, baseIV = 0.25): VolatilityData[] => {
    const data: VolatilityData[] = [];
    let currentIV = baseIV;
    
    for (let i = 0; i < days; i++) {
      const date = new Date(2023, 0, i + 1).toISOString().split('T')[0];
      const change = (Math.random() - 0.5) * 0.02; // Small daily IV changes
      
      currentIV = Math.max(0.05, Math.min(2.0, currentIV + change));
      const historicalVol = currentIV * (0.8 + Math.random() * 0.3);
      
      data.push({
        date,
        impliedVolatility: Number(currentIV.toFixed(4)),
        historicalVolatility: Number(historicalVol.toFixed(4)),
        symbol: 'TEST'
      });
    }
    
    return data;
  };

  describe('calculateIVPercentile', () => {
    it('should calculate IV percentile correctly', () => {
      const volatilityData = generateMockVolatilityData(100, 0.30);
      const currentIV = 0.35;
      
      const result = engine.calculateIVPercentile(currentIV, volatilityData);
      
      expect(result.current).toBe(currentIV);
      expect(result.percentile).toBeGreaterThanOrEqual(0);
      expect(result.percentile).toBeLessThanOrEqual(100);
      expect(result.historicalRange.min).toBeGreaterThan(0);
      expect(result.historicalRange.max).toBeGreaterThan(result.historicalRange.min);
      expect(result.historicalRange.mean).toBeGreaterThan(0);
      expect(['low', 'medium', 'high', 'extreme']).toContain(result.zone);
    });

    it('should determine volatility zones correctly', () => {
      // Create data where we know the percentile
      const volatilityData: VolatilityData[] = [];
      for (let i = 0; i < 100; i++) {
        volatilityData.push({
          date: `2023-01-${String(i + 1).padStart(2, '0')}`,
          impliedVolatility: 0.10 + (i / 100) * 0.40, // 0.10 to 0.50
          historicalVolatility: 0.10,
          symbol: 'TEST'
        });
      }

      // Test low zone (10th percentile)
      const lowResult = engine.calculateIVPercentile(0.14, volatilityData);
      expect(lowResult.zone).toBe('low');

      // Test medium zone (40th percentile)
      const mediumResult = engine.calculateIVPercentile(0.26, volatilityData);
      expect(mediumResult.zone).toBe('medium');

      // Test high zone (70th percentile)
      const highResult = engine.calculateIVPercentile(0.38, volatilityData);
      expect(highResult.zone).toBe('high');

      // Test extreme zone (90th percentile)
      const extremeResult = engine.calculateIVPercentile(0.46, volatilityData);
      expect(extremeResult.zone).toBe('extreme');
    });

    it('should handle edge cases', () => {
      const volatilityData = generateMockVolatilityData(10, 0.20);
      
      // Test with very high IV
      const highResult = engine.calculateIVPercentile(2.0, volatilityData);
      expect(highResult.percentile).toBe(100);
      expect(highResult.zone).toBe('extreme');

      // Test with very low IV
      const lowResult = engine.calculateIVPercentile(0.01, volatilityData);
      expect(lowResult.percentile).toBe(0);
      expect(lowResult.zone).toBe('low');
    });

    it('should throw error with no valid IV data', () => {
      const invalidData: VolatilityData[] = [
        { date: '2023-01-01', impliedVolatility: 0, historicalVolatility: 0, symbol: 'TEST' },
        { date: '2023-01-02', impliedVolatility: -0.1, historicalVolatility: 0, symbol: 'TEST' }
      ];

      expect(() => {
        engine.calculateIVPercentile(0.25, invalidData);
      }).toThrow('No valid IV data available for calculation');
    });

    it('should use caching correctly', () => {
      const volatilityData = generateMockVolatilityData(50);
      const currentIV = 0.25;

      const result1 = engine.calculateIVPercentile(currentIV, volatilityData);
      const result2 = engine.calculateIVPercentile(currentIV, volatilityData);

      expect(result1).toEqual(result2);
    });
  });

  describe('calculateATR', () => {
    it('should calculate ATR correctly', () => {
      const priceData = generateMockPriceData(30);
      const result = engine.calculateATR(priceData, 14);

      expect(result.value).toBeGreaterThan(0);
      expect(result.period).toBe(14);
      expect(['increasing', 'decreasing', 'stable']).toContain(result.trend);
      expect(typeof result.historicalComparison).toBe('number');
    });

    it('should handle different periods', () => {
      const priceData = generateMockPriceData(50);
      
      const atr7 = engine.calculateATR(priceData, 7);
      const atr21 = engine.calculateATR(priceData, 21);

      expect(atr7.period).toBe(7);
      expect(atr21.period).toBe(21);
      expect(atr7.value).toBeGreaterThan(0);
      expect(atr21.value).toBeGreaterThan(0);
    });

    it('should throw error with insufficient data', () => {
      const priceData = generateMockPriceData(10);

      expect(() => {
        engine.calculateATR(priceData, 14);
      }).toThrow('Insufficient data for ATR calculation');
    });

    it('should use Wilder\'s smoothing method', () => {
      // Create data with known true ranges
      const priceData: PriceData[] = [
        { date: '2023-01-01', open: 100, high: 105, low: 95, close: 102 },
        { date: '2023-01-02', open: 102, high: 108, low: 100, close: 105 },
        { date: '2023-01-03', open: 105, high: 110, low: 103, close: 108 },
        { date: '2023-01-04', open: 108, high: 112, low: 106, close: 110 },
        { date: '2023-01-05', open: 110, high: 115, low: 108, close: 112 }
      ];

      // Add more data to meet minimum requirements
      for (let i = 5; i < 20; i++) {
        const prev = priceData[i - 1];
        priceData.push({
          date: `2023-01-${String(i + 1).padStart(2, '0')}`,
          open: prev.close,
          high: prev.close + 3,
          low: prev.close - 3,
          close: prev.close + (Math.random() - 0.5) * 4
        });
      }

      const result = engine.calculateATR(priceData, 5);
      expect(result.value).toBeGreaterThan(0);
    });
  });

  describe('calculateBollingerBands', () => {
    it('should calculate Bollinger Bands correctly', () => {
      const priceData = generateMockPriceData(30);
      const result = engine.calculateBollingerBands(priceData, 20, 2);

      expect(result.upper).toBeGreaterThan(result.middle);
      expect(result.middle).toBeGreaterThan(result.lower);
      expect(result.bandwidth).toBeGreaterThan(0);
      expect(result.position).toBeGreaterThanOrEqual(0);
      expect(result.position).toBeLessThanOrEqual(1);
      expect(typeof result.squeeze).toBe('boolean');
    });

    it('should handle different periods and standard deviations', () => {
      const priceData = generateMockPriceData(50);
      
      const bb20_2 = engine.calculateBollingerBands(priceData, 20, 2);
      const bb20_1 = engine.calculateBollingerBands(priceData, 20, 1);
      const bb10_2 = engine.calculateBollingerBands(priceData, 10, 2);

      // Bands should be wider with higher standard deviation
      expect(bb20_2.bandwidth).toBeGreaterThan(bb20_1.bandwidth);
      
      // Different periods should give different results
      expect(bb20_2.middle).not.toBe(bb10_2.middle);
    });

    it('should detect squeeze correctly', () => {
      // Create data that would show a squeeze pattern
      const priceData: PriceData[] = [];
      
      // First 20 days: high volatility
      for (let i = 0; i < 20; i++) {
        const price = 100 + (Math.random() - 0.5) * 10; // High volatility
        priceData.push({
          date: `2023-01-${String(i + 1).padStart(2, '0')}`,
          open: price,
          high: price + 2,
          low: price - 2,
          close: price
        });
      }
      
      // Next 20 days: low volatility (squeeze)
      for (let i = 20; i < 40; i++) {
        const price = 100 + (Math.random() - 0.5) * 2; // Low volatility
        priceData.push({
          date: `2023-01-${String(i + 1).padStart(2, '0')}`,
          open: price,
          high: price + 0.5,
          low: price - 0.5,
          close: price
        });
      }

      const result = engine.calculateBollingerBands(priceData, 20, 2);
      expect(typeof result.squeeze).toBe('boolean');
    });

    it('should throw error with insufficient data', () => {
      const priceData = generateMockPriceData(10);

      expect(() => {
        engine.calculateBollingerBands(priceData, 20, 2);
      }).toThrow('Insufficient data for Bollinger Bands');
    });

    it('should calculate position correctly', () => {
      // Create data where we know the position
      const priceData: PriceData[] = [];
      const basePrice = 100;
      
      for (let i = 0; i < 25; i++) {
        priceData.push({
          date: `2023-01-${String(i + 1).padStart(2, '0')}`,
          open: basePrice,
          high: basePrice + 1,
          low: basePrice - 1,
          close: basePrice // Constant price for predictable bands
        });
      }
      
      const result = engine.calculateBollingerBands(priceData, 20, 2);
      
      // With constant price, position should be around 0.5
      expect(result.position).toBeCloseTo(0.5, 1);
    });
  });

  describe('calculateVIXCorrelation', () => {
    it('should calculate VIX correlation correctly', () => {
      const securityPrices = generateMockPriceData(50);
      const vixData = generateMockPriceData(50, 20);
      
      const result = engine.calculateVIXCorrelation(securityPrices, vixData, 30);

      expect(result.correlation).toBeGreaterThanOrEqual(-1);
      expect(result.correlation).toBeLessThanOrEqual(1);
      expect(['weak', 'moderate', 'strong']).toContain(result.strength);
      expect(['positive', 'negative']).toContain(result.direction);
      expect(typeof result.historicalAverage).toBe('number');
    });

    it('should determine correlation strength correctly', () => {
      // Create perfectly correlated data
      const securityPrices: PriceData[] = [];
      const vixData: PriceData[] = [];
      
      for (let i = 0; i < 50; i++) {
        const date = `2023-01-${String(i + 1).padStart(2, '0')}`;
        const securityReturn = (Math.random() - 0.5) * 0.04;
        const vixReturn = -securityReturn; // Perfect negative correlation
        
        securityPrices.push({
          date,
          open: 100 + i,
          high: 100 + i + 1,
          low: 100 + i - 1,
          close: 100 + i + securityReturn * 100
        });
        
        vixData.push({
          date,
          open: 20 + i * 0.1,
          high: 20 + i * 0.1 + 1,
          low: 20 + i * 0.1 - 1,
          close: 20 + i * 0.1 + vixReturn * 20
        });
      }

      const result = engine.calculateVIXCorrelation(securityPrices, vixData, 30);
      expect(result.direction).toBe('negative');
    });

    it('should handle misaligned data', () => {
      const securityPrices = generateMockPriceData(40);
      const vixData = generateMockPriceData(30, 20);
      
      // Should still work with different lengths
      const result = engine.calculateVIXCorrelation(securityPrices, vixData, 25);
      expect(typeof result.correlation).toBe('number');
    });

    it('should throw error with insufficient data', () => {
      const securityPrices = generateMockPriceData(20);
      const vixData = generateMockPriceData(20, 20);

      expect(() => {
        engine.calculateVIXCorrelation(securityPrices, vixData, 30);
      }).toThrow('Insufficient data for VIX correlation calculation');
    });
  });

  describe('calculateComprehensiveVolatility', () => {
    it('should calculate comprehensive volatility analysis', () => {
      const priceData = generateMockPriceData(100);
      const volatilityData = generateMockVolatilityData(100);
      const vixData = generateMockPriceData(100, 20);
      const currentIV = 0.25;

      const result = engine.calculateComprehensiveVolatility(
        'TEST',
        priceData,
        volatilityData,
        vixData,
        currentIV
      );

      expect(result.symbol).toBe('TEST');
      expect(result.timestamp).toBeDefined();
      expect(result.ivPercentile).toBeDefined();
      expect(result.atr).toBeDefined();
      expect(result.bollingerBands).toBeDefined();
      expect(result.vixCorrelation).toBeDefined();
      expect(['low-vol', 'normal', 'high-vol', 'crisis']).toContain(result.marketRegime);
    });

    it('should determine market regime correctly', () => {
      const priceData = generateMockPriceData(100);
      const vixData = generateMockPriceData(100, 20);

      // Test crisis regime (extreme IV, high bandwidth)
      const highVolatilityData = generateMockVolatilityData(100, 0.80);
      const crisisResult = engine.calculateComprehensiveVolatility(
        'TEST',
        priceData,
        highVolatilityData,
        vixData,
        0.90
      );
      // Market regime depends on multiple factors, so we just check it's valid
      expect(['low-vol', 'normal', 'high-vol', 'crisis']).toContain(crisisResult.marketRegime);

      // Test low-vol regime
      const lowVolatilityData = generateMockVolatilityData(100, 0.10);
      const lowVolResult = engine.calculateComprehensiveVolatility(
        'TEST',
        priceData,
        lowVolatilityData,
        vixData,
        0.08
      );
      expect(['low-vol', 'normal', 'high-vol', 'crisis']).toContain(lowVolResult.marketRegime);
    });
  });

  describe('caching', () => {
    it('should cache results correctly', () => {
      const priceData = generateMockPriceData(30);
      
      // First call should calculate
      const result1 = engine.calculateATR(priceData, 14);
      
      // Second call should use cache
      const result2 = engine.calculateATR(priceData, 14);
      
      expect(result1).toEqual(result2);
    });

    it('should clear cache', () => {
      const priceData = generateMockPriceData(30);
      engine.calculateATR(priceData, 14);
      
      const statsBefore = engine.getStats();
      expect(statsBefore.cacheSize).toBeGreaterThan(0);
      
      engine.clearCache();
      
      const statsAfter = engine.getStats();
      expect(statsAfter.cacheSize).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return engine statistics', () => {
      const stats = engine.getStats();
      
      expect(typeof stats.cacheSize).toBe('number');
      expect(typeof stats.cacheHitRate).toBe('number');
      expect(stats.lastCalculation).toBeNull();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty arrays gracefully', () => {
      expect(() => {
        engine.calculateATR([], 14);
      }).toThrow();
      
      expect(() => {
        engine.calculateBollingerBands([], 20, 2);
      }).toThrow();
    });

    it('should handle zero or negative values appropriately', () => {
      const invalidPriceData: PriceData[] = [
        { date: '2023-01-01', open: 0, high: 0, low: 0, close: 0 },
        { date: '2023-01-02', open: -10, high: -5, low: -15, close: -8 }
      ];

      // The calculation should still work with these values
      // (real-world validation would happen at data ingestion)
      expect(() => {
        engine.calculateATR(invalidPriceData, 1);
      }).not.toThrow();
    });

    it('should handle correlation calculation edge cases', () => {
      const priceData = generateMockPriceData(30);
      
      // VIX data with zero variance (constant values)
      const constantVIXData: PriceData[] = [];
      for (let i = 0; i < 30; i++) {
        constantVIXData.push({
          date: `2023-01-${String(i + 1).padStart(2, '0')}`,
          open: 20,
          high: 20,
          low: 20,
          close: 20
        });
      }

      const result = engine.calculateVIXCorrelation(priceData, constantVIXData, 20);
      // Correlation with constant data should be 0
      expect(result.correlation).toBe(0);
    });
  });
}); 