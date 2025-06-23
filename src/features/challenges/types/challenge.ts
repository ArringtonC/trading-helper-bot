// Challenge Framework Types for Component 10: 30-Day Challenge Framework ($47)

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
  category: 'PRE_MARKET' | 'MARKET_HOURS' | 'POST_MARKET' | 'ANALYSIS' | 'PLANNING';
  estimatedMinutes: number;
  required: boolean;
  sortOrder: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  completedAt?: Date;
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
  category: 'MILESTONE' | 'STREAK' | 'SKILL' | 'RISK_MANAGEMENT' | 'COMPLETION';
  progress: number;
  target: number;
  unlocked: boolean;
  unlockedAt?: Date;
  points: number;
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
}

export interface StrategyPerformance {
  strategyName: string;
  trades: number;
  winRate: number;
  totalPnL: number;
  averagePnL: number;
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
}

// Mock data for initial development
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
  updatedAt: new Date()
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
    title: 'Complete morning market analysis',
    description: 'Review overnight markets, futures, and economic calendar',
    category: 'PRE_MARKET',
    estimatedMinutes: 15,
    required: true,
    sortOrder: 1,
    status: 'COMPLETED',
    completedAt: new Date()
  },
  {
    id: 'task-2',
    challengeId: 'challenge-001', 
    day: 12,
    dayType: 'EXECUTION',
    title: 'Review famous trader activity',
    description: 'Check for new SEC filings and position changes',
    category: 'ANALYSIS',
    estimatedMinutes: 10,
    required: true,
    sortOrder: 2,
    status: 'COMPLETED',
    completedAt: new Date()
  },
  {
    id: 'task-3',
    challengeId: 'challenge-001',
    day: 12,
    dayType: 'EXECUTION', 
    title: 'Execute 1-2 high-probability setups',
    description: 'Enter positions based on watchlist and strategy criteria',
    category: 'MARKET_HOURS',
    estimatedMinutes: 30,
    required: true,
    sortOrder: 3,
    status: 'IN_PROGRESS'
  },
  {
    id: 'task-4',
    challengeId: 'challenge-001',
    day: 12,
    dayType: 'EXECUTION',
    title: 'End-of-day review and journal entry', 
    description: 'Calculate daily P&L and assess strategy performance',
    category: 'POST_MARKET',
    estimatedMinutes: 20,
    required: true,
    sortOrder: 4,
    status: 'PENDING'
  }
];

export const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'achievement-1',
    name: 'First Steps',
    description: 'Complete your first daily checklist',
    icon: '🚀',
    category: 'MILESTONE',
    progress: 1,
    target: 1,
    unlocked: true,
    unlockedAt: new Date('2024-06-01'),
    points: 10
  },
  {
    id: 'achievement-2',
    name: 'Week Warrior', 
    description: 'Complete all tasks for a full week',
    icon: '⚔️',
    category: 'STREAK',
    progress: 1,
    target: 1,
    unlocked: true,
    unlockedAt: new Date('2024-06-07'),
    points: 25
  },
  {
    id: 'achievement-3',
    name: 'Risk Master',
    description: 'Never exceed 2% risk per trade for 30 days',
    icon: '🛡️',
    category: 'RISK_MANAGEMENT', 
    progress: 12,
    target: 30,
    unlocked: false,
    points: 50
  }
];