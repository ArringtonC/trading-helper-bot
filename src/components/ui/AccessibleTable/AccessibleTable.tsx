import React, { useState, useMemo, useRef, useCallback } from 'react';
import { ChevronUpIcon, ChevronDownIcon, FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export interface TableColumn<T = any> {
  key: string;
  header: string;
  accessor: keyof T | ((item: T) => any);
  sortable?: boolean;
  filterable?: boolean;
  filterType?: 'text' | 'select' | 'number' | 'date';
  className?: string;
  headerClassName?: string;
  render?: (value: any, item: T, index: number) => React.ReactNode;
  width?: string;
}

export interface AccessibleTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  caption?: string;
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  onRowClick?: (item: T, index: number) => void;
  rowClassName?: (item: T, index: number) => string;
  'aria-label'?: string;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  column: string | null;
  direction: SortDirection;
}

interface FilterState {
  [key: string]: string;
}

export function AccessibleTable<T = any>({
  data,
  columns,
  caption,
  className = '',
  loading = false,
  emptyMessage = 'No data available.',
  pageSize,
  searchable = true,
  searchPlaceholder = 'Search...',
  onRowClick,
  rowClassName,
  'aria-label': ariaLabel
}: AccessibleTableProps<T>) {
  const [sortState, setSortState] = useState<SortState>({ column: null, direction: null });
  const [filters, setFilters] = useState<FilterState>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  
  const tableRef = useRef<HTMLTableElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Helper function to get cell value
  const getCellValue = useCallback((item: T, column: TableColumn<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(item);
    }
    return item[column.accessor as keyof T];
  }, []);

  // Filtering logic
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(item =>
        columns.some(column => {
          const value = getCellValue(item, column);
          return String(value).toLowerCase().includes(searchLower);
        })
      );
    }

    // Apply column filters
    Object.entries(filters).forEach(([columnKey, filterValue]) => {
      if (filterValue) {
        const column = columns.find(col => col.key === columnKey);
        if (column) {
          result = result.filter(item => {
            const value = getCellValue(item, column);
            const stringValue = String(value).toLowerCase();
            return stringValue.includes(filterValue.toLowerCase());
          });
        }
      }
    });

    return result;
  }, [data, searchTerm, filters, columns, getCellValue]);

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sortState.column || !sortState.direction) {
      return filteredData;
    }

    const column = columns.find(col => col.key === sortState.column);
    if (!column) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = getCellValue(a, column);
      const bValue = getCellValue(b, column);

      if (aValue === bValue) return 0;

      let comparison = 0;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortState.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortState, columns, getCellValue]);

  // Pagination logic
  const paginatedData = useMemo(() => {
    if (!pageSize) return sortedData;
    
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = pageSize ? Math.ceil(sortedData.length / pageSize) : 1;

  // Handle sorting
  const handleSort = useCallback((columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    setSortState(prevState => {
      if (prevState.column === columnKey) {
        // Cycle through: asc -> desc -> null
        const newDirection: SortDirection = 
          prevState.direction === 'asc' ? 'desc' : 
          prevState.direction === 'desc' ? null : 'asc';
        return { column: newDirection ? columnKey : null, direction: newDirection };
      } else {
        return { column: columnKey, direction: 'asc' };
      }
    });
  }, [columns]);

  // Handle filter changes
  const handleFilterChange = useCallback((columnKey: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [columnKey]: value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  }, []);

  // Handle search
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowFilters(false);
      searchInputRef.current?.blur();
    }
  }, []);

  // Get unique filter options for select filters
  const getFilterOptions = useCallback((column: TableColumn<T>) => {
    const values = data.map(item => getCellValue(item, column))
      .filter((value, index, self) => value && self.indexOf(value) === index)
      .sort();
    return values;
  }, [data, getCellValue]);

  const renderFilterInput = useCallback((column: TableColumn<T>) => {
    if (!column.filterable) return null;

    const filterValue = filters[column.key] || '';

    if (column.filterType === 'select') {
      const options = getFilterOptions(column);
      return (
        <select
          value={filterValue}
          onChange={(e) => handleFilterChange(column.key, e.target.value)}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={`Filter ${column.header}`}
        >
          <option value="">All</option>
          {options.map((option, index) => (
            <option key={index} value={String(option)}>
              {String(option)}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={column.filterType || 'text'}
        value={filterValue}
        onChange={(e) => handleFilterChange(column.key, e.target.value)}
        placeholder={`Filter ${column.header.toLowerCase()}...`}
        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={`Filter ${column.header}`}
      />
    );
  }, [filters, handleFilterChange, getFilterOptions]);

  const renderSortIcon = useCallback((column: TableColumn<T>) => {
    if (!column.sortable) return null;

    const isActive = sortState.column === column.key;
    const direction = isActive ? sortState.direction : null;

    return (
      <span className="ml-1 inline-flex flex-col">
        <ChevronUpIcon 
          className={`h-3 w-3 ${isActive && direction === 'asc' ? 'text-blue-600' : 'text-gray-400'}`}
        />
        <ChevronDownIcon 
          className={`h-3 w-3 -mt-1 ${isActive && direction === 'desc' ? 'text-blue-600' : 'text-gray-400'}`}
        />
      </span>
    );
  }, [sortState]);

  return (
    <div className={`w-full ${className}`} onKeyDown={handleKeyDown}>
      {/* Search and Filter Controls */}
      <div className="mb-4 space-y-3">
        {searchable && (
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Search table data"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Toggle column filters"
              aria-expanded={showFilters}
            >
              <FunnelIcon className="h-4 w-4 mr-1" />
              Filters
            </button>
            {(Object.values(filters).some(v => v) || searchTerm) && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Clear all filters"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* Column Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg">
            {columns.filter(col => col.filterable).map(column => (
              <div key={column.key} className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">
                  {column.header}
                </label>
                {renderFilterInput(column)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg">
          <table
            ref={tableRef}
            className="min-w-full divide-y divide-gray-300"
            role="table"
            aria-label={ariaLabel || caption || 'Data table'}
          >
            {caption && (
              <caption className="sr-only">
                {caption}
              </caption>
            )}
            
            <thead className="bg-gray-50">
              <tr role="row">
                {columns.map(column => (
                  <th
                    key={column.key}
                    scope="col"
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      column.sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''
                    } ${column.headerClassName || ''}`}
                    style={column.width ? { width: column.width } : undefined}
                    onClick={column.sortable ? () => handleSort(column.key) : undefined}
                    onKeyDown={column.sortable ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSort(column.key);
                      }
                    } : undefined}
                    tabIndex={column.sortable ? 0 : -1}
                    role="columnheader"
                    aria-sort={
                      sortState.column === column.key
                        ? sortState.direction === 'asc' 
                          ? 'ascending' 
                          : sortState.direction === 'desc'
                          ? 'descending'
                          : 'none'
                        : column.sortable 
                        ? 'none' 
                        : undefined
                    }
                  >
                    <div className="flex items-center">
                      <span>{column.header}</span>
                      {renderSortIcon(column)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.length === 0 ? (
                <tr role="row">
                  <td
                    colSpan={columns.length}
                    className="px-6 py-8 text-center text-gray-500"
                    role="cell"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => {
                  const actualIndex = pageSize ? (currentPage - 1) * pageSize + index : index;
                  const rowClassNames = `hover:bg-gray-50 ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${rowClassName ? rowClassName(item, actualIndex) : ''}`;

                  return (
                    <tr
                      key={actualIndex}
                      role="row"
                      className={rowClassNames}
                      onClick={onRowClick ? () => onRowClick(item, actualIndex) : undefined}
                      onKeyDown={onRowClick ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRowClick(item, actualIndex);
                        }
                      } : undefined}
                      tabIndex={onRowClick ? 0 : -1}
                    >
                      {columns.map(column => {
                        const value = getCellValue(item, column);
                        const cellContent = column.render 
                          ? column.render(value, item, actualIndex)
                          : String(value || '');

                        return (
                          <td
                            key={column.key}
                            className={`px-6 py-4 whitespace-nowrap text-sm ${column.className || ''}`}
                            role="cell"
                          >
                            {cellContent}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pageSize && totalPages > 1 && !loading && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Previous page"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccessibleTable; 
 
 
 