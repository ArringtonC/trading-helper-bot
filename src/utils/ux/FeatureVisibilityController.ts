/**
 * Feature Visibility Controller - Manages feature access and visibility
 * Works with Progressive Disclosure Pattern to control what users see
 */

import { UXLayersController, UserExperienceLevel } from './UXLayersController';

export interface FeatureDefinition {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'intermediate' | 'advanced';
  requiredLevel: UserExperienceLevel;
  dependencies?: string[];
  unlockCriteria?: {
    accountSize?: number;
    tradesCompleted?: number;
    timeSpent?: number; // minutes
    featuresUsed?: string[];
  };
}

export interface FeatureState {
  isVisible: boolean;
  isEnabled: boolean;
  isUnlocked: boolean;
  unlockProgress?: number; // 0-100
  unlockMessage?: string;
}

export interface UserProgress {
  accountSize: number;
  tradesCompleted: number;
  timeSpent: number; // minutes
  featuresUsed: Set<string>;
  level: UserExperienceLevel;
  lastActivity: Date;
}

// Feature definitions with progressive disclosure rules
export const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  // Core Features (Always visible for all levels)
  {
    id: 'basic-calculator',
    name: 'Basic Position Calculator',
    description: 'Basic position sizing calculations',
    category: 'core',
    requiredLevel: 'learning'
  },
  {
    id: 'risk-assessment',
    name: 'Risk Assessment',
    description: 'Evaluate your risk tolerance',
    category: 'core',
    requiredLevel: 'learning'
  },
  {
    id: 'account-validation',
    name: 'Account Validation',
    description: 'Check if your account size is adequate',
    category: 'core',
    requiredLevel: 'learning'
  },
  {
    id: 'basic-dashboard',
    name: 'Basic Dashboard',
    description: 'Overview of your trading metrics',
    category: 'core',
    requiredLevel: 'learning'
  },

  // Intermediate Features
  {
    id: 'position-sizing',
    name: 'Advanced Position Sizing',
    description: 'Kelly Criterion and VIX-adjusted sizing',
    category: 'intermediate',
    requiredLevel: 'import',
    dependencies: ['basic-calculator'],
    unlockCriteria: {
      accountSize: 5000,
      tradesCompleted: 5,
      timeSpent: 60
    }
  },
  {
    id: 'goal-sizing',
    name: 'Goal-Based Sizing',
    description: 'Position sizing based on financial goals',
    category: 'intermediate',
    requiredLevel: 'import',
    dependencies: ['position-sizing']
  },
  {
    id: 'strategy-builder',
    name: 'Strategy Builder',
    description: 'Build and test trading strategies',
    category: 'intermediate',
    requiredLevel: 'import',
    unlockCriteria: {
      tradesCompleted: 10,
      timeSpent: 120
    }
  },
  {
    id: 'performance-tracking',
    name: 'Performance Tracking',
    description: 'Track and analyze your trading performance',
    category: 'intermediate',
    requiredLevel: 'import',
    dependencies: ['basic-dashboard']
  },
  {
    id: 'interactive-analytics',
    name: 'Interactive Analytics',
    description: 'Advanced charts and analysis tools',
    category: 'intermediate',
    requiredLevel: 'import',
    unlockCriteria: {
      featuresUsed: ['performance-tracking'],
      timeSpent: 60
    }
  },

  // Advanced Features
  {
    id: 'advanced-analytics',
    name: 'Advanced Analytics',
    description: 'Complex statistical analysis and modeling',
    category: 'advanced',
    requiredLevel: 'broker',
    dependencies: ['interactive-analytics'],
    unlockCriteria: {
      accountSize: 25000,
      tradesCompleted: 50,
      featuresUsed: ['strategy-builder']
    }
  },
  {
    id: 'custom-formulas',
    name: 'Custom Formulas',
    description: 'Create your own calculation formulas',
    category: 'advanced',
    requiredLevel: 'broker',
    unlockCriteria: {
      featuresUsed: ['strategy-builder', 'advanced-analytics'],
      tradesCompleted: 25
    }
  },
  {
    id: 'api-integration',
    name: 'API Integration',
    description: 'Connect to external data sources and brokers',
    category: 'advanced',
    requiredLevel: 'broker',
    unlockCriteria: {
      accountSize: 50000,
      timeSpent: 600
    }
  },
  {
    id: 'backtesting',
    name: 'Backtesting Engine',
    description: 'Test strategies against historical data',
    category: 'advanced',
    requiredLevel: 'broker',
    dependencies: ['strategy-builder', 'api-integration']
  },
  {
    id: 'ai-analysis',
    name: 'AI Analysis',
    description: 'Machine learning insights and predictions',
    category: 'advanced',
    requiredLevel: 'broker',
    dependencies: ['backtesting', 'advanced-analytics'],
    unlockCriteria: {
      accountSize: 100000,
      tradesCompleted: 100,
      featuresUsed: ['custom-formulas']
    }
  }
];

