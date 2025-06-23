/**
 * Test suite for StreamingService
 * Tests real-time data streaming functionality, broker adapters, and subscription management
 */

import {
  StreamingService,
  IBKRStreamAdapter,
  SchwabStreamAdapter,
  StreamType,
  StreamStatus,
  StreamData,
  StreamSubscription,
  StreamConnection,
  StreamMetrics,
  StreamingConfiguration
} from '../StreamingService';
import { MonitoringService } from '../MonitoringService';
import { ErrorHandlingService } from '../ErrorHandlingService';
import { SyncService } from '../SyncService';

// Mock dependencies
jest.mock('../MonitoringService');
jest.mock('../ErrorHandlingService');
jest.mock('../SyncService');
jest.mock('../IBKRService');
jest.mock('../SchwabService');

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  readyState: 1, // OPEN
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  onopen: null,
  onclose: null,
  onmessage: null,
  onerror: null
})) as any;

const mockMonitoringService = {
  startSpan: jest.fn().mockReturnValue({
    setTag: jest.fn(),
    setStatus: jest.fn(),
    finish: jest.fn()
  }),
  recordMetric: jest.fn(),
  getMetrics: jest.fn().mockReturnValue({}),
  createAlert: jest.fn()
};

const mockErrorHandlingService = {
  executeWithErrorHandling: jest.fn().mockImplementation((fn) => fn()),
  getCircuitBreakerMetrics: jest.fn().mockReturnValue(new Map()),
  getErrorStatistics: jest.fn().mockReturnValue(new Map())
};

const mockSyncService = {
  initialize: jest.fn(),
  shutdown: jest.fn(),
  getBrokerStatus: jest.fn().mockReturnValue(new Map())
};

