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
import { OptionStrategy } from '../types/options';
import { safeParseDate } from '../utils/dateUtils';
import { SAMPLE_TRADES } from '../utils/sampleData';
var STORAGE_KEY = 'options_portfolios';
/**
 * Service for managing options trading data
 */
var OptionService = /** @class */ (function () {
    function OptionService() {
    }
    /**
     * Check if an option is expired
     */
    OptionService.isOptionExpired = function (trade, currentDate) {
        if (currentDate === void 0) { currentDate = new Date(); }
        var expiry = safeParseDate(trade.expiry);
        return expiry ? expiry <= currentDate : false;
    };
    /**
     * Get options portfolio for an account
     */
    OptionService.getOptionsPortfolio = function (accountId) {
        console.log("Getting options portfolio for account: ".concat(accountId));
        // Normalize account ID to lowercase for consistency
        var normalizedAccountId = accountId.toLowerCase();
        var portfolios = this.getAllPortfolios();
        console.log("Available portfolios: ".concat(Object.keys(portfolios).join(', ')));
        // If no portfolio exists for the demo account, create one with sample trades
        if (normalizedAccountId === 'demo1' && !portfolios[normalizedAccountId]) {
            console.log("Creating demo portfolio for account: ".concat(normalizedAccountId));
            var demoPortfolio = {
                id: 'demo1',
                accountId: 'demo1',
                trades: SAMPLE_TRADES,
                cumulativePL: 1600.32 // Hardcoded value for demo account
            };
            this.savePortfolio(demoPortfolio);
            return demoPortfolio;
        }
        // If portfolio doesn't exist for this account, create an empty one
        if (!portfolios[normalizedAccountId]) {
            console.log("Creating new empty portfolio for account: ".concat(normalizedAccountId));
            var newPortfolio = {
                id: normalizedAccountId,
                accountId: normalizedAccountId,
                trades: [],
                cumulativePL: 0
            };
            this.savePortfolio(newPortfolio);
            return newPortfolio;
        }
        // Calculate cumulative P&L for existing portfolio
        var portfolio = portfolios[normalizedAccountId];
        if (!portfolio.cumulativePL) {
            portfolio.cumulativePL = portfolio.trades.reduce(function (total, trade) {
                return total + (trade.tradePL || 0);
            }, 0);
            this.savePortfolio(portfolio);
        }
        console.log("Found existing portfolio for account: ".concat(normalizedAccountId, " with ").concat(portfolio.trades.length, " trades and P&L: ").concat(portfolio.cumulativePL));
        return portfolio;
    };
    /**
     * Get all options portfolios
     */
    OptionService.getAllPortfolios = function () {
        var data = localStorage.getItem(STORAGE_KEY);
        if (!data) {
            // Initialize with demo portfolio
            var initialData = {
                'demo1': {
                    id: 'demo1',
                    accountId: 'demo1',
                    trades: SAMPLE_TRADES
                }
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
            return initialData;
        }
        var parsedData = JSON.parse(data);
        // Convert date strings back to Date objects
        Object.keys(parsedData).forEach(function (accountId) {
            var portfolio = parsedData[accountId];
            portfolio.trades = portfolio.trades.map(function (trade) { return (__assign(__assign({}, trade), { openDate: safeParseDate(trade.openDate) || new Date(), expiry: safeParseDate(trade.expiry) || new Date(), closeDate: trade.closeDate ? safeParseDate(trade.closeDate) : undefined, proceeds: typeof trade.premium === 'number' && typeof trade.quantity === 'number' ? trade.premium * trade.quantity * 100 : undefined })); });
        });
        return parsedData;
    };
    /**
     * Save options portfolio
     */
    OptionService.savePortfolio = function (portfolio) {
        var portfolios = this.getAllPortfolios();
        portfolios[portfolio.accountId] = portfolio;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolios));
    };
    /**
     * Add a new trade to an account's portfolio
     */
    OptionService.addTrade = function (accountId, trade) {
        console.log("Adding trade to account: ".concat(accountId));
        // Normalize account ID to lowercase for consistency
        var normalizedAccountId = accountId.toLowerCase();
        var portfolio = this.getOptionsPortfolio(normalizedAccountId);
        var newTrade = __assign(__assign({}, trade), { id: "".concat(trade.symbol, "-").concat(Date.now()) });
        console.log("Adding trade: ".concat(newTrade.symbol, " ").concat(newTrade.putCall, " ").concat(newTrade.strike, " to portfolio with ").concat(portfolio.trades.length, " existing trades"));
        portfolio.trades.push(newTrade);
        this.savePortfolio(portfolio);
        return newTrade;
    };
    /**
     * Close an existing trade
     */
    OptionService.closeTrade = function (accountId, tradeId, closeData) {
        var portfolio = this.getOptionsPortfolio(accountId);
        var tradeIndex = portfolio.trades.findIndex(function (t) { return t.id === tradeId; });
        if (tradeIndex === -1) {
            return null;
        }
        var trade = portfolio.trades[tradeIndex];
        var closedTrade = __assign(__assign({}, trade), { closeDate: closeData.closeDate, closePremium: closeData.closePremium });
        portfolio.trades[tradeIndex] = closedTrade;
        this.savePortfolio(portfolio);
        return closedTrade;
    };
    /**
     * Delete a trade from an account's portfolio
     */
    OptionService.deleteTrade = function (accountId, tradeId) {
        console.log("Deleting trade ".concat(tradeId, " from account: ").concat(accountId));
        // Normalize account ID to lowercase for consistency
        var normalizedAccountId = accountId.toLowerCase();
        var portfolio = this.getOptionsPortfolio(normalizedAccountId);
        var initialLength = portfolio.trades.length;
        portfolio.trades = portfolio.trades.filter(function (trade) { return trade.id !== tradeId; });
        if (portfolio.trades.length < initialLength) {
            console.log("Successfully deleted trade ".concat(tradeId, " from account ").concat(normalizedAccountId));
            this.savePortfolio(portfolio);
            return true;
        }
        console.log("Trade ".concat(tradeId, " not found in account ").concat(normalizedAccountId));
        return false;
    };
    /**
     * Get open positions for an account
     */
    OptionService.getOpenPositions = function (accountId) {
        var portfolio = this.getOptionsPortfolio(accountId);
        return portfolio.trades.filter(function (t) { return !t.closeDate; });
    };
    /**
     * Get closed positions for an account
     */
    OptionService.getClosedPositions = function (accountId) {
        var portfolio = this.getOptionsPortfolio(accountId);
        return portfolio.trades.filter(function (t) { return t.closeDate; });
    };
    /**
     * Get expired open positions
     */
    OptionService.getExpiredPositions = function (accountId) {
        var _this = this;
        var openPositions = this.getOpenPositions(accountId);
        var currentDate = new Date();
        return openPositions.filter(function (trade) { return _this.isOptionExpired(trade, currentDate); });
    };
    /**
     * Calculate P&L for a trade
     */
    OptionService.calculatePL = function (trade) {
        // If the trade is closed, calculate based on premiums
        if (trade.closeDate && trade.closePremium !== undefined) {
            var openValue = (trade.premium || 0) * trade.quantity * 100;
            var closeValue = trade.closePremium * trade.quantity * 100;
            return closeValue - openValue;
        }
        // If the trade is open and has a current price, calculate unrealized P&L
        if (trade.currentPrice !== undefined) {
            var openValue = (trade.premium || 0) * trade.quantity * 100;
            var currentValue = trade.currentPrice * trade.quantity * 100;
            return currentValue - openValue;
        }
        return 0;
    };
    /**
     * Calculate total P&L for an account
     */
    OptionService.calculateTotalPL = function (accountId) {
        var _this = this;
        var portfolio = this.getOptionsPortfolio(accountId);
        return portfolio.trades.reduce(function (total, trade) {
            return total + _this.calculatePL(trade);
        }, 0);
    };
    /**
     * Calculate average days held for trades
     */
    OptionService.calculateAverageDaysHeld = function (trades) {
        var closedTrades = trades.filter(function (t) { return t.closeDate; });
        if (closedTrades.length === 0)
            return 0;
        var totalDays = closedTrades.reduce(function (sum, trade) {
            var openDate = safeParseDate(trade.openDate);
            var closeDate = safeParseDate(trade.closeDate);
            if (!openDate || !closeDate)
                return sum;
            return sum + (closeDate.getTime() - openDate.getTime()) / (1000 * 60 * 60 * 24);
        }, 0);
        return totalDays / closedTrades.length;
    };
    /**
     * Calculate portfolio statistics
     */
    OptionService.calculateStats = function (accountId) {
        var _this = this;
        console.log('==================== P&L CALCULATION START ====================');
        console.log('Calculating stats for:', typeof accountId === 'string' ? "account ".concat(accountId) : 'portfolio');
        var portfolio = typeof accountId === 'string'
            ? this.getOptionsPortfolio(accountId)
            : accountId;
        console.log('\nPortfolio:', JSON.stringify(portfolio, null, 2));
        var trades = portfolio.trades;
        console.log('\n📊 Total number of trades:', trades.length);
        // Log P&L calculation for each trade
        console.log('\n💰 Individual Trade P&L Calculations:');
        trades.forEach(function (trade) {
            var pl = _this.calculatePL(trade);
            console.log("\nTrade ".concat(trade.symbol, ":"), JSON.stringify({
                id: trade.id,
                symbol: trade.symbol,
                putCall: trade.putCall,
                strike: trade.strike,
                quantity: trade.quantity,
                premium: trade.premium,
                openDate: trade.openDate,
                closeDate: trade.closeDate,
                closePremium: trade.closePremium,
                strategy: trade.strategy,
                commission: trade.commission,
                calculatedPL: pl
            }, null, 2));
        });
        var openTrades = trades.filter(function (t) { return !t.closeDate; });
        var closedTrades = trades.filter(function (t) { return t.closeDate; });
        console.log('\n📈 Position Summary:');
        console.log('Open trades:', openTrades.length);
        console.log('Closed trades:', closedTrades.length);
        var totalPL = trades.reduce(function (sum, trade) { return sum + _this.calculatePL(trade); }, 0);
        console.log('\n💵 Total P&L:', totalPL.toFixed(2));
        var winningTrades = closedTrades.filter(function (t) { return _this.calculatePL(t) > 0; });
        var losingTrades = closedTrades.filter(function (t) { return _this.calculatePL(t) < 0; });
        console.log('\n🎯 Performance Metrics:');
        console.log('Winning trades:', winningTrades.length);
        console.log('Losing trades:', losingTrades.length);
        var winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
        console.log('Win rate:', winRate.toFixed(2) + '%');
        var totalWins = winningTrades.reduce(function (sum, t) { return sum + _this.calculatePL(t); }, 0);
        var totalLosses = Math.abs(losingTrades.reduce(function (sum, t) { return sum + _this.calculatePL(t); }, 0));
        var stats = {
            totalPL: totalPL,
            winRate: winRate,
            openPositions: openTrades.length,
            closedPositions: closedTrades.length,
            avgDaysHeld: this.calculateAverageDaysHeld(trades),
            totalTrades: trades.length,
            openTrades: openTrades.length,
            closedTrades: closedTrades.length,
            winningTrades: winningTrades.length,
            losingTrades: losingTrades.length,
            averageWin: winningTrades.length > 0 ? totalWins / winningTrades.length : 0,
            averageLoss: losingTrades.length > 0 ? totalLosses / losingTrades.length : 0
        };
        console.log('\n📊 Final Stats:', JSON.stringify(stats, null, 2));
        console.log('==================== P&L CALCULATION END ====================\n');
        return stats;
    };
    // Get all options portfolios
    OptionService.prototype.getOptionsPortfolios = function () {
        return __awaiter(this, void 0, void 0, function () {
            var portfoliosJson, portfolios_1;
            return __generator(this, function (_a) {
                try {
                    portfoliosJson = localStorage.getItem(STORAGE_KEY);
                    if (!portfoliosJson) {
                        return [2 /*return*/, {}];
                    }
                    portfolios_1 = JSON.parse(portfoliosJson);
                    // Convert date strings back to Date objects
                    Object.keys(portfolios_1).forEach(function (accountId) {
                        if (portfolios_1[accountId].trades) {
                            portfolios_1[accountId].trades = portfolios_1[accountId].trades.map(function (trade) { return (__assign(__assign({}, trade), { openDate: trade.openDate ? new Date(trade.openDate) : undefined, closeDate: trade.closeDate ? new Date(trade.closeDate) : undefined, expiry: trade.expiry ? new Date(trade.expiry) : undefined, proceeds: typeof trade.premium === 'number' && typeof trade.quantity === 'number' ? trade.premium * trade.quantity * 100 : undefined })); });
                        }
                    });
                    return [2 /*return*/, portfolios_1];
                }
                catch (error) {
                    console.error('Error getting options portfolios:', error);
                    return [2 /*return*/, {}];
                }
                return [2 /*return*/];
            });
        });
    };
    // Get options portfolio for a specific account
    OptionService.prototype.getOptionsPortfolio = function (accountId) {
        return __awaiter(this, void 0, void 0, function () {
            var portfolios, portfolio, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        console.log("Getting options portfolio for account: ".concat(accountId));
                        return [4 /*yield*/, this.getOptionsPortfolios()];
                    case 1:
                        portfolios = _a.sent();
                        console.log("Retrieved portfolios for accounts: ".concat(Object.keys(portfolios).join(', ')));
                        portfolio = portfolios[accountId];
                        if (!!portfolio) return [3 /*break*/, 3];
                        console.log("No portfolio found for account ".concat(accountId, ", creating new one"));
                        // For demo account, use sample data
                        if (accountId === 'demo1') {
                            portfolio = {
                                id: "portfolio-".concat(accountId),
                                accountId: accountId,
                                trades: this.getSampleTrades()
                            };
                        }
                        else {
                            // For other accounts, create an empty portfolio
                            portfolio = {
                                id: "portfolio-".concat(accountId),
                                accountId: accountId,
                                trades: []
                            };
                        }
                        // Save the new portfolio
                        portfolios[accountId] = portfolio;
                        return [4 /*yield*/, this.saveOptionsPortfolios(portfolios)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        console.log("Portfolio for ".concat(accountId, " has ").concat(portfolio.trades.length, " trades"));
                        return [2 /*return*/, portfolio];
                    case 4:
                        error_1 = _a.sent();
                        console.error("Error getting options portfolio for ".concat(accountId, ":"), error_1);
                        return [2 /*return*/, {
                                id: "portfolio-".concat(accountId),
                                accountId: accountId,
                                trades: []
                            }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    // Add a trade to an options portfolio
    OptionService.prototype.addTrade = function (accountId, trade) {
        return __awaiter(this, void 0, void 0, function () {
            var portfolios, portfolio, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        console.log("Adding trade to portfolio for account ".concat(accountId, ":"), trade);
                        return [4 /*yield*/, this.getOptionsPortfolios()];
                    case 1:
                        portfolios = _a.sent();
                        portfolio = portfolios[accountId];
                        // Create portfolio if it doesn't exist
                        if (!portfolio) {
                            portfolio = {
                                id: "portfolio-".concat(accountId),
                                accountId: accountId,
                                trades: []
                            };
                            portfolios[accountId] = portfolio;
                        }
                        // Add the trade
                        portfolio.trades.push(trade);
                        // Save portfolios
                        return [4 /*yield*/, this.saveOptionsPortfolios(portfolios)];
                    case 2:
                        // Save portfolios
                        _a.sent();
                        console.log("Successfully added trade to portfolio. New trade count: ".concat(portfolio.trades.length));
                        return [2 /*return*/, true];
                    case 3:
                        error_2 = _a.sent();
                        console.error("Error adding trade to portfolio for ".concat(accountId, ":"), error_2);
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Close a trade in an options portfolio
    OptionService.prototype.closeTrade = function (accountId, tradeId, closeDate, closePremium) {
        return __awaiter(this, void 0, void 0, function () {
            var portfolios, portfolio, tradeIndex, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        console.log("Closing trade ".concat(tradeId, " in portfolio for account ").concat(accountId));
                        return [4 /*yield*/, this.getOptionsPortfolios()];
                    case 1:
                        portfolios = _a.sent();
                        portfolio = portfolios[accountId];
                        if (!portfolio) {
                            console.error("Portfolio not found for account ".concat(accountId));
                            return [2 /*return*/, false];
                        }
                        tradeIndex = portfolio.trades.findIndex(function (t) { return t.id === tradeId; });
                        if (tradeIndex === -1) {
                            console.error("Trade ".concat(tradeId, " not found in portfolio for account ").concat(accountId));
                            return [2 /*return*/, false];
                        }
                        // Update the trade
                        portfolio.trades[tradeIndex] = __assign(__assign({}, portfolio.trades[tradeIndex]), { closeDate: closeDate, closePremium: closePremium });
                        // Save portfolios
                        return [4 /*yield*/, this.saveOptionsPortfolios(portfolios)];
                    case 2:
                        // Save portfolios
                        _a.sent();
                        console.log("Successfully closed trade ".concat(tradeId, " in portfolio for account ").concat(accountId));
                        return [2 /*return*/, true];
                    case 3:
                        error_3 = _a.sent();
                        console.error("Error closing trade ".concat(tradeId, " in portfolio for account ").concat(accountId, ":"), error_3);
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Calculate P&L for a specific account
    OptionService.calculateAccountPL = function (accountId) {
        return __awaiter(this, void 0, void 0, function () {
            var portfolio, error_4;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getOptionsPortfolio(accountId)];
                    case 1:
                        portfolio = _a.sent();
                        return [2 /*return*/, portfolio.trades.reduce(function (total, trade) {
                                return total + _this.calculatePL(trade);
                            }, 0)];
                    case 2:
                        error_4 = _a.sent();
                        console.error("Error calculating P&L for account ".concat(accountId, ":"), error_4);
                        return [2 /*return*/, 0];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Get sample trades for demo account
    OptionService.prototype.getSampleTrades = function () {
        return [
            {
                id: '1',
                symbol: 'SPY',
                putCall: 'CALL',
                strike: 420,
                expiry: new Date('2025-12-15'),
                quantity: 1,
                premium: 5.25,
                openDate: new Date('2025-11-01'),
                closeDate: new Date('2025-11-15'),
                closePremium: 7.50,
                strategy: OptionStrategy.LONG_CALL,
                commission: 1.25,
                realizedPL: 225.00,
                notes: 'Demo trade. Realized P&L: 225.00'
            },
            {
                id: '2',
                symbol: 'AAPL',
                putCall: 'PUT',
                strike: 180,
                expiry: new Date('2025-12-15'),
                quantity: -2,
                premium: 3.75,
                openDate: new Date('2025-11-05'),
                closeDate: new Date('2025-11-20'),
                closePremium: 1.25,
                strategy: OptionStrategy.SHORT_PUT,
                commission: 2.50,
                realizedPL: 500.00,
                notes: 'Demo trade. Realized P&L: 500.00'
            }
        ];
    };
    // 2. Add a direct method to save trades to a specific portfolio
    OptionService.prototype.saveTradeToPortfolio = function (accountId, trade) {
        return __awaiter(this, void 0, void 0, function () {
            var portfolios, portfolio, existingIndex, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        console.log("Saving trade to portfolio for account ".concat(accountId, ":"), trade);
                        return [4 /*yield*/, this.getOptionsPortfolios()];
                    case 1:
                        portfolios = _a.sent();
                        portfolio = portfolios[accountId];
                        // Create portfolio if it doesn't exist
                        if (!portfolio) {
                            portfolio = {
                                id: "portfolio-".concat(accountId),
                                accountId: accountId,
                                trades: []
                            };
                            portfolios[accountId] = portfolio;
                        }
                        existingIndex = portfolio.trades.findIndex(function (t) {
                            return t.id === trade.id || (t.symbol === trade.symbol &&
                                t.putCall === trade.putCall &&
                                t.strike === trade.strike &&
                                t.expiry.getTime() === new Date(trade.expiry).getTime() &&
                                Math.abs(new Date(t.openDate).getTime() - new Date(trade.openDate).getTime()) < 86400000 // Within 1 day
                            );
                        });
                        if (existingIndex >= 0) {
                            // Update existing trade
                            console.log("Updating existing trade at index ".concat(existingIndex));
                            portfolio.trades[existingIndex] = __assign(__assign(__assign({}, portfolio.trades[existingIndex]), trade), { id: portfolio.trades[existingIndex].id // Keep original ID
                             });
                        }
                        else {
                            // Add new trade
                            console.log("Adding new trade with ID ".concat(trade.id));
                            portfolio.trades.push(trade);
                        }
                        // Save portfolios
                        return [4 /*yield*/, this.saveOptionsPortfolios(portfolios)];
                    case 2:
                        // Save portfolios
                        _a.sent();
                        console.log("Successfully saved trade to portfolio. New trade count: ".concat(portfolio.trades.length));
                        return [2 /*return*/, true];
                    case 3:
                        error_5 = _a.sent();
                        console.error("Error saving trade to portfolio for ".concat(accountId, ":"), error_5);
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // 3. Fix the saveOptionsPortfolios method to handle Date objects properly
    OptionService.prototype.saveOptionsPortfolios = function (portfolios) {
        return __awaiter(this, void 0, void 0, function () {
            var portfoliosToSave;
            return __generator(this, function (_a) {
                try {
                    portfoliosToSave = JSON.parse(JSON.stringify(portfolios));
                    // Log portfolios before saving
                    console.log("Saving portfolios for accounts: ".concat(Object.keys(portfoliosToSave).join(', ')));
                    // Store in localStorage
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfoliosToSave));
                }
                catch (error) {
                    console.error('Error saving options portfolios:', error);
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    // 4. Add a method to save a batch of trades at once
    OptionService.prototype.saveTradesToPortfolio = function (accountId, trades) {
        return __awaiter(this, void 0, void 0, function () {
            var portfolios, portfolio, addedCount, updatedCount, _loop_1, _i, trades_1, trade, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        console.log("Saving ".concat(trades.length, " trades to portfolio for account ").concat(accountId));
                        return [4 /*yield*/, this.getOptionsPortfolios()];
                    case 1:
                        portfolios = _a.sent();
                        portfolio = portfolios[accountId];
                        // Create portfolio if it doesn't exist
                        if (!portfolio) {
                            portfolio = {
                                id: "portfolio-".concat(accountId),
                                accountId: accountId,
                                trades: []
                            };
                            portfolios[accountId] = portfolio;
                        }
                        addedCount = 0;
                        updatedCount = 0;
                        _loop_1 = function (trade) {
                            // Check if trade already exists
                            var existingIndex = portfolio.trades.findIndex(function (t) {
                                return t.id === trade.id || (t.symbol === trade.symbol &&
                                    t.putCall === trade.putCall &&
                                    t.strike === trade.strike &&
                                    t.expiry.getTime() === new Date(trade.expiry).getTime() &&
                                    Math.abs(new Date(t.openDate).getTime() - new Date(trade.openDate).getTime()) < 86400000 // Within 1 day
                                );
                            });
                            if (existingIndex >= 0) {
                                // Update existing trade
                                portfolio.trades[existingIndex] = __assign(__assign(__assign({}, portfolio.trades[existingIndex]), trade), { id: portfolio.trades[existingIndex].id // Keep original ID
                                 });
                                updatedCount++;
                            }
                            else {
                                // Add new trade
                                portfolio.trades.push(trade);
                                addedCount++;
                            }
                        };
                        // Process each trade
                        for (_i = 0, trades_1 = trades; _i < trades_1.length; _i++) {
                            trade = trades_1[_i];
                            _loop_1(trade);
                        }
                        // Save portfolios
                        return [4 /*yield*/, this.saveOptionsPortfolios(portfolios)];
                    case 2:
                        // Save portfolios
                        _a.sent();
                        console.log("Successfully saved trades to portfolio. Added: ".concat(addedCount, ", Updated: ").concat(updatedCount));
                        return [2 /*return*/, addedCount + updatedCount];
                    case 3:
                        error_6 = _a.sent();
                        console.error("Error saving trades to portfolio for ".concat(accountId, ":"), error_6);
                        return [2 /*return*/, 0];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Calculate total P&L for a portfolio
    OptionService.calculatePortfolioPL = function (portfolio) {
        return portfolio.trades.reduce(function (total, trade) {
            return total + OptionService.calculatePL(trade);
        }, 0);
    };
    // Analyze trades and generate statistics
    OptionService.analyzeTrades = function (trades) {
        try {
            console.log('\n📊 Trade Analysis');
            console.log('Total trades:', trades.length);
            var closedTrades = trades.filter(function (t) { return t.closeDate; });
            console.log('Closed trades:', closedTrades.length);
            var totalPL = trades.reduce(function (sum, trade) { return sum + OptionService.calculatePL(trade); }, 0);
            console.log('\n💵 Total P&L:', totalPL.toFixed(2));
            var winningTrades = closedTrades.filter(function (t) { return OptionService.calculatePL(t) > 0; });
            var losingTrades = closedTrades.filter(function (t) { return OptionService.calculatePL(t) < 0; });
            console.log('\n🎯 Performance Metrics:');
            console.log('Winning trades:', winningTrades.length);
            console.log('Losing trades:', losingTrades.length);
            var winRate = closedTrades.length > 0
                ? (winningTrades.length / closedTrades.length) * 100
                : 0;
            console.log('Win rate:', winRate.toFixed(2) + '%');
            var totalWins = winningTrades.reduce(function (sum, t) { return sum + OptionService.calculatePL(t); }, 0);
            var totalLosses = Math.abs(losingTrades.reduce(function (sum, t) { return sum + OptionService.calculatePL(t); }, 0));
            var stats = {
                totalTrades: trades.length,
                closedTrades: closedTrades.length,
                winningTrades: winningTrades.length,
                losingTrades: losingTrades.length,
                winRate: winRate,
                totalPL: totalPL,
                totalWins: totalWins,
                totalLosses: totalLosses,
                averageWin: winningTrades.length > 0 ? totalWins / winningTrades.length : 0,
                averageLoss: losingTrades.length > 0 ? totalLosses / losingTrades.length : 0
            };
            console.log('\n📈 Summary Statistics:', stats);
        }
        catch (error) {
            console.error('Error analyzing trades:', error);
        }
    };
    OptionService.portfolios = new Map();
    return OptionService;
}());
export { OptionService };
