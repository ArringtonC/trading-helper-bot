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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import React, { useState, useEffect, useMemo } from 'react';
import { HeatMapGrid } from 'react-grid-heatmap';
import { getHeatmapData } from '../../services/DatabaseService'; // Import data fetching function
import { transformDataForHeatmap } from '../../utils/heatmapUtils'; // Import transformation function and type
var HeatMapComponent = function () {
    var _a = useState([]), allHeatmapData = _a[0], setAllHeatmapData = _a[1];
    var _b = useState(''), startDate = _b[0], setStartDate = _b[1];
    var _c = useState(''), endDate = _c[0], setEndDate = _c[1];
    var _d = useState([]), selectedSymbols = _d[0], setSelectedSymbols = _d[1];
    var _e = useState([]), availableSymbols = _e[0], setAvailableSymbols = _e[1];
    var _f = useState(true), isLoading = _f[0], setIsLoading = _f[1];
    var _g = useState(null), error = _g[0], setError = _g[1];
    useEffect(function () {
        var fetchData = function () { return __awaiter(void 0, void 0, void 0, function () {
            var rawData, symbols, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setIsLoading(true);
                        setError(null);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, getHeatmapData()];
                    case 2:
                        rawData = _a.sent();
                        setAllHeatmapData(rawData);
                        symbols = Array.from(new Set(rawData.map(function (item) { return item.symbol; }))).sort();
                        setAvailableSymbols(symbols);
                        // Initially select all symbols
                        setSelectedSymbols(symbols);
                        return [3 /*break*/, 5];
                    case 3:
                        err_1 = _a.sent();
                        console.error("Error fetching heatmap data:", err_1);
                        setError("Failed to load heatmap data.");
                        return [3 /*break*/, 5];
                    case 4:
                        setIsLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        fetchData();
    }, []); // Empty dependency array means this runs once on mount
    // Apply filtering and transform data whenever filters or source data changes
    var transformedHeatmapData = useMemo(function () {
        if (!allHeatmapData || allHeatmapData.length === 0) {
            return { xLabels: [], yLabels: [], data: [] };
        }
        var filteredData = allHeatmapData;
        // Filter by date range
        if (startDate) {
            filteredData = filteredData.filter(function (item) { return item.date >= startDate; });
        }
        if (endDate) {
            filteredData = filteredData.filter(function (item) { return item.date <= endDate; });
        }
        // Filter by selected symbols
        if (selectedSymbols.length > 0) {
            // Filter only if selectedSymbols is not empty. If empty, show all (or none depending on desired behavior - showing all when array is empty is more intuitive for a multiselect)
            var symbolsToFilter_1 = new Set(selectedSymbols); // Use a Set for faster lookups
            filteredData = filteredData.filter(function (item) { return symbolsToFilter_1.has(item.symbol); });
        }
        // If selectedSymbols is empty, we should probably show no data, or handle this state.
        // Current logic will show all data if selectedSymbols was initially all symbols and then cleared.
        // Let's refine: if selectedSymbols is empty, show no data.
        if (selectedSymbols.length === 0 && availableSymbols.length > 0 && allHeatmapData.length > 0) {
            filteredData = []; // Show no data if explicitly no symbols are selected
        }
        return transformDataForHeatmap(filteredData);
    }, [allHeatmapData, startDate, endDate, selectedSymbols, availableSymbols]);
    // Helper to handle symbol selection changes (basic toggle for now)
    var handleSymbolToggle = function (symbol) {
        setSelectedSymbols(function (prev) {
            return prev.includes(symbol) ? prev.filter(function (s) { return s !== symbol; }) : __spreadArray(__spreadArray([], prev, true), [symbol], false);
        });
    };
    return (<div className="p-4 border rounded shadow-md bg-white">
      <h2 className="text-lg font-semibold mb-4">Daily P&L Heatmap</h2>

      {/* Filter Controls */}
      <div className="mb-4 flex space-x-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date:</label>
          <input type="date" id="startDate" value={startDate} onChange={function (e) { return setStartDate(e.target.value); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"/>
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date:</label>
          <input type="date" id="endDate" value={endDate} onChange={function (e) { return setEndDate(e.target.value); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"/>
        </div>
         {/* Basic symbol filter - could be a multiselect dropdown later */}
         <div>
             <label className="block text-sm font-medium text-gray-700">Symbols:</label>
             <div className="mt-1 flex flex-wrap gap-2">
                 {availableSymbols.map(function (symbol) { return (<button key={symbol} onClick={function () { return handleSymbolToggle(symbol); }} className={"px-3 py-1 border rounded-full text-sm ".concat(selectedSymbols.includes(symbol) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800')}>
                         {symbol}
                     </button>); })}
                  {availableSymbols.length === 0 && !isLoading && !error && allHeatmapData.length > 0 && (<p className="text-sm text-gray-500">No symbols available for filtering.</p>)}
                   {isLoading && <p className="text-sm text-gray-500">Loading symbols...</p>}
                   {error && <p className="text-sm text-red-500">Error loading symbols.</p>}
             </div>
         </div>
      </div>

      {isLoading && <p>Loading heatmap data...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!isLoading && !error && transformedHeatmapData && transformedHeatmapData.xLabels.length > 0 ? (<HeatMapGrid xLabels={transformedHeatmapData.xLabels} yLabels={transformedHeatmapData.yLabels} data={transformedHeatmapData.data} cellStyle={function (_x, _y, value) { return ({
                background: value === 0 ? '#f0f0f0' :
                    value > 0 ? "rgba(0, 180, 0, ".concat(Math.min(value / 200, 1), ")") :
                        "rgba(255, 50, 50, ".concat(Math.min(Math.abs(value) / 200, 1), ")"),
                fontSize: '11px',
                color: Math.abs(value) > 100 ? 'white' : '#333',
                border: '1px solid #eee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
            }); }} cellHeight="35px" xLabelsStyle={function (index) { return ({
                color: '#555',
                fontSize: '11px',
                width: '80px'
            }); }} yLabelsStyle={function (index) { return ({
                color: '#555',
                fontSize: '11px',
                textAlign: 'right',
                paddingRight: '5px',
                width: '50px'
            }); }} cellRender={function (x, y, value) {
                var symbol = transformedHeatmapData.yLabels[y];
                var date = transformedHeatmapData.xLabels[x];
                var pnl = value.toFixed(2);
                var tooltipText = "Symbol: ".concat(symbol, "\nDate: ").concat(date, "\nP&L: $").concat(pnl);
                return <div title={tooltipText} className="w-full h-full flex items-center justify-center">{pnl}</div>;
            }} onClick={function (x, y) {
                var symbol = transformedHeatmapData.yLabels[y];
                var date = transformedHeatmapData.xLabels[x];
                var pnl = transformedHeatmapData.data[y][x];
                console.log("Clicked Cell - Symbol: ".concat(symbol, ", Date: ").concat(date, ", P&L: ").concat(pnl.toFixed(2)));
            }}/>) : (!isLoading && !error && <p>No closed trade data available for heatmap based on current filters.</p>)}
    </div>);
};
export default HeatMapComponent;
