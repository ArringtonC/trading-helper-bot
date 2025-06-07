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
import React, { useEffect, useState, useCallback, useRef } from 'react';
import Upload from '../components/Upload/Upload';
import PnlCard from '../components/Dashboard/PnlCard';
import HeatmapChart from '../components/Dashboard/HeatmapChart';
import ReconciliationReport from '../components/Reconciliation/ReconciliationReport';
import { getOverallPnlSummary, getDailyPnlHeatmapData, getDailyPnlForReconciliation } from '../services/DatabaseService';
import { reconcilePnlData } from '../services/ReconciliationService';
import eventEmitter from '../utils/eventEmitter';
import riskService from '../services/RiskService';
import GaugeComponent from '../components/visualizations/GaugeComponent';
import { toast } from 'react-toastify';
// Define thresholds for each risk metric
var deltaThresholds = {
    criticalMin: -0.7,
    warningMin: -0.3,
    warningMax: 0.3,
    criticalMax: 0.7,
};
var thetaThresholds = {
    criticalMin: -50, // Large negative theta is bad
    warningMin: -20,
    warningMax: -1, // Theta is usually negative
    criticalMax: 0, // Positive theta is unusual/problematic
};
var gammaThresholds = {
    criticalMin: 0, // Gamma usually positive, very low can be non-ideal
    warningMin: 0.01,
    warningMax: 0.2,
    criticalMax: 0.5, // Very high gamma can be risky
};
var vegaThresholds = {
    criticalMin: 0, // Vega usually positive
    warningMin: 50,
    warningMax: 300,
    criticalMax: 600, // Very high vega can be risky
};
var DashboardPage = function () {
    var _a = useState(null), pnlSummary = _a[0], setPnlSummary = _a[1];
    var _b = useState(true), isLoadingPnl = _b[0], setIsLoadingPnl = _b[1];
    var _c = useState(null), pnlError = _c[0], setPnlError = _c[1];
    var _d = useState(null), heatmapData = _d[0], setHeatmapData = _d[1];
    var _e = useState(true), isLoadingHeatmap = _e[0], setIsLoadingHeatmap = _e[1];
    var _f = useState(null), heatmapError = _f[0], setHeatmapError = _f[1];
    var _g = useState(null), reconciliationResult = _g[0], setReconciliationResult = _g[1];
    var _h = useState(true), isLoadingReconciliation = _h[0], setIsLoadingReconciliation = _h[1];
    var _j = useState(null), reconciliationError = _j[0], setReconciliationError = _j[1];
    // State for Risk Data
    var _k = useState(null), riskData = _k[0], setRiskData = _k[1];
    var _l = useState(true), isLoadingRisk = _l[0], setIsLoadingRisk = _l[1];
    var _m = useState(null), riskError = _m[0], setRiskError = _m[1];
    // Keep track of active alerts to avoid spamming notifications
    var activeAlertsRef = useRef({
        delta: false,
        theta: false,
        gamma: false,
        vega: false,
    });
    var fetchPnlData = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var summary, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoadingPnl(true);
                    setPnlError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, getOverallPnlSummary()];
                case 2:
                    summary = _a.sent();
                    setPnlSummary(summary);
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error fetching PNL summary:', error_1);
                    setPnlError('Failed to load P&L data. ' + (error_1.message || ''));
                    return [3 /*break*/, 4];
                case 4:
                    setIsLoadingPnl(false);
                    return [2 /*return*/];
            }
        });
    }); }, []);
    var fetchHeatmapData = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var data, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoadingHeatmap(true);
                    setHeatmapError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, getDailyPnlHeatmapData()];
                case 2:
                    data = _a.sent();
                    setHeatmapData(data);
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error('Error fetching heatmap data:', error_2);
                    setHeatmapError('Failed to load heatmap data. ' + (error_2.message || ''));
                    return [3 /*break*/, 4];
                case 4:
                    setIsLoadingHeatmap(false);
                    return [2 /*return*/];
            }
        });
    }); }, []);
    var fetchReconciliationData = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var dbData, reconciliationInput, result, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoadingReconciliation(true);
                    setReconciliationError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, getDailyPnlForReconciliation()];
                case 2:
                    dbData = _a.sent();
                    console.log("[DEBUG DashboardPage] Fetched ".concat(dbData.length, " daily PNL records for reconciliation."));
                    reconciliationInput = {
                        sourceA: dbData,
                        sourceB: dbData
                    };
                    result = reconcilePnlData(reconciliationInput);
                    console.log('[DEBUG DashboardPage] Reconciliation result:', result);
                    setReconciliationResult(result);
                    return [3 /*break*/, 4];
                case 3:
                    error_3 = _a.sent();
                    console.error('Error fetching/running reconciliation:', error_3);
                    setReconciliationError('Failed to run reconciliation. ' + (error_3.message || ''));
                    setReconciliationResult(null);
                    return [3 /*break*/, 4];
                case 4:
                    setIsLoadingReconciliation(false);
                    return [2 /*return*/];
            }
        });
    }); }, []);
    useEffect(function () {
        fetchPnlData();
        fetchHeatmapData();
        fetchReconciliationData();
        // Connect to Risk Service
        console.log('[DashboardPage] Connecting to RiskService...');
        setIsLoadingRisk(true);
        riskService.connect();
        var unsubscribeRisk = riskService.onRiskData(function (data) {
            setRiskData(data);
            setIsLoadingRisk(false);
            setRiskError(null);
        });
        var handleDataUpdate = function () {
            console.log('DashboardPage: data-updated event received, refetching data...');
            fetchPnlData();
            fetchHeatmapData();
            fetchReconciliationData();
        };
        var unsubscribeEvents = eventEmitter.on('data-updated', handleDataUpdate);
        return function () {
            unsubscribeEvents();
            unsubscribeRisk();
            riskService.disconnect();
            console.log('[DashboardPage] Disconnected from RiskService.');
        };
    }, [fetchPnlData, fetchHeatmapData, fetchReconciliationData]);
    // Effect for handling risk data alerts
    useEffect(function () {
        if (!riskData)
            return;
        var checkAndNotify = function (metricName, value, thresholds, friendlyName) {
            var isCritical = value < thresholds.criticalMin || value > thresholds.criticalMax;
            if (isCritical && !activeAlertsRef.current[metricName]) {
                toast.error("".concat(friendlyName, " CRITICAL! Value: ").concat(value.toFixed(2), ". Thresholds: ").concat(thresholds.criticalMin, "/").concat(thresholds.criticalMax), { toastId: "critical-".concat(metricName) });
                activeAlertsRef.current[metricName] = true;
            }
            else if (!isCritical && activeAlertsRef.current[metricName]) {
                toast.success("".concat(friendlyName, " Recovered. Value: ").concat(value.toFixed(2), ". "), { toastId: "recovered-".concat(metricName) });
                activeAlertsRef.current[metricName] = false;
            }
        };
        checkAndNotify('delta', riskData.delta, deltaThresholds, 'Delta');
        checkAndNotify('theta', riskData.theta, thetaThresholds, 'Theta');
        checkAndNotify('gamma', riskData.gamma, gammaThresholds, 'Gamma');
        checkAndNotify('vega', riskData.vega, vegaThresholds, 'Vega');
    }, [riskData]); // This effect runs when riskData changes
    return (<div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="md:col-span-1">
           <PnlCard />
        </div>
      
        <div className="md:col-span-1 lg:col-span-2">
          {isLoadingHeatmap && <div className="p-4 text-center text-gray-500">Loading heatmap data...</div>}
          {heatmapError && <div className="p-4 text-center text-red-600">Error: {heatmapError}</div>}
          {!isLoadingHeatmap && !heatmapError && heatmapData !== null && heatmapData.length > 0 && (<HeatmapChart data={heatmapData}/>)}
          {!isLoadingHeatmap && !heatmapError && (!heatmapData || heatmapData.length === 0) && (<div className="p-4 text-center text-gray-500 border border-dashed border-gray-300 rounded-md">No heatmap data available. Upload trade data.</div>)}
        </div>
      </div>

      <div className="mt-6">
        <Upload />
      </div>
      
      <div className="mt-6">
         <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">Reconciliation Report</h2>
         {isLoadingReconciliation && <div className="p-4 text-center text-gray-500">Loading reconciliation data...</div>}
         {reconciliationError && <div className="p-4 text-center text-red-600">Error: {reconciliationError}</div>}
         {!isLoadingReconciliation && !reconciliationError && (<ReconciliationReport result={reconciliationResult} isLoading={isLoadingReconciliation} error={reconciliationError}/>)}
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">Live Risk Exposure</h2>
        {isLoadingRisk && <div className="p-4 text-center text-gray-500">Connecting to Risk Service...</div>}
        {riskError && <div className="p-4 text-center text-red-600">Error: {riskError}</div>}
        {!isLoadingRisk && !riskError && !riskData && <div className="p-4 text-center text-gray-500">No risk data received yet. Waiting for connection...</div>}
        {!isLoadingRisk && !riskError && riskData && (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <GaugeComponent metricName="Delta" value={riskData.delta} min={-1} max={1} thresholds={deltaThresholds} unit="$"/>
            <GaugeComponent metricName="Theta" value={riskData.theta} min={-60} // Adjusted min for typical theta range
         max={0} thresholds={thetaThresholds} unit="$"/>
            <GaugeComponent metricName="Gamma" value={riskData.gamma} min={0.001} // Smallest typical value
         max={0.5} thresholds={gammaThresholds} unit="$ / $^2"/>
            <GaugeComponent metricName="Vega" value={riskData.vega} min={0} max={500} // Adjusted max for typical vega range
         thresholds={vegaThresholds} unit="$ / vol point"/>
          </div>)}
      </div>
    </div>);
};
export default DashboardPage;
