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
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getTrades, initDatabase } from '../services/DatabaseService';
import { OptionStrategy } from '../types/options';
import CumulativePnlChart from '../components/visualizations/CumulativePnlChart';
import { calculateCurrentVolatilityRegime, VolatilityRegime } from '../services/MarketAnalysisService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { trainHMMModel, predictHMMRegimes } from '../services/HMMService'; // Import HMM service functions and types
var AITradeAnalysis = function () {
    var _a = useState([]), trades = _a[0], setTrades = _a[1];
    var _b = useState(true), loading = _b[0], setLoading = _b[1];
    var _c = useState(null), error = _c[0], setError = _c[1];
    var _d = useState(VolatilityRegime.UNKNOWN), currentMarketRegime = _d[0], setCurrentMarketRegime = _d[1];
    var _e = useState([]), regimeHistory = _e[0], setRegimeHistory = _e[1];
    // State for HMM inputs
    var _f = useState('SPY'), hmmSymbol = _f[0], setHmmSymbol = _f[1];
    var _g = useState('2024-12-01'), hmmStartDate = _g[0], setHmmStartDate = _g[1]; // Default to match CSV date range
    var _h = useState('2024-12-30'), hmmEndDate = _h[0], setHmmEndDate = _h[1]; // Default to match CSV date range
    var _j = useState(null), hmmTradeDataFile = _j[0], setHmmTradeDataFile = _j[1];
    var _k = useState(null), hmmMarketDataFile = _k[0], setHmmMarketDataFile = _k[1];
    var _l = useState(null), hmmTradeDataContent = _l[0], setHmmTradeDataContent = _l[1];
    // State for HMM outputs and status
    var _m = useState(false), hmmLoading = _m[0], setHmmLoading = _m[1];
    var _o = useState(null), hmmError = _o[0], setHmmError = _o[1];
    var _p = useState(null), hmmTrainStatus = _p[0], setHmmTrainStatus = _p[1];
    var _q = useState(null), hmmPredictedRegimes = _q[0], setHmmPredictedRegimes = _q[1];
    // New state for market data file path
    var marketDataFileInputRef = useRef(null);
    var tradeDataFileInputRef = useRef(null);
    useEffect(function () {
        var loadTradesAndAnalyseRegime = function () { return __awaiter(void 0, void 0, void 0, function () {
            var fetchedTrades, formattedTrades, priceSeriesForRegime, currentRegimeCalc, historyPoints, regimeConfig, calculatedHistory, startCalcIndex, k, historicalPricesUpToK, regimeAtK, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, 4, 5]);
                        setLoading(true);
                        return [4 /*yield*/, initDatabase()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, getTrades()];
                    case 2:
                        fetchedTrades = _a.sent();
                        formattedTrades = fetchedTrades.map(function (t) { return (__assign(__assign({}, t), { id: String(t.id), symbol: String(t.symbol), putCall: t.putCall, strike: Number(t.strikePrice), expiry: new Date(t.expiryDate), quantity: Number(t.quantity), premium: Number(t.tradePrice), openDate: new Date(t.tradeDate), closeDate: t.closeDate ? new Date(t.closeDate) : undefined, closePremium: t.closePremium ? Number(t.closePremium) : undefined, strategy: t.strategy || OptionStrategy.OTHER, commission: Number(t.commission) || 0, tradePL: Number(t.netAmount) || 0, status: t.openCloseIndicator === 'C' ? 'Closed' : 'Open' })); });
                        setTrades(formattedTrades);
                        priceSeriesForRegime = formattedTrades
                            .filter(function (t) { return t.status === 'Closed' && t.closeDate != null && typeof t.closePremium === 'number'; })
                            .map(function (t) { return ({ date: new Date(t.closeDate), price: t.closePremium }); })
                            .sort(function (a, b) { return a.date.getTime() - b.date.getTime(); });
                        if (priceSeriesForRegime.length > 0) {
                            currentRegimeCalc = calculateCurrentVolatilityRegime(priceSeriesForRegime);
                            setCurrentMarketRegime(currentRegimeCalc);
                            historyPoints = 30;
                            regimeConfig = { windowSize: 20, lowPercentile: 25, highPercentile: 75, minDataForPercentile: 30 };
                            calculatedHistory = [];
                            startCalcIndex = Math.max(regimeConfig.windowSize, priceSeriesForRegime.length - historyPoints);
                            for (k = startCalcIndex; k < priceSeriesForRegime.length; k++) {
                                historicalPricesUpToK = priceSeriesForRegime.slice(0, k + 1);
                                if (historicalPricesUpToK.length >= regimeConfig.windowSize + 1) {
                                    regimeAtK = calculateCurrentVolatilityRegime(historicalPricesUpToK, regimeConfig);
                                    calculatedHistory.push({
                                        date: priceSeriesForRegime[k].date.toISOString().split('T')[0],
                                        regimeValue: regimeToNumericValue(regimeAtK),
                                        regimeLabel: regimeAtK,
                                    });
                                }
                            }
                            // If history is longer than 30 points due to startCalcIndex logic, take the last 30.
                            setRegimeHistory(calculatedHistory.slice(-historyPoints));
                        }
                        else {
                            setCurrentMarketRegime(VolatilityRegime.UNKNOWN);
                            setRegimeHistory([]);
                        }
                        setError(null);
                        return [3 /*break*/, 5];
                    case 3:
                        err_1 = _a.sent();
                        console.error("Error loading trades or calculating regime:", err_1);
                        setError('Failed to load trade data or calculate market regime.');
                        setCurrentMarketRegime(VolatilityRegime.UNKNOWN);
                        setRegimeHistory([]);
                        return [3 /*break*/, 5];
                    case 4:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        loadTradesAndAnalyseRegime();
    }, []);
    // Handlers for file input changes
    var handleTradeDataFileChange = function (event) {
        var _a;
        var file = (_a = event.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (file) {
            setHmmTradeDataFile(file);
            // Read the file content
            var reader = new FileReader();
            reader.onload = function (e) {
                var _a;
                var content = (_a = e.target) === null || _a === void 0 ? void 0 : _a.result;
                if (typeof content === 'string') {
                    setHmmTradeDataContent(content);
                }
            };
            reader.readAsText(file); // Read as text assuming CSV
        }
        else {
            setHmmTradeDataFile(null);
            setHmmTradeDataContent(null);
        }
    };
    var handleMarketDataFileChange = function (event) {
        var _a;
        var file = (_a = event.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (file) {
            setHmmMarketDataFile(file);
        }
        else {
            setHmmMarketDataFile(null);
        }
    };
    // Handler for HMM training button click
    var handleTrainHMM = function () { return __awaiter(void 0, void 0, void 0, function () {
        var requestBody, response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setHmmLoading(true);
                    setHmmError(null);
                    setHmmTrainStatus('Training...');
                    requestBody = {
                        symbol: hmmSymbol,
                        startDate: hmmStartDate,
                        endDate: hmmEndDate,
                        // Pass the raw market data content if available, otherwise file path
                        market_data_filepath: hmmMarketDataFile ? hmmMarketDataFile.name : undefined,
                        // Pass the raw trade data content if available, otherwise file path
                        trade_data: hmmTradeDataContent || undefined, // Pass raw content
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, trainHMMModel(requestBody)];
                case 2:
                    response = _a.sent();
                    setHmmTrainStatus(response.message);
                    console.log('HMM Training successful:', response);
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error during HMM model training:', error_1);
                    setHmmError("Training failed: ".concat(error_1.message));
                    setHmmTrainStatus('Training failed.');
                    return [3 /*break*/, 5];
                case 4:
                    setHmmLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    // Handler for HMM prediction button click
    var handlePredictHMM = function () { return __awaiter(void 0, void 0, void 0, function () {
        var requestBody, response, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setHmmLoading(true);
                    setHmmError(null);
                    setHmmPredictedRegimes(null); // Clear previous predictions
                    requestBody = {
                        symbol: hmmSymbol,
                        startDate: hmmStartDate,
                        endDate: hmmEndDate,
                        // Pass the raw market data content if available, otherwise file path
                        market_data_filepath: hmmMarketDataFile ? hmmMarketDataFile.name : undefined,
                        // Pass the raw trade data content if available, otherwise file path
                        trade_data: hmmTradeDataContent || undefined, // Pass raw content
                        return_probabilities: true, // Request probabilities for visualization
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, predictHMMRegimes(requestBody)];
                case 2:
                    response = _a.sent();
                    setHmmPredictedRegimes(response);
                    console.log('HMM Prediction successful:', response);
                    return [3 /*break*/, 5];
                case 3:
                    error_2 = _a.sent();
                    console.error('Failed to predict HMM regimes:', error_2);
                    setHmmError(error_2.message || 'An error occurred during prediction.');
                    return [3 /*break*/, 5];
                case 4:
                    setHmmLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var summaryMetrics = useMemo(function () {
        if (trades.length === 0)
            return null;
        var totalPL = 0;
        var winningTrades = 0;
        var losingTrades = 0;
        var totalProfit = 0;
        var totalLoss = 0;
        var pnlByStrategy = {};
        var closedTrades = trades.filter(function (t) { return t.status === 'Closed' && t.tradePL !== undefined; });
        closedTrades.forEach(function (trade) {
            var pl = trade.tradePL;
            totalPL += pl;
            if (pl > 0) {
                winningTrades++;
                totalProfit += pl;
            }
            else if (pl < 0) {
                losingTrades++;
                totalLoss += pl;
            }
            var strategyKey = trade.strategy || OptionStrategy.OTHER;
            if (!pnlByStrategy[strategyKey]) {
                pnlByStrategy[strategyKey] = { totalPL: 0, count: 0 };
            }
            pnlByStrategy[strategyKey].totalPL += pl;
            pnlByStrategy[strategyKey].count++;
        });
        var totalClosedTrades = winningTrades + losingTrades;
        var winRate = totalClosedTrades > 0 ? (winningTrades / totalClosedTrades) * 100 : 0;
        var averageProfit = winningTrades > 0 ? totalProfit / winningTrades : 0;
        var averageLoss = losingTrades > 0 ? totalLoss / losingTrades : 0;
        return {
            totalTrades: trades.length,
            totalPL: totalPL,
            winRate: winRate,
            winningTrades: winningTrades,
            losingTrades: losingTrades,
            averageProfit: averageProfit,
            averageLoss: averageLoss,
            pnlByStrategy: pnlByStrategy,
        };
    }, [trades]);
    // Helper for regime styling
    var getRegimeClasses = function (regime) {
        switch (regime) {
            case VolatilityRegime.HIGH: return 'text-red-700 bg-red-100 border-red-300';
            case VolatilityRegime.MEDIUM: return 'text-yellow-700 bg-yellow-100 border-yellow-300';
            case VolatilityRegime.LOW: return 'text-green-700 bg-green-100 border-green-300';
            default: return 'text-gray-700 bg-gray-100 border-gray-300';
        }
    };
    var regimeToNumericValue = function (regime) {
        switch (regime) {
            case VolatilityRegime.HIGH: return 3;
            case VolatilityRegime.MEDIUM: return 2;
            case VolatilityRegime.LOW: return 1;
            default: return 0;
        }
    };
    // Helper to map HMM regime labels to numeric values for chart
    var hmmRegimeLabelToNumericValue = function (label) {
        switch (label) {
            case 'HighVol': return 3;
            case 'MediumVol': return 2;
            case 'LowVol': return 1;
            default: return 0; // Map unknown or other labels to 0
        }
    };
    // Prepare HMM prediction data for the chart
    var hmmChartData = useMemo(function () {
        if (!hmmPredictedRegimes || !hmmPredictedRegimes.regimeHistory)
            return [];
        return hmmPredictedRegimes.regimeHistory.map(function (item) { return ({
            date: item.date,
            regimeLabel: item.regime,
            regimeValue: hmmRegimeLabelToNumericValue(item.regime),
        }); });
    }, [hmmPredictedRegimes]);
    return (<div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4">AI Trade Analysis</h1>
      
      {loading &&
            <div className="p-4 border rounded shadow-sm bg-white text-center">
          <p className="text-lg text-gray-500">Loading trade data...</p>
        </div>}
      {error &&
            <div className="p-4 border rounded shadow-sm bg-red-100 text-red-700">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>}

      {/* Filter Controls - Placeholder */}
      <div className="p-4 border rounded shadow-sm bg-white">
        <h2 className="text-xl font-semibold mb-3">Analysis Inputs</h2> {/* Updated heading */}
        
        {/* Input Fields for HMM */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4"> {/* Grid for inputs */}
          <div>
            <label htmlFor="hmmSymbol" className="block text-sm font-medium text-gray-700">Symbol</label>
            <input type="text" id="hmmSymbol" value={hmmSymbol} onChange={function (e) { return setHmmSymbol(e.target.value); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
          </div>
          <div>
            <label htmlFor="hmmStartDate" className="block text-sm font-medium text-gray-700">Start Date</label>
            <input type="date" id="hmmStartDate" value={hmmStartDate} onChange={function (e) { return setHmmStartDate(e.target.value); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
          </div>
          <div>
            <label htmlFor="hmmEndDate" className="block text-sm font-medium text-gray-700">End Date</label>
            <input type="date" id="hmmEndDate" value={hmmEndDate} onChange={function (e) { return setHmmEndDate(e.target.value); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"/>
          </div>
          <div className="md:col-span-3"> {/* Span across columns for full width */}
             <label htmlFor="hmmTradeDataFile" className="block text-sm font-medium text-gray-700">Trade Data CSV File (Optional)</label>
             <div className="flex items-center space-x-2 mt-1">
               <button type="button" onClick={function () { var _a; return (_a = tradeDataFileInputRef.current) === null || _a === void 0 ? void 0 : _a.click(); }} className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                 Choose File
               </button>
               <span className="text-sm text-gray-500 truncate">
                 {hmmTradeDataFile ? hmmTradeDataFile.name : 'No file chosen'}
               </span>
               {/* Hidden file input */}
               <input type="file" ref={tradeDataFileInputRef} onChange={handleTradeDataFileChange} className="hidden" accept=".csv" // Specify accepted file types
    />
             </div>
              {/* Note about file path vs content in browser */}
              <p className="mt-1 text-xs text-gray-500">
                Note: In a web browser, only the file name is shown. The backend needs access to the file content or path.
              </p>
           </div>
           <div className="md:col-span-3"> {/* Span across columns for full width */}
             <label htmlFor="hmmMarketDataFile" className="block text-sm font-medium text-gray-700">Market Data CSV File (Optional)</label>
             <div className="flex items-center space-x-2 mt-1">
               <button type="button" onClick={function () { var _a; return (_a = marketDataFileInputRef.current) === null || _a === void 0 ? void 0 : _a.click(); }} className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                 Choose File
               </button>
               <span className="text-sm text-gray-500 truncate">
                 {hmmMarketDataFile ? hmmMarketDataFile.name : 'No file chosen'}
               </span>
               {/* Hidden file input */}
               <input type="file" ref={marketDataFileInputRef} onChange={handleMarketDataFileChange} className="hidden" accept=".csv" // Specify accepted file types
    />
             </div>
              {/* Note about file path vs content in browser */}
              <p className="mt-1 text-xs text-gray-500">
                Note: In a web browser, only the file name is shown. The backend needs access to the file content or path.
              </p>
           </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4"> {/* Flex container for buttons */}
          <button onClick={handleTrainHMM} disabled={hmmLoading} // Disable while loading
     className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
            {hmmLoading && hmmTrainStatus === null ? 'Training...' : 'Train HMM Model'} {/* Update button text based on loading/status */}
          </button>
          <button onClick={handlePredictHMM} disabled={hmmLoading} // Disable while loading
     className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
            {hmmLoading && hmmTrainStatus !== null ? 'Predicting...' : 'Predict Regimes'} {/* Update button text based on loading/status */}
          </button>
        </div>

        {/* HMM Status and Results Area */}
        {(hmmLoading || hmmError || hmmTrainStatus || hmmPredictedRegimes) && (<div className="mt-4 p-3 border rounded bg-gray-50">
            {hmmLoading && <p className="text-blue-600">Loading HMM results...</p>}
            {hmmError && <p className="text-red-600">Error: {hmmError}</p>}
            {hmmTrainStatus && !hmmLoading && <p className="text-green-600">Training Status: {hmmTrainStatus}</p>} {/* Show training status after completion */}
            
            {/* Placeholder for Predicted Regimes Visualization */}
            {hmmPredictedRegimes && hmmChartData.length > 0 && (<div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">HMM Predicted Regimes</h3>
                     {/* TODO: Add a chart or table to visualize hmmPredictedRegimes */}
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={hmmChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3"/>
                        <XAxis dataKey="date" tick={{ fontSize: 10 }}/>
                        <YAxis tickFormatter={function (value) {
                    if (value === 3)
                        return 'HighVol';
                    if (value === 2)
                        return 'MediumVol';
                    if (value === 1)
                        return 'LowVol';
                    return 'N/A';
                }} domain={[0, 3.5]} // Slightly above max value
             ticks={[0, 1, 2, 3]} tick={{ fontSize: 10 }}/>
                        {/* @ts-ignore - recharts types are strict, formatter is functionally correct */}
                        <Tooltip formatter={function (value, name, props) { return [props.payload.regimeLabel, 'Regime']; }}/>
                        <Bar dataKey="regimeValue" name="Regime" fill="#8884d8">
                           {/* Add custom cell rendering for color if desired, later */}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                 </div>)}
          </div>)}

      </div>

      {/* Data Panels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trade Data Summary Panel */}
        {summaryMetrics && !loading && !error && (<div className="p-4 border rounded shadow-sm bg-white">
            <h2 className="text-xl font-semibold mb-3">Trade Data Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><span className="font-medium">Total Trades:</span> {summaryMetrics.totalTrades}</div>
              <div><span className="font-medium">Total P&L:</span> ${summaryMetrics.totalPL.toFixed(2)}</div>
              <div><span className="font-medium">Win Rate:</span> {summaryMetrics.winRate.toFixed(1)}%</div>
              <div><span className="font-medium">Winning Trades:</span> {summaryMetrics.winningTrades}</div>
              <div><span className="font-medium">Losing Trades:</span> {summaryMetrics.losingTrades}</div>
              <div><span className="font-medium">Avg Profit:</span> ${summaryMetrics.averageProfit.toFixed(2)}</div>
              <div><span className="font-medium">Avg Loss:</span> ${summaryMetrics.averageLoss.toFixed(2)}</div>
            </div>
            <h3 className="text-lg font-semibold mt-4 mb-2">P&L by Strategy:</h3>
            <ul className="list-disc pl-5">
              {Object.entries(summaryMetrics.pnlByStrategy).map(function (_a) {
                var strategy = _a[0], data = _a[1];
                return (<li key={strategy}>{strategy}: ${data.totalPL.toFixed(2)} ({data.count} trades)</li>);
            })}
            </ul>
          </div>)}

        {/* Market Regime Panel - Added */}
        {!loading && !error && (<div className="p-4 border rounded shadow-sm bg-white">
            <h2 className="text-xl font-semibold mb-3">Market Volatility Regime</h2>
            <div className={"p-3 rounded text-center border ".concat(getRegimeClasses(currentMarketRegime))}>
              <span className="font-bold text-lg">{currentMarketRegime}</span>
            </div>
            {regimeHistory.length > 0 && (<div className="mt-4">
                <h3 className="text-md font-semibold mb-2">Regime History (Last {regimeHistory.length} Trade Points)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={regimeHistory} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }}/>
                    <YAxis tickFormatter={function (value) {
                    if (value === 3)
                        return 'High';
                    if (value === 2)
                        return 'Medium';
                    if (value === 1)
                        return 'Low';
                    return 'N/A';
                }} domain={[0, 3.5]} // Slightly above max value
             ticks={[0, 1, 2, 3]} tick={{ fontSize: 10 }}/>
                    {/* @ts-ignore - recharts types are strict, formatter is functionally correct */}
                    <Tooltip formatter={function (value, name, props) { return [props.payload.regimeLabel, 'Regime']; }}/>
                    <Bar dataKey="regimeValue" name="Regime" fill="#8884d8">
                       {/* Add custom cell rendering for color if desired, later */}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>)}
             {regimeHistory.length === 0 && currentMarketRegime === VolatilityRegime.UNKNOWN && (<p className="text-gray-500 mt-3 text-sm">Not enough historical trade data to determine regime or history.</p>)}
          </div>)}
      </div>

      {/* Interactive Visualizations Panel */}
      <div className="p-4 border rounded shadow-sm bg-white mt-6"> {/* Added mt-6 for spacing */}
        <h2 className="text-xl font-semibold mb-3">Visualizations & Insights</h2>
        {!loading && !error && trades.length > 0 && (<CumulativePnlChart trades={trades}/>)}
        {!loading && !error && trades.length === 0 && (<p className="text-gray-500">No trade data available to display visualizations.</p>)}
      </div>

    </div>);
};
export default AITradeAnalysis;
