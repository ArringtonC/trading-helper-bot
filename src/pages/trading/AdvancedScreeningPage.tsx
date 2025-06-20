import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/button';
import { 
  Search, Filter, TrendingUp, BarChart3, Settings, Download, 
  RefreshCw, BookOpen, Target, Zap, AlertTriangle, CheckCircle2,
  Play, Pause, Save, Upload, History, Star, Heart, Shield, Lightbulb,
  Layout
} from 'lucide-react';
import TechnicalFundamentalScreener, { 
  ScreeningCriteria, 
  ScreenedStock, 
  ScreeningTemplate
} from '../../services/TechnicalFundamentalScreener';
import { UserExperienceLevel } from '../../utils/ux/UXLayersController';
import ScreeningFilters from '../../components/AdvancedScreening/ScreeningFilters';
import ScreeningResults from '../../components/AdvancedScreening/ScreeningResults';
import PerformanceValidation from '../../components/AdvancedScreening/PerformanceValidation';
import StockScreeningIntegration from '../../components/StockScreening/StockScreeningIntegration';
import ScreeningHub from '../../components/ScreeningHub/ScreeningHub';
import { IntegrationProvider } from '../../context/IntegrationContext';
import { UserFlowProvider } from '../../context/UserFlowContext';

interface AdvancedScreeningPageProps {
  userLevel?: UserExperienceLevel;
}

interface TabItem {
  id: 'screening-hub' | 'goal-first' | 'filters' | 'results' | 'performance';
  label: string;
  icon: any;
  description: string;
  isNew?: boolean;
  badge?: string;
}

interface GoalFirstResults {
  goals: any;
  account: any;
  template: any;
  matches: any;
  selection: any[];
  flowData: any;
}

