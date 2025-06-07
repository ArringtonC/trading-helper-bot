"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reconcilePnlData = reconcilePnlData;
const DEFAULT_TOLERANCE = 0.01;
/**
 * Compares two sets of daily P&L data and identifies discrepancies.
 */
function reconcilePnlData(input, tolerance = DEFAULT_TOLERANCE) {
    const mapA = new Map();
    const mapB = new Map();
    const allKeys = new Set();
    // Populate maps and collect all unique keys (Symbol_Date)
    input.sourceA.forEach(item => {
        const key = `${item.symbol}_${item.date}`;
        mapA.set(key, item);
        allKeys.add(key);
    });
    input.sourceB.forEach(item => {
        const key = `${item.symbol}_${item.date}`;
        mapB.set(key, item);
        allKeys.add(key);
    });
    const reconciledItems = [];
    const discrepancies = [];
    let countMissingSourceA = 0;
    let countMissingSourceB = 0;
    let countPnlMismatch = 0;
    // Iterate through all unique keys and compare
    allKeys.forEach(key => {
        const itemA = mapA.get(key);
        const itemB = mapB.get(key);
        const [symbol, date] = key.split('_'); // Extract symbol and date from key
        if (itemA && itemB) {
            // Item exists in both sources
            const difference = Math.abs(itemA.pnl - itemB.pnl);
            if (difference > tolerance) {
                // P&L Mismatch
                discrepancies.push({
                    symbol,
                    date,
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
                symbol,
                date,
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
                symbol,
                date,
                type: 'Missing_SourceA',
                pnlSourceA: null,
                pnlSourceB: itemB.pnl,
                difference: -itemB.pnl, // Negative difference indicates missing local data
            });
            countMissingSourceA++;
        }
    });
    return {
        reconciledItems,
        discrepancies,
        summary: {
            countSourceA: input.sourceA.length,
            countSourceB: input.sourceB.length,
            countReconciled: reconciledItems.length,
            countDiscrepancies: discrepancies.length,
            countMissingSourceA,
            countMissingSourceB,
            countPnlMismatch,
        },
    };
}
// Future functions can be added here, e.g., for fetching data from specific sources
// or for reconciling at a different granularity (like trade level). 
