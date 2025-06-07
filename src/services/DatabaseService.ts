import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import { Position } from '../utils/parsePositionCSV'; // adjust path as needed
import { NormalizedTradeData, TradeCounts, BrokerType, AssetCategory, OpenCloseIndicator, PutCall } from '../types/trade'; // Adjusted imports
import { DailyPnlData } from './ReconciliationService';
// --- Additions for IBKR data saving ---
import { IBKRAccount, IBKRTradeRecord, parseIBKROptionSymbol } from '../types/ibkr';
import { v4 as uuidv4 } from 'uuid';
import { detectTradeAnomalies } from '../utils/anomalyDetection';
import { GoalSizingConfig } from '../types/goalSizing';
import { 
  OnboardingProgress, 
  GoalImport, 
  PlanRealityAnalysis, 
  BackupMetadata 
} from '../types/onboarding';
// --- End Additions ---

let SQL: SqlJsStatic;

// Singleton promise for SQL.js initialization
let sqlJsPromise: Promise<SqlJsStatic> | null = null;

// Allow Node.js environment to set a specific path for the WASM file
let nodeWasmPathOverride: string | null = null;

export const setSqlJsWasmPathOverride = (path: string): void => {
  nodeWasmPathOverride = path;
};

const initializeSqlJs = (): Promise<SqlJsStatic> => {
  if (!sqlJsPromise) {
    let wasmPath: string;
    if (nodeWasmPathOverride) {
      wasmPath = nodeWasmPathOverride; // Use override if provided (by Node.js script)
    } else if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      // Node.js environment: use relative path from project root
      wasmPath = './sqljs-wasm.wasm';
    } else {
      // For browser/Electron renderer, use PUBLIC_URL to construct the path.
      wasmPath = `${process.env.PUBLIC_URL || ''}/sqljs-wasm.wasm`;
    }
    console.log(`[DEBUG initializeSqlJs] Using wasmPath: ${wasmPath}`);
    sqlJsPromise = initSqlJs({ locateFile: (file: string) => wasmPath });
  }
  return sqlJsPromise;
};

// Singleton promise for Database initialization
let dbPromise: Promise<Database> | null = null;

export const getDb = async (): Promise<Database> => {
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
    }).catch(err => { // Catch errors during DB initialization
      console.error('[ERROR in getDb initialization]:', err);
      throw err;
    });
  } else {
    console.log('[DEBUG getDb] dbPromise exists, returning promise.'); // Log if returning existing promise
  }
  return dbPromise;
};


export async function initDatabase(): Promise<void> {
  await getDb(); // Ensures database is initialized
}

export async function insertSummary(cumulativePL: number) {
  const currentDb = await getDb();
  currentDb.run('DELETE FROM summary;');
  currentDb.run('INSERT INTO summary (id, cumulativePL) VALUES (1, ?);', [cumulativePL]);
}

export async function getTrades() { // This will fetch from the NEW trades table schema
  const currentDb = await getDb();
  const res = currentDb.exec("SELECT id, importTimestamp, broker, accountId, tradeDate, settleDate, symbol, dateTime, description, assetCategory, action, quantity, tradePrice, currency, proceeds, cost, commission, fees, netAmount, openCloseIndicator, costBasis, optionSymbol, expiryDate, strikePrice, putCall, multiplier, orderID, executionID, notes, rawCsvRowJson FROM trades ORDER BY importTimestamp DESC");
  
  console.log('[DEBUG DatabaseService.getTrades] Raw query result (res):', JSON.stringify(res));

  if (!res[0] || !res[0].values || res[0].values.length === 0) {
    console.log('[DEBUG DatabaseService.getTrades] No trades found in DB or res[0].values is empty, returning [].');
    return [];
  }
  
  console.log('[DEBUG DatabaseService.getTrades] Found trades, mapping values. Number of rows:', res[0].values.length);
  return res[0].values.map(r => ({
    id: r[0] as string,
    importTimestamp: r[1] as string,
    broker: r[2] as BrokerType,
    accountId: r[3] as string | undefined,
    tradeDate: r[4] as string,
    settleDate: r[5] as string | undefined,
    symbol: r[6] as string,
    dateTime: r[7] as string | undefined,
    description: r[8] as string | undefined,
    assetCategory: r[9] as AssetCategory,
    action: r[10] as string | undefined,
    quantity: r[11] as number,
    tradePrice: r[12] as number,
    currency: r[13] as string,
    proceeds: r[14] as number | null,
    cost: r[15] as number | null,
    commission: r[16] as number | null,
    fees: r[17] as number | null,
    netAmount: r[18] as number,
    openCloseIndicator: r[19] as OpenCloseIndicator | undefined,
    costBasis: r[20] as number | null,
    optionSymbol: r[21] as string | undefined,
    expiryDate: r[22] as string | undefined,
    strikePrice: r[23] as number | null,
    putCall: r[24] as PutCall | undefined,
    multiplier: r[25] as number | undefined,
    orderID: r[26] as string | undefined,
    executionID: r[27] as string | undefined,
    notes: r[28] as string | undefined,
    rawCsvRow: r[29] ? JSON.parse(r[29] as string) : undefined,
  }));
}

