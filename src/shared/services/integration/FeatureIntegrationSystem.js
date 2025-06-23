/**
 * Feature Integration System
 * Unified integration layer connecting all screening and trading components
 * 
 * Integrates:
 * - Goal Assessment System (Phase 2, Task 1)
 * - Template Matching System (Phase 2, Task 2) 
 * - Account Classification System (Phase 3, Task 1)
 * - Risk Management Integration (Phase 3, Task 2)
 * - Curated Stock Lists (Phase 4, Task 1)
 * - Advanced Filtering System (Existing)
 * 
 * Workflow: Goal Assessment → Template Matching → Curated Lists → Advanced Screening → Results → Trading
 */

import GoalIdentificationSystem from '../../../features/goal-setting/services/goals/GoalIdentificationSystem';
import GoalBasedTemplateSystem from '../../../features/goal-setting/services/goals/GoalBasedTemplateSystem';
import AccountLevelSystem from '../../../features/portfolio/services/account/AccountLevelSystem';
import { EventEmitter } from 'events';

class FeatureIntegrationSystem extends EventEmitter {
  constructor() {
    super();
    
    this.goalSystem = new GoalIdentificationSystem();
    this.templateSystem = new GoalBasedTemplateSystem();
    this.accountSystem = new AccountLevelSystem();
    
    this.workflow = {
      GOAL_ASSESSMENT: 'goal-assessment',
      TEMPLATE_MATCHING: 'template-matching', 
      ACCOUNT_CLASSIFICATION: 'account-classification',
      CURATED_LISTS: 'curated-lists',
      ADVANCED_SCREENING: 'advanced-screening',
      RESULTS_ANALYSIS: 'results-analysis',
      CHART_ANALYSIS: 'chart-analysis',
      NEWS_SENTIMENT: 'news-sentiment',
      BROKER_INTEGRATION: 'broker-integration',
      RISK_MANAGEMENT: 'risk-management'
    };
    
    this.workflowSteps = [
      {
        id: this.workflow.GOAL_ASSESSMENT,
        name: 'Goal Assessment',
        description: 'Identify investment goals and risk profile',
        route: '/goal-assessment',
        component: 'GoalIdentificationWizard',
        icon: 'target',
        status: 'pending',
        progress: 0,
        data: null,
        dependencies: [],
        integrations: ['account-classification', 'template-matching']
      },
      {
        id: this.workflow.TEMPLATE_MATCHING,
        name: 'Template Matching',
        description: 'AI-powered stock-to-goal alignment',
        route: '/template-matching',
        component: 'GoalBasedTemplateSystem',
        icon: 'brain',
        status: 'pending',
        progress: 0,
        data: null,
        dependencies: ['goal-assessment'],
        integrations: ['curated-lists', 'advanced-screening']
      },
      {
        id: this.workflow.ACCOUNT_CLASSIFICATION,
        name: 'Account Setup',
        description: 'Configure account tier and position sizing',
        route: '/account-classification',
        component: 'AccountManagementDashboard',
        icon: 'user-circle',
        status: 'pending',
        progress: 0,
        data: null,
        dependencies: ['goal-assessment'],
        integrations: ['risk-management', 'broker-integration']
      },
      {
        id: this.workflow.CURATED_LISTS,
        name: 'Curated Lists',
        description: 'Pre-screened stocks matching your goals',
        route: '/curated-lists',
        component: 'CuratedStockLists',
        icon: 'star',
        status: 'pending',
        progress: 0,
        data: null,
        dependencies: ['template-matching'],
        integrations: ['advanced-screening', 'results-analysis']
      },
      {
        id: this.workflow.ADVANCED_SCREENING,
        name: 'Advanced Screening',
        description: 'Technical and fundamental analysis',
        route: '/advanced-screening',
        component: 'TechnicalFundamentalScreener',
        icon: 'filter',
        status: 'pending',
        progress: 0,
        data: null,
        dependencies: ['template-matching', 'curated-lists'],
        integrations: ['results-analysis', 'chart-analysis']
      },
      {
        id: this.workflow.RESULTS_ANALYSIS,
        name: 'Results Analysis',
        description: 'Review and validate stock selections',
        route: '/results-analysis',
        component: 'ResultsGrid',
        icon: 'bar-chart',
        status: 'pending',
        progress: 0,
        data: null,
        dependencies: ['advanced-screening'],
        integrations: ['chart-analysis', 'news-sentiment', 'broker-integration']
      },
      {
        id: this.workflow.CHART_ANALYSIS,
        name: 'Chart Analysis',
        description: 'Technical analysis with TradingView integration',
        route: '/charts',
        component: 'ChartAnalysis',
        icon: 'trending-up',
        status: 'pending',
        progress: 0,
        data: null,
        dependencies: ['results-analysis'],
        integrations: ['news-sentiment', 'broker-integration']
      },
      {
        id: this.workflow.NEWS_SENTIMENT,
        name: 'News Sentiment',
        description: 'AI-powered news analysis for selected stocks',
        route: '/news',
        component: 'NewsAnalysis',
        icon: 'newspaper',
        status: 'pending',
        progress: 0,
        data: null,
        dependencies: ['results-analysis'],
        integrations: ['broker-integration', 'risk-management']
      },
      {
        id: this.workflow.BROKER_INTEGRATION,
        name: 'Broker Integration',
        description: 'Execute trades through connected brokers',
        route: '/broker',
        component: 'BrokerIntegration',
        icon: 'building',
        status: 'pending',
        progress: 0,
        data: null,
        dependencies: ['results-analysis'],
        integrations: ['risk-management']
      },
      {
        id: this.workflow.RISK_MANAGEMENT,
        name: 'Risk Management',
        description: 'Portfolio risk assessment and monitoring',
        route: '/risk-management',
        component: 'RiskManagement',
        icon: 'shield',
        status: 'pending',
        progress: 0,
        data: null,
        dependencies: ['account-classification'],
        integrations: ['broker-integration']
      }
    ];
    
    // Global state management
    this.globalState = {
      userGoals: null,
      accountLevel: null,
      templateMatches: null,
      curatedStocks: null,
      screeningResults: null,
      selectedStocks: [],
      chartAnalysis: {},
      newsSentiment: {},
      riskAssessment: null,
      portfolioData: null,
      currentStep: this.workflow.GOAL_ASSESSMENT,
      workflowProgress: 0,
      sessionId: this.generateSessionId()
    };
    
    // Performance tracking
    this.performanceMetrics = {
      goalAccuracy: 0,
      templateMatchScore: 0,
      screeningEfficiency: 0,
      riskAdjustedReturn: 0,
      userSatisfaction: 0,
      completionRate: 0,
      timeToDecision: 0
    };
    
    // Integration endpoints
    this.integrationEndpoints = {
      charts: '/api/charts',
      news: '/api/news',
      broker: '/api/broker',
      risk: '/api/risk',
      education: '/api/education'
    };
    
    this.setupEventHandlers();
  }

