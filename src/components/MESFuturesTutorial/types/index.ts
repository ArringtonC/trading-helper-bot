// Core Tutorial Types
export interface MESFutorialProps {
  onComplete?: () => void;
  onNext?: () => void;
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
  enableEnhancedFeatures?: boolean; // Feature flag for gradual rollout
}

// Legacy Tutorial Props (separate interface for clarity)
export interface MESFuturesTutorialProps {
  onComplete?: () => void;
  onNext?: () => void;
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
}

export interface MESFutorialState {
  currentTab: 'dashboard' | 'learn' | 'practice' | 'community' | 'settings' | 'analysis';
  userProfile: UserProfile;
  learningPath: LearningPath;
  tutorialProgress: TutorialProgress;
  virtualPortfolio: VirtualPortfolio;
}

// User Profile & Progress
export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  joinDate: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  difficultyAdaptation: {
    autoAdjust: boolean;
    extraPractice: boolean;
    skipMastered: boolean;
    showAdvanced: boolean;
  };
  riskTolerance: {
    level: 'conservative' | 'moderate' | 'aggressive';
    maxPositionSize: number; // percentage
    dailyLossLimit: number; // dollar amount or percentage
  };
  notifications: {
    learningMilestones: boolean;
    communityMessages: boolean;
    tradeSignals: boolean;
    riskAlerts: boolean;
  };
}

export interface TutorialProgress {
  overallProgress: number; // percentage
  currentPath: string;
  nextMilestone: string;
  currentStep: number;
  completedModules: string[];
  currentModule?: string;
  achievements: Achievement[];
  learningStreak: number; // days
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  category: 'learning' | 'trading' | 'community' | 'milestone';
}

// Learning Modules
export interface LearningModule {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutes
  prerequisites: string[];
  lessons: Lesson[];
  quiz?: Quiz;
  status: 'locked' | 'available' | 'in-progress' | 'completed';
  progress: number; // percentage
}

export interface Lesson {
  id: string;
  title: string;
  content: LessonContent;
  interactiveElements: InteractiveElement[];
  estimatedTime: number;
  status: 'not-started' | 'in-progress' | 'completed';
}

export interface LessonContent {
  type: 'text' | 'video' | 'interactive' | 'quiz';
  data: any; // Flexible content structure
  supportingMaterials?: SupportingMaterial[];
}

export interface SupportingMaterial {
  type: 'document' | 'link' | 'video' | 'chart';
  title: string;
  url: string;
  description?: string;
}

export interface InteractiveElement {
  type: 'calculator' | 'simulator' | 'assessment' | 'chart' | 'quiz';
  config: any; // Element-specific configuration
}

export interface Quiz {
  id: string;
  questions: QuizQuestion[];
  passingScore: number;
  attempts: QuizAttempt[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'scenario-based';
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  category: string;
}

export interface QuizAttempt {
  id: string;
  startedAt: Date;
  completedAt?: Date;
  score: number;
  answers: QuizAnswer[];
}

export interface QuizAnswer {
  questionId: string;
  selectedAnswer: string | number;
  isCorrect: boolean;
  timeSpent: number; // seconds
}

// Learning Paths
export interface LearningPath {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // hours
  modules: string[]; // module IDs in order
  prerequisites?: string[];
  certificateAwarded?: boolean;
}

// Virtual Portfolio & Trading
export interface VirtualPortfolio {
  id: string;
  balance: number;
  startingBalance: number;
  totalReturn: number;
  totalReturnPercent: number;
  positions: VirtualPosition[];
  tradeHistory: VirtualTrade[];
  performance: PerformanceMetrics;
}

export interface VirtualPosition {
  id: string;
  symbol: string;
  contracts: number;
  entryPrice: number;
  entryDate: Date;
  currentPrice: number;
  unrealizedPL: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface VirtualTrade {
  id: string;
  symbol: string;
  type: 'long' | 'short';
  contracts: number;
  entryPrice: number;
  exitPrice: number;
  entryDate: Date;
  exitDate: Date;
  realizedPL: number;
  commissions: number;
  strategy: string;
  notes?: string;
}

export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpeRatio?: number;
  calmarRatio?: number;
}

// Market Data & Analysis
export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: Date;
  technicalIndicators: TechnicalIndicators;
  marketRegime: MarketRegime;
}

export interface TechnicalIndicators {
  ema20: number;
  ema50: number;
  rsi?: number;
  macd?: {
    macd: number;
    signal: number;
    histogram: number;
  };
  atr?: number;
  volatility: number;
}

