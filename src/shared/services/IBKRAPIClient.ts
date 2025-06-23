import { IBKRAPIRateLimiter, APIResponse } from './IBKRAPIRateLimiter';
import { IBKRAccount, IBKRPosition, IBKRTradeRecord } from '../types/ibkr';

// IBKR API Endpoints - these would be the actual IBKR endpoints
export const IBKR_ENDPOINTS = {
  // Authentication
  AUTH: '/iserver/auth/status',
  LOGIN: '/iserver/auth/login', 
  LOGOUT: '/iserver/auth/logout',
  VALIDATE: '/iserver/auth/validate',
  
  // Account Management
  ACCOUNTS: '/iserver/accounts',
  ACCOUNT_SUMMARY: '/iserver/account',
  ACCOUNT_PNL: '/iserver/account/pnl/partitioned',
  
  // Portfolio
  POSITIONS: '/iserver/account/{accountId}/positions',
  PORTFOLIO: '/iserver/account/{accountId}/portfolio',
  
  // Market Data
  MARKET_DATA: '/iserver/marketdata/snapshot',
  MARKET_DATA_HISTORY: '/iserver/marketdata/history',
  
  // Orders
  ORDERS: '/iserver/account/{accountId}/orders',
  PLACE_ORDER: '/iserver/account/{accountId}/orders',
  MODIFY_ORDER: '/iserver/account/{accountId}/orders/{orderId}',
  CANCEL_ORDER: '/iserver/account/{accountId}/orders/{orderId}',
  
  // Options
  OPTIONS_CHAIN: '/iserver/secdef/strikes',
  
  // Contract Details
  CONTRACT_DETAILS: '/iserver/contract/{conid}/info',
  SEARCH_CONTRACTS: '/iserver/secdef/search',
  
  // Scanner
  SCANNER: '/iserver/scanner/params',
  SCANNER_RUN: '/iserver/scanner/run',
} as const;

export interface IBKRAuthConfig {
  baseUrl: string;
  username?: string;
  password?: string;
  gateway: 'paper' | 'live';
  clientId?: string;
  redirectUri?: string;
}

export interface IBKRAccountInfo {
  accountId: string;
  accountVan: string;
  accountTitle: string;
  displayName: string;
  accountAlias: string;
  accountStatus: number;
  currency: string;
  type: string;
  tradingType: string;
  faclient: boolean;
  clearingStatus: string;
  covestor: boolean;
  parent: any;
  desc: string;
}

export interface IBKRPortfolioPosition {
  accountId: string;
  conid: number;
  contractDesc: string;
  position: number;
  mktPrice: number;
  mktValue: number;
  currency: string;
  avgCost: number;
  avgPrice: number;
  realizedPnl: number;
  unrealizedPnl: number;
  exchs: string;
  expiry: string;
  putOrCall: string;
  multiplier: number;
  strike: number;
  exerciseStyle: string;
  undConid: number;
  model: string;
}

export interface IBKROrderRequest {
  accountId: string;
  conid: number;
  orderType: 'MKT' | 'LMT' | 'STP' | 'STP_LIMIT';
  side: 'BUY' | 'SELL';
  quantity: number;
  price?: number;
  auxPrice?: number;
  tif: 'GTC' | 'DAY' | 'IOC' | 'FOK';
  outsideRth?: boolean;
  useAdaptive?: boolean;
}

export interface IBKROrderResponse {
  orderId: number;
  orderStatus: string;
  encrypted: boolean;
  text: string;
}

/**
 * IBKR API Client with rate limiting and error handling
 * 
 * This client provides a typed interface to IBKR's REST API endpoints
 * while respecting rate limits and providing robust error handling.
 */
export class IBKRAPIClient {
  private rateLimiter: IBKRAPIRateLimiter;
  private authConfig: IBKRAuthConfig;
  private isAuthenticated = false;
  private sessionTicket?: string;
  private authExpiryTime?: number;
  