  /**
   * Initialize the integration system with user data
   */
  async initialize(userData = {}) {
    try {
      this.globalState.sessionId = this.generateSessionId();
      
      // Initialize with any existing user data
      if (userData.goals) {
        this.updateStepData(this.workflow.GOAL_ASSESSMENT, userData.goals);
      }
      
      if (userData.account) {
        this.updateStepData(this.workflow.ACCOUNT_CLASSIFICATION, userData.account);
      }
      
      // Setup real-time synchronization
      this.startRealTimeSync();
      
      this.emit('system-initialized', {
        sessionId: this.globalState.sessionId,
        workflowSteps: this.workflowSteps,
        globalState: this.globalState
      });
      
      return this.globalState;
      
    } catch (error) {
      console.error('Integration system initialization failed:', error);
      throw error;
    }
  }

  /**
   * Navigate to specific workflow step with context preservation
   */
  async navigateToStep(stepId, context = {}) {
    try {
      const step = this.getWorkflowStep(stepId);
      if (!step) {
        throw new Error(`Invalid workflow step: ${stepId}`);
      }
      
      // Check dependencies
      const dependenciesMet = this.checkDependencies(stepId);
      if (!dependenciesMet.canProceed) {
        this.emit('navigation-blocked', {
          stepId,
          missingDependencies: dependenciesMet.missing,
          message: 'Complete prerequisite steps first'
        });
        return false;
      }
      
      // Update current step
      this.globalState.currentStep = stepId;
      
      // Preserve context
      if (context.preserveContext !== false) {
        this.preserveContext(stepId, context);
      }
      
      // Update progress
      this.updateWorkflowProgress();
      
      this.emit('step-navigation', {
        from: this.globalState.currentStep,
        to: stepId,
        context,
        globalState: this.globalState
      });
      
      return true;
      
    } catch (error) {
      console.error('Navigation failed:', error);
      this.emit('navigation-error', { stepId, error: error.message });
      return false;
    }
  }

