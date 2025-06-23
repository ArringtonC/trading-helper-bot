import { evaluateAndExecuteRules } from '../ruleEngineCore';
import { Rule } from '../../../types/RuleSchema';

describe('Integration: Rule Engine', () => {
  let consoleErrorSpy: jest.SpyInstance;
  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('evaluates multiple rules and actions end-to-end', async () => {
    const setPositionSize = jest.fn();
    const notify = jest.fn();
    const rules: Rule[] = [
      {
        id: 'r1',
        name: 'Growth Rule',
        description: '',
        type: 'throttle',
        enabled: true,
        conditions: { field: 'profit', operator: '>', value: 1000 },
        actions: [{ type: 'notify', parameters: { message: 'Profit milestone reached!' } }],
        metadata: { version: '1', createdBy: '', createdAt: '' },
      },
      {
        id: 'r2',
        name: 'Drawdown Rule',
        description: '',
        type: 'throttle',
        enabled: true,
        conditions: { field: 'drawdown', operator: '>=', value: 500 },
        actions: [{ type: 'setPositionSize', parameters: { size: 1 } }],
        metadata: { version: '1', createdBy: '', createdAt: '' },
      },
    ];
    const context = { setPositionSize, notify };
    await evaluateAndExecuteRules(rules, { profit: 1200, drawdown: 600 }, context);
    expect(notify).toHaveBeenCalledWith('Profit milestone reached!');
    expect(setPositionSize).toHaveBeenCalledWith(1);
  });

  it('handles batch evaluation across multiple contexts', async () => {
    const setPositionSize = jest.fn();
    const notify = jest.fn();
    const rules: Rule[] = [
      {
        id: 'r1',
        name: 'Batch Test Rule 1',
        description: '',
        type: 'throttle',
        enabled: true,
        conditions: { field: 'value', operator: '>', value: 100 },
        actions: [{ type: 'notify', parameters: { message: 'Value > 100' } }],
        metadata: { version: '1', createdBy: '', createdAt: '' },
      },
      {
        id: 'r2',
        name: 'Batch Test Rule 2',
        description: '',
        type: 'throttle',
        enabled: true,
        conditions: { field: 'type', operator: '==', value: 'buy' },
        actions: [{ type: 'setPositionSize', parameters: { size: 5 } }],
        metadata: { version: '1', createdBy: '', createdAt: '' },
      },
    ];
    const contexts = [
      { value: 150, type: 'buy', setPositionSize, notify }, // Should trigger both rules
      { value: 50, type: 'sell', setPositionSize, notify }, // Should trigger neither
      { value: 200, type: 'sell', setPositionSize, notify }, // Should trigger r1
      { value: 80, type: 'buy', setPositionSize, notify }, // Should trigger r2
    ];

    // Assuming evaluateAndExecuteRules can take an array of contexts for batch processing
    // If not, we would need to loop and call it for each context
    // For this test, we'll simulate batch processing by looping
    for (const context of contexts) {
      await evaluateAndExecuteRules(rules, context, context); // Pass context as both data and action context
    }

    expect(notify).toHaveBeenCalledTimes(2); // Triggered for contexts 0 and 2
    expect(notify).toHaveBeenCalledWith('Value > 100');
    expect(setPositionSize).toHaveBeenCalledTimes(2); // Triggered for contexts 0 and 3
    expect(setPositionSize).toHaveBeenCalledWith(5);
  });

  it('verifies event emitter and logger hooks are called during evaluation', async () => {
    const setPositionSize = jest.fn();
    const notify = jest.fn();
    const onEvent = jest.fn();
    const logger = { ruleMatched: jest.fn(), actionExecuted: jest.fn() };
    const rules: Rule[] = [
      {
        id: 'r1',
        name: 'Event Hook Rule',
        description: '',
        type: 'throttle',
        enabled: true,
        conditions: { field: 'trigger', operator: '==', value: true },
        actions: [{ type: 'notify', parameters: { message: 'Triggered' } }],
        metadata: { version: '1', createdBy: '', createdAt: '' },
      },
    ];
    const context = { trigger: true, setPositionSize, notify };
    const hooks = { onEvent, logger };

    await evaluateAndExecuteRules(rules, context, context, hooks);

    expect(onEvent).toHaveBeenCalled(); // Should be called at least once
    expect(logger.ruleMatched).toHaveBeenCalled(); // Should be called when r1 matches
    expect(logger.actionExecuted).toHaveBeenCalled(); // Should be called when notify action is executed
    // More specific checks on call arguments could be added if needed
  });

  it('handles errors during batch evaluation', async () => {
    const setPositionSize = jest.fn();
    const notify = jest.fn();
    const rules: Rule[] = [
      {
        id: 'r1',
        name: 'Rule That Causes Error',
        description: '',
        type: 'throttle',
        enabled: true,
        conditions: { field: 'a', operator: '==', value: 1 },
        // This action will cause an error (e.g., missing parameter)
        actions: [{ type: 'setPositionSize', parameters: {} }],
        metadata: { version: '1', createdBy: '', createdAt: '' },
      },
    ];
    const contexts = [
      { a: 1, setPositionSize, notify }, // Should trigger the error rule
      { a: 2, setPositionSize, notify }, // Should not trigger
    ];
    const logger = { ruleMatched: jest.fn(), actionExecuted: jest.fn(), error: jest.fn() };
    const onEvent = jest.fn();
    const hooks = { onEvent, logger };

    // Expecting the batch evaluation to potentially throw or log the error without stopping the batch
    // The implementation of evaluateAndExecuteRules for batches will determine the exact behavior.
    // Assuming it catches and logs errors per item, the test should check for logger.error calls.
    // If it throws on the first error, expect that.
    // For now, let's assume errors are caught and logged per item in the batch.

    await evaluateAndExecuteRules(rules, contexts[0], contexts[0], hooks); // Evaluate first context which should err
    expect(logger.error).toHaveBeenCalledTimes(1); // Error should be logged for the first context
    expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    expect(setPositionSize).not.toHaveBeenCalled(); // Action should not have completed

    // Now test the context that should not err
    await expect(evaluateAndExecuteRules(rules, contexts[1], contexts[1], hooks)).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledTimes(1); // No new errors for the second context
    expect(onEvent).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'ruleMatched' })); // Rule didn't match
  });

  it('simulates integration with real trading data structures', async () => {
    // This test assumes a hypothetical structure for trading data, e.g., from OptionsDB or a trade object
    interface MockTradingData {
      symbol: string;
      profit: number;
      drawdown: number;
      accountBalance: number;
      consecutiveLosses: number;
      // Add other relevant fields from your application's data structure
    }

    const mockTrade: MockTradingData = {
      symbol: 'SPY',
      profit: 1500,
      drawdown: 300,
      accountBalance: 10000,
      consecutiveLosses: 2,
    };

    const mockAccountContext = {
      accountBalance: mockTrade.accountBalance,
      consecutiveLosses: mockTrade.consecutiveLosses,
      // Add other account-level context if needed by rules
    };

    const mockActionContext = {
      setPositionSize: jest.fn(),
      notify: jest.fn(),
      // Add other functions available in the action context
    };

    const rules: Rule[] = [
      {
        id: 'r1',
        name: 'High Profit Notification',
        description: '',
        type: 'milestone',
        enabled: true,
        conditions: { field: 'profit', operator: '>', value: 1000 },
        actions: [{ type: 'notify', parameters: { message: `High profit for ${mockTrade.symbol}: ${mockTrade.profit}` } }],
        metadata: { version: '1', createdBy: '', createdAt: '' },
      },
      {
        id: 'r2',
        name: 'Consecutive Loss Throttle',
        description: '',
        type: 'throttle',
        enabled: true,
        conditions: { field: 'consecutiveLosses', operator: '>=', value: 3 },
        actions: [{ type: 'setPositionSize', parameters: { size: 0.5 } }],
        metadata: { version: '1', createdBy: '', createdAt: '' },
      },
    ];

    // Evaluate rules using the mock trading data and account context
    // The evaluateAndExecuteRules function needs to merge or access these contexts correctly.
    // Assuming it takes dataContext and actionContext separately or merged.
    // Based on ruleEngineCore.spec.ts, it takes dataContext and actionContext.

    await evaluateAndExecuteRules(rules, mockTrade, mockActionContext);

    // Assertions based on the mock data and rules
    expect(mockActionContext.notify).toHaveBeenCalledWith('High profit for SPY: 1500'); // r1 should trigger
    expect(mockActionContext.setPositionSize).not.toHaveBeenCalled(); // r2 should not trigger (consecutiveLosses is 2)
  });

  
}); 