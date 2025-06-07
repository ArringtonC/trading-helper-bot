/**
 * Service for interacting with the Charles Schwab API.
 * Placeholder for future implementation.
 */

import { 
  MarketApiClient, 
  TradingApiClient
} from 'schwab-client-js';
import { 
  Account,
  OrderRequest,
  OrderResponse,
  Quote,
  Position,
  Transaction,
  SchwabServiceCredentials
} from '../types/schwab';

// Placeholder for a more detailed Account type if needed later, perhaps combining AccountBasicInfo with positions/balances
// For now, AccountBasicInfo is what accountsNumbers() returns.
// export type Account = SchwabAccountDetails & { positions?: Position[], balances?: any };

export class SchwabService {
  private marketClient: MarketApiClient;
  private tradingClient: TradingApiClient;
  private isConnected: boolean = false; 

  constructor(credentials: SchwabServiceCredentials) {
    if (!credentials.appKey || !credentials.appSecret || !credentials.refreshToken) {
      throw new Error('SchwabService: appKey, appSecret, and refreshToken are required.');
    }

    this.marketClient = new MarketApiClient(
      credentials.appKey,
      credentials.appSecret,
      credentials.refreshToken
    );
    this.tradingClient = new TradingApiClient(
      credentials.appKey,
      credentials.appSecret,
      credentials.refreshToken
    );
    // Do not call _testConnection() here; use connect() method instead
  }

  public async connect(): Promise<void> {
    await this._testConnection();
  }

  private async _testConnection(): Promise<void> {
    try {
      await this.tradingClient.accountsNumbers(); 
      this.isConnected = true;
      console.log('SchwabService: Successfully connected and validated credentials with Schwab.');
    } catch (error) {
      this.isConnected = false;
      console.error('SchwabService: Failed to connect or validate credentials with Schwab.', error);
      throw new Error('SchwabService: Initial connection/validation failed. Refresh token might be invalid, expired, or credentials incorrect.');
    }
  }

  /**
   * Retrieves account information.
   */
  async getAccounts(): Promise<Account[]> {
    if (!this.isConnected) throw new Error("SchwabService: Not connected. Check initial configuration.");
    try {
      return await this.tradingClient.accountsNumbers();
    } catch (error) {
      console.error('SchwabService: Error fetching accounts.', error);
      this._handleApiError(error);
      throw error; 
    }
  }

  /**
   * Places an order.
   */
  async placeOrder(accountHash: string, order: OrderRequest): Promise<OrderResponse> {
    if (!this.isConnected) throw new Error("SchwabService: Not connected.");
    try {
      return await this.tradingClient.placeOrderByAcct(accountHash, order);
    } catch (error) {
      console.error('SchwabService: Error placing order.', error);
      this._handleApiError(error);
      throw error;
    }
  }

  /**
   * Retrieves a quote for a single symbol.
   */
  async getQuote(symbol: string, fields: string = 'quote'): Promise<Quote> {
    if (!this.isConnected) throw new Error("SchwabService: Not connected.");
    try {
      return await this.marketClient.quoteById(symbol, fields);
    } catch (error) {
      console.error(`SchwabService: Error fetching quote for ${symbol}.`, error);
      this._handleApiError(error);
      throw error;
    }
  }

  /**
   * Retrieves quotes for multiple symbols using the library's native batch method.
   */
  async getQuotes(symbols: string[], fields: string = 'quote'): Promise<Quote[]> {
    if (!this.isConnected) throw new Error("SchwabService: Not connected.");
    try {
      // The schwab-client-js MarketApiClient expects a comma-separated string for symbols
      return await this.marketClient.quotes(symbols.join(','), fields);
    } catch (error) {
      console.error('SchwabService: Error fetching multiple quotes.', error);
      this._handleApiError(error);
      throw error;
    }
  }
  
