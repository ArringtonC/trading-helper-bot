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
import initSqlJs from 'sql.js';
var SQL;
// Singleton promise for SQL.js initialization
var sqlJsPromise = null;
var initializeSqlJs = function () {
    if (!sqlJsPromise) {
        sqlJsPromise = initSqlJs({ locateFile: function (file) { return "/sql-wasm.wasm"; } });
    }
    return sqlJsPromise;
};
// Singleton promise for Database initialization
var dbPromise = null;
export var getDb = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        console.log('[DEBUG getDb] Attempting to get DB instance...'); // Log at start of getDb
        if (!dbPromise) {
            console.log('[DEBUG getDb] dbPromise is null, initializing...'); // Log if initializing
            dbPromise = initializeSqlJs().then(function (SQLModule) {
                SQL = SQLModule;
                console.log('[DEBUG getDb] SQL.js module initialized. Creating new DB.'); // Log after SQL.js init
                var existingDb = new SQL.Database();
                console.log('[DEBUG getDb] New DB created. Running schema setup...'); // Log before schema run
                // Create schema if it doesn't exist (idempotent)
                existingDb.run("\n    CREATE TABLE IF NOT EXISTS trades (\n          id TEXT PRIMARY KEY,\n          importTimestamp TEXT NOT NULL,\n          broker TEXT NOT NULL,\n          accountId TEXT,\n          tradeDate TEXT NOT NULL,\n          settleDate TEXT,\n          symbol TEXT NOT NULL,\n      dateTime TEXT,\n          description TEXT,\n          assetCategory TEXT NOT NULL,\n          action TEXT,\n          quantity REAL NOT NULL, \n          tradePrice REAL NOT NULL,\n          currency TEXT NOT NULL,\n      proceeds REAL,\n          cost REAL,\n          commission REAL,\n          fees REAL,\n          netAmount REAL NOT NULL,\n          openCloseIndicator TEXT,\n          costBasis REAL,\n          optionSymbol TEXT,\n          expiryDate TEXT,\n          strikePrice REAL,\n          putCall TEXT,\n          multiplier REAL,\n          orderID TEXT,\n          executionID TEXT,\n          notes TEXT,\n          rawCsvRowJson TEXT,\n          \n          -- Version 2 Fields (added for ML analysis)\n          openDelta REAL,\n          openGamma REAL,\n          openTheta REAL,\n          openVega REAL,\n          openRho REAL,\n          closeDelta REAL,\n          closeGamma REAL,\n          closeTheta REAL,\n          closeVega REAL,\n          closeRho REAL,\n          currentDelta REAL,\n          currentGamma REAL,\n          currentTheta REAL,\n          currentVega REAL,\n          currentRho REAL,\n          underlyingPriceAtOpen REAL,\n          underlyingPriceAtClose REAL,\n          ivAtOpen REAL,\n          ivAtClose REAL,\n          hvAtOpen REAL,\n          hvAtClose REAL,\n          vixAtOpen REAL,\n          vixAtClose REAL,\n          marketRegime TEXT,\n          identifiedPattern TEXT,\n          sizingRecommendation REAL,\n          predictionConfidence REAL\n    );\n    CREATE TABLE IF NOT EXISTS summary (\n      id INTEGER PRIMARY KEY,\n      cumulativePL REAL\n    );\n    CREATE TABLE IF NOT EXISTS errors (\n      id INTEGER PRIMARY KEY AUTOINCREMENT,\n      lineNumber INTEGER,\n      message TEXT\n    );\n        CREATE TABLE IF NOT EXISTS positions (\n          id INTEGER PRIMARY KEY AUTOINCREMENT,\n          symbol TEXT,\n          description TEXT,\n          quantity INTEGER,\n          price REAL,\n          marketValue REAL,\n          costBasis REAL,\n          gainDollar REAL,\n          gainPercent REAL\n        );\n        \n    -- Version 2 Table (added for ML analysis)\n    CREATE TABLE IF NOT EXISTS ml_analysis_results (\n        result_id TEXT PRIMARY KEY,\n        trade_id TEXT NOT NULL,\n        analysis_timestamp TEXT NOT NULL,\n        model_name TEXT NOT NULL,\n        market_regime TEXT,\n        identified_pattern TEXT,\n        sizing_recommendation REAL,\n        prediction_confidence REAL,\n        FOREIGN KEY (trade_id) REFERENCES trades(id)\n        );\n      ");
                console.log('[DEBUG getDb] Schema setup complete. Checking migrations...'); // Log after schema run
                // Run migrations if needed
                runMigrations(existingDb);
                console.log('[DEBUG getDb] Migrations checked/run. Returning DB.');
                return existingDb;
            }).catch(function (err) {
                console.error('[ERROR in getDb initialization]:', err);
                throw err;
            });
        }
        else {
            console.log('[DEBUG getDb] dbPromise exists, returning promise.'); // Log if returning existing promise
        }
        return [2 /*return*/, dbPromise];
    });
}); };
export function initDatabase() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getDb()];
                case 1:
                    _a.sent(); // Ensures database is initialized
                    return [2 /*return*/];
            }
        });
    });
}
export function insertSummary(cumulativePL) {
    return __awaiter(this, void 0, void 0, function () {
        var currentDb;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getDb()];
                case 1:
                    currentDb = _a.sent();
                    currentDb.run('DELETE FROM summary;');
                    currentDb.run('INSERT INTO summary (id, cumulativePL) VALUES (1, ?);', [cumulativePL]);
                    return [2 /*return*/];
            }
        });
    });
}
export function getTrades() {
    return __awaiter(this, void 0, void 0, function () {
        var currentDb, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getDb()];
                case 1:
                    currentDb = _a.sent();
                    res = currentDb.exec("SELECT id, tradeDate, broker, symbol, assetCategory, quantity, tradePrice, currency, netAmount, openCloseIndicator, commission, fees, proceeds, cost, optionSymbol, expiryDate, strikePrice, putCall, multiplier FROM trades ORDER BY importTimestamp DESC");
                    console.log('[DEBUG DatabaseService.getTrades] Raw query result (res):', JSON.stringify(res));
                    if (!res[0] || !res[0].values || res[0].values.length === 0) {
                        console.log('[DEBUG DatabaseService.getTrades] No trades found in DB or res[0].values is empty, returning [].');
                        return [2 /*return*/, []];
                    }
                    console.log('[DEBUG DatabaseService.getTrades] Found trades, mapping values. Number of rows:', res[0].values.length);
                    return [2 /*return*/, res[0].values.map(function (r) { return ({
                            id: r[0],
                            tradeDate: r[1],
                            broker: r[2],
                            symbol: r[3],
                            assetCategory: r[4],
                            quantity: r[5],
                            tradePrice: r[6],
                            currency: r[7],
                            netAmount: r[8],
                            openCloseIndicator: r[9],
                            commission: r[10],
                            fees: r[11],
                            proceeds: r[12],
                            cost: r[13],
                            optionSymbol: r[14],
                            expiryDate: r[15],
                            strikePrice: r[16],
                            putCall: r[17],
                            multiplier: r[18],
                        }); })];
            }
        });
    });
}
export function getSummary() {
    return __awaiter(this, void 0, void 0, function () {
        var currentDb, res;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, getDb()];
                case 1:
                    currentDb = _c.sent();
                    res = currentDb.exec('SELECT cumulativePL FROM summary');
                    return [2 /*return*/, (_b = (_a = res[0]) === null || _a === void 0 ? void 0 : _a.values[0][0]) !== null && _b !== void 0 ? _b : 0];
            }
        });
    });
}
export function getAggregatePL() {
    return __awaiter(this, void 0, void 0, function () {
        var currentDb, res, realizedPL;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, getDb()];
                case 1:
                    currentDb = _c.sent();
                    res = currentDb.exec("SELECT COALESCE(SUM(netAmount), 0) AS realizedPL FROM trades WHERE openCloseIndicator = 'C'");
                    realizedPL = Number((_b = (_a = res[0]) === null || _a === void 0 ? void 0 : _a.values[0][0]) !== null && _b !== void 0 ? _b : 0);
                    return [2 /*return*/, { realizedPL: realizedPL }];
            }
        });
    });
}
export function resetDatabase() {
    return __awaiter(this, void 0, void 0, function () {
        var currentDb;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getDb()];
                case 1:
                    currentDb = _a.sent();
                    currentDb.run('DROP TABLE IF EXISTS trades;');
                    currentDb.run('DROP TABLE IF EXISTS summary;');
                    currentDb.run('DROP TABLE IF EXISTS errors;');
                    currentDb.run('DROP TABLE IF EXISTS positions;');
                    // Re-initialize schema after dropping tables
                    dbPromise = null; // Force re-initialization on next getDb call
                    return [4 /*yield*/, initDatabase()];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
export function insertPosition(position) {
    return __awaiter(this, void 0, void 0, function () {
        var currentDb, _a, symbol, _b, description, _c, quantity, _d, price, _e, marketValue, _f, costBasis, _g, gainDollar, _h, gainPercent, stmt;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0: return [4 /*yield*/, getDb()];
                case 1:
                    currentDb = _j.sent();
                    _a = position.symbol, symbol = _a === void 0 ? '' : _a, _b = position.description, description = _b === void 0 ? '' : _b, _c = position.quantity, quantity = _c === void 0 ? 0 : _c, _d = position.price, price = _d === void 0 ? 0 : _d, _e = position.marketValue, marketValue = _e === void 0 ? 0 : _e, _f = position.costBasis, costBasis = _f === void 0 ? 0 : _f, _g = position.gainDollar, gainDollar = _g === void 0 ? 0 : _g, _h = position.gainPercent, gainPercent = _h === void 0 ? 0 : _h;
                    stmt = currentDb.prepare("\n    INSERT INTO positions (\n      symbol,\n      description,\n      quantity,\n      price,\n      marketValue,\n      costBasis,\n      gainDollar,\n      gainPercent\n    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)\n  ");
                    stmt.run([
                        symbol,
                        description,
                        quantity,
                        price,
                        marketValue,
                        costBasis,
                        gainDollar,
                        gainPercent,
                    ]);
                    stmt.free();
                    return [2 /*return*/];
            }
        });
    });
}
export function getPositions() {
    return __awaiter(this, void 0, void 0, function () {
        var currentDb, res;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, getDb()];
                case 1:
                    currentDb = _b.sent();
                    res = currentDb.exec('SELECT * FROM positions ORDER BY symbol ASC');
                    return [2 /*return*/, ((_a = res[0]) === null || _a === void 0 ? void 0 : _a.values.map(function (row) { return ({
                            id: row[0],
                            symbol: row[1],
                            description: row[2],
                            quantity: row[3],
                            price: row[4],
                            marketValue: row[5],
                            costBasis: row[6],
                            gainDollar: row[7],
                            gainPercent: row[8]
                        }); })) || []];
            }
        });
    });
}
// New method for counting open and closed trades
export function getTradeCounts() {
    return __awaiter(this, void 0, void 0, function () {
        var currentDb, results, openCount, closedCount;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, getDb()];
                case 1:
                    currentDb = _c.sent();
                    results = currentDb.exec("SELECT SUM(CASE WHEN openCloseIndicator = 'O' THEN 1 ELSE 0 END) as openCount, SUM(CASE WHEN openCloseIndicator = 'C' THEN 1 ELSE 0 END) as closedCount FROM trades");
                    if (results.length > 0 && results[0].values.length > 0) {
                        openCount = Number((_a = results[0].values[0][0]) !== null && _a !== void 0 ? _a : 0);
                        closedCount = Number((_b = results[0].values[0][1]) !== null && _b !== void 0 ? _b : 0);
                        return [2 /*return*/, { open: openCount, closed: closedCount }];
                    }
                    return [2 /*return*/, { open: 0, closed: 0 }];
            }
        });
    });
}
// New method for bulk inserting normalized trades
export function insertNormalizedTrades(trades) {
    return __awaiter(this, void 0, void 0, function () {
        var currentDb, successCount, insertionErrors, stmt, _i, trades_1, trade, tradeOpenCloseIndicator;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!trades || trades.length === 0) {
                        return [2 /*return*/, { successCount: 0, errors: [] }];
                    }
                    // *** DEBUG LOG: First trade object received by insertNormalizedTrades ***
                    if (trades.length > 0) {
                        console.log('[DEBUG] First trade object received by insertNormalizedTrades:', trades[0]);
                    }
                    return [4 /*yield*/, getDb()];
                case 1:
                    currentDb = _a.sent();
                    successCount = 0;
                    insertionErrors = [];
                    currentDb.exec("BEGIN TRANSACTION;");
                    try {
                        stmt = currentDb.prepare("\n      INSERT INTO trades (\n          id, importTimestamp, broker, accountId, tradeDate, settleDate, symbol, description, assetCategory,\n          action, quantity, tradePrice, currency, proceeds, cost, commission, fees, netAmount,\n          openCloseIndicator, costBasis, optionSymbol, expiryDate, strikePrice, putCall, multiplier,\n          orderID, executionID, notes, rawCsvRowJson\n      ) VALUES (\n          ?, ?, ?, ?, ?, ?, ?, ?, ?,\n          ?, ?, ?, ?, ?, ?, ?, ?, ?,\n          ?, ?, ?, ?, ?, ?, ?,\n          ?, ?, ?, ?\n      );\n    ");
                        for (_i = 0, trades_1 = trades; _i < trades_1.length; _i++) {
                            trade = trades_1[_i];
                            try {
                                console.log('Inserting trade openCloseIndicator:', trade.openCloseIndicator);
                                tradeOpenCloseIndicator = trade.openCloseIndicator;
                                stmt.run([
                                    trade.id,
                                    trade.importTimestamp,
                                    trade.broker,
                                    trade.accountId || null,
                                    trade.tradeDate,
                                    trade.settleDate || null,
                                    trade.symbol,
                                    trade.description || null,
                                    trade.assetCategory,
                                    trade.action || null,
                                    trade.quantity,
                                    trade.tradePrice,
                                    trade.currency,
                                    trade.proceeds === undefined ? null : trade.proceeds, // Handle undefined for REAL columns
                                    trade.cost === undefined ? null : trade.cost,
                                    trade.commission === undefined ? null : trade.commission,
                                    trade.fees === undefined ? null : trade.fees,
                                    trade.netAmount,
                                    tradeOpenCloseIndicator || null, // Use the local variable here
                                    trade.costBasis === undefined ? null : trade.costBasis,
                                    trade.optionSymbol || null,
                                    trade.expiryDate || null,
                                    trade.strikePrice === undefined ? null : trade.strikePrice,
                                    trade.putCall || null,
                                    trade.multiplier === undefined ? null : trade.multiplier,
                                    trade.orderID || null,
                                    trade.executionID || null,
                                    trade.notes || null,
                                    JSON.stringify(trade.rawCsvRow || {})
                                ]);
                                successCount++;
                            }
                            catch (e) {
                                insertionErrors.push({ tradeId: trade.id, error: e.message });
                            }
                        }
                        stmt.free();
                        if (insertionErrors.length > 0 && successCount < trades.length) {
                            // If there were any errors during individual inserts, roll back the entire transaction
                            // This makes the operation atomic for the batch.
                            currentDb.exec("ROLLBACK;");
                            console.error('Rolled back transaction due to errors inserting trades:', insertionErrors);
                            return [2 /*return*/, { successCount: 0, errors: insertionErrors }]; // Report 0 success if rollback occurs
                        }
                        else {
                            currentDb.exec("COMMIT;");
                        }
                    }
                    catch (e) {
                        currentDb.exec("ROLLBACK;");
                        // This catch is for errors in BEGIN, COMMIT, PREPARE, or unhandled errors in loop
                        console.error('Transaction failed, rolled back:', e);
                        return [2 /*return*/, { successCount: 0, errors: [{ tradeId: undefined, error: e.message }] }];
                    }
                    return [2 /*return*/, { successCount: successCount, errors: insertionErrors }];
            }
        });
    });
}
// New method for getting only closed trades
export function getClosedTrades() {
    return __awaiter(this, void 0, void 0, function () {
        var currentDb, results;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getDb()];
                case 1:
                    currentDb = _a.sent();
                    results = currentDb.exec("SELECT id, importTimestamp, broker, accountId, tradeDate, settleDate, symbol, dateTime, description, assetCategory, action, quantity, tradePrice, currency, proceeds, cost, commission, fees, netAmount, openCloseIndicator, costBasis, optionSymbol, expiryDate, strikePrice, putCall, multiplier, orderID, executionID, notes, rawCsvRowJson FROM trades WHERE openCloseIndicator = 'C'");
                    if (!results[0] || !results[0].values) {
                        return [2 /*return*/, []];
                    }
                    return [2 /*return*/, results[0].values.map(function (row) { return ({
                            id: row[0],
                            importTimestamp: row[1],
                            broker: row[2],
                            accountId: row[3],
                            tradeDate: row[4],
                            settleDate: row[5],
                            symbol: row[6],
                            dateTime: row[7],
                            description: row[8],
                            assetCategory: row[9],
                            action: row[10],
                            quantity: row[11],
                            tradePrice: row[12],
                            currency: row[13],
                            proceeds: row[14],
                            cost: row[15],
                            commission: row[16],
                            fees: row[17],
                            netAmount: row[18],
                            openCloseIndicator: row[19],
                            costBasis: row[20],
                            optionSymbol: row[21],
                            expiryDate: row[22],
                            strikePrice: row[23],
                            putCall: row[24],
                            multiplier: row[25],
                            orderID: row[26],
                            executionID: row[27],
                            notes: row[28],
                            // Corrected mapping to use the value from rawCsvRowJson (index 29)
                            rawCsvRow: row[29] ? JSON.parse(row[29]) : undefined,
                        }); })];
            }
        });
    });
}
export function getHeatmapData() {
    return __awaiter(this, void 0, void 0, function () {
        var currentDb, query, results;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getDb()];
                case 1:
                    currentDb = _a.sent();
                    query = "SELECT\n      symbol,\n      SUBSTR(tradeDate, 1, 10) as tradeDay, \n      SUM(netAmount) as dailyPnl \n    FROM trades\n    WHERE netAmount IS NOT NULL AND openCloseIndicator = 'C'\n    GROUP BY symbol, SUBSTR(tradeDate, 1, 10) \n    ORDER BY symbol, SUBSTR(tradeDate, 1, 10)";
                    results = currentDb.exec(query);
                    if (!results[0] || !results[0].values) {
                        return [2 /*return*/, []];
                    }
                    return [2 /*return*/, results[0].values.map(function (row) { return ({
                            symbol: row[0],
                            date: row[1],
                            pnl: Number(row[2]) || 0,
                        }); })];
            }
        });
    });
}
export function getDailyPnlForReconciliation() {
    return __awaiter(this, void 0, void 0, function () {
        var currentDb, query, results, mappedData, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('[DEBUG getDailyPnlForReconciliation] Function called.');
                    currentDb = null;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, getDb()];
                case 2:
                    currentDb = _a.sent();
                    console.log('[DEBUG getDailyPnlForReconciliation] DB instance obtained. Executing SQL query...');
                    query = "SELECT\n      symbol,\n        SUBSTR(tradeDate, 1, 10) as date,\n      SUM(netAmount) as pnl\n    FROM trades\n    WHERE netAmount IS NOT NULL AND openCloseIndicator = 'C'\n      GROUP BY symbol, SUBSTR(tradeDate, 1, 10)\n      ORDER BY symbol, SUBSTR(tradeDate, 1, 10)";
                    results = currentDb.exec(query);
                    console.log('[DEBUG getDailyPnlForReconciliation] SQL query executed successfully.');
                    if (!results || results.length === 0 || !results[0].values) {
                        console.log('[DEBUG getDailyPnlForReconciliation] No results found, returning empty array.');
                        return [2 /*return*/, []];
                    }
                    console.log("[DEBUG getDailyPnlForReconciliation] Mapping ".concat(results[0].values.length, " rows..."));
                    mappedData = results[0].values.map(function (row) { return ({
                        symbol: String(row[0]),
                        date: String(row[1]),
                        pnl: Number(row[2]),
                    }); });
                    console.log('[DEBUG getDailyPnlForReconciliation] Mapping complete.');
                    return [2 /*return*/, mappedData];
                case 3:
                    error_1 = _a.sent();
                    console.error('[ERROR in getDailyPnlForReconciliation]:', error_1);
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
// New function to insert multiple positions
export function insertPositions(positions) {
    return __awaiter(this, void 0, void 0, function () {
        var currentDb, _i, positions_1, position, query, stmt;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!positions || positions.length === 0) {
                        return [2 /*return*/]; // Early return if empty
                    }
                    return [4 /*yield*/, getDb()];
                case 1:
                    currentDb = _a.sent();
                    currentDb.exec("BEGIN TRANSACTION;");
                    try {
                        for (_i = 0, positions_1 = positions; _i < positions_1.length; _i++) {
                            position = positions_1[_i];
                            query = "\n        INSERT INTO positions (\n          symbol,\n          description,\n          quantity,\n          price,\n          marketValue,\n          costBasis,\n          gainDollar,\n          gainPercent\n        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)\n      ";
                            stmt = currentDb.prepare(query);
                            stmt.run([
                                position.symbol || '',
                                position.description || '',
                                position.quantity || 0,
                                position.price || 0,
                                position.marketValue || 0,
                                position.costBasis || 0,
                                position.gainDollar || 0,
                                position.gainPercent || 0,
                            ]);
                            stmt.free();
                        }
                        currentDb.exec("COMMIT;");
                    }
                    catch (e) {
                        currentDb.exec("ROLLBACK;");
                        console.error("Error inserting positions, rolled back:", e);
                        throw e; // Re-throw the error after rollback
                    }
                    return [2 /*return*/];
            }
        });
    });
}
export var getOverallPnlSummary = function () { return __awaiter(void 0, void 0, void 0, function () {
    var db, totalPnl, lastDayPnl, lastDayDate, closedTrades;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, getDb()];
            case 1:
                db = _b.sent();
                totalPnl = 0;
                lastDayPnl = 0;
                lastDayDate = undefined;
                return [4 /*yield*/, getClosedTrades()];
            case 2:
                closedTrades = _b.sent();
                closedTrades.forEach(function (trade) {
                    totalPnl += trade.netAmount || 0;
                });
                // Find the most recent date with closed trades for Daily P&L
                if (closedTrades.length > 0) {
                    // Sort by tradeDate descending to find the latest date
                    closedTrades.sort(function (a, b) {
                        var dateA = a.tradeDate ? new Date(a.tradeDate.substring(0, 10)).getTime() : 0;
                        var dateB = b.tradeDate ? new Date(b.tradeDate.substring(0, 10)).getTime() : 0;
                        return dateB - dateA;
                    });
                    lastDayDate = (_a = closedTrades[0].tradeDate) === null || _a === void 0 ? void 0 : _a.substring(0, 10);
                    if (lastDayDate) {
                        closedTrades.forEach(function (trade) {
                            var _a;
                            if (((_a = trade.tradeDate) === null || _a === void 0 ? void 0 : _a.substring(0, 10)) === lastDayDate) {
                                lastDayPnl += trade.netAmount || 0;
                            }
                        });
                    }
                }
                // Add logging before return
                console.log('[DEBUG DatabaseService.getOverallPnlSummary] Calculated values:', {
                    totalPnl: totalPnl,
                    lastDayPnl: lastDayPnl,
                    lastDayDate: lastDayDate,
                    numberOfClosedTrades: closedTrades.length
                });
                // Placeholder for percentages - realistic calculation requires historical portfolio value or initial investment
                // For now, we'll return 0 for percentages. This can be enhanced later.
                return [2 /*return*/, {
                        totalPnl: totalPnl,
                        totalPnlPercent: 0, // Placeholder
                        lastDayPnl: lastDayPnl,
                        lastDayPnlPercent: 0, // Placeholder
                        lastDayDate: lastDayDate,
                    }];
        }
    });
}); };
/**
 * Fetches daily realized P&L data and structures it for the heatmap.
 * Aggregates P&L by date for all closed trades and formats into a 2D array
 * where rows are weeks and columns are days (Mon-Sun).
 * Assumes dates are in YYYY-MM-DD format.
 * @returns Promise<number[][]> A 2D array suitable for the heatmap component.
 */
