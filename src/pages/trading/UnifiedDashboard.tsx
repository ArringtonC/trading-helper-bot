import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { HeroStrip } from '../../components/Dashboard/HeroStrip';
import { KpiCards } from '../../components/Dashboard/KpiCards';
import { StrategyHeatMap } from '../../components/Dashboard/StrategyHeatMap';
import { NotificationSystem } from '../../components/Dashboard/NotificationSystem';
import { VirtualPositionsTable } from '../../components/Dashboard/VirtualPositionsTable';
import Upload from '../../components/Upload/Upload';
import PnlCard from '../../components/Dashboard/PnlCard';
import HeatmapChart from '../../components/Dashboard/HeatmapChart';
import ReconciliationReport from '../../components/Reconciliation/ReconciliationReport';
import { PositionAggregationService } from '../../services/PositionAggregationService';
import { 
  getOverallPnlSummary, 
  getDailyPnlHeatmapData, 
  OverallPnlSummary,
  getDailyPnlForReconciliation
} from '../../services/DatabaseService';
import { 
  reconcilePnlData,
  ReconciliationResult
} from '../../services/ReconciliationService';
import eventEmitter from '../../utils/eventEmitter';
import riskService, { RiskDataPayload } from '../../services/RiskService';
import GaugeComponent, { GaugeThresholds } from '../../components/visualizations/GaugeComponent';
import { toast } from 'react-toastify';
import { useGoalSizing } from '../../context/GoalSizingContext';
import { useNavigate } from 'react-router-dom';
import { loadSetting } from '../../services/SettingsService';

// Brand Components
import BrandButton from '../../components/ui/BrandButton';
import BrandCard from '../../components/ui/BrandCard';
import StatusBadge from '../../components/ui/StatusBadge';

// Performance optimization: Data cache with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>();
  
  set<T>(key: string, data: T, ttlMs: number = 30000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  clear(): void {
    this.cache.clear();
  }
}

// SIMPLIFIED USER EXPERIENCE LEVELS BASED ON PRD PERSONAS
interface UserExperienceConfig {
  level: 'basic' | 'import' | 'broker';
  maxVisibleWidgets: number;
  showAdvancedMetrics: boolean;
  showComplexCharts: boolean;
  showRiskGauges: boolean;
  autoHideEmptyWidgets: boolean;
}

const EXPERIENCE_CONFIGS: Record<string, UserExperienceConfig> = {
  basic: {
    level: 'basic',
    maxVisibleWidgets: 3,
    showAdvancedMetrics: false,
    showComplexCharts: false,
    showRiskGauges: false,
    autoHideEmptyWidgets: true
  },
  intermediate: {
    level: 'import',
    maxVisibleWidgets: 5,
    showAdvancedMetrics: true,
    showComplexCharts: false,
    showRiskGauges: true,
    autoHideEmptyWidgets: true
  },
  advanced: {
    level: 'broker',
    maxVisibleWidgets: 10,
    showAdvancedMetrics: true,
    showComplexCharts: true,
    showRiskGauges: true,
    autoHideEmptyWidgets: false
  }
};

// User customization: Dashboard layout configuration
interface DashboardLayout {
  id: string;
  name: string;
  widgets: {
    heroStrip: { enabled: boolean; order: number };
    kpiCards: { enabled: boolean; order: number };
    strategyHeatmap: { enabled: boolean; order: number };
    goalSizing: { enabled: boolean; order: number };
    pnlHeatmap: { enabled: boolean; order: number };
    reconciliation: { enabled: boolean; order: number };
    riskExposure: { enabled: boolean; order: number };
    positionsTable: { enabled: boolean; order: number };
  };
}

interface UserPreferences {
  layout: DashboardLayout;
  refreshInterval: number;
  notifications: {
    enabled: boolean;
    riskAlerts: boolean;
    positionChanges: boolean;
  };
  theme: 'light' | 'dark' | 'auto';
}

