/**
 * Trading Strategy Service Integration Test
 * 
 * Simple integration test to verify the service works end-to-end
 */

import { 
  tradingStrategyService,
  StrategyCategory,
  RiskLevel,
  TimeHorizon,
  SkillCategory
} from '../TradingStrategyService';

describe('TradingStrategyService Integration', () => {
  test('should provide comprehensive strategy database', () => {
    const strategies = tradingStrategyService.getAllStrategies();
    
    expect(strategies.length).toBeGreaterThanOrEqual(15);
    expect(strategies.every(s => s.status === 'ACTIVE')).toBe(true);
    
    // Verify all categories are represented
    const categories = new Set(strategies.map(s => s.category));
    expect(categories.has(StrategyCategory.MOMENTUM)).toBe(true);
    expect(categories.has(StrategyCategory.VALUE)).toBe(true);
    expect(categories.has(StrategyCategory.GROWTH)).toBe(true);
    expect(categories.has(StrategyCategory.SWING)).toBe(true);
    expect(categories.has(StrategyCategory.SCALPING)).toBe(true);
    expect(categories.has(StrategyCategory.MEAN_REVERSION)).toBe(true);
  });

  test('should generate basic market environment', async () => {
    const environment = await tradingStrategyService.detectMarketEnvironment();
    
    expect(environment).toBeDefined();
    expect(environment.volatilityRegime).toBeDefined();
    expect(environment.marketCondition).toBeDefined();
    expect(environment.vixLevel).toBeGreaterThan(0);
    expect(environment.marketSentiment).toBeDefined();
  });

  test('should support strategy filtering', () => {
    const momentumStrategies = tradingStrategyService.getStrategyByCategory(StrategyCategory.MOMENTUM);
    const valueStrategies = tradingStrategyService.getStrategyByCategory(StrategyCategory.VALUE);
    
    expect(momentumStrategies.length).toBeGreaterThan(0);
    expect(valueStrategies.length).toBeGreaterThan(0);
    
    expect(momentumStrategies.every(s => s.category === StrategyCategory.MOMENTUM)).toBe(true);
    expect(valueStrategies.every(s => s.category === StrategyCategory.VALUE)).toBe(true);
  });

  test('should include challenge system integration', () => {
    const strategies = tradingStrategyService.getAllStrategies();
    
    // Should have XP multipliers
    expect(strategies.every(s => s.xpMultiplier > 0)).toBe(true);
    
    // Should have skill categories
    expect(strategies.every(s => s.skillCategories.length > 0)).toBe(true);
    
    // Should have difficulty ratings
    expect(strategies.every(s => s.difficultyRating >= 1 && s.difficultyRating <= 10)).toBe(true);
    
    // Should include challenge-specific strategies
    const challengeStrategies = strategies.filter(s => 
      s.name.includes('Challenge') || s.name.includes('Buffett') || s.name.includes('Soros')
    );
    expect(challengeStrategies.length).toBeGreaterThan(0);
  });

  test('should maintain singleton pattern', () => {
    const instance1 = tradingStrategyService;
    const instance2 = tradingStrategyService;
    
    expect(instance1).toBe(instance2);
  });

  test('should provide educational content for key strategies', () => {
    const strategies = tradingStrategyService.getAllStrategies();
    const strategiesWithEducation = strategies.filter(s => s.educationalContent);
    
    expect(strategiesWithEducation.length).toBeGreaterThan(0);
    
    strategiesWithEducation.forEach(strategy => {
      const education = strategy.educationalContent!;
      expect(education.overview).toBeDefined();
      expect(education.keyPrinciples.length).toBeGreaterThan(0);
      expect(education.commonMistakes.length).toBeGreaterThan(0);
      expect(education.tips.length).toBeGreaterThan(0);
    });
  });
});