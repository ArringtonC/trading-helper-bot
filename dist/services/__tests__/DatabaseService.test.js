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
import { initDatabase, insertNormalizedTrades, getTrades, resetDatabase,
// getDb // Not typically exported for direct use in tests, but useful for direct manipulation if needed
 } from '../DatabaseService';
import { BrokerType } from '../../types/trade';
import { v4 as uuidv4 } from 'uuid';
// Mock sql.js a bit more thoroughly if direct db interaction for assertions is needed
// For now, we'll mostly rely on the service's own methods to verify state after actions.
describe('DatabaseService - Normalized Trades', function () {
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Reset and re-initialize the database before each test to ensure a clean state.
                // The internal dbPromise in DatabaseService needs to be reset for this to work across tests.
                // This is a bit of a hack; ideally, the DatabaseService would provide a more robust test setup method.
                // For now, we call resetDatabase which internally nullifies dbPromise.
                return [4 /*yield*/, resetDatabase()];
                case 1:
                    // Reset and re-initialize the database before each test to ensure a clean state.
                    // The internal dbPromise in DatabaseService needs to be reset for this to work across tests.
                    // This is a bit of a hack; ideally, the DatabaseService would provide a more robust test setup method.
                    // For now, we call resetDatabase which internally nullifies dbPromise.
                    _a.sent();
                    return [4 /*yield*/, initDatabase()];
                case 2:
                    _a.sent(); // Ensure it's fresh for the next test
                    return [2 /*return*/];
            }
        });
    }); });
    var createSampleTrade = function (id, symbol, overrides) {
        if (overrides === void 0) { overrides = {}; }
        return (__assign({ id: id, importTimestamp: new Date().toISOString(), broker: BrokerType.IBKR, tradeDate: '2023-11-01', symbol: symbol, assetCategory: 'STK', quantity: 10, tradePrice: 100, currency: 'USD', netAmount: -1000, rawCsvRow: { 'SomeHeader': 'SomeValue' } }, overrides));
    };
    it('should insert a single normalized trade successfully', function () { return __awaiter(void 0, void 0, void 0, function () {
        var trade1, result, tradesInDb;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    trade1 = createSampleTrade(uuidv4(), 'AAPL');
                    return [4 /*yield*/, insertNormalizedTrades([trade1])];
                case 1:
                    result = _a.sent();
                    expect(result.successCount).toBe(1);
                    expect(result.errors.length).toBe(0);
                    return [4 /*yield*/, getTrades()];
                case 2:
                    tradesInDb = _a.sent();
                    expect(tradesInDb.length).toBe(1);
                    expect(tradesInDb[0].id).toBe(trade1.id);
                    expect(tradesInDb[0].symbol).toBe('AAPL');
                    expect(tradesInDb[0].assetCategory).toBe('STK');
                    return [2 /*return*/];
            }
        });
    }); });
    it('should insert multiple normalized trades successfully in a transaction', function () { return __awaiter(void 0, void 0, void 0, function () {
        var trade1, trade2, tradesToInsert, result, tradesInDb;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    trade1 = createSampleTrade(uuidv4(), 'MSFT');
                    trade2 = createSampleTrade(uuidv4(), 'GOOG', { quantity: 5, tradePrice: 1000, netAmount: -5000 });
                    tradesToInsert = [trade1, trade2];
                    return [4 /*yield*/, insertNormalizedTrades(tradesToInsert)];
                case 1:
                    result = _a.sent();
                    expect(result.successCount).toBe(2);
                    expect(result.errors.length).toBe(0);
                    return [4 /*yield*/, getTrades()];
                case 2:
                    tradesInDb = _a.sent();
                    expect(tradesInDb.length).toBe(2);
                    // Verify order might be tricky if not explicitly ordered by insert time, but check presence
                    expect(tradesInDb.find(function (t) { return t.id === trade1.id; })).toBeDefined();
                    expect(tradesInDb.find(function (t) { return t.id === trade2.id; })).toBeDefined();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should return successCount 0 and no errors for an empty trades array', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result, tradesInDb;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, insertNormalizedTrades([])];
                case 1:
                    result = _a.sent();
                    expect(result.successCount).toBe(0);
                    expect(result.errors.length).toBe(0);
                    return [4 /*yield*/, getTrades()];
                case 2:
                    tradesInDb = _a.sent();
                    expect(tradesInDb.length).toBe(0);
                    return [2 /*return*/];
            }
        });
    }); });
    // Note: Testing actual rollback due to db.run() error is hard without deeper mocking of sql.js internals.
    // The current implementation of insertNormalizedTrades logs errors and returns them,
    // and the transaction commit/rollback logic is there. 
    // We can test the error reporting part.
    it('should report errors and rollback if a trade has a UNIQUE constraint violation', function () { return __awaiter(void 0, void 0, void 0, function () {
        var tradeId, trade1, trade2_duplicateId, trade3, tradesInDb, result, specificError;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tradeId = uuidv4();
                    trade1 = createSampleTrade(tradeId, 'TSLA');
                    trade2_duplicateId = createSampleTrade(tradeId, 'NVDA');
                    trade3 = createSampleTrade(uuidv4(), 'AMD');
                    return [4 /*yield*/, insertNormalizedTrades([trade1])];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, getTrades()];
                case 2:
                    tradesInDb = _a.sent();
                    expect(tradesInDb.length).toBe(1);
                    return [4 /*yield*/, insertNormalizedTrades([trade2_duplicateId, trade3])];
                case 3:
                    result = _a.sent();
                    expect(result.successCount).toBe(0);
                    expect(result.errors.length).toBeGreaterThan(0);
                    specificError = result.errors.find(function (e) { return e.tradeId === tradeId; });
                    expect(specificError).toBeDefined();
                    expect(typeof (specificError === null || specificError === void 0 ? void 0 : specificError.error)).toBe('string');
                    expect(specificError === null || specificError === void 0 ? void 0 : specificError.error.toLowerCase()).toContain('unique constraint failed');
                    return [4 /*yield*/, getTrades()];
                case 4:
                    tradesInDb = _a.sent();
                    expect(tradesInDb.length).toBe(1);
                    expect(tradesInDb[0].id).toBe(trade1.id);
                    return [2 /*return*/];
            }
        });
    }); });
    it('should insert trades with all optional fields correctly', function () { return __awaiter(void 0, void 0, void 0, function () {
        var tradeWithAllFields, result, tradesInDb, t;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tradeWithAllFields = {
                        id: uuidv4(),
                        importTimestamp: new Date().toISOString(),
                        broker: BrokerType.Schwab,
                        accountId: 'ACC123',
                        tradeDate: '2023-12-01',
                        settleDate: '2023-12-03',
                        symbol: 'SPY',
                        description: 'SPDR S&P 500 ETF TRUST',
                        assetCategory: 'OPT',
                        action: 'Buy to Open',
                        quantity: 5,
                        tradePrice: 450.25,
                        currency: 'USD',
                        proceeds: null,
                        cost: 2251.25,
                        commission: -2.50,
                        fees: -0.15,
                        netAmount: -2253.90,
                        openCloseIndicator: 'O',
                        costBasis: 2253.90,
                        optionSymbol: 'SPY240119C00450000',
                        expiryDate: '2024-01-19',
                        strikePrice: 450,
                        putCall: 'C',
                        multiplier: 100,
                        orderID: 'SCHWAB_ORDER_1',
                        executionID: 'SCHWAB_EXEC_1',
                        notes: 'Assignment related trade',
                        rawCsvRow: { 'OriginalHeader': 'OriginalValue' }
                    };
                    return [4 /*yield*/, insertNormalizedTrades([tradeWithAllFields])];
                case 1:
                    result = _a.sent();
                    expect(result.successCount).toBe(1);
                    expect(result.errors.length).toBe(0);
                    return [4 /*yield*/, getTrades()];
                case 2:
                    tradesInDb = _a.sent();
                    expect(tradesInDb.length).toBe(1);
                    t = tradesInDb[0];
                    expect(t.id).toBe(tradeWithAllFields.id);
                    expect(t.broker).toBe(BrokerType.Schwab);
                    expect(t.proceeds).toBeNull();
                    expect(t.strikePrice).toBe(450);
                    expect(t.assetCategory).toBe('OPT');
                    expect(t.openCloseIndicator).toBe('O');
                    expect(t.putCall).toBe('C');
                    return [2 /*return*/];
            }
        });
    }); });
});
