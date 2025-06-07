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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { reconcilePnlData } from '../ReconciliationService';
describe('ReconciliationService - reconcilePnlData', function () {
    var sourceA_base = [
        { symbol: 'AAPL', date: '2024-01-01', pnl: 100 },
        { symbol: 'AAPL', date: '2024-01-02', pnl: -50 },
        { symbol: 'TSLA', date: '2024-01-01', pnl: 200 },
    ];
    var sourceB_base = [
        { symbol: 'AAPL', date: '2024-01-01', pnl: 100 },
        { symbol: 'AAPL', date: '2024-01-02', pnl: -50 },
        { symbol: 'TSLA', date: '2024-01-01', pnl: 200 },
    ];
    test('should return no discrepancies for identical data', function () {
        var input = { sourceA: __spreadArray([], sourceA_base, true), sourceB: __spreadArray([], sourceB_base, true) };
        var result = reconcilePnlData(input);
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
    test('should detect missing item in Source A', function () {
        var sourceA_missing = sourceA_base.filter(function (item) { return item.symbol !== 'TSLA'; }); // Remove TSLA
        var input = { sourceA: sourceA_missing, sourceB: __spreadArray([], sourceB_base, true) };
        var result = reconcilePnlData(input);
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
    test('should detect missing item in Source B (extra in Source A)', function () {
        var sourceB_missing = sourceB_base.filter(function (item) { return item.date !== '2024-01-02'; }); // Remove AAPL 01-02
        var input = { sourceA: __spreadArray([], sourceA_base, true), sourceB: sourceB_missing };
        var result = reconcilePnlData(input);
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
    test('should detect P&L mismatch outside tolerance', function () {
        var sourceB_mismatch = __spreadArray([], sourceB_base, true);
        sourceB_mismatch[1] = __assign(__assign({}, sourceB_mismatch[1]), { pnl: -50.1 }); // AAPL 01-02 pnl differs
        var input = { sourceA: __spreadArray([], sourceA_base, true), sourceB: sourceB_mismatch };
        var result = reconcilePnlData(input, 0.05); // Tolerance 0.05
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
    test('should NOT detect P&L mismatch within tolerance', function () {
        var sourceB_mismatch = __spreadArray([], sourceB_base, true);
        sourceB_mismatch[1] = __assign(__assign({}, sourceB_mismatch[1]), { pnl: -50.005 }); // AAPL 01-02 pnl differs slightly
        var input = { sourceA: __spreadArray([], sourceA_base, true), sourceB: sourceB_mismatch };
        var result = reconcilePnlData(input); // Default tolerance 0.01
        expect(result.discrepancies).toHaveLength(0);
        expect(result.reconciledItems).toHaveLength(3);
        expect(result.summary.countPnlMismatch).toBe(0);
        expect(result.summary.countDiscrepancies).toBe(0);
    });
    test('should handle empty source arrays', function () {
        var inputAEmpty = { sourceA: [], sourceB: __spreadArray([], sourceB_base, true) };
        var resultAEmpty = reconcilePnlData(inputAEmpty);
        expect(resultAEmpty.discrepancies).toHaveLength(3);
        resultAEmpty.discrepancies.forEach(function (d) { return expect(d.type).toBe('Missing_SourceA'); });
        expect(resultAEmpty.reconciledItems).toHaveLength(0);
        expect(resultAEmpty.summary.countMissingSourceA).toBe(3);
        expect(resultAEmpty.summary.countSourceA).toBe(0);
        expect(resultAEmpty.summary.countSourceB).toBe(3);
        var inputBEmpty = { sourceA: __spreadArray([], sourceA_base, true), sourceB: [] };
        var resultBEmpty = reconcilePnlData(inputBEmpty);
        expect(resultBEmpty.discrepancies).toHaveLength(3);
        resultBEmpty.discrepancies.forEach(function (d) { return expect(d.type).toBe('Missing_SourceB'); });
        expect(resultBEmpty.reconciledItems).toHaveLength(0);
        expect(resultBEmpty.summary.countMissingSourceB).toBe(3);
        expect(resultBEmpty.summary.countSourceA).toBe(3);
        expect(resultBEmpty.summary.countSourceB).toBe(0);
        var inputBothEmpty = { sourceA: [], sourceB: [] };
        var resultBothEmpty = reconcilePnlData(inputBothEmpty);
        expect(resultBothEmpty.discrepancies).toHaveLength(0);
        expect(resultBothEmpty.reconciledItems).toHaveLength(0);
        expect(resultBothEmpty.summary.countDiscrepancies).toBe(0);
        expect(resultBothEmpty.summary.countSourceA).toBe(0);
        expect(resultBothEmpty.summary.countSourceB).toBe(0);
    });
    test('should handle mix of discrepancies', function () {
        var sourceA_mixed = [
            { symbol: 'AAPL', date: '2024-01-01', pnl: 100 }, // Match
            // Missing AAPL 2024-01-02
            { symbol: 'TSLA', date: '2024-01-01', pnl: 199.9 }, // PNL Mismatch
            { symbol: 'MSFT', date: '2024-01-01', pnl: 50 }, // Extra in A (Missing B)
        ];
        var sourceB_mixed = [
            { symbol: 'AAPL', date: '2024-01-01', pnl: 100 }, // Match
            { symbol: 'AAPL', date: '2024-01-02', pnl: -50 }, // Missing in A
            { symbol: 'TSLA', date: '2024-01-01', pnl: 200 }, // PNL Mismatch
            // Missing MSFT 2024-01-01
        ];
        var input = { sourceA: sourceA_mixed, sourceB: sourceB_mixed };
        var result = reconcilePnlData(input);
        expect(result.reconciledItems).toHaveLength(1);
        expect(result.reconciledItems[0].symbol).toBe('AAPL');
        expect(result.reconciledItems[0].date).toBe('2024-01-01');
        expect(result.discrepancies).toHaveLength(3);
        var missingA = result.discrepancies.find(function (d) { return d.type === 'Missing_SourceA'; });
        expect(missingA).toBeDefined();
        expect(missingA === null || missingA === void 0 ? void 0 : missingA.symbol).toBe('AAPL');
        expect(missingA === null || missingA === void 0 ? void 0 : missingA.date).toBe('2024-01-02');
        var missingB = result.discrepancies.find(function (d) { return d.type === 'Missing_SourceB'; });
        expect(missingB).toBeDefined();
        expect(missingB === null || missingB === void 0 ? void 0 : missingB.symbol).toBe('MSFT');
        expect(missingB === null || missingB === void 0 ? void 0 : missingB.date).toBe('2024-01-01');
        var mismatch = result.discrepancies.find(function (d) { return d.type === 'Pnl_Mismatch'; });
        expect(mismatch).toBeDefined();
        expect(mismatch === null || mismatch === void 0 ? void 0 : mismatch.symbol).toBe('TSLA');
        expect(mismatch === null || mismatch === void 0 ? void 0 : mismatch.date).toBe('2024-01-01');
        expect(mismatch === null || mismatch === void 0 ? void 0 : mismatch.difference).toBeCloseTo(-0.1);
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
