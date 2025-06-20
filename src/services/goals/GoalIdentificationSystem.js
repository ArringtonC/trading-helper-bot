/**
 * Goal Identification System
 * Research-backed implementation for identifying trader goals and matching to appropriate strategies
 * 
 * Based on research findings:
 * - Income Generation: 32% of new traders
 * - Growth Seeking: 28% of new traders  
 * - Capital Preservation: 25% of new traders
 * - Learning/Practice: 10% of new traders
 * - Active Trading: 5% of new traders
 * 
 * Includes psychological bias detection and goal conflict resolution
 */

class GoalIdentificationSystem {
  constructor() {
    this.goalCategories = {
      INCOME_GENERATION: {
        id: 'income',
        name: 'Income Generation',
        percentage: 32,
        description: 'Generate regular income through dividends and stable returns',
        icon: 'dollar-sign',
        color: '#10B981', // Green
        characteristics: {
          dividendYield: { min: 2.5, max: 8.0 },
          sectors: ['Utilities', 'REITs', 'Consumer Staples'],
          beta: { max: 1.0 },
          payoutRatio: { max: 0.8 },
          riskLevel: 'low'
        }
      },
      GROWTH_SEEKING: {
        id: 'growth',
        name: 'Growth Seeking',
        percentage: 28,
        description: 'Pursue capital appreciation through growth opportunities',
        icon: 'trending-up',
        color: '#3B82F6', // Blue
        characteristics: {
          marketCap: { max: 1000000000 }, // $1B for maximum growth potential
          epsGrowth: { percentile: 80 }, // Top 20%
          pegRatio: { max: 2.0 },
          smallCapAdvantage: 0.15, // 15-20% more profitable
          riskLevel: 'medium-high'
        }
      },
      CAPITAL_PRESERVATION: {
        id: 'preservation',
        name: 'Capital Preservation',
        percentage: 25,
        description: 'Protect capital with defensive investments',
        icon: 'shield',
        color: '#8B5CF6', // Purple
        characteristics: {
          beta: { max: 1.0 },
          sectors: ['Healthcare', 'Utilities', 'Consumer Staples'],
          earningsConsistency: { years: 5 },
          marketPosition: 'blue-chip',
          riskLevel: 'low'
        }
      },
      LEARNING_PRACTICE: {
        id: 'learning',
        name: 'Learning & Practice',
        percentage: 10,
        description: 'Learn trading skills in a safe environment',
        icon: 'book-open',
        color: '#F59E0B', // Amber
        characteristics: {
          paperTrading: true,
          mistakeFriendly: true,
          educationalValue: 'high',
          riskLevel: 'none'
        }
      },
      ACTIVE_TRADING: {
        id: 'active',
        name: 'Active Trading',
        percentage: 5,
        description: 'Short-term trading with higher risk/reward',
        icon: 'zap',
        color: '#EF4444', // Red
        characteristics: {
          minEquity: 25000, // PDT rule
          volatility: 'high',
          warningLevel: 'high',
          dayTradingRisk: 'extreme',
          riskLevel: 'very-high'
        }
      }
    };

    this.psychologicalBiases = {
      PROJECTION_BIAS: {
        name: 'Projection Bias',
        description: 'Projecting current emotions onto future market conditions',
        detectionPatterns: [
          'recent_market_performance_focus',
          'emotional_language_in_goals',
          'unrealistic_timeline_expectations'
        ]
      },
      OVERCONFIDENCE_BIAS: {
        name: 'Overconfidence Bias',
        description: 'Overestimating abilities, ignoring stop-losses',
        detectionPatterns: [
          'no_stop_loss_consideration',
          'high_frequency_trading_goals',
          'dismissal_of_risk_warnings'
        ]
      },
      LOSS_AVERSION: {
        name: 'Loss Aversion',
        description: 'Feeling losses more deeply than gains',
        detectionPatterns: [
          'excessive_preservation_focus',
          'no_risk_tolerance',
          'guaranteed_return_expectations'
        ]
      }
    };

    this.goalConflicts = {
      SAFETY_QUICK_PROFITS: {
        conflict: 'Safety + Quick Profits',
        resolution: 'Educate on risk/return relationship - these are contradictory goals',
        educationRequired: true
      },
      UNREALISTIC_RETURNS: {
        conflict: 'Unrealistic return expectations',
        thresholds: {
          monthly: { unrealistic: 0.30 }, // 30% monthly
          annual: { aggressive: 0.20, unrealistic: 0.50 }
        },
        resolution: 'Provide market reality education and realistic benchmarks'
      }
    };
  }

