var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { formatDateForDisplay } from '../utils/dateUtils';
var NinjaTraderExportService = /** @class */ (function () {
    function NinjaTraderExportService() {
    }
    /**
     * Generate filename for export based on strategy and date
     */
    NinjaTraderExportService.prototype.generateFilename = function (strategyName, optionType) {
        var currentDate = formatDateForDisplay(new Date(), 'yyyyMMdd');
        var typeSuffix = optionType === 'CALL' ? 'calls' : 'puts';
        return "".concat(strategyName, "_").concat(typeSuffix, "_").concat(currentDate, ".csv");
    };
    /**
     * Convert trades to NinjaTrader format
     * Separate handling for calls and puts
     */
    NinjaTraderExportService.prototype.formatTradesForNinjaTrader = function (trades, optionType) {
        // NinjaTrader headers
        var headers = [
            "Date", "Time", "Symbol", "Strike", "Expiry", "Type",
            "Action", "Quantity", "Price", "Commission", "Account"
        ].join(",");
        // Filter trades by option type
        var filteredTrades = trades.filter(function (trade) { return trade.putCall === optionType; });
        // Format each trade according to NinjaTrader requirements
        var rows = filteredTrades.map(function (trade) {
            var _a = new Date(trade.openDate).toISOString().split('T'), date = _a[0], time = _a[1];
            return [
                date,
                time.substring(0, 8),
                trade.symbol,
                trade.strike,
                formatDateForDisplay(new Date(trade.expiry), 'yyyyMMdd'),
                trade.putCall === 'CALL' ? 'Call' : 'Put',
                trade.quantity > 0 ? 'Buy' : 'Sell',
                Math.abs(trade.quantity),
                trade.premium,
                trade.commission || 0,
                'Default' // Using default account since OptionTrade doesn't have account property
            ].join(",");
        });
        return __spreadArray([headers], rows, true).join("\n");
    };
    /**
     * Export options trades to NinjaTrader format
     */
    NinjaTraderExportService.prototype.exportToNinjaTrader = function (trades, options) {
        // Filter trades by date range if provided
        var filteredTrades = __spreadArray([], trades, true);
        if (options.dateRange) {
            var _a = options.dateRange, start_1 = _a.start, end_1 = _a.end;
            filteredTrades = filteredTrades.filter(function (trade) {
                var tradeDate = new Date(trade.openDate);
                return tradeDate >= start_1 && tradeDate <= end_1;
            });
        }
        // Only include closed trades if specified
        if (!options.includeClosedTrades) {
            filteredTrades = filteredTrades.filter(function (trade) { return !trade.closeDate; });
        }
        // Create separate files for calls and puts
        var callsContent = this.formatTradesForNinjaTrader(filteredTrades, 'CALL');
        var putsContent = this.formatTradesForNinjaTrader(filteredTrades, 'PUT');
        return {
            callsFile: {
                name: this.generateFilename(options.strategyName, 'CALL'),
                content: callsContent
            },
            putsFile: {
                name: this.generateFilename(options.strategyName, 'PUT'),
                content: putsContent
            }
        };
    };
    /**
     * Trigger download of export files
     */
    NinjaTraderExportService.prototype.downloadExportFiles = function (callsFile, putsFile) {
        // Helper function to trigger download
        var triggerDownload = function (filename, content) {
            var blob = new Blob([content], { type: 'text/csv' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };
        // Download both files
        triggerDownload(callsFile.name, callsFile.content);
        setTimeout(function () {
            triggerDownload(putsFile.name, putsFile.content);
        }, 100); // Small delay to avoid browser blocking multiple downloads
    };
    return NinjaTraderExportService;
}());
export { NinjaTraderExportService };
var ninjaTraderExportService = new NinjaTraderExportService();
export default ninjaTraderExportService;
