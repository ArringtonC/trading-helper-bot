// Advanced Backup Service - Task 28.5
// Provides enhanced backup/restore with scheduling, versioning, and security

import { DatabaseService } from './DatabaseService';
import { IndexedDBService } from './IndexedDBService';
import { GoalSizingConfig } from '../types/goalSizing';
import { OnboardingProgress, BackupMetadata } from '../types/onboarding';

export interface AdvancedBackupConfig {
  enabled: boolean;
  schedule: 'daily' | 'weekly' | 'manual';
  maxBackups: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  encryptionKey?: string;
}

export interface BackupVersion {
  id: string;
  version: number;
  timestamp: string;
  type: 'full' | 'incremental';
  size: number;
  compressed: boolean;
  encrypted: boolean;
  checksum: string;
  tags: string[];
  description?: string;
}

export interface RestoreOptions {
  includeGoalConfig: boolean;
  includeOnboardingProgress: boolean;
  includeUserContext: boolean;
  includeFeedback: boolean;
  validateBeforeRestore: boolean;
  createRestorePoint: boolean;
}

export interface BackupCompressionResult {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  data: string;
}

export class AdvancedBackupService {
  private dbService: DatabaseService;
  private indexedDBService: IndexedDBService;
  private config: AdvancedBackupConfig;
  private schedulerTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.dbService = new DatabaseService();
    this.indexedDBService = new IndexedDBService();
    this.config = this.loadConfig();
  }

  async init(): Promise<void> {
    await this.dbService.init();
    await this.indexedDBService.init();
    
    if (this.config.enabled) {
      this.startScheduler();
    }
  }

  // Configuration Management
  private loadConfig(): AdvancedBackupConfig {
    const savedConfig = localStorage.getItem('advancedBackupConfig');
    return savedConfig ? JSON.parse(savedConfig) : {
      enabled: true,
      schedule: 'daily',
      maxBackups: 10,
      compressionEnabled: true,
      encryptionEnabled: false
    };
  }

  updateConfig(newConfig: Partial<AdvancedBackupConfig>): void {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem('advancedBackupConfig', JSON.stringify(this.config));
    
    if (this.config.enabled) {
      this.startScheduler();
    } else {
      this.stopScheduler();
    }
  }

  // Automated Scheduling
  private startScheduler(): void {
    this.stopScheduler();
    
    const interval = this.config.schedule === 'daily' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    
    this.schedulerTimer = setInterval(async () => {
      try {
        await this.createScheduledBackup();
      } catch (error) {
        console.error('Scheduled backup failed:', error);
      }
    }, interval);
  }

  private stopScheduler(): void {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  private async createScheduledBackup(): Promise<string> {
    const now = new Date();
    const tags = ['scheduled', this.config.schedule];
    
    // Determine backup type (full weekly, incremental daily)
    const isWeekly = this.config.schedule === 'weekly' || now.getDay() === 0;
    const type = isWeekly ? 'full' : 'incremental';
    
    return this.createAdvancedBackup({
      type,
      tags,
      description: `Scheduled ${type} backup - ${now.toISOString()}`
    });
  }

  // Enhanced Backup Creation
  async createAdvancedBackup(options: {
    type?: 'full' | 'incremental';
    tags?: string[];
    description?: string;
    includeAnalytics?: boolean;
  } = {}): Promise<string> {
    const {
      type = 'full',
      tags = [],
      description,
      includeAnalytics = true
    } = options;

    // Gather backup data
    const backupData = await this.gatherBackupData(type, includeAnalytics);
    
    // Compress if enabled
    let processedData = JSON.stringify(backupData);
    let compressed = false;
    let originalSize = processedData.length;
    
    if (this.config.compressionEnabled) {
      const compressionResult = await this.compressData(processedData);
      processedData = compressionResult.data;
      compressed = true;
    }

    // Encrypt if enabled
    let encrypted = false;
    if (this.config.encryptionEnabled && this.config.encryptionKey) {
      processedData = await this.encryptData(processedData, this.config.encryptionKey);
      encrypted = true;
    }

    // Calculate checksum
    const checksum = await this.calculateChecksum(processedData);

    // Create backup version
    const version = await this.getNextBackupVersion();
    const backupVersion: BackupVersion = {
      id: `backup_v${version}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      version,
      timestamp: new Date().toISOString(),
      type,
      size: processedData.length,
      compressed,
      encrypted,
      checksum,
      tags: [...tags, type],
      description
    };

    // Store in IndexedDB
    await this.indexedDBService.createBackup({
      ...backupVersion,
      data: processedData
    }, type);

    // Cleanup old backups
    await this.cleanupOldBackups();

    return backupVersion.id;
  }

  private async gatherBackupData(type: 'full' | 'incremental', includeAnalytics: boolean): Promise<any> {
    const data: any = {
      metadata: {
        version: '2.0',
        timestamp: new Date().toISOString(),
        type,
        includeAnalytics
      }
    };

    if (type === 'full') {
      // Full backup includes everything
      data.goalConfig = this.dbService.loadGoalConfig();
      data.onboardingProgress = this.dbService.loadOnboardingProgress();
      data.userContext = await this.getAllUserContext();
      data.goalImports = await this.getGoalImports();
      data.planRealityAnalysis = await this.getLatestPlanRealityAnalysis();
      
      if (includeAnalytics) {
        data.analytics = await this.gatherAnalyticsData();
      }
    } else {
      // Incremental backup includes only recent changes
      const lastBackup = await this.getLastBackupTimestamp();
      data.goalConfig = this.dbService.loadGoalConfig();
      data.recentContext = await this.getRecentUserContext(lastBackup);
      data.recentAnalysis = await this.getLatestPlanRealityAnalysis();
    }

    return data;
  }

  // Backup Compression
  private async compressData(data: string): Promise<BackupCompressionResult> {
    // Simple compression using browser's compression stream if available
    const originalSize = data.length;
    
    try {
      if (typeof CompressionStream !== 'undefined') {
        const stream = new CompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(new TextEncoder().encode(data));
        writer.close();
        
        const chunks: Uint8Array[] = [];
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }
        
        const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          compressed.set(chunk, offset);
          offset += chunk.length;
        }
        
        // Convert to string safely
        const compressedArray = Array.from(compressed);
        const compressedData = btoa(String.fromCharCode.apply(null, compressedArray));
        
        return {
          originalSize,
          compressedSize: compressedData.length,
          compressionRatio: compressedData.length / originalSize,
          data: compressedData
        };
      }
    } catch (error) {
      console.warn('Compression failed, falling back to uncompressed:', error);
    }
    
    // Fallback: no compression
    return {
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      data
    };
  }

  private async decompressData(compressedData: string): Promise<string> {
    try {
      if (typeof DecompressionStream !== 'undefined') {
        const compressed = Uint8Array.from(atob(compressedData), c => c.charCodeAt(0));
        const stream = new DecompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(compressed);
        writer.close();
        
        const chunks: Uint8Array[] = [];
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }
        
        const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          decompressed.set(chunk, offset);
          offset += chunk.length;
        }
        
        return new TextDecoder().decode(decompressed);
      }
    } catch (error) {
      console.warn('Decompression failed, assuming uncompressed:', error);
    }
    
    return compressedData;
  }

  // Backup Encryption (Simple implementation)
  private async encryptData(data: string, key: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key.padEnd(32, '0').slice(0, 32));
    const dataBuffer = encoder.encode(data);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      dataBuffer
    );
    
    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...Array.from(result)));
  }

  private async decryptData(encryptedData: string, key: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key.padEnd(32, '0').slice(0, 32));
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    const dataBuffer = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const iv = dataBuffer.slice(0, 12);
    const encrypted = dataBuffer.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  }

  // Enhanced Restore Capabilities
  async restoreFromAdvancedBackup(
    backupId: string, 
    options: RestoreOptions
  ): Promise<void> {
    // Create restore point if requested
    if (options.createRestorePoint) {
      await this.createAdvancedBackup({
        tags: ['restore-point'],
        description: `Pre-restore backup before restoring ${backupId}`
      });
    }

    // Get backup data
    const backupData = await this.indexedDBService.restoreBackup(backupId);
    const versions = await this.listBackupVersions();
    const backupVersion = versions.find(v => v.id === backupId);
    
    if (!backupVersion) {
      throw new Error('Backup version not found');
    }

    // Validate backup if requested
    if (options.validateBeforeRestore) {
      await this.validateBackup(backupData, backupVersion);
    }

    // Decrypt if needed
    let processedData = backupData.data;
    if (backupVersion.encrypted && this.config.encryptionKey) {
      processedData = await this.decryptData(processedData, this.config.encryptionKey);
    }

    // Decompress if needed
    if (backupVersion.compressed) {
      processedData = await this.decompressData(processedData);
    }

    const restoredData = JSON.parse(processedData);

    // Selective restore based on options
    if (options.includeGoalConfig && restoredData.goalConfig) {
      this.dbService.saveGoalConfig(restoredData.goalConfig);
    }

    if (options.includeOnboardingProgress && restoredData.onboardingProgress) {
      const progress = restoredData.onboardingProgress;
      this.dbService.saveOnboardingProgress(
        'default',
        progress.phase,
        progress.currentStep,
        progress.completedSteps,
        progress.phaseData
      );
    }

    if (options.includeUserContext && restoredData.userContext) {
      await this.restoreUserContext(restoredData.userContext);
    }

    if (options.includeFeedback && restoredData.analytics) {
      await this.restoreAnalyticsData(restoredData.analytics);
    }
  }

  // Backup Management
  async listBackupVersions(): Promise<BackupVersion[]> {
    const backups = await this.indexedDBService.listBackups();
    return backups.map((backup, index) => ({
      id: `backup_${index}_${backup.timestamp}`,
      version: index + 1,
      timestamp: backup.timestamp,
      type: backup.backupType as 'full' | 'incremental',
      size: backup.size,
      compressed: false, // We'll need to track this
      encrypted: false, // We'll need to track this
      checksum: backup.checksum,
      tags: [], // We'll need to track this
      description: undefined
    }));
  }

  async deleteBackupVersion(backupId: string): Promise<void> {
    await this.indexedDBService.deleteBackup(backupId);
  }

  private async cleanupOldBackups(): Promise<void> {
    const versions = await this.listBackupVersions();
    if (versions.length > this.config.maxBackups) {
      const sorted = versions.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const toDelete = sorted.slice(0, versions.length - this.config.maxBackups);
      
      for (const version of toDelete) {
        await this.deleteBackupVersion(version.id);
      }
    }
  }

  // Utility Methods
  private async calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async getNextBackupVersion(): Promise<number> {
    const versions = await this.listBackupVersions();
    return Math.max(0, ...versions.map(v => v.version)) + 1;
  }

  private async validateBackup(backupData: any, version: BackupVersion): Promise<void> {
    // Verify checksum
    const calculatedChecksum = await this.calculateChecksum(backupData.data);
    if (calculatedChecksum !== version.checksum) {
      throw new Error('Backup validation failed: checksum mismatch');
    }

    // Verify data structure
    try {
      let processedData = backupData.data;
      
      if (version.encrypted && this.config.encryptionKey) {
        processedData = await this.decryptData(processedData, this.config.encryptionKey);
      }
      
      if (version.compressed) {
        processedData = await this.decompressData(processedData);
      }
      
      const parsed = JSON.parse(processedData);
      
      if (!parsed.metadata || !parsed.metadata.version) {
        throw new Error('Invalid backup format');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Backup validation failed: ${errorMessage}`);
    }
  }

  // Helper methods (placeholders for full implementation)
  private async getAllUserContext(): Promise<any[]> {
    // Implementation would gather all user context from database
    return [];
  }

  private async getRecentUserContext(since: string): Promise<any[]> {
    // Implementation would gather recent user context
    return [];
  }

  private async getLastBackupTimestamp(): Promise<string> {
    const versions = await this.listBackupVersions();
    if (versions.length === 0) return new Date(0).toISOString();
    
    const latest = versions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    return latest.timestamp;
  }

  private async gatherAnalyticsData(): Promise<any> {
    // Implementation would gather analytics data
    return {};
  }

  private async restoreUserContext(contextData: any[]): Promise<void> {
    // Implementation would restore user context
  }

  private async restoreAnalyticsData(analyticsData: any): Promise<void> {
    // Implementation would restore analytics data
  }

  private async getGoalImports(): Promise<any[]> {
    // Implementation would get goal imports from database
    // For now, return empty array as placeholder
    return [];
  }

  private async getLatestPlanRealityAnalysis(): Promise<any> {
    // Implementation would get latest plan vs reality analysis
    // For now, return empty object as placeholder
    return {};
  }
} 