  /**
   * Create adaptive questionnaire based on user experience level
   * Implements progressive disclosure for experience-appropriate questions
   */
  createGoalQuestionnaire(userLevel = 'beginner') {
    const baseQuestions = [
      {
        id: 'primary_goal',
        type: 'single-select',
        question: 'What is your primary investment goal?',
        required: true,
        options: Object.values(this.goalCategories).map(category => ({
          value: category.id,
          label: category.name,
          description: category.description,
          percentage: `${category.percentage}% of new traders`
        }))
      },
      {
        id: 'time_horizon',
        type: 'single-select',
        question: 'What is your investment time horizon?',
        required: true,
        options: [
          { value: 'short', label: 'Less than 1 year', risk: 'high' },
          { value: 'medium', label: '1-5 years', risk: 'medium' },
          { value: 'long', label: '5+ years', risk: 'low' }
        ]
      },
      {
        id: 'risk_tolerance',
        type: 'scale',
        question: 'How comfortable are you with investment risk?',
        required: true,
        scale: { min: 1, max: 10 },
        labels: { 1: 'Very Conservative', 10: 'Very Aggressive' },
        biasDetection: ['loss_aversion', 'overconfidence']
      },
      {
        id: 'experience_level',
        type: 'single-select',
        question: 'What is your trading experience?',
        required: true,
        options: [
          { value: 'none', label: 'No experience', guidance: 'learning_focused' },
          { value: 'beginner', label: 'Some reading/research', guidance: 'education_first' },
          { value: 'intermediate', label: 'Some trading experience', guidance: 'moderate_risk' },
          { value: 'advanced', label: 'Experienced trader', guidance: 'full_access' }
        ]
      }
    ];

    const progressiveQuestions = this.getProgressiveQuestions(userLevel);
    return {
      sections: [
        {
          title: 'Investment Goals',
          description: 'Help us understand what you want to achieve',
          questions: baseQuestions
        },
        {
          title: 'Additional Details',
          description: 'Refine your investment strategy',
          questions: progressiveQuestions,
          progressive: true
        }
      ],
      biasDetection: true,
      conflictResolution: true
    };
  }

  /**
   * Get experience-appropriate progressive questions
   */
  getProgressiveQuestions(userLevel) {
    const allQuestions = {
      beginner: [
        {
          id: 'monthly_income_expectation',
          type: 'number',
          question: 'What monthly return do you hope to achieve? (%)',
          validation: { max: 15, warningThreshold: 10 },
          biasDetection: ['unrealistic_expectations', 'projection_bias']
        },
        {
          id: 'loss_comfort',
          type: 'single-select',
          question: 'How would you feel about a 20% portfolio decline?',
          options: [
            { value: 'panic', label: 'Very uncomfortable - would sell immediately' },
            { value: 'concerned', label: 'Concerned but would hold' },
            { value: 'opportunity', label: 'See it as a buying opportunity' }
          ],
          biasDetection: ['loss_aversion']
        }
      ],
      intermediate: [
        {
          id: 'sector_preferences',
          type: 'multi-select',
          question: 'Which sectors interest you most?',
          options: [
            { value: 'technology', label: 'Technology' },
            { value: 'healthcare', label: 'Healthcare' },
            { value: 'finance', label: 'Financial Services' },
            { value: 'energy', label: 'Energy' },
            { value: 'reits', label: 'Real Estate (REITs)' },
            { value: 'utilities', label: 'Utilities' }
          ]
        },
        {
          id: 'active_management',
          type: 'scale',
          question: 'How actively do you want to manage your investments?',
          scale: { min: 1, max: 5 },
          labels: { 1: 'Set and forget', 5: 'Daily monitoring' }
        }
      ],
      advanced: [
        {
          id: 'options_interest',
          type: 'boolean',
          question: 'Are you interested in options trading?',
          warning: 'Options involve significant additional risk'
        },
        {
          id: 'margin_usage',
          type: 'boolean',
          question: 'Would you consider using margin?',
          warning: 'Margin amplifies both gains and losses'
        }
      ]
    };

    return allQuestions[userLevel] || allQuestions.beginner;
  }

