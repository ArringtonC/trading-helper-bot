import { executeAction, ActionContext } from '../actionExecutor';
import { Action } from '../../../types/RuleSchema';

describe('ActionExecutor', () => {
  let consoleErrorSpy: jest.SpyInstance;
  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('reduces position size correctly (reducePositionSize)', async () => {
    const setPositionSize = jest.fn();
    const context: ActionContext = {
      currentPositionSize: 100,
      setPositionSize,
    };
    const action: Action = {
      type: 'reducePositionSize',
      parameters: { byPercent: 20 },
    };
    await executeAction(action, context);
    expect(setPositionSize).toHaveBeenCalledWith(80);
  });

  it('sets position size correctly (setPositionSize)', async () => {
    const setPositionSize = jest.fn();
    const context: ActionContext = { setPositionSize };
    const action: Action = {
      type: 'setPositionSize',
      parameters: { toPercent: 2 },
    };
    await executeAction(action, context);
    expect(setPositionSize).toHaveBeenCalledWith(2);
  });

  it('calls notify with correct message (notify)', async () => {
    const notify = jest.fn();
    const context: ActionContext = { notify };
    const action: Action = {
      type: 'notify',
      parameters: { message: 'Test message' },
    };
    await executeAction(action, context);
    expect(notify).toHaveBeenCalledWith('Test message');
  });

  it('throws error for missing parameters (reducePositionSize)', async () => {
    const setPositionSize = jest.fn();
    const context: ActionContext = { currentPositionSize: 100, setPositionSize };
    const action: Action = {
      type: 'reducePositionSize',
      parameters: {},
    };
    await expect(executeAction(action, context)).rejects.toThrow('Invalid parameters or context for reducePositionSize');
  });

  it('throws error for missing context functions (reducePositionSize)', async () => {
    const context: ActionContext = { currentPositionSize: 100 };
    const action: Action = {
      type: 'reducePositionSize',
      parameters: { byPercent: 20 },
    };
    await expect(executeAction(action, context)).rejects.toThrow('Invalid parameters or context for reducePositionSize');
  });

  it('throws error for missing parameters (setPositionSize)', async () => {
    const setPositionSize = jest.fn();
    const context: ActionContext = { setPositionSize };
    const action: Action = {
      type: 'setPositionSize',
      parameters: {},
    };
    await expect(executeAction(action, context)).rejects.toThrow('Invalid parameters or context for setPositionSize');
  });

  it('throws error for missing context functions (setPositionSize)', async () => {
    const context: ActionContext = {};
    const action: Action = {
      type: 'setPositionSize',
      parameters: { toPercent: 2 },
    };
    await expect(executeAction(action, context)).rejects.toThrow('Invalid parameters or context for setPositionSize');
  });

  it('throws error for missing parameters (notify)', async () => {
    const notify = jest.fn();
    const context: ActionContext = { notify };
    const action: Action = {
      type: 'notify',
      parameters: {},
    };
    await expect(executeAction(action, context)).rejects.toThrow('Invalid parameters or context for notify');
  });

  it('throws error for missing context functions (notify)', async () => {
    const context: ActionContext = {};
    const action: Action = {
      type: 'notify',
      parameters: { message: 'test' },
    };
    await expect(executeAction(action, context)).rejects.toThrow('Invalid parameters or context for notify');
  });

  it('throws error for unsupported action type', async () => {
    const context: ActionContext = {};
    const action: Action = {
      type: 'unsupported' as any,
      parameters: {},
    };
    await expect(executeAction(action, context)).rejects.toThrow('Unsupported action type: unsupported');
  });

  it('throws error for incorrect parameter type (setPositionSize)', async () => {
    const setPositionSize = jest.fn();
    const context: ActionContext = { setPositionSize };
    const action: Action = {
      type: 'setPositionSize',
      parameters: { toPercent: 'two' as any }, // Incorrect type
    };
    await expect(executeAction(action, context)).rejects.toThrow('Invalid parameters or context for setPositionSize');
  });

  it('propagates errors thrown by context.setPositionSize', async () => {
    const setPositionSize = jest.fn(() => { throw new Error('Handler failed'); });
    const context: ActionContext = { setPositionSize };
    const action: Action = {
      type: 'setPositionSize',
      parameters: { toPercent: 2 },
    };
    await expect(executeAction(action, context)).rejects.toThrow('Handler failed');
  });

  it('supports async context functions (setPositionSize)', async () => {
    const setPositionSize = jest.fn().mockResolvedValue(undefined);
    const context: ActionContext = { setPositionSize };
    const action: Action = {
      type: 'setPositionSize',
      parameters: { toPercent: 2 },
    };
    await expect(executeAction(action, context)).resolves.toBeUndefined();
    expect(setPositionSize).toHaveBeenCalledWith(2);
  });

  it('propagates errors thrown by context.notify', async () => {
    const notify = jest.fn(() => { throw new Error('Notify failed'); });
    const context: ActionContext = { notify };
    const action: Action = {
      type: 'notify',
      parameters: { message: 'Test' },
    };
    await expect(executeAction(action, context)).rejects.toThrow('Notify failed');
  });

  it('supports async context functions (notify)', async () => {
    const notify = jest.fn().mockResolvedValue(undefined);
    const context: ActionContext = { notify };
    const action: Action = {
      type: 'notify',
      parameters: { message: 'Test' },
    };
    await expect(executeAction(action, context)).resolves.toBeUndefined();
    expect(notify).toHaveBeenCalledWith('Test');
  });

  it('propagates errors thrown by context.setPositionSize in reducePositionSize', async () => {
    const setPositionSize = jest.fn(() => { throw new Error('Reduce failed'); });
    const context: ActionContext = { currentPositionSize: 100, setPositionSize };
    const action: Action = {
      type: 'reducePositionSize',
      parameters: { byPercent: 10 },
    };
    await expect(executeAction(action, context)).rejects.toThrow('Reduce failed');
  });

  it('supports async context functions (reducePositionSize)', async () => {
    const setPositionSize = jest.fn().mockResolvedValue(undefined);
    const context: ActionContext = { currentPositionSize: 100, setPositionSize };
    const action: Action = {
      type: 'reducePositionSize',
      parameters: { byPercent: 10 },
    };
    await expect(executeAction(action, context)).resolves.toBeUndefined();
    expect(setPositionSize).toHaveBeenCalledWith(90);
  });

  it('logs message for log action', async () => {
    const context: ActionContext = {};
    const action: Action = {
      type: 'log',
      parameters: { message: 'Log this message' },
    };
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await executeAction(action, context);
    expect(consoleSpy).toHaveBeenCalledWith('[ActionExecutor][LOG]: Log this message');
    consoleSpy.mockRestore();
  });

  it('throws error for missing message in log action', async () => {
    const context: ActionContext = {};
    const action: Action = {
      type: 'log',
      parameters: {},
    };
    await expect(executeAction(action, context)).rejects.toThrow('Invalid parameters for log action');
  });

  it('alerts message for alert action', async () => {
    const context: ActionContext = {};
    const action: Action = {
      type: 'alert',
      parameters: { message: 'Alert this message' },
    };
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await executeAction(action, context);
    expect(consoleSpy).toHaveBeenCalledWith('[ActionExecutor][ALERT]: Alert this message');
    consoleSpy.mockRestore();
  });

  it('throws error for missing message in alert action', async () => {
    const context: ActionContext = {};
    const action: Action = {
      type: 'alert',
      parameters: {},
    };
    await expect(executeAction(action, context)).rejects.toThrow('Invalid parameters for alert action');
  });

  // TODO: Add async action, edge case, and error propagation tests
}); 