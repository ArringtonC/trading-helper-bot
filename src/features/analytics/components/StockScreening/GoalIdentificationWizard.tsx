import React, { useState, useEffect } from 'react';
// TODO: GoalIdentificationSystem needs to be implemented
// import GoalIdentificationSystem from '../../../../shared/services/goals/GoalIdentificationSystem';
import ProgressiveDisclosure from './ProgressiveDisclosure';
import GoalMatchIndicator from './GoalMatchIndicator';

// Type definitions
interface Questionnaire {
  sections: QuestionnaireSection[];
}

interface QuestionnaireSection {
  title: string;
  description: string;
  questions: Question[];
}

interface Question {
  id: string;
  question: string;
  type: 'single-select' | 'multi-select' | 'scale' | 'number' | 'boolean' | 'text';
  required: boolean;
  options?: QuestionOption[];
  labels?: Record<number, string>;
  scale?: {
    min: number;
    max: number;
  };
  validation?: {
    max?: number;
    warningThreshold?: number;
  };
  warning?: string;
}

interface QuestionOption {
  value: string;
  label: string;
  description?: string;
  percentage?: string;
  risk?: 'low' | 'medium' | 'high';
}

interface Analysis {
  primaryGoal?: {
    name: string;
    [key: string]: any;
  };
  biasesDetected: BiasDetection[];
  conflicts: GoalConflict[];
  recommendations: Recommendation[];
}

interface BiasDetection {
  type: string;
  evidence: string;
}

interface GoalConflict {
  description: string;
  resolution: string;
}

interface Recommendation {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface GoalData {
  responses: Record<string, any>;
  analysis: Analysis;
  questionnaire: Questionnaire;
}

interface GoalIdentificationWizardProps {
  onGoalIdentified?: (data: GoalData) => void;
  initialUserLevel?: string;
  showProgressBar?: boolean;
  className?: string;
}

interface PsychologicalBias {
  name: string;
  description: string;
}

/**
 * Goal Identification Wizard
 * Interactive interface for identifying user trading goals based on research-backed questionnaire
 * 
 * Features:
 * - Progressive disclosure questionnaire
 * - Psychological bias detection
 * - Goal conflict identification
 * - Real-time goal matching
 * - Educational recommendations
 */
const GoalIdentificationWizard: React.FC<GoalIdentificationWizardProps> = ({
  onGoalIdentified,
  initialUserLevel = 'beginner',
  showProgressBar = true,
  className = ''
}) => {
  const [goalSystem] = useState(() => new GoalIdentificationSystem());
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showBiasEducation, setShowBiasEducation] = useState(false);

  useEffect(() => {
    const quest = goalSystem.createGoalQuestionnaire(initialUserLevel);
    setQuestionnaire(quest);
  }, [goalSystem, initialUserLevel]);

  const handleResponseChange = (questionId: string, value: any): void => {
    const newResponses = { ...responses, [questionId]: value };
    setResponses(newResponses);

    // Real-time analysis for immediate feedback
    if (questionnaire && isStepComplete(currentStep, newResponses)) {
      performAnalysis(newResponses);
    }
  };

