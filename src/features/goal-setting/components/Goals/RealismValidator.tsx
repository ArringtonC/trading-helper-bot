/**
 * RealismValidator - Validates goal feasibility against real-world constraints
 */

import React, { useState, useEffect, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, BookOpen, Calculator } from 'lucide-react';
import { ProgressiveDisclosure } from '../StockScreening/ProgressiveDisclosure';

// Type definitions
type GoalType = 'income_generation' | 'growth_seeking' | 'capital_preservation' | 'learning_practice' | 'active_trading';
type ValidationIssueType = 'unrealistic_timeline' | 'insufficient_capital' | 'risk_mismatch' | 'experience_gap' | 'market_conditions';
type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

interface UserProfile {
  id: string;
  experienceLevel: string;
  accountSize: number;
  riskTolerance?: string;
  timeHorizon?: string;
  [key: string]: any;
}

interface GoalCandidate {
  id: string;
  type: GoalType;
  title: string;
  description: string;
  targetAmount?: number;
  timeframe: string;
  expectedReturn?: number;
  requiredCapital?: number;
  riskLevel: string;
  [key: string]: any;
}

interface ValidationIssue {
  type: ValidationIssueType;
  severity: SeverityLevel;
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  educationalContent?: EducationalContent;
}

interface EducationalContent {
  title: string;
  content: string[];
  actionItems: string[];
  resources: string[];
}

interface ValidationResult {
  goalId: string;
  isRealistic: boolean;
  overallScore: number;
  issues: ValidationIssue[];
  educationalContent: EducationalContent[];
  recommendations: string[];
  adjustedGoal?: Partial<GoalCandidate>;
}

interface QuestionResponse {
  value: any;
  label?: string;
  type: string;
  [key: string]: any;
}

interface UserResponses {
  [key: string]: QuestionResponse;
}

interface RealismValidatorProps {
  goalCandidates?: GoalCandidate[];
  userProfile?: UserProfile;
  responses?: UserResponses;
  onValidationComplete?: (results: ValidationResult[]) => void;
  className?: string;
}

interface ValidationCardProps {
  result: ValidationResult;
  goal: GoalCandidate;
  onShowEducation: (content: EducationalContent[]) => void;
  onAcceptAdjustment?: (goalId: string, adjustments: Partial<GoalCandidate>) => void;
}

