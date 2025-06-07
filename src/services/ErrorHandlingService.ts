/**
 * Error Handling & Retry Logic Service
 * 
 * Provides comprehensive error handling, retry mechanisms, circuit breaker patterns,
 * and fallback strategies for broker API operations.
 * 
 * Features:
 * - Intelligent error classification and handling
 * - Exponential backoff retry logic with jitter
 * - Circuit breaker pattern for preventing cascading failures
 * - Fallback strategies for graceful degradation
 * - Rate limiting and throttling protection
 * - Comprehensive error reporting and analytics
 */

import { EventEmitter } from 'events';
import { MonitoringService } from './MonitoringService';

export enum ErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  RATE_LIMIT = 'rate_limit',
  TIMEOUT = 'timeout',
  SERVER_ERROR = 'server_error',
  CLIENT_ERROR = 'client_error',
  VALIDATION = 'validation',
  CONFIGURATION = 'configuration',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum RetryStrategy {
  EXPONENTIAL_BACKOFF = 'exponential_backoff',
  LINEAR_BACKOFF = 'linear_backoff',
  FIXED_DELAY = 'fixed_delay',
  IMMEDIATE = 'immediate',
  NO_RETRY = 'no_retry'
}

export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

export interface ErrorContext {
  operation: string;
  brokerId?: string;
  timestamp: Date;
  requestId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface ClassifiedError {
  originalError: Error;
  type: ErrorType;
  severity: ErrorSeverity;
  isRetryable: boolean;
  retryStrategy: RetryStrategy;
  context: ErrorContext;
  classification: {
    confidence: number;
    reasons: string[];
    suggestedActions: string[];
  };
}

export interface RetryConfiguration {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterEnabled: boolean;
  jitterMaxMs: number;
  timeoutMs: number;
  retryableErrors: ErrorType[];
  nonRetryableErrors: ErrorType[];
}

export interface CircuitBreakerConfiguration {
  failureThreshold: number;
  recoveryTimeoutMs: number;
  monitoringWindowMs: number;
  minimumThroughput: number;
  errorThresholdPercentage: number;
  halfOpenMaxCalls: number;
}

export interface FallbackConfiguration {
  enabled: boolean;
  strategies: FallbackStrategy[];
  timeoutMs: number;
  cacheEnabled: boolean;
  cacheTtlMs: number;
}

export interface FallbackStrategy {
  name: string;
  priority: number;
  condition: (error: ClassifiedError) => boolean;
  handler: (context: ErrorContext, error: ClassifiedError) => Promise<any>;
  timeoutMs: number;
}

export interface RetryAttempt {
  attemptNumber: number;
  timestamp: Date;
  delayMs: number;
  error?: Error;
  success: boolean;
  duration: number;
}

export interface RetryResult<T = any> {
  success: boolean;
  result?: T;
  finalError?: ClassifiedError;
  attempts: RetryAttempt[];
  totalDuration: number;
  fallbackUsed: boolean;
  fallbackStrategy?: string;
}

export interface CircuitBreakerMetrics {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  totalRequests: number;
  errorRate: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  stateChangedAt: Date;
  halfOpenAttempts: number;
}

export interface ErrorHandlingConfiguration {
  retry: RetryConfiguration;
  circuitBreaker: CircuitBreakerConfiguration;
  fallback: FallbackConfiguration;
  enableMetrics: boolean;
  enableLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export class ErrorClassifier {
  /**
   * Classify an error based on its characteristics
   */
  public static classify(error: Error, context: ErrorContext): ClassifiedError {
    const classification = this.analyzeError(error);
    
    return {
      originalError: error,
      type: classification.type,
      severity: classification.severity,
      isRetryable: classification.isRetryable,
      retryStrategy: classification.retryStrategy,
      context,
      classification: {
        confidence: classification.confidence,
        reasons: classification.reasons,
        suggestedActions: classification.suggestedActions
      }
    };
  }

  private static analyzeError(error: Error): {
    type: ErrorType;
    severity: ErrorSeverity;
    isRetryable: boolean;
    retryStrategy: RetryStrategy;
    confidence: number;
    reasons: string[];
    suggestedActions: string[];
  } {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();
    const reasons: string[] = [];
    const suggestedActions: string[] = [];

    // Network errors
    if (this.isNetworkError(error, message, name)) {
      reasons.push('Network connectivity issue detected');
      suggestedActions.push('Retry with exponential backoff', 'Check network connectivity');
      return {
        type: ErrorType.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        isRetryable: true,
        retryStrategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        confidence: 0.9,
        reasons,
        suggestedActions
      };
    }

    // Authentication errors
    if (this.isAuthenticationError(error, message, name)) {
      reasons.push('Authentication failure detected');
      suggestedActions.push('Refresh credentials', 'Re-authenticate', 'Check API keys');
      return {
        type: ErrorType.AUTHENTICATION,
        severity: ErrorSeverity.HIGH,
        isRetryable: false,
        retryStrategy: RetryStrategy.NO_RETRY,
        confidence: 0.95,
        reasons,
        suggestedActions
      };
    }

    // Rate limiting errors
    if (this.isRateLimitError(error, message, name)) {
      reasons.push('Rate limit exceeded');
      suggestedActions.push('Wait and retry', 'Implement rate limiting', 'Use exponential backoff');
      return {
        type: ErrorType.RATE_LIMIT,
        severity: ErrorSeverity.MEDIUM,
        isRetryable: true,
        retryStrategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        confidence: 0.9,
        reasons,
        suggestedActions
      };
    }

    // Timeout errors
    if (this.isTimeoutError(error, message, name)) {
      reasons.push('Request timeout detected');
      suggestedActions.push('Retry with longer timeout', 'Check server performance');
      return {
        type: ErrorType.TIMEOUT,
        severity: ErrorSeverity.MEDIUM,
        isRetryable: true,
        retryStrategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        confidence: 0.85,
        reasons,
        suggestedActions
      };
    }

    // Server errors (5xx)
    if (this.isServerError(error, message, name)) {
      reasons.push('Server error detected');
      suggestedActions.push('Retry after delay', 'Check server status', 'Contact support if persistent');
      return {
        type: ErrorType.SERVER_ERROR,
        severity: ErrorSeverity.HIGH,
        isRetryable: true,
        retryStrategy: RetryStrategy.EXPONENTIAL_BACKOFF,
        confidence: 0.8,
        reasons,
        suggestedActions
      };
    }

    // Client errors (4xx)
    if (this.isClientError(error, message, name)) {
      reasons.push('Client error detected');
      suggestedActions.push('Check request parameters', 'Validate input data', 'Review API documentation');
      return {
        type: ErrorType.CLIENT_ERROR,
        severity: ErrorSeverity.MEDIUM,
        isRetryable: false,
        retryStrategy: RetryStrategy.NO_RETRY,
        confidence: 0.8,
        reasons,
        suggestedActions
      };
    }

    // Validation errors
    if (this.isValidationError(error, message, name)) {
      reasons.push('Data validation error');
      suggestedActions.push('Fix input data', 'Check data format', 'Validate against schema');
      return {
        type: ErrorType.VALIDATION,
        severity: ErrorSeverity.LOW,
        isRetryable: false,
        retryStrategy: RetryStrategy.NO_RETRY,
        confidence: 0.9,
        reasons,
        suggestedActions
      };
    }

    // Default to unknown
    reasons.push('Error type could not be determined');
    suggestedActions.push('Review error details', 'Check logs', 'Contact support');
    return {
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      isRetryable: false,
      retryStrategy: RetryStrategy.NO_RETRY,
      confidence: 0.3,
      reasons,
      suggestedActions
    };
  }

  private static isNetworkError(error: Error, message: string, name: string): boolean {
    const networkIndicators = [
      'network', 'connection', 'econnrefused', 'enotfound', 'etimedout',
      'socket', 'dns', 'unreachable', 'offline', 'disconnected'
    ];
    return networkIndicators.some(indicator => 
      message.includes(indicator) || name.includes(indicator)
    );
  }

  private static isAuthenticationError(error: Error, message: string, name: string): boolean {
    const authIndicators = [
      'unauthorized', 'authentication', 'invalid token', 'expired token',
      'access denied', 'forbidden', 'invalid credentials', 'login required'
    ];
    return authIndicators.some(indicator => 
      message.includes(indicator) || name.includes(indicator)
    ) || (error as any).status === 401;
  }

  private static isRateLimitError(error: Error, message: string, name: string): boolean {
    const rateLimitIndicators = [
      'rate limit', 'too many requests', 'quota exceeded', 'throttled',
      'rate exceeded', 'limit exceeded'
    ];
    return rateLimitIndicators.some(indicator => 
      message.includes(indicator) || name.includes(indicator)
    ) || (error as any).status === 429;
  }

  private static isTimeoutError(error: Error, message: string, name: string): boolean {
    const timeoutIndicators = [
      'timeout', 'timed out', 'request timeout', 'gateway timeout'
    ];
    return timeoutIndicators.some(indicator => 
      message.includes(indicator) || name.includes(indicator)
    ) || (error as any).status === 408 || (error as any).status === 504;
  }

  private static isServerError(error: Error, message: string, name: string): boolean {
    const status = (error as any).status;
    return status >= 500 && status < 600;
  }

  private static isClientError(error: Error, message: string, name: string): boolean {
    const status = (error as any).status;
    return status >= 400 && status < 500 && status !== 401 && status !== 429;
  }

  private static isValidationError(error: Error, message: string, name: string): boolean {
    const validationIndicators = [
      'validation', 'invalid', 'malformed', 'bad request', 'schema',
      'required field', 'missing parameter'
    ];
    return validationIndicators.some(indicator => 
      message.includes(indicator) || name.includes(indicator)
    ) || (error as any).status === 400;
  }
}

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private totalRequests: number = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private stateChangedAt: Date = new Date();
  private halfOpenAttempts: number = 0;
  private windowStart: Date = new Date();

