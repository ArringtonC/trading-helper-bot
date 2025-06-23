import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import FeatureIntegrationSystem from '../services/integration/FeatureIntegrationSystem';

/**
 * Integration Context
 * Unified state management for the complete screening-to-trading workflow
 * 
 * Manages state across:
 * - Goal Assessment → Template Matching → Curated Lists → Advanced Screening
 * - Results → Chart Analysis → News Sentiment → Broker Integration → Risk Management
 */

// Types and interfaces
interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  data?: any;
  dependencies?: string[];
}

interface GlobalState {
  userGoals: any;
  accountLevel: string | null;
  templateMatches: any;
  curatedStocks: any;
  screeningResults: any;
  selectedStocks: any[];
  chartAnalysis: Record<string, any>;
  newsSentiment: Record<string, any>;
  riskAssessment: any;
  portfolioData: any;
  sessionId: string | null;
  currentStep?: string;
  workflowProgress?: number;
  workflowSteps?: WorkflowStep[];
}

interface PerformanceMetrics {
  goalAccuracy: number;
  templateMatchScore: number;
  screeningEfficiency: number;
  riskAdjustedReturn: number;
  userSatisfaction: number;
  completionRate: number;
  timeToDecision: number;
}

interface IntegrationStatus {
  charts: 'connected' | 'disconnected' | 'error';
  news: 'connected' | 'disconnected' | 'error';
  broker: 'connected' | 'disconnected' | 'error';
  risk: 'connected' | 'disconnected' | 'error';
  education: 'connected' | 'disconnected' | 'error';
}

interface RealTimeData {
  marketStatus: 'open' | 'closed' | 'pre-market' | 'after-hours';
  lastUpdate: number | null;
  connectionStatus: 'connected' | 'disconnected' | 'error';
}

interface ErrorInfo {
  id: number;
  type: string;
  message: string;
  details?: any;
}

interface IntegrationState {
  integrationSystem: FeatureIntegrationSystem | null;
  isInitialized: boolean;
  currentStep: string;
  workflowProgress: number;
  workflowSteps: WorkflowStep[];
  globalState: GlobalState;
  performanceMetrics: PerformanceMetrics;
  integrationStatus: IntegrationStatus;
  realTimeData: RealTimeData;
  errors: ErrorInfo[];
  loading: boolean;
}

interface IntegrationContextValue extends IntegrationState {
  // Actions
  navigateToStep: (stepId: string, context?: Record<string, any>) => void | undefined;
  updateStepData: (stepId: string, data: any, options?: Record<string, any>) => void;
  executeIntegration: (fromStep: string, toStep: string, data: any) => any;
  getWorkflowStatus: () => any;
  getAvailableNextSteps: (currentStepId: string) => string[];
  restoreWorkflowState: (sessionId: string) => boolean;
  updateGlobalState: (updates: Partial<GlobalState>) => void;
  addPerformanceMetric: (metrics: Partial<PerformanceMetrics>) => void;
  clearError: (errorId: number) => void;
  updateRealTimeData: (data: Partial<RealTimeData>) => void;
  
  // Utility functions
  isStepCompleted: (stepId: string) => boolean;
  getStepData: (stepId: string) => any;
  canNavigateToStep: (stepId: string) => boolean;
  getIntegrationHealth: () => {
    score: number;
    connected: number;
    total: number;
    status: 'healthy' | 'partial' | 'poor';
  };
}

interface IntegrationProviderProps {
  children: ReactNode;
}

// Action interfaces
interface InitializeSystemAction {
  type: 'INITIALIZE_SYSTEM';
  payload: {
    system: FeatureIntegrationSystem;
    workflowSteps: WorkflowStep[];
    globalState: Partial<GlobalState>;
  };
}

interface NavigateToStepAction {
  type: 'NAVIGATE_TO_STEP';
  payload: {
    stepId: string;
  };
}

interface UpdateStepDataAction {
  type: 'UPDATE_STEP_DATA';
  payload: {
    stepId: string;
    data: any;
    status?: WorkflowStep['status'];
    globalStateUpdate?: Partial<GlobalState>;
  };
}

interface SetGlobalStateAction {
  type: 'SET_GLOBAL_STATE';
  payload: Partial<GlobalState>;
}