export async function getSummary() {
  const currentDb = await getDb();
  const res = currentDb.exec('SELECT cumulativePL FROM summary');
  return res[0]?.values[0][0] ?? 0;
}

export async function getAggregatePL(): Promise<{ realizedPL: number }> {
  const currentDb = await getDb();
  // Calculate realized P&L by summing netAmount for closed trades
  const res = currentDb.exec(
    `SELECT COALESCE(SUM(netAmount), 0) AS realizedPL FROM trades WHERE openCloseIndicator = 'C'`
  );
  const realizedPL = Number(res[0]?.values[0][0] ?? 0);
  return { realizedPL: realizedPL };
}

export async function resetDatabase() {
  const currentDb = await getDb();
  currentDb.run('DROP TABLE IF EXISTS trades;');
  currentDb.run('DROP TABLE IF EXISTS summary;');
  currentDb.run('DROP TABLE IF EXISTS errors;');
  currentDb.run('DROP TABLE IF EXISTS positions;');
  // Re-initialize schema after dropping tables
  dbPromise = null; // Force re-initialization on next getDb call
  await initDatabase(); 
}

export async function insertPosition(position: Position) {
  const currentDb = await getDb();
  const {
    symbol = '',
    description = '',
    quantity = 0,
    price = 0,
    marketValue = 0,
    costBasis = 0,
    gainDollar = 0,
    gainPercent = 0,
  } = position;

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

export async function getPositions() {
  const currentDb = await getDb();
  const res = currentDb.exec('SELECT * FROM positions ORDER BY symbol ASC');
  return res[0]?.values.map((row: any[]) => ({
    id: row[0],
    symbol: row[1],
    description: row[2],
    quantity: row[3],
    price: row[4],
    marketValue: row[5],
    costBasis: row[6],
    gainDollar: row[7],
    gainPercent: row[8]
  })) || [];
}

// New method for counting open and closed trades
export async function getTradeCounts(): Promise<TradeCounts> {
  const currentDb = await getDb();
  const results = currentDb.exec("SELECT SUM(CASE WHEN openCloseIndicator = 'O' THEN 1 ELSE 0 END) as openCount, SUM(CASE WHEN openCloseIndicator = 'C' THEN 1 ELSE 0 END) as closedCount FROM trades");
  if (results.length > 0 && results[0].values.length > 0) {
    const openCount = Number(results[0].values[0][0] ?? 0);
    const closedCount = Number(results[0].values[0][1] ?? 0);
    return { open: openCount, closed: closedCount };
  }
  return { open: 0, closed: 0 };
}

// New method for bulk inserting normalized trades
export async function insertNormalizedTrades(trades: NormalizedTradeData[]): Promise<{ successCount: number; errors: { tradeId: string | undefined, error: any }[] }> {
  if (!trades || trades.length === 0) {
    return { successCount: 0, errors: [] };
  }

  // *** DEBUG LOG: First trade object received by insertNormalizedTrades ***
  if (trades.length > 0) {
      console.log('[DEBUG] First trade object received by insertNormalizedTrades:', trades[0]);
  }

  const currentDb = await getDb();
  let successCount = 0;
  const insertionErrors: { tradeId: string | undefined, error: any }[] = [];
  let skippedDuplicates = 0;

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
        // --- Validation: required fields ---
        const missingFields: string[] = [];
        if (!trade.id) missingFields.push('id');
        if (!trade.symbol) missingFields.push('symbol');
        if (!trade.tradeDate) missingFields.push('tradeDate');
        if (!trade.broker) missingFields.push('broker');
        if (trade.quantity === undefined || trade.quantity === null) missingFields.push('quantity');
        if (trade.tradePrice === undefined || trade.tradePrice === null) missingFields.push('tradePrice');
        if (missingFields.length > 0) {
          const msg = `[VALIDATION ERROR] Missing required fields: ${missingFields.join(', ')} | Trade: ${JSON.stringify(trade)}`;
          console.error(msg);
          currentDb.run('INSERT INTO errors (lineNumber, message) VALUES (?, ?);', [null, msg]);
          continue;
        }
        // --- Anomaly Detection ---
        const anomalies = detectTradeAnomalies(trade);
        if (anomalies.length > 0) {
          anomalies.forEach(msg => {
            console.warn(`[ANOMALY] ${msg}`, trade);
            // Insert anomaly into errors table for later review
            currentDb.run('INSERT INTO errors (lineNumber, message) VALUES (?, ?);', [null, `[ANOMALY] ${msg} | Trade ID: ${trade.id}`]);
          });
        }
        // Deduplication: check for existing trade with same key fields (do NOT use id)
        const duplicateQuery = `SELECT COUNT(*) as count FROM trades WHERE symbol = ? AND tradeDate = ? AND quantity = ? AND tradePrice = ? AND broker = ?
          AND (expiryDate IS ? OR expiryDate = ?) AND (strikePrice IS ? OR strikePrice = ?) AND (putCall IS ? OR putCall = ?)`;
        const duplicateStmt = currentDb.prepare(duplicateQuery);
        const result = duplicateStmt.get([
          trade.symbol,
          trade.tradeDate,
          trade.quantity,
          trade.tradePrice,
          trade.broker,
          trade.expiryDate ?? null, trade.expiryDate ?? null,
          trade.strikePrice ?? null, trade.strikePrice ?? null,
          trade.putCall ?? null, trade.putCall ?? null
        ]) as unknown as { count: number };
        duplicateStmt.free();
        if (result.count > 0) {
          skippedDuplicates++;
          console.warn(`[DEDUPLICATION] Skipping duplicate trade:`, trade);
          continue;
        }
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
      } catch (e: any) {
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
    } else {
      currentDb.exec("COMMIT;");
    }
  } catch (e: any) {
    currentDb.exec("ROLLBACK;");
    // This catch is for errors in BEGIN, COMMIT, PREPARE, or unhandled errors in loop
    console.error('Transaction failed, rolled back:', e);
    return { successCount: 0, errors: [{ tradeId: undefined, error: e.message }] };
  }
  return { successCount, errors: insertionErrors };
} 

