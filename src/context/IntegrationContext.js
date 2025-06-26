import React, { createContext, useContext, useReducer, useEffect } from 'react';
import FeatureIntegrationSystem from '../services/integration/FeatureIntegrationSystem';

/**
 * Integration Context
 * Unified state management for the complete screening-to-trading workflow
 * 
 * Manages state across:
 * - Goal Assessment → Template Matching → Curated Lists → Advanced Screening
 * - Results → Chart Analysis → News Sentiment → Broker Integration → Risk Management
 */

const IntegrationContext = createContext();

// Action types for state management
const INTEGRATION_ACTIONS = {
  INITIALIZE_SYSTEM: 'INITIALIZE_SYSTEM',
  NAVIGATE_TO_STEP: 'NAVIGATE_TO_STEP',
  UPDATE_STEP_DATA: 'UPDATE_STEP_DATA',
  SET_GLOBAL_STATE: 'SET_GLOBAL_STATE',
  UPDATE_WORKFLOW_PROGRESS: 'UPDATE_WORKFLOW_PROGRESS',
  SET_INTEGRATION_STATUS: 'SET_INTEGRATION_STATUS',
  ADD_PERFORMANCE_METRIC: 'ADD_PERFORMANCE_METRIC',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  TRIGGER_INTEGRATION: 'TRIGGER_INTEGRATION',
  UPDATE_REAL_TIME_DATA: 'UPDATE_REAL_TIME_DATA'
};

// Initial state
const initialState = {
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
function integrationReducer(state, action) {
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
export const IntegrationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(integrationReducer, initialState);

  // Initialize integration system
  useEffect(() => {
    const initializeSystem = async () => {
      try {
        dispatch({ type: INTEGRATION_ACTIONS.TRIGGER_INTEGRATION });
        
        const integrationSystem = new FeatureIntegrationSystem();
        
        // Setup event listeners
        integrationSystem.on('system-initialized', (event) => {
          dispatch({
            type: INTEGRATION_ACTIONS.INITIALIZE_SYSTEM,
            payload: {
              system: integrationSystem,
              workflowSteps: event.workflowSteps,
              globalState: event.globalState
            }
          });
        });

        integrationSystem.on('step-navigation', (event) => {
          dispatch({
            type: INTEGRATION_ACTIONS.NAVIGATE_TO_STEP,
            payload: { stepId: event.to }
          });
        });

        integrationSystem.on('step-data-updated', (event) => {
          dispatch({
            type: INTEGRATION_ACTIONS.UPDATE_STEP_DATA,
            payload: {
              stepId: event.stepId,
              data: event.data,
              globalStateUpdate: event.globalState
            }
          });
          
          // Update workflow progress
          const completedSteps = event.globalState.workflowSteps?.filter(s => s.status === 'completed').length || 0;
          const totalSteps = event.globalState.workflowSteps?.length || 10;
          const progress = Math.round((completedSteps / totalSteps) * 100);
          
          dispatch({
            type: INTEGRATION_ACTIONS.UPDATE_WORKFLOW_PROGRESS,
            payload: { progress }
          });
        });

        integrationSystem.on('charts-integration', (event) => {
          dispatch({
            type: INTEGRATION_ACTIONS.SET_INTEGRATION_STATUS,
            payload: { charts: 'connected' }
          });
        });

        integrationSystem.on('news-integration', (event) => {
          dispatch({
            type: INTEGRATION_ACTIONS.SET_INTEGRATION_STATUS,
            payload: { news: 'connected' }
          });
        });

        integrationSystem.on('broker-integration', (event) => {
          dispatch({
            type: INTEGRATION_ACTIONS.SET_INTEGRATION_STATUS,
            payload: { broker: 'connected' }
          });
        });

        integrationSystem.on('integration-error', (event) => {
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
  const value = {
    // State
    ...state,
    
    // Actions
    navigateToStep: (stepId, context = {}) => {
      if (state.integrationSystem) {
        return state.integrationSystem.navigateToStep(stepId, context);
      }
    },
    
    updateStepData: (stepId, data, options = {}) => {
      if (state.integrationSystem) {
        state.integrationSystem.updateStepData(stepId, data, options);
      }
    },
    
    executeIntegration: (fromStep, toStep, data) => {
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
    
    getAvailableNextSteps: (currentStepId) => {
      if (state.integrationSystem) {
        return state.integrationSystem.getAvailableNextSteps(currentStepId);
      }
      return [];
    },
    
    restoreWorkflowState: (sessionId) => {
      if (state.integrationSystem) {
        return state.integrationSystem.restoreWorkflowState(sessionId);
      }
      return false;
    },
    
    updateGlobalState: (updates) => {
      dispatch({
        type: INTEGRATION_ACTIONS.SET_GLOBAL_STATE,
        payload: updates
      });
    },
    
    addPerformanceMetric: (metrics) => {
      dispatch({
        type: INTEGRATION_ACTIONS.ADD_PERFORMANCE_METRIC,
        payload: metrics
      });
    },
    
    clearError: (errorId) => {
      dispatch({
        type: INTEGRATION_ACTIONS.CLEAR_ERROR,
        payload: { id: errorId }
      });
    },
    
    updateRealTimeData: (data) => {
      dispatch({
        type: INTEGRATION_ACTIONS.UPDATE_REAL_TIME_DATA,
        payload: { ...data, lastUpdate: Date.now() }
      });
    },
    
    // Utility functions
    isStepCompleted: (stepId) => {
      const step = state.workflowSteps.find(s => s.id === stepId);
      return step?.status === 'completed';
    },
    
    getStepData: (stepId) => {
      const step = state.workflowSteps.find(s => s.id === stepId);
      return step?.data || null;
    },
    
    canNavigateToStep: (stepId) => {
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
        status: connectedCount === totalCount ? 'healthy' : 
                connectedCount > totalCount / 2 ? 'partial' : 'poor'
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
export const useIntegration = () => {
  const context = useContext(IntegrationContext);
  if (!context) {
    throw new Error('useIntegration must be used within an IntegrationProvider');
  }
  return context;
};

// Export action types for external use
export { INTEGRATION_ACTIONS };

export default IntegrationContext; 