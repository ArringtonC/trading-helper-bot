/**
 * WatchlistService - Simple portfolio/watchlist management
 * Provides functionality for adding, removing, and managing selected stocks
 */

export interface WatchlistStock {
  symbol: string;
  name: string;
  price: number;
  addedAt: Date;
  source: 'curated-lists' | 'screening' | 'template-matching' | 'manual';
  targetAmount?: number;
  notes?: string;
  category?: string;
  riskLevel?: 'low' | 'medium' | 'high';
}

export interface Watchlist {
  id: string;
  name: string;
  description: string;
  stocks: WatchlistStock[];
  createdAt: Date;
  updatedAt: Date;
}

class WatchlistService {
  private static readonly STORAGE_KEY = 'trading_helper_watchlists';
  private static readonly DEFAULT_WATCHLIST_ID = 'main';

  /**
   * Get all watchlists
   */
  static getWatchlists(): Watchlist[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        // Create default watchlist
        const defaultWatchlist: Watchlist = {
          id: this.DEFAULT_WATCHLIST_ID,
          name: 'My Watchlist',
          description: 'Main stock watchlist',
          stocks: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.saveWatchlists([defaultWatchlist]);
        return [defaultWatchlist];
      }
      return JSON.parse(data).map((w: any) => ({
        ...w,
        createdAt: new Date(w.createdAt),
        updatedAt: new Date(w.updatedAt),
        stocks: w.stocks.map((s: any) => ({
          ...s,
          addedAt: new Date(s.addedAt)
        }))
      }));
    } catch (error) {
      console.error('Error loading watchlists:', error);
      return [];
    }
  }

  /**
   * Save watchlists to storage
   */
  private static saveWatchlists(watchlists: Watchlist[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(watchlists));
    } catch (error) {
      console.error('Error saving watchlists:', error);
    }
  }

  /**
   * Get main watchlist
   */
  static getMainWatchlist(): Watchlist {
    const watchlists = this.getWatchlists();
    return watchlists.find(w => w.id === this.DEFAULT_WATCHLIST_ID) || watchlists[0];
  }

  /**
   * Add stock to watchlist
   */
  static addStock(
    stock: Pick<WatchlistStock, 'symbol' | 'name' | 'price' | 'source' | 'category' | 'riskLevel'>,
    watchlistId: string = this.DEFAULT_WATCHLIST_ID,
    options?: { targetAmount?: number; notes?: string }
  ): boolean {
    try {
      const watchlists = this.getWatchlists();
      const watchlist = watchlists.find(w => w.id === watchlistId);
      
      if (!watchlist) return false;

      // Check if stock already exists
      const existingIndex = watchlist.stocks.findIndex(s => s.symbol === stock.symbol);
      
      const watchlistStock: WatchlistStock = {
        ...stock,
        addedAt: new Date(),
        targetAmount: options?.targetAmount,
        notes: options?.notes
      };

      if (existingIndex >= 0) {
        // Update existing stock
        watchlist.stocks[existingIndex] = watchlistStock;
      } else {
        // Add new stock
        watchlist.stocks.push(watchlistStock);
      }

      watchlist.updatedAt = new Date();
      this.saveWatchlists(watchlists);
      return true;
    } catch (error) {
      console.error('Error adding stock to watchlist:', error);
      return false;
    }
  }

  /**
   * Remove stock from watchlist
   */
  static removeStock(symbol: string, watchlistId: string = this.DEFAULT_WATCHLIST_ID): boolean {
    try {
      const watchlists = this.getWatchlists();
      const watchlist = watchlists.find(w => w.id === watchlistId);
      
      if (!watchlist) return false;

      const initialLength = watchlist.stocks.length;
      watchlist.stocks = watchlist.stocks.filter(s => s.symbol !== symbol);
      
      if (watchlist.stocks.length < initialLength) {
        watchlist.updatedAt = new Date();
        this.saveWatchlists(watchlists);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing stock from watchlist:', error);
      return false;
    }
  }

  /**
   * Check if stock is in watchlist
   */
  static isInWatchlist(symbol: string, watchlistId: string = this.DEFAULT_WATCHLIST_ID): boolean {
    try {
      const watchlist = this.getWatchlists().find(w => w.id === watchlistId);
      return watchlist ? watchlist.stocks.some(s => s.symbol === symbol) : false;
    } catch (error) {
      console.error('Error checking watchlist:', error);
      return false;
    }
  }

  /**
   * Get stock count in watchlist
   */
  static getStockCount(watchlistId: string = this.DEFAULT_WATCHLIST_ID): number {
    try {
      const watchlist = this.getWatchlists().find(w => w.id === watchlistId);
      return watchlist ? watchlist.stocks.length : 0;
    } catch (error) {
      console.error('Error getting stock count:', error);
      return 0;
    }
  }

  /**
   * Clear all stocks from watchlist
   */
  static clearWatchlist(watchlistId: string = this.DEFAULT_WATCHLIST_ID): boolean {
    try {
      const watchlists = this.getWatchlists();
      const watchlist = watchlists.find(w => w.id === watchlistId);
      
      if (!watchlist) return false;

      watchlist.stocks = [];
      watchlist.updatedAt = new Date();
      this.saveWatchlists(watchlists);
      return true;
    } catch (error) {
      console.error('Error clearing watchlist:', error);
      return false;
    }
  }

  /**
   * Get summary statistics
   */
  static getWatchlistSummary(watchlistId: string = this.DEFAULT_WATCHLIST_ID) {
    try {
      const watchlist = this.getWatchlists().find(w => w.id === watchlistId);
      
      if (!watchlist) {
        return {
          totalStocks: 0,
          totalValue: 0,
          avgPrice: 0,
          riskDistribution: { low: 0, medium: 0, high: 0 },
          sourceDistribution: {}
        };
      }

      const totalStocks = watchlist.stocks.length;
      const totalValue = watchlist.stocks.reduce((sum, stock) => 
        sum + (stock.price * (stock.targetAmount || 1)), 0
      );
      const avgPrice = totalStocks > 0 ? 
        watchlist.stocks.reduce((sum, stock) => sum + stock.price, 0) / totalStocks : 0;

      const riskDistribution = watchlist.stocks.reduce((acc, stock) => {
        const risk = stock.riskLevel || 'medium';
        acc[risk] = (acc[risk] || 0) + 1;
        return acc;
      }, { low: 0, medium: 0, high: 0 });

      const sourceDistribution = watchlist.stocks.reduce((acc, stock) => {
        acc[stock.source] = (acc[stock.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalStocks,
        totalValue,
        avgPrice,
        riskDistribution,
        sourceDistribution
      };
    } catch (error) {
      console.error('Error getting watchlist summary:', error);
      return {
        totalStocks: 0,
        totalValue: 0,
        avgPrice: 0,
        riskDistribution: { low: 0, medium: 0, high: 0 },
        sourceDistribution: {}
      };
    }
  }
}

export default WatchlistService; 