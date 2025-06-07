import riskService, { RiskDataPayload } from '../RiskService';

describe('RiskService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    riskService.disconnect(); // Ensure clean state
  });

  afterEach(() => {
    riskService.disconnect();
    jest.useRealTimers();
  });

  it('should emit mock risk data and notify subscribers', () => {
    const callback = jest.fn();
    riskService.connect(); // No URL, should start mock data
    riskService.onRiskData(callback);
    // Fast-forward time to trigger mock data emission
    jest.advanceTimersByTime(2000);
    expect(callback).toHaveBeenCalled();
    const data: RiskDataPayload = callback.mock.calls[0][0];
    expect(typeof data.delta).toBe('number');
    expect(typeof data.theta).toBe('number');
    expect(typeof data.gamma).toBe('number');
    expect(typeof data.vega).toBe('number');
    expect(typeof data.timestamp).toBe('string');
  });

  it('should allow unsubscribing from risk data', () => {
    const callback = jest.fn();
    riskService.connect();
    const unsubscribe = riskService.onRiskData(callback);
    unsubscribe();
    jest.advanceTimersByTime(2000);
    expect(callback).not.toHaveBeenCalled();
  });

  it('should stop emitting data and clear subscribers on disconnect', () => {
    const callback = jest.fn();
    riskService.connect();
    riskService.onRiskData(callback);
    jest.advanceTimersByTime(2000);
    expect(callback).toHaveBeenCalledTimes(1);
    riskService.disconnect();
    callback.mockClear();
    jest.advanceTimersByTime(4000);
    expect(callback).not.toHaveBeenCalled();
    // Should not receive further data after disconnect
  });
}); 