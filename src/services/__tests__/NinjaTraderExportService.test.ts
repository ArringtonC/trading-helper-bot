import ninjaTraderExportService, { NinjaTraderExportService } from '../NinjaTraderExportService';
import { OptionTrade, OptionStrategy } from '../../types/options';
import { formatDateForDisplay } from '../../utils/dateUtils';

const mockTrades: OptionTrade[] = [
  {
    id: '1', symbol: 'AAPL', putCall: 'CALL', strike: 150, expiry: new Date('2025-01-01'), quantity: 2, premium: 1.5, openDate: new Date('2024-01-01'),
    commission: 1, assetCategory: 'OPT', realizedPL: 0, unrealizedPL: 0, strategy: OptionStrategy.LONG_CALL, notes: 'test'
  },
  {
    id: '2', symbol: 'MSFT', putCall: 'PUT', strike: 300, expiry: new Date('2025-06-01'), quantity: -1, premium: 2.5, openDate: new Date('2024-02-01'),
    commission: 1, assetCategory: 'OPT', realizedPL: 0, unrealizedPL: 0, strategy: OptionStrategy.SHORT_PUT, notes: 'test2'
  }
];

describe('NinjaTraderExportService', () => {
  it('should export to NinjaTrader format with correct content', () => {
    const options = { strategyName: 'TestStrategy', includeClosedTrades: true };
    const result = ninjaTraderExportService.exportToNinjaTrader(mockTrades, options);
    const currentDate = formatDateForDisplay(new Date(), 'yyyyMMdd');

    expect(result.callsFile.name).toBe(`TestStrategy_calls_${currentDate}.csv`);
    expect(result.putsFile.name).toBe(`TestStrategy_puts_${currentDate}.csv`);

    expect(result.callsFile.content).toContain('Date,Time,Symbol,Strike,Expiry,Type,Action,Quantity,Price,Commission,Account');
    expect(result.callsFile.content).toContain('AAPL');
    expect(result.callsFile.content).toContain('Buy'); // quantity > 0

    expect(result.putsFile.content).toContain('Date,Time,Symbol,Strike,Expiry,Type,Action,Quantity,Price,Commission,Account');
    expect(result.putsFile.content).toContain('MSFT');
    expect(result.putsFile.content).toContain('Sell'); // quantity < 0
  });

  it('should download export files and trigger download links', () => {
    // Set up jsdom
    document.body.innerHTML = '';
    const clickMock = jest.fn();
    const realCreateElement = document.createElement.bind(document);
    const createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tag: any) => {
      if (tag === 'a') {
        const el = realCreateElement(tag);
        Object.defineProperty(el, 'click', { value: clickMock });
        return el;
      }
      return realCreateElement(tag);
    });
    // Define global.URL.createObjectURL if not present
    const originalCreateObjectURL = global.URL.createObjectURL;
    global.URL.createObjectURL = jest.fn(() => 'blob:url');
    const originalRevokeObjectURL = global.URL.revokeObjectURL; // Store original revokeObjectURL
    global.URL.revokeObjectURL = jest.fn(); // Mock revokeObjectURL

    // Mock setTimeout to call immediately
    jest.useFakeTimers();

    // Call downloadExportFiles
    ninjaTraderExportService.downloadExportFiles(
      { name: 'calls.csv', content: 'calls-content' },
      { name: 'puts.csv', content: 'puts-content' }
    );

    // Fast-forward timers
    jest.runAllTimers();

    // Check that links were created and clicked twice (for calls and puts)
    expect(clickMock).toHaveBeenCalledTimes(2);
    expect(document.querySelectorAll('a').length).toBe(0); // Should be removed after click

    // Restore mocks and timers
    createElementSpy.mockRestore();
    if (originalCreateObjectURL) {
      global.URL.createObjectURL = originalCreateObjectURL;
    } else {
      delete (global.URL as any).createObjectURL;
    }
    if (originalRevokeObjectURL) { // Restore original revokeObjectURL
      global.URL.revokeObjectURL = originalRevokeObjectURL;
    } else {
      delete (global.URL as any).revokeObjectURL;
    }
    jest.useRealTimers();
  });
}); 