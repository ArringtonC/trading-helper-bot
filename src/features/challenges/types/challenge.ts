// Challenge Framework Types for Component 10: 30-Day Challenge Framework ($47)
// Includes Sunday Planning Quest Types

export interface Challenge {
  id: string;
  userId: string;
  type: 'PROFIT_CHALLENGE';
  startDate: Date;
  endDate: Date;
  startingAmount: number;
  targetAmount: number;
  currentAmount: number;
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'PAUSED';
  currentDay: number;
  totalDays: number;
  createdAt: Date;
  updatedAt: Date;
  // RPG Elements
  characterLevel: number;
  totalXP: number;
  skillPoints: number;
  selectedStrategyClass: 'BUFFETT_GUARDIAN' | 'DALIO_WARRIOR' | 'SOROS_ASSASSIN' | 'LYNCH_SCOUT';
  masteryLevels: {
    patience: number;
    riskManagement: number;
    setupQuality: number;
    strategyAdherence: number;
    stressManagement: number;
    profitProtection: number;
    disciplineControl: number;
  };
}

export interface WeeklyMilestone {
  id: string;
  challengeId: string;
  weekNumber: number;
  targetAmount: number;
  actualAmount?: number;
  dueDate: Date;
  status: 'PENDING' | 'ACHIEVED' | 'MISSED' | 'IN_PROGRESS';
  completedAt?: Date;
}

export interface DailyTask {
  id: string;
  challengeId: string;
  day: number;
  dayType: 'SUNDAY' | 'MONDAY' | 'EXECUTION' | 'FRIDAY' | 'WEEKEND';
  title: string;
  description: string;
  category: 'PRE_MARKET' | 'MARKET_HOURS' | 'POST_MARKET' | 'ANALYSIS' | 'PLANNING' | 'SKILL_BUILDING';
  estimatedMinutes: number;
  required: boolean;
  sortOrder: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  completedAt?: Date;
  // RPG Elements
  xpReward: number;
  skillCategory: 'PATIENCE' | 'RISK_MANAGEMENT' | 'SETUP_QUALITY' | 'STRATEGY_ADHERENCE' | 'STRESS_MANAGEMENT' | 'PROFIT_PROTECTION' | 'DISCIPLINE_CONTROL';
  bonusXP?: number; // For exceptional performance
}

export interface TaskCompletion {
  id: string;
  taskId: string;
  userId: string;
  completedAt: Date;
  notes?: string;
  timeSpentMinutes?: number;
}

export interface ChallengeProgress {
  challenge: Challenge;
  currentBalance: number;
  todaysProgress: number;
  weeklyProgress: number;
  overallProgress: number;
  daysRemaining: number;
  onTrackForTarget: boolean;
  weeklyMilestones: WeeklyMilestone[];
  recentTasks: DailyTask[];
  streaks: ChallengeStreaks;
  achievements: Achievement[];
}

export interface ChallengeStreaks {
  dailyLogin: number;
  taskCompletion: number;
  riskDiscipline: number;
  platformUsage: number;
  profitableDays: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'MILESTONE' | 'STREAK' | 'SKILL' | 'RISK_MANAGEMENT' | 'COMPLETION' | 'BOSS_BATTLE' | 'CLASS_MASTERY' | 'STRESS_MANAGEMENT' | 'PROFIT_PROTECTION' | 'DISCIPLINE';
  progress: number;
  target: number;
  unlocked: boolean;
  unlockedAt?: Date;
  points: number;
  // RPG Elements
  xpReward: number;
  skillPointReward: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'LEGENDARY';
  requiresLevel?: number;
  classSpecific?: 'BUFFETT_GUARDIAN' | 'DALIO_WARRIOR' | 'SOROS_ASSASSIN' | 'LYNCH_SCOUT';
}

export interface XPEvent {
  id: string;
  userId: string;
  challengeId: string;
  eventType: 'TASK_COMPLETED' | 'ACHIEVEMENT_UNLOCKED' | 'BOSS_DEFEATED' | 'PERFECT_TRADE' | 'NO_TRADE_BONUS' | 'LEVEL_UP' | 'STRESS_MANAGEMENT' | 'PROFIT_EXTRACTION' | 'DISCIPLINE_BONUS';
  xpGained: number;
  skillPointsGained: number;
  description: string;
  timestamp: Date;
}

