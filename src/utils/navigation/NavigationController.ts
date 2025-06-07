/**
 * NavigationController - Adaptive Navigation System
 * 
 * Manages menu visibility and configuration options based on user assessment level.
 * Enforces limits: 3 options for beginners, 6 for intermediate, unlimited for advanced.
 */

import { UserExperienceLevel } from '../ux/UXLayersController';
import { loadSetting } from '../../services/SettingsService';

export interface NavigationItem {
  id: string;
  path: string;
  label: string;
  icon?: string;
  feature: string;
  minLevel: UserExperienceLevel;
  priority: number; // Lower number = higher priority
  category: 'core' | 'trading' | 'analysis' | 'advanced' | 'debug' | 'learning' | 'import' | 'brokers' | 'hidden';
  description?: string;
  isNew?: boolean;
  requiresAccount?: boolean;
}

export interface ConfigurationOption {
  id: string;
  label: string;
  description: string;
  category: 'display' | 'trading' | 'analysis' | 'advanced';
  minLevel: UserExperienceLevel;
  priority: number;
  defaultValue: any;
  type: 'boolean' | 'select' | 'number' | 'text';
  options?: Array<{ value: any; label: string }>;
}

export interface OnboardingFlow {
  step: number;
  totalSteps: number;
  currentPage: string;
  completedSteps: string[];
  recommendedNext: string[];
  userLevel: UserExperienceLevel;
}

export class NavigationController {
  private userLevel: UserExperienceLevel;
  private onboardingFlow: OnboardingFlow | null = null;
  
  // Configuration limits by user level
  private readonly CONFIG_LIMITS = {
    learning: 3,
    import: 6,
    broker: Infinity
  };

