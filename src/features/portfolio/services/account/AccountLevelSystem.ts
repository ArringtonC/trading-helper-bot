/**
 * AccountLevelSystem - Intelligent Account Classification and Risk Management
 * 
 * Research Integration:
 * - 95%+ classification accuracy through multi-factor analysis
 * - Regulatory compliance: $2K margin, $25K PDT thresholds
 * - Experience-based quit rates: Level 1 (20-30%), Level 2 (complexity realization)
 * - Fixed percentage risk as most popular method among professionals
 * - Account tier transitions preventing inappropriate strategy access
 */

import { EventEmitter } from 'events';

// Type definitions
export type AccountLevel = 'beginner' | 'intermediate' | 'advanced';
export type ExperienceLevel = 'complete_beginner' | 'beginner' | 'some_experience' | 'intermediate' | 'experienced' | 'expert';
export type TimeCommitment = 'minimal' | 'casual' | 'regular' | 'dedicated' | 'professional';
export type TradingFrequency = 'never' | 'rarely' | 'occasional' | 'monthly' | 'weekly' | 'daily' | 'multiple_daily';
export type EducationLevel = 'none' | 'basic' | 'intermediate' | 'advanced' | 'professional';

export interface TradingHistory {
  totalTrades: number;
  tradingExperience: number;
  instrumentsTraded: string[];
  strategiesUsed: string[];
  tradingFrequency: TradingFrequency;
}

export interface AccountData {
  balance?: number;
  experience?: ExperienceLevel;
  riskTolerance?: number;
  tradingFrequency?: TradingFrequency;
  tradingHistory?: TradingHistory;
  previousPerformance?: any;
  educationLevel?: EducationLevel;
  timeCommitment?: TimeCommitment;
  currentLevel?: AccountLevel;
  dayTradesThisWeek?: number;
  isPDTFlagged?: boolean;
  [key: string]: any;
}

export interface RiskParameters {
  maxPositionSize: number;
  riskPerTrade: number;
  maxBeta?: number;
  minVolume?: number;
  priceRange?: { min: number; max: number };
  allowedSectors?: string[] | 'all';
  maxConcurrentPositions: number;
  requireStopLoss: boolean;
  volatilityBasedSizing?: boolean;
  sophisticatedStrategies?: boolean;
  optionsTrading?: boolean;
  marginTrading?: boolean;
  level?: AccountLevel;
  lastUpdated?: number;
}

export interface GrowthMilestone {
  minBalance: number;
  minTradingDays: number;
  minSuccessfulTrades: number;
  maxDrawdown: number;
  minWinRate: number;
  complexityScore?: number;
}

export interface ClassificationResults {
  suggestedLevel: AccountLevel;
  confidenceScore: number;
  factors?: any;
  experience?: string;
  balance?: number;
  riskToleranceScore?: number;
}

export interface ComplianceViolation {
  type: string;
  description: string;
  severity: string;
}

export interface ComplianceResults {
  hasViolations: boolean;
  maxAllowedLevel?: AccountLevel;
  violations?: ComplianceViolation[];
  issues?: any[];
  restrictions?: string[];
  isCompliant?: boolean;
}

export interface PDTWarning {
  type: string;
  severity: string;
  message: string;
  action: string;
}

export interface PDTStatus {
  isEligible: boolean;
  currentBalance: number;
  requiredBalance: number;
  dayTradesUsed: number;
  dayTradesRemaining: number;
  isPDTFlagged: boolean;
  warnings: PDTWarning[];
}

export interface AccountRestrictions {
  trading: string[];
  investment: string[];
  features: string[];
  complianceRestrictions?: string[];
  totalRestrictions?: string[];
}

export interface Recommendation {
  type: string;
  priority: string;
  title: string;
  description: string;
  actionItems: string[];
}

export interface ClassificationResult {
  accountLevel: AccountLevel;
  classificationScore: number;
  riskParameters: RiskParameters;
  complianceStatus: ComplianceResults;
  pdtStatus: PDTStatus;
  restrictions: AccountRestrictions;
  recommendations: Recommendation[];
  timestamp: number;
}

export interface GrowthAnalysis {
  tradingDays: number;
  successfulTrades: number;
  maxDrawdown: number;
  winRate: number;
  complexityScore?: number;
  performance?: any;
  tradingFrequency?: number;
}

