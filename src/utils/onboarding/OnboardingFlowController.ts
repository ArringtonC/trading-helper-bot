import { UserExperienceLevel } from '../ux/UXLayersController';

export type OnboardingFlowType = 'newTrader' | 'experienced';

export interface OnboardingStep {
  id: string;
  path: string;
  title: string;
  description: string;
  isRequired: boolean;
  estimatedTime: string;
  completionCriteria: string[];
}

export interface OnboardingFlowConfig {
  entryPoint: string;
  sequence: OnboardingStep[];
  skipOptions: boolean;
  maxComplexity: 'basic' | 'intermediate' | 'advanced';
  description: string;
}

export interface OnboardingProgress {
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  currentPath: string;
  flowType: OnboardingFlowType;
  userLevel: UserExperienceLevel;
  startedAt: Date;
  lastUpdated: Date;
}

/**
 * OnboardingFlowController - Manages the research-backed onboarding flow
 * Implements visualizer-first approach for new traders to address the 85% failure rate
 */
export class OnboardingFlowController {
  private static readonly STORAGE_KEY = 'onboarding_progress';
  
  // Research-backed onboarding flows
  private readonly ONBOARDING_FLOWS: Record<OnboardingFlowType, OnboardingFlowConfig> = {
    newTrader: {
      entryPoint: '/visualizer',
      description: 'Visualizer-first approach for new traders to reduce the 85% failure rate due to education gaps',
      skipOptions: false,
      maxComplexity: 'basic',
      sequence: [
        {
          id: 'risk-assessment',
          path: '/assessment-test',
          title: '📊 Quick Risk Assessment',
          description: 'Understand your trading profile and risk tolerance',
          isRequired: true,
          estimatedTime: '3-5 minutes',
          completionCriteria: ['assessment_completed', 'risk_profile_determined']
        },
        {
          id: 'basic-concepts-tutorial',
          path: '/tutorial',
          title: '🎮 Interactive Tutorial',
          description: 'Learn position sizing fundamentals through gamified lessons',
          isRequired: true,
          estimatedTime: '10-15 minutes',
          completionCriteria: ['tutorial_completed', 'position_sizing_understood']
        },
        {
          id: 'strategy-visualizer',
          path: '/visualizer',
          title: '📈 Strategy Visualizer (Primary Entry)',
          description: 'Visualize trading strategies and understand risk/reward profiles',
          isRequired: true,
          estimatedTime: '15-20 minutes',
          completionCriteria: ['visualizer_explored', 'strategy_created', 'risk_understood']
        },
        {
          id: 'position-calculator',
          path: '/',
          title: '🎯 Position Size Calculator',
          description: 'Calculate optimal position sizes for your trades',
          isRequired: true,
          estimatedTime: '10-15 minutes',
          completionCriteria: ['position_calculated', 'risk_rules_set']
        },
        {
          id: 'educational-modules',
          path: '/education',
          title: '📚 Educational Center',
          description: 'Comprehensive learning modules for trading concepts',
          isRequired: false,
          estimatedTime: '20-30 minutes',
          completionCriteria: ['module_completed', 'knowledge_verified']
        }
      ]
    },
    
    experienced: {
      entryPoint: '/dashboard',
      description: 'Streamlined setup for experienced traders',
      skipOptions: true,
      maxComplexity: 'advanced',
      sequence: [
        {
          id: 'account-setup',
          path: '/settings',
          title: '⚙️ Account Configuration',
          description: 'Configure your trading account and preferences',
          isRequired: true,
          estimatedTime: '5-10 minutes',
          completionCriteria: ['account_configured', 'preferences_set']
        },
        {
          id: 'risk-profile-config',
          path: '/',
          title: '🎯 Risk Profile Setup',
          description: 'Set up advanced risk management parameters',
          isRequired: true,
          estimatedTime: '5-10 minutes',
          completionCriteria: ['risk_profile_configured', 'limits_set']
        },
        {
          id: 'advanced-calculator',
          path: '/options',
          title: '📊 Advanced Options Tools',
          description: 'Access sophisticated options trading and analysis tools',
          isRequired: false,
          estimatedTime: '10-15 minutes',
          completionCriteria: ['tools_explored', 'strategy_configured']
        },
        {
          id: 'live-trading-setup',
          path: '/unified-dashboard',
          title: '📈 Live Trading Dashboard',
          description: 'Set up real-time trading dashboard and analytics',
          isRequired: false,
          estimatedTime: '10-15 minutes',
          completionCriteria: ['dashboard_configured', 'analytics_enabled']
        }
      ]
    }
  };

  /**
   * Determine appropriate onboarding flow based on user assessment
   */
  determineOnboardingFlow(
    userLevel: UserExperienceLevel,
    tradingExperience: number = 0,
    hasCompletedOnboarding: boolean = false
  ): OnboardingFlowType {
    // If user has already completed onboarding, use experienced flow
    if (hasCompletedOnboarding) {
      return 'experienced';
    }
    
    // New traders (beginners) get the visualizer-first approach
    if (userLevel === 'beginner' || tradingExperience < 1) {
      return 'newTrader';
    }
    
    // Intermediate and advanced users get streamlined flow
    return 'experienced';
  }

