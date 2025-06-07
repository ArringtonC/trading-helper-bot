var DEFAULT_TOLERANCE = 0.01;
/**
 * Compares two sets of daily P&L data and identifies discrepancies.
 */
export function reconcilePnlData(input, tolerance) {
    if (tolerance === void 0) { tolerance = DEFAULT_TOLERANCE; }
    var mapA = new Map();
    var mapB = new Map();
    var allKeys = new Set();
    // Populate maps and collect all unique keys (Symbol_Date)
    input.sourceA.forEach(function (item) {
        var key = "".concat(item.symbol, "_").concat(item.date);
        mapA.set(key, item);
        allKeys.add(key);
    });
    input.sourceB.forEach(function (item) {
        var key = "".concat(item.symbol, "_").concat(item.date);
        mapB.set(key, item);
        allKeys.add(key);
    });
    var reconciledItems = [];
    var discrepancies = [];
    var countMissingSourceA = 0;
    var countMissingSourceB = 0;
    var countPnlMismatch = 0;
    // Iterate through all unique keys and compare
    allKeys.forEach(function (key) {
        var itemA = mapA.get(key);
        var itemB = mapB.get(key);
        var _a = key.split('_'), symbol = _a[0], date = _a[1]; // Extract symbol and date from key
        if (itemA && itemB) {
            // Item exists in both sources
            var difference = Math.abs(itemA.pnl - itemB.pnl);
            if (difference > tolerance) {
                // P&L Mismatch
                discrepancies.push({
                    symbol: symbol,
                    date: date,
                    type: 'Pnl_Mismatch',
                    pnlSourceA: itemA.pnl,
                    pnlSourceB: itemB.pnl,
                    difference: itemA.pnl - itemB.pnl, // Keep the signed difference
                });
                countPnlMismatch++;
            }
            else {
                // Reconciled
                reconciledItems.push(itemA); // Or itemB, they are considered matching
            }
        }
        else if (itemA) {
            // Item only exists in Source A (Missing in Source B)
            discrepancies.push({
                symbol: symbol,
                date: date,
                type: 'Missing_SourceB',
                pnlSourceA: itemA.pnl,
                pnlSourceB: null,
                difference: itemA.pnl,
            });
            countMissingSourceB++;
        }
        else if (itemB) {
            // Item only exists in Source B (Missing in Source A)
            discrepancies.push({
                symbol: symbol,
                date: date,
                type: 'Missing_SourceA',
                pnlSourceA: null,
                pnlSourceB: itemB.pnl,
                difference: -itemB.pnl, // Negative difference indicates missing local data
            });
            countMissingSourceA++;
        }
    });
    return {
        reconciledItems: reconciledItems,
        discrepancies: discrepancies,
        summary: {
            countSourceA: input.sourceA.length,
            countSourceB: input.sourceB.length,
            countReconciled: reconciledItems.length,
            countDiscrepancies: discrepancies.length,
            countMissingSourceA: countMissingSourceA,
            countMissingSourceB: countMissingSourceB,
            countPnlMismatch: countPnlMismatch,
        },
    };
}
// Future functions can be added here, e.g., for fetching data from specific sources
// or for reconciling at a different granularity (like trade level). 
