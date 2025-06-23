import { Rule } from '../../types/RuleSchema';
import { evaluateCondition } from './conditionEvaluator';
import { executeAction, ActionContext } from './actionExecutor';

// Event emitter type: called when a rule is triggered
export type RuleEventEmitter = (event: {
  rule: Rule;
  action: any;
  data: Record<string, any>;
  context: ActionContext;
}) => void;

// Logging hooks
export interface RuleEngineLogger {
  info?: (msg: string, meta?: any) => void;
  error?: (msg: string, err?: any) => void;
  ruleMatched?: (rule: Rule, data: Record<string, any>) => void;
  actionExecuted?: (action: any, rule: Rule, data: Record<string, any>) => void;
}

// Scheduling: support 'executeAt' (Date or ms delay) on actions
type SchedulableAction = {
  executeAt?: Date | number; // Date or ms delay
  [key: string]: any;
};

/**
 * Evaluates a list of rules against input data and executes actions for matching rules.
 * Supports async actions, event emitters, scheduling, and logging hooks.
 */
export async function evaluateAndExecuteRules(
  rules: Rule[],
  data: Record<string, any>,
  context: ActionContext,
  opts?: {
    onEvent?: RuleEventEmitter;
    logger?: RuleEngineLogger;
  }
): Promise<void> {
  for (const rule of rules) {
    try {
      if (evaluateCondition(rule.conditions, data)) {
        opts?.logger?.ruleMatched?.(rule, data);
        for (const action of rule.actions) {
          // Scheduling support
          let delay = 0;
          const execAt = (action as SchedulableAction).executeAt;
          if (typeof execAt === 'number') {
            delay = execAt;
          } else if (execAt instanceof Date) {
            delay = execAt.getTime() - Date.now();
          }
          if (delay > 0) {
            opts?.logger?.info?.(`Delaying action execution by ${delay}ms`, { action, rule });
            await new Promise((res) => setTimeout(res, delay));
          }
          await executeAction(action, context);
          opts?.logger?.actionExecuted?.(action, rule, data);
          opts?.onEvent?.({ rule, action, data, context });
        }
        opts?.logger?.info?.(`[RuleEngine] Rule matched and actions executed: ${rule.id || rule.name}`);
      }
    } catch (err) {
      opts?.logger?.error?.(`[RuleEngine] Error processing rule ${rule.id || rule.name}:`, err);
    }
  }
} 