  /**
   * Update data for specific workflow step
   */
  updateStepData(stepId, data, options = {}) {
    try {
      const step = this.getWorkflowStep(stepId);
      if (!step) {
        throw new Error(`Invalid workflow step: ${stepId}`);
      }
      
      // Update step data
      step.data = { ...step.data, ...data };
      step.status = 'completed';
      step.progress = 100;
      
      // Update global state based on step type
      this.updateGlobalState(stepId, data);
      
      // Trigger integrations
      this.triggerIntegrations(stepId, data);
      
      // Auto-advance to next logical step if configured
      if (options.autoAdvance !== false) {
        this.autoAdvanceWorkflow(stepId);
      }
      
      this.emit('step-data-updated', {
        stepId,
        data,
        globalState: this.globalState,
        nextSteps: this.getAvailableNextSteps(stepId)
      });
      
    } catch (error) {
      console.error('Step data update failed:', error);
      this.emit('step-update-error', { stepId, error: error.message });
    }
  }

  /**
   * Execute cross-feature integration
   */
  async executeIntegration(fromStep, toStep, data) {
    try {
      const integrationKey = `${fromStep}-${toStep}`;
      
      switch (integrationKey) {
        case 'results-analysis-chart-analysis':
          return await this.integrateResultsToCharts(data);
          
        case 'results-analysis-news-sentiment':
          return await this.integrateResultsToNews(data);
          
        case 'results-analysis-broker-integration':
          return await this.integrateResultsToBroker(data);
          
        case 'account-classification-risk-management':
          return await this.integrateAccountToRisk(data);
          
        case 'template-matching-curated-lists':
          return await this.integrateTemplateToCurated(data);
          
        case 'advanced-screening-results-analysis':
          return await this.integrateScreeningToResults(data);
          
        default:
          console.warn(`No specific integration handler for ${integrationKey}`);
          return this.genericIntegration(fromStep, toStep, data);
      }
      
    } catch (error) {
      console.error(`Integration failed: ${fromStep} → ${toStep}`, error);
      this.emit('integration-error', { fromStep, toStep, error: error.message });
      throw error;
    }
  }

  /**
   * Integrate screening results to chart analysis
   */
  async integrateResultsToCharts(data) {
    const { selectedStocks } = data;
    
    const chartIntegration = {
      symbols: selectedStocks.map(stock => stock.symbol),
      timeframes: ['1D', '1W', '1M'],
      indicators: this.getRecommendedIndicators(data),
      analysisType: 'goal-based',
      riskProfile: this.globalState.accountLevel?.tier?.riskLevel || 'moderate',
      template: this.globalState.templateMatches?.template
    };
    
    // Update chart analysis data
    this.globalState.chartAnalysis = chartIntegration;
    
    this.emit('charts-integration', {
      integration: chartIntegration,
      route: '/charts',
      context: { fromScreening: true, selectedStocks }
    });
    
    return chartIntegration;
  }

  /**
   * Integrate screening results to news sentiment analysis
   */
  async integrateResultsToNews(data) {
    const { selectedStocks } = data;
    
    const newsIntegration = {
      symbols: selectedStocks.map(stock => stock.symbol),
      analysisTypes: ['earnings', 'analyst-ratings', 'market-sentiment'],
      timeframe: '30d',
      goalAlignment: this.globalState.userGoals?.analysis?.primaryGoal,
      riskContext: this.globalState.accountLevel?.tier?.riskLevel
    };
    
    // Update news sentiment data
    this.globalState.newsSentiment = newsIntegration;
    
    this.emit('news-integration', {
      integration: newsIntegration,
      route: '/news',
      context: { fromScreening: true, selectedStocks }
    });
    
    return newsIntegration;
  }

  /**
   * Integrate screening results to broker for trading
   */
  async integrateResultsToBroker(data) {
    const { selectedStocks } = data;
    
    const brokerIntegration = {
      orders: selectedStocks.map(stock => ({
        symbol: stock.symbol,
        quantity: this.calculatePositionSize(stock),
        type: 'market',
        side: 'buy',
        timeInForce: 'day',
        riskParameters: this.getRiskParameters(stock)
      })),
      portfolioAllocation: this.calculatePortfolioAllocation(selectedStocks),
      riskLimits: this.globalState.accountLevel?.adjustedMetrics,
      goalAlignment: this.globalState.userGoals?.analysis?.primaryGoal
    };
    
    this.globalState.portfolioData = brokerIntegration;
    
    this.emit('broker-integration', {
      integration: brokerIntegration,
      route: '/broker',
      context: { fromScreening: true, selectedStocks }
    });
    
    return brokerIntegration;
  }

