import React, { useState, useEffect, useMemo } from 'react';
import UnifiedAnalyticsEngine, { 
  AnalyticsConfig, 
  ConsolidatedAnalytics, 
  AnalyticsModule 
} from '../../utils/analytics/UnifiedAnalyticsEngine';
import { UserExperienceLevel } from '../../utils/ux/UXLayersController';

interface StreamlinedDashboardProps {
  userLevel: UserExperienceLevel;
  onUserLevelChange?: (level: UserExperienceLevel) => void;
  className?: string;
}

interface ModuleCardProps {
  module: AnalyticsModule;
  data: ConsolidatedAnalytics;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ 
  module, 
  data, 
  isExpanded, 
  onToggleExpand 
}) => {
  const renderModuleContent = () => {
    switch (module.id) {
      case 'position-summary':
        return (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total P&L:</span>
              <span className={`font-medium ${data.positionAnalysis.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${data.positionAnalysis.totalPnl.toFixed(2)} ({data.positionAnalysis.totalPnlPercent.toFixed(2)}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Day P&L:</span>
              <span className={`font-medium ${data.positionAnalysis.dayPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${data.positionAnalysis.dayPnl.toFixed(2)} ({data.positionAnalysis.dayPnlPercent.toFixed(2)}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Win Rate:</span>
              <span className="font-medium text-blue-600">
                {data.positionAnalysis.winRate.toFixed(1)}%
              </span>
            </div>
          </div>
        );

      case 'basic-risk':
        return (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Portfolio Risk:</span>
              <span className="font-medium text-orange-600">
                {data.riskMetrics.portfolioRisk.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Delta:</span>
              <span className="font-medium text-blue-600">
                {data.riskMetrics.delta.toFixed(3)}
              </span>
            </div>
            {isExpanded && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Theta:</span>
                  <span className="font-medium text-purple-600">
                    {data.riskMetrics.theta.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Concentration Risk:</span>
                  <span className="font-medium text-red-600">
                    {data.riskMetrics.concentrationRisk.toFixed(2)}%
                  </span>
                </div>
              </>
            )}
          </div>
        );

      case 'performance-charts':
        return (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Sharpe Ratio:</span>
              <span className="font-medium text-green-600">
                {data.performanceTracking.sharpeRatio.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Max Drawdown:</span>
              <span className="font-medium text-red-600">
                {data.performanceTracking.maxDrawdown.toFixed(2)}%
              </span>
            </div>
            {isExpanded && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Volatility:</span>
                  <span className="font-medium text-orange-600">
                    {data.performanceTracking.volatility.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">vs Benchmark:</span>
                  <span className={`font-medium ${data.performanceTracking.benchmarkComparison >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data.performanceTracking.benchmarkComparison >= 0 ? '+' : ''}{data.performanceTracking.benchmarkComparison.toFixed(2)}%
                  </span>
                </div>
              </>
            )}
          </div>
        );

      case 'market-regime':
        return (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Market Regime:</span>
              <span className={`font-medium px-2 py-1 rounded text-xs ${
                data.marketAnalysis.marketRegime === 'bull' ? 'bg-green-100 text-green-800' :
                data.marketAnalysis.marketRegime === 'bear' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {data.marketAnalysis.marketRegime.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">VIX Level:</span>
              <span className="font-medium text-purple-600">
                {data.marketAnalysis.vixLevel.toFixed(2)}
              </span>
            </div>
            {isExpanded && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Implied Vol:</span>
                <span className="font-medium text-blue-600">
                  {data.marketAnalysis.impliedVolatility.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-sm text-gray-500">
            {module.description}
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">{module.name}</h3>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            module.category === 'core' ? 'bg-blue-100 text-blue-800' :
            module.category === 'import' ? 'bg-yellow-100 text-yellow-800' :
            'bg-purple-100 text-purple-800'
          }`}>
            {module.category}
          </span>
          {(module.category === 'import' || module.category === 'broker') && (
            <button
              onClick={onToggleExpand}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              <svg 
                className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>
      {renderModuleContent()}
    </div>
  );
};

const StreamlinedDashboard: React.FC<StreamlinedDashboardProps> = ({
  userLevel,
  onUserLevelChange,
  className = ''
}) => {
  const [analytics, setAnalytics] = useState<ConsolidatedAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Initialize analytics engine with user level
  const analyticsEngine = useMemo(() => {
    const config: AnalyticsConfig = {
      userLevel: userLevel === 'learning' ? 'learning' : 
                 userLevel === 'import' ? 'import' : 'broker',
      enabledModules: [], // Will be populated based on user level
      layout: 'compact',
      refreshInterval: 30000
    };

    const engine = new UnifiedAnalyticsEngine(config);
    
    // Enable modules based on user level
    const enabledModules = engine.getEnabledModules().map(m => m.id);
    engine.updateConfig({ enabledModules });
    
    return engine;
  }, [userLevel]);

  // Load analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await analyticsEngine.getConsolidatedAnalytics();
        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
        console.error('Error loading analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();

    // Subscribe to analytics updates
    const unsubscribe = analyticsEngine.subscribe(setAnalytics);
    
    // Set up refresh interval
    const interval = setInterval(loadAnalytics, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [analyticsEngine]);

  const enabledModules = analyticsEngine.getEnabledModules();
  const maxModules = analyticsEngine.getMaxModulesForUserLevel();

  const handleToggleExpand = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const handleUserLevelChange = (newLevel: UserExperienceLevel) => {
    if (onUserLevelChange) {
      onUserLevelChange(newLevel);
    }
  };

  if (isLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error Loading Analytics</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center text-gray-500">
          No analytics data available
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      {/* Header with user level selector */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">
            Showing {enabledModules.length} of {maxModules === Infinity ? 'unlimited' : maxModules} modules for {userLevel} users
          </p>
        </div>
        
        {onUserLevelChange && (
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Experience Level:</label>
            <select
              value={userLevel}
              onChange={(e) => handleUserLevelChange(e.target.value as UserExperienceLevel)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="learning">Beginner</option>
              <option value="import">Intermediate</option>
              <option value="broker">Advanced</option>
            </select>
          </div>
        )}
      </div>

      {/* Progressive disclosure info */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-blue-800 font-medium text-sm">Progressive Disclosure Active</h3>
        <p className="text-blue-600 text-sm mt-1">
          {userLevel === 'learning' && 'Showing essential features only. Upgrade to Intermediate for more analytics.'}
          {userLevel === 'import' && 'Showing core and intermediate features. Upgrade to Advanced for full analytics suite.'}
          {userLevel === 'broker' && 'All analytics features available. You have full access to the complete suite.'}
        </p>
      </div>

      {/* Analytics modules grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {enabledModules.slice(0, maxModules).map(module => (
          <ModuleCard
            key={module.id}
            module={module}
            data={analytics}
            isExpanded={expandedModules.has(module.id)}
            onToggleExpand={() => handleToggleExpand(module.id)}
          />
        ))}
      </div>

      {/* Last updated timestamp */}
      <div className="mt-6 text-center text-xs text-gray-500">
        Last updated: {analytics.lastUpdated.toLocaleTimeString()}
      </div>
    </div>
  );
};

export default StreamlinedDashboard; 