export interface CharacterProgression {
  currentLevel: number;
  totalXP: number;
  xpToNextLevel: number;
  availableSkillPoints: number;
  allocatedSkillPoints: {
    patience: number;
    riskManagement: number;
    setupQuality: number;
    strategyAdherence: number;
    stressManagement: number;
    profitProtection: number;
    disciplineControl: number;
  };
  unlockedAbilities: string[];
  strategyClassMastery: {
    [key: string]: {
      level: number;
      xp: number;
      unlockedAbilities: string[];
    };
  };
}

export interface WeeklyPlan {
  id: string;
  challengeId: string;
  weekNumber: number;
  weekStartDate: Date;
  weekTarget: number;
  dailyTarget: number;
  maxRiskPerTrade: number;
  maxTotalRisk: number;
  selectedStrategies: string[];
  watchlist: string[];
  marketCondition: 'BULLISH' | 'BEARISH' | 'SIDEWAYS' | 'VOLATILE';
  focusAreas: string[];
  economicEvents: EconomicEvent[];
  createdAt: Date;
}

export interface EconomicEvent {
  date: Date;
  time: string;
  event: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  description?: string;
}

export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  averageRiskPerTrade: number;
  maxDrawdown: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  strategyPerformance: Record<string, StrategyPerformance>;
  // Skill Development Metrics
  averageTradesPerDay: number;
  noTradeDays: number;
  patienceScore: number; // 1-10
  setupQuality: {
    aPlus: number;  // A+ setups
    a: number;      // A setups
    b: number;      // B setups
    c: number;      // C setups
    f: number;      // Failed/poor setups
  };
  strategyAdherence: number; // percentage
}

export interface StrategyPerformance {
  strategyName: string;
  trades: number;
  winRate: number;
  totalPnL: number;
  averagePnL: number;
}

export interface BuyBoxCriteria {
  id: string;
  userId: string;
  strategyName: string;
  criteria: {
    // Technical criteria
    trendDirection?: 'UPTREND' | 'DOWNTREND' | 'SIDEWAYS';
    supportResistance?: string;
    indicators?: string[];
    patternRequired?: string;
    
    // Risk criteria
    minRiskReward: number;
    maxRiskPercentage: number;
    stopLossType: 'ATR' | 'PERCENTAGE' | 'SUPPORT_RESISTANCE';
    
    // Entry criteria
    entryTrigger: string;
    confirmationRequired: string[];
    volumeRequirement?: string;
    
    // Time criteria
    tradingHours?: string;
    avoidTimes?: string[];
    holdPeriod: 'DAY_TRADE' | 'SWING' | 'POSITION';
  };
  examples: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TradeQualityAssessment {
  tradeId: string;
  setupQuality: 'A+' | 'A' | 'B' | 'C' | 'F';
  buyBoxMatch: number; // percentage
  criteriaChecklist: Record<string, boolean>;
  patienceScore: number; // 1-10
  notes: string;
  lessonsLearned?: string;
}

export interface ChallengeSettings {
  notifications: {
    dailyReminders: boolean;
    milestoneAlerts: boolean;
    riskWarnings: boolean;
    weeklyReports: boolean;
  };
  automation: {
    autoLogTrades: boolean;
    autoCalculateProgress: boolean;
    autoGenerateReports: boolean;
  };
  display: {
    showDetailedMetrics: boolean;
    compactView: boolean;
    preferredTimeframe: '1D' | '1W' | '1M';
  };
  skillTracking: {
    enforceMaxTradesPerDay: boolean;
    maxTradesAllowed: number;
    requireSetupGrading: boolean;
    celebrateNoTradeDays: boolean;
  };
}

// Enhanced Daily Workflow Templates Types
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  dayType: 'SUNDAY' | 'MONDAY' | 'EXECUTION' | 'FRIDAY' | 'WEEKEND';
  timeSlots: TimeSlot[];
  experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL';
  estimatedTotalMinutes: number;
  bonusXP: number;
}

export interface TimeSlot {
  id: string;
  name: string;
  emoji: string;
  startTime: string;
  endTime: string;
  description: string;
  tasks: TemplateTask[];
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  color: string;
}

