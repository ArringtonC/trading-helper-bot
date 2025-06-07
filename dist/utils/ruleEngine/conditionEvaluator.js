/**
 * Operator function map for extensibility and clarity.
 */
var operatorFunctions = {
    '==': function (a, b) { return a === b; },
    '!=': function (a, b) { return a !== b; },
    '>': function (a, b) { return a > b; },
    '<': function (a, b) { return a < b; },
    '>=': function (a, b) { return a >= b; },
    '<=': function (a, b) { return a <= b; },
    'in': function (a, b) { return Array.isArray(b) ? b.includes(a) : false; },
    'not in': function (a, b) { return Array.isArray(b) ? !b.includes(a) : false; },
    'contains': function (a, b) { return typeof a === 'string' && typeof b === 'string' ? a.includes(b) : false; },
    'startsWith': function (a, b) { return typeof a === 'string' && typeof b === 'string' ? a.startsWith(b) : false; },
    'matches': function (a, b) {
        if (typeof a !== 'string' || !(b instanceof RegExp || typeof b === 'string'))
            return false;
        var regex = b instanceof RegExp ? b : new RegExp(b);
        return regex.test(a);
    },
};
/**
 * Evaluates a simple condition against the provided data.
 * Supports extensible operators via operatorFunctions map.
 */
function evaluateSimpleCondition(condition, data) {
    var field = condition.field, operator = condition.operator, value = condition.value;
    var fieldValue = data[field];
    var opFn = operatorFunctions[operator];
    if (!opFn) {
        throw new Error("Unsupported operator: ".concat(operator));
    }
    try {
        return opFn(fieldValue, value);
    }
    catch (err) {
        throw new Error("Error evaluating condition: field='".concat(field, "', operator='").concat(operator, "', value='").concat(value, "'. ").concat(err instanceof Error ? err.message : err));
    }
}
/**
 * Recursively evaluates a condition (simple or compound) against the provided data.
 */
export function evaluateCondition(condition, data) {
    if ('field' in condition) {
        // Simple condition
        return evaluateSimpleCondition(condition, data);
    }
    else if ('and' in condition && Array.isArray(condition.and)) {
        // Compound AND
        return condition.and.every(function (sub) { return evaluateCondition(sub, data); });
    }
    else if ('or' in condition && Array.isArray(condition.or)) {
        // Compound OR
        return condition.or.some(function (sub) { return evaluateCondition(sub, data); });
    }
    else {
        throw new Error('Invalid condition structure');
    }
}
