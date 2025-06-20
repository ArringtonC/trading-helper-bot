import { parseTradeCSV, RawTrade, ParsedTrade } from './parseTradeCSV';
import { parsePositionCSV, Position } from './parsePositionCSV';
import { isTradeCSV, isPositionCSV } from './parseTradeCSV';
import { insertNormalizedTrades, insertPositions, resetDatabase, getAggregatePL, getTradeCounts, getDailyPnlForReconciliation } from '../services/DatabaseService';
import { BrokerType, NormalizedTradeData, PutCall } from '../types/trade';
import { DailyPnlData, reconcilePnlData, ReconciliationResult } from '../services/ReconciliationService';
import Papa from 'papaparse';
import eventEmitter from './eventEmitter';
import { Account } from '../types/account';
import { validateNormalizedTradeData } from './validateNormalizedTrade';

// Helper function to parse the authoritative P&L file (simple CSV: symbol,date,pnl)
const parseAuthoritativePnl = (fileContent: string): Promise<DailyPnlData[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(fileContent, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const pnlData: DailyPnlData[] = results.data.map((row, index) => {
            if (row.length < 3) {
              throw new Error(`Row ${index + 1}: Expected 3 columns (symbol, date, pnl), got ${row.length}`);
            }
            const pnl = parseFloat(row[2]);
            if (isNaN(pnl)) {
              throw new Error(`Row ${index + 1}: Invalid P&L value '${row[2]}'`);
            }
            // Basic date validation (YYYY-MM-DD format)
            if (!/^\d{4}-\d{2}-\d{2}$/.test(row[1])) {
               throw new Error(`Row ${index + 1}: Invalid date format '${row[1]}'. Expected YYYY-MM-DD.`);
            }
            return {
              symbol: row[0].trim(),
              date: row[1].trim(),
              pnl: pnl,
            };
          });
          resolve(pnlData);
        } catch (error) {
          reject(error);
        }
      },
      error: (error: any) => {
        reject(error);
      },
    });
  });
};

