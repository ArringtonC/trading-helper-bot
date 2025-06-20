/**
 * RegulatoryComplianceValidator - Comprehensive Regulatory Compliance Checking
 * 
 * Research Integration:
 * - FINRA Pattern Day Trading Rule compliance
 * - SEC margin account requirements
 * - Account tier validation with regulatory floors
 * - Real-time violation monitoring and prevention
 */

import { ACCOUNT_LEVELS, REGULATORY_THRESHOLDS } from './AccountLevelSystem';

/**
 * Compliance Rule Categories
 */
const COMPLIANCE_CATEGORIES = {
  MARGIN: 'margin',
  PDT: 'pattern_day_trading',
  ACCOUNT_MINIMUM: 'account_minimum',
  TRADING_AUTHORITY: 'trading_authority',
  POSITION_LIMITS: 'position_limits'
};

/**
 * Violation Severity Levels
 */
const VIOLATION_SEVERITY = {
  CRITICAL: 'critical',    // Account restriction required
  HIGH: 'high',           // Strong warning, limit features
  MEDIUM: 'medium',       // Warning with recommendations
  LOW: 'low'              // Informational notice
};

/**
 * Trading Authority Levels by Account Type
 */
const TRADING_AUTHORITY = {
  CASH_ACCOUNT: {
    options: false,
    margin: false,
    dayTrading: false,
    shortSelling: false
  },
  MARGIN_ACCOUNT: {
    options: true,
    margin: true,
    dayTrading: false, // Requires PDT compliance
    shortSelling: true
  },
  PDT_ELIGIBLE: {
    options: true,
    margin: true,
    dayTrading: true,
    shortSelling: true
  }
};

export class RegulatoryComplianceValidator {
  constructor() {
    this.complianceRules = this.initializeComplianceRules();
    this.violationHistory = [];
    this.lastValidation = null;
  }

  /**
   * Initialize comprehensive compliance rules
   */
  initializeComplianceRules() {
    return {
      [COMPLIANCE_CATEGORIES.MARGIN]: [
        {
          id: 'margin_minimum',
          description: 'Minimum margin account balance requirement',
          threshold: REGULATORY_THRESHOLDS.MARGIN_ACCOUNT,
          severity: VIOLATION_SEVERITY.HIGH,
          validator: this.validateMarginMinimum.bind(this)
        }
      ],
      [COMPLIANCE_CATEGORIES.PDT]: [
        {
          id: 'pdt_minimum_equity',
          description: 'Pattern Day Trading minimum equity requirement',
          threshold: REGULATORY_THRESHOLDS.PATTERN_DAY_TRADING,
          severity: VIOLATION_SEVERITY.CRITICAL,
          validator: this.validatePDTMinimum.bind(this)
        },
        {
          id: 'pdt_day_trade_limit',
          description: 'Day trading frequency limit for non-PDT accounts',
          threshold: 3, // trades per 5 business days
          severity: VIOLATION_SEVERITY.CRITICAL,
          validator: this.validateDayTradeLimit.bind(this)
        }
      ],
      [COMPLIANCE_CATEGORIES.ACCOUNT_MINIMUM]: [
        {
          id: 'account_opening_minimum',
          description: 'Minimum account balance for trading',
          threshold: 500,
          severity: VIOLATION_SEVERITY.MEDIUM,
          validator: this.validateAccountMinimum.bind(this)
        }
      ],
      [COMPLIANCE_CATEGORIES.TRADING_AUTHORITY]: [
        {
          id: 'options_trading_approval',
          description: 'Options trading requires special approval',
          severity: VIOLATION_SEVERITY.HIGH,
          validator: this.validateOptionsAuthority.bind(this)
        },
        {
          id: 'margin_trading_approval',
          description: 'Margin trading requires account approval',
          severity: VIOLATION_SEVERITY.HIGH,
          validator: this.validateMarginAuthority.bind(this)
        }
      ]
    };
  }

