import fs from 'fs';
import path from 'path';
import { saveIBKRTradeRecords } from '../src/services/DatabaseService';
import { IBKRActivityStatementParser } from '../src/services/brokers/parsers/IBKRActivityStatementParser';

const IMPORT_DIR = path.join(__dirname, '../import');
const ARCHIVE_DIR = path.join(IMPORT_DIR, 'archive');

async function ensureArchiveDir() {
  if (!fs.existsSync(ARCHIVE_DIR)) {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  }
}

function parseIBKRCSV(csvContent: string) {
  const parser = new IBKRActivityStatementParser(csvContent);
  return parser.extractTrades(); // returns IBKRTradeRecord[]
}

async function autoImport() {
  await ensureArchiveDir();
  const files = fs.readdirSync(IMPORT_DIR).filter(f => f.endsWith('.csv'));
  if (files.length === 0) {
    console.log('No new CSV files to import.');
    return;
  }
  for (const file of files) {
    const filePath = path.join(IMPORT_DIR, file);
    try {
      const csvContent = fs.readFileSync(filePath, 'utf8');
      const records = parseIBKRCSV(csvContent); // Robust parser
      const result = await saveIBKRTradeRecords(records, 'AUTO_IMPORT');
      console.log(`Imported ${result.successCount} trades from ${file}. Errors: ${result.errors.length}`);
      // Move file to archive
      const archivePath = path.join(ARCHIVE_DIR, file);
      fs.renameSync(filePath, archivePath);
      console.log(`Archived: ${file}`);
    } catch (err) {
      console.error(`Error importing ${file}:`, err);
      // Optionally move to a failed folder or leave in place for retry
    }
  }
}

if (require.main === module) {
  autoImport().catch(console.error);
} 
 
import path from 'path';
import { saveIBKRTradeRecords } from '../src/services/DatabaseService';
import { IBKRActivityStatementParser } from '../src/services/brokers/parsers/IBKRActivityStatementParser';

const IMPORT_DIR = path.join(__dirname, '../import');
const ARCHIVE_DIR = path.join(IMPORT_DIR, 'archive');

async function ensureArchiveDir() {
  if (!fs.existsSync(ARCHIVE_DIR)) {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  }
}

function parseIBKRCSV(csvContent: string) {
  const parser = new IBKRActivityStatementParser(csvContent);
  return parser.extractTrades(); // returns IBKRTradeRecord[]
}

async function autoImport() {
  await ensureArchiveDir();
  const files = fs.readdirSync(IMPORT_DIR).filter(f => f.endsWith('.csv'));
  if (files.length === 0) {
    console.log('No new CSV files to import.');
    return;
  }
  for (const file of files) {
    const filePath = path.join(IMPORT_DIR, file);
    try {
      const csvContent = fs.readFileSync(filePath, 'utf8');
      const records = parseIBKRCSV(csvContent); // Robust parser
      const result = await saveIBKRTradeRecords(records, 'AUTO_IMPORT');
      console.log(`Imported ${result.successCount} trades from ${file}. Errors: ${result.errors.length}`);
      // Move file to archive
      const archivePath = path.join(ARCHIVE_DIR, file);
      fs.renameSync(filePath, archivePath);
      console.log(`Archived: ${file}`);
    } catch (err) {
      console.error(`Error importing ${file}:`, err);
      // Optionally move to a failed folder or leave in place for retry
    }
  }
}

if (require.main === module) {
  autoImport().catch(console.error);
} 
 
 
 
 