export const handleUpload = async (
  files: File[],
  setTrades: ((trades: NormalizedTradeData[]) => void) = () => {},
  setPositions: ((positions: Position[]) => void) = () => {},
  setSummary: (summary: { trades: number, positions: number, open: number, closed: number, realizedPL: number }) => void,
  setError: (error: string | null) => void,
  setLoading: (loading: boolean) => void
): Promise<ReconciliationResult | null> => {
  setLoading(true);
  setError(null);
  let reconciliationResult: ReconciliationResult | null = null;
  let dataChanged = false; // Flag to track if data was actually changed

  const primaryFile = files[0];
  const authoritativeFile = files.length > 1 ? files[1] : null;
  let sourceBData: DailyPnlData[] | null = null;

  if (!primaryFile) {
    setError('No file selected.');
    setLoading(false);
    return null;
  }

  try {
    await resetDatabase();
    console.log('Previous data cleared.');

    const fileContent = await primaryFile.text();
    const broker = BrokerType.IBKR;

    if (isPositionCSV(fileContent)) {
      const positions = await parsePositionCSV(fileContent);
      await insertPositions(positions);
      setPositions(positions);
      console.log(`${positions.length} positions parsed and inserted.`);
      setSummary({ trades: 0, positions: positions.length, open: 0, closed: 0, realizedPL: 0 });
      dataChanged = true; // Data was added
    } else if (isTradeCSV(fileContent)) {
      const parsedTrades: ParsedTrade[] = await parseTradeCSV(fileContent);
      console.log(`${parsedTrades.length} trades parsed from CSV.`);

      const normalizedTrades: NormalizedTradeData[] = parsedTrades.map((trade: ParsedTrade): NormalizedTradeData => {
         const raw: RawTrade = trade;
         const quantity = Number(raw.quantity);
         const tradePrice = Number(raw.price);
         const proceedsRaw = Number(raw.proceeds ?? 0);
         const commissionRaw = Number(raw.commissionFee ?? 0);
         const feesRaw = Number(raw.fees ?? 0);
         const netAmount = trade.isClose ? (trade.realizedPL ?? 0) : 0;
         const normalizedProceeds = proceedsRaw > 0 ? proceedsRaw : 0;
         const normalizedCost = proceedsRaw < 0 ? Math.abs(proceedsRaw) : 0;
         const normalizedCommission = Math.abs(commissionRaw);
         const normalizedFees = Math.abs(feesRaw);

        return {
           id: raw.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)),
           importTimestamp: new Date().toISOString(),
           broker: broker,
           accountId: raw.accountId || undefined,
           tradeDate: (raw.tradeDate || (raw.dateTime ? raw.dateTime.split(' ')[0] : '')).replace(/,+$/, ''),
           settleDate: raw.settleDate || undefined,
           symbol: raw.symbol || '',
           dateTime: raw.dateTime ? raw.dateTime.replace(/,+$/, '') : undefined,
           description: raw.description || undefined,
           assetCategory: raw.assetCategory || 'OPT',
           action: raw.action || undefined,
           quantity: quantity,
           tradePrice: tradePrice,
           currency: raw.currency || 'USD',
           proceeds: normalizedProceeds,
           cost: normalizedCost,
           commission: normalizedCommission,
           fees: normalizedFees,
           netAmount: netAmount,
           openCloseIndicator: trade.isClose ? 'C' : 'O',
           costBasis: raw.costBasis || undefined,
           optionSymbol: raw.optionSymbol || undefined,
           expiryDate: raw.expiryDate || undefined,
           strikePrice: raw.strikePrice || undefined,
           putCall: raw.putCall as PutCall | undefined,
           multiplier: raw.multiplier || undefined,
           orderID: raw.orderID || undefined,
           executionID: raw.executionID || undefined,
           notes: raw.notes || undefined,
           rawRealizedPL: raw.rawRealizedPL || undefined,
           rawCsvRow: raw.rawCsvRow || (Object.keys(raw).length > 0 ? Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, String(v)])) : undefined),
        };
      });

      const insertResult = await insertNormalizedTrades(normalizedTrades);
      
      if (insertResult.successCount > 0) {
           console.log(`${insertResult.successCount} trades inserted into the database successfully.`);
           dataChanged = true; // Data was added
      } else {
           console.warn('No trades were inserted. Possible errors occurred during insertion attempt.', insertResult.errors);
           if (insertResult.errors.length > 0) {
               setError(`Failed to insert trades: ${insertResult.errors.map(e => e.error).join(', ')}`);
           }
      }

      setTrades(normalizedTrades);
      const counts = await getTradeCounts();
      const pl = await getAggregatePL();
      setSummary({ trades: normalizedTrades.length, positions: 0, open: counts.open, closed: counts.closed, realizedPL: pl.realizedPL });

      if (authoritativeFile) {
        console.log('Authoritative reconciliation file detected. Starting reconciliation...');
        try {
          const authFileContent = await authoritativeFile.text();
          sourceBData = await parseAuthoritativePnl(authFileContent);
          console.log(`${sourceBData.length} records parsed from authoritative file.`);

          const sourceAData = await getDailyPnlForReconciliation();
          console.log(`${sourceAData.length} daily P&L records fetched from local DB for reconciliation.`);

          if (sourceAData.length > 0 && sourceBData.length > 0) {
             reconciliationResult = reconcilePnlData({ sourceA: sourceAData, sourceB: sourceBData });
             console.log('Reconciliation Complete. Summary:', reconciliationResult.summary);
          } else {
             console.warn('Skipping reconciliation: Insufficient data from one or both sources.');
          }
        } catch (reconError: any) {
          console.error('Error during reconciliation process:', reconError);
          setError(`Reconciliation failed: ${reconError.message}`);
        }
      }

      eventEmitter.dispatch('data-updated');
    } else {
       throw new Error('Uploaded file is not a recognized Trade or Position CSV format.');
    }
    
    if (dataChanged) {
        console.log('Data changed, dispatching data-updated event...');
        eventEmitter.dispatch('data-updated');
    }

  } catch (error: any) {
    console.error('Error during file upload and processing:', error);
    setError(`Processing Error: ${error.message}`);
    reconciliationResult = null;
  } finally {
    setLoading(false);
  }
  return reconciliationResult;
};

// /**
//  * @deprecated This function is no longer used - modern File.text() API is used instead
//  * Kept for backwards compatibility and potential future use cases requiring FileReader
//  * 
//  * Helper function to read file content using FileReader API
//  * @param file - The File object to read
//  * @returns Promise<string> - The file content as text
//  */
// async function readFileContent(file: File): Promise<string> {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onload = (event) => {
//       if (event.target && event.target.result) {
//         resolve(event.target.result as string);
//       } else {
//         reject(new Error('Failed to read file content.'));
//       }
//     };
//     reader.onerror = (error) => {
//       reject(error);
//     };
//     reader.readAsText(file);
//   });
// }

