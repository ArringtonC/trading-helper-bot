import Papa, { ParseResult } from 'papaparse';
import { NormalizedTradeData, BrokerType } from '../types/trade';
import { detectBroker } from '../utils/detectBroker';
import { mapRowToNormalizedTradeData } from '../utils/mapCsvToNormalizedSchema';
import { validateNormalizedTradeData } from '../utils/validateNormalizedTrade';

export interface StreamProcessingStats {
  totalRowsProcessed: number;
  successfulRows: number;
  errorCount: number; // Count of rows that failed mapping or validation
  warningCount: number; // Count of rows with validation warnings but were still processed
  progressPercent: number; // Overall file processing progress
  currentStatusMessage?: string;
}

export interface ProcessedChunkResult {
  data: NormalizedTradeData[];
  errors: { rowIndexInFile: number; message: string; rawRow: any }[];
  warnings: { rowIndexInFile: number; messages: string[]; rawRow: any }[];
}

// --- Utility: Normalize option symbol for matching ---
function normalizeOptionSymbol(symbol: string): string {
  // Remove spaces and uppercase for matching
  return symbol.replace(/\s+/g, '').toUpperCase();
}

// --- Utility: Convert human-readable option symbol to OCC format ---
function toOCCSymbol(symbol: string, expiry?: string, strike?: string, type?: string): string | null {
  // Try to parse e.g. 'TSLA 17APR25 235 P' or 'TSLA 17APR25 235.5 C'
  const regex = /^(\w+)\s+(\d{2})([A-Z]{3})(\d{2})\s+([\d.]+)\s+([CP])$/i;
  const match = symbol.match(regex);
  if (match) {
    const underlying = match[1].padEnd(6, ' ');
    // Correct: day, month, year
    const day = match[2];
    const monthStr = match[3].toUpperCase();
    const year = match[4];
    const monthMap: Record<string, string> = {JAN:'01',FEB:'02',MAR:'03',APR:'04',MAY:'05',JUN:'06',JUL:'07',AUG:'08',SEP:'09',OCT:'10',NOV:'11',DEC:'12'};
    const month = monthMap[monthStr] || '01';
    // OCC date is year + month + day
    const occDate = `${year}${month}${day}`;
    const strikeNum = parseFloat(match[5]);
    const occStrike = strikeNum ? String(Math.round(strikeNum * 1000)).padStart(8, '0') : '00000000';
    const cp = match[6].toUpperCase();
    return `${underlying}${occDate}${cp}${occStrike}`;
  }
  // Fallback: if expiry/strike/type are provided, try to build OCC symbol
  if (symbol && expiry && strike && type) {
    const underlying = symbol.split(' ')[0].padEnd(6, ' ');
    // expiry: YYYY-MM-DD or YYMMDD
    let occDate = '';
    if (/^\d{6}$/.test(expiry)) {
      occDate = expiry;
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(expiry)) {
      const [yyyy, mm, dd] = expiry.split('-');
      occDate = `${yyyy.slice(2)}${mm}${dd}`;
    }
    const strikeNum = parseFloat(strike);
    const occStrike = strikeNum ? String(Math.round(strikeNum * 1000)).padStart(8, '0') : '00000000';
    const cp = type.toUpperCase();
    return `${underlying}${occDate}${cp}${occStrike}`;
  }
  return null;
}

