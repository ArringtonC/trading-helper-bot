/**
 * Stock Screening Components Export Index
 * 
 * Centralized exports for all research-backed stock screening UI components
 * Built following UX research findings for optimal user experience
 */

// Core Components
export { default as StockCard } from './StockCard';
export { default as ResultsGrid } from './ResultsGrid';
export { default as ProgressiveDisclosure } from './ProgressiveDisclosure';
export { default as RiskIndicator } from './RiskIndicator';
export { default as GoalMatchIndicator } from './GoalMatchIndicator';

// Additional Component Variants
export { 
  ProgressiveDisclosureGroup,
  InlineDisclosure,
  StepDisclosure 
} from './ProgressiveDisclosure';

export { 
  RiskBadge,
  RiskChart 
} from './RiskIndicator';

export { 
  GoalMatchBadge,
  GoalMatchChart 
} from './GoalMatchIndicator';

// Research-based constants and utilities
export const RESEARCH_CONSTANTS = {
  // Performance improvements from research
  CARD_PERFORMANCE_IMPROVEMENT: 0.23, // 23% better for beginners
  GOAL_FIRST_BASIS_POINTS: 400, // 400+ basis points improvement
  PROGRESSIVE_DISCLOSURE_REDUCTION: 0.45, // 45% information overload reduction
  CONTEXT_LOSS_REDUCTION: 0.67, // 67% context loss reduction
  RETENTION_INCREASE: 0.42, // 42% retention increase
  
  // Visual hierarchy ratios
  TYPOGRAPHY_RATIO: 3, // 3:1 ratio for headers to body text
  
  // Mobile research findings
  ANDROID_COVERAGE: 0.89, // 89% Android users at 360px baseline
  COGNITIVE_LOAD_REDUCTION: 0.35, // 35% reduction with tab navigation
  
  // Color system (color-blind accessible)
  RISK_COLORS: {
    VERY_LOW: '#A5D796',
    LOW: '#C8E6A0', 
    MODERATE: '#F4E8A3',
    HIGH: '#F5B969',
    VERY_HIGH: '#B90D0D'
  },
  
  // Goal categories with research percentages
  GOAL_DISTRIBUTION: {
    INCOME_GENERATION: 0.32, // 32%
    GROWTH_SEEKING: 0.28, // 28%
    CAPITAL_PRESERVATION: 0.25, // 25%
    LEARNING_PRACTICE: 0.10, // 10%
    ACTIVE_TRADING: 0.05 // 5%
  },
  
  // Touch and accessibility standards
  TOUCH_TARGET_MIN: 44, // 44px minimum touch targets
  MOBILE_BASELINE: 360, // 360px mobile baseline
  
  // User experience thresholds
  GOAL_ALIGNMENT_THRESHOLD: 0.8, // >80% goal alignment accuracy target
  ACCOUNT_CLASSIFICATION_THRESHOLD: 0.95, // >95% account classification accuracy
  RESPONSE_TIME_TARGET: 2000 // <2 second response times (ms)
};

// Component configuration presets
export const COMPONENT_PRESETS = {
  // Beginner-friendly settings
  BEGINNER: {
    viewMode: 'cards',
    showProgressiveDisclosure: true,
    showGuidance: true,
    simplifiedFilters: true,
    largeTouch: true,
    verboseLabels: true
  },
  
  // Advanced user settings
  ADVANCED: {
    viewMode: 'table',
    showProgressiveDisclosure: false,
    showGuidance: false,
    simplifiedFilters: false,
    largeTouch: false,
    verboseLabels: false
  },
  
  // Mobile-optimized settings
  MOBILE: {
    viewMode: 'cards', // Always cards on mobile
    showProgressiveDisclosure: true,
    touchOptimized: true,
    hapticFeedback: true,
    swipeGestures: true,
    collapsedFilters: true
  }
};

// Utility functions for research-backed features
export const UTILS = {
  // Determine optimal view mode based on research
  getOptimalViewMode: (userLevel, isMobile) => {
    if (isMobile) return 'cards';
    return userLevel === 'beginner' ? 'cards' : 'table';
  },
  
  // Calculate goal alignment score
  calculateGoalAlignment: (stock, userGoals) => {
    // Implementation would use research-backed algorithms
    // This is a placeholder for the actual scoring logic
    return {
      score: 0.85, // Example score
      confidence: 0.75,
      factors: []
    };
  },
  
  // Risk level determination
  getRiskLevel: (riskScore) => {
    if (riskScore <= 2) return 'very-low';
    if (riskScore <= 4) return 'low';
    if (riskScore <= 6) return 'moderate';
    if (riskScore <= 8) return 'high';
    return 'very-high';
  },
  
  // Format numbers according to research findings
  formatters: {
    currency: (value) => new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value),
    
    percentage: (value) => new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 2
    }).format(value),
    
    compactNumber: (value) => {
      if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
      if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
      if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
      if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
      return `$${value.toLocaleString()}`;
    }
  },
  
  // Accessibility helpers
  accessibility: {
    announceToScreenReader: (message) => {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = message;
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
    },
    
    addHapticFeedback: (intensity = 10) => {
      if (navigator.vibrate) {
        navigator.vibrate(intensity);
      }
    }
  }
}; 