// New method for getting only closed trades
export async function getClosedTrades(): Promise<NormalizedTradeData[]> {
  const currentDb = await getDb();
  // Explicitly list all columns in the order they appear in NormalizedTradeData for mapping
  // Corrected column name from rawCsvRow to rawCsvRowJson
  const results = currentDb.exec("SELECT id, importTimestamp, broker, accountId, tradeDate, settleDate, symbol, dateTime, description, assetCategory, action, quantity, tradePrice, currency, proceeds, cost, commission, fees, netAmount, openCloseIndicator, costBasis, optionSymbol, expiryDate, strikePrice, putCall, multiplier, orderID, executionID, notes, rawCsvRowJson FROM trades WHERE openCloseIndicator = 'C'"); 
  if (!results[0] || !results[0].values) {
    return [];
  }
  return results[0].values.map((row: any[]): NormalizedTradeData => ({
    id: row[0] as string,
    importTimestamp: row[1] as string,
    broker: row[2] as BrokerType,
    accountId: row[3] as string | undefined,
    tradeDate: row[4] as string,
    settleDate: row[5] as string | undefined,
    symbol: row[6] as string,
    dateTime: row[7] as string | undefined,
    description: row[8] as string | undefined,
    assetCategory: row[9] as AssetCategory,
    action: row[10] as string | undefined,
    quantity: row[11] as number,
    tradePrice: row[12] as number,
    currency: row[13] as string,
    proceeds: row[14] as number | null,
    cost: row[15] as number | null,
    commission: row[16] as number | null,
    fees: row[17] as number | null,
    netAmount: row[18] as number,
    openCloseIndicator: row[19] as OpenCloseIndicator | undefined,
    costBasis: row[20] as number | null,
    optionSymbol: row[21] as string | undefined,
    expiryDate: row[22] as string | undefined,
    strikePrice: row[23] as number | null,
    putCall: row[24] as PutCall | undefined,
    multiplier: row[25] as number | undefined,
    orderID: row[26] as string | undefined,
    executionID: row[27] as string | undefined,
    notes: row[28] as string | undefined,
    // Corrected mapping to use the value from rawCsvRowJson (index 29)
    rawCsvRow: row[29] ? JSON.parse(row[29] as string) : undefined, 
  }));
}

