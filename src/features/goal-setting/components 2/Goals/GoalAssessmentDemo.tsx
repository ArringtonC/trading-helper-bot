/**
 * GoalAssessmentDemo - Demonstration component for Phase 2, Task 1 implementation
 * 
 * Research Showcase:
 * - Goal-first approach: 400+ basis points performance improvement
 * - 20-30% beginner quit rate reduction with proper goal-setting
 * - Progressive disclosure: 45% reduction in information overload
 * - 5 primary goal categories with psychological bias detection
 * - SMART goal framework validation
 * - Mobile-first design: 89% Android coverage
 */

import React, { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Brain,
  Shield,
  BookOpen,
  Zap,
  Star,
  Play,
  RotateCcw,
  Info
} from 'lucide-react';
import { GoalDefinitionStep } from './index';
import { RESEARCH_METRICS, GOAL_CATEGORIES, getGoalCategoryInfo } from './index';

// Type definitions
type DemoMode = 'overview' | 'assessment' | 'results';
type GoalType = 'income_generation' | 'growth_seeking' | 'capital_preservation' | 'learning_practice' | 'active_trading';
type BiasType = 'overconfidence' | 'loss_aversion' | 'planning_fallacy';
type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

interface UserProfile {
  id: string;
  experienceLevel: ExperienceLevel;
  accountSize: number;
  [key: string]: any;
}

interface ResearchHighlight {
  metric: string;
  label: string;
  description: string;
  icon: ReactNode;
  color: string;
}

interface GoalCategoryInfo {
  id: GoalType;
  name: string;
  description: string;
  percentage: string;
  typicalReturn: string;
  riskLevel: string;
  [key: string]: any;
}

interface BiasDetectionFeature {
  bias: string;
  description: string;
  prevalence: string;
  icon: ReactNode;
}

interface SmartCriteria {
  criteria: string;
  description: string;
  icon: ReactNode;
}

interface DemoResults {
  finalGoals?: Goal[];
  goalAlignment?: number;
  assessment?: any;
  responses?: Record<string, any>;
  [key: string]: any;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  targetDisplay: string;
  timeframe: string;
  [key: string]: any;
}

interface ProgressData {
  responses: Record<string, any>;
  progress: {
    percentage: number;
    currentStep: string;
  };
  biases?: any[];
  conflicts?: any[];
}

