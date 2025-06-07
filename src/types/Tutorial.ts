export interface TutorialFrontmatter {
  id: string; // Unique identifier for the tutorial
  title: string; // Display title
  sequence?: number; // Optional sequence for ordering within a series or category
  targetElementSelectors?: string[]; // CSS selectors for elements this tutorial might relate to
  category?: string; // Optional category for grouping tutorials
  // Add other metadata as needed, e.g., estimatedReadTime, tags, etc.
}

export interface TutorialMetadata extends TutorialFrontmatter {}

export interface Tutorial extends TutorialMetadata {
  content: string; // The Markdown content of the tutorial
  filePath?: string; // Optional: path to the original file, useful for dev/debugging
}

// Gamified Position Sizing Tutorial Types
export interface TutorialStep {
  id: number;
  title: string;
  concept: string;
  explanation: string;
  analogy: string;
  interactive: boolean;
  component?: string;
  completion: string;
  hint?: string;
  validation?: (value: any) => boolean;
  options?: string[];
  demoData?: any;
  scenarios?: string[];
  warning?: string;
  unlocks?: string[];
  showFormula?: boolean;
  realTimeExample?: boolean;
}

export interface TutorialProgress {
  currentStep: number;
  completedSteps: number[];
  totalSteps: number;
  xpEarned: number;
  badges: Badge[];
  achievements: Achievement[];
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earned: boolean;
  earnedAt?: Date;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface TutorialState {
  accountBalance: number;
  goalAmount: number;
  riskPercentage: number;
  selectedGoalType: 'conservative' | 'moderate' | 'aggressive';
  positionSize: number;
  vixLevel: number;
  kellyOptimal: number;
  isAccountValid: boolean;
}

export interface RiskCalculation {
  riskAmount: number;
  survivesLosses: number;
  monthsToZero: number;
  safetyLevel: 'very-safe' | 'safe' | 'moderate' | 'risky' | 'dangerous';
}

export interface PositionSizeCalculation {
  positionSize: number;
  contracts: number;
  totalRisk: number;
  riskPercentage: number;
  formulaSteps: string[];
}

export interface VIXScenario {
  level: number;
  description: string;
  marketCondition: string;
  positionAdjustment: number;
  explanation: string;
}

export interface KellyData {
  winRate: number;
  avgWin: number;
  avgLoss: number;
  optimalFraction: number;
  recommendation: string;
}

export interface GameificationElements {
  badges: Record<string, Badge>;
  achievements: Record<string, Achievement>;
  progressRewards: Record<string, string>;
  soundEffects?: {
    stepComplete: string;
    badgeEarned: string;
    levelUp: string;
    warning: string;
  };
}

// Ensure this file is treated as a module
export {};