export interface TemplateTask {
  id: string;
  title: string;
  description: string;
  category: 'PRE_MARKET' | 'MARKET_HOURS' | 'POST_MARKET' | 'ANALYSIS' | 'PLANNING' | 'SKILL_BUILDING';
  estimatedMinutes: number;
  required: boolean;
  xpReward: number;
  skillCategory: 'PATIENCE' | 'RISK_MANAGEMENT' | 'SETUP_QUALITY' | 'STRATEGY_ADHERENCE' | 'STRESS_MANAGEMENT' | 'PROFIT_PROTECTION' | 'DISCIPLINE_CONTROL';
  bonusXP?: number;
  conditions?: TaskCondition[];
}

export interface TaskCondition {
  type: 'EXPERIENCE_LEVEL' | 'STRATEGY_CLASS' | 'DAY_OF_WEEK' | 'STREAK_BONUS';
  value: string | number;
  operator: 'EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS';
}

export interface WorkflowPreferences {
  wakeUpTime?: string;
  marketPrepTime?: number; // minutes before market open
  tradingStyle: 'SCALPING' | 'DAY_TRADING' | 'SWING' | 'POSITION';
  experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  focusAreas: string[];
  weekendEducation: boolean;
}

// Streak and Achievement Enhancements
export interface StreakMilestone {
  streakType: keyof ChallengeStreaks;
  milestone: number;
  xpReward: number;
  title: string;
  description: string;
  achieved: boolean;
  achievedAt?: Date;
}

export interface XPTransaction {
  id: string;
  userId: string;
  challengeId: string;
  amount: number;
  source: string;
  description: string;
  timestamp: Date;
  multiplier?: number;
  bonusType?: 'STREAK' | 'ACHIEVEMENT' | 'PERFECT_DAY' | 'PATIENCE' | 'QUALITY';
}

// Enhanced mock data with new features
export const MOCK_CHALLENGE: Challenge = {
  id: 'challenge-001',
  userId: 'user-001', 
  type: 'PROFIT_CHALLENGE',
  startDate: new Date('2024-06-01'),
  endDate: new Date('2024-06-30'),
  startingAmount: 10000,
  targetAmount: 20000,
  currentAmount: 13450,
  status: 'ACTIVE',
  currentDay: 12,
  totalDays: 30,
  createdAt: new Date('2024-06-01'),
  updatedAt: new Date(),
  // RPG Elements
  characterLevel: 8,
  totalXP: 2850,
  skillPoints: 15,
  selectedStrategyClass: 'BUFFETT_GUARDIAN',
  masteryLevels: {
    patience: 7,
    riskManagement: 9,
    setupQuality: 6,
    strategyAdherence: 8,
    stressManagement: 5,
    profitProtection: 4,
    disciplineControl: 6
  }
};

export const MOCK_WEEKLY_MILESTONES: WeeklyMilestone[] = [
  {
    id: 'milestone-1',
    challengeId: 'challenge-001',
    weekNumber: 1,
    targetAmount: 12500,
    actualAmount: 12650,
    dueDate: new Date('2024-06-07'),
    status: 'ACHIEVED',
    completedAt: new Date('2024-06-07')
  },
  {
    id: 'milestone-2', 
    challengeId: 'challenge-001',
    weekNumber: 2,
    targetAmount: 15000,
    actualAmount: 13450,
    dueDate: new Date('2024-06-14'),
    status: 'IN_PROGRESS'
  },
  {
    id: 'milestone-3',
    challengeId: 'challenge-001', 
    weekNumber: 3,
    targetAmount: 17500,
    dueDate: new Date('2024-06-21'),
    status: 'PENDING'
  },
  {
    id: 'milestone-4',
    challengeId: 'challenge-001',
    weekNumber: 4, 
    targetAmount: 20000,
    dueDate: new Date('2024-06-28'),
    status: 'PENDING'
  }
];