export class FeatureVisibilityController {
  private uxController: UXLayersController;
  private userProgress: UserProgress;
  private featureStates: Map<string, FeatureState>;

  constructor(userLevel: UserExperienceLevel, userProgress?: Partial<UserProgress>) {
    this.uxController = new UXLayersController(userLevel);
    this.userProgress = {
      accountSize: 0,
      tradesCompleted: 0,
      timeSpent: 0,
      featuresUsed: new Set(),
      level: userLevel,
      lastActivity: new Date(),
      ...userProgress
    };
    this.featureStates = new Map();
    this.updateFeatureStates();
  }

  /**
   * Update user progress and recalculate feature states
   */
  updateUserProgress(progress: Partial<UserProgress>): void {
    this.userProgress = {
      ...this.userProgress,
      ...progress,
      lastActivity: new Date()
    };
    
    // Update UX controller if level changed
    if (progress.level && progress.level !== this.uxController.getUserLevel()) {
      this.uxController.setUserLevel(progress.level);
    }
    
    this.updateFeatureStates();
  }

  /**
   * Mark a feature as used
   */
  markFeatureUsed(featureId: string): void {
    this.userProgress.featuresUsed.add(featureId);
    this.updateFeatureStates();
  }

  /**
   * Get the current state of a feature
   */
  getFeatureState(featureId: string): FeatureState | null {
    return this.featureStates.get(featureId) || null;
  }

  /**
   * Get all visible features for the current user level
   */
  getVisibleFeatures(): FeatureDefinition[] {
    return FEATURE_DEFINITIONS.filter(feature => {
      const state = this.featureStates.get(feature.id);
      return state?.isVisible || false;
    });
  }

  /**
   * Get features by category
   */
  getFeaturesByCategory(category: 'core' | 'intermediate' | 'advanced'): FeatureDefinition[] {
    return this.getVisibleFeatures().filter(feature => feature.category === category);
  }

  /**
   * Get features that are locked but could be unlocked
   */
  getUnlockableFeatures(): FeatureDefinition[] {
    return FEATURE_DEFINITIONS.filter(feature => {
      const state = this.featureStates.get(feature.id);
      return state && !state.isUnlocked && state.unlockProgress !== undefined && state.unlockProgress > 0;
    });
  }

  /**
   * Get next features that could be unlocked
   */
  getNextUnlockTargets(): FeatureDefinition[] {
    const currentLevel = this.userProgress.level;
    const levelOrder: UserExperienceLevel[] = ['learning', 'import', 'broker'];
    const currentLevelIndex = levelOrder.indexOf(currentLevel);
    
    return FEATURE_DEFINITIONS.filter(feature => {
      const featureLevelIndex = levelOrder.indexOf(feature.requiredLevel);
      return featureLevelIndex > currentLevelIndex;
    }).slice(0, 3); // Return next 3 unlock targets
  }

  /**
   * Calculate unlock progress for a feature
   */
  calculateUnlockProgress(feature: FeatureDefinition): number {
    if (!feature.unlockCriteria) return 100;
    
    let totalCriteria = 0;
    let metCriteria = 0;
    
    const criteria = feature.unlockCriteria;
    
    if (criteria.accountSize !== undefined) {
      totalCriteria++;
      if (this.userProgress.accountSize >= criteria.accountSize) {
        metCriteria++;
      }
    }
    
    if (criteria.tradesCompleted !== undefined) {
      totalCriteria++;
      if (this.userProgress.tradesCompleted >= criteria.tradesCompleted) {
        metCriteria++;
      }
    }
    
    if (criteria.timeSpent !== undefined) {
      totalCriteria++;
      if (this.userProgress.timeSpent >= criteria.timeSpent) {
        metCriteria++;
      }
    }
    
    if (criteria.featuresUsed !== undefined) {
      totalCriteria++;
      const requiredFeatures = criteria.featuresUsed;
      const hasAllFeatures = requiredFeatures.every(f => this.userProgress.featuresUsed.has(f));
      if (hasAllFeatures) {
        metCriteria++;
      }
    }
    
    return totalCriteria > 0 ? (metCriteria / totalCriteria) * 100 : 100;
  }

