import { EventEmitter } from 'events';
import { 
  generateRiskSummary, 
  analyzeLeverage, 
  calculateKelly,
  simulateLossSequence 
} from '../../../shared/utils/riskCalculations';
import { RiskDataPayload } from '../../../shared/services/RiskService';
import { NormalizedTradeData } from '../../../types/trade';

export interface RiskAlert {
  id: string;
  timestamp: Date;
  level: 'critical' | 'warning' | 'info';
  category: 'position_size' | 'leverage' | 'greeks' | 'ptj_rule' | 'kelly' | 'drawdown' | 'correlation';
  title: string;
  message: string;
  value?: number;
  threshold?: number;
  suggestions: string[];
  actionRequired: boolean;
  acknowledged: boolean;
}

export interface AlertRule {
  id: string;
  name: string;
  category: RiskAlert['category'];
  level: RiskAlert['level'];
  condition: (params: RiskParams) => boolean;
  threshold: number;
  message: (value: number, threshold: number) => string;
  suggestions: string[];
  enabled: boolean;
  cooldownMinutes: number; // Prevent spam alerts
}

export interface RiskParams {
  positionSize: number;
  totalExposure: number;
  accountSize: number;
  winRate: number;
  payoffRatio: number;
  realtimeRisk?: RiskDataPayload;
  trades?: NormalizedTradeData[];
  currentPositions?: any[];
}

export interface AlertConfiguration {
  enabledCategories: RiskAlert['category'][];
  minimumLevel: RiskAlert['level'];
  enableSound: boolean;
  enableBrowserNotifications: boolean;
  enableEmail: boolean;
  cooldownGlobal: number; // Minutes between any alerts
  maxAlertsPerHour: number;
}

export class RiskAlertService extends EventEmitter {
  private alerts: RiskAlert[] = [];
  private alertRules: AlertRule[] = [];
  private lastAlertTime: { [ruleId: string]: Date } = {};
  private alertCounts: { [hour: string]: number } = {};
  private configuration: AlertConfiguration;

  constructor() {
    super();
    
    this.configuration = {
      enabledCategories: ['critical', 'warning', 'info'] as any,
      minimumLevel: 'info',
      enableSound: true,
      enableBrowserNotifications: true,
      enableEmail: false,
      cooldownGlobal: 1, // 1 minute between any alerts
      maxAlertsPerHour: 10
    };

    this.initializeDefaultRules();
    this.setupCleanupInterval();
  }