export const MOCK_TODAYS_TASKS: DailyTask[] = [
  {
    id: 'task-1',
    challengeId: 'challenge-001',
    day: 12,
    dayType: 'EXECUTION',
    title: '🧘 Morning Patience Check',
    description: 'Strategy discipline verification - confirm your class is still optimal',
    category: 'SKILL_BUILDING',
    estimatedMinutes: 5,
    required: true,
    sortOrder: 1,
    status: 'COMPLETED',
    completedAt: new Date(),
    xpReward: 15,
    skillCategory: 'PATIENCE'
  },
  {
    id: 'task-2',
    challengeId: 'challenge-001',
    day: 12,
    dayType: 'EXECUTION',
    title: '🌅 Pre-Battle Intelligence Gathering',
    description: 'Scan overnight markets, futures, and economic events',
    category: 'PRE_MARKET',
    estimatedMinutes: 15,
    required: true,
    sortOrder: 2,
    status: 'COMPLETED',
    completedAt: new Date(),
    xpReward: 20,
    skillCategory: 'SETUP_QUALITY'
  },
  {
    id: 'task-3',
    challengeId: 'challenge-001', 
    day: 12,
    dayType: 'EXECUTION',
    title: '💎 Legendary Setup Hunt',
    description: 'Scan for A+ legendary setups only - no common trades!',
    category: 'ANALYSIS',
    estimatedMinutes: 20,
    required: true,
    sortOrder: 3,
    status: 'COMPLETED',
    completedAt: new Date(),
    xpReward: 25,
    skillCategory: 'SETUP_QUALITY',
    bonusXP: 15 // Bonus for quality focus
  },
  {
    id: 'task-4',
    challengeId: 'challenge-001',
    day: 12,
    dayType: 'EXECUTION', 
    title: '⚔️ Combat Execution (0-2 trades max)',
    description: 'Execute legendary setups OR earn patience bonus XP',
    category: 'MARKET_HOURS',
    estimatedMinutes: 30,
    required: true,
    sortOrder: 4,
    status: 'IN_PROGRESS',
    xpReward: 30,
    skillCategory: 'STRATEGY_ADHERENCE',
    bonusXP: 25 // For no-trade days
  },
  {
    id: 'task-5',
    challengeId: 'challenge-001',
    day: 12,
    dayType: 'EXECUTION',
    title: '🎯 Patience Skill Assessment', 
    description: 'Rate your discipline: Did you stick to your strategy class?',
    category: 'SKILL_BUILDING',
    estimatedMinutes: 5,
    required: true,
    sortOrder: 5,
    status: 'PENDING',
    xpReward: 10,
    skillCategory: 'PATIENCE'
  },
  {
    id: 'task-6',
    challengeId: 'challenge-001',
    day: 12,
    dayType: 'EXECUTION',
    title: '📊 Battle Performance Review', 
    description: 'Grade trade quality and unlock skill improvements',
    category: 'POST_MARKET',
    estimatedMinutes: 20,
    required: true,
    sortOrder: 6,
    status: 'PENDING',
    xpReward: 20,
    skillCategory: 'SETUP_QUALITY'
  }
];

