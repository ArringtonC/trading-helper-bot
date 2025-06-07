/**
 * Log data to the console with a label
 * @param label The label for the data
 * @param data The data to log
 */
export function debugLog(label, data) {
    console.log("[DEBUG] ".concat(label, ":"), data);
}
/**
 * Check if trades exist in localStorage and log them
 */
export function checkTradesInLocalStorage() {
    var tradesJson = localStorage.getItem('trades');
    debugLog('Trades in localStorage', tradesJson ? JSON.parse(tradesJson) : 'No trades found');
    var portfoliosJson = localStorage.getItem('options_portfolios');
    debugLog('Portfolios in localStorage', portfoliosJson ? JSON.parse(portfoliosJson) : 'No portfolios found');
}
/**
 * Clear all trades from localStorage
 */
export function clearTradesFromLocalStorage() {
    localStorage.removeItem('trades');
    localStorage.removeItem('options_portfolios');
    console.log('Trades and portfolios cleared from localStorage');
}
