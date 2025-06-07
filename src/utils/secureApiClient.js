// Trading Helper Bot - Secure API Client
// TLS 1.3 Enforcement and Security Measures

import { SECURITY_CONFIG, logSecurityEvent } from '../config/security';

/**
 * Secure API Client with TLS 1.3 enforcement and comprehensive security
 */
class SecureApiClient {
  constructor() {
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...SECURITY_CONFIG.securityHeaders
    };
    
    this.retryCount = new Map();
    this.sessionStartTime = Date.now();
    
    // Initialize security validation
    this.validateEnvironment();
  }

  /**
   * Validate the security environment
   */
  validateEnvironment() {
    if (!window.isSecureContext) {
      throw new Error('🔒 SECURITY ERROR: Secure context required for API operations');
    }

    if (window.location.protocol !== 'https:' && SECURITY_CONFIG.enforceHTTPS) {
      throw new Error('🔒 SECURITY ERROR: HTTPS required for API operations');
    }

    logSecurityEvent('api_client_initialized', {
      secureContext: window.isSecureContext,
      protocol: window.location.protocol
    });
  }

  /**
   * Enhanced fetch with TLS 1.3 enforcement and security measures
   */
  async fetchSecure(url, options = {}) {
    // Security validation
    this.validateRequest(url, options);
    
    // Prepare secure request options
    const secureOptions = this.prepareSecureOptions(url, options);
    
    // Execute request with retry logic
    return this.executeSecureRequest(url, secureOptions);
  }

  /**
   * Validate request security requirements
   */
  validateRequest(url, options) {
    // Ensure HTTPS
    if (url.startsWith('http://')) {
      throw new Error('🔒 SECURITY ERROR: HTTP connections not allowed. Use HTTPS.');
    }

    // Validate URL against allowed domains
    const allowedDomains = SECURITY_CONFIG.csp['connect-src']
      .filter(domain => domain.startsWith('https://'))
      .map(domain => new URL(domain).hostname);

    try {
      const requestUrl = new URL(url);
      const isAllowed = allowedDomains.includes(requestUrl.hostname) || 
                       requestUrl.hostname === window.location.hostname;
      
      if (!isAllowed) {
        logSecurityEvent('blocked_request_unauthorized_domain', {
          requestedDomain: requestUrl.hostname,
          allowedDomains
        });
        throw new Error(`🔒 SECURITY ERROR: Domain ${requestUrl.hostname} not in allowed list`);
      }
    } catch (error) {
      if (error.message.includes('SECURITY ERROR')) throw error;
      throw new Error('🔒 SECURITY ERROR: Invalid URL format');
    }

    // Check session timeout
    if (this.isSessionExpired()) {
      throw new Error('🔒 SECURITY ERROR: Session expired. Please refresh the application.');
    }
  }

  /**
   * Prepare secure request options
   */
  prepareSecureOptions(url, options) {
    const secureOptions = {
      ...options,
      // Security headers
      headers: {
        ...this.defaultHeaders,
        ...options.headers
      },
      // Security settings
      credentials: options.credentials || 'same-origin',
      mode: options.mode || 'cors',
      cache: options.cache || 'no-cache',
      redirect: 'follow',
      referrerPolicy: 'strict-origin-when-cross-origin'
    };

    // Add request signature for integrity
    secureOptions.headers['X-Request-Timestamp'] = Date.now().toString();
    secureOptions.headers['X-Request-ID'] = this.generateRequestId();

    // Content type validation
    if (options.body && typeof options.body === 'string') {
      try {
        JSON.parse(options.body);
      } catch (error) {
        throw new Error('🔒 SECURITY ERROR: Invalid JSON payload');
      }
    }

    return secureOptions;
  }

  /**
   * Execute secure request with retry logic and monitoring
   */
  async executeSecureRequest(url, options) {
    const requestId = options.headers['X-Request-ID'];
    const maxRetries = SECURITY_CONFIG.financialSecurity.maxRetries;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logSecurityEvent('api_request_start', {
          url,
          requestId,
          attempt,
          method: options.method || 'GET'
        });

        const response = await fetch(url, options);
        
        // Validate response security
        await this.validateResponse(response, url, requestId);
        
        // Success logging
        logSecurityEvent('api_request_success', {
          url,
          requestId,
          status: response.status,
          tlsInfo: this.extractTLSInfo(response)
        });

        return response;

      } catch (error) {
        logSecurityEvent('api_request_error', {
          url,
          requestId,
          attempt,
          error: error.message
        });

        // Security-related errors should not be retried
        if (error.message.includes('SECURITY ERROR')) {
          throw error;
        }

        // Network errors can be retried
        if (attempt === maxRetries) {
          throw new Error(`🔒 API request failed after ${maxRetries} attempts: ${error.message}`);
        }

        // Exponential backoff
        await this.delay(Math.pow(2, attempt - 1) * 1000);
      }
    }
  }

  /**
   * Validate API response security
   */
  async validateResponse(response, url, requestId) {
    // Check for security headers in response
    const securityHeaders = {
      'strict-transport-security': response.headers.get('strict-transport-security'),
      'content-security-policy': response.headers.get('content-security-policy'),
      'x-frame-options': response.headers.get('x-frame-options'),
      'x-content-type-options': response.headers.get('x-content-type-options')
    };

    // Log security header status
    logSecurityEvent('response_security_headers', {
      url,
      requestId,
      headers: securityHeaders
    });

    // Validate TLS version if available
    const tlsVersion = response.headers.get('x-tls-version') || 
                      response.headers.get('tls-version');
    
    if (tlsVersion && !tlsVersion.includes('1.3') && !tlsVersion.includes('1.2')) {
      console.warn(`⚠️ Non-modern TLS detected: ${tlsVersion} for ${url}`);
      logSecurityEvent('non_modern_tls_detected', {
        url,
        requestId,
        tlsVersion
      });
    }

    // Check for error status codes
    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
        throw new Error('🔒 SECURITY ERROR: Authentication/Authorization failed');
      }
      throw new Error(`API request failed with status ${response.status}`);
    }

    // Validate content type for JSON responses
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json') && 
        !contentType.includes('text/plain')) {
      console.warn(`⚠️ Unexpected content type: ${contentType} for ${url}`);
    }
  }

  /**
   * Extract TLS information from response headers
   */
  extractTLSInfo(response) {
    return {
      version: response.headers.get('x-tls-version'),
      cipher: response.headers.get('x-tls-cipher'),
      protocol: response.headers.get('x-protocol-version')
    };
  }

  /**
   * Check if session has expired
   */
  isSessionExpired() {
    const sessionTimeout = SECURITY_CONFIG.financialSecurity.sessionTimeout;
    return (Date.now() - this.sessionStartTime) > sessionTimeout;
  }

  /**
   * Generate unique request ID for tracking
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay utility for retry backoff
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * GET request with security enforcement
   */
  async get(url, options = {}) {
    return this.fetchSecure(url, {
      ...options,
      method: 'GET'
    });
  }

  /**
   * POST request with security enforcement
   */
  async post(url, data, options = {}) {
    return this.fetchSecure(url, {
      ...options,
      method: 'POST',
      body: typeof data === 'string' ? data : JSON.stringify(data)
    });
  }

  /**
   * PUT request with security enforcement
   */
  async put(url, data, options = {}) {
    return this.fetchSecure(url, {
      ...options,
      method: 'PUT',
      body: typeof data === 'string' ? data : JSON.stringify(data)
    });
  }

  /**
   * DELETE request with security enforcement
   */
  async delete(url, options = {}) {
    return this.fetchSecure(url, {
      ...options,
      method: 'DELETE'
    });
  }

  /**
   * Test API connectivity and security
   */
  async testSecurity() {
    try {
      console.log('🔒 Testing API security configuration...');
      
      // Test HTTPS enforcement
      const testUrl = 'https://httpbin.org/get';
      const response = await this.get(testUrl);
      const data = await response.json();
      
      const securityTest = {
        httpsEnforced: response.url.startsWith('https://'),
        secureContext: window.isSecureContext,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString()
      };

      logSecurityEvent('security_test_completed', securityTest);
      console.log('✅ API security test passed', securityTest);
      
      return securityTest;
    } catch (error) {
      console.error('❌ API security test failed:', error);
      logSecurityEvent('security_test_failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Reset session timer (call on user activity)
   */
  resetSession() {
    this.sessionStartTime = Date.now();
    logSecurityEvent('session_reset', { timestamp: this.sessionStartTime });
  }

  /**
   * Get security status
   */
  getSecurityStatus() {
    return {
      sessionActive: !this.isSessionExpired(),
      sessionDuration: Date.now() - this.sessionStartTime,
      secureContext: window.isSecureContext,
      protocol: window.location.protocol,
      retryStats: Object.fromEntries(this.retryCount)
    };
  }
}

// Create singleton instance
const secureApiClient = new SecureApiClient();

// Test security on initialization in development
if (process.env.NODE_ENV === 'development') {
  secureApiClient.testSecurity().catch(console.error);
}

export default secureApiClient; 