  /**
   * Main compliance validation method
   */
  async validateAccount(accountData) {
    try {
      const validationResults = {
        isCompliant: true,
        hasViolations: false,
        violations: [],
        warnings: [],
        restrictions: [],
        maxAllowedLevel: ACCOUNT_LEVELS.ADVANCED,
        tradingAuthority: this.determineTradingAuthority(accountData),
        timestamp: Date.now()
      };

      // Run all compliance rules
      for (const [category, rules] of Object.entries(this.complianceRules)) {
        for (const rule of rules) {
          try {
            const ruleResult = await rule.validator(accountData, rule);
            
            if (!ruleResult.compliant) {
              validationResults.isCompliant = false;
              
              const violation = {
                ruleId: rule.id,
                category,
                description: rule.description,
                severity: rule.severity,
                details: ruleResult.details,
                recommendations: ruleResult.recommendations || [],
                restrictionLevel: ruleResult.restrictionLevel,
                timestamp: Date.now()
              };

              if (rule.severity === VIOLATION_SEVERITY.CRITICAL || rule.severity === VIOLATION_SEVERITY.HIGH) {
                validationResults.hasViolations = true;
                validationResults.violations.push(violation);
                
                // Update max allowed level based on violation
                const restrictedLevel = this.getRestrictedLevel(violation);
                if (this.getLevelHierarchy(restrictedLevel) < this.getLevelHierarchy(validationResults.maxAllowedLevel)) {
                  validationResults.maxAllowedLevel = restrictedLevel;
                }
              } else {
                validationResults.warnings.push(violation);
              }

              // Add restrictions
              if (ruleResult.restrictions) {
                validationResults.restrictions.push(...ruleResult.restrictions);
              }

              // Record violation
              this.recordViolation(violation, accountData);
            }
          } catch (error) {
            console.error(`Compliance rule ${rule.id} validation failed:`, error);
          }
        }
      }

      // Additional regulatory checks
      await this.performAdditionalChecks(accountData, validationResults);

      this.lastValidation = validationResults;
      return validationResults;
      
    } catch (error) {
      console.error('Compliance validation failed:', error);
      throw error;
    }
  }

  /**
   * Validate margin account minimum balance
   */
  async validateMarginMinimum(accountData, rule) {
    const balance = accountData.balance || 0;
    const hasMarginAccount = accountData.accountType === 'margin' || accountData.marginEnabled;

    if (hasMarginAccount && balance < rule.threshold) {
      return {
        compliant: false,
        details: {
          currentBalance: balance,
          requiredBalance: rule.threshold,
          shortfall: rule.threshold - balance
        },
        recommendations: [
          `Deposit additional $${(rule.threshold - balance).toLocaleString()} to meet margin requirements`,
          'Consider converting to cash account if margin not needed',
          'Review account settings with your broker'
        ],
        restrictions: [
          'No margin trading allowed',
          'Limited position sizes',
          'Cash settlement only'
        ],
        restrictionLevel: ACCOUNT_LEVELS.BEGINNER
      };
    }

    return { compliant: true };
  }

  /**
   * Validate Pattern Day Trading minimum equity
   */
  async validatePDTMinimum(accountData, rule) {
    const balance = accountData.balance || 0;
    const dayTrades = accountData.dayTradesThisWeek || 0;
    const isPDTFlagged = accountData.isPDTFlagged || false;

    // Check if account is attempting day trading without PDT eligibility
    if ((dayTrades >= 4 || isPDTFlagged) && balance < rule.threshold) {
      return {
        compliant: false,
        details: {
          currentBalance: balance,
          requiredBalance: rule.threshold,
          shortfall: rule.threshold - balance,
          dayTradesThisWeek: dayTrades,
          isPDTFlagged
        },
        recommendations: [
          `Deposit $${(rule.threshold - balance).toLocaleString()} to meet PDT minimum equity requirement`,
          'Avoid day trading until account meets minimum requirements',
          'Contact broker to discuss account restrictions',
          'Consider swing trading strategies instead'
        ],
        restrictions: [
          'No day trading allowed',
          'Maximum 3 day trades per 5 business days',
          'Forced liquidation risk if PDT violated'
        ],
        restrictionLevel: ACCOUNT_LEVELS.BEGINNER
      };
    }

    return { compliant: true };
  }

