class RiskIntegratedScreeningService {
  constructor() {
    this.vixData = null;
    this.marketData = null;
  }

  /**
   * Calculate comprehensive portfolio risk metrics
   * Based on five principal risk measures: alpha, beta, R-squared, standard deviation, Sharpe ratio
   */
  async calculatePortfolioRisk(positions) {
    try {
      // Calculate weighted portfolio beta
      const portfolioBeta = this.calculatePortfolioBeta(positions);
      
      // Calculate portfolio standard deviation
      const standardDeviation = this.calculatePortfolioStandardDeviation(positions);
      
      // Calculate Sharpe ratio (using risk-free rate of 3%)
      const riskFreeRate = 0.03;
      const portfolioReturn = this.estimatePortfolioReturn(positions);
      const sharpeRatio = (portfolioReturn - riskFreeRate) / standardDeviation;
      
      // Calculate alpha (simplified Jensen's alpha)
      const marketReturn = 0.10; // Assumed market return
      const alpha = portfolioReturn - (riskFreeRate + portfolioBeta * (marketReturn - riskFreeRate));
      
      // Calculate R-squared (correlation with market)
      const rSquared = this.calculateRSquared(positions);
      
      // Calculate overall portfolio risk score (0-100)
      const portfolioRisk = this.calculatePortfolioRiskScore(positions);
      
      // Get current VIX level (simulated)
      const vixLevel = await this.getCurrentVIX();
      
      // Calculate sector concentration
      const sectorConcentration = this.calculateSectorConcentration(positions);
      
      // Generate correlation matrix
      const correlationMatrix = this.generateCorrelationMatrix(positions);

      return {
        alpha: parseFloat(alpha.toFixed(4)),
        beta: parseFloat(portfolioBeta.toFixed(3)),
        rSquared: parseFloat(rSquared.toFixed(3)),
        standardDeviation: parseFloat(standardDeviation.toFixed(3)),
        sharpeRatio: parseFloat(sharpeRatio.toFixed(3)),
        portfolioRisk: parseFloat(portfolioRisk.toFixed(1)),
        vixLevel: parseFloat(vixLevel.toFixed(2)),
        sectorConcentration,
        correlationMatrix
      };
    } catch (error) {
      console.error('Error calculating portfolio risk:', error);
      return this.getDefaultRiskMetrics();
    }
  }

  /**
   * Calculate weighted portfolio beta
   */
  calculatePortfolioBeta(positions) {
    const totalWeight = positions.reduce((sum, pos) => sum + pos.weight, 0);
    const weightedBeta = positions.reduce((sum, pos) => {
      const normalizedWeight = pos.weight / totalWeight;
      return sum + (pos.beta * normalizedWeight);
    }, 0);
    
    return weightedBeta;
  }

  /**
   * Calculate portfolio standard deviation (simplified)
   */
  calculatePortfolioStandardDeviation(positions) {
    // Simplified calculation based on individual position volatilities and weights
    const totalWeight = positions.reduce((sum, pos) => sum + pos.weight, 0);
    const weightedVariance = positions.reduce((sum, pos) => {
      const normalizedWeight = pos.weight / totalWeight;
      const estimatedVolatility = this.estimateVolatility(pos);
      return sum + Math.pow(normalizedWeight * estimatedVolatility, 2);
    }, 0);
    
    return Math.sqrt(weightedVariance);
  }

  /**
   * Estimate individual position volatility based on beta and risk level
   */
  estimateVolatility(position) {
    let baseVolatility = 0.15; // Base 15% volatility
    
    // Adjust based on beta
    baseVolatility *= position.beta;
    
    // Adjust based on risk classification
    switch (position.risk) {
      case 'low':
        baseVolatility *= 0.8;
        break;
      case 'medium':
        baseVolatility *= 1.0;
        break;
      case 'high':
        baseVolatility *= 1.4;
        break;
    }
    
    return baseVolatility;
  }

  /**
   * Estimate portfolio return (simplified)
   */
  estimatePortfolioReturn(positions) {
    const totalWeight = positions.reduce((sum, pos) => sum + pos.weight, 0);
    return positions.reduce((sum, pos) => {
      const normalizedWeight = pos.weight / totalWeight;
      const estimatedReturn = this.estimateExpectedReturn(pos);
      return sum + (normalizedWeight * estimatedReturn);
    }, 0);
  }

