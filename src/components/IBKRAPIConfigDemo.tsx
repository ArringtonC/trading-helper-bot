import React, { useState } from 'react';
import { IBKRAPIConfigPanel } from './ui/IBKRAPIConfigPanel';
import { IBKRConnectionStatusIndicator } from './ui/IBKRConnectionStatusIndicator';
import { useIBKRAPIConfig } from '../hooks/useIBKRAPIConfig';
import { Card } from './ui/Card';
import { Alert } from './ui/alert';

/**
 * Demo component showing the IBKR API Configuration system
 * This demonstrates how to integrate the API configuration panel with the Rule Editor
 */
export const IBKRAPIConfigDemo: React.FC = () => {
  const [showConfigPanel, setShowConfigPanel] = useState(true);
  const [showStatusDetails, setShowStatusDetails] = useState(false);
  const [apiCredentials, setApiCredentials] = useState({
    baseUrl: 'https://localhost:5000/v1/api',
    gateway: 'paper' as 'paper' | 'live',
    username: '',
    password: ''
  });

  // Use the IBKR API configuration hook
  const {
    config,
    updateConfig,
    resetToDefaults,
    connectionState,
    testConnection,
    metrics,
    refreshMetrics,
    resetEmergencyStop,
    resetCircuitBreaker,
    clearQueue,
    apiClient,
    initializeClient,
    isLive,
    setLive
  } = useIBKRAPIConfig();

  // Initialize API client when credentials are provided
  const handleInitializeClient = () => {
    if (apiCredentials.baseUrl) {
      initializeClient(apiCredentials);
    }
  };

  const handleTestConnection = async () => {
    if (!apiClient) {
      await handleInitializeClient();
    }
    return testConnection();
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          IBKR API Configuration System
        </h1>
        <p className="text-lg text-gray-600">
          Comprehensive rate limiting, monitoring, and fail-safe controls for IBKR API integration
        </p>
      </div>

      {/* Quick Setup Card */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Quick Setup</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Base URL
            </label>
            <input
              type="text"
              value={apiCredentials.baseUrl}
              onChange={(e) => setApiCredentials(prev => ({ ...prev, baseUrl: e.target.value }))}
              className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://localhost:5000/v1/api"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Gateway
            </label>
            <select
              value={apiCredentials.gateway}
              onChange={(e) => setApiCredentials(prev => ({ ...prev, gateway: e.target.value as 'paper' | 'live' }))}
              className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="paper">Paper Trading</option>
              <option value="live">Live Trading</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={apiCredentials.username}
              onChange={(e) => setApiCredentials(prev => ({ ...prev, username: e.target.value }))}
              className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your IBKR username"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleInitializeClient}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Initialize Client
            </button>
          </div>
        </div>
      </Card>

      {/* Connection Status */}
      <IBKRConnectionStatusIndicator
        connectionStatus={connectionState.status}
        metrics={metrics || undefined}
        showDetails={showStatusDetails}
        onToggleDetails={() => setShowStatusDetails(!showStatusDetails)}
        className="mb-6"
      />

      {/* Error Display */}
      {connectionState.lastError && (
        <Alert className="border-red-200 bg-red-50">
          <strong className="text-red-800">Connection Error:</strong>
          <p className="text-sm text-red-700 mt-1">{connectionState.lastError}</p>
        </Alert>
      )}

      {/* Control Panel */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => setShowConfigPanel(!showConfigPanel)}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          {showConfigPanel ? 'Hide' : 'Show'} Configuration Panel
        </button>
        
        <button
          onClick={handleTestConnection}
          disabled={connectionState.isTestingConnection || !apiCredentials.baseUrl}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {connectionState.isTestingConnection ? 'Testing...' : 'Test Connection'}
        </button>
        
        <button
          onClick={refreshMetrics}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Refresh Metrics
        </button>
        
        <button
          onClick={() => setLive(!isLive)}
          className={`px-4 py-2 rounded-md transition-colors ${
            isLive 
              ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          {isLive ? 'Pause' : 'Resume'} Live Updates
        </button>
        
        <button
          onClick={resetToDefaults}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Reset to Defaults
        </button>
      </div>

      {/* Emergency Controls */}
      {(metrics?.circuitState === 'OPEN' || (metrics?.errorRate && metrics.errorRate >= config.emergencyStopErrorRate)) && (
        <Card className="p-4 bg-red-50 border-red-200">
          <h3 className="text-lg font-semibold text-red-900 mb-4">Emergency Controls</h3>
          <div className="flex flex-wrap gap-4">
            {metrics?.circuitState === 'OPEN' && (
              <button
                onClick={resetCircuitBreaker}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Reset Circuit Breaker
              </button>
            )}
            
            {metrics?.errorRate && metrics.errorRate >= config.emergencyStopErrorRate && (
              <button
                onClick={resetEmergencyStop}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Reset Emergency Stop
              </button>
            )}
            
            <button
              onClick={clearQueue}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
            >
              Clear Request Queue
            </button>
          </div>
        </Card>
      )}

      {/* Main Configuration Panel */}
      {showConfigPanel && (
        <IBKRAPIConfigPanel
          config={config}
          metrics={metrics || undefined}
          onConfigChange={updateConfig}
          connectionStatus={connectionState.status}
          onTestConnection={handleTestConnection}
          onResetEmergencyStop={resetEmergencyStop}
          onResetCircuitBreaker={resetCircuitBreaker}
        />
      )}

      {/* Integration Example */}
      <Card className="p-6 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Integration with Rule Editor</h3>
        <div className="space-y-4 text-sm text-gray-600">
          <p>
            <strong>Step 1:</strong> Add the IBKR API Configuration Panel to your Rule Editor as a collapsible section.
          </p>
          <p>
            <strong>Step 2:</strong> Use the Connection Status Indicator in your main dashboard to show real-time API health.
          </p>
          <p>
            <strong>Step 3:</strong> Configure rule-specific API settings through the configuration panel.
          </p>
          <p>
            <strong>Step 4:</strong> Monitor performance and adjust rate limits based on your trading requirements.
          </p>
        </div>
        
        <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Current Configuration Summary:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-gray-500">Max Req/Sec:</span>
              <span className="ml-2 font-mono">{config.maxRequestsPerSecond}</span>
            </div>
            <div>
              <span className="text-gray-500">Max Retries:</span>
              <span className="ml-2 font-mono">{config.maxRetries}</span>
            </div>
            <div>
              <span className="text-gray-500">Circuit Threshold:</span>
              <span className="ml-2 font-mono">{config.circuitBreakerThreshold}</span>
            </div>
            <div>
              <span className="text-gray-500">Emergency Rate:</span>
              <span className="ml-2 font-mono">{config.emergencyStopErrorRate}%</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Live Metrics Display */}
      {metrics && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Live Metrics {isLive && <span className="text-green-600 text-sm">(Live)</span>}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{metrics.requestsPerSecond.toFixed(1)}</div>
              <div className="text-xs text-gray-500">Req/Sec</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{metrics.totalRequests}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{metrics.errorRate.toFixed(1)}%</div>
              <div className="text-xs text-gray-500">Error Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{metrics.averageResponseTime.toFixed(0)}ms</div>
              <div className="text-xs text-gray-500">Avg Response</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{metrics.queueLength}</div>
              <div className="text-xs text-gray-500">Queue</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${
                metrics.circuitState === 'CLOSED' ? 'text-green-600' :
                metrics.circuitState === 'HALF_OPEN' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {metrics.circuitState}
              </div>
              <div className="text-xs text-gray-500">Circuit</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}; 