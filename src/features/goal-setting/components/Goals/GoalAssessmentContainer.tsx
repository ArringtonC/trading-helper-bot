/**
 * GoalAssessmentContainer - Main container integrating all goal assessment components
 * 
 * Integrates:
 * - GoalQuestionnaire with progressive disclosure
 * - ConflictDetector for contradictory objectives
 * - RealismValidator using account size data
 * - EducationalContent for expectation management
 * - UserFlowManager integration for seamless experience
 */

import React, { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ArrowRight, Target, BookOpen, AlertTriangle } from 'lucide-react';
import GoalQuestionnaire from './GoalQuestionnaire';
import ConflictDetector from './ConflictDetector';
import RealismValidator from './RealismValidator';
import EducationalContent from './EducationalContent';
import { UserFlowManager } from '../../../../shared/services/userFlow/UserFlowManager';

// Type definitions
type AssessmentStep = 'questionnaire' | 'conflict_resolution' | 'realism_validation' | 'education' | 'summary';

interface UserProfile {
  id?: string;
  experienceLevel?: string;
  accountSize?: number;
  [key: string]: any;
}

interface Bias {
  type: string;
  evidence: string;
  severity: string;
}

interface Conflict {
  id: string;
  type: string;
  description: string;
  resolution?: string;
  educationRequired?: boolean;
}

interface Goal {
  id: string;
  type: string;
  title: string;
  description: string;
  priority?: string;
  strategy?: string;
  score?: number;
  [key: string]: any;
}

interface QuestionnaireResponses {
  [key: string]: any;
}

interface ValidationResult {
  goal: Goal;
  validation: {
    isRealistic: boolean;
    [key: string]: any;
  };
}

interface Resolution {
  conflict: Conflict;
  resolution: {
    primary_priority?: string;
    selected_strategy?: string;
    [key: string]: any;
  };
}

interface AssessmentData {
  responses: QuestionnaireResponses;
  detectedBiases: Bias[];
  conflicts: Conflict[];
  goalCandidates: Goal[];
  finalGoals: Goal[];
  validationResults: ValidationResult[];
  educationalProgress: Record<string, any>;
  resolutions?: Resolution[];
  unrealisticGoals?: ValidationResult[];
}

interface ProgressData {
  progress: number;
  responses: QuestionnaireResponses;
  biases?: Bias[];
  conflicts?: Conflict[];
}

interface CompleteData {
  responses: QuestionnaireResponses;
  finalGoals?: Goal[];
  assessment?: {
    conflicts?: Conflict[];
    [key: string]: any;
  };
}

interface StepChangeData {
  step: AssessmentStep;
  progress?: number;
  data?: any;
}

interface AssessmentCompleteData extends AssessmentData {
  completedAt: number;
  userProfile: UserProfile;
  flowContext: any;
}

interface GoalAssessmentContainerProps {
  userProfile?: UserProfile;
  onAssessmentComplete?: (data: AssessmentCompleteData) => void;
  onStepChange?: (data: StepChangeData) => void;
  className?: string;
  initialStep?: AssessmentStep;
}

interface StepIndicatorProps {
  icon: ReactNode;
  label: string;
  isActive: boolean;
  isComplete: boolean;
}

interface AssessmentSummaryProps {
  assessmentData: AssessmentData;
  onComplete: () => void;
}