export const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'achievement-1',
    name: 'Rookie Trader',
    description: 'Complete your first battle preparations',
    icon: '🚀',
    category: 'MILESTONE',
    progress: 1,
    target: 1,
    unlocked: true,
    unlockedAt: new Date('2024-06-01'),
    points: 10,
    xpReward: 100,
    skillPointReward: 2,
    tier: 'BRONZE'
  },
  {
    id: 'achievement-2',
    name: 'Zen Warrior',
    description: 'Master the art of NOT trading - earn patience XP',
    icon: '🧘',
    category: 'SKILL',
    progress: 3,
    target: 5,
    unlocked: true,
    unlockedAt: new Date('2024-06-03'),
    points: 25,
    xpReward: 150,
    skillPointReward: 3,
    tier: 'SILVER'
  },
  {
    id: 'achievement-3',
    name: 'Legendary Hunter', 
    description: 'Execute 5 A+ legendary setups',
    icon: '💎',
    category: 'SKILL',
    progress: 3,
    target: 5,
    unlocked: false,
    points: 50,
    xpReward: 250,
    skillPointReward: 5,
    tier: 'GOLD'
  },
  {
    id: 'achievement-4',
    name: 'Guardian Specialist',
    description: 'Master the Buffett Guardian class for 7 days',
    icon: '🏰',
    category: 'CLASS_MASTERY', 
    progress: 5,
    target: 7,
    unlocked: false,
    points: 40,
    xpReward: 200,
    skillPointReward: 4,
    tier: 'GOLD',
    classSpecific: 'BUFFETT_GUARDIAN'
  },
  {
    id: 'achievement-5',
    name: 'Shield Master',
    description: 'Perfect defensive protocol - never exceed 2% risk',
    icon: '🛡️',
    category: 'RISK_MANAGEMENT', 
    progress: 12,
    target: 30,
    unlocked: false,
    points: 50,
    xpReward: 300,
    skillPointReward: 6,
    tier: 'LEGENDARY'
  },
  {
    id: 'achievement-6',
    name: 'Setup Crafter',
    description: 'Forge your legendary buy-box criteria',
    icon: '⚒️',
    category: 'SKILL',
    progress: 1,
    target: 1,
    unlocked: true,
    unlockedAt: new Date('2024-06-02'),
    points: 30,
    xpReward: 120,
    skillPointReward: 2,
    tier: 'BRONZE'
  },
  {
    id: 'achievement-7',
    name: 'Boss Slayer I',
    description: 'Defeat the Level 1 Boss ($12,500)',
    icon: '👑',
    category: 'BOSS_BATTLE',
    progress: 1,
    target: 1,
    unlocked: true,
    unlockedAt: new Date('2024-06-07'),
    points: 100,
    xpReward: 500,
    skillPointReward: 10,
    tier: 'LEGENDARY',
    requiresLevel: 5
  },
  // Psychology Achievement Integration
  {
    id: 'achievement-zen-trader',
    name: 'Zen Trader',
    description: 'Maintain stress level below 5 for 30 days',
    icon: '🧘‍♂️',
    category: 'STRESS_MANAGEMENT',
    progress: 23,
    target: 30,
    unlocked: false,
    points: 50,
    xpReward: 500,
    skillPointReward: 8,
    tier: 'GOLD'
  },
  {
    id: 'achievement-profit-protector',
    name: 'Profit Protector',
    description: 'Extract profits for 3 consecutive months',
    icon: '💰',
    category: 'PROFIT_PROTECTION',
    progress: 2,
    target: 3,
    unlocked: false,
    points: 75,
    xpReward: 750,
    skillPointReward: 12,
    tier: 'LEGENDARY'
  },
  {
    id: 'achievement-iron-discipline',
    name: 'Iron Discipline',
    description: '100% compliance with 1% rule for 60 days',
    icon: '🗿',
    category: 'DISCIPLINE',
    progress: 23,
    target: 60,
    unlocked: false,
    points: 100,
    xpReward: 1000,
    skillPointReward: 15,
    tier: 'LEGENDARY'
  },
  {
    id: 'achievement-stress-master',
    name: 'Stress Master',
    description: 'Achieve optimal stress level (3-5) for 14 consecutive days',
    icon: '🎯',
    category: 'STRESS_MANAGEMENT',
    progress: 8,
    target: 14,
    unlocked: false,
    points: 35,
    xpReward: 300,
    skillPointReward: 5,
    tier: 'SILVER'
  },
  {
    id: 'achievement-behavioral-analyst',
    name: 'Behavioral Analyst',
    description: 'Identify and improve 3 negative trading patterns',
    icon: '🔍',
    category: 'DISCIPLINE',
    progress: 1,
    target: 3,
    unlocked: false,
    points: 40,
    xpReward: 400,
    skillPointReward: 6,
    tier: 'GOLD'
  }
];

// Sunday Planning Quest Types
export interface QuestStage {
  id: number;
  title: string;
  description: string;
  xpReward: number;
  icon: string;
  status: 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED';
  requirements?: string[];
  completedAt?: Date;
  estimatedMinutes?: number;
  category: 'ASSESSMENT' | 'INTELLIGENCE' | 'STRATEGY' | 'PLANNING';
}

export interface SundayQuestProgress {
  id: string;
  userId: string;
  challengeId: string;
  questDate: Date;
  stages: QuestStage[];
  currentStage: number;
  totalXPEarned: number;
  completedAt?: Date;
  selectedStrategy?: 'BUFFETT_GUARDIAN' | 'DALIO_WARRIOR' | 'SOROS_ASSASSIN' | 'LYNCH_SCOUT';
  weeklyTarget?: number;
  maxRiskPerTrade?: number;
  generatedWatchlist?: string[];
  marketIntelligence?: {
    sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'VOLATILE';
    vixLevel: number;
    economicEvents: string[];
    sectorRotation?: string;
  };
}