  constructor(
    private config: CircuitBreakerConfiguration,
    private monitoring: MonitoringService
  ) {}

  public async execute<T>(
    operation: () => Promise<T>,
    context: ErrorContext
  ): Promise<T> {
    this.totalRequests++;
    
    // Check if circuit is open
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitBreakerState.HALF_OPEN;
        this.stateChangedAt = new Date();
        this.halfOpenAttempts = 0;
        console.log(`CircuitBreaker: Transitioning to HALF_OPEN for ${context.operation}`);
      } else {
        throw new Error(`Circuit breaker is OPEN for ${context.operation}`);
      }
    }

    // Check half-open limits
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      if (this.halfOpenAttempts >= this.config.halfOpenMaxCalls) {
        throw new Error(`Circuit breaker HALF_OPEN limit exceeded for ${context.operation}`);
      }
      this.halfOpenAttempts++;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.successCount++;
    this.lastSuccessTime = new Date();

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      // Reset circuit breaker
      this.state = CircuitBreakerState.CLOSED;
      this.failureCount = 0;
      this.stateChangedAt = new Date();
      console.log('CircuitBreaker: Reset to CLOSED state after successful operation');
    }

    this.recordMetrics();
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      // Go back to open
      this.state = CircuitBreakerState.OPEN;
      this.stateChangedAt = new Date();
      console.log('CircuitBreaker: Returning to OPEN state after failure in HALF_OPEN');
    } else if (this.state === CircuitBreakerState.CLOSED) {
      // Check if we should open the circuit
      if (this.shouldOpenCircuit()) {
        this.state = CircuitBreakerState.OPEN;
        this.stateChangedAt = new Date();
        console.log('CircuitBreaker: Opening circuit due to failure threshold');
      }
    }

    this.recordMetrics();
  }

  private shouldOpenCircuit(): boolean {
    // Check if we have enough throughput
    if (this.totalRequests < this.config.minimumThroughput) {
      return false;
    }

    // Check failure threshold
    if (this.failureCount >= this.config.failureThreshold) {
      return true;
    }

    // Check error rate
    const errorRate = this.failureCount / this.totalRequests;
    return errorRate >= (this.config.errorThresholdPercentage / 100);
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    
    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
    return timeSinceLastFailure >= this.config.recoveryTimeoutMs;
  }

  private recordMetrics(): void {
    this.monitoring.recordMetric('circuit_breaker_state', 1, {
      state: this.state,
      failure_count: this.failureCount.toString(),
      success_count: this.successCount.toString()
    });

    const errorRate = this.totalRequests > 0 ? this.failureCount / this.totalRequests : 0;
    this.monitoring.recordMetric('circuit_breaker_error_rate', errorRate);
  }

  public getMetrics(): CircuitBreakerMetrics {
    const errorRate = this.totalRequests > 0 ? this.failureCount / this.totalRequests : 0;
    
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalRequests: this.totalRequests,
      errorRate,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      stateChangedAt: this.stateChangedAt,
      halfOpenAttempts: this.halfOpenAttempts
    };
  }

  public reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.totalRequests = 0;
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
    this.stateChangedAt = new Date();
    this.halfOpenAttempts = 0;
    console.log('CircuitBreaker: Manual reset performed');
  }
}

