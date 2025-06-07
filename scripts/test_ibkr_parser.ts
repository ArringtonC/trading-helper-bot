import { IBKRActivityStatementParser } from '../src/services/IBKRActivityStatementParser';
import { IBKRImportResult, IBKRTradeRecord, IBKRAccount, IBKRPosition } from '../src/types/ibkr'; // Adjust path as needed
import * as fs from 'fs';
import * as path from 'path';
// Import DatabaseService methods AND the new path setter
import { getDb, saveIBKRAccount, saveIBKRTradeRecords, getTrades, resetDatabase, setSqlJsWasmPathOverride } from '../src/services/DatabaseService';

// const csvContent = `Statement,Header,Field Name,Field Value,,,,,,,,,,,,,,
// ... placeholder ...
// `; // Placeholder no longer needed

// --- Determine and set WASM path for Node.js context ---
let nodeWasmPath = path.join(__dirname, '..', '..', 'public', 'sqljs-wasm.wasm'); // Path from dist/scripts/scripts -> project_root/public
if (!fs.existsSync(nodeWasmPath)) {
  console.warn(`[test_ibkr_parser] WASM not found at ${nodeWasmPath}. Trying node_modules fallback...`);
  try {
    // This require.resolve is fine here, as this script is executed by Node, not Webpack for browser.
    const sqlJsNodeModulesPath = require.resolve('sql.js/dist/sql-wasm.wasm');
    if (fs.existsSync(sqlJsNodeModulesPath)) {
      nodeWasmPath = sqlJsNodeModulesPath;
      console.log(`[test_ibkr_parser] Found WASM in node_modules: ${nodeWasmPath}`);
    } else {
      console.error("[test_ibkr_parser] Fallback WASM from node_modules also not found.");
    }
  } catch (e) {
    console.error("[test_ibkr_parser] Error resolving sql.js path from node_modules:", e);
  }
}
setSqlJsWasmPathOverride(nodeWasmPath);
console.log(`[test_ibkr_parser] Overriding DatabaseService WASM path with: ${nodeWasmPath}`);
// --- End WASM path setting ---

async function testParserAndStorage() {
  console.log('Starting IBKR Parser and Storage Test...');

  // Reset database for a clean test run
  console.log('Resetting database...');
  await resetDatabase();
  console.log('Database reset.');

  const csvFilePath = path.join(__dirname, '../../../U5922405_20250303_20250403.csv');
  let csvContentFull: string;

  try {
    csvContentFull = fs.readFileSync(csvFilePath, 'utf-8');
    console.log(`Successfully read CSV file: ${csvFilePath}`);
  } catch (readError: any) {
    console.error(`Failed to read CSV file at ${csvFilePath}: ${readError.message}`);
    return;
  }
  
  const parser = new IBKRActivityStatementParser(csvContentFull);
  let importResult: IBKRImportResult;

  try {
    importResult = parser.parse();
    console.log('\n=== Parser Result ===');
    console.log(`Success: ${importResult.success}`);

    if (importResult.error) {
      console.error(`Error: ${importResult.error}`);
    }
    if (importResult.errors && importResult.errors.length > 0) {
      console.error('Detailed Errors:');
      importResult.errors.forEach(err => console.error(`- ${err}`));
    }
    if (importResult.warnings && importResult.warnings.length > 0) {
      console.warn('Warnings:');
      importResult.warnings.forEach(warn => console.warn(`- ${warn}`));
    }

    if (!importResult.success || !importResult.account || !importResult.trades) {
      console.error('Parsing failed or did not yield account/trades. Aborting storage test.');
      return;
    }

    console.log('\n--- Parsed Account Info ---');
    console.log(JSON.stringify(importResult.account, null, 2));
    
    console.log('\n--- Parsed Trades (First 2) ---');
    importResult.trades.slice(0, 2).forEach(trade => console.log(JSON.stringify(trade, null, 2)));

    // Save to Database
    console.log('\n=== Database Storage Test ===');
    await saveIBKRAccount(importResult.account);
    console.log(`Account ${importResult.account.accountId} saved.`);

    const saveTradesResult = await saveIBKRTradeRecords(importResult.trades, importResult.account.accountId);
    console.log(`Trade records processing result: ${saveTradesResult.successCount} successes, ${saveTradesResult.errors.length} errors during transformation/saving.`);
    if (saveTradesResult.errors.length > 0) {
        console.error('Errors during trade saving:', JSON.stringify(saveTradesResult.errors.slice(0,5), null, 2));
    }

    // Verify by fetching trades
    console.log('\n--- Fetching Trades from DB (First 5) ---');
    const tradesFromDb = await getTrades();
    if (tradesFromDb && tradesFromDb.length > 0) {
      console.log(`Found ${tradesFromDb.length} trades in DB:`);
      tradesFromDb.slice(0, 5).forEach(trade => console.log(JSON.stringify(trade, null, 2)));
    } else {
      console.log('No trades found in DB after attempting to save.');
    }

  } catch (e: any) {
    console.error('\n!!! EXCEPTION CAUGHT during parsing or DB operations !!!');
    console.error(e.message);
    console.error(e.stack);
    console.log('\n--- Parser Debug State on Exception ---');
    const debugState = parser.getDebugState(); // Get debug logs from parser instance
    debugState.slice(-50).forEach(log => console.log(log)); // Print last 50
  }

  // Close the database connection if sql.js allows/requires it.
  // For sql.js, direct closing is usually handled by WASM GC or by re-initializing the DB.
  // const db = await getDb();
  // if (db && typeof (db as any).close === 'function') { (db as any).close(); console.log('DB closed.') }
 
  console.log('\nTest script finished.');
}

testParserAndStorage().catch(console.error); 
 
 
 
 
 