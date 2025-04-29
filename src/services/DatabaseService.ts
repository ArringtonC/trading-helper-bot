import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

let SQL: SqlJsStatic;
let db: Database;

export async function initDatabase(): Promise<void> {
  if (db) return;

  SQL = await initSqlJs({ locateFile: (file: string) => `https://sql.js.org/dist/${file}` });
  db = new SQL.Database();

  // Create schema
  db.run(`
    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT,
      dateTime TEXT,
      quantity INTEGER,
      proceeds REAL,
      basis REAL,
      commissionFee REAL,
      realizedPL REAL,
      unrealizedPL REAL,
      tradePL REAL
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
  `);
}

export function insertTrade(trade: any) {
  const stmt = db.prepare(`
    INSERT INTO trades (symbol, dateTime, quantity, proceeds, basis, commissionFee, realizedPL, unrealizedPL, tradePL)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run([
    trade.symbol,
    trade.dateTime,
    trade.quantity,
    trade.proceeds,
    trade.basis,
    trade.commissionFee,
    trade.realizedPL,
    trade.unrealizedPL,
    trade.tradePL
  ]);
  stmt.free();
}

export function insertSummary(cumulativePL: number) {
  db.run('DELETE FROM summary;');
  db.run('INSERT INTO summary (id, cumulativePL) VALUES (1, ?);', [cumulativePL]);
}

export function getTrades() {
  const res = db.exec('SELECT * FROM trades ORDER BY dateTime ASC');
  return res[0]?.values.map((row: any[]) => ({
    id: row[0],
    symbol: row[1],
    dateTime: row[2],
    quantity: row[3],
    proceeds: row[4],
    basis: row[5],
    commissionFee: row[6],
    realizedPL: row[7],
    unrealizedPL: row[8],
    tradePL: row[9]
  })) || [];
}

export function getSummary() {
  const res = db.exec('SELECT cumulativePL FROM summary');
  return res[0]?.values[0][0] ?? 0;
}

export function getAggregatePL(): number {
  const res = db.exec(
    `SELECT COALESCE(SUM(realizedPL + unrealizedPL), 0) AS total FROM trades`
  );
  return Number(res[0]?.values[0][0] ?? 0);
}

export function resetDatabase() {
  db.run('DELETE FROM trades');
  db.run('DELETE FROM summary');
  db.run('DELETE FROM errors');
} 