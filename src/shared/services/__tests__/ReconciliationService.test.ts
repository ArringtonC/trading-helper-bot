import { reconcilePnlData, DailyPnlData, ReconciliationInput, ReconciliationResult } from '../ReconciliationService';

describe('ReconciliationService - reconcilePnlData', () => {
  const sourceA_base: DailyPnlData[] = [
    { symbol: 'AAPL', date: '2024-01-01', pnl: 100 },
    { symbol: 'AAPL', date: '2024-01-02', pnl: -50 },
    { symbol: 'TSLA', date: '2024-01-01', pnl: 200 },
  ];

  const sourceB_base: DailyPnlData[] = [
    { symbol: 'AAPL', date: '2024-01-01', pnl: 100 },
    { symbol: 'AAPL', date: '2024-01-02', pnl: -50 },
    { symbol: 'TSLA', date: '2024-01-01', pnl: 200 },
  ];

  test('should return no discrepancies for identical data', () => {
    const input: ReconciliationInput = { sourceA: [...sourceA_base], sourceB: [...sourceB_base] };
    const result: ReconciliationResult = reconcilePnlData(input);

    expect(result.discrepancies).toHaveLength(0);
    expect(result.reconciledItems).toHaveLength(3);
    expect(result.summary.countSourceA).toBe(3);
    expect(result.summary.countSourceB).toBe(3);
    expect(result.summary.countReconciled).toBe(3);
    expect(result.summary.countDiscrepancies).toBe(0);
    expect(result.summary.countMissingSourceA).toBe(0);
    expect(result.summary.countMissingSourceB).toBe(0);
    expect(result.summary.countPnlMismatch).toBe(0);
  });

  test('should detect missing item in Source A', () => {
    const sourceA_missing = sourceA_base.filter(item => item.symbol !== 'TSLA'); // Remove TSLA
    const input: ReconciliationInput = { sourceA: sourceA_missing, sourceB: [...sourceB_base] };
    const result: ReconciliationResult = reconcilePnlData(input);

    expect(result.discrepancies).toHaveLength(1);
    expect(result.discrepancies[0].type).toBe('Missing_SourceA');
    expect(result.discrepancies[0].symbol).toBe('TSLA');
    expect(result.discrepancies[0].date).toBe('2024-01-01');
    expect(result.discrepancies[0].pnlSourceA).toBeNull();
    expect(result.discrepancies[0].pnlSourceB).toBe(200);
    expect(result.reconciledItems).toHaveLength(2);
    expect(result.summary.countMissingSourceA).toBe(1);
    expect(result.summary.countDiscrepancies).toBe(1);
    expect(result.summary.countSourceA).toBe(2);
    expect(result.summary.countSourceB).toBe(3);
  });

  test('should detect missing item in Source B (extra in Source A)', () => {
    const sourceB_missing = sourceB_base.filter(item => item.date !== '2024-01-02'); // Remove AAPL 01-02
    const input: ReconciliationInput = { sourceA: [...sourceA_base], sourceB: sourceB_missing };
    const result: ReconciliationResult = reconcilePnlData(input);

    expect(result.discrepancies).toHaveLength(1);
    expect(result.discrepancies[0].type).toBe('Missing_SourceB');
    expect(result.discrepancies[0].symbol).toBe('AAPL');
    expect(result.discrepancies[0].date).toBe('2024-01-02');
    expect(result.discrepancies[0].pnlSourceA).toBe(-50);
    expect(result.discrepancies[0].pnlSourceB).toBeNull();
    expect(result.reconciledItems).toHaveLength(2);
    expect(result.summary.countMissingSourceB).toBe(1);
    expect(result.summary.countDiscrepancies).toBe(1);
    expect(result.summary.countSourceA).toBe(3);
    expect(result.summary.countSourceB).toBe(2);
  });

  test('should detect P&L mismatch outside tolerance', () => {
    const sourceB_mismatch = [...sourceB_base];
    sourceB_mismatch[1] = { ...sourceB_mismatch[1], pnl: -50.1 }; // AAPL 01-02 pnl differs
    const input: ReconciliationInput = { sourceA: [...sourceA_base], sourceB: sourceB_mismatch };
    const result: ReconciliationResult = reconcilePnlData(input, 0.05); // Tolerance 0.05

    expect(result.discrepancies).toHaveLength(1);
    expect(result.discrepancies[0].type).toBe('Pnl_Mismatch');
    expect(result.discrepancies[0].symbol).toBe('AAPL');
    expect(result.discrepancies[0].date).toBe('2024-01-02');
    expect(result.discrepancies[0].pnlSourceA).toBe(-50);
    expect(result.discrepancies[0].pnlSourceB).toBe(-50.1);
    expect(result.discrepancies[0].difference).toBeCloseTo(0.1);
    expect(result.reconciledItems).toHaveLength(2);
    expect(result.summary.countPnlMismatch).toBe(1);
    expect(result.summary.countDiscrepancies).toBe(1);
  });

   test('should NOT detect P&L mismatch within tolerance', () => {
    const sourceB_mismatch = [...sourceB_base];
    sourceB_mismatch[1] = { ...sourceB_mismatch[1], pnl: -50.005 }; // AAPL 01-02 pnl differs slightly
    const input: ReconciliationInput = { sourceA: [...sourceA_base], sourceB: sourceB_mismatch };
    const result: ReconciliationResult = reconcilePnlData(input); // Default tolerance 0.01

    expect(result.discrepancies).toHaveLength(0);
    expect(result.reconciledItems).toHaveLength(3);
    expect(result.summary.countPnlMismatch).toBe(0);
    expect(result.summary.countDiscrepancies).toBe(0);
  });

  test('should handle empty source arrays', () => {
    const inputAEmpty: ReconciliationInput = { sourceA: [], sourceB: [...sourceB_base] };
    const resultAEmpty = reconcilePnlData(inputAEmpty);
    expect(resultAEmpty.discrepancies).toHaveLength(3);
    resultAEmpty.discrepancies.forEach(d => expect(d.type).toBe('Missing_SourceA'));
    expect(resultAEmpty.reconciledItems).toHaveLength(0);
    expect(resultAEmpty.summary.countMissingSourceA).toBe(3);
    expect(resultAEmpty.summary.countSourceA).toBe(0);
    expect(resultAEmpty.summary.countSourceB).toBe(3);

    const inputBEmpty: ReconciliationInput = { sourceA: [...sourceA_base], sourceB: [] };
    const resultBEmpty = reconcilePnlData(inputBEmpty);
    expect(resultBEmpty.discrepancies).toHaveLength(3);
    resultBEmpty.discrepancies.forEach(d => expect(d.type).toBe('Missing_SourceB'));
    expect(resultBEmpty.reconciledItems).toHaveLength(0);
    expect(resultBEmpty.summary.countMissingSourceB).toBe(3);
    expect(resultBEmpty.summary.countSourceA).toBe(3);
    expect(resultBEmpty.summary.countSourceB).toBe(0);

    const inputBothEmpty: ReconciliationInput = { sourceA: [], sourceB: [] };
    const resultBothEmpty = reconcilePnlData(inputBothEmpty);
    expect(resultBothEmpty.discrepancies).toHaveLength(0);
    expect(resultBothEmpty.reconciledItems).toHaveLength(0);
    expect(resultBothEmpty.summary.countDiscrepancies).toBe(0);
    expect(resultBothEmpty.summary.countSourceA).toBe(0);
    expect(resultBothEmpty.summary.countSourceB).toBe(0);
  });

  test('should handle mix of discrepancies', () => {
    const sourceA_mixed: DailyPnlData[] = [
      { symbol: 'AAPL', date: '2024-01-01', pnl: 100 },    // Match
      // Missing AAPL 2024-01-02
      { symbol: 'TSLA', date: '2024-01-01', pnl: 199.9 },   // PNL Mismatch
      { symbol: 'MSFT', date: '2024-01-01', pnl: 50 },    // Extra in A (Missing B)
    ];
    const sourceB_mixed: DailyPnlData[] = [
      { symbol: 'AAPL', date: '2024-01-01', pnl: 100 },    // Match
      { symbol: 'AAPL', date: '2024-01-02', pnl: -50 },    // Missing in A
      { symbol: 'TSLA', date: '2024-01-01', pnl: 200 },    // PNL Mismatch
      // Missing MSFT 2024-01-01
    ];
    const input: ReconciliationInput = { sourceA: sourceA_mixed, sourceB: sourceB_mixed };
    const result = reconcilePnlData(input);

    expect(result.reconciledItems).toHaveLength(1);
    expect(result.reconciledItems[0].symbol).toBe('AAPL');
    expect(result.reconciledItems[0].date).toBe('2024-01-01');

    expect(result.discrepancies).toHaveLength(3);

    const missingA = result.discrepancies.find(d => d.type === 'Missing_SourceA');
    expect(missingA).toBeDefined();
    expect(missingA?.symbol).toBe('AAPL');
    expect(missingA?.date).toBe('2024-01-02');

    const missingB = result.discrepancies.find(d => d.type === 'Missing_SourceB');
    expect(missingB).toBeDefined();
    expect(missingB?.symbol).toBe('MSFT');
    expect(missingB?.date).toBe('2024-01-01');

    const mismatch = result.discrepancies.find(d => d.type === 'Pnl_Mismatch');
    expect(mismatch).toBeDefined();
    expect(mismatch?.symbol).toBe('TSLA');
    expect(mismatch?.date).toBe('2024-01-01');
    expect(mismatch?.difference).toBeCloseTo(-0.1);

    // Check summary
    expect(result.summary.countSourceA).toBe(3);
    expect(result.summary.countSourceB).toBe(3);
    expect(result.summary.countReconciled).toBe(1);
    expect(result.summary.countDiscrepancies).toBe(3);
    expect(result.summary.countMissingSourceA).toBe(1);
    expect(result.summary.countMissingSourceB).toBe(1);
    expect(result.summary.countPnlMismatch).toBe(1);
  });
}); 