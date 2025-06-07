/**
 * Educational Modules System - Interactive Learning Content for New Traders
 * Addresses the 85% new trader failure rate through structured educational content
 */

export type ModuleType = 'basic-options' | 'position-sizing' | 'risk-management' | 'market-fundamentals';
export type ContentType = 'text' | 'interactive' | 'quiz' | 'visualization' | 'calculation';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface LearningObjective {
  id: string;
  description: string;
  completed: boolean;
  required: boolean;
}

export interface ModuleContent {
  id: string;
  type: ContentType;
  title: string;
  content: string;
  interactiveComponent?: string; // Component name for interactive content
  visualizationData?: any; // Data for visualizations
  quizData?: QuizData;
  estimatedTimeMinutes: number;
  prerequisites: string[]; // IDs of required content
}

export interface QuizData {
  questions: QuizQuestion[];
  passingScore: number; // Percentage (0-100)
  allowRetries: boolean;
  explanation?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'numeric' | 'drag-drop';
  options?: string[]; // For multiple choice
  correctAnswer: string | number;
  explanation: string;
  points: number;
}

export interface EducationalModule {
  id: string;
  type: ModuleType;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  estimatedTimeMinutes: number;
  learningObjectives: LearningObjective[];
  content: ModuleContent[];
  finalAssessment?: QuizData;
  prerequisites: string[]; // IDs of required modules
  tags: string[];
  updatedAt: Date;
}

export interface ModuleProgress {
  moduleId: string;
  userId: string;
  startedAt: Date;
  completedAt?: Date;
  currentContentId: string;
  completedContent: string[];
  objectivesCompleted: string[];
  assessmentScores: { [assessmentId: string]: number };
  timeSpentMinutes: number;
  lastAccessed: Date;
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  modules: string[]; // Module IDs in order
  estimatedTimeHours: number;
  targetAudience: DifficultyLevel;
  skills: string[];
}

/**
 * Educational Modules Manager
 * Manages the interactive educational content system for new traders
 */
export default class EducationalModules {
  private modules: Map<string, EducationalModule> = new Map();
  private userProgress: Map<string, ModuleProgress[]> = new Map();
  private learningPaths: Map<string, LearningPath> = new Map();

  constructor() {
    this.initializeDefaultModules();
    this.initializeLearningPaths();
  }

