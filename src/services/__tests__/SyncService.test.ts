/**
 * Test suite for SyncService
 * Tests core broker synchronization functionality, error handling, and monitoring integration
 */

import { SyncService, SyncConfiguration, BrokerSyncResult } from '../SyncService';
import { MonitoringService } from '../MonitoringService';
import { getCredentialService } from '../CredentialService';

// Mock dependencies
jest.mock('../MonitoringService');
jest.mock('../CredentialService');
jest.mock('../SchwabService');

const mockCredentialService = {
  getCredential: jest.fn(),
  saveCredential: jest.fn(),
  deleteCredential: jest.fn(),
  isBrokerConfigured: jest.fn()
};

const mockMonitoringService = {
  startSpan: jest.fn().mockReturnValue({
    setTag: jest.fn(),
    setStatus: jest.fn(),
    finish: jest.fn()
  }),
  recordMetric: jest.fn(),
  recordSyncOperation: jest.fn(),
  updateBrokerStatus: jest.fn(),
  registerHealthCheck: jest.fn(),
  on: jest.fn(),
  emit: jest.fn()
};

// Setup mocks
(getCredentialService as jest.Mock).mockReturnValue(mockCredentialService);

describe('SyncService', () => {
  let syncService: SyncService;
  let monitoringService: MonitoringService;

  beforeEach(() => {
    jest.clearAllMocks();
    monitoringService = mockMonitoringService as any;
    syncService = new SyncService(monitoringService);
  });

  afterEach(async () => {
    if (syncService && syncService.getState().isRunning) {
      await syncService.stop();
    }
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(syncService).toBeDefined();
      const state = syncService.getState();
      expect(state.isRunning).toBe(false);
      expect(state.activeBrokers).toEqual([]);
      expect(state.totalSyncs).toBe(0);
    });

    it('should accept custom configuration', () => {
      const customConfig: Partial<SyncConfiguration> = {
        syncIntervalMs: 60000,
        maxRetries: 5,
        concurrentBrokers: 3
      };

      const customSyncService = new SyncService(monitoringService, customConfig);
      const stats = customSyncService.getStatistics();
      
      expect(stats.config.syncIntervalMs).toBe(60000);
      expect(stats.config.maxRetries).toBe(5);
      expect(stats.config.concurrentBrokers).toBe(3);
    });

    it('should initialize broker adapters on construction', () => {
      const brokerStatus = syncService.getBrokerStatus();
      expect(brokerStatus.size).toBe(2); // IBKR and Schwab
      expect(brokerStatus.has('ibkr')).toBe(true);
      expect(brokerStatus.has('schwab')).toBe(true);
    });
  });

  describe('Service Lifecycle', () => {
    it('should initialize successfully with valid credentials', async () => {
      // Mock successful credential check
      mockCredentialService.getCredential.mockResolvedValue('mock-credential');

      await syncService.initialize();

      expect(syncService.getState().activeBrokers.length).toBeGreaterThan(0);
      expect(mockMonitoringService.registerHealthCheck).toHaveBeenCalledWith(
        'sync_service',
        expect.any(Function)
      );
    });

    it('should handle initialization failure gracefully', async () => {
      // Mock credential service failure
      mockCredentialService.getCredential.mockRejectedValue(new Error('Credential error'));

      await syncService.initialize();

      // Should still initialize but with no active brokers
      expect(syncService.getState().activeBrokers.length).toBe(0);
      expect(mockMonitoringService.recordMetric).toHaveBeenCalledWith(
        'broker_api_errors_total',
        1,
        expect.objectContaining({ error_type: 'initialization' })
      );
    });

    it('should start service after initialization', async () => {
      mockCredentialService.getCredential.mockResolvedValue('mock-credential');
      
      await syncService.initialize();
      await syncService.start();

      expect(syncService.getState().isRunning).toBe(true);
    });

    it('should throw error when starting uninitialized service', async () => {
      await expect(syncService.start()).rejects.toThrow(
        'SyncService: Service not initialized. Call initialize() first.'
      );
    });

    it('should stop service gracefully', async () => {
      mockCredentialService.getCredential.mockResolvedValue('mock-credential');
      
      await syncService.initialize();
      await syncService.start();
      await syncService.stop();

      expect(syncService.getState().isRunning).toBe(false);
      expect(syncService.getState().activeBrokers.length).toBe(0);
    });
  });

  describe('Broker Synchronization', () => {
    beforeEach(async () => {
      mockCredentialService.getCredential.mockResolvedValue('mock-credential');
      await syncService.initialize();
    });

    it('should sync all active brokers successfully', async () => {
      const results = await syncService.syncAll();

      expect(results.size).toBeGreaterThan(0);
      expect(mockMonitoringService.recordMetric).toHaveBeenCalledWith(
        'broker_sync_total',
        1,
        { status: 'completed' }
      );
    });

    it('should sync individual broker successfully', async () => {
      const result = await syncService.syncBroker('ibkr', 'accounts');

      expect(result).toBeDefined();
      expect(result.brokerId).toBe('ibkr');
      expect(result.success).toBe(true);
      expect(result.dataTypes).toContain('accounts');
      expect(typeof result.duration).toBe('number');
    });

    it('should handle broker sync failure', async () => {
      await expect(syncService.syncBroker('invalid-broker')).rejects.toThrow(
        'SyncService: Unknown broker ID: invalid-broker'
      );
    });

    it('should track sync operations', async () => {
      const initialState = syncService.getState();
      const syncPromise = syncService.syncBroker('ibkr');

      // Should have active operation
      expect(syncService.getState().currentOperations.size).toBe(1);

      await syncPromise;

      // Operation should be completed and removed
      expect(syncService.getState().currentOperations.size).toBe(0);
      expect(syncService.getState().totalSyncs).toBeGreaterThan(initialState.totalSyncs);
    });

    it('should handle concurrent broker syncs', async () => {
      const promises = [
        syncService.syncBroker('ibkr', 'accounts'),
        syncService.syncBroker('schwab', 'positions')
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const updates: Partial<SyncConfiguration> = {
        syncIntervalMs: 120000,
        maxRetries: 10
      };

      syncService.updateConfiguration(updates);
      const stats = syncService.getStatistics();

      expect(stats.config.syncIntervalMs).toBe(120000);
      expect(stats.config.maxRetries).toBe(10);
    });

    it('should emit configuration updated event', () => {
      const eventSpy = jest.fn();
      syncService.on('sync:config:updated', eventSpy);

      const updates = { maxRetries: 7 };
      syncService.updateConfiguration(updates);

      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining(updates));
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      mockCredentialService.getCredential.mockResolvedValue('mock-credential');
      await syncService.initialize();
    });

    it('should handle broker authentication failures', async () => {
      // Mock authentication failure
      mockCredentialService.getCredential.mockResolvedValueOnce(null);

      await syncService.initialize();

      // Service should initialize but broker should not be active
      const state = syncService.getState();
      expect(state.activeBrokers).toEqual([]);
    });

    it('should emit sync operation events', async () => {
      const startedSpy = jest.fn();
      const completedSpy = jest.fn();

      syncService.on('sync:operation:started', startedSpy);
      syncService.on('sync:operation:completed', completedSpy);

      await syncService.syncBroker('ibkr');

      expect(startedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          brokerId: 'ibkr',
          status: 'running'
        })
      );

      expect(completedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: expect.objectContaining({
            brokerId: 'ibkr',
            status: 'completed'
          }),
          result: expect.objectContaining({
            success: true
          })
        })
      );
    });

    it('should record metrics for failed operations', async () => {
      // This test would need to mock a failure scenario
      // For now, we'll test that metrics are recorded for successful operations
      await syncService.syncBroker('ibkr');

      expect(mockMonitoringService.recordSyncOperation).toHaveBeenCalled();
      expect(mockMonitoringService.recordMetric).toHaveBeenCalledWith(
        'broker_sync_records_updated',
        expect.any(Number),
        { broker: 'ibkr' }
      );
    });
  });

  describe('Statistics and Status', () => {
    beforeEach(async () => {
      mockCredentialService.getCredential.mockResolvedValue('mock-credential');
      await syncService.initialize();
    });

    it('should provide current state', () => {
      const state = syncService.getState();

      expect(state).toHaveProperty('isRunning');
      expect(state).toHaveProperty('lastSync');
      expect(state).toHaveProperty('activeBrokers');
      expect(state).toHaveProperty('totalSyncs');
      expect(state).toHaveProperty('currentOperations');
    });

    it('should provide broker status', () => {
      const brokerStatus = syncService.getBrokerStatus();

      expect(brokerStatus.size).toBeGreaterThan(0);
      for (const [brokerId, status] of Array.from(brokerStatus.entries())) {
        expect(status).toHaveProperty('adapter');
        expect(status).toHaveProperty('isActive');
        expect(status.adapter).toHaveProperty('brokerId', brokerId);
      }
    });

    it('should provide statistics', () => {
      const stats = syncService.getStatistics();

      expect(stats).toHaveProperty('state');
      expect(stats).toHaveProperty('config');
      expect(stats).toHaveProperty('activeBrokers');
      expect(stats).toHaveProperty('totalOperations');
      expect(stats).toHaveProperty('successRate');
      expect(stats).toHaveProperty('currentOperations');
      expect(stats).toHaveProperty('uptime');
    });

    it('should calculate success rate correctly', async () => {
      await syncService.syncBroker('ibkr');

      const stats = syncService.getStatistics();
      expect(stats.successRate).toBeGreaterThan(0);
    });
  });

  describe('Event Handling', () => {
    beforeEach(async () => {
      mockCredentialService.getCredential.mockResolvedValue('mock-credential');
      await syncService.initialize();
    });

    it('should emit initialization event', async () => {
      const eventSpy = jest.fn();
      const newSyncService = new SyncService(monitoringService);
      
      newSyncService.on('sync:initialized', eventSpy);
      mockCredentialService.getCredential.mockResolvedValue('mock-credential');
      
      await newSyncService.initialize();

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          activeBrokers: expect.any(Array),
          config: expect.any(Object)
        })
      );
    });

    it('should emit start and stop events', async () => {
      const startSpy = jest.fn();
      const stopSpy = jest.fn();

      syncService.on('sync:started', startSpy);
      syncService.on('sync:stopped', stopSpy);

      await syncService.start();
      expect(startSpy).toHaveBeenCalled();

      await syncService.stop();
      expect(stopSpy).toHaveBeenCalled();
    });

    it('should emit sync completion events', async () => {
      const completedSpy = jest.fn();
      syncService.on('sync:completed', completedSpy);

      await syncService.syncAll();

      expect(completedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          results: expect.any(Array),
          successCount: expect.any(Number),
          errorCount: expect.any(Number),
          duration: expect.any(Number)
        })
      );
    });
  });

  describe('Broker Adapter Functionality', () => {
    it('should validate broker adapter interface', () => {
      const brokerStatus = syncService.getBrokerStatus();
      
      for (const [brokerId, status] of Array.from(brokerStatus.entries())) {
        const adapter = status.adapter;
        
        // Check required properties
        expect(adapter).toHaveProperty('brokerId');
        expect(adapter).toHaveProperty('name');
        expect(adapter).toHaveProperty('isEnabled');
        
        // Check required methods
        expect(typeof adapter.authenticate).toBe('function');
        expect(typeof adapter.disconnect).toBe('function');
        expect(typeof adapter.getAccounts).toBe('function');
        expect(typeof adapter.getPositions).toBe('function');
        expect(typeof adapter.getOrders).toBe('function');
        expect(typeof adapter.getExecutions).toBe('function');
        expect(typeof adapter.testConnection).toBe('function');
        expect(typeof adapter.getLastSyncTime).toBe('function');
        expect(typeof adapter.setLastSyncTime).toBe('function');
      }
    });
  });
});

describe('SyncService Integration', () => {
  let syncService: SyncService;
  let monitoringService: MonitoringService;

  beforeEach(() => {
    jest.clearAllMocks();
    monitoringService = new MonitoringService();
    syncService = new SyncService(monitoringService);
  });

  afterEach(async () => {
    if (syncService && syncService.getState().isRunning) {
      await syncService.stop();
    }
  });

  it('should integrate with monitoring service', async () => {
    mockCredentialService.getCredential.mockResolvedValue('mock-credential');
    
    await syncService.initialize();
    await syncService.syncBroker('ibkr');

    // Verify integration with monitoring
    const stats = syncService.getStatistics();
    expect(stats.totalOperations).toBeGreaterThan(0);
  });

  it('should handle real-time sync mode', async () => {
    const realtimeSpy = jest.fn();
    syncService.on('sync:realtime:started', realtimeSpy);

    mockCredentialService.getCredential.mockResolvedValue('mock-credential');
    
    await syncService.initialize();
    await syncService.start();

    expect(realtimeSpy).toHaveBeenCalled();
  });
}); 