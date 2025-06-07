import React, { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash-es/debounce';

export interface FilterOptions {
  searchTerm: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  positionType: 'all' | 'stocks' | 'options' | 'futures';
  status: 'all' | 'open' | 'closed' | 'profitable' | 'losing';
  minValue: number | null;
  maxValue: number | null;
  sortBy: 'symbol' | 'value' | 'pnl' | 'date' | 'quantity';
  sortDirection: 'asc' | 'desc';
}

interface PositionFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onReset: () => void;
  positionCount: number;
  filteredCount: number;
}

const PositionFilters: React.FC<PositionFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
  positionCount,
  filteredCount
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(filters.searchTerm);
  const [isExpanded, setIsExpanded] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      onFiltersChange({ ...filters, searchTerm: value });
    }, 300),
    [filters, onFiltersChange]
  );

  // Handle search input changes
  useEffect(() => {
    debouncedSearch(localSearchTerm);
    return () => {
      debouncedSearch.cancel();
    };
  }, [localSearchTerm, debouncedSearch]);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: value
      }
    });
  };

  const hasActiveFilters = () => {
    return (
      filters.searchTerm !== '' ||
      filters.dateRange.startDate !== '' ||
      filters.dateRange.endDate !== '' ||
      filters.positionType !== 'all' ||
      filters.status !== 'all' ||
      filters.minValue !== null ||
      filters.maxValue !== null
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {/* Header with search and toggle */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Search positions by symbol, description..."
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {filteredCount} of {positionCount} positions
          </span>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <svg className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Advanced Filters
          </button>

          {hasActiveFilters() && (
            <button
              onClick={onReset}
              className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Advanced filters - collapsible */}
      {isExpanded && (
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Date Range</label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={filters.dateRange.startDate}
                  onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Start date"
                />
                <input
                  type="date"
                  value={filters.dateRange.endDate}
                  onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="End date"
                />
              </div>
            </div>

            {/* Position Type */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Position Type</label>
              <select
                value={filters.positionType}
                onChange={(e) => handleFilterChange('positionType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Types</option>
                <option value="stocks">Stocks</option>
                <option value="options">Options</option>
                <option value="futures">Futures</option>
              </select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Positions</option>
                <option value="open">Open Only</option>
                <option value="closed">Closed Only</option>
                <option value="profitable">Profitable</option>
                <option value="losing">Losing</option>
              </select>
            </div>

            {/* Value Range */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Value Range ($)</label>
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Min value"
                  value={filters.minValue || ''}
                  onChange={(e) => handleFilterChange('minValue', e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <input
                  type="number"
                  placeholder="Max value"
                  value={filters.maxValue || ''}
                  onChange={(e) => handleFilterChange('maxValue', e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          {/* Sort Options */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="symbol">Symbol</option>
                  <option value="value">Market Value</option>
                  <option value="pnl">P&L</option>
                  <option value="date">Date</option>
                  <option value="quantity">Quantity</option>
                </select>
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Direction</label>
                <select
                  value={filters.sortDirection}
                  onChange={(e) => handleFilterChange('sortDirection', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PositionFilters; 
 
 
 