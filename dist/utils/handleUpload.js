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
import { parseTradeCSV } from './parseTradeCSV';
import { parsePositionCSV } from './parsePositionCSV';
import { isTradeCSV, isPositionCSV } from './parseTradeCSV';
import { insertNormalizedTrades, insertPositions, resetDatabase, getAggregatePL, getTradeCounts, getDailyPnlForReconciliation } from '../services/DatabaseService';
import { BrokerType } from '../types/trade';
import { reconcilePnlData } from '../services/ReconciliationService';
import Papa from 'papaparse';
import eventEmitter from './eventEmitter';
// Helper function to parse the authoritative P&L file (simple CSV: symbol,date,pnl)
var parseAuthoritativePnl = function (fileContent) {
    return new Promise(function (resolve, reject) {
        Papa.parse(fileContent, {
            header: false,
            skipEmptyLines: true,
            complete: function (results) {
                try {
                    var pnlData = results.data.map(function (row, index) {
                        if (row.length < 3) {
                            throw new Error("Row ".concat(index + 1, ": Expected 3 columns (symbol, date, pnl), got ").concat(row.length));
                        }
                        var pnl = parseFloat(row[2]);
                        if (isNaN(pnl)) {
                            throw new Error("Row ".concat(index + 1, ": Invalid P&L value '").concat(row[2], "'"));
                        }
                        // Basic date validation (YYYY-MM-DD format)
                        if (!/^\d{4}-\d{2}-\d{2}$/.test(row[1])) {
                            throw new Error("Row ".concat(index + 1, ": Invalid date format '").concat(row[1], "'. Expected YYYY-MM-DD."));
                        }
                        return {
                            symbol: row[0].trim(),
                            date: row[1].trim(),
                            pnl: pnl,
                        };
                    });
                    resolve(pnlData);
                }
                catch (error) {
                    reject(error);
                }
            },
            error: function (error) {
                reject(error);
            },
        });
    });
};
export var handleUpload = function (files, setTrades, setPositions, setSummary, setError, setLoading) { return __awaiter(void 0, void 0, void 0, function () {
    var reconciliationResult, dataChanged, primaryFile, authoritativeFile, sourceBData, fileContent, broker_1, positions, parsedTrades, normalizedTrades, insertResult, counts, pl, authFileContent, sourceAData, reconError_1, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                setLoading(true);
                setError(null);
                reconciliationResult = null;
                dataChanged = false;
                primaryFile = files[0];
                authoritativeFile = files.length > 1 ? files[1] : null;
                sourceBData = null;
                if (!primaryFile) {
                    setError('No file selected.');
                    setLoading(false);
                    return [2 /*return*/, null];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 19, 20, 21]);
                return [4 /*yield*/, resetDatabase()];
            case 2:
                _a.sent();
                console.log('Previous data cleared.');
                return [4 /*yield*/, primaryFile.text()];
            case 3:
                fileContent = _a.sent();
                broker_1 = BrokerType.IBKR;
                if (!isPositionCSV(fileContent)) return [3 /*break*/, 6];
                return [4 /*yield*/, parsePositionCSV(fileContent)];
            case 4:
                positions = _a.sent();
                return [4 /*yield*/, insertPositions(positions)];
            case 5:
                _a.sent();
                setPositions(positions);
                console.log("".concat(positions.length, " positions parsed and inserted."));
                setSummary({ trades: 0, positions: positions.length, open: 0, closed: 0, realizedPL: 0 });
                dataChanged = true; // Data was added
                return [3 /*break*/, 18];
            case 6:
                if (!isTradeCSV(fileContent)) return [3 /*break*/, 17];
                return [4 /*yield*/, parseTradeCSV(fileContent)];
            case 7:
                parsedTrades = _a.sent();
                console.log("".concat(parsedTrades.length, " trades parsed from CSV."));
                normalizedTrades = parsedTrades.map(function (trade) {
                    var _a, _b, _c, _d;
                    var raw = trade;
                    var quantity = Number(raw.quantity);
                    var tradePrice = Number(raw.price);
                    var proceedsRaw = Number((_a = raw.proceeds) !== null && _a !== void 0 ? _a : 0);
                    var commissionRaw = Number((_b = raw.commissionFee) !== null && _b !== void 0 ? _b : 0);
                    var feesRaw = Number((_c = raw.fees) !== null && _c !== void 0 ? _c : 0);
                    var netAmount = trade.isClose ? ((_d = trade.realizedPL) !== null && _d !== void 0 ? _d : 0) : 0;
                    var normalizedProceeds = proceedsRaw > 0 ? proceedsRaw : 0;
                    var normalizedCost = proceedsRaw < 0 ? Math.abs(proceedsRaw) : 0;
                    var normalizedCommission = Math.abs(commissionRaw);
                    var normalizedFees = Math.abs(feesRaw);
                    return {
                        id: raw.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)),
                        importTimestamp: new Date().toISOString(),
                        broker: broker_1,
                        accountId: raw.accountId || undefined,
                        tradeDate: (raw.tradeDate || (raw.dateTime ? raw.dateTime.split(' ')[0] : '')).replace(/,+$/, ''),
                        settleDate: raw.settleDate || undefined,
                        symbol: raw.symbol || '',
                        dateTime: raw.dateTime ? raw.dateTime.replace(/,+$/, '') : undefined,
                        description: raw.description || undefined,
                        assetCategory: raw.assetCategory || 'OPT',
                        action: raw.action || undefined,
                        quantity: quantity,
                        tradePrice: tradePrice,
                        currency: raw.currency || 'USD',
                        proceeds: normalizedProceeds,
                        cost: normalizedCost,
                        commission: normalizedCommission,
                        fees: normalizedFees,
                        netAmount: netAmount,
                        openCloseIndicator: trade.isClose ? 'C' : 'O',
                        costBasis: raw.costBasis || undefined,
                        optionSymbol: raw.optionSymbol || undefined,
                        expiryDate: raw.expiryDate || undefined,
                        strikePrice: raw.strikePrice || undefined,
                        putCall: raw.putCall,
                        multiplier: raw.multiplier || undefined,
                        orderID: raw.orderID || undefined,
                        executionID: raw.executionID || undefined,
                        notes: raw.notes || undefined,
                        rawRealizedPL: raw.rawRealizedPL || undefined,
                        rawCsvRow: raw.rawCsvRow || (Object.keys(raw).length > 0 ? Object.fromEntries(Object.entries(raw).map(function (_a) {
                            var k = _a[0], v = _a[1];
                            return [k, String(v)];
                        })) : undefined),
                    };
                });
                return [4 /*yield*/, insertNormalizedTrades(normalizedTrades)];
            case 8:
                insertResult = _a.sent();
                if (insertResult.successCount > 0) {
                    console.log("".concat(insertResult.successCount, " trades inserted into the database successfully."));
                    dataChanged = true; // Data was added
                }
                else {
                    console.warn('No trades were inserted. Possible errors occurred during insertion attempt.', insertResult.errors);
                    if (insertResult.errors.length > 0) {
                        setError("Failed to insert trades: ".concat(insertResult.errors.map(function (e) { return e.error; }).join(', ')));
                    }
                }
                setTrades(normalizedTrades);
                return [4 /*yield*/, getTradeCounts()];
            case 9:
                counts = _a.sent();
                return [4 /*yield*/, getAggregatePL()];
            case 10:
                pl = _a.sent();
                setSummary({ trades: normalizedTrades.length, positions: 0, open: counts.open, closed: counts.closed, realizedPL: pl.realizedPL });
                if (!authoritativeFile) return [3 /*break*/, 16];
                console.log('Authoritative reconciliation file detected. Starting reconciliation...');
                _a.label = 11;
            case 11:
                _a.trys.push([11, 15, , 16]);
                return [4 /*yield*/, authoritativeFile.text()];
            case 12:
                authFileContent = _a.sent();
                return [4 /*yield*/, parseAuthoritativePnl(authFileContent)];
            case 13:
                sourceBData = _a.sent();
                console.log("".concat(sourceBData.length, " records parsed from authoritative file."));
                return [4 /*yield*/, getDailyPnlForReconciliation()];
            case 14:
                sourceAData = _a.sent();
                console.log("".concat(sourceAData.length, " daily P&L records fetched from local DB for reconciliation."));
                if (sourceAData.length > 0 && sourceBData.length > 0) {
                    reconciliationResult = reconcilePnlData({ sourceA: sourceAData, sourceB: sourceBData });
                    console.log('Reconciliation Complete. Summary:', reconciliationResult.summary);
                }
                else {
                    console.warn('Skipping reconciliation: Insufficient data from one or both sources.');
                }
                return [3 /*break*/, 16];
            case 15:
                reconError_1 = _a.sent();
                console.error('Error during reconciliation process:', reconError_1);
                setError("Reconciliation failed: ".concat(reconError_1.message));
                return [3 /*break*/, 16];
            case 16:
                eventEmitter.dispatch('data-updated');
                return [3 /*break*/, 18];
            case 17: throw new Error('Uploaded file is not a recognized Trade or Position CSV format.');
            case 18:
                if (dataChanged) {
                    console.log('Data changed, dispatching data-updated event...');
                    eventEmitter.dispatch('data-updated');
                }
                return [3 /*break*/, 21];
            case 19:
                error_1 = _a.sent();
                console.error('Error during file upload and processing:', error_1);
                setError("Processing Error: ".concat(error_1.message));
                reconciliationResult = null;
                return [3 /*break*/, 21];
            case 20:
                setLoading(false);
                return [7 /*endfinally*/];
            case 21: return [2 /*return*/, reconciliationResult];
        }
    });
}); };
// Helper function to read file content (used by the handleUpload function above)
function readFileContent(file) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var reader = new FileReader();
                    reader.onload = function (event) {
                        if (event.target && event.target.result) {
                            resolve(event.target.result);
                        }
                        else {
                            reject(new Error('Failed to read file content.'));
                        }
                    };
                    reader.onerror = function (error) {
                        reject(error);
                    };
                    reader.readAsText(file);
                })];
        });
    });
}