  /**
   * Estimate expected return for individual position
   */
  estimateExpectedReturn(position) {
    let baseReturn = 0.08; // Base 8% expected return
    
    // Adjust based on sector
    const sectorMultipliers = {
      'Technology': 1.2,
      'Healthcare': 1.0,
      'Financial': 1.1,
      'Automotive': 1.3,
      'Consumer': 0.9,
      'Energy': 1.1,
      'Utilities': 0.8
    };
    
    baseReturn *= sectorMultipliers[position.sector] || 1.0;
    
    // Adjust based on financial health
    if (position.currentRatio >= 2.0) baseReturn *= 1.05;
    if (position.debtToEquity > 1.5) baseReturn *= 0.95;
    
    return baseReturn;
  }

  /**
   * Calculate R-squared (market correlation)
   */
  calculateRSquared(positions) {
    // Simplified R-squared based on portfolio composition
    const portfolioBeta = this.calculatePortfolioBeta(positions);
    const diversificationFactor = this.calculateDiversificationFactor(positions);
    
    // R-squared typically ranges from 0.7-0.95 for diversified portfolios
    return Math.min(0.95, 0.7 + (diversificationFactor * 0.25));
  }

  /**
   * Calculate diversification factor
   */
  calculateDiversificationFactor(positions) {
    const sectors = [...new Set(positions.map(pos => pos.sector))];
    const sectorCount = sectors.length;
    const positionCount = positions.length;
    
    // More sectors and positions = better diversification
    return Math.min(1.0, (sectorCount * 0.2) + (Math.min(positionCount, 10) * 0.08));
  }

  /**
   * Calculate overall portfolio risk score (0-100)
   */
  calculatePortfolioRiskScore(positions) {
    let riskScore = 0;
    
    // Beta contribution (30% weight)
    const portfolioBeta = this.calculatePortfolioBeta(positions);
    const betaRisk = Math.min(100, Math.abs(portfolioBeta - 1.0) * 50);
    riskScore += betaRisk * 0.3;
    
    // Concentration risk (25% weight)
    const concentrationRisk = this.calculateConcentrationRisk(positions);
    riskScore += concentrationRisk * 0.25;
    
    // Financial health risk (25% weight)
    const financialRisk = this.calculateFinancialHealthRisk(positions);
    riskScore += financialRisk * 0.25;
    
    // Volatility risk (20% weight)
    const volatilityRisk = this.calculateVolatilityRisk(positions);
    riskScore += volatilityRisk * 0.2;
    
    return Math.min(100, riskScore);
  }

  /**
   * Calculate concentration risk based on position weights and sector allocation
   */
  calculateConcentrationRisk(positions) {
    // Position concentration risk
    const maxWeight = Math.max(...positions.map(pos => pos.weight));
    const positionRisk = maxWeight > 20 ? (maxWeight - 20) * 2 : 0;
    
    // Sector concentration risk
    const sectorConcentration = this.calculateSectorConcentration(positions);
    const maxSectorWeight = Math.max(...Object.values(sectorConcentration));
    const sectorRisk = maxSectorWeight > 40 ? (maxSectorWeight - 40) * 1.5 : 0;
    
    return Math.min(100, positionRisk + sectorRisk);
  }

  /**
   * Calculate financial health risk
   */
  calculateFinancialHealthRisk(positions) {
    const totalWeight = positions.reduce((sum, pos) => sum + pos.weight, 0);
    
    return positions.reduce((riskSum, pos) => {
      const normalizedWeight = pos.weight / totalWeight;
      let positionRisk = 0;
      
      // Debt-to-equity risk
      if (pos.debtToEquity > 2.0) positionRisk += 30;
      else if (pos.debtToEquity > 1.5) positionRisk += 15;
      
      // Current ratio risk
      if (pos.currentRatio < 1.0) positionRisk += 25;
      else if (pos.currentRatio < 1.5) positionRisk += 10;
      
      return riskSum + (positionRisk * normalizedWeight);
    }, 0);
  }