const AdvancedScreeningPage: React.FC<AdvancedScreeningPageProps> = ({ 
  userLevel = 'learning' as UserExperienceLevel
}) => {
  // Core state
  const [screener] = useState(() => new TechnicalFundamentalScreener());
  const [activeTab, setActiveTab] = useState<'screening-hub' | 'goal-first' | 'filters' | 'results' | 'performance'>('screening-hub');
  const [isScreening, setIsScreening] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  // Screening state
  const [criteria, setCriteria] = useState<ScreeningCriteria>({
    technical: {
      rsiRange: { min: 20, max: 80 },
      macdSignal: 'any',
      goldenCross: false,
      volumeThreshold: 1_000_000,
      priceRange: { min: 10, max: 500 }
    },
    fundamental: {
      maxDebtToEquity: 2.0,
      minCurrentRatio: 1.2,
      minRevenueGrowth: 0.05,
      maxPegRatio: 3.0,
      minMarketCap: 1_000_000_000
    },
    level: userLevel
  });
  
  const [results, setResults] = useState<ScreenedStock[]>([]);
  const [templates, setTemplates] = useState<ScreeningTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [lastScreenTime, setLastScreenTime] = useState<Date | null>(null);

  // Goal-first screening state
  const [goalFirstResults, setGoalFirstResults] = useState<GoalFirstResults | null>(null);
  const [showGoalFirst, setShowGoalFirst] = useState(true);

  // Run screening analysis - wrapped in useCallback for stable reference
  const runScreening = useCallback(async () => {
    console.log('🔍 runScreening called');
    console.log('📊 Current criteria:', criteria);
    console.log('🏭 Screener instance:', screener);
    
    setIsScreening(true);
    
    try {
      console.log('📈 Calling screener.screenStocks...');
      const screenedStocks = await screener.screenStocks(criteria);
      console.log('✅ Screening completed, results:', screenedStocks.length, 'stocks');
      console.log('📋 First few results:', screenedStocks.slice(0, 3));
      
      setResults(screenedStocks);
      setLastScreenTime(new Date());
      
      // Auto-switch to results if we have data
      if (screenedStocks.length > 0) {
        console.log('🔄 Switching to results tab');
        setActiveTab('results');
      }
    } catch (error) {
      console.error('❌ Screening error:', error);
    } finally {
      setIsScreening(false);
    }
  }, [screener, criteria]);

  // Handle goal-first screening completion
  const handleGoalFirstComplete = (results: GoalFirstResults) => {
    console.log('🎯 Goal-first screening completed:', results);
    setGoalFirstResults(results);
    
    // You could optionally auto-switch to technical screening with the results
    // or provide integration between the two approaches
  };

  // Handle template selection - wrapped in useCallback for stable reference
  const handleTemplateSelect = useCallback((templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setCriteria(template.criteria);
      setSelectedTemplate(templateId);
    }
  }, [templates]);

  // Initialize data and templates
  useEffect(() => {
    const loadTemplates = async () => {
      const availableTemplates = screener.getTemplatesByLevel(userLevel);
      setTemplates(availableTemplates);
      
      // Auto-select first template for beginners
      if (userLevel === 'learning' && availableTemplates.length > 0) {
        handleTemplateSelect(availableTemplates[0].id);
      }
    };
    
    loadTemplates();
  }, [userLevel, screener, handleTemplateSelect]);

  // Auto-refresh functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh && results.length > 0) {
      interval = setInterval(() => {
        runScreening();
      }, 60000); // Refresh every minute
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, results.length, runScreening]);

  // Level-based configuration
  const levelConfig = useMemo(() => {
    switch (userLevel) {
      case 'learning':
        return {
          title: 'Stock Screening Hub',
          description: 'Unified workflow with goal-first guidance and technical screening',
          maxFilters: 5,
          showAdvanced: false,
          complexityNote: 'Start with the unified hub for complete workflow guidance',
          recommendedTab: 'screening-hub'
        };
      case 'import':
        return {
          title: 'Intermediate Screening Suite',
          description: 'Complete workflow from goal setting to trading execution',
          maxFilters: 10,
          showAdvanced: true,
          complexityNote: 'Use the unified hub for comprehensive screening-to-trading workflow',
          recommendedTab: 'screening-hub'
        };
      case 'broker':
        return {
          title: 'Professional Screening Platform',
          description: 'End-to-end screening, analysis, and trading integration',
          maxFilters: Infinity,
          showAdvanced: true,
          complexityNote: 'Complete professional workflow with all integrated features',
          recommendedTab: 'screening-hub'
        };
      default:
        return {
          title: 'Stock Screener',
          description: 'Unified screening platform',
          maxFilters: 5,
          showAdvanced: false,
          complexityNote: 'Complete screening workflow',
          recommendedTab: 'screening-hub'
        };
    }
  }, [userLevel]);

  // Auto-select recommended tab for new users
  useEffect(() => {
    if (levelConfig.recommendedTab && activeTab === 'screening-hub') {
      // Keep the screening hub as default
    }
  }, [levelConfig.recommendedTab, activeTab]);

  // Save current settings as template
  const saveCurrentTemplate = () => {
    const templateName = prompt('Enter template name:');
    if (templateName) {
      const template: ScreeningTemplate = {
        id: `custom-${Date.now()}`,
        name: templateName,
        description: 'Custom template',
        criteria: criteria,
        level: userLevel
      };
      
      setTemplates(prev => [...prev, template]);
      console.log('💾 Saved template:', template);
    }
  };

  // Export results
  const exportResults = (format: 'csv' | 'json' = 'csv') => {
    const data = format === 'csv' 
      ? results.map(stock => ({
          symbol: stock.symbol,
          name: stock.name,
          price: stock.price,
          score: stock.overallScore
        }))
      : results;
      
    const blob = new Blob([
      format === 'csv' 
        ? 'Symbol,Name,Price,Score\n' + data.map(r => Object.values(r).join(',')).join('\n')
        : JSON.stringify(data, null, 2)
    ], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `screening-results.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get status for the header
  const getStatusInfo = () => {
    if (isScreening) return { text: 'Screening...', color: 'blue' };
    if (results.length > 0) return { text: `${results.length} stocks found`, color: 'green' };
    return { text: 'Ready to screen', color: 'gray' };
  };

  // Tab navigation component
  const renderTabNavigation = () => {
    const tabs: TabItem[] = [
      {
        id: 'screening-hub',
        label: 'Screening Hub',
        icon: Layout,
        description: 'Unified workflow dashboard (+400 basis points)',
        isNew: true
      },
      {
        id: 'goal-first',
        label: 'Goal-First Screening',
        icon: Target,
        description: 'Research-backed approach with bias detection'
      },
      {
        id: 'filters',
        label: 'Technical Filters',
        icon: Filter,
        description: 'Advanced technical & fundamental screening'
      },
      {
        id: 'results',
        label: 'Results',
        icon: BarChart3,
        description: `${results.length} stocks found`,
        badge: results.length > 0 ? results.length.toString() : undefined
      },
      {
        id: 'performance',
        label: 'Validation',
        icon: TrendingUp,
        description: 'Backtest & validate strategies'
      }
    ];

    return (
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2 ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                
                {tab.isNew && (
                  <Badge variant="secondary" className="ml-1 bg-green-100 text-green-800 text-xs">
                    NEW
                  </Badge>
                )}
                
                {tab.badge && (
                  <Badge variant="secondary" className="ml-1">
                    {tab.badge}
                  </Badge>
                )}
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  {tab.description}
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    );
  };

  // Render main content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'screening-hub':
        return (
          <IntegrationProvider>
            <UserFlowProvider>
              <div className="space-y-6">
                {/* Integration Banner */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Layout className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Complete Screening-to-Trading Workflow
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="text-gray-700">
                            <strong>400+ basis points</strong> improvement via goal-first approach
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Layout className="w-4 h-4 text-purple-600" />
                          <span className="text-gray-700">
                            <strong>Unified workflow</strong> from goals to execution
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-blue-600" />
                          <span className="text-gray-700">
                            <strong>Real-time integration</strong> with charts, news & brokers
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-600 mt-3">
                        The unified screening hub integrates goal assessment, template matching, curated lists, 
                        advanced screening, chart analysis, news sentiment, and broker execution in one seamless workflow.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Screening Hub Component */}
                <ScreeningHub />
              </div>
            </UserFlowProvider>
          </IntegrationProvider>
        );

      case 'goal-first':
        return (
          <div className="space-y-6">
            {/* Research Benefits Banner */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Goal-First Approach: Research-Backed Results
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">
                        <strong>+400 basis points</strong> performance improvement
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-600" />
                      <span className="text-gray-700">
                        <strong>45% reduction</strong> in information overload
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-700">
                        <strong>Bias detection</strong> & education included
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 mt-3">
                    Our goal-first screening process uses AI-powered templates with research from top-tier algorithms 
                    including TS-Deep-LtM (30% higher returns) and genetic optimization (28.41% backtested returns).
                  </p>
                </div>
              </div>
            </div>

            {/* Goal-First Screening Component */}
            <UserFlowProvider>
              <StockScreeningIntegration
                onScreeningComplete={handleGoalFirstComplete}
                initialAccountData={undefined}
              />
            </UserFlowProvider>

            {/* Integration with Technical Screening */}
            {goalFirstResults && (
              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Ready for Advanced Analysis?
                </h3>
                <p className="text-gray-600 mb-4">
                  You've completed goal-first screening with {goalFirstResults.selection?.length || 0} stocks selected. 
                  Want to apply additional technical filters or validate performance?
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setActiveTab('filters')}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    Apply Technical Filters
                  </Button>
                  <Button
                    onClick={() => setActiveTab('performance')}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Validate Performance
                  </Button>
                  <Button
                    onClick={() => setActiveTab('screening-hub')}
                    variant="default"
                    className="flex items-center gap-2"
                  >
                    <Layout className="w-4 h-4" />
                    Go to Unified Hub
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      case 'filters':
        return (
          <div className="space-y-6">
            {goalFirstResults && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    Goal-First Results Available
                  </span>
                </div>
                <p className="text-sm text-blue-700">
                  You have {goalFirstResults.selection?.length || 0} goal-aligned stocks. 
                  Technical filters will refine this list further.
                </p>
              </div>
            )}
            
            <ScreeningFilters
              criteria={criteria}
              onChange={setCriteria}
              userLevel={userLevel}
              onScreen={runScreening}
              isScreening={isScreening}
              levelConfig={levelConfig}
            />
          </div>
        );

      case 'results':
        return (
          <ScreeningResults
            results={results}
            userLevel={userLevel}
            isLoading={isScreening}
            onExport={exportResults}
            onRescreen={runScreening}
          />
        );

      case 'performance':
        return (
          <PerformanceValidation
            templates={templates}
            screener={screener}
            userLevel={userLevel}
            currentResults={results}
          />
        );

      default:
        return null;
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {levelConfig.title}
            </h1>
            <p className="mt-2 text-gray-600">
              {levelConfig.description}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                statusInfo.color === 'blue' ? 'bg-blue-500' :
                statusInfo.color === 'green' ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <span className="text-sm text-gray-600">{statusInfo.text}</span>
            </div>
            
            {/* Quick actions */}
            <div className="flex items-center gap-2">
              {results.length > 0 && (
                <Button
                  onClick={() => exportResults('csv')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              )}
              
              <Button
                onClick={saveCurrentTemplate}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <Save className="w-4 h-4" />
                Save Template
              </Button>
              
              <Button
                onClick={() => setAutoRefresh(!autoRefresh)}
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                className="flex items-center gap-1"
              >
                <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto Refresh
              </Button>
            </div>
          </div>
        </div>
        
        {/* Level hint */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> {levelConfig.complexityNote}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      {renderTabNavigation()}

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default AdvancedScreeningPage; 