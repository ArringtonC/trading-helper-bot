/// <reference types="jest" />

import { FlowOrderManager, FEATURE_FLOW_ORDER } from '../FlowOrderManager';
import { FeatureAccessController } from '../FeatureAccessController';
import { UserExperienceLevel } from '../UXLayersController';

describe('FlowOrderManager', () => {
  let manager: FlowOrderManager;
  let featureAccessController: FeatureAccessController;

  beforeEach(() => {
    featureAccessController = new FeatureAccessController('import');
    manager = new FlowOrderManager('import', featureAccessController);
  });

  describe('FEATURE_FLOW_ORDER Configuration', () => {
    it('should have correct structure', () => {
      expect(FEATURE_FLOW_ORDER.sections).toBeDefined();
      expect(FEATURE_FLOW_ORDER.aiAnalysisFeatures).toBeDefined();
      expect(FEATURE_FLOW_ORDER.flowRules).toBeDefined();
      
      expect(FEATURE_FLOW_ORDER.sections.length).toBeGreaterThan(0);
      expect(FEATURE_FLOW_ORDER.aiAnalysisFeatures.length).toBeGreaterThan(0);
      expect(FEATURE_FLOW_ORDER.flowRules.length).toBeGreaterThan(0);
    });

    it('should have AI analysis section with highest priority', () => {
      const aiSection = FEATURE_FLOW_ORDER.sections.find(s => s.id === 'ai-analysis');
      expect(aiSection).toBeDefined();
      expect(aiSection!.priority).toBeGreaterThan(80); // Should be high priority (90+)
      
      // Should be higher priority than all other sections except resources
      const otherSections = FEATURE_FLOW_ORDER.sections.filter(s => s.id !== 'ai-analysis' && s.id !== 'resources');
      otherSections.forEach(section => {
        expect(aiSection!.priority).toBeGreaterThan(section.priority);
      });
    });

    it('should have core sections with low priority numbers', () => {
      const coreSections = FEATURE_FLOW_ORDER.sections.filter(s => s.category === 'core');
      expect(coreSections.length).toBeGreaterThan(0);
      
      coreSections.forEach(section => {
        expect(section.priority).toBeLessThan(20); // Core sections should have priority < 20
      });
    });

    it('should include ai-analysis in aiAnalysisFeatures', () => {
      expect(FEATURE_FLOW_ORDER.aiAnalysisFeatures).toContain('ai-analysis');
      expect(FEATURE_FLOW_ORDER.aiAnalysisFeatures).toContain('ai-insights');
      expect(FEATURE_FLOW_ORDER.aiAnalysisFeatures).toContain('predictive-modeling');
    });
  });

  describe('Feature Ordering', () => {
    it('should order features according to flow rules', () => {
      const features = ['ai-analysis', 'position-sizing', 'basic-dashboard', 'rule-engine'];
      const result = manager.orderFeatures(features, 'import');
      
      expect(result.orderedFeatures).toBeDefined();
      expect(result.orderedFeatures.length).toBe(features.length);
      expect(result.appliedRules.length).toBeGreaterThan(0);
    });

    it('should always position AI analysis features last', () => {
      const features = ['ai-analysis', 'position-sizing', 'ai-insights', 'basic-dashboard'];
      const result = manager.orderFeatures(features, 'broker');
      
      const aiFeatures = result.orderedFeatures.filter(f => 
        FEATURE_FLOW_ORDER.aiAnalysisFeatures.includes(f)
      );
      const nonAiFeatures = result.orderedFeatures.filter(f => 
        !FEATURE_FLOW_ORDER.aiAnalysisFeatures.includes(f)
      );
      
      // AI features should be at the end
      const lastNonAiIndex = result.orderedFeatures.lastIndexOf(nonAiFeatures[nonAiFeatures.length - 1]);
      const firstAiIndex = result.orderedFeatures.indexOf(aiFeatures[0]);
      
      if (aiFeatures.length > 0 && nonAiFeatures.length > 0) {
        expect(firstAiIndex).toBeGreaterThan(lastNonAiIndex);
      }
    });

    it('should apply ai-analysis-last rule when AI features are present', () => {
      const features = ['position-sizing', 'ai-analysis', 'basic-dashboard'];
      const result = manager.orderFeatures(features, 'broker');
      
      expect(result.appliedRules).toContain('ai-analysis-last');
      expect(result.aiAnalysisPosition).toBeGreaterThan(-1);
    });

    it('should not apply ai-analysis-last rule when no AI features are present', () => {
      const features = ['position-sizing', 'basic-dashboard', 'options-trading'];
      const result = manager.orderFeatures(features, 'import');
      
      expect(result.appliedRules).not.toContain('ai-analysis-last');
      expect(result.aiAnalysisPosition).toBe(-1);
    });

    it('should apply onboarding-first rule for beginners', () => {
      const beginnerManager = new FlowOrderManager('learning');
      const features = ['position-sizing', 'welcome-tutorial', 'ai-analysis'];
      const result = beginnerManager.orderFeatures(features, 'learning');
      
      expect(result.appliedRules).toContain('onboarding-first');
      
      // Welcome tutorial should be early in the flow
      const tutorialIndex = result.orderedFeatures.indexOf('welcome-tutorial');
      expect(tutorialIndex).toBeLessThan(2); // Should be in first 2 positions
    });

    it('should apply core-tools-early rule for all user levels', () => {
      const features = ['ai-analysis', 'position-sizing', 'rule-engine', 'basic-dashboard'];
      const result = manager.orderFeatures(features, 'import');
      
      expect(result.appliedRules).toContain('core-tools-early');
      
      // Core tools should appear early
      const positionSizingIndex = result.orderedFeatures.indexOf('position-sizing');
      const dashboardIndex = result.orderedFeatures.indexOf('basic-dashboard');
      
      expect(positionSizingIndex).toBeLessThan(result.orderedFeatures.length / 2);
      expect(dashboardIndex).toBeLessThan(result.orderedFeatures.length / 2);
    });
  });

  describe('Flow Types', () => {
    it('should handle onboarding flow type', () => {
      const features = ['welcome-tutorial', 'position-sizing', 'ai-analysis'];
      const result = manager.orderFeatures(features, 'learning', 'onboarding');
      
      expect(result.metadata.flowType).toBe('onboarding');
      expect(result.sections.length).toBeGreaterThan(0);
    });

    it('should handle navigation flow type', () => {
      const features = ['position-sizing', 'options-trading', 'ai-analysis'];
      const result = manager.orderFeatures(features, 'import', 'navigation');
      
      expect(result.metadata.flowType).toBe('navigation');
    });

    it('should handle dashboard flow type', () => {
      const features = ['basic-dashboard', 'performance-tracking', 'ai-analysis'];
      const result = manager.orderFeatures(features, 'broker', 'dashboard');
      
      expect(result.metadata.flowType).toBe('dashboard');
    });
  });

  describe('User Level Filtering', () => {
    it('should filter sections by user level', () => {
      const beginnerManager = new FlowOrderManager('learning');
      const result = beginnerManager.getRecommendedFlow('learning');
      
      // Should not include advanced-only features
      expect(result.orderedFeatures).not.toContain('ai-analysis');
      expect(result.orderedFeatures).not.toContain('rule-engine');
      
      // Should include beginner-appropriate features
      expect(result.sections.some(s => s.userLevels.includes('learning'))).toBe(true);
    });

    it('should include more features for advanced users', () => {
      const advancedManager = new FlowOrderManager('broker');
      const result = advancedManager.getRecommendedFlow('broker');
      
      // Should include advanced features
      expect(result.orderedFeatures).toContain('ai-analysis');
      
      // Should have more total features than beginner
      const beginnerManager = new FlowOrderManager('learning');
      const beginnerResult = beginnerManager.getRecommendedFlow('learning');
      
      expect(result.orderedFeatures.length).toBeGreaterThan(beginnerResult.orderedFeatures.length);
    });
  });

  describe('Section Management', () => {
    it('should get features for specific section', () => {
      const coreFeatures = manager.getFeaturesForSection('core-tools', 'import');
      expect(coreFeatures.length).toBeGreaterThan(0);
      expect(coreFeatures).toContain('position-sizing');
      expect(coreFeatures).toContain('basic-dashboard');
    });

    it('should return empty array for invalid section', () => {
      const features = manager.getFeaturesForSection('invalid-section', 'import');
      expect(features).toEqual([]);
    });

    it('should return empty array for section not available to user level', () => {
      const features = manager.getFeaturesForSection('ai-analysis', 'learning');
      expect(features).toEqual([]);
    });
  });

  describe('AI Analysis Validation', () => {
    it('should validate correct AI analysis positioning', () => {
      const features = ['position-sizing', 'options-trading', 'ai-analysis'];
      const validation = manager.validateAIAnalysisPositioning(features);
      
      expect(validation.isValid).toBe(true);
      expect(validation.issues.length).toBe(0);
    });

    it('should detect AI analysis not at end', () => {
      const features = ['ai-analysis', 'position-sizing', 'options-trading'];
      const validation = manager.validateAIAnalysisPositioning(features);
      
      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
      expect(validation.issues[0]).toContain('not positioned at the end');
    });

    it('should detect scattered AI features', () => {
      const features = ['ai-analysis', 'position-sizing', 'ai-insights', 'options-trading'];
      const validation = manager.validateAIAnalysisPositioning(features);
      
      expect(validation.isValid).toBe(false);
      expect(validation.issues.some(issue => issue.includes('scattered'))).toBe(true);
    });

    it('should be valid when no AI features are present', () => {
      const features = ['position-sizing', 'options-trading', 'basic-dashboard'];
      const validation = manager.validateAIAnalysisPositioning(features);
      
      expect(validation.isValid).toBe(true);
      expect(validation.issues.length).toBe(0);
    });
  });

  describe('Flow Statistics', () => {
    it('should provide accurate statistics for beginner', () => {
      const stats = manager.getFlowStatistics('learning');
      
      expect(stats.totalSections).toBeGreaterThan(0);
      expect(stats.availableSections).toBeLessThanOrEqual(stats.totalSections);
      expect(stats.totalFeatures).toBeGreaterThan(0);
      expect(stats.availableFeatures).toBeLessThanOrEqual(stats.totalFeatures);
      expect(stats.estimatedTime).toMatch(/\d+/); // Should contain numbers
    });

    it('should show more features available for advanced users', () => {
      const beginnerStats = manager.getFlowStatistics('learning');
      const advancedStats = manager.getFlowStatistics('broker');
      
      expect(advancedStats.availableFeatures).toBeGreaterThan(beginnerStats.availableFeatures);
      expect(advancedStats.aiAnalysisFeatures).toBeGreaterThan(beginnerStats.aiAnalysisFeatures);
    });
  });

  describe('Time Estimation', () => {
    it('should calculate estimated completion time', () => {
      const features = ['position-sizing', 'basic-dashboard', 'options-trading'];
      const result = manager.orderFeatures(features, 'import');
      
      expect(result.metadata.estimatedCompletionTime).toBeDefined();
      expect(result.metadata.estimatedCompletionTime).toMatch(/\d+/);
    });

    it('should provide longer estimates for more features', () => {
      const shortFeatures = ['position-sizing'];
      const longFeatures = ['position-sizing', 'options-trading', 'ai-analysis', 'rule-engine'];
      
      const shortResult = manager.orderFeatures(shortFeatures, 'broker');
      const longResult = manager.orderFeatures(longFeatures, 'broker');
      
      // Parse time estimates (assuming format like "15 minutes" or "1h 30m")
      const parseTime = (timeStr: string): number => {
        const hourMatch = timeStr.match(/(\d+)h/);
        const minuteMatch = timeStr.match(/(\d+)\s*m/);
        const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
        const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
        return hours * 60 + minutes;
      };
      
      const shortTime = parseTime(shortResult.metadata.estimatedCompletionTime);
      const longTime = parseTime(longResult.metadata.estimatedCompletionTime);
      
      expect(longTime).toBeGreaterThan(shortTime);
    });
  });

  describe('Integration with FeatureAccessController', () => {
    it('should filter features based on access controller', () => {
      const features = ['position-sizing', 'ai-analysis', 'non-existent-feature'];
      const result = manager.orderFeatures(features, 'import');
      
      // Should only include accessible features
      expect(result.orderedFeatures.length).toBeLessThanOrEqual(features.length);
      expect(result.orderedFeatures).not.toContain('non-existent-feature');
    });

    it('should work without feature access controller', () => {
      const managerWithoutController = new FlowOrderManager('import');
      const features = ['position-sizing', 'ai-analysis'];
      const result = managerWithoutController.orderFeatures(features, 'import');
      
      expect(result.orderedFeatures.length).toBe(features.length);
    });
  });

  describe('Research-Backed Features', () => {
    it('should implement consistent feature ordering for improved task completion', () => {
      const features = ['ai-analysis', 'position-sizing', 'rule-engine', 'basic-dashboard'];
      
      // Run ordering multiple times - should be consistent
      const result1 = manager.orderFeatures(features, 'broker');
      const result2 = manager.orderFeatures(features, 'broker');
      
      expect(result1.orderedFeatures).toEqual(result2.orderedFeatures);
      expect(result1.appliedRules).toEqual(result2.appliedRules);
    });

    it('should reduce cognitive load through proper feature grouping', () => {
      const result = manager.getRecommendedFlow('import');
      
      // Features should be grouped by category/priority
      const sections = result.sections;
      expect(sections.length).toBeGreaterThan(1);
      
      // Sections should be ordered by priority
      for (let i = 0; i < sections.length - 1; i++) {
        expect(sections[i].priority).toBeLessThanOrEqual(sections[i + 1].priority);
      }
    });

    it('should ensure AI analysis is always last for optimal user experience', () => {
      const features = ['position-sizing', 'ai-analysis', 'options-trading', 'ai-insights'];
      const result = manager.orderFeatures(features, 'broker');
      
      // All AI features should be at the end
      const aiFeatures = FEATURE_FLOW_ORDER.aiAnalysisFeatures.filter(f => features.includes(f));
      const lastFeatures = result.orderedFeatures.slice(-aiFeatures.length);
      
      aiFeatures.forEach(aiFeature => {
        expect(lastFeatures).toContain(aiFeature);
      });
    });
  });
}); 