export interface QuestReward {
  type: 'XP' | 'SKILL_POINT' | 'ACHIEVEMENT' | 'BONUS';
  amount: number;
  description: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface WeeklyQuestPlan {
  id: string;
  questProgressId: string;
  weekStartDate: Date;
  strategyClass: 'BUFFETT_GUARDIAN' | 'DALIO_WARRIOR' | 'SOROS_ASSASSIN' | 'LYNCH_SCOUT';
  watchlist: WatchlistEntry[];
  weeklyTarget: number;
  dailyTarget: number;
  maxRiskPerTrade: number;
  maxTotalRisk: number;
  scanResults?: MarketScanSummary;
  questRewards: QuestReward[];
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'PAUSED';
}

export interface WatchlistEntry {
  symbol: string;
  companyName: string;
  price: number;
  confidenceScore: number;
  setupQuality: 'A+' | 'A' | 'B' | 'C';
  xpReward: number;
  reasoning: string[];
  alertLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  addedDate: Date;
  scanSource: 'BUFFETT_GUARDIAN' | 'DALIO_WARRIOR' | 'SOROS_ASSASSIN' | 'LYNCH_SCOUT';
  positionSize?: number;
  stopLoss?: number;
  targetPrice?: number;
}

export interface MarketScanSummary {
  scanDate: Date;
  strategyClass: 'BUFFETT_GUARDIAN' | 'DALIO_WARRIOR' | 'SOROS_ASSASSIN' | 'LYNCH_SCOUT';
  totalStocksScanned: number;
  qualifyingStocks: number;
  topOpportunities: number;
  avgConfidenceScore: number;
  totalXPPotential: number;
  marketSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'VOLATILE';
  weeklyTheme: string;
  recommendedActions: string[];
  economicFactors: string[];
}

// Mock Data for Sunday Quest
export const MOCK_SUNDAY_QUEST: SundayQuestProgress = {
  id: 'sunday-quest-001',
  userId: 'user-001',
  challengeId: 'challenge-001',
  questDate: new Date(),
  currentStage: 0,
  totalXPEarned: 0,
  stages: [
    {
      id: 0,
      title: '🏴‍☠️ Character Assessment',
      description: 'Review your trading stats, performance metrics, and skill progression',
      xpReward: 10,
      icon: '🏴‍☠️',
      status: 'AVAILABLE',
      category: 'ASSESSMENT',
      estimatedMinutes: 10,
      requirements: ['Review current stats', 'Assess skill gaps', 'Check achievement progress']
    },
    {
      id: 1,
      title: '🔍 Market Intelligence Gathering',
      description: 'Scout economic events, analyze SP500 trends, and assess market conditions',
      xpReward: 15,
      icon: '🔍',
      status: 'LOCKED',
      category: 'INTELLIGENCE',
      estimatedMinutes: 15,
      requirements: ['Review economic calendar', 'Analyze market sentiment', 'Identify key events']
    },
    {
      id: 2,
      title: '⚔️ Strategy Loadout Selection',
      description: 'Choose your PRIMARY strategy class and scan for legendary opportunities',
      xpReward: 15,
      icon: '⚔️',
      status: 'LOCKED',
      category: 'STRATEGY',
      estimatedMinutes: 20,
      requirements: ['Select strategy class', 'Run market scan', 'Analyze opportunities']
    },
    {
      id: 3,
      title: '📋 Weekly Quest Planning',
      description: 'Build your watchlist, set profit targets, and configure position sizing',
      xpReward: 10,
      icon: '📋',
      status: 'LOCKED',
      category: 'PLANNING',
      estimatedMinutes: 15,
      requirements: ['Create watchlist', 'Set weekly target', 'Configure risk limits']
    }
  ]
};

export const MOCK_WEEKLY_QUEST_PLAN: WeeklyQuestPlan = {
  id: 'weekly-plan-001',
  questProgressId: 'sunday-quest-001',
  weekStartDate: new Date(),
  strategyClass: 'BUFFETT_GUARDIAN',
  weeklyTarget: 1000,
  dailyTarget: 200,
  maxRiskPerTrade: 100,
  maxTotalRisk: 300,
  watchlist: [],
  questRewards: [
    {
      type: 'XP',
      amount: 50,
      description: 'Sunday Planning Quest Completion',
      unlocked: false
    },
    {
      type: 'SKILL_POINT',
      amount: 5,
      description: 'Strategy Planning Mastery',
      unlocked: false
    }
  ],
  status: 'DRAFT'
};