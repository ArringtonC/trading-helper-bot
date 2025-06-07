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
import React, { useEffect, useState } from 'react';
import MetricCard from './MetricCard';
import { getAggregatePL, getTradeCounts, getClosedTrades } from '../../services/DatabaseService'; // Import getClosedTrades
// import { NormalizedTradeData } from '../../types/trade'; // Not directly needed here
var DashboardPnlCards = function () {
    var _a = useState(null), realizedPL = _a[0], setRealizedPL = _a[1];
    var _b = useState(null), winRate = _b[0], setWinRate = _b[1];
    var _c = useState(null), openTradesCount = _c[0], setOpenTradesCount = _c[1];
    var _d = useState(null), closedTradesCount = _d[0], setClosedTradesCount = _d[1];
    var _e = useState(true), isLoading = _e[0], setIsLoading = _e[1];
    var _f = useState(null), error = _f[0], setError = _f[1];
    useEffect(function () {
        var fetchData = function () { return __awaiter(void 0, void 0, void 0, function () {
            var aggregatePL, tradeCounts, closedTrades, winningClosedTrades, calculatedWinRate, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setIsLoading(true);
                        setError(null);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, 6, 7]);
                        return [4 /*yield*/, getAggregatePL()];
                    case 2:
                        aggregatePL = _a.sent();
                        setRealizedPL(aggregatePL.realizedPL);
                        return [4 /*yield*/, getTradeCounts()];
                    case 3:
                        tradeCounts = _a.sent();
                        setOpenTradesCount(tradeCounts.open);
                        setClosedTradesCount(tradeCounts.closed);
                        return [4 /*yield*/, getClosedTrades()];
                    case 4:
                        closedTrades = _a.sent();
                        if (closedTrades.length > 0) {
                            winningClosedTrades = closedTrades.filter(function (trade) { return trade.netAmount > 0; }).length;
                            calculatedWinRate = (winningClosedTrades / closedTrades.length) * 100;
                            setWinRate(calculatedWinRate);
                        }
                        else {
                            setWinRate(0); // Win rate is 0 if no closed trades
                        }
                        return [3 /*break*/, 7];
                    case 5:
                        err_1 = _a.sent();
                        console.error('Error fetching dashboard data:', err_1);
                        setError('Failed to load dashboard data.');
                        return [3 /*break*/, 7];
                    case 6:
                        setIsLoading(false);
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        }); };
        fetchData();
    }, []); // Empty dependency array means this effect runs once after initial render
    // Mock data for Unrealized P&L for now
    var unrealizedPL = 0; // Placeholder
    return (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <MetricCard title="Total Realized P&L" value={realizedPL !== null ? realizedPL.toFixed(2) : null} unit="$" isLoading={isLoading}/>
      <MetricCard title="Win Rate" value={winRate !== null ? winRate.toFixed(1) : null} unit="%" isLoading={isLoading}/>
      <MetricCard title="Open Trades" value={openTradesCount} isLoading={isLoading}/>
      <MetricCard title="Closed Trades" value={closedTradesCount} isLoading={isLoading}/>
      {/* Metric card for Unrealized P&L (using mock data for now) */}
       <MetricCard title="Total Unrealized P&L" value={unrealizedPL.toFixed(2)} unit="$" isLoading={isLoading} // Still show loading state while other data loads
    />

      {error && <div className="text-red-500">{error}</div>} {/* Display error message */}
    </div>);
};
export default DashboardPnlCards;
