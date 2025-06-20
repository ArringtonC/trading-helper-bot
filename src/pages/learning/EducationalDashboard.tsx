import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import EducationalModules from '../../utils/education/EducationalModules';
import EducationalVisualizerEngine from '../../utils/education/EducationalVisualizerEngine';
import { UserExperienceAssessment, UserBehaviorMetrics, TradingHistoryData, ExplicitPreferences } from '../../utils/assessment/UserExperienceAssessment';
import { 
  BookOpen, 
  TrendingUp, 
  Shield, 
  BarChart3, 
  Play, 
  CheckCircle, 
  Clock,
  Star,
  Target,
  Brain
} from 'lucide-react';

interface EducationalDashboardProps {
  userId?: string;
}

const EducationalDashboard: React.FC<EducationalDashboardProps> = ({ userId = 'default-user' }) => {
  const [modules] = useState(() => new EducationalModules());
  const [visualizer] = useState(() => new EducationalVisualizerEngine());
  const [assessment] = useState(() => new UserExperienceAssessment());
  const [userProgress, setUserProgress] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [visualizerRecommendations, setVisualizerRecommendations] = useState<any[]>([]);
  const [userLevel, setUserLevel] = useState<'learning' | 'import' | 'broker'>('learning');

  useEffect(() => {
    // Initialize user progress and recommendations
    const progress = modules.getOverallProgress(userId);
    setUserProgress(progress);

    // Get user experience level from assessment
    const behaviorMetrics: Partial<UserBehaviorMetrics> = {
      timeSpentInApp: 30,
      pagesVisited: ['dashboard'],
      featuresUsed: ['position-sizing'],
      calculationsPerformed: 0,
      tutorialProgress: 0,
      errorRate: 0.1,
      helpRequestsCount: 0,
      sessionDuration: 30,
      returnVisits: 1,
      complexFeaturesAccessed: []
    };

    const tradingHistory: Partial<TradingHistoryData> = {
      totalTrades: 0,
      tradingExperienceYears: 0,
      accountSize: 10000,
      averagePositionSize: 100,
      riskPerTrade: 0.02,
      winRate: 0.5,
      instrumentsTraded: [],
      strategiesUsed: [],
      maxDrawdown: 0,
      hasLiveTradingExperience: false
    };

    const preferences: Partial<ExplicitPreferences> = {
      selfReportedLevel: null,
      preferredRiskLevel: 'conservative',
      primaryTradingGoal: 'learning',
      timeAvailableForTrading: 'minimal',
      preferredComplexity: 'simple',
      hasCompletedOnboarding: false,
      manualOverride: null
    };

    const assessmentResult = assessment.assessUser(behaviorMetrics, tradingHistory, preferences);
    
    // Map user level to difficulty level
    const levelMap = {
      'learning': 'learning' as const,
      'import': 'import' as const,
      'broker': 'broker' as const
    };
    const level = levelMap[assessmentResult.userLevel] || 'learning';
    setUserLevel(level);

    // Get module recommendations
    const moduleRecs = modules.getRecommendedModules(level);
    setRecommendations(moduleRecs);

    // Get visualizer recommendations - get all visualizations for the level
    const allVisualizations = visualizer.getVisualizationsByDifficulty(level);
    setVisualizerRecommendations(allVisualizations);
  }, [modules, visualizer, assessment, userId]);

  const handleStartModule = (moduleId: string) => {
    modules.startModule(userId, moduleId);
    const updatedProgress = modules.getOverallProgress(userId);
    setUserProgress(updatedProgress);
  };

  const handleStartVisualization = (vizId: string) => {
    // Navigate to visualization (this would typically use router)
    console.log(`Starting visualization: ${vizId}`);
  };

  const getModuleIcon = (moduleId: string) => {
    switch (moduleId) {
      case 'basic-options':
        return <BookOpen className="h-5 w-5" />;
      case 'position-sizing':
        return <TrendingUp className="h-5 w-5" />;
      case 'risk-management':
        return <Shield className="h-5 w-5" />;
      default:
        return <BookOpen className="h-5 w-5" />;
    }
  };

  const getVisualizationIcon = (vizType: string) => {
    switch (vizType) {
      case 'options-payoff':
        return <BarChart3 className="h-5 w-5" />;
      case 'position-sizing':
        return <TrendingUp className="h-5 w-5" />;
      case 'kelly-criterion':
        return <Target className="h-5 w-5" />;
      case 'correlation-matrix':
        return <Brain className="h-5 w-5" />;
      case 'vix-risk':
        return <Shield className="h-5 w-5" />;
      default:
        return <BarChart3 className="h-5 w-5" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'learning':
        return 'bg-green-100 text-green-800';
      case 'import':
        return 'bg-yellow-100 text-yellow-800';
      case 'broker':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Trading Education Center</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Master options trading through interactive modules and hands-on visualizations. 
          Start with our visualizer-first approach designed specifically for new traders.
        </p>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(userLevel)}`}>
          {userLevel.charAt(0).toUpperCase() + userLevel.slice(1)} Level
        </span>
      </div>

      {/* Progress Overview */}
      {userProgress && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Your Learning Progress
            </h3>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Overall Progress</span>
                  <span>{Math.round(userProgress.completionPercentage)}%</span>
                </div>
                <Progress value={userProgress.completionPercentage} className="h-2" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{userProgress.modulesCompleted}</div>
                  <div className="text-sm text-gray-600">Modules Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{userProgress.modulesStarted}</div>
                  <div className="text-sm text-gray-600">Modules Started</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(userProgress.totalTimeSpent)}
                  </div>
                  <div className="text-sm text-gray-600">Minutes Spent</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visualizer-First Approach */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Start with Interactive Visualizations
          </h3>
          <p className="text-blue-700">
            Research shows that visual learning improves comprehension by 400%. 
            Start here for the most effective learning experience.
          </p>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visualizerRecommendations.slice(0, 6).map((viz) => (
              <div key={viz.id} className="bg-white border border-blue-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getVisualizationIcon(viz.type)}
                      <h3 className="font-semibold text-sm">{viz.title}</h3>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(viz.difficulty)}`}>
                      {viz.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">{viz.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {viz.learningGoals?.length || 0} goals
                    </span>
                    <Button 
                      onClick={() => handleStartVisualization(viz.id)}
                      className="text-xs px-2 py-1"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Start
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Educational Modules */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Educational Modules
          </h3>
          <p className="text-gray-600">
            Comprehensive learning modules covering essential trading concepts.
          </p>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((module) => {
              const isCompleted = modules.isModuleCompleted(userId, module.id);
              const progress = modules.getModuleCompletionPercentage(userId, module.id);
              
              return (
                <div key={module.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getModuleIcon(module.id)}
                        <div>
                          <h3 className="font-semibold">{module.title}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getDifficultyColor(module.difficulty)}`}>
                            {module.difficulty}
                          </span>
                        </div>
                      </div>
                      {isCompleted && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {module.description}
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {module.estimatedTimeMinutes} min
                        </span>
                        <span>{module.content?.length || 0} lessons</span>
                      </div>
                      
                      {progress > 0 && (
                        <div>
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} className="h-1" />
                        </div>
                      )}
                      
                      <Button 
                        className="w-full" 
                        variant={isCompleted ? "outline" : "default"}
                        onClick={() => handleStartModule(module.id)}
                      >
                        {isCompleted ? "Review" : progress > 0 ? "Continue" : "Start Module"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Learning Paths */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Target className="h-6 w-6" />
            Recommended Learning Paths
          </h3>
          <p className="text-gray-600">
            Structured pathways designed for your experience level.
          </p>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.getLearningPaths().map((path: any) => (
              <div key={path.id} className="bg-white rounded-lg border border-gray-200 shadow-sm border-l-4 border-l-blue-500">
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-2">{path.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{path.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Difficulty:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(path.targetAudience)}`}>
                        {path.targetAudience}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Duration:</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {path.estimatedTimeHours}h
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Modules:</span>
                      <span>{path.modules.length} modules</span>
                    </div>
                  </div>
                  
                  <Button className="w-full mt-4" variant="outline">
                    Start Learning Path
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-sm">
        <div className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">
              Join thousands of traders improving their skills
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600">85%</div>
                <div className="text-sm text-gray-600">Failure rate reduced through education</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">400%</div>
                <div className="text-sm text-gray-600">Learning improvement with visualizations</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">60%</div>
                <div className="text-sm text-gray-600">Task completion improvement</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducationalDashboard; 