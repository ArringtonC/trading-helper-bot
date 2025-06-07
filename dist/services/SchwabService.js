/**
 * Service for interacting with the Charles Schwab API.
 * Placeholder for future implementation.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { MarketApiClient, TradingApiClient } from 'schwab-client-js';
// Placeholder for a more detailed Account type if needed later, perhaps combining AccountBasicInfo with positions/balances
// For now, AccountBasicInfo is what accountsNumbers() returns.
// export type Account = SchwabAccountDetails & { positions?: Position[], balances?: any };
var SchwabService = /** @class */ (function () {
    function SchwabService(credentials) {
        this.isConnected = false;
        if (!credentials.appKey || !credentials.appSecret || !credentials.refreshToken) {
            throw new Error('SchwabService: appKey, appSecret, and refreshToken are required.');
        }
        this.marketClient = new MarketApiClient(credentials.appKey, credentials.appSecret, credentials.refreshToken);
        this.tradingClient = new TradingApiClient(credentials.appKey, credentials.appSecret, credentials.refreshToken);
        // Attempt an initial connection test to validate credentials/token
        this._testConnection();
    }
    SchwabService.prototype._testConnection = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.tradingClient.accountsNumbers()];
                    case 1:
                        _a.sent();
                        this.isConnected = true;
                        console.log('SchwabService: Successfully connected and validated credentials with Schwab.');
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        this.isConnected = false;
                        console.error('SchwabService: Failed to connect or validate credentials with Schwab.', error_1);
                        throw new Error('SchwabService: Initial connection/validation failed. Refresh token might be invalid, expired, or credentials incorrect.');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Retrieves account information.
     */
    SchwabService.prototype.getAccounts = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isConnected)
                            throw new Error("SchwabService: Not connected. Check initial configuration.");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.tradingClient.accountsNumbers()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_2 = _a.sent();
                        console.error('SchwabService: Error fetching accounts.', error_2);
                        this._handleApiError(error_2);
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Places an order.
     */
    SchwabService.prototype.placeOrder = function (accountHash, order) {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isConnected)
                            throw new Error("SchwabService: Not connected.");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.tradingClient.placeOrderByAcct(accountHash, order)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_3 = _a.sent();
                        console.error('SchwabService: Error placing order.', error_3);
                        this._handleApiError(error_3);
                        throw error_3;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Retrieves a quote for a single symbol.
     */
    SchwabService.prototype.getQuote = function (symbol_1) {
        return __awaiter(this, arguments, void 0, function (symbol, fields) {
            var error_4;
            if (fields === void 0) { fields = 'quote'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isConnected)
                            throw new Error("SchwabService: Not connected.");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.marketClient.quoteById(symbol, fields)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_4 = _a.sent();
                        console.error("SchwabService: Error fetching quote for ".concat(symbol, "."), error_4);
                        this._handleApiError(error_4);
                        throw error_4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Retrieves quotes for multiple symbols using the library's native batch method.
     */
    SchwabService.prototype.getQuotes = function (symbols_1) {
        return __awaiter(this, arguments, void 0, function (symbols, fields) {
            var error_5;
            if (fields === void 0) { fields = 'quote'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isConnected)
                            throw new Error("SchwabService: Not connected.");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.marketClient.quotes(symbols.join(','), fields)];
                    case 2: 
                    // The schwab-client-js MarketApiClient expects a comma-separated string for symbols
                    return [2 /*return*/, _a.sent()];
                    case 3:
                        error_5 = _a.sent();
                        console.error('SchwabService: Error fetching multiple quotes.', error_5);
                        this._handleApiError(error_5);
                        throw error_5;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Retrieves positions for a given account hash.
     */
    SchwabService.prototype.getPositions = function (accountHash) {
        return __awaiter(this, void 0, void 0, function () {
            var details, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isConnected)
                            throw new Error("SchwabService: Not connected.");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.tradingClient.accountsDetails(accountHash, 'positions')];
                    case 2:
                        details = _a.sent();
                        // TODO: Verify the structure of details and extract positions array accordingly.
                        // This is a guess; adjust as needed based on actual API response.
                        return [2 /*return*/, details.positions || []];
                    case 3:
                        error_6 = _a.sent();
                        console.error("SchwabService: Error fetching positions for account ".concat(accountHash, "."), error_6);
                        this._handleApiError(error_6);
                        throw error_6;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Retrieves transactions for a given account hash within a date range.
     * @param params Requires startDate and endDate. e.g., { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
     */
    SchwabService.prototype.getTransactions = function (accountHash, params) {
        return __awaiter(this, void 0, void 0, function () {
            var error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isConnected)
                            throw new Error("SchwabService: Not connected.");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.tradingClient.transactByAcct(accountHash, params.types || 'ALL', params.startDate, params.endDate, null // symbol filter, optional
                            )];
                    case 2: 
                    // The schwab-client-js TradingApiClient uses transactByAcct
                    return [2 /*return*/, _a.sent()];
                    case 3:
                        error_7 = _a.sent();
                        console.error("SchwabService: Error fetching transactions for account ".concat(accountHash, "."), error_7);
                        this._handleApiError(error_7);
                        throw error_7;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    SchwabService.prototype.getIsConnected = function () {
        return this.isConnected;
    };
    SchwabService.prototype._handleApiError = function (error) {
        var _a, _b;
        console.error("Schwab API Error Details:", error);
        // Consider more specific error handling, e.g., checking for token expiry indications
        // and potentially setting this.isConnected = false or emitting an event.
        if (((_a = error === null || error === void 0 ? void 0 : error.message) === null || _a === void 0 ? void 0 : _a.includes('token')) || ((_b = error === null || error === void 0 ? void 0 : error.message) === null || _b === void 0 ? void 0 : _b.includes('expired'))) {
            this.isConnected = false;
            console.warn('SchwabService: Connection may be lost due to token issue. Please re-check credentials or re-authorize if problem persists.');
        }
        // Add more checks based on actual error structures from the library
    };
    return SchwabService;
}());
export { SchwabService };
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
