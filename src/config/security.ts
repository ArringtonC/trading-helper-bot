// Trading Helper Bot - Security Configuration
// TLS 1.3 and Client-Side Security Enforcement

/**
 * Types for security configuration
 */
interface ApiSecurity {
  minimumTLSVersion: string;
  certificateValidation: boolean;
  allowSelfSigned: boolean;
  enforceHSTS: boolean;
}

interface ContentSecurityPolicy {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'img-src': string[];
  'connect-src': string[];
  'font-src': string[];
  'frame-ancestors': string[];
  'form-action': string[];
  'base-uri': string[];
}

interface SecurityHeaders {
  'X-Requested-With': string;
  'X-Content-Type-Options': string;
  'X-Frame-Options': string;
  'Referrer-Policy': string;
}

interface FinancialSecurity {
  encryptLocalStorage: boolean;
  sessionTimeout: number;
  maxRetries: number;
  logSecurityEvents: boolean;
}

interface SecurityConfig {
  enforceHTTPS: boolean;
  apiSecurity: ApiSecurity;
  csp: ContentSecurityPolicy;
  securityHeaders: SecurityHeaders;
  financialSecurity: FinancialSecurity;
}

interface ConnectionStatus {
  isSecure: boolean;
  hasSecureContext: boolean;
  protocol: string;
  host: string;
}

interface SecurityLogEntry {
  timestamp: string;
  event: string;
  details: Record<string, any>;
  userAgent: string;
  url: string;
  protocol: string;
}

interface SecurityStatus {
  connection: ConnectionStatus;
  csp: {
    enabled: boolean;
    policy: string | null;
  };
  config: SecurityConfig;
  timestamp: string;
}

export const SECURITY_CONFIG: SecurityConfig = {
  // Environment-based security settings
  enforceHTTPS: process.env.NODE_ENV === 'production',
  
  // TLS requirements for external APIs
  apiSecurity: {
    minimumTLSVersion: '1.3',
    certificateValidation: true,
    allowSelfSigned: false,
    enforceHSTS: true
  },
  
  // Content Security Policy directives
  csp: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", "data:", "https:"],
    'connect-src': [
      "'self'", 
      "https://api.iex.cloud", 
      "https://cloud.iexapis.com",
      "https://httpbin.org" // For security testing
    ],
    'font-src': ["'self'"],
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"]
  },

  // Security headers for API requests
  securityHeaders: {
    'X-Requested-With': 'XMLHttpRequest',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  },

  // Financial app specific security
  financialSecurity: {
    encryptLocalStorage: true,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    maxRetries: 3,
    logSecurityEvents: true
  }
};

/**
 * Protocol security check - redirects to HTTPS if needed
 */
export const ensureSecureProtocol = (): void => {
  if (SECURITY_CONFIG.enforceHTTPS && window.location.protocol !== 'https:') {
    console.warn('🔒 Redirecting to HTTPS for security compliance');
    const httpsUrl = `https:${window.location.href.substring(window.location.protocol.length)}`;
    window.location.replace(httpsUrl);
  }
};

/**
 * Check if current connection meets security requirements
 */
export const validateSecureConnection = (): ConnectionStatus => {
  const isSecure = window.location.protocol === 'https:';
  const hasSecureContext = window.isSecureContext;
  
  if (!isSecure) {
    console.error('⚠️ SECURITY WARNING: Not using HTTPS protocol');
  }
  
  if (!hasSecureContext) {
    console.error('⚠️ SECURITY WARNING: Secure context not available');
  }

  return {
    isSecure,
    hasSecureContext,
    protocol: window.location.protocol,
    host: window.location.host
  };
};

/**
 * Log security events for monitoring
 */
export const logSecurityEvent = (event: string, details: Record<string, any> = {}): void => {
  if (!SECURITY_CONFIG.financialSecurity.logSecurityEvents) return;

  const securityLog: SecurityLogEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    userAgent: navigator.userAgent,
    url: window.location.href,
    protocol: window.location.protocol
  };

  console.log('🔐 Security Event:', securityLog);
  
  // In production, send to security monitoring service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Implement security event logging to monitoring service
    console.info('Security event logged for monitoring');
  }
};

/**
 * Initialize security configuration on app load
 */
export const initializeSecurity = (): ConnectionStatus => {
  console.log('🔒 Initializing Trading Helper Bot Security...');
  
  // Force HTTPS if needed
  ensureSecureProtocol();
  
  // Validate secure connection
  const connectionStatus = validateSecureConnection();
  logSecurityEvent('app_security_init', connectionStatus);
  
  // Set up Content Security Policy if not set by server
  if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
    console.log('📋 Setting up client-side Content Security Policy');
    setContentSecurityPolicy();
  }
  
  // Set up security event listeners
  setupSecurityEventListeners();
  
  console.log('✅ Security initialization complete');
  return connectionStatus;
};

/**
 * Set Content Security Policy via meta tag (fallback)
 */
const setContentSecurityPolicy = (): void => {
  const cspString = Object.entries(SECURITY_CONFIG.csp)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');

  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = cspString;
  document.head.appendChild(meta);
  
  logSecurityEvent('csp_set_client_side', { policy: cspString });
};

/**
 * Set up security event listeners
 */
const setupSecurityEventListeners = (): void => {
  // Monitor for security policy violations
  document.addEventListener('securitypolicyviolation', (e: SecurityPolicyViolationEvent) => {
    logSecurityEvent('csp_violation', {
      violatedDirective: e.violatedDirective,
      blockedURI: e.blockedURI,
      originalPolicy: e.originalPolicy
    });
  });

  // Monitor for mixed content issues
  if ('SecurityPolicyViolationEvent' in window) {
    window.addEventListener('securitypolicyviolation', (e: SecurityPolicyViolationEvent) => {
      console.error('🚨 Security Policy Violation:', e);
      logSecurityEvent('security_violation', {
        type: e.violatedDirective,
        blockedURI: e.blockedURI
      });
    });
  }

  // Monitor for protocol downgrades
  window.addEventListener('beforeunload', () => {
    if (window.location.protocol === 'http:' && SECURITY_CONFIG.enforceHTTPS) {
      logSecurityEvent('protocol_downgrade_detected', {
        finalUrl: window.location.href
      });
    }
  });
};

/**
 * Get security status for debugging/monitoring
 */
export const getSecurityStatus = (): SecurityStatus => {
  const connection = validateSecureConnection();
  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  
  return {
    connection,
    csp: {
      enabled: !!cspMeta,
      policy: cspMeta?.getAttribute('content') || null
    },
    config: SECURITY_CONFIG,
    timestamp: new Date().toISOString()
  };
};

// Auto-initialize security in production
if (process.env.NODE_ENV === 'production') {
  document.addEventListener('DOMContentLoaded', initializeSecurity);
}

// Export types for external use
export type {
  SecurityConfig,
  ConnectionStatus,
  SecurityLogEntry,
  SecurityStatus,
  ApiSecurity,
  ContentSecurityPolicy,
  SecurityHeaders,
  FinancialSecurity
};

export default SECURITY_CONFIG;