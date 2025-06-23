// Trading Helper Bot - Data Encryption at Rest
// Created for Task 38.5: Conduct Dependency Vulnerability Scanning and Enforce Data Encryption at Rest

/**
 * Data Encryption Utility for Trading Helper Bot
 * Implements AES-256-GCM encryption for sensitive data at rest
 */

// Type definitions
interface EncryptionPayload {
  data: any;
  timestamp: number;
  expiration: number | null;
  checksum: string;
}

interface SecureStorageOptions {
  ttl?: number; // Time to live in milliseconds
}

interface SecurityEvent {
  type: string;
  message: string;
  timestamp: string;
  metadata: Record<string, any>;
  component: string;
}

interface FormData {
  [key: string]: any;
}

// Simple polyfill for crypto operations (browser environment)
class DataEncryption {
  private algorithm: string = 'AES-GCM';
  private keyLength: number = 256;
  private ivLength: number = 12; // GCM standard
  private saltLength: number = 32;
  private tagLength: number = 16;
  private encryptionKey: CryptoKey | string | null = null;

  constructor() {
    // Initialize encryption key (in production, use a secure key management service)
    this.initializeKey();
  }

  /**
   * Initialize encryption key from environment or generate
   */
  private async initializeKey(): Promise<void> {
    try {
      // In production, this should come from a secure key management service
      const keyString = localStorage.getItem('app_encryption_key') || 
                       process.env.REACT_APP_ENCRYPTION_KEY ||
                       this.generateSecureKey();
      
      if (!localStorage.getItem('app_encryption_key')) {
        localStorage.setItem('app_encryption_key', keyString);
      }
      
      this.encryptionKey = await this.deriveKey(keyString);
    } catch (error) {
      console.error('Failed to initialize encryption key:', error);
      throw new Error('Encryption initialization failed');
    }
  }

