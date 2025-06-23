/**
 * Test suite for ErrorHandlingService
 * Tests error classification, retry logic, circuit breaker patterns, and fallback strategies
 */

import {
  ErrorHandlingService,
  ErrorClassifier,
  CircuitBreaker,
  RetryManager,
  ErrorType,
  ErrorSeverity,
  RetryStrategy,
  CircuitBreakerState,
  ErrorContext,
  ClassifiedError,
  RetryConfiguration,
  CircuitBreakerConfiguration,
  ErrorHandlingConfiguration
} from '../ErrorHandlingService';
import { MonitoringService } from '../MonitoringService';

// Mock dependencies
jest.mock('../MonitoringService');

const mockMonitoringService = {
  startSpan: jest.fn().mockReturnValue({
    setTag: jest.fn(),
    setStatus: jest.fn(),
    finish: jest.fn()
  }),
  recordMetric: jest.fn(),
  recordGauge: jest.fn(),
  recordHistogram: jest.fn()
};

describe('ErrorClassifier', () => {
  const mockContext: ErrorContext = {
    operation: 'testOperation',
    brokerId: 'testBroker',
    timestamp: new Date(),
    requestId: 'test-123'
  };

  describe('Network Error Classification', () => {
    it('should classify network errors correctly', () => {
      const networkError = new Error('ECONNREFUSED: Connection refused');
      const classified = ErrorClassifier.classify(networkError, mockContext);

      expect(classified.type).toBe(ErrorType.NETWORK);
      expect(classified.severity).toBe(ErrorSeverity.MEDIUM);
      expect(classified.isRetryable).toBe(true);
      expect(classified.retryStrategy).toBe(RetryStrategy.EXPONENTIAL_BACKOFF);
      expect(classified.classification.confidence).toBe(0.9);
    });

    it('should classify DNS errors as network errors', () => {
      const dnsError = new Error('ENOTFOUND: DNS lookup failed');
      const classified = ErrorClassifier.classify(dnsError, mockContext);

      expect(classified.type).toBe(ErrorType.NETWORK);
      expect(classified.isRetryable).toBe(true);
    });
  });

  describe('Authentication Error Classification', () => {
    it('should classify 401 errors as authentication errors', () => {
      const authError = new Error('Unauthorized access') as any;
      authError.status = 401;
      const classified = ErrorClassifier.classify(authError, mockContext);

      expect(classified.type).toBe(ErrorType.AUTHENTICATION);
      expect(classified.severity).toBe(ErrorSeverity.HIGH);
      expect(classified.isRetryable).toBe(false);
      expect(classified.retryStrategy).toBe(RetryStrategy.NO_RETRY);
    });

    it('should classify invalid token errors', () => {
      const tokenError = new Error('Invalid token provided');
      const classified = ErrorClassifier.classify(tokenError, mockContext);

      expect(classified.type).toBe(ErrorType.AUTHENTICATION);
      expect(classified.isRetryable).toBe(false);
    });
  });

  describe('Rate Limit Error Classification', () => {
    it('should classify 429 errors as rate limit errors', () => {
      const rateLimitError = new Error('Too many requests') as any;
      rateLimitError.status = 429;
      const classified = ErrorClassifier.classify(rateLimitError, mockContext);

      expect(classified.type).toBe(ErrorType.RATE_LIMIT);
      expect(classified.severity).toBe(ErrorSeverity.MEDIUM);
      expect(classified.isRetryable).toBe(true);
      expect(classified.retryStrategy).toBe(RetryStrategy.EXPONENTIAL_BACKOFF);
    });
  });

  describe('Timeout Error Classification', () => {
    it('should classify timeout errors correctly', () => {
      const timeoutError = new Error('Request timed out');
      const classified = ErrorClassifier.classify(timeoutError, mockContext);

      expect(classified.type).toBe(ErrorType.TIMEOUT);
      expect(classified.isRetryable).toBe(true);
    });

    it('should classify 504 gateway timeout errors', () => {
      const gatewayTimeoutError = new Error('Gateway timeout') as any;
      gatewayTimeoutError.status = 504;
      const classified = ErrorClassifier.classify(gatewayTimeoutError, mockContext);

      expect(classified.type).toBe(ErrorType.TIMEOUT);
    });
  });

  describe('Server Error Classification', () => {
    it('should classify 5xx errors as server errors', () => {
      const serverError = new Error('Internal server error') as any;
      serverError.status = 500;
      const classified = ErrorClassifier.classify(serverError, mockContext);

      expect(classified.type).toBe(ErrorType.SERVER_ERROR);
      expect(classified.severity).toBe(ErrorSeverity.HIGH);
      expect(classified.isRetryable).toBe(true);
    });
  });

  describe('Client Error Classification', () => {
    it('should classify 4xx errors as client errors', () => {
      const clientError = new Error('Bad request') as any;
      clientError.status = 400;
      const classified = ErrorClassifier.classify(clientError, mockContext);

      expect(classified.type).toBe(ErrorType.VALIDATION);
      expect(classified.isRetryable).toBe(false);
    });

    it('should classify 404 errors as client errors', () => {
      const notFoundError = new Error('Not found') as any;
      notFoundError.status = 404;
      const classified = ErrorClassifier.classify(notFoundError, mockContext);

      expect(classified.type).toBe(ErrorType.CLIENT_ERROR);
      expect(classified.isRetryable).toBe(false);
    });
  });

  describe('Validation Error Classification', () => {
    it('should classify validation errors correctly', () => {
      const validationError = new Error('Required field missing');
      const classified = ErrorClassifier.classify(validationError, mockContext);

      expect(classified.type).toBe(ErrorType.VALIDATION);
      expect(classified.severity).toBe(ErrorSeverity.LOW);
      expect(classified.isRetryable).toBe(false);
    });
  });

  describe('Unknown Error Classification', () => {
    it('should classify unknown errors with low confidence', () => {
      const unknownError = new Error('Something went wrong');
      const classified = ErrorClassifier.classify(unknownError, mockContext);

      expect(classified.type).toBe(ErrorType.UNKNOWN);
      expect(classified.severity).toBe(ErrorSeverity.MEDIUM);
      expect(classified.isRetryable).toBe(false);
      expect(classified.classification.confidence).toBe(0.3);
    });
  });
});

