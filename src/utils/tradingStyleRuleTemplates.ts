/**
 * Trading Style Rule Templates
 * 
 * Pre-built rule templates for different trading styles
 * providing default gap risk rules and configurations.
 */

import {
  TradingStyleRuleTemplate,
  GapRiskRule,
  TradingStyle,
  RiskTolerance,
  GapRiskAction,
  TradingStyleConfig
} from '../types/tradingStyleRules';
import { GapMagnitude } from '../types/gapRisk';

/**
 * Day Trading Rule Templates
 */
const dayTradingRules: GapRiskRule[] = [
  {
    id: 'day-trading-no-weekend-holds',
    name: 'No Weekend Holdings',
    description: 'Day traders should close all positions before market close to avoid weekend gap risk',
    enabled: true,
    priority: 'high',
    type: 'gap_risk',
    applicableStyles: ['day_trading'],
    applicableRiskTolerance: ['conservative', 'moderate', 'aggressive'],
    
    conditions: {
      and: [
        {
          field: 'daysToWeekend',
          operator: '<=',
          value: 1
        },
        {
          field: 'marketSession',
          operator: '!=',
          value: 'weekend'
        }
      ]
    },
    
    gapRiskConditions: {
      minRiskScore: 1, // Any risk score triggers this rule
      marketSession: ['regular_hours', 'after_hours']
    },
    
    timeConstraints: {
      daysToWeekend: 1,
      marketHoursOnly: false
    },
    
    actions: [
      {
        type: 'close_position',
        parameters: {
          message: 'Close position before market close to avoid weekend gap risk',
          alertLevel: 'warning',
          channels: ['push', 'email']
        }
      }
    ],
    
    metadata: {
      version: '1.0',
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      tags: ['day_trading', 'weekend_risk']
    }
  },
  
  {
    id: 'day-trading-high-risk-exit',
    name: 'High Risk Position Exit',
    description: 'Exit positions immediately if gap risk exceeds day trading tolerance',
    enabled: true,
    priority: 'high',
    type: 'gap_risk',
    applicableStyles: ['day_trading'],
    applicableRiskTolerance: ['conservative', 'moderate', 'aggressive'],
    
    conditions: {
      field: 'gapRiskScore',
      operator: '>',
      value: 40
    },
    
    gapRiskConditions: {
      minRiskScore: 40
    },
    
    actions: [
      {
        type: 'close_position',
        parameters: {
          message: 'Gap risk exceeds day trading tolerance - exit immediately',
          alertLevel: 'critical',
          channels: ['push', 'email', 'sms']
        }
      }
    ],
    
    metadata: {
      version: '1.0',
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      tags: ['day_trading', 'high_risk']
    }
  }
];

/**
 * Scalping Rule Templates
 */
const scalpingRules: GapRiskRule[] = [
  {
    id: 'scalping-no-gaps',
    name: 'No Gap Risk Exposure',
    description: 'Scalpers should avoid any weekend gap risk exposure',
    enabled: true,
    priority: 'high',
    type: 'gap_risk',
    applicableStyles: ['scalping'],
    applicableRiskTolerance: ['conservative', 'moderate', 'aggressive'],
    
    conditions: {
      field: 'gapRiskScore',
      operator: '>',
      value: 10
    },
    
    gapRiskConditions: {
      minRiskScore: 10 // Very low threshold for scalpers
    },
    
    actions: [
      {
        type: 'close_position',
        parameters: {
          message: 'Scalping strategy requires immediate exit to avoid gap risk',
          alertLevel: 'warning'
        }
      }
    ],
    
    metadata: {
      version: '1.0',
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      tags: ['scalping', 'gap_risk']
    }
  }
];

/**
 * Swing Trading Rule Templates
 */
