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
import React, { useState } from 'react';
import ninjaTraderExportService from '../services/NinjaTraderExportService';
import { formatDateForDisplay } from '../utils/dateUtils';
var NinjaTraderExport = function (_a) {
    var _b = _a.trades, trades = _b === void 0 ? [] : _b, strategyNames = _a.strategyNames;
    // State for export options
    var _c = useState(false), showOptions = _c[0], setShowOptions = _c[1];
    var _d = useState({
        strategyName: strategyNames.length > 0 ? strategyNames[0] : 'DefaultStrategy',
        includeClosedTrades: false,
    }), exportOptions = _d[0], setExportOptions = _d[1];
    var _e = useState(null), dateRange = _e[0], setDateRange = _e[1];
    var _f = useState(false), isExporting = _f[0], setIsExporting = _f[1];
    var _g = useState(null), error = _g[0], setError = _g[1];
    // Handle export options changes
    var handleOptionsChange = function (field, value) {
        setExportOptions(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[field] = value, _a)));
        });
    };
    // Handle date range changes
    var handleDateRangeChange = function (range) {
        setDateRange(range);
        setExportOptions(function (prev) { return (__assign(__assign({}, prev), { dateRange: range || undefined })); });
    };
    // Execute export
    var handleExport = function () { return __awaiter(void 0, void 0, void 0, function () {
        var exportFiles;
        return __generator(this, function (_a) {
            try {
                setIsExporting(true);
                setError(null);
                exportFiles = ninjaTraderExportService.exportToNinjaTrader(trades, exportOptions);
                // Trigger downloads
                ninjaTraderExportService.downloadExportFiles(exportFiles.callsFile, exportFiles.putsFile);
                // Show success message
                alert("Export successful! Files downloaded: ".concat(exportFiles.callsFile.name, " and ").concat(exportFiles.putsFile.name));
            }
            catch (error) {
                setError(error instanceof Error ? error.message : "An error occurred during export");
            }
            finally {
                setIsExporting(false);
            }
            return [2 /*return*/];
        });
    }); };
    return (<div className="border border-gray-200 rounded-md p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-800">NinjaTrader Export</h3>
        <button className="text-sm px-3 py-1 border rounded hover:bg-gray-50" onClick={function () { return setShowOptions(!showOptions); }}>
          {showOptions ? "Hide Options" : "Show Options"}
        </button>
      </div>

      {showOptions && (<div className="mb-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Strategy Name
            </label>
            <select className="w-full p-2 border rounded" value={exportOptions.strategyName} onChange={function (e) { return handleOptionsChange('strategyName', e.target.value); }}>
              {strategyNames.map(function (name) { return (<option key={name} value={name}>{name}</option>); })}
              {strategyNames.length === 0 && (<option value="DefaultStrategy">Default Strategy</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range (Optional)
            </label>
            <div className="flex space-x-2">
              <input type="date" className="p-2 border rounded" value={(dateRange === null || dateRange === void 0 ? void 0 : dateRange.start) ? formatDateForDisplay(dateRange.start, 'yyyy-MM-dd') : ''} onChange={function (e) {
                var start = e.target.value ? new Date(e.target.value) : null;
                handleDateRangeChange(start ? { start: start, end: (dateRange === null || dateRange === void 0 ? void 0 : dateRange.end) || new Date() } : null);
            }}/>
              <input type="date" className="p-2 border rounded" value={(dateRange === null || dateRange === void 0 ? void 0 : dateRange.end) ? formatDateForDisplay(dateRange.end, 'yyyy-MM-dd') : ''} onChange={function (e) {
                var end = e.target.value ? new Date(e.target.value) : null;
                handleDateRangeChange((dateRange === null || dateRange === void 0 ? void 0 : dateRange.start) ? { start: dateRange.start, end: end || new Date() } : null);
            }}/>
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={exportOptions.includeClosedTrades} onChange={function (e) { return handleOptionsChange('includeClosedTrades', e.target.checked); }} className="rounded"/>
              <span className="text-sm text-gray-700">Include Closed Trades</span>
            </label>
          </div>
        </div>)}

      {error && (<div className="mb-4 p-2 bg-red-50 text-red-700 rounded">
          {error}
        </div>)}

      <button className={"w-full py-2 px-4 rounded ".concat(isExporting
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white')} onClick={handleExport} disabled={isExporting}>
        {isExporting ? 'Exporting...' : 'Export to NinjaTrader'}
      </button>
    </div>);
};
export default NinjaTraderExport;
