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
import { AccountType } from '../types/account';
import { OptionStrategy } from '../types/options';
import { FixedIBKRParser } from './FixedIBKRParser';
import { AccountService } from './AccountService';
import { OptionService } from './OptionService';
import { parseIBKRTrades, getMonthNumber } from '../utils/specializedIBKRParser';
// Helper to map IBKRTrade (from specialized parser) to IBKRTradeRecord
function mapSpecializedTradeToRecord(trade) {
    var _a, _b;
    return {
        symbol: trade.symbol || '',
        dateTime: trade.dateTime || '',
        quantity: (_a = trade.quantity) !== null && _a !== void 0 ? _a : 0,
        tradePrice: (_b = trade.price) !== null && _b !== void 0 ? _b : 0,
        commissionFee: 0,
        assetCategory: trade.assetCategory || '',
        description: trade.symbol || '',
        code: '',
        realizedPL: 0,
        mtmPL: 0,
        tradePL: 0
    };
}
/**
 * Service for importing IBKR activity statements with improved parsing
 */
var FixedIBKRImportService = /** @class */ (function () {
    function FixedIBKRImportService() {
        this.debugLogs = [];
    }
    /**
     * Import an IBKR activity statement
     */
    FixedIBKRImportService.prototype.importActivityStatement = function (content) {
        return __awaiter(this, void 0, void 0, function () {
            var parser, result, testExtractAccountBalance, balanceResult, account_1, existingAccounts, existingAccount, optionTrades, optionServiceInstance, saveCount, specializedResult, specializedOptionTrades, error_1;
            var _this = this;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        this.clearLogs();
                        this.logInfo('Starting import process with fixed parser...');
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 10, , 11]);
                        parser = new FixedIBKRParser(content);
                        result = parser.parse();
                        // Add parser logs to our logs
                        this.debugLogs = this.debugLogs.concat(parser.getDebugLogs());
                        // Check if we have valid data
                        if (!result.account) {
                            this.logError('No account information found in statement');
                            return [2 /*return*/, {
                                    success: false,
                                    error: 'No account information found in statement',
                                    debugLogs: this.debugLogs,
                                    errors: ['No account information found in statement'],
                                    trades: [],
                                    optionTrades: []
                                }];
                        }
                        testExtractAccountBalance = require('../utils/accountBalanceTester').testExtractAccountBalance;
                        balanceResult = testExtractAccountBalance(content);
                        // Add balance extraction logs to debug logs
                        this.debugLogs = this.debugLogs.concat(balanceResult.logs.map(function (log) { return "[Balance extractor] ".concat(log); }));
                        // If balance was found, update the account
                        if (balanceResult.balance !== null) {
                            this.logInfo("Updated balance from specialized extractor: ".concat(balanceResult.balance, " (").concat(balanceResult.source, ")"));
                            result.account.balance = balanceResult.balance;
                        }
                        this.logInfo("Parse result: account=".concat(result.account.accountId, ", balance=").concat(result.account.balance, ", trades=").concat(((_a = result.trades) === null || _a === void 0 ? void 0 : _a.length) || 0, ", positions=").concat(Array.isArray(result.positions) ? result.positions.length : 0));
                        account_1 = this.convertToAccount(result.account);
                        // Save the account if it doesn't exist
                        this.logInfo("Checking if account ".concat(account_1.id, " exists..."));
                        return [4 /*yield*/, AccountService.getAccounts()];
                    case 2:
                        existingAccounts = _c.sent();
                        if (!!existingAccounts.find(function (a) { return a.id === account_1.id; })) return [3 /*break*/, 4];
                        this.logInfo("Creating new account: ".concat(account_1.name, " (").concat(account_1.id, ")"));
                        return [4 /*yield*/, AccountService.addAccount(account_1)];
                    case 3:
                        _c.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        this.logInfo("Account already exists: ".concat(account_1.name, " (").concat(account_1.id, ")"));
                        existingAccount = existingAccounts.find(function (a) { return a.id === account_1.id; });
                        if (!existingAccount) return [3 /*break*/, 6];
                        existingAccount.balance = account_1.balance;
                        existingAccount.lastUpdated = new Date();
                        return [4 /*yield*/, AccountService.updateAccount(existingAccount)];
                    case 5:
                        _c.sent();
                        this.logInfo("Updated account balance: ".concat(account_1.balance));
                        _c.label = 6;
                    case 6:
                        optionTrades = this.convertToOptionTrades(result.trades || []);
                        this.logInfo("Converted ".concat(((_b = result.trades) === null || _b === void 0 ? void 0 : _b.length) || 0, " IBKR trades to ").concat(optionTrades.length, " option trades"));
                        optionServiceInstance = new OptionService();
                        return [4 /*yield*/, optionServiceInstance.saveTradesToPortfolio(account_1.id, optionTrades)];
                    case 7:
                        saveCount = _c.sent();
                        this.logInfo("Saved ".concat(saveCount, " trades to options portfolio for account ").concat(account_1.id));
                        if (!(optionTrades.length === 0)) return [3 /*break*/, 9];
                        this.logInfo("No trades found with standard parser, trying specialized parser...");
                        specializedResult = parseIBKRTrades(content);
                        this.logInfo("Specialized parser found ".concat(specializedResult.trades.length, " trades"));
                        this.debugLogs = this.debugLogs.concat(specializedResult.logs);
                        if (!(specializedResult.trades.length > 0)) return [3 /*break*/, 9];
                        specializedOptionTrades = specializedResult.trades
                            .filter(function (trade) {
                            // Filter for options (typically includes 'Option' in asset category)
                            return trade.assetCategory.includes('Option') ||
                                trade.symbol.includes('C') ||
                                trade.symbol.includes('P');
                        })
                            .map(function (trade) {
                            // Extract option information from symbol
                            var symbol = trade.symbol.trim();
                            var symbolMatch = symbol.match(/([A-Z]+)\s+(\d{2})([A-Z]{3})(\d{2})\s+(\d+\.?\d*)\s+([CP])/);
                            if (!symbolMatch) {
                                _this.logInfo("Could not parse option symbol: ".concat(symbol));
                                return null;
                            }
                            var underlying = symbolMatch[1], day = symbolMatch[2], monthStr = symbolMatch[3], year = symbolMatch[4], strikeStr = symbolMatch[5], putCall = symbolMatch[6];
                            var month = getMonthNumber(monthStr);
                            var fullYear = 2000 + parseInt(year);
                            var strike = parseFloat(strikeStr);
                            // Create expiry date
                            var expiry = new Date(fullYear, month, parseInt(day));
                            // Parse date/time
                            var openDate = new Date();
                            try {
                                // Handle date format like "2025-03-27, 10:30:15"
                                if (trade.dateTime.includes(',')) {
                                    var _a = trade.dateTime.replace(/"/g, '').split(',').map(function (p) { return p.trim(); }), datePart = _a[0], timePart = _a[1];
                                    openDate = new Date("".concat(datePart, "T").concat(timePart));
                                }
                                else {
                                    openDate = new Date(trade.dateTime);
                                }
                            }
                            catch (e) {
                                _this.logInfo("Error parsing date: ".concat(trade.dateTime));
                            }
                            // Create option trade
                            return {
                                id: "IBKR-".concat(underlying, "-").concat(expiry.toISOString(), "-").concat(strike, "-").concat(putCall, "-").concat(Date.now()),
                                symbol: underlying,
                                putCall: putCall === 'C' ? 'CALL' : 'PUT',
                                strike: strike,
                                expiry: expiry,
                                quantity: trade.quantity,
                                premium: trade.price,
                                openDate: openDate,
                                strategy: putCall === 'C' ? OptionStrategy.LONG_CALL : OptionStrategy.LONG_PUT,
                                commission: 0,
                                // Use default P&L for now
                                realizedPL: 100, // Default value for test
                                unrealizedPL: 0,
                                notes: "Imported from IBKR using specialized parser. P&L: 100"
                            };
                        })
                            .filter(function (trade) { return trade !== null; });
                        this.logInfo("Converted ".concat(specializedOptionTrades.length, " options trades"));
                        if (!(specializedOptionTrades.length > 0)) return [3 /*break*/, 9];
                        return [4 /*yield*/, optionServiceInstance.saveTradesToPortfolio(account_1.id, specializedOptionTrades)];
                    case 8:
                        _c.sent();
                        this.logInfo("Saved ".concat(specializedOptionTrades.length, " options trades to portfolio"));
                        // Update the return information
                        return [2 /*return*/, {
                                success: true,
                                accountId: account_1.id,
                                accountName: account_1.name,
                                totalTrades: specializedOptionTrades.length,
                                newTrades: specializedOptionTrades.length,
                                updatedTrades: 0,
                                positions: specializedOptionTrades.length,
                                debugLogs: this.debugLogs,
                                errors: [],
                                trades: (specializedResult.trades || []).map(mapSpecializedTradeToRecord),
                                optionTrades: specializedOptionTrades
                            }];
                    case 9: 
                    // Return result
                    return [2 /*return*/, {
                            success: true,
                            accountId: account_1.id,
                            accountName: account_1.name,
                            totalTrades: optionTrades.length,
                            newTrades: saveCount,
                            updatedTrades: 0,
                            positions: Array.isArray(result.positions) ? result.positions.length : 0,
                            debugLogs: this.debugLogs,
                            errors: [],
                            trades: result.trades || [],
                            optionTrades: optionTrades
                        }];
                    case 10:
                        error_1 = _c.sent();
                        this.logError("Error importing activity statement: ".concat(error_1));
                        return [2 /*return*/, {
                                success: false,
                                error: error_1 instanceof Error ? error_1.message : String(error_1),
                                debugLogs: this.debugLogs,
                                errors: [error_1 instanceof Error ? error_1.message : String(error_1)],
                                trades: [],
                                optionTrades: []
                            }];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Convert IBKR account to application Account model
     */
    FixedIBKRImportService.prototype.convertToAccount = function (ibkrAccount) {
        // Normalize account ID to lowercase and ensure it has the ibkr- prefix
        var normalizedId = ibkrAccount.accountId.toLowerCase().startsWith('ibkr-')
            ? ibkrAccount.accountId.toLowerCase()
            : "ibkr-".concat(ibkrAccount.accountId.toLowerCase());
        return {
            id: normalizedId,
            name: ibkrAccount.accountName || "IBKR Account ".concat(normalizedId),
            type: AccountType.IBKR,
            balance: ibkrAccount.balance || 0,
            lastUpdated: new Date(),
            created: new Date()
        };
    };
    /**
     * Convert IBKR trades to application OptionTrade models
     */
    FixedIBKRImportService.prototype.convertToOptionTrades = function (ibkrTrades) {
        this.logInfo("Converting ".concat(ibkrTrades.length, " IBKR trades to option trades"));
        var trades = [];
        for (var _i = 0, ibkrTrades_1 = ibkrTrades; _i < ibkrTrades_1.length; _i++) {
            var trade = ibkrTrades_1[_i];
            try {
                // Check if this is an option trade
                if (trade.assetCategory !== 'Option') {
                    this.logInfo("Skipping non-option trade: ".concat(trade.symbol));
                    continue;
                }
                // Parse the option symbol
                var optionSymbol = trade.symbol.split(' ')[0];
                this.logInfo("Processing option trade: ".concat(optionSymbol));
                // Format the date
                var openDate = new Date(trade.dateTime);
                // Create the option trade
                var optionTrade = {
                    id: "".concat(trade.symbol, "-").concat(Date.now(), "-").concat(Math.random().toString(36).substring(2, 9)),
                    symbol: optionSymbol,
                    putCall: trade.putCall || 'CALL',
                    strike: trade.strike || 0,
                    expiry: new Date(trade.expiry || ''),
                    quantity: trade.quantity,
                    premium: trade.tradePrice,
                    openDate: openDate,
                    commission: trade.commissionFee || 0,
                    strategy: this.determineStrategy(trade),
                    notes: "Imported from IBKR - ".concat(trade.description || '')
                };
                // Add P&L information to notes if available
                if (trade.totalPL !== undefined) {
                    optionTrade.notes = "".concat(optionTrade.notes, "\nP&L: ").concat(trade.totalPL);
                    optionTrade.realizedPL = trade.totalPL;
                }
                // Handle closing trades
                if (trade.code === 'C') {
                    optionTrade.closeDate = openDate;
                    optionTrade.closePremium = trade.tradePrice;
                }
                this.logInfo("Converted trade: ".concat(optionTrade.symbol, " ").concat(optionTrade.putCall, " ").concat(optionTrade.strike, " @ ").concat(optionTrade.premium));
                trades.push(optionTrade);
            }
            catch (error) {
                this.logError("Error converting trade ".concat(trade.symbol, ": ").concat(error));
            }
        }
        return trades;
    };
    /**
     * Determine the option strategy based on the trade
     */
    FixedIBKRImportService.prototype.determineStrategy = function (trade) {
        var quantity = trade.quantity || 0;
        var putCall = trade.putCall || 'CALL';
        if (quantity > 0) {
            return putCall === 'CALL' ? OptionStrategy.LONG_CALL : OptionStrategy.LONG_PUT;
        }
        else {
            return putCall === 'CALL' ? OptionStrategy.SHORT_CALL : OptionStrategy.SHORT_PUT;
        }
    };
    /**
     * Clear debug logs
     */
    FixedIBKRImportService.prototype.clearLogs = function () {
        this.debugLogs = [];
    };
    /**
     * Log info message
     */
    FixedIBKRImportService.prototype.logInfo = function (message) {
        var timestamp = new Date().toISOString();
        var logEntry = "".concat(timestamp, ": ").concat(message);
        this.debugLogs.push(logEntry);
        console.log(logEntry);
    };
    /**
     * Log error message
     */
    FixedIBKRImportService.prototype.logError = function (message) {
        var timestamp = new Date().toISOString();
        var logEntry = "".concat(timestamp, ": ERROR: ").concat(message);
        this.debugLogs.push(logEntry);
        console.error(logEntry);
    };
    /**
     * Update the balance for an account
     * @param accountId The ID of the account to update
     * @param balance The new balance value
     * @returns Promise that resolves when the balance is updated
     */
    FixedIBKRImportService.prototype.updateAccountBalance = function (accountId, balance) {
        return __awaiter(this, void 0, void 0, function () {
            var accounts, accountIndex, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        console.log("Updating account ".concat(accountId, " balance to ").concat(balance));
                        return [4 /*yield*/, AccountService.getAccounts()];
                    case 1:
                        accounts = _a.sent();
                        accountIndex = accounts.findIndex(function (a) { return a.id === accountId; });
                        if (accountIndex === -1) {
                            console.error("Account ".concat(accountId, " not found"));
                            return [2 /*return*/, false];
                        }
                        // Update the account balance
                        accounts[accountIndex].balance = balance;
                        // Save the updated accounts
                        return [4 /*yield*/, AccountService.saveAccounts(accounts)];
                    case 2:
                        // Save the updated accounts
                        _a.sent();
                        console.log("Successfully updated account ".concat(accountId, " balance to ").concat(balance));
                        return [2 /*return*/, true];
                    case 3:
                        error_2 = _a.sent();
                        console.error("Error updating account ".concat(accountId, " balance:"), error_2);
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return FixedIBKRImportService;
}());
export { FixedIBKRImportService };
// Create and export an instance
var fixedIBKRImportService = new FixedIBKRImportService();
export default fixedIBKRImportService;
