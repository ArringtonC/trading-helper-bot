/**
 * Monitoring Dashboard Component
 * Displays real-time metrics, health checks, and alerts for broker synchronization
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/button';

interface MetricsSummary {
  sync: {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    avgSyncDurationMs: number;
    lastSyncTimestamp: number;
    activeConnections: number;
    errorRate: number;
    throughputPerSecond: number;
  };
  brokers: Record<string, {
    broker: string;
    connected: boolean;
    lastHeartbeat: number;
    syncStatus: 'idle' | 'syncing' | 'error';
    errorCount: number;
    lastError?: string;
  }>;
  uptime: number;
}

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  component: string;
  timestamp: number;
  responseTime?: number;
  details?: any;
  error?: string;
}

interface Alert {
  name: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  description: string;
  runbook?: string;
  timestamp: number;
  metrics: any;
}

interface MonitoringDashboardProps {
  refreshInterval?: number;
  onAlert?: (alert: Alert) => void;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  refreshInterval = 30000,
  onAlert
}) => {
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [healthChecks, setHealthChecks] = useState<Record<string, HealthCheck>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Mock data fetching (in production, this would connect to actual MonitoringService)
  const fetchMonitoringData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Simulate API calls to monitoring service
      const mockMetrics: MetricsSummary = {
        sync: {
          totalSyncs: 1247,
          successfulSyncs: 1189,
          failedSyncs: 58,
          avgSyncDurationMs: 245,
          lastSyncTimestamp: Date.now() - 30000,
          activeConnections: 3,
          errorRate: 0.047,
          throughputPerSecond: 0.033
        },
        brokers: {
          'interactive-brokers': {
            broker: 'interactive-brokers',
            connected: true,
            lastHeartbeat: Date.now() - 15000,
            syncStatus: 'idle',
            errorCount: 2
          },
          'schwab': {
            broker: 'schwab',
            connected: true,
            lastHeartbeat: Date.now() - 25000,
            syncStatus: 'idle',
            errorCount: 1
          },
          'alpaca': {
            broker: 'alpaca',
            connected: false,
            lastHeartbeat: Date.now() - 300000,
            syncStatus: 'error',
            errorCount: 15,
            lastError: 'Connection timeout'
          }
        },
        uptime: 7200000 // 2 hours
      };

      const mockHealthChecks: Record<string, HealthCheck> = {
        'database': {
          status: 'healthy',
          component: 'database',
          timestamp: Date.now(),
          responseTime: 12,
          details: { connections: 5, cpu: 0.15 }
        },
        'broker-apis': {
          status: 'degraded',
          component: 'broker-apis',
          timestamp: Date.now(),
          responseTime: 1250,
          details: { 
            'interactive-brokers': 'healthy',
            'schwab': 'healthy', 
            'alpaca': 'unhealthy'
          }
        },
        'sync-service': {
          status: 'healthy',
          component: 'sync-service',
          timestamp: Date.now(),
          responseTime: 45,
          details: { queueSize: 3, workers: 2 }
        }
      };

      setMetrics(mockMetrics);
      setHealthChecks(mockHealthChecks);
      setLastUpdate(Date.now());
      
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchMonitoringData, refreshInterval]);

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'degraded': return 'warning';
      case 'unhealthy': return 'danger';
      case 'idle': return 'secondary';
      case 'syncing': return 'default';
      case 'error': return 'danger';
      default: return 'secondary';
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'info': return 'secondary';
      case 'warning': return 'warning';
      case 'error': return 'danger';
      case 'critical': return 'danger';
      default: return 'secondary';
    }
  };

  if (isLoading && !metrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Monitoring Dashboard</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            Last updated: {formatTimestamp(lastUpdate)}
          </span>
          <Button onClick={fetchMonitoringData} disabled={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Overall Health Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Health Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {metrics?.sync.activeConnections || 0}
              </div>
              <div className="text-sm text-gray-600">Active Connections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {metrics ? Math.round((1 - metrics.sync.errorRate) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {metrics?.sync.avgSyncDurationMs || 0}ms
              </div>
              <div className="text-sm text-gray-600">Avg Sync Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatDuration(metrics?.uptime || 0)}
              </div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Broker Status */}
      <Card>
        <CardHeader>
          <CardTitle>Broker Connections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics && Object.values(metrics.brokers).map((broker) => (
              <div key={broker.broker} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="font-medium capitalize">
                    {broker.broker.replace('-', ' ')}
                  </div>
                  <Badge variant={getStatusBadgeVariant(broker.connected ? 'healthy' : 'unhealthy')}>
                    {broker.connected ? 'Connected' : 'Disconnected'}
                  </Badge>
                  <Badge variant={getStatusBadgeVariant(broker.syncStatus)}>
                    {broker.syncStatus}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    Last heartbeat: {formatTimestamp(broker.lastHeartbeat)}
                  </div>
                  {broker.errorCount > 0 && (
                    <div className="text-sm text-red-600">
                      Errors: {broker.errorCount}
                    </div>
                  )}
                  {broker.lastError && (
                    <div className="text-sm text-red-600">
                      {broker.lastError}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Health Checks */}
      <Card>
        <CardHeader>
          <CardTitle>Health Checks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.values(healthChecks).map((check) => (
              <div key={check.component} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium capitalize">
                    {check.component.replace('-', ' ')}
                  </h3>
                  <Badge variant={getStatusBadgeVariant(check.status)}>
                    {check.status}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  <div>Response time: {check.responseTime || 0}ms</div>
                  <div>Checked: {formatTimestamp(check.timestamp)}</div>
                  {check.error && (
                    <div className="text-red-600 mt-1">{check.error}</div>
                  )}
                  {check.details && (
                    <div className="mt-2">
                      <details className="cursor-pointer">
                        <summary className="text-blue-600">Details</summary>
                        <pre className="text-xs bg-gray-50 p-2 mt-1 rounded">
                          {JSON.stringify(check.details, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Synchronization Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Synchronization Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-xl font-bold text-blue-600">
                  {metrics.sync.totalSyncs}
                </div>
                <div className="text-sm text-gray-600">Total Syncs</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-xl font-bold text-green-600">
                  {metrics.sync.successfulSyncs}
                </div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-xl font-bold text-red-600">
                  {metrics.sync.failedSyncs}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-xl font-bold text-purple-600">
                  {metrics.sync.throughputPerSecond.toFixed(3)}
                </div>
                <div className="text-sm text-gray-600">Syncs/sec</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No recent alerts
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.slice(0, 10).map((alert, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <span className="font-medium">{alert.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatTimestamp(alert.timestamp)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 mb-2">
                    {alert.description}
                  </div>
                  {alert.runbook && (
                    <div className="text-sm text-blue-600">
                      📋 {alert.runbook}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MonitoringDashboard; 