  constructor(authConfig: IBKRAuthConfig, rateLimiter?: IBKRAPIRateLimiter) {
    this.authConfig = authConfig;
    this.rateLimiter = rateLimiter || new IBKRAPIRateLimiter();
    
    // Set up event listeners for monitoring
    this.setupEventListeners();
  }
  
  /**
   * Set up event listeners for monitoring and logging
   */
  private setupEventListeners(): void {
    this.rateLimiter.on('emergencyStop', (data) => {
      console.error('[IBKR-API-Client] Emergency stop activated:', data);
    });
    
    this.rateLimiter.on('circuitOpened', (data) => {
      console.warn('[IBKR-API-Client] Circuit breaker opened:', data);
    });
    
    this.rateLimiter.on('circuitClosed', () => {
      console.info('[IBKR-API-Client] Circuit breaker closed - API requests resumed');
    });
  }
  
  /**
   * Authenticate with IBKR API
   */
  public async authenticate(): Promise<boolean> {
    try {
      // Check if already authenticated and session is still valid
      if (this.isAuthenticated && this.authExpiryTime && Date.now() < this.authExpiryTime) {
        return true;
      }
      
      // Check authentication status first
      const statusResponse = await this.rateLimiter.queueRequest(
        IBKR_ENDPOINTS.AUTH,
        'GET',
        {
          priority: 'HIGH',
          cacheKey: 'auth-status',
          cacheDuration: 30000 // Cache for 30 seconds
        }
      );
      
      if (statusResponse.success && statusResponse.data?.authenticated) {
        this.isAuthenticated = true;
        this.authExpiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
        return true;
      }
      
      // If not authenticated, attempt login
      const loginResponse = await this.rateLimiter.queueRequest(
        IBKR_ENDPOINTS.LOGIN,
        'POST',
        {
          priority: 'HIGH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            username: this.authConfig.username,
            password: this.authConfig.password
          }
        }
      );
      
      if (loginResponse.success) {
        this.isAuthenticated = true;
        this.sessionTicket = loginResponse.data?.ticket;
        this.authExpiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
        console.log('[IBKR-API-Client] Successfully authenticated');
        return true;
      }
      
      console.error('[IBKR-API-Client] Authentication failed:', loginResponse.error);
      return false;
      
    } catch (error) {
      console.error('[IBKR-API-Client] Authentication error:', error);
      return false;
    }
  }
  
  /**
   * Get account information
   */
  public async getAccounts(): Promise<IBKRAccountInfo[]> {
    await this.ensureAuthenticated();
    
    const response = await this.rateLimiter.queueRequest(
      IBKR_ENDPOINTS.ACCOUNTS,
      'GET',
      {
        priority: 'MEDIUM',
        cacheKey: 'accounts-list',
        cacheDuration: 300000 // Cache for 5 minutes
      }
    );
    
    if (!response.success) {
      throw new Error(`Failed to get accounts: ${response.error}`);
    }
    
    return response.data || [];
  }
  
  /**
   * Get account summary
   */
  public async getAccountSummary(accountId: string): Promise<any> {
    await this.ensureAuthenticated();
    
    const response = await this.rateLimiter.queueRequest(
      IBKR_ENDPOINTS.ACCOUNT_SUMMARY,
      'GET',
      {
        priority: 'MEDIUM',
        headers: {
          'accountId': accountId
        },
        cacheKey: `account-summary-${accountId}`,
        cacheDuration: 60000 // Cache for 1 minute
      }
    );
    
    if (!response.success) {
      throw new Error(`Failed to get account summary: ${response.error}`);
    }
    
    return response.data;
  }
  
  /**
   * Get portfolio positions
   */
  public async getPositions(accountId: string): Promise<IBKRPortfolioPosition[]> {
    await this.ensureAuthenticated();
    
    const endpoint = IBKR_ENDPOINTS.POSITIONS.replace('{accountId}', accountId);
    
    const response = await this.rateLimiter.queueRequest(
      endpoint,
      'GET',
      {
        priority: 'MEDIUM',
        cacheKey: `positions-${accountId}`,
        cacheDuration: 30000 // Cache for 30 seconds
      }
    );
    
    if (!response.success) {
      throw new Error(`Failed to get positions: ${response.error}`);
    }
    
    return response.data || [];
  }
  
  /**
   * Get portfolio information
   */
  public async getPortfolio(accountId: string): Promise<any> {
    await this.ensureAuthenticated();
    
    const endpoint = IBKR_ENDPOINTS.PORTFOLIO.replace('{accountId}', accountId);
    
    const response = await this.rateLimiter.queueRequest(
      endpoint,
      'GET',
      {
        priority: 'MEDIUM',
        cacheKey: `portfolio-${accountId}`,
        cacheDuration: 60000 // Cache for 1 minute
      }
    );
    
    if (!response.success) {
      throw new Error(`Failed to get portfolio: ${response.error}`);
    }
    
    return response.data;
  }
  
  /**
   * Get market data for a contract
   */
  public async getMarketData(conid: number, fields: string[] = ['31', '84', '86']): Promise<any> {
    await this.ensureAuthenticated();
    
    const response = await this.rateLimiter.queueRequest(
      IBKR_ENDPOINTS.MARKET_DATA,
      'GET',
      {
        priority: 'HIGH', // Market data is high priority
        headers: {
          'conids': conid.toString(),
          'fields': fields.join(',')
        },
        cacheKey: `market-data-${conid}`,
        cacheDuration: 5000 // Cache for 5 seconds (market data changes frequently)
      }
    );
    
    if (!response.success) {
      throw new Error(`Failed to get market data: ${response.error}`);
    }
    
    return response.data;
  }
  
  /**
   * Place an order
   */
  public async placeOrder(orderRequest: IBKROrderRequest): Promise<IBKROrderResponse> {
    await this.ensureAuthenticated();
    
    const endpoint = IBKR_ENDPOINTS.PLACE_ORDER.replace('{accountId}', orderRequest.accountId);
    
    const response = await this.rateLimiter.queueRequest(
      endpoint,
      'POST',
      {
        priority: 'HIGH', // Orders are high priority
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          orders: [{
            conid: orderRequest.conid,
            orderType: orderRequest.orderType,
            side: orderRequest.side,
            quantity: orderRequest.quantity,
            price: orderRequest.price,
            auxPrice: orderRequest.auxPrice,
            tif: orderRequest.tif,
            outsideRth: orderRequest.outsideRth,
            useAdaptive: orderRequest.useAdaptive
          }]
        }
      }
    );
    
    if (!response.success) {
      throw new Error(`Failed to place order: ${response.error}`);
    }
    
    return response.data;
  }
  
  /**
   * Get existing orders
   */
  public async getOrders(accountId: string): Promise<any[]> {
    await this.ensureAuthenticated();
    
    const endpoint = IBKR_ENDPOINTS.ORDERS.replace('{accountId}', accountId);
    
    const response = await this.rateLimiter.queueRequest(
      endpoint,
      'GET',
      {
        priority: 'MEDIUM',
        cacheKey: `orders-${accountId}`,
        cacheDuration: 10000 // Cache for 10 seconds
      }
    );
    
    if (!response.success) {
      throw new Error(`Failed to get orders: ${response.error}`);
    }
    
    return response.data?.orders || [];
  }
  
  /**
   * Cancel an order
   */
  public async cancelOrder(accountId: string, orderId: string): Promise<boolean> {
    await this.ensureAuthenticated();
    
    const endpoint = IBKR_ENDPOINTS.CANCEL_ORDER
      .replace('{accountId}', accountId)
      .replace('{orderId}', orderId);
    
    const response = await this.rateLimiter.queueRequest(
      endpoint,
      'DELETE',
      {
        priority: 'HIGH' // Order cancellations are high priority
      }
    );
    
    if (!response.success) {
      throw new Error(`Failed to cancel order: ${response.error}`);
    }
    
    return response.data?.msg === 'Order cancelled';
  }
  
  /**
   * Search for contracts (securities)
   */
  public async searchContracts(symbol: string, secType?: string): Promise<any[]> {
    const response = await this.rateLimiter.queueRequest(
      IBKR_ENDPOINTS.SEARCH_CONTRACTS,
      'POST',
      {
        priority: 'LOW',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          symbol,
          name: true,
          secType: secType || 'STK'
        },
        cacheKey: `contract-search-${symbol}-${secType || 'STK'}`,
        cacheDuration: 3600000 // Cache for 1 hour
      }
    );
    
    if (!response.success) {
      throw new Error(`Failed to search contracts: ${response.error}`);
    }
    
    return response.data || [];
  }
  
  /**
   * Get options chain for a contract
   */
  public async getOptionsChain(conid: number, secType: string = 'OPT'): Promise<any> {
    const response = await this.rateLimiter.queueRequest(
      IBKR_ENDPOINTS.OPTIONS_CHAIN,
      'GET',
      {
        priority: 'MEDIUM',
        headers: {
          'conid': conid.toString(),
          'sectype': secType
        },
        cacheKey: `options-chain-${conid}`,
        cacheDuration: 300000 // Cache for 5 minutes
      }
    );
    
    if (!response.success) {
      throw new Error(`Failed to get options chain: ${response.error}`);
    }
    
    return response.data;
  }
  
  /**
   * Get historical market data
   */
  public async getHistoricalData(
    conid: number,
    period: string = '1d',
    bar: string = '1min'
  ): Promise<any> {
    const response = await this.rateLimiter.queueRequest(
      IBKR_ENDPOINTS.MARKET_DATA_HISTORY,
      'GET',
      {
        priority: 'LOW',
        headers: {
          'conid': conid.toString(),
          'period': period,
          'bar': bar
        },
        cacheKey: `historical-data-${conid}-${period}-${bar}`,
        cacheDuration: 60000 // Cache for 1 minute
      }
    );
    
    if (!response.success) {
      throw new Error(`Failed to get historical data: ${response.error}`);
    }
    
    return response.data;
  }
  
  /**
   * Ensure client is authenticated before making requests
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.isAuthenticated || (this.authExpiryTime && Date.now() >= this.authExpiryTime)) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error('Failed to authenticate with IBKR API');
      }
    }
  }
  
  /**
   * Get rate limiter metrics
   */
  public getMetrics(): any {
    return this.rateLimiter.getMetrics();
  }
  
  /**
   * Get debug information
   */
  public getDebugInfo(): any {
    return {
      isAuthenticated: this.isAuthenticated,
      authExpiryTime: this.authExpiryTime,
      sessionTicket: this.sessionTicket ? '***' : undefined,
      rateLimiterInfo: this.rateLimiter.getDebugInfo()
    };
  }
  
  /**
   * Reset the rate limiter (for testing or emergency recovery)
   */
  public resetRateLimiter(): void {
    this.rateLimiter.resetEmergencyStop();
    this.rateLimiter.resetCircuitBreaker();
    this.rateLimiter.clearQueue();
  }
  
  /**
   * Logout from IBKR API
   */
  public async logout(): Promise<void> {
    try {
      await this.rateLimiter.queueRequest(
        IBKR_ENDPOINTS.LOGOUT,
        'POST',
        {
          priority: 'HIGH'
        }
      );
    } catch (error) {
      console.warn('[IBKR-API-Client] Logout request failed:', error);
    } finally {
      this.isAuthenticated = false;
      this.sessionTicket = undefined;
      this.authExpiryTime = undefined;
    }
  }
  
  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.rateLimiter.destroy();
    this.isAuthenticated = false;
    this.sessionTicket = undefined;
    this.authExpiryTime = undefined;
  }
}

// Export a default instance for convenience (can be configured later)
export const ibkrAPIClient = new IBKRAPIClient({
  baseUrl: process.env.IBKR_API_BASE_URL || 'https://localhost:5000/v1/api',
  gateway: (process.env.IBKR_GATEWAY as 'paper' | 'live') || 'paper'
}); 