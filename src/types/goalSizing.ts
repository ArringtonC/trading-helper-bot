// GoalSizingConfig type for the wizard and storage
export interface SizingRules {
  maxPositionSize: number;
  maxTotalExposure: number;
  [key: string]: any;
}

export interface CapitalObjectiveParameters {
  currentBalance: number;
  targetBalance: number;
  timeHorizonMonths: number;
  winRate?: number;
  payoffRatio?: number;
  [key: string]: any;
}

export interface GoalSizingConfig {
  goalType: 'growth' | 'drawdown' | 'income' | 'capital_objective' | string;
  sizingRules: SizingRules;
  capitalObjectiveParameters?: CapitalObjectiveParameters;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

// DB row type for goal_sizing_config
export interface GoalSizingConfigRow {
  id: number;
  user_id: string;
  config_data: string; // JSON string
  goal_type: string;
  max_position_size: number;
  max_total_exposure: number;
  created_at: string;
  updated_at: string;
}

// TradingGoal type for position sizing foundation
export interface TradingGoal {
  currentBalance: number;
  targetBalance: number;
  timeframe: string;
}

// TradingGoals type for legacy/compatibility
export interface TradingGoals {
  targetMonthlyIncome: number;
  expectedWinRate: number;
  averageWinAmount: number;
  tradingFrequency: 'daily' | 'weekly' | 'monthly';
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
} 