interface UpdateWorkflowProgressAction {
  type: 'UPDATE_WORKFLOW_PROGRESS';
  payload: {
    progress: number;
  };
}

interface SetIntegrationStatusAction {
  type: 'SET_INTEGRATION_STATUS';
  payload: Partial<IntegrationStatus>;
}

interface AddPerformanceMetricAction {
  type: 'ADD_PERFORMANCE_METRIC';
  payload: Partial<PerformanceMetrics>;
}

interface SetErrorAction {
  type: 'SET_ERROR';
  payload: ErrorInfo;
}

interface ClearErrorAction {
  type: 'CLEAR_ERROR';
  payload: {
    id: number;
  };
}

interface TriggerIntegrationAction {
  type: 'TRIGGER_INTEGRATION';
}

interface UpdateRealTimeDataAction {
  type: 'UPDATE_REAL_TIME_DATA';
  payload: Partial<RealTimeData>;
}

type IntegrationAction = 
  | InitializeSystemAction
  | NavigateToStepAction
  | UpdateStepDataAction
  | SetGlobalStateAction
  | UpdateWorkflowProgressAction
  | SetIntegrationStatusAction
  | AddPerformanceMetricAction
  | SetErrorAction
  | ClearErrorAction
  | TriggerIntegrationAction
  | UpdateRealTimeDataAction;

const IntegrationContext = createContext<IntegrationContextValue | undefined>(undefined);

// Action types for state management
export const INTEGRATION_ACTIONS = {
  INITIALIZE_SYSTEM: 'INITIALIZE_SYSTEM' as const,
  NAVIGATE_TO_STEP: 'NAVIGATE_TO_STEP' as const,
  UPDATE_STEP_DATA: 'UPDATE_STEP_DATA' as const,
  SET_GLOBAL_STATE: 'SET_GLOBAL_STATE' as const,
  UPDATE_WORKFLOW_PROGRESS: 'UPDATE_WORKFLOW_PROGRESS' as const,
  SET_INTEGRATION_STATUS: 'SET_INTEGRATION_STATUS' as const,
  ADD_PERFORMANCE_METRIC: 'ADD_PERFORMANCE_METRIC' as const,
  SET_ERROR: 'SET_ERROR' as const,
  CLEAR_ERROR: 'CLEAR_ERROR' as const,
  TRIGGER_INTEGRATION: 'TRIGGER_INTEGRATION' as const,
  UPDATE_REAL_TIME_DATA: 'UPDATE_REAL_TIME_DATA' as const
};

// Initial state
const initialState: IntegrationState = {
  integrationSystem: null,
  isInitialized: false,
  currentStep: 'goal-assessment',
  workflowProgress: 0,
  workflowSteps: [],
  globalState: {
    userGoals: null,
    accountLevel: null,
    templateMatches: null,
    curatedStocks: null,
    screeningResults: null,
    selectedStocks: [],
    chartAnalysis: {},
    newsSentiment: {},
    riskAssessment: null,
    portfolioData: null,
    sessionId: null
  },
  performanceMetrics: {
    goalAccuracy: 85,
    templateMatchScore: 78,
    screeningEfficiency: 92,
    riskAdjustedReturn: 71,
    userSatisfaction: 88,
    completionRate: 65,
    timeToDecision: 73
  },
  integrationStatus: {
    charts: 'connected',
    news: 'connected',
    broker: 'disconnected',
    risk: 'connected',
    education: 'connected'
  },
  realTimeData: {
    marketStatus: 'open',
    lastUpdate: null,
    connectionStatus: 'connected'
  },
  errors: [],
  loading: false
};