  /**
   * Generate a secure random key
   */
  private generateSecureKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < 64; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  }

  /**
   * Derive encryption key from string
   */
  private async deriveKey(keyString: string): Promise<CryptoKey | string> {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(keyString),
        'PBKDF2',
        false,
        ['deriveKey']
      );

      return await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode('trading-helper-bot-salt'),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    } else {
      // Fallback for environments without WebCrypto
      return keyString;
    }
  }

  /**
   * Encrypt sensitive data
   */
  async encrypt(data: any): Promise<string | null> {
    try {
      if (!data) return null;
      
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(JSON.stringify(data));
      
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle && this.encryptionKey instanceof CryptoKey) {
        const iv = window.crypto.getRandomValues(new Uint8Array(this.ivLength));
        
        const encryptedData = await window.crypto.subtle.encrypt(
          {
            name: 'AES-GCM',
            iv: iv
          },
          this.encryptionKey,
          dataBuffer
        );

        // Combine IV and encrypted data
        const combined = new Uint8Array(iv.length + encryptedData.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encryptedData), iv.length);

        return this.arrayBufferToBase64(combined.buffer);
      } else {
        // Fallback: Basic Base64 encoding (not secure, for development only)
        console.warn('WebCrypto not available - using fallback encoding');
        return btoa(JSON.stringify(data));
      }
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Data encryption failed');
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decrypt(encryptedData: string): Promise<any> {
    try {
      if (!encryptedData) return null;
      
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle && this.encryptionKey instanceof CryptoKey) {
        const combined = this.base64ToArrayBuffer(encryptedData);
        const iv = combined.slice(0, this.ivLength);
        const data = combined.slice(this.ivLength);

        const decryptedData = await window.crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv: iv
          },
          this.encryptionKey,
          data
        );

        const decoder = new TextDecoder();
        const jsonString = decoder.decode(decryptedData);
        return JSON.parse(jsonString);
      } else {
        // Fallback: Basic Base64 decoding (not secure, for development only)
        console.warn('WebCrypto not available - using fallback decoding');
        return JSON.parse(atob(encryptedData));
      }
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Data decryption failed');
    }
  }

  /**
   * Securely store sensitive data in localStorage with encryption
   */
  async setSecureItem(key: string, data: any, options: SecureStorageOptions = {}): Promise<boolean> {
    try {
      const timestamp = Date.now();
      const expirationTime = options.ttl ? timestamp + options.ttl : null;
      
      const payload: EncryptionPayload = {
        data: data,
        timestamp: timestamp,
        expiration: expirationTime,
        checksum: this.calculateChecksum(data)
      };

      const encryptedPayload = await this.encrypt(payload);
      if (encryptedPayload) {
        localStorage.setItem(`secure_${key}`, encryptedPayload);
      }
      
      // Log security event
      this.logSecurityEvent('SECURE_STORAGE', 'Data encrypted and stored', { key });
      
      return true;
    } catch (error) {
      console.error('Secure storage failed:', error);
      this.logSecurityEvent('SECURE_STORAGE_ERROR', 'Failed to store encrypted data', { key, error: (error as Error).message });
      return false;
    }
  }

  /**
   * Retrieve and decrypt sensitive data from localStorage
   */
  async getSecureItem(key: string): Promise<any> {
    try {
      const encryptedData = localStorage.getItem(`secure_${key}`);
      if (!encryptedData) return null;

      const payload: EncryptionPayload = await this.decrypt(encryptedData);
      if (!payload) return null;

      // Check expiration
      if (payload.expiration && Date.now() > payload.expiration) {
        this.removeSecureItem(key);
        this.logSecurityEvent('SECURE_STORAGE_EXPIRED', 'Encrypted data expired', { key });
        return null;
      }

      // Verify checksum
      if (payload.checksum !== this.calculateChecksum(payload.data)) {
        this.logSecurityEvent('SECURE_STORAGE_INTEGRITY', 'Data integrity check failed', { key });
        throw new Error('Data integrity check failed');
      }

      this.logSecurityEvent('SECURE_STORAGE', 'Data decrypted and retrieved', { key });
      return payload.data;
    } catch (error) {
      console.error('Secure retrieval failed:', error);
      this.logSecurityEvent('SECURE_STORAGE_ERROR', 'Failed to retrieve encrypted data', { key, error: (error as Error).message });
      return null;
    }
  }

  /**
   * Remove secure item from localStorage
   */
  removeSecureItem(key: string): void {
    localStorage.removeItem(`secure_${key}`);
    this.logSecurityEvent('SECURE_STORAGE', 'Encrypted data removed', { key });
  }

  /**
   * Calculate simple checksum for data integrity
   */
  private calculateChecksum(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Encrypt sensitive form data before transmission
   */
  async encryptFormData(formData: FormData): Promise<FormData> {
    const sensitiveFields = [
      'password', 'token', 'api_key', 'secret', 'private_key',
      'credit_card', 'ssn', 'account_number', 'routing_number'
    ];

    const encrypted = { ...formData };
    
    for (const field of sensitiveFields) {
      if (encrypted[field]) {
        encrypted[field] = await this.encrypt(encrypted[field]);
      }
    }

    return encrypted;
  }

  /**
   * Utility functions for ArrayBuffer/Base64 conversion
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Log security events
   */
  private logSecurityEvent(type: string, message: string, metadata: Record<string, any> = {}): void {
    const event: SecurityEvent = {
      type,
      message,
      timestamp: new Date().toISOString(),
      metadata,
      component: 'DataEncryption'
    };

    // Store security events (limit to last 100)
    const events: SecurityEvent[] = JSON.parse(localStorage.getItem('security_events') || '[]');
    events.push(event);
    
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }
    
    localStorage.setItem('security_events', JSON.stringify(events));
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 Security Event:', event);
    }
  }

  /**
   * Get security events for monitoring
   */
  getSecurityEvents(): SecurityEvent[] {
    return JSON.parse(localStorage.getItem('security_events') || '[]');
  }

  /**
   * Clear old security events
   */
  clearOldSecurityEvents(maxAge: number = 7 * 24 * 60 * 60 * 1000): void { // 7 days
    const events = this.getSecurityEvents();
    const cutoff = Date.now() - maxAge;
    
    const filtered = events.filter(event => {
      const eventTime = new Date(event.timestamp).getTime();
      return eventTime > cutoff;
    });
    
    localStorage.setItem('security_events', JSON.stringify(filtered));
  }
}

// Create singleton instance
const dataEncryption = new DataEncryption();

// Export utility functions
export const encryptData = (data: any): Promise<string | null> => dataEncryption.encrypt(data);
export const decryptData = (encryptedData: string): Promise<any> => dataEncryption.decrypt(encryptedData);
export const setSecureItem = (key: string, data: any, options?: SecureStorageOptions): Promise<boolean> => dataEncryption.setSecureItem(key, data, options);
export const getSecureItem = (key: string): Promise<any> => dataEncryption.getSecureItem(key);
export const removeSecureItem = (key: string): void => dataEncryption.removeSecureItem(key);
export const encryptFormData = (formData: FormData): Promise<FormData> => dataEncryption.encryptFormData(formData);
export const getSecurityEvents = (): SecurityEvent[] => dataEncryption.getSecurityEvents();
export const clearOldSecurityEvents = (maxAge?: number): void => dataEncryption.clearOldSecurityEvents(maxAge);

// Export types for external use
export type {
  EncryptionPayload,
  SecureStorageOptions,
  SecurityEvent,
  FormData
};

export default dataEncryption;