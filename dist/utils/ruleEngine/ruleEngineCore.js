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
import { evaluateCondition } from './conditionEvaluator';
import { executeAction } from './actionExecutor';
/**
 * Evaluates a list of rules against input data and executes actions for matching rules.
 * Supports async actions, event emitters, scheduling, and logging hooks.
 */
export function evaluateAndExecuteRules(rules, data, context, opts) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, rules_1, rule, _loop_1, _a, _b, action, err_1;
        var _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        return __generator(this, function (_p) {
            switch (_p.label) {
                case 0:
                    _i = 0, rules_1 = rules;
                    _p.label = 1;
                case 1:
                    if (!(_i < rules_1.length)) return [3 /*break*/, 10];
                    rule = rules_1[_i];
                    _p.label = 2;
                case 2:
                    _p.trys.push([2, 8, , 9]);
                    if (!evaluateCondition(rule.conditions, data)) return [3 /*break*/, 7];
                    (_d = (_c = opts === null || opts === void 0 ? void 0 : opts.logger) === null || _c === void 0 ? void 0 : _c.ruleMatched) === null || _d === void 0 ? void 0 : _d.call(_c, rule, data);
                    _loop_1 = function (action) {
                        var delay, execAt;
                        return __generator(this, function (_q) {
                            switch (_q.label) {
                                case 0:
                                    delay = 0;
                                    execAt = action.executeAt;
                                    if (typeof execAt === 'number') {
                                        delay = execAt;
                                    }
                                    else if (execAt instanceof Date) {
                                        delay = execAt.getTime() - Date.now();
                                    }
                                    if (!(delay > 0)) return [3 /*break*/, 2];
                                    (_f = (_e = opts === null || opts === void 0 ? void 0 : opts.logger) === null || _e === void 0 ? void 0 : _e.info) === null || _f === void 0 ? void 0 : _f.call(_e, "Delaying action execution by ".concat(delay, "ms"), { action: action, rule: rule });
                                    return [4 /*yield*/, new Promise(function (res) { return setTimeout(res, delay); })];
                                case 1:
                                    _q.sent();
                                    _q.label = 2;
                                case 2: return [4 /*yield*/, executeAction(action, context)];
                                case 3:
                                    _q.sent();
                                    (_h = (_g = opts === null || opts === void 0 ? void 0 : opts.logger) === null || _g === void 0 ? void 0 : _g.actionExecuted) === null || _h === void 0 ? void 0 : _h.call(_g, action, rule, data);
                                    (_j = opts === null || opts === void 0 ? void 0 : opts.onEvent) === null || _j === void 0 ? void 0 : _j.call(opts, { rule: rule, action: action, data: data, context: context });
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _a = 0, _b = rule.actions;
                    _p.label = 3;
                case 3:
                    if (!(_a < _b.length)) return [3 /*break*/, 6];
                    action = _b[_a];
                    return [5 /*yield**/, _loop_1(action)];
                case 4:
                    _p.sent();
                    _p.label = 5;
                case 5:
                    _a++;
                    return [3 /*break*/, 3];
                case 6:
                    (_l = (_k = opts === null || opts === void 0 ? void 0 : opts.logger) === null || _k === void 0 ? void 0 : _k.info) === null || _l === void 0 ? void 0 : _l.call(_k, "[RuleEngine] Rule matched and actions executed: ".concat(rule.id || rule.name));
                    _p.label = 7;
                case 7: return [3 /*break*/, 9];
                case 8:
                    err_1 = _p.sent();
                    (_o = (_m = opts === null || opts === void 0 ? void 0 : opts.logger) === null || _m === void 0 ? void 0 : _m.error) === null || _o === void 0 ? void 0 : _o.call(_m, "[RuleEngine] Error processing rule ".concat(rule.id || rule.name, ":"), err_1);
                    return [3 /*break*/, 9];
                case 9:
                    _i++;
                    return [3 /*break*/, 1];
                case 10: return [2 /*return*/];
            }
        });
    });
}