  /**
   * Initialize default educational modules
   */
  private initializeDefaultModules(): void {
    // Basic Options Module
    const basicOptionsModule: EducationalModule = {
      id: 'basic-options',
      type: 'basic-options',
      title: 'Options Trading Fundamentals',
      description: 'Learn the basics of options trading, including calls, puts, and basic strategies',
      difficulty: 'beginner',
      estimatedTimeMinutes: 45,
      learningObjectives: [
        {
          id: 'understand-calls-puts',
          description: 'Understand the difference between calls and puts',
          completed: false,
          required: true
        },
        {
          id: 'option-pricing',
          description: 'Learn how options are priced (intrinsic vs time value)',
          completed: false,
          required: true
        },
        {
          id: 'basic-strategies',
          description: 'Master basic strategies: long call, long put, covered call',
          completed: false,
          required: true
        }
      ],
      content: [
        {
          id: 'options-intro',
          type: 'text',
          title: 'What Are Options?',
          content: 'Options are financial contracts that give you the right, but not the obligation, to buy or sell an asset at a specific price within a certain timeframe...',
          estimatedTimeMinutes: 10,
          prerequisites: []
        },
        {
          id: 'calls-puts-visualization',
          type: 'visualization',
          title: 'Calls vs Puts Visualization',
          content: 'Interactive visualization showing profit/loss profiles for calls and puts',
          interactiveComponent: 'CallsPutsVisualizer',
          visualizationData: {
            strikePrice: 100,
            stockPrice: 105,
            premium: 5,
            expirationDays: 30
          },
          estimatedTimeMinutes: 15,
          prerequisites: ['options-intro']
        },
        {
          id: 'options-quiz',
          type: 'quiz',
          title: 'Options Fundamentals Quiz',
          content: 'Test your understanding of options basics',
          quizData: {
            questions: [
              {
                id: 'q1',
                question: 'What gives the holder the right to buy a stock at a specific price?',
                type: 'multiple-choice',
                options: ['Call Option', 'Put Option', 'Stock', 'Bond'],
                correctAnswer: 'Call Option',
                explanation: 'A call option gives the holder the right to buy the underlying asset at the strike price.',
                points: 10
              },
              {
                id: 'q2',
                question: 'If you think a stock will go down, which option would you buy?',
                type: 'multiple-choice',
                options: ['Call Option', 'Put Option', 'Both', 'Neither'],
                correctAnswer: 'Put Option',
                explanation: 'Put options increase in value when the underlying stock price decreases.',
                points: 10
              }
            ],
            passingScore: 80,
            allowRetries: true,
            explanation: 'Understanding calls and puts is fundamental to options trading.'
          },
          estimatedTimeMinutes: 10,
          prerequisites: ['calls-puts-visualization']
        }
      ],
      prerequisites: [],
      tags: ['options', 'fundamentals', 'beginner'],
      updatedAt: new Date()
    };

    // Position Sizing Module
    const positionSizingModule: EducationalModule = {
      id: 'position-sizing',
      type: 'position-sizing',
      title: 'Position Sizing and Risk Management',
      description: 'Learn how to properly size your positions to manage risk and preserve capital',
      difficulty: 'beginner',
      estimatedTimeMinutes: 60,
      learningObjectives: [
        {
          id: 'risk-per-trade',
          description: 'Understand risk per trade concepts (1-2% rule)',
          completed: false,
          required: true
        },
        {
          id: 'position-sizing-formulas',
          description: 'Learn position sizing formulas and calculations',
          completed: false,
          required: true
        },
        {
          id: 'kelly-criterion',
          description: 'Understand the Kelly Criterion for optimal position sizing',
          completed: false,
          required: false
        }
      ],
      content: [
        {
          id: 'risk-management-intro',
          type: 'text',
          title: 'Why Position Sizing Matters',
          content: 'Position sizing is arguably the most important aspect of trading. It determines how much you risk on each trade and can make the difference between success and failure...',
          estimatedTimeMinutes: 15,
          prerequisites: []
        },
        {
          id: 'position-size-calculator',
          type: 'interactive',
          title: 'Interactive Position Size Calculator',
          content: 'Calculate your position size based on your account size, risk tolerance, and stop loss',
          interactiveComponent: 'PositionSizeCalculator',
          estimatedTimeMinutes: 20,
          prerequisites: ['risk-management-intro']
        },
        {
          id: 'kelly-visualization',
          type: 'visualization',
          title: 'Kelly Criterion Visualization',
          content: 'See how the Kelly Criterion optimizes position sizing based on win rate and risk/reward',
          interactiveComponent: 'KellyVisualization',
          visualizationData: {
            winRate: 0.6,
            avgWin: 100,
            avgLoss: 50,
            trials: 1000
          },
          estimatedTimeMinutes: 15,
          prerequisites: ['position-size-calculator']
        }
      ],
      prerequisites: [],
      tags: ['position-sizing', 'risk-management', 'beginner'],
      updatedAt: new Date()
    };

    // Risk Management Module
    const riskManagementModule: EducationalModule = {
      id: 'risk-management',
      type: 'risk-management',
      title: 'Comprehensive Risk Management',
      description: 'Advanced risk management techniques to protect your capital',
      difficulty: 'intermediate',
      estimatedTimeMinutes: 90,
      learningObjectives: [
        {
          id: 'portfolio-risk',
          description: 'Understand portfolio-level risk management',
          completed: false,
          required: true
        },
        {
          id: 'correlation-risk',
          description: 'Learn about correlation risk in positions',
          completed: false,
          required: true
        },
        {
          id: 'volatility-risk',
          description: 'Understand volatility risk and VIX implications',
          completed: false,
          required: false
        }
      ],
      content: [
        {
          id: 'portfolio-risk-intro',
          type: 'text',
          title: 'Portfolio Risk Management',
          content: 'Individual position risk is just the beginning. Portfolio-level risk management considers correlations, exposure limits, and overall risk...',
          estimatedTimeMinutes: 20,
          prerequisites: []
        },
        {
          id: 'correlation-matrix',
          type: 'visualization',
          title: 'Correlation Risk Visualization',
          content: 'Interactive correlation matrix showing how different positions might move together',
          interactiveComponent: 'CorrelationMatrix',
          estimatedTimeMinutes: 25,
          prerequisites: ['portfolio-risk-intro']
        },
        {
          id: 'vix-risk-analyzer',
          type: 'interactive',
          title: 'VIX and Volatility Risk',
          content: 'Analyze how VIX levels affect your option positions',
          interactiveComponent: 'VixRiskAnalyzer',
          estimatedTimeMinutes: 30,
          prerequisites: ['correlation-matrix']
        }
      ],
      prerequisites: ['position-sizing'],
      tags: ['risk-management', 'portfolio', 'intermediate'],
      updatedAt: new Date()
    };

    // Add modules to the system
    this.modules.set(basicOptionsModule.id, basicOptionsModule);
    this.modules.set(positionSizingModule.id, positionSizingModule);
    this.modules.set(riskManagementModule.id, riskManagementModule);
  }

