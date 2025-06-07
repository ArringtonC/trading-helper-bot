/**
 * Account Validation Engine for Position Sizing Foundation
 * Provides comprehensive account size validation, funding recommendations, and timeline planning
 */

export interface TradingGoals {
  targetMonthlyIncome?: number;
  expectedWinRate?: number;
  averageWinAmount?: number;
  tradingFrequency?: 'daily' | 'weekly' | 'monthly';
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
}

export interface AccountValidationResult {
  isViable: boolean;
  isOptimal: boolean;
  calculations: {
    minimumViableAccount: number;
    recommendedAccount: number;
    shortfall: number;
    fundingNeeded: number;
  };
  recommendations: FundingRecommendation;
}

export interface FundingRecommendation {
  severity: 'critical' | 'warning' | 'success';
  title: string;
  message: string;
  recommendations: string[];
  actions?: Array<{
    text: string;
    action: string;
    primary?: boolean;
  }>;
}

export interface FundingPlan {
  timeline: FundingMonth[];
  totalMonths: number;
  totalContributions: number;
  milestones: Milestone[];
  summary: {
    currentBalance: number;
    targetBalance: number;
    monthlyContribution: number;
    finalTradingCapacity: TradingCapacity;
  };
}

export interface FundingMonth {
  month: number;
  contribution: number;
  balance: number;
  tradingCapacity: TradingCapacity;
  milestone?: string;
}

export interface TradingCapacity {
  conservativePositionSize: number;  // 0.5% risk
  moderatePositionSize: number;      // 1.5% risk
  aggressivePositionSize: number;    // 2.5% risk
  maxConcurrentTrades: number;
  monthlyTradingPotential: number;
}

export interface Milestone {
  month: number;
  description: string;
  achievement: string;
  tradingCapacity: TradingCapacity;
}

export class AccountValidationEngine {
  private static readonly VALIDATION_CONSTANTS = {
    MINIMUM_RISK_BUFFER_TRADES: 50,  // Account should support 50 trades worth of risk
    ABSOLUTE_MINIMUM_ACCOUNT: 2000,  // $2,000 absolute minimum
    RECOMMENDED_MINIMUM_ACCOUNT: 5000, // $5,000 recommended minimum
    SAFETY_MARGIN_MULTIPLIER: 100,   // 100x safety margin for income goals
    RISK_PERCENTAGES: {
      conservative: 0.005,  // 0.5%
      moderate: 0.015,      // 1.5%
      aggressive: 0.025     // 2.5%
    }
  };

  /**
   * Validate account size against trading goals and risk parameters
   */
  public static validateAccountForGoals(
    accountBalance: number,
    riskPercent: number,
    targetTradeSize: number,
    tradingGoals: TradingGoals = {}
  ): AccountValidationResult {
    const calculations = {
      minimumViableAccount: this.calculateMinimumAccount(riskPercent, targetTradeSize),
      recommendedAccount: this.calculateRecommendedAccount(tradingGoals),
      shortfall: 0,
      fundingNeeded: 0
    };

    calculations.shortfall = Math.max(0, calculations.minimumViableAccount - accountBalance);
    calculations.fundingNeeded = Math.max(0, calculations.recommendedAccount - accountBalance);

    const isViable = accountBalance >= calculations.minimumViableAccount;
    const isOptimal = accountBalance >= calculations.recommendedAccount;

    return {
      isViable,
      isOptimal,
      calculations,
      recommendations: this.generateFundingRecommendations(calculations, accountBalance)
    };
  }

  /**
   * Calculate minimum viable account size based on risk profile
   * Uses practical minimums based on trading research and risk management best practices
   */
  private static calculateMinimumAccount(riskPercent: number, targetTradeSize: number): number {
    // Set practical minimums based on risk profile and trading research
    // These are based on real-world trading requirements and risk management
    const riskProfileMinimums = {
      conservative: 3000,   // 0.75% risk - $3k minimum for conservative trading
      moderate: 5000,       // 1.5% risk - $5k minimum for moderate trading  
      aggressive: 10000     // 2.5% risk - $10k minimum for aggressive trading
    };
    
    let profileMinimum = this.VALIDATION_CONSTANTS.ABSOLUTE_MINIMUM_ACCOUNT;
    if (riskPercent <= 1.0) {
      profileMinimum = riskProfileMinimums.conservative;
    } else if (riskPercent <= 2.0) {
      profileMinimum = riskProfileMinimums.moderate;
    } else {
      profileMinimum = riskProfileMinimums.aggressive;
    }
    
    // For accounts below the profile minimum, calculate what they could safely trade
    // This gives users a realistic target based on their risk tolerance
    const safeTradeSize = Math.min(targetTradeSize, 50); // Cap at $50 risk per trade for validation
    const minimumForTradeSize = safeTradeSize / (riskPercent / 100) * 3; // 3x buffer (more practical)
    
    // Use the higher of profile minimum or calculated minimum, but cap the calculation-based minimum
    const cappedCalculatedMinimum = Math.min(minimumForTradeSize, profileMinimum * 3);
    const finalMinimum = Math.max(profileMinimum, cappedCalculatedMinimum);
    
    // Return the calculated minimum account size
    return finalMinimum;
  }

