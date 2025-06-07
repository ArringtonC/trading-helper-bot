import React, { createContext, useReducer, useContext, ReactNode, useCallback, useEffect, useRef } from 'react';
import { Tutorial } from '../types/Tutorial';
import { getTutorialById } from '../services/TutorialService';
import {
  getCompletedTutorialIds,
  markTutorialAsCompleted as markTutorialCompletedInStorage,
} from '../services/TutorialProgressService';

// 1. State Shape
interface TutorialStep {
  targetSelector?: string; // The UI element this step is related to
  // We can expand this later to include specific content per step if we parse markdown
}
interface TutorialState {
  isTutorialActive: boolean;
  currentTutorial: Tutorial | null;
  currentTutorialId: string | null;
  currentStepIndex: number;
  availableSteps: TutorialStep[];
  error: string | null;
  isLoading: boolean;
  completedTutorialIds: string[]; // Added for progress tracking
  hasCheckedInitialTutorial: boolean; // To ensure auto-start welcome tutorial only happens once per session/load
}

const initialState: TutorialState = {
  isTutorialActive: false,
  currentTutorial: null,
  currentTutorialId: null,
  currentStepIndex: 0,
  availableSteps: [],
  error: null,
  isLoading: false,
  completedTutorialIds: [], // Will be loaded from storage on provider mount
  hasCheckedInitialTutorial: false,
};

// 2. Action Types
interface StartTutorialAction { type: 'START_TUTORIAL_REQUEST'; payload: { tutorialId: string };}
interface StartTutorialSuccessAction { type: 'START_TUTORIAL_SUCCESS'; payload: { tutorial: Tutorial };}
interface StartTutorialFailureAction { type: 'START_TUTORIAL_FAILURE'; payload: { error: string };}
interface NextStepAction { type: 'NEXT_STEP'; }
interface PrevStepAction { type: 'PREV_STEP'; }
interface GoToStepAction { type: 'GO_TO_STEP'; payload: { stepIndex: number }; }
interface EndTutorialAction { type: 'END_TUTORIAL'; }
interface LoadCompletedAction { type: 'LOAD_COMPLETED_TUTORIALS'; payload: { ids: string[] }; }
interface MarkCompletedAction { type: 'MARK_TUTORIAL_COMPLETED'; payload: { tutorialId: string }; }
interface SetInitialCheckAction { type: 'SET_INITIAL_CHECK_DONE'; }

type TutorialAction = 
  | StartTutorialAction 
  | StartTutorialSuccessAction
  | StartTutorialFailureAction
  | NextStepAction 
  | PrevStepAction
  | GoToStepAction
  | EndTutorialAction
  | LoadCompletedAction
  | MarkCompletedAction
  | SetInitialCheckAction;

// 3. Reducer Function
const tutorialReducer = (state: TutorialState, action: TutorialAction): TutorialState => {
  switch (action.type) {
    case 'LOAD_COMPLETED_TUTORIALS':
      return {
        ...state,
        completedTutorialIds: action.payload.ids,
      };
    case 'START_TUTORIAL_REQUEST':
      return { 
        ...initialState, // Reset to initial on new tutorial start, but preserve completed IDs and initial check status
        completedTutorialIds: state.completedTutorialIds, 
        hasCheckedInitialTutorial: state.hasCheckedInitialTutorial,
        isLoading: true, 
        currentTutorialId: action.payload.tutorialId, 
      };
    case 'START_TUTORIAL_SUCCESS':
      const tutorial = action.payload.tutorial;
      const steps: TutorialStep[] = tutorial.targetElementSelectors && tutorial.targetElementSelectors.length > 0
        ? tutorial.targetElementSelectors.map(selector => ({ targetSelector: selector }))
        : [{ targetSelector: undefined }]; // If no selectors, assume one general step
      return {
        ...state,
        isLoading: false,
        isTutorialActive: true,
        currentTutorial: tutorial,
        currentStepIndex: 0,
        availableSteps: steps,
        error: null,
      };
    case 'START_TUTORIAL_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload.error,
        isTutorialActive: false,
        currentTutorial: null,
        currentTutorialId: null,
      };
    case 'NEXT_STEP':
      if (state.currentTutorial && state.currentStepIndex < state.availableSteps.length - 1) {
        return { ...state, currentStepIndex: state.currentStepIndex + 1 };
      }
      return state;
    case 'PREV_STEP':
      if (state.currentTutorial && state.currentStepIndex > 0) {
        return { ...state, currentStepIndex: state.currentStepIndex - 1 };
      }
      return state;
    case 'GO_TO_STEP':
      if (state.currentTutorial && action.payload.stepIndex >= 0 && action.payload.stepIndex < state.availableSteps.length) {
        return { ...state, currentStepIndex: action.payload.stepIndex };
      }
      return state;
    case 'END_TUTORIAL':
      // completedTutorialIds are preserved, initial check is preserved
      return {
        ...initialState,
        completedTutorialIds: state.completedTutorialIds,
        hasCheckedInitialTutorial: state.hasCheckedInitialTutorial,
      };
    case 'MARK_TUTORIAL_COMPLETED':
      if (!state.completedTutorialIds.includes(action.payload.tutorialId)) {
        return {
          ...state,
          completedTutorialIds: [...state.completedTutorialIds, action.payload.tutorialId],
        };
      }
      return state;
    case 'SET_INITIAL_CHECK_DONE':
      return {
        ...state,
        hasCheckedInitialTutorial: true,
      };
    default:
      return state;
  }
};