  /**
   * Analyze questionnaire responses to identify trader goals
   * Includes bias detection and goal conflict identification
   */
  identifyTraderGoals(responses) {
    const analysis = {
      primaryGoal: null,
      secondaryGoals: [],
      riskProfile: null,
      biasesDetected: [],
      conflicts: [],
      recommendations: [],
      educationNeeded: []
    };

    // Identify primary goal
    const goalKey = responses.primary_goal?.toUpperCase() + '_' + 
      (responses.primary_goal === 'income' ? 'GENERATION' : 
       responses.primary_goal === 'growth' ? 'SEEKING' :
       responses.primary_goal === 'preservation' ? 'PRESERVATION' :
       responses.primary_goal === 'learning' ? 'PRACTICE' :
       responses.primary_goal === 'active' ? 'TRADING' : '');
    
    analysis.primaryGoal = this.goalCategories[goalKey] || null;
    
    // Assess risk profile
    analysis.riskProfile = this.assessRiskProfile(responses);
    
    // Detect psychological biases
    analysis.biasesDetected = this.detectBiases(responses);
    
    // Check for goal conflicts
    analysis.conflicts = this.identifyGoalConflicts(responses, analysis.primaryGoal);
    
    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(responses, analysis);
    
    // Determine education needs
    analysis.educationNeeded = this.determineEducationNeeds(analysis);

    return analysis;
  }

  /**
   * Assess risk profile based on responses
   */
  assessRiskProfile(responses) {
    const riskScore = responses.risk_tolerance || 5;
    const timeHorizon = responses.time_horizon;
    const experience = responses.experience_level;

    let adjustedRisk = riskScore;

    // Adjust for time horizon
    if (timeHorizon === 'short') adjustedRisk *= 0.7;
    if (timeHorizon === 'long') adjustedRisk *= 1.2;

    // Adjust for experience
    if (experience === 'none' || experience === 'beginner') adjustedRisk *= 0.8;
    if (experience === 'advanced') adjustedRisk *= 1.1;

    return {
      score: Math.min(10, Math.max(1, adjustedRisk)),
      category: this.getRiskCategory(adjustedRisk),
      timeHorizon,
      experience
    };
  }

  /**
   * Detect psychological biases in responses
   */
  detectBiases(responses) {
    const biases = [];

    // Check for unrealistic return expectations
    if (responses.monthly_income_expectation > 15) {
      biases.push({
        type: 'OVERCONFIDENCE_BIAS',
        evidence: 'Unrealistic monthly return expectations',
        severity: 'high'
      });
    }

    // Check for projection bias
    if (responses.risk_tolerance > 8 && responses.loss_comfort === 'panic') {
      biases.push({
        type: 'PROJECTION_BIAS',
        evidence: 'High risk tolerance but low loss tolerance',
        severity: 'medium'
      });
    }

    // Check for loss aversion
    if (responses.loss_comfort === 'panic' && responses.risk_tolerance < 4) {
      biases.push({
        type: 'LOSS_AVERSION',
        evidence: 'Strong aversion to losses',
        severity: 'medium'
      });
    }

    return biases;
  }

  /**
   * Identify conflicts between stated goals
   */
  identifyGoalConflicts(responses, primaryGoal) {
    const conflicts = [];

    // Check for safety + quick profits conflict
    if (primaryGoal?.id === 'preservation' && responses.monthly_income_expectation > 10) {
      conflicts.push({
        type: 'SAFETY_QUICK_PROFITS',
        description: 'Capital preservation goal conflicts with high return expectations',
        resolution: this.goalConflicts.SAFETY_QUICK_PROFITS.resolution,
        educationRequired: true
      });
    }

    // Check for unrealistic return expectations
    if (responses.monthly_income_expectation > 20) {
      conflicts.push({
        type: 'UNREALISTIC_RETURNS',
        description: 'Return expectations exceed realistic market possibilities',
        resolution: this.goalConflicts.UNREALISTIC_RETURNS.resolution,
        educationRequired: true
      });
    }

    return conflicts;
  }

