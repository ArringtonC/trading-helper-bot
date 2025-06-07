import React, { useState, useEffect } from 'react';
import { Badge } from './Badge';
import { Card } from './Card';
import { Alert } from './alert';
import { RequestMetrics } from '../../services/IBKRAPIRateLimiter';

export interface IBKRConnectionStatusIndicatorProps {
  connectionStatus: 'connected' | 'degraded' | 'disconnected' | 'connecting';
  metrics?: RequestMetrics;
  className?: string;
  showDetails?: boolean;
  onToggleDetails?: () => void;
  refreshInterval?: number; // in milliseconds
}

export const IBKRConnectionStatusIndicator: React.FC<IBKRConnectionStatusIndicatorProps> = ({
  connectionStatus,
  metrics,
  className = '',
  showDetails = false,
  onToggleDetails,
  refreshInterval = 1000
}) => {
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [pulseAnimation, setPulseAnimation] = useState(false);

  // Update last refresh time
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(Date.now());
      setPulseAnimation(true);
      setTimeout(() => setPulseAnimation(false), 200);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Get status icon and colors
  const getStatusInfo = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: '🟢',
          label: 'Connected',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          dotColor: 'bg-green-400'
        };
      case 'degraded':
        return {
          icon: '🟡',
          label: 'Degraded',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          dotColor: 'bg-yellow-400'
        };
      case 'disconnected':
        return {
          icon: '🔴',
          label: 'Disconnected',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          dotColor: 'bg-red-400'
        };
      case 'connecting':
        return {
          icon: '🔵',
          label: 'Connecting...',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          dotColor: 'bg-blue-400'
        };
      default:
        return {
          icon: '❓',
          label: 'Unknown',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          dotColor: 'bg-gray-400'
        };
    }
  };

  const statusInfo = getStatusInfo();

  // Get performance status
  const getPerformanceStatus = () => {
    if (!metrics) return null;

    const errorRate = metrics.errorRate;
    const responseTime = metrics.averageResponseTime;
    const queueLength = metrics.queueLength;

    if (errorRate > 20 || responseTime > 5000 || queueLength > 100) {
      return { level: 'critical', message: 'Performance Issues Detected' };
    } else if (errorRate > 10 || responseTime > 2000 || queueLength > 50) {
      return { level: 'warning', message: 'Performance Degraded' };
    } else if (errorRate < 5 && responseTime < 1000 && queueLength < 10) {
      return { level: 'excellent', message: 'Excellent Performance' };
    }
    
    return { level: 'good', message: 'Good Performance' };
  };

  const performanceStatus = getPerformanceStatus();

  // Format time ago
  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Get circuit breaker status
  const getCircuitBreakerStatus = () => {
    if (!metrics) return null;
    
    switch (metrics.circuitState) {
      case 'OPEN':
        return { level: 'critical', message: 'Circuit Breaker Open', color: 'text-red-600' };
      case 'HALF_OPEN':
        return { level: 'warning', message: 'Circuit Breaker Testing', color: 'text-yellow-600' };
      case 'CLOSED':
        return { level: 'good', message: 'Circuit Breaker Closed', color: 'text-green-600' };
      default:
        return null;
    }
  };

  const circuitStatus = getCircuitBreakerStatus();

  return (
    <Card className={`${statusInfo.bgColor} ${statusInfo.borderColor} border ${className}`}>
      {/* Main Status Display */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          {/* Status Indicator with Pulse */}
          <div className="relative">
            <div 
              className={`w-3 h-3 rounded-full ${statusInfo.dotColor} ${
                connectionStatus === 'connecting' ? 'animate-pulse' : ''
              } ${pulseAnimation ? 'animate-ping' : ''}`}
            />
            {connectionStatus === 'connected' && (
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-400 animate-ping opacity-75" />
            )}
          </div>
          
          {/* Status Text */}
          <div>
            <div className="flex items-center space-x-2">
              <span className={`font-medium ${statusInfo.textColor}`}>
                IBKR API {statusInfo.label}
              </span>
              {performanceStatus && (
                <Badge 
                  className={`text-xs ${
                    performanceStatus.level === 'critical' ? 'bg-red-100 text-red-700' :
                    performanceStatus.level === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                    performanceStatus.level === 'excellent' ? 'bg-green-100 text-green-700' :
                    'bg-blue-100 text-blue-700'
                  }`}
                >
                  {performanceStatus.message}
                </Badge>
              )}
            </div>
            
            {/* Last Update */}
            <div className="text-xs text-gray-500 mt-1">
              Last update: {formatTimeAgo(lastUpdate)}
            </div>
          </div>
        </div>

        {/* Toggle Details Button */}
        {onToggleDetails && (
          <button
            onClick={onToggleDetails}
            className={`text-sm ${statusInfo.textColor} hover:opacity-75 transition-opacity`}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        )}
      </div>

      {/* Detailed Metrics (when expanded) */}
      {showDetails && metrics && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {/* Critical Alerts */}
          {circuitStatus && circuitStatus.level === 'critical' && (
            <Alert className="border-red-200 bg-red-50">
              <strong className="text-red-800">{circuitStatus.message}</strong>
              <p className="text-sm text-red-700 mt-1">
                API requests are currently blocked due to consecutive failures.
              </p>
            </Alert>
          )}

          {metrics.errorRate >= 20 && (
            <Alert className="border-red-200 bg-red-50">
              <strong className="text-red-800">High Error Rate Detected</strong>
              <p className="text-sm text-red-700 mt-1">
                Current error rate: {metrics.errorRate.toFixed(1)}%. Consider investigating connection issues.
              </p>
            </Alert>
          )}

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {metrics.requestsPerSecond.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">Req/Sec</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {metrics.averageResponseTime.toFixed(0)}ms
              </div>
              <div className="text-xs text-gray-500">Avg Response</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {metrics.errorRate.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">Error Rate</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {metrics.queueLength}
              </div>
              <div className="text-xs text-gray-500">Queue Length</div>
            </div>
          </div>

          {/* Detailed Statistics */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Request Statistics</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Requests:</span>
                <span className="font-mono">{metrics.totalRequests.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Successful:</span>
                <span className="font-mono text-green-600">{metrics.successfulRequests.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Failed:</span>
                <span className="font-mono text-red-600">{metrics.failedRequests.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Success Rate:</span>
                <span className="font-mono">
                  {((metrics.successfulRequests / Math.max(metrics.totalRequests, 1)) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Circuit Breaker Status */}
          {circuitStatus && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">Circuit Breaker</h4>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  circuitStatus.level === 'critical' ? 'bg-red-400' :
                  circuitStatus.level === 'warning' ? 'bg-yellow-400' :
                  'bg-green-400'
                }`} />
                <span className={`text-sm ${circuitStatus.color}`}>
                  {circuitStatus.message}
                </span>
              </div>
            </div>
          )}

          {/* Usage Bars */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">Usage Indicators</h4>
            
            {/* Request Rate Usage */}
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Request Rate</span>
                <span>{metrics.requestsPerSecond.toFixed(1)} req/sec</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    metrics.requestsPerSecond > 40 ? 'bg-red-500' :
                    metrics.requestsPerSecond > 30 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min((metrics.requestsPerSecond / 50) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Error Rate Usage */}
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Error Rate</span>
                <span>{metrics.errorRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    metrics.errorRate > 15 ? 'bg-red-500' :
                    metrics.errorRate > 5 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(metrics.errorRate * 5, 100)}%` }}
                />
              </div>
            </div>

            {/* Queue Length Usage */}
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Queue Backlog</span>
                <span>{metrics.queueLength} requests</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    metrics.queueLength > 50 ? 'bg-red-500' :
                    metrics.queueLength > 20 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(metrics.queueLength * 2, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}; 