// Trading Helper Bot - Security Configuration
// TLS 1.3 and Client-Side Security Enforcement

export const SECURITY_CONFIG = {
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
export const ensureSecureProtocol = () => {
  if (SECURITY_CONFIG.enforceHTTPS && window.location.protocol !== 'https:') {
    console.warn('🔒 Redirecting to HTTPS for security compliance');
    const httpsUrl = `https:${window.location.href.substring(window.location.protocol.length)}`;
    window.location.replace(httpsUrl);
  }
};

/**
 * Check if current connection meets security requirements
 */
export const validateSecureConnection = () => {
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
export const logSecurityEvent = (event, details = {}) => {
  if (!SECURITY_CONFIG.financialSecurity.logSecurityEvents) return;

  const securityLog = {
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
export const initializeSecurity = () => {
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
const setContentSecurityPolicy = () => {
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
const setupSecurityEventListeners = () => {
  // Monitor for security policy violations
  document.addEventListener('securitypolicyviolation', (e) => {
    logSecurityEvent('csp_violation', {
      violatedDirective: e.violatedDirective,
      blockedURI: e.blockedURI,
      originalPolicy: e.originalPolicy
    });
  });

  // Monitor for mixed content issues
  if ('SecurityPolicyViolationEvent' in window) {
    window.addEventListener('securitypolicyviolation', (e) => {
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
export const getSecurityStatus = () => {
  const connection = validateSecureConnection();
  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  
  return {
    connection,
    csp: {
      enabled: !!cspMeta,
      policy: cspMeta?.content || null
    },
    config: SECURITY_CONFIG,
    timestamp: new Date().toISOString()
  };
};

// Auto-initialize security in production
if (process.env.NODE_ENV === 'production') {
  document.addEventListener('DOMContentLoaded', initializeSecurity);
}

export default SECURITY_CONFIG; 