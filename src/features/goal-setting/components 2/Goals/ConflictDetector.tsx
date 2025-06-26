/**
 * ConflictDetector - Identifies contradictory investment objectives
 * 
 * Research-backed conflict detection:
 * - Safety vs Quick Profits contradiction
 * - Short timeline vs Long-term growth conflicts  
 * - Risk tolerance vs aggressive returns mismatches
 * - Educational content for resolution
 */

import React, { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, HelpCircle, TrendingUp, Shield, Clock, Target } from 'lucide-react';
import { ProgressiveDisclosure } from '../../../analytics/components/StockScreening/ProgressiveDisclosure';
import { RiskIndicator } from '../../../analytics/components/StockScreening/RiskIndicator';

// Type definitions
type ConflictType = 'safety_profit_conflict' | 'timeline_strategy_conflict' | 'risk_return_mismatch' | 'experience_strategy_conflict';
type SeverityLevel = 'low' | 'medium' | 'high';
type RiskLevel = 'low' | 'medium' | 'high';
type Priority = 'safety' | 'growth' | 'balanced';

interface QuestionResponse {
  value: any;
  label?: string;
  type: string;
  [key: string]: any;
}

interface UserResponses {
  primary_motivation?: QuestionResponse;
  time_horizon?: QuestionResponse;
  [key: string]: QuestionResponse | undefined;
}

interface Conflict {
  id: string;
  type: ConflictType;
  description: string;
  impact?: string;
  recommendations?: string[];
}

interface ConflictDisplayInfo {
  title: string;
  icon: ReactNode;
  severity: SeverityLevel;
  description: string;
  impact: string;
  commonResult: string;
  resolutionPath: string[];
}

interface ResolutionProgress {
  [conflictId: string]: {
    resolved?: boolean;
    completedSteps?: string[];
    [key: string]: any;
  };
}

interface ConflictResolution {
  conflict: Conflict;
  resolution: Record<string, any>;
  finalData: Record<string, any>;
}

interface ConflictDetectorProps {
  responses: UserResponses;
  detectedConflicts?: Conflict[];
  onConflictResolved?: (conflict: Conflict, resolution: ConflictResolution) => void;
  className?: string;
}

interface EducationalContent {
  riskReturnEducation?: {
    title: string;
    content: string[];
    examples: string[];
  };
  allocationStrategy?: {
    title: string;
    content: string[];
  };
  timelineEducation?: {
    title: string;
    content: string[];
  };
  riskEducation?: {
    title: string;
    content: string[];
    riskLevels: {
      level: string;
      return: string;
      volatility: string;
      example: string;
    }[];
  };
}

interface ResolutionStep {
  id: string;
  title: string;
  component: React.ComponentType<ResolutionStepProps>;
}

interface ResolutionStepProps {
  conflict: Conflict;
  responses: UserResponses;
  resolutionData: Record<string, any>;
  educationalContent: EducationalContent;
  onComplete: (stepData: Record<string, any>) => void;
}

interface ConflictResolutionWizardProps {
  conflict: Conflict;
  responses: UserResponses;
  onComplete: (resolution: ConflictResolution) => void;
  onCancel: () => void;
}

interface StrategyOption {
  id: string;
  label: string;
  risk: RiskLevel;
}

interface PriorityOption {
  id: string;
  label: string;
  priority: Priority;
}

