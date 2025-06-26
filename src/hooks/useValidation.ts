// Validation Hook - Task 28.2
// Provides real-time validation for Goal Sizing Wizard and onboarding flows

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ValidationService, 
  ValidationResult, 
  BusinessRuleViolation 
} from '../services/ValidationService';
import { GoalSizingConfig } from '../types/goalSizing';
import { OnboardingProgress } from '../types/onboarding';
import { NormalizedTradeData } from '../types/trade';

interface UseValidationOptions {
  validateOnChange?: boolean;
  debounceMs?: number;
  enableBusinessRules?: boolean;
  enableDataConsistency?: boolean;
}

interface ValidationState {
  configValidation: ValidationResult | null;
  onboardingValidation: ValidationResult | null;
  tradeValidation: ValidationResult | null;
  businessViolations: BusinessRuleViolation[];
  consistencyValidation: ValidationResult | null;
  isValidating: boolean;
  lastValidated: Date | null;
}

export const useValidation = (options: UseValidationOptions = {}) => {
  const {
    validateOnChange = true,
    debounceMs = 300,
    enableBusinessRules = true,
    enableDataConsistency = true
  } = options;

  const [validationState, setValidationState] = useState<ValidationState>({
    configValidation: null,
    onboardingValidation: null,
    tradeValidation: null,
    businessViolations: [],
    consistencyValidation: null,
    isValidating: false,
    lastValidated: null
  });

  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Debounced validation function
  const debouncedValidate = useCallback((
    config?: Partial<GoalSizingConfig>,
    onboarding?: Partial<OnboardingProgress>,
    trades?: NormalizedTradeData[]
  ) => {
    setDebounceTimer(prevTimer => {
      if (prevTimer) {
        clearTimeout(prevTimer);
      }

      return setTimeout(() => {
        validateAll(config, onboarding, trades);
      }, debounceMs);
    });
  }, [debounceMs]);

  // Main validation function
  const validateAll = useCallback(async (
    config?: Partial<GoalSizingConfig>,
    onboarding?: Partial<OnboardingProgress>,
    trades?: NormalizedTradeData[]
  ) => {
    setValidationState(prev => ({ ...prev, isValidating: true }));

    try {
      const newState: Partial<ValidationState> = {
        lastValidated: new Date()
      };

      // Validate Goal Sizing Configuration
      if (config) {
        newState.configValidation = ValidationService.validateGoalSizingConfig(config);
      }

      // Validate Onboarding Progress
      if (onboarding) {
        newState.onboardingValidation = ValidationService.validateOnboardingProgress(onboarding);
      }

      // Validate Trade Data
      if (trades) {
        newState.tradeValidation = ValidationService.validateTradeData(trades);
      }

      // Business Rule Validation
      if (enableBusinessRules && config && trades && config.goalType) {
        newState.businessViolations = ValidationService.validateBusinessRules(
          trades, 
          config as GoalSizingConfig
        );
      }

      // Data Consistency Validation
      if (enableDataConsistency && config && trades && config.goalType) {
        newState.consistencyValidation = ValidationService.validateDataConsistency(
          config as GoalSizingConfig,
          trades
        );
      }

      setValidationState(prev => ({
        ...prev,
        ...newState,
        isValidating: false
      }));

    } catch (error) {
      console.error('Validation error:', error);
      setValidationState(prev => ({
        ...prev,
        isValidating: false
      }));
    }
  }, [enableBusinessRules, enableDataConsistency]);

  // Individual validation functions
  const validateConfig = useCallback((config: Partial<GoalSizingConfig>) => {
    const result = ValidationService.validateGoalSizingConfig(config);
    setValidationState(prev => ({
      ...prev,
      configValidation: result,
      lastValidated: new Date()
    }));
    return result;
  }, []);

  const validateOnboarding = useCallback((onboarding: Partial<OnboardingProgress>) => {
    const result = ValidationService.validateOnboardingProgress(onboarding);
    setValidationState(prev => ({
      ...prev,
      onboardingValidation: result,
      lastValidated: new Date()
    }));
    return result;
  }, []);

  const validateTrades = useCallback((trades: NormalizedTradeData[]) => {
    const result = ValidationService.validateTradeData(trades);
    setValidationState(prev => ({
      ...prev,
      tradeValidation: result,
      lastValidated: new Date()
    }));
    return result;
  }, []);

  const validateBusinessRules = useCallback((
    trades: NormalizedTradeData[], 
    config: GoalSizingConfig
  ) => {
    const violations = ValidationService.validateBusinessRules(trades, config);
    setValidationState(prev => ({
      ...prev,
      businessViolations: violations,
      lastValidated: new Date()
    }));
    return violations;
  }, []);

  // Clear validation results
  const clearValidation = useCallback(() => {
    setValidationState({
      configValidation: null,
      onboardingValidation: null,
      tradeValidation: null,
      businessViolations: [],
      consistencyValidation: null,
      isValidating: false,
      lastValidated: null
    });
  }, []);

  // Computed validation summary
  const validationSummary = useMemo(() => {
    const {
      configValidation,
      onboardingValidation,
      tradeValidation,
      businessViolations,
      consistencyValidation
    } = validationState;

    const allErrors = [
      ...(configValidation?.errors || []),
      ...(onboardingValidation?.errors || []),
      ...(tradeValidation?.errors || []),
      ...(consistencyValidation?.errors || [])
    ];

    const allWarnings = [
      ...(configValidation?.warnings || []),
      ...(onboardingValidation?.warnings || []),
      ...(tradeValidation?.warnings || []),
      ...(consistencyValidation?.warnings || [])
    ];

    const allSuggestions = [
      ...(configValidation?.suggestions || []),
      ...(onboardingValidation?.suggestions || []),
      ...(tradeValidation?.suggestions || []),
      ...(consistencyValidation?.suggestions || [])
    ];

    const criticalViolations = businessViolations.filter(v => v.severity === 'critical');
    const highViolations = businessViolations.filter(v => v.severity === 'high');

    return {
      isValid: allErrors.length === 0 && criticalViolations.length === 0,
      hasErrors: allErrors.length > 0,
      hasWarnings: allWarnings.length > 0,
      hasSuggestions: allSuggestions.length > 0,
      hasViolations: businessViolations.length > 0,
      hasCriticalViolations: criticalViolations.length > 0,
      errorCount: allErrors.length,
      warningCount: allWarnings.length,
      suggestionCount: allSuggestions.length,
      violationCount: businessViolations.length,
      criticalViolationCount: criticalViolations.length,
      highViolationCount: highViolations.length,
      allErrors,
      allWarnings,
      allSuggestions,
      criticalViolations,
      highViolations
    };
  }, [validationState]);

  // Field-specific validation
  const validateField = useCallback((
    fieldPath: string,
    value: any,
    context: 'config' | 'onboarding' | 'trade'
  ) => {
    // Create a minimal object with just the field being validated
    const testObject: any = {};
    const pathParts = fieldPath.split('.');
    
    let current = testObject;
    for (let i = 0; i < pathParts.length - 1; i++) {
      current[pathParts[i]] = {};
      current = current[pathParts[i]];
    }
    current[pathParts[pathParts.length - 1]] = value;

    // Validate based on context
    switch (context) {
      case 'config':
        return ValidationService.validateGoalSizingConfig(testObject);
      case 'onboarding':
        return ValidationService.validateOnboardingProgress(testObject);
      case 'trade':
        return ValidationService.validateTradeData([testObject]);
      default:
        return { isValid: true, errors: [], warnings: [], suggestions: [] };
    }
  }, []);

  // Auto-validation effect
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return {
    // Validation state
    ...validationState,
    validationSummary,

    // Validation functions
    validateAll,
    validateConfig,
    validateOnboarding,
    validateTrades,
    validateBusinessRules,
    validateField,
    clearValidation,

    // Debounced validation for real-time feedback
    debouncedValidate: validateOnChange ? debouncedValidate : validateAll,

    // Utility functions
    isFieldValid: (fieldPath: string, context: 'config' | 'onboarding' | 'trade') => {
      const result = validateField(fieldPath, undefined, context);
      return result.isValid;
    },

    getFieldErrors: (fieldPath: string) => {
      const { allErrors } = validationSummary;
      return allErrors.filter(error => error.field === fieldPath);
    },

    getFieldWarnings: (fieldPath: string) => {
      const { allWarnings } = validationSummary;
      return allWarnings.filter(warning => warning.field === fieldPath);
    },

    getFieldSuggestions: (fieldPath: string) => {
      const { allSuggestions } = validationSummary;
      return allSuggestions.filter(suggestion => suggestion.field === fieldPath);
    }
  };
};