  /**
   * Initialize learning paths
   */
  private initializeLearningPaths(): void {
    const beginnerPath: LearningPath = {
      id: 'new-trader-foundation',
      name: 'New Trader Foundation',
      description: 'Essential knowledge for new options traders',
      modules: ['basic-options', 'position-sizing'],
      estimatedTimeHours: 2,
      targetAudience: 'beginner',
      skills: ['options-basics', 'position-sizing', 'risk-management']
    };

    const comprehensivePath: LearningPath = {
      id: 'comprehensive-trader',
      name: 'Comprehensive Trader Education',
      description: 'Complete education path from beginner to intermediate',
      modules: ['basic-options', 'position-sizing', 'risk-management'],
      estimatedTimeHours: 3.5,
      targetAudience: 'intermediate',
      skills: ['options-basics', 'position-sizing', 'risk-management', 'portfolio-management']
    };

    this.learningPaths.set(beginnerPath.id, beginnerPath);
    this.learningPaths.set(comprehensivePath.id, comprehensivePath);
  }

  /**
   * Get all available modules
   */
  getModules(): EducationalModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get a specific module by ID
   */
  getModule(id: string): EducationalModule | undefined {
    return this.modules.get(id);
  }

  /**
   * Get modules filtered by difficulty level
   */
  getModulesByDifficulty(difficulty: DifficultyLevel): EducationalModule[] {
    return this.getModules().filter(module => module.difficulty === difficulty);
  }

  /**
   * Get modules by type
   */
  getModulesByType(type: ModuleType): EducationalModule[] {
    return this.getModules().filter(module => module.type === type);
  }

  /**
   * Get learning paths
   */
  getLearningPaths(): LearningPath[] {
    return Array.from(this.learningPaths.values());
  }

  /**
   * Get a specific learning path
   */
  getLearningPath(id: string): LearningPath | undefined {
    return this.learningPaths.get(id);
  }

  /**
   * Get recommended modules for a user based on their level
   */
  getRecommendedModules(userLevel: DifficultyLevel, completedModules: string[] = []): EducationalModule[] {
    const modules = this.getModules()
      .filter(module => !completedModules.includes(module.id))
      .filter(module => {
        // Include modules at user level and below
        if (userLevel === 'advanced') return true;
        if (userLevel === 'intermediate') return module.difficulty !== 'advanced';
        return module.difficulty === 'beginner';
      })
      .sort((a, b) => {
        // Sort by difficulty, then by estimated time
        const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
        if (difficultyOrder[a.difficulty] !== difficultyOrder[b.difficulty]) {
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        }
        return a.estimatedTimeMinutes - b.estimatedTimeMinutes;
      });

    return modules;
  }

  /**
   * Get user progress for all modules
   */
  getUserProgress(userId: string): ModuleProgress[] {
    return this.userProgress.get(userId) || [];
  }

