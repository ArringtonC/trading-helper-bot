import { FeatureOrganizationController, FEATURE_ORGANIZATION } from '../FeatureOrganizationController';
import { UserExperienceLevel } from '../UXLayersController';

describe('FeatureOrganizationController', () => {
  let controller: FeatureOrganizationController;

  beforeEach(() => {
    controller = new FeatureOrganizationController('beginner');
  });

  describe('FEATURE_ORGANIZATION Configuration', () => {
    it('should have correct tier structure', () => {
      expect(FEATURE_ORGANIZATION.core.alwaysVisible).toBe(true);
      expect(FEATURE_ORGANIZATION.core.requiresUnlock).toBe(false);
      expect(FEATURE_ORGANIZATION.core.location).toBe('primary-navigation');
      
      expect(FEATURE_ORGANIZATION.intermediate.requiresUnlock).toBe(true);
      expect(FEATURE_ORGANIZATION.intermediate.unlockCriteria).toBeDefined();
      
      expect(FEATURE_ORGANIZATION.advanced.requiresUnlock).toBe(true);
      expect(FEATURE_ORGANIZATION.advanced.unlockCriteria).toBeDefined();
      
      expect(FEATURE_ORGANIZATION.resources.alwaysVisible).toBe(true);
      expect(FEATURE_ORGANIZATION.resources.location).toBe('secondary-navigation');
    });

    it('should include essential core features', () => {
      const coreFeatures = FEATURE_ORGANIZATION.core.features;
      expect(coreFeatures).toContain('basic-calculator');
      expect(coreFeatures).toContain('risk-assessment');
      expect(coreFeatures).toContain('account-validation');
      expect(coreFeatures).toContain('basic-dashboard');
    });

    it('should have progressive unlock criteria', () => {
      const intermediateCriteria = FEATURE_ORGANIZATION.intermediate.unlockCriteria!;
      expect(intermediateCriteria.tradesCompleted).toBe(10);
      expect(intermediateCriteria.timeSpent).toBe(120);
      expect(intermediateCriteria.riskAssessmentCompleted).toBe(true);
      
      const advancedCriteria = FEATURE_ORGANIZATION.advanced.unlockCriteria!;
      expect(advancedCriteria.tradesCompleted).toBe(50);
      expect(advancedCriteria.accountSize).toBe(10000);
      expect(advancedCriteria.winRate).toBe(0.4);
    });
  });

  describe('Feature Access Control', () => {
    it('should provide core and resources features to new users', () => {
      const accessibleFeatures = controller.getAccessibleFeatures();
      
      // Should include all core features
      FEATURE_ORGANIZATION.core.features.forEach(feature => {
        expect(accessibleFeatures).toContain(feature);
      });
      
      // Should include all resource features
      FEATURE_ORGANIZATION.resources.features.forEach(feature => {
        expect(accessibleFeatures).toContain(feature);
      });
      
      // Should not include intermediate features for new users
      FEATURE_ORGANIZATION.intermediate.features.forEach(feature => {
        expect(accessibleFeatures).not.toContain(feature);
      });
    });

    it('should unlock intermediate features when criteria are met', () => {
      // Update user progress to meet intermediate criteria
      controller.updateUserProgress({
        tradesCompleted: 15,
        timeSpent: 150,
        accountSize: 5000
      });
      
      const accessibleFeatures = controller.getAccessibleFeatures();
      
      // Should now include intermediate features
      FEATURE_ORGANIZATION.intermediate.features.forEach(feature => {
        expect(accessibleFeatures).toContain(feature);
      });
    });

    it('should unlock advanced features when criteria are met', () => {
      // Update user progress to meet advanced criteria
      controller.updateUserProgress({
        tradesCompleted: 60,
        timeSpent: 700,
        accountSize: 15000,
        featuresUsed: new Set(['strategy-builder', 'performance-tracking', 'interactive-analytics'])
      });
      
      const accessibleFeatures = controller.getAccessibleFeatures();
      
      // Should include advanced features
      FEATURE_ORGANIZATION.advanced.features.forEach(feature => {
        expect(accessibleFeatures).toContain(feature);
      });
    });
  });

  describe('Unlock Criteria Validation', () => {
    it('should correctly evaluate intermediate unlock criteria', () => {
      // Test with insufficient criteria
      expect(controller.meetsUnlockCriteria('intermediate')).toBe(false);
      
      // Test with partial criteria
      controller.updateUserProgress({
        tradesCompleted: 15,
        timeSpent: 50 // Not enough time
      });
      expect(controller.meetsUnlockCriteria('intermediate')).toBe(false);
      
      // Test with all criteria met
      controller.updateUserProgress({
        tradesCompleted: 15,
        timeSpent: 150,
        accountSize: 5000
      });
      expect(controller.meetsUnlockCriteria('intermediate')).toBe(true);
    });

    it('should correctly evaluate advanced unlock criteria', () => {
      // Test with insufficient criteria
      expect(controller.meetsUnlockCriteria('advanced')).toBe(false);
      
      // Test with all criteria met
      controller.updateUserProgress({
        tradesCompleted: 60,
        timeSpent: 700,
        accountSize: 15000,
        featuresUsed: new Set(['strategy-builder', 'performance-tracking', 'interactive-analytics'])
      });
      expect(controller.meetsUnlockCriteria('advanced')).toBe(true);
    });
  });

  describe('Unlock Status Tracking', () => {
    it('should provide detailed unlock status for intermediate tier', () => {
      const status = controller.getUnlockStatus('intermediate');
      
      expect(status.isUnlocked).toBe(false);
      expect(status.progress).toBe(0);
      expect(status.missingCriteria.length).toBeGreaterThan(0);
      expect(status.nextSteps.length).toBeGreaterThan(0);
    });

    it('should calculate progress percentage correctly', () => {
      // Meet some criteria
      controller.updateUserProgress({
        tradesCompleted: 15, // Meets trades requirement
        timeSpent: 50 // Doesn't meet time requirement
      });
      
      const status = controller.getUnlockStatus('intermediate');
      expect(status.progress).toBeGreaterThan(0);
      expect(status.progress).toBeLessThan(100);
    });

    it('should show 100% progress when all criteria are met', () => {
      controller.updateUserProgress({
        tradesCompleted: 15,
        timeSpent: 150,
        accountSize: 5000
      });
      
      const status = controller.getUnlockStatus('intermediate');
      expect(status.isUnlocked).toBe(true);
      expect(status.progress).toBe(100);
      expect(status.missingCriteria).toHaveLength(0);
    });
  });

  describe('Feature Organization by Location', () => {
    it('should organize features by navigation location', () => {
      const primaryFeatures = controller.getFeaturesByLocation('primary-navigation');
      const secondaryFeatures = controller.getFeaturesByLocation('secondary-navigation');
      const advancedFeatures = controller.getFeaturesByLocation('advanced-menu');
      
      // Core features should be in primary navigation
      expect(primaryFeatures).toContain('basic-calculator');
      expect(primaryFeatures).toContain('risk-assessment');
      
      // Resources should be in secondary navigation
      expect(secondaryFeatures).toContain('education');
      expect(secondaryFeatures).toContain('tutorials');
      
      // Advanced features should not be accessible for beginners
      expect(advancedFeatures).toHaveLength(0);
    });

    it('should include intermediate features in primary navigation when unlocked', () => {
      controller.updateUserProgress({
        tradesCompleted: 15,
        timeSpent: 150,
        accountSize: 5000
      });
      
      const primaryFeatures = controller.getFeaturesByLocation('primary-navigation');
      expect(primaryFeatures).toContain('position-sizing');
      expect(primaryFeatures).toContain('goal-sizing');
    });
  });

  describe('Progress Summary and Recommendations', () => {
    it('should provide comprehensive progress summary', () => {
      const summary = controller.getProgressSummary();
      
      expect(summary.tierProgress.core.isUnlocked).toBe(true);
      expect(summary.tierProgress.intermediate.isUnlocked).toBe(false);
      expect(summary.tierProgress.advanced.isUnlocked).toBe(false);
      expect(summary.tierProgress.resources.isUnlocked).toBe(true);
      
      expect(summary.nextUnlockTargets).toContain('intermediate tier');
    });

    it('should provide actionable recommendations', () => {
      const actions = controller.getRecommendedActions();
      
      expect(actions.length).toBeGreaterThan(0);
      expect(actions.some(action => action.includes('trades'))).toBe(true);
    });

    it('should update recommendations as user progresses', () => {
      // Get initial recommendations
      const initialActions = controller.getRecommendedActions();
      
      // Progress to intermediate level
      controller.updateUserProgress({
        tradesCompleted: 15,
        timeSpent: 150,
        accountSize: 5000
      });
      
      const updatedActions = controller.getRecommendedActions();
      
      // Recommendations should change
      expect(updatedActions).not.toEqual(initialActions);
    });
  });

  describe('Feature Tier Identification', () => {
    it('should correctly identify feature tiers', () => {
      expect(controller.getFeatureTier('basic-calculator')).toBe('core');
      expect(controller.getFeatureTier('position-sizing')).toBe('intermediate');
      expect(controller.getFeatureTier('ai-analysis')).toBe('advanced');
      expect(controller.getFeatureTier('education')).toBe('resources');
      expect(controller.getFeatureTier('non-existent-feature')).toBeNull();
    });
  });

  describe('Feature Visibility Integration', () => {
    it('should integrate with shouldShowFeature method', () => {
      // Core features should be visible
      expect(controller.shouldShowFeature('basic-calculator')).toBe(true);
      expect(controller.shouldShowFeature('risk-assessment')).toBe(true);
      
      // Intermediate features should not be visible initially
      expect(controller.shouldShowFeature('position-sizing')).toBe(false);
      expect(controller.shouldShowFeature('goal-sizing')).toBe(false);
      
      // Advanced features should not be visible
      expect(controller.shouldShowFeature('ai-analysis')).toBe(false);
    });

    it('should update feature visibility when progress changes', () => {
      // Initially intermediate features are not visible
      expect(controller.shouldShowFeature('position-sizing')).toBe(false);
      
      // Unlock intermediate features
      controller.updateUserProgress({
        tradesCompleted: 15,
        timeSpent: 150,
        accountSize: 5000
      });
      
      // Now intermediate features should be visible
      expect(controller.shouldShowFeature('position-sizing')).toBe(true);
    });
  });

  describe('Feature Usage Tracking', () => {
    it('should track feature usage', () => {
      controller.markFeatureUsed('basic-calculator');
      controller.markFeatureUsed('risk-assessment');
      
      const summary = controller.getProgressSummary();
      expect(summary.featuresUsed).toBe(2);
    });

    it('should use feature usage for unlock criteria', () => {
      // Mark required features as used for advanced tier
      controller.markFeatureUsed('strategy-builder');
      controller.markFeatureUsed('performance-tracking');
      controller.markFeatureUsed('interactive-analytics');
      
      // Update other criteria
      controller.updateUserProgress({
        tradesCompleted: 60,
        timeSpent: 700,
        accountSize: 15000
      });
      
      expect(controller.meetsUnlockCriteria('advanced')).toBe(true);
    });
  });

  describe('Research-Backed Progressive Disclosure', () => {
    it('should implement progressive disclosure that reduces cognitive load', () => {
      // New users should see limited features (cognitive load reduction)
      const beginnerFeatures = controller.getAccessibleFeatures();
      expect(beginnerFeatures.length).toBeLessThan(20); // Reasonable limit
      
      // Core features should always be accessible
      expect(beginnerFeatures).toContain('basic-calculator');
      expect(beginnerFeatures).toContain('risk-assessment');
      
      // Advanced features should be hidden
      expect(beginnerFeatures).not.toContain('ai-analysis');
      expect(beginnerFeatures).not.toContain('api-integration');
    });

    it('should provide clear unlock criteria for task completion improvement', () => {
      const intermediateStatus = controller.getUnlockStatus('intermediate');
      const advancedStatus = controller.getUnlockStatus('advanced');
      
      // Unlock messages should be clear and actionable
      expect(intermediateStatus.nextSteps.length).toBeGreaterThan(0);
      expect(advancedStatus.nextSteps.length).toBeGreaterThan(0);
      
      // Messages should be specific
      intermediateStatus.nextSteps.forEach(step => {
        expect(step.length).toBeGreaterThan(10);
        expect(step).toMatch(/\d+/); // Should contain numbers for specific targets
      });
    });

    it('should ensure logical feature progression', () => {
      // Core features should be immediately available
      const organizedFeatures = controller.getOrganizedFeatures();
      expect(organizedFeatures.core.unlockStatus.isUnlocked).toBe(true);
      
      // Intermediate features should require progression
      expect(organizedFeatures.intermediate.unlockStatus.isUnlocked).toBe(false);
      expect(organizedFeatures.intermediate.unlockStatus.progress).toBe(0);
      
      // Advanced features should require significant progression
      expect(organizedFeatures.advanced.unlockStatus.isUnlocked).toBe(false);
      expect(organizedFeatures.advanced.unlockCriteria?.tradesCompleted).toBeGreaterThan(
        organizedFeatures.intermediate.unlockCriteria?.tradesCompleted || 0
      );
    });
  });

  describe('Integration with User Experience Levels', () => {
    it('should work with different user experience levels', () => {
      const beginnerController = new FeatureOrganizationController('beginner');
      const intermediateController = new FeatureOrganizationController('intermediate');
      const advancedController = new FeatureOrganizationController('advanced');
      
      // All should have access to core features
      expect(beginnerController.shouldShowFeature('basic-calculator')).toBe(true);
      expect(intermediateController.shouldShowFeature('basic-calculator')).toBe(true);
      expect(advancedController.shouldShowFeature('basic-calculator')).toBe(true);
      
      // Feature access should be consistent with tier system
      expect(beginnerController.shouldShowFeature('ai-analysis')).toBe(false);
      expect(intermediateController.shouldShowFeature('ai-analysis')).toBe(false);
      expect(advancedController.shouldShowFeature('ai-analysis')).toBe(false); // Still needs unlock criteria
    });
  });
}); 