var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import React, { useState, useEffect, useCallback } from 'react';
// Import the service function and the correct type
import { getOverallPnlSummary } from '../../services/DatabaseService';
import eventEmitter from '../../utils/eventEmitter'; // Import event emitter
// Formatting helpers remain the same
var formatCurrency = function (value) {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};
var formatPercent = function (value) {
    // Note: Percentages are currently placeholders (0)
    return "".concat((value * 100).toFixed(2), "%");
};
var PnlCard = function () {
    var _a = useState(null), pnlSummary = _a[0], setPnlSummary = _a[1];
    var _b = useState(true), isLoading = _b[0], setIsLoading = _b[1];
    var _c = useState(null), error = _c[0], setError = _c[1];
    // Wrap data fetching logic in useCallback
    var fetchData = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var summary, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('[DEBUG PnlCard] Fetching P&L summary...'); // Add log
                    setIsLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, getOverallPnlSummary()];
                case 2:
                    summary = _a.sent();
                    console.log('[DEBUG PnlCard] Received summary:', summary); // Add log
                    setPnlSummary(summary);
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _a.sent();
                    console.error("Error fetching P&L summary:", err_1);
                    setError('Failed to load P&L data.');
                    return [3 /*break*/, 5];
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, []); // Empty dependency array for useCallback
    // Effect for initial fetch on mount
    useEffect(function () {
        fetchData();
    }, [fetchData]);
    // Effect for listening to data updates
    useEffect(function () {
        var handleDataUpdate = function () {
            console.log('[DEBUG PnlCard] data-updated event received, refetching P&L...');
            fetchData();
        };
        // Corrected to use 'on' and 'off'
        var unsubscribe = eventEmitter.on('data-updated', handleDataUpdate);
        // Cleanup listener on component unmount
        return function () {
            // Use the returned unsubscribe function directly or call eventEmitter.off
            unsubscribe(); // Or eventEmitter.off('data-updated', handleDataUpdate);
        };
    }, [fetchData]);
    // Loading state
    if (isLoading) {
        return (<div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 md:p-6 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
        </div>
      </div>);
    }
    // Error state
    if (error) {
        return (<div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 md:p-6">
        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Error</h3>
        <p className="text-red-500 dark:text-red-300">{error}</p>
      </div>);
    }
    // Empty/No data state (after loading)
    if (!pnlSummary) {
        return (<div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 md:p-6">
         <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Profit & Loss</h3>
         <p className="text-gray-500 dark:text-gray-400">No P&L data available.</p>
       </div>);
    }
    // Determine positivity for styling
    var isDailyPositive = pnlSummary && pnlSummary.lastDayPnl >= 0;
    var isTotalPositive = pnlSummary && pnlSummary.totalPnl >= 0;
    return (<div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 md:p-6">
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
        Profit & Loss {(pnlSummary === null || pnlSummary === void 0 ? void 0 : pnlSummary.lastDayDate) ? "(as of ".concat(pnlSummary.lastDayDate, ")") : ''}
      </h3>
      
      <div className="space-y-3">
        {/* Daily P&L (Last Recorded Day) */}
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Last Recorded Day P&L</p>
          <div className="flex items-baseline space-x-2">
            <p className={"text-2xl font-bold ".concat(isDailyPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
              {pnlSummary ? formatCurrency(pnlSummary.lastDayPnl) : '...'}
            </p>
            {/* Percentage display can be added back when calculation is implemented */}
            {/* <span className={`text-sm font-medium ${isDailyPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          ({isDailyPositive ? '+' : ''}{formatPercent(pnlSummary.lastDayPnlPercent)})
        </span> */}
          </div>
        </div>

        {/* Total P&L */}
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Realized P&L</p>
           <div className="flex items-baseline space-x-2">
            <p className={"text-xl font-semibold ".concat(isTotalPositive ? 'text-gray-700 dark:text-gray-300' : 'text-red-700 dark:text-red-500')}>
              {pnlSummary ? formatCurrency(pnlSummary.totalPnl) : '...'}
            </p>
            {/* Percentage display can be added back when calculation is implemented */}
             {/* <span className={`text-xs font-medium ${isTotalPositive ? 'text-gray-500 dark:text-gray-400' : 'text-red-600 dark:text-red-400'}`}>
         ({isTotalPositive ? '+' : ''}{formatPercent(pnlSummary.totalPnlPercent)})
       </span> */}
          </div>
        </div>
      </div>

      {/* TODO: Add Detailed View Section */}
      {/* TODO: Add Toggle Button/Link */}

    </div>);
};
export default PnlCard;
