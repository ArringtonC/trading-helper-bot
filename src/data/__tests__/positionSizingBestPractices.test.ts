import {
  POSITION_SIZING_STANDARDS,
  POSITION_SIZING_BEST_PRACTICES,
  ASSET_CLASS_GUIDELINES,
  STRATEGY_GUIDELINES,
  MARKET_CONDITION_ADJUSTMENTS,
  EXPERIENCE_LEVEL_ADJUSTMENTS,
  EDUCATIONAL_CONTENT,
  getBestPracticesFor,
  getCriticalRules,
  BestPracticeRule
} from '../positionSizingBestPractices';

describe('Position Sizing Best Practices Database', () => {
  describe('POSITION_SIZING_STANDARDS', () => {
    it('should have all risk tolerance levels defined', () => {
      expect(POSITION_SIZING_STANDARDS).toHaveProperty('conservative');
      expect(POSITION_SIZING_STANDARDS).toHaveProperty('moderate');
      expect(POSITION_SIZING_STANDARDS).toHaveProperty('aggressive');
    });

    it('should have increasing risk levels from conservative to aggressive', () => {
      const { conservative, moderate, aggressive } = POSITION_SIZING_STANDARDS;
      
      expect(conservative.maxPositionSize).toBeLessThan(moderate.maxPositionSize);
      expect(moderate.maxPositionSize).toBeLessThan(aggressive.maxPositionSize);
      
      expect(conservative.maxTotalExposure).toBeLessThan(moderate.maxTotalExposure);
      expect(moderate.maxTotalExposure).toBeLessThan(aggressive.maxTotalExposure);
      
      expect(conservative.riskPerTrade).toBeLessThan(moderate.riskPerTrade);
      expect(moderate.riskPerTrade).toBeLessThan(aggressive.riskPerTrade);
    });

    it('should have proper descriptions for each level', () => {
      Object.values(POSITION_SIZING_STANDARDS).forEach(standard => {
        expect(standard.description).toBeDefined();
        expect(typeof standard.description).toBe('string');
        expect(standard.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('POSITION_SIZING_BEST_PRACTICES', () => {
    it('should contain at least 10 best practice rules', () => {
      expect(POSITION_SIZING_BEST_PRACTICES.length).toBeGreaterThanOrEqual(10);
    });

    it('should have unique IDs for all rules', () => {
      const ids = POSITION_SIZING_BEST_PRACTICES.map(rule => rule.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have all required properties for each rule', () => {
      POSITION_SIZING_BEST_PRACTICES.forEach(rule => {
        expect(rule).toHaveProperty('id');
        expect(rule).toHaveProperty('category');
        expect(rule).toHaveProperty('title');
        expect(rule).toHaveProperty('description');
        expect(rule).toHaveProperty('recommendation');
        expect(rule).toHaveProperty('applicableFor');
        expect(rule).toHaveProperty('severity');
        expect(rule).toHaveProperty('source');
      });
    });

    it('should have valid category values', () => {
      const validCategories = ['risk_management', 'position_sizing', 'asset_specific', 'strategy_specific', 'market_conditions'];
      
      POSITION_SIZING_BEST_PRACTICES.forEach(rule => {
        expect(validCategories).toContain(rule.category);
      });
    });

    it('should have valid severity levels', () => {
      const validSeverities = ['guideline', 'recommended', 'critical'];
      
      POSITION_SIZING_BEST_PRACTICES.forEach(rule => {
        expect(validSeverities).toContain(rule.severity);
      });
    });

    it('should include critical rules for risk management', () => {
      const criticalRules = POSITION_SIZING_BEST_PRACTICES.filter(rule => rule.severity === 'critical');
      expect(criticalRules.length).toBeGreaterThan(0);
      
      // Should include the fundamental risk per trade rule
      const riskPerTradeRule = criticalRules.find(rule => rule.id === 'RISK_001');
      expect(riskPerTradeRule).toBeDefined();
    });
  });

  describe('ASSET_CLASS_GUIDELINES', () => {
    it('should have guidelines for major asset classes', () => {
      const expectedAssets = ['stocks', 'crypto', 'forex', 'options', 'futures', 'etfs'];
      
      expectedAssets.forEach(asset => {
        expect(ASSET_CLASS_GUIDELINES).toHaveProperty(asset);
      });
    });

    it('should have crypto with the lowest position limits', () => {
      const cryptoLimits = ASSET_CLASS_GUIDELINES.crypto;
      const stockLimits = ASSET_CLASS_GUIDELINES.stocks;
      
      expect(cryptoLimits.maxPositionSize).toBeLessThan(stockLimits.maxPositionSize);
      expect(cryptoLimits.maxTotalExposure).toBeLessThan(stockLimits.maxTotalExposure);
    });

    it('should have all required properties for each asset class', () => {
      Object.values(ASSET_CLASS_GUIDELINES).forEach(guideline => {
        expect(guideline).toHaveProperty('maxPositionSize');
        expect(guideline).toHaveProperty('maxTotalExposure');
        expect(guideline).toHaveProperty('considerations');
        expect(guideline).toHaveProperty('notes');
        expect(Array.isArray(guideline.considerations)).toBe(true);
      });
    });
  });

  describe('STRATEGY_GUIDELINES', () => {
    it('should have guidelines for major trading strategies', () => {
      const expectedStrategies = ['day_trading', 'swing_trading', 'position_trading', 'scalping'];
      
      expectedStrategies.forEach(strategy => {
        expect(STRATEGY_GUIDELINES).toHaveProperty(strategy);
      });
    });

    it('should have scalping with the smallest position limits', () => {
      const scalpingLimits = STRATEGY_GUIDELINES.scalping;
      const swingLimits = STRATEGY_GUIDELINES.swing_trading;
      
      expect(scalpingLimits.maxPositionSize).toBeLessThan(swingLimits.maxPositionSize);
      expect(scalpingLimits.riskPerTrade).toBeLessThan(swingLimits.riskPerTrade);
    });

    it('should have position trading with the largest limits', () => {
      const positionLimits = STRATEGY_GUIDELINES.position_trading;
      const dayLimits = STRATEGY_GUIDELINES.day_trading;
      
      expect(positionLimits.maxPositionSize).toBeGreaterThan(dayLimits.maxPositionSize);
      expect(positionLimits.maxTotalExposure).toBeGreaterThan(dayLimits.maxTotalExposure);
    });
  });

  describe('MARKET_CONDITION_ADJUSTMENTS', () => {
    it('should have adjustments for various market conditions', () => {
      const expectedConditions = ['low_volatility', 'normal_volatility', 'high_volatility', 'bear_market', 'bull_market', 'crisis_conditions'];
      
      expectedConditions.forEach(condition => {
        expect(MARKET_CONDITION_ADJUSTMENTS).toHaveProperty(condition);
      });
    });

    it('should reduce position sizes for high volatility and crisis conditions', () => {
      expect(MARKET_CONDITION_ADJUSTMENTS.high_volatility.sizeMultiplier).toBeLessThan(1.0);
      expect(MARKET_CONDITION_ADJUSTMENTS.crisis_conditions.sizeMultiplier).toBeLessThan(1.0);
      expect(MARKET_CONDITION_ADJUSTMENTS.crisis_conditions.sizeMultiplier).toBeLessThan(MARKET_CONDITION_ADJUSTMENTS.high_volatility.sizeMultiplier);
    });

    it('should allow slight increases for low volatility and bull markets', () => {
      expect(MARKET_CONDITION_ADJUSTMENTS.low_volatility.sizeMultiplier).toBeGreaterThan(1.0);
      expect(MARKET_CONDITION_ADJUSTMENTS.bull_market.sizeMultiplier).toBeGreaterThan(1.0);
    });

    it('should use 1.0 multiplier for normal conditions', () => {
      expect(MARKET_CONDITION_ADJUSTMENTS.normal_volatility.sizeMultiplier).toBe(1.0);
    });
  });

  describe('EXPERIENCE_LEVEL_ADJUSTMENTS', () => {
    it('should have adjustments for all experience levels', () => {
      const expectedLevels = ['learning', 'import', 'broker'];
      
      expectedLevels.forEach(level => {
        expect(EXPERIENCE_LEVEL_ADJUSTMENTS).toHaveProperty(level);
      });
    });

    it('should have progressive increases from learning to broker', () => {
      const { learning, import: importLevel, broker } = EXPERIENCE_LEVEL_ADJUSTMENTS;
      
      expect(learning.maxPositionMultiplier).toBeLessThan(importLevel.maxPositionMultiplier);
      expect(importLevel.maxPositionMultiplier).toBeLessThan(broker.maxPositionMultiplier);
      
      expect(learning.riskMultiplier).toBeLessThan(importLevel.riskMultiplier);
      expect(importLevel.riskMultiplier).toBeLessThan(broker.riskMultiplier);
    });

    it('should have conservative settings for learning level', () => {
      const learningSettings = EXPERIENCE_LEVEL_ADJUSTMENTS.learning;
      
      expect(learningSettings.maxPositionMultiplier).toBeLessThan(1.0);
      expect(learningSettings.maxExposureMultiplier).toBeLessThan(1.0);
      expect(learningSettings.riskMultiplier).toBeLessThan(1.0);
    });
  });

  describe('getBestPracticesFor function', () => {
    it('should return all rules when no criteria provided', () => {
      const results = getBestPracticesFor({});
      expect(results.length).toBe(POSITION_SIZING_BEST_PRACTICES.length);
    });

    it('should filter by asset class correctly', () => {
      const cryptoRules = getBestPracticesFor({ assetClass: 'crypto' });
      
      cryptoRules.forEach(rule => {
        if (rule.applicableFor.assetClasses) {
          expect(rule.applicableFor.assetClasses).toContain('crypto');
        }
      });
    });

    it('should filter by trading strategy correctly', () => {
      const dayTradingRules = getBestPracticesFor({ tradingStrategy: 'day_trading' });
      
      dayTradingRules.forEach(rule => {
        if (rule.applicableFor.tradingStrategies) {
          expect(rule.applicableFor.tradingStrategies).toContain('day_trading');
        }
      });
    });

    it('should filter by experience level correctly', () => {
      const learningRules = getBestPracticesFor({ experienceLevel: 'learning' });
      
      learningRules.forEach(rule => {
        if (rule.applicableFor.experienceLevels) {
          expect(rule.applicableFor.experienceLevels).toContain('learning');
        }
      });
    });

    it('should handle multiple criteria correctly', () => {
      const specificRules = getBestPracticesFor({
        assetClass: 'crypto',
        experienceLevel: 'learning'
      });
      
      specificRules.forEach(rule => {
        let matchesAsset = !rule.applicableFor.assetClasses || rule.applicableFor.assetClasses.includes('crypto');
        let matchesExperience = !rule.applicableFor.experienceLevels || rule.applicableFor.experienceLevels.includes('learning');
        
        expect(matchesAsset && matchesExperience).toBe(true);
      });
    });

    it('should return empty array for non-existent criteria', () => {
      const results = getBestPracticesFor({ assetClass: 'nonexistent' });
      expect(results).toHaveLength(0);
    });
  });

  describe('getCriticalRules function', () => {
    it('should return only critical severity rules', () => {
      const criticalRules = getCriticalRules();
      
      expect(criticalRules.length).toBeGreaterThan(0);
      criticalRules.forEach(rule => {
        expect(rule.severity).toBe('critical');
      });
    });

    it('should include fundamental risk management rules', () => {
      const criticalRules = getCriticalRules();
      const riskPerTradeRule = criticalRules.find(rule => rule.id === 'RISK_001');
      
      expect(riskPerTradeRule).toBeDefined();
      expect(riskPerTradeRule?.title).toContain('1-2% Per Trade');
    });
  });

  describe('EDUCATIONAL_CONTENT', () => {
    it('should have educational content for key concepts', () => {
      const expectedConcepts = ['positionSizing', 'riskPerTrade', 'diversification', 'volatility'];
      
      expectedConcepts.forEach(concept => {
        expect(EDUCATIONAL_CONTENT).toHaveProperty(concept);
      });
    });

    it('should have complete information for each concept', () => {
      Object.values(EDUCATIONAL_CONTENT).forEach(content => {
        expect(content).toHaveProperty('title');
        expect(content).toHaveProperty('explanation');
        expect(content).toHaveProperty('keyPoints');
        expect(Array.isArray(content.keyPoints)).toBe(true);
        expect(content.keyPoints.length).toBeGreaterThan(0);
      });
    });

    it('should have meaningful titles and explanations', () => {
      Object.values(EDUCATIONAL_CONTENT).forEach(content => {
        expect(content.title.length).toBeGreaterThan(0);
        expect(content.explanation.length).toBeGreaterThan(50);
        content.keyPoints.forEach(point => {
          expect(point.length).toBeGreaterThan(10);
        });
      });
    });
  });

  describe('Data integrity checks', () => {
    it('should have reasonable position size limits', () => {
      // Check that no position size exceeds 20% (extreme limit)
      POSITION_SIZING_BEST_PRACTICES.forEach(rule => {
        if (rule.recommendation.maxPositionSize) {
          expect(rule.recommendation.maxPositionSize).toBeLessThanOrEqual(20);
          expect(rule.recommendation.maxPositionSize).toBeGreaterThan(0);
        }
      });
    });

    it('should have reasonable total exposure limits', () => {
      // Check that no total exposure exceeds 100%
      POSITION_SIZING_BEST_PRACTICES.forEach(rule => {
        if (rule.recommendation.maxTotalExposure) {
          expect(rule.recommendation.maxTotalExposure).toBeLessThanOrEqual(100);
          expect(rule.recommendation.maxTotalExposure).toBeGreaterThan(0);
        }
      });
    });

    it('should have reasonable risk per trade limits', () => {
      // Check that risk per trade doesn't exceed 5%
      POSITION_SIZING_BEST_PRACTICES.forEach(rule => {
        if (rule.recommendation.riskPerTrade) {
          expect(rule.recommendation.riskPerTrade).toBeLessThanOrEqual(5);
          expect(rule.recommendation.riskPerTrade).toBeGreaterThan(0);
        }
      });
    });

    it('should have valid market condition multipliers', () => {
      Object.values(MARKET_CONDITION_ADJUSTMENTS).forEach(adjustment => {
        expect(adjustment.sizeMultiplier).toBeGreaterThan(0);
        expect(adjustment.sizeMultiplier).toBeLessThanOrEqual(2); // No more than 2x normal size
      });
    });
  });
}); 
 
 
 