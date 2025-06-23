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
  category: 'core' | 'trading' | 'analysis' | 'broker' | 'debug' | 'learning' | 'import' | 'brokers' | 'hidden' | 'stock-picking' | 'options' | 'management' | 'futures' | 'setup';
  description?: string;
  isNew?: boolean;
  requiresAccount?: boolean;
}

export interface ConfigurationOption {
  id: string;
  label: string;
  description: string;
  category: 'display' | 'trading' | 'analysis' | 'broker';
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

    // LEARNING & TOOLS SECTION
    {
      id: 'tutorial',
      path: '/tutorial',
      label: '🎮 Interactive Tutorial',
      feature: 'tutorial',
      minLevel: 'learning',
      priority: 2,
      category: 'learning',
      description: 'Learn position sizing through interactive lessons'
    },
    {
      id: 'trading-tutorials',
      path: '/tutorials',
      label: '🎓 Trading Tutorials',
      feature: 'trading-tutorials',
      minLevel: 'learning',
      priority: 3,
      category: 'learning',
      description: 'Comprehensive tutorials: NVDA options, stacking, naked calls, and MES futures',
      isNew: true
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
      id: 'educational-dashboard',
      path: '/education',
      label: '✨ Educational Dashboard',
      feature: 'educational-dashboard',
      minLevel: 'learning',
      priority: 5,
      category: 'learning',
      description: 'Comprehensive educational resources and learning dashboard'
    },
    {
      id: 'assessment-test',
      path: '/assessment-test',
      label: '🧪 Assessment Test',
      feature: 'assessment-test',
      minLevel: 'learning',
      priority: 6,
      category: 'learning',
      description: 'User experience assessment test'
    },

    // STOCK PICKING SECTION
    {
      id: 'quick-picks',
      path: '/quick-picks',
      label: '🚀 Quick Picks - Get 5 Best Stocks',
      feature: 'quick-picks',
      minLevel: 'learning',
      priority: 10,
      category: 'stock-picking',
      description: 'AI-powered stock selection to get the 5 best stocks for your goals',
      isNew: true
    },
    {
      id: 'sp500-demo',
      path: '/sp500-demo',
      label: '📈 Market Data & Analysis',
      feature: 'sp500-demo',
      minLevel: 'learning',
      priority: 11,
      category: 'stock-picking',
      description: 'Real-time S&P 500 charts and market news - Premium Feature',
      isNew: true
    },
    {
      id: 'advanced-screening',
      path: '/advanced-screening',
      label: '🔍 AI Stock Screener',
      feature: 'advanced-screening',
      minLevel: 'import',
      priority: 12,
      category: 'stock-picking',
      description: 'Comprehensive stock screening with technical, fundamental, and risk analysis',
      isNew: true
    },
    {
      id: 'curated-lists',
      path: '/curated-lists',
      label: '⭐ Curated Stock Lists',
      feature: 'curated-lists',
      minLevel: 'import',
      priority: 13,
      category: 'stock-picking',
      description: 'AI-powered stock curation using Goldman Sachs "Rule of 10" with 4.5% outperformance',
      isNew: true
    },
    {
      id: 'template-matching',
      path: '/template-matching',
      label: '🧬 Template Matching',
      feature: 'template-matching',
      minLevel: 'import',
      priority: 14,
      category: 'stock-picking',
      description: 'AI-powered goal-to-stock matching with genetic algorithms (28.41% returns)',
      isNew: true
    },
    {
      id: 'watchlist',
      path: '/watchlist',
      label: '⭐ My Watchlist',
      feature: 'watchlist',
      minLevel: 'import',
      priority: 15,
      category: 'stock-picking',
      description: 'Personal watchlist for tracking stocks and opportunities'
    },
    {
      id: 'sp500-professional',
      path: '/sp500-professional',
      label: '📊 Professional Terminal',
      feature: 'sp500-professional',
      minLevel: 'import',
      priority: 16,
      category: 'stock-picking',
      description: 'Advanced professional trading dashboard with Bloomberg-style terminal, real-time data, and comprehensive market analysis',
      isNew: true
    },