export const processCsvStream = (
  file: File,
  onProgressUpdate: (stats: StreamProcessingStats) => void,
  onChunkProcessed: (chunkResults: ProcessedChunkResult) => void,
  onStreamComplete: (finalStats: StreamProcessingStats, allValidTrades: NormalizedTradeData[]) => void,
  onStreamError: (error: Error) => void
): void => {
  Papa.parse(file as any, {
    header: false,
    skipEmptyLines: true,
    complete: (results: ParseResult<string[]>) => {
      const allRows = results.data as string[][];
      let accumulatedRowIndex = 0;
      let tradesSectionFound = false;
      let tradesSectionHeaders: string[] = [];
      let finInfoSectionFound = false;
      let finInfoHeaders: string[] = [];
      const finInfoMap: Record<string, { expiry?: string; strike?: number; multiplier?: number }> = {};
      const allValidTradesThisStream: NormalizedTradeData[] = [];
      const allErrorsThisStream: ProcessedChunkResult['errors'] = [];
      const allWarningsThisStream: ProcessedChunkResult['warnings'] = [];
      let totalRowsProcessedThisStream = 0;
      let successfulRowsThisStream = 0;
      let overallErrorCountThisStream = 0;
      let overallWarningCountThisStream = 0;

      // --- First pass: Build finInfoMap ---
      for (const row of allRows) {
        if (row[0]?.trim() === 'Financial Instrument Information' && row[1]?.trim() === 'Header') {
          finInfoHeaders = row.slice(2).map(h => h.trim());
          finInfoSectionFound = true;
          continue;
        }
        if (row[0]?.trim() === 'Financial Instrument Information' && row[1]?.trim() === 'Data' && finInfoSectionFound) {
          const finRow = row.slice(2);
          const finObj: Record<string, string> = {};
          finInfoHeaders.forEach((header, idx) => {
            finObj[header] = finRow[idx] ?? '';
          });
          // Use Symbol as key (option symbol)
          const symbol = finObj['Symbol'];
          if (symbol) {
            finInfoMap[symbol] = {
              expiry: finObj['Expiry'],
              strike: finObj['Strike'] ? parseFloat(finObj['Strike']) : undefined,
              multiplier: finObj['Multiplier'] ? parseFloat(finObj['Multiplier']) : undefined,
            };
          }
        }
      }

      // --- Second pass: Process Trades section ---
      tradesSectionFound = false;
      tradesSectionHeaders = [];
      accumulatedRowIndex = 0;
      for (const row of allRows) {
        accumulatedRowIndex++;
        // Check if this row is the header of the 'Trades' section
        if (row[0]?.trim() === 'Trades' && row[1]?.trim() === 'Header') {
          tradesSectionHeaders = row.slice(2).map(h => h.trim()); // Extract headers after 'Trades', 'Header'
          tradesSectionFound = true;
          continue;
        }
        // Check if this row is a data row within the 'Trades' section
        if (row[0]?.trim() === 'Trades' && row[1]?.trim() === 'Data' && tradesSectionFound) {
          const rowData = row.slice(2); // Data starts after 'Trades', 'Data'
          totalRowsProcessedThisStream++;

          // Ensure we have headers before attempting to map
          if (tradesSectionHeaders.length === 0) {
            const rowObject: Record<string, string> = {};
            tradesSectionHeaders.forEach((header, index) => {
              rowObject[header] = rowData[index] ?? '';
            });
            allErrorsThisStream.push({ rowIndexInFile: accumulatedRowIndex, message: 'Trades section data found before headers.', rawRow: rowObject });
            overallErrorCountThisStream++;
            continue;
          }

          // Skip rows that do not have the correct number of columns
          if (rowData.length !== tradesSectionHeaders.length) {
            continue;
          }

          // Convert rowData array to a Record<string, string> using the extracted headers
          const rowObject: Record<string, string> = {};
          tradesSectionHeaders.forEach((header, index) => {
            rowObject[header] = rowData[index] ?? '';
          });

          // Skip rows missing required fields (e.g., Symbol or Quantity)
          const invalidSymbols = [undefined, null, '', 'Total', 'SubTotal'];
          if (invalidSymbols.includes(rowObject['Symbol']) || !rowObject['Quantity']) {
            continue;
          }

          // --- Enrich trade row with Financial Instrument Info if needed ---
          if (rowObject['Asset Category'] && rowObject['Asset Category'].toLowerCase().includes('option')) {
            // Try to build OCC symbol from trade row
            const occSymbol = toOCCSymbol(
              rowObject['Symbol'],
              rowObject['Expiry'],
              rowObject['Strike'],
              rowObject['Put/Call'] || rowObject['Type'] || (rowObject['Symbol']?.trim().endsWith('P') ? 'P' : 'C')
            );
            let finInfoMatch: typeof finInfoMap[string] | undefined = undefined;
            if (occSymbol && finInfoMap[occSymbol]) {
              finInfoMatch = finInfoMap[occSymbol];
            } else {
              // Fallback: try normalized matching as before
              const tradeSymbolNorm = normalizeOptionSymbol(rowObject['Symbol'] || '');
              for (const key of Object.keys(finInfoMap)) {
                if (normalizeOptionSymbol(key) === tradeSymbolNorm) {
                  finInfoMatch = finInfoMap[key];
                  break;
                }
              }
            }
            if (!finInfoMatch) {
              console.warn('[ENRICH] No finInfoMap match for symbol:', rowObject['Symbol'], 'Tried OCC:', occSymbol, 'Available keys:', Object.keys(finInfoMap));
            }
            if (finInfoMatch) {
              if (!rowObject['Expiry'] && finInfoMatch.expiry) rowObject['Expiry'] = finInfoMatch.expiry;
              if ((!rowObject['Strike'] || rowObject['Strike'] === '') && finInfoMatch.strike !== undefined) rowObject['Strike'] = String(finInfoMatch.strike);
              if ((!rowObject['Multiplier'] || rowObject['Multiplier'] === '') && finInfoMatch.multiplier !== undefined) rowObject['Multiplier'] = String(finInfoMatch.multiplier);
            }
          }
          // --- End enrichment ---

          // Now map the rowObject using the correct broker and headers
          const normalizedTrade = mapRowToNormalizedTradeData(rowObject, tradesSectionHeaders, BrokerType.IBKR); // Assume IBKR once Trades section is found

          if (normalizedTrade) {
            const validation = validateNormalizedTradeData(normalizedTrade);
            if (validation.length === 0) {
              allValidTradesThisStream.push(normalizedTrade);
              successfulRowsThisStream++;
            } else {
              console.warn('Validation failed for row:', rowObject, 'Errors:', validation);
              allErrorsThisStream.push({ rowIndexInFile: accumulatedRowIndex, message: `Validation failed: ${validation.join(', ')}`, rawRow: rowObject });
              overallErrorCountThisStream++;
            }
          } else {
            console.warn('Failed to map row to normalized trade data:', rowObject);
            allErrorsThisStream.push({ rowIndexInFile: accumulatedRowIndex, message: 'Failed to map row to normalized trade data.', rawRow: rowObject });
            overallErrorCountThisStream++;
          }
        }
      }

      // After all rows processed, notify the main component
      if (allValidTradesThisStream.length > 0 || allErrorsThisStream.length > 0 || allWarningsThisStream.length > 0) {
        onChunkProcessed({ data: allValidTradesThisStream, errors: allErrorsThisStream, warnings: allWarningsThisStream });
      }
      // Final status update
      onStreamComplete({
        totalRowsProcessed: totalRowsProcessedThisStream,
        successfulRows: successfulRowsThisStream,
        errorCount: overallErrorCountThisStream,
        warningCount: overallWarningCountThisStream,
        progressPercent: 100,
        currentStatusMessage: 'Processing complete.'
      }, allValidTradesThisStream);
    }
  });
};