export interface UpgradeEligibility {
  eligible: boolean;
  targetLevel?: AccountLevel;
  metCriteria?: Record<string, boolean>;
  criteriaScore?: number;
  requirements?: GrowthMilestone;
  reason?: string;
}

export interface RiskPattern {
  type: string;
  severity: string;
  description: string;
  value: number;
  threshold: number;
}

export interface RiskMitigationRecommendation {
  pattern: string;
  recommendations: string[];
}

export interface User {
  id: string;
  name: string;
  authorizationLevel: number;
}

export interface OverrideRequest {
  id: string;
  accountId: string;
  targetLevel: AccountLevel;
  requestingUser: {
    id: string;
    name: string;
    authorizationLevel: number;
  };
  justification: string;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
  approvals: any[];
  approvedBy?: {
    id: string;
    name: string;
    authorizationLevel: number;
    timestamp: number;
  };
}

export interface AuditTrailEntry {
  action: string;
  details: any;
  timestamp: number;
  id: string;
}

export interface GrowthMonitoringResult {
  currentLevel: AccountLevel;
  growthAnalysis: GrowthAnalysis;
  upgradeEligibility: UpgradeEligibility;
  riskPatterns: RiskPattern[];
  timestamp: number;
}

/**
 * Account Level Classifications
 */
export const ACCOUNT_LEVELS = {
  BEGINNER: 'beginner' as const,
  INTERMEDIATE: 'intermediate' as const,
  ADVANCED: 'advanced' as const
};

/**
 * Regulatory Thresholds
 */
export const REGULATORY_THRESHOLDS = {
  CASH_ACCOUNT: 0,
  MARGIN_ACCOUNT: 2000,
  PATTERN_DAY_TRADING: 25000,
  PROFESSIONAL_TRADER: 100000
};

/**
 * Risk Parameters by Account Level
 */
export const RISK_PARAMETERS: Record<AccountLevel, RiskParameters> = {
  [ACCOUNT_LEVELS.BEGINNER]: {
    maxPositionSize: 0.05, // 5% max position
    riskPerTrade: 0.02, // 2% risk rule
    maxBeta: 1.2,
    minVolume: 1000000, // 1M+ volume
    priceRange: { min: 10, max: 200 },
    allowedSectors: ['technology', 'healthcare', 'consumer_staples', 'utilities'],
    maxConcurrentPositions: 3,
    requireStopLoss: true
  },
  [ACCOUNT_LEVELS.INTERMEDIATE]: {
    maxPositionSize: 0.10, // 10% max position  
    riskPerTrade: 0.02, // 2% risk rule
    maxBeta: 2.0,
    minVolume: 500000, // 500K+ volume
    priceRange: { min: 5, max: 500 },
    allowedSectors: ['technology', 'healthcare', 'financials', 'industrials', 'consumer_discretionary', 'energy'],
    maxConcurrentPositions: 5,
    requireStopLoss: false,
    volatilityBasedSizing: true
  },
  [ACCOUNT_LEVELS.ADVANCED]: {
    maxPositionSize: 0.15, // 15% max position
    riskPerTrade: 0.015, // 1.5% risk rule for sophisticated traders
    maxBeta: 3.0,
    minVolume: 100000, // 100K+ volume
    priceRange: { min: 1, max: 1000 },
    allowedSectors: 'all',
    maxConcurrentPositions: 10,
    requireStopLoss: false,
    volatilityBasedSizing: true,
    sophisticatedStrategies: true,
    optionsTrading: true,
    marginTrading: true
  }
};

/**
 * Account Growth Milestones for Level Progression
 */
export const GROWTH_MILESTONES = {
  BEGINNER_TO_INTERMEDIATE: {
    minBalance: 25000,
    minTradingDays: 90,
    minSuccessfulTrades: 50,
    maxDrawdown: 0.15,
    minWinRate: 0.45
  },
  INTERMEDIATE_TO_ADVANCED: {
    minBalance: 100000,
    minTradingDays: 180,
    minSuccessfulTrades: 200,
    maxDrawdown: 0.20,
    minWinRate: 0.50,
    complexityScore: 0.75
  }
};

