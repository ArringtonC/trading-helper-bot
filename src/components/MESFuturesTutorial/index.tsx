import React, { Suspense, lazy } from 'react';
import { MESFutorialProps } from './types';
import { useMESState } from './hooks/useMESState';
import MESNavigationTabs from './MESNavigationTabs';
import LegacyTutorial from './LegacyTutorial';

// Lazy load tab components for better performance
const MESUserDashboard = lazy(() => import('./Dashboard/MESUserDashboard'));
const EnhancedLearningModule = lazy(() => import('./Learn/EnhancedLearningModule'));
const TradingSimulator = lazy(() => import('./Practice/TradingSimulator'));
const CommunityDashboard = lazy(() => import('./Community/CommunityDashboard'));
const MESSettings = lazy(() => import('./Settings/MESSettings'));
const AnalyticsDashboard = lazy(() => import('./Analysis/AnalyticsDashboard'));

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-3 text-gray-600">Loading...</span>
  </div>
);

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('MES Tutorial Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong</div>;
    }

    return this.props.children;
  }
}

const MESFuturesTutorial: React.FC<MESFutorialProps> = ({
  onComplete,
  onNext,
  userLevel = 'learning',
  enableEnhancedFeatures = false
}) => {
  const [state, actions, featureFlags] = useMESState();

  // Use legacy tutorial if enhanced features are disabled
  if (!enableEnhancedFeatures && !featureFlags.enhancedTutorial) {
    return (
      <LegacyTutorial 
        onComplete={onComplete}
        onNext={onNext}
        userLevel={userLevel}
      />
    );
  }

  const renderCurrentTab = () => {
    switch (state.currentTab) {
      case 'dashboard':
        return (
          <MESUserDashboard
            userProfile={state.userProfile}
            virtualPortfolio={state.virtualPortfolio}
            learningProgress={state.tutorialProgress}
            achievements={state.tutorialProgress.achievements}
            onTabChange={actions.setCurrentTab}
            onUpdateProfile={actions.updateUserProfile}
          />
        );

      case 'learn':
        return (
          <EnhancedLearningModule
            userLevel={state.userProfile.experienceLevel}
            learningPath={state.learningPath}
            progress={state.tutorialProgress}
            onModuleComplete={actions.completeModule}
            onProgressUpdate={actions.updateProgress}
            onAchievementEarned={actions.addAchievement}
            featureFlags={featureFlags}
          />
        );

      case 'practice':
        return (
          <TradingSimulator
            virtualPortfolio={state.virtualPortfolio}
            userPreferences={state.userProfile.preferences}
            onPortfolioUpdate={actions.updatePortfolio}
            onTradeComplete={actions.addTrade}
            onPositionUpdate={actions.updatePosition}
            featureFlags={featureFlags}
          />
        );

      case 'community':
        if (!featureFlags.communityFeatures) {
          return (
            <div className="p-8 text-center">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                🚧 Community Features Coming Soon
              </h3>
              <p className="text-gray-600">
                Community features are currently in development. Check back soon!
              </p>
            </div>
          );
        }
        return (
          <CommunityDashboard
            userProfile={state.userProfile}
            onProfileUpdate={actions.updateUserProfile}
          />
        );

      case 'settings':
        return (
          <MESSettings
            userProfile={state.userProfile}
            featureFlags={featureFlags}
            onUserProfileUpdate={actions.updateUserProfile}
            onPreferencesUpdate={actions.updateUserPreferences}
            onLearningPathChange={actions.setLearningPath}
            onResetState={actions.resetState}
          />
        );

      case 'analysis':
        if (!featureFlags.advancedAnalytics) {
          return (
            <div className="p-8 text-center">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                📊 Advanced Analytics Coming Soon
              </h3>
              <p className="text-gray-600">
                Advanced analytics features are currently in development.
              </p>
            </div>
          );
        }
        return (
          <AnalyticsDashboard
            virtualPortfolio={state.virtualPortfolio}
            userProfile={state.userProfile}
            tutorialProgress={state.tutorialProgress}
            featureFlags={featureFlags}
          />
        );

      default:
        return (
          <div className="p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">
              Tab Not Found
            </h3>
            <p className="text-gray-600">
              The requested tab could not be found.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                📈 MES Futures Trading Tutorial
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {state.userProfile.name} • {state.learningPath.name} • {state.tutorialProgress.overallProgress}% Complete
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center space-x-4">
              {/* Progress Indicator */}
              <div className="hidden md:flex items-center space-x-2">
                <span className="text-sm text-gray-600">Progress:</span>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${state.tutorialProgress.overallProgress}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  {state.tutorialProgress.overallProgress}%
                </span>
              </div>
              
              {/* Learning Streak */}
              <div className="hidden md:flex items-center space-x-1 text-orange-600">
                <span>🔥</span>
                <span className="text-sm font-medium">
                  {state.tutorialProgress.learningStreak} day streak
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <MESNavigationTabs
        currentTab={state.currentTab}
        onTabChange={actions.setCurrentTab}
        progress={state.tutorialProgress}
        featureFlags={featureFlags}
        unreadNotifications={0} // TODO: Implement notification system
      />

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ErrorBoundary
          fallback={
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Oops! Something went wrong
              </h3>
              <p className="text-red-600 mb-4">
                There was an error loading this section. Please try refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          }
        >
          <Suspense fallback={<LoadingSpinner />}>
            {renderCurrentTab()}
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* Footer with completion actions */}
      {state.tutorialProgress.overallProgress === 100 && onComplete && (
        <div className="fixed bottom-0 left-0 right-0 bg-green-600 text-white p-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <h3 className="font-semibold">🎉 Congratulations!</h3>
              <p className="text-sm">You've completed the MES Futures Trading Tutorial!</p>
            </div>
            <button
              onClick={onComplete}
              className="bg-white text-green-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Complete Tutorial
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MESFuturesTutorial; 