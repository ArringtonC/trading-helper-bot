import { parse } from 'papaparse';

export interface Position {
  symbol: string;
  description: string;
  quantity: number;
  price: number;
  marketValue: number;
  costBasis: number;
  gainDollar: number;
  gainPercent: number;
}

export class CSVFormatError extends Error {}

const parseNumber = (raw: string | null | undefined): number => {
  const cleaned = (raw ?? '').replace(/[$,%"]/g, '').replace(/,/g, '').trim();
  const value = parseFloat(cleaned);
  return isNaN(value) ? 0 : value;
};

export function parsePositionCSV(text: string): Position[] {
  // Detect delimiter (typically comma, but fallback)
  const delim = [',', '\t', ';'].find(d => text.indexOf(d) > -1 && text.indexOf(d) < text.indexOf('\n')) || ',';

  const { data: rows } = parse<string[]>(text, { delimiter: delim, skipEmptyLines: true });

  // Find the header row
  let headerRow: string[] = [];
  const positions: Position[] = [];

  for (const row of rows as string[][]) {
    if (row.includes('Qty (Quantity)') && row.includes('Gain $ (Gain/Loss $)')) {
      headerRow = row.map(col => col.trim().replace(/^"|"$/g, ''));
      continue;
    }

    // Parse rows after header
    if (headerRow.length && row.length >= headerRow.length) {
      const record: any = {};

      headerRow.forEach((col, i) => {
        const rawCell = row[i];

        switch (col) {
          case 'Symbol':
            record.symbol = rawCell?.trim().replace(/"/g, '') ?? '';
            break;
          case 'Description':
            record.description = rawCell?.trim().replace(/"/g, '') ?? '';
            break;
          case 'Qty (Quantity)':
            record.quantity = parseNumber(rawCell);
            break;
          case 'Price':
            record.price = parseNumber(rawCell);
            break;
          case 'Mkt Val (Market Value)':
            record.marketValue = parseNumber(rawCell);
            break;
          case 'Cost Basis':
            record.costBasis = parseNumber(rawCell);
            break;
          case 'Gain $ (Gain/Loss $)':
            record.gainDollar = parseNumber(rawCell);
            break;
          case 'Gain % (Gain/Loss %)':
            record.gainPercent = parseNumber(rawCell);
            break;
        }
      });

      if (record.symbol && typeof record.quantity === 'number') {
        positions.push(record as Position);
      }
    }
  }

  if (!positions.length) {
    throw new CSVFormatError('No valid position data found. Ensure this is a position CSV export.');
  }

  return positions;
} 