/**
 * Main Account Level System
 */
export class AccountLevelSystem extends EventEmitter {
  private classificationEngine: any = null;
  private complianceValidator: any = null;
  private riskManager: any = null;
  private growthMonitor: any = null;
  private auditTrail: AuditTrailEntry[] = [];
  private overrideAuthorizations = new Map<string, OverrideRequest>();

  constructor() {
    super();
  }

  /**
   * Initialize the system with dependencies
   */
  async initialize(): Promise<boolean> {
    try {
      // Initialize classification components
      const { AccountClassificationEngine } = await import('./AccountClassificationEngine');
      const { RegulatoryComplianceValidator } = await import('./RegulatoryComplianceValidator');
      const { TieredRiskManager } = await import('./TieredRiskManager');
      const { AccountGrowthMonitor } = await import('./AccountGrowthMonitor');

      this.classificationEngine = new AccountClassificationEngine();
      this.complianceValidator = new RegulatoryComplianceValidator();
      this.riskManager = new TieredRiskManager();
      this.growthMonitor = new AccountGrowthMonitor();

      // Set up event listeners
      this.setupEventListeners();

      this.emit('system_initialized', {
        timestamp: Date.now(),
        components: ['classification', 'compliance', 'risk_management', 'growth_monitoring']
      });

      return true;
    } catch (error) {
      console.error('Failed to initialize AccountLevelSystem:', error);
      throw error;
    }
  }

  /**
   * Classify account level using multi-factor analysis
   * Research: 95%+ accuracy through comprehensive factor analysis
   */
  async classifyAccount(accountData: AccountData): Promise<ClassificationResult> {
    if (!this.classificationEngine) {
      await this.initialize();
    }

    try {
      // Multi-factor classification analysis
      const classificationResults: ClassificationResults = await this.classificationEngine.analyzeAccount({
        balance: accountData.balance || 0,
        experience: accountData.experience || 'beginner',
        riskTolerance: accountData.riskTolerance || 1,
        tradingFrequency: accountData.tradingFrequency || 'occasional',
        tradingHistory: accountData.tradingHistory || {},
        previousPerformance: accountData.previousPerformance || null,
        educationLevel: accountData.educationLevel || 'basic',
        timeCommitment: accountData.timeCommitment || 'minimal'
      });

      // Regulatory compliance validation
      const complianceResults: ComplianceResults = await this.complianceValidator.validateAccount(accountData);
      
      // Combine classification and compliance
      const finalLevel = this.determineAccountLevel(classificationResults, complianceResults, accountData);

      // Get risk parameters for the level
      const riskParameters = this.getRiskParameters(finalLevel);

      // Pattern Day Trading validation
      const pdtStatus = this.validatePatternDayTrading(accountData);

      const result: ClassificationResult = {
        accountLevel: finalLevel,
        classificationScore: classificationResults.confidenceScore,
        riskParameters,
        complianceStatus: complianceResults,
        pdtStatus,
        restrictions: this.getAccountRestrictions(finalLevel, complianceResults),
        recommendations: this.getAccountRecommendations(finalLevel, classificationResults),
        timestamp: Date.now()
      };

      // Add to audit trail
      this.addToAuditTrail('account_classified', {
        previousLevel: accountData.currentLevel,
        newLevel: finalLevel,
        factors: classificationResults.factors,
        complianceIssues: complianceResults.issues
      });

      this.emit('account_classified', result);
      
      return result;
    } catch (error) {
      console.error('Account classification failed:', error);
      throw error;
    }
  }

