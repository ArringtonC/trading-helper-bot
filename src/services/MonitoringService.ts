/**
 * Comprehensive Monitoring and Alerting Service
 * Provides observability for broker API synchronization with OpenTelemetry integration,
 * custom metrics, health checks, and alerting capabilities.
 */

import { EventEmitter } from 'events';

// OpenTelemetry interfaces (would import from actual packages in production)
interface Span {
  setTag(key: string, value: any): void;
  setStatus(status: { code: number; message?: string }): void;
  finish(): void;
}

interface Tracer {
  startSpan(operationName: string, options?: any): Span;
}

export interface MetricConfig {
  name: string;
  description: string;
  type: 'counter' | 'gauge' | 'histogram' | 'timer';
  labels?: string[];
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  component: string;
  timestamp: number;
  responseTime?: number;
  details?: any;
  error?: string;
}

export interface AlertConfig {
  name: string;
  condition: (metrics: any) => boolean;
  severity: 'info' | 'warning' | 'error' | 'critical';
  cooldownMs: number;
  description: string;
  runbook?: string;
}

export interface SyncMetrics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  avgSyncDurationMs: number;
  lastSyncTimestamp: number;
  activeConnections: number;
  errorRate: number;
  throughputPerSecond: number;
}

export interface BrokerStatus {
  broker: string;
  connected: boolean;
  lastHeartbeat: number;
  syncStatus: 'idle' | 'syncing' | 'error';
  errorCount: number;
  lastError?: string;
}

