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
import { OptionService } from './OptionService';
import { IBKRActivityStatementParser } from './IBKRActivityStatementParser';
/**
 * Service for handling IBKR data imports
 */
var IBKRService = /** @class */ (function () {
    function IBKRService() {
    }
    /**
     * Parse IBKR CSV data and convert to internal models
     */
    IBKRService.parseIBKRData = function (csvData) {
        var parser = new IBKRActivityStatementParser(csvData);
        var result = parser.parse();
        return result;
    };
    /**
     * Import IBKR data and convert to internal models
     */
    IBKRService.importIBKRData = function (file) {
        return __awaiter(this, void 0, void 0, function () {
            var text, parser, result, _i, _a, trade, error_1, failedResult;
            var _this = this;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, file.text()];
                    case 1:
                        text = _c.sent();
                        parser = new IBKRActivityStatementParser(text);
                        return [4 /*yield*/, parser.parse()];
                    case 2:
                        result = _c.sent();
                        if (result.errors && result.errors.length > 0) {
                            console.error('Errors found during parsing:', result.errors);
                            return [2 /*return*/, result];
                        }
                        // Convert option positions to trades
                        if (Array.isArray(result.positions)) {
                            result.optionTrades = result.positions
                                .map(function (p) { return _this.convertIBKRPositionToTrade(p); })
                                .filter(function (trade) { return trade !== null; });
                        }
                        else {
                            result.optionTrades = [];
                        }
                        console.log("Converted ".concat(((_b = result.optionTrades) === null || _b === void 0 ? void 0 : _b.length) || 0, " option trades during import."));
                        // Persist trades (this logic might belong elsewhere, e.g., in the component)
                        if (result.optionTrades && result.account) {
                            for (_i = 0, _a = result.optionTrades; _i < _a.length; _i++) {
                                trade = _a[_i];
                                OptionService.addTrade(result.account.accountId, trade);
                            }
                        }
                        return [2 /*return*/, result];
                    case 3:
                        error_1 = _c.sent();
                        console.error('Error importing IBKR data:', error_1);
                        failedResult = {
                            success: false,
                            account: { accountId: '', accountName: '', accountType: '', baseCurrency: '', balance: 0 },
                            positions: [],
                            trades: [],
                            optionTrades: [],
                            errors: [error_1 instanceof Error ? error_1.message : String(error_1)]
                        };
                        return [2 /*return*/, failedResult];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Parse IBKR activity statement CSV
     */
    IBKRService.parseActivityStatement = function (csvContent) {
        return __awaiter(this, void 0, void 0, function () {
            var parser, result, error_2;
            var _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        console.log('[Service] Starting to parse activity statement...');
                        console.log('[Service] Content length:', csvContent.length);
                        console.log('[Service] First 100 chars:', csvContent.substring(0, 100));
                        _f.label = 1;
                    case 1:
                        _f.trys.push([1, 3, , 4]);
                        console.log('[Service] Creating parser instance...');
                        parser = new IBKRActivityStatementParser(csvContent);
                        console.log('[Service] Calling parser.parse()...');
                        return [4 /*yield*/, parser.parse()];
                    case 2:
                        result = _f.sent();
                        console.log('[Service] Parse completed. Result:', {
                            accountId: ((_a = result.account) === null || _a === void 0 ? void 0 : _a.accountId) || 'unknown',
                            accountName: ((_b = result.account) === null || _b === void 0 ? void 0 : _b.accountName) || 'unknown',
                            positionsCount: Array.isArray(result.positions) ? result.positions.length : 0,
                            tradesCount: ((_c = result.trades) === null || _c === void 0 ? void 0 : _c.length) || 0,
                            errors: ((_d = result.errors) === null || _d === void 0 ? void 0 : _d.length) || 0,
                            warnings: ((_e = result.warnings) === null || _e === void 0 ? void 0 : _e.length) || 0
                        });
                        if (result.errors && result.errors.length > 0) {
                            console.error('[Service] Parsing errors:', result.errors);
                            console.error('[Service] Parser debug state:', parser.getDebugState());
                        }
                        if (result.warnings && result.warnings.length > 0) {
                            console.warn('[Service] Parsing warnings:', result.warnings);
                        }
                        return [2 /*return*/, result];
                    case 3:
                        error_2 = _f.sent();
                        console.error('[Service] Error parsing IBKR activity statement', error_2);
                        throw new Error("Failed to parse IBKR activity statement: ".concat(error_2 instanceof Error ? error_2.message : String(error_2)));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Convert IBKR account to internal Account model
     */
    IBKRService.convertToAccount = function (ibkrAccount) {
        return {
            id: "IBKR-".concat(ibkrAccount.accountId),
            name: ibkrAccount.accountName,
            type: AccountType.IBKR,
            balance: ibkrAccount.balance,
            lastUpdated: ibkrAccount.lastUpdated || new Date(),
            created: new Date()
        };
    };
    /**
     * Convert IBKR option positions to internal OptionTrade models
     */
    IBKRService.convertToOptionTrades = function (parsedResult) {
        var _this = this;
        if (!Array.isArray(parsedResult.positions)) {
            return [];
        }
        return parsedResult.positions
            .filter(function (p) { return p.assetType === 'OPTION' || p.symbol === 'SPY'; })
            .map(function (p) {
            var trade = _this.convertIBKRPositionToTrade(p);
            if (trade) {
                var totalPL = (p.realizedPL || 0) + (p.unrealizedPL || 0);
                trade.notes = [
                    "Imported from IBKR: ".concat(p.symbol),
                    "Market Price: $".concat(p.marketPrice.toFixed(2)),
                    "Market Value: $".concat(p.marketValue.toFixed(2)),
                    "Average Cost: $".concat(p.averageCost.toFixed(2)),
                    "Realized P&L: $".concat((p.realizedPL || 0).toFixed(2)),
                    "Unrealized P&L: $".concat((p.unrealizedPL || 0).toFixed(2)),
                    "Total P&L: $".concat(totalPL.toFixed(2)),
                    "Last Updated: ".concat(p.lastUpdated.toLocaleString())
                ].join('\n');
                return trade;
            }
            return null;
        })
            .filter(function (trade) { return trade !== null; });
    };
    IBKRService.convertIBKRPositionToTrade = function (position) {
        var putCall = position.putCall || 'CALL';
        var strike = position.strike || 0;
        var expiry = position.expiry || new Date();
        var quantity = position.quantity;
        var premium = position.marketPrice || 0;
        console.log('Starting position conversion for:', position.symbol);
        // Handle SPY special case
        if (position.symbol === "SPY") {
            if (Math.abs(position.quantity) >= 100) {
                quantity = position.quantity > 0 ? 1 : -1;
                console.log('SPY special case: Quantity adjusted to', quantity);
            }
            if (premium > 100 && quantity !== 0) {
                premium = premium / 100 / Math.abs(quantity);
                console.log('SPY special case: Premium adjusted per share to', premium);
            }
            putCall = 'CALL'; // Assume SPY is CALL
        }
        // Parse standard OCC options if not already done
        else if (position.assetType === 'OPTION') {
            if (position.putCall === undefined || position.strike === undefined) {
                var occPattern = /^([A-Z]+)\s+(\d{6})([CP])(\d{8})$/;
                var match = position.symbol.match(occPattern);
                if (match) {
                    var dateStr = match[2], pcStr = match[3], strikeStr = match[4];
                    putCall = pcStr === 'C' ? 'CALL' : 'PUT';
                    strike = parseInt(strikeStr) / 1000;
                    var year = parseInt(dateStr.substring(0, 2)) + 2000;
                    var month = parseInt(dateStr.substring(2, 4)) - 1;
                    var day = parseInt(dateStr.substring(4, 6));
                    expiry = new Date(Date.UTC(year, month, day));
                    console.log('Parsed OCC from symbol:', { putCall: putCall, strike: strike, expiry: expiry.toISOString() });
                }
                else {
                    console.warn('Could not parse OCC symbol, using existing/default values:', position.symbol);
                }
            }
            // Convert quantity if it looks like shares
            if (Math.abs(position.quantity) >= 100) {
                console.log('Adjusting option quantity from shares to contracts:', position.quantity);
                quantity = position.quantity / 100;
            }
        }
        // Skip if it doesn't look like an option after parsing
        if (position.assetType !== 'OPTION' && position.symbol !== 'SPY') {
            console.log('Skipping non-option position:', position.symbol);
            return null;
        }
        // Determine strategy
        var strategy = quantity > 0
            ? (putCall === 'CALL' ? OptionStrategy.LONG_CALL : OptionStrategy.LONG_PUT)
            : (putCall === 'CALL' ? OptionStrategy.SHORT_CALL : OptionStrategy.SHORT_PUT);
        console.log('Final converted trade values:', { symbol: position.symbol, putCall: putCall, strike: strike, expiry: expiry.toISOString(), quantity: quantity, premium: premium, strategy: strategy, commission: position.commission || 0 });
        return {
            id: "".concat(position.symbol, "-").concat(Date.now()),
            symbol: position.symbol.split(' ')[0] || position.symbol,
            putCall: putCall,
            strike: strike,
            expiry: expiry,
            quantity: quantity,
            premium: premium,
            openDate: position.lastUpdated || new Date(),
            strategy: strategy,
            commission: position.commission || 0,
            notes: "Imported from IBKR - ".concat(position.symbol)
        };
    };
    return IBKRService;
}());
export { IBKRService };