  /**
   * Validate day trade frequency limits
   */
  async validateDayTradeLimit(accountData, rule) {
    const balance = accountData.balance || 0;
    const dayTrades = accountData.dayTradesThisWeek || 0;
    const isPDTEligible = balance >= REGULATORY_THRESHOLDS.PATTERN_DAY_TRADING;

    if (!isPDTEligible && dayTrades >= rule.threshold) {
      return {
        compliant: false,
        details: {
          dayTradesUsed: dayTrades,
          dayTradeLimit: rule.threshold,
          accountBalance: balance,
          pdtMinimum: REGULATORY_THRESHOLDS.PATTERN_DAY_TRADING
        },
        recommendations: [
          'Stop day trading immediately to avoid PDT violation',
          `Deposit $${(REGULATORY_THRESHOLDS.PATTERN_DAY_TRADING - balance).toLocaleString()} to become PDT eligible`,
          'Wait for next trading week to reset day trade count',
          'Focus on swing trading strategies'
        ],
        restrictions: [
          'No additional day trades this week',
          'Account may be restricted for 90 days if violated',
          'Cash account conversion may be required'
        ],
        restrictionLevel: ACCOUNT_LEVELS.BEGINNER
      };
    }

    // Warning if approaching limit
    if (!isPDTEligible && dayTrades >= 2) {
      return {
        compliant: false,
        details: {
          dayTradesUsed: dayTrades,
          dayTradesRemaining: rule.threshold - dayTrades,
          warningLevel: 'approaching_limit'
        },
        recommendations: [
          `Only ${rule.threshold - dayTrades} day trade(s) remaining this week`,
          'Plan trades carefully to avoid PDT violation',
          'Consider increasing account balance for PDT eligibility'
        ],
        restrictions: [],
        restrictionLevel: null
      };
    }

    return { compliant: true };
  }

  /**
   * Validate minimum account balance
   */
  async validateAccountMinimum(accountData, rule) {
    const balance = accountData.balance || 0;

    if (balance < rule.threshold) {
      return {
        compliant: false,
        details: {
          currentBalance: balance,
          minimumRequired: rule.threshold,
          shortfall: rule.threshold - balance
        },
        recommendations: [
          `Deposit at least $${(rule.threshold - balance).toLocaleString()} to begin active trading`,
          'Start with paper trading to gain experience',
          'Focus on education and strategy development'
        ],
        restrictions: [
          'Limited trading capabilities',
          'Paper trading recommended',
          'Educational features only'
        ],
        restrictionLevel: ACCOUNT_LEVELS.BEGINNER
      };
    }

    return { compliant: true };
  }

  /**
   * Validate options trading authority
   */
  async validateOptionsAuthority(accountData, rule) {
    const hasOptionsApproval = accountData.optionsApproval || false;
    const optionsLevel = accountData.optionsLevel || 0;
    const requestingOptions = accountData.intendedStrategies?.includes('options') || false;

    if (requestingOptions && (!hasOptionsApproval || optionsLevel < 1)) {
      return {
        compliant: false,
        details: {
          hasApproval: hasOptionsApproval,
          approvalLevel: optionsLevel,
          requestingOptions
        },
        recommendations: [
          'Complete options trading application with your broker',
          'Pass options knowledge assessment',
          'Start with basic options education',
          'Begin with Level 1 options strategies'
        ],
        restrictions: [
          'No options trading until approved',
          'Stocks and ETFs only',
          'Complete broker approval process required'
        ],
        restrictionLevel: ACCOUNT_LEVELS.INTERMEDIATE
      };
    }

    return { compliant: true };
  }

  /**
   * Validate margin trading authority
   */
  async validateMarginAuthority(accountData, rule) {
    const hasMarginApproval = accountData.marginApproved || false;
    const requestingMargin = accountData.marginEnabled || false;
    const balance = accountData.balance || 0;

    if (requestingMargin && (!hasMarginApproval || balance < REGULATORY_THRESHOLDS.MARGIN_ACCOUNT)) {
      return {
        compliant: false,
        details: {
          hasMarginApproval,
          accountBalance: balance,
          marginMinimum: REGULATORY_THRESHOLDS.MARGIN_ACCOUNT,
          requestingMargin
        },
        recommendations: [
          'Complete margin account application',
          'Ensure account meets minimum balance requirements',
          'Understand margin risks and requirements',
          'Start with cash account trading'
        ],
        restrictions: [
          'Cash account trading only',
          'No borrowing for trades',
          'T+2 settlement required'
        ],
        restrictionLevel: ACCOUNT_LEVELS.BEGINNER
      };
    }

    return { compliant: true };
  }