// Specialized hooks for specific contexts
export const useConfigValidation = (config?: Partial<GoalSizingConfig>) => {
  const validation = useValidation({ enableBusinessRules: false, enableDataConsistency: false });
  
  useEffect(() => {
    if (config) {
      validation.debouncedValidate(config);
    }
  }, [config, validation.debouncedValidate]);

  return {
    ...validation,
    isConfigValid: validation.validationSummary.isValid,
    configErrors: validation.configValidation?.errors || [],
    configWarnings: validation.configValidation?.warnings || [],
    configSuggestions: validation.configValidation?.suggestions || []
  };
};

export const useOnboardingValidation = (onboarding?: Partial<OnboardingProgress>) => {
  const validation = useValidation({ enableBusinessRules: false, enableDataConsistency: false });
  
  useEffect(() => {
    if (onboarding) {
      validation.debouncedValidate(undefined, onboarding);
    }
  }, [onboarding, validation.debouncedValidate]);

  return {
    ...validation,
    isOnboardingValid: validation.validationSummary.isValid,
    onboardingErrors: validation.onboardingValidation?.errors || [],
    onboardingWarnings: validation.onboardingValidation?.warnings || [],
    onboardingSuggestions: validation.onboardingValidation?.suggestions || []
  };
};

export const useTradeValidation = (
  trades?: NormalizedTradeData[],
  config?: GoalSizingConfig
) => {
  const validation = useValidation();
  
  useEffect(() => {
    if (trades) {
      validation.debouncedValidate(config, undefined, trades);
    }
  }, [trades, config, validation.debouncedValidate]);

  return {
    ...validation,
    isTradeDataValid: validation.validationSummary.isValid,
    tradeErrors: validation.tradeValidation?.errors || [],
    tradeWarnings: validation.tradeValidation?.warnings || [],
    tradeSuggestions: validation.tradeValidation?.suggestions || []
  };
}; 