const GoalAssessmentDemo: React.FC = () => {
  const [demoMode, setDemoMode] = useState<DemoMode>('overview');
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: 'demo_user',
    experienceLevel: 'beginner',
    accountSize: 10000
  });
  const [demoResults, setDemoResults] = useState<DemoResults | null>(null);
  const [currentMetric, setCurrentMetric] = useState(0);

  // Research metrics animation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMetric(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const researchHighlights: ResearchHighlight[] = [
    {
      metric: `+${RESEARCH_METRICS.PERFORMANCE_IMPROVEMENT}`,
      label: 'Basis Points Improvement',
      description: 'Goal-first approach delivers significant performance gains',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'text-green-600'
    },
    {
      metric: `-${RESEARCH_METRICS.QUIT_RATE_REDUCTION}%`,
      label: 'Beginner Quit Rate Reduction',
      description: 'Proper goal-setting prevents early abandonment',
      icon: <Users className="w-6 h-6" />,
      color: 'text-blue-600'
    },
    {
      metric: `-${RESEARCH_METRICS.OVERLOAD_REDUCTION}%`,
      label: 'Information Overload Reduction',
      description: 'Progressive disclosure improves comprehension',
      icon: <Brain className="w-6 h-6" />,
      color: 'text-purple-600'
    },
    {
      metric: '5',
      label: 'Primary Goal Categories',
      description: 'Research-backed trader motivation mapping',
      icon: <Target className="w-6 h-6" />,
      color: 'text-amber-600'
    }
  ];

  const goalCategories: GoalCategoryInfo[] = Object.values(GOAL_CATEGORIES).map((category: string) => ({
    ...getGoalCategoryInfo(category),
    id: category as GoalType
  }));

  const biasDetectionFeatures: BiasDetectionFeature[] = [
    {
      bias: 'Overconfidence',
      description: 'Detects unrealistic expectations and excessive risk tolerance',
      prevalence: '80-90%',
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />
    },
    {
      bias: 'Loss Aversion',
      description: 'Identifies fear-based decision patterns',
      prevalence: '95%+',
      icon: <Shield className="w-5 h-5 text-blue-500" />
    },
    {
      bias: 'Planning Fallacy',
      description: 'Catches unrealistic timeframe expectations',
      prevalence: '70%',
      icon: <Brain className="w-5 h-5 text-purple-500" />
    }
  ];

  const smartFramework: SmartCriteria[] = [
    { criteria: 'Specific', description: 'Clear, well-defined objectives', icon: <Target className="w-4 h-4" /> },
    { criteria: 'Measurable', description: 'Quantifiable targets and metrics', icon: <TrendingUp className="w-4 h-4" /> },
    { criteria: 'Attainable', description: 'Realistic given account size and experience', icon: <CheckCircle className="w-4 h-4" /> },
    { criteria: 'Relevant', description: 'Aligned with user motivation and strategy', icon: <Target className="w-4 h-4" /> },
    { criteria: 'Time-bound', description: 'Specific timeline for achievement', icon: <BookOpen className="w-4 h-4" /> }
  ];

  const handleStartDemo = (): void => {
    setDemoMode('assessment');
  };

  const handleDemoComplete = (data: any): void => {
    setDemoResults(data);
    setDemoMode('results');
  };

  const handleResetDemo = (): void => {
    setDemoMode('overview');
    setDemoResults(null);
  };

  const renderOverview = (): ReactNode => (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Target className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Goal Assessment System
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Research-backed goal identification with SMART framework validation, 
            psychological bias detection, and progressive disclosure for optimal user experience.
          </p>
        </motion.div>
      </div>

      {/* Research Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {researchHighlights.map((highlight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white rounded-lg border-2 p-6 ${
              currentMetric === index ? 'border-blue-500 shadow-lg' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center mb-3">
              <div className={highlight.color}>
                {highlight.icon}
              </div>
              <div className="ml-3">
                <div className="text-2xl font-bold text-gray-900">
                  {highlight.metric}
                </div>
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{highlight.label}</h3>
            <p className="text-sm text-gray-600">{highlight.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Goal Categories */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Target className="w-6 h-6 mr-3 text-blue-600" />
          Five Primary Goal Categories
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goalCategories.map((category, index) => {
            const icons: Record<GoalType, ReactNode> = {
              income_generation: <Star className="w-5 h-5" />,
              growth_seeking: <TrendingUp className="w-5 h-5" />,
              capital_preservation: <Shield className="w-5 h-5" />,
              learning_practice: <BookOpen className="w-5 h-5" />,
              active_trading: <Zap className="w-5 h-5" />
            };

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center mb-2">
                  <div className="text-blue-600 mr-3">
                    {icons[category.id]}
                  </div>
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  <span className="ml-auto text-sm text-gray-500">
                    {category.percentage}%
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Return:</span>
                    <span className="font-medium ml-1">{category.typicalReturn}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Risk:</span>
                    <span className="font-medium ml-1">{category.riskLevel}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bias Detection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Brain className="w-6 h-6 mr-3 text-purple-600" />
          Psychological Bias Detection
        </h2>
        <div className="space-y-4">
          {biasDetectionFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center p-4 bg-gray-50 rounded-lg"
            >
              {feature.icon}
              <div className="ml-4 flex-1">
                <h3 className="font-semibold text-gray-900">{feature.bias}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-500">Prevalence</span>
                <div className="font-semibold text-gray-900">{feature.prevalence}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* SMART Framework */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <CheckCircle className="w-6 h-6 mr-3 text-green-600" />
          SMART Goal Framework Validation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {smartFramework.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-4 border border-gray-200 rounded-lg"
            >
              <div className="text-green-600 mb-3 flex justify-center">
                {item.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{item.criteria}</h3>
              <p className="text-sm text-gray-600">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Demo Controls */}
      <div className="text-center">
        <motion.button
          onClick={handleStartDemo}
          className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Play className="w-5 h-5 mr-3" />
          Start Interactive Demo
        </motion.button>
        
        <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Info className="w-4 h-4 mr-2" />
            <span>Experience level: {userProfile.experienceLevel}</span>
          </div>
          <div className="flex items-center">
            <span>Account size: ${userProfile.accountSize.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAssessment = (): ReactNode => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Interactive Goal Assessment</h2>
        <button
          onClick={handleResetDemo}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset Demo
        </button>
      </div>
      
      <GoalDefinitionStep
        userProfile={userProfile}
        onStepComplete={handleDemoComplete}
        onProgress={(data: ProgressData) => {
          console.log('Assessment progress:', data);
        }}
        className="demo-assessment"
        enableAutoAdvance={false}
      />
    </div>
  );

  const renderResults = (): ReactNode => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Assessment Results</h2>
        <button
          onClick={handleResetDemo}
          className="flex items-center text-blue-600 hover:text-blue-700"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Try Again
        </button>
      </div>

      {demoResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center mb-6">
            <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <h3 className="text-xl font-bold text-gray-900">Assessment Completed Successfully</h3>
              <p className="text-gray-600">
                Generated {demoResults.finalGoals?.length || 0} SMART goals with 
                {demoResults.goalAlignment || 0}% alignment score
              </p>
            </div>
          </div>

          {demoResults.finalGoals && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Generated Goals:</h4>
              {demoResults.finalGoals.map((goal, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{goal.title}</h5>
                    <span className="text-sm text-gray-500">{goal.category}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Target:</span>
                      <span className="font-medium ml-2">{goal.targetDisplay}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Timeline:</span>
                      <span className="font-medium ml-2">{goal.timeframe}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3">Research Implementation Highlights:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span>Progressive disclosure applied</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span>Bias detection performed</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span>SMART framework validated</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span>Mobile-first design optimized</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="text-center">
        <button
          onClick={() => setDemoMode('overview')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          View Research Overview
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <AnimatePresence mode="wait">
        {demoMode === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {renderOverview()}
          </motion.div>
        )}
        
        {demoMode === 'assessment' && (
          <motion.div
            key="assessment"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {renderAssessment()}
          </motion.div>
        )}
        
        {demoMode === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {renderResults()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GoalAssessmentDemo;