// SIMPLIFIED DEFAULT LAYOUT BASED ON PRD CORE WORKFLOWS
const getDefaultLayoutForExperience = (config: UserExperienceConfig): DashboardLayout => ({
  id: `${config.level}-layout`,
  name: `${config.level.charAt(0).toUpperCase() + config.level.slice(1)} Layout`,
  widgets: {
    heroStrip: { enabled: true, order: 1 },
    kpiCards: { enabled: true, order: 2 },
    strategyHeatmap: { enabled: config.showComplexCharts, order: 3 },
    goalSizing: { enabled: true, order: 4 },
    pnlHeatmap: { enabled: config.showComplexCharts, order: 5 },
    reconciliation: { enabled: config.showAdvancedMetrics, order: 6 },
    riskExposure: { enabled: config.showRiskGauges, order: 7 },
    positionsTable: { enabled: true, order: 8 }
  }
});

const getDefaultPreferences = (config: UserExperienceConfig): UserPreferences => ({
  layout: getDefaultLayoutForExperience(config),
  refreshInterval: config.level === 'basic' ? 60000 : 30000, // Slower refresh for basic users
  notifications: {
    enabled: true,
    riskAlerts: config.showRiskGauges,
    positionChanges: config.showAdvancedMetrics
  },
  theme: 'auto'
});

interface KpiData {
  totalValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  dayPnl: number;
  dayPnlPercent: number;
  winRate: number;
}

interface HeatMapData {
  strategy: string;
  Mon: number;
  Tue: number;
  Wed: number;
  Thu: number;
  Fri: number;
}

// Define thresholds for each risk metric
const deltaThresholds: GaugeThresholds = {
  criticalMin: -0.7,
  warningMin: -0.3,
  warningMax: 0.3,
  criticalMax: 0.7,
};

const thetaThresholds: GaugeThresholds = {
  criticalMin: -50,
  warningMin: -20,
  warningMax: -1,
  criticalMax: 0,
};

const gammaThresholds: GaugeThresholds = {
  criticalMin: 0,
  warningMin: 0.01,
  warningMax: 0.2,
  criticalMax: 0.5,
};

const vegaThresholds: GaugeThresholds = {
  criticalMin: 0,
  warningMin: 50,
  warningMax: 300,
  criticalMax: 600,
};