  /**
   * Calculate recommended account size based on trading goals
   */
  private static calculateRecommendedAccount(tradingGoals: TradingGoals): number {
    const {
      targetMonthlyIncome = 0,
      expectedWinRate = 0.6,
      averageWinAmount = 100,
      tradingFrequency = 'weekly'
    } = tradingGoals;

    if (targetMonthlyIncome > 0 && expectedWinRate > 0 && averageWinAmount > 0) {
      // Calculate required trading volume for income goals
      const monthlyTradesNeeded = targetMonthlyIncome / (expectedWinRate * averageWinAmount);
      const recommendedFromGoals = monthlyTradesNeeded * this.VALIDATION_CONSTANTS.SAFETY_MARGIN_MULTIPLIER;
      
      return Math.max(
        recommendedFromGoals,
        this.VALIDATION_CONSTANTS.RECOMMENDED_MINIMUM_ACCOUNT
      );
    }

    // Default recommendation based on trading frequency
    const frequencyMultipliers = {
      daily: 25000,    // $25k for daily trading
      weekly: 10000,   // $10k for weekly trading
      monthly: 5000    // $5k for monthly trading
    };

    return frequencyMultipliers[tradingFrequency] || this.VALIDATION_CONSTANTS.RECOMMENDED_MINIMUM_ACCOUNT;
  }

  /**
   * Generate funding recommendations based on account validation
   */
  private static generateFundingRecommendations(
    calculations: AccountValidationResult['calculations'],
    currentBalance: number
  ): FundingRecommendation {
    const { shortfall, fundingNeeded, minimumViableAccount, recommendedAccount } = calculations;

    if (shortfall > 0) {
      return {
        severity: 'critical',
        title: '⚠️ Account Size Too Low for Safe Trading',
        message: `Your account needs an additional $${shortfall.toLocaleString()} to safely trade with your selected risk level.`,
        recommendations: [
          `Add $${shortfall.toLocaleString()} to reach minimum viable account size of $${minimumViableAccount.toLocaleString()}`,
          'Consider reducing risk percentage until you can fund the account properly',
          'Start with paper trading to practice while building capital',
          'Focus on education and strategy development during funding period'
        ],
        actions: [
          { text: 'Calculate Funding Plan', action: 'showFundingPlan', primary: true },
          { text: 'Reduce Risk Level', action: 'adjustRisk' },
          { text: 'Start Paper Trading', action: 'enablePaperMode' },
          { text: 'Learn More About Account Sizing', action: 'showEducation' }
        ]
      };
    }

    if (fundingNeeded > 0) {
      return {
        severity: 'warning',
        title: '💡 Consider Additional Funding for Optimal Results',
        message: `While your account meets minimum requirements, adding $${fundingNeeded.toLocaleString()} would optimize your trading potential.`,
        recommendations: [
          `Target account size: $${recommendedAccount.toLocaleString()} for your trading goals`,
          'Current account allows limited position sizes and fewer opportunities',
          'Gradual funding increases can improve risk-adjusted returns',
          'Larger account size provides more flexibility and diversification'
        ],
        actions: [
          { text: 'Show Funding Timeline', action: 'showFundingTimeline', primary: true },
          { text: 'Proceed with Current Balance', action: 'acceptCurrentBalance' }
        ]
      };
    }

    return {
      severity: 'success',
      title: '✅ Account Size Optimal for Trading Goals',
      message: 'Your account balance supports your risk parameters and trading objectives.',
      recommendations: [
        'Account size allows for proper position diversification',
        'Risk management parameters are well-calibrated',
        'Ready to proceed with live trading',
        'Consider setting aside additional funds for opportunities'
      ]
    };
  }

