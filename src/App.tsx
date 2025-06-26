import React, { useEffect, Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import OnboardingGuide from './components/ui/OnboardingGuide';
import { ToastContainer } from 'react-toastify';
import { loadSetting, initializeSettings } from './services/SettingsService';
import { UserExperienceAssessment } from './utils/assessment/UserExperienceAssessment';
import { UserExperienceLevel } from './utils/ux/UXLayersController';
import 'react-toastify/dist/ReactToastify.css';
import 'highlight.js/styles/github.css';
import { WinRateProvider } from './context/WinRateContext';
import { TradesProvider } from './context/TradesContext';
import { TutorialProvider } from './context/TutorialContext';
import { TutorialDisplay } from './components/Wizards/TutorialDisplay';
import { GoalSizingProvider } from './context/GoalSizingContext';

// Lazy load route components with chunk names
const HomePage = React.lazy(() => import(
  /* webpackChunkName: "page-home" */
  './pages/HomePage'
));

const UnifiedDashboard = React.lazy(() => import(
  /* webpackChunkName: "page-unified-dashboard" */
  './pages/trading/UnifiedDashboard'
));
const OptionsDB = React.lazy(() => import(
  /* webpackChunkName: "page-options-db" */
  './pages/trading/OptionsDB'
));
const Settings = React.lazy(() => import(
  /* webpackChunkName: "page-settings" */
  './pages/Settings'
));
const ImportToDatabase = React.lazy(() => import(
  /* webpackChunkName: "page-import-database" */
  './pages/import/ImportToDatabase'
));
const ImportDirect = React.lazy(() => import(
  /* webpackChunkName: "page-import-direct" */
  './pages/import/ImportDirect'
).then(module => ({ default: module.ImportDirect })));
const AITradeAnalysis = React.lazy(() => import(
  /* webpackChunkName: "page-ai-analysis" */
  './pages/trading/AITradeAnalysis'
));
const StrategyVisualizer = React.lazy(() => import(
  /* webpackChunkName: "page-strategy-visualizer" */
  './pages/trading/StrategyVisualizer'
));
const RuleEngineDemo = React.lazy(() => import(
  /* webpackChunkName: "page-rule-engine-demo" */
  './pages/testing/RuleEngineDemo'
));
const IBKRAPIConfigDemo = React.lazy(() => import(
  /* webpackChunkName: "page-ibkr-api-demo" */
  './components/IBKRAPIConfigDemo'
).then(module => ({ default: module.IBKRAPIConfigDemo })));
const VolatilityDashboardDemo = React.lazy(() => import(
  /* webpackChunkName: "page-volatility-demo" */
  './pages/testing/VolatilityDashboardDemo'
));
const ImportAnalyze = React.lazy(() => import(
  /* webpackChunkName: "page-import-analyze" */
  './pages/import/ImportAnalyze'
));
const InteractiveAnalytics = React.lazy(() => import(
  /* webpackChunkName: "page-interactive-analytics" */
  './pages/trading/InteractiveAnalytics'
));
const PositionSizingResults = React.lazy(() => import(
  /* webpackChunkName: "page-position-sizing-results" */
  './pages/trading/PositionSizingResults'
));
const GoalSizingPage = React.lazy(() => import(
  /* webpackChunkName: "page-goal-sizing" */
  './pages/trading/GoalSizingPage'
));
const GoalSizingResults = React.lazy(() => import(
  /* webpackChunkName: "page-goal-sizing-results" */
  './pages/trading/GoalSizingResults'
));
const PLDashboard = React.lazy(() => import(
  /* webpackChunkName: "page-pl-dashboard" */
  './pages/trading/PLDashboard'
));
const EnhancedHomePage = React.lazy(() => import(
  /* webpackChunkName: "page-enhanced-home" */
  './pages/EnhancedHomePage'
));
const TutorialPage = React.lazy(() => import(
  /* webpackChunkName: "page-tutorial" */
  './pages/learning/TutorialPage'
));
const AssessmentTest = React.lazy(() => import(
  /* webpackChunkName: "page-assessment-test" */
  './pages/learning/AssessmentTest'
));
const EducationalDashboard = React.lazy(() => import(
  /* webpackChunkName: "page-educational-dashboard" */
  './pages/learning/EducationalDashboard'
));
const AnalyticsTestPage = React.lazy(() => import(
  /* webpackChunkName: "page-analytics-test" */
  './pages/testing/AnalyticsTestPage'
));
const BrokerSyncDashboard = React.lazy(() => import(
  /* webpackChunkName: "page-broker-sync" */
  './pages/import/BrokerSyncDashboard'
));
const WeekendGapRiskDashboard = React.lazy(() => import(
  /* webpackChunkName: "page-weekend-gap-risk" */
  './components/WeekendGapRiskDashboard'
));
const PositionSizingFoundationPage = React.lazy(() => import('./pages/learning/PositionSizingFoundation'));
const PsychologicalTradingPage = React.lazy(() => import(
  /* webpackChunkName: "page-psychological-trading" */
  './pages/testing/PsychologicalTradingPage'
));
const TradeScreener = React.lazy(() => import(
  /* webpackChunkName: "page-trade-screener" */
  './pages/trading/TradeScreener'
));
const NVDAOptionsTutorialPage = React.lazy(() => import(
  /* webpackChunkName: "page-nvda-tutorial" */
  './pages/learning/NVDAOptionsTutorialPage'
));
const StackingCoveredCallsTutorialPage = React.lazy(() => import(
  /* webpackChunkName: "page-stacking-tutorial" */
  './pages/learning/StackingCoveredCallsTutorialPage'
));
const SellingCallsTutorialPage = React.lazy(() => import(
  /* webpackChunkName: "page-selling-calls-tutorial" */
  './pages/learning/SellingCallsTutorialPage'
));
const MESFuturesTutorialPage = React.lazy(() => import(
  /* webpackChunkName: "page-mes-futures-tutorial" */
  './pages/learning/MESFuturesTutorialPage'
));
const TutorialsPage = React.lazy(() => import(
  /* webpackChunkName: "page-tutorials" */
  './pages/learning/TutorialsPage'
));
const SP500DemoPage = React.lazy(() => import(
  /* webpackChunkName: "page-sp500-demo" */
  './pages/learning/SP500DemoPage'
));
const SP500Demo = React.lazy(() => import(
  /* webpackChunkName: "page-sp500-professional" */
  './pages/demo/SP500Demo'
));
const RiskManagementPage = React.lazy(() => import(
  /* webpackChunkName: "page-risk-management" */
  './pages/trading/RiskManagementPage'
));
const CuratedStockListsPage = React.lazy(() => import(
  /* webpackChunkName: "page-curated-lists" */
  './pages/trading/CuratedStockListsPage'
));

const AdvancedScreeningPage = React.lazy(() => import(
  /* webpackChunkName: "page-advanced-screening" */
  './pages/trading/AdvancedScreeningPage'
));

const WatchlistPage = React.lazy(() => import(
  /* webpackChunkName: "page-watchlist" */
  './pages/trading/WatchlistPage'
));

const TemplateMatchingDemo = React.lazy(() => import(
  /* webpackChunkName: "page-template-matching" */
  './components/Goals/TemplateMatchingDemo'
).then(module => ({ default: module.default })));

const AccountClassificationInterface = React.lazy(() => import(
  /* webpackChunkName: "page-account-classification" */
  './components/Goals/AccountClassificationInterface'
).then(module => ({ default: module.default })));

const ValidationDashboard = React.lazy(() => import(
  /* webpackChunkName: "page-validation-dashboard" */
  './pages/ValidationDashboard'
));

const NavigationSectionsTest = React.lazy(() => import(
  /* webpackChunkName: "page-navigation-test" */
  './components/NavigationSections'
).then(module => ({ default: () => React.createElement('div', { className: 'p-8' }, React.createElement(module.default)) })));

const StockSelectionLanding = React.lazy(() => import('./components/StockSelectionLanding'));

// Loading component for suspense fallback
const Loading = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
  </div>
);