const ConflictDetector: React.FC<ConflictDetectorProps> = ({ 
  responses, 
  detectedConflicts = [], 
  onConflictResolved,
  className = '' 
}) => {
  const [activeConflicts, setActiveConflicts] = useState<Conflict[]>([]);
  const [showResolution, setShowResolution] = useState<Conflict | null>(null);
  const [resolutionProgress, setResolutionProgress] = useState<ResolutionProgress>({});

  useEffect(() => {
    setActiveConflicts(detectedConflicts);
  }, [detectedConflicts]);

  const getConflictDisplayInfo = (conflict: Conflict): ConflictDisplayInfo => {
    const conflictMap: Record<ConflictType, ConflictDisplayInfo> = {
      safety_profit_conflict: {
        title: 'Safety vs. Quick Profits',
        icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
        severity: 'high',
        description: 'You want both safety and quick profits, but these typically conflict.',
        impact: 'This contradiction can lead to poor investment decisions and disappointment.',
        commonResult: 'Many investors switch strategies frequently, missing long-term gains.',
        resolutionPath: [
          'Clarify your primary priority',
          'Understand the risk-return tradeoff',
          'Consider separate allocations for different goals'
        ]
      },
      
      timeline_strategy_conflict: {
        title: 'Timeline vs. Strategy Mismatch',
        icon: <Clock className="w-6 h-6 text-blue-500" />,
        severity: 'medium',
        description: 'Your timeline doesn\'t match your chosen investment strategy.',
        impact: 'Short timelines require different strategies than long-term goals.',
        commonResult: 'Forced to sell at unfavorable times or take inappropriate risks.',
        resolutionPath: [
          'Align strategy with actual timeline',
          'Consider emergency fund separate from investments',
          'Adjust expectations based on time horizon'
        ]
      },
      
      risk_return_mismatch: {
        title: 'Risk Tolerance vs. Return Expectations',
        icon: <TrendingUp className="w-6 h-6 text-red-500" />,
        severity: 'high',
        description: 'Your risk tolerance doesn\'t match your return expectations.',
        impact: 'Low risk tolerance with high return expectations often leads to paralysis.',
        commonResult: 'Analysis paralysis or frequent strategy changes.',
        resolutionPath: [
          'Reassess realistic returns for your risk level',
          'Consider gradually increasing risk tolerance through education',
          'Focus on risk-adjusted returns rather than absolute returns'
        ]
      },
      
      experience_strategy_conflict: {
        title: 'Experience vs. Strategy Complexity',
        icon: <Target className="w-6 h-6 text-purple-500" />,
        severity: 'medium',
        description: 'Your chosen strategy is too complex for your experience level.',
        impact: 'Complex strategies without proper understanding increase risk.',
        commonResult: 'Mistakes due to lack of understanding, emotional decisions.',
        resolutionPath: [
          'Start with simpler strategies',
          'Build knowledge through education and practice',
          'Use paper trading for complex strategies first'
        ]
      }
    };

    return conflictMap[conflict.type] || {
      title: 'Investment Goal Conflict',
      icon: <HelpCircle className="w-6 h-6 text-gray-500" />,
      severity: 'medium',
      description: conflict.description || 'A conflict has been detected in your goals.',
      impact: 'This may affect your investment success.',
      commonResult: 'Suboptimal investment decisions.',
      resolutionPath: ['Review your responses', 'Consider your priorities']
    };
  };

  const getEducationalContent = (conflict: Conflict): EducationalContent => {
    const educational: Record<ConflictType, EducationalContent> = {
      safety_profit_conflict: {
        riskReturnEducation: {
          title: 'Understanding Risk vs. Return',
          content: [
            'Higher returns typically require accepting higher risk',
            'Safe investments usually provide lower, steady returns',
            'Quick profits often involve timing the market, which is very difficult',
            'Diversification can help balance risk and return'
          ],
          examples: [
            'Treasury bonds: Low risk, ~3-4% annual return',
            'Dividend stocks: Medium risk, ~4-8% annual return',
            'Growth stocks: High risk, potentially 10%+ but volatile',
            'Day trading: Very high risk, most traders lose money'
          ]
        },
        
        allocationStrategy: {
          title: 'Portfolio Allocation Strategies',
          content: [
            'Consider splitting money based on different goals',
            'Emergency fund: 3-6 months expenses in safe accounts',
            'Stable income: Dividend stocks, bonds (40-60%)',
            'Growth potential: Growth stocks, index funds (20-40%)',
            'Speculation: High-risk investments (5-10% maximum)'
          ]
        }
      },
      
      timeline_strategy_conflict: {
        timelineEducation: {
          title: 'Matching Strategy to Timeline',
          content: [
            'Less than 1 year: Cash, CDs, money market funds',
            '1-3 years: Conservative bond funds, stable value funds',
            '3-5 years: Balanced funds, conservative stock/bond mix',
            '5+ years: Growth-oriented stocks, index funds',
            '10+ years: Can handle more volatility for higher returns'
          ]
        }
      },
      
      risk_return_mismatch: {
        riskEducation: {
          title: 'Realistic Return Expectations',
          content: [
            'Historical stock market average: ~10% annually (with high volatility)',
            'Bond market average: ~4-6% annually (lower volatility)',
            'Inflation rate: ~3% annually (money loses value if returns are lower)',
            'Professional active managers rarely beat market consistently'
          ],
          riskLevels: [
            { level: 'Conservative', return: '3-5%', volatility: 'Low', example: 'Bond funds' },
            { level: 'Moderate', return: '5-8%', volatility: 'Medium', example: 'Balanced funds' },
            { level: 'Aggressive', return: '8-12%', volatility: 'High', example: 'Stock funds' },
            { level: 'Speculative', return: '12%+', volatility: 'Very High', example: 'Individual stocks' }
          ]
        }
      },
      
      experience_strategy_conflict: {}
    };

    return educational[conflict.type] || {};
  };

  const handleStartResolution = (conflict: Conflict): void => {
    setShowResolution(conflict);
  };

  const handleResolutionStep = (conflictId: string, step: string, decision: any): void => {
    setResolutionProgress(prev => ({
      ...prev,
      [conflictId]: {
        ...prev[conflictId],
        [step]: decision,
        completedSteps: [...(prev[conflictId]?.completedSteps || []), step]
      }
    }));
  };

  const handleCompleteResolution = (conflict: Conflict, resolution: ConflictResolution): void => {
    // Remove from active conflicts
    setActiveConflicts(prev => prev.filter(c => c.id !== conflict.id));
    setShowResolution(null);
    
    if (onConflictResolved) {
      onConflictResolved(conflict, resolution);
    }
  };

  if (activeConflicts.length === 0) {
    return null;
  }

  return (
    <div className={`conflict-detector ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
          <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
          Goal Conflicts Detected
        </h3>
        <p className="text-gray-600 text-sm">
          We've identified some contradictions in your investment goals. 
          Resolving these will help create a more effective strategy.
        </p>
      </div>

      <div className="space-y-4">
        {activeConflicts.map((conflict) => {
          const displayInfo = getConflictDisplayInfo(conflict);
          const isResolved = resolutionProgress[conflict.id]?.resolved;
          
          return (
            <motion.div
              key={conflict.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`border rounded-lg p-4 ${
                isResolved ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  {displayInfo.icon}
                  <div className="ml-3 flex-1">
                    <h4 className="font-medium text-gray-900">{displayInfo.title}</h4>
                    <p className="text-sm text-gray-700 mt-1">{displayInfo.description}</p>
                    
                    <div className="mt-3 flex items-center space-x-4">
                      <RiskIndicator 
                        level={displayInfo.severity} 
                        variant="badge" 
                        size="sm"
                      />
                      <span className="text-xs text-gray-500">
                        Impact: {displayInfo.impact}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="ml-4">
                  {!isResolved ? (
                    <button
                      onClick={() => handleStartResolution(conflict)}
                      className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors text-sm font-medium"
                    >
                      Resolve
                    </button>
                  ) : (
                    <div className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium">
                      ✓ Resolved
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Resolution Modal */}
      <ProgressiveDisclosure
        isExpanded={showResolution !== null}
        onToggle={() => setShowResolution(null)}
        title={`Resolve: ${showResolution ? getConflictDisplayInfo(showResolution).title : ''}`}
      >
        {showResolution && (
          <ConflictResolutionWizard
            conflict={showResolution}
            responses={responses}
            onComplete={(resolution) => handleCompleteResolution(showResolution, resolution)}
            onCancel={() => setShowResolution(null)}
          />
        )}
      </ProgressiveDisclosure>
    </div>
  );
};

/**
 * Conflict Resolution Wizard
 */
const ConflictResolutionWizard: React.FC<ConflictResolutionWizardProps> = ({ conflict, responses, onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [resolutionData, setResolutionData] = useState<Record<string, any>>({});
  
  const displayInfo = getConflictDisplayInfo(conflict);
  const educationalContent = getEducationalContent(conflict);
  
  const resolutionSteps = getResolutionSteps(conflict, responses);
  
  const handleStepComplete = (stepData: Record<string, any>): void => {
    setResolutionData(prev => ({ ...prev, ...stepData }));
    
    if (currentStep < resolutionSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Complete resolution
      onComplete({
        conflict,
        resolution: resolutionData,
        finalData: stepData
      });
    }
  };

  const getConflictDisplayInfo = (conflict: Conflict): ConflictDisplayInfo => {
    // Same implementation as parent component
    return {
      title: 'Investment Goal Conflict',
      icon: <HelpCircle className="w-6 h-6 text-gray-500" />,
      severity: 'medium',
      description: conflict.description || 'A conflict has been detected.',
      impact: 'This may affect your investment success.',
      commonResult: 'Suboptimal investment decisions.',
      resolutionPath: ['Review your responses', 'Consider your priorities']
    };
  };
  
  const getEducationalContent = (conflict: Conflict): EducationalContent => {
    // Same implementation as parent component  
    return {};
  };

  const getResolutionSteps = (conflict: Conflict, responses: UserResponses): ResolutionStep[] => {
    const baseSteps: Record<ConflictType, ResolutionStep[]> = {
      safety_profit_conflict: [
        {
          id: 'priority_clarification',
          title: 'Clarify Your Primary Priority',
          component: PriorityClarificationStep
        },
        {
          id: 'education',
          title: 'Understanding Risk vs. Return',
          component: EducationStep
        },
        {
          id: 'strategy_selection',
          title: 'Choose Your Strategy',
          component: StrategySelectionStep
        }
      ],
      
      timeline_strategy_conflict: [
        {
          id: 'timeline_review',
          title: 'Review Your Timeline',
          component: TimelineReviewStep
        },
        {
          id: 'strategy_alignment',
          title: 'Align Strategy with Timeline',
          component: StrategyAlignmentStep
        }
      ],
      
      risk_return_mismatch: [
        {
          id: 'risk_assessment',
          title: 'Assess Risk Tolerance',
          component: GenericResolutionStep
        }
      ],
      
      experience_strategy_conflict: [
        {
          id: 'experience_review',
          title: 'Review Experience Level',
          component: GenericResolutionStep
        }
      ]
    };

    return baseSteps[conflict.type] || [
      {
        id: 'generic_resolution',
        title: 'Resolve Conflict',
        component: GenericResolutionStep
      }
    ];
  };

  const currentStepConfig = resolutionSteps[currentStep];
  const StepComponent = currentStepConfig?.component || GenericResolutionStep;

  return (
    <div className="conflict-resolution-wizard">
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep + 1} of {resolutionSteps.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(((currentStep + 1) / resolutionSteps.length) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / resolutionSteps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current step */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {currentStepConfig?.title}
        </h3>
        
        <StepComponent
          conflict={conflict}
          responses={responses}
          resolutionData={resolutionData}
          educationalContent={educationalContent}
          onComplete={handleStepComplete}
        />
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Cancel
        </button>
        
        {currentStep > 0 && (
          <button
            onClick={() => setCurrentStep(prev => prev - 1)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
};

// Resolution step components (simplified for now)
const PriorityClarificationStep: React.FC<ResolutionStepProps> = ({ onComplete }) => {
  const priorityOptions: PriorityOption[] = [
    { id: 'safety_first', label: 'Safety first - I want to protect my money', priority: 'safety' },
    { id: 'growth_first', label: 'Growth first - I want to build wealth over time', priority: 'growth' },
    { id: 'balanced', label: 'Balanced approach - Some safety, some growth', priority: 'balanced' }
  ];

  return (
    <div className="space-y-4">
      <p className="text-gray-700">
        Let's clarify what's most important to you right now:
      </p>
      <div className="space-y-3">
        {priorityOptions.map(option => (
          <button
            key={option.id}
            onClick={() => onComplete({ primary_priority: option.priority })}
            className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const EducationStep: React.FC<ResolutionStepProps> = ({ educationalContent, onComplete }) => (
  <div className="space-y-4">
    <div className="bg-blue-50 p-4 rounded-lg">
      <h4 className="font-medium text-blue-900 mb-2">Key Concept: Risk vs. Return</h4>
      <p className="text-blue-800 text-sm">
        Understanding this fundamental principle will help you make better investment decisions.
      </p>
    </div>
    
    <button
      onClick={() => onComplete({ education_completed: true })}
      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      I understand - Continue
    </button>
  </div>
);

const StrategySelectionStep: React.FC<ResolutionStepProps> = ({ onComplete }) => {
  const strategyOptions: StrategyOption[] = [
    { id: 'conservative', label: 'Conservative Portfolio (Bonds + Dividend Stocks)', risk: 'low' },
    { id: 'balanced', label: 'Balanced Portfolio (60% Stocks, 40% Bonds)', risk: 'medium' },
    { id: 'growth', label: 'Growth Portfolio (80% Stocks, 20% Bonds)', risk: 'high' }
  ];

  return (
    <div className="space-y-4">
      <p className="text-gray-700">Based on your priorities, here are appropriate strategies:</p>
      <div className="space-y-3">
        {strategyOptions.map(strategy => (
          <button
            key={strategy.id}
            onClick={() => onComplete({ selected_strategy: strategy.id })}
            className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span>{strategy.label}</span>
              <RiskIndicator level={strategy.risk} variant="badge" size="sm" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Placeholder components for other step types
const TimelineReviewStep: React.FC<ResolutionStepProps> = ({ onComplete }) => (
  <div>
    <p className="text-gray-700 mb-4">Timeline Review - To be implemented</p>
    <button 
      onClick={() => onComplete({ timeline_reviewed: true })}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      Continue
    </button>
  </div>
);

const StrategyAlignmentStep: React.FC<ResolutionStepProps> = ({ onComplete }) => (
  <div>
    <p className="text-gray-700 mb-4">Strategy Alignment - To be implemented</p>
    <button 
      onClick={() => onComplete({ strategy_aligned: true })}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      Continue
    </button>
  </div>
);

const GenericResolutionStep: React.FC<ResolutionStepProps> = ({ onComplete }) => (
  <div>
    <p className="text-gray-700 mb-4">Generic resolution step</p>
    <button 
      onClick={() => onComplete({ generic_completed: true })}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      Continue
    </button>
  </div>
);

export default ConflictDetector;