  /**
   * Check if step dependencies are satisfied
   */
  checkDependencies(stepId) {
    const step = this.getWorkflowStep(stepId);
    if (!step) return { canProceed: false, missing: ['invalid-step'] };
    
    const missing = step.dependencies.filter(depId => {
      const depStep = this.getWorkflowStep(depId);
      return !depStep || depStep.status !== 'completed';
    });
    
    return {
      canProceed: missing.length === 0,
      missing: missing
    };
  }

  /**
   * Get available next steps based on dependencies
   */
  getAvailableNextSteps(currentStepId) {
    const currentStep = this.getWorkflowStep(currentStepId);
    if (!currentStep) return [];
    
    return this.workflowSteps.filter(step => {
      const dependenciesMet = this.checkDependencies(step.id);
      return dependenciesMet.canProceed && step.status === 'pending';
    });
  }

  /**
   * Get workflow step by ID
   */
  getWorkflowStep(stepId) {
    return this.workflowSteps.find(step => step.id === stepId);
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Setup event handlers for real-time integration
   */
  setupEventHandlers() {
    // Auto-save workflow state
    this.on('step-data-updated', (event) => {
      this.saveWorkflowState();
    });
    
    // Performance tracking
    this.on('step-navigation', (event) => {
      this.trackPerformanceMetrics(event);
    });
    
    // Error recovery
    this.on('integration-error', (event) => {
      this.handleIntegrationError(event);
    });
  }

  /**
   * Save workflow state to localStorage
   */
  saveWorkflowState() {
    try {
      const state = {
        globalState: this.globalState,
        workflowSteps: this.workflowSteps,
        performanceMetrics: this.performanceMetrics,
        timestamp: Date.now()
      };
      
      localStorage.setItem(`workflow-state-${this.globalState.sessionId}`, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save workflow state:', error);
    }
  }

  /**
   * Update global state based on step data
   */
  updateGlobalState(stepId, data) {
    switch (stepId) {
      case this.workflow.GOAL_ASSESSMENT:
        this.globalState.userGoals = data;
        break;
      case this.workflow.ACCOUNT_CLASSIFICATION:
        this.globalState.accountLevel = data;
        break;
      case this.workflow.TEMPLATE_MATCHING:
        this.globalState.templateMatches = data;
        break;
      case this.workflow.CURATED_LISTS:
        this.globalState.curatedStocks = data;
        break;
      case this.workflow.ADVANCED_SCREENING:
        this.globalState.screeningResults = data;
        break;
      case this.workflow.RESULTS_ANALYSIS:
        this.globalState.selectedStocks = data.selectedStocks || [];
        break;
    }
  }

  /**
   * Start real-time synchronization
   */
  startRealTimeSync() {
    // Mock real-time sync for demo
    setInterval(() => {
      this.emit('real-time-update', {
        timestamp: Date.now(),
        marketStatus: 'open',
        connectionStatus: 'connected'
      });
    }, 30000);
  }

  /**
   * Get comprehensive workflow status
   */
  getWorkflowStatus() {
    return {
      currentStep: this.globalState.currentStep,
      progress: this.globalState.workflowProgress,
      completedSteps: this.workflowSteps.filter(step => step.status === 'completed'),
      availableSteps: this.getAvailableSteps(),
      nextRecommendedStep: this.getNextRecommendedStep(),
      globalState: this.globalState,
      performanceMetrics: this.performanceMetrics,
      integrationStatus: this.getIntegrationStatus()
    };
  }

  /**
   * Update workflow progress calculation
   */
  updateWorkflowProgress() {
    const completedSteps = this.workflowSteps.filter(step => step.status === 'completed').length;
    const totalSteps = this.workflowSteps.length;
    this.globalState.workflowProgress = Math.round((completedSteps / totalSteps) * 100);
  }

  /**
   * Get integration status
   */
  getIntegrationStatus() {
    return {
      charts: 'connected',
      news: 'connected', 
      broker: 'disconnected',
      risk: 'connected',
      education: 'connected'
    };
  }

  /**
   * Get available steps
   */
  getAvailableSteps() {
    return this.workflowSteps.filter(step => {
      const dependenciesMet = this.checkDependencies(step.id);
      return dependenciesMet.canProceed;
    });
  }

  /**
   * Get next recommended step
   */
  getNextRecommendedStep() {
    return this.workflowSteps.find(step => step.status === 'pending');
  }
}

export default FeatureIntegrationSystem; 