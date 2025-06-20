/**
 * NavigationController Test Suite
 * Tests the adaptive navigation system with user level restrictions
 */

import NavigationController, { NavigationItem, ConfigurationOption } from '../NavigationController';
import { UserExperienceLevel } from '../../ux/UXLayersController';

describe('NavigationController', () => {
  let controller: NavigationController;

  describe('Beginner Level', () => {
    beforeEach(() => {
      controller = new NavigationController('learning');
    });

    test('should show only beginner-appropriate navigation items', () => {
      const items = controller.getNavigationItems();
      
      // Should include core items
      expect(items.some(item => item.feature === 'tutorial')).toBe(true);
      expect(items.some(item => item.feature === 'position-sizing')).toBe(true);
      expect(items.some(item => item.feature === 'simple-visualizer')).toBe(true);
      
      // Should NOT include advanced items
      expect(items.some(item => item.feature === 'ibkr-connection')).toBe(false);
      expect(items.some(item => item.feature === 'ai-analysis')).toBe(false);
      expect(items.some(item => item.feature === 'rule-engine')).toBe(false);
    });

    test('should limit configuration options to 3', () => {
      const options = controller.getConfigurationOptions();
      expect(options.length).toBe(3);
      
      // Should include only beginner-friendly options
      expect(options.some(opt => opt.id === 'theme')).toBe(true);
      expect(options.some(opt => opt.id === 'defaultRiskPercent')).toBe(true);
      expect(options.some(opt => opt.id === 'showTutorialHints')).toBe(true);
    });

    test('should prioritize visualizer for beginners', () => {
      expect(controller.shouldPrioritizeVisualizer()).toBe(true);
    });

    test('should return correct user level stats', () => {
      const stats = controller.getUserLevelStats();
      expect(stats.level).toBe('learning');
      expect(stats.configOptions).toBe(3);
      expect(stats.maxConfigOptions).toBe(3);
      expect(stats.availableFeatures).toBeGreaterThan(0);
    });
  });

  describe('Intermediate Level', () => {
    beforeEach(() => {
      controller = new NavigationController('import');
    });

    test('should show beginner and intermediate navigation items', () => {
      const items = controller.getNavigationItems();
      
      // Should include beginner items
      expect(items.some(item => item.feature === 'tutorial')).toBe(true);
      expect(items.some(item => item.feature === 'simple-visualizer')).toBe(true);
      
      // Should include intermediate items
      expect(items.some(item => item.feature === 'options-trading')).toBe(true);
      expect(items.some(item => item.feature === 'interactive-analytics')).toBe(true);
      
      // Should NOT include advanced items
      expect(items.some(item => item.feature === 'ibkr-connection')).toBe(false);
      expect(items.some(item => item.feature === 'rule-engine')).toBe(false);
    });

    test('should limit configuration options to 6', () => {
      const options = controller.getConfigurationOptions();
      expect(options.length).toBe(6);
      
      // Should include beginner and intermediate options
      expect(options.some(opt => opt.id === 'theme')).toBe(true);
      expect(options.some(opt => opt.id === 'autoSaveCalculations')).toBe(true);
      expect(options.some(opt => opt.id === 'chartTimeframe')).toBe(true);
    });

    test('should not prioritize visualizer for intermediate users', () => {
      expect(controller.shouldPrioritizeVisualizer()).toBe(false);
    });
  });

  describe('Advanced Level', () => {
    beforeEach(() => {
      controller = new NavigationController('broker');
    });

    test('should show all navigation items', () => {
      const items = controller.getNavigationItems();
      
      // Should include all levels
      expect(items.some(item => item.feature === 'tutorial')).toBe(true);
      expect(items.some(item => item.feature === 'options-trading')).toBe(true);
      expect(items.some(item => item.feature === 'ibkr-connection')).toBe(true);
      expect(items.some(item => item.feature === 'ai-analysis')).toBe(true);
      expect(items.some(item => item.feature === 'rule-engine')).toBe(true);
    });

    test('should have unlimited configuration options', () => {
      const options = controller.getConfigurationOptions();
      expect(options.length).toBeGreaterThan(6);
      
      // Should include advanced options
      expect(options.some(opt => opt.id === 'debugMode')).toBe(true);
      expect(options.some(opt => opt.id === 'customRules')).toBe(true);
      expect(options.some(opt => opt.id === 'experimentalFeatures')).toBe(true);
    });

    test('should not prioritize visualizer for advanced users', () => {
      expect(controller.shouldPrioritizeVisualizer()).toBe(false);
    });
  });

  describe('Navigation Organization', () => {
    beforeEach(() => {
      controller = new NavigationController('broker');
    });

    test('should organize navigation by categories', () => {
      const categories = controller.getNavigationByCategory();
      
      expect(categories.core).toBeDefined();
      expect(categories.trading).toBeDefined();
      expect(categories.analysis).toBeDefined();
      expect(categories.advanced).toBeDefined();
      
      // Core category should have tutorial and position sizing
      expect(categories.core.some(item => item.feature === 'tutorial')).toBe(true);
      expect(categories.core.some(item => item.feature === 'position-sizing')).toBe(true);
      
      // Position sizing should come before tutorial for beginners
      const positionSizingItem = categories.core.find(item => item.feature === 'position-sizing');
      const tutorialItem = categories.core.find(item => item.feature === 'tutorial');
      expect(positionSizingItem?.priority).toBeLessThan(tutorialItem?.priority || 999);
    });

    test('should return priority navigation items with limits', () => {
      const priorityItems = controller.getPriorityNavigationItems(3);
      expect(priorityItems.length).toBe(3);
      
      // Should be sorted by priority
      expect(priorityItems[0].priority).toBeLessThanOrEqual(priorityItems[1].priority);
      expect(priorityItems[1].priority).toBeLessThanOrEqual(priorityItems[2].priority);
    });
  });

  describe('Feature Visibility', () => {
    beforeEach(() => {
      controller = new NavigationController('import');
    });

    test('should correctly determine feature visibility', () => {
      // Beginner/intermediate features should be visible
      expect(controller.shouldShowFeature('tutorial')).toBe(true);
      expect(controller.shouldShowFeature('position-sizing')).toBe(true);
      expect(controller.shouldShowFeature('options-trading')).toBe(true);
      
      // Advanced features should not be visible
      expect(controller.shouldShowFeature('ibkr-connection')).toBe(false);
      expect(controller.shouldShowFeature('rule-engine')).toBe(false);
    });

    test('should handle unknown features gracefully', () => {
      expect(controller.shouldShowFeature('unknown-feature')).toBe(false);
    });
  });

  describe('Onboarding Flow', () => {
    test('should initialize onboarding flow for beginners', () => {
      controller = new NavigationController('learning');
      const flow = controller.initializeOnboardingFlow();
      
      expect(flow.step).toBe(1);
      expect(flow.totalSteps).toBe(4);
      expect(flow.currentPage).toBe('/');
      expect(flow.userLevel).toBe('learning');
      expect(flow.recommendedNext).toContain('/tutorial');
      expect(flow.recommendedNext).toContain('/');
      expect(flow.recommendedNext).toContain('/visualizer');
      // Position sizing should be first in the recommended flow
      expect(flow.recommendedNext[0]).toBe('/');
    });

    test('should initialize onboarding flow for intermediate users', () => {
      controller = new NavigationController('import');
      const flow = controller.initializeOnboardingFlow();
      
      expect(flow.totalSteps).toBe(6);
      expect(flow.recommendedNext.length).toBeGreaterThan(3);
    });

    test('should prioritize visualizer during onboarding', () => {
      controller = new NavigationController('import');
      controller.initializeOnboardingFlow();
      
      // Should prioritize visualizer during early onboarding steps
      expect(controller.shouldPrioritizeVisualizer()).toBe(true);
    });
  });

  describe('User Level Management', () => {
    beforeEach(() => {
      controller = new NavigationController('learning');
    });

    test('should update user level and reset onboarding', () => {
      const initialFlow = controller.initializeOnboardingFlow();
      expect(initialFlow.userLevel).toBe('learning');
      
      controller.setUserLevel('broker');
      
      // Should have more features available after level change
      const items = controller.getNavigationItems();
      expect(items.some(item => item.feature === 'ibkr-connection')).toBe(true);
    });

    test('should provide configuration limits information', () => {
      const limits = controller.getConfigurationLimits();
      expect(limits.level).toBe('learning');
      expect(limits.current).toBe(3);
      expect(limits.max).toBe(3);
    });
  });

  describe('Priority and Sorting', () => {
    beforeEach(() => {
      controller = new NavigationController('broker');
    });

    test('should sort navigation items by priority', () => {
      const items = controller.getNavigationItems();
      
      // Items should be sorted by priority (lower number = higher priority)
      for (let i = 0; i < items.length - 1; i++) {
        expect(items[i].priority).toBeLessThanOrEqual(items[i + 1].priority);
      }
    });

    test('should sort configuration options by priority', () => {
      const options = controller.getConfigurationOptions();
      
      // Options should be sorted by priority
      for (let i = 0; i < options.length - 1; i++) {
        expect(options[i].priority).toBeLessThanOrEqual(options[i + 1].priority);
      }
    });
  });
}); 