    // OPTIONS SECTION
    {
      id: 'options-trading',
      path: '/options',
      label: '📊 Options Database',
      feature: 'options-trading',
      minLevel: 'import',
      priority: 20,
      category: 'options',
      description: 'Advanced options trading tools and analysis'
    },
    {
      id: 'visualizer',
      path: '/visualizer',
      label: '🎯 Strategy Visualizer',
      feature: 'strategy-visualizer',
      minLevel: 'learning',
      priority: 21,
      category: 'options',
      description: 'Visualize trading strategies and outcomes'
    },
    {
      id: 'ai-analysis',
      path: '/analysis',
      label: '🤖 AI Trade Analysis',
      feature: 'ai-analysis',
      minLevel: 'broker',
      priority: 22,
      category: 'options',
      description: 'AI-powered market analysis and insights'
    },
    {
      id: 'interactive-analytics',
      path: '/interactive-analytics',
      label: '📈 Interactive Analytics',
      feature: 'interactive-analytics',
      minLevel: 'import',
      priority: 23,
      category: 'options',
      description: 'Interactive charts and analytics dashboard'
    },
    {
      id: 'trade-screener',
      path: '/trade-screener',
      label: '⚡ Trade Screener',
      feature: 'trade-screener',
      minLevel: 'import',
      priority: 24,
      category: 'options',
      description: 'Advanced trade screening and filtering tools'
    },

    // RISK & POSITION MANAGEMENT SECTION
    {
      id: 'position-sizing-foundation',
      path: '/position-sizing',
      label: '🎯 Position Sizing Tool',
      feature: 'position-sizing-foundation',
      minLevel: 'learning',
      priority: 30,
      category: 'management',
      description: 'Interactive position sizing calculator and education'
    },
    {
      id: 'goal-sizing-wizard',
      path: '/goal-sizing',
      label: '🧭 Goal Sizing Wizard',
      feature: 'goal-sizing-wizard',
      minLevel: 'import',
      priority: 31,
      category: 'management',
      description: 'Goal-driven position sizing wizard for optimal risk management'
    },
    {
      id: 'risk-management',
      path: '/risk-management',
      label: '🛡️ Risk Management',
      feature: 'risk-management',
      minLevel: 'import',
      priority: 32,
      category: 'management',
      description: 'Comprehensive portfolio risk assessment with five-factor analysis and automated filtering',
      isNew: true
    },
    {
      id: 'weekend-gap-risk',
      path: '/weekend-gap-risk',
      label: '⚡ Weekend Gap Risk',
      feature: 'weekend-gap-risk',
      minLevel: 'import',
      priority: 33,
      category: 'management',
      description: 'Analyze and manage weekend gap risk in your positions'
    },
    {
      id: 'account-classification',
      path: '/account-classification',
      label: '🎯 Account Classification',
      feature: 'account-classification',
      minLevel: 'import',
      priority: 34,
      category: 'management',
      description: 'Intelligent account level assessment with 95%+ accuracy and regulatory compliance',
      isNew: true
    },

    // FUTURES & ADVANCED SECTION
    {
      id: 'mes-futures-tutorial',
      path: '/mes-futures-tutorial',
      label: '📚 MES Futures Tutorial',
      feature: 'mes-futures-tutorial',
      minLevel: 'import',
      priority: 40,
      category: 'futures',
      description: 'Comprehensive tutorial for MES futures trading'
    },
    {
      id: 'pl-dashboard',
      path: '/pl-dashboard',
      label: '💰 P&L Dashboard',
      feature: 'pl-dashboard',
      minLevel: 'broker',
      priority: 41,
      category: 'futures',
      description: 'Profit and loss dashboard for tracking performance'
    },
    {
      id: 'unified-dashboard',
      path: '/unified-dashboard',
      label: '📊 Unified Dashboard',
      feature: 'unified-dashboard',
      minLevel: 'import',
      priority: 42,
      category: 'futures',
      description: 'Unified dashboard for comprehensive trading overview'
    },
    {
      id: 'broker-sync',
      path: '/broker-sync',
      label: '🔄 Broker Sync',
      feature: 'broker-sync',
      minLevel: 'broker',
      priority: 43,
      category: 'futures',
      description: 'Synchronize data across multiple brokers'
    },
    {
      id: 'ibkr-api-demo',
      path: '/ibkr-api-demo',
      label: '🔗 IBKR API Demo',
      feature: 'ibkr-api-demo',
      minLevel: 'broker',
      priority: 44,
      category: 'futures',
      description: 'Interactive Brokers API demonstration'
    },