  /**
   * Determine trading authority based on account status
   */
  determineTradingAuthority(accountData) {
    const balance = accountData.balance || 0;
    const hasMarginApproval = accountData.marginApproved || false;
    const hasOptionsApproval = accountData.optionsApproval || false;

    let accountType;
    if (balance >= REGULATORY_THRESHOLDS.PATTERN_DAY_TRADING && hasMarginApproval) {
      accountType = 'PDT_ELIGIBLE';
    } else if (balance >= REGULATORY_THRESHOLDS.MARGIN_ACCOUNT && hasMarginApproval) {
      accountType = 'MARGIN_ACCOUNT';
    } else {
      accountType = 'CASH_ACCOUNT';
    }

    const authority = { ...TRADING_AUTHORITY[accountType] };

    // Override based on specific approvals
    if (!hasOptionsApproval) {
      authority.options = false;
    }

    if (!hasMarginApproval) {
      authority.margin = false;
      authority.shortSelling = false;
    }

    return {
      accountType,
      ...authority,
      optionsLevel: accountData.optionsLevel || 0,
      restrictions: this.getTradingRestrictions(accountType, accountData)
    };
  }

  /**
   * Get trading restrictions based on account type
   */
  getTradingRestrictions(accountType, accountData) {
    const restrictions = [];

    switch (accountType) {
      case 'CASH_ACCOUNT':
        restrictions.push(
          'Cash settlement required (T+2)',
          'No margin trading',
          'No short selling',
          'Limited options strategies'
        );
        break;

      case 'MARGIN_ACCOUNT':
        if (accountData.balance < REGULATORY_THRESHOLDS.PATTERN_DAY_TRADING) {
          restrictions.push(
            'Maximum 3 day trades per 5 business days',
            'Day trading restrictions apply'
          );
        }
        break;

      case 'PDT_ELIGIBLE':
        // Minimal restrictions for PDT eligible accounts
        if (accountData.balance < 50000) {
          restrictions.push('Monitor day trading buying power');
        }
        break;
    }

    return restrictions;
  }

  /**
   * Perform additional regulatory checks
   */
  async performAdditionalChecks(accountData, validationResults) {
    // Check for account-specific risks
    await this.checkAccountRisks(accountData, validationResults);
    
    // Validate position limits
    await this.validatePositionLimits(accountData, validationResults);
    
    // Check regulatory compliance history
    await this.checkComplianceHistory(accountData, validationResults);
  }

  /**
   * Check account-specific risk factors
   */
  async checkAccountRisks(accountData, validationResults) {
    const balance = accountData.balance || 0;
    const experience = accountData.experience || 'beginner';
    const riskTolerance = accountData.riskTolerance || 1;

    // Inexperienced trader with high risk tolerance
    if ((experience === 'beginner' || experience === 'complete_beginner') && riskTolerance >= 5) {
      validationResults.warnings.push({
        ruleId: 'inexperienced_high_risk',
        category: 'risk_assessment',
        description: 'High risk tolerance with limited experience',
        severity: VIOLATION_SEVERITY.MEDIUM,
        details: {
          experience,
          riskTolerance,
          recommendedMaxRisk: 2
        },
        recommendations: [
          'Start with conservative risk tolerance',
          'Complete trading education courses',
          'Begin with paper trading',
          'Gradually increase risk as experience grows'
        ]
      });
    }

    // Small account with aggressive strategies
    if (balance < 10000 && accountData.intendedStrategies?.includes('day_trading')) {
      validationResults.warnings.push({
        ruleId: 'small_account_aggressive',
        category: 'account_size',
        description: 'Small account size for intended trading strategy',
        severity: VIOLATION_SEVERITY.MEDIUM,
        details: {
          accountBalance: balance,
          intendedStrategy: 'day_trading',
          recommendedMinimum: 25000
        },
        recommendations: [
          'Consider swing trading instead of day trading',
          'Focus on account growth strategies',
          'Use position sizing appropriate for account size'
        ]
      });
    }
  }

  /**
   * Validate position limits based on account level
   */
  async validatePositionLimits(accountData, validationResults) {
    const balance = accountData.balance || 0;
    const currentPositions = accountData.currentPositions || [];
    
    // Calculate position concentration
    const totalPositionValue = currentPositions.reduce((sum, pos) => sum + (pos.value || 0), 0);
    const concentrationRatio = balance > 0 ? totalPositionValue / balance : 0;

    if (concentrationRatio > 0.95) {
      validationResults.warnings.push({
        ruleId: 'high_concentration',
        category: COMPLIANCE_CATEGORIES.POSITION_LIMITS,
        description: 'Account highly concentrated in current positions',
        severity: VIOLATION_SEVERITY.MEDIUM,
        details: {
          concentrationRatio,
          totalPositionValue,
          accountBalance: balance
        },
        recommendations: [
          'Consider reducing position sizes',
          'Diversify across more positions',
          'Maintain cash reserves for opportunities'
        ]
      });
    }
  }

