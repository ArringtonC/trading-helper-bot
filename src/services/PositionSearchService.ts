import debounce from 'lodash-es/debounce';

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

interface SearchSuggestion {
  type: 'symbol' | 'description' | 'recent';
  value: string;
  label: string;
  count?: number;
}

class PositionSearchService {
  private positions: Position[] = [];
  private searchHistory: string[] = [];
  private readonly HISTORY_KEY = 'position-search-history';
  private readonly MAX_HISTORY = 10;
  private readonly MAX_SUGGESTIONS = 8;

  constructor() {
    this.loadSearchHistory();
  }

  /**
   * Set the positions data for search operations
   */
  setPositions(positions: Position[]): void {
    this.positions = positions;
  }

  /**
   * Get search suggestions based on input
   */
  getSuggestions(query: string): SearchSuggestion[] {
    if (!query || query.length < 1) {
      return this.getRecentSearches();
    }

    const suggestions: SearchSuggestion[] = [];
    const queryLower = query.toLowerCase();
    const seen = new Set<string>();

    // Symbol suggestions
    this.positions.forEach(position => {
      const symbol = position.symbol.toLowerCase();
      if (symbol.includes(queryLower) && !seen.has(position.symbol)) {
        seen.add(position.symbol);
        suggestions.push({
          type: 'symbol',
          value: position.symbol,
          label: position.symbol,
          count: this.positions.filter(p => p.symbol === position.symbol).length
        });
      }
    });

    // Description suggestions
    this.positions.forEach(position => {
      if (position.description) {
        const description = position.description.toLowerCase();
        if (description.includes(queryLower) && !seen.has(position.description)) {
          seen.add(position.description);
          suggestions.push({
            type: 'description',
            value: position.description,
            label: position.description,
            count: this.positions.filter(p => p.description === position.description).length
          });
        }
      }
    });

    // Sort by relevance (exact matches first, then by count)
    suggestions.sort((a, b) => {
      const aExact = a.value.toLowerCase() === queryLower;
      const bExact = b.value.toLowerCase() === queryLower;
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      const aStarts = a.value.toLowerCase().startsWith(queryLower);
      const bStarts = b.value.toLowerCase().startsWith(queryLower);
      
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      return (b.count || 0) - (a.count || 0);
    });

    return suggestions.slice(0, this.MAX_SUGGESTIONS);
  }

  /**
   * Get recent search suggestions
   */
  private getRecentSearches(): SearchSuggestion[] {
    return this.searchHistory.map(term => ({
      type: 'recent' as const,
      value: term,
      label: term
    }));
  }

  /**
   * Add a search term to history
   */
  addToHistory(term: string): void {
    if (!term || term.trim().length === 0) return;

    const trimmedTerm = term.trim();
    
    // Remove if already exists
    this.searchHistory = this.searchHistory.filter(t => t !== trimmedTerm);
    
    // Add to beginning
    this.searchHistory.unshift(trimmedTerm);
    
    // Limit size
    this.searchHistory = this.searchHistory.slice(0, this.MAX_HISTORY);
    
    this.saveSearchHistory();
  }

  /**
   * Clear search history
   */
  clearHistory(): void {
    this.searchHistory = [];
    this.saveSearchHistory();
  }

  /**
   * Perform a full-text search across positions
   */
  search(query: string): Position[] {
    if (!query || query.trim().length === 0) {
      return this.positions;
    }

    const queryLower = query.toLowerCase().trim();
    
    return this.positions.filter(position => {
      // Search in symbol
      if (position.symbol.toLowerCase().includes(queryLower)) {
        return true;
      }
      
      // Search in description
      if (position.description && position.description.toLowerCase().includes(queryLower)) {
        return true;
      }
      
      return false;
    });
  }

  /**
   * Get popular search terms based on position data
   */
  getPopularTerms(): SearchSuggestion[] {
    const symbolCounts = new Map<string, number>();
    
    this.positions.forEach(position => {
      const count = symbolCounts.get(position.symbol) || 0;
      symbolCounts.set(position.symbol, count + 1);
    });

    const popular = Array.from(symbolCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([symbol, count]) => ({
        type: 'symbol' as const,
        value: symbol,
        label: symbol,
        count
      }));

    return popular;
  }

  /**
   * Create a debounced search function
   */
  createDebouncedSearch(callback: (results: Position[]) => void, delay: number = 300) {
    return debounce((query: string) => {
      const results = this.search(query);
      callback(results);
    }, delay);
  }

  /**
   * Create a debounced suggestions function
   */
  createDebouncedSuggestions(callback: (suggestions: SearchSuggestion[]) => void, delay: number = 150) {
    return debounce((query: string) => {
      const suggestions = this.getSuggestions(query);
      callback(suggestions);
    }, delay);
  }

  /**
   * Load search history from localStorage
   */
  private loadSearchHistory(): void {
    try {
      const saved = localStorage.getItem(this.HISTORY_KEY);
      if (saved) {
        this.searchHistory = JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load search history:', error);
      this.searchHistory = [];
    }
  }

  /**
   * Save search history to localStorage
   */
  private saveSearchHistory(): void {
    try {
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(this.searchHistory));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  }
}

// Export a singleton instance
export const positionSearchService = new PositionSearchService();
export default positionSearchService; 
 
 
 