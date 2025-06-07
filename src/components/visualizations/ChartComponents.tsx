import React, { lazy, Suspense, ComponentProps } from 'react';

// Loading component for charts
const ChartLoading = () => (
  <div className="flex items-center justify-center min-h-[300px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

// Lazy load Recharts components with vendor-charts chunk
const LineChart = lazy(() => import(
  /* webpackChunkName: "vendors-charts" */
  'recharts'
).then(module => ({ default: module.LineChart })));
const BarChart = lazy(() => import(
  /* webpackChunkName: "vendors-charts" */
  'recharts'
).then(module => ({ default: module.BarChart })));
const AreaChart = lazy(() => import(
  /* webpackChunkName: "vendors-charts" */
  'recharts'
).then(module => ({ default: module.AreaChart })));

// Type imports for chart props
type ChartProps = {
  data: any[];
  width?: number;
  height?: number;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  children?: React.ReactNode;
  [key: string]: any;
};

// Wrapper components with Suspense
export const LineChartWrapper: React.FC<ChartProps> = (props) => (
  <Suspense fallback={<ChartLoading />}>
    <LineChart {...props} />
  </Suspense>
);

export const BarChartWrapper: React.FC<ChartProps> = (props) => (
  <Suspense fallback={<ChartLoading />}>
    <BarChart {...props} />
  </Suspense>
);

export const AreaChartWrapper: React.FC<ChartProps> = (props) => (
  <Suspense fallback={<ChartLoading />}>
    <AreaChart {...props} />
  </Suspense>
); 