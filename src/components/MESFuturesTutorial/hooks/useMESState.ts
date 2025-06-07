import { useState, useEffect, useCallback } from 'react';
import { MESFutorialState, UserProfile, TutorialProgress, VirtualPortfolio, LearningPath, MESFeatureFlags } from '../types';

const defaultUserProfile: UserProfile = {
  id: 'default-user',
  name: 'Futures Trader',
  experienceLevel: 'beginner',
  joinDate: new Date(),
  preferences: {
    learningStyle: 'mixed',
    difficultyAdaptation: {
      autoAdjust: true,
      extraPractice: false,
      skipMastered: false,
      showAdvanced: false
    },
    riskTolerance: {
      level: 'moderate',
      maxPositionSize: 50,
      dailyLossLimit: 200
    },
    notifications: {
      learningMilestones: true,
      communityMessages: false,
      tradeSignals: true,
      riskAlerts: true
    }
  }
};

const defaultTutorialProgress: TutorialProgress = {
  overallProgress: 0,
  currentPath: 'comprehensive-mes-trading',
  nextMilestone: 'Complete MES Fundamentals',
  currentStep: 1,
  completedModules: [],
  achievements: [],
  learningStreak: 1
};

const defaultVirtualPortfolio: VirtualPortfolio = {
  id: 'default-portfolio',
  balance: 10000,
  startingBalance: 10000,
  totalReturn: 0,
  totalReturnPercent: 0,
  positions: [],
  tradeHistory: [],
  performance: {
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    avgWin: 0,
    avgLoss: 0,
    profitFactor: 0,
    maxDrawdown: 0
  }
};

const defaultLearningPath: LearningPath = {
  id: 'comprehensive-mes-trading',
  name: 'Comprehensive MES Trading',
  description: 'Master MES futures trading with research-backed strategies',
  difficulty: 'beginner',
  estimatedDuration: 8,
  modules: [
    'fundamentals',
    'ema-strategy', 
    'risk-management',
    'trading-sessions',
    'costs-taxes',
    'platform-selection',
    'psychology-discipline',
    'advanced-analysis'
  ]
};

const defaultFeatureFlags: MESFeatureFlags = {
  enhancedTutorial: true,
  realTimeData: false,
  communityFeatures: false,
  advancedAnalytics: false,
  psychologyAssessment: true,
  monteCarloSimulation: true,
  tradingSimulator: false,
  mentorshipProgram: false,
  strategyMarketplace: false,
  liveTrading: false
};

const STORAGE_KEY = 'mes-tutorial-state';

export const useMESState = () => {
  const [state, setState] = useState<MESFutorialState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          currentTab: 'dashboard',
          userProfile: { ...defaultUserProfile, ...parsed.userProfile },
          learningPath: { ...defaultLearningPath, ...parsed.learningPath },
          tutorialProgress: { ...defaultTutorialProgress, ...parsed.tutorialProgress },
          virtualPortfolio: { ...defaultVirtualPortfolio, ...parsed.virtualPortfolio }
        };
      }
    } catch (error) {
      console.warn('Failed to load saved tutorial state:', error);
    }
    
    return {
      currentTab: 'dashboard',
      userProfile: defaultUserProfile,
      learningPath: defaultLearningPath,
      tutorialProgress: defaultTutorialProgress,
      virtualPortfolio: defaultVirtualPortfolio
    };
  });

  // Save state to localStorage with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.warn('Failed to save tutorial state:', error);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [state]);

  const actions = {
    setCurrentTab: useCallback((tab: MESFutorialState['currentTab']) => {
      setState(prev => ({ ...prev, currentTab: tab }));
    }, []),

    updateUserProfile: useCallback((updates: Partial<UserProfile>) => {
      setState(prev => ({
        ...prev,
        userProfile: { ...prev.userProfile, ...updates }
      }));
    }, []),

    updateUserPreferences: useCallback((preferences: Partial<UserProfile['preferences']>) => {
      setState(prev => ({
        ...prev,
        userProfile: {
          ...prev.userProfile,
          preferences: { ...prev.userProfile.preferences, ...preferences }
        }
      }));
    }, []),

    setLearningPath: useCallback((learningPath: LearningPath) => {
      setState(prev => ({ ...prev, learningPath }));
    }, []),

    updateProgress: useCallback((updates: Partial<TutorialProgress>) => {
      setState(prev => ({
        ...prev,
        tutorialProgress: { ...prev.tutorialProgress, ...updates }
      }));
    }, []),

    completeModule: useCallback((moduleId: string) => {
      setState(prev => {
        const completedModules = [...prev.tutorialProgress.completedModules];
        if (!completedModules.includes(moduleId)) {
          completedModules.push(moduleId);
        }

        const totalModules = prev.learningPath.modules.length;
        const overallProgress = Math.round((completedModules.length / totalModules) * 100);

        return {
          ...prev,
          tutorialProgress: {
            ...prev.tutorialProgress,
            completedModules,
            overallProgress,
            learningStreak: prev.tutorialProgress.learningStreak + 1
          }
        };
      });
    }, []),

    addAchievement: useCallback((achievement: Omit<TutorialProgress['achievements'][0], 'unlockedAt'>) => {
      setState(prev => ({
        ...prev,
        tutorialProgress: {
          ...prev.tutorialProgress,
          achievements: [
            ...prev.tutorialProgress.achievements,
            { ...achievement, unlockedAt: new Date() }
          ]
        }
      }));
    }, []),

    updatePortfolio: useCallback((updates: Partial<VirtualPortfolio>) => {
      setState(prev => ({
        ...prev,
        virtualPortfolio: { ...prev.virtualPortfolio, ...updates }
      }));
    }, []),

    addTrade: useCallback((trade: VirtualPortfolio['tradeHistory'][0]) => {
      setState(prev => ({
        ...prev,
        virtualPortfolio: {
          ...prev.virtualPortfolio,
          tradeHistory: [...prev.virtualPortfolio.tradeHistory, trade]
        }
      }));
    }, []),

    updatePosition: useCallback((positionId: string, updates: Partial<VirtualPortfolio['positions'][0]>) => {
      setState(prev => ({
        ...prev,
        virtualPortfolio: {
          ...prev.virtualPortfolio,
          positions: prev.virtualPortfolio.positions.map(pos =>
            pos.id === positionId ? { ...pos, ...updates } : pos
          )
        }
      }));
    }, []),

    resetState: useCallback(() => {
      setState({
        currentTab: 'dashboard',
        userProfile: defaultUserProfile,
        learningPath: defaultLearningPath,
        tutorialProgress: defaultTutorialProgress,
        virtualPortfolio: defaultVirtualPortfolio
      });
      localStorage.removeItem(STORAGE_KEY);
    }, [])
  };

  return [state, actions, defaultFeatureFlags] as const;
}; 