export class RetryManager {
  constructor(private config: RetryConfiguration) {}

  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    customConfig?: Partial<RetryConfiguration>
  ): Promise<RetryResult<T>> {
    const effectiveConfig = { ...this.config, ...customConfig };
    const attempts: RetryAttempt[] = [];
    const startTime = Date.now();
    let lastError: ClassifiedError | undefined;

    for (let attempt = 1; attempt <= effectiveConfig.maxAttempts; attempt++) {
      const attemptStart = Date.now();
      
      try {
        const result = await this.executeWithTimeout(operation, effectiveConfig.timeoutMs);
        const duration = Date.now() - attemptStart;
        
        attempts.push({
          attemptNumber: attempt,
          timestamp: new Date(),
          delayMs: 0,
          success: true,
          duration
        });

        return {
          success: true,
          result,
          attempts,
          totalDuration: Date.now() - startTime,
          fallbackUsed: false
        };
      } catch (error) {
        const duration = Date.now() - attemptStart;
        const classifiedError = ErrorClassifier.classify(error as Error, context);
        lastError = classifiedError;

        attempts.push({
          attemptNumber: attempt,
          timestamp: new Date(),
          delayMs: 0,
          error: error as Error,
          success: false,
          duration
        });

        // Check if error is retryable
        if (!this.shouldRetry(classifiedError, attempt, effectiveConfig)) {
          break;
        }

        // Calculate delay for next attempt
        if (attempt < effectiveConfig.maxAttempts) {
          const delay = this.calculateDelay(attempt, classifiedError.retryStrategy, effectiveConfig);
          attempts[attempts.length - 1].delayMs = delay;
          
          console.log(`RetryManager: Attempt ${attempt} failed, retrying in ${delay}ms. Error: ${(error as Error).message}`);
          await this.sleep(delay);
        }
      }
    }

    return {
      success: false,
      finalError: lastError,
      attempts,
      totalDuration: Date.now() - startTime,
      fallbackUsed: false
    };
  }

  private shouldRetry(
    error: ClassifiedError,
    attempt: number,
    config: RetryConfiguration
  ): boolean {
    // Check if we've exceeded max attempts
    if (attempt >= config.maxAttempts) {
      return false;
    }

    // Check if error type is retryable
    if (!error.isRetryable) {
      return false;
    }

    // Check if error type is in non-retryable list
    if (config.nonRetryableErrors.includes(error.type)) {
      return false;
    }

    // Check if error type is in retryable list (if specified)
    if (config.retryableErrors.length > 0 && !config.retryableErrors.includes(error.type)) {
      return false;
    }

    return true;
  }

  private calculateDelay(
    attempt: number,
    strategy: RetryStrategy,
    config: RetryConfiguration
  ): number {
    let delay: number;

    switch (strategy) {
      case RetryStrategy.EXPONENTIAL_BACKOFF:
        delay = Math.min(
          config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelayMs
        );
        break;
      
      case RetryStrategy.LINEAR_BACKOFF:
        delay = Math.min(
          config.baseDelayMs * attempt,
          config.maxDelayMs
        );
        break;
      
      case RetryStrategy.FIXED_DELAY:
        delay = config.baseDelayMs;
        break;
      
      case RetryStrategy.IMMEDIATE:
        delay = 0;
        break;
      
      default:
        delay = config.baseDelayMs;
    }

    // Add jitter if enabled
    if (config.jitterEnabled) {
      const jitter = Math.random() * config.jitterMaxMs;
      delay += jitter;
    }

    return Math.min(delay, config.maxDelayMs);
  }

  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      operation()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class ErrorHandlingService extends EventEmitter {
  private retryManager: RetryManager;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private fallbackStrategies: Map<string, FallbackStrategy[]> = new Map();
  private errorStats: Map<string, { count: number; lastOccurrence: Date }> = new Map();

  constructor(
    private monitoring: MonitoringService,
    private config: ErrorHandlingConfiguration
  ) {
    super();
    this.retryManager = new RetryManager(config.retry);
    this.setupDefaultFallbackStrategies();
  }

  /**
   * Execute an operation with comprehensive error handling
   */
  public async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    options?: {
      retryConfig?: Partial<RetryConfiguration>;
      circuitBreakerKey?: string;
      fallbackKey?: string;
      skipCircuitBreaker?: boolean;
      skipRetry?: boolean;
      skipFallback?: boolean;
    }
  ): Promise<T> {
    const span = this.monitoring.startSpan('error_handling_execute', {
      tags: { operation: context.operation, broker: context.brokerId }
    });

    try {
      // Wrap operation with circuit breaker if enabled
      const wrappedOperation = options?.skipCircuitBreaker ? 
        operation : 
        this.wrapWithCircuitBreaker(operation, context, options?.circuitBreakerKey);

      // Execute with retry logic if enabled
      const result = options?.skipRetry ?
        await wrappedOperation() :
        await this.executeWithRetry(wrappedOperation, context, options?.retryConfig);

      span?.setStatus({ code: 0, message: 'Operation completed successfully' });
      return result;

    } catch (error) {
      const classifiedError = ErrorClassifier.classify(error as Error, context);
      
      // Record error statistics
      this.recordErrorStats(classifiedError);
      
      // Emit error event
      this.emit('error:classified', classifiedError);

      // Try fallback if enabled and available
      if (!options?.skipFallback && this.config.fallback.enabled) {
        try {
          const fallbackResult = await this.executeFallback<T>(classifiedError, options?.fallbackKey);
          if (fallbackResult !== undefined) {
            span?.setStatus({ code: 0, message: 'Operation completed with fallback' });
            return fallbackResult;
          }
        } catch (fallbackError) {
          console.error('ErrorHandlingService: Fallback execution failed:', fallbackError);
        }
      }

      span?.setStatus({ 
        code: 1, 
        message: `Operation failed: ${classifiedError.type}` 
      });
      
      throw classifiedError;
    } finally {
      span?.finish();
    }
  }

  /**
   * Execute operation with retry logic
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    retryConfig?: Partial<RetryConfiguration>
  ): Promise<T> {
    const result = await this.retryManager.executeWithRetry(operation, context, retryConfig);
    
    if (result.success) {
      return result.result!;
    } else {
      throw result.finalError || new Error('Operation failed after all retry attempts');
    }
  }

  /**
   * Wrap operation with circuit breaker
   */
  private wrapWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    circuitBreakerKey?: string
  ): () => Promise<T> {
    const key = circuitBreakerKey || context.operation;
    let circuitBreaker = this.circuitBreakers.get(key);
    
    if (!circuitBreaker) {
      circuitBreaker = new CircuitBreaker(this.config.circuitBreaker, this.monitoring);
      this.circuitBreakers.set(key, circuitBreaker);
    }

    return () => circuitBreaker!.execute(operation, context);
  }

  /**
   * Execute fallback strategies
   */
  private async executeFallback<T>(
    error: ClassifiedError,
    fallbackKey?: string
  ): Promise<T | undefined> {
    const key = fallbackKey || error.context.operation;
    const strategies = this.fallbackStrategies.get(key) || this.fallbackStrategies.get('default') || [];
    
    // Sort strategies by priority
    const sortedStrategies = strategies
      .filter(strategy => strategy.condition(error))
      .sort((a, b) => a.priority - b.priority);

    for (const strategy of sortedStrategies) {
      try {
        console.log(`ErrorHandlingService: Attempting fallback strategy: ${strategy.name}`);
        const result = await this.executeWithTimeout(
          () => strategy.handler(error.context, error),
          strategy.timeoutMs
        );
        
        this.monitoring.recordMetric('fallback_strategy_success', 1, {
          strategy: strategy.name,
          operation: error.context.operation
        });
        
        this.emit('fallback:success', { strategy: strategy.name, error, result });
        return result;
      } catch (fallbackError) {
        console.error(`ErrorHandlingService: Fallback strategy ${strategy.name} failed:`, fallbackError);
        this.monitoring.recordMetric('fallback_strategy_failure', 1, {
          strategy: strategy.name,
          operation: error.context.operation
        });
      }
    }

    return undefined;
  }

  /**
   * Setup default fallback strategies
   */
  private setupDefaultFallbackStrategies(): void {
    const defaultStrategies: FallbackStrategy[] = [
      {
        name: 'cached_data',
        priority: 1,
        condition: (error) => error.type === ErrorType.NETWORK || error.type === ErrorType.TIMEOUT,
        handler: async (context, error) => {
          // Return cached data if available
          console.log('ErrorHandlingService: Attempting to return cached data');
          // Implementation would integrate with caching service
          return null;
        },
        timeoutMs: 1000
      },
      {
        name: 'default_values',
        priority: 2,
        condition: (error) => error.severity !== ErrorSeverity.CRITICAL,
        handler: async (context, error) => {
          // Return safe default values
          console.log('ErrorHandlingService: Returning default values');
          return this.getDefaultValues(context.operation);
        },
        timeoutMs: 500
      },
      {
        name: 'graceful_degradation',
        priority: 3,
        condition: (error) => true,
        handler: async (context, error) => {
          // Provide minimal functionality
          console.log('ErrorHandlingService: Graceful degradation mode');
          return this.getMinimalResponse(context.operation);
        },
        timeoutMs: 100
      }
    ];

    this.fallbackStrategies.set('default', defaultStrategies);
  }

  /**
   * Record error statistics
   */
  private recordErrorStats(error: ClassifiedError): void {
    const key = `${error.type}_${error.context.operation}`;
    const existing = this.errorStats.get(key) || { count: 0, lastOccurrence: new Date() };
    
    this.errorStats.set(key, {
      count: existing.count + 1,
      lastOccurrence: new Date()
    });

    // Record metrics
    this.monitoring.recordMetric('error_handling_errors_total', 1, {
      type: error.type,
      severity: error.severity,
      operation: error.context.operation,
      broker: error.context.brokerId || 'unknown'
    });
  }

  /**
   * Get default values for an operation
   */
  private getDefaultValues(operation: string): any {
    const defaults: Record<string, any> = {
      'getAccounts': [],
      'getPositions': [],
      'getOrders': [],
      'getExecutions': [],
      'getQuote': { price: 0, timestamp: new Date() },
      'default': null
    };

    return defaults[operation] || defaults.default;
  }

  /**
   * Get minimal response for graceful degradation
   */
  private getMinimalResponse(operation: string): any {
    return {
      success: false,
      error: 'Service temporarily unavailable',
      timestamp: new Date(),
      operation
    };
  }

  /**
   * Execute with timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Fallback operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      operation()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Register custom fallback strategy
   */
  public registerFallbackStrategy(
    operationKey: string,
    strategy: FallbackStrategy
  ): void {
    const existing = this.fallbackStrategies.get(operationKey) || [];
    existing.push(strategy);
    this.fallbackStrategies.set(operationKey, existing);
    
    console.log(`ErrorHandlingService: Registered fallback strategy ${strategy.name} for ${operationKey}`);
  }

  /**
   * Get circuit breaker metrics
   */
  public getCircuitBreakerMetrics(): Map<string, CircuitBreakerMetrics> {
    const metrics = new Map<string, CircuitBreakerMetrics>();
    
    for (const [key, circuitBreaker] of Array.from(this.circuitBreakers.entries())) {
      metrics.set(key, circuitBreaker.getMetrics());
    }
    
    return metrics;
  }

  /**
   * Get error statistics
   */
  public getErrorStatistics(): Map<string, { count: number; lastOccurrence: Date }> {
    return new Map(this.errorStats);
  }

  /**
   * Reset circuit breaker
   */
  public resetCircuitBreaker(key: string): void {
    const circuitBreaker = this.circuitBreakers.get(key);
    if (circuitBreaker) {
      circuitBreaker.reset();
      console.log(`ErrorHandlingService: Reset circuit breaker for ${key}`);
    }
  }

  /**
   * Update configuration
   */
  public updateConfiguration(updates: Partial<ErrorHandlingConfiguration>): void {
    this.config = { ...this.config, ...updates };
    
    if (updates.retry) {
      this.retryManager = new RetryManager(this.config.retry);
    }
    
    console.log('ErrorHandlingService: Configuration updated');
    this.emit('config:updated', this.config);
  }

  /**
   * Get service statistics
   */
  public getStatistics() {
    const circuitBreakerMetrics = this.getCircuitBreakerMetrics();
    const errorStats = this.getErrorStatistics();
    
    return {
      config: this.config,
      circuitBreakers: Array.from(circuitBreakerMetrics.entries()).map(([key, metrics]) => ({
        key,
        ...metrics
      })),
      errorStatistics: Array.from(errorStats.entries()).map(([key, stats]) => ({
        key,
        ...stats
      })),
      fallbackStrategies: Array.from(this.fallbackStrategies.keys()),
      totalErrors: Array.from(errorStats.values()).reduce((sum, stats) => sum + stats.count, 0)
    };
  }
}

// Export singleton instance
export const errorHandlingService = new ErrorHandlingService(
  new (require('./MonitoringService').MonitoringService)(),
  {
    retry: {
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      backoffMultiplier: 2,
      jitterEnabled: true,
      jitterMaxMs: 1000,
      timeoutMs: 30000,
      retryableErrors: [ErrorType.NETWORK, ErrorType.TIMEOUT, ErrorType.RATE_LIMIT, ErrorType.SERVER_ERROR],
      nonRetryableErrors: [ErrorType.AUTHENTICATION, ErrorType.AUTHORIZATION, ErrorType.VALIDATION]
    },
    circuitBreaker: {
      failureThreshold: 5,
      recoveryTimeoutMs: 60000,
      monitoringWindowMs: 60000,
      minimumThroughput: 10,
      errorThresholdPercentage: 50,
      halfOpenMaxCalls: 3
    },
    fallback: {
      enabled: true,
      strategies: [],
      timeoutMs: 5000,
      cacheEnabled: true,
      cacheTtlMs: 300000
    },
    enableMetrics: true,
    enableLogging: true,
    logLevel: 'info'
  }
); 