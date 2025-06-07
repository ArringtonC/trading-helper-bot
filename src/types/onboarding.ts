// Onboarding and Context Management Types for Task 28.1

export interface OnboardingProgress {
  phase: number;
  currentStep: string;
  completedSteps: string[];
  phaseData?: any;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface GoalImport {
  id: number;
  source: string;
  data: any;
  importedAt: string;
  status: string;
}

export interface PlanRealityAnalysis {
  complianceScore: number;
  violations: Violation[];
  suggestions: Suggestion[];
  performanceMetrics: PerformanceMetrics;
  analysisDate: string;
}

export interface Violation {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  tradeId?: string;
  suggestedAction?: string;
}

export interface Suggestion {
  type: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  estimatedImpact?: string;
}

export interface PerformanceMetrics {
  actualWinRate: number;
  targetWinRate: number;
  actualPayoffRatio: number;
  targetPayoffRatio: number;
  actualMaxDrawdown: number;
  targetMaxDrawdown: number;
  compliancePercentage: number;
  riskAdjustedReturn: number;
  sharpeRatio?: number;
}

export interface BackupMetadata {
  backupType: string;
  timestamp: string;
  size: number;
  checksum: string;
  status: string;
}

export interface UserContext {
  userId: string;
  contextType: string;
  contextData: any;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

// Onboarding Phase Types
export type OnboardingPhase = 1 | 2 | 3;

export interface PhaseData {
  phase1?: {
    simpleGoal?: string;
    initialFocus?: 'growth' | 'income' | 'risk_management';
    hasImportedData?: boolean;
  };
  phase2?: {
    detailedGoalCompleted?: boolean;
    planVsRealityEnabled?: boolean;
    complianceScore?: number;
  };
  phase3?: {
    ruleEngineConfigured?: boolean;
    analyticsEnabled?: boolean;
    continuousImprovementActive?: boolean;
  };
}

// Context Types for seamless transitions
export type ContextType = 
  | 'wizard_progress'
  | 'import_session'
  | 'analysis_results'
  | 'user_preferences'
  | 'temporary_data';

export interface WizardProgressContext {
  currentStep: number;
  formData: any;
  validationErrors: Record<string, string>;
  lastSaved: string;
}

export interface ImportSessionContext {
  uploadedFiles: string[];
  processingStatus: 'pending' | 'processing' | 'completed' | 'error';
  importResults: any;
  sessionId: string;
}

export interface AnalysisResultsContext {
  lastAnalysisDate: string;
  complianceScore: number;
  keyFindings: string[];
  recommendedActions: string[];
} 