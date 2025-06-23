/**
 * Volatility Dashboard Demo Page - Enhanced with Real Data Integration
 * 
 * Features:
 * - Real Yahoo Finance API integration
 * - Task 21.3 Multi-Indicator Calculation Engine
 * - Portfolio analysis with correlation matrices
 * - Live volatility calculations (IV Percentile, ATR, Bollinger Bands, VIX)
 * - Market regime detection
 * - Data source fallback (API → CSV → Mock)
 */

import React from 'react';
import VolatilityDashboardDemo from '../../../features/risk-management/components/VolatilityDashboard/VolatilityDashboardDemo';

const VolatilityDashboardDemoPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                🧪 Volatility Analysis Demo - Task 21.3
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Multi-factor volatility visualization with real market data integration
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✅ Task 21.3 Complete
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <VolatilityDashboardDemo />
      </div>
    </div>
  );
};

export default VolatilityDashboardDemoPage; 