const swingTradingRules: GapRiskRule[] = [
  {
    id: 'swing-trading-moderate-risk',
    name: 'Moderate Gap Risk Management',
    description: 'Manage positions with moderate gap risk through position sizing',
    enabled: true,
    priority: 'medium',
    type: 'gap_risk',
    applicableStyles: ['swing_trading'],
    applicableRiskTolerance: ['conservative', 'moderate'],
    
    conditions: {
      and: [
        {
          field: 'gapRiskScore',
          operator: '>',
          value: 50
        },
        {
          field: 'gapRiskScore',
          operator: '<=',
          value: 75
        }
      ]
    },
    
    gapRiskConditions: {
      minRiskScore: 50,
      maxRiskScore: 75,
      allowedMagnitudes: [GapMagnitude.SMALL, GapMagnitude.MEDIUM]
    },
    
    actions: [
      {
        type: 'reduce_position',
        parameters: {
          reductionPercent: 30,
          message: 'Reduce position size due to elevated gap risk',
          alertLevel: 'info'
        }
      },
      {
        type: 'set_stop_loss',
        parameters: {
          stopLossPercent: 8,
          message: 'Set protective stop loss for weekend gap protection'
        }
      }
    ],
    
    metadata: {
      version: '1.0',
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      tags: ['swing_trading', 'moderate_risk']
    }
  },
  
  {
    id: 'swing-trading-high-risk',
    name: 'High Gap Risk Alert',
    description: 'Alert and require approval for high gap risk swing positions',
    enabled: true,
    priority: 'high',
    type: 'gap_risk',
    applicableStyles: ['swing_trading'],
    applicableRiskTolerance: ['conservative', 'moderate', 'aggressive'],
    
    conditions: {
      field: 'gapRiskScore',
      operator: '>',
      value: 75
    },
    
    gapRiskConditions: {
      minRiskScore: 75
    },
    
    actions: [
      {
        type: 'require_approval',
        parameters: {
          approvalRequired: true,
          message: 'High gap risk position requires manual review',
          alertLevel: 'warning',
          timeoutHours: 2
        }
      },
      {
        type: 'add_hedge',
        parameters: {
          hedgeRatio: 0.5,
          message: 'Consider adding hedge for high gap risk position'
        }
      }
    ],
    
    metadata: {
      version: '1.0',
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      tags: ['swing_trading', 'high_risk']
    }
  }
];

/**
 * Position Trading Rule Templates
 */
const positionTradingRules: GapRiskRule[] = [
  {
    id: 'position-trading-portfolio-limit',
    name: 'Portfolio Gap Risk Limit',
    description: 'Limit total portfolio exposure to weekend gap risk',
    enabled: true,
    priority: 'medium',
    type: 'gap_risk',
    applicableStyles: ['position_trading'],
    applicableRiskTolerance: ['conservative', 'moderate', 'aggressive'],
    
    conditions: {
      field: 'positionValue',
      operator: '>',
      value: 10000 // Positions over $10k
    },
    
    gapRiskConditions: {
      positionValue: {
        min: 10000
      }
    },
    
    actions: [
      {
        type: 'send_alert',
        parameters: {
          alertLevel: 'info',
          message: 'Monitor large position for gap risk exposure',
          channels: ['email']
        }
      }
    ],
    
    metadata: {
      version: '1.0',
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      tags: ['position_trading', 'portfolio_risk']
    }
  },
  
  {
    id: 'position-trading-extreme-risk',
    name: 'Extreme Gap Risk Management',
    description: 'Manage positions with extreme gap risk exposure',
    enabled: true,
    priority: 'high',
    type: 'gap_risk',
    applicableStyles: ['position_trading'],
    applicableRiskTolerance: ['conservative', 'moderate', 'aggressive'],
    
    conditions: {
      field: 'gapRiskScore',
      operator: '>',
      value: 85
    },
    
    gapRiskConditions: {
      minRiskScore: 85
    },
    
    actions: [
      {
        type: 'require_approval',
        parameters: {
          approvalRequired: true,
          message: 'Extreme gap risk - immediate review required',
          alertLevel: 'critical',
          timeoutHours: 1
        }
      },
      {
        type: 'reduce_position',
        parameters: {
          reductionPercent: 25,
          message: 'Reduce position due to extreme gap risk'
        }
      }
    ],
    
    metadata: {
      version: '1.0',
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      tags: ['position_trading', 'extreme_risk']
    }
  }
];