  /**
   * Start a module for a user
   */
  startModule(userId: string, moduleId: string): ModuleProgress {
    const module = this.getModule(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    const progress: ModuleProgress = {
      moduleId,
      userId,
      startedAt: new Date(),
      currentContentId: module.content[0]?.id || '',
      completedContent: [],
      objectivesCompleted: [],
      assessmentScores: {},
      timeSpentMinutes: 0,
      lastAccessed: new Date()
    };

    const userProgressList = this.getUserProgress(userId);
    userProgressList.push(progress);
    this.userProgress.set(userId, userProgressList);

    return progress;
  }

  /**
   * Update progress for a specific content item
   */
  updateContentProgress(userId: string, moduleId: string, contentId: string, timeSpent: number = 0): void {
    const userProgressList = this.getUserProgress(userId);
    const moduleProgress = userProgressList.find(p => p.moduleId === moduleId);

    if (moduleProgress) {
      if (!moduleProgress.completedContent.includes(contentId)) {
        moduleProgress.completedContent.push(contentId);
      }
      moduleProgress.timeSpentMinutes += timeSpent;
      moduleProgress.lastAccessed = new Date();

      // Update current content to next uncompleted item
      const module = this.getModule(moduleId);
      if (module) {
        const nextContent = module.content.find(
          content => !moduleProgress.completedContent.includes(content.id)
        );
        if (nextContent) {
          moduleProgress.currentContentId = nextContent.id;
        } else {
          // All content completed
          moduleProgress.completedAt = new Date();
        }
      }
    }
  }

  /**
   * Check if a user has completed a module
   */
  isModuleCompleted(userId: string, moduleId: string): boolean {
    const progress = this.getUserProgress(userId).find(p => p.moduleId === moduleId);
    return progress?.completedAt !== undefined;
  }

  /**
   * Get completion percentage for a module
   */
  getModuleCompletionPercentage(userId: string, moduleId: string): number {
    const module = this.getModule(moduleId);
    const progress = this.getUserProgress(userId).find(p => p.moduleId === moduleId);

    if (!module || !progress) return 0;

    const totalContent = module.content.length;
    const completedContent = progress.completedContent.length;

    return totalContent > 0 ? (completedContent / totalContent) * 100 : 0;
  }

  /**
   * Get overall learning progress for a user
   */
  getOverallProgress(userId: string): {
    modulesStarted: number;
    modulesCompleted: number;
    totalTimeSpent: number;
    completionPercentage: number;
  } {
    const userProgressList = this.getUserProgress(userId);
    const totalModules = this.getModules().length;

    return {
      modulesStarted: userProgressList.length,
      modulesCompleted: userProgressList.filter(p => p.completedAt).length,
      totalTimeSpent: userProgressList.reduce((total, p) => total + p.timeSpentMinutes, 0),
      completionPercentage: totalModules > 0 ? (userProgressList.filter(p => p.completedAt).length / totalModules) * 100 : 0
    };
  }

  /**
   * Record quiz/assessment score
   */
  recordAssessmentScore(userId: string, moduleId: string, assessmentId: string, score: number): void {
    const userProgressList = this.getUserProgress(userId);
    const moduleProgress = userProgressList.find(p => p.moduleId === moduleId);

    if (moduleProgress) {
      moduleProgress.assessmentScores[assessmentId] = score;
      moduleProgress.lastAccessed = new Date();
    }
  }

  /**
   * Get next recommended content for a user
   */
  getNextContent(userId: string): {
    module: EducationalModule;
    content: ModuleContent;
    isNewModule: boolean;
  } | null {
    const userProgressList = this.getUserProgress(userId);

    // First, check for in-progress modules
    for (const progress of userProgressList) {
      if (!progress.completedAt) {
        const module = this.getModule(progress.moduleId);
        if (module) {
          const nextContent = module.content.find(
            content => !progress.completedContent.includes(content.id)
          );
          if (nextContent) {
            return { module, content: nextContent, isNewModule: false };
          }
        }
      }
    }

    // If no in-progress modules, suggest a new one
    const completedModuleIds = userProgressList
      .filter(p => p.completedAt)
      .map(p => p.moduleId);

    const recommendedModules = this.getRecommendedModules('beginner', completedModuleIds);
    if (recommendedModules.length > 0) {
      const module = recommendedModules[0];
      const firstContent = module.content[0];
      if (firstContent) {
        return { module, content: firstContent, isNewModule: true };
      }
    }

    return null;
  }
} 