  // Core navigation items with priority and level requirements
  private readonly NAVIGATION_ITEMS: NavigationItem[] = [
    // MAIN NAVIGATION - Always visible core items
    {
      id: 'home',
      path: '/',
      label: '🏠 Home',
      feature: 'home',
      minLevel: 'learning',
      priority: 1,
      category: 'core',
      description: 'Professional homepage and app overview'
    },

    // LEARNING SECTION (Beginner)
    {
      id: 'position-sizing-foundation',
      path: '/position-sizing',
      label: '🎯 Position Sizing Tool',
      feature: 'position-sizing-foundation',
      minLevel: 'learning',
      priority: 2,
      category: 'learning',
      description: 'Interactive position sizing calculator and education'
    },
    {
      id: 'tutorial',
      path: '/tutorial',
      label: '🎮 Interactive Tutorial',
      feature: 'tutorial',
      minLevel: 'learning',
      priority: 3,
      category: 'learning',
      description: 'Learn position sizing through interactive lessons'
    },
    {
      id: 'psychology-simulator',
      path: '/psychological-trading',
      label: '🧠 Psychology Simulator',
      feature: 'psychology-simulator',
      minLevel: 'learning',
      priority: 4,
      category: 'learning',
      description: 'Practice trading psychology and emotional control'
    },
    {
      id: 'visualizer',
      path: '/visualizer',
      label: '🎯 Strategy Visualizer',
      feature: 'strategy-visualizer',
      minLevel: 'learning',
      priority: 4,
      category: 'learning',
      description: 'Visualize trading strategies and outcomes'
    },
    {
      id: 'trading-tutorials',
      path: '/tutorials',
      label: '🎓 Trading Tutorials',
      feature: 'trading-tutorials',
      minLevel: 'learning',
      priority: 5,
      category: 'learning',
      description: 'Comprehensive tutorials: NVDA options, stacking, naked calls, and MES futures',
      isNew: true
    },

    // IMPORT SECTION (Intermediate)
    {
      id: 'options-trading',
      path: '/options',
      label: '📊 Options Trading',
      feature: 'options-trading',
      minLevel: 'import',
      priority: 6,
      category: 'import',
      description: 'Advanced options trading tools and analysis'
    },
    {
      id: 'interactive-analytics',
      path: '/interactive-analytics',
      label: '📈 Interactive Analytics',
      feature: 'interactive-analytics',
      minLevel: 'import',
      priority: 7,
      category: 'import',
      description: 'Interactive charts and analytics dashboard'
    },
    {
      id: 'import-analyze',
      path: '/import-analyze',
      label: '📥 Import & Analyze',
      feature: 'import-analyze',
      minLevel: 'import',
      priority: 8,
      category: 'import',
      description: 'Import and analyze trading data'
    },

    // BROKERS/TESTING SECTION (Advanced)
    {
      id: 'ibkr-connection-test',
      path: '/pl-dashboard',
      label: '🔗 IBKR Connection Test',
      feature: 'ibkr-connection-test',
      minLevel: 'broker',
      priority: 9,
      category: 'brokers',
      description: 'Test Interactive Brokers API connection',
      requiresAccount: true
    },
    {
      id: 'ai-analysis',
      path: '/analysis',
      label: '🤖 AI Analysis',
      feature: 'ai-analysis',
      minLevel: 'broker',
      priority: 10,
      category: 'brokers',
      description: 'AI-powered market analysis and insights'
    },

    // SETTINGS/HIDDEN PAGES - Only accessible via settings or direct URL
    {
      id: 'assessment-test',
      path: '/assessment-test',
      label: '🧪 Assessment Test',
      feature: 'assessment-test',
      minLevel: 'broker',
      priority: 98,
      category: 'hidden',
      description: 'User experience assessment test'
    },
    {
      id: 'ibkr-api-demo',
      path: '/ibkr-api-demo',
      label: '🔗 IBKR API Demo',
      feature: 'ibkr-api-demo',
      minLevel: 'broker',
      priority: 99,
      category: 'hidden',
      description: 'Interactive Brokers API demonstration'
    },
    {
      id: 'volatility-dashboard',
      path: '/volatility-demo',
      label: '📊 Volatility Dashboard',
      feature: 'volatility-dashboard',
      minLevel: 'broker',
      priority: 100,
      category: 'hidden',
      description: 'Advanced volatility analysis dashboard'
    },
    {
      id: 'education-center',
      path: '/education',
      label: '📚 Training Education Center',
      feature: 'education-center',
      minLevel: 'broker',
      priority: 101,
      category: 'hidden',
      description: 'Comprehensive educational modules'
    },
    {
      id: 'weekend-gap-risk',
      path: '/weekend-gap-risk',
      label: '🏁 Weekend Gap Risk Dashboard',
      feature: 'weekend-gap-risk',
      minLevel: 'broker',
      priority: 102,
      category: 'hidden',
      description: 'Analyze weekend gap risk for positions'
    },
    {
      id: 'broker-sync-dashboard',
      path: '/broker-sync',
      label: '🔄 Broker Synchronization Dashboard',
      feature: 'broker-sync-dashboard',
      minLevel: 'broker',
      priority: 103,
      category: 'hidden',
      description: 'Monitor and control broker API synchronization'
    },

    // LEGACY/DEBUG - For development and testing
    {
      id: 'unified-dashboard',
      path: '/unified-dashboard',
      label: '🔄 Unified Dashboard',
      feature: 'unified-dashboard',
      minLevel: 'broker',
      priority: 110,
      category: 'debug',
      description: 'Legacy unified trading dashboard'
    },
    {
      id: 'rule-engine',
      path: '/rule-engine-demo',
      label: '⚙️ Rule Engine',
      feature: 'rule-engine',
      minLevel: 'broker',
      priority: 111,
      category: 'debug',
      description: 'Create custom trading rules and automation'
    },
    {
      id: 'legacy-dashboard',
      path: '/dashboard',
      label: '🔧 Legacy Dashboard',
      feature: 'legacy-dashboard',
      minLevel: 'broker',
      priority: 112,
      category: 'debug',
      description: 'Original dashboard for debugging'
    }
  ];

  // Configuration options with level restrictions
  private readonly CONFIGURATION_OPTIONS: ConfigurationOption[] = [
    // Beginner-friendly options (priority 1-3)
    {
      id: 'theme',
      label: 'Theme',
      description: 'Choose light or dark theme',
      category: 'display',
      minLevel: 'learning',
      priority: 1,
      defaultValue: 'light',
      type: 'select',
      options: [
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' }
      ]
    },
    {
      id: 'defaultRiskPercent',
      label: 'Default Risk %',
      description: 'Default risk percentage for position sizing',
      category: 'trading',
      minLevel: 'learning',
      priority: 2,
      defaultValue: 2,
      type: 'number'
    },
    {
      id: 'showTutorialHints',
      label: 'Show Tutorial Hints',
      description: 'Display helpful hints throughout the app',
      category: 'display',
      minLevel: 'learning',
      priority: 3,
      defaultValue: true,
      type: 'boolean'
    },
    
    // Intermediate options (priority 4-6)
    {
      id: 'autoSaveCalculations',
      label: 'Auto-save Calculations',
      description: 'Automatically save position sizing calculations',
      category: 'trading',
      minLevel: 'import',
      priority: 4,
      defaultValue: true,
      type: 'boolean'
    },
    {
      id: 'chartTimeframe',
      label: 'Default Chart Timeframe',
      description: 'Default timeframe for charts and analysis',
      category: 'analysis',
      minLevel: 'import',
      priority: 5,
      defaultValue: '1D',
      type: 'select',
      options: [
        { value: '1H', label: '1 Hour' },
        { value: '4H', label: '4 Hours' },
        { value: '1D', label: '1 Day' },
        { value: '1W', label: '1 Week' }
      ]
    },
    {
      id: 'enableNotifications',
      label: 'Enable Notifications',
      description: 'Receive notifications for important events',
      category: 'display',
      minLevel: 'import',
      priority: 6,
      defaultValue: false,
      type: 'boolean'
    },
    
    // Advanced options (priority 7+)
    {
      id: 'apiConnections',
      label: 'API Connections',
      description: 'Manage external API connections',
      category: 'advanced',
      minLevel: 'broker',
      priority: 7,
      defaultValue: false,
      type: 'boolean'
    },
    {
      id: 'debugMode',
      label: 'Debug Mode',
      description: 'Enable debug logging and developer tools',
      category: 'advanced',
      minLevel: 'broker',
      priority: 8,
      defaultValue: false,
      type: 'boolean'
    },
    {
      id: 'customRules',
      label: 'Custom Trading Rules',
      description: 'Enable custom rule engine features',
      category: 'advanced',
      minLevel: 'broker',
      priority: 9,
      defaultValue: false,
      type: 'boolean'
    },
    {
      id: 'experimentalFeatures',
      label: 'Experimental Features',
      description: 'Enable experimental and beta features',
      category: 'advanced',
      minLevel: 'broker',
      priority: 10,
      defaultValue: false,
      type: 'boolean'
    }
  ];

