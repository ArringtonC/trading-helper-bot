var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { DEMO_ACCOUNT } from '../types/account';
/**
 * Service for managing trading accounts
 */
var AccountService = /** @class */ (function () {
    function AccountService() {
    }
    /**
     * Get all accounts from local storage
     */
    AccountService.getAccounts = function () {
        var accountsJson = localStorage.getItem(this.storageKey);
        if (!accountsJson) {
            // Return demo account if no accounts are stored
            var accounts = [DEMO_ACCOUNT];
            this.saveAccounts(accounts);
            return accounts;
        }
        try {
            // Parse accounts from JSON string and fix dates
            var accounts = JSON.parse(accountsJson);
            // Convert string dates back to Date objects
            var accountsWithDates = accounts.map(function (account) { return (__assign(__assign({}, account), { lastUpdated: new Date(account.lastUpdated) })); });
            // Ensure demo account is always present
            if (!accountsWithDates.some(function (a) { return a.id === DEMO_ACCOUNT.id; })) {
                accountsWithDates.unshift(DEMO_ACCOUNT);
                this.saveAccounts(accountsWithDates);
            }
            return accountsWithDates;
        }
        catch (error) {
            console.error('Error parsing accounts from localStorage', error);
            return [DEMO_ACCOUNT];
        }
    };
    /**
     * Save accounts to local storage
     */
    AccountService.saveAccounts = function (accounts) {
        // Ensure demo account is always present
        if (!accounts.some(function (a) { return a.id === DEMO_ACCOUNT.id; })) {
            accounts.unshift(DEMO_ACCOUNT);
        }
        localStorage.setItem(this.storageKey, JSON.stringify(accounts));
    };
    /**
     * Get a specific account by ID
     */
    AccountService.getAccountById = function (id) {
        var accounts = this.getAccounts();
        return accounts.find(function (account) { return account.id === id; });
    };
    /**
     * Update an existing account
     */
    AccountService.updateAccount = function (updatedAccount) {
        var accounts = this.getAccounts();
        var index = accounts.findIndex(function (account) { return account.id === updatedAccount.id; });
        if (index !== -1) {
            // Don't allow updating the demo account
            if (updatedAccount.id === DEMO_ACCOUNT.id) {
                return;
            }
            accounts[index] = updatedAccount;
            this.saveAccounts(accounts);
        }
    };
    /**
     * Add a new account
     */
    AccountService.addAccount = function (account) {
        var accounts = this.getAccounts();
        accounts.push(account);
        this.saveAccounts(accounts);
    };
    /**
     * Delete an account
     */
    AccountService.deleteAccount = function (id) {
        // Don't allow deleting the demo account
        if (id === DEMO_ACCOUNT.id) {
            return;
        }
        var accounts = this.getAccounts();
        var filtered = accounts.filter(function (account) { return account.id !== id; });
        this.saveAccounts(filtered);
    };
    /**
     * Add a deposit to an account
     */
    AccountService.addDeposit = function (accountId, amount) {
        var account = this.getAccountById(accountId);
        if (!account) {
            return undefined;
        }
        // Don't allow deposits to demo account
        if (account.id === DEMO_ACCOUNT.id) {
            return account;
        }
        var updatedAccount = __assign(__assign({}, account), { balance: account.balance + amount, lastUpdated: new Date() });
        this.updateAccount(updatedAccount);
        return updatedAccount;
    };
    /**
     * Export account capabilities to a downloadable format
     */
    AccountService.exportCapabilities = function () {
        // This is a placeholder for future implementation
        // Will export current system capabilities to Excel
        console.log('Export capabilities functionality will be implemented in a future version');
    };
    AccountService.storageKey = 'trading-helper-accounts';
    return AccountService;
}());
export { AccountService };
