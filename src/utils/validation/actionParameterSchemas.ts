// JSON Schema definitions for action parameters
export interface ActionParameterSchema {
  type: string;
  properties: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
  description?: string;
  examples?: any[];
}

// Schema definitions for different action types
export const ACTION_PARAMETER_SCHEMAS: Record<string, ActionParameterSchema> = {
  reducePositionSize: {
    type: 'object',
    description: 'Reduces the current position size by a specified percentage or amount',
    properties: {
      byPercent: {
        type: 'number',
        minimum: 0,
        maximum: 100,
        description: 'Percentage to reduce position size (0-100)'
      },
      byAmount: {
        type: 'number',
        minimum: 0,
        description: 'Fixed amount to reduce position size'
      },
      minSize: {
        type: 'number',
        minimum: 0,
        description: 'Minimum position size after reduction'
      },
      reason: {
        type: 'string',
        description: 'Reason for position size reduction'
      }
    },
    required: [],
    additionalProperties: false,
    examples: [
      { byPercent: 50, reason: 'Risk management' },
      { byAmount: 1000, minSize: 500 }
    ]
  },

  setPositionSize: {
    type: 'object',
    description: 'Sets the position size to a specific percentage or amount',
    properties: {
      toPercent: {
        type: 'number',
        minimum: 0,
        maximum: 100,
        description: 'Set position size to this percentage of account'
      },
      toAmount: {
        type: 'number',
        minimum: 0,
        description: 'Set position size to this fixed amount'
      },
      maxSize: {
        type: 'number',
        minimum: 0,
        description: 'Maximum allowed position size'
      },
      reason: {
        type: 'string',
        description: 'Reason for position size change'
      }
    },
    required: [],
    additionalProperties: false,
    examples: [
      { toPercent: 2, reason: 'Milestone reached' },
      { toAmount: 5000, maxSize: 10000 }
    ]
  },

  notify: {
    type: 'object',
    description: 'Sends a notification with specified message and options',
    properties: {
      message: {
        type: 'string',
        minLength: 1,
        description: 'Notification message content'
      },
      level: {
        type: 'string',
        enum: ['info', 'warning', 'error', 'success'],
        description: 'Notification severity level'
      },
      channels: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['email', 'sms', 'push', 'slack', 'discord']
        },
        description: 'Notification delivery channels'
      },
      persistent: {
        type: 'boolean',
        description: 'Whether notification should persist until acknowledged'
      },
      metadata: {
        type: 'object',
        description: 'Additional metadata for the notification'
      }
    },
    required: ['message'],
    additionalProperties: false,
    examples: [
      { message: 'Position size reduced due to consecutive losses', level: 'warning' },
      { message: 'Milestone achieved!', level: 'success', channels: ['email', 'push'] }
    ]
  },

  log: {
    type: 'object',
    description: 'Logs information with specified level and details',
    properties: {
      message: {
        type: 'string',
        minLength: 1,
        description: 'Log message content'
      },
      level: {
        type: 'string',
        enum: ['debug', 'info', 'warn', 'error'],
        description: 'Log level'
      },
      category: {
        type: 'string',
        description: 'Log category for filtering'
      },
      data: {
        type: 'object',
        description: 'Additional data to log'
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tags for log categorization'
      }
    },
    required: ['message'],
    additionalProperties: false,
    examples: [
      { message: 'Rule triggered', level: 'info', category: 'rule-engine' },
      { message: 'Error processing trade', level: 'error', data: { tradeId: '123' } }
    ]
  },

  alert: {
    type: 'object',
    description: 'Triggers an alert with specified urgency and actions',
    properties: {
      title: {
        type: 'string',
        minLength: 1,
        description: 'Alert title'
      },
      message: {
        type: 'string',
        minLength: 1,
        description: 'Alert message content'
      },
      urgency: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'critical'],
        description: 'Alert urgency level'
      },
      actions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            action: { type: 'string' },
            style: { type: 'string', enum: ['primary', 'secondary', 'danger'] }
          },
          required: ['label', 'action']
        },
        description: 'Available actions for the alert'
      },
      autoClose: {
        type: 'number',
        minimum: 0,
        description: 'Auto-close alert after specified milliseconds'
      },
      sound: {
        type: 'boolean',
        description: 'Whether to play alert sound'
      }
    },
    required: ['title', 'message'],
    additionalProperties: false,
    examples: [
      { 
        title: 'Risk Alert', 
        message: 'Position size exceeds risk limits', 
        urgency: 'high',
        actions: [{ label: 'Reduce Size', action: 'reduce-position', style: 'danger' }]
      }
    ]
  },

  webhook: {
    type: 'object',
    description: 'Sends data to a webhook endpoint',
    properties: {
      url: {
        type: 'string',
        format: 'uri',
        description: 'Webhook URL endpoint'
      },
      method: {
        type: 'string',
        enum: ['GET', 'POST', 'PUT', 'PATCH'],
        description: 'HTTP method'
      },
      headers: {
        type: 'object',
        description: 'HTTP headers to send'
      },
      payload: {
        type: 'object',
        description: 'Data payload to send'
      },
      timeout: {
        type: 'number',
        minimum: 1000,
        maximum: 30000,
        description: 'Request timeout in milliseconds'
      },
      retries: {
        type: 'number',
        minimum: 0,
        maximum: 5,
        description: 'Number of retry attempts'
      }
    },
    required: ['url'],
    additionalProperties: false,
    examples: [
      { 
        url: 'https://api.example.com/webhook', 
        method: 'POST',
        payload: { event: 'rule-triggered', ruleId: '{{ruleId}}' }
      }
    ]
  },

  delay: {
    type: 'object',
    description: 'Delays execution for a specified duration',
    properties: {
      duration: {
        type: 'number',
        minimum: 0,
        description: 'Delay duration in milliseconds'
      },
      unit: {
        type: 'string',
        enum: ['ms', 'seconds', 'minutes', 'hours'],
        description: 'Time unit for duration'
      },
      reason: {
        type: 'string',
        description: 'Reason for the delay'
      }
    },
    required: ['duration'],
    additionalProperties: false,
    examples: [
      { duration: 5000, unit: 'ms', reason: 'Cool-down period' },
      { duration: 1, unit: 'minutes', reason: 'Wait for market stabilization' }
    ]
  }
};

// Helper function to get schema for an action type
export function getActionParameterSchema(actionType: string): ActionParameterSchema | null {
  return ACTION_PARAMETER_SCHEMAS[actionType] || null;
}

// Helper function to get all available action types
export function getAvailableActionTypes(): string[] {
  return Object.keys(ACTION_PARAMETER_SCHEMAS);
}

// Helper function to get action type description
export function getActionTypeDescription(actionType: string): string {
  const schema = getActionParameterSchema(actionType);
  return schema?.description || `Action type: ${actionType}`;
} 
 
 
 