  /**
   * Initialize onboarding flow for a user
   */
  initializeOnboarding(
    userLevel: UserExperienceLevel,
    tradingExperience: number = 0,
    hasCompletedOnboarding: boolean = false
  ): OnboardingProgress {
    const flowType = this.determineOnboardingFlow(userLevel, tradingExperience, hasCompletedOnboarding);
    const flow = this.ONBOARDING_FLOWS[flowType];
    
    const progress: OnboardingProgress = {
      currentStep: 0,
      totalSteps: flow.sequence.length,
      completedSteps: [],
      currentPath: flow.entryPoint,
      flowType,
      userLevel,
      startedAt: new Date(),
      lastUpdated: new Date()
    };
    
    this.saveProgress(progress);
    return progress;
  }

  /**
   * Get current onboarding progress
   */
  getProgress(): OnboardingProgress | null {
    try {
      const stored = localStorage.getItem(OnboardingFlowController.STORAGE_KEY);
      if (!stored) return null;
      
      const progress = JSON.parse(stored);
      // Convert date strings back to Date objects
      progress.startedAt = new Date(progress.startedAt);
      progress.lastUpdated = new Date(progress.lastUpdated);
      
      return progress;
    } catch (error) {
      console.error('Error loading onboarding progress:', error);
      return null;
    }
  }

  /**
   * Save onboarding progress
   */
  private saveProgress(progress: OnboardingProgress): void {
    try {
      localStorage.setItem(OnboardingFlowController.STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving onboarding progress:', error);
    }
  }

  /**
   * Mark a step as completed
   */
  completeStep(stepId: string): OnboardingProgress | null {
    const progress = this.getProgress();
    if (!progress) return null;
    
    if (!progress.completedSteps.includes(stepId)) {
      progress.completedSteps.push(stepId);
      progress.lastUpdated = new Date();
      
      // Update current step if this was the current step
      const flow = this.ONBOARDING_FLOWS[progress.flowType];
      const stepIndex = flow.sequence.findIndex(step => step.id === stepId);
      if (stepIndex >= 0 && stepIndex === progress.currentStep) {
        progress.currentStep = Math.min(progress.currentStep + 1, flow.sequence.length);
      }
      
      this.saveProgress(progress);
    }
    
    return progress;
  }

  /**
   * Get the next recommended step
   */
  getNextStep(): OnboardingStep | null {
    const progress = this.getProgress();
    if (!progress) return null;
    
    const flow = this.ONBOARDING_FLOWS[progress.flowType];
    
    // Find the next incomplete required step
    for (const step of flow.sequence) {
      if (!progress.completedSteps.includes(step.id) && step.isRequired) {
        return step;
      }
    }
    
    // If all required steps are done, find next optional step
    for (const step of flow.sequence) {
      if (!progress.completedSteps.includes(step.id)) {
        return step;
      }
    }
    
    return null; // All steps completed
  }

  /**
   * Get current onboarding flow configuration
   */
  getCurrentFlow(): OnboardingFlowConfig | null {
    const progress = this.getProgress();
    if (!progress) return null;
    
    return this.ONBOARDING_FLOWS[progress.flowType];
  }

  /**
   * Check if onboarding is complete
   */
  isOnboardingComplete(): boolean {
    const progress = this.getProgress();
    if (!progress) return false;
    
    const flow = this.ONBOARDING_FLOWS[progress.flowType];
    const requiredSteps = flow.sequence.filter(step => step.isRequired);
    
    return requiredSteps.every(step => progress.completedSteps.includes(step.id));
  }

  /**
   * Get onboarding completion percentage
   */
  getCompletionPercentage(): number {
    const progress = this.getProgress();
    if (!progress) return 0;
    
    const flow = this.ONBOARDING_FLOWS[progress.flowType];
    const requiredSteps = flow.sequence.filter(step => step.isRequired);
    const completedRequired = requiredSteps.filter(step => 
      progress.completedSteps.includes(step.id)
    ).length;
    
    return Math.round((completedRequired / requiredSteps.length) * 100);
  }

  /**
   * Reset onboarding progress
   */
  resetOnboarding(): void {
    localStorage.removeItem(OnboardingFlowController.STORAGE_KEY);
  }

  /**
   * Get entry point for new users based on their profile
   */
  getEntryPoint(userLevel: UserExperienceLevel, tradingExperience: number = 0): string {
    const flowType = this.determineOnboardingFlow(userLevel, tradingExperience, false);
    return this.ONBOARDING_FLOWS[flowType].entryPoint;
  }

  /**
   * Check if visualizer should be prioritized for this user
   */
  shouldPrioritizeVisualizer(userLevel: UserExperienceLevel, tradingExperience: number = 0): boolean {
    const flowType = this.determineOnboardingFlow(userLevel, tradingExperience, false);
    return flowType === 'newTrader';
  }

  /**
   * Get all available flows (for admin/testing purposes)
   */
  getAllFlows(): Record<OnboardingFlowType, OnboardingFlowConfig> {
    return this.ONBOARDING_FLOWS;
  }
} 