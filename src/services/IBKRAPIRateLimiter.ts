import { EventEmitter } from 'events';

// Types for the rate limiter
export interface IBKRAPIConfig {
  // Rate limits
  maxRequestsPerSecond: number; // 50 for authenticated users, 10 for CP Gateway
  maxRequestsPerMinute: number; // Additional minute-based limit
  maxRequestsPerHour: number; // Additional hour-based limit
  
  // Retry configuration
  maxRetries: number;
  baseRetryDelay: number; // in milliseconds
  maxRetryDelay: number; // in milliseconds
  retryExponent: number; // for exponential backoff
  
  // Circuit breaker
  circuitBreakerThreshold: number; // max consecutive failures before opening circuit
  circuitBreakerTimeout: number; // time to wait before attempting to close circuit
  circuitBreakerResetTime: number; // time after success to reset failure count
  
  // Fail-safe options
  emergencyStopErrorRate: number; // percentage (0-100) to trigger emergency stop
  emergencyStopTimeWindow: number; // time window in ms to calculate error rate
  
  // Request priorities
  enablePriorityQueue: boolean;
  
  // Monitoring
  logAllRequests: boolean;
  enableMetrics: boolean;
}

export interface APIRequest {
  id: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: number;
  retryCount: number;
  metadata?: Record<string, any>;
}

export interface APIResponse {
  requestId: string;
  success: boolean;
  status: number;
  data?: any;
  error?: string;
  timestamp: number;
  responseTime: number;
  fromCache: boolean;
}

export interface RequestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  errorRate: number;
  requestsPerSecond: number;
  queueLength: number;
  circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

export interface RateLimitWindow {
  count: number;
  windowStart: number;
  windowDuration: number;
}

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Circuit is open, requests fail fast
  HALF_OPEN = 'HALF_OPEN' // Testing if service is back online
}

/**
 * Comprehensive IBKR API Rate Limiter and Request Queue Manager
 * 
 * Features:
 * - Enforces IBKR API rate limits (50 req/sec for authenticated users)
 * - Intelligent request queuing with priority levels
 * - Circuit breaker pattern to prevent cascading failures
 * - Exponential backoff retry logic
 * - Request/response monitoring and metrics
 * - Emergency stop conditions
 * - Detailed logging and audit trail
 */
export class IBKRAPIRateLimiter extends EventEmitter {
  private config: IBKRAPIConfig;
  private requestQueue: APIRequest[] = [];
  private pendingRequests = new Map<string, { request: APIRequest; resolve: Function; reject: Function }>();
  
  // Rate limiting windows
  private secondWindow: RateLimitWindow;
  private minuteWindow: RateLimitWindow;
  private hourWindow: RateLimitWindow;
  
  // Circuit breaker state
  private circuitState: CircuitState = CircuitState.CLOSED;
  private consecutiveFailures = 0;
  private lastFailureTime = 0;
  private lastSuccessTime = 0;
  
  // Metrics and monitoring
  private requestHistory: Array<{ timestamp: number; success: boolean; responseTime: number }> = [];
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  
  // Emergency stop
  private emergencyStop = false;
  private lastEmergencyCheck = 0;
  
  // Request cache (simple implementation)
  private responseCache = new Map<string, { response: APIResponse; expiry: number }>();
  
