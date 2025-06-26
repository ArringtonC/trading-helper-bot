// IndexedDB Service for Backup and Restore - Task 28.1
// Provides robust storage with backup/restore mechanisms for web environments

import { BackupMetadata } from '../types/onboarding';

interface IndexedDBBackup {
  id: string;
  timestamp: string;
  data: any;
  checksum: string;
  size: number;
  type: 'full' | 'incremental';
}

export class IndexedDBService {
  private dbName = 'TradingHelperBot';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Backup store for SQLite database backups
        if (!db.objectStoreNames.contains('backups')) {
          const backupStore = db.createObjectStore('backups', { keyPath: 'id' });
          backupStore.createIndex('timestamp', 'timestamp', { unique: false });
          backupStore.createIndex('type', 'type', { unique: false });
        }

        // Goal configurations store
        if (!db.objectStoreNames.contains('goalConfigs')) {
          const goalStore = db.createObjectStore('goalConfigs', { keyPath: 'id', autoIncrement: true });
          goalStore.createIndex('userId', 'userId', { unique: false });
          goalStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Onboarding progress store
        if (!db.objectStoreNames.contains('onboardingProgress')) {
          const onboardingStore = db.createObjectStore('onboardingProgress', { keyPath: 'userId' });
          onboardingStore.createIndex('phase', 'phase', { unique: false });
        }

        // User context store
        if (!db.objectStoreNames.contains('userContext')) {
          const contextStore = db.createObjectStore('userContext', { keyPath: ['userId', 'contextType'] });
          contextStore.createIndex('expiresAt', 'expiresAt', { unique: false });
        }
      };
    });
  }

  // Backup Operations
  async createBackup(data: any, type: 'full' | 'incremental' = 'full'): Promise<string> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const backup: IndexedDBBackup = {
      id: `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      data: data,
      checksum: await this.calculateChecksum(data),
      size: JSON.stringify(data).length,
      type: type
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['backups'], 'readwrite');
      const store = transaction.objectStore('backups');
      const request = store.add(backup);

      request.onsuccess = () => {
        resolve(backup.id);
      };

      request.onerror = () => {
        reject(new Error('Failed to create backup'));
      };
    });
  }

  async restoreBackup(backupId: string): Promise<any> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['backups'], 'readonly');
      const store = transaction.objectStore('backups');
      const request = store.get(backupId);

      request.onsuccess = async () => {
        const backup = request.result as IndexedDBBackup;
        if (!backup) {
          reject(new Error('Backup not found'));
          return;
        }

        // Verify checksum
        const calculatedChecksum = await this.calculateChecksum(backup.data);
        if (calculatedChecksum !== backup.checksum) {
          reject(new Error('Backup data integrity check failed'));
          return;
        }

        resolve(backup.data);
      };

      request.onerror = () => {
        reject(new Error('Failed to restore backup'));
      };
    });
  }

  async listBackups(): Promise<BackupMetadata[]> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['backups'], 'readonly');
      const store = transaction.objectStore('backups');
      const request = store.getAll();

      request.onsuccess = () => {
        const backups = request.result as IndexedDBBackup[];
        const metadata = backups.map(backup => ({
          backupType: backup.type,
          timestamp: backup.timestamp,
          size: backup.size,
          checksum: backup.checksum,
          status: 'active'
        }));
        resolve(metadata);
      };

      request.onerror = () => {
        reject(new Error('Failed to list backups'));
      };
    });
  }

  async deleteBackup(backupId: string): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['backups'], 'readwrite');
      const store = transaction.objectStore('backups');
      const request = store.delete(backupId);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to delete backup'));
      };
    });
  }

  // Goal Configuration Operations
  async saveGoalConfig(userId: string, config: any): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const goalConfig = {
      userId: userId,
      config: config,
      timestamp: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['goalConfigs'], 'readwrite');
      const store = transaction.objectStore('goalConfigs');
      const request = store.add(goalConfig);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to save goal config'));
      };
    });
  }

  async loadGoalConfig(userId: string): Promise<any | null> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['goalConfigs'], 'readonly');
      const store = transaction.objectStore('goalConfigs');
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => {
        const configs = request.result;
        if (configs.length === 0) {
          resolve(null);
          return;
        }

        // Return the most recent config
        const latestConfig = configs.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];
        
        resolve(latestConfig.config);
      };

      request.onerror = () => {
        reject(new Error('Failed to load goal config'));
      };
    });
  }

  // Onboarding Progress Operations
  async saveOnboardingProgress(userId: string, progress: any): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const progressData = {
      userId: userId,
      ...progress,
      timestamp: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['onboardingProgress'], 'readwrite');
      const store = transaction.objectStore('onboardingProgress');
      const request = store.put(progressData);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to save onboarding progress'));
      };
    });
  }

  async loadOnboardingProgress(userId: string): Promise<any | null> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['onboardingProgress'], 'readonly');
      const store = transaction.objectStore('onboardingProgress');
      const request = store.get(userId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error('Failed to load onboarding progress'));
      };
    });
  }

  // User Context Operations
  async saveUserContext(userId: string, contextType: string, contextData: any, expiresAt?: string): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const context = {
      userId: userId,
      contextType: contextType,
      contextData: contextData,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userContext'], 'readwrite');
      const store = transaction.objectStore('userContext');
      const request = store.put(context);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to save user context'));
      };
    });
  }

  async loadUserContext(userId: string, contextType: string): Promise<any | null> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userContext'], 'readonly');
      const store = transaction.objectStore('userContext');
      const request = store.get([userId, contextType]);

      request.onsuccess = () => {
        const context = request.result;
        if (!context) {
          resolve(null);
          return;
        }

        // Check if context has expired
        if (context.expiresAt && new Date(context.expiresAt) < new Date()) {
          // Context expired, delete it and return null
          this.deleteUserContext(userId, contextType);
          resolve(null);
          return;
        }

        resolve(context.contextData);
      };

      request.onerror = () => {
        reject(new Error('Failed to load user context'));
      };
    });
  }

  async deleteUserContext(userId: string, contextType: string): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userContext'], 'readwrite');
      const store = transaction.objectStore('userContext');
      const request = store.delete([userId, contextType]);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to delete user context'));
      };
    });
  }

  // Cleanup expired contexts
  async cleanupExpiredContexts(): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userContext'], 'readwrite');
      const store = transaction.objectStore('userContext');
      const index = store.index('expiresAt');
      const now = new Date().toISOString();
      const range = IDBKeyRange.upperBound(now);
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to cleanup expired contexts'));
      };
    });
  }

  // Utility Methods
  private async calculateChecksum(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async getStorageUsage(): Promise<{ used: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    return { used: 0, quota: 0 };
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
} 