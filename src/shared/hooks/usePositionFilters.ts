import { useState, useEffect, useMemo } from 'react';
import { FilterOptions } from '../components/Dashboard/PositionFilters';

interface Position {
  id: number;
  symbol: string;
  description?: string;
  quantity: number;
  price: number;
  marketValue: number;
  costBasis: number;
  gainDollar: number;
  gainPercent: number;
  date?: string;
  type?: 'stock' | 'option' | 'future';
  status?: 'open' | 'closed';
}

const DEFAULT_FILTERS: FilterOptions = {
  searchTerm: '',
  dateRange: {
    startDate: '',
    endDate: ''
  },
  positionType: 'all',
  status: 'all',
  minValue: null,
  maxValue: null,
  sortBy: 'symbol',
  sortDirection: 'asc'
};

const STORAGE_KEY = 'position-filters';

export const usePositionFilters = (positions: Position[]) => {
  const [filters, setFilters] = useState<FilterOptions>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT_FILTERS, ...JSON.parse(saved) } : DEFAULT_FILTERS;
    } catch {
      return DEFAULT_FILTERS;
    }
  });

  // Save filters to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch (error) {
      console.warn('Failed to save filters to localStorage:', error);
    }
  }, [filters]);

  // Filter and sort positions
  const filteredPositions = useMemo(() => {
    let filtered = [...positions];

    // Apply search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(position => 
        position.symbol.toLowerCase().includes(searchLower) ||
        (position.description && position.description.toLowerCase().includes(searchLower))
      );
    }

    // Apply date range filter
    if (filters.dateRange.startDate || filters.dateRange.endDate) {
      filtered = filtered.filter(position => {
        if (!position.date) return true; // Include positions without dates
        
        const positionDate = new Date(position.date);
        const startDate = filters.dateRange.startDate ? new Date(filters.dateRange.startDate) : null;
        const endDate = filters.dateRange.endDate ? new Date(filters.dateRange.endDate) : null;

        if (startDate && positionDate < startDate) return false;
        if (endDate && positionDate > endDate) return false;
        
        return true;
      });
    }

    // Apply position type filter
    if (filters.positionType !== 'all') {
      filtered = filtered.filter(position => {
        const type = position.type || 'stock'; // Default to stock if no type specified
        switch (filters.positionType) {
          case 'stocks':
            return type === 'stock';
          case 'options':
            return type === 'option';
          case 'futures':
            return type === 'future';
          default:
            return true;
        }
      });
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(position => {
        const gainLoss = position.marketValue - position.costBasis;
        
        switch (filters.status) {
          case 'open':
            return position.status === 'open' || !position.status; // Default to open if no status
          case 'closed':
            return position.status === 'closed';
          case 'profitable':
            return gainLoss > 0;
          case 'losing':
            return gainLoss < 0;
          default:
            return true;
        }
      });
    }

    // Apply value range filter
    if (filters.minValue !== null || filters.maxValue !== null) {
      filtered = filtered.filter(position => {
        const value = position.marketValue;
        if (filters.minValue !== null && value < filters.minValue) return false;
        if (filters.maxValue !== null && value > filters.maxValue) return false;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case 'value':
          comparison = a.marketValue - b.marketValue;
          break;
        case 'pnl':
          const aPnl = a.marketValue - a.costBasis;
          const bPnl = b.marketValue - b.costBasis;
          comparison = aPnl - bPnl;
          break;
        case 'date':
          const aDate = a.date ? new Date(a.date).getTime() : 0;
          const bDate = b.date ? new Date(b.date).getTime() : 0;
          comparison = aDate - bDate;
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
        default:
          comparison = 0;
      }
      
      return filters.sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [positions, filters]);

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const updateFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  return {
    filters,
    filteredPositions,
    updateFilters,
    resetFilters,
    totalCount: positions.length,
    filteredCount: filteredPositions.length
  };
}; 
 
 
 