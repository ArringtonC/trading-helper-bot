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
import { OptionStrategy } from '../types/options';
// Test data with various edge cases
var testTrades = [
    {
        id: '1',
        symbol: 'SPY',
        putCall: 'CALL',
        strike: 400,
        expiry: new Date('2024-12-20'),
        quantity: 1,
        premium: 5.25,
        openDate: new Date('2024-01-01'),
        closeDate: new Date('2024-01-15'),
        strategy: OptionStrategy.LONG_CALL,
        commission: 0.65,
        tradePL: 100
    },
    {
        id: '2',
        symbol: 'AAPL',
        putCall: 'PUT',
        strike: 180,
        expiry: new Date('2024-11-15'),
        quantity: -2,
        premium: 0,
        openDate: new Date('2024-01-02'),
        strategy: OptionStrategy.SHORT_PUT,
        commission: 0.65,
        tradePL: 100 // Same P&L as first trade
    },
    {
        id: '3',
        symbol: 'TSLA',
        putCall: 'CALL',
        strike: 250,
        expiry: new Date('2024-10-18'),
        quantity: 1,
        premium: 0,
        openDate: new Date('2024-01-03'),
        strategy: OptionStrategy.LONG_CALL,
        commission: 0.65,
        tradePL: -50
    }
];
describe('Trade Sorting', function () {
    // Helper function to mimic the component's sort function
    var sortTrades = function (trades, field, direction) {
        return __spreadArray([], trades, true).sort(function (a, b) {
            var comparison = 0;
            switch (field) {
                case 'symbol':
                    comparison = a.symbol.localeCompare(b.symbol);
                    break;
                case 'type':
                    comparison = a.putCall.localeCompare(b.putCall);
                    break;
                case 'strike':
                    comparison = a.strike - b.strike;
                    break;
                case 'expiry':
                    comparison = new Date(a.expiry).getTime() - new Date(b.expiry).getTime();
                    break;
                case 'quantity':
                    comparison = a.quantity - b.quantity;
                    break;
                case 'premium':
                    comparison = (a.premium || 0) - (b.premium || 0);
                    break;
                case 'openDate':
                    comparison = new Date(a.openDate).getTime() - new Date(b.openDate).getTime();
                    break;
                case 'closeDate':
                    if (!a.closeDate && !b.closeDate)
                        return 0;
                    if (!a.closeDate)
                        return 1;
                    if (!b.closeDate)
                        return -1;
                    comparison = new Date(a.closeDate).getTime() - new Date(b.closeDate).getTime();
                    break;
                case 'pl':
                case 'pnl':
                    comparison = (a.tradePL || 0) - (b.tradePL || 0);
                    break;
            }
            return direction === 'asc' ? comparison : -comparison;
        });
    };
    describe('Basic Sorting', function () {
        test('sorts by symbol ascending', function () {
            var sorted = sortTrades(testTrades, 'symbol', 'asc');
            expect(sorted.map(function (t) { return t.symbol; })).toEqual(['AAPL', 'SPY', 'TSLA']);
        });
        test('sorts by symbol descending', function () {
            var sorted = sortTrades(testTrades, 'symbol', 'desc');
            expect(sorted.map(function (t) { return t.symbol; })).toEqual(['TSLA', 'SPY', 'AAPL']);
        });
        test('sorts by P&L ascending', function () {
            var sorted = sortTrades(testTrades, 'pl', 'asc');
            expect(sorted.map(function (t) { return t.tradePL; })).toEqual([-50, 100, 100]);
        });
        test('sorts by P&L descending', function () {
            var sorted = sortTrades(testTrades, 'pl', 'desc');
            expect(sorted.map(function (t) { return t.tradePL; })).toEqual([100, 100, -50]);
        });
    });
    describe('Edge Cases', function () {
        test('handles undefined values in premium sorting', function () {
            var sorted = sortTrades(testTrades, 'premium', 'asc');
            expect(sorted.map(function (t) { return t.premium; })).toEqual([undefined, undefined, 5.25]);
        });
        test('maintains stable sort for equal P&L values', function () {
            var sorted = sortTrades(testTrades, 'pl', 'asc');
            var equalPLTrades = sorted.filter(function (t) { return t.tradePL === 100; });
            expect(equalPLTrades).toHaveLength(2);
            expect(Number(equalPLTrades[0].id)).toBeLessThan(Number(equalPLTrades[1].id));
        });
    });
    describe('Performance', function () {
        test('handles large datasets efficiently', function () {
            // Generate 1000 trades
            var largeTrades = Array.from({ length: 1000 }, function (_, i) { return (__assign(__assign({}, testTrades[0]), { id: "".concat(i), tradePL: Math.random() * 1000 })); });
            var start = performance.now();
            sortTrades(largeTrades, 'pl', 'desc');
            var end = performance.now();
            expect(end - start).toBeLessThan(100); // Should sort in under 100ms
        });
    });
});