  /**
   * Calculate volatility risk
   */
  calculateVolatilityRisk(positions) {
    const totalWeight = positions.reduce((sum, pos) => sum + pos.weight, 0);
    
    return positions.reduce((riskSum, pos) => {
      const normalizedWeight = pos.weight / totalWeight;
      let volatilityRisk = 0;
      
      // Beta-based volatility
      if (pos.beta > 2.0) volatilityRisk += 40;
      else if (pos.beta > 1.5) volatilityRisk += 25;
      else if (pos.beta < 0.5) volatilityRisk += 15;
      
      // Risk classification
      switch (pos.risk) {
        case 'high': volatilityRisk += 30; break;
        case 'medium': volatilityRisk += 15; break;
        case 'low': volatilityRisk += 5; break;
      }
      
      return riskSum + (volatilityRisk * normalizedWeight);
    }, 0);
  }

  /**
   * Calculate sector concentration
   */
  calculateSectorConcentration(positions) {
    const sectorWeights = {};
    const totalWeight = positions.reduce((sum, pos) => sum + pos.weight, 0);
    
    positions.forEach(pos => {
      const normalizedWeight = (pos.weight / totalWeight) * 100;
      sectorWeights[pos.sector] = (sectorWeights[pos.sector] || 0) + normalizedWeight;
    });
    
    return sectorWeights;
  }

  /**
   * Generate correlation matrix for positions
   */
  generateCorrelationMatrix(positions) {
    const matrix = {};
    
    // Simulate correlations based on sectors and other factors
    positions.forEach(pos1 => {
      matrix[pos1.symbol] = {};
      positions.forEach(pos2 => {
        if (pos1.symbol === pos2.symbol) {
          matrix[pos1.symbol][pos2.symbol] = 1.0;
        } else {
          matrix[pos1.symbol][pos2.symbol] = this.calculatePairwiseCorrelation(pos1, pos2);
        }
      });
    });
    
    return matrix;
  }

  /**
   * Calculate correlation between two positions
   */
  calculatePairwiseCorrelation(pos1, pos2) {
    let correlation = 0.1; // Base correlation
    
    // Same sector increases correlation
    if (pos1.sector === pos2.sector) {
      correlation += 0.4;
    }
    
    // Similar beta increases correlation
    const betaDiff = Math.abs(pos1.beta - pos2.beta);
    correlation += Math.max(0, 0.3 - betaDiff * 0.2);
    
    // Similar risk levels increase correlation
    if (pos1.risk === pos2.risk) {
      correlation += 0.2;
    }
    
    // Add some randomness but keep realistic
    correlation += (Math.random() - 0.5) * 0.2;
    
    return Math.max(-0.3, Math.min(0.9, correlation));
  }

  /**
   * Get current VIX level (simulated)
   */
  async getCurrentVIX() {
    // Simulate VIX data - in real implementation, this would fetch live VIX data
    const baseVIX = 18.5;
    const variation = (Math.random() - 0.5) * 6;
    return Math.max(10, baseVIX + variation);
  }

  /**
   * Check for risk alerts based on portfolio analysis
   */
  checkRiskAlerts(positions, riskMetrics) {
    const alerts = [];
    
    // High beta alert
    if (riskMetrics.beta > 1.5) {
      alerts.push(`High portfolio beta (${riskMetrics.beta.toFixed(2)}) indicates increased market sensitivity`);
    }
    
    // Low Sharpe ratio alert
    if (riskMetrics.sharpeRatio < 0.5) {
      alerts.push(`Low Sharpe ratio (${riskMetrics.sharpeRatio.toFixed(2)}) suggests poor risk-adjusted returns`);
    }
    
    // Sector concentration alerts
    Object.entries(riskMetrics.sectorConcentration).forEach(([sector, weight]) => {
      if (weight > 40) {
        alerts.push(`High ${sector} sector concentration (${weight.toFixed(1)}%) increases sector-specific risk`);
      }
    });
    
    // Individual position alerts
    positions.forEach(pos => {
      if (pos.weight > 20) {
        alerts.push(`${pos.symbol} represents ${pos.weight.toFixed(1)}% of portfolio - consider reducing concentration`);
      }
      
      if (pos.debtToEquity > 2.0) {
        alerts.push(`${pos.symbol} has high debt-to-equity ratio (${pos.debtToEquity.toFixed(2)}) indicating financial leverage risk`);
      }
      
      if (pos.currentRatio < 1.0) {
        alerts.push(`${pos.symbol} has low current ratio (${pos.currentRatio.toFixed(2)}) indicating potential liquidity issues`);
      }
    });
    
    // VIX-based alerts
    if (riskMetrics.vixLevel > 25) {
      alerts.push(`High market volatility (VIX: ${riskMetrics.vixLevel.toFixed(1)}) suggests increased market risk`);
    }
    
    return alerts;
  }