// Reducer function
function integrationReducer(state: IntegrationState, action: IntegrationAction): IntegrationState {
  switch (action.type) {
    case INTEGRATION_ACTIONS.INITIALIZE_SYSTEM:
      return {
        ...state,
        integrationSystem: action.payload.system,
        isInitialized: true,
        workflowSteps: action.payload.workflowSteps,
        globalState: { ...state.globalState, ...action.payload.globalState },
        loading: false
      };

    case INTEGRATION_ACTIONS.NAVIGATE_TO_STEP:
      return {
        ...state,
        currentStep: action.payload.stepId,
        globalState: { ...state.globalState, currentStep: action.payload.stepId }
      };

    case INTEGRATION_ACTIONS.UPDATE_STEP_DATA:
      const updatedSteps = state.workflowSteps.map(step =>
        step.id === action.payload.stepId
          ? { ...step, data: action.payload.data, status: action.payload.status || 'completed' }
          : step
      );
      
      return {
        ...state,
        workflowSteps: updatedSteps,
        globalState: { ...state.globalState, ...action.payload.globalStateUpdate }
      };

    case INTEGRATION_ACTIONS.SET_GLOBAL_STATE:
      return {
        ...state,
        globalState: { ...state.globalState, ...action.payload }
      };

    case INTEGRATION_ACTIONS.UPDATE_WORKFLOW_PROGRESS:
      return {
        ...state,
        workflowProgress: action.payload.progress,
        globalState: { ...state.globalState, workflowProgress: action.payload.progress }
      };

    case INTEGRATION_ACTIONS.SET_INTEGRATION_STATUS:
      return {
        ...state,
        integrationStatus: { ...state.integrationStatus, ...action.payload }
      };

    case INTEGRATION_ACTIONS.ADD_PERFORMANCE_METRIC:
      return {
        ...state,
        performanceMetrics: { ...state.performanceMetrics, ...action.payload }
      };

    case INTEGRATION_ACTIONS.SET_ERROR:
      return {
        ...state,
        errors: [...state.errors, action.payload],
        loading: false
      };

    case INTEGRATION_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        errors: state.errors.filter(error => error.id !== action.payload.id)
      };

    case INTEGRATION_ACTIONS.TRIGGER_INTEGRATION:
      return {
        ...state,
        loading: true
      };

    case INTEGRATION_ACTIONS.UPDATE_REAL_TIME_DATA:
      return {
        ...state,
        realTimeData: { ...state.realTimeData, ...action.payload }
      };

    default:
      return state;
  }
}

