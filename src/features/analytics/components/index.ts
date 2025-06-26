// Analytics Components - Component 6: Progress Tracking & Analytics ($50)
// Complete analytics dashboard with performance charts, RPG progression, streak tracking, and win rate analysis

export { default as PerformanceCharts } from './PerformanceCharts';
export type { PerformanceChartsProps } from './PerformanceCharts';

export { default as XPProgressChart } from './XPProgressChart';
export type { XPProgressChartProps } from './XPProgressChart';

export { default as StreakVisualization } from './StreakVisualization';
export type { StreakVisualizationProps } from './StreakVisualization';

export { default as WinRateAnalysis } from './WinRateAnalysis';
export type { WinRateAnalysisProps } from './WinRateAnalysis';

export { default as ChallengeAnalyticsDashboard } from './ChallengeAnalyticsDashboard';
export type { ChallengeAnalyticsDashboardProps } from './ChallengeAnalyticsDashboard';

// Re-export analytics service types for convenience
export type {
  PerformanceMetrics,
  WinRateAnalysis,
  RPGProgress,
  StreakData,
  UserActivity,
  DateRange
} from '../../../services/AnalyticsDataService';