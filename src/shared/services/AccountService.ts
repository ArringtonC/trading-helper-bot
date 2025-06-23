import { Account, DEMO_ACCOUNT } from '../../types/account';

/**
 * Service for managing trading accounts
 */
export class AccountService {
  private static storageKey = 'trading-helper-accounts';
  
  /**
   * Get all accounts from local storage
   */
  public static getAccounts(): Account[] {
    const accountsJson = localStorage.getItem(this.storageKey);
    
    if (!accountsJson) {
      // Return demo account if no accounts are stored
      const accounts = [DEMO_ACCOUNT];
      this.saveAccounts(accounts);
      return accounts;
    }
    
    try {
      // Parse accounts from JSON string and fix dates
      const accounts = JSON.parse(accountsJson) as Account[];
      
      // Convert string dates back to Date objects
      const accountsWithDates = accounts.map(account => ({
        ...account,
        lastUpdated: new Date(account.lastUpdated)
      }));
      
      // Ensure demo account is always present
      if (!accountsWithDates.some(a => a.id === DEMO_ACCOUNT.id)) {
        accountsWithDates.unshift(DEMO_ACCOUNT);
        this.saveAccounts(accountsWithDates);
      }
      
      return accountsWithDates;
    } catch (error) {
      console.error('Error parsing accounts from localStorage', error);
      return [DEMO_ACCOUNT];
    }
  }
  
  /**
   * Save accounts to local storage
   */
  public static saveAccounts(accounts: Account[]): void {
    // Ensure demo account is always present
    if (!accounts.some(a => a.id === DEMO_ACCOUNT.id)) {
      accounts.unshift(DEMO_ACCOUNT);
    }
    localStorage.setItem(this.storageKey, JSON.stringify(accounts));
  }
  
  /**
   * Get a specific account by ID
   */
  public static getAccountById(id: string): Account | undefined {
    const accounts = this.getAccounts();
    return accounts.find(account => account.id === id);
  }
  
  /**
   * Update an existing account
   */
  public static updateAccount(updatedAccount: Account): void {
    const accounts = this.getAccounts();
    const index = accounts.findIndex(account => account.id === updatedAccount.id);
    
    if (index !== -1) {
      // Don't allow updating the demo account
      if (updatedAccount.id === DEMO_ACCOUNT.id) {
        return;
      }
      accounts[index] = updatedAccount;
      this.saveAccounts(accounts);
    }
  }
  
  /**
   * Add a new account
   */
  public static addAccount(account: Account): void {
    const accounts = this.getAccounts();
    accounts.push(account);
    this.saveAccounts(accounts);
  }
  
  /**
   * Delete an account
   */
  public static deleteAccount(id: string): void {
    // Don't allow deleting the demo account
    if (id === DEMO_ACCOUNT.id) {
      return;
    }
    const accounts = this.getAccounts();
    const filtered = accounts.filter(account => account.id !== id);
    this.saveAccounts(filtered);
  }
  
  /**
   * Add a deposit to an account
   */
  public static addDeposit(accountId: string, amount: number): Account | undefined {
    const account = this.getAccountById(accountId);
    
    if (!account) {
      return undefined;
    }
    
    // Don't allow deposits to demo account
    if (account.id === DEMO_ACCOUNT.id) {
      return account;
    }
    
    const updatedAccount: Account = {
      ...account,
      balance: account.balance + amount,
      lastUpdated: new Date()
    };
    
    this.updateAccount(updatedAccount);
    return updatedAccount;
  }
  
  /**
   * Export account capabilities to a downloadable format
   */
  public static exportCapabilities(): void {
    // This is a placeholder for future implementation
    // Will export current system capabilities to Excel
    console.log('Export capabilities functionality will be implemented in a future version');
  }
} 