// Integration Context Provider
export const IntegrationProvider: React.FC<IntegrationProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(integrationReducer, initialState);

  // Initialize integration system
  useEffect(() => {
    const initializeSystem = async (): Promise<void> => {
      try {
        dispatch({ type: INTEGRATION_ACTIONS.TRIGGER_INTEGRATION });
        
        const integrationSystem = new FeatureIntegrationSystem();
        
        // Setup event listeners
        integrationSystem.on('system-initialized', (event: any) => {
          dispatch({
            type: INTEGRATION_ACTIONS.INITIALIZE_SYSTEM,
            payload: {
              system: integrationSystem,
              workflowSteps: event.workflowSteps,
              globalState: event.globalState
            }
          });
        });

        integrationSystem.on('step-navigation', (event: any) => {
          dispatch({
            type: INTEGRATION_ACTIONS.NAVIGATE_TO_STEP,
            payload: { stepId: event.to }
          });
        });

        integrationSystem.on('step-data-updated', (event: any) => {
          dispatch({
            type: INTEGRATION_ACTIONS.UPDATE_STEP_DATA,
            payload: {
              stepId: event.stepId,
              data: event.data,
              globalStateUpdate: event.globalState
            }
          });
          
          // Update workflow progress
          const completedSteps = event.globalState.workflowSteps?.filter((s: WorkflowStep) => s.status === 'completed').length || 0;
          const totalSteps = event.globalState.workflowSteps?.length || 10;
          const progress = Math.round((completedSteps / totalSteps) * 100);
          
          dispatch({
            type: INTEGRATION_ACTIONS.UPDATE_WORKFLOW_PROGRESS,
            payload: { progress }
          });
        });

        integrationSystem.on('charts-integration', (event: any) => {
          dispatch({
            type: INTEGRATION_ACTIONS.SET_INTEGRATION_STATUS,
            payload: { charts: 'connected' }
          });
        });

        integrationSystem.on('news-integration', (event: any) => {
          dispatch({
            type: INTEGRATION_ACTIONS.SET_INTEGRATION_STATUS,
            payload: { news: 'connected' }
          });
        });

        integrationSystem.on('broker-integration', (event: any) => {
          dispatch({
            type: INTEGRATION_ACTIONS.SET_INTEGRATION_STATUS,
            payload: { broker: 'connected' }
          });
        });

        integrationSystem.on('integration-error', (event: any) => {
          dispatch({
            type: INTEGRATION_ACTIONS.SET_ERROR,
            payload: {
              id: Date.now(),
              type: 'integration',
              message: event.error,
              details: event
            }
          });
        });

        // Initialize the system
        await integrationSystem.initialize();
        
      } catch (error) {
        dispatch({
          type: INTEGRATION_ACTIONS.SET_ERROR,
          payload: {
            id: Date.now(),
            type: 'initialization',
            message: 'Failed to initialize integration system',
            details: error
          }
        });
      }
    };

    initializeSystem();
  }, []);

  // Context value with actions
  const value: IntegrationContextValue = {
    // State
    ...state,
    
    // Actions
    navigateToStep: (stepId: string, context: Record<string, any> = {}) => {
      if (state.integrationSystem) {
        return state.integrationSystem.navigateToStep(stepId, context);
      }
    },
    
    updateStepData: (stepId: string, data: any, options: Record<string, any> = {}) => {
      if (state.integrationSystem) {
        state.integrationSystem.updateStepData(stepId, data, options);
      }
    },
    
    executeIntegration: (fromStep: string, toStep: string, data: any) => {
      if (state.integrationSystem) {
        return state.integrationSystem.executeIntegration(fromStep, toStep, data);
      }
    },
    
    getWorkflowStatus: () => {
      if (state.integrationSystem) {
        return state.integrationSystem.getWorkflowStatus();
      }
      return null;
    },
    
    getAvailableNextSteps: (currentStepId: string): string[] => {
      if (state.integrationSystem) {
        return state.integrationSystem.getAvailableNextSteps(currentStepId);
      }
      return [];
    },
    
    restoreWorkflowState: (sessionId: string): boolean => {
      if (state.integrationSystem) {
        return state.integrationSystem.restoreWorkflowState(sessionId);
      }
      return false;
    },
    
    updateGlobalState: (updates: Partial<GlobalState>) => {
      dispatch({
        type: INTEGRATION_ACTIONS.SET_GLOBAL_STATE,
        payload: updates
      });
    },
    
    addPerformanceMetric: (metrics: Partial<PerformanceMetrics>) => {
      dispatch({
        type: INTEGRATION_ACTIONS.ADD_PERFORMANCE_METRIC,
        payload: metrics
      });
    },
    
    clearError: (errorId: number) => {
      dispatch({
        type: INTEGRATION_ACTIONS.CLEAR_ERROR,
        payload: { id: errorId }
      });
    },
    
    updateRealTimeData: (data: Partial<RealTimeData>) => {
      dispatch({
        type: INTEGRATION_ACTIONS.UPDATE_REAL_TIME_DATA,
        payload: { ...data, lastUpdate: Date.now() }
      });
    },
    
    // Utility functions
    isStepCompleted: (stepId: string): boolean => {
      const step = state.workflowSteps.find(s => s.id === stepId);
      return step?.status === 'completed';
    },
    
    getStepData: (stepId: string): any => {
      const step = state.workflowSteps.find(s => s.id === stepId);
      return step?.data || null;
    },
    
    canNavigateToStep: (stepId: string): boolean => {
      if (!state.integrationSystem) return false;
      const dependenciesMet = state.integrationSystem.checkDependencies(stepId);
      return dependenciesMet.canProceed;
    },
    
    getIntegrationHealth: () => {
      const statuses = Object.values(state.integrationStatus);
      const connectedCount = statuses.filter(status => status === 'connected').length;
      const totalCount = statuses.length;
      
      return {
        score: Math.round((connectedCount / totalCount) * 100),
        connected: connectedCount,
        total: totalCount,
        status: connectedCount === totalCount ? 'healthy' as const : 
                connectedCount > totalCount / 2 ? 'partial' as const : 'poor' as const
      };
    }
  };

  return (
    <IntegrationContext.Provider value={value}>
      {children}
    </IntegrationContext.Provider>
  );
};

// Custom hook to use integration context
export const useIntegration = (): IntegrationContextValue => {
  const context = useContext(IntegrationContext);
  if (!context) {
    throw new Error('useIntegration must be used within an IntegrationProvider');
  }
  return context;
};

export default IntegrationContext;