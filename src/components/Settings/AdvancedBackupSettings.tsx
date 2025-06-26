// Advanced Backup Settings Component - Task 28.5
// Provides UI for enhanced backup management features

import React, { useState, useEffect } from 'react';
import { AdvancedBackupService, AdvancedBackupConfig, BackupVersion, RestoreOptions } from '../../services/AdvancedBackupService';
import { ContinuousImprovementService } from '../../services/ContinuousImprovementService';
import { Button } from '../ui/button';
import { Alert } from '../ui/alert';

interface BackupSettingsProps {
  className?: string;
}

export const AdvancedBackupSettings: React.FC<BackupSettingsProps> = ({ className }) => {
  const [backupService] = useState(() => new AdvancedBackupService());
  const [analyticsService] = useState(() => new ContinuousImprovementService());
  const [config, setConfig] = useState<AdvancedBackupConfig>({
    enabled: true,
    schedule: 'daily',
    maxBackups: 10,
    compressionEnabled: true,
    encryptionEnabled: false
  });
  const [backupVersions, setBackupVersions] = useState<BackupVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showEncryption, setShowEncryption] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState('');
  const [restoreOptions, setRestoreOptions] = useState<RestoreOptions>({
    includeGoalConfig: true,
    includeOnboardingProgress: true,
    includeUserContext: true,
    includeFeedback: false,
    validateBeforeRestore: true,
    createRestorePoint: true
  });

  useEffect(() => {
    const initServices = async () => {
      try {
        await backupService.init();
        await analyticsService.init();
        await loadBackupVersions();
      } catch (error) {
        console.error('Failed to initialize services:', error);
        setMessage({ type: 'error', text: 'Failed to initialize backup services' });
      }
    };

    initServices();
  }, [backupService, analyticsService]);

  const loadBackupVersions = async () => {
    try {
      const versions = await backupService.listBackupVersions();
      setBackupVersions(versions);
    } catch (error) {
      console.error('Failed to load backup versions:', error);
    }
  };

  const handleConfigUpdate = (updates: Partial<AdvancedBackupConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    backupService.updateConfig(newConfig);
    
    // Track configuration change
    analyticsService.trackEvent('backup_config_changed', {
      enabled: newConfig.enabled,
      schedule: newConfig.schedule,
      compressionEnabled: newConfig.compressionEnabled,
      encryptionEnabled: newConfig.encryptionEnabled
    });
  };

  const handleCreateBackup = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const backupId = await backupService.createAdvancedBackup({
        type: 'full',
        tags: ['manual'],
        description: 'Manual backup created by user'
      });
      
      setMessage({ type: 'success', text: `Backup created successfully: ${backupId}` });
      await loadBackupVersions();
      
      // Track manual backup creation
      await analyticsService.trackEvent('manual_backup_created', { backupId });
    } catch (error) {
      console.error('Backup creation failed:', error);
      setMessage({ type: 'error', text: `Backup failed: ${error}` });
      
      // Track backup failure
      await analyticsService.trackError(error as Error, { action: 'create_backup' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    if (!window.confirm('This will restore your data from the selected backup. Are you sure?')) {
      return;
    }

    setIsLoading(true);
    setMessage(null);
    
    try {
      await backupService.restoreFromAdvancedBackup(backupId, restoreOptions);
      setMessage({ type: 'success', text: 'Data restored successfully' });
      
      // Track successful restore
      await analyticsService.trackEvent('backup_restored', {
        backupId,
        restoreOptions
      });
    } catch (error) {
      console.error('Restore failed:', error);
      setMessage({ type: 'error', text: `Restore failed: ${error}` });
      
      // Track restore failure
      await analyticsService.trackError(error as Error, { action: 'restore_backup', backupId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!window.confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      return;
    }

    try {
      await backupService.deleteBackupVersion(backupId);
      setMessage({ type: 'success', text: 'Backup deleted successfully' });
      await loadBackupVersions();
      
      // Track backup deletion
      await analyticsService.trackEvent('backup_deleted', { backupId });
    } catch (error) {
      console.error('Delete failed:', error);
      setMessage({ type: 'error', text: `Delete failed: ${error}` });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Configuration Section */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Backup Configuration</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable Automatic Backups</label>
              <p className="text-sm text-gray-500">Automatically create backups based on your schedule</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => handleConfigUpdate({ enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Backup Schedule</label>
            <select
              value={config.schedule}
              onChange={(e) => handleConfigUpdate({ schedule: e.target.value as 'daily' | 'weekly' | 'manual' })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="manual">Manual Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Backup Versions</label>
            <input
              type="number"
              min="1"
              max="50"
              value={config.maxBackups}
              onChange={(e) => handleConfigUpdate({ maxBackups: parseInt(e.target.value) })}
              className="mt-1 block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">Older backups will be automatically deleted</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable Compression</label>
              <p className="text-sm text-gray-500">Compress backups to save storage space</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.compressionEnabled}
                onChange={(e) => handleConfigUpdate({ compressionEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable Encryption</label>
              <p className="text-sm text-gray-500">Encrypt backups with a password for security</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.encryptionEnabled}
                onChange={(e) => {
                  handleConfigUpdate({ encryptionEnabled: e.target.checked });
                  setShowEncryption(e.target.checked);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {showEncryption && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Encryption Password</label>
              <input
                type="password"
                value={encryptionKey}
                onChange={(e) => {
                  setEncryptionKey(e.target.value);
                  handleConfigUpdate({ encryptionKey: e.target.value });
                }}
                placeholder="Enter a strong password"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-yellow-600 mt-1">⚠️ Remember this password - you'll need it to restore encrypted backups</p>
            </div>
          )}
        </div>
      </div>

      {/* Manual Backup Section */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Manual Backup</h3>
        
        <div className="flex items-center space-x-4">
          <Button
            onClick={handleCreateBackup}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? 'Creating...' : 'Create Backup Now'}
          </Button>
          
          <p className="text-sm text-gray-500">
            Create a full backup of all your goal sizing data
          </p>
        </div>
      </div>

      {/* Restore Options */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Restore Options</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={restoreOptions.includeGoalConfig}
                onChange={(e) => setRestoreOptions(prev => ({ ...prev, includeGoalConfig: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Goal Configuration</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={restoreOptions.includeOnboardingProgress}
                onChange={(e) => setRestoreOptions(prev => ({ ...prev, includeOnboardingProgress: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Onboarding Progress</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={restoreOptions.includeUserContext}
                onChange={(e) => setRestoreOptions(prev => ({ ...prev, includeUserContext: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">User Context</span>
            </label>
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={restoreOptions.includeFeedback}
                onChange={(e) => setRestoreOptions(prev => ({ ...prev, includeFeedback: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Analytics & Feedback</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={restoreOptions.validateBeforeRestore}
                onChange={(e) => setRestoreOptions(prev => ({ ...prev, validateBeforeRestore: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Validate Before Restore</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={restoreOptions.createRestorePoint}
                onChange={(e) => setRestoreOptions(prev => ({ ...prev, createRestorePoint: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Create Restore Point</span>
            </label>
          </div>
        </div>
      </div>

      {/* Backup Versions List */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Backup History</h3>
        
        {backupVersions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No backups found</p>
        ) : (
          <div className="space-y-3">
            {backupVersions.map((backup) => (
              <div key={backup.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-gray-900">
                      Version {backup.version}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      backup.type === 'full' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {backup.type}
                    </span>
                    {backup.compressed && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                        Compressed
                      </span>
                    )}
                    {backup.encrypted && (
                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                        Encrypted
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    <span>{formatDate(backup.timestamp)}</span>
                    <span className="mx-2">•</span>
                    <span>{formatFileSize(backup.size)}</span>
                    {backup.description && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{backup.description}</span>
                      </>
                    )}
                  </div>
                  {backup.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {backup.tags.map((tag) => (
                        <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handleRestoreBackup(backup.id)}
                    disabled={isLoading}
                    variant="outline"
                  >
                    Restore
                  </Button>
                  <Button
                    onClick={() => handleDeleteBackup(backup.id)}
                    disabled={isLoading}
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Messages */}
      {message && (
        <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          <div className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
            {message.text}
          </div>
        </Alert>
      )}
    </div>
  );
}; 