const App: React.FC = () => {
  const [userLevel, setUserLevel] = useState<UserExperienceLevel>('import');
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [showOnboardingGuide, setShowOnboardingGuide] = useState(false);
  const [assessment] = useState(() => new UserExperienceAssessment());

  // Initialize settings and user assessment on app start
  useEffect(() => {
    initializeSettings();
    
    // Perform user experience assessment
    const performAssessment = () => {
      // Get stored user data or use defaults for new users
      const storedLevel = localStorage.getItem('userExperienceLevel') as UserExperienceLevel;
      const storedOnboarding = localStorage.getItem('hasCompletedOnboarding') === 'true';
      
      if (storedLevel && storedOnboarding) {
        setUserLevel(storedLevel);
        setHasCompletedOnboarding(storedOnboarding);
        setShowOnboardingGuide(false);
      } else {
        // New user - perform assessment
        const behaviorMetrics = {
          timeSpentInApp: 0,
          pagesVisited: [],
          featuresUsed: [],
          calculationsPerformed: 0,
          tutorialProgress: 0,
          errorRate: 0,
          helpRequestsCount: 0,
          sessionDuration: 0,
          returnVisits: 1,
          complexFeaturesAccessed: []
        };

        const tradingHistory = {
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

        const preferences = {
          selfReportedLevel: null,
          preferredRiskLevel: 'conservative' as const,
          primaryTradingGoal: 'learning' as const,
          timeAvailableForTrading: 'minimal' as const,
          preferredComplexity: 'simple' as const,
          hasCompletedOnboarding: false,
          manualOverride: null
        };

        const result = assessment.assessUser(behaviorMetrics, tradingHistory, preferences);
        
        setUserLevel(result.userLevel);
        setHasCompletedOnboarding(result.shouldShowOnboarding ? false : true);
        setShowOnboardingGuide(result.shouldShowOnboarding);
        
        // Store assessment results
        localStorage.setItem('userExperienceLevel', result.userLevel);
        localStorage.setItem('hasCompletedOnboarding', result.shouldShowOnboarding ? 'false' : 'true');
      }
    };

    performAssessment();
  }, [assessment]);

  const handleOnboardingComplete = () => {
    setHasCompletedOnboarding(true);
    setShowOnboardingGuide(false);
    localStorage.setItem('hasCompletedOnboarding', 'true');
  };

  // Check feature flags
  const showImport = loadSetting('showImport') === 'true';
  const showDirectImport = loadSetting('showDirectImport') === 'true';
  const showUnifiedDashboard = loadSetting('showUnifiedDashboard') === 'true';
  const showRuleEngine = loadSetting('showRuleEngine') === 'true';
  const showLegacyDashboard = loadSetting('showLegacyDashboard') === 'true';

  return (
    <GoalSizingProvider>
      <WinRateProvider>
        <TradesProvider>
          <TutorialProvider>
            <Router>
              <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-blue-800 text-white p-4">
                  <h1 className="text-2xl font-bold">Trading Helper Bot</h1>
                </header>
              
                {/* Navigation */}
                <Navigation />
                
                {/* Main Content */}
                <main className="max-w-6xl mx-auto p-4">
                  <Suspense fallback={<Loading />}>
                    <Routes>
                      {/* Position Sizing Foundation as Primary Landing Page */}
                      <Route path="/" element={<EnhancedHomePage />} />
                      
                      {/* Original Position Sizing Foundation page */}
                      <Route path="/position-sizing" element={<PositionSizingFoundationPage />} />
                      
                      {/* Gamified Position Sizing Tutorial */}
                      <Route path="/tutorial" element={<TutorialPage />} />
                      
                      {/* Assessment Test Page */}
                      <Route path="/assessment-test" element={<AssessmentTest />} />
                      
                      {/* Educational Dashboard */}
                      <Route path="/education" element={<EducationalDashboard />} />
                      
                      {/* Analytics Test Page */}
                      <Route path="/analytics-test" element={<AnalyticsTestPage />} />
                      
                      {/* Original home page moved to /dashboard */}
                      {showLegacyDashboard && (
                        <Route path="/dashboard" element={<HomePage />} />
                      )}

                      {showUnifiedDashboard && (
                        <Route path="/unified-dashboard" element={<UnifiedDashboard />} />
                      )}
                      <Route path="/options" element={<OptionsDB />} />
                      <Route path="/analysis" element={<AITradeAnalysis />} />
                      <Route path="/interactive-analytics" element={<InteractiveAnalytics />} />
                      <Route path="/visualizer" element={<StrategyVisualizer />} />
                      {showRuleEngine && (
                        <Route path="/rule-engine-demo" element={<RuleEngineDemo />} />
                      )}
                      <Route path="/ibkr-api-demo" element={<IBKRAPIConfigDemo />} />
                      <Route path="/volatility-demo" element={<VolatilityDashboardDemo />} />
                      <Route path="/import-analyze" element={<ImportAnalyze />} />
                      <Route path="/position-sizing-results" element={<PositionSizingResults />} />
                      <Route path="/goal-sizing" element={<GoalSizingPage />} />
                      <Route path="/goal-sizing-results" element={<GoalSizingResults />} />
                      <Route path="/pl-dashboard" element={<PLDashboard />} />
                      <Route path="/settings" element={<Settings />} />
                      {showImport && (
                        <Route path="/import" element={<ImportToDatabase />} />
                      )}
                      {showDirectImport && (
                        <Route path="/import/direct" element={<ImportDirect />} />
                      )}
                      <Route path="/broker-sync" element={<BrokerSyncDashboard />} />
                      <Route path="/weekend-gap-risk" element={<WeekendGapRiskDashboard />} />
                      <Route path="/psychological-trading" element={<PsychologicalTradingPage />} />
                      <Route path="/trade-screener" element={<TradeScreener />} />
                      <Route path="/learning" element={<TutorialsPage />} />
                      <Route path="/tutorials" element={<TutorialsPage />} />
                      <Route path="/nvda-tutorial" element={<NVDAOptionsTutorialPage />} />
                      <Route path="/stacking-tutorial" element={<StackingCoveredCallsTutorialPage />} />
                      <Route path="/selling-calls-tutorial" element={<SellingCallsTutorialPage />} />
                      <Route path="/mes-futures-tutorial" element={<MESFuturesTutorialPage />} />
                      <Route path="/sp500-demo" element={<SP500DemoPage />} />
                      <Route path="/sp500-professional" element={<SP500Demo />} />
                      <Route path="/risk-management" element={<RiskManagementPage />} />
                      <Route path="/curated-lists" element={<CuratedStockListsPage />} />
                      <Route path="/template-matching" element={<TemplateMatchingDemo />} />
                      <Route path="/account-classification" element={<AccountClassificationInterface />} />
                      <Route path="/advanced-screening" element={<AdvancedScreeningPage />} />
                      <Route path="/validation-dashboard" element={<ValidationDashboard />} />
                      <Route path="/navigation-test" element={<NavigationSectionsTest />} />
                      <Route path="/watchlist" element={<WatchlistPage />} />
                      <Route path="/quick-picks" element={
                        <React.Suspense fallback={<div className="p-8 text-center">Loading Quick Picks...</div>}>
                          <StockSelectionLanding />
                        </React.Suspense>
                      } />
                    </Routes>
                  </Suspense>
                </main>
                
                {/* Footer */}
                <footer className="bg-gray-100 border-t border-gray-200 p-4 text-center text-gray-500 text-sm">
                  <p>Trading Helper Bot - Demo Version</p>
                </footer>

                {/* Onboarding Guide for New Users */}
                {showOnboardingGuide && (
                  <OnboardingGuide
                    userLevel={userLevel}
                    tradingExperience={0}
                    hasCompletedOnboarding={hasCompletedOnboarding}
                    onClose={handleOnboardingComplete}
                  />
                )}

                <ToastContainer />
                <TutorialDisplay />
              </div>
            </Router>
          </TutorialProvider>
        </TradesProvider>
      </WinRateProvider>
    </GoalSizingProvider>
  );
};

export default App;
