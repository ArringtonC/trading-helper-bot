/**
 * Mock Database Service - No WebAssembly Dependencies
 * 
 * Temporary replacement for DatabaseService to avoid WASM loading issues
 * Provides same interface but uses localStorage/sessionStorage
 */

import { NormalizedTradeData } from '../shared/types/trade';

// Mock implementations that don't require WebAssembly
export class MockDatabaseService {
  private static instance: MockDatabaseService;
  
  public static getInstance(): MockDatabaseService {
    if (!MockDatabaseService.instance) {
      MockDatabaseService.instance = new MockDatabaseService();
    }
    return MockDatabaseService.instance;
  }

  async initializeDatabase(): Promise<void> {
    console.log('[MockDB] Database initialized (mock mode)');
    return Promise.resolve();
  }

  async addTrade(trade: NormalizedTradeData): Promise<string> {
    console.log('[MockDB] Trade added (mock mode):', trade.symbol);
    return Promise.resolve('mock-trade-id');
  }

  async getTrades(): Promise<NormalizedTradeData[]> {
    // Return some mock trade data
    return Promise.resolve([
      {
        id: 'mock-1',
        importTimestamp: new Date().toISOString(),
        broker: 'MOCK',
        tradeDate: new Date().toISOString(),
        symbol: 'SPY',
        assetCategory: 'STK',
        quantity: 100,
        tradePrice: 450.25,
        currency: 'USD',
        netAmount: 45025,
        realizedPnL: 150.50
      }
    ] as NormalizedTradeData[]);
  }

  async getTradeCount(): Promise<number> {
    return Promise.resolve(5);
  }

  async clearAllTrades(): Promise<void> {
    console.log('[MockDB] All trades cleared (mock mode)');
    return Promise.resolve();
  }

  async exportToCSV(): Promise<string> {
    return Promise.resolve('symbol,quantity,price\nSPY,100,450.25');
  }

  async getOptionsPositions(): Promise<any[]> {
    return Promise.resolve([]);
  }

  async getTotalPnL(): Promise<number> {
    return Promise.resolve(1250.75);
  }

  async backup(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(0));
  }

  async restore(data: ArrayBuffer): Promise<void> {
    console.log('[MockDB] Database restored (mock mode)');
    return Promise.resolve();
  }
}

// Export singleton instance
export const getDb = async () => {
  return MockDatabaseService.getInstance();
};

// Mock other exports from original DatabaseService
export const setSqlJsWasmPathOverride = (path: string): void => {
  console.log('[MockDB] WASM path override (ignored in mock mode):', path);
};

export default MockDatabaseService;