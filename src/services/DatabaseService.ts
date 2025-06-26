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

  // Market data methods
  async getSP500Prices(startDate?: string, endDate?: string): Promise<any[]> {
    console.log('[MockDB] Getting SP500 prices (mock mode)');
    return Promise.resolve([
      {
        date: '2024-01-02',
        open: 450.25,
        high: 452.50,
        low: 449.00,
        close: 451.35,
        volume: 1000000
      }
    ]);
  }

  async getMarketNews(limit?: number): Promise<any[]> {
    console.log('[MockDB] Getting market news (mock mode)');
    return Promise.resolve([
      {
        id: 'news-1',
        headline: 'Market Update',
        summary: 'Markets closed higher today',
        datetime: new Date().toISOString(),
        source: 'MockNews'
      }
    ]);
  }

  async insertSP500Prices(prices: any[]): Promise<void> {
    console.log('[MockDB] Inserting SP500 prices (mock mode):', prices.length);
    return Promise.resolve();
  }

  async insertMarketNews(news: any[]): Promise<void> {
    console.log('[MockDB] Inserting market news (mock mode):', news.length);
    return Promise.resolve();
  }

  // Challenge/Achievement methods
  async getChallenges(): Promise<any[]> {
    return Promise.resolve([]);
  }

  async getAchievements(): Promise<any[]> {
    return Promise.resolve([]);
  }

  async updateChallenge(challengeId: string, updates: any): Promise<void> {
    return Promise.resolve();
  }

  async updateAchievement(achievementId: string, updates: any): Promise<void> {
    return Promise.resolve();
  }

  // Pattern recognition methods
  async savePattern(pattern: any): Promise<string> {
    return Promise.resolve('mock-pattern-id');
  }

  async getPatterns(filter?: any): Promise<any[]> {
    return Promise.resolve([]);
  }

  // Goal sizing methods
  async saveGoalSizingConfig(config: any): Promise<void> {
    return Promise.resolve();
  }

  async getGoalSizingConfig(): Promise<any | null> {
    return Promise.resolve(null);
  }

  // Onboarding methods
  async saveOnboardingProgress(progress: any): Promise<void> {
    return Promise.resolve();
  }

  async getOnboardingProgress(): Promise<any | null> {
    return Promise.resolve(null);
  }

  // User context methods
  async saveUserContext(contextType: string, contextData: any): Promise<void> {
    return Promise.resolve();
  }

  async getUserContext(contextType: string): Promise<any | null> {
    return Promise.resolve(null);
  }

  // Additional trade methods
  async getTradeById(id: string): Promise<any | null> {
    return Promise.resolve(null);
  }

  async updateTrade(id: string, updates: any): Promise<void> {
    return Promise.resolve();
  }

  async getTradesByDateRange(startDate: string, endDate: string): Promise<any[]> {
    return Promise.resolve([]);
  }
}

// Export singleton instance
export const getDb = async () => {
  return MockDatabaseService.getInstance();
};

// Export standalone functions for compatibility
export async function getSP500Prices(startDate?: string, endDate?: string): Promise<any[]> {
  const db = await getDb();
  return db.getSP500Prices(startDate, endDate);
}

export async function getMarketNews(limit?: number): Promise<any[]> {
  const db = await getDb();
  return db.getMarketNews(limit);
}

export async function insertSP500Prices(prices: any[]): Promise<void> {
  const db = await getDb();
  return db.insertSP500Prices(prices);
}

export async function insertMarketNews(news: any[]): Promise<void> {
  const db = await getDb();
  return db.insertMarketNews(news);
}

// Mock other exports from original DatabaseService
export const setSqlJsWasmPathOverride = (path: string): void => {
  console.log('[MockDB] WASM path override (ignored in mock mode):', path);
};

// Export as class for compatibility
export class DatabaseService extends MockDatabaseService {}

export default MockDatabaseService;