/**
 * UX Layers Controller - Progressive Disclosure Pattern Implementation
 * Manages feature visibility and configuration options based on user experience level
 */

export type UserExperienceLevel = 'learning' | 'import' | 'broker';

export interface UXLayerConfig {
  visibleFeatures: string[] | 'all';
  hiddenFeatures: string[];
  maxConfigOptions: number | 'unlimited';
  navigationStyle: 'simple' | 'standard' | 'advanced';
  defaultRiskProfile: 'conservative' | 'moderate' | 'aggressive';
}

export interface UserAssessmentResponse {
  tradingExperience: number; // 1-5 scale
  optionsKnowledge: number; // 1-5 scale
  riskTolerance: number; // 1-5 scale
  accountSize: number; // Dollar amount
  preferredComplexity: 'simple' | 'moderate' | 'advanced';
}

export interface AdaptiveMenuConfig {
  primary: string[];
  secondary: string[];
  advanced: string[];
  configurationPanel: {
    position: 'top' | 'sidebar' | 'modal';
    maxVisible: number;
  };
}

// Progressive disclosure configuration
export const UX_LAYERS: Record<UserExperienceLevel, UXLayerConfig> = {
  learning: {
    visibleFeatures: [
      'basic-calculator', 
      'risk-assessment', 
      'simple-visualizer',
      'position-sizing',
      'basic-dashboard'
    ],
    hiddenFeatures: [
      'advanced-analytics', 
      'custom-formulas', 
      'api-settings',
      'complex-strategies',
      'backtesting'
    ],
    maxConfigOptions: 3,
    navigationStyle: 'simple',
    defaultRiskProfile: 'conservative'
  },
  
  import: {
    visibleFeatures: [
      'basic-calculator',    // Core feature - should be available to all levels
      'risk-assessment',     // Core feature - should be available to all levels
      'basic-dashboard',     // Core feature - should be available to all levels
      'position-sizing', 
      'risk-management', 
      'strategy-builder',
      'performance-tracking',
      'goal-sizing',
      'interactive-analytics'
    ],
    hiddenFeatures: [
      'advanced-analytics', 
      'custom-formulas',
      'api-integration'
    ],
    maxConfigOptions: 6,
    navigationStyle: 'standard',
    defaultRiskProfile: 'moderate'
  },
  
  broker: {
    visibleFeatures: 'all',
    hiddenFeatures: [],
    maxConfigOptions: 'unlimited',
    navigationStyle: 'advanced',
    defaultRiskProfile: 'aggressive'
  }
};

export class UXLayersController {
  private userLevel: UserExperienceLevel;
  private config: UXLayerConfig;

  constructor(userLevel: UserExperienceLevel = 'import') {
    // Migrate old level names if found in localStorage
    this.migrateOldLevelNames();
    
    this.userLevel = userLevel;
    this.config = UX_LAYERS[userLevel];
  }

