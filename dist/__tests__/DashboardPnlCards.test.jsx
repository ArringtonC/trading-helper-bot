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
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPnlCards from '../components/Dashboard/DashboardPnlCards';
import '@testing-library/jest-dom';
// Mock the DatabaseService
jest.mock('../services/DatabaseService', function () { return ({
    getAggregatePL: jest.fn(),
    getTradeCounts: jest.fn(),
    getClosedTrades: jest.fn(),
}); });
// Import the mocked functions
import { getAggregatePL, getTradeCounts, getClosedTrades } from '../services/DatabaseService';
describe('DashboardPnlCards', function () {
    // Cast the mocked functions for easier typing in tests
    var mockGetAggregatePL = getAggregatePL;
    var mockGetTradeCounts = getTradeCounts;
    var mockGetClosedTrades = getClosedTrades;
    beforeEach(function () {
        // Reset mocks before each test
        mockGetAggregatePL.mockReset();
        mockGetTradeCounts.mockReset();
        mockGetClosedTrades.mockReset();
        // Set default mock implementations to return empty/zero data
        mockGetAggregatePL.mockResolvedValue({ realizedPL: 0 });
        mockGetTradeCounts.mockResolvedValue({ open: 0, closed: 0 });
        mockGetClosedTrades.mockResolvedValue([]);
    });
    test('renders loading state initially', function () {
        // Prevent the promises from resolving immediately to see the loading state
        mockGetAggregatePL.mockReturnValue(new Promise(function () { }));
        mockGetTradeCounts.mockReturnValue(new Promise(function () { }));
        mockGetClosedTrades.mockReturnValue(new Promise(function () { }));
        render(<DashboardPnlCards />);
        // Check for the presence of loading indicators (assuming MetricCard uses animate-pulse or similar)
        var loadingIndicators = screen.getAllByRole('status'); // Assuming loading state sets role="status"
        expect(loadingIndicators.length).toBeGreaterThan(0);
        // Expect N/A or empty values for metrics initially
        expect(screen.queryByText('N/A')).toBeInTheDocument(); // MetricCard displays N/A for null/undefined values
    });
    test('renders correctly with zero data', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    render(<DashboardPnlCards />);
                    // Wait for data fetching to complete
                    return [4 /*yield*/, waitFor(function () { return expect(mockGetAggregatePL).toHaveBeenCalled(); })];
                case 1:
                    // Wait for data fetching to complete
                    _a.sent();
                    // Expect zero values or N/A for all metrics
                    expect(screen.getByText('0.00')).toBeInTheDocument(); // Realized P&L
                    expect(screen.getByText('0.0%')).toBeInTheDocument(); // Win Rate
                    expect(screen.getByText('0')).toBeInTheDocument(); // Open Trades
                    expect(screen.getByText('0')).toBeInTheDocument(); // Closed Trades
                    expect(screen.getByText('0.00')).toBeInTheDocument(); // Unrealized P&L (mock data)
                    return [2 /*return*/];
            }
        });
    }); });
    test('renders correctly with some data', function () { return __awaiter(void 0, void 0, void 0, function () {
        var expectedWinRate;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Provide mock data
                    mockGetAggregatePL.mockResolvedValue({ realizedPL: 150.75 });
                    mockGetTradeCounts.mockResolvedValue({ open: 5, closed: 10 });
                    mockGetClosedTrades.mockResolvedValue([
                        { id: '1', netAmount: 50 },
                        { id: '2', netAmount: -20 },
                        { id: '3', netAmount: 100 },
                        { id: '4', netAmount: -10 },
                        { id: '5', netAmount: 30 },
                        { id: '6', netAmount: 0 }, // Break-even
                        { id: '7', netAmount: 45 },
                        { id: '8', netAmount: -5 },
                        { id: '9', netAmount: 25 },
                        { id: '10', netAmount: 15 },
                    ]);
                    render(<DashboardPnlCards />);
                    return [4 /*yield*/, waitFor(function () { return expect(mockGetAggregatePL).toHaveBeenCalled(); })];
                case 1:
                    _a.sent();
                    expectedWinRate = (7 / 10) * 100;
                    // Assert displayed values
                    expect(screen.getByText('150.75')).toBeInTheDocument(); // Realized P&L
                    expect(screen.getByText(expectedWinRate.toFixed(1) + '%')).toBeInTheDocument(); // Win Rate (formatted)
                    expect(screen.getByText('5')).toBeInTheDocument(); // Open Trades
                    expect(screen.getByText('10')).toBeInTheDocument(); // Closed Trades
                    return [2 /*return*/];
            }
        });
    }); });
    test('renders correctly with all open trades', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockGetAggregatePL.mockResolvedValue({ realizedPL: 0 });
                    mockGetTradeCounts.mockResolvedValue({ open: 15, closed: 0 });
                    mockGetClosedTrades.mockResolvedValue([]);
                    render(<DashboardPnlCards />);
                    return [4 /*yield*/, waitFor(function () { return expect(mockGetTradeCounts).toHaveBeenCalled(); })];
                case 1:
                    _a.sent();
                    expect(screen.getByText('0.00')).toBeInTheDocument(); // Realized P&L
                    expect(screen.getByText('0.0%')).toBeInTheDocument(); // Win Rate
                    expect(screen.getByText('15')).toBeInTheDocument(); // Open Trades
                    expect(screen.getByText('0')).toBeInTheDocument(); // Closed Trades
                    return [2 /*return*/];
            }
        });
    }); });
    test('renders correctly with all winning closed trades', function () { return __awaiter(void 0, void 0, void 0, function () {
        var closedTrades, totalPL;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    closedTrades = [
                        { id: '1', netAmount: 50 },
                        { id: '2', netAmount: 20 },
                        { id: '3', netAmount: 100 },
                    ];
                    totalPL = closedTrades.reduce(function (sum, t) { return sum + t.netAmount; }, 0);
                    mockGetAggregatePL.mockResolvedValue({ realizedPL: totalPL });
                    mockGetTradeCounts.mockResolvedValue({ open: 0, closed: closedTrades.length });
                    mockGetClosedTrades.mockResolvedValue(closedTrades);
                    render(<DashboardPnlCards />);
                    return [4 /*yield*/, waitFor(function () { return expect(mockGetTradeCounts).toHaveBeenCalled(); })];
                case 1:
                    _a.sent();
                    expect(screen.getByText(totalPL.toFixed(2))).toBeInTheDocument(); // Realized P&L
                    expect(screen.getByText('100.0%')).toBeInTheDocument(); // Win Rate
                    expect(screen.getByText('0')).toBeInTheDocument(); // Open Trades
                    expect(screen.getByText(closedTrades.length.toString())).toBeInTheDocument(); // Closed Trades
                    return [2 /*return*/];
            }
        });
    }); });
    test('renders correctly with all losing closed trades', function () { return __awaiter(void 0, void 0, void 0, function () {
        var closedTrades, totalPL;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    closedTrades = [
                        { id: '1', netAmount: -50 },
                        { id: '2', netAmount: -20 },
                        { id: '3', netAmount: -100 },
                    ];
                    totalPL = closedTrades.reduce(function (sum, t) { return sum + t.netAmount; }, 0);
                    mockGetAggregatePL.mockResolvedValue({ realizedPL: totalPL });
                    mockGetTradeCounts.mockResolvedValue({ open: 0, closed: closedTrades.length });
                    mockGetClosedTrades.mockResolvedValue(closedTrades);
                    render(<DashboardPnlCards />);
                    return [4 /*yield*/, waitFor(function () { return expect(mockGetTradeCounts).toHaveBeenCalled(); })];
                case 1:
                    _a.sent();
                    expect(screen.getByText(totalPL.toFixed(2))).toBeInTheDocument(); // Realized P&L
                    expect(screen.getByText('0.0%')).toBeInTheDocument(); // Win Rate
                    expect(screen.getByText('0')).toBeInTheDocument(); // Open Trades
                    expect(screen.getByText(closedTrades.length.toString())).toBeInTheDocument(); // Closed Trades
                    return [2 /*return*/];
            }
        });
    }); });
    test('renders correctly with a single winning closed trade', function () { return __awaiter(void 0, void 0, void 0, function () {
        var closedTrades, totalPL;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    closedTrades = [
                        { id: '1', netAmount: 100 },
                    ];
                    totalPL = closedTrades.reduce(function (sum, t) { return sum + t.netAmount; }, 0);
                    mockGetAggregatePL.mockResolvedValue({ realizedPL: totalPL });
                    mockGetTradeCounts.mockResolvedValue({ open: 0, closed: closedTrades.length });
                    mockGetClosedTrades.mockResolvedValue(closedTrades);
                    render(<DashboardPnlCards />);
                    return [4 /*yield*/, waitFor(function () { return expect(mockGetTradeCounts).toHaveBeenCalled(); })];
                case 1:
                    _a.sent();
                    expect(screen.getByText(totalPL.toFixed(2))).toBeInTheDocument(); // Realized P&L
                    expect(screen.getByText('100.0%')).toBeInTheDocument(); // Win Rate
                    expect(screen.getByText('0')).toBeInTheDocument(); // Open Trades
                    expect(screen.getByText(closedTrades.length.toString())).toBeInTheDocument(); // Closed Trades
                    return [2 /*return*/];
            }
        });
    }); });
    test('renders correctly with a single losing closed trade', function () { return __awaiter(void 0, void 0, void 0, function () {
        var closedTrades, totalPL;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    closedTrades = [
                        { id: '1', netAmount: -50 },
                    ];
                    totalPL = closedTrades.reduce(function (sum, t) { return sum + t.netAmount; }, 0);
                    mockGetAggregatePL.mockResolvedValue({ realizedPL: totalPL });
                    mockGetTradeCounts.mockResolvedValue({ open: 0, closed: closedTrades.length });
                    mockGetClosedTrades.mockResolvedValue(closedTrades);
                    render(<DashboardPnlCards />);
                    return [4 /*yield*/, waitFor(function () { return expect(mockGetTradeCounts).toHaveBeenCalled(); })];
                case 1:
                    _a.sent();
                    expect(screen.getByText(totalPL.toFixed(2))).toBeInTheDocument(); // Realized P&L
                    expect(screen.getByText('0.0%')).toBeInTheDocument(); // Win Rate
                    expect(screen.getByText('0')).toBeInTheDocument(); // Open Trades
                    expect(screen.getByText(closedTrades.length.toString())).toBeInTheDocument(); // Closed Trades
                    return [2 /*return*/];
            }
        });
    }); });
    test('renders correctly with large numbers', function () { return __awaiter(void 0, void 0, void 0, function () {
        var largePL, largeOpen, largeClosed, closedTrades, calculatedLargePL, winningClosed, expectedWinRate;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    largePL = 1234567.89;
                    largeOpen = 1000;
                    largeClosed = 5000;
                    closedTrades = Array.from({ length: largeClosed }, function (_, i) { return ({ id: "".concat(i), netAmount: (i % 2 === 0 ? 100 : -50) + (i * 0.01) }); });
                    calculatedLargePL = closedTrades.reduce(function (sum, t) { return sum + t.netAmount; }, 0);
                    mockGetAggregatePL.mockResolvedValue({ realizedPL: calculatedLargePL });
                    mockGetTradeCounts.mockResolvedValue({ open: largeOpen, closed: largeClosed });
                    mockGetClosedTrades.mockResolvedValue(closedTrades);
                    render(<DashboardPnlCards />);
                    return [4 /*yield*/, waitFor(function () { return expect(mockGetTradeCounts).toHaveBeenCalled(); })];
                case 1:
                    _a.sent();
                    winningClosed = closedTrades.filter(function (t) { return t.netAmount > 0; }).length;
                    expectedWinRate = (winningClosed / largeClosed) * 100;
                    // Note: MetricCard formats numbers, so we expect formatted strings
                    expect(screen.getByText(calculatedLargePL.toFixed(2))).toBeInTheDocument(); // Realized P&L
                    expect(screen.getByText(largeOpen.toString())).toBeInTheDocument(); // Open Trades
                    expect(screen.getByText(largeClosed.toString())).toBeInTheDocument(); // Closed Trades
                    expect(screen.getByText(expectedWinRate.toFixed(1) + '%')).toBeInTheDocument(); // Win Rate (formatted)
                    return [2 /*return*/];
            }
        });
    }); });
    test('handles error when fetching data', function () { return __awaiter(void 0, void 0, void 0, function () {
        var errorMessage, consoleErrorSpy, loadingIndicators;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    errorMessage = 'Failed to fetch trades';
                    mockGetAggregatePL.mockRejectedValue(new Error(errorMessage));
                    mockGetTradeCounts.mockRejectedValue(new Error(errorMessage));
                    mockGetClosedTrades.mockRejectedValue(new Error(errorMessage));
                    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(function () { });
                    render(<DashboardPnlCards />);
                    return [4 /*yield*/, waitFor(function () { return expect(screen.getByText('Failed to load dashboard data.')).toBeInTheDocument(); })];
                case 1:
                    _a.sent();
                    loadingIndicators = screen.queryAllByRole('status');
                    expect(loadingIndicators.length).toBe(0);
                    // Expect N/A or zero values for metrics when there's an error
                    expect(screen.queryByText('N/A')).not.toBeInTheDocument(); // Error message is displayed instead
                    expect(screen.queryByText('0.00')).not.toBeInTheDocument(); // Assuming N/A is shown on error
                    expect(screen.queryByText('0')).not.toBeInTheDocument(); // Assuming N/A is shown on error
                    // Restore console.error
                    consoleErrorSpy.mockRestore();
                    return [2 /*return*/];
            }
        });
    }); });
    // TODO: Add more test cases for different scenarios:
    // - Edge cases for win rate (0 closed trades, 1 closed trade - covered partially by win/loss/breakeven cases)
});
