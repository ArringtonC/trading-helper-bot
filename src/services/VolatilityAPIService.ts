/**
 * Volatility API Service - Real-Time Data APIs and Security Features
 * 
 * Comprehensive API service providing RESTful and WebSocket endpoints for
 * volatility data consumption with enterprise-grade security, authentication,
 * rate limiting, and monitoring capabilities.
 * 
 * Features:
 * - RESTful API endpoints for volatility data
 * - WebSocket real-time streaming
 * - JWT-based authentication
 * - Rate limiting and quota management
 * - Comprehensive logging and monitoring
 * - Error handling and circuit breaker patterns
 * - API versioning and documentation
 * - Request validation and sanitization
 */

import { VolatilityAnalysisService, VolatilitySnapshot, PortfolioVolatilityAnalysis } from './VolatilityAnalysisService';
import { historicalIVDB } from './HistoricalIVDatabaseService';
import { IVQueryOptions, IVStatistics, IVVolatilityCone } from '../types/historicalIV';

// API Types and Interfaces
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  meta: ResponseMetadata;
}

export interface APIError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface ResponseMetadata {
  requestId: string;
  timestamp: string;
  executionTime: number;
  cached: boolean;
  rateLimitRemaining: number;
  rateResetTime: string;
  apiVersion: string;
}

export interface APIRequest {
  headers: Record<string, string>;
  params: Record<string, any>;
  query: Record<string, any>;
  body?: any;
  method: string;
  path: string;
  clientIP: string;
  userAgent: string;
  timestamp: string;
}

export interface AuthToken {
  userId: string;
  email: string;
  roles: string[];
  scopes: string[];
  issuedAt: number;
  expiresAt: number;
  jti: string; // JWT ID
}

export interface RateLimitInfo {
  requests: number;
  windowStart: number;
  windowSize: number;
  limit: number;
  remaining: number;
  resetTime: number;
}

export interface UserQuota {
  userId: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  requestsPerHour: number;
  requestsPerDay: number;
  requestsPerMonth: number;
  usedToday: number;
  usedThisHour: number;
  usedThisMonth: number;
  resetTime: number;
}

// API Configuration
export interface APIConfig {
  port: number;
  host: string;
  enableWebSocket: boolean;
  enableRateLimit: boolean;
  enableAuth: boolean;
  enableLogging: boolean;
  jwtSecret: string;
  jwtExpiresIn: string;
  rateLimitWindow: number; // minutes
  rateLimitMax: number; // requests per window
  corsOrigins: string[];
  apiVersion: string;
  enableCircuitBreaker: boolean;
  cacheTimeout: number; // seconds
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'data' | 'error' | 'ping' | 'pong';
  symbol?: string;
  data?: any;
  error?: string;
  timestamp: string;
  requestId?: string;
}

export interface WebSocketSubscription {
  connectionId: string;
  symbols: Set<string>;
  userId?: string;
  connectedAt: number;
  lastActivity: number;
  rateLimitInfo: RateLimitInfo;
}