  /**
   * Generate personalized recommendations
   */
  generateRecommendations(responses, analysis) {
    const recommendations = [];
    const goal = analysis.primaryGoal;

    if (!goal) return recommendations;

    // Goal-specific recommendations
    switch (goal.id) {
      case 'income':
        recommendations.push({
          type: 'strategy',
          title: 'Focus on Dividend Stocks',
          description: 'Look for companies with 2.5-8% dividend yields and consistent payment history',
          priority: 'high'
        });
        break;

      case 'growth':
        recommendations.push({
          type: 'strategy',
          title: 'Consider Small-Cap Growth',
          description: 'Small-cap stocks show 15-20% higher profitability than large-cap',
          priority: 'high'
        });
        break;

      case 'preservation':
        recommendations.push({
          type: 'strategy',
          title: 'Defensive Investment Approach',
          description: 'Focus on low-beta stocks in defensive sectors',
          priority: 'high'
        });
        break;

      case 'learning':
        recommendations.push({
          type: 'education',
          title: 'Start with Paper Trading',
          description: 'Practice with virtual money before risking real capital',
          priority: 'critical'
        });
        break;

      case 'active':
        recommendations.push({
          type: 'warning',
          title: 'Day Trading Risk Warning',
          description: 'Over 90% of day traders lose money. Ensure $25K minimum equity.',
          priority: 'critical'
        });
        break;
    }

    // Risk-based recommendations
    if (analysis.riskProfile.score < 4) {
      recommendations.push({
        type: 'education',
        title: 'Conservative Investment Education',
        description: 'Learn about low-risk investment strategies and diversification',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  /**
   * Determine what education is needed
   */
  determineEducationNeeds(analysis) {
    const education = [];

    // Bias-based education
    analysis.biasesDetected.forEach(bias => {
      education.push({
        topic: bias.type,
        title: this.psychologicalBiases[bias.type].name,
        description: this.psychologicalBiases[bias.type].description,
        priority: bias.severity
      });
    });

    // Conflict-based education
    analysis.conflicts.forEach(conflict => {
      if (conflict.educationRequired) {
        education.push({
          topic: conflict.type,
          title: 'Goal Alignment Education',
          description: conflict.resolution,
          priority: 'high'
        });
      }
    });

    return education;
  }

  /**
   * Validate goal realism based on account size and experience
   */
  validateGoalRealism(goals, accountSize, experience) {
    const validation = {
      realistic: true,
      warnings: [],
      adjustments: []
    };

    // Check account size vs goals
    if (goals.primaryGoal?.id === 'active' && accountSize < 25000) {
      validation.realistic = false;
      validation.warnings.push({
        type: 'regulatory',
        message: 'Day trading requires $25,000 minimum equity (PDT rule)',
        solution: 'Consider other strategies or increase account size'
      });
    }

    // Check experience vs complexity
    if (experience === 'none' && goals.primaryGoal?.riskLevel === 'very-high') {
      validation.warnings.push({
        type: 'experience_mismatch',
        message: 'Selected strategy may be too complex for experience level',
        solution: 'Consider starting with learning/practice goals'
      });
    }

    return validation;
  }

  /**
   * Get risk category from numeric score
   */
  getRiskCategory(score) {
    if (score <= 3) return 'conservative';
    if (score <= 5) return 'moderate';
    if (score <= 7) return 'aggressive';
    return 'very_aggressive';
  }

  /**
   * Get goal category by ID
   */
  getGoalCategory(goalId) {
    return Object.values(this.goalCategories).find(cat => cat.id === goalId);
  }

  /**
   * Get all goal categories with statistics
   */
  getAllGoalCategories() {
    return Object.values(this.goalCategories);
  }
}

export default GoalIdentificationSystem; 