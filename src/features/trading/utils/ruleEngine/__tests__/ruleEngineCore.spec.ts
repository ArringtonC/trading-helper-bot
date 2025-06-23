import { evaluateAndExecuteRules } from '../ruleEngineCore';
import { Rule } from '../../../types/RuleSchema';

describe('RuleEngineCore', () => {
  let consoleErrorSpy: jest.SpyInstance;
  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });
  it('executes actions for matching rules', async () => {
    const setPositionSize = jest.fn();
    const rules: Rule[] = [
      {
        id: 'r1',
        name: 'Test Rule',
        description: '',
        type: 'throttle',
        enabled: true,
        conditions: { field: 'a', operator: '==', value: 1 },
        actions: [{ type: 'setPositionSize', parameters: { size: 2 } }],
        metadata: { version: '1', createdBy: '', createdAt: '' },
      },
    ];
    const context = { setPositionSize };
    await evaluateAndExecuteRules(rules, { a: 1 }, context);
    expect(setPositionSize).toHaveBeenCalledWith(2);
  });
  it('calls event emitter and logger hooks', async () => {
    const setPositionSize = jest.fn();
    const onEvent = jest.fn();
    const logger = { ruleMatched: jest.fn(), actionExecuted: jest.fn() };
    const rules: Rule[] = [
      {
        id: 'r1',
        name: 'Test Rule',
        description: '',
        type: 'throttle',
        enabled: true,
        conditions: { field: 'a', operator: '==', value: 1 },
        actions: [{ type: 'setPositionSize', parameters: { size: 2 } }],
        metadata: { version: '1', createdBy: '', createdAt: '' },
      },
    ];
    const context = { setPositionSize };
    await evaluateAndExecuteRules(rules, { a: 1 }, context, { onEvent, logger });
    expect(logger.ruleMatched).toHaveBeenCalled();
    expect(logger.actionExecuted).toHaveBeenCalled();
    expect(onEvent).toHaveBeenCalled();
  });
  it('supports scheduling with executeAt delay', async () => {
    const setPositionSize = jest.fn();
    const rules: Rule[] = [
      {
        id: 'r1',
        name: 'Test Rule',
        description: '',
        type: 'throttle',
        enabled: true,
        conditions: { field: 'a', operator: '==', value: 1 },
        actions: [{ type: 'setPositionSize', parameters: { size: 2 }, executeAt: 100 }],
        metadata: { version: '1', createdBy: '', createdAt: '' },
      },
    ];
    const context = { setPositionSize };
    const start = Date.now();
    await evaluateAndExecuteRules(rules, { a: 1 }, context);
    expect(setPositionSize).toHaveBeenCalledWith(2);
    expect(Date.now() - start).toBeGreaterThanOrEqual(100);
  });
  it('handles rule prioritization', async () => {
    const setPositionSize = jest.fn();
    const notify = jest.fn();
    const rules: Rule[] = [
      {
        id: 'r1',
        name: 'Low Priority Rule',
        description: '',
        type: 'throttle',
        enabled: true,
        conditions: { field: 'a', operator: '==', value: 1 },
        actions: [{ type: 'setPositionSize', parameters: { size: 5 } }],
        metadata: { version: '1', createdBy: '', createdAt: '' },
        priority: 'low'
      },
      {
        id: 'r2',
        name: 'High Priority Rule',
        description: '',
        type: 'throttle',
        enabled: true,
        conditions: { field: 'a', operator: '==', value: 1 },
        actions: [{ type: 'setPositionSize', parameters: { size: 2 } }],
        metadata: { version: '1', createdBy: '', createdAt: '' },
        priority: 'high'
      },
    ];
    const context = { setPositionSize, notify };
    await evaluateAndExecuteRules(rules, { a: 1 }, context);
    // Expect the action from the high priority rule to be called last (or have the final effect)
    expect(setPositionSize).toHaveBeenCalledTimes(2);
    expect(setPositionSize).toHaveBeenLastCalledWith(2);
  });
  it('respects rule dependencies', async () => {
    const setPositionSize = jest.fn();
    const notify = jest.fn();
    const rules: Rule[] = [
      {
        id: 'r1',
        name: 'Dependency Rule',
        description: '',
        type: 'throttle',
        enabled: true,
        conditions: { field: 'a', operator: '==', value: 1 },
        actions: [{ type: 'notify', parameters: { message: 'Dependency met' } }],
        metadata: { version: '1', createdBy: '', createdAt: '' },
      },
      {
        id: 'r2',
        name: 'Dependent Rule',
        description: '',
        type: 'throttle',
        enabled: true,
        conditions: { field: 'a', operator: '==', value: 1 },
        actions: [{ type: 'setPositionSize', parameters: { size: 10 } }],
        dependencies: ['r1'],
        metadata: { version: '1', createdBy: '', createdAt: '' },
      },
    ];
    const context = { setPositionSize, notify };
    await evaluateAndExecuteRules(rules, { a: 1 }, context);
    // Expect r1 to be evaluated and its action called, then r2 evaluated and its action called
    expect(notify).toHaveBeenCalledWith('Dependency met');
    expect(setPositionSize).toHaveBeenCalledWith(10);
    // The order of calls to setPositionSize might be tricky to test directly without more advanced mocking
    // but ensuring both actions are called and dependencies are considered is key.
  });
  it('handles errors during condition evaluation', async () => {
    const rules: Rule[] = [
      {
        id: 'r1',
        name: 'Error Condition Rule',
        description: '',
        type: 'throttle',
        enabled: true,
        // This condition should ideally throw, e.g., invalid operator or missing required field handled incorrectly
        // For this test, we'll simulate an error during evaluation
        conditions: { field: 'a', operator: 'invalid' as any, value: 1 },
        actions: [{ type: 'notify', parameters: { message: 'Should not be called' } }],
        metadata: { version: '1', createdBy: '', createdAt: '' },
      },
    ];
    const context = { a: 1, notify: jest.fn() };
    const logger = { ruleMatched: jest.fn(), actionExecuted: jest.fn(), error: jest.fn() };
    const onEvent = jest.fn();
    const hooks = { onEvent, logger };

    await expect(evaluateAndExecuteRules(rules, { a: 1 }, context, hooks)).rejects.toThrow();
    expect(logger.error).toHaveBeenCalled();
    expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    expect(context.notify).not.toHaveBeenCalled();
  });
  it('handles errors during action execution', async () => {
    const rules: Rule[] = [
      {
        id: 'r1',
        name: 'Error Action Rule',
        description: '',
        type: 'throttle',
        enabled: true,
        conditions: { field: 'a', operator: '==', value: 1 },
        // This action should ideally throw, e.g., missing required parameter handled incorrectly
        actions: [{ type: 'setPositionSize', parameters: {} }], // Missing 'size' parameter
        metadata: { version: '1', createdBy: '', createdAt: '' },
      },
    ];
    const context = { a: 1, setPositionSize: jest.fn() };
    const logger = { ruleMatched: jest.fn(), actionExecuted: jest.fn(), error: jest.fn() };
    const onEvent = jest.fn();
    const hooks = { onEvent, logger };

    await expect(evaluateAndExecuteRules(rules, { a: 1 }, context, hooks)).rejects.toThrow();
    expect(logger.ruleMatched).toHaveBeenCalled(); // Rule matched before action error
    expect(logger.error).toHaveBeenCalled();
    expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    expect(context.setPositionSize).not.toHaveBeenCalled();
  });
  it('handles rules with no actions gracefully', async () => {
    const rules: Rule[] = [
      {
        id: 'r1',
        name: 'No Action Rule',
        description: '',
        type: 'info', // Or any type not expected to have actions
        enabled: true,
        conditions: { field: 'a', operator: '==', value: 1 },
        actions: [], // No actions
        metadata: { version: '1', createdBy: '', createdAt: '' },
      },
    ];
    const context = { a: 1, notify: jest.fn(), setPositionSize: jest.fn() };
    const logger = { ruleMatched: jest.fn(), actionExecuted: jest.fn(), error: jest.fn() };
    const onEvent = jest.fn();
    const hooks = { onEvent, logger };

    await expect(evaluateAndExecuteRules(rules, { a: 1 }, context, hooks)).resolves.toBeUndefined();
    expect(logger.ruleMatched).toHaveBeenCalled();
    expect(logger.actionExecuted).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
    expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'ruleMatched' }));
    expect(onEvent).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
  });
  it('handles an empty rules array gracefully', async () => {
    const setPositionSize = jest.fn();
    const notify = jest.fn();
    const rules: Rule[] = [];
    const context = { a: 1, setPositionSize, notify };
    const logger = { ruleMatched: jest.fn(), actionExecuted: jest.fn(), error: jest.fn() };
    const onEvent = jest.fn();
    const hooks = { onEvent, logger };

    await expect(evaluateAndExecuteRules(rules, { a: 1 }, context, hooks)).resolves.toBeUndefined();
    expect(logger.ruleMatched).not.toHaveBeenCalled();
    expect(logger.actionExecuted).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
    expect(onEvent).not.toHaveBeenCalled();
  });
  it('does not evaluate or execute disabled rules', async () => {
    const setPositionSize = jest.fn();
    const notify = jest.fn();
    const rules: Rule[] = [
      {
        id: 'r1',
        name: 'Disabled Rule',
        description: '',
        type: 'throttle',
        enabled: false, // Disabled
        conditions: { field: 'a', operator: '==', value: 1 },
        actions: [{ type: 'setPositionSize', parameters: { size: 100 } }],
        metadata: { version: '1', createdBy: '', createdAt: '' },
      },
    ];
    const context = { a: 1, setPositionSize, notify };
    const logger = { ruleMatched: jest.fn(), actionExecuted: jest.fn(), error: jest.fn() };
    const onEvent = jest.fn();
    const hooks = { onEvent, logger };

    await expect(evaluateAndExecuteRules(rules, { a: 1 }, context, hooks)).resolves.toBeUndefined();
    expect(logger.ruleMatched).not.toHaveBeenCalled();
    expect(logger.actionExecuted).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
    expect(onEvent).not.toHaveBeenCalled();
    expect(setPositionSize).not.toHaveBeenCalled();
  });
  
}); 