    // IMPORT & SETUP SECTION
    {
      id: 'direct-import',
      path: '/import/direct',
      label: '📥 Direct Import',
      feature: 'direct-import',
      minLevel: 'import',
      priority: 50,
      category: 'setup',
      description: 'Direct import functionality for trading data'
    },
    {
      id: 'import-analyze',
      path: '/import-analyze',
      label: '📊 Import Analysis',
      feature: 'import-analyze',
      minLevel: 'import',
      priority: 51,
      category: 'setup',
      description: 'Import and analyze trading data'
    },
    {
      id: 'import-to-database',
      path: '/import',
      label: '💾 Import to Database',
      feature: 'import-to-database',
      minLevel: 'import',
      priority: 52,
      category: 'setup',
      description: 'Import trading data to database for analysis'
    },
    {
      id: 'validation-dashboard',
      path: '/validation-dashboard',
      label: '✅ Validation Dashboard',
      feature: 'validation-dashboard',
      minLevel: 'import',
      priority: 53,
      category: 'setup',
      description: 'Comprehensive platform effectiveness validation with backtesting, A/B testing, and research claim verification',
      isNew: true
    },

    // HIDDEN/DEBUG PAGES - Only accessible via settings or direct URL
    {
      id: 'volatility-dashboard',
      path: '/volatility-demo',
      label: '📊 Volatility Dashboard',
      feature: 'volatility-dashboard',
      minLevel: 'broker',
      priority: 98,
      category: 'hidden',
      description: 'Advanced volatility analysis dashboard'
    },
    {
      id: 'rule-engine',
      path: '/rule-engine-demo',
      label: '⚙️ Rule Engine',
      feature: 'rule-engine',
      minLevel: 'broker',
      priority: 99,
      category: 'hidden',
      description: 'Create custom trading rules and automation'
    },
    {
      id: 'legacy-dashboard',
      path: '/dashboard',
      label: '🔧 Legacy Dashboard',
      feature: 'legacy-dashboard',
      minLevel: 'broker',
      priority: 100,
      category: 'hidden',
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
      category: 'broker',
      minLevel: 'broker',
      priority: 7,
      defaultValue: false,
      type: 'boolean'
    },
    {
      id: 'debugMode',
      label: 'Debug Mode',
      description: 'Enable debug logging and developer tools',
      category: 'broker',
      minLevel: 'broker',
      priority: 8,
      defaultValue: false,
      type: 'boolean'
    },
    {
      id: 'customRules',
      label: 'Custom Trading Rules',
      description: 'Enable custom rule engine features',
      category: 'broker',
      minLevel: 'broker',
      priority: 9,
      defaultValue: false,
      type: 'boolean'
    },
    {
      id: 'experimentalFeatures',
      label: 'Experimental Features',
      description: 'Enable experimental and beta features',
      category: 'broker',
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
      'stock-picking': [],
      options: [],
      management: [],
      futures: [],
      import: [],
      setup: [],
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
    const categories = this.getNavigationByCategory();
    
    const sections = [
      {
        key: 'learning',
        title: 'Learning & Education',
        description: 'Foundation tools for learning position sizing and risk management',
        items: categories['learning'] || [],
        level: 'learning' as const
      },
      {
        key: 'stock-picking',
        title: 'Stock Picking',
        description: 'AI-powered stock selection, analysis, and market research tools',
        items: categories['stock-picking'] || [],
        level: 'import' as const
      },
      {
        key: 'options',
        title: 'Options',
        description: 'Options trading tools, analysis, and strategy visualization',
        items: categories['options'] || [],
        level: 'import' as const
      },
      {
        key: 'management',
        title: 'Risk & Position Management',
        description: 'Risk assessment, position sizing, and goal management tools',
        items: categories['management'] || [],
        level: 'import' as const
      },
      {
        key: 'futures',
        title: 'Futures & Advanced',
        description: 'Advanced trading tools, futures tutorials, and broker integration',
        items: categories['futures'] || [],
        level: 'broker' as const
      },
      {
        key: 'setup',
        title: 'Import & Setup',
        description: 'Data import, setup, and configuration tools',
        items: categories['setup'] || [],
        level: 'import' as const
      },
      {
        key: 'brokers',
        title: 'Broker Integration & Testing',
        description: 'Advanced broker connectivity and testing features',
        items: categories['brokers'] || [],
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