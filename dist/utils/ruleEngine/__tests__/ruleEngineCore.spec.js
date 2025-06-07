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
describe('RuleEngineCore', function () {
    var consoleErrorSpy;
    beforeEach(function () {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(function () { });
    });
    afterEach(function () {
        consoleErrorSpy.mockRestore();
    });
    it('executes actions for matching rules', function () { return __awaiter(void 0, void 0, void 0, function () {
        var setPositionSize, rules, context;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setPositionSize = jest.fn();
                    rules = [
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
                    context = { setPositionSize: setPositionSize };
                    return [4 /*yield*/, evaluateAndExecuteRules(rules, { a: 1 }, context)];
                case 1:
                    _a.sent();
                    expect(setPositionSize).toHaveBeenCalledWith(2);
                    return [2 /*return*/];
            }
        });
    }); });
    it('calls event emitter and logger hooks', function () { return __awaiter(void 0, void 0, void 0, function () {
        var setPositionSize, onEvent, logger, rules, context;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setPositionSize = jest.fn();
                    onEvent = jest.fn();
                    logger = { ruleMatched: jest.fn(), actionExecuted: jest.fn() };
                    rules = [
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
                    context = { setPositionSize: setPositionSize };
                    return [4 /*yield*/, evaluateAndExecuteRules(rules, { a: 1 }, context, { onEvent: onEvent, logger: logger })];
                case 1:
                    _a.sent();
                    expect(logger.ruleMatched).toHaveBeenCalled();
                    expect(logger.actionExecuted).toHaveBeenCalled();
                    expect(onEvent).toHaveBeenCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    it('supports scheduling with executeAt delay', function () { return __awaiter(void 0, void 0, void 0, function () {
        var setPositionSize, rules, context, start;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setPositionSize = jest.fn();
                    rules = [
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
                    context = { setPositionSize: setPositionSize };
                    start = Date.now();
                    return [4 /*yield*/, evaluateAndExecuteRules(rules, { a: 1 }, context)];
                case 1:
                    _a.sent();
                    expect(setPositionSize).toHaveBeenCalledWith(2);
                    expect(Date.now() - start).toBeGreaterThanOrEqual(100);
                    return [2 /*return*/];
            }
        });
    }); });
    it('handles rule prioritization', function () { return __awaiter(void 0, void 0, void 0, function () {
        var setPositionSize, notify, rules, context;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setPositionSize = jest.fn();
                    notify = jest.fn();
                    rules = [
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
                    context = { setPositionSize: setPositionSize, notify: notify };
                    return [4 /*yield*/, evaluateAndExecuteRules(rules, { a: 1 }, context)];
                case 1:
                    _a.sent();
                    // Expect the action from the high priority rule to be called last (or have the final effect)
                    expect(setPositionSize).toHaveBeenCalledTimes(2);
                    expect(setPositionSize).toHaveBeenLastCalledWith(2);
                    return [2 /*return*/];
            }
        });
    }); });
    it('respects rule dependencies', function () { return __awaiter(void 0, void 0, void 0, function () {
        var setPositionSize, notify, rules, context;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setPositionSize = jest.fn();
                    notify = jest.fn();
                    rules = [
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
                    context = { setPositionSize: setPositionSize, notify: notify };
                    return [4 /*yield*/, evaluateAndExecuteRules(rules, { a: 1 }, context)];
                case 1:
                    _a.sent();
                    // Expect r1 to be evaluated and its action called, then r2 evaluated and its action called
                    expect(notify).toHaveBeenCalledWith('Dependency met');
                    expect(setPositionSize).toHaveBeenCalledWith(10);
                    return [2 /*return*/];
            }
        });
    }); });
    it('handles errors during condition evaluation', function () { return __awaiter(void 0, void 0, void 0, function () {
        var rules, context, logger, onEvent, hooks;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    rules = [
                        {
                            id: 'r1',
                            name: 'Error Condition Rule',
                            description: '',
                            type: 'throttle',
                            enabled: true,
                            // This condition should ideally throw, e.g., invalid operator or missing required field handled incorrectly
                            // For this test, we'll simulate an error during evaluation
                            conditions: { field: 'a', operator: 'invalid', value: 1 },
                            actions: [{ type: 'notify', parameters: { message: 'Should not be called' } }],
                            metadata: { version: '1', createdBy: '', createdAt: '' },
                        },
                    ];
                    context = { a: 1, notify: jest.fn() };
                    logger = { ruleMatched: jest.fn(), actionExecuted: jest.fn(), error: jest.fn() };
                    onEvent = jest.fn();
                    hooks = { onEvent: onEvent, logger: logger };
                    return [4 /*yield*/, expect(evaluateAndExecuteRules(rules, { a: 1 }, context, hooks)).rejects.toThrow()];
                case 1:
                    _a.sent();
                    expect(logger.error).toHaveBeenCalled();
                    expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
                    expect(context.notify).not.toHaveBeenCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    it('handles errors during action execution', function () { return __awaiter(void 0, void 0, void 0, function () {
        var rules, context, logger, onEvent, hooks;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    rules = [
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
                    context = { a: 1, setPositionSize: jest.fn() };
                    logger = { ruleMatched: jest.fn(), actionExecuted: jest.fn(), error: jest.fn() };
                    onEvent = jest.fn();
                    hooks = { onEvent: onEvent, logger: logger };
                    return [4 /*yield*/, expect(evaluateAndExecuteRules(rules, { a: 1 }, context, hooks)).rejects.toThrow()];
                case 1:
                    _a.sent();
                    expect(logger.ruleMatched).toHaveBeenCalled(); // Rule matched before action error
                    expect(logger.error).toHaveBeenCalled();
                    expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
                    expect(context.setPositionSize).not.toHaveBeenCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    it('handles rules with no actions gracefully', function () { return __awaiter(void 0, void 0, void 0, function () {
        var rules, context, logger, onEvent, hooks;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    rules = [
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
                    context = { a: 1, notify: jest.fn(), setPositionSize: jest.fn() };
                    logger = { ruleMatched: jest.fn(), actionExecuted: jest.fn(), error: jest.fn() };
                    onEvent = jest.fn();
                    hooks = { onEvent: onEvent, logger: logger };
                    return [4 /*yield*/, expect(evaluateAndExecuteRules(rules, { a: 1 }, context, hooks)).resolves.toBeUndefined()];
                case 1:
                    _a.sent();
                    expect(logger.ruleMatched).toHaveBeenCalled();
                    expect(logger.actionExecuted).not.toHaveBeenCalled();
                    expect(logger.error).not.toHaveBeenCalled();
                    expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'ruleMatched' }));
                    expect(onEvent).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
                    return [2 /*return*/];
            }
        });
    }); });
    it('handles an empty rules array gracefully', function () { return __awaiter(void 0, void 0, void 0, function () {
        var setPositionSize, notify, rules, context, logger, onEvent, hooks;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setPositionSize = jest.fn();
                    notify = jest.fn();
                    rules = [];
                    context = { a: 1, setPositionSize: setPositionSize, notify: notify };
                    logger = { ruleMatched: jest.fn(), actionExecuted: jest.fn(), error: jest.fn() };
                    onEvent = jest.fn();
                    hooks = { onEvent: onEvent, logger: logger };
                    return [4 /*yield*/, expect(evaluateAndExecuteRules(rules, { a: 1 }, context, hooks)).resolves.toBeUndefined()];
                case 1:
                    _a.sent();
                    expect(logger.ruleMatched).not.toHaveBeenCalled();
                    expect(logger.actionExecuted).not.toHaveBeenCalled();
                    expect(logger.error).not.toHaveBeenCalled();
                    expect(onEvent).not.toHaveBeenCalled();
                    return [2 /*return*/];
            }
        });
    }); });
    it('does not evaluate or execute disabled rules', function () { return __awaiter(void 0, void 0, void 0, function () {
        var setPositionSize, notify, rules, context, logger, onEvent, hooks;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setPositionSize = jest.fn();
                    notify = jest.fn();
                    rules = [
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
                    context = { a: 1, setPositionSize: setPositionSize, notify: notify };
                    logger = { ruleMatched: jest.fn(), actionExecuted: jest.fn(), error: jest.fn() };
                    onEvent = jest.fn();
                    hooks = { onEvent: onEvent, logger: logger };
                    return [4 /*yield*/, expect(evaluateAndExecuteRules(rules, { a: 1 }, context, hooks)).resolves.toBeUndefined()];
                case 1:
                    _a.sent();
                    expect(logger.ruleMatched).not.toHaveBeenCalled();
                    expect(logger.actionExecuted).not.toHaveBeenCalled();
                    expect(logger.error).not.toHaveBeenCalled();
                    expect(onEvent).not.toHaveBeenCalled();
                    expect(setPositionSize).not.toHaveBeenCalled();
                    return [2 /*return*/];
            }
        });
    }); });
});
