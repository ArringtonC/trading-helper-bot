import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import { Position } from '../utils/parsePositionCSV'; // adjust path as needed
import { NormalizedTradeData } from '../types/trade'; // Added import

let SQL: SqlJsStatic;
// let db: Database; // db will be initialized and potentially re-assigned by getDb()

// Singleton promise for SQL.js initialization
let sqlJsPromise: Promise<SqlJsStatic> | null = null;

const โมเดลเริ่มต้นSqlJs = (): Promise<SqlJsStatic> => {
  if (!sqlJsPromise) {
    sqlJsPromise = initSqlJs({ locateFile: (file: string) => `https://sql.js.org/dist/${file}` });
  }
  return sqlJsPromise;
};

// Singleton promise for Database initialization
let dbPromise: Promise<Database> | null = null;

const getDb = async (): Promise<Database> => {
  if (!dbPromise) {
    dbPromise = โมเดลเริ่มต้นSqlJs().then(SQLModule => {
      SQL = SQLModule;
      const existingDb = new SQL.Database(); // Create a new db instance
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
          rawCsvRowJson TEXT
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
      `);
      return existingDb;
    });
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
  const res = currentDb.exec("SELECT id, tradeDate, broker, symbol, assetCategory, quantity, tradePrice, currency, netAmount, openCloseIndicator, commission, fees, proceeds, cost, optionSymbol, expiryDate, strikePrice, putCall, multiplier FROM trades ORDER BY importTimestamp DESC");
  if (!res[0]) return [];
  return res[0].values.map(r => ({
    id: r[0] as string,
    tradeDate: r[1] as string,
    broker: r[2] as string,
    symbol: r[3] as string,
    assetCategory: r[4] as string,
    quantity: r[5] as number,
    tradePrice: r[6] as number,
    currency: r[7] as string,
    netAmount: r[8] as number,
    openCloseIndicator: r[9] as string | undefined,
    commission: r[10] as number | undefined,
    fees: r[11] as number | undefined,
    proceeds: r[12] as number | undefined,
    cost: r[13] as number | undefined,
    optionSymbol: r[14] as string | undefined,
    expiryDate: r[15] as string | undefined,
    strikePrice: r[16] as number | undefined,
    putCall: r[17] as string | undefined,
    multiplier: r[18] as number | undefined,
  }));
}

export async function getSummary() {
  const currentDb = await getDb();
  const res = currentDb.exec('SELECT cumulativePL FROM summary');
  return res[0]?.values[0][0] ?? 0;
}

export async function getAggregatePL(): Promise<number> {
  const currentDb = await getDb();
  // This will need to be updated to reflect P&L calculation from NormalizedTradeData
  // For now, let's sum netAmount as a proxy, though this isn't true P&L
  const res = currentDb.exec(
    `SELECT COALESCE(SUM(netAmount), 0) AS total FROM trades`
  );
  return Number(res[0]?.values[0][0] ?? 0);
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