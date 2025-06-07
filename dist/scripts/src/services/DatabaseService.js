"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOverallPnlSummary = exports.getDb = exports.setSqlJsWasmPathOverride = void 0;
exports.initDatabase = initDatabase;
exports.insertSummary = insertSummary;
exports.getTrades = getTrades;
exports.getSummary = getSummary;
exports.getAggregatePL = getAggregatePL;
exports.resetDatabase = resetDatabase;
exports.insertPosition = insertPosition;
exports.getPositions = getPositions;
exports.getTradeCounts = getTradeCounts;
exports.insertNormalizedTrades = insertNormalizedTrades;
exports.getClosedTrades = getClosedTrades;
exports.getHeatmapData = getHeatmapData;
exports.getDailyPnlForReconciliation = getDailyPnlForReconciliation;
exports.insertPositions = insertPositions;
exports.getDailyPnlHeatmapData = getDailyPnlHeatmapData;
exports.insertTradesAndPositions = insertTradesAndPositions;
exports.saveIBKRAccount = saveIBKRAccount;
exports.saveIBKRTradeRecords = saveIBKRTradeRecords;
const sql_js_1 = __importDefault(require("sql.js"));
const trade_1 = require("../types/trade"); // Adjusted imports
// --- Additions for IBKR data saving ---
const ibkr_1 = require("../types/ibkr");
const uuid_1 = require("uuid");
// --- End Additions ---
let SQL;
// Singleton promise for SQL.js initialization
let sqlJsPromise = null;
// Allow Node.js environment to set a specific path for the WASM file
let nodeWasmPathOverride = null;
const setSqlJsWasmPathOverride = (path) => {
    nodeWasmPathOverride = path;
};
exports.setSqlJsWasmPathOverride = setSqlJsWasmPathOverride;
const initializeSqlJs = () => {
    if (!sqlJsPromise) {
        // Use the override if provided (by Node.js script), otherwise default to browser path
        const wasmPath = nodeWasmPathOverride || 'sqljs-wasm.wasm';
        console.log(`[DEBUG initializeSqlJs] Using wasmPath: ${wasmPath}`);
        sqlJsPromise = (0, sql_js_1.default)({ locateFile: (file) => wasmPath });
    }
    return sqlJsPromise;
};
// Singleton promise for Database initialization
let dbPromise = null;
const getDb = async () => {
    console.log('[DEBUG getDb] Attempting to get DB instance...'); // Log at start of getDb
    if (!dbPromise) {
        console.log('[DEBUG getDb] dbPromise is null, initializing...'); // Log if initializing
        dbPromise = initializeSqlJs().then(SQLModule => {
            SQL = SQLModule;
            console.log('[DEBUG getDb] SQL.js module initialized. Creating new DB.'); // Log after SQL.js init
            const existingDb = new SQL.Database();
            console.log('[DEBUG getDb] New DB created. Running schema setup...'); // Log before schema run
            // Create schema if it doesn't exist (idempotent)
            existingDb.run(`
    CREATE TABLE IF NOT EXISTS trades (
          id TEXT PRIMARY KEY,
          importTimestamp TEXT NOT NULL,
          broker TEXT NOT NULL,
          accountId TEXT,
          tradeDate TEXT NOT NULL,
          settleDate TEXT,
          symbol TEXT NOT NULL,
      dateTime TEXT,
          description TEXT,
          assetCategory TEXT NOT NULL,
          action TEXT,
          quantity REAL NOT NULL, 
          tradePrice REAL NOT NULL,
          currency TEXT NOT NULL,
      proceeds REAL,
          cost REAL,
          commission REAL,
          fees REAL,
          netAmount REAL NOT NULL,
          openCloseIndicator TEXT,
          costBasis REAL,
          optionSymbol TEXT,
          expiryDate TEXT,
          strikePrice REAL,
          putCall TEXT,
          multiplier REAL,
          orderID TEXT,
          executionID TEXT,
          notes TEXT,
          rawCsvRowJson TEXT,
          
          -- Version 2 Fields (added for ML analysis)
          openDelta REAL,
          openGamma REAL,
          openTheta REAL,
          openVega REAL,
          openRho REAL,
          closeDelta REAL,
          closeGamma REAL,
          closeTheta REAL,
          closeVega REAL,
          closeRho REAL,
          currentDelta REAL,
          currentGamma REAL,
          currentTheta REAL,
          currentVega REAL,
          currentRho REAL,
          underlyingPriceAtOpen REAL,
          underlyingPriceAtClose REAL,
          ivAtOpen REAL,
          ivAtClose REAL,
          hvAtOpen REAL,
          hvAtClose REAL,
          vixAtOpen REAL,
          vixAtClose REAL,
          marketRegime TEXT,
          identifiedPattern TEXT,
          sizingRecommendation REAL,
          predictionConfidence REAL
    );
    CREATE TABLE IF NOT EXISTS summary (
      id INTEGER PRIMARY KEY,
      cumulativePL REAL
    );
    CREATE TABLE IF NOT EXISTS errors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lineNumber INTEGER,
      message TEXT
    );
        CREATE TABLE IF NOT EXISTS positions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          symbol TEXT,
          description TEXT,
          quantity INTEGER,
          price REAL,
          marketValue REAL,
          costBasis REAL,
          gainDollar REAL,
          gainPercent REAL
        );
        
    -- Version 2 Table (added for ML analysis)
    CREATE TABLE IF NOT EXISTS ml_analysis_results (
        result_id TEXT PRIMARY KEY,
        trade_id TEXT NOT NULL,
        analysis_timestamp TEXT NOT NULL,
        model_name TEXT NOT NULL,
        market_regime TEXT,
        identified_pattern TEXT,
        sizing_recommendation REAL,
        prediction_confidence REAL,
        FOREIGN KEY (trade_id) REFERENCES trades(id)
        );
      `);
            console.log('[DEBUG getDb] Schema setup complete. Checking migrations...'); // Log after schema run
            // Run migrations if needed
            runMigrations(existingDb);
            console.log('[DEBUG getDb] Migrations checked/run. Returning DB.');
            return existingDb;
        }).catch(err => {
            console.error('[ERROR in getDb initialization]:', err);
            throw err;
        });
    }
    else {
        console.log('[DEBUG getDb] dbPromise exists, returning promise.'); // Log if returning existing promise
    }
    return dbPromise;
};
exports.getDb = getDb;
async function initDatabase() {
    await (0, exports.getDb)(); // Ensures database is initialized
}
async function insertSummary(cumulativePL) {
    const currentDb = await (0, exports.getDb)();
    currentDb.run('DELETE FROM summary;');
    currentDb.run('INSERT INTO summary (id, cumulativePL) VALUES (1, ?);', [cumulativePL]);
}
async function getTrades() {
    const currentDb = await (0, exports.getDb)();
    const res = currentDb.exec("SELECT id, tradeDate, broker, symbol, assetCategory, quantity, tradePrice, currency, netAmount, openCloseIndicator, commission, fees, proceeds, cost, optionSymbol, expiryDate, strikePrice, putCall, multiplier FROM trades ORDER BY importTimestamp DESC");
    console.log('[DEBUG DatabaseService.getTrades] Raw query result (res):', JSON.stringify(res));
    if (!res[0] || !res[0].values || res[0].values.length === 0) {
        console.log('[DEBUG DatabaseService.getTrades] No trades found in DB or res[0].values is empty, returning [].');
        return [];
    }
    console.log('[DEBUG DatabaseService.getTrades] Found trades, mapping values. Number of rows:', res[0].values.length);
    return res[0].values.map(r => ({
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
    }));
}
async function getSummary() {
    var _a, _b;
    const currentDb = await (0, exports.getDb)();
    const res = currentDb.exec('SELECT cumulativePL FROM summary');
    return (_b = (_a = res[0]) === null || _a === void 0 ? void 0 : _a.values[0][0]) !== null && _b !== void 0 ? _b : 0;
}
async function getAggregatePL() {
    var _a, _b;
    const currentDb = await (0, exports.getDb)();
    // Calculate realized P&L by summing netAmount for closed trades
    const res = currentDb.exec(`SELECT COALESCE(SUM(netAmount), 0) AS realizedPL FROM trades WHERE openCloseIndicator = 'C'`);
    const realizedPL = Number((_b = (_a = res[0]) === null || _a === void 0 ? void 0 : _a.values[0][0]) !== null && _b !== void 0 ? _b : 0);
    return { realizedPL: realizedPL };
}
async function resetDatabase() {
    const currentDb = await (0, exports.getDb)();
    currentDb.run('DROP TABLE IF EXISTS trades;');
    currentDb.run('DROP TABLE IF EXISTS summary;');
    currentDb.run('DROP TABLE IF EXISTS errors;');
    currentDb.run('DROP TABLE IF EXISTS positions;');
    // Re-initialize schema after dropping tables
    dbPromise = null; // Force re-initialization on next getDb call
    await initDatabase();
}
async function insertPosition(position) {
    const currentDb = await (0, exports.getDb)();
    const { symbol = '', description = '', quantity = 0, price = 0, marketValue = 0, costBasis = 0, gainDollar = 0, gainPercent = 0, } = position;
    const stmt = currentDb.prepare(`
    INSERT INTO positions (
      symbol,
      description,
      quantity,
      price,
      marketValue,
      costBasis,
      gainDollar,
      gainPercent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
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
}
async function getPositions() {
    var _a;
    const currentDb = await (0, exports.getDb)();
    const res = currentDb.exec('SELECT * FROM positions ORDER BY symbol ASC');
    return ((_a = res[0]) === null || _a === void 0 ? void 0 : _a.values.map((row) => ({
        id: row[0],
        symbol: row[1],
        description: row[2],
        quantity: row[3],
        price: row[4],
        marketValue: row[5],
        costBasis: row[6],
        gainDollar: row[7],
        gainPercent: row[8]
    }))) || [];
}
// New method for counting open and closed trades
async function getTradeCounts() {
    var _a, _b;
    const currentDb = await (0, exports.getDb)();
    const results = currentDb.exec("SELECT SUM(CASE WHEN openCloseIndicator = 'O' THEN 1 ELSE 0 END) as openCount, SUM(CASE WHEN openCloseIndicator = 'C' THEN 1 ELSE 0 END) as closedCount FROM trades");
    if (results.length > 0 && results[0].values.length > 0) {
        const openCount = Number((_a = results[0].values[0][0]) !== null && _a !== void 0 ? _a : 0);
        const closedCount = Number((_b = results[0].values[0][1]) !== null && _b !== void 0 ? _b : 0);
        return { open: openCount, closed: closedCount };
    }
    return { open: 0, closed: 0 };
}
// New method for bulk inserting normalized trades
async function insertNormalizedTrades(trades) {
    if (!trades || trades.length === 0) {
        return { successCount: 0, errors: [] };
    }
    // *** DEBUG LOG: First trade object received by insertNormalizedTrades ***
    if (trades.length > 0) {
        console.log('[DEBUG] First trade object received by insertNormalizedTrades:', trades[0]);
    }
    const currentDb = await (0, exports.getDb)();
    let successCount = 0;
    const insertionErrors = [];
    currentDb.exec("BEGIN TRANSACTION;");
    try {
        const stmt = currentDb.prepare(`
      INSERT INTO trades (
          id, importTimestamp, broker, accountId, tradeDate, settleDate, symbol, description, assetCategory,
          action, quantity, tradePrice, currency, proceeds, cost, commission, fees, netAmount,
          openCloseIndicator, costBasis, optionSymbol, expiryDate, strikePrice, putCall, multiplier,
          orderID, executionID, notes, rawCsvRowJson
      ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?
      );
    `);
        for (const trade of trades) {
            try {
                console.log('Inserting trade openCloseIndicator:', trade.openCloseIndicator);
                // Extract openCloseIndicator to a local variable
                const tradeOpenCloseIndicator = trade.openCloseIndicator;
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
            return { successCount: 0, errors: insertionErrors }; // Report 0 success if rollback occurs
        }
        else {
            currentDb.exec("COMMIT;");
        }
    }
    catch (e) {
        currentDb.exec("ROLLBACK;");
        // This catch is for errors in BEGIN, COMMIT, PREPARE, or unhandled errors in loop
        console.error('Transaction failed, rolled back:', e);
        return { successCount: 0, errors: [{ tradeId: undefined, error: e.message }] };
    }
    return { successCount, errors: insertionErrors };
}
// New method for getting only closed trades
async function getClosedTrades() {
    const currentDb = await (0, exports.getDb)();
    // Explicitly list all columns in the order they appear in NormalizedTradeData for mapping
    // Corrected column name from rawCsvRow to rawCsvRowJson
    const results = currentDb.exec("SELECT id, importTimestamp, broker, accountId, tradeDate, settleDate, symbol, dateTime, description, assetCategory, action, quantity, tradePrice, currency, proceeds, cost, commission, fees, netAmount, openCloseIndicator, costBasis, optionSymbol, expiryDate, strikePrice, putCall, multiplier, orderID, executionID, notes, rawCsvRowJson FROM trades WHERE openCloseIndicator = 'C'");
    if (!results[0] || !results[0].values) {
        return [];
    }
    return results[0].values.map((row) => ({
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
    }));
}
async function getHeatmapData() {
    const currentDb = await (0, exports.getDb)();
    const query = `SELECT
      symbol,
      SUBSTR(tradeDate, 1, 10) as tradeDay, 
      SUM(netAmount) as dailyPnl 
    FROM trades
    WHERE netAmount IS NOT NULL AND openCloseIndicator = 'C'
    GROUP BY symbol, SUBSTR(tradeDate, 1, 10) 
    ORDER BY symbol, SUBSTR(tradeDate, 1, 10)`;
    const results = currentDb.exec(query);
    if (!results[0] || !results[0].values) {
        return [];
    }
    return results[0].values.map((row) => ({
        symbol: row[0],
        date: row[1],
        pnl: Number(row[2]) || 0,
    }));
}
async function getDailyPnlForReconciliation() {
    console.log('[DEBUG getDailyPnlForReconciliation] Function called.');
    let currentDb = null;
    try {
        currentDb = await (0, exports.getDb)();
        console.log('[DEBUG getDailyPnlForReconciliation] DB instance obtained. Executing SQL query...');
        const query = `SELECT
      symbol,
        SUBSTR(tradeDate, 1, 10) as date,
      SUM(netAmount) as pnl
    FROM trades
    WHERE netAmount IS NOT NULL AND openCloseIndicator = 'C'
      GROUP BY symbol, SUBSTR(tradeDate, 1, 10)
      ORDER BY symbol, SUBSTR(tradeDate, 1, 10)`;
        const results = currentDb.exec(query);
        console.log('[DEBUG getDailyPnlForReconciliation] SQL query executed successfully.');
        if (!results || results.length === 0 || !results[0].values) {
            console.log('[DEBUG getDailyPnlForReconciliation] No results found, returning empty array.');
            return [];
        }
        console.log(`[DEBUG getDailyPnlForReconciliation] Mapping ${results[0].values.length} rows...`);
        const mappedData = results[0].values.map(row => ({
            symbol: String(row[0]),
            date: String(row[1]),
            pnl: Number(row[2]),
        }));
        console.log('[DEBUG getDailyPnlForReconciliation] Mapping complete.');
        return mappedData;
    }
    catch (error) {
        console.error('[ERROR in getDailyPnlForReconciliation]:', error);
        throw error;
    }
}
// New function to insert multiple positions
async function insertPositions(positions) {
    if (!positions || positions.length === 0) {
        return; // Early return if empty
    }
    const currentDb = await (0, exports.getDb)();
    currentDb.exec("BEGIN TRANSACTION;");
    try {
        for (const position of positions) {
            const query = `
        INSERT INTO positions (
          symbol,
          description,
          quantity,
          price,
          marketValue,
          costBasis,
          gainDollar,
          gainPercent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
            const stmt = currentDb.prepare(query);
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
}
const getOverallPnlSummary = async () => {
    var _a;
    const db = await (0, exports.getDb)();
    let totalPnl = 0;
    let lastDayPnl = 0;
    let lastDayDate = undefined;
    // Calculate Total P&L from all closed trades
    const closedTrades = await getClosedTrades();
    closedTrades.forEach(trade => {
        totalPnl += trade.netAmount || 0;
    });
    // Find the most recent date with closed trades for Daily P&L
    if (closedTrades.length > 0) {
        // Sort by tradeDate descending to find the latest date
        closedTrades.sort((a, b) => {
            const dateA = a.tradeDate ? new Date(a.tradeDate.substring(0, 10)).getTime() : 0;
            const dateB = b.tradeDate ? new Date(b.tradeDate.substring(0, 10)).getTime() : 0;
            return dateB - dateA;
        });
        lastDayDate = (_a = closedTrades[0].tradeDate) === null || _a === void 0 ? void 0 : _a.substring(0, 10);
        if (lastDayDate) {
            closedTrades.forEach(trade => {
                var _a;
                if (((_a = trade.tradeDate) === null || _a === void 0 ? void 0 : _a.substring(0, 10)) === lastDayDate) {
                    lastDayPnl += trade.netAmount || 0;
                }
            });
        }
    }
    // Add logging before return
    console.log('[DEBUG DatabaseService.getOverallPnlSummary] Calculated values:', {
        totalPnl,
        lastDayPnl,
        lastDayDate,
        numberOfClosedTrades: closedTrades.length
    });
    // Placeholder for percentages - realistic calculation requires historical portfolio value or initial investment
    // For now, we'll return 0 for percentages. This can be enhanced later.
    return {
        totalPnl,
        totalPnlPercent: 0, // Placeholder
        lastDayPnl,
        lastDayPnlPercent: 0, // Placeholder
        lastDayDate,
    };
};
exports.getOverallPnlSummary = getOverallPnlSummary;
/**
 * Fetches daily realized P&L data and structures it for the heatmap.
 * Aggregates P&L by date for all closed trades and formats into a 2D array
 * where rows are weeks and columns are days (Mon-Sun).
 * Assumes dates are in YYYY-MM-DD format.
 * @returns Promise<number[][]> A 2D array suitable for the heatmap component.
 */
async function getDailyPnlHeatmapData() {
    // Get all closed trades with their realized P&L
    const trades = await getClosedTrades();
    // Aggregate daily P&L
    const dailyPnlMap = new Map();
    for (const trade of trades) {
        if (!trade.tradeDate)
            continue; // Skip trades without a date
        const date = trade.tradeDate;
        const pnl = trade.netAmount || 0; // Use 0 if netAmount is null or undefined
        dailyPnlMap.set(date, (dailyPnlMap.get(date) || 0) + pnl);
    }
    const dailyPnlArray = Array.from(dailyPnlMap.entries())
        .map(([date, pnl]) => ({ date, pnl }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (dailyPnlArray.length === 0) {
        return []; // Return empty if no data
    }
    // Determine the date range to display (e.g., last 8 weeks)
    const endDate = new Date(); // Today
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 8 * 7); // Go back 8 weeks
    // Adjust startDate to the beginning of its week (Monday)
    const startDayOfWeek = startDate.getDay(); // 0 for Sunday, 1 for Monday...
    // If startDayOfWeek is 0 (Sunday), set to Monday of previous week, otherwise set to Monday of current week
    startDate.setDate(startDate.getDate() - (startDayOfWeek === 0 ? 6 : startDayOfWeek - 1));
    // Initialize heatmap structure (e.g., 8 weeks x 7 days)
    // Number of weeks to display (adjust as needed)
    const numberOfWeeks = 8;
    const heatmap = Array.from({ length: numberOfWeeks }, () => Array(7).fill(null)); // Use null for missing days
    // Populate the heatmap
    let currentDate = new Date(startDate);
    for (let week = 0; week < numberOfWeeks; week++) {
        for (let day = 0; day < 7; day++) {
            const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
            const pnl = dailyPnlMap.get(dateString);
            if (pnl !== undefined) {
                heatmap[week][day] = pnl;
            }
            currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
        }
    }
    // Convert nulls to 0 or keep them as null based on HeatmapChart component expectation.
    // The current HeatmapChart handles nulls/non-numbers gracefully, so keeping null is fine for missing data.
    // It displays 'N/A' in the title and uses a grey background.
    // Let's convert nulls to 0 for display purposes in this function, as 0 P&L is distinct from no trading day.
    const finalHeatmap = heatmap.map(row => row.map(value => value === null ? 0 : value));
    return finalHeatmap;
}
// New method for bulk inserting normalized trades and positions
async function insertTradesAndPositions(trades, positions) {
    // Ensure trades and positions are arrays, even if empty
    if ((!trades || trades.length === 0) && (!positions || positions.length === 0)) {
        return;
    }
    const currentDb = await (0, exports.getDb)();
    currentDb.exec("BEGIN TRANSACTION;");
    try {
        // Insert trades if we have any
        if (trades && trades.length > 0) {
            const query = `
        INSERT INTO trades (
            id, importTimestamp, broker, accountId, tradeDate, settleDate, symbol, description, assetCategory,
            action, quantity, tradePrice, currency, proceeds, cost, commission, fees, netAmount,
            openCloseIndicator, costBasis, optionSymbol, expiryDate, strikePrice, putCall, multiplier,
            orderID, executionID, notes, rawCsvRowJson
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?
        )
      `;
            const stmt = currentDb.prepare(query);
            for (const trade of trades) {
                try {
                    console.log('Inserting trade openCloseIndicator:', trade.openCloseIndicator);
                    // Extract openCloseIndicator to a local variable
                    const tradeOpenCloseIndicator = trade.openCloseIndicator;
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
        // Insert positions if we have any
        if (positions && positions.length > 0) {
            await insertPositions(positions);
        }
        currentDb.exec("COMMIT;");
    }
    catch (e) {
        currentDb.exec("ROLLBACK;");
        console.error('Transaction failed, rolled back:', e);
        throw e; // Re-throw the error after rollback
    }
}
// --- Migration Logic --- 
const LATEST_SCHEMA_VERSION = 2;
function runMigrations(db) {
    const currentVersion = db.exec("PRAGMA user_version")[0].values[0][0];
    console.log(`[DEBUG runMigrations] Current DB schema version: ${currentVersion}, Latest: ${LATEST_SCHEMA_VERSION}`);
    if (currentVersion < LATEST_SCHEMA_VERSION) {
        console.log(`[DEBUG runMigrations] Migrating database from version ${currentVersion} to ${LATEST_SCHEMA_VERSION}...`);
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
            db.exec(`PRAGMA user_version = ${LATEST_SCHEMA_VERSION};`);
            db.exec("COMMIT;");
            console.log(`[DEBUG runMigrations] Database migration to version ${LATEST_SCHEMA_VERSION} successful.`);
        }
        catch (error) {
            console.error('[ERROR runMigrations] Migration failed, rolling back transaction:', error);
            db.exec("ROLLBACK;");
            // Rethrow or handle the error appropriately
            throw new Error(`Database migration failed: ${error}`);
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
    const columnsToAdd = [
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
    columnsToAdd.forEach(col => {
        try {
            console.log(`[DEBUG migrateToV2] Attempting to add column ${col.name}...`);
            db.exec(`ALTER TABLE trades ADD COLUMN ${col.name} ${col.type};`);
            console.log(`[DEBUG migrateToV2] Column ${col.name} added successfully.`);
        }
        catch (e) {
            // Check if the error is because the column already exists (SQLite error code 1: 'duplicate column name')
            // Note: sql.js might not provide detailed error codes easily. A simple check might be needed.
            if (e instanceof Error && e.message.includes('duplicate column name')) {
                console.warn(`[WARN migrateToV2] Column ${col.name} already exists.`);
            }
            else {
                console.error(`[ERROR migrateToV2] Failed to add column ${col.name}:`, e);
                throw e; // Rethrow the error to trigger rollback
            }
        }
    });
    // Create the new ml_analysis_results table
    console.log('[DEBUG migrateToV2] Creating ml_analysis_results table...');
    db.exec(`
    CREATE TABLE IF NOT EXISTS ml_analysis_results (
        result_id TEXT PRIMARY KEY,
        trade_id TEXT NOT NULL,
        analysis_timestamp TEXT NOT NULL,
        model_name TEXT NOT NULL,
        market_regime TEXT,
        identified_pattern TEXT,
        sizing_recommendation REAL,
        prediction_confidence REAL,
        FOREIGN KEY (trade_id) REFERENCES trades(id)
    );
  `);
    console.log('[DEBUG migrateToV2] ml_analysis_results table created (if not exists).');
    console.log('[DEBUG migrateToV2] V2 migration complete.');
}
// --- End Migration Logic ---
// --- Add back the missing functions ---
async function saveIBKRAccount(account) {
    const currentDb = await (0, exports.getDb)();
    // Check if accounts table exists, if not, create it (simple version for now)
    // A more robust solution would be part of migrations
    currentDb.run(`CREATE TABLE IF NOT EXISTS accounts (
    account_id TEXT PRIMARY KEY,
    account_name TEXT,
    account_type TEXT,
    base_currency TEXT,
    balance REAL,
    last_updated TEXT
  );`);
    const stmt = currentDb.prepare(`
    INSERT INTO accounts (account_id, account_name, account_type, base_currency, balance, last_updated)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(account_id) DO UPDATE SET
      account_name = excluded.account_name,
      account_type = excluded.account_type,
      base_currency = excluded.base_currency,
      balance = excluded.balance,
      last_updated = excluded.last_updated;
  `);
    try {
        stmt.run([
            account.accountId,
            account.accountName,
            account.accountType,
            account.baseCurrency,
            account.balance,
            new Date().toISOString() // last_updated to now
        ]);
        console.log(`[DatabaseService] Account ${account.accountId} saved/updated successfully.`);
    }
    catch (error) {
        console.error(`[DatabaseService] Error saving account ${account.accountId}:`, error);
        throw error;
    }
    finally {
        stmt.free();
    }
}
// Helper function to parse IBKR option symbol (can be moved to a utility file)
// Basic version, assumes underlying is the first part before space.
const parseIBKROptionUnderlying = (ibkrSymbol) => {
    return ibkrSymbol.split(' ')[0] || ibkrSymbol;
};
async function saveIBKRTradeRecords(records, sourceAccountId) {
    const normalizedTrades = [];
    const transformationErrors = [];
    for (const record of records) {
        try {
            let tradeDate = '';
            let isoDateTime = record.dateTime; // Default to existing if parsing fails
            try {
                const parts = record.dateTime.split(',');
                const datePart = parts[0];
                const timePart = parts.length > 1 ? parts[1].trim() : '00:00:00';
                const dt = new Date(`${datePart}T${timePart}Z`);
                if (!isNaN(dt.getTime())) {
                    tradeDate = dt.toISOString().split('T')[0];
                    isoDateTime = dt.toISOString();
                }
                else {
                    tradeDate = datePart;
                    console.warn(`[DatabaseService] Could not parse date-time for trade: ${record.dateTime}. Storing as is.`);
                }
            }
            catch (dateError) {
                console.warn(`[DatabaseService] Error parsing date-time for trade: ${record.dateTime}. Storing as is. Error: ${dateError}`);
                if (record.dateTime) {
                    tradeDate = record.dateTime.split(',')[0];
                }
            }
            const id = (0, uuid_1.v4)();
            const assetCategoryMapped = record.assetCategory.toUpperCase().includes('OPTION') ? 'OPT' :
                record.assetCategory.toUpperCase().includes('STOCK') || record.assetCategory.toUpperCase().includes('EQUITY') ? 'STK' :
                    'Unknown';
            let mappedSymbol = record.symbol;
            let optionDetails = {
                optionSymbol: undefined,
                expiryDate: undefined,
                strikePrice: undefined,
                putCall: undefined,
                multiplier: undefined,
            };
            if (assetCategoryMapped === 'OPT') {
                const parsedOption = (0, ibkr_1.parseIBKROptionSymbol)(record.symbol);
                if (parsedOption) {
                    mappedSymbol = parsedOption.underlying;
                    optionDetails.optionSymbol = record.symbol;
                    optionDetails.expiryDate = parsedOption.expiry.toISOString().split('T')[0];
                    optionDetails.strikePrice = parsedOption.strike;
                    optionDetails.putCall = parsedOption.putCall === 'PUT' ? 'P' : parsedOption.putCall === 'CALL' ? 'C' : undefined;
                }
                else {
                    mappedSymbol = parseIBKROptionUnderlying(record.symbol);
                    optionDetails.optionSymbol = record.symbol;
                    console.warn(`[DatabaseService] Could not fully parse IBKR option symbol: ${record.symbol}. Underlying may be correct.`);
                }
                optionDetails.multiplier = 100;
            }
            let cost = 0;
            let proceeds = 0;
            const commission = Math.abs(record.commissionFee || 0);
            let netAmount = 0;
            if (record.quantity > 0) { // Buy
                cost = Math.abs(record.csvBasis || (record.quantity * record.tradePrice));
                proceeds = 0;
                netAmount = -cost - commission;
            }
            else { // Sell
                cost = 0;
                proceeds = Math.abs(record.csvProceeds || (record.quantity * record.tradePrice * -1));
                netAmount = proceeds - commission;
            }
            const normalized = {
                id,
                importTimestamp: new Date().toISOString(),
                broker: trade_1.BrokerType.IBKR,
                accountId: sourceAccountId,
                tradeDate,
                dateTime: isoDateTime,
                symbol: mappedSymbol,
                description: record.description,
                assetCategory: assetCategoryMapped,
                quantity: record.quantity,
                tradePrice: record.tradePrice,
                currency: record.currency || 'USD',
                commission,
                fees: 0,
                cost: cost > 0 ? cost : null,
                proceeds: proceeds > 0 ? proceeds : null,
                netAmount,
                openCloseIndicator: record.code === 'O' ? 'O' : record.code === 'C' ? 'C' : 'N/A',
                optionSymbol: optionDetails.optionSymbol,
                expiryDate: optionDetails.expiryDate,
                strikePrice: optionDetails.strikePrice,
                putCall: optionDetails.putCall,
                multiplier: optionDetails.multiplier,
                rawRealizedPL: record.realizedPL,
            };
            normalizedTrades.push(normalized);
        }
        catch (error) {
            console.error(`[DatabaseService] Error transforming IBKRTradeRecord (Symbol: ${record.symbol}, DateTime: ${record.dateTime}):`, error);
            transformationErrors.push({ record, error: error.message });
        }
    }
    if (normalizedTrades.length > 0) {
        console.log(`[DatabaseService] Attempting to insert ${normalizedTrades.length} normalized IBKR trades.`);
        const insertResult = await insertNormalizedTrades(normalizedTrades);
        return {
            successCount: insertResult.successCount,
            errors: transformationErrors.concat(insertResult.errors.map(e => ({ recordId: e.tradeId, error: e.error })))
        };
    }
    else {
        return { successCount: 0, errors: transformationErrors };
    }
}
// --- End added functions ---