const GoalAssessmentContainer: React.FC<GoalAssessmentContainerProps> = ({ 
  userProfile,
  onAssessmentComplete,
  onStepChange,
  className = '',
  initialStep = 'questionnaire'
}) => {
  const [currentStep, setCurrentStep] = useState<AssessmentStep>(initialStep);
  const [assessmentData, setAssessmentData] = useState<AssessmentData>({
    responses: {},
    detectedBiases: [],
    conflicts: [],
    goalCandidates: [],
    finalGoals: [],
    validationResults: [],
    educationalProgress: {}
  });
  const [flowManager] = useState(() => new UserFlowManager());
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Initialize goal assessment flow
    if (userProfile) {
      flowManager.setCurrentStep('goal_definition');
      flowManager.updateContext({ 
        userProfile, 
        assessmentStep: currentStep 
      });
    }
  }, [userProfile, flowManager, currentStep]);

  const handleQuestionnaireProgress = (progressData: ProgressData): void => {
    setAssessmentData(prev => ({
      ...prev,
      responses: progressData.responses,
      detectedBiases: progressData.biases || [],
      conflicts: progressData.conflicts || []
    }));

    // Update flow manager context
    flowManager.updateContext({
      goalAssessmentProgress: progressData.progress,
      detectedBiases: progressData.biases,
      conflicts: progressData.conflicts
    });

    if (onStepChange) {
      onStepChange({
        step: 'questionnaire',
        progress: progressData.progress,
        data: progressData
      });
    }
  };

  const handleQuestionnaireComplete = async (completeData: CompleteData): Promise<void> => {
    setAssessmentData(prev => ({
      ...prev,
      responses: completeData.responses,
      goalCandidates: completeData.finalGoals || [],
      finalGoals: completeData.finalGoals || []
    }));

    // Check if there are conflicts to resolve
    if (completeData.assessment?.conflicts?.length && completeData.assessment.conflicts.length > 0) {
      await transitionToStep('conflict_resolution');
    } else {
      await transitionToStep('realism_validation');
    }
  };

  const handleConflictResolved = async (conflict: Conflict, resolution: any): Promise<void> => {
    setAssessmentData(prev => ({
      ...prev,
      conflicts: prev.conflicts.filter(c => c.id !== conflict.id),
      resolutions: [...(prev.resolutions || []), { conflict, resolution }]
    }));

    // Update goal candidates based on conflict resolution
    const updatedGoals = await updateGoalsBasedOnResolution(
      assessmentData.goalCandidates, 
      conflict, 
      resolution
    );
    
    setAssessmentData(prev => ({
      ...prev,
      goalCandidates: updatedGoals
    }));

    // Check if all conflicts are resolved
    const remainingConflicts = assessmentData.conflicts.filter(c => c.id !== conflict.id);
    if (remainingConflicts.length === 0) {
      await transitionToStep('realism_validation');
    }
  };

  const handleValidationComplete = async (validationResults: ValidationResult[]): Promise<void> => {
    setAssessmentData(prev => ({
      ...prev,
      validationResults
    }));

    // Filter out unrealistic goals and update final goals
    const realisticGoals = validationResults
      .filter(result => result.validation.isRealistic)
      .map(result => result.goal);

    const unrealisticGoals = validationResults
      .filter(result => !result.validation.isRealistic);

    setAssessmentData(prev => ({
      ...prev,
      finalGoals: realisticGoals,
      unrealisticGoals
    }));

    // Move to educational content if there are unrealistic expectations
    if (unrealisticGoals.length > 0) {
      await transitionToStep('education');
    } else {
      await transitionToStep('summary');
    }
  };

  const transitionToStep = async (nextStep: AssessmentStep): Promise<void> => {
    setIsTransitioning(true);
    
    // Small delay for smooth transition
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setCurrentStep(nextStep);
    setIsTransitioning(false);

    // Update flow manager
    flowManager.updateContext({ assessmentStep: nextStep });

    if (onStepChange) {
      onStepChange({
        step: nextStep,
        data: assessmentData
      });
    }
  };

  const handleEducationComplete = async (): Promise<void> => {
    await transitionToStep('summary');
  };

  const handleAssessmentComplete = (): void => {
    // Final assessment data
    const completeAssessment: AssessmentCompleteData = {
      ...assessmentData,
      completedAt: Date.now(),
      userProfile: userProfile || {},
      flowContext: flowManager.getContext()
    };

    if (onAssessmentComplete) {
      onAssessmentComplete(completeAssessment);
    }

    // Update flow manager to next step
    flowManager.setCurrentStep('strategy_alignment');
  };

  const updateGoalsBasedOnResolution = async (goals: Goal[], conflict: Conflict, resolution: any): Promise<Goal[]> => {
    // Implement logic to update goals based on conflict resolution
    // This would adjust goal parameters, priorities, or strategies
    return goals.map(goal => {
      if (conflict.type === 'safety_profit_conflict' && resolution.primary_priority) {
        return {
          ...goal,
          priority: resolution.primary_priority,
          strategy: resolution.selected_strategy
        };
      }
      return goal;
    });
  };

  const renderCurrentStep = (): ReactNode => {
    if (isTransitioning) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Transitioning...</p>
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case 'questionnaire':
        return (
          <GoalQuestionnaire
            userProfile={userProfile}
            onProgress={handleQuestionnaireProgress}
            onComplete={handleQuestionnaireComplete}
            initialData={assessmentData}
          />
        );

      case 'conflict_resolution':
        return (
          <ConflictDetector
            responses={assessmentData.responses}
            detectedConflicts={assessmentData.conflicts}
            onConflictResolved={handleConflictResolved}
          />
        );

      case 'realism_validation':
        return (
          <RealismValidator
            goalCandidates={assessmentData.goalCandidates}
            userProfile={userProfile}
            responses={assessmentData.responses}
            onValidationComplete={handleValidationComplete}
          />
        );

      case 'education':
        return (
          <div className="space-y-8">
            <EducationalContent
              goalType={assessmentData.finalGoals[0]?.type}
              userResponses={assessmentData.responses}
              detectedBiases={assessmentData.detectedBiases}
              unrealisticExpectations={assessmentData.unrealisticGoals}
            />
            
            <div className="flex justify-end">
              <button
                onClick={handleEducationComplete}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Continue to Summary <ArrowRight className="w-4 h-4 ml-2 inline" />
              </button>
            </div>
          </div>
        );

      case 'summary':
        return <AssessmentSummary assessmentData={assessmentData} onComplete={handleAssessmentComplete} />;

      default:
        return null;
    }
  };

  const getStepProgress = () => {
    const steps: AssessmentStep[] = ['questionnaire', 'conflict_resolution', 'realism_validation', 'education', 'summary'];
    const currentIndex = steps.indexOf(currentStep);
    return {
      currentStep: currentIndex + 1,
      totalSteps: steps.length,
      percentage: Math.round(((currentIndex + 1) / steps.length) * 100)
    };
  };

  const progress = getStepProgress();

  return (
    <div className={`goal-assessment-container ${className}`}>
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Investment Goal Assessment</h1>
          <div className="text-sm text-gray-500">
            Step {progress.currentStep} of {progress.totalSteps}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div 
            className="bg-blue-600 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress.percentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Step Indicators */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <StepIndicator 
            icon={<Target className="w-4 h-4" />}
            label="Assessment"
            isActive={currentStep === 'questionnaire'}
            isComplete={progress.currentStep > 1}
          />
          <StepIndicator 
            icon={<AlertTriangle className="w-4 h-4" />}
            label="Conflicts"
            isActive={currentStep === 'conflict_resolution'}
            isComplete={progress.currentStep > 2}
          />
          <StepIndicator 
            icon={<CheckCircle className="w-4 h-4" />}
            label="Validation"
            isActive={currentStep === 'realism_validation'}
            isComplete={progress.currentStep > 3}
          />
          <StepIndicator 
            icon={<BookOpen className="w-4 h-4" />}
            label="Education"
            isActive={currentStep === 'education'}
            isComplete={progress.currentStep > 4}
          />
          <StepIndicator 
            icon={<CheckCircle className="w-4 h-4" />}
            label="Summary"
            isActive={currentStep === 'summary'}
            isComplete={false}
          />
        </div>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderCurrentStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/**
 * Step Indicator Component
 */
const StepIndicator: React.FC<StepIndicatorProps> = ({ icon, label, isActive, isComplete }) => {
  return (
    <div className={`flex items-center ${
      isActive ? 'text-blue-600' : 
      isComplete ? 'text-green-600' : 
      'text-gray-400'
    }`}>
      <div className={`mr-2 ${isComplete ? 'text-green-600' : ''}`}>
        {isComplete ? <CheckCircle className="w-4 h-4" /> : icon}
      </div>
      <span className="font-medium">{label}</span>
    </div>
  );
};

/**
 * Assessment Summary Component
 */
const AssessmentSummary: React.FC<AssessmentSummaryProps> = ({ assessmentData, onComplete }) => {
  return (
    <div className="assessment-summary">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Assessment Complete!</h2>
        <p className="text-gray-600">
          We've analyzed your goals and created a personalized investment strategy.
        </p>
      </div>

      {/* Final Goals Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {assessmentData.finalGoals.map((goal, index) => (
          <div key={goal.id || index} className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 capitalize">
              {goal.type.replace('_', ' ')} Goal
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Confidence Score:</span>
                <span className="font-medium">{Math.round((goal.score || 0) * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Priority:</span>
                <span className="font-medium capitalize">{goal.priority || 'Medium'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Your Next Steps</h3>
        <ol className="space-y-3">
          <li className="flex items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">1</span>
            <span className="text-blue-800">Review your personalized stock screening criteria</span>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">2</span>
            <span className="text-blue-800">Start with educational resources for your goal type</span>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">3</span>
            <span className="text-blue-800">Begin paper trading to practice your strategy</span>
          </li>
        </ol>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onComplete}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
        >
          Continue to Stock Screening <ArrowRight className="w-5 h-5 ml-2 inline" />
        </button>
      </div>
    </div>
  );
};

export default GoalAssessmentContainer;