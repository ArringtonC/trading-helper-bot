import React, { useState, useEffect } from 'react';
import { format, subDays, startOfYear, subYears } from 'date-fns';
import { formatDateForDisplay, safeParseDate } from '../utils/dateUtils';
import { OptionTrade } from '../types/options';

interface EnhancedFilterControlsProps {
  trades: OptionTrade[];
  onFilterChange: (filters: {
    dateRange: [Date, Date] | null;
    strategies: string[];
    expirations: string[];
    groupBy: 'strategy' | 'expiration' | 'none';
  }) => void;
  className?: string;
}

const EnhancedFilterControls: React.FC<EnhancedFilterControlsProps> = ({
  trades,
  onFilterChange,
  className = ''
}) => {
  // Extract unique strategies and expirations
  const [strategies, setStrategies] = useState<string[]>([]);
  const [expirations, setExpirations] = useState<string[]>([]);
  
  // Filter state
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [selectedExpirations, setSelectedExpirations] = useState<string[]>([]);
  const [groupBy, setGroupBy] = useState<'strategy' | 'expiration' | 'none'>('strategy');
  const [activeDatePreset, setActiveDatePreset] = useState<string | null>(null);

  // Extract unique values from trades
  useEffect(() => {
    if (!trades || trades.length === 0) return;

    // Get unique strategies
    const uniqueStrategies = Array.from(new Set(
      trades.map(trade => trade.strategy || 'Unknown')
    )).sort();
    
    setStrategies(uniqueStrategies);

    // Get unique expiration months
    const uniqueExpirations = Array.from(new Set(
      trades.map(trade => {
        return formatDateForDisplay(safeParseDate(trade.expiry), 'MMM yyyy');
      })
    )).sort();
    
    setExpirations(uniqueExpirations);
  }, [trades]);

  // Apply filters when they change
  useEffect(() => {
    onFilterChange({
      dateRange,
      strategies: selectedStrategies,
      expirations: selectedExpirations,
      groupBy
    });
  }, [dateRange, selectedStrategies, selectedExpirations, groupBy, onFilterChange]);

  // Date preset handler
  const handleDatePreset = (preset: string) => {
    const today = new Date();
    let start: Date;
    let end: Date = today;

    switch (preset) {
      case '7D':
        start = subDays(today, 7);
        break;
      case '30D':
        start = subDays(today, 30);
        break;
      case '90D':
        start = subDays(today, 90);
        break;
      case 'YTD':
        start = startOfYear(today);
        break;
      case '1Y':
        start = subYears(today, 1);
        break;
      case 'ALL':
        setDateRange(null);
        setActiveDatePreset(preset);
        return;
      default:
        return;
    }

    setDateRange([start, end]);
    setActiveDatePreset(preset);
  };

  // Handle custom date selection
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>, isStartDate: boolean) => {
    const newDate = new Date(event.target.value);
    
    if (isStartDate && dateRange) {
      setDateRange([newDate, dateRange[1]]);
    } else if (!isStartDate && dateRange) {
      setDateRange([dateRange[0], newDate]);
    } else {
      const today = new Date();
      setDateRange(isStartDate ? [newDate, today] : [today, newDate]);
    }
    
    setActiveDatePreset(null);
  };

  // Toggle strategy selection
  const toggleStrategy = (strategy: string) => {
    setSelectedStrategies(prev => {
      return prev.includes(strategy)
        ? prev.filter(s => s !== strategy)
        : [...prev, strategy];
    });
  };

  // Toggle expiration selection
  const toggleExpiration = (expiration: string) => {
    setSelectedExpirations(prev => {
      return prev.includes(expiration)
        ? prev.filter(e => e !== expiration)
        : [...prev, expiration];
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setDateRange(null);
    setSelectedStrategies([]);
    setSelectedExpirations([]);
    setActiveDatePreset(null);
  };

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4">
        <h3 className="text-lg font-semibold mb-2 lg:mb-0">Filters & Grouping</h3>
        <div className="flex items-center space-x-2">
          <button
            className={`px-3 py-1 rounded text-sm font-medium ${
              groupBy === 'strategy' 
                ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            onClick={() => setGroupBy('strategy')}
          >
            By Strategy
          </button>
          <button
            className={`px-3 py-1 rounded text-sm font-medium ${
              groupBy === 'expiration' 
                ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            onClick={() => setGroupBy('expiration')}
          >
            By Expiration
          </button>
          <button
            className={`px-3 py-1 rounded text-sm font-medium ${
              groupBy === 'none' 
                ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            onClick={() => setGroupBy('none')}
          >
            All Trades
          </button>
        </div>
      </div>

      {/* Date Range Selection */}
      <div className="mb-4">
        <h4 className="font-medium mb-2 text-sm text-gray-600">Time Period</h4>
        <div className="flex flex-wrap gap-2 mb-3">
          {['7D', '30D', '90D', 'YTD', '1Y', 'ALL'].map(preset => (
            <button
              key={preset}
              className={`px-3 py-1 rounded text-xs font-medium ${
                activeDatePreset === preset 
                  ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              onClick={() => handleDatePreset(preset)}
            >
              {preset}
            </button>
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm mb-1 text-gray-600">Start Date</label>
            <input
              type="date"
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              value={dateRange ? format(dateRange[0], 'yyyy-MM-dd') : ''}
              onChange={(e) => handleDateChange(e, true)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm mb-1 text-gray-600">End Date</label>
            <input
              type="date"
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              value={dateRange ? format(dateRange[1], 'yyyy-MM-dd') : ''}
              onChange={(e) => handleDateChange(e, false)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strategy Selection */}
        <div>
          <h4 className="font-medium mb-2 text-sm text-gray-600">Strategies</h4>
          <div className="max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
            {strategies.length > 0 ? (
              <div className="space-y-1">
                {strategies.map(strategy => (
                  <div key={strategy} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`strategy-${strategy}`}
                      checked={selectedStrategies.includes(strategy)}
                      onChange={() => toggleStrategy(strategy)}
                      className="mr-2"
                    />
                    <label htmlFor={`strategy-${strategy}`} className="text-sm">
                      {strategy}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 p-2">No strategies available</p>
            )}
          </div>
        </div>

        {/* Expiration Selection */}
        <div>
          <h4 className="font-medium mb-2 text-sm text-gray-600">Expirations</h4>
          <div className="max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
            {expirations.length > 0 ? (
              <div className="space-y-1">
                {expirations.map(expiration => (
                  <div key={expiration} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`expiration-${expiration}`}
                      checked={selectedExpirations.includes(expiration)}
                      onChange={() => toggleExpiration(expiration)}
                      className="mr-2"
                    />
                    <label htmlFor={`expiration-${expiration}`} className="text-sm">
                      {expiration}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 p-2">No expirations available</p>
            )}
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(selectedStrategies.length > 0 || selectedExpirations.length > 0 || dateRange) && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium text-sm text-gray-600">Active Filters:</h4>
            <button
              onClick={clearFilters}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {dateRange && (
              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                {format(dateRange[0], 'MMM d, yyyy')} - {format(dateRange[1], 'MMM d, yyyy')}
              </span>
            )}
            
            {selectedStrategies.map(strategy => (
              <span 
                key={strategy} 
                className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs flex items-center"
              >
                {strategy}
                <button 
                  className="ml-1 text-green-500 hover:text-green-700" 
                  onClick={() => toggleStrategy(strategy)}
                >
                  ×
                </button>
              </span>
            ))}
            
            {selectedExpirations.map(expiration => (
              <span 
                key={expiration} 
                className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs flex items-center"
              >
                {expiration}
                <button 
                  className="ml-1 text-purple-500 hover:text-purple-700" 
                  onClick={() => toggleExpiration(expiration)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedFilterControls; 