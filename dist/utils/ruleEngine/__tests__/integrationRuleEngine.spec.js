var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { evaluateAndExecuteRules } from '../ruleEngineCore';
describe('Integration: Rule Engine', function () {
    var consoleErrorSpy;
    beforeEach(function () {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(function () { });
    });
    afterEach(function () {
        consoleErrorSpy.mockRestore();
    });
    it('evaluates multiple rules and actions end-to-end', function () { return __awaiter(void 0, void 0, void 0, function () {
        var setPositionSize, notify, rules, context;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setPositionSize = jest.fn();
                    notify = jest.fn();
                    rules = [
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
                    context = { setPositionSize: setPositionSize, notify: notify };
                    return [4 /*yield*/, evaluateAndExecuteRules(rules, { profit: 1200, drawdown: 600 }, context)];
                case 1:
                    _a.sent();
                    expect(notify).toHaveBeenCalledWith('Profit milestone reached!');
                    expect(setPositionSize).toHaveBeenCalledWith(1);
                    return [2 /*return*/];
            }
        });
    }); });
    it('handles batch evaluation across multiple contexts', function () { return __awaiter(void 0, void 0, void 0, function () {
        var setPositionSize, notify, rules, contexts, _i, contexts_1, context_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setPositionSize = jest.fn();
                    notify = jest.fn();
                    rules = [
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
                    contexts = [
                        { value: 150, type: 'buy', setPositionSize: setPositionSize, notify: notify }, // Should trigger both rules
                        { value: 50, type: 'sell', setPositionSize: setPositionSize, notify: notify }, // Should trigger neither
                        { value: 200, type: 'sell', setPositionSize: setPositionSize, notify: notify }, // Should trigger r1
                        { value: 80, type: 'buy', setPositionSize: setPositionSize, notify: notify }, // Should trigger r2
                    ];
                    _i = 0, contexts_1 = contexts;
                    _a.label = 1;
                case 1:
                    if (!(_i < contexts_1.length)) return [3 /*break*/, 4];
                    context_1 = contexts_1[_i];
                    return [4 /*yield*/, evaluateAndExecuteRules(rules, context_1, context_1)];
                case 2:
                    _a.sent(); // Pass context as both data and action context
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    expect(notify).toHaveBeenCalledTimes(2); // Triggered for contexts 0 and 2
                    expect(notify).toHaveBeenCalledWith('Value > 100');
                    expect(setPositionSize).toHaveBeenCalledTimes(2); // Triggered for contexts 0 and 3
                    expect(setPositionSize).toHaveBeenCalledWith(5);
                    return [2 /*return*/];
            }
        });
    }); });
    it('verifies event emitter and logger hooks are called during evaluation', function () { return __awaiter(void 0, void 0, void 0, function () {
        var setPositionSize, notify, onEvent, logger, rules, context, hooks;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setPositionSize = jest.fn();
                    notify = jest.fn();
                    onEvent = jest.fn();
                    logger = { ruleMatched: jest.fn(), actionExecuted: jest.fn() };
                    rules = [
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
                    context = { trigger: true, setPositionSize: setPositionSize, notify: notify };
                    hooks = { onEvent: onEvent, logger: logger };
                    return [4 /*yield*/, evaluateAndExecuteRules(rules, context, context, hooks)];
                case 1:
                    _a.sent();
                    expect(onEvent).toHaveBeenCalled(); // Should be called at least once
                    expect(logger.ruleMatched).toHaveBeenCalled(); // Should be called when r1 matches
                    expect(logger.actionExecuted).toHaveBeenCalled(); // Should be called when notify action is executed
                    return [2 /*return*/];
            }
        });
    }); });
    it('handles errors during batch evaluation', function () { return __awaiter(void 0, void 0, void 0, function () {
        var setPositionSize, notify, rules, contexts, logger, onEvent, hooks;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setPositionSize = jest.fn();
                    notify = jest.fn();
                    rules = [
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
                    contexts = [
                        { a: 1, setPositionSize: setPositionSize, notify: notify }, // Should trigger the error rule
                        { a: 2, setPositionSize: setPositionSize, notify: notify }, // Should not trigger
                    ];
                    logger = { ruleMatched: jest.fn(), actionExecuted: jest.fn(), error: jest.fn() };
                    onEvent = jest.fn();
                    hooks = { onEvent: onEvent, logger: logger };
                    // Expecting the batch evaluation to potentially throw or log the error without stopping the batch
                    // The implementation of evaluateAndExecuteRules for batches will determine the exact behavior.
                    // Assuming it catches and logs errors per item, the test should check for logger.error calls.
                    // If it throws on the first error, expect that.
                    // For now, let's assume errors are caught and logged per item in the batch.
                    return [4 /*yield*/, evaluateAndExecuteRules(rules, contexts[0], contexts[0], hooks)];
                case 1:
                    // Expecting the batch evaluation to potentially throw or log the error without stopping the batch
                    // The implementation of evaluateAndExecuteRules for batches will determine the exact behavior.
                    // Assuming it catches and logs errors per item, the test should check for logger.error calls.
                    // If it throws on the first error, expect that.
                    // For now, let's assume errors are caught and logged per item in the batch.
                    _a.sent(); // Evaluate first context which should err
                    expect(logger.error).toHaveBeenCalledTimes(1); // Error should be logged for the first context
                    expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
                    expect(setPositionSize).not.toHaveBeenCalled(); // Action should not have completed
                    // Now test the context that should not err
                    return [4 /*yield*/, expect(evaluateAndExecuteRules(rules, contexts[1], contexts[1], hooks)).resolves.toBeUndefined()];
                case 2:
                    // Now test the context that should not err
                    _a.sent();
                    expect(logger.error).toHaveBeenCalledTimes(1); // No new errors for the second context
                    expect(onEvent).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'ruleMatched' })); // Rule didn't match
                    return [2 /*return*/];
            }
        });
    }); });
    it('simulates integration with real trading data structures', function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockTrade, mockAccountContext, mockActionContext, rules;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockTrade = {
                        symbol: 'SPY',
                        profit: 1500,
                        drawdown: 300,
                        accountBalance: 10000,
                        consecutiveLosses: 2,
                    };
                    mockAccountContext = {
                        accountBalance: mockTrade.accountBalance,
                        consecutiveLosses: mockTrade.consecutiveLosses,
                        // Add other account-level context if needed by rules
                    };
                    mockActionContext = {
                        setPositionSize: jest.fn(),
                        notify: jest.fn(),
                        // Add other functions available in the action context
                    };
                    rules = [
                        {
                            id: 'r1',
                            name: 'High Profit Notification',
                            description: '',
                            type: 'milestone',
                            enabled: true,
                            conditions: { field: 'profit', operator: '>', value: 1000 },
                            actions: [{ type: 'notify', parameters: { message: "High profit for ".concat(mockTrade.symbol, ": ").concat(mockTrade.profit) } }],
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
                    return [4 /*yield*/, evaluateAndExecuteRules(rules, mockTrade, mockActionContext)];
                case 1:
                    // Evaluate rules using the mock trading data and account context
                    // The evaluateAndExecuteRules function needs to merge or access these contexts correctly.
                    // Assuming it takes dataContext and actionContext separately or merged.
                    // Based on ruleEngineCore.spec.ts, it takes dataContext and actionContext.
                    _a.sent();
                    // Assertions based on the mock data and rules
                    expect(mockActionContext.notify).toHaveBeenCalledWith('High profit for SPY: 1500'); // r1 should trigger
                    expect(mockActionContext.setPositionSize).not.toHaveBeenCalled(); // r2 should not trigger (consecutiveLosses is 2)
                    return [2 /*return*/];
            }
        });
    }); });
});