export function getDailyPnlHeatmapData() {
    return __awaiter(this, void 0, void 0, function () {
        var trades, dailyPnlMap, _i, trades_2, trade, date, pnl, dailyPnlArray, endDate, startDate, startDayOfWeek, numberOfWeeks, heatmap, currentDate, week, day, dateString, pnl, finalHeatmap;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getClosedTrades()];
                case 1:
                    trades = _a.sent();
                    dailyPnlMap = new Map();
                    for (_i = 0, trades_2 = trades; _i < trades_2.length; _i++) {
                        trade = trades_2[_i];
                        if (!trade.tradeDate)
                            continue; // Skip trades without a date
                        date = trade.tradeDate;
                        pnl = trade.netAmount || 0;
                        dailyPnlMap.set(date, (dailyPnlMap.get(date) || 0) + pnl);
                    }
                    dailyPnlArray = Array.from(dailyPnlMap.entries())
                        .map(function (_a) {
                        var date = _a[0], pnl = _a[1];
                        return ({ date: date, pnl: pnl });
                    })
                        .sort(function (a, b) { return new Date(a.date).getTime() - new Date(b.date).getTime(); });
                    if (dailyPnlArray.length === 0) {
                        return [2 /*return*/, []]; // Return empty if no data
                    }
                    endDate = new Date();
                    startDate = new Date();
                    startDate.setDate(endDate.getDate() - 8 * 7); // Go back 8 weeks
                    startDayOfWeek = startDate.getDay();
                    // If startDayOfWeek is 0 (Sunday), set to Monday of previous week, otherwise set to Monday of current week
                    startDate.setDate(startDate.getDate() - (startDayOfWeek === 0 ? 6 : startDayOfWeek - 1));
                    numberOfWeeks = 8;
                    heatmap = Array.from({ length: numberOfWeeks }, function () { return Array(7).fill(null); });
                    currentDate = new Date(startDate);
                    for (week = 0; week < numberOfWeeks; week++) {
                        for (day = 0; day < 7; day++) {
                            dateString = currentDate.toISOString().split('T')[0];
                            pnl = dailyPnlMap.get(dateString);
                            if (pnl !== undefined) {
                                heatmap[week][day] = pnl;
                            }
                            currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
                        }
                    }
                    finalHeatmap = heatmap.map(function (row) {
                        return row.map(function (value) { return value === null ? 0 : value; });
                    });
                    return [2 /*return*/, finalHeatmap];
            }
        });
    });
}
// New method for bulk inserting normalized trades and positions
export function insertTradesAndPositions(trades, positions) {
    return __awaiter(this, void 0, void 0, function () {
        var currentDb, query, stmt, _i, trades_3, trade, tradeOpenCloseIndicator, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Ensure trades and positions are arrays, even if empty
                    if ((!trades || trades.length === 0) && (!positions || positions.length === 0)) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, getDb()];
                case 1:
                    currentDb = _a.sent();
                    currentDb.exec("BEGIN TRANSACTION;");
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 5, , 6]);
                    // Insert trades if we have any
                    if (trades && trades.length > 0) {
                        query = "\n        INSERT INTO trades (\n            id, importTimestamp, broker, accountId, tradeDate, settleDate, symbol, description, assetCategory,\n            action, quantity, tradePrice, currency, proceeds, cost, commission, fees, netAmount,\n            openCloseIndicator, costBasis, optionSymbol, expiryDate, strikePrice, putCall, multiplier,\n            orderID, executionID, notes, rawCsvRowJson\n        ) VALUES (\n            ?, ?, ?, ?, ?, ?, ?, ?, ?,\n            ?, ?, ?, ?, ?, ?, ?, ?, ?,\n            ?, ?, ?, ?, ?, ?, ?,\n            ?, ?, ?, ?\n        )\n      ";
                        stmt = currentDb.prepare(query);
                        for (_i = 0, trades_3 = trades; _i < trades_3.length; _i++) {
                            trade = trades_3[_i];
                            try {
                                console.log('Inserting trade openCloseIndicator:', trade.openCloseIndicator);
                                tradeOpenCloseIndicator = trade.openCloseIndicator;
                                stmt.run([
                                    trade.id,
                                    trade.importTimestamp,
                                    trade.broker,
                                    trade.accountId || null,
                                    trade.tradeDate,
                                    trade.settleDate || null,
                                    trade.symbol,
                                    trade.description || null,
                                    trade.assetCategory,
                                    trade.action || null,
                                    trade.quantity,
                                    trade.tradePrice,
                                    trade.currency,
                                    trade.proceeds === undefined ? null : trade.proceeds,
                                    trade.cost === undefined ? null : trade.cost,
                                    trade.commission === undefined ? null : trade.commission,
                                    trade.fees === undefined ? null : trade.fees,
                                    trade.netAmount,
                                    tradeOpenCloseIndicator || null,
                                    trade.costBasis === undefined ? null : trade.costBasis,
                                    trade.optionSymbol || null,
                                    trade.expiryDate || null,
                                    trade.strikePrice === undefined ? null : trade.strikePrice,
                                    trade.putCall || null,
                                    trade.multiplier === undefined ? null : trade.multiplier,
                                    trade.orderID || null,
                                    trade.executionID || null,
                                    trade.notes || null,
                                    JSON.stringify(trade.rawCsvRow || {})
                                ]);
                            }
                            catch (e) {
                                console.error('Error inserting trade:', e);
                                throw e; // Re-throw to trigger transaction rollback
                            }
                        }
                        stmt.free();
                    }
                    if (!(positions && positions.length > 0)) return [3 /*break*/, 4];
                    return [4 /*yield*/, insertPositions(positions)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    currentDb.exec("COMMIT;");
                    return [3 /*break*/, 6];
                case 5:
                    e_1 = _a.sent();
                    currentDb.exec("ROLLBACK;");
                    console.error('Transaction failed, rolled back:', e_1);
                    throw e_1; // Re-throw the error after rollback
                case 6: return [2 /*return*/];
            }
        });
    });
}
// --- Migration Logic --- 
var LATEST_SCHEMA_VERSION = 2;
function runMigrations(db) {
    var currentVersion = db.exec("PRAGMA user_version")[0].values[0][0];
    console.log("[DEBUG runMigrations] Current DB schema version: ".concat(currentVersion, ", Latest: ").concat(LATEST_SCHEMA_VERSION));
    if (currentVersion < LATEST_SCHEMA_VERSION) {
        console.log("[DEBUG runMigrations] Migrating database from version ".concat(currentVersion, " to ").concat(LATEST_SCHEMA_VERSION, "..."));
        db.exec("BEGIN TRANSACTION;");
        try {
            if (currentVersion < 2) {
                migrateToV2(db);
            }
            // Add future migrations here, e.g.:
            // if (currentVersion < 3) {
            //   migrateToV3(db);
            // }
            // Update the version number after successful migrations
            db.exec("PRAGMA user_version = ".concat(LATEST_SCHEMA_VERSION, ";"));
            db.exec("COMMIT;");
            console.log("[DEBUG runMigrations] Database migration to version ".concat(LATEST_SCHEMA_VERSION, " successful."));
        }
        catch (error) {
            console.error('[ERROR runMigrations] Migration failed, rolling back transaction:', error);
            db.exec("ROLLBACK;");
            // Rethrow or handle the error appropriately
            throw new Error("Database migration failed: ".concat(error));
        }
    }
    else {
        console.log('[DEBUG runMigrations] Database schema is up to date.');
    }
}
function migrateToV2(db) {
    console.log('[DEBUG migrateToV2] Applying V2 migrations...');
    // Add new columns to trades table (idempotent check not strictly needed due to outer version check, but good practice)
    // Using try-catch for each ALTER in case the column somehow exists (though version check should prevent this)
    var columnsToAdd = [
        { name: 'openDelta', type: 'REAL' }, { name: 'openGamma', type: 'REAL' }, { name: 'openTheta', type: 'REAL' },
        { name: 'openVega', type: 'REAL' }, { name: 'openRho', type: 'REAL' }, { name: 'closeDelta', type: 'REAL' },
        { name: 'closeGamma', type: 'REAL' }, { name: 'closeTheta', type: 'REAL' }, { name: 'closeVega', type: 'REAL' },
        { name: 'closeRho', type: 'REAL' }, { name: 'currentDelta', type: 'REAL' }, { name: 'currentGamma', type: 'REAL' },
        { name: 'currentTheta', type: 'REAL' }, { name: 'currentVega', type: 'REAL' }, { name: 'currentRho', type: 'REAL' },
        { name: 'underlyingPriceAtOpen', type: 'REAL' }, { name: 'underlyingPriceAtClose', type: 'REAL' },
        { name: 'ivAtOpen', type: 'REAL' }, { name: 'ivAtClose', type: 'REAL' }, { name: 'hvAtOpen', type: 'REAL' },
        { name: 'hvAtClose', type: 'REAL' }, { name: 'vixAtOpen', type: 'REAL' }, { name: 'vixAtClose', type: 'REAL' },
        { name: 'marketRegime', type: 'TEXT' }, { name: 'identifiedPattern', type: 'TEXT' },
        { name: 'sizingRecommendation', type: 'REAL' }, { name: 'predictionConfidence', type: 'REAL' }
    ];
    columnsToAdd.forEach(function (col) {
        try {
            console.log("[DEBUG migrateToV2] Attempting to add column ".concat(col.name, "..."));
            db.exec("ALTER TABLE trades ADD COLUMN ".concat(col.name, " ").concat(col.type, ";"));
            console.log("[DEBUG migrateToV2] Column ".concat(col.name, " added successfully."));
        }
        catch (e) {
            // Check if the error is because the column already exists (SQLite error code 1: 'duplicate column name')
            // Note: sql.js might not provide detailed error codes easily. A simple check might be needed.
            if (e instanceof Error && e.message.includes('duplicate column name')) {
                console.warn("[WARN migrateToV2] Column ".concat(col.name, " already exists."));
            }
            else {
                console.error("[ERROR migrateToV2] Failed to add column ".concat(col.name, ":"), e);
                throw e; // Rethrow the error to trigger rollback
            }
        }
    });
    // Create the new ml_analysis_results table
    console.log('[DEBUG migrateToV2] Creating ml_analysis_results table...');
    db.exec("\n    CREATE TABLE IF NOT EXISTS ml_analysis_results (\n        result_id TEXT PRIMARY KEY,\n        trade_id TEXT NOT NULL,\n        analysis_timestamp TEXT NOT NULL,\n        model_name TEXT NOT NULL,\n        market_regime TEXT,\n        identified_pattern TEXT,\n        sizing_recommendation REAL,\n        prediction_confidence REAL,\n        FOREIGN KEY (trade_id) REFERENCES trades(id)\n    );\n  ");
    console.log('[DEBUG migrateToV2] ml_analysis_results table created (if not exists).');
    console.log('[DEBUG migrateToV2] V2 migration complete.');
}
// --- End Migration Logic ---