export async function getHeatmapData(): Promise<{ symbol: string; date: string; pnl: number }[]> {
  const currentDb = await getDb();
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
  
  return results[0].values.map((row: any[]) => ({
    symbol: row[0] as string,
    date: row[1] as string,
    pnl: Number(row[2]) || 0,
  }));
} 

export async function getDailyPnlForReconciliation(): Promise<DailyPnlData[]> {
  console.log('[DEBUG getDailyPnlForReconciliation] Function called.'); 
  let currentDb: Database | null = null;
  try {
    currentDb = await getDb();
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
  } catch (error: any) {
    console.error('[ERROR in getDailyPnlForReconciliation]:', error);
    throw error; 
  }
} 

// New function to insert multiple positions
export async function insertPositions(positions: Position[]): Promise<void> {
  if (!positions || positions.length === 0) {
    return; // Early return if empty
  }
  
  const currentDb = await getDb();
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
  } catch (e) {
    currentDb.exec("ROLLBACK;");
    console.error("Error inserting positions, rolled back:", e);
    throw e; // Re-throw the error after rollback
  }
} 

// New interface for the P&L summary data
export interface OverallPnlSummary {
  totalPnl: number;
  totalPnlPercent: number; // This will be harder to calculate without total investment, so let's simplify for now
  lastDayPnl: number;
  lastDayPnlPercent: number; // Similar challenge, will simplify
  lastDayDate?: string; // YYYY-MM-DD
}

