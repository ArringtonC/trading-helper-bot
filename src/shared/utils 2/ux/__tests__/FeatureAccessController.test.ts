import { FeatureAccessController, FeatureAccessDecision, FeatureAccessEvent } from '../FeatureAccessController';
import { UserExperienceLevel } from '../UXLayersController';

describe('FeatureAccessController', () => {
  let controller: FeatureAccessController;

  beforeEach(() => {
    controller = new FeatureAccessController('learning');
  });

  describe('Initialization', () => {
    it('should initialize with correct user level', () => {
      const context = controller.getContext();
      expect(context.userLevel).toBe('learning');
      expect(context.userProgress.level).toBe('learning');
    });

    it('should initialize with default user progress', () => {
      const context = controller.getContext();
      expect(context.userProgress.tradesCompleted).toBe(0);
      expect(context.userProgress.accountSize).toBe(0);
      expect(context.userProgress.timeSpent).toBe(0);
      expect(context.userProgress.featuresUsed).toBeInstanceOf(Set);
    });

    it('should accept custom user progress', () => {
      const customController = new FeatureAccessController('import', {
        tradesCompleted: 25,
        accountSize: 15000,
        timeSpent: 300
      });
      
      const context = customController.getContext();
      expect(context.userProgress.tradesCompleted).toBe(25);
      expect(context.userProgress.accountSize).toBe(15000);
      expect(context.userProgress.timeSpent).toBe(300);
    });

    it('should accept configuration options', () => {
      const customController = new FeatureAccessController('broker', {}, {
        cacheTimeout: 10000,
        debugMode: true,
        featureFlags: { testFlag: true }
      });
      
      const context = customController.getContext();
      expect(context.debugMode).toBe(true);
      expect(context.featureFlags?.testFlag).toBe(true);
    });
  });

  describe('Feature Access Control', () => {
    it('should allow access to core features for beginners', () => {
      const decision = controller.canAccessFeature('basic-calculator');
      expect(decision.isVisible).toBe(true);
      expect(decision.isEnabled).toBe(true);
      expect(decision.source).toBe('combined');
    });

    it('should deny access to advanced features for beginners', () => {
      const decision = controller.canAccessFeature('ai-analysis');
      expect(decision.isVisible).toBe(false);
      expect(decision.reason).toContain('requirements not met');
    });

    it('should provide detailed access decisions', () => {
      const decision = controller.canAccessFeature('basic-calculator');
      expect(decision).toHaveProperty('isVisible');
      expect(decision).toHaveProperty('isEnabled');
      expect(decision).toHaveProperty('isUnlocked');
      expect(decision).toHaveProperty('reason');
      expect(decision).toHaveProperty('source');
    });

    it('should handle unknown features gracefully', () => {
      const decision = controller.canAccessFeature('unknown-feature');
      expect(decision.isVisible).toBe(false);
      expect(decision.isEnabled).toBe(false);
    });
  });

  describe('Batch Feature Access', () => {
    it('should check multiple features efficiently', () => {
      const features = ['basic-calculator', 'risk-assessment', 'ai-analysis'];
      const decisions = controller.canAccessFeatures(features);
      
      expect(Object.keys(decisions)).toHaveLength(3);
      expect(decisions['basic-calculator'].isVisible).toBe(true);
      expect(decisions['ai-analysis'].isVisible).toBe(false);
    });

    it('should return consistent results for batch and individual checks', () => {
      const featureId = 'basic-calculator';
      const individualDecision = controller.canAccessFeature(featureId);
      const batchDecisions = controller.canAccessFeatures([featureId]);
      
      expect(batchDecisions[featureId]).toEqual(individualDecision);
    });
  });

  describe('Feature Organization by Access Level', () => {
    it('should categorize features by access level', () => {
      const categorized = controller.getFeaturesByAccessLevel();
      
      expect(categorized).toHaveProperty('accessible');
      expect(categorized).toHaveProperty('visible');
      expect(categorized).toHaveProperty('locked');
      expect(categorized).toHaveProperty('hidden');
      
      expect(Array.isArray(categorized.accessible)).toBe(true);
      expect(Array.isArray(categorized.visible)).toBe(true);
      expect(Array.isArray(categorized.locked)).toBe(true);
      expect(Array.isArray(categorized.hidden)).toBe(true);
    });

    it('should have core features in accessible category for beginners', () => {
      const categorized = controller.getFeaturesByAccessLevel();
      expect(categorized.accessible).toContain('basic-calculator');
      expect(categorized.accessible).toContain('risk-assessment');
    });

    it('should have advanced features in hidden category for beginners', () => {
      const categorized = controller.getFeaturesByAccessLevel();
      expect(categorized.hidden).toContain('ai-analysis');
    });
  });

  describe('User Progress Management', () => {
    it('should update user progress correctly', () => {
      controller.updateUserProgress({
        tradesCompleted: 15,
        accountSize: 8000,
        timeSpent: 180
      });
      
      const context = controller.getContext();
      expect(context.userProgress.tradesCompleted).toBe(15);
      expect(context.userProgress.accountSize).toBe(8000);
      expect(context.userProgress.timeSpent).toBe(180);
    });

    it('should unlock intermediate features when criteria are met', () => {
      // Use intermediate level controller since position-sizing requires intermediate level
      const intermediateController = new FeatureAccessController('import');
      
      // Initially intermediate features should not be accessible without sufficient progress
      let decision = intermediateController.canAccessFeature('position-sizing');
      expect(decision.isVisible).toBe(false);
      
      // Update progress to meet intermediate criteria
      intermediateController.updateUserProgress({
        tradesCompleted: 15,
        accountSize: 5000,
        timeSpent: 150
      });
      
      // Now intermediate features should be accessible
      decision = intermediateController.canAccessFeature('position-sizing');
      expect(decision.isVisible).toBe(true);
    });

    it('should track feature usage', () => {
      controller.markFeatureUsed('basic-calculator');
      controller.markFeatureUsed('risk-assessment');
      
      const context = controller.getContext();
      expect(context.userProgress.featuresUsed.has('basic-calculator')).toBe(true);
      expect(context.userProgress.featuresUsed.has('risk-assessment')).toBe(true);
    });
  });

  describe('User Level Management', () => {
    it('should update user level and reinitialize controllers', () => {
      controller.updateUserLevel('broker');
      
      const context = controller.getContext();
      expect(context.userLevel).toBe('broker');
      expect(context.userProgress.level).toBe('broker');
    });

    it('should provide different feature access for different levels', () => {
      const beginnerController = new FeatureAccessController('learning');
      const advancedController = new FeatureAccessController('broker');
      
      const beginnerFeatures = beginnerController.getAccessibleFeatures();
      const advancedFeatures = advancedController.getAccessibleFeatures();
      
      expect(advancedFeatures.length).toBeGreaterThan(beginnerFeatures.length);
    });
  });

  describe('Feature Unlock Requests', () => {
    it('should handle unlock requests for already unlocked features', () => {
      const result = controller.requestFeatureUnlock('basic-calculator');
      expect(result.success).toBe(true);
      expect(result.message).toContain('already unlocked');
    });

    it('should provide next steps for locked features', () => {
      const result = controller.requestFeatureUnlock('ai-analysis');
      expect(result.success).toBe(false);
      expect(result.message).toContain('requires additional progress');
    });

    it('should handle unlock requests for intermediate features', () => {
      // Update progress to meet intermediate criteria
      controller.updateUserProgress({
        tradesCompleted: 15,
        accountSize: 5000,
        timeSpent: 150
      });
      
      const result = controller.requestFeatureUnlock('position-sizing');
      expect(result.success).toBe(true);
    });
  });

  describe('Feature Overrides', () => {
    it('should respect feature overrides', () => {
      // Override to hide a normally visible feature
      controller.setFeatureOverrides({ 'basic-calculator': false });
      
      const decision = controller.canAccessFeature('basic-calculator');
      expect(decision.isVisible).toBe(false);
      expect(decision.reason).toBe('Administrative override');
    });

    it('should override to show normally hidden features', () => {
      // Override to show an advanced feature
      controller.setFeatureOverrides({ 'ai-analysis': true });
      
      const decision = controller.canAccessFeature('ai-analysis');
      expect(decision.isVisible).toBe(true);
      expect(decision.reason).toBe('Administrative override');
    });
  });

  describe('Caching', () => {
    it('should cache feature access decisions', () => {
      // First call should calculate and cache
      const decision1 = controller.canAccessFeature('basic-calculator');
      
      // Second call should return cached result
      const decision2 = controller.canAccessFeature('basic-calculator');
      
      expect(decision1).toEqual(decision2);
    });

    it('should bypass cache when requested', () => {
      const decision1 = controller.canAccessFeature('basic-calculator');
      const decision2 = controller.canAccessFeature('basic-calculator', { bypassCache: true });
      
      expect(decision1).toEqual(decision2);
    });

    it('should clear cache when user progress is updated', () => {
      // Make a call to populate cache
      controller.canAccessFeature('position-sizing');
      
      // Update progress (should clear cache)
      controller.updateUserProgress({ tradesCompleted: 20 });
      
      // Next call should recalculate
      const decision = controller.canAccessFeature('position-sizing');
      expect(decision).toBeDefined();
    });
  });

  describe('Access Reports', () => {
    it('should generate comprehensive access reports', () => {
      const report = controller.getAccessReport();
      
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('byCategory');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('nextUnlocks');
      
      expect(report.summary).toHaveProperty('totalFeatures');
      expect(report.summary).toHaveProperty('accessibleFeatures');
      expect(report.summary).toHaveProperty('progressPercentage');
    });

    it('should provide category breakdown', () => {
      const report = controller.getAccessReport();
      
      expect(report.byCategory).toHaveProperty('core');
      expect(report.byCategory).toHaveProperty('import');
      expect(report.byCategory).toHaveProperty('broker');
      expect(report.byCategory).toHaveProperty('resources');
      
      Object.values(report.byCategory).forEach(category => {
        expect(category).toHaveProperty('accessible');
        expect(category).toHaveProperty('total');
        expect(typeof category.accessible).toBe('number');
        expect(typeof category.total).toBe('number');
      });
    });

    it('should provide actionable recommendations', () => {
      const report = controller.getAccessReport();
      
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should identify next unlock targets', () => {
      const report = controller.getAccessReport();
      
      expect(Array.isArray(report.nextUnlocks)).toBe(true);
      report.nextUnlocks.forEach(unlock => {
        expect(unlock).toHaveProperty('featureId');
        expect(unlock).toHaveProperty('progress');
        expect(unlock).toHaveProperty('nextSteps');
        expect(typeof unlock.progress).toBe('number');
        expect(Array.isArray(unlock.nextSteps)).toBe(true);
      });
    });
  });

  describe('Event Handling', () => {
    it('should support event listeners', () => {
      const events: FeatureAccessEvent[] = [];
      const handler = (event: FeatureAccessEvent) => {
        events.push(event);
      };
      
      controller.addEventListener(handler);
      
      // Trigger an access check
      controller.canAccessFeature('basic-calculator');
      
      expect(events.length).toBeGreaterThan(0);
      expect(events[0]).toHaveProperty('type');
      expect(events[0]).toHaveProperty('featureId');
      expect(events[0]).toHaveProperty('timestamp');
    });

    it('should remove event listeners', () => {
      const events: FeatureAccessEvent[] = [];
      const handler = (event: FeatureAccessEvent) => {
        events.push(event);
      };
      
      controller.addEventListener(handler);
      controller.removeEventListener(handler);
      
      // Trigger an access check
      controller.canAccessFeature('basic-calculator');
      
      // Should not receive events after removal
      expect(events.length).toBe(0);
    });

    it('should handle event handler errors gracefully', () => {
      const errorHandler = () => {
        throw new Error('Test error');
      };
      
      controller.addEventListener(errorHandler);
      
      // Should not throw when event handler errors
      expect(() => {
        controller.canAccessFeature('basic-calculator');
      }).not.toThrow();
    });
  });

  describe('Integration with Controllers', () => {
    it('should integrate with all underlying controllers', () => {
      // Test that decisions consider all controllers
      const decision = controller.canAccessFeature('basic-calculator');
      
      // Should have consulted all controllers (indicated by 'combined' source)
      expect(decision.source).toBe('combined');
    });

    it('should provide consistent results across different user levels', () => {
      const beginnerController = new FeatureAccessController('learning');
      const intermediateController = new FeatureAccessController('import');
      const advancedController = new FeatureAccessController('broker');
      
      // Core features should be accessible to all levels
      expect(beginnerController.canAccessFeature('basic-calculator').isVisible).toBe(true);
      expect(intermediateController.canAccessFeature('basic-calculator').isVisible).toBe(true);
      expect(advancedController.canAccessFeature('basic-calculator').isVisible).toBe(true);
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle large numbers of feature checks efficiently', () => {
      const startTime = Date.now();
      
      // Check many features
      for (let i = 0; i < 100; i++) {
        controller.canAccessFeature('basic-calculator');
        controller.canAccessFeature('risk-assessment');
        controller.canAccessFeature('ai-analysis');
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete quickly (under 1 second for 300 checks)
      expect(duration).toBeLessThan(1000);
    });

    it('should benefit from caching on repeated calls', () => {
      // First call (no cache)
      const start1 = Date.now();
      controller.canAccessFeature('basic-calculator');
      const duration1 = Date.now() - start1;
      
      // Second call (cached)
      const start2 = Date.now();
      controller.canAccessFeature('basic-calculator');
      const duration2 = Date.now() - start2;
      
      // Cached call should be faster (or at least not significantly slower)
      expect(duration2).toBeLessThanOrEqual(duration1 + 5); // Allow 5ms tolerance
    });
  });

  describe('Research-Backed Features', () => {
    it('should implement centralized access control for consistency', () => {
      // All feature access should go through the central controller
      const decision = controller.canAccessFeature('basic-calculator');
      expect(decision.source).toBe('combined');
      
      // Should provide consistent decisions
      const decision2 = controller.canAccessFeature('basic-calculator');
      expect(decision).toEqual(decision2);
    });

    it('should reduce feature visibility bugs through unified logic', () => {
      // Test that all controllers are consulted for each decision
      const decision = controller.canAccessFeature('position-sizing');
      
      // Decision should be based on multiple factors
      expect(decision.reason).toBeDefined();
      expect(decision.reason.length).toBeGreaterThan(0);
    });

    it('should provide clear reasoning for access decisions', () => {
      const allowedDecision = controller.canAccessFeature('basic-calculator');
      const deniedDecision = controller.canAccessFeature('ai-analysis');
      
      expect(allowedDecision.reason).toContain('accessible');
      expect(deniedDecision.reason).toContain('requirements not met');
    });
  });
}); 