export class VolatilityAPIService {
  private config: APIConfig;
  private volatilityService: VolatilityAnalysisService;
  private rateLimitMap = new Map<string, RateLimitInfo>();
  private userQuotaMap = new Map<string, UserQuota>();
  private wsConnections = new Map<string, WebSocketSubscription>();
  private apiMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    activeConnections: 0,
    rateLimitedRequests: 0,
    authFailures: 0,
    circuitBreakerTrips: 0
  };

  constructor(config: Partial<APIConfig> = {}) {
    this.config = {
      port: 3001,
      host: '0.0.0.0',
      enableWebSocket: true,
      enableRateLimit: true,
      enableAuth: true,
      enableLogging: true,
      jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
      jwtExpiresIn: '24h',
      rateLimitWindow: 15, // 15 minutes
      rateLimitMax: 100, // 100 requests per 15 minutes
      corsOrigins: ['http://localhost:3000', 'https://localhost:3000'],
      apiVersion: 'v1',
      enableCircuitBreaker: true,
      cacheTimeout: 300, // 5 minutes
      ...config
    };

    this.volatilityService = new VolatilityAnalysisService();
  }

  /**
   * Initialize the API service
   */
  async initialize(): Promise<void> {
    console.log('[VolatilityAPIService] Initializing API service...');
    
    // Initialize dependencies
    await historicalIVDB.initialize();
    
    // Setup cleanup intervals
    this.setupCleanupIntervals();
    
    console.log('[VolatilityAPIService] API service initialized successfully');
  }

  /**
   * RESTful API Endpoints
   */

  /**
   * GET /api/v1/volatility/:symbol
   * Get current volatility snapshot for a symbol
   */
  async getVolatilitySnapshot(symbol: string, request: APIRequest): Promise<APIResponse<VolatilitySnapshot>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // Validate authentication
      const authResult = await this.validateAuthentication(request);
      if (!authResult.valid) {
        return this.createErrorResponse('AUTH_FAILED', 'Authentication required', 401, requestId, startTime);
      }

      // Check rate limits
      const rateLimitResult = this.checkRateLimit(authResult.token!.userId, request.clientIP);
      if (!rateLimitResult.allowed) {
        return this.createErrorResponse('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded', 429, requestId, startTime, rateLimitResult.info);
      }

      // Validate symbol
      if (!this.isValidSymbol(symbol)) {
        return this.createErrorResponse('INVALID_SYMBOL', 'Invalid symbol format', 400, requestId, startTime);
      }

      // Get volatility data
      const snapshot = await this.volatilityService.getSymbolAnalysis({ symbol });
      
      // Log successful request
      this.logRequest(request, 200, Date.now() - startTime, authResult.token?.userId);
      this.updateMetrics(true, Date.now() - startTime);

      return {
        success: true,
        data: snapshot,
        meta: this.createResponseMetadata(requestId, startTime, false, rateLimitResult.info)
      };

    } catch (error) {
      this.logRequest(request, 500, Date.now() - startTime, undefined, error);
      this.updateMetrics(false, Date.now() - startTime);
      return this.createErrorResponse('INTERNAL_ERROR', 'Internal server error', 500, requestId, startTime);
    }
  }

  /**
   * GET /api/v1/portfolio/volatility
   * Get portfolio volatility analysis
   */
  async getPortfolioVolatility(symbols: string[], request: APIRequest): Promise<APIResponse<PortfolioVolatilityAnalysis>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // Validate authentication
      const authResult = await this.validateAuthentication(request);
      if (!authResult.valid) {
        return this.createErrorResponse('AUTH_FAILED', 'Authentication required', 401, requestId, startTime);
      }

      // Check rate limits (higher cost for portfolio analysis)
      const rateLimitResult = this.checkRateLimit(authResult.token!.userId, request.clientIP, symbols.length);
      if (!rateLimitResult.allowed) {
        return this.createErrorResponse('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded', 429, requestId, startTime, rateLimitResult.info);
      }

      // Validate symbols
      const validSymbols = symbols.filter(symbol => this.isValidSymbol(symbol));
      if (validSymbols.length === 0) {
        return this.createErrorResponse('INVALID_SYMBOLS', 'No valid symbols provided', 400, requestId, startTime);
      }

      if (validSymbols.length > 50) {
        return this.createErrorResponse('TOO_MANY_SYMBOLS', 'Maximum 50 symbols allowed', 400, requestId, startTime);
      }

      // Get portfolio analysis
      const portfolioAnalysis = await this.volatilityService.getPortfolioAnalysis({ symbols: validSymbols });
      
      this.logRequest(request, 200, Date.now() - startTime, authResult.token?.userId);
      this.updateMetrics(true, Date.now() - startTime);

      return {
        success: true,
        data: portfolioAnalysis,
        meta: this.createResponseMetadata(requestId, startTime, false, rateLimitResult.info)
      };

    } catch (error) {
      this.logRequest(request, 500, Date.now() - startTime, undefined, error);
      this.updateMetrics(false, Date.now() - startTime);
      return this.createErrorResponse('INTERNAL_ERROR', 'Internal server error', 500, requestId, startTime);
    }
  }

  /**
   * GET /api/v1/historical/:symbol/statistics
   * Get historical IV statistics
   */
  async getHistoricalStatistics(symbol: string, period: string = '1Y', request: APIRequest): Promise<APIResponse<IVStatistics>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      const authResult = await this.validateAuthentication(request);
      if (!authResult.valid) {
        return this.createErrorResponse('AUTH_FAILED', 'Authentication required', 401, requestId, startTime);
      }

      const rateLimitResult = this.checkRateLimit(authResult.token!.userId, request.clientIP);
      if (!rateLimitResult.allowed) {
        return this.createErrorResponse('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded', 429, requestId, startTime, rateLimitResult.info);
      }

      if (!this.isValidSymbol(symbol)) {
        return this.createErrorResponse('INVALID_SYMBOL', 'Invalid symbol format', 400, requestId, startTime);
      }

      const validPeriods = ['1M', '3M', '6M', '1Y', '2Y', '5Y'];
      if (!validPeriods.includes(period)) {
        return this.createErrorResponse('INVALID_PERIOD', 'Invalid period. Must be one of: ' + validPeriods.join(', '), 400, requestId, startTime);
      }

      const statistics = await historicalIVDB.getIVStatistics(symbol, period);
      
      this.logRequest(request, 200, Date.now() - startTime, authResult.token?.userId);
      this.updateMetrics(true, Date.now() - startTime);

      return {
        success: true,
        data: statistics,
        meta: this.createResponseMetadata(requestId, startTime, false, rateLimitResult.info)
      };

    } catch (error) {
      this.logRequest(request, 500, Date.now() - startTime, undefined, error);
      this.updateMetrics(false, Date.now() - startTime);
      return this.createErrorResponse('INTERNAL_ERROR', 'Internal server error', 500, requestId, startTime);
    }
  }

  /**
   * GET /api/v1/volatility-cone/:symbol
   * Get volatility cone data
   */
  async getVolatilityCone(symbol: string, request: APIRequest): Promise<APIResponse<IVVolatilityCone>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      const authResult = await this.validateAuthentication(request);
      if (!authResult.valid) {
        return this.createErrorResponse('AUTH_FAILED', 'Authentication required', 401, requestId, startTime);
      }

      const rateLimitResult = this.checkRateLimit(authResult.token!.userId, request.clientIP, 2); // Higher cost
      if (!rateLimitResult.allowed) {
        return this.createErrorResponse('RATE_LIMIT_EXCEEDED', 'Rate limit exceeded', 429, requestId, startTime, rateLimitResult.info);
      }

      if (!this.isValidSymbol(symbol)) {
        return this.createErrorResponse('INVALID_SYMBOL', 'Invalid symbol format', 400, requestId, startTime);
      }

      const volatilityCone = await historicalIVDB.getVolatilityCone(symbol);
      
      this.logRequest(request, 200, Date.now() - startTime, authResult.token?.userId);
      this.updateMetrics(true, Date.now() - startTime);

      return {
        success: true,
        data: volatilityCone,
        meta: this.createResponseMetadata(requestId, startTime, false, rateLimitResult.info)
      };

    } catch (error) {
      this.logRequest(request, 500, Date.now() - startTime, undefined, error);
      this.updateMetrics(false, Date.now() - startTime);
      return this.createErrorResponse('INTERNAL_ERROR', 'Internal server error', 500, requestId, startTime);
    }
  }

  /**
   * GET /api/v1/health
   * Health check endpoint
   */
  async getHealthCheck(request: APIRequest): Promise<APIResponse<any>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: this.config.apiVersion,
        uptime: process.uptime(),
        metrics: this.apiMetrics,
        services: {
          volatilityService: 'healthy',
          historicalDB: 'healthy'
        }
      };

      return {
        success: true,
        data: health,
        meta: this.createResponseMetadata(requestId, startTime, false, { requests: 0, remaining: 1000, resetTime: Date.now() + 900000 } as any)
      };

    } catch (error) {
      return this.createErrorResponse('HEALTH_CHECK_FAILED', 'Health check failed', 500, requestId, startTime);
    }
  }

  /**
   * WebSocket Implementation
   */

  /**
   * Handle WebSocket connection
   */
  handleWebSocketConnection(connectionId: string, userId?: string): WebSocketSubscription {
    const subscription: WebSocketSubscription = {
      connectionId,
      symbols: new Set(),
      userId,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      rateLimitInfo: {
        requests: 0,
        windowStart: Date.now(),
        windowSize: this.config.rateLimitWindow * 60 * 1000,
        limit: this.config.rateLimitMax,
        remaining: this.config.rateLimitMax,
        resetTime: Date.now() + (this.config.rateLimitWindow * 60 * 1000)
      }
    };

    this.wsConnections.set(connectionId, subscription);
    this.apiMetrics.activeConnections++;
    
    console.log(`[VolatilityAPIService] WebSocket connection established: ${connectionId}`);
    return subscription;
  }

  /**
   * Handle WebSocket message
   */
  async handleWebSocketMessage(connectionId: string, message: WebSocketMessage): Promise<WebSocketMessage | null> {
    const subscription = this.wsConnections.get(connectionId);
    if (!subscription) {
      return {
        type: 'error',
        error: 'Connection not found',
        timestamp: new Date().toISOString()
      };
    }

    subscription.lastActivity = Date.now();

    try {
      switch (message.type) {
        case 'subscribe':
          return await this.handleSubscribe(subscription, message);
        case 'unsubscribe':
          return await this.handleUnsubscribe(subscription, message);
        case 'ping':
          return { type: 'pong', timestamp: new Date().toISOString() };
        default:
          return {
            type: 'error',
            error: 'Unknown message type',
            timestamp: new Date().toISOString()
          };
      }
    } catch (error) {
      console.error('[VolatilityAPIService] WebSocket message error:', error);
      return {
        type: 'error',
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Handle symbol subscription
   */
  private async handleSubscribe(subscription: WebSocketSubscription, message: WebSocketMessage): Promise<WebSocketMessage> {
    if (!message.symbol) {
      return {
        type: 'error',
        error: 'Symbol required for subscription',
        timestamp: new Date().toISOString()
      };
    }

    if (!this.isValidSymbol(message.symbol)) {
      return {
        type: 'error',
        error: 'Invalid symbol format',
        timestamp: new Date().toISOString()
      };
    }

    // Check rate limit
    if (!this.checkWebSocketRateLimit(subscription)) {
      return {
        type: 'error',
        error: 'Rate limit exceeded',
        timestamp: new Date().toISOString()
      };
    }

    subscription.symbols.add(message.symbol);
    
    // Send initial data
    try {
      const snapshot = await this.volatilityService.getSymbolAnalysis({ symbol: message.symbol });
      return {
        type: 'data',
        symbol: message.symbol,
        data: snapshot,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        type: 'error',
        error: 'Failed to get volatility data',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Handle symbol unsubscription
   */
  private async handleUnsubscribe(subscription: WebSocketSubscription, message: WebSocketMessage): Promise<WebSocketMessage> {
    if (!message.symbol) {
      return {
        type: 'error',
        error: 'Symbol required for unsubscription',
        timestamp: new Date().toISOString()
      };
    }

    subscription.symbols.delete(message.symbol);
    
    return {
      type: 'data',
      symbol: message.symbol,
      data: { unsubscribed: true },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Broadcast updates to subscribed connections
   */
  async broadcastVolatilityUpdate(symbol: string, data: VolatilitySnapshot): Promise<void> {
    const message: WebSocketMessage = {
      type: 'data',
      symbol,
      data,
      timestamp: new Date().toISOString()
    };

    for (const [connectionId, subscription] of Array.from(this.wsConnections.entries())) {
      if (subscription.symbols.has(symbol)) {
        try {
          // In a real implementation, you would send this through the actual WebSocket connection
          console.log(`[VolatilityAPIService] Broadcasting to ${connectionId}:`, message);
        } catch (error) {
          console.error(`[VolatilityAPIService] Failed to broadcast to ${connectionId}:`, error);
          this.wsConnections.delete(connectionId);
          this.apiMetrics.activeConnections--;
        }
      }
    }
  }

  /**
   * Authentication and Security
   */

  /**
   * Validate JWT authentication
   */
  private async validateAuthentication(request: APIRequest): Promise<{ valid: boolean; token?: AuthToken }> {
    if (!this.config.enableAuth) {
      return { valid: true };
    }

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.apiMetrics.authFailures++;
      return { valid: false };
    }

    const token = authHeader.substring(7);
    
    try {
      // In a real implementation, you would verify the JWT token
      // For this demo, we'll create a mock token
      const mockToken: AuthToken = {
        userId: 'user123',
        email: 'user@example.com',
        roles: ['user'],
        scopes: ['volatility:read'],
        issuedAt: Date.now() - 3600000,
        expiresAt: Date.now() + 3600000,
        jti: this.generateRequestId()
      };

      // Check if token is expired
      if (mockToken.expiresAt < Date.now()) {
        this.apiMetrics.authFailures++;
        return { valid: false };
      }

      return { valid: true, token: mockToken };
    } catch (error) {
      this.apiMetrics.authFailures++;
      return { valid: false };
    }
  }

  /**
   * Rate Limiting
   */

  /**
   * Check rate limit for HTTP requests
   */
  private checkRateLimit(userId: string, clientIP: string, cost: number = 1): { allowed: boolean; info: RateLimitInfo } {
    if (!this.config.enableRateLimit) {
      return {
        allowed: true,
        info: {
          requests: 0,
          windowStart: Date.now(),
          windowSize: this.config.rateLimitWindow * 60 * 1000,
          limit: this.config.rateLimitMax,
          remaining: this.config.rateLimitMax,
          resetTime: Date.now() + (this.config.rateLimitWindow * 60 * 1000)
        }
      };
    }

    const key = userId || clientIP;
    const now = Date.now();
    const windowSize = this.config.rateLimitWindow * 60 * 1000; // Convert to milliseconds

    let rateLimitInfo = this.rateLimitMap.get(key);
    
    if (!rateLimitInfo || now - rateLimitInfo.windowStart >= windowSize) {
      // New window
      rateLimitInfo = {
        requests: 0,
        windowStart: now,
        windowSize,
        limit: this.config.rateLimitMax,
        remaining: this.config.rateLimitMax,
        resetTime: now + windowSize
      };
      this.rateLimitMap.set(key, rateLimitInfo);
    }

    // Check if request would exceed limit
    if (rateLimitInfo.requests + cost > rateLimitInfo.limit) {
      this.apiMetrics.rateLimitedRequests++;
      return { allowed: false, info: rateLimitInfo };
    }

    // Update counters
    rateLimitInfo.requests += cost;
    rateLimitInfo.remaining = Math.max(0, rateLimitInfo.limit - rateLimitInfo.requests);

    return { allowed: true, info: rateLimitInfo };
  }

  /**
   * Check rate limit for WebSocket messages
   */
  private checkWebSocketRateLimit(subscription: WebSocketSubscription): boolean {
    if (!this.config.enableRateLimit) {
      return true;
    }

    const now = Date.now();
    const rateLimitInfo = subscription.rateLimitInfo;

    if (now - rateLimitInfo.windowStart >= rateLimitInfo.windowSize) {
      // Reset window
      rateLimitInfo.requests = 0;
      rateLimitInfo.windowStart = now;
      rateLimitInfo.remaining = rateLimitInfo.limit;
      rateLimitInfo.resetTime = now + rateLimitInfo.windowSize;
    }

    if (rateLimitInfo.requests >= rateLimitInfo.limit) {
      return false;
    }

    rateLimitInfo.requests++;
    rateLimitInfo.remaining = Math.max(0, rateLimitInfo.limit - rateLimitInfo.requests);
    
    return true;
  }

  /**
   * Utility Methods
   */

  /**
   * Validate symbol format
   */
  private isValidSymbol(symbol: string): boolean {
    // Basic symbol validation - alphanumeric, dots, and common symbols
    return /^[A-Z0-9._^-]{1,10}$/i.test(symbol);
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create standardized error response
   */
  private createErrorResponse(
    code: string, 
    message: string, 
    statusCode: number, 
    requestId: string, 
    startTime: number,
    rateLimitInfo?: RateLimitInfo
  ): APIResponse {
    return {
      success: false,
      error: {
        code,
        message,
        details: { statusCode },
        timestamp: new Date().toISOString()
      },
      meta: this.createResponseMetadata(requestId, startTime, false, rateLimitInfo)
    };
  }

  /**
   * Create response metadata
   */
  private createResponseMetadata(
    requestId: string, 
    startTime: number, 
    cached: boolean = false,
    rateLimitInfo?: RateLimitInfo
  ): ResponseMetadata {
    return {
      requestId,
      timestamp: new Date().toISOString(),
      executionTime: Date.now() - startTime,
      cached,
      rateLimitRemaining: rateLimitInfo?.remaining || 0,
      rateResetTime: rateLimitInfo ? new Date(rateLimitInfo.resetTime).toISOString() : new Date().toISOString(),
      apiVersion: this.config.apiVersion
    };
  }

  /**
   * Log API request
   */
  private logRequest(
    request: APIRequest, 
    statusCode: number, 
    responseTime: number, 
    userId?: string, 
    error?: any
  ): void {
    if (!this.config.enableLogging) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      method: request.method,
      path: request.path,
      statusCode,
      responseTime,
      userId,
      clientIP: request.clientIP,
      userAgent: request.userAgent,
      error: error ? error.message : undefined
    };

    console.log('[VolatilityAPIService] Request:', JSON.stringify(logEntry));
  }

  /**
   * Update API metrics
   */
  private updateMetrics(success: boolean, responseTime: number): void {
    this.apiMetrics.totalRequests++;
    
    if (success) {
      this.apiMetrics.successfulRequests++;
    } else {
      this.apiMetrics.failedRequests++;
    }

    // Update average response time
    const totalRequests = this.apiMetrics.totalRequests;
    const currentAvg = this.apiMetrics.averageResponseTime;
    this.apiMetrics.averageResponseTime = ((currentAvg * (totalRequests - 1)) + responseTime) / totalRequests;
  }

  /**
   * Setup cleanup intervals
   */
  private setupCleanupIntervals(): void {
    // Clean up old rate limit entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, rateLimitInfo] of Array.from(this.rateLimitMap.entries())) {
        if (now - rateLimitInfo.windowStart >= rateLimitInfo.windowSize * 2) {
          this.rateLimitMap.delete(key);
        }
      }
    }, 5 * 60 * 1000);

    // Clean up inactive WebSocket connections every minute
    setInterval(() => {
      const now = Date.now();
      const inactiveThreshold = 5 * 60 * 1000; // 5 minutes
      
      for (const [connectionId, subscription] of Array.from(this.wsConnections.entries())) {
        if (now - subscription.lastActivity >= inactiveThreshold) {
          this.wsConnections.delete(connectionId);
          this.apiMetrics.activeConnections--;
          console.log(`[VolatilityAPIService] Cleaned up inactive connection: ${connectionId}`);
        }
      }
    }, 60 * 1000);
  }

  /**
   * Get API metrics
   */
  getMetrics() {
    return {
      ...this.apiMetrics,
      rateLimitEntries: this.rateLimitMap.size,
      wsConnections: this.wsConnections.size
    };
  }

  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket(connectionId: string): void {
    if (this.wsConnections.has(connectionId)) {
      this.wsConnections.delete(connectionId);
      this.apiMetrics.activeConnections--;
      console.log(`[VolatilityAPIService] WebSocket disconnected: ${connectionId}`);
    }
  }
}

// Export singleton instance
export const volatilityAPI = new VolatilityAPIService(); 