describe('RetryManager', () => {
  const defaultConfig: RetryConfiguration = {
    maxAttempts: 3,
    baseDelayMs: 100,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
    jitterEnabled: false,
    jitterMaxMs: 0,
    timeoutMs: 1000,
    retryableErrors: [ErrorType.NETWORK, ErrorType.TIMEOUT],
    nonRetryableErrors: [ErrorType.AUTHENTICATION]
  };

  const mockContext: ErrorContext = {
    operation: 'testOperation',
    timestamp: new Date()
  };

  let retryManager: RetryManager;

  beforeEach(() => {
    retryManager = new RetryManager(defaultConfig);
  });

  describe('Successful Operations', () => {
    it('should return result on first attempt if operation succeeds', async () => {
      const successfulOperation = jest.fn().mockResolvedValue('success');
      
      const result = await retryManager.executeWithRetry(
        successfulOperation,
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toHaveLength(1);
      expect(result.attempts[0].success).toBe(true);
      expect(successfulOperation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Retry Logic', () => {
    it('should retry retryable errors up to max attempts', async () => {
      const networkError = new Error('ECONNREFUSED');
      const failingOperation = jest.fn()
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue('success');

      const result = await retryManager.executeWithRetry(
        failingOperation,
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toHaveLength(3);
      expect(failingOperation).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
      const authError = new Error('Unauthorized') as any;
      authError.status = 401;
      const failingOperation = jest.fn().mockRejectedValue(authError);

      const result = await retryManager.executeWithRetry(
        failingOperation,
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.attempts).toHaveLength(1);
      expect(failingOperation).toHaveBeenCalledTimes(1);
    });

    it('should respect max attempts limit', async () => {
      const networkError = new Error('ECONNREFUSED');
      const failingOperation = jest.fn().mockRejectedValue(networkError);

      const result = await retryManager.executeWithRetry(
        failingOperation,
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.attempts).toHaveLength(3);
      expect(failingOperation).toHaveBeenCalledTimes(3);
    });
  });

  describe('Delay Calculation', () => {
    it('should calculate exponential backoff delays correctly', async () => {
      const networkError = new Error('ECONNREFUSED');
      const failingOperation = jest.fn().mockRejectedValue(networkError);

      const result = await retryManager.executeWithRetry(
        failingOperation,
        mockContext
      );

      expect(result.attempts[0].delayMs).toBe(0); // First attempt has no delay
      expect(result.attempts[1].delayMs).toBe(100); // baseDelayMs * 2^0
      expect(result.attempts[2].delayMs).toBe(200); // baseDelayMs * 2^1
    });

    it('should respect max delay limit', async () => {
      const configWithLowMaxDelay: RetryConfiguration = {
        ...defaultConfig,
        maxDelayMs: 150
      };
      const retryManagerWithLowMax = new RetryManager(configWithLowMaxDelay);
      
      const networkError = new Error('ECONNREFUSED');
      const failingOperation = jest.fn().mockRejectedValue(networkError);

      const result = await retryManagerWithLowMax.executeWithRetry(
        failingOperation,
        mockContext
      );

      expect(result.attempts[2].delayMs).toBe(150); // Capped at maxDelayMs
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout operations that exceed timeout limit', async () => {
      const slowOperation = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 2000))
      );

      const result = await retryManager.executeWithRetry(
        slowOperation,
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.finalError?.type).toBe(ErrorType.UNKNOWN);
    });
  });
});

describe('CircuitBreaker', () => {
  const defaultConfig: CircuitBreakerConfiguration = {
    failureThreshold: 3,
    recoveryTimeoutMs: 1000,
    monitoringWindowMs: 5000,
    minimumThroughput: 5,
    errorThresholdPercentage: 50,
    halfOpenMaxCalls: 2
  };

  const mockContext: ErrorContext = {
    operation: 'testOperation',
    timestamp: new Date()
  };

  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker(defaultConfig, mockMonitoringService as any);
  });

  describe('Closed State', () => {
    it('should execute operations normally when closed', async () => {
      const successfulOperation = jest.fn().mockResolvedValue('success');
      
      const result = await circuitBreaker.execute(successfulOperation, mockContext);

      expect(result).toBe('success');
      expect(successfulOperation).toHaveBeenCalledTimes(1);
    });

    it('should transition to open state after failure threshold', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('Test error'));

      // Execute enough failures to trigger circuit breaker
      for (let i = 0; i < 5; i++) {
        try {
          await circuitBreaker.execute(failingOperation, mockContext);
        } catch (error) {
          // Expected to fail
        }
      }

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.state).toBe(CircuitBreakerState.OPEN);
    });
  });

  describe('Open State', () => {
    beforeEach(async () => {
      // Force circuit breaker to open state
      const failingOperation = jest.fn().mockRejectedValue(new Error('Test error'));
      for (let i = 0; i < 5; i++) {
        try {
          await circuitBreaker.execute(failingOperation, mockContext);
        } catch (error) {
          // Expected to fail
        }
      }
    });

    it('should reject operations immediately when open', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      await expect(
        circuitBreaker.execute(operation, mockContext)
      ).rejects.toThrow('Circuit breaker is OPEN');

      expect(operation).not.toHaveBeenCalled();
    });

    it('should transition to half-open after recovery timeout', async () => {
      // Wait for recovery timeout
      await new Promise(resolve => setTimeout(resolve, 1100));

      const operation = jest.fn().mockResolvedValue('success');
      await circuitBreaker.execute(operation, mockContext);

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.state).toBe(CircuitBreakerState.CLOSED);
    });
  });

  describe('Half-Open State', () => {
    it('should limit calls in half-open state', async () => {
      // Force to open state first
      const failingOperation = jest.fn().mockRejectedValue(new Error('Test error'));
      for (let i = 0; i < 5; i++) {
        try {
          await circuitBreaker.execute(failingOperation, mockContext);
        } catch (error) {
          // Expected to fail
        }
      }

      // Wait for recovery timeout to transition to half-open
      await new Promise(resolve => setTimeout(resolve, 1100));

      const operation = jest.fn().mockResolvedValue('success');
      
      // First call should succeed and transition to closed
      await circuitBreaker.execute(operation, mockContext);
      
      const metrics = circuitBreaker.getMetrics();
      expect(metrics.state).toBe(CircuitBreakerState.CLOSED);
    });
  });

  describe('Metrics', () => {
    it('should track failure and success counts', async () => {
      const successOperation = jest.fn().mockResolvedValue('success');
      const failOperation = jest.fn().mockRejectedValue(new Error('fail'));

      // Execute some operations
      await circuitBreaker.execute(successOperation, mockContext);
      try {
        await circuitBreaker.execute(failOperation, mockContext);
      } catch (error) {
        // Expected
      }

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.successCount).toBe(1);
      expect(metrics.failureCount).toBe(1);
      expect(metrics.totalRequests).toBe(2);
      expect(metrics.errorRate).toBe(0.5);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset circuit breaker state', async () => {
      // Force to open state
      const failingOperation = jest.fn().mockRejectedValue(new Error('Test error'));
      for (let i = 0; i < 5; i++) {
        try {
          await circuitBreaker.execute(failingOperation, mockContext);
        } catch (error) {
          // Expected to fail
        }
      }

      circuitBreaker.reset();

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.state).toBe(CircuitBreakerState.CLOSED);
      expect(metrics.failureCount).toBe(0);
      expect(metrics.successCount).toBe(0);
      expect(metrics.totalRequests).toBe(0);
    });
  });
});