  /**
   * Check if feature dependencies are met
   */
  private areDependenciesMet(feature: FeatureDefinition): boolean {
    if (!feature.dependencies) return true;
    
    return feature.dependencies.every(depId => {
      const depState = this.featureStates.get(depId);
      return depState?.isUnlocked || false;
    });
  }

  /**
   * Update all feature states based on current user progress
   */
  private updateFeatureStates(): void {
    const userLevel = this.userProgress.level;
    
    FEATURE_DEFINITIONS.forEach(feature => {
      const isLevelAppropriate = this.isFeatureLevelAppropriate(feature, userLevel);
      const areDependenciesMet = this.areDependenciesMet(feature);
      const unlockProgress = this.calculateUnlockProgress(feature);
      const isUnlocked = unlockProgress >= 100 && areDependenciesMet;
      
      // Feature is visible if it's appropriate for user level and UX controller allows it
      const isVisible = isLevelAppropriate && 
                       (this.uxController.shouldShowFeature(feature.id) || 
                        this.uxController.getVisibleFeatures() === 'all');
      
      // Feature is enabled if it's unlocked and visible
      const isEnabled = isVisible && isUnlocked;
      
      const state: FeatureState = {
        isVisible,
        isEnabled,
        isUnlocked,
        unlockProgress: unlockProgress < 100 ? unlockProgress : undefined,
        unlockMessage: this.generateUnlockMessage(feature, unlockProgress)
      };
      
      this.featureStates.set(feature.id, state);
    });
  }

  /**
   * Check if feature is appropriate for user level
   */
  private isFeatureLevelAppropriate(feature: FeatureDefinition, userLevel: UserExperienceLevel): boolean {
    const levelOrder: UserExperienceLevel[] = ['learning', 'import', 'broker'];
    const userLevelIndex = levelOrder.indexOf(userLevel);
    const featureLevelIndex = levelOrder.indexOf(feature.requiredLevel);
    
    return featureLevelIndex <= userLevelIndex;
  }

  /**
   * Generate unlock message for a feature
   */
  private generateUnlockMessage(feature: FeatureDefinition, progress: number): string | undefined {
    if (progress >= 100) return undefined;
    
    const criteria = feature.unlockCriteria;
    if (!criteria) return undefined;
    
    const missing: string[] = [];
    
    if (criteria.accountSize && this.userProgress.accountSize < criteria.accountSize) {
      const needed = criteria.accountSize - this.userProgress.accountSize;
      missing.push(`$${needed.toLocaleString()} more in account`);
    }
    
    if (criteria.tradesCompleted && this.userProgress.tradesCompleted < criteria.tradesCompleted) {
      const needed = criteria.tradesCompleted - this.userProgress.tradesCompleted;
      missing.push(`${needed} more trades`);
    }
    
    if (criteria.timeSpent && this.userProgress.timeSpent < criteria.timeSpent) {
      const needed = criteria.timeSpent - this.userProgress.timeSpent;
      missing.push(`${needed} more minutes of usage`);
    }
    
    if (criteria.featuresUsed) {
      const missingFeatures = criteria.featuresUsed.filter(f => !this.userProgress.featuresUsed.has(f));
      if (missingFeatures.length > 0) {
        missing.push(`use ${missingFeatures.join(', ')}`);
      }
    }
    
    if (missing.length === 0) return undefined;
    
    return `To unlock: ${missing.join(', ')}`;
  }

  /**
   * Get user progress summary
   */
  getUserProgressSummary() {
    const totalFeatures = FEATURE_DEFINITIONS.length;
    const unlockedFeatures = Array.from(this.featureStates.values()).filter(state => state.isUnlocked).length;
    const visibleFeatures = Array.from(this.featureStates.values()).filter(state => state.isVisible).length;
    
    return {
      level: this.userProgress.level,
      accountSize: this.userProgress.accountSize,
      tradesCompleted: this.userProgress.tradesCompleted,
      timeSpent: this.userProgress.timeSpent,
      featuresUsed: this.userProgress.featuresUsed.size,
      featuresUnlocked: unlockedFeatures,
      featuresVisible: visibleFeatures,
      totalFeatures,
      progressPercentage: (unlockedFeatures / totalFeatures) * 100
    };
  }
}

// Export singleton for global use
export const globalFeatureController = new FeatureVisibilityController('import'); 