  /**
   * Migrate old level names from localStorage to new ones
   */
  private migrateOldLevelNames(): void {
    const oldToNewMapping: { [key: string]: UserExperienceLevel } = {
      'beginner': 'learning',
      'intermediate': 'import', 
      'advanced': 'broker'
    };

    // Check and update userExperienceLevel
    const storedLevel = localStorage.getItem('userExperienceLevel');
    if (storedLevel && oldToNewMapping[storedLevel]) {
      localStorage.setItem('userExperienceLevel', oldToNewMapping[storedLevel]);
    }

    // Check and update any dashboard preferences with old level names
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('dashboard-preferences-')) {
        const oldLevel = key.split('-')[2];
        if (oldToNewMapping[oldLevel]) {
          const value = localStorage.getItem(key);
          if (value) {
            localStorage.setItem(`dashboard-preferences-${oldToNewMapping[oldLevel]}`, value);
            localStorage.removeItem(key);
          }
        }
      }
    });
  }

  /**
   * Assess user experience level based on questionnaire responses
   */
  static assessUserExperience(responses: UserAssessmentResponse): UserExperienceLevel {
    let score = 0;
    
    // Experience questions scoring
    if (responses.tradingExperience > 2) score += 2;
    if (responses.optionsKnowledge > 3) score += 2;
    if (responses.riskTolerance > 2) score += 1;
    if (responses.accountSize > 10000) score += 1;
    if (responses.preferredComplexity === 'advanced') score += 2;
    if (responses.preferredComplexity === 'moderate') score += 1;
    
    if (score <= 2) return 'learning';
    if (score <= 5) return 'import';
    return 'broker';
  }

  /**
   * Check if a feature should be visible for the current user level
   */
  shouldShowFeature(featureName: string): boolean {
    if (this.config.visibleFeatures === 'all') return true;
    return this.config.visibleFeatures.includes(featureName);
  }

  /**
   * Check if a feature should be hidden for the current user level
   */
  isFeatureHidden(featureName: string): boolean {
    return this.config.hiddenFeatures.includes(featureName);
  }

  /**
   * Get the maximum number of configuration options to show
   */
  getMaxConfigOptions(): number | 'unlimited' {
    return this.config.maxConfigOptions;
  }

  /**
   * Get filtered configuration options based on user level
   */
  getFilteredConfigOptions(allOptions: string[]): string[] {
    const maxOptions = this.getMaxConfigOptions();
    if (maxOptions === 'unlimited') return allOptions;
    
    // Prioritize options based on user level
    const prioritizedOptions = this.prioritizeOptions(allOptions);
    return prioritizedOptions.slice(0, maxOptions);
  }

  /**
   * Prioritize configuration options based on user level
   */
  private prioritizeOptions(options: string[]): string[] {
    const priorities = {
      learning: [
        'account-balance',
        'risk-per-trade',
        'position-size'
      ],
      import: [
        'account-balance',
        'risk-per-trade',
        'position-size',
        'win-rate',
        'payoff-ratio',
        'max-exposure'
      ],
      broker: options // All options for broker users
    };

    const userPriorities = priorities[this.userLevel];
    const prioritized = userPriorities.filter(opt => options.includes(opt));
    const remaining = options.filter(opt => !userPriorities.includes(opt));
    
    return [...prioritized, ...remaining];
  }

  /**
   * Get adaptive menu configuration
   */
  getAdaptiveMenuConfig(): AdaptiveMenuConfig {
    const baseConfig = {
      learning: {
        primary: ['Dashboard', 'Position Calculator', 'Risk Assessment'],
        secondary: ['Settings', 'Help'],
        advanced: [],
        configurationPanel: {
          position: 'top' as const,
          maxVisible: 3
        }
      },
      import: {
        primary: ['Dashboard', 'Position Sizing', 'Analytics', 'Visualizer'],
        secondary: ['Goal Sizing', 'Import Data', 'Settings'],
        advanced: ['Advanced Analytics'],
        configurationPanel: {
          position: 'top' as const,
          maxVisible: 6
        }
      },
      broker: {
        primary: ['Dashboard', 'Position Sizing', 'Analytics', 'Visualizer', 'AI Analysis'],
        secondary: ['Goal Sizing', 'Import Data', 'Rule Engine', 'API Settings'],
        advanced: ['Custom Strategies', 'Backtesting', 'Advanced Settings'],
        configurationPanel: {
          position: 'sidebar' as const,
          maxVisible: 999
        }
      }
    };

    return baseConfig[this.userLevel];
  }

  /**
   * Get navigation style for current user level
   */
  getNavigationStyle(): 'simple' | 'standard' | 'advanced' {
    return this.config.navigationStyle;
  }

  /**
   * Get default risk profile for current user level
   */
  getDefaultRiskProfile(): 'conservative' | 'moderate' | 'aggressive' {
    return this.config.defaultRiskProfile;
  }

  /**
   * Update user level and reconfigure
   */
  setUserLevel(level: UserExperienceLevel): void {
    this.userLevel = level;
    this.config = UX_LAYERS[level];
  }

  /**
   * Get current user level
   */
  getUserLevel(): UserExperienceLevel {
    return this.userLevel;
  }

  /**
   * Get visible features for current user level
   */
  getVisibleFeatures(): string[] | 'all' {
    return this.config.visibleFeatures;
  }

  /**
   * Get configuration panel settings
   */
  getConfigurationPanelSettings() {
    const menuConfig = this.getAdaptiveMenuConfig();
    return {
      position: menuConfig.configurationPanel.position,
      maxVisible: menuConfig.configurationPanel.maxVisible,
      style: this.getNavigationStyle()
    };
  }
}

// Multi-layer menu system for complexity management
export class AdaptiveMenuSystem {
  private uxController: UXLayersController;

  constructor(userLevel: UserExperienceLevel) {
    this.uxController = new UXLayersController(userLevel);
  }

  /**
   * Render menu structure based on user level
   */
  renderMenu(): AdaptiveMenuConfig {
    return this.uxController.getAdaptiveMenuConfig();
  }

  /**
   * Get primary actions for current user level
   */
  getPrimaryActions(): string[] {
    const config = this.uxController.getAdaptiveMenuConfig();
    return config.primary;
  }

  /**
   * Get secondary actions for current user level
   */
  getSecondaryActions(): string[] {
    const config = this.uxController.getAdaptiveMenuConfig();
    return config.secondary;
  }

  /**
   * Get advanced actions (only for advanced users)
   */
  getAdvancedActions(): string[] {
    const config = this.uxController.getAdaptiveMenuConfig();
    return config.advanced;
  }

  /**
   * Check if configuration should be moved to top of page
   */
  shouldMoveConfigurationUp(): boolean {
    const settings = this.uxController.getConfigurationPanelSettings();
    return settings.position === 'top';
  }
}

// Export singleton instance for global use
export const globalUXController = new UXLayersController();
export const globalMenuSystem = new AdaptiveMenuSystem('import'); 