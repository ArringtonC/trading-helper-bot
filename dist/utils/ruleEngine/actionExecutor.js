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
/**
 * Action handler map for extensibility and clarity.
 */
var actionHandlers = {
    reducePositionSize: function (action, context) {
        return __awaiter(this, void 0, void 0, function () {
            var byPercent, newSize;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        byPercent = action.parameters.byPercent;
                        if (typeof byPercent !== 'number' || !context.currentPositionSize || !context.setPositionSize) {
                            throw new Error('Invalid parameters or context for reducePositionSize');
                        }
                        newSize = context.currentPositionSize * (1 - byPercent / 100);
                        return [4 /*yield*/, context.setPositionSize(newSize)];
                    case 1:
                        _a.sent();
                        console.log("[ActionExecutor] Reduced position size by ".concat(byPercent, "%. New size: ").concat(newSize));
                        return [2 /*return*/];
                }
            });
        });
    },
    setPositionSize: function (action, context) {
        return __awaiter(this, void 0, void 0, function () {
            var toPercent;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        toPercent = (_a = action.parameters.toPercent) !== null && _a !== void 0 ? _a : action.parameters.size;
                        if (typeof toPercent !== 'number' || !context.setPositionSize) {
                            throw new Error('Invalid parameters or context for setPositionSize');
                        }
                        return [4 /*yield*/, context.setPositionSize(toPercent)];
                    case 1:
                        _b.sent();
                        console.log("[ActionExecutor] Set position size to ".concat(toPercent, "%"));
                        return [2 /*return*/];
                }
            });
        });
    },
    notify: function (action, context) {
        return __awaiter(this, void 0, void 0, function () {
            var message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        message = action.parameters.message;
                        if (typeof message !== 'string' || !context.notify) {
                            throw new Error('Invalid parameters or context for notify');
                        }
                        return [4 /*yield*/, context.notify(message)];
                    case 1:
                        _a.sent();
                        console.log("[ActionExecutor] Notification sent: ".concat(message));
                        return [2 /*return*/];
                }
            });
        });
    },
    log: function (action, context) {
        return __awaiter(this, void 0, void 0, function () {
            var message;
            return __generator(this, function (_a) {
                message = action.parameters.message;
                if (typeof message !== 'string') {
                    throw new Error('Invalid parameters for log action');
                }
                console.log("[ActionExecutor][LOG]: ".concat(message));
                return [2 /*return*/];
            });
        });
    },
    alert: function (action, context) {
        return __awaiter(this, void 0, void 0, function () {
            var message;
            return __generator(this, function (_a) {
                message = action.parameters.message;
                if (typeof message !== 'string') {
                    throw new Error('Invalid parameters for alert action');
                }
                // In a real app, this could trigger a UI alert or send to a notification system
                console.log("[ActionExecutor][ALERT]: ".concat(message));
                return [2 /*return*/];
            });
        });
    },
    // Add more handlers as needed
};
/**
 * Executes a rule action using the provided context.
 * Supports extensible action types via actionHandlers map.
 */
export function executeAction(action, context) {
    return __awaiter(this, void 0, void 0, function () {
        var handler, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    handler = actionHandlers[action.type];
                    if (!handler) {
                        throw new Error("Unsupported action type: ".concat(action.type));
                    }
                    return [4 /*yield*/, handler(action, context)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    err_1 = _a.sent();
                    console.error("[ActionExecutor] Error executing action:", err_1);
                    throw err_1; // Re-throw the error to propagate it
                case 3: return [2 /*return*/];
            }
        });
    });
}
