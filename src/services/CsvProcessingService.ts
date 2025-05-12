import Papa, { ParseResult, ParseError, Parser } from 'papaparse';
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

export const processCsvStream = (
  file: File,
  onProgressUpdate: (stats: StreamProcessingStats) => void,
  onChunkProcessed: (chunkResults: ProcessedChunkResult) => void,
  onStreamComplete: (finalStats: StreamProcessingStats, allValidTrades: NormalizedTradeData[]) => void,
  onStreamError: (error: Error) => void
): void => {
  let totalRowsProcessedThisStream = 0;
  let successfulRowsThisStream = 0;
  let overallErrorCountThisStream = 0;
  let overallWarningCountThisStream = 0;
  const allValidTradesThisStream: NormalizedTradeData[] = [];
  
  let broker: BrokerType | null = null;
  let csvHeadersInternal: string[] = [];
  let isFirstChunk = true;
  let accumulatedRowIndex = 0; // To keep track of row index across chunks

  Papa.parse(file, {
    worker: false, 
    header: false, 
    skipEmptyLines: true,
    chunkSize: 1024 * 64,
    
    chunk: (results: ParseResult<string[]>, parser: Parser) => {
      const chunkData = results.data;
      let currentChunkValidTrades: NormalizedTradeData[] = [];
      let currentChunkErrors: ProcessedChunkResult['errors'] = [];
      let currentChunkWarnings: ProcessedChunkResult['warnings'] = [];

      if (isFirstChunk) {
        if (chunkData.length === 0) {
          onStreamError(new Error('CSV file appears to be empty or has no header row.'));
          parser.abort();
          return;
        }
        csvHeadersInternal = chunkData[0].map(h => h.trim());
        broker = detectBroker(csvHeadersInternal);

        if (broker === BrokerType.Unknown) {
          onStreamError(new Error('Could not determine broker type from CSV headers.'));
          parser.abort();
          return;
        }
        chunkData.shift(); // Remove header row from data to be processed
        totalRowsProcessedThisStream++; // Account for header row being processed
        isFirstChunk = false;
      }

      chunkData.forEach((rowArray) => {
        totalRowsProcessedThisStream++;
        accumulatedRowIndex++;
        const currentRowIndexInFile = accumulatedRowIndex;

        const rowObject: Record<string, string> = {};
        csvHeadersInternal.forEach((header, i) => {
          rowObject[header] = rowArray[i];
        });

        const mappedData = mapRowToNormalizedTradeData(rowObject, csvHeadersInternal, broker as BrokerType);

        if (mappedData) {
          const validationIssues = validateNormalizedTradeData(mappedData);
          if (validationIssues.length === 0) {
            successfulRowsThisStream++;
            currentChunkValidTrades.push(mappedData);
          } else {
            overallWarningCountThisStream++;
            currentChunkWarnings.push({
              rowIndexInFile: currentRowIndexInFile,
              messages: validationIssues,
              rawRow: rowObject,
            });
          }
        } else {
          overallErrorCountThisStream++;
          currentChunkErrors.push({
            rowIndexInFile: currentRowIndexInFile,
            message: 'Failed to map row to normalized schema.',
            rawRow: rowObject,
          });
        }
      });
      
      allValidTradesThisStream.push(...currentChunkValidTrades);
      if (currentChunkValidTrades.length > 0 || currentChunkErrors.length > 0 || currentChunkWarnings.length > 0) {
        onChunkProcessed({ data: currentChunkValidTrades, errors: currentChunkErrors, warnings: currentChunkWarnings });
      }
      
      const progressPercent = file.size && results.meta.cursor ? (results.meta.cursor / file.size * 100) : 0;
      onProgressUpdate({
        totalRowsProcessed: totalRowsProcessedThisStream,
        successfulRows: successfulRowsThisStream,
        errorCount: overallErrorCountThisStream,
        warningCount: overallWarningCountThisStream,
        progressPercent: Math.min(100, progressPercent),
        currentStatusMessage: `Processing... ${Math.round(progressPercent)}%`
      });
    },
    complete: (results: ParseResult<any>) => {
       // Handle any errors that PapaParse itself might have collected file-wide
      if (results.errors.length > 0) {
        results.errors.forEach((err: ParseError) => {
            overallErrorCountThisStream++;
            // Attempt to add more context if possible, though row index might be general here
            onChunkProcessed({data: [], errors: [{rowIndexInFile: err.row || totalRowsProcessedThisStream, message: `PapaParse Error: ${err.message} (Code: ${err.code})`, rawRow: err.row ? results.data[err.row] : {}}], warnings: []});
        });
      }
      onStreamComplete(
        {
          totalRowsProcessed: totalRowsProcessedThisStream,
          successfulRows: successfulRowsThisStream,
          errorCount: overallErrorCountThisStream,
          warningCount: overallWarningCountThisStream,
          progressPercent: 100,
          currentStatusMessage: 'Import complete.'
        },
        allValidTradesThisStream
      );
    },
    error: (streamError: Error, fileFromError: File) => { // Changed from Papa.ParseError to Error for general stream errors
      onStreamError(new Error(`CSV parsing stream error: ${streamError.message}`));
    },
  });
}; 