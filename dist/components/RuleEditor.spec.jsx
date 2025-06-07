var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RuleEditor from './RuleEditor';
var mockInitialRule = {
    id: 'test-rule-1',
    name: 'Test Rule Name',
    description: 'Test Rule Description',
    type: 'throttle',
    enabled: true,
    conditions: {
        and: [
            { field: 'price', operator: '>', value: 100 },
            { field: 'volume', operator: '<', value: 1000 },
        ],
    },
    actions: [
        { type: 'notify', parameters: { message: 'Test notification' } },
    ],
    metadata: {
        version: '1.0',
        createdBy: 'testUser',
        createdAt: new Date().toISOString(),
    },
};
describe('RuleEditor Component', function () {
    test('renders with initial rule and displays basic properties', function () {
        render(<RuleEditor initialRule={mockInitialRule}/>);
        expect(screen.getByLabelText(/Name/i)).toHaveValue(mockInitialRule.name);
        expect(screen.getByLabelText(/Description/i)).toHaveValue(mockInitialRule.description);
        expect(screen.getByLabelText(/Type/i)).toHaveValue(mockInitialRule.type);
        expect(screen.getByLabelText(/Enabled/i)).toBeChecked();
    });
    test('calls onChange when a basic rule property is changed (e.g., name)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var handleChange, nameInput;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    handleChange = jest.fn();
                    render(<RuleEditor initialRule={mockInitialRule} onChange={handleChange}/>);
                    nameInput = screen.getByLabelText(/Name/i);
                    fireEvent.change(nameInput, { target: { value: 'New Rule Name' } });
                    return [4 /*yield*/, waitFor(function () {
                            expect(handleChange).toHaveBeenCalledTimes(1);
                            expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Rule Name' }));
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('changes condition type from AND to OR', function () { return __awaiter(void 0, void 0, void 0, function () {
        var handleChange, conditionTypeSelect;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    handleChange = jest.fn();
                    render(<RuleEditor initialRule={mockInitialRule} onChange={handleChange}/>);
                    expect(screen.getByDisplayValue(/All \(AND\)/i)).toBeInTheDocument();
                    conditionTypeSelect = screen.getByRole('combobox');
                    fireEvent.change(conditionTypeSelect, { target: { value: 'or' } });
                    return [4 /*yield*/, waitFor(function () {
                            var _a;
                            expect(handleChange).toHaveBeenCalled();
                            var updatedRule = handleChange.mock.calls[handleChange.mock.calls.length - 1][0];
                            expect(updatedRule.conditions).toBeDefined();
                            if (updatedRule.conditions && 'or' in updatedRule.conditions) {
                                expect(updatedRule.conditions.or).toBeDefined();
                                var mockAndConditions = mockInitialRule.conditions.and;
                                expect((_a = updatedRule.conditions.or) === null || _a === void 0 ? void 0 : _a.length).toBe(mockAndConditions === null || mockAndConditions === void 0 ? void 0 : mockAndConditions.length);
                            }
                            expect(screen.getByDisplayValue(/Any \(OR\)/i)).toBeInTheDocument();
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('adds a new simple condition', function () { return __awaiter(void 0, void 0, void 0, function () {
        var handleChange, initialConditionsCount, addConditionButton;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    handleChange = jest.fn();
                    render(<RuleEditor initialRule={mockInitialRule} onChange={handleChange}/>);
                    initialConditionsCount = 0;
                    if (mockInitialRule.conditions && 'and' in mockInitialRule.conditions && mockInitialRule.conditions.and) {
                        initialConditionsCount = mockInitialRule.conditions.and.length;
                    }
                    addConditionButton = screen.getByText(/\+ Add Condition/i);
                    fireEvent.click(addConditionButton);
                    return [4 /*yield*/, waitFor(function () {
                            expect(handleChange).toHaveBeenCalled();
                            var updatedRule = handleChange.mock.calls[handleChange.mock.calls.length - 1][0];
                            if (updatedRule.conditions && 'and' in updatedRule.conditions && updatedRule.conditions.and) {
                                expect(updatedRule.conditions.and.length).toBe(initialConditionsCount + 1);
                            }
                            var newConditionInputs = screen.getAllByPlaceholderText(/Field \(e.g., context.trade.symbol\)/i);
                            expect(newConditionInputs.length).toBe(initialConditionsCount + 1);
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('removes a simple condition', function () { return __awaiter(void 0, void 0, void 0, function () {
        var handleChange, ruleWithMultipleConditions, initialConditionsCount, removeButtons;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    handleChange = jest.fn();
                    ruleWithMultipleConditions = __assign(__assign({}, mockInitialRule), { conditions: {
                            and: [
                                { field: 'price', operator: '>', value: 100 },
                                { field: 'volume', operator: '<', value: 1000 },
                            ],
                        } });
                    render(<RuleEditor initialRule={ruleWithMultipleConditions} onChange={handleChange}/>);
                    initialConditionsCount = ((_a = ruleWithMultipleConditions.conditions.and) === null || _a === void 0 ? void 0 : _a.length) || 0;
                    expect(initialConditionsCount).toBeGreaterThan(1);
                    removeButtons = screen.getAllByTitle(/Remove condition/i);
                    fireEvent.click(removeButtons[0]);
                    return [4 /*yield*/, waitFor(function () {
                            expect(handleChange).toHaveBeenCalled();
                            var updatedRule = handleChange.mock.calls[handleChange.mock.calls.length - 1][0];
                            if (updatedRule.conditions && 'and' in updatedRule.conditions && updatedRule.conditions.and) {
                                expect(updatedRule.conditions.and.length).toBe(initialConditionsCount - 1);
                            }
                        })];
                case 1:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('changes a simple condition field (e.g., field name)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var handleChange, conditionFieldInputs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    handleChange = jest.fn();
                    render(<RuleEditor initialRule={mockInitialRule} onChange={handleChange}/>);
                    conditionFieldInputs = screen.getAllByPlaceholderText(/Field \(e.g., context.trade.symbol\)/i);
                    fireEvent.change(conditionFieldInputs[0], { target: { value: 'newFieldName' } });
                    return [4 /*yield*/, waitFor(function () {
                            expect(handleChange).toHaveBeenCalled();
                            var updatedRule = handleChange.mock.calls[handleChange.mock.calls.length - 1][0];
                            if (updatedRule.conditions && 'and' in updatedRule.conditions && updatedRule.conditions.and && updatedRule.conditions.and[0]) {
                                expect(updatedRule.conditions.and[0].field).toBe('newFieldName');
                            }
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('adds a new action', function () { return __awaiter(void 0, void 0, void 0, function () {
        var handleChange, initialActionsCount, addActionButton;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    handleChange = jest.fn();
                    render(<RuleEditor initialRule={mockInitialRule} onChange={handleChange}/>);
                    initialActionsCount = mockInitialRule.actions.length;
                    addActionButton = screen.getByText(/Add Action/i);
                    fireEvent.click(addActionButton);
                    return [4 /*yield*/, waitFor(function () {
                            expect(handleChange).toHaveBeenCalled(); // RuleEditor internal state for actions might not always trigger top-level onChange immediately
                            var updatedRule = handleChange.mock.calls[handleChange.mock.calls.length - 1][0];
                            expect(updatedRule.actions.length).toBe(initialActionsCount + 1);
                            // Check for new action fields (e.g., a select with placeholder)
                            expect(screen.getAllByDisplayValue(/Select Action/i).length).toBeGreaterThanOrEqual(1);
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('removes an action', function () { return __awaiter(void 0, void 0, void 0, function () {
        var handleChange, initialActionsCount, removeActionButtons;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    handleChange = jest.fn();
                    render(<RuleEditor initialRule={mockInitialRule} onChange={handleChange}/>);
                    initialActionsCount = mockInitialRule.actions.length;
                    expect(initialActionsCount).toBeGreaterThan(0);
                    removeActionButtons = screen.getAllByText(/Remove/i).filter(function (btn) { return btn.closest('.d-flex.gap-2.align-items-center.mb-1'); });
                    fireEvent.click(removeActionButtons[0]);
                    return [4 /*yield*/, waitFor(function () {
                            expect(handleChange).toHaveBeenCalled();
                            var updatedRule = handleChange.mock.calls[handleChange.mock.calls.length - 1][0];
                            expect(updatedRule.actions.length).toBe(initialActionsCount - 1);
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    test('changes an action type and parameters', function () { return __awaiter(void 0, void 0, void 0, function () {
        var handleChange, actionTypeSelects, parameterInputs, newParams;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    handleChange = jest.fn();
                    render(<RuleEditor initialRule={mockInitialRule} onChange={handleChange}/>);
                    actionTypeSelects = screen.getAllByDisplayValue(mockInitialRule.actions[0].type);
                    fireEvent.change(actionTypeSelects[0], { target: { value: 'log' } });
                    // Wait for the type change to propagate if necessary
                    return [4 /*yield*/, waitFor(function () {
                            expect(handleChange).toHaveBeenCalled();
                        })];
                case 1:
                    // Wait for the type change to propagate if necessary
                    _a.sent();
                    parameterInputs = screen.getAllByPlaceholderText(/Parameters \(JSON\)/i);
                    newParams = { level: 'info', detail: 'New log detail' };
                    fireEvent.change(parameterInputs[0], { target: { value: JSON.stringify(newParams) } });
                    return [4 /*yield*/, waitFor(function () {
                            expect(handleChange).toHaveBeenCalledTimes(2); // Once for type, once for params
                            var updatedRule = handleChange.mock.calls[handleChange.mock.calls.length - 1][0];
                            expect(updatedRule.actions[0].type).toBe('log');
                            expect(updatedRule.actions[0].parameters).toEqual(newParams);
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    // TODO: Add more tests for edge cases, validation, different operators, etc.
});
