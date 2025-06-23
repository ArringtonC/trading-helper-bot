import { useState, useEffect, useCallback, useRef } from 'react';
import { IBKRAPIConfig, RequestMetrics, ibkrAPIRateLimiter } from '../services/IBKRAPIRateLimiter';
import { IBKRAPIClient } from '../services/IBKRAPIClient';

export interface IBKRAPIConnectionState {
  status: 'connected' | 'degraded' | 'disconnected' | 'connecting';
  lastConnected?: Date;
  lastError?: string;
  isTestingConnection: boolean;
}

export interface UseIBKRAPIConfigResult {
  // Configuration
  config: IBKRAPIConfig;
  updateConfig: (updates: Partial<IBKRAPIConfig>) => void;
  resetToDefaults: () => void;
  
  // Connection
  connectionState: IBKRAPIConnectionState;
  testConnection: () => Promise<boolean>;
  
  // Metrics
  metrics: RequestMetrics | null;
  refreshMetrics: () => void;
  
  // Control
  resetEmergencyStop: () => void;
  resetCircuitBreaker: () => void;
  clearQueue: () => void;
  
  // API Client
  apiClient: IBKRAPIClient | null;
  initializeClient: (authConfig: any) => void;
  
  // Real-time updates
  isLive: boolean;
  setLive: (live: boolean) => void;
}

/**
 * Custom hook for managing IBKR API configuration and monitoring
 * Provides real-time metrics, configuration management, and connection testing
 */
