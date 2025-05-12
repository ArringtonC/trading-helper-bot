/*  parseTradeCSV.ts
    Robust "section-aware + header-mapping" IBKR trade-CSV parser
----------------------------------------------------------------- */

import { parse } from 'papaparse';

export interface RawTrade {
  symbol: string;
  quantity: number;
  price: number;
  commissionFee: number;
  dateTime: string;
  proceeds: number;
  basis: number;
  tradeCode?: string;
  rawRealizedPL?: number; // Add field for raw Realized P/L
  [key: string]: any;
}

interface ParsedTrade extends RawTrade {
  positionAfter: number;    // running share/contract count
  isClose: boolean;         // true when this trade flattens the position OR has a closing code
  realizedPL: number;      // non-zero only when isClose is true
}

// user-facing error to be thrown
export class CSVFormatError extends Error {}

// map exactly what your CSV calls each column → your internal key
const HEADER_ALIASES: Record<string, keyof RawTrade | '__ignore'> = {
  // ignore these (keep ignored for now, we'll focus on Code)
  Statement:          '__ignore',
  Header:             '__ignore',
  DataDiscriminator:  '__ignore',

  // common IBKR header names → internal keys (keep ignored for now)
  'Asset Category':   '__ignore',
  'Currency':         '__ignore',
  'Account':          '__ignore',
  'C. Price':         '__ignore',
  'Realized P/L':     'rawRealizedPL', // Map Realized P/L to rawRealizedPL
  'MTM P/L':         '__ignore',

  // the ones you *do* need:
  'Symbol':           'symbol',
  'Quantity':         'quantity',
  'Comm/Fee':         'commissionFee',
  'Date/Time':        'dateTime',
  'Proceeds':         'proceeds',
  'Basis':           'basis',
  
  // *** Include the 'Code' column ***
  'Code':             'tradeCode', // Map 'Code' to 'tradeCode'
};

// Add all possible price header variations
const PRICE_ALIASES = ['Price', 'T. Price', 'Trade Price', 'Trade_Price', 'Price Executed'];
PRICE_ALIASES.forEach(h => HEADER_ALIASES[h] = 'price');

export function isTradeCSV(text: string): boolean {
  console.log('[DEBUG] isTradeCSV called');
  return text.includes('Trades,Header') && text.includes('Symbol') && text.includes('Quantity');
}

export function isPositionCSV(text: string): boolean {
  return text.includes('Qty (Quantity)') && text.includes('Gain $') && text.includes('Market Value');
}

export function parseTradeCSV(fileText: string) {
  console.log('[DEBUG] parseTradeCSV called');
  const lines = fileText.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) throw new Error('CSV is empty');
  const headers = lines[0].split(',').map(h => h.trim());
  console.log('[DEBUG] Detected CSV headers:', headers);

  // 1. detect delimiter (comma / tab / semicolon)
  const delim = [',','\t',';']
    .find(d => fileText.indexOf(d) > -1 && fileText.indexOf(d) < fileText.indexOf('\n')) || ',';
  const { data: rows } = parse<string[]>(fileText, { delimiter: delim, skipEmptyLines: true });

  let inTradesSection = false;
  let headerRow: string[] = [];
  const trades: ParsedTrade[] = [];
  const posByKey: Record<string, number> = {};  // Track positions by symbol

  for (const row of rows as string[][]) {
    const [section, type, ...rest] = row.map(c => c.trim());

    // 2. find your header line
    if (section === 'Trades' && type === 'Header') {
      inTradesSection = true;
      headerRow = rest;
      console.log('[DEBUG] Detected Trades section headers:', headerRow);
      continue;
    }

    // 3. process each data row
    if (inTradesSection && section === 'Trades' && type === 'Data') {
      const record: Partial<RawTrade> = {};
      rest.forEach((cell, i) => {
        const colName = headerRow[i] ?? `col${i}`;
        const alias = HEADER_ALIASES[colName];
        if (alias && alias !== '__ignore') {
          // coerce numbers if needed
          record[alias] =
            alias === 'symbol' || alias === 'dateTime' || alias === 'tradeCode'
              ? cell
              : Number(cell);
        }
      });

      // Calculate position after trade and determine if it closes position using tradeCode or position flattening
      const key = record.symbol as string;
      const qty = record.quantity as number;
      const prev = posByKey[key] || 0;
      const after = prev + qty;

      // Determine if the trade is closing based simply on whether raw Realized P/L is present
      const isClose = record.rawRealizedPL !== undefined;

      const parsedTrade: ParsedTrade = {
        ...record as RawTrade,
        positionAfter: after,
        isClose,
        // realizedPL only when isClose is true
        realizedPL: isClose 
          ? (record.proceeds as number) - (record.basis as number) - (record.commissionFee as number)
          : 0
      };

      trades.push(parsedTrade);
      posByKey[key] = after;
      continue;
    }

    // 4. if we've left the Trades section, stop parsing
    if (inTradesSection && section !== 'Trades') {
      break;
    }
  }

  // 5. validate all required keys are present
  const missing = ['symbol','quantity','price','commissionFee','dateTime','proceeds','basis']
    .filter(k => trades.some(t => t[k] === undefined));
  if (missing.length) {
    throw new CSVFormatError(
      `Invalid Trades section format.\n` +
      `• Missing columns: ${missing.join(', ')}\n` +
      `• Detected headers: ${headerRow.join(', ')}`
    );
  }

  return trades;
} 