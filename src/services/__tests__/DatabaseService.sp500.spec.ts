import {
  getDb,
  insertSP500Prices,
  getSP500Prices,
  insertMarketNews,
  getMarketNews,
  SP500PriceData,
  MarketNewsData,
  resetDatabase,
  initDatabase
} from '../DatabaseService';

describe('S&P 500 Market Data Migration (V3)', () => {
  beforeEach(async () => {
    // Reset and re-initialize the database before each test to ensure a clean state
    await resetDatabase(); 
    await initDatabase();
  });

  describe('Database Migration', () => {
    it('should create sp500_prices and market_news tables', async () => {
      const db = await getDb();
      
      // Check if tables exist
      const tables = db.exec(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name IN ('sp500_prices', 'market_news')
        ORDER BY name;
      `);
      
      expect(tables[0]?.values).toBeDefined();
      expect(tables[0].values.map(row => row[0])).toEqual(['market_news', 'sp500_prices']);
    });

    it('should create proper indexes for time-series queries', async () => {
      const db = await getDb();
      
      // Check if indexes exist
      const indexes = db.exec(`
        SELECT name FROM sqlite_master 
        WHERE type='index' AND name LIKE 'idx_sp500%' OR name LIKE 'idx_market_news%'
        ORDER BY name;
      `);
      
      expect(indexes[0]?.values).toBeDefined();
      const indexNames = indexes[0].values.map(row => row[0]);
      
      // Check for key indexes
      expect(indexNames).toContain('idx_sp500_prices_date');
      expect(indexNames).toContain('idx_market_news_date');
      expect(indexNames).toContain('idx_market_news_relevance');
    });
  });

  describe('S&P 500 Price Data Operations', () => {
    it('should insert and retrieve S&P 500 price data', async () => {
      const testPrices: SP500PriceData[] = [
        {
          date: '2025-01-15',
          open: 5800.50,
          high: 5825.75,
          low: 5790.25,
          close: 5815.30,
          volume: 3500000000,
          adjusted_close: 5815.30
        },
        {
          date: '2025-01-16',
          open: 5815.30,
          high: 5840.00,
          low: 5810.00,
          close: 5835.75,
          volume: 3200000000,
          adjusted_close: 5835.75
        }
      ];

      // Insert test data
      const insertResult = await insertSP500Prices(testPrices);
      expect(insertResult.successCount).toBe(2);
      expect(insertResult.errors.length).toBe(0);
      
      // Retrieve by date range
      const prices = await getSP500Prices('2025-01-15', '2025-01-16');
      expect(prices).toHaveLength(2);
      expect(prices[0].date).toBe('2025-01-15');
      expect(prices[0].close).toBe(5815.30);
      expect(prices[1].date).toBe('2025-01-16');
      expect(prices[1].close).toBe(5835.75);
    });

    it('should handle INSERT OR REPLACE correctly', async () => {
      const originalPrice: SP500PriceData = {
        date: '2025-01-15',
        open: 5800.50,
        high: 5825.75,
        low: 5790.25,
        close: 5815.30,
        volume: 3500000000,
        adjusted_close: 5815.30
      };

      // Insert original data
      await insertSP500Prices([originalPrice]);

      // Insert updated price for existing date
      const updatedPrice: SP500PriceData = {
        date: '2025-01-15',
        open: 5800.50,
        high: 5825.75,
        low: 5790.25,
        close: 5820.00, // Different close price
        volume: 3600000000,
        adjusted_close: 5820.00
      };

      const result = await insertSP500Prices([updatedPrice]);
      expect(result.successCount).toBe(1);

      // Verify the price was updated
      const prices = await getSP500Prices('2025-01-15', '2025-01-15');
      expect(prices).toHaveLength(1);
      expect(prices[0].close).toBe(5820.00);
    });

    it('should handle null/undefined values correctly', async () => {
      const minimalPrice: SP500PriceData = {
        date: '2025-01-17',
        open: 5850.00,
        high: 5860.00,
        low: 5840.00,
        close: 5855.00,
        // volume and adjusted_close are optional
      };

      const result = await insertSP500Prices([minimalPrice]);
      expect(result.successCount).toBe(1);

      const retrievedPrices = await getSP500Prices('2025-01-17', '2025-01-17');
      expect(retrievedPrices[0].volume).toBeUndefined();
      expect(retrievedPrices[0].adjusted_close).toBeUndefined();
    });
  });

  describe('Market News Operations', () => {
    it('should insert and retrieve market news', async () => {
      const testNews: MarketNewsData[] = [
        {
          date: '2025-01-15',
          title: 'Fed Announces Rate Decision',
          description: 'Federal Reserve maintains interest rates at current levels',
          source: 'Reuters',
          category: 'fed_policy',
          relevance_score: 9,
          keywords: JSON.stringify(['Federal Reserve', 'interest rates', 'monetary policy']),
          impact_type: 'neutral',
          published_at: '2025-01-15T14:00:00Z'
        },
        {
          date: '2025-01-16',
          title: 'Trade Tariff Announcement',
          description: 'New tariffs announced on imported goods',
          source: 'Bloomberg',
          category: 'tariff',
          relevance_score: 7,
          keywords: JSON.stringify(['tariffs', 'trade war', 'imports']),
          impact_type: 'negative',
          published_at: '2025-01-16T09:30:00Z'
        }
      ];

      // Insert test data
      const insertResult = await insertMarketNews(testNews);
      expect(insertResult.successCount).toBe(2);
      expect(insertResult.errors.length).toBe(0);
      
      // Retrieve by date range
      const news = await getMarketNews('2025-01-15', '2025-01-16');
      expect(news.length).toBeGreaterThanOrEqual(2);
      
      // Should be ordered by date DESC, relevance_score DESC
      expect(news[0].date >= news[1].date).toBe(true);
      if (news[0].date === news[1].date) {
        expect(news[0].relevance_score >= news[1].relevance_score).toBe(true);
      }
    });

    it('should filter news by category', async () => {
      const testNews: MarketNewsData[] = [
        {
          date: '2025-01-15',
          title: 'Fed Announces Rate Decision',
          category: 'fed_policy',
          relevance_score: 9,
        },
        {
          date: '2025-01-16',
          title: 'Trade Tariff Announcement', 
          category: 'tariff',
          relevance_score: 7,
        }
      ];

      await insertMarketNews(testNews);
      
      const fedNews = await getMarketNews('2025-01-15', '2025-01-16', 'fed_policy');
      expect(fedNews).toHaveLength(1);
      expect(fedNews[0].category).toBe('fed_policy');
      expect(fedNews[0].title).toBe('Fed Announces Rate Decision');
    });

    it('should filter news by minimum relevance score', async () => {
      const testNews: MarketNewsData[] = [
        {
          date: '2025-01-15',
          title: 'High Relevance News',
          category: 'fed_policy',
          relevance_score: 9,
        },
        {
          date: '2025-01-16',
          title: 'Medium Relevance News',
          category: 'tariff',
          relevance_score: 7,
        },
        {
          date: '2025-01-16',
          title: 'Low Relevance News',
          category: 'general',
          relevance_score: 3,
        }
      ];

      await insertMarketNews(testNews);
      
      const highRelevanceNews = await getMarketNews('2025-01-15', '2025-01-16', undefined, 7);
      expect(highRelevanceNews.length).toBe(2);
      highRelevanceNews.forEach(news => {
        expect(news.relevance_score).toBeGreaterThanOrEqual(7);
      });
    });

    it('should validate relevance score constraints', async () => {
      const invalidNews: MarketNewsData[] = [
        {
          date: '2025-01-17',
          title: 'Invalid News',
          description: 'This should fail',
          category: 'general',
          relevance_score: 15, // Invalid score > 10
        }
      ];

      const result = await insertMarketNews(invalidNews);
      expect(result.successCount).toBe(0);
      expect(result.errors.length).toBe(1);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain proper date formats', async () => {
      const testPrice: SP500PriceData = {
        date: '2025-01-15',
        open: 5800.50,
        high: 5825.75,
        low: 5790.25,
        close: 5815.30,
      };
      
      const testNewsItem: MarketNewsData = {
        date: '2025-01-15',
        title: 'Test News',
        category: 'general',
        relevance_score: 5,
      };
      
      await insertSP500Prices([testPrice]);
      await insertMarketNews([testNewsItem]);
      
      // Test that both tables use consistent date formats
      const prices = await getSP500Prices('2025-01-15', '2025-01-15');
      const news = await getMarketNews('2025-01-15', '2025-01-15');

      prices.forEach(price => {
        expect(price.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });

      news.forEach(newsItem => {
        expect(newsItem.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });
}); 