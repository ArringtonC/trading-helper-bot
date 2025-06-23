/**
 * Test suite for MonitoringService
 * Tests all monitoring, alerting, and health check functionality
 */

import MonitoringService, { 
  MetricConfig, 
  HealthCheckResult, 
  AlertConfig,
  SyncMetrics,
  BrokerStatus
} from '../MonitoringService';

describe('MonitoringService', () => {
  let monitoringService: MonitoringService;

  beforeEach(() => {
    // Clear timers to avoid interference between tests
    jest.clearAllTimers();
    jest.useFakeTimers();
    
    monitoringService = new MonitoringService();
  });

  afterEach(() => {
    monitoringService.shutdown();
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with default metrics and alerts', () => {
      expect(monitoringService).toBeDefined();
      expect(monitoringService.getMetricsSummary()).toHaveProperty('sync');
      expect(monitoringService.getMetricsSummary()).toHaveProperty('brokers');
    });

    it('should initialize tracing successfully', async () => {
      await expect(monitoringService.initializeTracing('test-service')).resolves.not.toThrow();
    });

    it('should emit initialization event', async () => {
      const mockCallback = jest.fn();
      monitoringService.on('monitoring:initialized', mockCallback);
      
      await monitoringService.initializeTracing('test-service');
      
      expect(mockCallback).toHaveBeenCalledWith({ serviceName: 'test-service' });
    });
  });

  describe('Metric Management', () => {
    it('should register custom metrics', () => {
      const customMetric: MetricConfig = {
        name: 'test_metric',
        description: 'A test metric',
        type: 'counter',
        labels: ['label1', 'label2']
      };

      monitoringService.registerMetric(customMetric);
      
      // Verify metric is registered by recording a value
      const mockCallback = jest.fn();
      monitoringService.on('metric:recorded', mockCallback);
      
      monitoringService.recordMetric('test_metric', 5);
      
      expect(mockCallback).toHaveBeenCalledWith({
        name: 'test_metric',
        value: 5,
        labels: ''
      });
    });

    it('should record counter metrics correctly', () => {
      const mockCallback = jest.fn();
      monitoringService.on('metric:recorded', mockCallback);

      monitoringService.recordMetric('broker_sync_total', 1, { broker: 'test', status: 'success' });
      monitoringService.recordMetric('broker_sync_total', 1, { broker: 'test', status: 'success' });

      expect(mockCallback).toHaveBeenCalledTimes(2);
      expect(mockCallback).toHaveBeenCalledWith({
        name: 'broker_sync_total',
        value: 1,
        labels: 'broker=test,status=success'
      });
    });

    it('should record gauge metrics correctly', () => {
      const mockCallback = jest.fn();
      monitoringService.on('metric:recorded', mockCallback);

      monitoringService.recordMetric('broker_connections_active', 5);
      monitoringService.recordMetric('broker_connections_active', 3);

      expect(mockCallback).toHaveBeenCalledWith({
        name: 'broker_connections_active',
        value: 3,
        labels: ''
      });
    });

    it('should record histogram metrics correctly', () => {
      const mockCallback = jest.fn();
      monitoringService.on('metric:recorded', mockCallback);

      monitoringService.recordMetric('broker_sync_duration_ms', 250, { broker: 'test' });
      monitoringService.recordMetric('broker_sync_duration_ms', 180, { broker: 'test' });

      expect(mockCallback).toHaveBeenCalledTimes(2);
    });

    it('should handle unknown metrics gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      monitoringService.recordMetric('unknown_metric', 100);
      
      expect(consoleSpy).toHaveBeenCalledWith('MonitoringService: Unknown metric: unknown_metric');
      consoleSpy.mockRestore();
    });
  });

  describe('Sync Operation Recording', () => {
    beforeEach(async () => {
      await monitoringService.initializeTracing();
    });

    it('should record successful sync operations', () => {
      const mockSyncCallback = jest.fn();
      const mockMetricCallback = jest.fn();
      const mockBrokerCallback = jest.fn();

      monitoringService.on('sync:recorded', mockSyncCallback);
      monitoringService.on('metric:recorded', mockMetricCallback);
      monitoringService.on('broker:status_updated', mockBrokerCallback);

      monitoringService.recordSyncOperation('test-broker', 200, true);

      expect(mockSyncCallback).toHaveBeenCalledWith({
        broker: 'test-broker',
        duration: 200,
        success: true,
        error: undefined
      });

      expect(mockBrokerCallback).toHaveBeenCalledWith({
        broker: 'test-broker',
        status: expect.objectContaining({
          broker: 'test-broker',
          connected: true,
          syncStatus: 'idle',
          errorCount: 0
        })
      });

      const metrics = monitoringService.getMetricsSummary();
      expect(metrics.sync.totalSyncs).toBe(1);
      expect(metrics.sync.successfulSyncs).toBe(1);
      expect(metrics.sync.failedSyncs).toBe(0);
    });

    it('should record failed sync operations', () => {
      const mockSyncCallback = jest.fn();
      monitoringService.on('sync:recorded', mockSyncCallback);

      monitoringService.recordSyncOperation('test-broker', 500, false, 'Connection timeout');

      expect(mockSyncCallback).toHaveBeenCalledWith({
        broker: 'test-broker',
        duration: 500,
        success: false,
        error: 'Connection timeout'
      });

      const metrics = monitoringService.getMetricsSummary();
      expect(metrics.sync.totalSyncs).toBe(1);
      expect(metrics.sync.successfulSyncs).toBe(0);
      expect(metrics.sync.failedSyncs).toBe(1);
      expect(metrics.sync.errorRate).toBe(1.0);
    });

    it('should update broker status correctly', () => {
      monitoringService.updateBrokerStatus('test-broker', {
        connected: true,
        lastHeartbeat: Date.now(),
        syncStatus: 'syncing',
        errorCount: 0
      });

      const metrics = monitoringService.getMetricsSummary();
      expect(metrics.brokers['test-broker']).toMatchObject({
        broker: 'test-broker',
        connected: true,
        syncStatus: 'syncing',
        errorCount: 0
      });
    });
  });

  describe('Health Checks', () => {
    it('should register and run health checks', async () => {
      const mockHealthCheck = jest.fn().mockResolvedValue({
        status: 'healthy' as const,
        component: 'test-component',
        timestamp: Date.now(),
        details: { test: 'data' }
      });

      monitoringService.registerHealthCheck('test-component', mockHealthCheck);

      const results = await monitoringService.runHealthChecks();
      
      expect(mockHealthCheck).toHaveBeenCalled();
      expect(results.get('test-component')).toMatchObject({
        status: 'healthy',
        component: 'test-component',
        responseTime: expect.any(Number)
      });
    });

    it('should handle health check failures', async () => {
      const mockFailingHealthCheck = jest.fn().mockRejectedValue(new Error('Health check failed'));

      monitoringService.registerHealthCheck('failing-component', mockFailingHealthCheck);

      const results = await monitoringService.runHealthChecks();
      
      expect(results.get('failing-component')).toMatchObject({
        status: 'unhealthy',
        component: 'failing-component',
        error: 'Health check failed'
      });
    });

    it('should emit health check events', async () => {
      const mockCallback = jest.fn();
      monitoringService.on('health:checked', mockCallback);

      const mockHealthCheck = jest.fn().mockResolvedValue({
        status: 'healthy' as const,
        component: 'test',
        timestamp: Date.now()
      });

      monitoringService.registerHealthCheck('test', mockHealthCheck);
      await monitoringService.runHealthChecks();

      expect(mockCallback).toHaveBeenCalledWith({
        results: expect.objectContaining({
          test: expect.objectContaining({
            status: 'healthy',
            component: 'test'
          })
        })
      });
    });
  });

  describe('Alerting System', () => {
    beforeEach(() => {
      // Simulate some sync operations to have data for alerts
      monitoringService.recordSyncOperation('test-broker', 200, false, 'Test error');
      monitoringService.recordSyncOperation('test-broker', 300, false, 'Another error');
      monitoringService.recordSyncOperation('test-broker', 150, true);
    });

    it('should register custom alerts', () => {
      const customAlert: AlertConfig = {
        name: 'test_alert',
        condition: (metrics) => metrics.errorRate > 0.5,
        severity: 'warning',
        cooldownMs: 60000,
        description: 'Test alert description'
      };

      monitoringService.registerAlert(customAlert);
      
      // This would normally be tested by triggering the alert condition
      expect(() => monitoringService.checkAlerts()).not.toThrow();
    });

    it('should trigger alerts when conditions are met', () => {
      const mockAlertCallback = jest.fn();
      monitoringService.on('alert:triggered', mockAlertCallback);

      // Create an alert that should trigger based on current error rate
      const testAlert: AlertConfig = {
        name: 'high_error_rate_test',
        condition: (metrics) => metrics.errorRate > 0.5,
        severity: 'warning',
        cooldownMs: 0, // No cooldown for testing
        description: 'Test alert for high error rate'
      };

      monitoringService.registerAlert(testAlert);
      monitoringService.checkAlerts();

      expect(mockAlertCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'high_error_rate_test',
          severity: 'warning',
          description: 'Test alert for high error rate'
        })
      );
    });

    it('should respect alert cooldowns', () => {
      const mockAlertCallback = jest.fn();
      monitoringService.on('alert:triggered', mockAlertCallback);

      const testAlert: AlertConfig = {
        name: 'cooldown_test',
        condition: (metrics) => metrics.errorRate > 0.5,
        severity: 'warning',
        cooldownMs: 60000, // 1 minute cooldown
        description: 'Test alert with cooldown'
      };

      monitoringService.registerAlert(testAlert);
      
      // First check should trigger alert
      monitoringService.checkAlerts();
      expect(mockAlertCallback).toHaveBeenCalledTimes(1);

      // Second check immediately should not trigger due to cooldown
      monitoringService.checkAlerts();
      expect(mockAlertCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle alert condition errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const faultyAlert: AlertConfig = {
        name: 'faulty_alert',
        condition: (metrics) => { throw new Error('Condition error'); },
        severity: 'error',
        cooldownMs: 0,
        description: 'Faulty alert'
      };

      monitoringService.registerAlert(faultyAlert);
      
      expect(() => monitoringService.checkAlerts()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        'MonitoringService: Error checking alert faulty_alert:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Metrics Export', () => {
    beforeEach(() => {
      // Add some test data
      monitoringService.recordMetric('broker_sync_total', 5, { broker: 'test', status: 'success' });
      monitoringService.recordMetric('broker_connections_active', 3);
      monitoringService.recordMetric('broker_sync_duration_ms', 250);
      monitoringService.recordMetric('broker_sync_duration_ms', 180);
    });

    it('should export metrics in Prometheus format', () => {
      const output = monitoringService.exportPrometheusMetrics();
      
      expect(output).toContain('# HELP broker_sync_total Total number of broker synchronizations');
      expect(output).toContain('# TYPE broker_sync_total counter');
      expect(output).toContain('broker_sync_total 5');
      
      expect(output).toContain('# HELP broker_connections_active Number of active broker connections');
      expect(output).toContain('# TYPE broker_connections_active gauge');
      expect(output).toContain('broker_connections_active 3');
      
      expect(output).toContain('# HELP broker_sync_duration_ms Duration of broker synchronization operations');
      expect(output).toContain('# TYPE broker_sync_duration_ms histogram');
      expect(output).toContain('broker_sync_duration_ms_count 2');
      expect(output).toContain('broker_sync_duration_ms_sum 430');
    });

    it('should include quantiles for histogram metrics', () => {
      const output = monitoringService.exportPrometheusMetrics();
      
      expect(output).toContain('broker_sync_duration_ms{quantile="0.5"}');
      expect(output).toContain('broker_sync_duration_ms{quantile="0.95"}');
      expect(output).toContain('broker_sync_duration_ms{quantile="0.99"}');
    });
  });

  describe('Service Health', () => {
    it('should return overall service health', async () => {
      // Register a healthy check
      monitoringService.registerHealthCheck('healthy-component', async () => ({
        status: 'healthy',
        component: 'healthy-component',
        timestamp: Date.now()
      }));

      const health = await monitoringService.getServiceHealth();
      
      expect(health).toMatchObject({
        status: 'healthy',
        checks: expect.objectContaining({
          'healthy-component': expect.objectContaining({
            status: 'healthy'
          })
        }),
        metrics: expect.any(Object),
        uptime: expect.any(Number)
      });
    });

    it('should return degraded status when some checks are degraded', async () => {
      monitoringService.registerHealthCheck('degraded-component', async () => ({
        status: 'degraded',
        component: 'degraded-component',
        timestamp: Date.now()
      }));

      const health = await monitoringService.getServiceHealth();
      expect(health.status).toBe('degraded');
    });

    it('should return unhealthy status when any check is unhealthy', async () => {
      monitoringService.registerHealthCheck('unhealthy-component', async () => ({
        status: 'unhealthy',
        component: 'unhealthy-component',
        timestamp: Date.now()
      }));

      const health = await monitoringService.getServiceHealth();
      expect(health.status).toBe('unhealthy');
    });
  });

  describe('Periodic Collection', () => {
    it('should collect metrics periodically', () => {
      const mockCallback = jest.fn();
      monitoringService.on('metrics:collected', mockCallback);

      // Fast forward time to trigger collection
      jest.advanceTimersByTime(30000);

      expect(mockCallback).toHaveBeenCalled();
    });

    it('should check alerts periodically', () => {
      const mockCallback = jest.fn();
      monitoringService.on('alert:triggered', mockCallback);

      // Add an alert that will trigger
      const testAlert: AlertConfig = {
        name: 'periodic_test',
        condition: () => true, // Always trigger
        severity: 'info',
        cooldownMs: 0,
        description: 'Periodic test alert'
      };

      monitoringService.registerAlert(testAlert);

      // Fast forward time to trigger alert checking
      jest.advanceTimersByTime(60000);

      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources on shutdown', () => {
      const mockListener = jest.fn();
      monitoringService.on('test-event', mockListener);

      monitoringService.shutdown();

      // Verify all listeners are removed
      expect(monitoringService.listenerCount('test-event')).toBe(0);
    });
  });

  describe('Span Operations', () => {
    beforeEach(async () => {
      await monitoringService.initializeTracing();
    });

    it('should create spans when tracer is initialized', () => {
      const span = monitoringService.startSpan('test-operation');
      expect(span).not.toBeNull();
      expect(span).toHaveProperty('setTag');
      expect(span).toHaveProperty('setStatus');
      expect(span).toHaveProperty('finish');
    });

    it('should return null when tracer is not initialized', () => {
      const uninitializedService = new MonitoringService();
      const span = uninitializedService.startSpan('test-operation');
      expect(span).toBeNull();
      
      uninitializedService.shutdown();
    });
  });
}); 