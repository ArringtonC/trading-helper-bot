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
import { executeAction } from '../actionExecutor';
describe('ActionExecutor', function () {
    var consoleErrorSpy;
    beforeEach(function () {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(function () { });
    });
    afterEach(function () {
        consoleErrorSpy.mockRestore();
    });
    it('reduces position size correctly (reducePositionSize)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var setPositionSize, context, action;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setPositionSize = jest.fn();
                    context = {
                        currentPositionSize: 100,
                        setPositionSize: setPositionSize,
                    };
                    action = {
                        type: 'reducePositionSize',
                        parameters: { byPercent: 20 },
                    };
                    return [4 /*yield*/, executeAction(action, context)];
                case 1:
                    _a.sent();
                    expect(setPositionSize).toHaveBeenCalledWith(80);
                    return [2 /*return*/];
            }
        });
    }); });
    it('sets position size correctly (setPositionSize)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var setPositionSize, context, action;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setPositionSize = jest.fn();
                    context = { setPositionSize: setPositionSize };
                    action = {
                        type: 'setPositionSize',
                        parameters: { toPercent: 2 },
                    };
                    return [4 /*yield*/, executeAction(action, context)];
                case 1:
                    _a.sent();
                    expect(setPositionSize).toHaveBeenCalledWith(2);
                    return [2 /*return*/];
            }
        });
    }); });
    it('calls notify with correct message (notify)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var notify, context, action;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    notify = jest.fn();
                    context = { notify: notify };
                    action = {
                        type: 'notify',
                        parameters: { message: 'Test message' },
                    };
                    return [4 /*yield*/, executeAction(action, context)];
                case 1:
                    _a.sent();
                    expect(notify).toHaveBeenCalledWith('Test message');
                    return [2 /*return*/];
            }
        });
    }); });
    it('throws error for missing parameters (reducePositionSize)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var setPositionSize, context, action;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setPositionSize = jest.fn();
                    context = { currentPositionSize: 100, setPositionSize: setPositionSize };
                    action = {
                        type: 'reducePositionSize',
                        parameters: {},
                    };
                    return [4 /*yield*/, expect(executeAction(action, context)).rejects.toThrow('Invalid parameters or context for reducePositionSize')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('throws error for missing context functions (reducePositionSize)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var context, action;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    context = { currentPositionSize: 100 };
                    action = {
                        type: 'reducePositionSize',
                        parameters: { byPercent: 20 },
                    };
                    return [4 /*yield*/, expect(executeAction(action, context)).rejects.toThrow('Invalid parameters or context for reducePositionSize')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('throws error for missing parameters (setPositionSize)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var setPositionSize, context, action;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setPositionSize = jest.fn();
                    context = { setPositionSize: setPositionSize };
                    action = {
                        type: 'setPositionSize',
                        parameters: {},
                    };
                    return [4 /*yield*/, expect(executeAction(action, context)).rejects.toThrow('Invalid parameters or context for setPositionSize')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('throws error for missing context functions (setPositionSize)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var context, action;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    context = {};
                    action = {
                        type: 'setPositionSize',
                        parameters: { toPercent: 2 },
                    };
                    return [4 /*yield*/, expect(executeAction(action, context)).rejects.toThrow('Invalid parameters or context for setPositionSize')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('throws error for missing parameters (notify)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var notify, context, action;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    notify = jest.fn();
                    context = { notify: notify };
                    action = {
                        type: 'notify',
                        parameters: {},
                    };
                    return [4 /*yield*/, expect(executeAction(action, context)).rejects.toThrow('Invalid parameters or context for notify')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('throws error for missing context functions (notify)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var context, action;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    context = {};
                    action = {
                        type: 'notify',
                        parameters: { message: 'test' },
                    };
                    return [4 /*yield*/, expect(executeAction(action, context)).rejects.toThrow('Invalid parameters or context for notify')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('throws error for unsupported action type', function () { return __awaiter(void 0, void 0, void 0, function () {
        var context, action;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    context = {};
                    action = {
                        type: 'unsupported',
                        parameters: {},
                    };
                    return [4 /*yield*/, expect(executeAction(action, context)).rejects.toThrow('Unsupported action type: unsupported')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('throws error for incorrect parameter type (setPositionSize)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var setPositionSize, context, action;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setPositionSize = jest.fn();
                    context = { setPositionSize: setPositionSize };
                    action = {
                        type: 'setPositionSize',
                        parameters: { toPercent: 'two' }, // Incorrect type
                    };
                    return [4 /*yield*/, expect(executeAction(action, context)).rejects.toThrow('Invalid parameters or context for setPositionSize')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('propagates errors thrown by context.setPositionSize', function () { return __awaiter(void 0, void 0, void 0, function () {
        var setPositionSize, context, action;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setPositionSize = jest.fn(function () { throw new Error('Handler failed'); });
                    context = { setPositionSize: setPositionSize };
                    action = {
                        type: 'setPositionSize',
                        parameters: { toPercent: 2 },
                    };
                    return [4 /*yield*/, expect(executeAction(action, context)).rejects.toThrow('Handler failed')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('supports async context functions (setPositionSize)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var setPositionSize, context, action;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setPositionSize = jest.fn().mockResolvedValue(undefined);
                    context = { setPositionSize: setPositionSize };
                    action = {
                        type: 'setPositionSize',
                        parameters: { toPercent: 2 },
                    };
                    return [4 /*yield*/, expect(executeAction(action, context)).resolves.toBeUndefined()];
                case 1:
                    _a.sent();
                    expect(setPositionSize).toHaveBeenCalledWith(2);
                    return [2 /*return*/];
            }
        });
    }); });
    it('propagates errors thrown by context.notify', function () { return __awaiter(void 0, void 0, void 0, function () {
        var notify, context, action;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    notify = jest.fn(function () { throw new Error('Notify failed'); });
                    context = { notify: notify };
                    action = {
                        type: 'notify',
                        parameters: { message: 'Test' },
                    };
                    return [4 /*yield*/, expect(executeAction(action, context)).rejects.toThrow('Notify failed')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('supports async context functions (notify)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var notify, context, action;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    notify = jest.fn().mockResolvedValue(undefined);
                    context = { notify: notify };
                    action = {
                        type: 'notify',
                        parameters: { message: 'Test' },
                    };
                    return [4 /*yield*/, expect(executeAction(action, context)).resolves.toBeUndefined()];
                case 1:
                    _a.sent();
                    expect(notify).toHaveBeenCalledWith('Test');
                    return [2 /*return*/];
            }
        });
    }); });
    it('propagates errors thrown by context.setPositionSize in reducePositionSize', function () { return __awaiter(void 0, void 0, void 0, function () {
        var setPositionSize, context, action;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setPositionSize = jest.fn(function () { throw new Error('Reduce failed'); });
                    context = { currentPositionSize: 100, setPositionSize: setPositionSize };
                    action = {
                        type: 'reducePositionSize',
                        parameters: { byPercent: 10 },
                    };
                    return [4 /*yield*/, expect(executeAction(action, context)).rejects.toThrow('Reduce failed')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('supports async context functions (reducePositionSize)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var setPositionSize, context, action;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setPositionSize = jest.fn().mockResolvedValue(undefined);
                    context = { currentPositionSize: 100, setPositionSize: setPositionSize };
                    action = {
                        type: 'reducePositionSize',
                        parameters: { byPercent: 10 },
                    };
                    return [4 /*yield*/, expect(executeAction(action, context)).resolves.toBeUndefined()];
                case 1:
                    _a.sent();
                    expect(setPositionSize).toHaveBeenCalledWith(90);
                    return [2 /*return*/];
            }
        });
    }); });
    it('logs message for log action', function () { return __awaiter(void 0, void 0, void 0, function () {
        var context, action, consoleSpy;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    context = {};
                    action = {
                        type: 'log',
                        parameters: { message: 'Log this message' },
                    };
                    consoleSpy = jest.spyOn(console, 'log').mockImplementation(function () { });
                    return [4 /*yield*/, executeAction(action, context)];
                case 1:
                    _a.sent();
                    expect(consoleSpy).toHaveBeenCalledWith('[ActionExecutor][LOG]: Log this message');
                    consoleSpy.mockRestore();
                    return [2 /*return*/];
            }
        });
    }); });
    it('throws error for missing message in log action', function () { return __awaiter(void 0, void 0, void 0, function () {
        var context, action;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    context = {};
                    action = {
                        type: 'log',
                        parameters: {},
                    };
                    return [4 /*yield*/, expect(executeAction(action, context)).rejects.toThrow('Invalid parameters for log action')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('alerts message for alert action', function () { return __awaiter(void 0, void 0, void 0, function () {
        var context, action, consoleSpy;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    context = {};
                    action = {
                        type: 'alert',
                        parameters: { message: 'Alert this message' },
                    };
                    consoleSpy = jest.spyOn(console, 'log').mockImplementation(function () { });
                    return [4 /*yield*/, executeAction(action, context)];
                case 1:
                    _a.sent();
                    expect(consoleSpy).toHaveBeenCalledWith('[ActionExecutor][ALERT]: Alert this message');
                    consoleSpy.mockRestore();
                    return [2 /*return*/];
            }
        });
    }); });
    it('throws error for missing message in alert action', function () { return __awaiter(void 0, void 0, void 0, function () {
        var context, action;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    context = {};
                    action = {
                        type: 'alert',
                        parameters: {},
                    };
                    return [4 /*yield*/, expect(executeAction(action, context)).rejects.toThrow('Invalid parameters for alert action')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    // TODO: Add async action, edge case, and error propagation tests
});