  private initializeDefaultRules(): void {
    this.alertRules = [
      // Position Size Rules
      {
        id: 'position_size_extreme',
        name: 'Extreme Position Size',
        category: 'position_size',
        level: 'critical',
        condition: (params) => params.positionSize > 20,
        threshold: 20,
        message: (value, threshold) => `Position size of ${value.toFixed(1)}% is extremely high (>${threshold}%)`,
        suggestions: [
          'Immediately reduce position size to under 5%',
          'Consider closing partial positions',
          'Review risk management rules'
        ],
        enabled: true,
        cooldownMinutes: 5
      },
      {
        id: 'position_size_high',
        name: 'High Position Size',
        category: 'position_size',
        level: 'warning',
        condition: (params) => params.positionSize > 10,
        threshold: 10,
        message: (value, threshold) => `Position size of ${value.toFixed(1)}% requires careful monitoring (>${threshold}%)`,
        suggestions: [
          'Consider reducing position size to 2-5%',
          'Ensure stop losses are properly set',
          'Monitor position closely'
        ],
        enabled: true,
        cooldownMinutes: 10
      },
      
      // Leverage Rules
      {
        id: 'leverage_extreme',
        name: 'Extreme Leverage',
        category: 'leverage',
        level: 'critical',
        condition: (params) => {
          const leverage = analyzeLeverage(params.totalExposure);
          return leverage.liquidationRisk === 'extreme';
        },
        threshold: 300,
        message: (value, threshold) => `Extreme leverage detected: ${(value/100).toFixed(1)}x (>${(threshold/100).toFixed(1)}x)`,
        suggestions: [
          'Immediately reduce total exposure',
          'Close non-essential positions',
          'Consider using tighter stop losses'
        ],
        enabled: true,
        cooldownMinutes: 2
      },
      
      // PTJ Rule Violations
      {
        id: 'ptj_rule_violation',
        name: 'PTJ 5:1 Rule Violation',
        category: 'ptj_rule',
        level: 'warning',
        condition: (params) => {
          const riskReward = params.payoffRatio;
          const riskPercent = params.positionSize / 100;
          return !(riskReward >= 5 && riskPercent <= 0.01);
        },
        threshold: 5,
        message: (value, threshold) => `Trade violates PTJ 5:1 rule (R:R ${value.toFixed(1)}:1, requires >${threshold}:1)`,
        suggestions: [
          'Increase profit target or reduce stop loss distance',
          'Reduce position size to meet 1% risk limit',
          'Skip this trade and wait for better setup'
        ],
        enabled: true,
        cooldownMinutes: 15
      },
      
      // Kelly Criterion Rules
      {
        id: 'kelly_negative',
        name: 'Negative Kelly Criterion',
        category: 'kelly',
        level: 'critical',
        condition: (params) => {
          const kelly = calculateKelly(params.winRate, params.payoffRatio);
          return !kelly.isPositive;
        },
        threshold: 0,
        message: (value, threshold) => `Strategy appears unprofitable (Kelly: ${value.toFixed(2)}%)`,
        suggestions: [
          'Review and improve trading strategy',
          'Increase win rate or improve risk:reward ratio',
          'Consider paper trading until strategy improves'
        ],
        enabled: true,
        cooldownMinutes: 30
      },
      
      // Greeks Rules
      {
        id: 'delta_extreme',
        name: 'Extreme Delta Exposure',
        category: 'greeks',
        level: 'warning',
        condition: (params) => {
          return params.realtimeRisk ? Math.abs(params.realtimeRisk.delta) > 0.8 : false;
        },
        threshold: 0.8,
        message: (value, threshold) => `High delta exposure: ${value.toFixed(3)} (>${threshold})`,
        suggestions: [
          'Consider hedging with opposing delta positions',
          'Reduce directional exposure',
          'Monitor price movements closely'
        ],
        enabled: true,
        cooldownMinutes: 5
      },
      
      {
        id: 'theta_high',
        name: 'High Time Decay',
        category: 'greeks',
        level: 'warning',
        condition: (params) => {
          return params.realtimeRisk ? params.realtimeRisk.theta < -50 : false;
        },
        threshold: -50,
        message: (value, threshold) => `High time decay: ${value.toFixed(2)} per day (<${threshold})`,
        suggestions: [
          'Consider closing positions before weekend',
          'Monitor time decay acceleration',
          'Consider rolling to later expiration'
        ],
        enabled: true,
        cooldownMinutes: 10
      },
      
      {
        id: 'vega_high',
        name: 'High Volatility Risk',
        category: 'greeks',
        level: 'warning',
        condition: (params) => {
          return params.realtimeRisk ? params.realtimeRisk.vega > 300 : false;
        },
        threshold: 300,
        message: (value, threshold) => `High volatility risk: ${value.toFixed(0)} (>${threshold})`,
        suggestions: [
          'Monitor VIX and volatility indicators',
          'Consider volatility hedging strategies',
          'Be prepared for volatility expansion'
        ],
        enabled: true,
        cooldownMinutes: 10
      },
      
      // Drawdown Rules
      {
        id: 'consecutive_loss_risk',
        name: 'Consecutive Loss Risk',
        category: 'drawdown',
        level: 'warning',
        condition: (params) => {
          const simulation = simulateLossSequence(params.positionSize, 5, 100);
          return simulation.accountLossPercent > 25;
        },
        threshold: 25,
        message: (value, threshold) => `5 consecutive losses could cost ${value.toFixed(1)}% of account (>${threshold}%)`,
        suggestions: [
          'Reduce position size to limit consecutive loss impact',
          'Implement maximum daily loss limits',
          'Consider taking a break after 3 consecutive losses'
        ],
        enabled: true,
        cooldownMinutes: 20
      }
    ];
  }

  public evaluateRiskConditions(params: RiskParams): RiskAlert[] {
    const newAlerts: RiskAlert[] = [];
    const currentHour = new Date().toISOString().slice(0, 13); // YYYY-MM-DD:HH
    
    // Check hourly alert limit
    const currentHourCount = this.alertCounts[currentHour] || 0;
    if (currentHourCount >= this.configuration.maxAlertsPerHour) {
      return newAlerts;
    }

    for (const rule of this.alertRules) {
      if (!rule.enabled || !this.configuration.enabledCategories.includes(rule.category)) {
        continue;
      }

      // Check cooldown
      const lastAlert = this.lastAlertTime[rule.id];
      if (lastAlert) {
        const cooldownMs = rule.cooldownMinutes * 60 * 1000;
        if (Date.now() - lastAlert.getTime() < cooldownMs) {
          continue;
        }
      }

      // Evaluate condition
      if (rule.condition(params)) {
        const alert = this.createAlert(rule, params);
        newAlerts.push(alert);
        
        // Update tracking
        this.lastAlertTime[rule.id] = new Date();
        this.alertCounts[currentHour] = (this.alertCounts[currentHour] || 0) + 1;
        
        // Store alert
        this.alerts.unshift(alert);
        
        // Emit alert event
        this.emit('alert', alert);
        
        // Trigger notifications
        this.triggerNotifications(alert);
      }
    }

    // Limit stored alerts to prevent memory issues
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(0, 100);
    }