  constructor(userLevel: UserExperienceLevel) {
    this.userLevel = userLevel;
  }

  /**
   * Get navigation items appropriate for the current user level (excludes hidden items)
   */
  getNavigationItems(): NavigationItem[] {
    const levelOrder = { learning: 0, import: 1, broker: 2 };
    const currentLevelOrder = levelOrder[this.userLevel];
    
    return this.NAVIGATION_ITEMS
      .filter(item => {
        const itemLevelOrder = levelOrder[item.minLevel];
        // Exclude hidden category from main navigation
        return itemLevelOrder <= currentLevelOrder && item.category !== 'hidden';
      })
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get navigation items visible to the current user level
   * Home is always visible, other items are level-specific only
   */
  getVisibleNavigationItems(): NavigationItem[] {
    return this.NAVIGATION_ITEMS.filter(item => {
      // Exclude hidden category items (these go to Settings)
      if (item.category === 'hidden') return false;
      
      // Always show core items (like Home)
      if (item.category === 'core') return true;
      
      // Show only items specifically assigned to current level
      return item.minLevel === this.userLevel;
    }).sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get hidden navigation items (only accessible via settings)
   */
  getHiddenNavigationItems(): NavigationItem[] {
    const levelOrder = { learning: 0, import: 1, broker: 2 };
    const currentLevelOrder = levelOrder[this.userLevel];
    
    return this.NAVIGATION_ITEMS
      .filter(item => {
        const itemLevelOrder = levelOrder[item.minLevel];
        return itemLevelOrder <= currentLevelOrder && item.category === 'hidden';
      })
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get navigation items by category for organized display
   */
  getNavigationByCategory(): Record<string, NavigationItem[]> {
    const items = this.getVisibleNavigationItems();
    const categories: Record<string, NavigationItem[]> = {
      core: [],
      learning: [],
      import: [],
      brokers: []
    };
    
    items.forEach(item => {
      if (categories[item.category]) {
        categories[item.category].push(item);
      }
    });
    
    return categories;
  }

  /**
   * Get navigation sections with proper labels and descriptions
   */
  getNavigationSections(): Array<{
    key: string;
    title: string;
    description: string;
    items: NavigationItem[];
    level: 'learning' | 'import' | 'broker';
  }> {
    const sections = [
      {
        key: 'learning',
        title: 'Learning & Education',
        description: 'Foundation tools for learning position sizing and risk management',
        items: this.getNavigationByCategory()['learning'] || [],
        level: 'learning' as const
      },
      {
        key: 'import',
        title: 'Data & Analysis',
        description: 'Import tools and analysis features for data-driven trading',
        items: this.getNavigationByCategory()['import'] || [],
        level: 'import' as const
      },
      {
        key: 'brokers',
        title: 'Broker Integration & Testing',
        description: 'Advanced broker connectivity and testing features',
        items: this.getNavigationByCategory()['brokers'] || [],
        level: 'broker' as const
      }
    ];

    return sections.filter(section => section.items.length > 0);
  }

  /**
   * Get configuration options with appropriate limits for user level
   */
  getConfigurationOptions(): ConfigurationOption[] {
    const levelOrder = { learning: 0, import: 1, broker: 2 };
    const currentLevelOrder = levelOrder[this.userLevel];
    const limit = this.CONFIG_LIMITS[this.userLevel];
    
    const availableOptions = this.CONFIGURATION_OPTIONS
      .filter(option => {
        const optionLevelOrder = levelOrder[option.minLevel];
        return optionLevelOrder <= currentLevelOrder;
      })
      .sort((a, b) => a.priority - b.priority);
    
    // Apply limit (unlimited for advanced users)
    return limit === Infinity ? availableOptions : availableOptions.slice(0, limit);
  }

  /**
   * Get the most relevant navigation items for the current user level
   */
  getPriorityNavigationItems(maxItems?: number): NavigationItem[] {
    const items = this.getNavigationItems();
    
    if (!maxItems) {
      // Default limits based on user level
      const defaultLimits = { learning: 4, import: 7, broker: Infinity };
      maxItems = defaultLimits[this.userLevel];
    }
    
    return maxItems === Infinity ? items : items.slice(0, maxItems);
  }

  /**
   * Initialize onboarding flow for new users
   */
  initializeOnboardingFlow(): OnboardingFlow {
    this.onboardingFlow = {
      step: 1,
      totalSteps: this.userLevel === 'learning' ? 4 : this.userLevel === 'import' ? 6 : 8,
      currentPage: '/',
      completedSteps: [],
      recommendedNext: this.getOnboardingRecommendations(),
      userLevel: this.userLevel
    };
    
    return this.onboardingFlow;
  }

  /**
   * Get onboarding recommendations based on user level
   */
  private getOnboardingRecommendations(): string[] {
    switch (this.userLevel) {
      case 'learning':
        return ['/', '/tutorial', '/visualizer'];
      case 'import':
        return ['/', '/tutorial', '/visualizer', '/options', '/interactive-analytics'];
      case 'broker':
        return ['/', '/tutorial', '/visualizer', '/options', '/pl-dashboard', '/analysis'];
      default:
        return ['/', '/tutorial'];
    }
  }

  /**
   * Update user level and recalculate available options
   */
  setUserLevel(newLevel: UserExperienceLevel): void {
    this.userLevel = newLevel;
    
    // Reset onboarding if level changes significantly
    if (this.onboardingFlow && this.onboardingFlow.userLevel !== newLevel) {
      this.onboardingFlow = null;
    }
  }

  /**
   * Check if a specific feature should be visible
   */
  shouldShowFeature(featureId: string): boolean {
    const item = this.NAVIGATION_ITEMS.find(item => item.feature === featureId);
    if (!item) return false;
    
    const levelOrder = { learning: 0, import: 1, broker: 2 };
    const currentLevelOrder = levelOrder[this.userLevel];
    const itemLevelOrder = levelOrder[item.minLevel];
    
    return itemLevelOrder <= currentLevelOrder;
  }

  /**
   * Get current configuration limits
   */
  getConfigurationLimits(): { current: number; max: number; level: UserExperienceLevel } {
    const availableOptions = this.getConfigurationOptions();
    const maxOptions = this.CONFIG_LIMITS[this.userLevel];
    
    return {
      current: availableOptions.length,
      max: maxOptions === Infinity ? 999 : maxOptions,
      level: this.userLevel
    };
  }

     /**
    * Determine if visualizer should be prioritized (for new traders)
    */
   shouldPrioritizeVisualizer(): boolean {
     return this.userLevel === 'learning' || 
            (this.onboardingFlow !== null && this.onboardingFlow.step <= 3);
   }

  /**
   * Get user level statistics
   */
  getUserLevelStats(): {
    level: UserExperienceLevel;
    availableFeatures: number;
    totalFeatures: number;
    configOptions: number;
    maxConfigOptions: number;
  } {
    const allItems = this.NAVIGATION_ITEMS;
    const availableItems = this.getNavigationItems();
    const configOptions = this.getConfigurationOptions();
    const maxConfig = this.CONFIG_LIMITS[this.userLevel];
    
    return {
      level: this.userLevel,
      availableFeatures: availableItems.length,
      totalFeatures: allItems.length,
      configOptions: configOptions.length,
      maxConfigOptions: maxConfig === Infinity ? 999 : maxConfig
    };
  }

  /**
   * Get debug navigation items
   */
  getDebugNavigationItems(): NavigationItem[] {
    return this.NAVIGATION_ITEMS.filter(item => item.category === 'debug');
  }

  /**
   * Get debug navigation items that are enabled via settings
   */
  getEnabledDebugNavigationItems(): NavigationItem[] {
    const debugItems = this.getDebugNavigationItems();
    
    return debugItems.filter(item => {
      switch (item.id) {
        case 'unified-dashboard':
          return loadSetting('showUnifiedDashboard') === 'true';
        case 'rule-engine':
          return loadSetting('showRuleEngine') === 'true';
        case 'legacy-dashboard':
          return loadSetting('showLegacyDashboard') === 'true';
        default:
          return false;
      }
    });
  }
}

export default NavigationController; 