  /**
   * Create detailed funding plan with monthly timeline
   */
  public static createFundingPlan(
    currentBalance: number,
    targetBalance: number,
    monthlyContribution: number
  ): FundingPlan {
    const shortfall = Math.max(0, targetBalance - currentBalance);
    const monthsToTarget = Math.ceil(shortfall / monthlyContribution);
    
    const timeline: FundingMonth[] = [];
    let runningBalance = currentBalance;
    
    // Add current month (month 0)
    timeline.push({
      month: 0,
      contribution: 0,
      balance: currentBalance,
      tradingCapacity: this.calculateTradingCapacity(currentBalance)
    });
    
    for (let month = 1; month <= monthsToTarget; month++) {
      runningBalance += monthlyContribution;
      const finalBalance = Math.min(runningBalance, targetBalance);
      
      timeline.push({
        month,
        contribution: monthlyContribution,
        balance: finalBalance,
        tradingCapacity: this.calculateTradingCapacity(finalBalance)
      });
    }

    const milestones = this.generateMilestones(timeline, targetBalance);

    return {
      timeline,
      totalMonths: monthsToTarget,
      totalContributions: shortfall,
      milestones,
      summary: {
        currentBalance,
        targetBalance,
        monthlyContribution,
        finalTradingCapacity: this.calculateTradingCapacity(targetBalance)
      }
    };
  }

  /**
   * Calculate trading capacity for a given account balance
   */
  public static calculateTradingCapacity(balance: number): TradingCapacity {
    const { conservative, moderate, aggressive } = this.VALIDATION_CONSTANTS.RISK_PERCENTAGES;
    
    return {
      conservativePositionSize: balance * conservative,
      moderatePositionSize: balance * moderate,
      aggressivePositionSize: balance * aggressive,
      maxConcurrentTrades: Math.floor(balance / 1000), // Rough estimate: $1k per concurrent trade
      monthlyTradingPotential: balance * moderate * 4 // Assuming 4 trades per month at moderate risk
    };
  }

  /**
   * Generate funding milestones based on timeline
   */
  private static generateMilestones(timeline: FundingMonth[], targetBalance: number): Milestone[] {
    const milestones: Milestone[] = [];
    const significantThresholds = [2000, 5000, 10000, 25000, 50000, 100000];
    
    timeline.forEach(month => {
      significantThresholds.forEach(threshold => {
        if (month.balance >= threshold && 
            (month.month === 0 || timeline[month.month - 1]?.balance < threshold)) {
          
          let description = '';
          let achievement = '';
          
          switch (threshold) {
            case 2000:
              description = 'Minimum Account Threshold';
              achievement = 'Basic position sizing now possible';
              break;
            case 5000:
              description = 'Recommended Minimum Reached';
              achievement = 'Improved risk management and diversification';
              break;
            case 10000:
              description = 'Intermediate Trading Capital';
              achievement = 'Multiple concurrent positions possible';
              break;
            case 25000:
              description = 'Advanced Trading Capital';
              achievement = 'Day trading eligible, enhanced opportunities';
              break;
            case 50000:
              description = 'Professional Trading Capital';
              achievement = 'Full strategy diversification possible';
              break;
            case 100000:
              description = 'Elite Trading Capital';
              achievement = 'Maximum flexibility and opportunity access';
              break;
          }
          
          milestones.push({
            month: month.month,
            description,
            achievement,
            tradingCapacity: month.tradingCapacity
          });
        }
      });
    });
    
    return milestones;
  }

  /**
   * Get account size recommendations based on trading style
   */
  public static getAccountSizeRecommendations(tradingStyle: string): {
    minimum: number;
    recommended: number;
    optimal: number;
    description: string;
  } {
    const recommendations: Record<string, {
      minimum: number;
      recommended: number;
      optimal: number;
      description: string;
    }> = {
      'day-trading': {
        minimum: 25000,
        recommended: 50000,
        optimal: 100000,
        description: 'Day trading requires significant capital due to PDT rules and frequent position changes'
      },
      'swing-trading': {
        minimum: 5000,
        recommended: 15000,
        optimal: 30000,
        description: 'Swing trading allows for smaller accounts with proper position sizing'
      },
      'position-trading': {
        minimum: 10000,
        recommended: 25000,
        optimal: 50000,
        description: 'Position trading requires patience and sufficient capital for longer holds'
      },
      'options-trading': {
        minimum: 2000,
        recommended: 10000,
        optimal: 25000,
        description: 'Options trading can start smaller but benefits from larger accounts for diversification'
      }
    };

    return recommendations[tradingStyle] || recommendations['options-trading'];
  }

  /**
   * Calculate funding timeline for different contribution scenarios
   */
  public static calculateFundingScenarios(
    currentBalance: number,
    targetBalance: number
  ): Array<{
    monthlyContribution: number;
    timeToTarget: number;
    totalContributions: number;
    scenario: string;
  }> {
    const shortfall = targetBalance - currentBalance;
    const scenarios = [
      { amount: 250, scenario: 'Conservative' },
      { amount: 500, scenario: 'Moderate' },
      { amount: 1000, scenario: 'Aggressive' },
      { amount: 2000, scenario: 'Accelerated' }
    ];

    return scenarios.map(({ amount, scenario }) => ({
      monthlyContribution: amount,
      timeToTarget: Math.ceil(shortfall / amount),
      totalContributions: shortfall,
      scenario
    }));
  }
} 