const UnifiedDashboard: React.FC = () => {
  // DETERMINE USER EXPERIENCE LEVEL FROM SETTINGS
  const [userExperienceLevel] = useState<string>(() => {
    const enableAdvanced = loadSetting('enableAdvancedFeatures') === 'true';
    const enableDebug = loadSetting('enableDebugMode') === 'true';
    
    if (enableDebug || enableAdvanced) return 'broker';
    
    // Check if user has used advanced features before
    const hasUsedAdvanced = localStorage.getItem('dashboard-used-advanced') === 'true';
    return hasUsedAdvanced ? 'import' : 'basic';
  });

  const experienceConfig = EXPERIENCE_CONFIGS[userExperienceLevel] || EXPERIENCE_CONFIGS.basic;
  
  // Performance optimization: Initialize cache
  const dataCache = useRef(new DataCache());
  
  // User customization: Load preferences based on experience level
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem(`dashboard-preferences-${userExperienceLevel}`);
    return saved ? { ...getDefaultPreferences(experienceConfig), ...JSON.parse(saved) } : getDefaultPreferences(experienceConfig);
  });
  
  const [showCustomization, setShowCustomization] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(userPreferences.notifications.enabled);
  const [showImportSection, setShowImportSection] = useState(false);
  const [kpiData, setKpiData] = useState<KpiData>({
    totalValue: 0,
    totalPnl: 0,
    totalPnlPercent: 0,
    dayPnl: 0,
    dayPnlPercent: 0,
    winRate: 0,
  });
  const [heatMapData, setHeatMapData] = useState<HeatMapData[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Additional state from old DashboardPage
  const [, setPnlSummary] = useState<OverallPnlSummary | null>(null);
  const [, setIsLoadingPnl] = useState(true);
  const [, setPnlError] = useState<string | null>(null);
  const [heatmapData, setHeatmapData] = useState<number[][] | null>(null);
  const [isLoadingHeatmap, setIsLoadingHeatmap] = useState(true);
  const [heatmapError, setHeatmapError] = useState<string | null>(null);
  const [reconciliationResult, setReconciliationResult] = useState<ReconciliationResult | null>(null);
  const [isLoadingReconciliation, setIsLoadingReconciliation] = useState(true);
  const [reconciliationError, setReconciliationError] = useState<string | null>(null);
  const [riskData, setRiskData] = useState<RiskDataPayload | null>(null);
  const [isLoadingRisk, setIsLoadingRisk] = useState(false);
  const [riskError, setRiskError] = useState<string | null>(null);

  const activeAlertsRef = useRef<Record<keyof Omit<RiskDataPayload, 'timestamp'>, boolean>>({
    delta: false,
    theta: false,
    gamma: false,
    vega: false,
  });

  const { config, isLoading: isLoadingGoalConfig } = useGoalSizing();

  const navigate = useNavigate();

  // Helper function to update KPI data
  const updateKpiData = useCallback((summary: any) => {
    const totalValue = summary.totalMarketValue;
    const totalPnl = summary.totalGainLoss;
    const totalPnlPercent = totalValue > 0 ? (totalPnl / totalValue) * 100 : 0;
    
    // Mock day P&L (in real app, this would come from daily calculations)
    const dayPnl = totalPnl * 0.1; // Mock 10% of total as today's P&L
    const dayPnlPercent = totalValue > 0 ? (dayPnl / totalValue) * 100 : 0;

    setKpiData({
      totalValue,
      totalPnl,
      totalPnlPercent,
      dayPnl,
      dayPnlPercent,
      winRate: summary.winRate,
    });
  }, []);

  // Performance optimization: Memoized calculations
  const memoizedKpiCards = useMemo(() => [
    {
      label: 'Total Value',
      value: `$${kpiData.totalValue.toLocaleString()}`,
      color: 'blue' as const
    },
    {
      label: 'Total P&L',
      value: `$${kpiData.totalPnl.toFixed(2)}`,
      color: kpiData.totalPnl >= 0 ? 'green' as const : 'red' as const,
      trend: kpiData.totalPnl >= 0 ? 'up' as const : 'down' as const
    },
    {
      label: 'P&L %',
      value: `${kpiData.totalPnlPercent.toFixed(2)}%`,
      color: kpiData.totalPnlPercent >= 0 ? 'green' as const : 'red' as const,
      trend: kpiData.totalPnlPercent >= 0 ? 'up' as const : 'down' as const
    },
    {
      label: 'Day P&L',
      value: `$${kpiData.dayPnl.toFixed(2)}`,
      color: kpiData.dayPnl >= 0 ? 'green' as const : 'red' as const,
      trend: kpiData.dayPnl >= 0 ? 'up' as const : 'down' as const
    },
    {
      label: 'Day P&L %',
      value: `${kpiData.dayPnlPercent.toFixed(2)}%`,
      color: kpiData.dayPnlPercent >= 0 ? 'green' as const : 'red' as const,
      trend: kpiData.dayPnlPercent >= 0 ? 'up' as const : 'down' as const
    },
    {
      label: 'Win Rate',
      value: `${kpiData.winRate.toFixed(1)}%`,
      color: kpiData.winRate >= 50 ? 'green' as const : 'red' as const,
      trend: kpiData.winRate >= 50 ? 'up' as const : 'down' as const
    }
  ], [kpiData]);

  // Performance optimization: Cached data fetching functions
  const fetchPnlData = useCallback(async () => {
    const cacheKey = 'pnl-summary';
    const cached = dataCache.current.get<OverallPnlSummary>(cacheKey);
    
    if (cached) {
      setPnlSummary(cached);
      setIsLoadingPnl(false);
      return;
    }

    setIsLoadingPnl(true);
    setPnlError(null);
    try {
      const summary = await getOverallPnlSummary();
      setPnlSummary(summary);
      dataCache.current.set(cacheKey, summary, 30000); // Cache for 30 seconds
    } catch (error: any) {
      console.error('Error fetching PNL summary:', error);
      setPnlError('Failed to load P&L data. ' + (error.message || ''));
    }
    setIsLoadingPnl(false);
  }, []);

  const fetchHeatmapData = useCallback(async () => {
    const cacheKey = 'heatmap-data';
    const cached = dataCache.current.get<number[][]>(cacheKey);
    
    if (cached) {
      setHeatmapData(cached);
      setIsLoadingHeatmap(false);
      return;
    }

    setIsLoadingHeatmap(true);
    setHeatmapError(null);
    try {
      const data = await getDailyPnlHeatmapData();
      setHeatmapData(data);
      dataCache.current.set(cacheKey, data, 60000); // Cache for 1 minute
    } catch (error: any) {
      console.error('Error fetching heatmap data:', error);
      setHeatmapError('Failed to load heatmap data. ' + (error.message || ''));
    }
    setIsLoadingHeatmap(false);
  }, []);

  const fetchReconciliationData = useCallback(async () => {
    const cacheKey = 'reconciliation-data';
    const cached = dataCache.current.get<ReconciliationResult>(cacheKey);
    
    if (cached) {
      setReconciliationResult(cached);
      setIsLoadingReconciliation(false);
      return;
    }

    setIsLoadingReconciliation(true);
    setReconciliationError(null);
    try {
      const dbData = await getDailyPnlForReconciliation();
      console.log(`[DEBUG UnifiedDashboard] Fetched ${dbData.length} daily PNL records for reconciliation.`);

      const reconciliationInput = {
        sourceA: dbData, 
        sourceB: dbData 
      };

      const result = reconcilePnlData(reconciliationInput);
      
      console.log('[DEBUG UnifiedDashboard] Reconciliation result:', result);
      setReconciliationResult(result);
      dataCache.current.set(cacheKey, result, 120000); // Cache for 2 minutes
    } catch (error: any) {
      console.error('Error fetching/running reconciliation:', error);
      setReconciliationError('Failed to run reconciliation. ' + (error.message || ''));
      setReconciliationResult(null);
    }
    setIsLoadingReconciliation(false);
  }, []);

  // Performance optimization: Optimized dashboard data loading with progressive loading
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Progressive loading: Load critical data first
      const cacheKey = 'dashboard-positions';
      const cachedPositions = dataCache.current.get<any[]>(cacheKey);
      
      if (cachedPositions) {
        setPositions(cachedPositions);
        setIsLoading(false);
        
        // Load cached summary if available
        const summaryKey = 'position-summary';
        const cachedSummary = dataCache.current.get<any>(summaryKey);
        if (cachedSummary) {
          updateKpiData(cachedSummary);
        }
      } else {
        // Get trades and aggregate to positions
        const aggregatedPositions = await PositionAggregationService.aggregatePositions();
        const summary = await PositionAggregationService.getPositionSummary();
        
        // Cache the results
        dataCache.current.set(cacheKey, aggregatedPositions, 30000);
        dataCache.current.set('position-summary', summary, 30000);
        
        // Set positions for the virtual table
        setPositions(aggregatedPositions);
        updateKpiData(summary);
        setIsLoading(false);
      }

      // Generate mock strategy heatmap data (cached)
      const heatmapKey = 'strategy-heatmap';
      const cachedHeatmap = dataCache.current.get<HeatMapData[]>(heatmapKey);
      
      if (cachedHeatmap) {
        setHeatMapData(cachedHeatmap);
      } else {
        const mockHeatMapData: HeatMapData[] = [
          {
            strategy: 'Iron Condor',
            Mon: 150.25,
            Tue: -75.50,
            Wed: 200.75,
            Thu: 125.00,
            Fri: -50.25,
          },
          {
            strategy: 'Covered Call',
            Mon: 75.50,
            Tue: 100.25,
            Wed: -25.75,
            Thu: 150.00,
            Fri: 200.50,
          },
          {
            strategy: 'Cash Secured Put',
            Mon: -100.25,
            Tue: 175.50,
            Wed: 125.75,
            Thu: -75.00,
            Fri: 250.25,
          },
        ];
        setHeatMapData(mockHeatMapData);
        dataCache.current.set(heatmapKey, mockHeatMapData, 300000); // Cache for 5 minutes
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setIsLoading(false);
    }
  }, [updateKpiData]);

  // User customization: Toggle widget visibility
  const toggleWidget = useCallback((widgetKey: keyof DashboardLayout['widgets']) => {
    setUserPreferences(prevPreferences => {
      const newLayout = {
        ...prevPreferences.layout,
        widgets: {
          ...prevPreferences.layout.widgets,
          [widgetKey]: {
            ...prevPreferences.layout.widgets[widgetKey],
            enabled: !prevPreferences.layout.widgets[widgetKey].enabled
          }
        }
      };
      
      const newPreferences = {
        ...prevPreferences,
        layout: newLayout
      };
      
      localStorage.setItem(`dashboard-preferences-${userExperienceLevel}`, JSON.stringify(newPreferences));
      return newPreferences;
    });
  }, [userExperienceLevel]);

  // Performance optimization: Auto-refresh with configurable interval
  const { refreshInterval } = userPreferences;
  const { enabled: autoRefreshEnabled } = userPreferences.notifications;
  
  // Use refs to store stable function references
  const loadDashboardDataRef = useRef(loadDashboardData);
  const fetchPnlDataRef = useRef(fetchPnlData);
  const fetchHeatmapDataRef = useRef(fetchHeatmapData);
  const fetchReconciliationDataRef = useRef(fetchReconciliationData);
  
  // Update refs when functions change
  useEffect(() => {
    loadDashboardDataRef.current = loadDashboardData;
    fetchPnlDataRef.current = fetchPnlData;
    fetchHeatmapDataRef.current = fetchHeatmapData;
    fetchReconciliationDataRef.current = fetchReconciliationData;
  }, [loadDashboardData, fetchPnlData, fetchHeatmapData, fetchReconciliationData]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (autoRefreshEnabled) {
        loadDashboardDataRef.current();
        fetchPnlDataRef.current();
        fetchHeatmapDataRef.current();
        fetchReconciliationDataRef.current();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, autoRefreshEnabled]);

  // Initial data loading
  useEffect(() => {
    loadDashboardDataRef.current();
    fetchPnlDataRef.current();
    fetchHeatmapDataRef.current();
    fetchReconciliationDataRef.current();
  }, []); // Empty dependency array - run only once on mount

  // Event listeners for data updates
  useEffect(() => {
    const handleDataUpdate = () => {
      // Clear cache and reload data
      dataCache.current.clear();
      loadDashboardDataRef.current();
      fetchPnlDataRef.current();
      fetchHeatmapDataRef.current();
      fetchReconciliationDataRef.current();
    };

    eventEmitter.on('dataUpdated', handleDataUpdate);
    eventEmitter.on('tradesImported', handleDataUpdate);

    return () => {
      eventEmitter.off('dataUpdated', handleDataUpdate);
      eventEmitter.off('tradesImported', handleDataUpdate);
    };
  }, []); // Empty dependency array - stable event listeners

  // Risk service integration
  const { enabled, riskAlerts } = userPreferences.notifications;
  useEffect(() => {
    const checkAndNotify = (
      metricName: keyof Omit<RiskDataPayload, 'timestamp'>,
      value: number,
      thresholds: GaugeThresholds,
      friendlyName: string
    ) => {
      const isInCriticalRange = value <= thresholds.criticalMin || value >= thresholds.criticalMax;
      const isInWarningRange = !isInCriticalRange && (value <= thresholds.warningMin || value >= thresholds.warningMax);
      
      const shouldAlert = isInCriticalRange || isInWarningRange;
      const wasAlerting = activeAlertsRef.current[metricName];
      
      if (shouldAlert && !wasAlerting && riskAlerts) {
        const severity = isInCriticalRange ? 'error' : 'warning';
        const message = `${friendlyName} is ${isInCriticalRange ? 'critical' : 'warning'}: ${value.toFixed(3)}`;
        
        if (severity === 'error') {
          toast.error(message, { toastId: `risk-${metricName}` });
        } else {
          toast.warning(message, { toastId: `risk-${metricName}` });
        }
        
        activeAlertsRef.current[metricName] = true;
      } else if (!shouldAlert && wasAlerting) {
        activeAlertsRef.current[metricName] = false;
      }
    };

    const handleRiskData = (data: RiskDataPayload) => {
      setRiskData(data);
      setIsLoadingRisk(false);
      setRiskError(null);
      
      if (enabled) {
        checkAndNotify('delta', data.delta, deltaThresholds, 'Delta');
        checkAndNotify('theta', data.theta, thetaThresholds, 'Theta');
        checkAndNotify('gamma', data.gamma, gammaThresholds, 'Gamma');
        checkAndNotify('vega', data.vega, vegaThresholds, 'Vega');
      }
    };

    const unsubscribeRisk = riskService.onRiskData(handleRiskData);
    riskService.connect();

    return () => {
      unsubscribeRisk();
      riskService.disconnect();
    };
  }, [enabled, riskAlerts]);

  // User customization: Widget components map
  const widgetComponents = useMemo(() => ({
    heroStrip: (
      <div key="heroStrip">
        <HeroStrip 
          headline="Unified Positions Dashboard"
          hoursSaved={14.7}
        />
      </div>
    ),
    kpiCards: (
      <div key="kpiCards" className="mt-8">
        <KpiCards cards={memoizedKpiCards} />
      </div>
    ),
    strategyHeatmap: (
      <div key="strategyHeatmap" className="mt-8">
        <StrategyHeatMap data={heatMapData} />
      </div>
    ),
    goalSizing: (
      <div key="goalSizing" className="mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">Goal-Based Position Sizing</h2>
          {isLoadingGoalConfig ? (
            <div className="p-4 text-center text-gray-500">Loading goal sizing configuration...</div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {config ? 'Configure your position sizing strategy' : 'Set up your first position sizing goal'}
              </p>
              <button
                onClick={() => navigate('/goal-sizing')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {config ? 'Open Goal Sizing' : 'Get Started'}
              </button>
            </div>
          )}
        </div>
      </div>
    ),
    pnlHeatmap: (
      <div key="pnlHeatmap" className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <PnlCard />
        </div>
        <div className="md:col-span-1 lg:col-span-2">
          {isLoadingHeatmap && <div className="p-4 text-center text-gray-500">Loading heatmap data...</div>}
          {heatmapError && <div className="p-4 text-center text-red-600">Error: {heatmapError}</div>}
          {!isLoadingHeatmap && !heatmapError && heatmapData !== null && heatmapData.length > 0 && (
            <HeatmapChart data={heatmapData} />
          )}
          {!isLoadingHeatmap && !heatmapError && (!heatmapData || heatmapData.length === 0) && (
            <div className="p-4 text-center text-gray-500 border border-dashed border-gray-300 rounded-md">No heatmap data available. Upload trade data.</div>
          )}
        </div>
      </div>
    ),
    reconciliation: (
      <div key="reconciliation" className="mt-8">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">Reconciliation Report</h2>
        {isLoadingReconciliation && <div className="p-4 text-center text-gray-500">Loading reconciliation data...</div>}
        {reconciliationError && <div className="p-4 text-center text-red-600">Error: {reconciliationError}</div>}
        {!isLoadingReconciliation && !reconciliationError && (
          <ReconciliationReport 
            result={reconciliationResult} 
            isLoading={isLoadingReconciliation}
            error={reconciliationError}
          />
        )}
      </div>
    ),
    riskExposure: (
      <div key="riskExposure" className="mt-8">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">Risk Exposure</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {isLoadingRisk && (
            <>
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-24 rounded"></div>
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-24 rounded"></div>
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-24 rounded"></div>
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-24 rounded"></div>
            </>
          )}
          {riskError && (
            <div className="col-span-2 md:col-span-4 text-center text-red-600">
              Error loading risk data: {riskError}
            </div>
          )}
          {!isLoadingRisk && !riskError && riskData && (
            <>
              <GaugeComponent
                metricName="Delta"
                value={riskData.delta}
                min={-1}
                max={1}
                thresholds={deltaThresholds}
                unit="$"
              />
              <GaugeComponent
                metricName="Theta"
                value={riskData.theta}
                min={-60}
                max={0}
                thresholds={thetaThresholds}
                unit="$"
              />
              <GaugeComponent
                metricName="Gamma"
                value={riskData.gamma}
                min={0.001}
                max={0.5}
                thresholds={gammaThresholds}
                unit="$ / $²"
              />
              <GaugeComponent
                metricName="Vega"
                value={riskData.vega}
                min={0}
                max={500}
                thresholds={vegaThresholds}
                unit="$ / vol"
              />
            </>
          )}
        </div>
      </div>
    ),
    positionsTable: (
      <div key="positionsTable" className="mt-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Unified Positions Dashboard
            </h2>
            <div className="text-sm text-gray-500">
              Real-time position monitoring and analysis
            </div>
          </div>
          <VirtualPositionsTable data={positions} />
        </div>
      </div>
    )
  }), [
    memoizedKpiCards,
    heatMapData,
    config,
    isLoadingGoalConfig,
    isLoadingHeatmap,
    heatmapError,
    heatmapData,
    isLoadingReconciliation,
    reconciliationError,
    reconciliationResult,
    isLoadingRisk,
    riskError,
    riskData,
    positions,
    navigate
  ]);

  // User customization: Get sorted widgets for rendering
  const sortedWidgets = useMemo(() => {
    const availableWidgets = Object.keys(widgetComponents) as (keyof DashboardLayout['widgets'])[];
    return Object.entries(userPreferences.layout.widgets)
      .filter(([key, widget]) => widget.enabled && availableWidgets.includes(key as keyof DashboardLayout['widgets']))
      .sort(([_, a], [__, b]) => a.order - b.order)
      .map(([key, _]) => key as keyof DashboardLayout['widgets']);
  }, [userPreferences.layout.widgets, widgetComponents]);

  // PRD-FOCUSED CORE WORKFLOW INDICATORS
  const getCoreWorkflowStatus = () => {
    const hasData = positions.length > 0;
    const hasGoals = localStorage.getItem('goalSizingProfile') !== null;
    const hasRiskConfig = localStorage.getItem('riskSettings') !== null;
    
    return {
      dataImported: hasData,
      goalsSet: hasGoals,
      riskConfigured: hasRiskConfig,
      nextStep: !hasData ? 'Import Data' : !hasGoals ? 'Set Goals' : !hasRiskConfig ? 'Configure Risk' : 'Monitor Portfolio'
    };
  };

  const workflowStatus = getCoreWorkflowStatus();

  const [hasInteractedWithAdvanced, setHasInteractedWithAdvanced] = useState(false);

  useEffect(() => {
    // Track if user interacts with advanced features
    if (experienceConfig.level !== 'basic' && !hasInteractedWithAdvanced) {
      localStorage.setItem('dashboard-used-advanced', 'true');
      setHasInteractedWithAdvanced(true);
    }
  }, [experienceConfig.level, hasInteractedWithAdvanced]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Customization Panel */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <BrandButton
              variant="primary"
              onClick={() => setShowCustomization(!showCustomization)}
            >
              {showCustomization ? 'Hide' : 'Customize'} Dashboard
            </BrandButton>
            <BrandButton
              variant="success"
              onClick={() => setShowImportSection(!showImportSection)}
            >
              {showImportSection ? 'Hide' : 'Show'} Import
            </BrandButton>
          </div>
          <div className="text-sm text-gray-500">
            Auto-refresh: {userPreferences.refreshInterval / 1000}s | 
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Customization Panel */}
        {showCustomization && (
          <BrandCard variant="elevated" className="mb-8">
            <h3 className="text-xl font-semibold mb-6 text-gray-900">Dashboard Customization</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(userPreferences.layout.widgets).map(([key, widget]) => (
                <BrandCard 
                  key={key} 
                  variant="bordered" 
                  padding="sm"
                  hoverable
                  onClick={() => toggleWidget(key as keyof DashboardLayout['widgets'])}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="text-sm text-gray-500">Order: {widget.order}</div>
                    </div>
                    <StatusBadge
                      status={widget.enabled ? 'success' : 'neutral'}
                      size="sm"
                      showIcon={false}
                    >
                      {widget.enabled ? 'Enabled' : 'Disabled'}
                    </StatusBadge>
                  </div>
                </BrandCard>
              ))}
            </div>
            
            <div className="mt-6 flex items-center space-x-6">
              <label className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700">Refresh Interval:</span>
                <select
                  value={userPreferences.refreshInterval}
                  onChange={(e) => {
                    const newInterval = parseInt(e.target.value);
                    setUserPreferences(prev => {
                      const newPrefs = { ...prev, refreshInterval: newInterval };
                      localStorage.setItem(`dashboard-preferences-${userExperienceLevel}`, JSON.stringify(newPrefs));
                      return newPrefs;
                    });
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                >
                  <option value={15000}>15s</option>
                  <option value={30000}>30s</option>
                  <option value={60000}>1m</option>
                  <option value={300000}>5m</option>
                </select>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={userPreferences.notifications.riskAlerts}
                  onChange={(e) => {
                    const riskAlerts = e.target.checked;
                    setUserPreferences(prev => {
                      const newPrefs = {
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          riskAlerts
                        }
                      };
                      localStorage.setItem(`dashboard-preferences-${userExperienceLevel}`, JSON.stringify(newPrefs));
                      return newPrefs;
                    });
                  }}
                  className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Risk Alerts</span>
              </label>
            </div>
          </BrandCard>
        )}

        {/* Import Section */}
        {showImportSection && (
          <BrandCard variant="elevated" className="mb-8">
            <h3 className="text-xl font-semibold mb-6 text-gray-900">Import Data</h3>
            <Upload />
          </BrandCard>
        )}

        {/* PRD CORE WORKFLOW INDICATOR - Simplified for Alex persona */}
        {experienceConfig.level === 'basic' && (
          <BrandCard variant="elevated" className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-brand-primary">
            <h3 className="text-xl font-semibold text-brand-primary mb-6 flex items-center">
              <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Your Trading Setup Progress
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <BrandCard 
                variant={workflowStatus.dataImported ? 'success' : 'default'} 
                padding="md"
                className="transition-all duration-300"
              >
                <div className="flex items-center">
                  {workflowStatus.dataImported ? (
                    <div className="w-8 h-8 bg-trading-profit rounded-full flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-gray-900">Import Data</h4>
                    <p className="text-sm text-gray-600">Upload CSV files</p>
                  </div>
                </div>
              </BrandCard>
              
              <BrandCard 
                variant={workflowStatus.goalsSet ? 'success' : 'default'} 
                padding="md"
                className="transition-all duration-300"
              >
                <div className="flex items-center">
                  {workflowStatus.goalsSet ? (
                    <div className="w-8 h-8 bg-trading-profit rounded-full flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-gray-900">Set Goals</h4>
                    <p className="text-sm text-gray-600">Define risk tolerance</p>
                  </div>
                </div>
              </BrandCard>
              
              <BrandCard 
                variant={workflowStatus.riskConfigured ? 'success' : 'default'} 
                padding="md"
                className="transition-all duration-300"
              >
                <div className="flex items-center">
                  {workflowStatus.riskConfigured ? (
                    <div className="w-8 h-8 bg-trading-profit rounded-full flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white text-sm font-bold">3</span>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-gray-900">Configure Risk</h4>
                    <p className="text-sm text-gray-600">Set safety rules</p>
                  </div>
                </div>
              </BrandCard>
              
              <BrandCard variant="default" padding="md" className="bg-blue-50 border-brand-primary">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 002 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Next Step</h4>
                    <p className="text-sm text-brand-primary font-semibold">{workflowStatus.nextStep}</p>
                  </div>
                </div>
              </BrandCard>
            </div>
            
            {/* Quick Action Buttons for PRD workflows */}
            <div className="mt-8 flex flex-wrap gap-3">
              {!workflowStatus.dataImported && (
                <BrandButton
                  variant="primary"
                  onClick={() => setShowImportSection(true)}
                >
                  Import CSV Data
                </BrandButton>
              )}
              {workflowStatus.dataImported && !workflowStatus.goalsSet && (
                <BrandButton
                  variant="success"
                  onClick={() => window.location.href = '/goal-sizing'}
                >
                  Set Trading Goals
                </BrandButton>
              )}
              {workflowStatus.goalsSet && !workflowStatus.riskConfigured && (
                <BrandButton
                  variant="outline"
                  onClick={() => window.location.href = '/settings'}
                >
                  Configure Risk Rules
                </BrandButton>
              )}
            </div>
          </BrandCard>
        )}

        {/* Notification System */}
        <NotificationSystem 
          enabled={notificationsEnabled} 
          onToggle={(enabled: boolean) => {
            setNotificationsEnabled(enabled);
            setUserPreferences(prev => {
              const newPrefs = {
                ...prev,
                notifications: { ...prev.notifications, enabled }
              };
              localStorage.setItem(`dashboard-preferences-${userExperienceLevel}`, JSON.stringify(newPrefs));
              return newPrefs;
            });
          }}
        />

        {/* Dynamic Widget Rendering */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-500">Loading dashboard...</div>
          </div>
        ) : (
          <div>
            {sortedWidgets
              .filter(widgetKey => widgetKey in widgetComponents)
              .map(widgetKey => widgetComponents[widgetKey as keyof typeof widgetComponents])}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>
            Trading Helper Bot • Unified Positions Dashboard • 
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>

        {/* New Quick Action Buttons */}
        <div className="mt-8 text-center">
          <BrandButton
            variant="secondary"
            size="sm"
            onClick={() => navigate('/volatility-demo')}
          >
            Volatility Dashboard
          </BrandButton>
          <BrandButton
            variant="secondary"
            size="sm"
            onClick={() => navigate('/trade-screener')}
          >
            🔍 Trade Screener
          </BrandButton>
        </div>
      </div>
    </div>
  );
};

export default UnifiedDashboard; 
 
 








