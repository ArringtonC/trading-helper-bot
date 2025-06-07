import { processCsvStream, isTradeCSV, isPositionCSV } from '../CsvProcessingService';
import { NormalizedTradeData } from '../../types/trade';
import { StreamProcessingStats } from '../CsvProcessingService';

describe('CsvProcessingService', () => {
  function createFileFromString(content: string, name = 'test.csv'): File {
    return new File([content], name, { type: 'text/csv' });
  }

  it('should process a well-formed trade CSV and call onChunkProcessed/onStreamComplete', done => {
    const csv = [
      'Financial Instrument Information,Header,Symbol,Expiry,Strike,Multiplier',
      'Financial Instrument Information,Data,SPY,2024-06-21,450,100',
      'Trades,Header,Symbol,Asset Category,Quantity,Trade Price,tradeDate,netAmount,Expiry,Strike,Multiplier,Put/Call',
      'Trades,Data,SPY,Option,1,5.5,2024-05-22,5.5,2024-06-21,450,100,C',
    ].join('\n');
    const file = createFileFromString(csv);
    const onProgressUpdate = jest.fn();
    const onChunkProcessed = jest.fn();
    const onStreamComplete = (finalStats: StreamProcessingStats, allValidTrades: NormalizedTradeData[]) => {
      try {
        expect(finalStats.successfulRows).toBe(1);
        expect(allValidTrades.length).toBe(1);
        expect(allValidTrades[0].symbol).toBe('SPY');
        done();
      } catch (e) {
        done(e);
      }
    };
    const onStreamError = jest.fn();
    processCsvStream(file, onProgressUpdate, onChunkProcessed, onStreamComplete, onStreamError);
  });

  it('should handle empty file gracefully', done => {
    const file = createFileFromString('');
    const onProgressUpdate = jest.fn();
    const onChunkProcessed = jest.fn();
    const onStreamComplete = (finalStats: StreamProcessingStats, allValidTrades: NormalizedTradeData[]) => {
      try {
        expect(finalStats.successfulRows).toBe(0);
        expect(allValidTrades.length).toBe(0);
        done();
      } catch (e) {
        done(e);
      }
    };
    const onStreamError = jest.fn();
    processCsvStream(file, onProgressUpdate, onChunkProcessed, onStreamComplete, onStreamError);
  });

  it('should handle section headers but no data', done => {
    const csv = [
      'Financial Instrument Information,Header,Symbol,Expiry,Strike,Multiplier',
      'Trades,Header,Symbol,Asset Category,Quantity,Trade Price,Expiry,Strike,Multiplier,Put/Call',
    ].join('\n');
    const file = createFileFromString(csv);
    const onProgressUpdate = jest.fn();
    const onChunkProcessed = jest.fn();
    const onStreamComplete = (finalStats: StreamProcessingStats, allValidTrades: NormalizedTradeData[]) => {
      try {
        expect(finalStats.successfulRows).toBe(0);
        expect(allValidTrades.length).toBe(0);
        done();
      } catch (e) {
        done(e);
      }
    };
    const onStreamError = jest.fn();
    processCsvStream(file, onProgressUpdate, onChunkProcessed, onStreamComplete, onStreamError);
  });

  it('should detect trade CSVs with isTradeCSV', () => {
    const text = 'Trades,Header,Symbol,Asset Category,Quantity,Trade Price,Expiry,Strike,Multiplier,Put/Call';
    expect(isTradeCSV(text)).toBe(true);
    expect(isTradeCSV('random text')).toBe(false);
  });

  it('should detect position CSVs with isPositionCSV', () => {
    const text = 'Positions,Header,Qty (Quantity),Market Value';
    expect(isPositionCSV(text)).toBe(true);
    expect(isPositionCSV('random text')).toBe(false);
  });
}); 