export class MonitoringService extends EventEmitter {
  private tracer: Tracer | null = null;
  private metrics: Map<string, any> = new Map();
  private healthChecks: Map<string, () => Promise<HealthCheckResult>> = new Map();
  private alerts: Map<string, AlertConfig> = new Map();
  private alertCooldowns: Map<string, number> = new Map();
  private syncMetrics: SyncMetrics;
  private brokerStatuses: Map<string, BrokerStatus> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    super();
    this.syncMetrics = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      avgSyncDurationMs: 0,
      lastSyncTimestamp: 0,
      activeConnections: 0,
      errorRate: 0,
      throughputPerSecond: 0
    };
    
    this.initializeDefaultMetrics();
    this.initializeDefaultAlerts();
    this.startMetricsCollection();
  }

  /**
   * Initialize OpenTelemetry tracing (placeholder for actual implementation)
   */
  public async initializeTracing(serviceName: string = 'trading-helper-bot'): Promise<void> {
    try {
      // In production, this would initialize actual OpenTelemetry
      console.log(`MonitoringService: Initializing tracing for service: ${serviceName}`);
      
      // Mock tracer for now
      this.tracer = {
        startSpan: (operationName: string, options?: any): Span => {
          const startTime = Date.now();
          return {
            setTag: (key: string, value: any) => {
              console.log(`Span[${operationName}] Tag: ${key}=${value}`);
            },
            setStatus: (status: { code: number; message?: string }) => {
              console.log(`Span[${operationName}] Status: ${status.code} - ${status.message || 'OK'}`);
            },
            finish: () => {
              const duration = Date.now() - startTime;
              console.log(`Span[${operationName}] Finished: ${duration}ms`);
            }
          };
        }
      };
      
      this.isInitialized = true;
      this.emit('monitoring:initialized', { serviceName });
    } catch (error) {
      console.error('MonitoringService: Failed to initialize tracing:', error);
      throw error;
    }
  }

  /**
   * Create a distributed trace span for operations
   */
  public startSpan(operationName: string, options?: any): Span | null {
    if (!this.tracer) {
      console.warn('MonitoringService: Tracer not initialized, span creation skipped');
      return null;
    }
    return this.tracer.startSpan(operationName, options);
  }

  /**
   * Initialize default metrics for broker synchronization
   */
  private initializeDefaultMetrics(): void {
    const defaultMetrics: MetricConfig[] = [
      {
        name: 'broker_sync_total',
        description: 'Total number of broker synchronizations',
        type: 'counter',
        labels: ['broker', 'status']
      },
      {
        name: 'broker_sync_duration_ms',
        description: 'Duration of broker synchronization operations',
        type: 'histogram',
        labels: ['broker']
      },
      {
        name: 'broker_connections_active',
        description: 'Number of active broker connections',
        type: 'gauge',
        labels: ['broker']
      },
      {
        name: 'broker_api_errors_total',
        description: 'Total number of broker API errors',
        type: 'counter',
        labels: ['broker', 'error_type']
      },
      {
        name: 'broker_heartbeat_status',
        description: 'Broker heartbeat status (1=healthy, 0=unhealthy)',
        type: 'gauge',
        labels: ['broker']
      }
    ];

    defaultMetrics.forEach(metric => {
      this.registerMetric(metric);
    });
  }

  /**
   * Register a custom metric
   */
  public registerMetric(config: MetricConfig): void {
    this.metrics.set(config.name, {
      config,
      value: config.type === 'gauge' ? 0 : undefined,
      samples: config.type === 'histogram' ? [] : undefined
    });
    console.log(`MonitoringService: Registered metric: ${config.name}`);
  }

  /**
   * Record a metric value
   */
  public recordMetric(name: string, value: number, labels?: Record<string, string>): void {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`MonitoringService: Unknown metric: ${name}`);
      return;
    }

    const labelString = labels ? Object.entries(labels).map(([k, v]) => `${k}=${v}`).join(',') : '';
    
    switch (metric.config.type) {
      case 'counter':
        metric.value = (metric.value || 0) + value;
        break;
      case 'gauge':
        metric.value = value;
        break;
      case 'histogram':
        metric.samples = metric.samples || [];
        metric.samples.push({ value, timestamp: Date.now(), labels });
        // Keep only last 1000 samples
        if (metric.samples.length > 1000) {
          metric.samples = metric.samples.slice(-1000);
        }
        break;
      case 'timer':
        metric.samples = metric.samples || [];
        metric.samples.push({ value, timestamp: Date.now(), labels });
        break;
    }

    this.emit('metric:recorded', { name, value, labels: labelString });
  }

  /**
   * Record broker synchronization metrics
   */
  public recordSyncOperation(broker: string, duration: number, success: boolean, error?: string): void {
    const span = this.startSpan('broker_sync_operation');
    
    try {
      // Update sync metrics
      this.syncMetrics.totalSyncs++;
      this.syncMetrics.lastSyncTimestamp = Date.now();
      
      if (success) {
        this.syncMetrics.successfulSyncs++;
        this.recordMetric('broker_sync_total', 1, { broker, status: 'success' });
      } else {
        this.syncMetrics.failedSyncs++;
        this.recordMetric('broker_sync_total', 1, { broker, status: 'failure' });
        if (error) {
          this.recordMetric('broker_api_errors_total', 1, { broker, error_type: error });
        }
      }
      
      // Update average duration
      this.recordMetric('broker_sync_duration_ms', duration, { broker });
      
      // Update error rate
      this.syncMetrics.errorRate = this.syncMetrics.failedSyncs / this.syncMetrics.totalSyncs;
      
      // Update broker status
      this.updateBrokerStatus(broker, {
        connected: success,
        lastHeartbeat: Date.now(),
        syncStatus: success ? 'idle' : 'error',
        errorCount: success ? 0 : (this.brokerStatuses.get(broker)?.errorCount || 0) + 1,
        lastError: error
      });

      if (span) {
        span.setTag('broker', broker);
        span.setTag('duration_ms', duration);
        span.setTag('success', success);
        if (error) span.setTag('error', error);
        span.setStatus({ code: success ? 0 : 1, message: error });
      }
      
      this.emit('sync:recorded', { broker, duration, success, error });
      
    } finally {
      if (span) span.finish();
    }
  }

  /**
   * Update broker connection status
   */
  public updateBrokerStatus(broker: string, updates: Partial<BrokerStatus>): void {
    const currentStatus = this.brokerStatuses.get(broker) || {
      broker,
      connected: false,
      lastHeartbeat: 0,
      syncStatus: 'idle',
      errorCount: 0
    };
    
    const newStatus = { ...currentStatus, ...updates };
    this.brokerStatuses.set(broker, newStatus);
    
    // Record heartbeat metric
    this.recordMetric('broker_heartbeat_status', newStatus.connected ? 1 : 0, { broker });
    
    this.emit('broker:status_updated', { broker, status: newStatus });
  }

  /**
   * Register a health check
   */
  public registerHealthCheck(component: string, checkFn: () => Promise<HealthCheckResult>): void {
    this.healthChecks.set(component, checkFn);
    console.log(`MonitoringService: Registered health check: ${component}`);
  }

  /**
   * Run all health checks
   */
  public async runHealthChecks(): Promise<Map<string, HealthCheckResult>> {
    const results = new Map<string, HealthCheckResult>();
    
    for (const [component, checkFn] of Array.from(this.healthChecks.entries())) {
      try {
        const startTime = Date.now();
        const result = await checkFn();
        const responseTime = Date.now() - startTime;
        
        results.set(component, {
          ...result,
          responseTime,
          timestamp: Date.now()
        });
      } catch (error) {
        results.set(component, {
          status: 'unhealthy',
          component,
          timestamp: Date.now(),
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    this.emit('health:checked', { results: Object.fromEntries(results) });
    return results;
  }

  /**
   * Initialize default alerting rules
   */
  private initializeDefaultAlerts(): void {
    const defaultAlerts: AlertConfig[] = [
      {
        name: 'high_error_rate',
        condition: (metrics) => metrics.errorRate > 0.1, // 10% error rate
        severity: 'warning',
        cooldownMs: 300000, // 5 minutes
        description: 'Broker synchronization error rate is above 10%',
        runbook: 'Check broker connection status and API health'
      },
      {
        name: 'sync_failure_spike',
        condition: (metrics) => metrics.errorRate > 0.25, // 25% error rate
        severity: 'critical',
        cooldownMs: 180000, // 3 minutes
        description: 'Critical: Broker synchronization failure rate is above 25%',
        runbook: 'Immediate investigation required - check broker API status'
      },
      {
        name: 'no_recent_sync',
        condition: (metrics) => (Date.now() - metrics.lastSyncTimestamp) > 600000, // 10 minutes
        severity: 'warning',
        cooldownMs: 600000, // 10 minutes
        description: 'No broker synchronization activity in the last 10 minutes',
        runbook: 'Check if synchronization service is running'
      },
      {
        name: 'broker_disconnected',
        condition: (metrics) => Object.values(metrics.brokerStatuses || {}).some((status: any) => !status.connected),
        severity: 'error',
        cooldownMs: 300000, // 5 minutes
        description: 'One or more brokers are disconnected',
        runbook: 'Check broker credentials and network connectivity'
      }
    ];

    defaultAlerts.forEach(alert => {
      this.registerAlert(alert);
    });
  }

  /**
   * Register an alert rule
   */
  public registerAlert(config: AlertConfig): void {
    this.alerts.set(config.name, config);
    console.log(`MonitoringService: Registered alert: ${config.name}`);
  }

  /**
   * Check all alert conditions
   */
  public checkAlerts(): void {
    const currentMetrics = {
      ...this.syncMetrics,
      brokerStatuses: Object.fromEntries(this.brokerStatuses)
    };

    for (const [alertName, alertConfig] of Array.from(this.alerts.entries())) {
      try {
        const shouldAlert = alertConfig.condition(currentMetrics);
        const lastAlert = this.alertCooldowns.get(alertName) || 0;
        const now = Date.now();
        
        if (shouldAlert && (now - lastAlert) > alertConfig.cooldownMs) {
          this.triggerAlert(alertName, alertConfig, currentMetrics);
          this.alertCooldowns.set(alertName, now);
        }
      } catch (error) {
        console.error(`MonitoringService: Error checking alert ${alertName}:`, error);
      }
    }
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(name: string, config: AlertConfig, metrics: any): void {
    const alert = {
      name,
      severity: config.severity,
      description: config.description,
      runbook: config.runbook,
      timestamp: Date.now(),
      metrics
    };

    console.warn(`🚨 ALERT [${config.severity.toUpperCase()}]: ${config.description}`);
    if (config.runbook) {
      console.warn(`📋 Runbook: ${config.runbook}`);
    }

    this.emit('alert:triggered', alert);
  }

  /**
   * Start periodic metrics collection and alerting
   */
  private startMetricsCollection(): void {
    // Collect metrics every 30 seconds
    setInterval(() => {
      this.collectPeriodicMetrics();
    }, 30000);

    // Check alerts every minute
    setInterval(() => {
      this.checkAlerts();
    }, 60000);

    // Run health checks every 2 minutes
    setInterval(async () => {
      await this.runHealthChecks();
    }, 120000);
  }

  /**
   * Collect periodic metrics
   */
  private collectPeriodicMetrics(): void {
    // Update throughput calculation
    const now = Date.now();
    const timeDiff = (now - (this.syncMetrics.lastSyncTimestamp || now)) / 1000;
    this.syncMetrics.throughputPerSecond = timeDiff > 0 ? 1 / timeDiff : 0;

    // Record active connections
    this.syncMetrics.activeConnections = Array.from(this.brokerStatuses.values())
      .filter(status => status.connected).length;
    
    this.recordMetric('broker_connections_active', this.syncMetrics.activeConnections);
    
    this.emit('metrics:collected', this.syncMetrics);
  }

  /**
   * Get current metrics summary
   */
  public getMetricsSummary(): any {
    return {
      sync: this.syncMetrics,
      brokers: Object.fromEntries(this.brokerStatuses),
      uptime: this.isInitialized ? Date.now() - (this.syncMetrics.lastSyncTimestamp || Date.now()) : 0
    };
  }

  /**
   * Export metrics in Prometheus format
   */
  public exportPrometheusMetrics(): string {
    let output = '';
    
    for (const [name, metric] of Array.from(this.metrics.entries())) {
      output += `# HELP ${name} ${metric.config.description}\n`;
      output += `# TYPE ${name} ${metric.config.type}\n`;
      
      if (metric.config.type === 'gauge' || metric.config.type === 'counter') {
        output += `${name} ${metric.value || 0}\n`;
      } else if (metric.config.type === 'histogram' && metric.samples) {
        const sorted = metric.samples.sort((a: any, b: any) => a.value - b.value);
        const count = sorted.length;
        const sum = sorted.reduce((acc: number, sample: any) => acc + sample.value, 0);
        
        output += `${name}_count ${count}\n`;
        output += `${name}_sum ${sum}\n`;
        
        // Add quantiles
        if (count > 0) {
          const p50 = sorted[Math.floor(count * 0.5)]?.value || 0;
          const p95 = sorted[Math.floor(count * 0.95)]?.value || 0;
          const p99 = sorted[Math.floor(count * 0.99)]?.value || 0;
          
          output += `${name}{quantile="0.5"} ${p50}\n`;
          output += `${name}{quantile="0.95"} ${p95}\n`;
          output += `${name}{quantile="0.99"} ${p99}\n`;
        }
      }
      
      output += '\n';
    }
    
    return output;
  }

  /**
   * Get service health status
   */
  public async getServiceHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, HealthCheckResult>;
    metrics: any;
    uptime: number;
  }> {
    const healthChecks = await this.runHealthChecks();
    const checksObj = Object.fromEntries(healthChecks);
    
    // Determine overall status
    const statuses = Array.from(healthChecks.values()).map(check => check.status);
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (statuses.some(status => status === 'unhealthy')) {
      overallStatus = 'unhealthy';
    } else if (statuses.some(status => status === 'degraded')) {
      overallStatus = 'degraded';
    }
    
    return {
      status: overallStatus,
      checks: checksObj,
      metrics: this.getMetricsSummary(),
      uptime: Date.now() - (this.syncMetrics.lastSyncTimestamp || Date.now())
    };
  }

  /**
   * Cleanup resources
   */
  public shutdown(): void {
    this.removeAllListeners();
    this.metrics.clear();
    this.healthChecks.clear();
    this.alerts.clear();
    this.alertCooldowns.clear();
    this.brokerStatuses.clear();
    console.log('MonitoringService: Shutdown complete');
  }
}

export default MonitoringService; 