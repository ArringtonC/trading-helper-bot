import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { GoalSizingConfig } from '../types/goalSizing';
import { OnboardingProgress, PhaseData } from '../types/onboarding';
import { DatabaseService } from '../services/DatabaseService';
import { IndexedDBService } from '../services/IndexedDBService';

interface GoalSizingContextValue {
  config: GoalSizingConfig | null;
  isLoading: boolean;
  onboardingProgress: OnboardingProgress | null;
  currentPhase: number;
  saveConfig: (config: GoalSizingConfig) => Promise<void>;
  loadConfig: () => Promise<GoalSizingConfig | null>;
  saveOnboardingProgress: (phase: number, currentStep: string, completedSteps: string[], phaseData?: PhaseData) => Promise<void>;
  loadOnboardingProgress: () => Promise<OnboardingProgress | null>;
  completeOnboardingPhase: () => Promise<void>;
  saveUserContext: (contextType: string, contextData: any, expiresAt?: string) => Promise<void>;
  loadUserContext: (contextType: string) => Promise<any | null>;
  createBackup: () => Promise<string>;
  restoreFromBackup: (backupId: string) => Promise<void>;
}

const GoalSizingContext = createContext<GoalSizingContextValue | undefined>(undefined);

export const GoalSizingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<GoalSizingConfig | null>(null);
  const [onboardingProgress, setOnboardingProgress] = useState<OnboardingProgress | null>(null);
  const [currentPhase, setCurrentPhase] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [dbService] = useState(() => new DatabaseService());
  const [indexedDBService] = useState(() => new IndexedDBService());

  // Initialize services and load data
  useEffect(() => {
    const initializeServices = async () => {
      try {
        setIsLoading(true);
        
        // Initialize both services
        await dbService.init();
        await indexedDBService.init();
        
        // Load existing data directly from services
        try {
          let loaded = dbService.loadGoalConfig();
          if (!loaded) {
            loaded = await indexedDBService.loadGoalConfig('default');
            if (loaded) {
              dbService.saveGoalConfig(loaded);
            }
          }
          setConfig(loaded);
        } catch (error) {
          console.error('Failed to load goal config:', error);
        }

        try {
          let progress = null;
          try {
            progress = dbService.loadOnboardingProgress('default');
          } catch (dbError) {
            console.warn('SQLite onboarding table not ready, trying IndexedDB:', dbError);
          }
          
          if (!progress) {
            try {
              progress = await indexedDBService.loadOnboardingProgress('default');
              if (progress) {
                // Try to save to SQLite, but don't fail if table doesn't exist yet
                try {
                  dbService.saveOnboardingProgress(
                    'default',
                    progress.phase,
                    progress.currentStep,
                    progress.completedSteps,
                    progress.phaseData
                  );
                } catch (saveError) {
                  console.warn('Could not save onboarding progress to SQLite:', saveError);
                }
              }
            } catch (indexedDBError) {
              console.warn('Failed to load from IndexedDB:', indexedDBError);
            }
          }
          
          if (progress) {
            setOnboardingProgress(progress);
            setCurrentPhase(progress.phase);
          }
        } catch (error) {
          console.error('Failed to load onboarding progress:', error);
        }
        
        // Cleanup expired contexts
        await indexedDBService.cleanupExpiredContexts();
        
      } catch (error) {
        console.error('Failed to initialize Goal Sizing services:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeServices();
  }, []); // No dependencies needed

  const saveConfig = useCallback(async (newConfig: GoalSizingConfig) => {
    try {
      // Save to SQLite (primary storage)
      dbService.saveGoalConfig(newConfig);
      
      // Backup to IndexedDB
      await indexedDBService.saveGoalConfig('default', newConfig);
      
      setConfig(newConfig);
    } catch (error) {
      console.error('Failed to save goal config:', error);
      throw error;
    }
  }, []);

  const loadConfig = useCallback(async (): Promise<GoalSizingConfig | null> => {
    try {
      // Try SQLite first
      let loaded = dbService.loadGoalConfig();
      
      // Fallback to IndexedDB if SQLite fails
      if (!loaded) {
        loaded = await indexedDBService.loadGoalConfig('default');
        
        // If found in IndexedDB, restore to SQLite
        if (loaded) {
          dbService.saveGoalConfig(loaded);
        }
      }
      
      setConfig(loaded);
      return loaded;
    } catch (error) {
      console.error('Failed to load goal config:', error);
      return null;
    }
  }, []);

  const saveOnboardingProgress = useCallback(async (
    phase: number, 
    currentStep: string, 
    completedSteps: string[], 
    phaseData?: PhaseData
  ) => {
    try {
      // Save to SQLite
      dbService.saveOnboardingProgress('default', phase, currentStep, completedSteps, phaseData);
      
      // Backup to IndexedDB
      const progressData = {
        phase,
        currentStep,
        completedSteps,
        phaseData,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null
      };
      await indexedDBService.saveOnboardingProgress('default', progressData);
      
      setOnboardingProgress(progressData);
      setCurrentPhase(phase);
    } catch (error) {
      console.error('Failed to save onboarding progress:', error);
      throw error;
    }
  }, []);

  const loadOnboardingProgress = useCallback(async (): Promise<OnboardingProgress | null> => {
    try {
      // Try SQLite first
      let progress = dbService.loadOnboardingProgress('default');
      
      // Fallback to IndexedDB
      if (!progress) {
        progress = await indexedDBService.loadOnboardingProgress('default');
        
        // If found in IndexedDB, restore to SQLite
        if (progress) {
          dbService.saveOnboardingProgress(
            'default',
            progress.phase,
            progress.currentStep,
            progress.completedSteps,
            progress.phaseData
          );
        }
      }
      
      if (progress) {
        setOnboardingProgress(progress);
        setCurrentPhase(progress.phase);
      }
      
      return progress;
    } catch (error) {
      console.error('Failed to load onboarding progress:', error);
      return null;
    }
  }, []);

  const completeOnboardingPhase = useCallback(async () => {
    try {
      // Mark phase as complete in SQLite
      dbService.completeOnboardingPhase('default');
      
      // Update IndexedDB
      if (onboardingProgress) {
        const updatedProgress = {
          ...onboardingProgress,
          completedAt: new Date().toISOString()
        };
        await indexedDBService.saveOnboardingProgress('default', updatedProgress);
        setOnboardingProgress(updatedProgress);
      }
    } catch (error) {
      console.error('Failed to complete onboarding phase:', error);
      throw error;
    }
  }, [onboardingProgress]);

  const saveUserContext = useCallback(async (
    contextType: string, 
    contextData: any, 
    expiresAt?: string
  ) => {
    try {
      // Save to SQLite
      dbService.saveUserContext('default', contextType, contextData, expiresAt);
      
      // Backup to IndexedDB
      await indexedDBService.saveUserContext('default', contextType, contextData, expiresAt);
    } catch (error) {
      console.error('Failed to save user context:', error);
      throw error;
    }
  }, []);

  const loadUserContext = useCallback(async (contextType: string): Promise<any | null> => {
    try {
      // Try SQLite first
      let context = dbService.loadUserContext('default', contextType);
      
      // Fallback to IndexedDB
      if (!context) {
        context = await indexedDBService.loadUserContext('default', contextType);
        
        // If found in IndexedDB, restore to SQLite
        if (context) {
          dbService.saveUserContext('default', contextType, context);
        }
      }
      
      return context;
    } catch (error) {
      console.error('Failed to load user context:', error);
      return null;
    }
  }, []);

  const createBackup = useCallback(async (): Promise<string> => {
    try {
      // Create comprehensive backup data
      const backupData = {
        goalConfig: config,
        onboardingProgress: onboardingProgress,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      
      // Create backup in IndexedDB
      const backupId = await indexedDBService.createBackup(backupData, 'full');
      
      // Save backup metadata in SQLite
      const checksum = await calculateChecksum(backupData);
      const size = JSON.stringify(backupData).length;
      dbService.saveBackupMetadata('default', 'full', size, checksum);
      
      return backupId;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }, [config, onboardingProgress, dbService, indexedDBService]);

  const restoreFromBackup = useCallback(async (backupId: string): Promise<void> => {
    try {
      // Restore from IndexedDB
      const backupData = await indexedDBService.restoreBackup(backupId);
      
      // Restore goal config
      if (backupData.goalConfig) {
        dbService.saveGoalConfig(backupData.goalConfig);
        setConfig(backupData.goalConfig);
      }
      
      // Restore onboarding progress
      if (backupData.onboardingProgress) {
        const progress = backupData.onboardingProgress;
        dbService.saveOnboardingProgress(
          'default',
          progress.phase,
          progress.currentStep,
          progress.completedSteps,
          progress.phaseData
        );
        setOnboardingProgress(progress);
        setCurrentPhase(progress.phase);
      }
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      throw error;
    }
  }, [dbService, indexedDBService]);

  // Utility function for checksum calculation
  const calculateChecksum = async (data: any): Promise<string> => {
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  return (
    <GoalSizingContext.Provider value={{ 
      config, 
      isLoading, 
      onboardingProgress,
      currentPhase,
      saveConfig, 
      loadConfig,
      saveOnboardingProgress,
      loadOnboardingProgress,
      completeOnboardingPhase,
      saveUserContext,
      loadUserContext,
      createBackup,
      restoreFromBackup
    }}>
      {children}
    </GoalSizingContext.Provider>
  );
};

export const useGoalSizing = () => {
  const context = useContext(GoalSizingContext);
  if (context === undefined) {
    throw new Error('useGoalSizing must be used within a GoalSizingProvider');
  }
  return context;
}; 