  const performAnalysis = async (currentResponses: Record<string, any>): Promise<void> => {
    setIsAnalyzing(true);
    try {
      const goalAnalysis = goalSystem.identifyTraderGoals(currentResponses);
      setAnalysis(goalAnalysis);
      
      // Check if education is needed
      if (goalAnalysis.biasesDetected.length > 0 || goalAnalysis.conflicts.length > 0) {
        setShowBiasEducation(true);
      }
    } catch (error) {
      console.error('Error analyzing goals:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isStepComplete = (step: number, currentResponses: Record<string, any>): boolean => {
    if (!questionnaire?.sections[step]) return false;
    
    const section = questionnaire.sections[step];
    const requiredQuestions = section.questions.filter(q => q.required);
    
    return requiredQuestions.every(q => 
      currentResponses[q.id] !== undefined && currentResponses[q.id] !== ''
    );
  };

  const canProceed = (): boolean => {
    return isStepComplete(currentStep, responses);
  };

  const handleNext = (): void => {
    if (questionnaire && currentStep < questionnaire.sections.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = (): void => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = (): void => {
    if (analysis && questionnaire && onGoalIdentified) {
      onGoalIdentified({
        responses,
        analysis,
        questionnaire
      });
    }
  };

  const renderQuestion = (question: Question): JSX.Element => {
    const value = responses[question.id];

    switch (question.type) {
      case 'single-select':
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <label
                key={option.value}
                className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleResponseChange(question.id, e.target.value)}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{option.label}</div>
                  {option.description && (
                    <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                  )}
                  {option.percentage && (
                    <div className="text-xs text-blue-600 mt-1">{option.percentage}</div>
                  )}
                  {option.risk && (
                    <div className={`text-xs mt-1 ${
                      option.risk === 'high' ? 'text-red-600' : 
                      option.risk === 'medium' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      Risk: {option.risk}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        );

      case 'multi-select':
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <label
                key={option.value}
                className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="checkbox"
                  value={option.value}
                  checked={(value || []).includes(option.value)}
                  onChange={(e) => {
                    const currentValues = value || [];
                    const newValues = e.target.checked
                      ? [...currentValues, option.value]
                      : currentValues.filter((v: string) => v !== option.value);
                    handleResponseChange(question.id, newValues);
                  }}
                  className="mr-3"
                />
                <span className="text-gray-900">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'scale':
        return (
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{question.labels?.[question.scale?.min || 0]}</span>
              <span>{question.labels?.[question.scale?.max || 10]}</span>
            </div>
            <input
              type="range"
              min={question.scale?.min || 0}
              max={question.scale?.max || 10}
              value={value || question.scale?.min || 0}
              onChange={(e) => handleResponseChange(question.id, parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-center text-lg font-medium text-gray-900">
              {value || question.scale?.min || 0}
            </div>
          </div>
        );

      case 'number':
        return (
          <div className="space-y-2">
            <input
              type="number"
              value={value || ''}
              onChange={(e) => handleResponseChange(question.id, parseFloat(e.target.value))}
              className="w-full p-3 border rounded-lg"
              placeholder="Enter a number"
              min="0"
              max={question.validation?.max}
            />
            {question.validation?.warningThreshold && value > question.validation.warningThreshold && (
              <div className="text-sm text-yellow-600">
                ⚠️ This expectation may be unrealistic for most investors
              </div>
            )}
            {question.validation?.max && value > question.validation.max && (
              <div className="text-sm text-red-600">
                ❌ This expectation is unrealistic and may indicate overconfidence bias
              </div>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div className="space-y-3">
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value="true"
                  checked={value === true}
                  onChange={() => handleResponseChange(question.id, true)}
                  className="mr-2"
                />
                Yes
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value="false"
                  checked={value === false}
                  onChange={() => handleResponseChange(question.id, false)}
                  className="mr-2"
                />
                No
              </label>
            </div>
            {question.warning && value === true && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                ⚠️ {question.warning}
              </div>
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            className="w-full p-3 border rounded-lg"
            placeholder="Enter your answer"
          />
        );
    }
  };

  const renderBiasEducation = (): JSX.Element | null => {
    if (!analysis?.biasesDetected.length && !analysis?.conflicts.length) return null;

    return (
      <ProgressiveDisclosure
        title="Important: Potential Bias Detected"
        variant="inline"
        defaultOpen={true}
        className="mb-6 border-orange-200 bg-orange-50"
      >
        <div className="space-y-4">
          {analysis.biasesDetected.map((bias, index) => {
            const biasInfo = (goalSystem as any).psychologicalBiases?.[bias.type] as PsychologicalBias | undefined;
            return (
              <div key={index} className="p-4 bg-white rounded-lg border border-orange-200">
                <div className="font-medium text-orange-800 mb-2">
                  {biasInfo?.name || bias.type}
                </div>
                <div className="text-sm text-orange-700 mb-2">
                  {biasInfo?.description || 'Psychological bias detected'}
                </div>
                <div className="text-xs text-orange-600">
                  Evidence: {bias.evidence}
                </div>
              </div>
            );
          })}
          
          {analysis.conflicts.map((conflict, index) => (
            <div key={index} className="p-4 bg-white rounded-lg border border-red-200">
              <div className="font-medium text-red-800 mb-2">Goal Conflict Detected</div>
              <div className="text-sm text-red-700 mb-2">{conflict.description}</div>
              <div className="text-sm text-red-600">{conflict.resolution}</div>
            </div>
          ))}
        </div>
      </ProgressiveDisclosure>
    );
  };

  const renderAnalysisResults = (): JSX.Element | null => {
    if (!analysis?.primaryGoal) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Your Investment Goal
          </h3>
          <GoalMatchIndicator
            goal={analysis.primaryGoal}
            matchScore={85}
            size="large"
            showDetails={true}
          />
        </div>

        {analysis.recommendations.length > 0 && (
          <ProgressiveDisclosure
            title="Personalized Recommendations"
            variant="grouped"
            defaultOpen={true}
          >
            <div className="space-y-3">
              {analysis.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    rec.priority === 'critical' ? 'border-red-200 bg-red-50' :
                    rec.priority === 'high' ? 'border-blue-200 bg-blue-50' :
                    'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-gray-900 mb-1">{rec.title}</div>
                  <div className="text-sm text-gray-700">{rec.description}</div>
                  {rec.priority === 'critical' && (
                    <div className="text-xs text-red-600 mt-1">
                      Priority: {rec.priority.toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ProgressiveDisclosure>
        )}

        <div className="text-center">
          <button
            onClick={handleComplete}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Continue to Stock Screening
          </button>
        </div>
      </div>
    );
  };

  if (!questionnaire) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading questionnaire...</div>
      </div>
    );
  }

  const currentSection = questionnaire.sections[currentStep];
  const isLastStep = currentStep === questionnaire.sections.length - 1;
  const isAnalysisStep = isLastStep && analysis;

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      {showProgressBar && (
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStep + 1} of {questionnaire.sections.length}</span>
            <span>{Math.round(((currentStep + 1) / questionnaire.sections.length) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / questionnaire.sections.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-8">
        {!isAnalysisStep ? (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {currentSection.title}
              </h2>
              <p className="text-gray-600">{currentSection.description}</p>
            </div>

            {renderBiasEducation()}

            <div className="space-y-8">
              {currentSection.questions.map((question) => (
                <div key={question.id} className="space-y-3">
                  <label className="block text-lg font-medium text-gray-900">
                    {question.question}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderQuestion(question)}
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              
              <button
                onClick={handleNext}
                disabled={!canProceed() || isAnalyzing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                {isAnalyzing ? 'Analyzing...' : isLastStep ? 'Complete' : 'Next'}
              </button>
            </div>
          </>
        ) : (
          renderAnalysisResults()
        )}
      </div>
    </div>
  );
};

export default GoalIdentificationWizard;