// 4. Context
interface TutorialContextType extends Omit<TutorialState, 'hasCheckedInitialTutorial'> { // Exclude internal flag from context type
  startTutorial: (tutorialId: string, forceRestart?: boolean) => Promise<void>;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (stepIndex: number) => void;
  endTutorial: () => void;
  isTutorialCompleted: (tutorialId: string) => boolean;
  // markTutorialAsCompleted: (tutorialId: string) => void; // internal, triggered by endTutorial
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

// 5. Provider Component
const WELCOME_TUTORIAL_ID = '01-welcome';

export const TutorialProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [state, dispatch] = useReducer(tutorialReducer, initialState);
  const stateRef = useRef(state);
  const hasInitialized = useRef(false);
  const isAutoStarting = useRef(false);
  
  // Update ref whenever state changes
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Load completed tutorials on mount
  useEffect(() => {
    const loadedCompletedIds = getCompletedTutorialIds();
    dispatch({ type: 'LOAD_COMPLETED_TUTORIALS', payload: { ids: loadedCompletedIds } });
  }, []);

  // Auto-start welcome tutorial - robust implementation that avoids infinite loops
  useEffect(() => {
    // Only run once per app session
    if (hasInitialized.current || isAutoStarting.current) {
      return;
    }

    // Wait for completed tutorials to be loaded (initial state has empty array)
    // and ensure we're not already loading or have an active tutorial
    if (state.completedTutorialIds.length === 0 && 
        !state.isLoading && 
        !state.isTutorialActive && 
        !state.hasCheckedInitialTutorial) {
      
      hasInitialized.current = true;
      isAutoStarting.current = true;
      
      const autoStartWelcomeTutorial = async () => {
        try {
          // Check if any tutorials have been completed (including from localStorage)
          const allCompletedIds = getCompletedTutorialIds();
          
          if (allCompletedIds.length === 0) {
            console.log('Auto-starting welcome tutorial (no completed tutorials found)');
            
            dispatch({ type: 'START_TUTORIAL_REQUEST', payload: { tutorialId: WELCOME_TUTORIAL_ID } });
            
            const tutorialData = await getTutorialById(WELCOME_TUTORIAL_ID);
            if (tutorialData) {
              dispatch({ type: 'START_TUTORIAL_SUCCESS', payload: { tutorial: tutorialData } });
            } else {
              console.warn(`Welcome tutorial with ID "${WELCOME_TUTORIAL_ID}" not found.`);
              dispatch({ type: 'START_TUTORIAL_FAILURE', payload: { error: `Tutorial with ID "${WELCOME_TUTORIAL_ID}" not found.` } });
            }
          } else {
            console.log('Welcome tutorial skipped - user has completed tutorials before');
          }
        } catch (err) {
          console.error('Failed to auto-start welcome tutorial:', err);
          dispatch({ type: 'START_TUTORIAL_FAILURE', payload: { error: 'Failed to fetch welcome tutorial.' } });
        } finally {
          dispatch({ type: 'SET_INITIAL_CHECK_DONE' });
          isAutoStarting.current = false;
        }
      };

      // Delay slightly to ensure component is fully mounted
      setTimeout(autoStartWelcomeTutorial, 100);
    }
  }, [state.completedTutorialIds.length, state.isLoading, state.isTutorialActive, state.hasCheckedInitialTutorial]);

  // AUTO-START TUTORIAL LOGIC PROPERLY IMPLEMENTED WITH SAFEGUARDS

  const startTutorial = useCallback(async (tutorialId: string, forceRestart = false) => {
    // Use ref to access current state to avoid dependency issues
    const currentState = stateRef.current;
    if (currentState.completedTutorialIds.includes(tutorialId) && !forceRestart) {
      console.log(`Tutorial "${tutorialId}" already completed. Use forceRestart to view again.`);
      return;
    }
    dispatch({ type: 'START_TUTORIAL_REQUEST', payload: { tutorialId } });
    try {
      const tutorialData = await getTutorialById(tutorialId);
      if (tutorialData) {
        dispatch({ type: 'START_TUTORIAL_SUCCESS', payload: { tutorial: tutorialData } });
      } else {
        dispatch({ type: 'START_TUTORIAL_FAILURE', payload: { error: `Tutorial with ID "${tutorialId}" not found.` } });
      }
    } catch (err) {
      dispatch({ type: 'START_TUTORIAL_FAILURE', payload: { error: 'Failed to fetch tutorial.' } });
    }
  }, []);

  const nextStep = useCallback(() => dispatch({ type: 'NEXT_STEP' }), []);
  const prevStep = useCallback(() => dispatch({ type: 'PREV_STEP' }), []);
  const goToStep = useCallback((stepIndex: number) => dispatch({ type: 'GO_TO_STEP', payload: { stepIndex } }), []);
  
  const endTutorialAndMarkCompleted = useCallback(() => {
    if (state.currentTutorialId) {
      markTutorialCompletedInStorage(state.currentTutorialId);
      dispatch({ type: 'MARK_TUTORIAL_COMPLETED', payload: { tutorialId: state.currentTutorialId } });
    }
    dispatch({ type: 'END_TUTORIAL' });
  }, [state.currentTutorialId]);

  const isTutorialCompleted = useCallback((tutorialId: string): boolean => {
    return state.completedTutorialIds.includes(tutorialId);
  }, [state.completedTutorialIds]);

  return (
    <TutorialContext.Provider value={{
       ...state, 
       startTutorial, 
       nextStep, 
       prevStep, 
       goToStep, 
       endTutorial: endTutorialAndMarkCompleted, // Use the new wrapper function
       isTutorialCompleted,
    }}>
      {children}
    </TutorialContext.Provider>
  );
};

// Custom Hook to use the context
export const useTutorial = (): TutorialContextType => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}; 