export const useIBKRAPIConfig = (
  initialConfig?: Partial<IBKRAPIConfig>,
  autoRefreshInterval: number = 1000
): UseIBKRAPIConfigResult => {
  // Configuration state
  const [config, setConfig] = useState<IBKRAPIConfig>(() => ({
    maxRequestsPerSecond: 45,
    maxRequestsPerMinute: 2700,
    maxRequestsPerHour: 162000,
    maxRetries: 3,
    baseRetryDelay: 1000,
    maxRetryDelay: 30000,
    retryExponent: 2,
    circuitBreakerThreshold: 5,
    circuitBreakerTimeout: 30000,
    circuitBreakerResetTime: 300000,
    emergencyStopErrorRate: 80,
    emergencyStopTimeWindow: 60000,
    enablePriorityQueue: true,
    logAllRequests: true,
    enableMetrics: true,
    ...initialConfig
  }));

  // Connection state
  const [connectionState, setConnectionState] = useState<IBKRAPIConnectionState>({
    status: 'disconnected',
    isTestingConnection: false
  });

  // Metrics state
  const [metrics, setMetrics] = useState<RequestMetrics | null>(null);
  const [isLive, setIsLive] = useState(true);

  // API Client
  const [apiClient, setApiClient] = useState<IBKRAPIClient | null>(null);

  // Refs for cleanup
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);
  const rateLimiterListeners = useRef<{ [event: string]: (...args: any[]) => void }>({});

  // Initialize rate limiter with current config
  useEffect(() => {
    ibkrAPIRateLimiter.updateConfig(config);
  }, [config]);

  // Set up real-time metrics refresh
  useEffect(() => {
    if (isLive && autoRefreshInterval > 0) {
      refreshInterval.current = setInterval(() => {
        setMetrics(ibkrAPIRateLimiter.getMetrics());
      }, autoRefreshInterval);
    } else if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
      refreshInterval.current = null;
    }

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [isLive, autoRefreshInterval]);

  // Set up rate limiter event listeners
  useEffect(() => {
    const handleStateChange = (state: any) => {
      setConnectionState(prev => ({
        ...prev,
        status: state.emergencyStop ? 'disconnected' : 
                state.circuitState === 'OPEN' ? 'degraded' : 'connected'
      }));
    };

    const handleRequestComplete = () => {
      // Update metrics on each request completion
      setMetrics(ibkrAPIRateLimiter.getMetrics());
    };

    const handleError = (error: any) => {
      setConnectionState(prev => ({
        ...prev,
        lastError: error.message || 'Unknown error',
        status: prev.status === 'connected' ? 'degraded' : prev.status
      }));
    };

    const handleCircuitOpen = () => {
      setConnectionState(prev => ({
        ...prev,
        status: 'degraded',
        lastError: 'Circuit breaker opened due to consecutive failures'
      }));
    };

    const handleEmergencyStop = () => {
      setConnectionState(prev => ({
        ...prev,
        status: 'disconnected',
        lastError: 'Emergency stop activated due to high error rate'
      }));
    };

    // Register listeners
    ibkrAPIRateLimiter.on('stateChange', handleStateChange);
    ibkrAPIRateLimiter.on('requestComplete', handleRequestComplete);
    ibkrAPIRateLimiter.on('error', handleError);
    ibkrAPIRateLimiter.on('circuitOpen', handleCircuitOpen);
    ibkrAPIRateLimiter.on('emergencyStop', handleEmergencyStop);

    // Store references for cleanup
    rateLimiterListeners.current = {
      stateChange: handleStateChange,
      requestComplete: handleRequestComplete,
      error: handleError,
      circuitOpen: handleCircuitOpen,
      emergencyStop: handleEmergencyStop
    };

    return () => {
      // Remove listeners
      Object.entries(rateLimiterListeners.current).forEach(([event, listener]) => {
        ibkrAPIRateLimiter.removeListener(event, listener);
      });
    };
  }, []);

  // Configuration management
  const updateConfig = useCallback((updates: Partial<IBKRAPIConfig>) => {
    setConfig(prev => {
      const newConfig = { ...prev, ...updates };
      // Apply config to rate limiter
      ibkrAPIRateLimiter.updateConfig(newConfig);
      return newConfig;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    const defaultConfig: IBKRAPIConfig = {
      maxRequestsPerSecond: 45,
      maxRequestsPerMinute: 2700,
      maxRequestsPerHour: 162000,
      maxRetries: 3,
      baseRetryDelay: 1000,
      maxRetryDelay: 30000,
      retryExponent: 2,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 30000,
      circuitBreakerResetTime: 300000,
      emergencyStopErrorRate: 80,
      emergencyStopTimeWindow: 60000,
      enablePriorityQueue: true,
      logAllRequests: true,
      enableMetrics: true
    };
    setConfig(defaultConfig);
    ibkrAPIRateLimiter.updateConfig(defaultConfig);
  }, []);

  // Connection testing
  const testConnection = useCallback(async (): Promise<boolean> => {
    if (!apiClient) {
      setConnectionState(prev => ({
        ...prev,
        status: 'disconnected',
        lastError: 'API client not initialized',
        isTestingConnection: false
      }));
      return false;
    }

    setConnectionState(prev => ({
      ...prev,
      isTestingConnection: true,
      status: 'connecting'
    }));

    try {
      // Test with a simple API call (check authentication status)
      // Use the rate limiter directly to check auth status since apiClient doesn't expose this method
      const response = await ibkrAPIRateLimiter.queueRequest(
        '/iserver/auth/status',
        'GET',
        {
          priority: 'HIGH',
          cacheKey: 'auth-status-test'
        }
      );
      
      if (response.success) {
        setConnectionState(prev => ({
          ...prev,
          status: 'connected',
          lastConnected: new Date(),
          lastError: undefined,
          isTestingConnection: false
        }));
        return true;
      } else {
        setConnectionState(prev => ({
          ...prev,
          status: 'disconnected',
          lastError: response.error || 'Authentication failed',
          isTestingConnection: false
        }));
        return false;
      }
    } catch (error) {
      setConnectionState(prev => ({
        ...prev,
        status: 'disconnected',
        lastError: error instanceof Error ? error.message : 'Connection test failed',
        isTestingConnection: false
      }));
      return false;
    }
  }, [apiClient]);

  // Control functions
  const resetEmergencyStop = useCallback(() => {
    ibkrAPIRateLimiter.resetEmergencyStop();
    setConnectionState(prev => ({
      ...prev,
      status: prev.status === 'disconnected' ? 'connected' : prev.status,
      lastError: undefined
    }));
  }, []);

  const resetCircuitBreaker = useCallback(() => {
    ibkrAPIRateLimiter.resetCircuitBreaker();
    setConnectionState(prev => ({
      ...prev,
      status: prev.status === 'degraded' ? 'connected' : prev.status,
      lastError: undefined
    }));
  }, []);

  const clearQueue = useCallback(() => {
    ibkrAPIRateLimiter.clearQueue();
  }, []);

  const refreshMetrics = useCallback(() => {
    setMetrics(ibkrAPIRateLimiter.getMetrics());
  }, []);

  // API Client initialization
  const initializeClient = useCallback((authConfig: any) => {
    try {
      const client = new IBKRAPIClient(authConfig, ibkrAPIRateLimiter);
      setApiClient(client);
      setConnectionState(prev => ({
        ...prev,
        status: 'disconnected', // Will be updated after connection test
        lastError: undefined
      }));
    } catch (error) {
      setConnectionState(prev => ({
        ...prev,
        status: 'disconnected',
        lastError: error instanceof Error ? error.message : 'Failed to initialize API client'
      }));
    }
  }, []);

  // Initial metrics load
  useEffect(() => {
    setMetrics(ibkrAPIRateLimiter.getMetrics());
  }, []);

  return {
    // Configuration
    config,
    updateConfig,
    resetToDefaults,
    
    // Connection
    connectionState,
    testConnection,
    
    // Metrics
    metrics,
    refreshMetrics,
    
    // Control
    resetEmergencyStop,
    resetCircuitBreaker,
    clearQueue,
    
    // API Client
    apiClient,
    initializeClient,
    
    // Real-time updates
    isLive,
    setLive: setIsLive
  };
}; 