// Removed parseCsvFile function as streaming is preferred.
// export function parseCsvFile(file: File): Promise<string[][]> {
//   return new Promise((resolve, reject) => {
//     Papa.parse(file, {
//       complete: function(results) {
//         if (results.errors.length) {
//           reject(results.errors[0]); // Reject with the first error
//         } else {
//           resolve(results.data as string[][]);
//         }
//       },
//       header: false,
//       skipEmptyLines: true
//     });
//   });
// }

// isTradeCSV and isPositionCSV might still be useful for initial file type check,
// but the main parsing logic needs to handle sections.
// Keeping them for now, but they might become less relevant.
export function isTradeCSV(text: string): boolean {
  // A more robust check for IBKR could look for specific section headers
  return text.includes('Trades,Header') && text.includes('Asset Category') && text.includes('Symbol');
}

export function isPositionCSV(text: string): boolean {
  // This might need adjustment for sectioned Schwab files too
  return text.includes('Positions,Header') && text.includes('Qty (Quantity)') && text.includes('Market Value');
}

// Helper functions (parseSafeNumber, formatDate, mapToAssetCategory, mapToOpenClose, mapToPutCall)
// These should remain in mapCsvToNormalizedSchema.ts where they are used.
// Removed from here to avoid duplication if they were present. 