export interface MarketRegime {
  type: 'trending-up' | 'trending-down' | 'sideways';
  confidence: number;
  duration: number; // days
  expectedContinuation: number; // days
}

export interface TradeSignal {
  type: 'LONG' | 'SHORT';
  strength: number; // 0-1
  entry: number;
  stopLoss: number;
  target: number;
  riskReward: number;
  confidence: number; // 0-1
  timestamp: Date;
  reasoning: string;
}

// Scenario Analysis & Backtesting
export interface ScenarioParameters {
  startingCapital: number;
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  timePeriod: [Date, Date];
  marketConditions: 'all' | 'bull' | 'bear' | 'sideways';
  monteCarloRuns: number;
  customParameters?: Record<string, any>;
}

export interface MonteCarloResults {
  totalRuns: number;
  profitableRuns: number;
  profitProbability: number;
  expectedReturn: number;
  expectedReturnStd: number;
  maxDrawdown: number;
  maxDrawdownStd: number;
  winRate: number;
  winRateStd: number;
  percentileResults: {
    p5: number;
    p25: number;
    p50: number;
    p75: number;
    p95: number;
  };
  distributions: {
    returns: number[];
    drawdowns: number[];
    winRates: number[];
  };
}

export interface HistoricalYear {
  year: number;
  totalTrades: number;
  winningTrades: number;
  winRate: number;
  totalPoints: number;
  grossProfit: number;
  commissions: number;
  netProfit: number;
  endBalance: number;
  annualReturn: number;
  maxDrawdown: number;
  spyReturn: number;
  majorEvents: string[];
  scaledNetProfit?: number;
  contractsUsed?: number;
}

// Community Features
export interface CommunityMember {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  joinDate: Date;
  reputation: number;
  badges: Badge[];
  isMentor: boolean;
  isOnline: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
  category: 'learning' | 'community' | 'trading' | 'achievement';
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  members: CommunityMember[];
  maxMembers: number;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  meetingSchedule?: MeetingSchedule;
  currentTopic?: string;
  isPublic: boolean;
  createdAt: Date;
}

export interface MeetingSchedule {
  frequency: 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek: number; // 0-6
  time: string; // HH:MM
  timezone: string;
  duration: number; // minutes
}

export interface DiscussionThread {
  id: string;
  title: string;
  author: CommunityMember;
  category: 'strategy' | 'education' | 'market-analysis' | 'general';
  createdAt: Date;
  lastActivity: Date;
  replies: Reply[];
  views: number;
  isPinned: boolean;
  isLocked: boolean;
  tags: string[];
}

export interface Reply {
  id: string;
  author: CommunityMember;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  likes: number;
  isAnswer: boolean;
  parentReplyId?: string;
}

export interface SharedStrategy {
  id: string;
  name: string;
  description: string;
  author: CommunityMember;
  category: 'ema-strategy' | 'risk-management' | 'custom';
  parameters: StrategyParameters;
  backtestResults: BacktestResults;
  downloads: number;
  rating: number;
  reviews: StrategyReview[];
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  isPublic: boolean;
}

export interface StrategyParameters {
  indicators: Record<string, any>;
  entryRules: string[];
  exitRules: string[];
  riskManagement: {
    stopLoss: number;
    takeProfit: number;
    positionSizing: string;
  };
  customCode?: string;
}

export interface BacktestResults {
  startDate: Date;
  endDate: Date;
  totalTrades: number;
  winRate: number;
  totalReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  profitFactor: number;
  avgTrade: number;
}

export interface StrategyReview {
  id: string;
  author: CommunityMember;
  rating: number; // 1-5
  comment: string;
  createdAt: Date;
  helpful: number;
}

// Feature Flags
export interface MESFeatureFlags {
  enhancedTutorial: boolean;
  realTimeData: boolean;
  communityFeatures: boolean;
  advancedAnalytics: boolean;
  psychologyAssessment: boolean;
  monteCarloSimulation: boolean;
  tradingSimulator: boolean;
  mentorshipProgram: boolean;
  strategyMarketplace: boolean;
  liveTrading: boolean;
}

// Navigation & UI
export interface TabInfo {
  id: string;
  label: string;
  icon: string;
  badge?: number | string;
  isEnabled: boolean;
  requiresAuth?: boolean;
}

export interface NotificationData {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
} 