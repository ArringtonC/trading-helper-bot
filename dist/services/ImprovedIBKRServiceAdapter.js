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
import { ImprovedIBKRActivityStatementParser } from './ImprovedIBKRActivityStatementParser';
import { OptionStrategy } from '../types/options';
/**
 * Service adapter that uses the improved IBKR parser but
 * maintains compatibility with the existing application structure
 */
var ImprovedIBKRServiceAdapter = /** @class */ (function () {
    function ImprovedIBKRServiceAdapter() {
        this.debugLogs = [];
    }
    /**
     * Import an IBKR activity statement with improved parsing
     */
    ImprovedIBKRServiceAdapter.prototype.importActivityStatement = function (content) {
        return __awaiter(this, void 0, void 0, function () {
            var cleanedContent, parser, parseResult, account, positions, trades, error_1, errorMessage;
            var _this = this;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.debugLogs = [];
                        this.log('Starting import of IBKR activity statement');
                        this.log("Content length: ".concat(content.length, " characters"));
                        this.log("Content preview: ".concat(content.substring(0, 100), "..."));
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        // Clean content
                        this.log('Cleaning content...');
                        cleanedContent = this.cleanContent(content);
                        this.log("Cleaned content length: ".concat(cleanedContent.length, " characters"));
                        this.log("Cleaned content preview: ".concat(cleanedContent.substring(0, 100), "..."));
                        // Parse statement
                        this.log('Parsing IBKR activity statement...');
                        parser = new ImprovedIBKRActivityStatementParser(cleanedContent);
                        return [4 /*yield*/, parser.parse()];
                    case 2:
                        parseResult = _b.sent();
                        if (!parseResult.success) {
                            this.log("Parse failed: ".concat(parseResult.error));
                            return [2 /*return*/, {
                                    success: false,
                                    error: parseResult.error,
                                    debugLogs: this.debugLogs
                                }];
                        }
                        this.log('Parse successful');
                        this.log("Account info found: ".concat(!!parseResult.account));
                        this.log("Trades found: ".concat(((_a = parseResult.trades) === null || _a === void 0 ? void 0 : _a.length) || 0));
                        this.log("Positions found: ".concat(Array.isArray(parseResult.positions) ? parseResult.positions.length : 0));
                        // Convert to application models
                        this.log('Converting to application models...');
                        account = parseResult.account ? this.convertToAccount(parseResult.account) : undefined;
                        if (account) {
                            this.log("Account converted: ".concat(account.accountId, " - ").concat(account.accountName));
                        }
                        positions = Array.isArray(parseResult.positions) ? this.convertToPositions(parseResult.positions) : [];
                        this.log("Positions converted: ".concat(positions.length));
                        trades = parseResult.trades ? this.convertToTrades(parseResult.trades) : [];
                        this.log("Trades converted: ".concat(trades.length));
                        // Log trade details
                        trades.forEach(function (trade, index) {
                            _this.log("Trade ".concat(index + 1, ": ").concat(trade.symbol, " - ").concat(trade.quantity, " @ ").concat(trade.strike));
                        });
                        return [2 /*return*/, {
                                success: true,
                                accountId: account === null || account === void 0 ? void 0 : account.accountId,
                                accountName: account === null || account === void 0 ? void 0 : account.accountName,
                                totalTrades: trades.length,
                                newTrades: trades.filter(function (t) { return !t.id; }).length,
                                updatedTrades: trades.filter(function (t) { return t.id; }).length,
                                positions: positions,
                                debugLogs: this.debugLogs,
                                account: account,
                                trades: parseResult.trades,
                                optionTrades: trades
                            }];
                    case 3:
                        error_1 = _b.sent();
                        errorMessage = error_1 instanceof Error
                            ? "".concat(error_1.name, ": ").concat(error_1.message, "\n").concat(error_1.stack)
                            : String(error_1);
                        this.log("Error during import: ".concat(errorMessage));
                        return [2 /*return*/, {
                                success: false,
                                error: errorMessage,
                                debugLogs: this.debugLogs
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Process multiple IBKR activity statements in batch
     */
    ImprovedIBKRServiceAdapter.prototype.processBatch = function (contents) {
        return __awaiter(this, void 0, void 0, function () {
            var results, pendingFiles, i, result, error_2, totalTrades;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logInfo("Starting batch import of ".concat(contents.length, " files"));
                        results = [];
                        pendingFiles = contents.filter(function (content) { return content.trim().length > 0; });
                        this.logInfo("Found ".concat(pendingFiles.length, " pending files to process"));
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < pendingFiles.length)) return [3 /*break*/, 6];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        this.logInfo("Processing file: ".concat(i + 1, "/").concat(pendingFiles.length));
                        return [4 /*yield*/, this.importActivityStatement(pendingFiles[i])];
                    case 3:
                        result = _a.sent();
                        results.push(result);
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _a.sent();
                        this.logError("Error processing file ".concat(i + 1, ": ").concat(error_2));
                        return [3 /*break*/, 5];
                    case 5:
                        i++;
                        return [3 /*break*/, 1];
                    case 6:
                        this.logInfo("Batch import completed: ".concat(results.length, " successful, ").concat(pendingFiles.length - results.length, " failed"));
                        totalTrades = results.reduce(function (sum, result) { return sum + (result.totalTrades || 0); }, 0);
                        this.logInfo("Total trades: ".concat(totalTrades));
                        return [2 /*return*/, results];
                }
            });
        });
    };
    /**
     * Clean and prepare content for parsing
     */
    ImprovedIBKRServiceAdapter.prototype.cleanContent = function (content) {
        this.logInfo('Cleaning content...');
        this.logInfo('-------------------- RAW CONTENT PREVIEW --------------------');
        this.logInfo(content.substring(0, 500));
        this.logInfo('-------------------- END OF RAW CONTENT PREVIEW --------------------');
        return content;
    };
    /**
     * Convert IBKR account to application Account model
     */
    ImprovedIBKRServiceAdapter.prototype.convertToAccount = function (ibkrAccount) {
        return {
            accountId: ibkrAccount.accountId,
            accountName: ibkrAccount.accountName,
            accountType: ibkrAccount.accountType,
            baseCurrency: ibkrAccount.baseCurrency,
            balance: ibkrAccount.balance || 0
        };
    };
    /**
     * Convert IBKR positions to application Position models
     */
    ImprovedIBKRServiceAdapter.prototype.convertToPositions = function (ibkrPositions) {
        return ibkrPositions.map(function (position) { return (__assign(__assign({}, position), { accountId: position.accountId || 'Unknown' })); });
    };
    /**
     * Convert IBKR trades to application OptionTrade models
     */
    ImprovedIBKRServiceAdapter.prototype.convertToTrades = function (ibkrTrades) {
        return ibkrTrades
            .filter(function (trade) { return trade.assetCategory === 'Option'; })
            .map(function (trade) {
            var quantity = trade.quantity;
            // Determine strategy based on quantity and put/call type
            var strategy = quantity > 0
                ? trade.putCall === 'CALL'
                    ? OptionStrategy.LONG_CALL
                    : OptionStrategy.LONG_PUT
                : trade.putCall === 'CALL'
                    ? OptionStrategy.SHORT_CALL
                    : OptionStrategy.SHORT_PUT;
            return {
                id: "".concat(trade.symbol, "-").concat(Date.now()),
                symbol: trade.symbol.split(' ')[0],
                putCall: trade.putCall || 'CALL',
                strike: trade.strike || 0,
                expiry: trade.expiry || new Date(),
                quantity: quantity,
                premium: trade.tradePrice,
                strategy: strategy,
                openDate: new Date(trade.dateTime),
                commission: trade.commissionFee,
                notes: "Imported from IBKR - ".concat(trade.description)
            };
        });
    };
    /**
     * Get debug logs
     */
    ImprovedIBKRServiceAdapter.prototype.getDebugLogs = function () {
        return this.debugLogs;
    };
    /**
     * Log info message
     */
    ImprovedIBKRServiceAdapter.prototype.logInfo = function (message) {
        var timestamp = new Date().toISOString();
        var logEntry = "".concat(timestamp, ": ").concat(message);
        this.debugLogs.push(logEntry);
        console.log(logEntry);
    };
    /**
     * Log error message
     */
    ImprovedIBKRServiceAdapter.prototype.logError = function (message) {
        var timestamp = new Date().toISOString();
        var logEntry = "".concat(timestamp, ": ERROR: ").concat(message);
        this.debugLogs.push(logEntry);
        console.error(logEntry);
    };
    ImprovedIBKRServiceAdapter.prototype.log = function (message) {
        this.debugLogs.push(message);
        console.log("[ImprovedIBKRServiceAdapter] ".concat(message));
    };
    return ImprovedIBKRServiceAdapter;
}());
export { ImprovedIBKRServiceAdapter };
export default new ImprovedIBKRServiceAdapter();
