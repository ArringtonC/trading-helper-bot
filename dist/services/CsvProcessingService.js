import Papa from 'papaparse';
import { BrokerType } from '../types/trade';
import { detectBroker } from '../utils/detectBroker';
import { mapRowToNormalizedTradeData } from '../utils/mapCsvToNormalizedSchema';
import { validateNormalizedTradeData } from '../utils/validateNormalizedTrade';
export var processCsvStream = function (file, onProgressUpdate, onChunkProcessed, onStreamComplete, onStreamError) {
    var totalRowsProcessedThisStream = 0;
    var successfulRowsThisStream = 0;
    var overallErrorCountThisStream = 0;
    var overallWarningCountThisStream = 0;
    var allValidTradesThisStream = [];
    var broker = null;
    var csvHeadersInternal = [];
    var isFirstChunk = true;
    var accumulatedRowIndex = 0; // To keep track of row index across chunks
    Papa.parse(file, {
        worker: false,
        header: false,
        skipEmptyLines: true,
        chunkSize: 1024 * 64,
        chunk: function (results, parser) {
            var chunkData = results.data;
            var currentChunkValidTrades = [];
            var currentChunkErrors = [];
            var currentChunkWarnings = [];
            if (isFirstChunk) {
                if (chunkData.length === 0) {
                    onStreamError(new Error('CSV file appears to be empty or has no header row.'));
                    parser.abort();
                    return;
                }
                csvHeadersInternal = chunkData[0].map(function (h) { return h.trim(); });
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
            chunkData.forEach(function (rowArray) {
                totalRowsProcessedThisStream++;
                accumulatedRowIndex++;
                var currentRowIndexInFile = accumulatedRowIndex;
                var rowObject = {};
                csvHeadersInternal.forEach(function (header, i) {
                    rowObject[header] = rowArray[i];
                });
                var mappedData = mapRowToNormalizedTradeData(rowObject, csvHeadersInternal, broker);
                if (mappedData) {
                    var validationIssues = validateNormalizedTradeData(mappedData);
                    if (validationIssues.length === 0) {
                        successfulRowsThisStream++;
                        currentChunkValidTrades.push(mappedData);
                    }
                    else {
                        overallWarningCountThisStream++;
                        currentChunkWarnings.push({
                            rowIndexInFile: currentRowIndexInFile,
                            messages: validationIssues,
                            rawRow: rowObject,
                        });
                    }
                }
                else {
                    overallErrorCountThisStream++;
                    currentChunkErrors.push({
                        rowIndexInFile: currentRowIndexInFile,
                        message: 'Failed to map row to normalized schema.',
                        rawRow: rowObject,
                    });
                }
            });
            allValidTradesThisStream.push.apply(allValidTradesThisStream, currentChunkValidTrades);
            if (currentChunkValidTrades.length > 0 || currentChunkErrors.length > 0 || currentChunkWarnings.length > 0) {
                onChunkProcessed({ data: currentChunkValidTrades, errors: currentChunkErrors, warnings: currentChunkWarnings });
            }
            var progressPercent = file.size && results.meta.cursor ? (results.meta.cursor / file.size * 100) : 0;
            onProgressUpdate({
                totalRowsProcessed: totalRowsProcessedThisStream,
                successfulRows: successfulRowsThisStream,
                errorCount: overallErrorCountThisStream,
                warningCount: overallWarningCountThisStream,
                progressPercent: Math.min(100, progressPercent),
                currentStatusMessage: "Processing... ".concat(Math.round(progressPercent), "%")
            });
        },
        complete: function (results) {
            // Handle any errors that PapaParse itself might have collected file-wide
            if (results.errors.length > 0) {
                results.errors.forEach(function (err) {
                    overallErrorCountThisStream++;
                    // Attempt to add more context if possible, though row index might be general here
                    onChunkProcessed({ data: [], errors: [{ rowIndexInFile: err.row || totalRowsProcessedThisStream, message: "PapaParse Error: ".concat(err.message, " (Code: ").concat(err.code, ")"), rawRow: err.row ? results.data[err.row] : {} }], warnings: [] });
                });
            }
            onStreamComplete({
                totalRowsProcessed: totalRowsProcessedThisStream,
                successfulRows: successfulRowsThisStream,
                errorCount: overallErrorCountThisStream,
                warningCount: overallWarningCountThisStream,
                progressPercent: 100,
                currentStatusMessage: 'Import complete.'
            }, allValidTradesThisStream);
        },
        error: function (streamError, fileFromError) {
            onStreamError(new Error("CSV parsing stream error: ".concat(streamError.message)));
        },
    });
};
