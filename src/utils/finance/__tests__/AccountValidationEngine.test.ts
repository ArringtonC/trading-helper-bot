/**
 * Comprehensive tests for AccountValidationEngine
 * Tests account validation, funding recommendations, and timeline planning
 */

import { AccountValidationEngine, TradingGoals } from '../AccountValidationEngine';

describe('AccountValidationEngine', () => {
  describe('Account Validation', () => {
    it('should validate account as viable when balance meets minimum requirements', () => {
      const result = AccountValidationEngine.validateAccountForGoals(
        10000, // account balance
        1.5,   // risk percent
        100,   // target trade size
        {}     // trading goals
      );

      expect(result.isViable).toBe(true);
      expect(result.recommendations.severity).toBe('warning'); // Should suggest more funding for optimal
    });

    it('should flag account as not viable when balance is too low', () => {
      const result = AccountValidationEngine.validateAccountForGoals(
        1000,  // account balance - too low
        2.5,   // risk percent
        100,   // target trade size
        {}     // trading goals
      );

      expect(result.isViable).toBe(false);
      expect(result.recommendations.severity).toBe('critical');
      expect(result.calculations.shortfall).toBeGreaterThan(0);
    });

    it('should validate account as optimal when balance exceeds recommended amount', () => {
      const tradingGoals: TradingGoals = {
        targetMonthlyIncome: 500,
        expectedWinRate: 0.6,
        averageWinAmount: 150,
        tradingFrequency: 'weekly'
      };

      const result = AccountValidationEngine.validateAccountForGoals(
        50000, // large account balance
        1.5,   // risk percent
        100,   // target trade size
        tradingGoals
      );

      expect(result.isOptimal).toBe(true);
      expect(result.recommendations.severity).toBe('success');
    });
  });

  describe('Minimum Account Calculation', () => {
    it('should calculate minimum account based on risk buffer', () => {
      // For 2% risk and $100 target trade size
      // Minimum = (100 * 50) / 0.02 = 250,000
      // But should be capped at reasonable levels and use absolute minimum
      const result = AccountValidationEngine.validateAccountForGoals(
        1000,
        2.0,
        100,
        {}
      );

      expect(result.calculations.minimumViableAccount).toBeGreaterThanOrEqual(2000); // Absolute minimum
    });

    it('should enforce absolute minimum account size', () => {
      const result = AccountValidationEngine.validateAccountForGoals(
        500,   // Very low balance
        0.5,   // Very low risk
        10,    // Small trade size
        {}
      );

      expect(result.calculations.minimumViableAccount).toBeGreaterThanOrEqual(2000);
    });
  });

  describe('Recommended Account Calculation', () => {
    it('should calculate recommended account based on trading goals', () => {
      const tradingGoals: TradingGoals = {
        targetMonthlyIncome: 1000,
        expectedWinRate: 0.6,
        averageWinAmount: 200,
        tradingFrequency: 'weekly'
      };

      const result = AccountValidationEngine.validateAccountForGoals(
        5000,
        1.5,
        100,
        tradingGoals
      );

      // Should calculate based on income goals
      expect(result.calculations.recommendedAccount).toBeGreaterThan(5000);
    });

    it('should use frequency-based defaults when no income goals provided', () => {
      const dailyGoals: TradingGoals = { tradingFrequency: 'daily' };
      const weeklyGoals: TradingGoals = { tradingFrequency: 'weekly' };
      const monthlyGoals: TradingGoals = { tradingFrequency: 'monthly' };

      const dailyResult = AccountValidationEngine.validateAccountForGoals(5000, 1.5, 100, dailyGoals);
      const weeklyResult = AccountValidationEngine.validateAccountForGoals(5000, 1.5, 100, weeklyGoals);
      const monthlyResult = AccountValidationEngine.validateAccountForGoals(5000, 1.5, 100, monthlyGoals);

      expect(dailyResult.calculations.recommendedAccount).toBeGreaterThan(weeklyResult.calculations.recommendedAccount);
      expect(weeklyResult.calculations.recommendedAccount).toBeGreaterThan(monthlyResult.calculations.recommendedAccount);
    });
  });

  describe('Funding Recommendations', () => {
    it('should provide critical recommendations for underfunded accounts', () => {
      const result = AccountValidationEngine.validateAccountForGoals(
        1000,  // Too low
        2.0,
        100,
        {}
      );

      expect(result.recommendations.severity).toBe('critical');
      expect(result.recommendations.title).toContain('Too Low for Safe Trading');
      expect(result.recommendations.actions).toBeDefined();
      expect(result.recommendations.actions!.length).toBeGreaterThan(0);
      expect(result.recommendations.actions!.some(action => action.action === 'showFundingPlan')).toBe(true);
    });

    it('should provide warning recommendations for suboptimal accounts', () => {
      const result = AccountValidationEngine.validateAccountForGoals(
        5000,  // Meets minimum but not optimal
        1.5,
        100,
        { targetMonthlyIncome: 1000, expectedWinRate: 0.6, averageWinAmount: 200 }
      );

      expect(result.recommendations.severity).toBe('warning');
      expect(result.recommendations.title).toContain('Additional Funding');
      expect(result.recommendations.actions).toBeDefined();
    });

    it('should provide success recommendations for optimal accounts', () => {
      const result = AccountValidationEngine.validateAccountForGoals(
        50000, // Large account
        1.5,
        100,
        {}
      );

      expect(result.recommendations.severity).toBe('success');
      expect(result.recommendations.title).toContain('Optimal');
      expect(result.recommendations.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Funding Plan Creation', () => {
    it('should create accurate funding timeline', () => {
      const plan = AccountValidationEngine.createFundingPlan(
        5000,  // current balance
        15000, // target balance
        1000   // monthly contribution
      );

      expect(plan.totalMonths).toBe(10); // (15000 - 5000) / 1000
      expect(plan.totalContributions).toBe(10000);
      expect(plan.timeline.length).toBe(11); // 0 + 10 months
      expect(plan.timeline[0].month).toBe(0);
      expect(plan.timeline[0].balance).toBe(5000);
      expect(plan.timeline[plan.timeline.length - 1].balance).toBe(15000);
    });

    it('should include trading capacity calculations for each month', () => {
      const plan = AccountValidationEngine.createFundingPlan(
        2000,
        10000,
        500
      );

      plan.timeline.forEach(month => {
        expect(month.tradingCapacity).toBeDefined();
        expect(month.tradingCapacity.conservativePositionSize).toBe(month.balance * 0.005);
        expect(month.tradingCapacity.moderatePositionSize).toBe(month.balance * 0.015);
        expect(month.tradingCapacity.aggressivePositionSize).toBe(month.balance * 0.025);
        expect(month.tradingCapacity.maxConcurrentTrades).toBe(Math.floor(month.balance / 1000));
      });
    });

    it('should generate appropriate milestones', () => {
      const plan = AccountValidationEngine.createFundingPlan(
        1000,
        25000,
        1000
      );

      expect(plan.milestones.length).toBeGreaterThan(0);
      
      // Should have milestones for key thresholds
      const milestoneBalances = plan.milestones.map(m => 
        plan.timeline[m.month]?.balance || 0
      );
      
      // Check for common thresholds
      expect(milestoneBalances.some(balance => balance >= 2000)).toBe(true);
      expect(milestoneBalances.some(balance => balance >= 5000)).toBe(true);
      expect(milestoneBalances.some(balance => balance >= 10000)).toBe(true);
    });
  });

  describe('Trading Capacity Calculation', () => {
    it('should calculate trading capacity correctly', () => {
      const capacity = AccountValidationEngine.calculateTradingCapacity(10000);

      expect(capacity.conservativePositionSize).toBe(50);   // 10000 * 0.005
      expect(capacity.moderatePositionSize).toBe(150);      // 10000 * 0.015
      expect(capacity.aggressivePositionSize).toBe(250);    // 10000 * 0.025
      expect(capacity.maxConcurrentTrades).toBe(10);        // 10000 / 1000
      expect(capacity.monthlyTradingPotential).toBe(600);   // 150 * 4
    });
  });

  describe('Account Size Recommendations by Trading Style', () => {
    it('should provide appropriate recommendations for different trading styles', () => {
      const dayTrading = AccountValidationEngine.getAccountSizeRecommendations('day-trading');
      const swingTrading = AccountValidationEngine.getAccountSizeRecommendations('swing-trading');
      const optionsTrading = AccountValidationEngine.getAccountSizeRecommendations('options-trading');

      expect(dayTrading.minimum).toBe(25000); // PDT rule
      expect(swingTrading.minimum).toBeLessThan(dayTrading.minimum);
      expect(optionsTrading.minimum).toBeLessThan(swingTrading.minimum);

      expect(dayTrading.description).toContain('PDT');
      expect(swingTrading.description).toContain('smaller accounts');
      expect(optionsTrading.description).toContain('diversification');
    });

    it('should default to options trading recommendations for unknown styles', () => {
      const unknown = AccountValidationEngine.getAccountSizeRecommendations('unknown-style');
      const options = AccountValidationEngine.getAccountSizeRecommendations('options-trading');

      expect(unknown).toEqual(options);
    });
  });

  describe('Funding Scenarios', () => {
    it('should calculate multiple funding scenarios', () => {
      const scenarios = AccountValidationEngine.calculateFundingScenarios(5000, 15000);

      expect(scenarios.length).toBe(4); // Conservative, Moderate, Aggressive, Accelerated
      expect(scenarios[0].scenario).toBe('Conservative');
      expect(scenarios[0].monthlyContribution).toBe(250);
      expect(scenarios[0].timeToTarget).toBe(40); // (15000-5000)/250

      expect(scenarios[3].scenario).toBe('Accelerated');
      expect(scenarios[3].monthlyContribution).toBe(2000);
      expect(scenarios[3].timeToTarget).toBe(5); // (15000-5000)/2000
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero or negative account balances', () => {
      const result = AccountValidationEngine.validateAccountForGoals(
        0,    // Zero balance
        1.5,
        100,
        {}
      );

      expect(result.isViable).toBe(false);
      expect(result.recommendations.severity).toBe('critical');
    });

    it('should handle very high risk percentages', () => {
      const result = AccountValidationEngine.validateAccountForGoals(
        10000,
        10,   // 10% risk - very high
        100,
        {}
      );

      // Should still calculate but may recommend lower risk
      expect(result.calculations.minimumViableAccount).toBeGreaterThan(0);
    });

    it('should handle funding plans where current balance exceeds target', () => {
      const plan = AccountValidationEngine.createFundingPlan(
        15000, // current balance
        10000, // target balance (lower)
        500    // monthly contribution
      );

      expect(plan.totalMonths).toBe(0);
      expect(plan.totalContributions).toBe(0);
      expect(plan.timeline.length).toBe(1); // Just current month
    });
  });

  describe('Account Validation Fix', () => {
    test('should show reasonable minimum account requirements for moderate risk profile', () => {
      const result = AccountValidationEngine.validateAccountForGoals(
        6000,    // $6k account balance
        1.5,     // 1.5% moderate risk
        75,      // $75 target trade size
        {
          targetMonthlyIncome: 500,
          tradingFrequency: 'weekly'
        }
      );

      // Should show a reasonable minimum (around $25k, not $666k)
      expect(result.calculations.minimumViableAccount).toBeLessThan(50000);
      expect(result.calculations.minimumViableAccount).toBeGreaterThan(5000);
      
      // Should not be viable with $6k account
      expect(result.isViable).toBe(false);
      
      // Should have critical severity recommendation
      expect(result.recommendations.severity).toBe('critical');
      
      // Shortfall should be reasonable
      expect(result.calculations.shortfall).toBeLessThan(50000);
      expect(result.calculations.shortfall).toBeGreaterThan(0);
    });

    test('should validate conservative risk profile with lower minimums', () => {
      const result = AccountValidationEngine.validateAccountForGoals(
        3000,    // $3k account balance
        0.75,    // 0.75% conservative risk
        75,      // $75 target trade size
        {}
      );

      // Conservative should have lower minimum than moderate
      expect(result.calculations.minimumViableAccount).toBeLessThan(15000);
      expect(result.calculations.minimumViableAccount).toBeGreaterThanOrEqual(3000);
    });

    test('should validate aggressive risk profile with higher minimums', () => {
      const result = AccountValidationEngine.validateAccountForGoals(
        10000,   // $10k account balance
        2.5,     // 2.5% aggressive risk
        75,      // $75 target trade size
        {}
      );

      // Aggressive should have higher minimum
      expect(result.calculations.minimumViableAccount).toBeGreaterThanOrEqual(10000);
      expect(result.calculations.minimumViableAccount).toBeLessThan(30000);
    });
  });
}); 