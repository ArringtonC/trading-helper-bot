var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { AccountService } from './AccountService';
import { OptionService } from './OptionService';
import { ProjectionService } from './ProjectionService';
/**
 * Service for exporting account and trading data
 */
var ExportService = /** @class */ (function () {
    function ExportService() {
    }
    /**
     * Export the current capabilities and state of the system
     * @returns CSV string containing capabilities data
     */
    ExportService.exportCapabilities = function () {
        var accounts = AccountService.getAccounts();
        var csv = 'Trading Helper Bot - Capabilities Export\n';
        csv += "Generated: ".concat(new Date().toLocaleDateString(), " ").concat(new Date().toLocaleTimeString(), "\n\n");
        // System Overview
        csv += 'System Overview\n';
        csv += 'Module,Status,Features,Limitations\n';
        csv += "Account Management,Implemented,\"Account dashboard, balance tracking, projections\",".concat(accounts.length, " account(s)\n");
        csv += 'Options Trading,Implemented,"Trade tracking, P&L calculation, IBKR import",Basic analytics only\n';
        csv += 'Futures Trading,Planned,"Coming in June",Not yet implemented\n';
        csv += 'AI Strategies,Planned,"Coming in September",Not yet implemented\n\n';
        // Account Information
        csv += 'Account Information\n';
        csv += 'ID,Name,Type,Balance,Last Updated\n';
        accounts.forEach(function (account) {
            csv += "".concat(account.id, ",").concat(account.name, ",").concat(account.type, ",").concat(account.balance.toFixed(2), ",").concat(account.lastUpdated.toLocaleDateString(), "\n");
        });
        csv += '\n';
        // Options Trading Statistics
        csv += 'Options Trading Statistics\n';
        csv += 'Account ID,Open Positions,Closed Positions,Win Rate,Total P&L\n';
        accounts.forEach(function (account) {
            var optionsPortfolio = OptionService.getOptionsPortfolio(account.id);
            var stats = OptionService.calculateStats(optionsPortfolio);
            csv += "".concat(account.id, ",").concat(stats.openTrades, ",").concat(stats.closedTrades, ",").concat((stats.winRate * 100).toFixed(1), "%,$").concat(stats.totalPL.toFixed(2), "\n");
        });
        csv += '\n';
        // Open Positions
        csv += 'Open Positions\n';
        csv += 'Account ID,Symbol,Type,Strike,Expiry,Quantity,Premium,Open Date,Days to Expiry\n';
        accounts.forEach(function (account) {
            var openPositions = OptionService.getOpenPositions(account.id);
            openPositions.forEach(function (position) {
                var daysToExpiry = Math.max(0, Math.floor((position.expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
                csv += "".concat(account.id, ",").concat(position.symbol, ",").concat(position.putCall, ",").concat(position.strike.toFixed(2), ",").concat(position.expiry.toLocaleDateString(), ",").concat(position.quantity, ",").concat((position.premium || 0).toFixed(2), ",").concat(position.openDate.toLocaleDateString(), ",").concat(daysToExpiry, "\n");
            });
        });
        csv += '\n';
        // Technical Specifications
        csv += 'Technical Specifications\n';
        csv += 'Component,Specification\n';
        csv += 'Frontend,React with TypeScript\n';
        csv += 'UI Framework,Tailwind CSS\n';
        csv += 'Charts,Recharts\n';
        csv += 'Storage,Local storage (browser-based)\n';
        csv += 'Version,April 2025 Release\n\n';
        // Known Limitations
        csv += 'Known Limitations\n';
        csv += 'Limitation\n';
        csv += 'No real-time market data integration\n';
        csv += 'Local storage only (no cloud synchronization)\n';
        csv += 'Basic options analytics (no Greeks)\n';
        csv += 'No multi-leg strategy builder\n';
        csv += 'Limited historical analysis\n';
        return csv;
    };
    /**
     * Export option trades for an account
     * @param accountId Account ID to export trades for
     * @returns CSV string containing option trades
     */
    ExportService.exportOptionTrades = function (accountId) {
        var account = AccountService.getAccountById(accountId);
        if (!account) {
            throw new Error("Account ".concat(accountId, " not found"));
        }
        var openPositions = OptionService.getOpenPositions(accountId);
        var closedPositions = OptionService.getClosedPositions(accountId);
        var allTrades = __spreadArray(__spreadArray([], openPositions, true), closedPositions, true);
        var csv = "Option Trades Export - ".concat(account.name, "\n");
        csv += "Generated: ".concat(new Date().toLocaleDateString(), " ").concat(new Date().toLocaleTimeString(), "\n\n");
        csv += 'ID,Symbol,Type,Strike,Expiry,Quantity,Premium,Open Date,Close Date,Close Premium,P&L,Strategy,Notes\n';
        allTrades.forEach(function (trade) {
            var pl = OptionService.calculatePL(trade);
            csv += "".concat(trade.id, ",").concat(trade.symbol, ",").concat(trade.putCall, ",").concat(trade.strike.toFixed(2), ",").concat(trade.expiry.toLocaleDateString(), ",").concat(trade.quantity, ",").concat((trade.premium || 0).toFixed(2), ",").concat(trade.openDate.toLocaleDateString(), ",").concat(trade.closeDate ? trade.closeDate.toLocaleDateString() : '', ",").concat(trade.closePremium ? trade.closePremium.toFixed(2) : '', ",").concat(pl.toFixed(2), ",").concat(trade.strategy || '', ",").concat(trade.notes || '', "\n");
        });
        return csv;
    };
    /**
     * Export account projections
     * @param accountId Account ID to export projections for
     * @returns CSV string containing projections
     */
    ExportService.exportProjections = function (accountId) {
        var account = AccountService.getAccountById(accountId);
        if (!account) {
            throw new Error("Account ".concat(accountId, " not found"));
        }
        var projections = ProjectionService.calculateYearlyProjections(account);
        var csv = "Account Projections Export - ".concat(account.name, "\n");
        csv += "Generated: ".concat(new Date().toLocaleDateString(), " ").concat(new Date().toLocaleTimeString(), "\n\n");
        csv += 'Month,Projected Balance\n';
        projections.forEach(function (projection) {
            csv += "".concat(projection.month, ",").concat(projection.balance.toFixed(2), "\n");
        });
        return csv;
    };
    /**
     * Generate a downloadable file from CSV content
     * @param csvContent CSV content as string
     * @param fileName Name for the download file
     */
    ExportService.downloadCSV = function (csvContent, fileName) {
        var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    return ExportService;
}());
export { ExportService };
// Export open positions to CSV
export var exportOpenPositionsToCSV = function (portfolios) {
    var csv = 'Account,Symbol,Type,Strike,Expiry,Quantity,Premium,OpenDate,DaysToExpiry\n';
    Object.entries(portfolios).forEach(function (_a) {
        var accountId = _a[0], account = _a[1];
        account.trades
            .filter(function (position) { return !position.closeDate; })
            .forEach(function (position) {
            var daysToExpiry = Math.max(0, Math.floor((position.expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
            csv += "".concat(account.id, ",").concat(position.symbol, ",").concat(position.putCall, ",").concat(position.strike.toFixed(2), ",").concat(position.expiry.toLocaleDateString(), ",").concat(position.quantity, ",").concat((position.premium || 0).toFixed(2), ",").concat(position.openDate.toLocaleDateString(), ",").concat(daysToExpiry, "\n");
        });
    });
    return csv;
};
// Export trades to CSV
export var exportTradesToCSV = function (trades) {
    var csv = 'ID,Symbol,Type,Strike,Expiry,Quantity,Premium,OpenDate,CloseDate,ClosePremium,P&L,Strategy,Notes\n';
    trades.forEach(function (trade) {
        var pl = OptionService.calculatePL(trade);
        csv += "".concat(trade.id, ",").concat(trade.symbol, ",").concat(trade.putCall, ",").concat(trade.strike.toFixed(2), ",").concat(trade.expiry.toLocaleDateString(), ",").concat(trade.quantity, ",").concat((trade.premium || 0).toFixed(2), ",").concat(trade.openDate.toLocaleDateString(), ",").concat(trade.closeDate ? trade.closeDate.toLocaleDateString() : '', ",").concat(trade.closePremium ? trade.closePremium.toFixed(2) : '', ",").concat(pl.toFixed(2), ",").concat(trade.strategy || '', ",").concat(trade.notes || '', "\n");
    });
    return csv;
};
