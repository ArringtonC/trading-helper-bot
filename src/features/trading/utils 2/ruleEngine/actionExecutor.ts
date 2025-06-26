import { Action } from '../../types/RuleSchema';

// Context type can be extended as needed (e.g., account state, logger, etc.)
export interface ActionContext {
  currentPositionSize?: number;
  setPositionSize?: (size: number) => void;
  notify?: (message: string) => void;
  // Add more as needed
}

/**
 * Action handler map for extensibility and clarity.
 */
const actionHandlers: Record<string, (action: Action, context: ActionContext) => Promise<void>> = {
  async reducePositionSize(action, context) {
    const byPercent = action.parameters.byPercent;
    if (typeof byPercent !== 'number' || !context.currentPositionSize || !context.setPositionSize) {
      throw new Error('Invalid parameters or context for reducePositionSize');
    }
    const newSize = context.currentPositionSize * (1 - byPercent / 100);
    await context.setPositionSize(newSize);
    console.log(`[ActionExecutor] Reduced position size by ${byPercent}%. New size: ${newSize}`);
  },
  async setPositionSize(action, context) {
    const toPercent = action.parameters.toPercent ?? action.parameters.size;
    if (typeof toPercent !== 'number' || !context.setPositionSize) {
      throw new Error('Invalid parameters or context for setPositionSize');
    }
    await context.setPositionSize(toPercent);
    console.log(`[ActionExecutor] Set position size to ${toPercent}%`);
  },
  async notify(action, context) {
    const message = action.parameters.message;
    if (typeof message !== 'string' || !context.notify) {
      throw new Error('Invalid parameters or context for notify');
    }
    await context.notify(message);
    console.log(`[ActionExecutor] Notification sent: ${message}`);
  },
  async log(action, context) {
    const message = action.parameters.message;
    if (typeof message !== 'string') {
      throw new Error('Invalid parameters for log action');
    }
    console.log(`[ActionExecutor][LOG]: ${message}`);
  },
  async alert(action, context) {
    const message = action.parameters.message;
    if (typeof message !== 'string') {
      throw new Error('Invalid parameters for alert action');
    }
    // In a real app, this could trigger a UI alert or send to a notification system
    console.log(`[ActionExecutor][ALERT]: ${message}`);
  },
  // Add more handlers as needed
};

/**
 * Executes a rule action using the provided context.
 * Supports extensible action types via actionHandlers map.
 */
export async function executeAction(action: Action, context: ActionContext): Promise<void> {
  try {
    const handler = actionHandlers[action.type];
    if (!handler) {
      throw new Error(`Unsupported action type: ${action.type}`);
    }
    await handler(action, context);
  } catch (err) {
    console.error(`[ActionExecutor] Error executing action:`, err);
    throw err; // Re-throw the error to propagate it
  }
} 