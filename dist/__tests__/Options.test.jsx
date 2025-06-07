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
import { BrowserRouter } from 'react-router-dom';
import Options from '../pages/OptionsDB';
import { AccountService } from '../services/AccountService';
import { OptionService } from '../services/OptionService';
// Mock the services
jest.mock('../services/AccountService');
jest.mock('../services/OptionService');
// Sample test data
var sampleTrades = [
    {
        id: '1',
        symbol: "AAPL",
        putCall: "CALL",
        strike: 222.5,
        expiry: new Date("2025-05-19"),
        quantity: 2,
        premium: 1.54,
        openDate: new Date("2025-04-01"),
        strategy: "LONG_CALL",
        notes: "Earnings play"
    },
    {
        id: '2',
        symbol: "SPY",
        putCall: "PUT",
        strike: 560,
        expiry: new Date("2025-04-30"),
        quantity: -1,
        premium: 3.25,
        openDate: new Date("2025-04-05"),
        strategy: "SHORT_PUT",
        notes: "Income strategy"
    }
];
var sampleAccount = {
    id: '1',
    name: 'Test Options Account',
    type: 'Cash',
    balance: 10000,
    currency: 'USD'
};
describe('Options Module', function () {
    beforeEach(function () {
        // Reset mocks before each test
        jest.clearAllMocks();
        // Setup default mock implementations
        AccountService.getAccounts.mockReturnValue([sampleAccount]);
        OptionService.getOpenPositions.mockReturnValue([]);
        OptionService.getClosedPositions.mockReturnValue([]);
    });
    var renderOptions = function () {
        return render(<BrowserRouter>
        <Options />
      </BrowserRouter>);
    };
    describe('Basic Functionality', function () {
        test('renders account selector and empty state', function () {
            renderOptions();
            // Check for account selector
            expect(screen.getByLabelText('Select Account')).toBeInTheDocument();
            // Check for empty state message
            expect(screen.getByText('No positions found')).toBeInTheDocument();
        });
        test('adds a new trade', function () { return __awaiter(void 0, void 0, void 0, function () {
            var accountSelect, symbolInput, strikeInput, quantityInput, premiumInput, expiryInput, openDateInput, strategySelect;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        renderOptions();
                        accountSelect = screen.getByLabelText('Select Account');
                        fireEvent.change(accountSelect, { target: { value: sampleAccount.id } });
                        // Click "New Trade" button
                        fireEvent.click(screen.getByText('New Trade'));
                        symbolInput = screen.getByPlaceholderText('AAPL');
                        strikeInput = screen.getByPlaceholderText('0.00');
                        quantityInput = screen.getByDisplayValue('1');
                        premiumInput = screen.getByPlaceholderText('0.00');
                        expiryInput = screen.getByDisplayValue('2025-05-01');
                        openDateInput = screen.getByDisplayValue('2025-04-01');
                        strategySelect = screen.getByRole('combobox');
                        fireEvent.change(symbolInput, { target: { value: sampleTrades[0].symbol } });
                        fireEvent.change(strikeInput, { target: { value: sampleTrades[0].strike } });
                        fireEvent.change(quantityInput, { target: { value: sampleTrades[0].quantity } });
                        fireEvent.change(premiumInput, { target: { value: sampleTrades[0].premium } });
                        fireEvent.change(expiryInput, { target: { value: sampleTrades[0].expiry.toISOString().split('T')[0] } });
                        fireEvent.change(openDateInput, { target: { value: sampleTrades[0].openDate.toISOString().split('T')[0] } });
                        fireEvent.change(strategySelect, { target: { value: sampleTrades[0].strategy } });
                        // Click CALL button for option type
                        fireEvent.click(screen.getByText('CALL'));
                        // Submit the form
                        fireEvent.click(screen.getByText('Add Trade'));
                        // Verify the trade was added
                        return [4 /*yield*/, waitFor(function () {
                                expect(OptionService.addTrade).toHaveBeenCalledWith(sampleAccount.id, expect.objectContaining({
                                    symbol: sampleTrades[0].symbol,
                                    putCall: 'CALL',
                                    strike: sampleTrades[0].strike,
                                    quantity: sampleTrades[0].quantity,
                                    premium: sampleTrades[0].premium,
                                    expiry: sampleTrades[0].expiry,
                                    openDate: sampleTrades[0].openDate,
                                    strategy: sampleTrades[0].strategy
                                }));
                            })];
                    case 1:
                        // Verify the trade was added
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        test('closes a position', function () { return __awaiter(void 0, void 0, void 0, function () {
            var accountSelect, closePremiumInput;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Setup mock to return one open position
                        OptionService.getOpenPositions.mockReturnValue([sampleTrades[0]]);
                        renderOptions();
                        accountSelect = screen.getByLabelText('Select Account');
                        fireEvent.change(accountSelect, { target: { value: sampleAccount.id } });
                        // Click close button
                        fireEvent.click(screen.getByText('Close'));
                        closePremiumInput = screen.getByPlaceholderText('0.00');
                        fireEvent.change(closePremiumInput, { target: { value: '2.50' } });
                        // Submit close form
                        fireEvent.click(screen.getByText('Close Position'));
                        // Verify the position was closed
                        return [4 /*yield*/, waitFor(function () {
                                expect(OptionService.closeTrade).toHaveBeenCalledWith(sampleAccount.id, sampleTrades[0].id, expect.objectContaining({
                                    closePremium: 2.50
                                }));
                            })];
                    case 1:
                        // Verify the position was closed
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('View Modes', function () {
        test('switches between table and calendar views', function () {
            renderOptions();
            // Select account
            var accountSelect = screen.getByLabelText('Select Account');
            fireEvent.change(accountSelect, { target: { value: sampleAccount.id } });
            // Switch to calendar view
            fireEvent.click(screen.getByText('Calendar'));
            expect(screen.getByText('Calendar')).toHaveClass('bg-blue-600');
            // Switch back to table view
            fireEvent.click(screen.getByText('Table'));
            expect(screen.getByText('Table')).toHaveClass('bg-blue-600');
        });
    });
    describe('Position Details', function () {
        test('opens position detail view', function () {
            // Setup mock to return one open position
            OptionService.getOpenPositions.mockReturnValue([sampleTrades[0]]);
            renderOptions();
            // Select account
            var accountSelect = screen.getByLabelText('Select Account');
            fireEvent.change(accountSelect, { target: { value: sampleAccount.id } });
            // Click on position row
            fireEvent.click(screen.getByText(sampleTrades[0].symbol));
            // Verify detail view opens
            expect(screen.getByText('Position Details')).toBeInTheDocument();
            expect(screen.getByText(sampleTrades[0].symbol)).toBeInTheDocument();
            expect(screen.getByText(sampleTrades[0].putCall)).toBeInTheDocument();
        });
    });
    describe('Analysis Features', function () {
        test('displays options analysis card', function () {
            renderOptions();
            // Select account
            var accountSelect = screen.getByLabelText('Select Account');
            fireEvent.change(accountSelect, { target: { value: sampleAccount.id } });
            // Verify analysis card is present
            expect(screen.getByText('Options Analysis')).toBeInTheDocument();
        });
    });
    describe('Edge Cases', function () {
        test('handles expired options', function () {
            var expiredTrade = __assign(__assign({}, sampleTrades[0]), { expiry: new Date('2024-01-01') // Past date
             });
            // Setup mock to return expired position
            OptionService.getOpenPositions.mockReturnValue([expiredTrade]);
            renderOptions();
            // Select account
            var accountSelect = screen.getByLabelText('Select Account');
            fireEvent.change(accountSelect, { target: { value: sampleAccount.id } });
            // Verify expired position is marked
            var daysCell = screen.getByText('0');
            expect(daysCell).toHaveClass('text-red-600');
        });
        test('handles no accounts', function () {
            // Setup mock to return no accounts
            AccountService.getAccounts.mockReturnValue([]);
            renderOptions();
            // Verify no accounts message
            expect(screen.getByText('No accounts found. You need to create an account or import from IBKR before using the Options module.')).toBeInTheDocument();
        });
    });
});
