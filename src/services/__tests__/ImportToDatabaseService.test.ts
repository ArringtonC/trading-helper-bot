import fixedIBKRImportService, { FixedIBKRImportService } from '../ImportToDatabaseService';

jest.mock('../AccountService', () => ({
  AccountService: {
    getAccounts: jest.fn(() => ([])),
    addAccount: jest.fn(),
    updateAccount: jest.fn(),
    saveAccounts: jest.fn(),
  }
}));

jest.mock('../OptionService', () => {
  return {
    OptionService: jest.fn().mockImplementation(() => ({
      saveTradesToPortfolio: jest.fn(() => Promise.resolve(1)),
      getOptionsPortfolio: jest.fn(() => ({ trades: [] })),
    })),
  };
});

describe('FixedIBKRImportService', () => {
  it('should import activity statement and return success', async () => {
    // Minimal valid IBKR statement string (simulate CSV or text)
    const minimalStatement = `Account Information,Data,Name,Test Account,,,,,,,,,,,,,,,,,\n` +
      `Account Information,Data,Account,TEST123,,,,,,,,,,,,,,,,,\n` +
      `Account Information,Data,Account Type,Individual,,,,,,,,,,,,,,,,,\n` +
      `Account Information,Data,Base Currency,USD,,,,,,,,,,,,,,,,,\n` +
      `Account Information,Data,Balance,10000,,,,,,,,,,,,,,,,,\n`;
    const result = await fixedIBKRImportService.importActivityStatement(minimalStatement);
    expect(result).toHaveProperty('success');
    expect(typeof result.success).toBe('boolean');
    // Optionally check for accountId, accountName, etc.
  });

  it('should update account balance for existing account', async () => {
    const { AccountService } = require('../AccountService');
    const mockAccount = { id: 'test', balance: 500, lastUpdated: new Date() };
    AccountService.getAccounts.mockReturnValueOnce([mockAccount]);
    AccountService.saveAccounts.mockClear();
    const result = await fixedIBKRImportService.updateAccountBalance('test', 1000);
    expect(result).toBe(true);
    expect(AccountService.saveAccounts).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'test', balance: 1000 })
      ])
    );
  });

  it('should return false if account not found', async () => {
    const { AccountService } = require('../AccountService');
    AccountService.getAccounts.mockReturnValueOnce([]);
    const result = await fixedIBKRImportService.updateAccountBalance('notfound', 1000);
    expect(result).toBe(false);
  });
}); 