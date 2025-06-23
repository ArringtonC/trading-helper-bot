class SP500DemoService {
  constructor() {
    this.marketData = null;
    this.marketEvents = null;
    this.loaded = false;
  }

  /**
   * Load S&P 500 data and events from public data files
   */
  async loadData() {
    if (this.loaded) return { marketData: this.marketData, marketEvents: this.marketEvents };

    try {
      // Load market data
      const marketResponse = await fetch('/data/SP500_2025_Complete.csv');
      const marketText = await marketResponse.text();
      this.marketData = this.parseCSV(marketText);

      // Load market events
      const eventsResponse = await fetch('/data/SP500_2025_NewsEvents.json');
      const eventsData = await eventsResponse.json();
      this.marketEvents = eventsData.events;

      this.loaded = true;
      return { marketData: this.marketData, marketEvents: this.marketEvents };
    } catch (error) {
      console.error('Error loading S&P 500 data:', error);
      throw new Error('Failed to load market data');
    }
  }

  /**
   * Parse CSV data into structured format
   */
  parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const data = {};
      headers.forEach((header, index) => {
        const value = values[index];
        if (header === 'Date') {
          data[header] = value;
        } else {
          data[header] = parseFloat(value);
        }
      });
      return data;
    });
  }

  /**
   * Calculate match percentage between user profile and template
   */
  calculateProfileMatch(userProfile, templateProfile) {
    const weights = {
      accountSize: 0.2,
      riskTolerance: 0.25,
      experience: 0.2,
      primaryGoal: 0.25,
      timeHorizon: 0.1
    };

    let totalScore = 0;

    // Account size similarity (logarithmic scale for better matching)
    if (userProfile.accountSize && templateProfile.accountSize) {
      const userLog = Math.log10(userProfile.accountSize);
      const templateLog = Math.log10(templateProfile.accountSize);
      const sizeDiff = Math.abs(userLog - templateLog);
      const sizeScore = Math.max(0, 1 - sizeDiff / 2); // Normalize to 0-1
      totalScore += sizeScore * weights.accountSize;
    }

    // Risk tolerance match
    if (userProfile.riskTolerance === templateProfile.riskTolerance) {
      totalScore += weights.riskTolerance;
    } else {
      // Partial credit for adjacent risk levels
      const riskLevels = ['conservative', 'moderate', 'aggressive'];
      const userIndex = riskLevels.indexOf(userProfile.riskTolerance);
      const templateIndex = riskLevels.indexOf(templateProfile.riskTolerance);
      const riskDiff = Math.abs(userIndex - templateIndex);
      if (riskDiff === 1) {
        totalScore += weights.riskTolerance * 0.5; // Half credit for adjacent levels
      }
    }

    // Experience level match
    if (userProfile.experience === templateProfile.experience) {
      totalScore += weights.experience;
    } else {
      // Partial credit for adjacent experience levels
      const expLevels = ['beginner', 'intermediate', 'advanced'];
      const userIndex = expLevels.indexOf(userProfile.experience);
      const templateIndex = expLevels.indexOf(templateProfile.experience);
      const expDiff = Math.abs(userIndex - templateIndex);
      if (expDiff === 1) {
        totalScore += weights.experience * 0.5;
      }
    }

    // Primary goal match
    if (userProfile.primaryGoal === templateProfile.primaryGoal) {
      totalScore += weights.primaryGoal;
    } else {
      // Partial credit for compatible goals
      const compatibleGoals = {
        'income': ['preservation'],
        'growth': ['trading'],
        'preservation': ['income'],
        'learning': ['income', 'growth'],
        'trading': ['growth']
      };
      
      if (compatibleGoals[userProfile.primaryGoal]?.includes(templateProfile.primaryGoal)) {
        totalScore += weights.primaryGoal * 0.3;
      }
    }

    // Time horizon match
    if (userProfile.timeHorizon === templateProfile.timeHorizon) {
      totalScore += weights.timeHorizon;
    } else {
      // Partial credit for adjacent time horizons
      const horizons = ['short', 'medium', 'long'];
      const userIndex = horizons.indexOf(userProfile.timeHorizon);
      const templateIndex = horizons.indexOf(templateProfile.timeHorizon);
      const horizonDiff = Math.abs(userIndex - templateIndex);
      if (horizonDiff === 1) {
        totalScore += weights.timeHorizon * 0.5;
      }
    }

    return Math.round(totalScore * 100);
  }

  /**
   * Get market data for specific date range
   */
  getMarketDataForRange(startDate, endDate) {
    if (!this.marketData) {
      throw new Error('Market data not loaded');
    }

    return this.marketData.filter(data => {
      const dataDate = new Date(data.Date);
      return dataDate >= new Date(startDate) && dataDate <= new Date(endDate);
    });
  }

  /**
   * Get market events for specific date range
   */
  getEventsForRange(startDate, endDate) {
    if (!this.marketEvents) {
      throw new Error('Market events not loaded');
    }

    return this.marketEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= new Date(startDate) && eventDate <= new Date(endDate);
    });
  }

  /**
   * Calculate scenario metrics
   */
  calculateScenarioMetrics(startDate, endDate) {
    const data = this.getMarketDataForRange(startDate, endDate);
    if (data.length < 2) {
      return null;
    }

    const startPrice = data[0].Close;
    const endPrice = data[data.length - 1].Close;
    const totalReturn = ((endPrice - startPrice) / startPrice) * 100;

    // Calculate maximum drawdown
    let peak = startPrice;
    let maxDrawdown = 0;
    
    data.forEach(point => {
      if (point.High > peak) {
        peak = point.High;
      }
      const drawdown = ((point.Low - peak) / peak) * 100;
      if (drawdown < maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    // Calculate volatility (simplified daily volatility)
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      const dailyReturn = ((data[i].Close - data[i-1].Close) / data[i-1].Close) * 100;
      returns.push(dailyReturn);
    }

    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized

    return {
      startPrice,
      endPrice,
      totalReturn,
      maxDrawdown,
      volatility,
      dataPoints: data.length
    };
  }

  /**
   * Get predefined account templates
   */
  getAccountTemplates() {
    return [
      {
        id: 'conservative_income',
        name: 'Conservative Income Seeker',
        accountSize: 250000,
        riskTolerance: 'conservative',
        experience: 'beginner',
        primaryGoal: 'income',
        timeHorizon: 'long',
        description: 'Focuses on dividend-paying stocks and capital preservation',
        strengths: ['Dividend focus', 'Risk management', 'Long-term perspective'],
        challenges: ['Market volatility', 'Growth opportunities'],
        recommendedStrategies: ['Buy and hold blue chips', 'Dividend reinvestment', 'Conservative covered calls'],
        typicalAllocation: {
          'Large Cap Stocks': 40,
          'Dividend ETFs': 30,
          'Bonds': 20,
          'Cash': 10
        }
      },
      {
        id: 'growth_focused',
        name: 'Growth-Focused Investor',
        accountSize: 100000,
        riskTolerance: 'moderate',
        experience: 'intermediate',
        primaryGoal: 'growth',
        timeHorizon: 'medium',
        description: 'Seeks capital appreciation through growth stocks and market timing',
        strengths: ['Market timing', 'Sector rotation', 'Technology trends'],
        challenges: ['Downside protection', 'Emotional decisions'],
        recommendedStrategies: ['Growth stock selection', 'Momentum investing', 'Sector ETFs'],
        typicalAllocation: {
          'Growth Stocks': 50,
          'Technology ETFs': 25,
          'International': 15,
          'Cash': 10
        }
      },
      {
        id: 'active_trader',
        name: 'Active Trader',
        accountSize: 75000,
        riskTolerance: 'aggressive',
        experience: 'advanced',
        primaryGoal: 'trading',
        timeHorizon: 'short',
        description: 'Uses technical analysis for short-term trading opportunities',
        strengths: ['Technical analysis', 'Risk management', 'Quick decisions'],
        challenges: ['Overtrading', 'News-driven volatility'],
        recommendedStrategies: ['Swing trading', 'Options strategies', 'Day trading'],
        typicalAllocation: {
          'Individual Stocks': 60,
          'Options': 20,
          'ETFs': 15,
          'Cash': 5
        }
      },
      {
        id: 'learning_investor',
        name: 'Learning Investor',
        accountSize: 25000,
        riskTolerance: 'moderate',
        experience: 'beginner',
        primaryGoal: 'learning',
        timeHorizon: 'long',
        description: 'Focuses on education while building investment experience',
        strengths: ['Education focus', 'Systematic approach', 'Documentation'],
        challenges: ['Experience gap', 'Confidence building'],
        recommendedStrategies: ['Index fund investing', 'Paper trading', 'Educational demos'],
        typicalAllocation: {
          'Index Funds': 50,
          'Large Cap ETFs': 30,
          'Educational Demos': 15,
          'Cash': 5
        }
      },
      {
        id: 'preservation_focused',
        name: 'Capital Preservation',
        accountSize: 500000,
        riskTolerance: 'conservative',
        experience: 'intermediate',
        primaryGoal: 'preservation',
        timeHorizon: 'long',
        description: 'Prioritizes capital protection with modest growth',
        strengths: ['Risk control', 'Diversification', 'Patience'],
        challenges: ['Inflation protection', 'Opportunity cost'],
        recommendedStrategies: ['Conservative allocation', 'Defensive stocks', 'Bond ladders'],
        typicalAllocation: {
          'Blue Chip Stocks': 35,
          'Bonds': 40,
          'REITs': 15,
          'Cash': 10
        }
      }
    ];
  }

  /**
   * Get learning recommendations based on profile
   */
  getLearningRecommendations(userProfile, matchedTemplate) {
    const recommendations = [];

    // Experience-based recommendations
    if (userProfile.experience === 'beginner') {
      recommendations.push({
        type: 'foundation',
        title: 'Market Basics',
        description: 'Start with fundamental concepts of market movements and S&P 500 composition',
        priority: 'high'
      });
    }

    // Goal-based recommendations
    if (userProfile.primaryGoal === 'learning') {
      recommendations.push({
        type: 'educational',
        title: 'Interactive Demos',
        description: 'Use our scenario-based learning to understand market dynamics',
        priority: 'high'
      });
    }

    // Risk-based recommendations
    if (userProfile.riskTolerance === 'conservative') {
      recommendations.push({
        type: 'risk_management',
        title: 'Downside Protection',
        description: 'Learn strategies to protect capital during market downturns',
        priority: 'medium'
      });
    }

    // Template-specific recommendations
    if (matchedTemplate) {
      recommendations.push({
        type: 'template_strategy',
        title: `${matchedTemplate.name} Strategies`,
        description: `Learn the specific approaches used by ${matchedTemplate.name.toLowerCase()}`,
        priority: 'high'
      });
    }

    return recommendations;
  }

  /**
   * Generate demo scenarios based on real market data
   */
  generateDemoScenarios() {
    return [
      {
        id: 'Q1_2025',
        title: 'Q1 2025: Steady Growth Phase',
        description: 'Experience the steady bull market conditions that characterized the first quarter of 2025',
        dateRange: { start: '2025-01-02', end: '2025-03-31' },
        difficulty: 'beginner',
        focusAreas: ['Trend following', 'Long-term positioning', 'Risk management basics'],
        learningObjectives: [
          'Understand how bull markets develop',
          'Learn to identify trend continuation patterns',
          'Practice basic position sizing'
        ]
      },
      {
        id: 'TARIFF_CRISIS',
        title: 'April 2025: Tariff Crisis',
        description: 'Navigate the historic tariff-driven crash and recovery that dominated April 2025',
        dateRange: { start: '2025-04-01', end: '2025-04-30' },
        difficulty: 'advanced',
        focusAreas: ['Crisis management', 'Volatility trading', 'News reaction'],
        learningObjectives: [
          'Understand how political events affect markets',
          'Learn crisis management techniques',
          'Practice risk control during volatility'
        ]
      },
      {
        id: 'RECOVERY_2025',
        title: 'May-June 2025: Recovery Rally',
        description: 'Learn from the systematic recovery following the April crisis',
        dateRange: { start: '2025-05-01', end: '2025-06-02' },
        difficulty: 'intermediate',
        focusAreas: ['Recovery patterns', 'Momentum strategies', 'Risk-on positioning'],
        learningObjectives: [
          'Identify recovery patterns after crashes',
          'Learn momentum-based strategies',
          'Understand risk-on/risk-off dynamics'
        ]
      }
    ];
  }
}

export default SP500DemoService; 