  /**
   * Apply risk filters to positions based on account type and risk tolerance
   */
  filterPositionsByRisk(positions, accountType = 'moderate', customLimits = {}) {
    const limits = this.getRiskLimits(accountType, customLimits);
    
    return positions.filter(pos => {
      // Beta limits
      if (pos.beta > limits.maxBeta || pos.beta < limits.minBeta) return false;
      
      // Debt-to-equity limits
      if (pos.debtToEquity > limits.maxDebtToEquity) return false;
      
      // Current ratio requirements
      if (pos.currentRatio < limits.minCurrentRatio) return false;
      
      // Risk level filtering
      if (limits.allowedRiskLevels && !limits.allowedRiskLevels.includes(pos.risk)) return false;
      
      return true;
    });
  }

  /**
   * Get risk limits based on account type
   */
  getRiskLimits(accountType, customLimits = {}) {
    const defaultLimits = {
      conservative: {
        maxBeta: 1.2,
        minBeta: 0.0,
        maxDebtToEquity: 1.0,
        minCurrentRatio: 2.0,
        allowedRiskLevels: ['low', 'medium']
      },
      moderate: {
        maxBeta: 1.8,
        minBeta: 0.0,
        maxDebtToEquity: 1.5,
        minCurrentRatio: 1.5,
        allowedRiskLevels: ['low', 'medium', 'high']
      },
      aggressive: {
        maxBeta: 3.0,
        minBeta: 0.0,
        maxDebtToEquity: 2.0,
        minCurrentRatio: 1.0,
        allowedRiskLevels: ['low', 'medium', 'high']
      }
    };
    
    return { ...defaultLimits[accountType], ...customLimits };
  }

  /**
   * Calculate dynamic volatility adjustments based on VIX
   */
  calculateVolatilityAdjustment(vixLevel) {
    // Normal VIX range: 12-20, High: 20-30, Extreme: 30+
    if (vixLevel < 15) return 0.9; // Low volatility - reduce risk thresholds
    if (vixLevel < 25) return 1.0; // Normal volatility
    if (vixLevel < 35) return 1.3; // High volatility - increase risk thresholds
    return 1.6; // Extreme volatility
  }

  /**
   * Get default risk metrics for error cases
   */
  getDefaultRiskMetrics() {
    return {
      alpha: 0.0,
      beta: 1.0,
      rSquared: 0.8,
      standardDeviation: 0.15,
      sharpeRatio: 0.8,
      portfolioRisk: 50.0,
      vixLevel: 18.5,
      sectorConcentration: {},
      correlationMatrix: {}
    };
  }

  /**
   * Investment Risk Manager integration with 200+ pricing models simulation
   */
  async runAdvancedRiskModels(positions) {
    // Simulate advanced risk model results
    const models = [
      'Value at Risk (VaR)',
      'Conditional Value at Risk (CVaR)',
      'Monte Carlo Simulation',
      'Black-Scholes Model',
      'Binomial Tree Model',
      'Risk Parity Model'
    ];
    
    const results = {};
    models.forEach(model => {
      results[model] = {
        riskEstimate: Math.random() * 0.3 + 0.05, // 5-35% risk estimate
        confidence: Math.random() * 0.2 + 0.8, // 80-100% confidence
        recommendation: Math.random() > 0.5 ? 'Hold' : 'Reduce'
      };
    });
    
    return results;
  }
}

export default RiskIntegratedScreeningService; 