  constructor(config: Partial<IBKRAPIConfig> = {}) {
    super();
    
    // Default configuration optimized for IBKR API
    this.config = {
      maxRequestsPerSecond: 45, // Slightly under IBKR's 50 req/sec limit for safety
      maxRequestsPerMinute: 2700, // 45 * 60
      maxRequestsPerHour: 162000, // 45 * 60 * 60
      
      maxRetries: 3,
      baseRetryDelay: 1000, // 1 second
      maxRetryDelay: 30000, // 30 seconds
      retryExponent: 2,
      
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 30000, // 30 seconds
      circuitBreakerResetTime: 300000, // 5 minutes
      
      emergencyStopErrorRate: 80, // 80% error rate
      emergencyStopTimeWindow: 60000, // 1 minute
      
      enablePriorityQueue: true,
      logAllRequests: true,
      enableMetrics: true,
      
      ...config
    };
    
    // Initialize rate limit windows
    const now = Date.now();
    this.secondWindow = { count: 0, windowStart: now, windowDuration: 1000 };
    this.minuteWindow = { count: 0, windowStart: now, windowDuration: 60000 };
    this.hourWindow = { count: 0, windowStart: now, windowDuration: 3600000 };
    
    // Start processing queue
    this.startProcessing();
    
    // Emit initial state
    this.emit('stateChange', {
      circuitState: this.circuitState,
      queueLength: this.requestQueue.length,
      emergencyStop: this.emergencyStop
    });
  }
  
