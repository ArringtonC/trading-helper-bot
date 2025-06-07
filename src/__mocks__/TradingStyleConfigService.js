// Mock for TradingStyleConfigService
export class TradingStyleConfigService {
  constructor() {
    this.configs = new Map();
    this.defaultConfig = {
      userId: 'default',
      style: 'swing_trading',
      riskTolerance: 'moderate',
      accountSize: 100000,
      maxPositionSize: 0.05,
      portfolioRiskLimit: 0.02,
      gapRiskThreshold: 0.03,
      stopLossPercentage: 0.08,
      takeProfitRatio: 2.0,
      maxWeekendExposure: 0.75,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  getConfigForUser(userId) {
    return this.configs.get(userId) || this.defaultConfig;
  }

  saveConfigForUser(userId, config) {
    const savedConfig = {
      ...this.defaultConfig,
      ...config,
      userId,
      updatedAt: new Date().toISOString()
    };
    this.configs.set(userId, savedConfig);
    return savedConfig;
  }

  getDefaultConfig() {
    return { ...this.defaultConfig };
  }

  validateConfig(config) {
    return {
      isValid: true,
      errors: []
    };
  }

  async loadUserPreferences(userId) {
    return this.getConfigForUser(userId);
  }

  async saveUserPreferences(userId, config) {
    return this.saveConfigForUser(userId, config);
  }

  getSupportedTradingStyles() {
    return [
      'day_trading',
      'swing_trading',
      'position_trading',
      'scalping'
    ];
  }

  getRiskToleranceLevels() {
    return [
      'conservative',
      'moderate',
      'aggressive'
    ];
  }
}

export default TradingStyleConfigService; 