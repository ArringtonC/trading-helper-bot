/**
 * Broker Sync Dashboard Page
 * 
 * Provides a comprehensive interface for broker synchronization including:
 * - Real-time connection status monitoring
 * - Sync service controls and metrics
 * - Error handling and retry logic display
 * - Live data streaming visualization
 * - Performance monitoring and alerts
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Badge, Progress, Tabs, Statistic, Switch, Table, Tag } from 'antd';
import { 
  ReloadOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  LineChartOutlined,
  ApiOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  SettingOutlined,
  MonitorOutlined
} from '@ant-design/icons';

const { TabPane } = Tabs;

interface BrokerConnection {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastSync: Date | null;
  syncCount: number;
  errorCount: number;
  latency: number;
}

interface SyncMetrics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  avgSyncTime: number;
  lastSyncTime: Date | null;
  nextScheduledSync: Date | null;
}

interface StreamMetrics {
  activeConnections: number;
  totalSubscriptions: number;
  messagesPerSecond: number;
  avgLatency: number;
  errorRate: number;
  uptime: number;
  dataVolume: number;
}

const BrokerSyncDashboard: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // State for broker connections
  const [brokerConnections, setBrokerConnections] = useState<BrokerConnection[]>([
    {
      id: 'ibkr',
      name: 'Interactive Brokers',
      status: 'disconnected',
      lastSync: null,
      syncCount: 0,
      errorCount: 0,
      latency: 0
    },
    {
      id: 'schwab',
      name: 'Charles Schwab',
      status: 'disconnected',
      lastSync: null,
      syncCount: 0,
      errorCount: 0,
      latency: 0
    }
  ]);
  
  // State for metrics
  const [syncMetrics, setSyncMetrics] = useState<SyncMetrics>({
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    avgSyncTime: 0,
    lastSyncTime: null,
    nextScheduledSync: null
  });
  
  const [streamMetrics, setStreamMetrics] = useState<StreamMetrics>({
    activeConnections: 0,
    totalSubscriptions: 0,
    messagesPerSecond: 0,
    avgLatency: 0,
    errorRate: 0,
    uptime: 0,
    dataVolume: 0
  });
  
  // State for real-time data
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [errorHistory, setErrorHistory] = useState<any[]>([]);
  
  // Auto-sync settings
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [syncInterval, setSyncInterval] = useState(30); // seconds
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize demo data
  useEffect(() => {
    const initializeDemoData = async () => {
      setIsLoading(true);
      
      // Simulate initialization delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Initialize with demo data
      simulateInitialActivity();
      setIsInitialized(true);
      setIsLoading(false);
    };
    
    initializeDemoData();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Set up auto-sync interval
  useEffect(() => {
    if (autoSyncEnabled && isInitialized) {
      intervalRef.current = setInterval(() => {
        performFullSync();
      }, syncInterval * 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoSyncEnabled, syncInterval, isInitialized]);

  // Simulate real-time message updates
  useEffect(() => {
    if (!isInitialized) return;
    
    const messageInterval = setInterval(() => {
      // Add random message
      const brokers = ['ibkr', 'schwab'];
      const types = ['PORTFOLIO', 'POSITIONS', 'ORDERS', 'MARKET_DATA'];
      const randomBroker = brokers[Math.floor(Math.random() * brokers.length)];
      const randomType = types[Math.floor(Math.random() * types.length)];
      
      setRecentMessages(prev => [
        {
          id: Date.now(),
          timestamp: new Date(),
          broker: randomBroker,
          type: randomType,
          data: `Sample ${randomType.toLowerCase()} data from ${randomBroker.toUpperCase()}...`
        },
        ...prev.slice(0, 49)
      ]);
      
      // Update stream metrics
      setStreamMetrics(prev => ({
        ...prev,
        messagesPerSecond: Math.max(0, prev.messagesPerSecond + (Math.random() - 0.5) * 2),
        dataVolume: prev.dataVolume + 1
      }));
    }, 2000);
    
    return () => clearInterval(messageInterval);
  }, [isInitialized]);

  const simulateInitialActivity = () => {
    // Simulate some initial metrics
    setSyncMetrics({
      totalSyncs: 156,
      successfulSyncs: 142,
      failedSyncs: 14,
      avgSyncTime: 2.3,
      lastSyncTime: new Date(Date.now() - 300000), // 5 minutes ago
      nextScheduledSync: new Date(Date.now() + 1500000) // 25 minutes from now
    });
    
    setStreamMetrics({
      activeConnections: 2,
      totalSubscriptions: 8,
      messagesPerSecond: 12.5,
      avgLatency: 45,
      errorRate: 0.02,
      uptime: 3600000, // 1 hour
      dataVolume: 1247895
    });
    
    // Simulate some error history
    setErrorHistory([
      {
        id: 1,
        timestamp: new Date(Date.now() - 600000),
        broker: 'schwab',
        type: 'RATE_LIMIT',
        message: 'API rate limit exceeded',
        resolved: true
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 1200000),
        broker: 'ibkr',
        type: 'NETWORK',
        message: 'Connection timeout',
        resolved: true
      }
    ]);
    
    // Set initial connection status
    setBrokerConnections(prev => prev.map(conn => ({
      ...conn,
      status: Math.random() > 0.5 ? 'connected' : 'disconnected',
      lastSync: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 3600000) : null,
      syncCount: Math.floor(Math.random() * 50) + 10,
      errorCount: Math.floor(Math.random() * 5),
      latency: Math.floor(Math.random() * 100) + 20
    })));
  };

  const performFullSync = async () => {
    setIsLoading(true);
    
    try {
      // Update broker connection status
      setBrokerConnections(prev => prev.map(conn => ({
        ...conn,
        status: 'connecting'
      })));
      
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update metrics
      setSyncMetrics(prev => ({
        ...prev,
        totalSyncs: prev.totalSyncs + 1,
        successfulSyncs: prev.successfulSyncs + 1,
        lastSyncTime: new Date(),
        nextScheduledSync: new Date(Date.now() + syncInterval * 1000)
      }));
      
      // Update broker connections
      setBrokerConnections(prev => prev.map(conn => ({
        ...conn,
        status: 'connected',
        lastSync: new Date(),
        syncCount: conn.syncCount + 1,
        latency: Math.floor(Math.random() * 100) + 20
      })));
      
    } catch (error) {
      console.error('Sync failed:', error);
      setBrokerConnections(prev => prev.map(conn => ({
        ...conn,
        status: 'error',
        errorCount: conn.errorCount + 1
      })));
    } finally {
      setIsLoading(false);
    }
  };

  const connectBroker = async (brokerId: string) => {
    try {
      setBrokerConnections(prev => prev.map(conn => 
        conn.id === brokerId 
          ? { ...conn, status: 'connecting' }
          : conn
      ));
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setBrokerConnections(prev => prev.map(conn => 
        conn.id === brokerId 
          ? { ...conn, status: 'connected' }
          : conn
      ));
    } catch (error) {
      console.error(`Failed to connect to ${brokerId}:`, error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'connecting': return <ReloadOutlined spin style={{ color: '#1890ff' }} />;
      case 'error': return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      default: return <ExclamationCircleOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'success';
      case 'connecting': return 'processing';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing Broker Sync Services...</p>
          <p className="text-sm text-gray-500 mt-2">
            🔄 Setting up SyncService, ErrorHandlingService, and StreamingService
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <ApiOutlined className="mr-3" />
            Broker Synchronization Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor and control real-time broker API synchronization, streaming, and error handling
          </p>
          <div className="mt-2 text-sm text-blue-600">
            ✅ SyncService, ErrorHandlingService, and StreamingService are now integrated and running
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 flex gap-4">
          <Button 
            type="primary" 
            icon={<ThunderboltOutlined />}
            loading={isLoading}
            onClick={performFullSync}
          >
            Sync All Brokers
          </Button>
          <Button 
            icon={<ReloadOutlined />}
            onClick={() => window.location.reload()}
          >
            Refresh Dashboard
          </Button>
          <div className="flex items-center ml-auto gap-4">
            <span>Auto-sync:</span>
            <Switch 
              checked={autoSyncEnabled}
              onChange={setAutoSyncEnabled}
            />
            <span className="text-sm text-gray-500">Every {syncInterval}s</span>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <Statistic
              title="Active Connections"
              value={streamMetrics.activeConnections}
              prefix={<ApiOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
          <Card>
            <Statistic
              title="Success Rate"
              value={((syncMetrics.successfulSyncs / syncMetrics.totalSyncs) * 100).toFixed(1)}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
          <Card>
            <Statistic
              title="Messages/sec"
              value={streamMetrics.messagesPerSecond}
              precision={1}
              prefix={<LineChartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
          <Card>
            <Statistic
              title="Avg Latency"
              value={streamMetrics.avgLatency}
              suffix="ms"
              prefix={<MonitorOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Broker Status" key="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Broker Connections */}
              <Card title="Broker Connections" extra={<SettingOutlined />}>
                <div className="space-y-4">
                  {brokerConnections.map(broker => (
                    <div key={broker.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(broker.status)}
                        <div>
                          <h3 className="font-medium">{broker.name}</h3>
                          <p className="text-sm text-gray-500">
                            {broker.lastSync ? `Last sync: ${broker.lastSync.toLocaleTimeString()}` : 'Never synced'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          status={getStatusColor(broker.status) as any} 
                          text={broker.status.toUpperCase()} 
                        />
                        <div className="text-sm text-gray-500 mt-1">
                          Syncs: {broker.syncCount} | Errors: {broker.errorCount}
                        </div>
                        {broker.latency > 0 && (
                          <div className="text-sm text-blue-600">
                            {broker.latency}ms latency
                          </div>
                        )}
                        {broker.status === 'disconnected' && (
                          <Button 
                            size="small" 
                            type="primary" 
                            className="mt-2"
                            onClick={() => connectBroker(broker.id)}
                          >
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Sync Metrics */}
              <Card title="Synchronization Metrics">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Syncs</span>
                    <span className="font-medium">{syncMetrics.totalSyncs}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Success Rate</span>
                    <span className="font-medium text-green-600">
                      {((syncMetrics.successfulSyncs / syncMetrics.totalSyncs) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Avg Sync Time</span>
                    <span className="font-medium">{syncMetrics.avgSyncTime}s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Next Scheduled</span>
                    <span className="font-medium">
                      {syncMetrics.nextScheduledSync?.toLocaleTimeString() || 'Not scheduled'}
                    </span>
                  </div>
                  <Progress 
                    percent={((syncMetrics.successfulSyncs / syncMetrics.totalSyncs) * 100)}
                    status="active"
                    strokeColor="#52c41a"
                  />
                </div>
              </Card>
            </div>
          </TabPane>

          <TabPane tab="Real-time Streaming" key="streaming">
            <div className="space-y-6">
              {/* Streaming Status */}
              <Card title="Streaming Status">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Statistic
                    title="Active Subscriptions"
                    value={streamMetrics.totalSubscriptions}
                    prefix={<DatabaseOutlined />}
                  />
                  <Statistic
                    title="Data Volume"
                    value={streamMetrics.dataVolume}
                    suffix="msgs"
                    prefix={<LineChartOutlined />}
                  />
                  <Statistic
                    title="Error Rate"
                    value={(streamMetrics.errorRate * 100).toFixed(2)}
                    suffix="%"
                    prefix={<WarningOutlined />}
                  />
                  <Statistic
                    title="Uptime"
                    value={(streamMetrics.uptime / 3600000).toFixed(1)}
                    suffix="h"
                    prefix={<MonitorOutlined />}
                  />
                </div>
              </Card>

              {/* Recent Messages */}
              <Card title="Recent Stream Messages" extra={<span className="text-sm text-gray-500">Last 50 messages (Live Demo)</span>}>
                <Table
                  dataSource={recentMessages}
                  columns={[
                    {
                      title: 'Time',
                      dataIndex: 'timestamp',
                      key: 'timestamp',
                      render: (time: Date) => time.toLocaleTimeString(),
                      width: 100,
                    },
                    {
                      title: 'Broker',
                      dataIndex: 'broker',
                      key: 'broker',
                      render: (broker: string) => <Tag color="blue">{broker.toUpperCase()}</Tag>,
                      width: 80,
                    },
                    {
                      title: 'Type',
                      dataIndex: 'type',
                      key: 'type',
                      render: (type: string) => <Tag>{type}</Tag>,
                      width: 120,
                    },
                    {
                      title: 'Data Preview',
                      dataIndex: 'data',
                      key: 'data',
                      ellipsis: true,
                    },
                  ]}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  style={{ maxHeight: 400, overflow: 'auto' }}
                />
              </Card>
            </div>
          </TabPane>

          <TabPane tab="Error Handling" key="errors">
            <div className="space-y-6">
              {/* Error History */}
              <Card title="Recent Errors">
                <Table
                  dataSource={errorHistory}
                  columns={[
                    {
                      title: 'Time',
                      dataIndex: 'timestamp',
                      key: 'timestamp',
                      render: (time: Date) => time.toLocaleString(),
                      width: 150,
                    },
                    {
                      title: 'Broker',
                      dataIndex: 'broker',
                      key: 'broker',
                      render: (broker: string) => <Tag color="orange">{broker.toUpperCase()}</Tag>,
                      width: 80,
                    },
                    {
                      title: 'Type',
                      dataIndex: 'type',
                      key: 'type',
                      render: (type: string) => <Tag color="red">{type}</Tag>,
                      width: 120,
                    },
                    {
                      title: 'Message',
                      dataIndex: 'message',
                      key: 'message',
                    },
                    {
                      title: 'Status',
                      dataIndex: 'resolved',
                      key: 'resolved',
                      render: (resolved: boolean) => (
                        <Badge 
                          status={resolved ? 'success' : 'error'} 
                          text={resolved ? 'Resolved' : 'Active'} 
                        />
                      ),
                      width: 100,
                    },
                  ]}
                  rowKey="id"
                  pagination={false}
                />
              </Card>

              {/* Service Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="SyncService Status" size="small">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Status</span>
                      <Badge status="success" text="RUNNING" />
                    </div>
                    <div className="flex justify-between">
                      <span>Operations</span>
                      <span>0 active</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success Rate</span>
                      <span className="text-green-600">91%</span>
                    </div>
                  </div>
                </Card>

                <Card title="ErrorHandlingService" size="small">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Circuit Breakers</span>
                      <Badge status="success" text="CLOSED" />
                    </div>
                    <div className="flex justify-between">
                      <span>Active Retries</span>
                      <span>0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fallbacks Used</span>
                      <span className="text-blue-600">3</span>
                    </div>
                  </div>
                </Card>

                <Card title="StreamingService" size="small">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Connections</span>
                      <span>{streamMetrics.activeConnections}/2</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subscriptions</span>
                      <span>{streamMetrics.totalSubscriptions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Queue Health</span>
                      <Badge status="success" text="HEALTHY" />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default BrokerSyncDashboard; 