describe('ErrorHandlingService', () => {
  const defaultConfig: ErrorHandlingConfiguration = {
    retry: {
      maxAttempts: 3,
      baseDelayMs: 100,
      maxDelayMs: 5000,
      backoffMultiplier: 2,
      jitterEnabled: false,
      jitterMaxMs: 0,
      timeoutMs: 1000,
      retryableErrors: [ErrorType.NETWORK, ErrorType.TIMEOUT],
      nonRetryableErrors: [ErrorType.AUTHENTICATION]
    },
    circuitBreaker: {
      failureThreshold: 3,
      recoveryTimeoutMs: 1000,
      monitoringWindowMs: 5000,
      minimumThroughput: 5,
      errorThresholdPercentage: 50,
      halfOpenMaxCalls: 2
    },
    fallback: {
      enabled: true,
      strategies: [],
      timeoutMs: 1000,
      cacheEnabled: true,
      cacheTtlMs: 300000
    },
    enableMetrics: true,
    enableLogging: true,
    logLevel: 'info'
  };

  const mockContext: ErrorContext = {
    operation: 'testOperation',
    timestamp: new Date()
  };

  let errorHandlingService: ErrorHandlingService;

  beforeEach(() => {
    errorHandlingService = new ErrorHandlingService(
      mockMonitoringService as any,
      defaultConfig
    );
  });

  describe('Successful Operations', () => {
    it('should execute successful operations without intervention', async () => {
      const successfulOperation = jest.fn().mockResolvedValue('success');

      const result = await errorHandlingService.executeWithErrorHandling(
        successfulOperation,
        mockContext
      );

      expect(result).toBe('success');
      expect(successfulOperation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling Integration', () => {
    it('should retry retryable errors', async () => {
      const networkError = new Error('ECONNREFUSED');
      const operation = jest.fn()
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue('success');

      const result = await errorHandlingService.executeWithErrorHandling(
        operation,
        mockContext
      );

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable errors', async () => {
      const authError = new Error('Unauthorized') as any;
      authError.status = 401;
      const operation = jest.fn().mockRejectedValue(authError);

      await expect(
        errorHandlingService.executeWithErrorHandling(operation, mockContext)
      ).rejects.toMatchObject({
        type: ErrorType.AUTHENTICATION
      });

      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Fallback Strategies', () => {
    it('should execute fallback strategies when operation fails', async () => {
      const networkError = new Error('ECONNREFUSED');
      const operation = jest.fn().mockRejectedValue(networkError);

      const result = await errorHandlingService.executeWithErrorHandling(
        operation,
        mockContext
      );

      // Should return fallback result (graceful degradation)
      expect(result).toEqual({
        success: false,
        error: 'Service temporarily unavailable',
        timestamp: expect.any(Date),
        operation: 'testOperation'
      });
    });

    it('should register and use custom fallback strategies', async () => {
      const customFallback = {
        name: 'custom_fallback',
        priority: 0,
        condition: () => true,
        handler: jest.fn().mockResolvedValue('custom_result'),
        timeoutMs: 1000
      };

      errorHandlingService.registerFallbackStrategy('testOperation', customFallback);

      const networkError = new Error('ECONNREFUSED');
      const operation = jest.fn().mockRejectedValue(networkError);

      const result = await errorHandlingService.executeWithErrorHandling(
        operation,
        mockContext
      );

      expect(result).toBe('custom_result');
      expect(customFallback.handler).toHaveBeenCalled();
    });
  });

  describe('Circuit Breaker Integration', () => {
    it('should use circuit breaker for operations', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('Test error'));

      // Execute enough failures to potentially trigger circuit breaker
      for (let i = 0; i < 10; i++) {
        try {
          await errorHandlingService.executeWithErrorHandling(
            failingOperation,
            mockContext
          );
        } catch (error) {
          // Expected to fail
        }
      }

      const metrics = errorHandlingService.getCircuitBreakerMetrics();
      expect(metrics.size).toBeGreaterThan(0);
    });

    it('should allow skipping circuit breaker', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await errorHandlingService.executeWithErrorHandling(
        operation,
        mockContext,
        { skipCircuitBreaker: true }
      );

      expect(result).toBe('success');
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const updates = {
        retry: {
          ...defaultConfig.retry,
          maxAttempts: 5
        }
      };

      errorHandlingService.updateConfiguration(updates);

      const stats = errorHandlingService.getStatistics();
      expect(stats.config.retry.maxAttempts).toBe(5);
    });
  });

  describe('Statistics and Metrics', () => {
    it('should track error statistics', async () => {
      const networkError = new Error('ECONNREFUSED');
      const operation = jest.fn().mockRejectedValue(networkError);

      try {
        await errorHandlingService.executeWithErrorHandling(operation, mockContext);
      } catch (error) {
        // Expected
      }

      const stats = errorHandlingService.getStatistics();
      expect(stats.totalErrors).toBeGreaterThan(0);
      expect(stats.errorStatistics.length).toBeGreaterThan(0);
    });

    it('should provide circuit breaker metrics', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      await errorHandlingService.executeWithErrorHandling(operation, mockContext);

      const metrics = errorHandlingService.getCircuitBreakerMetrics();
      expect(metrics.size).toBeGreaterThan(0);
    });
  });

  describe('Event Emission', () => {
    it('should emit error events', async () => {
      const errorListener = jest.fn();
      errorHandlingService.on('error:classified', errorListener);

      const networkError = new Error('ECONNREFUSED');
      const operation = jest.fn().mockRejectedValue(networkError);

      try {
        await errorHandlingService.executeWithErrorHandling(operation, mockContext);
      } catch (error) {
        // Expected
      }

      expect(errorListener).toHaveBeenCalled();
    });

    it('should emit fallback success events', async () => {
      const fallbackListener = jest.fn();
      errorHandlingService.on('fallback:success', fallbackListener);

      const networkError = new Error('ECONNREFUSED');
      const operation = jest.fn().mockRejectedValue(networkError);

      await errorHandlingService.executeWithErrorHandling(operation, mockContext);

      expect(fallbackListener).toHaveBeenCalled();
    });
  });
}); 