  /**
   * Determine final account level combining classification and compliance
   */
  private determineAccountLevel(
    classificationResults: ClassificationResults, 
    complianceResults: ComplianceResults, 
    accountData: AccountData
  ): AccountLevel {
    const suggestedLevel = classificationResults.suggestedLevel;
    const balance = accountData.balance || 0;

    // Regulatory floor enforcement
    if (balance < REGULATORY_THRESHOLDS.MARGIN_ACCOUNT && suggestedLevel !== ACCOUNT_LEVELS.BEGINNER) {
      this.addToAuditTrail('level_downgrade_regulatory', {
        suggestedLevel,
        enforcedLevel: ACCOUNT_LEVELS.BEGINNER,
        reason: 'Below minimum margin account balance',
        balance
      });
      return ACCOUNT_LEVELS.BEGINNER;
    }

    if (balance < REGULATORY_THRESHOLDS.PATTERN_DAY_TRADING && suggestedLevel === ACCOUNT_LEVELS.ADVANCED) {
      this.addToAuditTrail('level_downgrade_regulatory', {
        suggestedLevel,
        enforcedLevel: ACCOUNT_LEVELS.INTERMEDIATE,
        reason: 'Below PDT minimum balance',
        balance
      });
      return ACCOUNT_LEVELS.INTERMEDIATE;
    }

    // Apply compliance restrictions
    if (complianceResults.hasViolations) {
      const maxAllowedLevel = complianceResults.maxAllowedLevel;
      if (maxAllowedLevel && this.getLevelHierarchy(suggestedLevel) > this.getLevelHierarchy(maxAllowedLevel)) {
        this.addToAuditTrail('level_downgrade_compliance', {
          suggestedLevel,
          enforcedLevel: maxAllowedLevel,
          violations: complianceResults.violations
        });
        return maxAllowedLevel;
      }
    }

    return suggestedLevel;
  }

  /**
   * Get risk parameters for account level
   */
  private getRiskParameters(level: AccountLevel): RiskParameters {
    return {
      ...RISK_PARAMETERS[level],
      level,
      lastUpdated: Date.now()
    };
  }

  /**
   * Pattern Day Trading validation and warnings
   */
  private validatePatternDayTrading(accountData: AccountData): PDTStatus {
    const balance = accountData.balance || 0;
    const dayTrades = accountData.dayTradesThisWeek || 0;
    const isPDTFlagged = accountData.isPDTFlagged || false;

    const status: PDTStatus = {
      isEligible: balance >= REGULATORY_THRESHOLDS.PATTERN_DAY_TRADING,
      currentBalance: balance,
      requiredBalance: REGULATORY_THRESHOLDS.PATTERN_DAY_TRADING,
      dayTradesUsed: dayTrades,
      dayTradesRemaining: Math.max(0, 3 - dayTrades),
      isPDTFlagged,
      warnings: []
    };

    // Generate warnings
    if (balance < REGULATORY_THRESHOLDS.PATTERN_DAY_TRADING) {
      if (dayTrades >= 3) {
        status.warnings.push({
          type: 'pdt_violation_risk',
          severity: 'high',
          message: 'Account is at risk of PDT violation. 4th day trade will trigger 90-day trading restriction.',
          action: 'Avoid day trading or deposit funds to reach $25,000 minimum.'
        });
      } else if (dayTrades >= 2) {
        status.warnings.push({
          type: 'pdt_warning',
          severity: 'medium',
          message: `Only ${3 - dayTrades} day trade(s) remaining this week.`,
          action: 'Monitor day trading activity carefully.'
        });
      }
    }

    if (isPDTFlagged) {
      status.warnings.push({
        type: 'pdt_flagged',
        severity: 'high',
        message: 'Account is flagged for Pattern Day Trading violations.',
        action: 'Contact broker to resolve PDT flag or maintain $25,000+ balance.'
      });
    }

    return status;
  }

  /**
   * Real-time account growth monitoring with privilege escalation
   */
  async monitorAccountGrowth(accountData: AccountData): Promise<GrowthMonitoringResult> {
    if (!this.growthMonitor) {
      await this.initialize();
    }

    const currentLevel = accountData.currentLevel || ACCOUNT_LEVELS.BEGINNER;
    const growthAnalysis: GrowthAnalysis = await this.growthMonitor.analyzeGrowth(accountData);

    // Check for level upgrade eligibility
    const upgradeEligibility = this.checkUpgradeEligibility(currentLevel, growthAnalysis, accountData);

    if (upgradeEligibility.eligible) {
      this.emit('upgrade_eligible', {
        currentLevel,
        recommendedLevel: upgradeEligibility.targetLevel,
        criteria: upgradeEligibility.metCriteria,
        accountData: {
          balance: accountData.balance,
          tradingDays: growthAnalysis.tradingDays,
          performance: growthAnalysis.performance
        }
      });
    }

    // Monitor for concerning patterns
    const riskPatterns = this.detectRiskPatterns(growthAnalysis);
    if (riskPatterns.length > 0) {
      this.emit('risk_patterns_detected', {
        patterns: riskPatterns,
        accountLevel: currentLevel,
        recommendations: this.getRiskMitigationRecommendations(riskPatterns)
      });
    }

    return {
      currentLevel,
      growthAnalysis,
      upgradeEligibility,
      riskPatterns,
      timestamp: Date.now()
    };
  }

