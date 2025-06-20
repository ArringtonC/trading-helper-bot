import { Condition, SimpleCondition } from '../../types/RuleSchema';

/**
 * Operator function map for extensibility and clarity.
 */
const operatorFunctions: Record<string, (fieldValue: any, value: any) => boolean> = {
  '==': (a, b) => a === b,
  '!=': (a, b) => a !== b,
  '>': (a, b) => a > b,
  '<': (a, b) => a < b,
  '>=': (a, b) => a >= b,
  '<=': (a, b) => a <= b,
  'in': (a, b) => Array.isArray(b) ? b.includes(a) : false,
  'not in': (a, b) => Array.isArray(b) ? !b.includes(a) : false,
  'contains': (a, b) => typeof a === 'string' && typeof b === 'string' ? a.includes(b) : false,
  'startsWith': (a, b) => typeof a === 'string' && typeof b === 'string' ? a.startsWith(b) : false,
  'matches': (a, b) => {
    if (typeof a !== 'string' || !(b instanceof RegExp || typeof b === 'string')) return false;
    const regex = b instanceof RegExp ? b : new RegExp(b);
    return regex.test(a);
  },
};

/**
 * Evaluates a simple condition against the provided data.
 * Supports extensible operators via operatorFunctions map.
 */
function evaluateSimpleCondition(condition: SimpleCondition, data: Record<string, any>): boolean {
  const { field, operator, value } = condition;
  const fieldValue = data[field];
  const opFn = operatorFunctions[operator];
  if (!opFn) {
    throw new Error(`Unsupported operator: ${operator}`);
  }
  try {
    return opFn(fieldValue, value);
  } catch (err) {
    throw new Error(`Error evaluating condition: field='${field}', operator='${operator}', value='${value}'. ${err instanceof Error ? err.message : err}`);
  }
}

/**
 * Recursively evaluates a condition (simple or compound) against the provided data.
 */
export function evaluateCondition(condition: Condition, data: Record<string, any>): boolean {
  if ('field' in condition) {
    // Simple condition
    return evaluateSimpleCondition(condition as SimpleCondition, data);
  } else if ('and' in condition && Array.isArray(condition.and)) {
    // Compound AND
    return condition.and!.every((sub) => evaluateCondition(sub, data));
  } else if ('or' in condition && Array.isArray(condition.or)) {
    // Compound OR
    return condition.or!.some((sub) => evaluateCondition(sub, data));
  } else {
    throw new Error('Invalid condition structure');
  }
} 