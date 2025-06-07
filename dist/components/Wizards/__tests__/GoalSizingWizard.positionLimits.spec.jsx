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
import GoalSizingWizard from '../GoalSizingWizard'; // Adjusted import to include type
// Mock localStorage
var localStorageMock = (function () {
    var store = {};
    return {
        getItem: function (key) { return store[key] || null; },
        setItem: function (key, value) {
            store[key] = value.toString();
        },
        removeItem: function (key) {
            delete store[key];
        },
        clear: function () {
            store = {};
        },
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
// Mock the sizingSolvers module
jest.mock('../../../utils/sizingSolvers', function () { return ({
    solveFixedFractionalF: jest.fn(function () { return null; }),
    calculateKellyFraction: jest.fn(function () { return null; }),
}); });
var mockOnComplete = jest.fn();
var mockOnClose = jest.fn();
var renderWizard = function (initialConfig, isFirstTimeUser) {
    if (isFirstTimeUser === void 0) { isFirstTimeUser = false; }
    // Ensure a minimal valid config if initialConfig is provided but incomplete
    var baseConfig = {
        goalType: null,
        goalParameters: {},
        sizingRules: {},
        capitalObjectiveParameters: {},
        tradeStatistics: {}
    };
    var configToUse = initialConfig
        ? __assign(__assign({}, baseConfig), initialConfig) : baseConfig;
    return render(<GoalSizingWizard isOpen={true} onClose={mockOnClose} onComplete={mockOnComplete} initialConfig={configToUse} isFirstTimeUser={isFirstTimeUser}/>);
};
describe('GoalSizingWizard - Position Limit Suggestions', function () {
    beforeEach(function () {
        localStorageMock.clear();
        mockOnComplete.mockClear();
        mockOnClose.mockClear();
        jest.clearAllMocks(); // Clears mock call history and implementations
    });
    test('should suggest 5% Max Position Size and 50% Max Total Exposure for "Maximize Growth" with default moderate risk', function () { return __awaiter(void 0, void 0, void 0, function () {
        var growthRadio, nextButtonStep1, targetAnnualReturnInput, nextButtonStep4, maxPositionSizeInput, maxTotalExposureInput;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    renderWizard(undefined, false); // isFirstTimeUser = false means no intro screen
                    growthRadio = screen.getByRole('radio', { name: /Maximize Growth/i });
                    fireEvent.click(growthRadio);
                    // Wait for the internal state to update reflecting the choice.
                    return [4 /*yield*/, waitFor(function () {
                            expect(growthRadio).toBeChecked();
                        })];
                case 1:
                    // Wait for the internal state to update reflecting the choice.
                    _a.sent();
                    nextButtonStep1 = screen.getByRole('button', { name: /Next/i });
                    fireEvent.click(nextButtonStep1);
                    // Step 4: Set Goal Parameters (for Growth goal type)
                    // This step is where risk tolerance is typically set. For "Maximize Growth",
                    // it defaults to "moderate". The suggestions are applied via useEffect.
                    // We need to ensure this step is loaded before proceeding.
                    return [4 /*yield*/, screen.findByText(/Set Goal Parameters/i)];
                case 2:
                    // Step 4: Set Goal Parameters (for Growth goal type)
                    // This step is where risk tolerance is typically set. For "Maximize Growth",
                    // it defaults to "moderate". The suggestions are applied via useEffect.
                    // We need to ensure this step is loaded before proceeding.
                    _a.sent(); // Wait for header of this step
                    targetAnnualReturnInput = screen.getByLabelText(/Target Annual Return/i);
                    fireEvent.change(targetAnnualReturnInput, { target: { value: '15' } }); // Provide a valid value
                    return [4 /*yield*/, waitFor(function () { return expect(targetAnnualReturnInput).toHaveValue(15); })];
                case 3:
                    _a.sent();
                    nextButtonStep4 = screen.getByRole('button', { name: /Next/i });
                    fireEvent.click(nextButtonStep4);
                    // Step 5: Configure Sizing Rules
                    // This is where the position limit inputs are displayed.
                    return [4 /*yield*/, screen.findByText(/Configure Sizing Rules/i)];
                case 4:
                    // Step 5: Configure Sizing Rules
                    // This is where the position limit inputs are displayed.
                    _a.sent(); // Wait for header of this step
                    maxPositionSizeInput = screen.getByLabelText(/Maximum Position Size \(% of Account\)/i);
                    expect(maxPositionSizeInput).toHaveValue(5);
                    maxTotalExposureInput = screen.getByLabelText(/Maximum Total Exposure \(% of Account\)/i);
                    expect(maxTotalExposureInput).toHaveValue(50);
                    return [2 /*return*/];
            }
        });
    }); });
    test('should suggest 2% Max Position Size and 20% Max Total Exposure for "Maximize Growth" with "Conservative" risk', function () { return __awaiter(void 0, void 0, void 0, function () {
        var growthRadio, nextButton, targetAnnualReturnInput, riskToleranceSelect, maxPositionSizeInput, maxTotalExposureInput;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    renderWizard(undefined, false);
                    growthRadio = screen.getByRole('radio', { name: /Maximize Growth/i });
                    fireEvent.click(growthRadio);
                    return [4 /*yield*/, waitFor(function () { return expect(growthRadio).toBeChecked(); })];
                case 1:
                    _a.sent();
                    nextButton = screen.getByRole('button', { name: /Next/i });
                    fireEvent.click(nextButton);
                    // Step 4: Set Goal Parameters (for Growth goal type)
                    return [4 /*yield*/, screen.findByText(/Set Goal Parameters/i)];
                case 2:
                    // Step 4: Set Goal Parameters (for Growth goal type)
                    _a.sent();
                    targetAnnualReturnInput = screen.getByLabelText(/Target Annual Return/i);
                    fireEvent.change(targetAnnualReturnInput, { target: { value: '15' } }); // Provide a valid value
                    return [4 /*yield*/, waitFor(function () { return expect(targetAnnualReturnInput).toHaveValue(15); })];
                case 3:
                    _a.sent();
                    riskToleranceSelect = screen.getByLabelText(/Risk Tolerance Level/i);
                    fireEvent.change(riskToleranceSelect, { target: { value: 'conservative' } });
                    return [4 /*yield*/, waitFor(function () { return expect(riskToleranceSelect).toHaveValue('conservative'); })];
                case 4:
                    _a.sent();
                    nextButton = screen.getByRole('button', { name: /Next/i }); // Re-fetch if needed, or ensure it's the same instance
                    fireEvent.click(nextButton);
                    // Step 5: Configure Sizing Rules
                    return [4 /*yield*/, screen.findByText(/Configure Sizing Rules/i)];
                case 5:
                    // Step 5: Configure Sizing Rules
                    _a.sent();
                    maxPositionSizeInput = screen.getByLabelText(/Maximum Position Size \(% of Account\)/i);
                    expect(maxPositionSizeInput).toHaveValue(2);
                    maxTotalExposureInput = screen.getByLabelText(/Maximum Total Exposure \(% of Account\)/i);
                    expect(maxTotalExposureInput).toHaveValue(20);
                    return [2 /*return*/];
            }
        });
    }); });
    test('should suggest 10% Max Position Size and 60% Max Total Exposure for "Maximize Growth" with "Aggressive" risk', function () { return __awaiter(void 0, void 0, void 0, function () {
        var growthRadio, nextButton, targetAnnualReturnInput, riskToleranceSelect, maxPositionSizeInput, maxTotalExposureInput;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    renderWizard(undefined, false);
                    growthRadio = screen.getByRole('radio', { name: /Maximize Growth/i });
                    fireEvent.click(growthRadio);
                    return [4 /*yield*/, waitFor(function () { return expect(growthRadio).toBeChecked(); })];
                case 1:
                    _a.sent();
                    nextButton = screen.getByRole('button', { name: /Next/i });
                    fireEvent.click(nextButton);
                    // Step 4: Set Goal Parameters (for Growth goal type)
                    return [4 /*yield*/, screen.findByText(/Set Goal Parameters/i)];
                case 2:
                    // Step 4: Set Goal Parameters (for Growth goal type)
                    _a.sent();
                    targetAnnualReturnInput = screen.getByLabelText(/Target Annual Return/i);
                    fireEvent.change(targetAnnualReturnInput, { target: { value: '15' } }); // Provide a valid value
                    return [4 /*yield*/, waitFor(function () { return expect(targetAnnualReturnInput).toHaveValue(15); })];
                case 3:
                    _a.sent();
                    riskToleranceSelect = screen.getByLabelText(/Risk Tolerance Level/i);
                    fireEvent.change(riskToleranceSelect, { target: { value: 'aggressive' } });
                    return [4 /*yield*/, waitFor(function () { return expect(riskToleranceSelect).toHaveValue('aggressive'); })];
                case 4:
                    _a.sent();
                    nextButton = screen.getByRole('button', { name: /Next/i });
                    fireEvent.click(nextButton);
                    // Step 5: Configure Sizing Rules
                    return [4 /*yield*/, screen.findByText(/Configure Sizing Rules/i)];
                case 5:
                    // Step 5: Configure Sizing Rules
                    _a.sent();
                    maxPositionSizeInput = screen.getByLabelText(/Maximum Position Size \(% of Account\)/i);
                    expect(maxPositionSizeInput).toHaveValue(10);
                    maxTotalExposureInput = screen.getByLabelText(/Maximum Total Exposure \(% of Account\)/i);
                    expect(maxTotalExposureInput).toHaveValue(60);
                    return [2 /*return*/];
            }
        });
    }); });
    test('should use default 5% Max Position Size and 5% Max Total Exposure for "Capital Objective" goal', function () { return __awaiter(void 0, void 0, void 0, function () {
        var capitalObjectiveRadio, nextButton, maxPositionSizeInput, maxTotalExposureInput;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    renderWizard(undefined, false);
                    capitalObjectiveRadio = screen.getByRole('radio', { name: /Achieve a Specific Capital Objective/i });
                    fireEvent.click(capitalObjectiveRadio);
                    return [4 /*yield*/, waitFor(function () { return expect(capitalObjectiveRadio).toBeChecked(); })];
                case 1:
                    _a.sent();
                    nextButton = screen.getByRole('button', { name: /Next/i });
                    fireEvent.click(nextButton); // To Step 2 (Capital Objective Params)
                    // Step 2: Define Your Capital Objective
                    return [4 /*yield*/, screen.findByText(/Define Your Capital Objective/i)];
                case 2:
                    // Step 2: Define Your Capital Objective
                    _a.sent();
                    // Fill in valid data to pass validation for Step 2
                    fireEvent.change(screen.getByLabelText(/Current Account Balance/i), { target: { value: '10000' } });
                    fireEvent.change(screen.getByLabelText(/Target Account Balance/i), { target: { value: '20000' } });
                    fireEvent.change(screen.getByLabelText(/Time Horizon \(Years\)/i), { target: { value: '1' } });
                    nextButton = screen.getByRole('button', { name: /Next/i });
                    fireEvent.click(nextButton); // To Step 3 (Trade Statistics)
                    // Step 3: Provide Your Typical Trade Statistics
                    return [4 /*yield*/, screen.findByText(/Provide Your Typical Trade Statistics/i)];
                case 3:
                    // Step 3: Provide Your Typical Trade Statistics
                    _a.sent();
                    // Fill in valid data for Step 3
                    fireEvent.change(screen.getByLabelText(/Estimated Win Rate/i), { target: { value: '0.55' } });
                    fireEvent.change(screen.getByLabelText(/Average Payoff Ratio/i), { target: { value: '1.5' } });
                    fireEvent.change(screen.getByLabelText(/Expected Number of Trades/i), { target: { value: '100' } });
                    nextButton = screen.getByRole('button', { name: /Next/i });
                    fireEvent.click(nextButton); // To Step 5 (Configure Sizing Rules)
                    // Step 5: Configure Sizing Rules
                    return [4 /*yield*/, screen.findByText(/Configure Sizing Rules/i)];
                case 4:
                    // Step 5: Configure Sizing Rules
                    _a.sent();
                    maxPositionSizeInput = screen.getByLabelText(/Maximum Position Size \(% of Account\)/i);
                    // For Capital Objective, the specific radio button onChange sets these to 5% currently.
                    // The dynamic suggestions from riskTolerance (growth goal) should not apply.
                    expect(maxPositionSizeInput).toHaveValue(5);
                    maxTotalExposureInput = screen.getByLabelText(/Maximum Total Exposure \(% of Account\)/i);
                    expect(maxTotalExposureInput).toHaveValue(5);
                    return [2 /*return*/];
            }
        });
    }); });
    // Additional test cases will be added here for other scenarios:
    // - "Maximize Growth" with "Aggressive" risk
    // - "Capital Objective" goal (should not use these dynamic suggestions)
});