    return newAlerts;
  }

  private createAlert(rule: AlertRule, params: RiskParams): RiskAlert {
    let value: number = 0;
    
    // Calculate specific value based on rule category
    switch (rule.category) {
      case 'position_size':
        value = params.positionSize;
        break;
      case 'leverage':
        const leverage = analyzeLeverage(params.totalExposure);
        value = params.totalExposure;
        break;
      case 'ptj_rule':
        value = params.payoffRatio;
        break;
      case 'kelly':
        const kelly = calculateKelly(params.winRate, params.payoffRatio);
        value = kelly.kellyFraction;
        break;
      case 'greeks':
        if (params.realtimeRisk) {
          if (rule.id.includes('delta')) value = Math.abs(params.realtimeRisk.delta);
          if (rule.id.includes('theta')) value = params.realtimeRisk.theta;
          if (rule.id.includes('vega')) value = params.realtimeRisk.vega;
        }
        break;
      case 'drawdown':
        const simulation = simulateLossSequence(params.positionSize, 5, 100);
        value = simulation.accountLossPercent;
        break;
    }

    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level: rule.level,
      category: rule.category,
      title: rule.name,
      message: rule.message(value, rule.threshold),
      value,
      threshold: rule.threshold,
      suggestions: [...rule.suggestions],
      actionRequired: rule.level === 'critical',
      acknowledged: false
    };
  }

  private triggerNotifications(alert: RiskAlert): void {
    // Browser notification
    if (this.configuration.enableBrowserNotifications && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`Risk Alert: ${alert.title}`, {
          body: alert.message,
          icon: alert.level === 'critical' ? '🚨' : alert.level === 'warning' ? '⚠️' : 'ℹ️',
          tag: alert.id
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            this.triggerNotifications(alert);
          }
        });
      }
    }

    // Sound notification
    if (this.configuration.enableSound) {
      this.playAlertSound(alert.level);
    }

    // Email notification (would require backend integration)
    if (this.configuration.enableEmail) {
      this.sendEmailAlert(alert);
    }
  }

  private playAlertSound(level: RiskAlert['level']): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different tones for different alert levels
      if (level === 'critical') {
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      } else if (level === 'warning') {
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.15);
      } else {
        oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
      }
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('Could not play alert sound:', error);
    }
  }

  private sendEmailAlert(alert: RiskAlert): void {
    // This would require backend integration
    console.log('Email alert would be sent:', alert);
  }

  private setupCleanupInterval(): void {
    // Clean up old alert counts every hour
    setInterval(() => {
      const now = new Date();
      const cutoff = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
      
      Object.keys(this.alertCounts).forEach(hour => {
        if (new Date(hour) < cutoff) {
          delete this.alertCounts[hour];
        }
      });
    }, 60 * 60 * 1000); // Run every hour
  }

  // Public API methods
  public getAlerts(level?: RiskAlert['level'], limit: number = 50): RiskAlert[] {
    let filtered = this.alerts;
    
    if (level) {
      filtered = filtered.filter(alert => alert.level === level);
    }
    
    return filtered.slice(0, limit);
  }

  public acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.emit('alertAcknowledged', alert);
      return true;
    }
    return false;
  }

  public clearAlerts(level?: RiskAlert['level']): void {
    if (level) {
      this.alerts = this.alerts.filter(alert => alert.level !== level);
    } else {
      this.alerts = [];
    }
    this.emit('alertsCleared', level);
  }

  public updateConfiguration(config: Partial<AlertConfiguration>): void {
    this.configuration = { ...this.configuration, ...config };
    this.emit('configurationUpdated', this.configuration);
  }

  public getConfiguration(): AlertConfiguration {
    return { ...this.configuration };
  }

  public updateRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.alertRules.find(r => r.id === ruleId);
    if (rule) {
      Object.assign(rule, updates);
      this.emit('ruleUpdated', rule);
      return true;
    }
    return false;
  }

  public getRules(): AlertRule[] {
    return [...this.alertRules];
  }

  public addCustomRule(rule: Omit<AlertRule, 'id'>): string {
    const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newRule: AlertRule = { ...rule, id };
    this.alertRules.push(newRule);
    this.emit('ruleAdded', newRule);
    return id;
  }

  public removeRule(ruleId: string): boolean {
    const index = this.alertRules.findIndex(r => r.id === ruleId);
    if (index >= 0) {
      const removed = this.alertRules.splice(index, 1)[0];
      this.emit('ruleRemoved', removed);
      return true;
    }
    return false;
  }

  public getAlertStats(): {
    total: number;
    critical: number;
    warning: number;
    info: number;
    unacknowledged: number;
    last24Hours: number;
  } {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return {
      total: this.alerts.length,
      critical: this.alerts.filter(a => a.level === 'critical').length,
      warning: this.alerts.filter(a => a.level === 'warning').length,
      info: this.alerts.filter(a => a.level === 'info').length,
      unacknowledged: this.alerts.filter(a => !a.acknowledged).length,
      last24Hours: this.alerts.filter(a => a.timestamp > last24Hours).length
    };
  }
}

// Export singleton instance
export const riskAlertService = new RiskAlertService();
export default riskAlertService;