  /**
   * Check compliance history for patterns
   */
  async checkComplianceHistory(accountData, validationResults) {
    const recentViolations = this.getRecentViolations(accountData.accountId);
    
    if (recentViolations.length >= 3) {
      validationResults.warnings.push({
        ruleId: 'repeated_violations',
        category: 'compliance_history',
        description: 'Pattern of compliance violations detected',
        severity: VIOLATION_SEVERITY.HIGH,
        details: {
          violationCount: recentViolations.length,
          recentViolations: recentViolations.slice(0, 3)
        },
        recommendations: [
          'Review compliance procedures',
          'Consider additional education',
          'Implement stricter risk controls',
          'Consult with compliance officer'
        ]
      });
    }
  }

  /**
   * Record violation for historical tracking
   */
  recordViolation(violation, accountData) {
    this.violationHistory.push({
      ...violation,
      accountId: accountData.accountId || 'unknown',
      accountBalance: accountData.balance,
      recordedAt: Date.now()
    });

    // Keep history manageable (last 1000 violations)
    if (this.violationHistory.length > 1000) {
      this.violationHistory = this.violationHistory.slice(-1000);
    }
  }

  /**
   * Get recent violations for an account
   */
  getRecentViolations(accountId, days = 30) {
    const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    return this.violationHistory.filter(violation => 
      violation.accountId === accountId && violation.recordedAt >= cutoffDate
    );
  }

  /**
   * Determine restricted account level based on violation
   */
  getRestrictedLevel(violation) {
    if (violation.restrictionLevel) {
      return violation.restrictionLevel;
    }

    // Default restrictions based on severity
    switch (violation.severity) {
      case VIOLATION_SEVERITY.CRITICAL:
        return ACCOUNT_LEVELS.BEGINNER;
      case VIOLATION_SEVERITY.HIGH:
        return ACCOUNT_LEVELS.BEGINNER;
      case VIOLATION_SEVERITY.MEDIUM:
        return ACCOUNT_LEVELS.INTERMEDIATE;
      default:
        return ACCOUNT_LEVELS.ADVANCED;
    }
  }

  /**
   * Utility method for level hierarchy comparison
   */
  getLevelHierarchy(level) {
    const hierarchy = {
      [ACCOUNT_LEVELS.BEGINNER]: 1,
      [ACCOUNT_LEVELS.INTERMEDIATE]: 2,
      [ACCOUNT_LEVELS.ADVANCED]: 3
    };
    return hierarchy[level] || 0;
  }

  /**
   * Get all compliance rules for documentation
   */
  getComplianceRules() {
    return this.complianceRules;
  }

  /**
   * Get violation history
   */
  getViolationHistory(accountId = null, limit = 100) {
    let history = this.violationHistory;
    
    if (accountId) {
      history = history.filter(v => v.accountId === accountId);
    }
    
    return history.slice(-limit);
  }

  /**
   * Get compliance summary for account
   */
  getComplianceSummary(accountData) {
    if (!this.lastValidation) {
      return null;
    }

    const recentViolations = this.getRecentViolations(accountData.accountId);
    
    return {
      lastValidation: this.lastValidation.timestamp,
      isCompliant: this.lastValidation.isCompliant,
      violationCount: this.lastValidation.violations.length,
      warningCount: this.lastValidation.warnings.length,
      maxAllowedLevel: this.lastValidation.maxAllowedLevel,
      tradingAuthority: this.lastValidation.tradingAuthority,
      recentViolationCount: recentViolations.length,
      riskLevel: this.assessRiskLevel(this.lastValidation, recentViolations)
    };
  }

  /**
   * Assess overall compliance risk level
   */
  assessRiskLevel(validation, recentViolations) {
    let riskScore = 0;

    // Critical violations
    riskScore += validation.violations.filter(v => v.severity === VIOLATION_SEVERITY.CRITICAL).length * 10;
    
    // High severity violations
    riskScore += validation.violations.filter(v => v.severity === VIOLATION_SEVERITY.HIGH).length * 5;
    
    // Recent violation pattern
    riskScore += recentViolations.length * 2;

    if (riskScore >= 20) return 'critical';
    if (riskScore >= 10) return 'high';
    if (riskScore >= 5) return 'medium';
    return 'low';
  }
}

export default RegulatoryComplianceValidator; 