// Trading Helper Bot - Rate Limiting and Abuse Prevention
// Created for Task 38.4: Implement Rate Limiting and Abuse Prevention Controls

/**
 * Types and interfaces for rate limiting
 */
interface RateLimit {
  window: number; // Time window in milliseconds
  max: number; // Maximum requests in window
  burst?: number; // Burst limit for rapid requests
  maxSize?: number; // For file uploads
}

interface RateLimitLimits {
  api: RateLimit;
  upload: RateLimit;
  calculation: RateLimit;
  page: RateLimit;
}

interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
  remaining?: number;
  resetTime?: number;
}

interface FileValidationResult {
  valid: boolean;
  reason?: string;
  message?: string;
}

interface SecurityLogEntry {
  timestamp: string;
  type: string;
  clientId: string;
  action?: string;
  reason?: string;
  activityType?: string;
  incidentCount?: number;
  fileSize?: number;
  maxSize?: number;
  fileType?: string;
  fileName?: string;
  message?: string;
  duration?: string;
}

interface SecurityLog {
  events: SecurityLogEntry[];
  maxEvents: number;
  log: (event: Omit<SecurityLogEntry, 'timestamp'>) => void;
}

interface RateLimitStatus {
  clientId: string;
  action: string;
  requestCount: number;
  limit: number;
  remaining: number;
  isBlocked: boolean;
  nextReset: Date | null;
}

interface SecurityLogSummary {
  events: SecurityLogEntry[];
  totalEvents: number;
  blockedClients: string[];
  activeConnections: number;
}

/**
 * Rate Limiter for Trading Helper Bot
 * Implements sliding window rate limiting with multiple tiers
 */
class RateLimiter {
  private requests: Map<string, number[]>;
  private suspiciousActivity: Map<string, number[]>;
  private blockedIPs: Set<string>;
  private limits: RateLimitLimits;
  private securityLog: SecurityLog;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.requests = new Map(); // Store request counts per identifier
    this.suspiciousActivity = new Map(); // Track suspicious patterns
    this.blockedIPs = new Set(); // Temporarily blocked identifiers
    
    this.limits = {
      // API call limits (per minute)
      api: {
        window: 60000, // 1 minute
        max: 60, // 60 requests per minute
        burst: 20 // 20 requests in quick succession
      },
      
      // File upload limits (per hour)
      upload: {
        window: 3600000, // 1 hour
        max: 10, // 10 uploads per hour
        maxSize: 50 * 1024 * 1024 // 50MB max file size
      },
      
      // Chart/calculation requests (per minute)
      calculation: {
        window: 60000, // 1 minute
        max: 120, // 120 calculations per minute
        burst: 30
      },
      
      // General page requests (per minute)
      page: {
        window: 60000, // 1 minute
        max: 300, // 300 page requests per minute
        burst: 50
      }
    };
    