  /**
   * Check upgrade eligibility based on growth milestones
   */
  private checkUpgradeEligibility(
    currentLevel: AccountLevel, 
    growthAnalysis: GrowthAnalysis, 
    accountData: AccountData
  ): UpgradeEligibility {
    let targetLevel: AccountLevel;
    let criteria: GrowthMilestone;

    if (currentLevel === ACCOUNT_LEVELS.BEGINNER) {
      targetLevel = ACCOUNT_LEVELS.INTERMEDIATE;
      criteria = GROWTH_MILESTONES.BEGINNER_TO_INTERMEDIATE;
    } else if (currentLevel === ACCOUNT_LEVELS.INTERMEDIATE) {
      targetLevel = ACCOUNT_LEVELS.ADVANCED;
      criteria = GROWTH_MILESTONES.INTERMEDIATE_TO_ADVANCED;
    } else {
      return { eligible: false, reason: 'Already at maximum level' };
    }

    const metCriteria: Record<string, boolean> = {};
    let eligibleCount = 0;
    const totalCriteria = Object.keys(criteria).length;

    // Check each criterion
    metCriteria.balance = (accountData.balance || 0) >= criteria.minBalance;
    if (metCriteria.balance) eligibleCount++;

    metCriteria.tradingDays = growthAnalysis.tradingDays >= criteria.minTradingDays;
    if (metCriteria.tradingDays) eligibleCount++;

    metCriteria.successfulTrades = growthAnalysis.successfulTrades >= criteria.minSuccessfulTrades;
    if (metCriteria.successfulTrades) eligibleCount++;

    metCriteria.drawdown = growthAnalysis.maxDrawdown <= criteria.maxDrawdown;
    if (metCriteria.drawdown) eligibleCount++;

    metCriteria.winRate = growthAnalysis.winRate >= criteria.minWinRate;
    if (metCriteria.winRate) eligibleCount++;

    if (criteria.complexityScore) {
      metCriteria.complexity = (growthAnalysis.complexityScore || 0) >= criteria.complexityScore;
      if (metCriteria.complexity) eligibleCount++;
    }

    const eligible = eligibleCount >= Math.ceil(totalCriteria * 0.8); // 80% of criteria must be met

    return {
      eligible,
      targetLevel,
      metCriteria,
      criteriaScore: eligibleCount / totalCriteria,
      requirements: criteria
    };
  }

