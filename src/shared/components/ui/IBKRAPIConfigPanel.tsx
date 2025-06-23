import React, { useState } from 'react';
import { Card, Button, Alert } from 'antd';
import { IBKRAPIConfig, RequestMetrics } from '../../services/IBKRAPIRateLimiter';
import { Badge } from './Badge';

export interface IBKRAPIConfigPanelProps {
  config: IBKRAPIConfig;
  metrics?: RequestMetrics;
  onConfigChange: (config: Partial<IBKRAPIConfig>) => void;
  connectionStatus: 'connected' | 'degraded' | 'disconnected' | 'connecting';
  onTestConnection?: () => void;
  onResetEmergencyStop?: () => void;
  onResetCircuitBreaker?: () => void;
  className?: string;
}

export const IBKRAPIConfigPanel: React.FC<IBKRAPIConfigPanelProps> = ({
  config,
  metrics,
  onConfigChange,
  connectionStatus,
  onTestConnection,
  onResetEmergencyStop,
  onResetCircuitBreaker,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'rate-limits' | 'retry' | 'circuit-breaker' | 'monitoring'>('rate-limits');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Connection status indicator
  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">🟢 Connected</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-100 text-yellow-800">🟡 Degraded</Badge>;
      case 'disconnected':
        return <Badge className="bg-red-100 text-red-800">🔴 Disconnected</Badge>;
      case 'connecting':
        return <Badge className="bg-blue-100 text-blue-800">🔵 Connecting...</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">❓ Unknown</Badge>;
    }
  };

  // Circuit breaker status indicator
  const getCircuitBreakerBadge = () => {
    if (!metrics) return null;
    
    switch (metrics.circuitState) {
      case 'CLOSED':
        return <Badge className="bg-green-100 text-green-800">✅ Closed (Normal)</Badge>;
      case 'OPEN':
        return <Badge className="bg-red-100 text-red-800">⚠️ Open (Blocking)</Badge>;
      case 'HALF_OPEN':
        return <Badge className="bg-yellow-100 text-yellow-800">🟡 Half-Open (Testing)</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">❓ Unknown</Badge>;
    }
  };

  // Calculate usage percentage for rate limits
  const getUsagePercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100);
  };

  // Get color for usage bars
  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-blue-500';
    return 'bg-green-500';
  };

  // Validate configuration values
  const validateConfig = (field: keyof IBKRAPIConfig, value: number) => {
    switch (field) {
      case 'maxRequestsPerSecond':
        return value > 0 && value <= 50; // IBKR limit
      case 'maxRequestsPerMinute':
        return value > 0 && value <= 3000;
      case 'maxRequestsPerHour':
        return value > 0 && value <= 180000;
      case 'maxRetries':
        return value >= 0 && value <= 10;
      case 'baseRetryDelay':
        return value >= 100 && value <= 10000;
      case 'maxRetryDelay':
        return value >= 1000 && value <= 300000;
      case 'circuitBreakerThreshold':
        return value > 0 && value <= 50;
      case 'circuitBreakerTimeout':
        return value >= 1000 && value <= 300000;
      case 'emergencyStopErrorRate':
        return value >= 0 && value <= 100;
      default:
        return true;
    }
  };

  // Handle configuration changes with validation
  const handleConfigChange = (field: keyof IBKRAPIConfig, value: any) => {
    if (typeof value === 'number' && !validateConfig(field, value)) {
      return; // Don't update invalid values
    }
    onConfigChange({ [field]: value });
  };

  // Render a slider control
  const renderSlider = (
    field: keyof IBKRAPIConfig,
    label: string,
    min: number,
    max: number,
    step: number = 1,
    description?: string
  ) => {
    const value = config[field] as number;
    const isValid = validateConfig(field, value);
    const percentage = ((value - min) / (max - min)) * 100;

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700">{label}</label>
          <span className={`text-sm font-mono ${isValid ? 'text-gray-900' : 'text-red-600'}`}>
            {value}
          </span>
        </div>
        
        <div className="relative">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => handleConfigChange(field, parseFloat(e.target.value))}
            className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
              isValid ? 'bg-gray-200' : 'bg-red-200'
            }`}
            style={{
              background: `linear-gradient(to right, ${isValid ? '#3B82F6' : '#EF4444'} 0%, ${isValid ? '#3B82F6' : '#EF4444'} ${percentage}%, #E5E7EB ${percentage}%, #E5E7EB 100%)`
            }}
          />
        </div>
        
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
        
        {!isValid && (
          <p className="text-xs text-red-600">Invalid value. Please adjust within valid range.</p>
        )}
      </div>
    );
  };

  // Render toggle switch
  const renderToggle = (
    field: keyof IBKRAPIConfig,
    label: string,
    description?: string
  ) => {
    const value = config[field] as boolean;

    return (
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">{label}</label>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <label className="relative inline-flex items-center cursor-pointer ml-4">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => handleConfigChange(field, e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    );
  };

  // Render usage metrics
  const renderUsageMetrics = () => {
    if (!metrics) return null;

    return (
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900">Current Usage</h4>
        
        {/* Requests per second */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Requests/Second</span>
            <span>{metrics.requestsPerSecond.toFixed(1)}/{config.maxRequestsPerSecond}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getUsageColor(getUsagePercentage(metrics.requestsPerSecond, config.maxRequestsPerSecond))}`}
              style={{ width: `${getUsagePercentage(metrics.requestsPerSecond, config.maxRequestsPerSecond)}%` }}
            ></div>
          </div>
        </div>

        {/* Queue length */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Queue Length</span>
            <span>{metrics.queueLength}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getUsageColor(Math.min(metrics.queueLength * 10, 100))}`}
              style={{ width: `${Math.min(metrics.queueLength * 10, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Error rate */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Error Rate</span>
            <span>{metrics.errorRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getUsageColor(metrics.errorRate)}`}
              style={{ width: `${Math.min(metrics.errorRate, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Performance metrics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Total Requests:</span>
            <span className="ml-2 font-mono">{metrics.totalRequests}</span>
          </div>
          <div>
            <span className="text-gray-500">Success Rate:</span>
            <span className="ml-2 font-mono">{((metrics.successfulRequests / Math.max(metrics.totalRequests, 1)) * 100).toFixed(1)}%</span>
          </div>
          <div>
            <span className="text-gray-500">Avg Response:</span>
            <span className="ml-2 font-mono">{metrics.averageResponseTime.toFixed(0)}ms</span>
          </div>
          <div>
            <span className="text-gray-500">Failed:</span>
            <span className="ml-2 font-mono">{metrics.failedRequests}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">IBKR API Configuration</h3>
          <p className="text-sm text-gray-500">Configure rate limits, retry logic, and fail-safe controls</p>
        </div>
        <div className="flex items-center space-x-3">
          {getStatusBadge()}
          {getCircuitBreakerBadge()}
        </div>
      </div>

      {/* Emergency alerts */}
      {metrics?.circuitState === 'OPEN' && (
        <Alert 
          type="error"
          showIcon
          className="mb-4"
          message="Circuit Breaker Open"
          description="API requests are currently blocked due to consecutive failures."
          action={
            onResetCircuitBreaker && (
              <Button 
                size="small" 
                danger 
                onClick={onResetCircuitBreaker}
              >
                Reset
              </Button>
            )
          }
        />
      )}

      {metrics?.errorRate && metrics.errorRate >= config.emergencyStopErrorRate && (
        <Alert 
          type="error"
          showIcon
          className="mb-4"
          message="Emergency Stop Active"
          description="High error rate detected. API requests are suspended."
          action={
            onResetEmergencyStop && (
              <Button 
                size="small" 
                danger 
                onClick={onResetEmergencyStop}
              >
                Reset
              </Button>
            )
          }
        />
      )}

      {/* Connection Test */}
      <div className="flex items-center justify-between mb-6 p-3 bg-gray-50 rounded-lg">
        <div>
          <span className="text-sm font-medium text-gray-700">Connection Status:</span>
          <span className="ml-2">{getStatusBadge()}</span>
        </div>
        {onTestConnection && (
          <button
            onClick={onTestConnection}
            disabled={connectionStatus === 'connecting'}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {connectionStatus === 'connecting' ? 'Testing...' : 'Test Connection'}
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
        {[
          { id: 'rate-limits', label: 'Rate Limits' },
          { id: 'retry', label: 'Retry Logic' },
          { id: 'circuit-breaker', label: 'Circuit Breaker' },
          { id: 'monitoring', label: 'Monitoring' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Rate Limits Tab */}
        {activeTab === 'rate-limits' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Request Rate Limits</h4>
              <div className="space-y-4">
                {renderSlider(
                  'maxRequestsPerSecond',
                  'Max Requests per Second',
                  1,
                  50,
                  1,
                  'IBKR allows max 50 req/sec for authenticated users'
                )}
                
                {renderSlider(
                  'maxRequestsPerMinute',
                  'Max Requests per Minute',
                  60,
                  3000,
                  60,
                  'Additional minute-based rate limiting'
                )}
                
                {showAdvanced && renderSlider(
                  'maxRequestsPerHour',
                  'Max Requests per Hour',
                  3600,
                  180000,
                  3600,
                  'Additional hour-based rate limiting'
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Queue Settings</h4>
              <div className="space-y-4">
                {renderToggle(
                  'enablePriorityQueue',
                  'Enable Priority Queue',
                  'Process high-priority requests (orders) before low-priority ones (market data)'
                )}
              </div>
            </div>

            {/* Usage Metrics */}
            {renderUsageMetrics()}
          </div>
        )}

        {/* Retry Logic Tab */}
        {activeTab === 'retry' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Retry Configuration</h4>
              <div className="space-y-4">
                {renderSlider(
                  'maxRetries',
                  'Maximum Retries',
                  0,
                  10,
                  1,
                  'Number of retry attempts for failed requests'
                )}
                
                {renderSlider(
                  'baseRetryDelay',
                  'Base Retry Delay (ms)',
                  100,
                  10000,
                  100,
                  'Initial delay before first retry attempt'
                )}
                
                {renderSlider(
                  'maxRetryDelay',
                  'Max Retry Delay (ms)',
                  1000,
                  300000,
                  1000,
                  'Maximum delay between retry attempts'
                )}

                {showAdvanced && renderSlider(
                  'retryExponent',
                  'Retry Backoff Exponent',
                  1.1,
                  3.0,
                  0.1,
                  'Exponential backoff multiplier (higher = more aggressive backoff)'
                )}
              </div>
            </div>
          </div>
        )}

        {/* Circuit Breaker Tab */}
        {activeTab === 'circuit-breaker' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Circuit Breaker Protection</h4>
              <div className="space-y-4">
                {renderSlider(
                  'circuitBreakerThreshold',
                  'Failure Threshold',
                  1,
                  50,
                  1,
                  'Number of consecutive failures before opening circuit'
                )}
                
                {renderSlider(
                  'circuitBreakerTimeout',
                  'Circuit Timeout (ms)',
                  1000,
                  300000,
                  1000,
                  'Time to wait before attempting to close circuit'
                )}
                
                {showAdvanced && renderSlider(
                  'circuitBreakerResetTime',
                  'Reset Time (ms)',
                  60000,
                  1800000,
                  60000,
                  'Time after success to reset failure count'
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Emergency Stop</h4>
              <div className="space-y-4">
                {renderSlider(
                  'emergencyStopErrorRate',
                  'Emergency Stop Error Rate (%)',
                  0,
                  100,
                  5,
                  'Error rate percentage that triggers emergency stop'
                )}
                
                {renderSlider(
                  'emergencyStopTimeWindow',
                  'Time Window (ms)',
                  10000,
                  300000,
                  10000,
                  'Time window for calculating error rate'
                )}
              </div>
            </div>
          </div>
        )}

        {/* Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Monitoring & Logging</h4>
              <div className="space-y-4">
                {renderToggle(
                  'logAllRequests',
                  'Log All Requests',
                  'Enable detailed logging of all API interactions'
                )}
                
                {renderToggle(
                  'enableMetrics',
                  'Enable Metrics Collection',
                  'Collect performance metrics and statistics'
                )}
              </div>
            </div>

            {/* Real-time metrics display */}
            {renderUsageMetrics()}
          </div>
        )}
      </div>

      {/* Advanced Settings Toggle */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <span className="mr-2">{showAdvanced ? '△' : '▽'}</span>
          {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
        </button>
      </div>
    </Card>
  );
}; 