/**
 * Get rule template for specific trading style
 */
export function getRuleTemplateForStyle(style: TradingStyle): TradingStyleRuleTemplate {
  const templates: Record<TradingStyle, TradingStyleRuleTemplate> = {
    day_trading: {
      style: 'day_trading',
      name: 'Day Trading Gap Risk Rules',
      description: 'Conservative gap risk management for intraday trading',
      rules: dayTradingRules,
      defaultConfig: {
        weekendHoldingAllowed: false,
        maxGapRiskScore: 40,
        acceptableGapMagnitudes: [],
        maxPositionSize: 5,
        maxTotalExposure: 50
      }
    },
    
    scalping: {
      style: 'scalping',
      name: 'Scalping Gap Risk Rules',
      description: 'Ultra-conservative gap risk management for scalping',
      rules: scalpingRules,
      defaultConfig: {
        weekendHoldingAllowed: false,
        maxGapRiskScore: 20,
        acceptableGapMagnitudes: [],
        maxPositionSize: 2,
        maxTotalExposure: 30
      }
    },
    
    swing_trading: {
      style: 'swing_trading',
      name: 'Swing Trading Gap Risk Rules',
      description: 'Moderate gap risk management for swing trading',
      rules: swingTradingRules,
      defaultConfig: {
        weekendHoldingAllowed: true,
        maxGapRiskScore: 60,
        acceptableGapMagnitudes: [GapMagnitude.SMALL, GapMagnitude.MEDIUM],
        maxPositionSize: 8,
        maxTotalExposure: 80
      }
    },
    
    position_trading: {
      style: 'position_trading',
      name: 'Position Trading Gap Risk Rules',
      description: 'Flexible gap risk management for long-term positions',
      rules: positionTradingRules,
      defaultConfig: {
        weekendHoldingAllowed: true,
        maxGapRiskScore: 80,
        acceptableGapMagnitudes: [GapMagnitude.SMALL, GapMagnitude.MEDIUM, GapMagnitude.LARGE],
        maxPositionSize: 12,
        maxTotalExposure: 100
      }
    }
  };
  
  return templates[style];
}

/**
 * Get all available rule templates
 */
export function getAllRuleTemplates(): TradingStyleRuleTemplate[] {
  const styles: TradingStyle[] = ['day_trading', 'scalping', 'swing_trading', 'position_trading'];
  return styles.map(style => getRuleTemplateForStyle(style));
}

/**
 * Get rules for specific style and risk tolerance
 */
export function getRulesForStyleAndRisk(
  style: TradingStyle, 
  riskTolerance: RiskTolerance
): GapRiskRule[] {
  const template = getRuleTemplateForStyle(style);
  return template.rules.filter(rule => 
    rule.applicableRiskTolerance.includes(riskTolerance)
  );
}

/**
 * Create custom rule for specific requirements
 */
export function createCustomGapRiskRule(
  id: string,
  name: string,
  description: string,
  styles: TradingStyle[],
  riskTolerances: RiskTolerance[],
  minRiskScore: number,
  actions: GapRiskAction[]
): GapRiskRule {
  return {
    id,
    name,
    description,
    enabled: true,
    priority: 'medium',
    type: 'gap_risk',
    applicableStyles: styles,
    applicableRiskTolerance: riskTolerances,
    
    conditions: {
      field: 'gapRiskScore',
      operator: '>',
      value: minRiskScore
    },
    
    gapRiskConditions: {
      minRiskScore
    },
    
    actions,
    
    metadata: {
      version: '1.0',
      createdBy: 'user',
      createdAt: new Date().toISOString(),
      tags: ['custom']
    }
  };
}

/**
 * Get default configuration for style
 */
export function getDefaultConfigForStyle(style: TradingStyle): Partial<TradingStyleConfig> {
  const template = getRuleTemplateForStyle(style);
  return template.defaultConfig;
} 