    // Clean up old records every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    
    this.initializeSecurityLogging();
  }

  /**
   * Initialize security event logging
   */
  private initializeSecurityLogging(): void {
    this.securityLog = {
      events: [],
      maxEvents: 1000,
      
      log: (event: Omit<SecurityLogEntry, 'timestamp'>): void => {
        const logEntry: SecurityLogEntry = {
          timestamp: new Date().toISOString(),
          ...event
        };
        
        this.securityLog.events.push(logEntry);
        
        // Keep only last 1000 events
        if (this.securityLog.events.length > this.securityLog.maxEvents) {
          this.securityLog.events.shift();
        }
        
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('🔒 Security Event:', logEntry);
        }
      }
    };
  }

  /**
   * Get client identifier (IP simulation for client-side)
   */
  getClientId(): string {
    // In a real application, this would be the client IP
    // For client-side simulation, we use session storage
    let clientId = sessionStorage.getItem('client_id');
    if (!clientId) {
      clientId = 'client_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('client_id', clientId);
    }
    return clientId;
  }

  /**
   * Check if request is allowed under rate limits
   */
  isAllowed(action: keyof RateLimitLimits = 'api', identifier?: string | null): RateLimitResult {
    const clientId = identifier || this.getClientId();
    const now = Date.now();
    
    // Check if client is blocked
    if (this.blockedIPs.has(clientId)) {
      this.securityLog.log({
        type: 'BLOCKED_REQUEST',
        clientId,
        action,
        reason: 'Client temporarily blocked'
      });
      return {
        allowed: false,
        reason: 'Client temporarily blocked for suspicious activity',
        retryAfter: 300 // 5 minutes
      };
    }

    const limit = this.limits[action] || this.limits.api;
    const key = `${clientId}:${action}`;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const requests = this.requests.get(key)!;
    
    // Remove old requests outside the time window
    const cutoff = now - limit.window;
    const recentRequests = requests.filter(time => time > cutoff);
    
    // Check for burst detection (rapid requests in short time)
    const burstWindow = 10000; // 10 seconds
    const burstCutoff = now - burstWindow;
    const burstRequests = recentRequests.filter(time => time > burstCutoff);
    
    if (burstRequests.length >= (limit.burst || limit.max)) {
      this.handleSuspiciousActivity(clientId, 'BURST_DETECTED', action);
      return {
        allowed: false,
        reason: 'Too many requests in short time',
        retryAfter: Math.ceil(burstWindow / 1000)
      };
    }
    
    // Check main rate limit
    if (recentRequests.length >= limit.max) {
      this.handleSuspiciousActivity(clientId, 'RATE_LIMIT_EXCEEDED', action);
      return {
        allowed: false,
        reason: `Rate limit exceeded: ${limit.max} requests per ${limit.window / 1000} seconds`,
        retryAfter: Math.ceil((recentRequests[0] + limit.window - now) / 1000)
      };
    }
    
    // Request is allowed - record it
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    
    return {
      allowed: true,
      remaining: limit.max - recentRequests.length,
      resetTime: recentRequests[0] + limit.window
    };
  }

  /**
   * Handle suspicious activity detection
   */
  private handleSuspiciousActivity(clientId: string, type: string, action: string): void {
    const key = `${clientId}:${type}`;
    const now = Date.now();
    
    if (!this.suspiciousActivity.has(key)) {
      this.suspiciousActivity.set(key, []);
    }
    
    const incidents = this.suspiciousActivity.get(key)!;
    incidents.push(now);
    
    this.securityLog.log({
      type: 'SUSPICIOUS_ACTIVITY',
      clientId,
      activityType: type,
      action,
      incidentCount: incidents.length
    });
    
    // Progressive blocking based on incident count
    if (incidents.length >= 5) {
      this.blockClient(clientId, 'Multiple security violations');
    } else if (incidents.length >= 3) {
      this.securityLog.log({
        type: 'WARNING',
        clientId,
        message: 'Client approaching block threshold'
      });
    }
  }

  /**
   * Temporarily block a client
   */
  private blockClient(clientId: string, reason: string): void {
    this.blockedIPs.add(clientId);
    
    this.securityLog.log({
      type: 'CLIENT_BLOCKED',
      clientId,
      reason,
      duration: '5 minutes'
    });
    
    // Auto-unblock after 5 minutes
    setTimeout(() => {
      this.blockedIPs.delete(clientId);
      this.securityLog.log({
        type: 'CLIENT_UNBLOCKED',
        clientId,
        reason: 'Block timeout expired'
      });
    }, 5 * 60 * 1000);
  }

  /**
   * Validate file upload
   */
  validateFileUpload(file: File): FileValidationResult {
    const clientId = this.getClientId();
    const uploadLimit = this.limits.upload;
    
    // Check file size
    if (file.size > (uploadLimit.maxSize || 0)) {
      this.securityLog.log({
        type: 'INVALID_UPLOAD',
        clientId,
        reason: 'File too large',
        fileSize: file.size,
        maxSize: uploadLimit.maxSize
      });
      
      return {
        valid: false,
        reason: `File too large. Maximum size: ${(uploadLimit.maxSize || 0) / (1024 * 1024)}MB`
      };
    }
    
    // Check file type
    const allowedTypes = ['.csv', 'text/csv', 'application/vnd.ms-excel'];
    const fileType = file.type || '';
    const fileName = file.name || '';
    
    if (!allowedTypes.some(type => 
      fileType.includes(type) || fileName.toLowerCase().endsWith('.csv')
    )) {
      this.securityLog.log({
        type: 'INVALID_UPLOAD',
        clientId,
        reason: 'Invalid file type',
        fileType,
        fileName
      });
      
      return {
        valid: false,
        reason: 'Only CSV files are allowed'
      };
    }
    
    // Check rate limit for uploads
    const rateLimitResult = this.isAllowed('upload');
    if (!rateLimitResult.allowed) {
      return {
        valid: false,
        reason: rateLimitResult.reason
      };
    }
    
    return {
      valid: true,
      message: 'File upload validation passed'
    };
  }

  /**
   * Clean up old records to prevent memory leaks
   */
  private cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    // Clean up request records
    for (const [key, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(time => now - time < maxAge);
      if (recentRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recentRequests);
      }
    }
    
    // Clean up suspicious activity records
    for (const [key, incidents] of this.suspiciousActivity.entries()) {
      const recentIncidents = incidents.filter(time => now - time < maxAge);
      if (recentIncidents.length === 0) {
        this.suspiciousActivity.delete(key);
      } else {
        this.suspiciousActivity.set(key, recentIncidents);
      }
    }
    
    console.log('🔒 Rate limiter cleanup completed');
  }

  /**
   * Get current rate limit status for debugging
   */
  getStatus(action: keyof RateLimitLimits = 'api', identifier?: string | null): RateLimitStatus {
    const clientId = identifier || this.getClientId();
    const key = `${clientId}:${action}`;
    const requests = this.requests.get(key) || [];
    const limit = this.limits[action] || this.limits.api;
    const now = Date.now();
    
    const recentRequests = requests.filter(time => time > now - limit.window);
    
    return {
      clientId,
      action,
      requestCount: recentRequests.length,
      limit: limit.max,
      remaining: limit.max - recentRequests.length,
      isBlocked: this.blockedIPs.has(clientId),
      nextReset: recentRequests.length > 0 ? new Date(recentRequests[0] + limit.window) : null
    };
  }

  /**
   * Get security event log
   */
  getSecurityLog(): SecurityLogSummary {
    return {
      events: this.securityLog.events.slice(-50), // Last 50 events
      totalEvents: this.securityLog.events.length,
      blockedClients: Array.from(this.blockedIPs),
      activeConnections: this.requests.size
    };
  }

  /**
   * Clean up resources when instance is destroyed
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Create global instance
const globalRateLimiter = new RateLimiter();

// Utility functions for easy integration
export const rateLimitCheck = (action?: keyof RateLimitLimits, identifier?: string | null): RateLimitResult => {
  return globalRateLimiter.isAllowed(action, identifier);
};

export const validateUpload = (file: File): FileValidationResult => {
  return globalRateLimiter.validateFileUpload(file);
};

export const getRateLimitStatus = (action?: keyof RateLimitLimits, identifier?: string | null): RateLimitStatus => {
  return globalRateLimiter.getStatus(action, identifier);
};

export const getSecurityEvents = (): SecurityLogSummary => {
  return globalRateLimiter.getSecurityLog();
};

// Export types for external use
export type {
  RateLimit,
  RateLimitLimits,
  RateLimitResult,
  FileValidationResult,
  SecurityLogEntry,
  RateLimitStatus,
  SecurityLogSummary
};

export default globalRateLimiter;