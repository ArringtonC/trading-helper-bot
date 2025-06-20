import { OnboardingFlowController, OnboardingFlowType } from '../OnboardingFlowController';
import { UserExperienceLevel } from '../../ux/UXLayersController';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('OnboardingFlowController', () => {
  let controller: OnboardingFlowController;

  beforeEach(() => {
    controller = new OnboardingFlowController();
    localStorageMock.clear();
  });

  describe('Flow Determination', () => {
    test('should route beginners to newTrader flow with visualizer entry point', () => {
      const flowType = controller.determineOnboardingFlow('learning', 0, false);
      expect(flowType).toBe('newTrader');
      
      const entryPoint = controller.getEntryPoint('learning', 0);
      expect(entryPoint).toBe('/visualizer');
    });

    test('should route experienced users to experienced flow with dashboard entry point', () => {
      const flowType = controller.determineOnboardingFlow('broker', 5, false);
      expect(flowType).toBe('experienced');
      
      const entryPoint = controller.getEntryPoint('broker', 5);
      expect(entryPoint).toBe('/dashboard');
    });

    test('should route intermediate users with experience to experienced flow', () => {
      const flowType = controller.determineOnboardingFlow('import', 2, false);
      expect(flowType).toBe('experienced');
    });

    test('should route users who completed onboarding to experienced flow', () => {
      const flowType = controller.determineOnboardingFlow('learning', 0, true);
      expect(flowType).toBe('experienced');
    });

    test('should prioritize visualizer for new traders', () => {
      expect(controller.shouldPrioritizeVisualizer('learning', 0)).toBe(true);
      expect(controller.shouldPrioritizeVisualizer('import', 0.5)).toBe(true);
      expect(controller.shouldPrioritizeVisualizer('broker', 5)).toBe(false);
    });
  });

  describe('Onboarding Initialization', () => {
    test('should initialize newTrader flow correctly', () => {
      const progress = controller.initializeOnboarding('learning', 0, false);
      
      expect(progress.flowType).toBe('newTrader');
      expect(progress.userLevel).toBe('learning');
      expect(progress.currentStep).toBe(0);
      expect(progress.completedSteps).toEqual([]);
      expect(progress.currentPath).toBe('/visualizer');
      expect(progress.totalSteps).toBe(5); // newTrader flow has 5 steps
    });

    test('should initialize experienced flow correctly', () => {
      const progress = controller.initializeOnboarding('broker', 5, false);
      
      expect(progress.flowType).toBe('experienced');
      expect(progress.userLevel).toBe('broker');
      expect(progress.currentPath).toBe('/dashboard');
      expect(progress.totalSteps).toBe(4); // experienced flow has 4 steps
    });

    test('should save progress to localStorage', () => {
      controller.initializeOnboarding('learning', 0, false);
      
      const stored = localStorage.getItem('onboarding_progress');
      expect(stored).toBeTruthy();
      
      const progress = JSON.parse(stored!);
      expect(progress.flowType).toBe('newTrader');
    });
  });

  describe('Progress Management', () => {
    beforeEach(() => {
      controller.initializeOnboarding('learning', 0, false);
    });

    test('should complete steps correctly', () => {
      const updatedProgress = controller.completeStep('risk-assessment');
      
      expect(updatedProgress).toBeTruthy();
      expect(updatedProgress!.completedSteps).toContain('risk-assessment');
    });

    test('should not duplicate completed steps', () => {
      controller.completeStep('risk-assessment');
      const progress = controller.completeStep('risk-assessment');
      
      expect(progress!.completedSteps.filter(step => step === 'risk-assessment')).toHaveLength(1);
    });

    test('should advance current step when completing current step', () => {
      const initialProgress = controller.getProgress();
      expect(initialProgress!.currentStep).toBe(0);
      
      controller.completeStep('risk-assessment');
      const updatedProgress = controller.getProgress();
      expect(updatedProgress!.currentStep).toBe(1);
    });

    test('should get next step correctly', () => {
      const nextStep = controller.getNextStep();
      
      expect(nextStep).toBeTruthy();
      expect(nextStep!.id).toBe('risk-assessment');
      expect(nextStep!.isRequired).toBe(true);
    });

    test('should return null when all steps completed', () => {
      const flow = controller.getCurrentFlow();
      flow!.sequence.forEach(step => {
        controller.completeStep(step.id);
      });
      
      const nextStep = controller.getNextStep();
      expect(nextStep).toBeNull();
    });
  });

  describe('Completion Tracking', () => {
    beforeEach(() => {
      controller.initializeOnboarding('learning', 0, false);
    });

    test('should calculate completion percentage correctly', () => {
      expect(controller.getCompletionPercentage()).toBe(0);
      
      // Complete first required step (risk-assessment)
      controller.completeStep('risk-assessment');
      expect(controller.getCompletionPercentage()).toBe(25); // 1 of 4 required steps
      
      // Complete all required steps
      controller.completeStep('basic-concepts-tutorial');
      controller.completeStep('strategy-visualizer');
      controller.completeStep('position-calculator');
      expect(controller.getCompletionPercentage()).toBe(100);
    });

    test('should detect onboarding completion correctly', () => {
      expect(controller.isOnboardingComplete()).toBe(false);
      
      // Complete all required steps
      const flow = controller.getCurrentFlow();
      const requiredSteps = flow!.sequence.filter(step => step.isRequired);
      
      requiredSteps.forEach(step => {
        controller.completeStep(step.id);
      });
      
      expect(controller.isOnboardingComplete()).toBe(true);
    });

    test('should not require optional steps for completion', () => {
      // Complete only required steps, skip optional ones
      controller.completeStep('risk-assessment');
      controller.completeStep('basic-concepts-tutorial');
      controller.completeStep('strategy-visualizer');
      controller.completeStep('position-calculator');
      // Skip 'educational-modules' (optional)
      
      expect(controller.isOnboardingComplete()).toBe(true);
    });
  });

  describe('Flow Configuration', () => {
    test('should have correct newTrader flow configuration', () => {
      const flows = controller.getAllFlows();
      const newTraderFlow = flows.newTrader;
      
      expect(newTraderFlow.entryPoint).toBe('/visualizer');
      expect(newTraderFlow.skipOptions).toBe(false);
      expect(newTraderFlow.maxComplexity).toBe('basic');
      expect(newTraderFlow.description).toContain('Visualizer-first approach');
      expect(newTraderFlow.description).toContain('85% failure rate');
    });

    test('should have correct experienced flow configuration', () => {
      const flows = controller.getAllFlows();
      const experiencedFlow = flows.experienced;
      
      expect(experiencedFlow.entryPoint).toBe('/dashboard');
      expect(experiencedFlow.skipOptions).toBe(true);
      expect(experiencedFlow.maxComplexity).toBe('broker');
      expect(experiencedFlow.description).toContain('Streamlined setup');
    });

    test('should have visualizer as primary step in newTrader flow', () => {
      const flows = controller.getAllFlows();
      const visualizerStep = flows.newTrader.sequence.find(step => step.id === 'strategy-visualizer');
      
      expect(visualizerStep).toBeTruthy();
      expect(visualizerStep!.title).toContain('Primary Entry');
      expect(visualizerStep!.isRequired).toBe(true);
      expect(visualizerStep!.path).toBe('/visualizer');
    });

    test('should have proper step sequence for new traders', () => {
      const flows = controller.getAllFlows();
      const sequence = flows.newTrader.sequence.map(step => step.id);
      
      expect(sequence).toEqual([
        'risk-assessment',
        'basic-concepts-tutorial',
        'strategy-visualizer',
        'position-calculator',
        'educational-modules'
      ]);
    });
  });

  describe('Progress Persistence', () => {
    test('should load progress from localStorage', () => {
      // Initialize and complete a step
      controller.initializeOnboarding('learning', 0, false);
      controller.completeStep('risk-assessment');
      
      // Create new controller instance
      const newController = new OnboardingFlowController();
      const progress = newController.getProgress();
      
      expect(progress).toBeTruthy();
      expect(progress!.completedSteps).toContain('risk-assessment');
    });

    test('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('onboarding_progress', 'invalid json');
      
      const progress = controller.getProgress();
      expect(progress).toBeNull();
    });

    test('should reset onboarding correctly', () => {
      controller.initializeOnboarding('learning', 0, false);
      expect(controller.getProgress()).toBeTruthy();
      
      controller.resetOnboarding();
      expect(controller.getProgress()).toBeNull();
    });
  });

  describe('Research-Backed Features', () => {
    test('should implement visualizer-first approach for addressing 85% failure rate', () => {
      const flows = controller.getAllFlows();
      const newTraderFlow = flows.newTrader;
      
      // Entry point should be visualizer
      expect(newTraderFlow.entryPoint).toBe('/visualizer');
      
      // Description should mention research backing
      expect(newTraderFlow.description).toContain('85% failure rate');
      expect(newTraderFlow.description).toContain('education gaps');
      
      // Visualizer should be a required step
      const visualizerStep = newTraderFlow.sequence.find(step => step.id === 'strategy-visualizer');
      expect(visualizerStep!.isRequired).toBe(true);
    });

    test('should provide educational progression for new traders', () => {
      const flows = controller.getAllFlows();
      const newTraderFlow = flows.newTrader;
      
      // Should include educational components
      const educationalSteps = newTraderFlow.sequence.filter(step => 
        step.id.includes('tutorial') || step.id.includes('educational')
      );
      expect(educationalSteps.length).toBeGreaterThan(0);
      
      // Should have proper time estimates
      newTraderFlow.sequence.forEach(step => {
        expect(step.estimatedTime).toMatch(/\d+-\d+ minutes/);
      });
    });

    test('should enforce proper page order as specified in requirements', () => {
      // The requirements specify: Settings → IBKR Connection → Visualizer → Options Page → other features
      // For new traders, visualizer should be the primary entry point
      const entryPoint = controller.getEntryPoint('learning', 0);
      expect(entryPoint).toBe('/visualizer');
      
      // For experienced traders, should follow more traditional flow
      const experiencedEntry = controller.getEntryPoint('broker', 5);
      expect(experiencedEntry).toBe('/dashboard');
    });
  });
}); 