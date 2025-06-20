import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MarketDataService } from '../../../services/MarketDataService';
import { MonitoringService } from '../../../services/MonitoringService';
import MarketNews from '../MarketNews';
import { MarketNewsData, SP500PriceData } from '../../../services/DatabaseService';

// Mock the services
jest.mock('../../../services/DatabaseService');
jest.mock('../../../services/MonitoringService');

describe('S&P 500 Market Data Integration Tests', () => {
  let marketDataService: MarketDataService;
  let monitoringService: MonitoringService;

  // Mock data
  const mockNewsData: MarketNewsData[] = [
    {
      id: 1,
      date: '2024-01-01',
      title: 'Federal Reserve Announces Policy Changes',
      description: 'The Federal Reserve has announced significant policy changes affecting interest rates.',
      source: 'Reuters',
      category: 'fed_policy',
      relevance_score: 9,
      keywords: '["federal reserve", "interest rates", "policy"]',
      impact_type: 'negative',
      url: 'https://example.com/news1',
      published_at: '2024-01-01T10:00:00Z',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    },
    {
      id: 2,
      date: '2024-01-02',
      title: 'Trade Tariff Updates Impact Markets',
      description: 'New trade tariffs announced, expected to impact various market sectors.',
      source: 'Bloomberg',
      category: 'tariff',
      relevance_score: 8,
      keywords: '["trade", "tariffs", "markets"]',
      impact_type: 'negative',
      url: 'https://example.com/news2',
      published_at: '2024-01-02T09:00:00Z',
      created_at: '2024-01-02T09:00:00Z',
      updated_at: '2024-01-02T09:00:00Z'
    }
  ];

  const mockPriceData: SP500PriceData[] = [
    {
      id: 1,
      date: '2024-01-01',
      open: 4800.0,
      high: 4850.0,
      low: 4780.0,
      close: 4820.0,
      volume: 1000000,
      adjusted_close: 4820.0,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    },
    {
      id: 2,
      date: '2024-01-02',
      open: 4820.0,
      high: 4870.0,
      low: 4800.0,
      close: 4850.0,
      volume: 1200000,
      adjusted_close: 4850.0,
      created_at: '2024-01-02T10:00:00Z',
      updated_at: '2024-01-02T10:00:00Z'
    }
  ];

  beforeEach(async () => {
    // Setup monitoring service mock
    monitoringService = new MonitoringService();
    jest.spyOn(monitoringService, 'registerHealthCheck').mockImplementation(() => {});
    jest.spyOn(monitoringService, 'registerMetric').mockImplementation(() => {});

    // Setup market data service mock
    marketDataService = new MarketDataService(monitoringService);
    jest.spyOn(marketDataService, 'initialize').mockResolvedValue();
    jest.spyOn(marketDataService, 'start').mockResolvedValue();
    jest.spyOn(marketDataService, 'stop').mockResolvedValue();
    jest.spyOn(marketDataService, 'getSP500Data').mockResolvedValue(mockPriceData);
    jest.spyOn(marketDataService, 'getMarketNewsData').mockResolvedValue(mockNewsData);
    jest.spyOn(marketDataService, 'syncAll').mockResolvedValue(new Map());
    
    // Mock EventEmitter methods
    jest.spyOn(marketDataService, 'on').mockImplementation(() => marketDataService);
    jest.spyOn(marketDataService, 'off').mockImplementation(() => marketDataService);
    jest.spyOn(marketDataService, 'emit').mockImplementation(() => true);

    await marketDataService.initialize();
    await marketDataService.start();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('MarketNews Component', () => {
    it('should render news items successfully', async () => {
      render(
        <MarketNews
          marketDataService={marketDataService}
          maxItems={5}
          categoryFilter="all"
          minRelevanceScore={5}
          theme="light"
        />
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('📰 Market News')).toBeInTheDocument();
      });

      // Check if news items are rendered
      await waitFor(() => {
        expect(screen.getByText('Federal Reserve Announces Policy Changes')).toBeInTheDocument();
        expect(screen.getByText('Trade Tariff Updates Impact Markets')).toBeInTheDocument();
      });

      // Verify service calls
      expect(marketDataService.getMarketNewsData).toHaveBeenCalledWith({
        category: undefined,
        minRelevanceScore: 5,
        limit: 5
      });
    });

    it('should handle different category filters', async () => {
      render(
        <MarketNews
          marketDataService={marketDataService}
          maxItems={3}
          categoryFilter="fed_policy"
          minRelevanceScore={8}
          theme="light"
        />
      );

      await waitFor(() => {
        expect(marketDataService.getMarketNewsData).toHaveBeenCalledWith({
          category: 'fed_policy',
          minRelevanceScore: 8,
          limit: 3
        });
      });
    });

    it('should display relevance scores and categories', async () => {
      render(
        <MarketNews
          marketDataService={marketDataService}
          maxItems={5}
          categoryFilter="all"
          minRelevanceScore={5}
          theme="light"
          showCategories={true}
          showRelevanceScore={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('FED POLICY')).toBeInTheDocument();
        expect(screen.getByText('TARIFF')).toBeInTheDocument();
        expect(screen.getByText('9/10')).toBeInTheDocument();
        expect(screen.getByText('8/10')).toBeInTheDocument();
      });
    });

    it('should handle refresh functionality', async () => {
      render(
        <MarketNews
          marketDataService={marketDataService}
          maxItems={5}
          categoryFilter="all"
          minRelevanceScore={5}
          theme="light"
        />
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('📰 Market News')).toBeInTheDocument();
      });

      // Find and click refresh button
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      // Verify service was called again
      await waitFor(() => {
        expect(marketDataService.getMarketNewsData).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle error states gracefully', async () => {
      // Mock service to throw error
      jest.spyOn(marketDataService, 'getMarketNewsData').mockRejectedValue(new Error('Network error'));

      render(
        <MarketNews
          marketDataService={marketDataService}
          maxItems={5}
          categoryFilter="all"
          minRelevanceScore={5}
          theme="light"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('⚠️ Error')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should handle empty news data', async () => {
      // Mock service to return empty array
      jest.spyOn(marketDataService, 'getMarketNewsData').mockResolvedValue([]);

      render(
        <MarketNews
          marketDataService={marketDataService}
          maxItems={5}
          categoryFilter="all"
          minRelevanceScore={5}
          theme="light"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('📭')).toBeInTheDocument();
        expect(screen.getByText('No news articles found for the current filters')).toBeInTheDocument();
      });
    });

    it('should respond to service events', async () => {
      const { rerender } = render(
        <MarketNews
          marketDataService={marketDataService}
          maxItems={5}
          categoryFilter="all"
          minRelevanceScore={5}
          theme="light"
        />
      );

      // Verify event listeners were registered
      expect(marketDataService.on).toHaveBeenCalledWith('news:data:updated', expect.any(Function));
      expect(marketDataService.on).toHaveBeenCalledWith('sync:completed', expect.any(Function));

      // Cleanup should remove event listeners
      rerender(<div />);
      expect(marketDataService.off).toHaveBeenCalledWith('news:data:updated', expect.any(Function));
      expect(marketDataService.off).toHaveBeenCalledWith('sync:completed', expect.any(Function));
    });

    it('should format dates correctly', async () => {
      render(
        <MarketNews
          marketDataService={marketDataService}
          maxItems={5}
          categoryFilter="all"
          minRelevanceScore={5}
          theme="light"
        />
      );

      await waitFor(() => {
        // The component should show relative time formatting
        expect(screen.getByText('Reuters')).toBeInTheDocument();
        expect(screen.getByText('Bloomberg')).toBeInTheDocument();
      });
    });

    it('should support dark theme', async () => {
      const { container } = render(
        <MarketNews
          marketDataService={marketDataService}
          maxItems={5}
          categoryFilter="all"
          minRelevanceScore={5}
          theme="dark"
        />
      );

      await waitFor(() => {
        expect(container.querySelector('.market-news')).toHaveClass('bg-gray-800', 'text-gray-200');
      });
    });

    it('should call onNewsUpdate callback', async () => {
      const onNewsUpdate = jest.fn();

      render(
        <MarketNews
          marketDataService={marketDataService}
          maxItems={5}
          categoryFilter="all"
          minRelevanceScore={5}
          theme="light"
          onNewsUpdate={onNewsUpdate}
        />
      );

      await waitFor(() => {
        expect(onNewsUpdate).toHaveBeenCalledWith(mockNewsData);
      });
    });

    it('should call onError callback when errors occur', async () => {
      const onError = jest.fn();
      jest.spyOn(marketDataService, 'getMarketNewsData').mockRejectedValue(new Error('Test error'));

      render(
        <MarketNews
          marketDataService={marketDataService}
          maxItems={5}
          categoryFilter="all"
          minRelevanceScore={5}
          theme="light"
          onError={onError}
        />
      );

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      });
    });
  });

  describe('Service Integration', () => {
    it('should initialize MarketDataService correctly', async () => {
      expect(marketDataService.initialize).toHaveBeenCalled();
      expect(marketDataService.start).toHaveBeenCalled();
    });

    it('should handle service lifecycle properly', async () => {
      await marketDataService.stop();
      expect(marketDataService.stop).toHaveBeenCalled();
    });

    it('should sync data from external sources', async () => {
      await marketDataService.syncAll();
      expect(marketDataService.syncAll).toHaveBeenCalled();
    });

    it('should retrieve S&P 500 price data', async () => {
      const data = await marketDataService.getSP500Data({});
      expect(data).toEqual(mockPriceData);
    });

    it('should retrieve market news data with filters', async () => {
      const request = {
        category: 'fed_policy' as const,
        minRelevanceScore: 8,
        limit: 10
      };
      
      const data = await marketDataService.getMarketNewsData(request);
      expect(data).toEqual(mockNewsData);
    });
  });
}); 