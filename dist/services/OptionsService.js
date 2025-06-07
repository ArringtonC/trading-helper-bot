import { calculateTradePL } from '../types/options';
var OptionsService = /** @class */ (function () {
    function OptionsService() {
    }
    /**
     * Get portfolio for an account
     */
    OptionsService.getPortfolio = function (accountId) {
        if (!this.portfolios.has(accountId)) {
            this.portfolios.set(accountId, {
                id: accountId,
                accountId: accountId,
                trades: []
            });
        }
        return this.portfolios.get(accountId);
    };
    /**
     * Calculate portfolio statistics
     */
    OptionsService.calculateStats = function (accountId) {
        var portfolio = this.getPortfolio(accountId);
        var trades = portfolio.trades;
        var closedTrades = trades.filter(function (t) { return t.closeDate; });
        var openTrades = trades.filter(function (t) { return !t.closeDate; });
        var winningTrades = closedTrades.filter(function (t) { return calculateTradePL(t) > 0; });
        var losingTrades = closedTrades.filter(function (t) { return calculateTradePL(t) < 0; });
        var totalWins = winningTrades.reduce(function (sum, t) { return sum + calculateTradePL(t); }, 0);
        var totalLosses = Math.abs(losingTrades.reduce(function (sum, t) { return sum + calculateTradePL(t); }, 0));
        var totalPL = trades.reduce(function (sum, t) { return sum + calculateTradePL(t); }, 0);
        // Calculate average days to expiry for open positions
        var totalDaysToExpiry = openTrades.reduce(function (sum, trade) {
            var days = (trade.expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
            return sum + days;
        }, 0);
        return {
            totalTrades: trades.length,
            openTrades: trades.length - closedTrades.length,
            closedTrades: closedTrades.length,
            winningTrades: winningTrades.length,
            losingTrades: losingTrades.length,
            winRate: closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0,
            averageWin: winningTrades.length > 0 ? totalWins / winningTrades.length : 0,
            averageLoss: losingTrades.length > 0 ? totalLosses / losingTrades.length : 0,
            totalPL: totalPL,
            averageDaysToExpiry: openTrades.length > 0 ? totalDaysToExpiry / openTrades.length : 0
        };
    };
    OptionsService.portfolios = new Map();
    return OptionsService;
}());
export { OptionsService };
