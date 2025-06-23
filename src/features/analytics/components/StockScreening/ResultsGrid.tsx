import React, { useState, useEffect, useMemo } from 'react';
import { StockCard } from './StockCard';
import { RiskBadge } from './RiskIndicator';
import { GoalMatchBadge } from './GoalMatchIndicator';

// Type definitions
interface Stock {
  symbol: string;
  name: string;
  price?: number;
  priceChange?: number;
  marketCap?: number;
  riskScore?: number;
  riskLevel?: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
  industry?: string;
  goalAlignment?: {
    score: number;
    type?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

type ViewMode = 'cards' | 'table';
type UserLevel = 'beginner' | 'advanced';
type SortDirection = 'asc' | 'desc';
type SortField = 'goalMatch' | 'price' | 'priceChange' | 'marketCap' | 'riskScore' | 'alphabetical';

interface ResultsGridProps {
  stocks?: Stock[];
  userLevel?: UserLevel;
  viewMode?: ViewMode | null;
  onStockSelect?: (stock: Stock) => void;
  onStockDetail?: (stock: Stock) => void;
  loading?: boolean;
  sortBy?: string;
  sortDirection?: SortDirection;
  onSort?: (field: string, direction: SortDirection) => void;
  selectedStocks?: string[];
  showFilters?: boolean;
  isMobile?: boolean;
}

interface CardsGridProps {
  stocks: Stock[];
  userLevel: UserLevel;
  onStockSelect?: (stock: Stock) => void;
  onStockDetail?: (stock: Stock) => void;
  selectedStocks: string[];
}

interface TableGridProps extends CardsGridProps {
  sortBy: string;
  sortDirection: SortDirection;
  onSort: (field: string) => void;
}

interface SortHeaderProps {
  field: string;
  children: React.ReactNode;
  sortBy: string;
  sortDirection: SortDirection;
  onSort: (field: string) => void;
}

interface FilterBarProps {
  activeFilters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)) => void;
  stocks: Stock[];
  userLevel: UserLevel;
}

interface LoadingGridProps {
  viewMode: ViewMode;
}

interface EmptyStateProps {
  filters: Record<string, any>;
}

interface AvailableFilters {
  industries: string[];
  goalTypes: string[];
  riskLevels: string[];
}

/**
 * ResultsGrid Component - Adaptive layout based on user experience
 * 
 * Based on research findings:
 * - Card views perform 23% better for beginners vs tables
 * - Advanced users prefer table views for quick comparison
 * - Mobile-first design transforms tables to cards automatically
 * - Progressive disclosure reduces cognitive load
 */