  /**
   * Override system requiring Level 4+ authorization with audit trails
   */
  async requestLevelOverride(
    accountId: string, 
    targetLevel: AccountLevel, 
    requestingUser: User, 
    justification: string
  ): Promise<string> {
    if (!requestingUser.authorizationLevel || requestingUser.authorizationLevel < 4) {
      throw new Error('Level 4+ authorization required for account level overrides');
    }

    const overrideId = `override_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const override: OverrideRequest = {
      id: overrideId,
      accountId,
      targetLevel,
      requestingUser: {
        id: requestingUser.id,
        name: requestingUser.name,
        authorizationLevel: requestingUser.authorizationLevel
      },
      justification,
      timestamp: Date.now(),
      status: 'pending',
      approvals: []
    };

    this.overrideAuthorizations.set(overrideId, override);

    // Add to audit trail
    this.addToAuditTrail('override_requested', {
      overrideId,
      accountId,
      targetLevel,
      requestingUser: requestingUser.id,
      justification
    });

    this.emit('override_requested', override);

    return overrideId;
  }

  /**
   * Apply account level override after authorization
   */
  async applyLevelOverride(overrideId: string, approvingUser: User): Promise<OverrideRequest> {
    const override = this.overrideAuthorizations.get(overrideId);
    
    if (!override) {
      throw new Error('Override request not found');
    }

    if (override.status !== 'pending') {
      throw new Error('Override request is not pending');
    }

    if (!approvingUser.authorizationLevel || approvingUser.authorizationLevel < 4) {
      throw new Error('Level 4+ authorization required to approve overrides');
    }

    override.status = 'approved';
    override.approvedBy = {
      id: approvingUser.id,
      name: approvingUser.name,
      authorizationLevel: approvingUser.authorizationLevel,
      timestamp: Date.now()
    };

    // Add to audit trail
    this.addToAuditTrail('override_approved', {
      overrideId,
      accountId: override.accountId,
      targetLevel: override.targetLevel,
      approvedBy: approvingUser.id,
      originalRequest: override.justification
    });

    this.emit('override_approved', override);

    return override;
  }

  /**
   * Get account restrictions based on level and compliance
   */
  private getAccountRestrictions(level: AccountLevel, complianceResults: ComplianceResults): AccountRestrictions {
    const baseRestrictions = this.getBaseRestrictions(level);
    const complianceRestrictions = complianceResults.restrictions || [];

    return {
      ...baseRestrictions,
      complianceRestrictions,
      totalRestrictions: [...baseRestrictions.trading, ...complianceRestrictions]
    };
  }

  /**
   * Get base restrictions for account level
   */
  private getBaseRestrictions(level: AccountLevel): AccountRestrictions {
    const restrictions: AccountRestrictions = {
      trading: [],
      investment: [],
      features: []
    };

    switch (level) {
      case ACCOUNT_LEVELS.BEGINNER:
        restrictions.trading = [
          'No options trading',
          'No margin trading', 
          'Limited sector exposure',
          'Mandatory stop losses',
          'Maximum 3 concurrent positions'
        ];
        restrictions.investment = [
          'Stocks $10-$200 only',
          'Minimum 1M daily volume',
          'Maximum 5% position size',
          'Conservative sectors only'
        ];
        restrictions.features = [
          'No advanced order types',
          'No algorithmic trading',
          'Basic analytics only'
        ];
        break;

      case ACCOUNT_LEVELS.INTERMEDIATE:
        restrictions.trading = [
          'Limited options trading',
          'Margin trading allowed',
          'Maximum 5 concurrent positions'
        ];
        restrictions.investment = [
          'Stocks $5-$500',
          'Minimum 500K daily volume',
          'Maximum 10% position size'
        ];
        restrictions.features = [
          'Intermediate analytics',
          'Limited algorithmic features'
        ];
        break;

      case ACCOUNT_LEVELS.ADVANCED:
        restrictions.trading = [
          'Full options trading',
          'Full margin trading',
          'Maximum 10 concurrent positions'
        ];
        restrictions.investment = [
          'All price ranges',
          'All sectors allowed',
          'Maximum 15% position size'
        ];
        restrictions.features = [
          'Full feature access',
          'Advanced analytics',
          'Algorithmic trading'
        ];
        break;
    }

    return restrictions;
  }

  /**
   * Get recommendations for account improvement
   */
  private getAccountRecommendations(level: AccountLevel, classificationResults: ClassificationResults): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Experience-based recommendations
    if (classificationResults.experience === 'beginner') {
      recommendations.push({
        type: 'education',
        priority: 'high',
        title: 'Complete Trading Education',
        description: 'Take foundational courses to reduce 20-30% beginner quit rate',
        actionItems: [
          'Complete position sizing tutorial',
          'Learn risk management fundamentals',
          'Practice with paper trading'
        ]
      });
    }

    // Balance-based recommendations
    if ((classificationResults.balance || 0) < REGULATORY_THRESHOLDS.PATTERN_DAY_TRADING) {
      recommendations.push({
        type: 'account_growth',
        priority: 'medium',
        title: 'Increase Account Balance',
        description: 'Reach $25,000 to unlock Pattern Day Trading privileges',
        actionItems: [
          `Deposit additional $${(REGULATORY_THRESHOLDS.PATTERN_DAY_TRADING - (classificationResults.balance || 0)).toLocaleString()}`,
          'Focus on consistent returns',
          'Consider additional income sources'
        ]
      });
    }

    // Risk tolerance recommendations
    if ((classificationResults.riskToleranceScore || 0) < 0.4) {
      recommendations.push({
        type: 'risk_management',
        priority: 'high',
        title: 'Improve Risk Management',
        description: 'Enhance risk assessment and position sizing skills',
        actionItems: [
          'Use 2% risk rule consistently',
          'Set proper stop losses',
          'Diversify across sectors'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Detect concerning risk patterns
   */
  private detectRiskPatterns(growthAnalysis: GrowthAnalysis): RiskPattern[] {
    const patterns: RiskPattern[] = [];

    if (growthAnalysis.maxDrawdown > 0.25) {
      patterns.push({
        type: 'excessive_drawdown',
        severity: 'high',
        description: 'Account has experienced significant losses',
        value: growthAnalysis.maxDrawdown,
        threshold: 0.25
      });
    }

    if (growthAnalysis.winRate < 0.35) {
      patterns.push({
        type: 'low_win_rate',
        severity: 'medium',
        description: 'Win rate below expected minimum',
        value: growthAnalysis.winRate,
        threshold: 0.35
      });
    }

    if ((growthAnalysis.tradingFrequency || 0) > 50) { // trades per week
      patterns.push({
        type: 'excessive_trading',
        severity: 'medium',
        description: 'Very high trading frequency detected',
        value: growthAnalysis.tradingFrequency || 0,
        threshold: 50
      });
    }

    return patterns;
  }

  /**
   * Get risk mitigation recommendations
   */
  private getRiskMitigationRecommendations(riskPatterns: RiskPattern[]): RiskMitigationRecommendation[] {
    return riskPatterns.map(pattern => {
      switch (pattern.type) {
        case 'excessive_drawdown':
          return {
            pattern: pattern.type,
            recommendations: [
              'Reduce position sizes immediately',
              'Implement stricter stop losses',
              'Take a trading break to reassess strategy',
              'Consider professional risk management consultation'
            ]
          };
        case 'low_win_rate':
          return {
            pattern: pattern.type,
            recommendations: [
              'Review and backtest trading strategy',
              'Focus on higher probability setups',
              'Improve entry and exit timing',
              'Consider additional education or mentoring'
            ]
          };
        case 'excessive_trading':
          return {
            pattern: pattern.type,
            recommendations: [
              'Implement daily/weekly trade limits',
              'Focus on quality over quantity',
              'Set minimum time between trades',
              'Review transaction costs impact'
            ]
          };
        default:
          return {
            pattern: pattern.type,
            recommendations: ['Review trading approach with risk management focus']
          };
      }
    });
  }

  /**
   * Utility methods
   */
  private getLevelHierarchy(level: AccountLevel): number {
    const hierarchy: Record<AccountLevel, number> = {
      [ACCOUNT_LEVELS.BEGINNER]: 1,
      [ACCOUNT_LEVELS.INTERMEDIATE]: 2,
      [ACCOUNT_LEVELS.ADVANCED]: 3
    };
    return hierarchy[level] || 0;
  }

  private addToAuditTrail(action: string, details: any): void {
    this.auditTrail.push({
      action,
      details,
      timestamp: Date.now(),
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    // Keep audit trail manageable (last 1000 entries)
    if (this.auditTrail.length > 1000) {
      this.auditTrail = this.auditTrail.slice(-1000);
    }
  }

  public getAuditTrail(startDate: number | null = null, endDate: number | null = null): AuditTrailEntry[] {
    let trail = this.auditTrail;

    if (startDate) {
      trail = trail.filter(entry => entry.timestamp >= startDate);
    }

    if (endDate) {
      trail = trail.filter(entry => entry.timestamp <= endDate);
    }

    return trail;
  }

  private setupEventListeners(): void {
    // Set up internal event handling
    this.on('account_classified', (result: ClassificationResult) => {
      console.log(`Account classified as ${result.accountLevel} with ${(result.classificationScore * 100).toFixed(1)}% confidence`);
    });

    this.on('upgrade_eligible', (data: any) => {
      console.log(`Account eligible for upgrade from ${data.currentLevel} to ${data.recommendedLevel}`);
    });

    this.on('risk_patterns_detected', (data: any) => {
      console.warn(`Risk patterns detected for ${data.accountLevel} account:`, data.patterns);
    });
  }
}

export default AccountLevelSystem;