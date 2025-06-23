import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { OnboardingFlowController, OnboardingProgress, OnboardingStep } from '../../utils/onboarding/OnboardingFlowController';
import { UserExperienceLevel } from '../../utils/ux/UXLayersController';
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  Clock, 
  Target, 
  BookOpen,
  TrendingUp,
  Calculator,
  Settings,
  X
} from 'lucide-react';

interface OnboardingGuideProps {
  userLevel: UserExperienceLevel;
  tradingExperience?: number;
  hasCompletedOnboarding?: boolean;
  onClose?: () => void;
  isMinimized?: boolean;
}

const OnboardingGuide: React.FC<OnboardingGuideProps> = ({
  userLevel,
  tradingExperience = 0,
  hasCompletedOnboarding = false,
  onClose,
  isMinimized = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [controller] = useState(() => new OnboardingFlowController());
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [nextStep, setNextStep] = useState<OnboardingStep | null>(null);
  const [isExpanded, setIsExpanded] = useState(!isMinimized);

  // Initialize or load onboarding progress
  useEffect(() => {
    let currentProgress = controller.getProgress();
    
    if (!currentProgress && !hasCompletedOnboarding) {
      currentProgress = controller.initializeOnboarding(
        userLevel,
        tradingExperience,
        hasCompletedOnboarding
      );
    }
    
    setProgress(currentProgress);
    
    if (currentProgress) {
      const next = controller.getNextStep();
      setNextStep(next);
    }
  }, [controller, userLevel, tradingExperience, hasCompletedOnboarding]);

  // Update progress when location changes
  useEffect(() => {
    if (progress) {
      const flow = controller.getCurrentFlow();
      if (flow) {
        const currentStep = flow.sequence.find(step => step.path === location.pathname);
        if (currentStep && !progress.completedSteps.includes(currentStep.id)) {
          // Mark step as visited (not necessarily completed)
          const updatedProgress = { ...progress };
          updatedProgress.currentPath = location.pathname;
          updatedProgress.lastUpdated = new Date();
          setProgress(updatedProgress);
        }
      }
    }
  }, [location.pathname, controller]);

  const handleStepClick = (step: OnboardingStep) => {
    navigate(step.path);
  };

  const handleCompleteStep = (stepId: string) => {
    const updatedProgress = controller.completeStep(stepId);
    if (updatedProgress) {
      setProgress(updatedProgress);
      const next = controller.getNextStep();
      setNextStep(next);
    }
  };

  const handleSkipOnboarding = () => {
    controller.resetOnboarding();
    if (onClose) onClose();
  };

  const getStepIcon = (stepId: string) => {
    switch (stepId) {
      case 'risk-assessment': return <Target className="h-4 w-4" />;
      case 'basic-concepts-tutorial': return <BookOpen className="h-4 w-4" />;
      case 'strategy-visualizer': return <TrendingUp className="h-4 w-4" />;
      case 'position-calculator': return <Calculator className="h-4 w-4" />;
      case 'educational-modules': return <BookOpen className="h-4 w-4" />;
      case 'account-setup': return <Settings className="h-4 w-4" />;
      case 'risk-profile-config': return <Target className="h-4 w-4" />;
      case 'advanced-calculator': return <Calculator className="h-4 w-4" />;
      case 'live-trading-setup': return <TrendingUp className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  if (!progress || controller.isOnboardingComplete()) {
    return null;
  }

  const flow = controller.getCurrentFlow();
  if (!flow) return null;

  const completionPercentage = controller.getCompletionPercentage();

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <BookOpen className="h-4 w-4" />
          <span>Continue Setup ({completionPercentage}%)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 bg-white border border-gray-200 rounded-lg shadow-xl">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-blue-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-800">
              {progress.flowType === 'newTrader' ? '🚀 New Trader Setup' : '⚡ Quick Setup'}
            </h3>
            <p className="text-sm text-blue-600">
              {flow.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-blue-600 mb-1">
            <span>Progress</span>
            <span>{completionPercentage}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Current Step Highlight */}
      {nextStep && (
        <div className="px-4 py-3 bg-green-50 border-b border-gray-200">
          <div className="flex items-start gap-3">
            <div className="text-green-600 mt-0.5">
              {getStepIcon(nextStep.id)}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-green-800">{nextStep.title}</h4>
              <p className="text-sm text-green-700 mb-2">{nextStep.description}</p>
              <div className="flex items-center gap-4 text-xs text-green-600">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {nextStep.estimatedTime}
                </span>
                <span className={nextStep.isRequired ? 'font-medium' : ''}>
                  {nextStep.isRequired ? 'Required' : 'Optional'}
                </span>
              </div>
              <button
                onClick={() => handleStepClick(nextStep)}
                className="mt-2 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
              >
                {location.pathname === nextStep.path ? 'Complete Step' : 'Start Step'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Steps List */}
      <div className="px-4 py-3 max-h-64 overflow-y-auto">
        <h4 className="font-medium text-gray-800 mb-3">Setup Steps</h4>
        <div className="space-y-2">
          {flow.sequence.map((step, index) => {
            const isCompleted = progress.completedSteps.includes(step.id);
            const isCurrent = nextStep?.id === step.id;
            const isAccessible = index === 0 || progress.completedSteps.includes(flow.sequence[index - 1].id);
            
            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                  isCurrent 
                    ? 'bg-blue-50 border border-blue-200' 
                    : isCompleted 
                    ? 'bg-green-50' 
                    : isAccessible 
                    ? 'hover:bg-gray-50' 
                    : 'opacity-50'
                }`}
                onClick={() => isAccessible && handleStepClick(step)}
              >
                <div className={`${
                  isCompleted 
                    ? 'text-green-600' 
                    : isCurrent 
                    ? 'text-blue-600' 
                    : 'text-gray-400'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    getStepIcon(step.id)
                  )}
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${
                    isCompleted 
                      ? 'text-green-800' 
                      : isCurrent 
                      ? 'text-blue-800' 
                      : 'text-gray-700'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {step.estimatedTime}
                    {step.isRequired && <span className="ml-2 text-red-500">*</span>}
                  </div>
                </div>
                {location.pathname === step.path && !isCompleted && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCompleteStep(step.id);
                    }}
                    className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                  >
                    Mark Complete
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center">
          <button
            onClick={handleSkipOnboarding}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Skip Setup
          </button>
          <div className="text-xs text-gray-500">
            {progress.flowType === 'newTrader' 
              ? 'Visualizer-first approach for better learning'
              : 'Streamlined setup for experienced traders'
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingGuide; 