  /**
   * Retrieves positions for a given account hash.
   */
  async getPositions(accountHash: string): Promise<Position[]> {
    if (!this.isConnected) throw new Error("SchwabService: Not connected.");
    try {
      // The schwab-client-js TradingApiClient does not have getAccountPositions.
      // We'll use accountsDetails and extract positions if available.
      const details = await this.tradingClient.accountsDetails(accountHash, 'positions');
      // TODO: Verify the structure of details and extract positions array accordingly.
      // This is a guess; adjust as needed based on actual API response.
      return details.positions || [];
    } catch (error) {
      console.error(`SchwabService: Error fetching positions for account ${accountHash}.`, error);
      this._handleApiError(error);
      throw error;
    }
  }

  /**
   * Retrieves transactions for a given account hash within a date range.
   * @param params Requires startDate and endDate. e.g., { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
   */
  async getTransactions(accountHash: string, params: { startDate: string; endDate: string; types?: string }): Promise<Transaction[]> {
    if (!this.isConnected) throw new Error("SchwabService: Not connected.");
    try {
      // The schwab-client-js TradingApiClient uses transactByAcct
      return await this.tradingClient.transactByAcct(
        accountHash,
        params.types || 'ALL',
        params.startDate,
        params.endDate,
        null // symbol filter, optional
      );
    } catch (error) {
      console.error(`SchwabService: Error fetching transactions for account ${accountHash}.`, error);
      this._handleApiError(error);
      throw error;
    }
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  private _handleApiError(error: any): void {
    console.error("Schwab API Error Details:", error);
    // Consider more specific error handling, e.g., checking for token expiry indications
    // and potentially setting this.isConnected = false or emitting an event.
    if (error?.message?.includes('token') || error?.message?.includes('expired')) {
        this.isConnected = false;
        console.warn('SchwabService: Connection may be lost due to token issue. Please re-check credentials or re-authorize if problem persists.')
    }
    // Add more checks based on actual error structures from the library
  }
}

// Example Usage (conceptual, would be in Electron main or another service)
/*
async function exampleUsage(credentialService: any) { // Assuming a CredentialService instance
  try {
    const appKey = await credentialService.getCredential('schwab', 'appKey');
    const appSecret = await credentialService.getCredential('schwab', 'appSecret');
    const refreshToken = await credentialService.getCredential('schwab', 'refreshToken');

    if (!appKey?.credential || !appSecret?.credential || !refreshToken?.credential) {
      console.error('Schwab credentials not fully configured.');
      // UI should guide user to BrokerCredentialsForm
      return;
    }

    const schwabService = new SchwabService({
      appKey: appKey.credential,
      appSecret: appSecret.credential,
      refreshToken: refreshToken.credential,
    });

    if (schwabService.getIsConnected()) {
      const accounts = await schwabService.getAccounts();
      console.log('Schwab Accounts:', accounts);

      if (accounts.length > 0) {
        const accountHash = accounts[0].hashValue; // Use the actual hashValue

        // Example: Get quotes
        const quotes = await schwabService.getQuotes(['AAPL', 'TSLA']);
        console.log('Schwab Quotes:', quotes);

        // Example: Place an order (ensure OrderRequest structure is correct)
        // const sampleOrder: OrderRequest = {
        //   session: 'NORMAL',
        //   duration: 'DAY',
        //   orderType: 'MARKET',
        //   orderStrategyType: 'SINGLE',
        //   orderLegCollection: [{
        //     instruction: 'BUY',
        //     quantity: 1,
        //     instrument: { symbol: 'AAPL', assetType: 'EQUITY' }
        //   }]
        // };
        // const orderResponse = await schwabService.placeOrder(accountHash, sampleOrder);
        // console.log('Schwab Order Response:', orderResponse);
      }
    }
  } catch (error) {
    console.error('Error in SchwabService example usage:', error.message);
    // If error.message includes "Refresh token might be invalid", guide user to re-auth.
  }
}
*/

export default SchwabService; 