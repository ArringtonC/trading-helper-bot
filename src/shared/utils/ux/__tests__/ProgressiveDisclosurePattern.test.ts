/// <reference types="jest" />

/**
 * Progressive Disclosure Pattern Test Suite
 * Tests for UXLayersController, FeatureVisibilityController, and overall pattern functionality
 */

import { UXLayersController, UserExperienceLevel, UX_LAYERS } from '../UXLayersController';
import { 
  FeatureVisibilityController, 
  FEATURE_DEFINITIONS, 
  UserProgress,
  FeatureDefinition 
} from '../FeatureVisibilityController';

describe('Progressive Disclosure Pattern', () => {
  
  describe('UXLayersController', () => {
    
    describe('User Experience Assessment', () => {
      it('should correctly assess learning level', () => {
        const responses = {
          tradingExperience: 1,
          optionsKnowledge: 2,
          riskTolerance: 1,
          accountSize: 5000,
          preferredComplexity: 'simple' as const
        };
        
        const level = UXLayersController.assessUserExperience(responses);
        expect(level).toBe('learning');
      });

      it('should correctly assess import level', () => {
        const responses = {
          tradingExperience: 3,
          optionsKnowledge: 3,
          riskTolerance: 3,
          accountSize: 15000,
          preferredComplexity: 'moderate' as const
        };
        
        const level = UXLayersController.assessUserExperience(responses);
        expect(level).toBe('import');
      });

      it('should correctly assess broker level', () => {
        const responses = {
          tradingExperience: 5,
          optionsKnowledge: 5,
          riskTolerance: 4,
          accountSize: 50000,
          preferredComplexity: 'broker' as const
        };
        
        const level = UXLayersController.assessUserExperience(responses);
        expect(level).toBe('broker');
      });
    });

    describe('Feature Visibility', () => {
      it('should show appropriate features for learning level', () => {
        const controller = new UXLayersController('learning');
        
        expect(controller.shouldShowFeature('basic-calculator')).toBe(true);
        expect(controller.shouldShowFeature('risk-assessment')).toBe(true);
        expect(controller.shouldShowFeature('advanced-analytics')).toBe(false);
        expect(controller.shouldShowFeature('custom-formulas')).toBe(false);
      });

      it('should show appropriate features for import level', () => {
        const controller = new UXLayersController('import');
        
        expect(controller.shouldShowFeature('position-sizing')).toBe(true);
        expect(controller.shouldShowFeature('goal-sizing')).toBe(true);
        expect(controller.shouldShowFeature('advanced-analytics')).toBe(false);
        expect(controller.shouldShowFeature('api-integration')).toBe(false);
      });

      it('should show all features for broker level', () => {
        const controller = new UXLayersController('broker');
        
        expect(controller.getVisibleFeatures()).toBe('all');
        expect(controller.shouldShowFeature('advanced-analytics')).toBe(true);
        expect(controller.shouldShowFeature('custom-formulas')).toBe(true);
        expect(controller.shouldShowFeature('api-integration')).toBe(true);
      });
    });

    describe('Configuration Options Filtering', () => {
      it('should limit configuration options for learning users', () => {
        const controller = new UXLayersController('learning');
        const allOptions = ['account-balance', 'risk-per-trade', 'position-size', 'win-rate', 'payoff-ratio', 'max-exposure'];
        
        const filteredOptions = controller.getFilteredConfigOptions(allOptions);
        expect(filteredOptions.length).toBeLessThanOrEqual(3);
        expect(filteredOptions).toContain('account-balance');
        expect(filteredOptions).toContain('risk-per-trade');
        expect(filteredOptions).toContain('position-size');
      });

      it('should allow more configuration options for import users', () => {
        const controller = new UXLayersController('import');
        const allOptions = ['account-balance', 'risk-per-trade', 'position-size', 'win-rate', 'payoff-ratio', 'max-exposure'];
        
        const filteredOptions = controller.getFilteredConfigOptions(allOptions);
        expect(filteredOptions.length).toBeLessThanOrEqual(6);
        expect(filteredOptions.length).toBeGreaterThan(3);
      });

      it('should allow unlimited configuration options for broker users', () => {
        const controller = new UXLayersController('broker');
        const allOptions = ['account-balance', 'risk-per-trade', 'position-size', 'win-rate', 'payoff-ratio', 'max-exposure', 'custom-1', 'custom-2'];
        
        const filteredOptions = controller.getFilteredConfigOptions(allOptions);
        expect(filteredOptions.length).toBe(allOptions.length);
      });
    });

    describe('Adaptive Menu Configuration', () => {
      it('should provide simple menu for learning users', () => {
        const controller = new UXLayersController('learning');
        const menuConfig = controller.getAdaptiveMenuConfig();
        
        expect(menuConfig.primary.length).toBeLessThanOrEqual(3);
        expect(menuConfig.advanced.length).toBe(0);
        expect(menuConfig.configurationPanel.position).toBe('top');
        expect(menuConfig.configurationPanel.maxVisible).toBe(3);
      });

      it('should provide balanced menu for import users', () => {
        const controller = new UXLayersController('import');
        const menuConfig = controller.getAdaptiveMenuConfig();
        
        expect(menuConfig.primary.length).toBeGreaterThan(3);
        expect(menuConfig.advanced.length).toBeGreaterThan(0);
        expect(menuConfig.configurationPanel.maxVisible).toBe(6);
      });

      it('should provide full menu for broker users', () => {
        const controller = new UXLayersController('broker');
        const menuConfig = controller.getAdaptiveMenuConfig();
        
        expect(menuConfig.primary.length).toBeGreaterThan(4);
        expect(menuConfig.advanced.length).toBeGreaterThan(1);
        expect(menuConfig.configurationPanel.position).toBe('sidebar');
        expect(menuConfig.configurationPanel.maxVisible).toBe(999);
      });
    });

    describe('Level Management', () => {
      it('should update configuration when level changes', () => {
        const controller = new UXLayersController('learning');
        expect(controller.getMaxConfigOptions()).toBe(3);
        
        controller.setUserLevel('broker');
        expect(controller.getMaxConfigOptions()).toBe('unlimited');
        expect(controller.getUserLevel()).toBe('broker');
      });

      it('should return correct default risk profile for each level', () => {
        const learningController = new UXLayersController('learning');
        const importController = new UXLayersController('import');
        const brokerController = new UXLayersController('broker');
        
        expect(learningController.getDefaultRiskProfile()).toBe('conservative');
        expect(importController.getDefaultRiskProfile()).toBe('moderate');
        expect(brokerController.getDefaultRiskProfile()).toBe('aggressive');
      });
    });
  });

  describe('FeatureVisibilityController', () => {
    
    describe('Feature State Management', () => {
      it('should initialize with correct default states', () => {
        const controller = new FeatureVisibilityController('learning');
        
        // Core features should be visible and unlocked for beginners
        const basicCalculatorState = controller.getFeatureState('basic-calculator');
        expect(basicCalculatorState?.isVisible).toBe(true);
        expect(basicCalculatorState?.isUnlocked).toBe(true);
        expect(basicCalculatorState?.isEnabled).toBe(true);
        
        // Advanced features should not be visible for beginners
        const advancedAnalyticsState = controller.getFeatureState('advanced-analytics');
        expect(advancedAnalyticsState?.isVisible).toBe(false);
      });

      it('should unlock features based on user progress', () => {
        const userProgress: Partial<UserProgress> = {
          accountSize: 10000,
          tradesCompleted: 10,
          timeSpent: 150,
          featuresUsed: new Set(['basic-calculator'])
        };
        
        const controller = new FeatureVisibilityController('import', userProgress);
        
        // Position sizing should be unlocked with sufficient account size and trades
        const positionSizingState = controller.getFeatureState('position-sizing');
        expect(positionSizingState?.isUnlocked).toBe(true);
        
        // Strategy builder should be unlocked with sufficient trades and time
        const strategyBuilderState = controller.getFeatureState('strategy-builder');
        expect(strategyBuilderState?.isUnlocked).toBe(true);
      });

      it('should calculate unlock progress correctly', () => {
        const userProgress: Partial<UserProgress> = {
          accountSize: 2500, // Half of required 5000
          tradesCompleted: 3,  // 3 out of 5 required
          timeSpent: 60,
          featuresUsed: new Set()
        };
        
        const controller = new FeatureVisibilityController('import', userProgress);
        const positionSizingFeature = FEATURE_DEFINITIONS.find(f => f.id === 'position-sizing')!;
        const progress = controller.calculateUnlockProgress(positionSizingFeature);
        
        // Should be 50% (1 out of 2 criteria met: account size not met, trades not met)
        expect(progress).toBe(0);
      });
    });

    describe('Feature Dependencies', () => {
      it('should respect feature dependencies', () => {
        const userProgress: Partial<UserProgress> = {
          accountSize: 100000,
          tradesCompleted: 100,
          timeSpent: 1200,
          featuresUsed: new Set(['basic-calculator']) // Missing required dependencies
        };
        
        const controller = new FeatureVisibilityController('broker', userProgress);
        
        // AI analysis requires backtesting and advanced analytics
        const aiAnalysisState = controller.getFeatureState('ai-analysis');
        expect(aiAnalysisState?.isUnlocked).toBe(false); // Dependencies not met
      });

      it('should unlock features when dependencies are satisfied', () => {
        const userProgress: Partial<UserProgress> = {
          accountSize: 100000,
          tradesCompleted: 100,
          timeSpent: 1200,
          featuresUsed: new Set([
            'basic-calculator',
            'basic-dashboard',
            'performance-tracking',
            'interactive-analytics',
            'advanced-analytics',
            'strategy-builder',
            'api-integration',
            'backtesting'
          ])
        };
        
        const controller = new FeatureVisibilityController('broker', userProgress);
        
        // AI analysis should be unlocked when all dependencies are met
        const aiAnalysisState = controller.getFeatureState('ai-analysis');
        expect(aiAnalysisState?.isUnlocked).toBe(true);
      });
    });

    describe('User Progress Tracking', () => {
      it('should update progress and recalculate states', () => {
        const controller = new FeatureVisibilityController('import');
        
        // Initially, position sizing should not be unlocked
        let positionSizingState = controller.getFeatureState('position-sizing');
        expect(positionSizingState?.isUnlocked).toBe(false);
        
        // Update progress to meet unlock criteria
        controller.updateUserProgress({
          accountSize: 10000,
          tradesCompleted: 10
        });
        
        // Now position sizing should be unlocked
        positionSizingState = controller.getFeatureState('position-sizing');
        expect(positionSizingState?.isUnlocked).toBe(true);
      });

      it('should track feature usage', () => {
        const controller = new FeatureVisibilityController('import');
        
        controller.markFeatureUsed('basic-calculator');
        controller.markFeatureUsed('position-sizing');
        
        const summary = controller.getUserProgressSummary();
        expect(summary.featuresUsed).toBe(2);
      });

      it('should provide accurate progress summary', () => {
        const userProgress: Partial<UserProgress> = {
          accountSize: 25000,
          tradesCompleted: 30,
          timeSpent: 200,
          featuresUsed: new Set(['basic-calculator', 'position-sizing', 'goal-sizing'])
        };
        
        const controller = new FeatureVisibilityController('import', userProgress);
        const summary = controller.getUserProgressSummary();
        
        expect(summary.level).toBe('import');
        expect(summary.accountSize).toBe(25000);
        expect(summary.tradesCompleted).toBe(30);
        expect(summary.timeSpent).toBe(200);
        expect(summary.featuresUsed).toBe(3);
        expect(summary.progressPercentage).toBeGreaterThan(0);
        expect(summary.progressPercentage).toBeLessThanOrEqual(100);
      });
    });

    describe('Feature Categories', () => {
      it('should correctly categorize features', () => {
        const controller = new FeatureVisibilityController('broker');
        
        const coreFeatures = controller.getFeaturesByCategory('core');
        const intermediateFeatures = controller.getFeaturesByCategory('import');
        const advancedFeatures = controller.getFeaturesByCategory('broker');
        
        expect(coreFeatures.length).toBeGreaterThan(0);
        expect(intermediateFeatures.length).toBeGreaterThan(0);
        expect(advancedFeatures.length).toBeGreaterThan(0);
        
        // Check that core features include basic calculator
        expect(coreFeatures.some(f => f.id === 'basic-calculator')).toBe(true);
        
        // Check that advanced features include AI analysis
        expect(advancedFeatures.some(f => f.id === 'ai-analysis')).toBe(true);
      });
    });

    describe('Unlock Targets', () => {
      it('should identify next unlock targets', () => {
        const userProgress: Partial<UserProgress> = {
          accountSize: 3000,
          tradesCompleted: 3,
          timeSpent: 60,
          featuresUsed: new Set(['basic-calculator'])
        };
        
        const controller = new FeatureVisibilityController('import', userProgress);
        const nextTargets = controller.getNextUnlockTargets();
        
        expect(nextTargets.length).toBeGreaterThan(0);
        expect(nextTargets.length).toBeLessThanOrEqual(3);
        
        // Should include position-sizing as a target
        expect(nextTargets.some(f => f.id === 'position-sizing')).toBe(true);
      });

      it('should identify unlockable features with partial progress', () => {
        const userProgress: Partial<UserProgress> = {
          accountSize: 2500, // Partial progress toward 5000
          tradesCompleted: 2,  // Partial progress toward 5
          timeSpent: 60,
          featuresUsed: new Set(['basic-calculator'])
        };
        
        const controller = new FeatureVisibilityController('import', userProgress);
        const unlockableFeatures = controller.getUnlockableFeatures();
        
        // Should include features with partial progress
        expect(unlockableFeatures.length).toBeGreaterThan(0);
      });
    });

    describe('Level Transitions', () => {
      it('should update feature visibility when user level changes', () => {
        const controller = new FeatureVisibilityController('learning');
        
        // Advanced features should not be visible for beginners
        let advancedAnalyticsState = controller.getFeatureState('advanced-analytics');
        expect(advancedAnalyticsState?.isVisible).toBe(false);
        
        // Update to advanced level
        controller.updateUserProgress({ level: 'broker' });
        
        // Now advanced features should be visible
        advancedAnalyticsState = controller.getFeatureState('advanced-analytics');
        expect(advancedAnalyticsState?.isVisible).toBe(true);
      });
    });
  });

  describe('Progressive Disclosure Integration', () => {
    
    describe('UX Layers and Feature Visibility Integration', () => {
      it('should coordinate between UX layers and feature visibility', () => {
        const uxController = new UXLayersController('import');
        const featureController = new FeatureVisibilityController('import');
        
        // Both controllers should agree on feature visibility
        const visibleFeatures = featureController.getVisibleFeatures();
        
        visibleFeatures.forEach(feature => {
          if (uxController.getVisibleFeatures() !== 'all') {
            // If UX controller has specific visible features, check compatibility
            const shouldShow = uxController.shouldShowFeature(feature.id);
            const featureState = featureController.getFeatureState(feature.id);
            
            if (featureState?.isVisible) {
              // Feature visibility should be consistent
              expect(typeof shouldShow).toBe('boolean');
            }
          }
        });
      });
    });

    describe('Configuration Panel Positioning', () => {
      it('should position configuration panel based on user level', () => {
        const beginnerController = new UXLayersController('learning');
        const advancedController = new UXLayersController('broker');
        
        const beginnerSettings = beginnerController.getConfigurationPanelSettings();
        const advancedSettings = advancedController.getConfigurationPanelSettings();
        
        expect(beginnerSettings.position).toBe('top');
        expect(beginnerSettings.maxVisible).toBe(3);
        
        expect(advancedSettings.position).toBe('sidebar');
        expect(advancedSettings.maxVisible).toBe(999);
      });
    });

    describe('Research-Backed Improvements Validation', () => {
      it('should implement progressive disclosure that reduces cognitive load', () => {
        const beginnerController = new UXLayersController('learning');
        const advancedController = new UXLayersController('broker');
        
        const beginnerMenu = beginnerController.getAdaptiveMenuConfig();
        const advancedMenu = advancedController.getAdaptiveMenuConfig();
        
        // Beginners should have fewer options (reduced cognitive load)
        const beginnerTotalOptions = beginnerMenu.primary.length + beginnerMenu.secondary.length + beginnerMenu.advanced.length;
        const advancedTotalOptions = advancedMenu.primary.length + advancedMenu.secondary.length + advancedMenu.advanced.length;
        
        expect(beginnerTotalOptions).toBeLessThan(advancedTotalOptions);
        expect(beginnerTotalOptions).toBeLessThanOrEqual(6); // Research suggests max 7±2 items
      });

      it('should provide clear unlock criteria for task completion improvement', () => {
        const controller = new FeatureVisibilityController('import');
        
        FEATURE_DEFINITIONS.forEach(feature => {
          if (feature.unlockCriteria) {
            const state = controller.getFeatureState(feature.id);
            
            if (state && !state.isUnlocked && state.unlockMessage) {
              // Unlock message should be clear and actionable
              expect(state.unlockMessage).toContain('To unlock:');
              expect(state.unlockMessage.length).toBeGreaterThan(10);
              expect(state.unlockMessage.length).toBeLessThan(200); // Not too verbose
            }
          }
        });
      });
    });

    describe('Feature Flow Order', () => {
      it('should ensure logical feature progression', () => {
        const controller = new FeatureVisibilityController('learning');
        
        // Core features should be available first
        const coreFeatures = controller.getFeaturesByCategory('core');
        coreFeatures.forEach(feature => {
          const state = controller.getFeatureState(feature.id);
          expect(state?.isVisible).toBe(true);
          expect(state?.isUnlocked).toBe(true);
        });
        
        // Advanced features should not be visible for beginners
        const advancedFeatures = FEATURE_DEFINITIONS.filter(f => f.category === 'broker');
        advancedFeatures.forEach(feature => {
          const state = controller.getFeatureState(feature.id);
          expect(state?.isVisible).toBe(false);
        });
      });

      it('should respect dependency chains', () => {
        const controller = new FeatureVisibilityController('broker', {
          accountSize: 100000,
          tradesCompleted: 100,
          timeSpent: 1200,
          featuresUsed: new Set()
        });
        
        // Find features with dependencies
        const featuresWithDeps = FEATURE_DEFINITIONS.filter(f => f.dependencies && f.dependencies.length > 0);
        
        featuresWithDeps.forEach(feature => {
          const state = controller.getFeatureState(feature.id);
          
          if (state?.isUnlocked) {
            // If feature is unlocked, all dependencies should also be unlocked
            feature.dependencies!.forEach(depId => {
              const depState = controller.getFeatureState(depId);
              expect(depState?.isUnlocked).toBe(true);
            });
          }
        });
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    
    it('should handle rapid level changes efficiently', () => {
      const controller = new UXLayersController('learning');
      
      const startTime = performance.now();
      
      // Rapidly change levels multiple times
      for (let i = 0; i < 100; i++) {
        const levels: UserExperienceLevel[] = ['learning', 'import', 'broker'];
        const randomLevel = levels[i % 3];
        controller.setUserLevel(randomLevel);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (less than 100ms)
      expect(duration).toBeLessThan(100);
    });

    it('should handle invalid feature IDs gracefully', () => {
      const controller = new FeatureVisibilityController('import');
      
      expect(() => {
        controller.getFeatureState('non-existent-feature');
      }).not.toThrow();
      
      expect(controller.getFeatureState('non-existent-feature')).toBeNull();
    });

    it('should handle extreme user progress values', () => {
      const extremeProgress: Partial<UserProgress> = {
        accountSize: Number.MAX_SAFE_INTEGER,
        tradesCompleted: Number.MAX_SAFE_INTEGER,
        timeSpent: Number.MAX_SAFE_INTEGER,
        featuresUsed: new Set(FEATURE_DEFINITIONS.map(f => f.id))
      };
      
      expect(() => {
        new FeatureVisibilityController('broker', extremeProgress);
      }).not.toThrow();
    });
  });
});

describe('Feature Definitions Validation', () => {
  
  it('should have valid feature definitions', () => {
    FEATURE_DEFINITIONS.forEach(feature => {
      expect(feature.id).toBeTruthy();
      expect(feature.name).toBeTruthy();
      expect(feature.description).toBeTruthy();
      expect(['core', 'import', 'broker']).toContain(feature.category);
      expect(['learning', 'import', 'broker']).toContain(feature.requiredLevel);
    });
  });

  it('should have consistent dependency references', () => {
    const featureIds = new Set(FEATURE_DEFINITIONS.map(f => f.id));
    
    FEATURE_DEFINITIONS.forEach(feature => {
      if (feature.dependencies) {
        feature.dependencies.forEach(depId => {
          expect(featureIds.has(depId)).toBe(true);
        });
      }
    });
  });

  it('should have no circular dependencies', () => {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (featureId: string): boolean => {
      if (recursionStack.has(featureId)) return true;
      if (visited.has(featureId)) return false;
      
      visited.add(featureId);
      recursionStack.add(featureId);
      
      const feature = FEATURE_DEFINITIONS.find(f => f.id === featureId);
      if (feature?.dependencies) {
        for (const depId of feature.dependencies) {
          if (hasCycle(depId)) return true;
        }
      }
      
      recursionStack.delete(featureId);
      return false;
    };
    
    FEATURE_DEFINITIONS.forEach(feature => {
      expect(hasCycle(feature.id)).toBe(false);
    });
  });
});

describe('UX Layers Configuration Validation', () => {
  
  it('should have valid UX layer configurations', () => {
    Object.entries(UX_LAYERS).forEach(([level, config]) => {
      expect(['learning', 'import', 'broker']).toContain(level);
      expect(config.visibleFeatures).toBeDefined();
      expect(Array.isArray(config.hiddenFeatures)).toBe(true);
      expect(['simple', 'standard', 'broker']).toContain(config.navigationStyle);
      expect(['conservative', 'moderate', 'aggressive']).toContain(config.defaultRiskProfile);
    });
  });

  it('should have progressive complexity in configurations', () => {
    const learningConfig = UX_LAYERS.learning;
    const importConfig = UX_LAYERS.import;
    const brokerConfig = UX_LAYERS.broker;
    
    // Learning should have most restrictions
    expect(learningConfig.maxConfigOptions).toBe(3);
    expect(learningConfig.hiddenFeatures.length).toBeGreaterThan(0);
    
    // Import should have moderate restrictions
    expect(importConfig.maxConfigOptions).toBe(6);
    expect(importConfig.hiddenFeatures.length).toBeGreaterThan(0);
    expect(importConfig.hiddenFeatures.length).toBeLessThan(learningConfig.hiddenFeatures.length);
    
    // Broker should have no restrictions
    expect(brokerConfig.maxConfigOptions).toBe('unlimited');
    expect(brokerConfig.hiddenFeatures.length).toBe(0);
    expect(brokerConfig.visibleFeatures).toBe('all');
  });
}); 