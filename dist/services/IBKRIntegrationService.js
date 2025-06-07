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
import improvedIBKRServiceAdapter from './ImprovedIBKRServiceAdapter';
import { IBKRService } from './IBKRService';
import { AccountService } from './AccountService';
import { OptionService } from './OptionService';
import { AccountType } from '../types/account';
/**
 * Integration service to bring together the original and improved IBKR services
 */
var IBKRIntegrationService = /** @class */ (function () {
    function IBKRIntegrationService() {
        this.debugLogs = [];
    }
    /**
     * Import a single IBKR activity statement
     * @param content The raw content of the IBKR activity statement
     * @param useImprovedParser Whether to use the improved parser (defaults to true)
     */
    IBKRIntegrationService.prototype.importActivityStatement = function (content_1) {
        return __awaiter(this, arguments, void 0, function (content, useImprovedParser) {
            var result, account_1, positions, optionTrades, existingAccounts, existingAccount, newAccount, savedTradeResults, newTrades, updatedTrades, summary, error_1, summary;
            var _this = this;
            if (useImprovedParser === void 0) { useImprovedParser = true; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logInfo("Starting import process...");
                        this.logInfo("Using ".concat(useImprovedParser ? 'improved' : 'original', " parser"));
                        this.logInfo("Content length: ".concat(content.length, " characters"));
                        this.logInfo("Content preview: ".concat(content.substring(0, 100), "..."));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 13, , 14]);
                        result = void 0;
                        if (!useImprovedParser) return [3 /*break*/, 3];
                        this.logInfo("Using improved parser...");
                        return [4 /*yield*/, improvedIBKRServiceAdapter.importActivityStatement(content)];
                    case 2:
                        result = _a.sent();
                        // Add logs from the improved adapter
                        this.debugLogs = this.debugLogs.concat(improvedIBKRServiceAdapter.getDebugLogs());
                        return [3 /*break*/, 5];
                    case 3:
                        this.logInfo("Using original parser...");
                        return [4 /*yield*/, IBKRService.parseActivityStatement(content)];
                    case 4:
                        result = _a.sent();
                        // Convert positions to option trades for the original parser
                        result.optionTrades = IBKRService.convertToOptionTrades(result);
                        _a.label = 5;
                    case 5:
                        account_1 = result.account, positions = result.positions, optionTrades = result.optionTrades;
                        if (account_1) {
                            this.logInfo("Parsed account: ".concat(account_1.accountName, " (").concat(account_1.accountId, ")"));
                        }
                        else {
                            this.logInfo('No account information found in the import result');
                        }
                        if (Array.isArray(positions)) {
                            this.logInfo("Found ".concat(positions.length, " positions"));
                        }
                        else {
                            this.logInfo('No positions found in the import result');
                        }
                        if (optionTrades) {
                            this.logInfo("Found ".concat(optionTrades.length, " option trades"));
                        }
                        else {
                            this.logInfo('No option trades found in the import result');
                        }
                        if (!account_1) return [3 /*break*/, 9];
                        return [4 /*yield*/, AccountService.getAccounts()];
                    case 6:
                        existingAccounts = _a.sent();
                        existingAccount = existingAccounts.find(function (a) { return a.id === account_1.accountId; });
                        if (!!existingAccount) return [3 /*break*/, 8];
                        this.logInfo("Creating new account: ".concat(account_1.accountName, " (").concat(account_1.accountId, ")"));
                        newAccount = {
                            id: account_1.accountId,
                            name: account_1.accountName,
                            type: AccountType.IBKR,
                            balance: account_1.balance,
                            created: new Date(),
                            lastUpdated: new Date()
                        };
                        return [4 /*yield*/, AccountService.addAccount(newAccount)];
                    case 7:
                        _a.sent();
                        this.logInfo("Account created: ".concat(newAccount.name));
                        return [3 /*break*/, 9];
                    case 8:
                        this.logInfo("Account already exists: ".concat(existingAccount.name));
                        _a.label = 9;
                    case 9:
                        if (!(optionTrades && account_1)) return [3 /*break*/, 11];
                        this.logInfo("Saving ".concat(optionTrades.length, " option trades to database..."));
                        return [4 /*yield*/, Promise.all(optionTrades.map(function (trade) { return _this.saveTrade(account_1.accountId, trade); }))];
                    case 10:
                        savedTradeResults = _a.sent();
                        newTrades = savedTradeResults.filter(function (r) { return r.isNew; }).length;
                        updatedTrades = savedTradeResults.filter(function (r) { return !r.isNew; }).length;
                        this.logInfo("Saved ".concat(newTrades, " new trades and updated ").concat(updatedTrades, " existing trades"));
                        summary = {
                            accountId: account_1.accountId,
                            accountName: account_1.accountName,
                            totalTrades: optionTrades.length,
                            newTrades: newTrades,
                            updatedTrades: updatedTrades,
                            positions: Array.isArray(positions) ? positions.length : 0,
                            errors: [],
                            warnings: []
                        };
                        return [2 /*return*/, summary];
                    case 11:
                        this.logInfo('No trades to save or account information missing');
                        return [2 /*return*/, {
                                accountId: (account_1 === null || account_1 === void 0 ? void 0 : account_1.accountId) || 'unknown',
                                accountName: (account_1 === null || account_1 === void 0 ? void 0 : account_1.accountName) || 'unknown',
                                totalTrades: 0,
                                newTrades: 0,
                                updatedTrades: 0,
                                positions: 0,
                                errors: [],
                                warnings: []
                            }];
                    case 12: return [3 /*break*/, 14];
                    case 13:
                        error_1 = _a.sent();
                        this.logError("Error importing IBKR activity statement: ".concat(error_1));
                        this.logError("Error stack: ".concat(error_1 instanceof Error ? error_1.stack : 'No stack trace available'));
                        summary = {
                            accountId: 'UNKNOWN',
                            accountName: 'UNKNOWN',
                            totalTrades: 0,
                            newTrades: 0,
                            updatedTrades: 0,
                            positions: 0,
                            errors: [error_1 instanceof Error ? error_1.message : String(error_1)],
                            warnings: []
                        };
                        return [2 /*return*/, summary];
                    case 14: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Import multiple IBKR activity statements
     * @param contentArray Array of IBKR activity statement contents
     * @param useImprovedParser Whether to use the improved parser (defaults to true)
     */
    IBKRIntegrationService.prototype.importMultipleStatements = function (contentArray_1) {
        return __awaiter(this, arguments, void 0, function (contentArray, useImprovedParser) {
            var nonEmptyContents, summaries, errors, warnings, i, contentSample, summary, error_2, batchSummary;
            if (useImprovedParser === void 0) { useImprovedParser = true; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logInfo("Starting batch import of ".concat(contentArray.length, " files"));
                        this.logInfo("Using ".concat(useImprovedParser ? 'improved' : 'original', " parser"));
                        nonEmptyContents = contentArray.filter(function (content) { return content && content.trim().length > 0; });
                        this.logInfo("Found ".concat(nonEmptyContents.length, " non-empty files to process"));
                        summaries = [];
                        errors = [];
                        warnings = [];
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < nonEmptyContents.length)) return [3 /*break*/, 6];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        this.logInfo("Processing file ".concat(i + 1, "/").concat(nonEmptyContents.length));
                        contentSample = nonEmptyContents[i].substring(0, 100);
                        this.logInfo("File content preview: ".concat(contentSample, "..."));
                        return [4 /*yield*/, this.importActivityStatement(nonEmptyContents[i], useImprovedParser)];
                    case 3:
                        summary = _a.sent();
                        summaries.push(summary);
                        // Collect any errors and warnings
                        errors.push.apply(errors, summary.errors);
                        warnings.push.apply(warnings, summary.warnings);
                        this.logInfo("Successfully processed file ".concat(i + 1));
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _a.sent();
                        this.logError("Error processing file ".concat(i + 1, ": ").concat(error_2));
                        errors.push(error_2 instanceof Error ? error_2.message : String(error_2));
                        return [3 /*break*/, 5];
                    case 5:
                        i++;
                        return [3 /*break*/, 1];
                    case 6:
                        batchSummary = {
                            totalFiles: nonEmptyContents.length,
                            successfulFiles: summaries.length,
                            failedFiles: nonEmptyContents.length - summaries.length,
                            accounts: Array.from(new Set(summaries.map(function (s) { return s.accountId; }))),
                            totalTrades: summaries.reduce(function (sum, s) { return sum + s.totalTrades; }, 0),
                            newTrades: summaries.reduce(function (sum, s) { return sum + s.newTrades; }, 0),
                            updatedTrades: summaries.reduce(function (sum, s) { return sum + s.updatedTrades; }, 0),
                            positions: summaries.reduce(function (sum, s) { return sum + s.positions; }, 0),
                            errors: errors,
                            warnings: warnings
                        };
                        this.logInfo("Batch import completed: ".concat(batchSummary.successfulFiles, " successful, ").concat(batchSummary.failedFiles, " failed"));
                        this.logInfo("Total trades: ".concat(batchSummary.totalTrades, " (").concat(batchSummary.newTrades, " new, ").concat(batchSummary.updatedTrades, " updated)"));
                        return [2 /*return*/, batchSummary];
                }
            });
        });
    };
    /**
     * Save or update a trade
     */
    IBKRIntegrationService.prototype.saveTrade = function (accountId, trade) {
        return __awaiter(this, void 0, void 0, function () {
            var existingTrades, existingTrade, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, OptionService.getOpenPositions(accountId)];
                    case 1:
                        existingTrades = _a.sent();
                        existingTrade = existingTrades.find(function (t) {
                            return t.symbol === trade.symbol &&
                                t.strike === trade.strike &&
                                t.putCall === trade.putCall &&
                                t.expiry.getTime() === trade.expiry.getTime() &&
                                t.openDate.getTime() === trade.openDate.getTime();
                        });
                        if (!existingTrade) return [3 /*break*/, 3];
                        // Update existing trade
                        return [4 /*yield*/, OptionService.closeTrade(accountId, existingTrade.id, {
                                closeDate: new Date(),
                                closePremium: trade.premium || 0
                            })];
                    case 2:
                        // Update existing trade
                        _a.sent();
                        return [2 /*return*/, { isNew: false }];
                    case 3: 
                    // Add new trade
                    return [4 /*yield*/, OptionService.addTrade(accountId, trade)];
                    case 4:
                        // Add new trade
                        _a.sent();
                        return [2 /*return*/, { isNew: true }];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_3 = _a.sent();
                        this.logError("Error saving trade: ".concat(error_3));
                        throw error_3;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get debug logs
     */
    IBKRIntegrationService.prototype.getDebugLogs = function () {
        return this.debugLogs;
    };
    /**
     * Clear debug logs
     */
    IBKRIntegrationService.prototype.clearDebugLogs = function () {
        this.debugLogs = [];
    };
    /**
     * Log info message
     */
    IBKRIntegrationService.prototype.logInfo = function (message) {
        var timestamp = new Date().toISOString();
        var logEntry = "".concat(timestamp, ": ").concat(message);
        this.debugLogs.push(logEntry);
        console.log(logEntry);
    };
    /**
     * Log error message
     */
    IBKRIntegrationService.prototype.logError = function (message) {
        var timestamp = new Date().toISOString();
        var logEntry = "".concat(timestamp, ": ERROR: ").concat(message);
        this.debugLogs.push(logEntry);
        console.error(logEntry);
    };
    return IBKRIntegrationService;
}());
export { IBKRIntegrationService };
export default new IBKRIntegrationService();