const RealismValidator: React.FC<RealismValidatorProps> = ({ 
  goalCandidates = [], 
  userProfile, 
  responses = {},
  onValidationComplete,
  className = '' 
}) => {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [showEducation, setShowEducation] = useState<EducationalContent[] | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (goalCandidates.length > 0 && userProfile) {
      validateAllGoals();
    }
  }, [goalCandidates, userProfile, responses]);

  const validateGoalRealism = async (goal: GoalCandidate, userProfile: UserProfile, responses: UserResponses): Promise<ValidationResult> => {
    const issues: ValidationIssue[] = [];
    const educationalContent: EducationalContent[] = [];
    const recommendations: string[] = [];
    let overallScore = 100;

    // Timeline validation
    const timelineIssue = validateTimeline(goal, responses);
    if (timelineIssue) {
      issues.push(timelineIssue);
      overallScore -= timelineIssue.severity === 'critical' ? 40 : timelineIssue.severity === 'high' ? 25 : 10;
    }

    // Capital requirements validation
    const capitalIssue = validateCapitalRequirements(goal, userProfile);
    if (capitalIssue) {
      issues.push(capitalIssue);
      overallScore -= capitalIssue.severity === 'critical' ? 35 : capitalIssue.severity === 'high' ? 20 : 8;
    }

    // Risk tolerance validation
    const riskIssue = validateRiskAlignment(goal, responses);
    if (riskIssue) {
      issues.push(riskIssue);
      overallScore -= riskIssue.severity === 'high' ? 15 : 8;
    }

    // Experience level validation
    const experienceIssue = validateExperienceLevel(goal, userProfile);
    if (experienceIssue) {
      issues.push(experienceIssue);
      overallScore -= experienceIssue.severity === 'high' ? 20 : 10;
    }

    // Market conditions validation
    const marketIssue = validateMarketConditions(goal);
    if (marketIssue) {
      issues.push(marketIssue);
      overallScore -= marketIssue.severity === 'medium' ? 10 : 5;
    }

    // Generate educational content based on issues
    const educationalContentForIssues = generateEducationalContent(issues, goal);
    educationalContent.push(...educationalContentForIssues);

    // Generate recommendations
    const goalRecommendations = generateRecommendations(issues, goal, userProfile);
    recommendations.push(...goalRecommendations);

    // Suggest adjusted goal if issues are significant
    let adjustedGoal: Partial<GoalCandidate> | undefined;
    if (overallScore < 70 && issues.some(i => i.severity === 'high' || i.severity === 'critical')) {
      adjustedGoal = generateAdjustedGoal(goal, issues, userProfile);
    }

    return {
      goalId: goal.id,
      isRealistic: overallScore >= 70 && !issues.some(i => i.severity === 'critical'),
      overallScore: Math.max(0, overallScore),
      issues,
      educationalContent,
      recommendations,
      adjustedGoal
    };
  };

  const validateTimeline = (goal: GoalCandidate, responses: UserResponses): ValidationIssue | null => {
    const timeframe = goal.timeframe.toLowerCase();
    const expectedReturn = goal.expectedReturn || 0;
    
    // Check for unrealistic short-term high return expectations
    if ((timeframe.includes('month') || timeframe.includes('year') && !timeframe.includes('years')) && expectedReturn > 0.15) {
      return {
        type: 'unrealistic_timeline',
        severity: 'critical',
        title: 'Unrealistic Timeline Expectations',
        description: `Expecting ${(expectedReturn * 100).toFixed(0)}% returns in ${timeframe} is extremely unrealistic.`,
        impact: 'High probability of disappointment and poor investment decisions.',
        recommendation: 'Consider extending timeline to 3+ years or reducing return expectations to 8-12% annually.',
        educationalContent: {
          title: 'Realistic Investment Timelines',
          content: [
            'Short-term investing (< 1 year) should focus on capital preservation',
            'Historical stock market returns average 10% annually over decades',
            'High returns require accepting significant volatility and risk',
            'Professional traders rarely achieve consistent high returns'
          ],
          actionItems: [
            'Set timeline of at least 3-5 years for growth goals',
            'Consider bonds or CDs for short-term needs',
            'Lower return expectations to realistic 8-12% annually'
          ],
          resources: [
            'Historical market performance data',
            'Risk vs return educational modules',
            'Timeline-appropriate investment strategies'
          ]
        }
      };
    }

    return null;
  };

  const validateCapitalRequirements = (goal: GoalCandidate, userProfile: UserProfile): ValidationIssue | null => {
    const requiredCapital = goal.requiredCapital || goal.targetAmount || 0;
    const availableCapital = userProfile.accountSize;
    
    if (requiredCapital > availableCapital * 1.5) {
      return {
        type: 'insufficient_capital',
        severity: 'critical',
        title: 'Insufficient Capital',
        description: `Goal requires $${requiredCapital.toLocaleString()} but account has $${availableCapital.toLocaleString()}.`,
        impact: 'Goal cannot be achieved with current capital allocation.',
        recommendation: 'Reduce target amount or plan to increase account size over time.',
        educationalContent: {
          title: 'Capital Allocation Strategies',
          content: [
            'Never invest more than you can afford to lose',
            'Maintain emergency fund separate from investments',
            'Consider dollar-cost averaging to build positions over time',
            'Start with smaller, achievable goals'
          ],
          actionItems: [
            'Set achievable target based on current capital',
            'Plan systematic savings to increase investment capital',
            'Consider lower-cost investment options'
          ],
          resources: [
            'Portfolio allocation guides',
            'Emergency fund planning',
            'Dollar-cost averaging strategies'
          ]
        }
      };
    }

    return null;
  };

  const validateRiskAlignment = (goal: GoalCandidate, responses: UserResponses): ValidationIssue | null => {
    const goalRisk = goal.riskLevel.toLowerCase();
    const userRiskTolerance = responses.risk_tolerance?.value?.toLowerCase() || 'medium';
    
    if ((goalRisk === 'high' && userRiskTolerance === 'low') || 
        (goalRisk === 'medium' && userRiskTolerance === 'very_low')) {
      return {
        type: 'risk_mismatch',
        severity: 'high',
        title: 'Risk Tolerance Mismatch',
        description: `Goal requires ${goalRisk} risk but you prefer ${userRiskTolerance} risk investments.`,
        impact: 'Likely to abandon strategy during market volatility.',
        recommendation: 'Choose goals aligned with your risk tolerance or work on increasing risk understanding.',
        educationalContent: {
          title: 'Understanding Investment Risk',
          content: [
            'Higher returns typically require accepting higher volatility',
            'Risk tolerance can be developed through education and experience',
            'Diversification helps manage risk while maintaining growth potential',
            'Consider starting with lower-risk options and gradually increasing'
          ],
          actionItems: [
            'Complete risk tolerance assessment',
            'Start with conservative investments',
            'Learn about risk management strategies'
          ],
          resources: [
            'Risk tolerance questionnaires',
            'Diversification strategies',
            'Risk management education'
          ]
        }
      };
    }

    return null;
  };

  const validateExperienceLevel = (goal: GoalCandidate, userProfile: UserProfile): ValidationIssue | null => {
    const experience = userProfile.experienceLevel.toLowerCase();
    const goalType = goal.type;
    
    if (experience === 'beginner' && (goalType === 'active_trading' || goal.riskLevel === 'high')) {
      return {
        type: 'experience_gap',
        severity: 'high',
        title: 'Experience Level Mismatch',
        description: `Advanced strategy not recommended for ${experience} investors.`,
        impact: 'High probability of mistakes and losses due to inexperience.',
        recommendation: 'Start with simpler strategies and build experience gradually.',
        educationalContent: {
          title: 'Investment Learning Path',
          content: [
            'Start with index funds or target-date funds',
            'Paper trade before risking real money',
            'Learn fundamental analysis before individual stock picking',
            'Build experience with lower-risk strategies first'
          ],
          actionItems: [
            'Begin with educational modules for beginners',
            'Practice with paper trading accounts',
            'Set learning goals alongside financial goals'
          ],
          resources: [
            'Beginner investment courses',
            'Paper trading platforms',
            'Progressive learning modules'
          ]
        }
      };
    }

    return null;
  };

  const validateMarketConditions = (goal: GoalCandidate): ValidationIssue | null => {
    // Simplified market conditions check
    if (goal.expectedReturn && goal.expectedReturn > 0.15) {
      return {
        type: 'market_conditions',
        severity: 'medium',
        title: 'Market Conditions Consideration',
        description: 'Current market conditions may not support expected returns.',
        impact: 'Returns may be lower than expected in current environment.',
        recommendation: 'Consider market cycle timing and adjust expectations accordingly.',
        educationalContent: {
          title: 'Market Cycles and Timing',
          content: [
            'Markets move in cycles of growth and decline',
            'Timing the market consistently is extremely difficult',
            'Dollar-cost averaging reduces timing risk',
            'Focus on long-term trends rather than short-term movements'
          ],
          actionItems: [
            'Study market cycle patterns',
            'Consider dollar-cost averaging strategy',
            'Set realistic expectations for current conditions'
          ],
          resources: [
            'Market cycle education',
            'Economic indicator guides',
            'Market timing research'
          ]
        }
      };
    }

    return null;
  };

  const generateEducationalContent = (issues: ValidationIssue[], goal: GoalCandidate): EducationalContent[] => {
    return issues
      .filter(issue => issue.educationalContent)
      .map(issue => issue.educationalContent!)
      .reduce((unique, content) => {
        if (!unique.find(u => u.title === content.title)) {
          unique.push(content);
        }
        return unique;
      }, [] as EducationalContent[]);
  };

  const generateRecommendations = (issues: ValidationIssue[], goal: GoalCandidate, userProfile: UserProfile): string[] => {
    const recommendations: string[] = [];
    
    issues.forEach(issue => {
      recommendations.push(issue.recommendation);
    });

    // Add general recommendations based on goal type and user profile
    if (userProfile.experienceLevel === 'beginner') {
      recommendations.push('Consider starting with educational modules before implementing strategy');
    }

    if (goal.type === 'income_generation') {
      recommendations.push('Focus on dividend aristocrats with 10+ year track records');
    }

    return [...new Set(recommendations)]; // Remove duplicates
  };

  const generateAdjustedGoal = (goal: GoalCandidate, issues: ValidationIssue[], userProfile: UserProfile): Partial<GoalCandidate> => {
    const adjustments: Partial<GoalCandidate> = {};

    // Adjust timeline if too aggressive
    if (issues.some(i => i.type === 'unrealistic_timeline')) {
      adjustments.timeframe = '3-5 years';
      adjustments.expectedReturn = 0.08; // More realistic 8% annually
    }

    // Adjust target amount if too high for available capital
    if (issues.some(i => i.type === 'insufficient_capital')) {
      adjustments.targetAmount = userProfile.accountSize * 0.8; // 80% of available capital
    }

    // Adjust risk level if mismatch
    if (issues.some(i => i.type === 'risk_mismatch')) {
      adjustments.riskLevel = 'medium';
    }

    return adjustments;
  };

  const validateAllGoals = async (): Promise<void> => {
    if (!userProfile) return;
    
    setIsValidating(true);
    
    try {
      const results = await Promise.all(
        goalCandidates.map(goal => validateGoalRealism(goal, userProfile, responses))
      );
      
      setValidationResults(results);
      
      if (onValidationComplete) {
        onValidationComplete(results);
      }
    } catch (error) {
      console.error('Goal validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const toggleExpanded = (goalId: string): void => {
    setExpandedResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(goalId)) {
        newSet.delete(goalId);
      } else {
        newSet.add(goalId);
      }
      return newSet;
    });
  };

  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-blue-600 bg-blue-50';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getSeverityIcon = (severity: SeverityLevel): ReactNode => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'high':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'medium':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  if (isValidating) {
    return (
      <div className={`realism-validator ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Validating goal realism...</p>
          </div>
        </div>
      </div>
    );
  }

  if (validationResults.length === 0) {
    return (
      <div className={`realism-validator ${className}`}>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
            <Calculator className="w-5 h-5 text-blue-500 mr-2" />
            Goal Realism Assessment
          </h3>
          <p className="text-gray-600 text-sm">
            No goals available for validation. Complete the goal identification process first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`realism-validator ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
          <Calculator className="w-5 h-5 text-blue-500 mr-2" />
          Goal Realism Assessment
        </h3>
        <p className="text-gray-600 text-sm">
          We've analyzed your goals against real-world constraints and market conditions.
        </p>
      </div>

      <div className="space-y-4">
        {validationResults.map((result) => {
          const goal = goalCandidates.find(g => g.id === result.goalId);
          if (!goal) return null;

          return (
            <ValidationCard
              key={result.goalId}
              result={result}
              goal={goal}
              onShowEducation={setShowEducation}
            />
          );
        })}
      </div>

      {/* Educational Content Modal */}
      <ProgressiveDisclosure
        isExpanded={showEducation !== null}
        onToggle={() => setShowEducation(null)}
        title="Educational Resources"
      >
        {showEducation && (
          <div className="space-y-6">
            {showEducation.map((content, index) => (
              <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-blue-900 mb-4">{content.title}</h4>
                
                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium text-blue-800 mb-2">Key Concepts:</h5>
                    <ul className="space-y-1">
                      {content.content.map((item, idx) => (
                        <li key={idx} className="text-blue-700 text-sm flex items-start">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-blue-800 mb-2">Action Items:</h5>
                    <ul className="space-y-1">
                      {content.actionItems.map((action, idx) => (
                        <li key={idx} className="text-blue-700 text-sm flex items-start">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ProgressiveDisclosure>
    </div>
  );
};

/**
 * Validation Result Card Component
 */
const ValidationCard: React.FC<ValidationCardProps> = ({ result, goal, onShowEducation, onAcceptAdjustment }) => {
  const [expanded, setExpanded] = useState(false);
  
  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getSeverityColor = (severity: SeverityLevel): string => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-lg p-6 ${getScoreColor(result.overallScore)}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">{goal.title}</h4>
          <p className="text-sm text-gray-600">{goal.description}</p>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold">{result.overallScore}</div>
          <div className="text-xs text-gray-500">Realism Score</div>
        </div>
      </div>

      {/* Issues Summary */}
      {result.issues.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {result.issues.length} issue{result.issues.length !== 1 ? 's' : ''} identified
            </span>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {expanded ? 'Hide Details' : 'View Details'}
            </button>
          </div>

          {expanded && (
            <div className="space-y-3">
              {result.issues.map((issue, index) => (
                <div key={index} className={`p-3 rounded border ${getSeverityColor(issue.severity)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{issue.title}</h5>
                    <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(issue.severity)}`}>
                      {issue.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{issue.description}</p>
                  <p className="text-sm font-medium text-gray-900">
                    <span className="text-gray-600">Recommendation:</span> {issue.recommendation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Adjusted Goal Suggestion */}
      {result.adjustedGoal && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h5 className="font-medium text-green-900 mb-2">Suggested Adjustments</h5>
          <div className="text-sm text-green-800 space-y-1">
            {result.adjustedGoal.timeframe && (
              <div>Timeline: {result.adjustedGoal.timeframe}</div>
            )}
            {result.adjustedGoal.targetAmount && (
              <div>Target: ${result.adjustedGoal.targetAmount.toLocaleString()}</div>
            )}
            {result.adjustedGoal.expectedReturn && (
              <div>Expected Return: {(result.adjustedGoal.expectedReturn * 100).toFixed(0)}% annually</div>
            )}
          </div>
          {onAcceptAdjustment && (
            <button
              onClick={() => onAcceptAdjustment(result.goalId, result.adjustedGoal!)}
              className="mt-3 px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
            >
              Apply Adjustments
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {result.educationalContent.length > 0 && (
            <button
              onClick={() => onShowEducation(result.educationalContent)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <BookOpen className="w-4 h-4 mr-1" />
              Learn More
            </button>
          )}
        </div>
        
        <div className="text-sm text-gray-600">
          {result.isRealistic ? (
            <span className="text-green-600 font-medium">✓ Realistic Goal</span>
          ) : (
            <span className="text-red-600 font-medium">⚠ Needs Adjustment</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default RealismValidator;