export const getOverallPnlSummary = async (): Promise<OverallPnlSummary> => {
  const db = await getDb();
  let totalPnl = 0;
  let lastDayPnl = 0;
  let lastDayDate: string | undefined = undefined;

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
    
    lastDayDate = closedTrades[0].tradeDate?.substring(0,10);

    if (lastDayDate) {
      closedTrades.forEach(trade => {
        if (trade.tradeDate?.substring(0,10) === lastDayDate) {
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

/**
 * Fetches daily realized P&L data and structures it for the heatmap.
 * Aggregates P&L by date for all closed trades and formats into a 2D array
 * where rows are weeks and columns are days (Mon-Sun).
 * Assumes dates are in YYYY-MM-DD format.
 * @returns Promise<number[][]> A 2D array suitable for the heatmap component.
 */
export async function getDailyPnlHeatmapData(): Promise<number[][]> {
  // Get all closed trades with their realized P&L
  const trades = await getClosedTrades();

  // Aggregate daily P&L
  const dailyPnlMap = new Map<string, number>();
  for (const trade of trades) {
    if (!trade.tradeDate) continue; // Skip trades without a date
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
  const heatmap: (number | null)[][] = Array.from({ length: numberOfWeeks }, () => Array(7).fill(null)); // Use null for missing days

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
   const finalHeatmap: number[][] = heatmap.map(row =>
     row.map(value => value === null ? 0 : value)
   );

  return finalHeatmap;
}

// New method for bulk inserting normalized trades and positions
export async function insertTradesAndPositions(trades: NormalizedTradeData[], positions: Position[]): Promise<void> {
  // Ensure trades and positions are arrays, even if empty
  if ((!trades || trades.length === 0) && (!positions || positions.length === 0)) {
    return;
  }

  const currentDb = await getDb();
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
        } catch (e: any) {
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
  } catch (e: any) {
    currentDb.exec("ROLLBACK;");
    console.error('Transaction failed, rolled back:', e);
    throw e; // Re-throw the error after rollback
  }
}

// --- Migration Logic --- 

const LATEST_SCHEMA_VERSION = 2;

function runMigrations(db: Database) {
  const currentVersion = db.exec("PRAGMA user_version")[0].values[0][0] as number;
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
    } catch (error) {
      console.error('[ERROR runMigrations] Migration failed, rolling back transaction:', error);
      db.exec("ROLLBACK;");
      // Rethrow or handle the error appropriately
      throw new Error(`Database migration failed: ${error}`);
    }
  } else {
    console.log('[DEBUG runMigrations] Database schema is up to date.');
  }
}

function migrateToV2(db: Database) {
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
      } catch (e) {
          // Check if the error is because the column already exists (SQLite error code 1: 'duplicate column name')
          // Note: sql.js might not provide detailed error codes easily. A simple check might be needed.
           if (e instanceof Error && e.message.includes('duplicate column name')) {
               console.warn(`[WARN migrateToV2] Column ${col.name} already exists.`);
           } else {
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
export async function saveIBKRAccount(account: IBKRAccount): Promise<void> {
  const currentDb = await getDb();
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
  } catch (error) {
    console.error(`[DatabaseService] Error saving account ${account.accountId}:`, error);
    throw error;
  } finally {
    stmt.free();
  }
}

// Helper function to parse IBKR option symbol (can be moved to a utility file)
// Basic version, assumes underlying is the first part before space.
const parseIBKROptionUnderlying = (ibkrSymbol: string): string => {
  return ibkrSymbol.split(' ')[0] || ibkrSymbol;
};

export async function saveIBKRTradeRecords(records: IBKRTradeRecord[], sourceAccountId: string): Promise<{ successCount: number; errors: any[] }> {
  const normalizedTrades: NormalizedTradeData[] = [];
  const transformationErrors: any[] = [];

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
        } else {
          tradeDate = datePart; 
          console.warn(`[DatabaseService] Could not parse date-time for trade: ${record.dateTime}. Storing as is.`);
        }
      } catch (dateError) {
        console.warn(`[DatabaseService] Error parsing date-time for trade: ${record.dateTime}. Storing as is. Error: ${dateError}`);
        if (record.dateTime) {
            tradeDate = record.dateTime.split(',')[0];
        }
      }

      const id = uuidv4();
      const assetCategoryMapped = record.assetCategory.toUpperCase().includes('OPTION') ? 'OPT' :
                                record.assetCategory.toUpperCase().includes('STOCK') || record.assetCategory.toUpperCase().includes('EQUITY') ? 'STK' :
                                'Unknown' as AssetCategory;

      let mappedSymbol = record.symbol;
      let optionDetails = {
        optionSymbol: undefined as string | undefined,
        expiryDate: undefined as string | undefined,
        strikePrice: undefined as number | null | undefined,
        putCall: undefined as PutCall | undefined,
        multiplier: undefined as number | undefined,
      };

      if (assetCategoryMapped === 'OPT') {
        const parsedOption = parseIBKROptionSymbol(record.symbol);
        if (parsedOption) {
          mappedSymbol = parsedOption.underlying;
          optionDetails.optionSymbol = record.symbol;
          optionDetails.expiryDate = parsedOption.expiry.toISOString().split('T')[0];
          optionDetails.strikePrice = parsedOption.strike;
          optionDetails.putCall = parsedOption.putCall === 'PUT' ? 'P' : parsedOption.putCall === 'CALL' ? 'C' : undefined;
        } else {
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
      } else { // Sell
        cost = 0;
        proceeds = Math.abs(record.csvProceeds || (record.quantity * record.tradePrice * -1));
        netAmount = proceeds - commission;
      }

      const normalized: NormalizedTradeData = {
        id,
        importTimestamp: new Date().toISOString(),
        broker: BrokerType.IBKR,
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
        cost: cost > 0 ? cost: null,
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
    } catch (error: any) {
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
  } else {
    return { successCount: 0, errors: transformationErrors };
  }
}
// --- End added functions ---

const CURRENT_SCHEMA_VERSION = 2;

export class DatabaseService {
  db: Database | null = null;

  async init(): Promise<void> {
    const SQL = await initSqlJs();
    // TODO: Load from IndexedDB or create new
    this.db = new SQL.Database();
    await this.migrateGoalConfig();
    await this.migrateOnboardingTables(); // New migration for Task 28.1
  }

  async migrateGoalConfig(): Promise<void> {
    if (!this.db) throw new Error('DB not initialized');
    this.db.exec('BEGIN TRANSACTION');
    try {
      // Check current version
      const versionStmt = this.db.exec("PRAGMA user_version");
      const version = Number(versionStmt[0]?.values[0][0]) || 0;
      if (version < 1) {
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS goal_sizing_config (
            id INTEGER PRIMARY KEY,
            user_id TEXT NOT NULL DEFAULT 'default',
            config_data JSON NOT NULL,
            goal_type TEXT GENERATED ALWAYS AS (json_extract(config_data, '$.goalType')) VIRTUAL,
            max_position_size REAL GENERATED ALWAYS AS (json_extract(config_data, '$.sizingRules.maxPositionSize')) VIRTUAL,
            max_total_exposure REAL GENERATED ALWAYS AS (json_extract(config_data, '$.sizingRules.maxTotalExposure')) VIRTUAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);
      }
      // Don't set version here - let migrateOnboardingTables handle the final version
      this.db.exec('COMMIT');
    } catch (error: any) {
      this.db.exec('ROLLBACK');
      throw new Error(`Migration failed: ${error.message}`);
    }
  }

  saveGoalConfig(config: GoalSizingConfig): void {
    if (!this.db) throw new Error('DB not initialized');
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO goal_sizing_config (user_id, config_data, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(['default', JSON.stringify(config)]);
    stmt.free();
  }

  loadGoalConfig(): GoalSizingConfig | null {
    if (!this.db) throw new Error('DB not initialized');
    const stmt = this.db.prepare('SELECT config_data FROM goal_sizing_config WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1');
    const result = stmt.getAsObject(['default']);
    stmt.free();
    if (result.config_data) {
      return JSON.parse(result.config_data as string);
    }
    return null;
  }

  // Placeholder for backup/restore methods for later phases

  async migrateOnboardingTables(): Promise<void> {
    if (!this.db) throw new Error('DB not initialized');
    this.db.exec('BEGIN TRANSACTION');
    try {
      // Check current version
      const versionStmt = this.db.exec("PRAGMA user_version");
      const version = Number(versionStmt[0]?.values[0][0]) || 0;
      
      if (version < 2) {
        // Onboarding Progress Table
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS onboarding_progress (
            id INTEGER PRIMARY KEY,
            user_id TEXT NOT NULL DEFAULT 'default',
            phase INTEGER NOT NULL DEFAULT 1,
            current_step TEXT,
            completed_steps JSON NOT NULL DEFAULT '[]',
            phase_data JSON,
            started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME,
            UNIQUE(user_id)
          );
        `);

        // User Context Table for seamless transitions
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS user_context (
            id INTEGER PRIMARY KEY,
            user_id TEXT NOT NULL DEFAULT 'default',
            context_type TEXT NOT NULL,
            context_data JSON NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME,
            UNIQUE(user_id, context_type)
          );
        `);

        // Goal Import History for tracking imported goals
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS goal_import_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL DEFAULT 'default',
            import_source TEXT NOT NULL,
            import_data JSON NOT NULL,
            imported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'active'
          );
        `);

        // Plan vs Reality Analysis Results
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS plan_reality_analysis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL DEFAULT 'default',
            analysis_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            goal_config_id INTEGER,
            compliance_score REAL,
            violations JSON,
            suggestions JSON,
            performance_metrics JSON,
            FOREIGN KEY (goal_config_id) REFERENCES goal_sizing_config(id)
          );
        `);

        // Backup Metadata for IndexedDB integration
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS backup_metadata (
            id INTEGER PRIMARY KEY,
            user_id TEXT NOT NULL DEFAULT 'default',
            backup_type TEXT NOT NULL,
            backup_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            backup_size INTEGER,
            checksum TEXT,
            status TEXT DEFAULT 'active',
            UNIQUE(user_id, backup_type)
          );
        `);
      }
      
      this.db.exec(`PRAGMA user_version = ${CURRENT_SCHEMA_VERSION}`);
      this.db.exec('COMMIT');
    } catch (error: any) {
      this.db.exec('ROLLBACK');
      throw new Error(`Onboarding migration failed: ${error.message}`);
    }
  }

  // Onboarding Progress Management
  saveOnboardingProgress(userId: string = 'default', phase: number, currentStep: string, completedSteps: string[], phaseData?: any): void {
    if (!this.db) throw new Error('DB not initialized');
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO onboarding_progress 
      (user_id, phase, current_step, completed_steps, phase_data, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run([
      userId, 
      phase, 
      currentStep, 
      JSON.stringify(completedSteps),
      phaseData ? JSON.stringify(phaseData) : null
    ]);
    stmt.free();
  }

  loadOnboardingProgress(userId: string = 'default'): OnboardingProgress | null {
    if (!this.db) throw new Error('DB not initialized');
    const stmt = this.db.prepare(`
      SELECT * FROM onboarding_progress WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1
    `);
    const result = stmt.getAsObject([userId]);
    stmt.free();
    
    if (result.phase) {
      return {
        phase: result.phase as number,
        currentStep: result.current_step as string,
        completedSteps: JSON.parse(result.completed_steps as string || '[]'),
        phaseData: result.phase_data ? JSON.parse(result.phase_data as string) : null,
        startedAt: result.started_at as string,
        updatedAt: result.updated_at as string,
        completedAt: result.completed_at as string | null
      };
    }
    return null;
  }

  completeOnboardingPhase(userId: string = 'default'): void {
    if (!this.db) throw new Error('DB not initialized');
    const stmt = this.db.prepare(`
      UPDATE onboarding_progress 
      SET completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `);
    stmt.run([userId]);
    stmt.free();
  }

  // User Context Management
  saveUserContext(userId: string = 'default', contextType: string, contextData: any, expiresAt?: string): void {
    if (!this.db) throw new Error('DB not initialized');
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO user_context 
      (user_id, context_type, context_data, updated_at, expires_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
    `);
    stmt.run([userId, contextType, JSON.stringify(contextData), expiresAt || null]);
    stmt.free();
  }

  loadUserContext(userId: string = 'default', contextType: string): any | null {
    if (!this.db) throw new Error('DB not initialized');
    const stmt = this.db.prepare(`
      SELECT context_data, expires_at FROM user_context 
      WHERE user_id = ? AND context_type = ?
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    `);
    const result = stmt.getAsObject([userId, contextType]);
    stmt.free();
    
    if (result.context_data) {
      return JSON.parse(result.context_data as string);
    }
    return null;
  }

  clearExpiredContext(): void {
    if (!this.db) throw new Error('DB not initialized');
    const stmt = this.db.prepare(`
      DELETE FROM user_context WHERE expires_at IS NOT NULL AND expires_at <= CURRENT_TIMESTAMP
    `);
    stmt.run();
    stmt.free();
  }

  // Goal Import Management
  saveGoalImport(userId: string = 'default', source: string, importData: any): number {
    if (!this.db) throw new Error('DB not initialized');
    const stmt = this.db.prepare(`
      INSERT INTO goal_import_history (user_id, import_source, import_data)
      VALUES (?, ?, ?)
    `);
    stmt.run([userId, source, JSON.stringify(importData)]);
    stmt.free();
    
    // Get the last inserted row ID
    const lastIdStmt = this.db.prepare('SELECT last_insert_rowid() as id');
    const result = lastIdStmt.getAsObject([]);
    lastIdStmt.free();
    return result.id as number;
  }

  loadGoalImports(userId: string = 'default'): GoalImport[] {
    if (!this.db) throw new Error('DB not initialized');
    const results = this.db.exec(`
      SELECT * FROM goal_import_history WHERE user_id = ? AND status = 'active'
      ORDER BY imported_at DESC
    `, [userId]);
    
    if (results.length === 0 || !results[0].values) {
      return [];
    }
    
    const columns = results[0].columns;
    return results[0].values.map((row: any[]) => {
      const rowObj: any = {};
      columns.forEach((col, index) => {
        rowObj[col] = row[index];
      });
      
      return {
        id: rowObj.id,
        source: rowObj.import_source,
        data: JSON.parse(rowObj.import_data),
        importedAt: rowObj.imported_at,
        status: rowObj.status
      };
    });
  }

  // Plan vs Reality Analysis
  savePlanRealityAnalysis(userId: string = 'default', goalConfigId: number, analysis: PlanRealityAnalysis): void {
    if (!this.db) throw new Error('DB not initialized');
    const stmt = this.db.prepare(`
      INSERT INTO plan_reality_analysis 
      (user_id, goal_config_id, compliance_score, violations, suggestions, performance_metrics)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      userId,
      goalConfigId,
      analysis.complianceScore,
      JSON.stringify(analysis.violations),
      JSON.stringify(analysis.suggestions),
      JSON.stringify(analysis.performanceMetrics)
    ]);
    stmt.free();
  }

  loadLatestPlanRealityAnalysis(userId: string = 'default'): PlanRealityAnalysis | null {
    if (!this.db) throw new Error('DB not initialized');
    const stmt = this.db.prepare(`
      SELECT * FROM plan_reality_analysis WHERE user_id = ?
      ORDER BY analysis_date DESC LIMIT 1
    `);
    const result = stmt.getAsObject([userId]);
    stmt.free();
    
    if (result.compliance_score !== undefined) {
      return {
        complianceScore: result.compliance_score as number,
        violations: JSON.parse(result.violations as string || '[]'),
        suggestions: JSON.parse(result.suggestions as string || '[]'),
        performanceMetrics: JSON.parse(result.performance_metrics as string || '{}'),
        analysisDate: result.analysis_date as string
      };
    }
    return null;
  }

  // Backup Management
  saveBackupMetadata(userId: string = 'default', backupType: string, size: number, checksum: string): void {
    if (!this.db) throw new Error('DB not initialized');
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO backup_metadata 
      (user_id, backup_type, backup_size, checksum)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run([userId, backupType, size, checksum]);
    stmt.free();
  }

  getBackupMetadata(userId: string = 'default', backupType: string): BackupMetadata | null {
    if (!this.db) throw new Error('DB not initialized');
    const stmt = this.db.prepare(`
      SELECT * FROM backup_metadata WHERE user_id = ? AND backup_type = ? AND status = 'active'
    `);
    const result = stmt.getAsObject([userId, backupType]);
    stmt.free();
    
    if (result.backup_timestamp) {
      return {
        backupType: result.backup_type as string,
        timestamp: result.backup_timestamp as string,
        size: result.backup_size as number,
        checksum: result.checksum as string,
        status: result.status as string
      };
    }
    return null;
  }
}