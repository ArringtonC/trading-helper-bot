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
import { getPositions } from '../services/DatabaseService'; // adjust path if needed
// Format helpers
var formatNumber = function (val, digits) {
    if (digits === void 0) { digits = 2; }
    var num = typeof val === 'number' ? val : parseFloat(val);
    return isNaN(num) ? '0.00' : num.toFixed(digits);
};
var formatPercent = function (val) {
    var num = typeof val === 'number' ? val : parseFloat(val);
    return isNaN(num) ? '0.00%' : "".concat(num.toFixed(2), "%");
};
var PositionsTable = function () {
    var _a = useState([]), positions = _a[0], setPositions = _a[1];
    useEffect(function () {
        (function () { return __awaiter(void 0, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getPositions()];
                    case 1:
                        data = _a.sent();
                        setPositions(data);
                        return [2 /*return*/];
                }
            });
        }); })();
    }, []);
    if (!positions.length) {
        return <p className="text-sm text-gray-500 italic">⚠️ No positions found. Import a positions CSV to see results here.</p>;
    }
    // Add gainLoss and gainLossPercent to each row
    var rowsWithPL = positions.map(function (pos) {
        var marketValue = Number(pos.marketValue);
        var costBasis = Number(pos.costBasis);
        var gainLoss = marketValue - costBasis;
        var gainLossPercent = costBasis !== 0 ? (gainLoss / costBasis) * 100 : 0;
        return __assign(__assign({}, pos), { gainLoss: gainLoss, gainLossPercent: gainLossPercent });
    });
    // Summary calculations
    var summary = rowsWithPL.reduce(function (acc, pos) {
        var _a, _b, _c;
        acc.marketValue += (_a = pos.marketValue) !== null && _a !== void 0 ? _a : 0;
        acc.costBasis += (_b = pos.costBasis) !== null && _b !== void 0 ? _b : 0;
        acc.gain += (_c = pos.gainLoss) !== null && _c !== void 0 ? _c : 0;
        return acc;
    }, { marketValue: 0, costBasis: 0, gain: 0 });
    return (<div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div className="p-4 border rounded shadow-sm bg-white">
          <div className="text-gray-500">Total Market Value</div>
          <div className="text-lg font-semibold">${formatNumber(summary.marketValue)}</div>
        </div>
        <div className="p-4 border rounded shadow-sm bg-white">
          <div className="text-gray-500">Total Cost Basis</div>
          <div className="text-lg font-semibold">${formatNumber(summary.costBasis)}</div>
        </div>
        <div className={"p-4 border rounded shadow-sm ".concat(summary.gain >= 0 ? 'bg-green-50' : 'bg-red-50')}> 
          <div className="text-gray-500">Net Gain / Loss</div>
          <div className="text-lg font-semibold">
            ${formatNumber(summary.gain)} ({formatPercent((summary.gain / (summary.costBasis || 1)) * 100)})
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm table-auto border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">Symbol</th>
              <th className="border px-2 py-1 text-right">Qty</th>
              <th className="border px-2 py-1 text-right">Cost Basis</th>
              <th className="border px-2 py-1 text-right">Market Value</th>
              <th className="border px-2 py-1 text-right">Gain/Loss</th>
              <th className="border px-2 py-1 text-right">Gain/Loss %</th>
            </tr>
          </thead>
          <tbody>
            {rowsWithPL.map(function (pos) { return (<tr key={pos.id}>
                <td className="border px-2 py-1">{pos.symbol}</td>
                <td className="border px-2 py-1 text-right">{formatNumber(pos.quantity, 0)}</td>
                <td className="border px-2 py-1 text-right">${formatNumber(pos.costBasis)}</td>
                <td className="border px-2 py-1 text-right">${formatNumber(pos.marketValue)}</td>
                <td className="border px-2 py-1 text-right" style={{ color: pos.gainLoss >= 0 ? 'green' : 'red' }}>
                  ${formatNumber(pos.gainLoss)}
                </td>
                <td className="border px-2 py-1 text-right" style={{ color: pos.gainLoss >= 0 ? 'green' : 'red' }}>
                  {formatPercent(pos.gainLossPercent)}
                </td>
              </tr>); })}
          </tbody>
        </table>
      </div>
    </div>);
};
export default PositionsTable;