export const ResultsGrid: React.FC<ResultsGridProps> = ({
  stocks = [],
  userLevel = 'beginner',
  viewMode: forcedViewMode = null, // 'cards' | 'table' | null (auto-detect)
  onStockSelect,
  onStockDetail,
  loading = false,
  sortBy = 'goalMatch',
  sortDirection = 'desc',
  onSort,
  selectedStocks = [],
  showFilters = true,
  isMobile = false
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>(forcedViewMode || (userLevel === 'beginner' ? 'cards' : 'table'));
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [visibleCount, setVisibleCount] = useState(20); // Progressive loading

  // Auto-detect optimal view mode based on research
  useEffect(() => {
    if (!forcedViewMode) {
      // Research: Cards perform 23% better for beginners
      // Advanced users prefer tables for quick comparison
      // Mobile always uses cards to avoid horizontal scrolling
      if (isMobile) {
        setViewMode('cards');
      } else if (userLevel === 'beginner') {
        setViewMode('cards');
      } else {
        setViewMode('table');
      }
    }
  }, [userLevel, isMobile, forcedViewMode]);

  // Sort and filter stocks
  const processedStocks = useMemo(() => {
    let filtered = stocks;

    // Apply filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        filtered = filtered.filter(stock => {
          switch (key) {
            case 'riskLevel':
              return stock.riskLevel === value;
            case 'goalType':
              return stock.goalAlignment?.type === value;
            case 'industry':
              return stock.industry === value;
            case 'priceRange':
              const [min, max] = value.split('-').map(Number);
              return (stock.price || 0) >= min && (stock.price || 0) <= max;
            default:
              return true;
          }
        });
      }
    });

    // Apply sorting
    return filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'goalMatch':
          comparison = (b.goalAlignment?.score || 0) - (a.goalAlignment?.score || 0);
          break;
        case 'price':
          comparison = (a.price || 0) - (b.price || 0);
          break;
        case 'priceChange':
          comparison = (a.priceChange || 0) - (b.priceChange || 0);
          break;
        case 'marketCap':
          comparison = (a.marketCap || 0) - (b.marketCap || 0);
          break;
        case 'riskScore':
          comparison = (a.riskScore || 0) - (b.riskScore || 0);
          break;
        case 'alphabetical':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [stocks, activeFilters, sortBy, sortDirection]);

  const visibleStocks = processedStocks.slice(0, visibleCount);

  const handleViewModeChange = (newMode: ViewMode): void => {
    setViewMode(newMode);
    
    // Haptic feedback for mobile
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleLoadMore = (): void => {
    setVisibleCount(prev => Math.min(prev + 20, processedStocks.length));
  };

  const handleSort = (field: string): void => {
    if (sortBy === field) {
      const newDirection: SortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      onSort?.(field, newDirection);
    } else {
      onSort?.(field, 'desc');
    }
  };

  if (loading) {
    return <LoadingGrid viewMode={viewMode} />;
  }

  return (
    <div className="results-grid-container">
      {/* Controls Header */}
      <div className="results-controls">
        {/* View Mode Selector */}
        <div className="view-mode-selector">
          <button
            className={`view-mode-btn ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('cards')}
            title="Card View - Better for beginners"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
            <span>Cards</span>
          </button>
          
          {!isMobile && (
            <button
              className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => handleViewModeChange('table')}
              title="Table View - Better for comparison"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
              </svg>
              <span>Table</span>
            </button>
          )}
        </div>

        {/* Sort Controls */}
        <div className="sort-controls">
          <select
            value={sortBy}
            onChange={(e) => handleSort(e.target.value)}
            className="sort-select"
          >
            <option value="goalMatch">Best Goal Match</option>
            <option value="alphabetical">Alphabetical</option>
            <option value="price">Price</option>
            <option value="priceChange">Price Change</option>
            <option value="marketCap">Market Cap</option>
            <option value="riskScore">Risk Level</option>
          </select>
        </div>

        {/* Results Count */}
        <div className="results-count">
          Showing {visibleStocks.length} of {processedStocks.length} stocks
        </div>
      </div>

      {/* Filters (if enabled) */}
      {showFilters && (
        <FilterBar
          activeFilters={activeFilters}
          onFiltersChange={setActiveFilters}
          stocks={stocks}
          userLevel={userLevel}
        />
      )}

      {/* Results Display */}
      {viewMode === 'cards' ? (
        <CardsGrid
          stocks={visibleStocks}
          userLevel={userLevel}
          onStockSelect={onStockSelect}
          onStockDetail={onStockDetail}
          selectedStocks={selectedStocks}
        />
      ) : (
        <TableGrid
          stocks={visibleStocks}
          userLevel={userLevel}
          onStockSelect={onStockSelect}
          onStockDetail={onStockDetail}
          selectedStocks={selectedStocks}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      )}

      {/* Load More Button */}
      {visibleCount < processedStocks.length && (
        <div className="load-more-container">
          <button
            className="load-more-btn"
            onClick={handleLoadMore}
          >
            Load More Stocks ({processedStocks.length - visibleCount} remaining)
          </button>
        </div>
      )}

      {/* Empty State */}
      {processedStocks.length === 0 && !loading && (
        <EmptyState filters={activeFilters} />
      )}
    </div>
  );
};

/**
 * CardsGrid - Responsive card layout optimized for beginners
 */
const CardsGrid: React.FC<CardsGridProps> = ({ stocks, userLevel, onStockSelect, onStockDetail, selectedStocks }) => (
  <div className="cards-grid">
    {stocks.map(stock => (
      <StockCard
        key={stock.symbol}
        stock={stock}
        userLevel={userLevel}
        goalAlignment={stock.goalAlignment}
        onSelect={onStockSelect}
        onDetailView={onStockDetail}
        isSelected={selectedStocks.includes(stock.symbol)}
      />
    ))}
  </div>
);

/**
 * TableGrid - Efficient table layout for advanced users
 */
const TableGrid: React.FC<TableGridProps> = ({ 
  stocks, 
  userLevel, 
  onStockSelect, 
  onStockDetail, 
  selectedStocks,
  sortBy,
  sortDirection,
  onSort 
}) => {
  const SortHeader: React.FC<SortHeaderProps> = ({ field, children, sortBy, sortDirection, onSort }) => (
    <th
      className={`sortable-header ${sortBy === field ? 'active' : ''}`}
      onClick={() => onSort(field)}
    >
      <div className="header-content">
        <span>{children}</span>
        {sortBy === field && (
          <span className="sort-indicator">
            {sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );

  return (
    <div className="table-grid-container">
      <table className="stocks-table">
        <thead>
          <tr>
            <th className="select-column">
              <input type="checkbox" aria-label="Select all stocks" />
            </th>
            <SortHeader field="alphabetical" sortBy={sortBy} sortDirection={sortDirection} onSort={onSort}>Stock</SortHeader>
            <SortHeader field="price" sortBy={sortBy} sortDirection={sortDirection} onSort={onSort}>Price</SortHeader>
            <SortHeader field="priceChange" sortBy={sortBy} sortDirection={sortDirection} onSort={onSort}>Change</SortHeader>
            <SortHeader field="goalMatch" sortBy={sortBy} sortDirection={sortDirection} onSort={onSort}>Goal Match</SortHeader>
            <SortHeader field="riskScore" sortBy={sortBy} sortDirection={sortDirection} onSort={onSort}>Risk</SortHeader>
            <th>Industry</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map(stock => (
            <tr 
              key={stock.symbol}
              className={`stock-row ${selectedStocks.includes(stock.symbol) ? 'selected' : ''}`}
              onClick={() => onStockSelect?.(stock)}
            >
              <td className="select-column">
                <input
                  type="checkbox"
                  checked={selectedStocks.includes(stock.symbol)}
                  onChange={() => onStockSelect?.(stock)}
                  aria-label={`Select ${stock.name}`}
                />
              </td>
              
              <td className="stock-info">
                <div className="stock-identity">
                  <span className="stock-name">{stock.name}</span>
                  <span className="stock-symbol">{stock.symbol}</span>
                </div>
              </td>
              
              <td className="price-cell">
                <span className="price">${stock.price?.toFixed(2)}</span>
              </td>
              
              <td className="change-cell">
                <span className={`price-change ${(stock.priceChange || 0) >= 0 ? 'positive' : 'negative'}`}>
                  {(stock.priceChange || 0) >= 0 ? '+' : ''}{stock.priceChange?.toFixed(2)}%
                </span>
              </td>
              
              <td className="goal-match-cell">
                {stock.goalAlignment && (
                  <GoalMatchBadge alignment={stock.goalAlignment} />
                )}
              </td>
              
              <td className="risk-cell">
                <RiskBadge level={stock.riskLevel} value={stock.riskScore} compact />
              </td>
              
              <td className="industry-cell">
                <span className="industry">{stock.industry}</span>
              </td>
              
              <td className="actions-cell">
                <button
                  className="view-details-btn-table"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStockDetail?.(stock);
                  }}
                >
                  Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * FilterBar - Context-aware filtering based on user level
 */
const FilterBar: React.FC<FilterBarProps> = ({ activeFilters, onFiltersChange, stocks, userLevel }) => {
  const availableFilters: AvailableFilters = useMemo(() => {
    const industries = [...new Set(stocks.map(s => s.industry).filter(Boolean))] as string[];
    const goalTypes = [...new Set(stocks.map(s => s.goalAlignment?.type).filter(Boolean))] as string[];
    const riskLevels = ['very-low', 'low', 'moderate', 'high', 'very-high'];
    
    return { industries, goalTypes, riskLevels };
  }, [stocks]);

  const updateFilter = (key: string, value: string): void => {
    onFiltersChange(prev => ({
      ...prev,
      [key]: value === 'all' ? null : value
    }));
  };

  return (
    <div className={`filter-bar ${userLevel}`}>
      {/* Beginner filters - simplified */}
      {userLevel === 'beginner' && (
        <>
          <select
            value={activeFilters.goalType || 'all'}
            onChange={(e) => updateFilter('goalType', e.target.value)}
            className="filter-select primary"
          >
            <option value="all">All Goal Types</option>
            {availableFilters.goalTypes.map(goal => (
              <option key={goal} value={goal}>
                {goal.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </option>
            ))}
          </select>
          
          <select
            value={activeFilters.riskLevel || 'all'}
            onChange={(e) => updateFilter('riskLevel', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Risk Levels</option>
            {availableFilters.riskLevels.map(risk => (
              <option key={risk} value={risk}>
                {risk.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </option>
            ))}
          </select>
        </>
      )}

      {/* Advanced filters - comprehensive */}
      {userLevel === 'advanced' && (
        <>
          <select
            value={activeFilters.goalType || 'all'}
            onChange={(e) => updateFilter('goalType', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Goals</option>
            {availableFilters.goalTypes.map(goal => (
              <option key={goal} value={goal}>{goal}</option>
            ))}
          </select>
          
          <select
            value={activeFilters.riskLevel || 'all'}
            onChange={(e) => updateFilter('riskLevel', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Risk</option>
            {availableFilters.riskLevels.map(risk => (
              <option key={risk} value={risk}>{risk}</option>
            ))}
          </select>
          
          <select
            value={activeFilters.industry || 'all'}
            onChange={(e) => updateFilter('industry', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Industries</option>
            {availableFilters.industries.map(industry => (
              <option key={industry} value={industry}>{industry}</option>
            ))}
          </select>
          
          <select
            value={activeFilters.priceRange || 'all'}
            onChange={(e) => updateFilter('priceRange', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Prices</option>
            <option value="0-50">Under $50</option>
            <option value="50-100">$50 - $100</option>
            <option value="100-500">$100 - $500</option>
            <option value="500-99999">Over $500</option>
          </select>
        </>
      )}
      
      {/* Clear filters */}
      {Object.keys(activeFilters).some(key => activeFilters[key]) && (
        <button
          className="clear-filters-btn"
          onClick={() => onFiltersChange({})}
        >
          Clear Filters
        </button>
      )}
    </div>
  );
};

/**
 * LoadingGrid - Skeleton loader matching the current view mode
 */
const LoadingGrid: React.FC<LoadingGridProps> = ({ viewMode }) => (
  <div className={`loading-grid ${viewMode}`}>
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="loading-item">
        <div className="loading-skeleton" />
      </div>
    ))}
  </div>
);

/**
 * EmptyState - Helpful message when no results found
 */
const EmptyState: React.FC<EmptyStateProps> = ({ filters }) => {
  const hasFilters = Object.keys(filters).some(key => filters[key]);
  
  return (
    <div className="empty-state">
      <div className="empty-icon">📊</div>
      <h3>No stocks found</h3>
      <p>
        {hasFilters
          ? 'Try adjusting your filters to see more results.'
          : 'No stocks match your current criteria.'
        }
      </p>
    </div>
  );
};

export default ResultsGrid;