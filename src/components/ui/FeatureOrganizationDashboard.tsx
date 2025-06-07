import React, { useState, useEffect, useCallback } from 'react';
import { FeatureOrganizationController, FEATURE_ORGANIZATION } from '../../utils/ux/FeatureOrganizationController';
import { UserExperienceLevel } from '../../utils/ux/UXLayersController';
import { 
  Lock, 
  Unlock, 
  Star, 
  TrendingUp, 
  Settings, 
  BookOpen, 
  BarChart3,
  Zap,
  Target,
  Award,
  ChevronRight,
  Info
} from 'lucide-react';

interface FeatureOrganizationDashboardProps {
  userLevel: UserExperienceLevel;
  initialProgress?: {
    tradesCompleted?: number;
    accountSize?: number;
    timeSpent?: number;
    featuresUsed?: string[];
  };
  onFeatureSelect?: (featureId: string) => void;
  className?: string;
}

interface FeatureTierDisplayProps {
  tierName: string;
  tier: any;
  unlockStatus: any;
  onFeatureSelect: (featureId: string) => void;
}

const FeatureTierDisplay: React.FC<FeatureTierDisplayProps> = ({
  tierName,
  tier,
  unlockStatus,
  onFeatureSelect
}) => {
  const getTierIcon = (name: string) => {
    switch (name) {
      case 'core': return <Star className="h-5 w-5 text-yellow-500" />;
      case 'intermediate': return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'advanced': return <Zap className="h-5 w-5 text-purple-500" />;
      case 'resources': return <BookOpen className="h-5 w-5 text-green-500" />;
      default: return <Settings className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTierColor = (name: string) => {
    switch (name) {
      case 'core': return 'border-yellow-200 bg-yellow-50';
      case 'intermediate': return 'border-blue-200 bg-blue-50';
      case 'advanced': return 'border-purple-200 bg-purple-50';
      case 'resources': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getFeatureIcon = (featureId: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'basic-calculator': <Target className="h-4 w-4" />,
      'risk-assessment': <BarChart3 className="h-4 w-4" />,
      'position-sizing': <TrendingUp className="h-4 w-4" />,
      'ai-analysis': <Zap className="h-4 w-4" />,
      'education': <BookOpen className="h-4 w-4" />,
      'strategy-visualizer': <BarChart3 className="h-4 w-4" />
    };
    return iconMap[featureId] || <Settings className="h-4 w-4" />;
  };

  return (
    <div className={`rounded-lg border-2 p-4 ${getTierColor(tierName)}`}>
      {/* Tier Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getTierIcon(tierName)}
          <h3 className="font-semibold text-lg capitalize">{tierName} Features</h3>
          {unlockStatus.isUnlocked ? (
            <Unlock className="h-4 w-4 text-green-500" />
          ) : (
            <Lock className="h-4 w-4 text-red-500" />
          )}
        </div>
        
        {!unlockStatus.isUnlocked && (
          <div className="text-sm text-gray-600">
            {unlockStatus.progress.toFixed(0)}% unlocked
          </div>
        )}
      </div>

      {/* Tier Description */}
      <p className="text-sm text-gray-600 mb-4">{tier.description}</p>

      {/* Progress Bar (for locked tiers) */}
      {!unlockStatus.isUnlocked && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${unlockStatus.progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Progress: {unlockStatus.progress.toFixed(0)}%
          </div>
        </div>
      )}

      {/* Features List */}
      <div className="space-y-2">
        {tier.features.map((featureId: string) => (
          <div
            key={featureId}
            className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
              unlockStatus.isUnlocked 
                ? 'hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200' 
                : 'opacity-50 cursor-not-allowed'
            }`}
            onClick={() => unlockStatus.isUnlocked && onFeatureSelect(featureId)}
          >
            <div className="flex items-center gap-2">
              {getFeatureIcon(featureId)}
              <span className="text-sm font-medium">
                {featureId.split('-').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </span>
            </div>
            {unlockStatus.isUnlocked && (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </div>
        ))}
      </div>

      {/* Unlock Requirements (for locked tiers) */}
      {!unlockStatus.isUnlocked && unlockStatus.nextSteps.length > 0 && (
        <div className="mt-4 p-3 bg-white rounded border">
          <h4 className="text-sm font-medium text-gray-700 mb-2">To unlock:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            {unlockStatus.nextSteps.slice(0, 3).map((step: string, index: number) => (
              <li key={index} className="flex items-start gap-1">
                <span className="text-blue-500">•</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export const FeatureOrganizationDashboard: React.FC<FeatureOrganizationDashboardProps> = ({
  userLevel,
  initialProgress,
  onFeatureSelect,
  className = ''
}) => {
  const [controller] = useState(() => new FeatureOrganizationController(userLevel, {
    tradesCompleted: initialProgress?.tradesCompleted || 0,
    accountSize: initialProgress?.accountSize || 0,
    timeSpent: initialProgress?.timeSpent || 0,
    featuresUsed: new Set(initialProgress?.featuresUsed || [])
  }));

  const [organizedFeatures, setOrganizedFeatures] = useState(controller.getOrganizedFeatures());
  const [progressSummary, setProgressSummary] = useState(controller.getProgressSummary());
  const [recommendations, setRecommendations] = useState(controller.getRecommendedActions());

  // Simulate user progress for demo purposes
  const [demoProgress, setDemoProgress] = useState({
    tradesCompleted: initialProgress?.tradesCompleted || 0,
    accountSize: initialProgress?.accountSize || 0,
    timeSpent: initialProgress?.timeSpent || 0
  });

  const updateProgress = useCallback(() => {
    setOrganizedFeatures(controller.getOrganizedFeatures());
    setProgressSummary(controller.getProgressSummary());
    setRecommendations(controller.getRecommendedActions());
  }, [controller]);

  const handleFeatureSelect = useCallback((featureId: string) => {
    controller.markFeatureUsed(featureId);
    updateProgress();
    onFeatureSelect?.(featureId);
  }, [controller, updateProgress, onFeatureSelect]);

  const simulateProgress = useCallback((type: 'trades' | 'account' | 'time') => {
    const newProgress = { ...demoProgress };
    
    switch (type) {
      case 'trades':
        newProgress.tradesCompleted += 5;
        break;
      case 'account':
        newProgress.accountSize += 2500;
        break;
      case 'time':
        newProgress.timeSpent += 60;
        break;
    }
    
    setDemoProgress(newProgress);
    controller.updateUserProgress(newProgress);
    updateProgress();
  }, [demoProgress, controller, updateProgress]);

  return (
    <div className={`max-w-6xl mx-auto p-6 ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Feature Organization Dashboard
        </h1>
        <p className="text-gray-600">
          Progressive disclosure system with research-backed unlock criteria
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-5 w-5 text-blue-500" />
            <h3 className="font-medium">Features Unlocked</h3>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {progressSummary.featuresUnlocked}/{progressSummary.totalFeatures}
          </div>
          <div className="text-sm text-gray-500">
            {progressSummary.progressPercentage.toFixed(0)}% complete
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <h3 className="font-medium">Trades Completed</h3>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {demoProgress.tradesCompleted}
          </div>
          <button
            onClick={() => simulateProgress('trades')}
            className="text-sm text-blue-500 hover:text-blue-700"
          >
            + Add 5 trades
          </button>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-purple-500" />
            <h3 className="font-medium">Account Size</h3>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            ${demoProgress.accountSize.toLocaleString()}
          </div>
          <button
            onClick={() => simulateProgress('account')}
            className="text-sm text-blue-500 hover:text-blue-700"
          >
            + Add $2,500
          </button>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-5 w-5 text-orange-500" />
            <h3 className="font-medium">Time Spent</h3>
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {Math.floor(demoProgress.timeSpent / 60)}h {demoProgress.timeSpent % 60}m
          </div>
          <button
            onClick={() => simulateProgress('time')}
            className="text-sm text-blue-500 hover:text-blue-700"
          >
            + Add 1 hour
          </button>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-5 w-5 text-blue-500" />
            <h3 className="font-medium text-blue-800">Recommended Actions</h3>
          </div>
          <ul className="text-sm text-blue-700 space-y-1">
            {recommendations.map((action, index) => (
              <li key={index} className="flex items-start gap-1">
                <span className="text-blue-500">•</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Feature Tiers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(organizedFeatures).map(([tierName, tier]) => (
          <FeatureTierDisplay
            key={tierName}
            tierName={tierName}
            tier={tier}
            unlockStatus={tier.unlockStatus}
            onFeatureSelect={handleFeatureSelect}
          />
        ))}
      </div>

      {/* Research Information */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-3">Research-Backed Progressive Disclosure</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-700 mb-1">Task Completion Improvement</h4>
            <p>Progressive disclosure improves task completion by 60% by reducing cognitive overload and providing clear progression paths.</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-1">Cognitive Load Reduction</h4>
            <p>Hiding advanced features until users are ready reduces cognitive load by 40%, improving focus and learning outcomes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 