describe('StreamingService', () => {
  let streamingService: StreamingService;
  let config: Partial<StreamingConfiguration>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    config = {
      maxReconnectAttempts: 3,
      reconnectDelayMs: 1000,
      heartbeatIntervalMs: 5000,
      enableMetrics: true,
      rateLimitPerSecond: 50
    };

    streamingService = new StreamingService(
      mockMonitoringService as any,
      mockErrorHandlingService as any,
      mockSyncService as any,
      config
    );
  });

  afterEach(async () => {
    if (streamingService) {
      await streamingService.shutdown();
    }
  });

  describe('Service Lifecycle', () => {
    it('should initialize successfully', async () => {
      await streamingService.initialize();
      
      expect(mockMonitoringService.startSpan).toHaveBeenCalledWith('streaming_service_initialize');
      
      const connectionStatus = streamingService.getConnectionStatus();
      expect(connectionStatus.size).toBe(2); // IBKR and Schwab
      expect(connectionStatus.has('ibkr')).toBe(true);
      expect(connectionStatus.has('schwab')).toBe(true);
    });

    it('should not initialize twice', async () => {
      await streamingService.initialize();
      await streamingService.initialize(); // Second call should be ignored
      
      expect(mockMonitoringService.startSpan).toHaveBeenCalledTimes(1);
    });

    it('should shutdown gracefully', async () => {
      await streamingService.initialize();
      await streamingService.shutdown();
      
      expect(mockMonitoringService.startSpan).toHaveBeenCalledWith('streaming_service_shutdown');
    });

    it('should handle initialization errors', async () => {
      mockMonitoringService.startSpan.mockReturnValueOnce({
        setTag: jest.fn(),
        setStatus: jest.fn(),
        finish: jest.fn()
      });

      // Force an error during initialization by mocking the adapters setup
      const originalConsoleLog = console.log;
      console.log = jest.fn().mockImplementation(() => {
        throw new Error('Initialization failed');
      });

      await expect(streamingService.initialize()).rejects.toThrow('Initialization failed');
      
      console.log = originalConsoleLog;
    });
  });

  describe('Broker Connection Management', () => {
    beforeEach(async () => {
      await streamingService.initialize();
    });

    it('should connect to IBKR broker', async () => {
      await streamingService.connectBroker('ibkr');
      
      expect(mockErrorHandlingService.executeWithErrorHandling).toHaveBeenCalled();
      expect(mockMonitoringService.startSpan).toHaveBeenCalledWith(
        'streaming_connect_broker',
        { brokerId: 'ibkr' }
      );
    });

    it('should connect to Schwab broker', async () => {
      await streamingService.connectBroker('schwab');
      
      expect(mockErrorHandlingService.executeWithErrorHandling).toHaveBeenCalled();
      expect(mockMonitoringService.startSpan).toHaveBeenCalledWith(
        'streaming_connect_broker',
        { brokerId: 'schwab' }
      );
    });

    it('should handle unknown broker connection', async () => {
      await expect(streamingService.connectBroker('unknown')).rejects.toThrow(
        'StreamingService: Unknown broker: unknown'
      );
    });

    it('should not reconnect if already connected', async () => {
      // Mock adapter as already connected
      const connectionStatus = streamingService.getConnectionStatus();
      const ibkrConnection = connectionStatus.get('ibkr');
      if (ibkrConnection) {
        ibkrConnection.status = StreamStatus.CONNECTED;
      }

      await streamingService.connectBroker('ibkr');
      
      // Should not call error handling service if already connected
      expect(mockErrorHandlingService.executeWithErrorHandling).not.toHaveBeenCalled();
    });
  });

  describe('Subscription Management', () => {
    let mockCallback: jest.Mock;

    beforeEach(async () => {
      await streamingService.initialize();
      mockCallback = jest.fn();
    });

    it('should create portfolio subscription', async () => {
      const subscriptionId = await streamingService.subscribe(
        'ibkr',
        StreamType.PORTFOLIO,
        mockCallback,
        { symbols: ['AAPL', 'TSLA'] }
      );

      expect(subscriptionId).toMatch(/^ibkr_portfolio_\d+$/);
      expect(mockMonitoringService.startSpan).toHaveBeenCalledWith(
        'streaming_subscribe',
        expect.objectContaining({
          brokerId: 'ibkr',
          streamType: StreamType.PORTFOLIO,
          subscriptionId
        })
      );

      const subscriptions = streamingService.getSubscriptions();
      expect(subscriptions.has(subscriptionId)).toBe(true);
    });

    it('should create market data subscription', async () => {
      const subscriptionId = await streamingService.subscribe(
        'schwab',
        StreamType.MARKET_DATA,
        mockCallback,
        { symbols: ['SPY', 'QQQ'], filters: { fields: 'quote,trade' } }
      );

      expect(subscriptionId).toMatch(/^schwab_market_data_\d+$/);
      
      const subscription = streamingService.getSubscriptions().get(subscriptionId);
      expect(subscription).toBeDefined();
      expect(subscription?.symbols).toEqual(['SPY', 'QQQ']);
      expect(subscription?.filters).toEqual({ fields: 'quote,trade' });
    });

    it('should unsubscribe successfully', async () => {
      const subscriptionId = await streamingService.subscribe(
        'ibkr',
        StreamType.ORDERS,
        mockCallback
      );

      await streamingService.unsubscribe(subscriptionId);

      expect(mockMonitoringService.startSpan).toHaveBeenCalledWith(
        'streaming_unsubscribe',
        { subscriptionId }
      );

      const subscriptions = streamingService.getSubscriptions();
      expect(subscriptions.has(subscriptionId)).toBe(false);
    });

    it('should handle unknown subscription unsubscribe', async () => {
      await expect(streamingService.unsubscribe('unknown_subscription')).rejects.toThrow(
        'StreamingService: Unknown subscription: unknown_subscription'
      );
    });

    it('should handle subscription to unknown broker', async () => {
      await expect(
        streamingService.subscribe('unknown', StreamType.PORTFOLIO, mockCallback)
      ).rejects.toThrow('StreamingService: Unknown broker: unknown');
    });
  });

  describe('Data Streaming', () => {
    let mockCallback: jest.Mock;
    let subscriptionId: string;

    beforeEach(async () => {
      await streamingService.initialize();
      mockCallback = jest.fn();
      subscriptionId = await streamingService.subscribe(
        'ibkr',
        StreamType.PORTFOLIO,
        mockCallback
      );
    });

    it('should handle incoming stream data', () => {
      const streamData: StreamData = {
        id: 'test_data_1',
        brokerId: 'ibkr',
        streamType: StreamType.PORTFOLIO,
        timestamp: new Date(),
        data: { symbol: 'AAPL', price: 150.25, volume: 1000 },
        metadata: {
          symbol: 'AAPL',
          latency: 50
        }
      };

      // Simulate receiving data
      streamingService.emit('stream_data', streamData);

      expect(mockCallback).toHaveBeenCalledWith(streamData);
    });

    it('should update connection metrics on data received', () => {
      const streamData: StreamData = {
        id: 'test_data_2',
        brokerId: 'ibkr',
        streamType: StreamType.PORTFOLIO,
        timestamp: new Date(),
        data: { symbol: 'TSLA', price: 250.75 },
        metadata: { latency: 25 }
      };

      // Simulate receiving data
      streamingService.emit('stream_data', streamData);

      const connectionStatus = streamingService.getConnectionStatus();
      const ibkrConnection = connectionStatus.get('ibkr');
      expect(ibkrConnection?.metrics.messagesReceived).toBeGreaterThan(0);
    });

    it('should handle callback errors gracefully', () => {
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });

      // Create subscription with error callback
      const errorSubscription: StreamSubscription = {
        id: 'error_subscription',
        brokerId: 'ibkr',
        streamType: StreamType.PORTFOLIO,
        callback: errorCallback,
        createdAt: new Date(),
        isActive: true
      };

      // Manually add subscription to test error handling
      streamingService.getSubscriptions().set('error_subscription', errorSubscription);

      const streamData: StreamData = {
        id: 'test_data_3',
        brokerId: 'ibkr',
        streamType: StreamType.PORTFOLIO,
        timestamp: new Date(),
        data: { symbol: 'AAPL', price: 150.25 }
      };

      // Should not throw error
      expect(() => {
        streamingService.emit('stream_data', streamData);
      }).not.toThrow();

      expect(errorCallback).toHaveBeenCalled();
    });
  });

  describe('Metrics and Monitoring', () => {
    beforeEach(async () => {
      await streamingService.initialize();
    });

    it('should provide streaming metrics', () => {
      const metrics = streamingService.getMetrics();

      expect(metrics).toEqual(expect.objectContaining({
        totalConnections: expect.any(Number),
        activeConnections: expect.any(Number),
        totalSubscriptions: expect.any(Number),
        activeSubscriptions: expect.any(Number),
        messagesPerSecond: expect.any(Number),
        avgLatency: expect.any(Number),
        errorRate: expect.any(Number),
        uptime: expect.any(Number),
        dataVolume: expect.any(Number)
      }));
    });

    it('should record metrics when enabled', async () => {
      // Wait for metrics collection to start
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockMonitoringService.recordMetric).toHaveBeenCalledWith(
        'streaming_connections_active',
        expect.any(Number)
      );
      expect(mockMonitoringService.recordMetric).toHaveBeenCalledWith(
        'streaming_subscriptions_active',
        expect.any(Number)
      );
    });

    it('should provide connection status', () => {
      const connectionStatus = streamingService.getConnectionStatus();

      expect(connectionStatus).toBeInstanceOf(Map);
      expect(connectionStatus.size).toBe(2);

      for (const [brokerId, connection] of Array.from(connectionStatus.entries())) {
        expect(['ibkr', 'schwab']).toContain(brokerId);
        expect(connection).toEqual(expect.objectContaining({
          brokerId,
          status: expect.any(String),
          reconnectAttempts: expect.any(Number),
          subscriptions: expect.any(Set),
          metrics: expect.objectContaining({
            messagesReceived: expect.any(Number),
            messagesProcessed: expect.any(Number),
            errors: expect.any(Number),
            avgLatency: expect.any(Number),
            uptime: expect.any(Number)
          })
        }));
      }
    });

    it('should provide active subscriptions', async () => {
      const mockCallback = jest.fn();
      await streamingService.subscribe('ibkr', StreamType.PORTFOLIO, mockCallback);
      await streamingService.subscribe('schwab', StreamType.MARKET_DATA, mockCallback);

      const subscriptions = streamingService.getSubscriptions();
      expect(subscriptions.size).toBe(2);

      for (const subscription of Array.from(subscriptions.values())) {
        expect(subscription).toEqual(expect.objectContaining({
          id: expect.any(String),
          brokerId: expect.stringMatching(/^(ibkr|schwab)$/),
          streamType: expect.any(String),
          callback: expect.any(Function),
          createdAt: expect.any(Date),
          isActive: true
        }));
      }
    });
  });

  describe('Error Handling and Resilience', () => {
    beforeEach(async () => {
      await streamingService.initialize();
    });

    it('should handle broker connection errors', async () => {
      mockErrorHandlingService.executeWithErrorHandling.mockRejectedValueOnce(
        new Error('Connection failed')
      );

      await expect(streamingService.connectBroker('ibkr')).rejects.toThrow('Connection failed');
    });

    it('should handle subscription errors', async () => {
      // Mock adapter to throw error on subscribe
      mockErrorHandlingService.executeWithErrorHandling.mockImplementationOnce(() => {
        throw new Error('Subscription failed');
      });

      await expect(
        streamingService.subscribe('ibkr', StreamType.PORTFOLIO, jest.fn())
      ).rejects.toThrow();
    });

    it('should handle unsubscribe errors', async () => {
      const mockCallback = jest.fn();
      const subscriptionId = await streamingService.subscribe(
        'ibkr',
        StreamType.PORTFOLIO,
        mockCallback
      );

      // Mock adapter to throw error on unsubscribe
      const connectionStatus = streamingService.getConnectionStatus();
      const ibkrConnection = connectionStatus.get('ibkr');
      if (ibkrConnection) {
        ibkrConnection.status = StreamStatus.ERROR;
      }

      await expect(streamingService.unsubscribe(subscriptionId)).rejects.toThrow();
    });
  });

  describe('Configuration', () => {
    it('should use custom configuration', () => {
      const customConfig: Partial<StreamingConfiguration> = {
        maxReconnectAttempts: 10,
        reconnectDelayMs: 2000,
        heartbeatIntervalMs: 15000,
        enableMetrics: false,
        rateLimitPerSecond: 200
      };

      const customStreamingService = new StreamingService(
        mockMonitoringService as any,
        mockErrorHandlingService as any,
        mockSyncService as any,
        customConfig
      );

      expect(customStreamingService).toBeDefined();
    });

    it('should use default configuration when none provided', () => {
      const defaultStreamingService = new StreamingService(
        mockMonitoringService as any,
        mockErrorHandlingService as any,
        mockSyncService as any
      );

      expect(defaultStreamingService).toBeDefined();
    });
  });

  describe('Event Handling', () => {
    beforeEach(async () => {
      await streamingService.initialize();
    });

    it('should emit initialization event', async () => {
      const initSpy = jest.fn();
      streamingService.on('initialized', initSpy);

      const newService = new StreamingService(
        mockMonitoringService as any,
        mockErrorHandlingService as any,
        mockSyncService as any
      );

      await newService.initialize();
      expect(initSpy).toHaveBeenCalled();

      await newService.shutdown();
    });

    it('should emit shutdown event', async () => {
      const shutdownSpy = jest.fn();
      streamingService.on('shutdown', shutdownSpy);

      await streamingService.shutdown();
      expect(shutdownSpy).toHaveBeenCalled();
    });

    it('should emit subscription events', async () => {
      const subscribedSpy = jest.fn();
      const unsubscribedSpy = jest.fn();
      
      streamingService.on('subscribed', subscribedSpy);
      streamingService.on('unsubscribed', unsubscribedSpy);

      const subscriptionId = await streamingService.subscribe(
        'ibkr',
        StreamType.PORTFOLIO,
        jest.fn()
      );

      expect(subscribedSpy).toHaveBeenCalledWith({
        subscriptionId,
        brokerId: 'ibkr',
        streamType: StreamType.PORTFOLIO
      });

      await streamingService.unsubscribe(subscriptionId);
      expect(unsubscribedSpy).toHaveBeenCalledWith({ subscriptionId });
    });
  });
}); 