  /**
   * Queue an API request for processing
   */
  public async queueRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
    options: {
      headers?: Record<string, string>;
      body?: any;
      priority?: 'HIGH' | 'MEDIUM' | 'LOW';
      metadata?: Record<string, any>;
      cacheKey?: string;
      cacheDuration?: number;
    } = {}
  ): Promise<APIResponse> {
    return new Promise((resolve, reject) => {
      // Check emergency stop
      if (this.emergencyStop) {
        reject(new Error('API requests are currently stopped due to emergency conditions'));
        return;
      }
      
      // Check circuit breaker
      if (this.circuitState === CircuitState.OPEN) {
        reject(new Error('Circuit breaker is open - API requests are temporarily disabled'));
        return;
      }
      
      // Check cache first
      if (options.cacheKey) {
        const cached = this.getCachedResponse(options.cacheKey);
        if (cached) {
          resolve(cached);
          return;
        }
      }
      
      const request: APIRequest = {
        id: this.generateRequestId(),
        endpoint,
        method,
        headers: options.headers || {},
        body: options.body,
        priority: options.priority || 'MEDIUM',
        timestamp: Date.now(),
        retryCount: 0,
        metadata: {
          ...options.metadata,
          cacheKey: options.cacheKey,
          cacheDuration: options.cacheDuration || 300000 // 5 minutes default
        }
      };
      
      // Store request promise handlers
      this.pendingRequests.set(request.id, { request, resolve, reject });
      
      // Add to queue with priority sorting
      if (this.config.enablePriorityQueue) {
        this.insertByPriority(request);
      } else {
        this.requestQueue.push(request);
      }
      
      this.emit('requestQueued', {
        requestId: request.id,
        endpoint: request.endpoint,
        queueLength: this.requestQueue.length,
        priority: request.priority
      });
      
      this.logRequest('QUEUED', request);
    });
  }
  
  /**
   * Start the request processing loop
   */
  private startProcessing(): void {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 100); // Check every 100ms
  }
  
  /**
   * Stop the request processing loop
   */
  public stopProcessing(): void {
    this.isProcessing = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }
  
  /**
   * Process queued requests respecting rate limits
   */
  private async processQueue(): Promise<void> {
    if (this.requestQueue.length === 0) return;
    if (this.emergencyStop) return;
    if (this.circuitState === CircuitState.OPEN) {
      this.checkCircuitBreakerRecovery();
      return;
    }
    
    // Check rate limits
    if (!this.canMakeRequest()) {
      return;
    }
    
    // Get next request
    const request = this.requestQueue.shift();
    if (!request) return;
    
    // Update rate limit windows
    this.updateRateLimitWindows();
    
    try {
      // Process the request
      const response = await this.executeRequest(request);
      
      // Handle success
      this.handleRequestSuccess(request, response);
      
    } catch (error) {
      // Handle failure
      await this.handleRequestFailure(request, error as Error);
    }
  }
  
  /**
   * Execute the actual API request
   */
  private async executeRequest(request: APIRequest): Promise<APIResponse> {
    const startTime = Date.now();
    
    this.logRequest('EXECUTING', request);
    
    try {
      // Simulate API call for now - replace with actual IBKR API call
      const response = await this.mockAPICall(request);
      
      const responseTime = Date.now() - startTime;
      
      const apiResponse: APIResponse = {
        requestId: request.id,
        success: true,
        status: response.status,
        data: response.data,
        timestamp: Date.now(),
        responseTime,
        fromCache: false
      };
      
      // Cache response if requested
      if (request.metadata?.cacheKey) {
        this.cacheResponse(request.metadata.cacheKey, apiResponse, request.metadata.cacheDuration);
      }
      
      return apiResponse;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      throw {
        requestId: request.id,
        success: false,
        status: (error as any).status || 500,
        error: (error as Error).message,
        timestamp: Date.now(),
        responseTime,
        fromCache: false
      };
    }
  }
  
  /**
   * Mock API call - replace with actual IBKR API integration
   */
  private async mockAPICall(request: APIRequest): Promise<{ status: number; data: any }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));
    
    // Simulate occasional failures for testing
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error('Simulated API error');
    }
    
    return {
      status: 200,
      data: {
        endpoint: request.endpoint,
        method: request.method,
        timestamp: Date.now(),
        mockData: true
      }
    };
  }
  
  /**
   * Handle successful request
   */
  private handleRequestSuccess(request: APIRequest, response: APIResponse): void {
    const pendingRequest = this.pendingRequests.get(request.id);
    if (pendingRequest) {
      pendingRequest.resolve(response);
      this.pendingRequests.delete(request.id);
    }
    
    // Update circuit breaker
    this.consecutiveFailures = 0;
    this.lastSuccessTime = Date.now();
    
    if (this.circuitState === CircuitState.HALF_OPEN) {
      this.circuitState = CircuitState.CLOSED;
      this.emit('circuitClosed');
    }
    
    // Record metrics
    this.recordRequestMetric(true, response.responseTime);
    
    this.logRequest('SUCCESS', request, response);
    
    this.emit('requestCompleted', {
      requestId: request.id,
      success: true,
      responseTime: response.responseTime
    });
  }
  
  /**
   * Handle failed request with retry logic
   */
  private async handleRequestFailure(request: APIRequest, error: Error): Promise<void> {
    this.consecutiveFailures++;
    this.lastFailureTime = Date.now();
    
    // Check if we should retry
    if (request.retryCount < this.config.maxRetries && this.shouldRetry(error)) {
      request.retryCount++;
      
      // Calculate retry delay with exponential backoff
      const delay = Math.min(
        this.config.baseRetryDelay * Math.pow(this.config.retryExponent, request.retryCount - 1),
        this.config.maxRetryDelay
      );
      
      this.logRequest('RETRY', request, null, { retryCount: request.retryCount, delay });
      
      // Queue for retry after delay
      setTimeout(() => {
        if (this.config.enablePriorityQueue) {
          this.insertByPriority(request);
        } else {
          this.requestQueue.unshift(request); // Add to front for retry
        }
      }, delay);
      
      return;
    }
    
    // Final failure - reject the promise
    const pendingRequest = this.pendingRequests.get(request.id);
    if (pendingRequest) {
      pendingRequest.reject(error);
      this.pendingRequests.delete(request.id);
    }
    
    // Update circuit breaker
    if (this.consecutiveFailures >= this.config.circuitBreakerThreshold) {
      this.circuitState = CircuitState.OPEN;
      this.emit('circuitOpened', { consecutiveFailures: this.consecutiveFailures });
    }
    
    // Record metrics
    this.recordRequestMetric(false, 0);
    
    // Check emergency stop conditions
    this.checkEmergencyStop();
    
    this.logRequest('FAILED', request, null, { error: error.message });
    
    this.emit('requestFailed', {
      requestId: request.id,
      error: error.message,
      retryCount: request.retryCount
    });
  }
  
  /**
   * Check if request can be made within rate limits
   */
  private canMakeRequest(): boolean {
    const now = Date.now();
    
    // Check second window
    if (now - this.secondWindow.windowStart >= this.secondWindow.windowDuration) {
      this.secondWindow = { count: 0, windowStart: now, windowDuration: 1000 };
    }
    if (this.secondWindow.count >= this.config.maxRequestsPerSecond) {
      return false;
    }
    
    // Check minute window
    if (now - this.minuteWindow.windowStart >= this.minuteWindow.windowDuration) {
      this.minuteWindow = { count: 0, windowStart: now, windowDuration: 60000 };
    }
    if (this.minuteWindow.count >= this.config.maxRequestsPerMinute) {
      return false;
    }
    
    // Check hour window
    if (now - this.hourWindow.windowStart >= this.hourWindow.windowDuration) {
      this.hourWindow = { count: 0, windowStart: now, windowDuration: 3600000 };
    }
    if (this.hourWindow.count >= this.config.maxRequestsPerHour) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Update rate limit window counts
   */
  private updateRateLimitWindows(): void {
    this.secondWindow.count++;
    this.minuteWindow.count++;
    this.hourWindow.count++;
  }
  
  /**
   * Insert request into queue by priority
   */
  private insertByPriority(request: APIRequest): void {
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    const requestPriority = priorityOrder[request.priority];
    
    let insertIndex = this.requestQueue.length;
    for (let i = 0; i < this.requestQueue.length; i++) {
      const queuedPriority = priorityOrder[this.requestQueue[i].priority];
      if (requestPriority < queuedPriority) {
        insertIndex = i;
        break;
      }
    }
    
    this.requestQueue.splice(insertIndex, 0, request);
  }
  
  /**
   * Check if circuit breaker should recover
   */
  private checkCircuitBreakerRecovery(): void {
    if (this.circuitState === CircuitState.OPEN) {
      const now = Date.now();
      if (now - this.lastFailureTime >= this.config.circuitBreakerTimeout) {
        this.circuitState = CircuitState.HALF_OPEN;
        this.emit('circuitHalfOpen');
      }
    }
  }
  
  /**
   * Check emergency stop conditions
   */
  private checkEmergencyStop(): void {
    const now = Date.now();
    
    // Only check every 10 seconds to avoid excessive computation
    if (now - this.lastEmergencyCheck < 10000) return;
    this.lastEmergencyCheck = now;
    
    // Calculate error rate in the configured time window
    const windowStart = now - this.config.emergencyStopTimeWindow;
    const recentRequests = this.requestHistory.filter(r => r.timestamp >= windowStart);
    
    if (recentRequests.length === 0) return;
    
    const failedRequests = recentRequests.filter(r => !r.success).length;
    const errorRate = (failedRequests / recentRequests.length) * 100;
    
    if (errorRate >= this.config.emergencyStopErrorRate) {
      this.emergencyStop = true;
      this.emit('emergencyStop', {
        errorRate,
        recentRequests: recentRequests.length,
        failedRequests,
        timeWindow: this.config.emergencyStopTimeWindow
      });
    }
  }
  
  /**
   * Determine if a request should be retried based on the error
   */
  private shouldRetry(error: Error): boolean {
    // Don't retry on certain HTTP status codes
    const noRetryStatuses = [400, 401, 403, 404, 422];
    const status = (error as any).status;
    
    if (status && noRetryStatuses.includes(status)) {
      return false;
    }
    
    // Retry on network errors, timeouts, and 5xx errors
    return true;
  }
  
  /**
   * Record request metrics
   */
  private recordRequestMetric(success: boolean, responseTime: number): void {
    if (!this.config.enableMetrics) return;
    
    const metric = {
      timestamp: Date.now(),
      success,
      responseTime
    };
    
    this.requestHistory.push(metric);
    
    // Keep only last hour of metrics
    const oneHourAgo = Date.now() - 3600000;
    this.requestHistory = this.requestHistory.filter(m => m.timestamp >= oneHourAgo);
  }
  
  /**
   * Cache API response
   */
  private cacheResponse(key: string, response: APIResponse, duration: number): void {
    const expiry = Date.now() + duration;
    this.responseCache.set(key, { response: { ...response, fromCache: true }, expiry });
  }
  
  /**
   * Get cached response if still valid
   */
  private getCachedResponse(key: string): APIResponse | null {
    const cached = this.responseCache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expiry) {
      this.responseCache.delete(key);
      return null;
    }
    
    return cached.response;
  }
  
  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Log request activity
   */
  private logRequest(
    action: string,
    request: APIRequest,
    response?: APIResponse | null,
    metadata?: Record<string, any>
  ): void {
    if (!this.config.logAllRequests) return;
    
    const logData = {
      timestamp: new Date().toISOString(),
      action,
      requestId: request.id,
      endpoint: request.endpoint,
      method: request.method,
      priority: request.priority,
      retryCount: request.retryCount,
      response: response ? {
        status: response.status,
        success: response.success,
        responseTime: response.responseTime,
        fromCache: response.fromCache
      } : null,
      metadata
    };
    
    console.log(`[IBKR-API-RateLimiter] ${JSON.stringify(logData)}`);
  }
  
  /**
   * Get current metrics and status
   */
  public getMetrics(): RequestMetrics {
    const now = Date.now();
    const lastMinute = this.requestHistory.filter(r => r.timestamp >= now - 60000);
    const totalRequests = lastMinute.length;
    const successfulRequests = lastMinute.filter(r => r.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const averageResponseTime = totalRequests > 0 
      ? lastMinute.reduce((sum, r) => sum + r.responseTime, 0) / totalRequests 
      : 0;
    const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;
    const requestsPerSecond = totalRequests / 60; // requests in last minute / 60
    
    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      errorRate,
      requestsPerSecond,
      queueLength: this.requestQueue.length,
      circuitState: this.circuitState
    };
  }
  
  /**
   * Get current configuration
   */
  public getConfig(): IBKRAPIConfig {
    return { ...this.config };
  }
  
  /**
   * Update configuration
   */
  public updateConfig(updates: Partial<IBKRAPIConfig>): void {
    this.config = { ...this.config, ...updates };
    this.emit('configUpdated', this.config);
  }
  
  /**
   * Clear the request queue
   */
  public clearQueue(): void {
    const queuedRequests = this.requestQueue.splice(0);
    
    // Reject all pending requests
    queuedRequests.forEach(request => {
      const pendingRequest = this.pendingRequests.get(request.id);
      if (pendingRequest) {
        pendingRequest.reject(new Error('Request queue was cleared'));
        this.pendingRequests.delete(request.id);
      }
    });
    
    this.emit('queueCleared', { clearedRequests: queuedRequests.length });
  }
  
  /**
   * Reset emergency stop
   */
  public resetEmergencyStop(): void {
    this.emergencyStop = false;
    this.emit('emergencyStopReset');
  }
  
  /**
   * Reset circuit breaker
   */
  public resetCircuitBreaker(): void {
    this.circuitState = CircuitState.CLOSED;
    this.consecutiveFailures = 0;
    this.emit('circuitReset');
  }
  
  /**
   * Get debug information
   */
  public getDebugInfo(): any {
    return {
      config: this.config,
      queueLength: this.requestQueue.length,
      pendingRequests: this.pendingRequests.size,
      circuitState: this.circuitState,
      consecutiveFailures: this.consecutiveFailures,
      emergencyStop: this.emergencyStop,
      rateLimits: {
        second: this.secondWindow,
        minute: this.minuteWindow,
        hour: this.hourWindow
      },
      metrics: this.getMetrics(),
      cacheSize: this.responseCache.size,
      isProcessing: this.isProcessing
    };
  }
  
  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stopProcessing();
    this.clearQueue();
    this.responseCache.clear();
    this.requestHistory.length = 0;
    this.removeAllListeners();
  }
}

// Export default instance with sensible defaults
export const ibkrAPIRateLimiter = new IBKRAPIRateLimiter(); 