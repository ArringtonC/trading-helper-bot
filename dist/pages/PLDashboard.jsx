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
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getTrades, initDatabase } from '../services/DatabaseService';
import { fmtUsd } from '../utils/formatters';
import { Card, Typography, Box, CircularProgress, useTheme, Button } from '@mui/material';
import { toast } from 'react-toastify';
import { connectToIBKR, disconnectFromIBKR, subscribeToIBKREvents, requestIBKRAccountSummary, getIBKRPositions, getIBKROrders, getIBKRExecutions } from '../services/BrokerService';
// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);
export var PLDashboard = function () {
    var theme = useTheme();
    var userName = useState('Trader')[0];
    var _a = useState(6694.75), accountValue = _a[0], setAccountValue = _a[1]; // Set initial value from CSV
    var _b = useState(true), isLoading = _b[0], setIsLoading = _b[1];
    var _c = useState(), error = _c[0], setError = _c[1];
    var _d = useState({
        labels: [],
        datasets: [],
    }), chartData = _d[0], setChartData = _d[1];
    // IBKR Connection State
    var _e = useState(false), isIBKRConnecting = _e[0], setIsIBKRConnecting = _e[1];
    var _f = useState('Disconnected'), ibkrConnectionStatus = _f[0], setIbkrConnectionStatus = _f[1];
    var _g = useState(null), ibkrError = _g[0], setIbkrError = _g[1];
    var _h = useState(null), ibkrAccountSummary = _h[0], setIbkrAccountSummary = _h[1];
    // Deduplicated account summary by tag
    var _j = useState({}), ibkrAccountSummaryMap = _j[0], setIbkrAccountSummaryMap = _j[1];
    // IBKR Positions State
    var _k = useState([]), ibkrPositions = _k[0], setIbkrPositions = _k[1];
    var _l = useState(false), ibkrPositionsLoading = _l[0], setIbkrPositionsLoading = _l[1];
    var _m = useState(null), ibkrPositionsError = _m[0], setIbkrPositionsError = _m[1];
    // IBKR Orders State
    var _o = useState([]), ibkrOrders = _o[0], setIbkrOrders = _o[1];
    var _p = useState(false), ibkrOrdersLoading = _p[0], setIbkrOrdersLoading = _p[1];
    var _q = useState(null), ibkrOrdersError = _q[0], setIbkrOrdersError = _q[1];
    // IBKR Executions State
    var _r = useState([]), ibkrExecutions = _r[0], setIbkrExecutions = _r[1];
    var _s = useState(false), ibkrExecutionsLoading = _s[0], setIbkrExecutionsLoading = _s[1];
    var _t = useState(null), ibkrExecutionsError = _t[0], setIbkrExecutionsError = _t[1];
    useEffect(function () {
        var loadData = function () { return __awaiter(void 0, void 0, void 0, function () {
            var rawTrades, trades, running_1, byDate_1, labels, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, 4, 5]);
                        setIsLoading(true);
                        setError(undefined); // Clear previous errors
                        return [4 /*yield*/, initDatabase()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, getTrades()];
                    case 2:
                        rawTrades = _a.sent();
                        trades = rawTrades.map(function (t) { return (__assign(__assign({}, t), { dateTime: t.tradeDate || '', tradePL: t.netAmount || 0 })); });
                        if (trades.length) {
                            running_1 = 0;
                            byDate_1 = {};
                            trades.forEach(function (_a) {
                                var dateTime = _a.dateTime, tradePL = _a.tradePL;
                                var day = dateTime.split(',')[0]; // TODO: Use proper date parsing
                                running_1 += tradePL;
                                byDate_1[day] = running_1;
                            });
                            labels = Object.keys(byDate_1);
                            setChartData({
                                labels: labels,
                                datasets: [
                                    {
                                        label: 'Cumulative P&L',
                                        data: labels.map(function (d) { return byDate_1[d]; }),
                                        fill: false,
                                        tension: 0.1,
                                        borderColor: theme.palette.success.main,
                                        backgroundColor: theme.palette.success.light,
                                    },
                                ],
                            });
                        }
                        else {
                            // Explicitly set chartData to empty if no trades, to distinguish from loading state
                            setChartData({ labels: [], datasets: [] });
                        }
                        return [3 /*break*/, 5];
                    case 3:
                        err_1 = _a.sent();
                        console.error('Error loading dashboard data:', err_1);
                        setError(err_1.message || 'Failed to load dashboard data');
                        return [3 /*break*/, 5];
                    case 4:
                        setIsLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        loadData();
    }, [theme.palette.success.main, theme.palette.success.light]);
    // Accumulate account summary rows on event
    useEffect(function () {
        var unsubscribe = subscribeToIBKREvents(function (eventData) {
            if (eventData.type === 'account-summary') {
                setIbkrAccountSummaryMap(function (prev) {
                    var _a;
                    return (__assign(__assign({}, prev), (_a = {}, _a[eventData.data.tag] = { value: eventData.data.value, currency: eventData.data.currency }, _a)));
                });
                console.log('[PLDashboard] Received account summary row:', eventData.data);
            }
            else if (eventData.type === 'connection-status') {
                setIbkrConnectionStatus(eventData.status === 'connected'
                    ? 'Connected'
                    : eventData.status === 'disconnected'
                        ? 'Disconnected'
                        : eventData.status === 'error'
                            ? 'Connection Error'
                            : eventData.status || 'Unknown');
                if (eventData.status === 'error') {
                    setIbkrError(eventData.message || 'Unknown IBKR connection error');
                }
                else {
                    setIbkrError(null);
                }
            }
            else if (eventData.type === 'error') {
                setIbkrError(eventData.message || 'Unknown IBKR error');
            }
            else {
                toast.info("Received IBKR event: ".concat(eventData.type));
                console.log('[PLDashboard] Unhandled IBKR event:', eventData);
            }
        });
        return function () {
            if (unsubscribe)
                unsubscribe();
        };
    }, []);
    // Clear summary map on disconnect
    useEffect(function () {
        if (ibkrConnectionStatus !== 'Connected') {
            setIbkrAccountSummaryMap({});
        }
    }, [ibkrConnectionStatus]);
    // IBKR Connection Handlers
    var handleConnectIBKR = function () { return __awaiter(void 0, void 0, void 0, function () {
        var success, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('[PLDashboard] IBKR Connect button clicked');
                    setIsIBKRConnecting(true);
                    setIbkrError(null);
                    setIbkrConnectionStatus('Connecting...');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, connectToIBKR()];
                case 2:
                    success = _a.sent();
                    if (success) {
                        setIbkrConnectionStatus('Connection attempt successful. Check console for logs.');
                        // In a real scenario, you'd wait for a 'connected' event or check status
                        toast.success('IBKR connection process initiated.');
                    }
                    else {
                        setIbkrConnectionStatus('Failed to initiate connection.');
                        setIbkrError('Could not initiate IBKR connection. Check console.');
                        toast.error('Failed to initiate IBKR connection.');
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error connecting to IBKR:', error_1);
                    setIbkrConnectionStatus('Connection Error');
                    setIbkrError(error_1.message || 'An unknown error occurred during connection.');
                    toast.error("IBKR Connection Error: ".concat(error_1.message));
                    return [3 /*break*/, 4];
                case 4:
                    setIsIBKRConnecting(false);
                    return [2 /*return*/];
            }
        });
    }); };
    var handleDisconnectIBKR = function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('[PLDashboard] IBKR Disconnect button clicked');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, disconnectFromIBKR()];
                case 2:
                    _a.sent();
                    setIbkrConnectionStatus('Disconnected');
                    toast.info('Disconnected from IBKR.');
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error('Error disconnecting from IBKR:', error_2);
                    setIbkrError(error_2.message || 'An unknown error occurred during disconnection.');
                    toast.error("IBKR Disconnection Error: ".concat(error_2.message));
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleRequestAccountSummary = function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, requestIBKRAccountSummary()];
                case 1:
                    result = _a.sent();
                    if (result.success) {
                        toast.success('Account summary request sent!');
                    }
                    else {
                        toast.error('Failed to request account summary: ' + result.message);
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    var handleRequestPositions = function () { return __awaiter(void 0, void 0, void 0, function () {
        var result, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIbkrPositionsLoading(true);
                    setIbkrPositionsError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, getIBKRPositions()];
                case 2:
                    result = _a.sent();
                    console.log('[PLDashboard] IBKR Positions result:', result);
                    if (result.success && result.positions) {
                        setIbkrPositions(result.positions);
                    }
                    else {
                        setIbkrPositions([]);
                        setIbkrPositionsError(result.message || 'Failed to fetch positions.');
                    }
                    return [3 /*break*/, 5];
                case 3:
                    err_2 = _a.sent();
                    setIbkrPositions([]);
                    setIbkrPositionsError(err_2.message || 'Failed to fetch positions.');
                    return [3 /*break*/, 5];
                case 4:
                    setIbkrPositionsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleRequestOrders = function () { return __awaiter(void 0, void 0, void 0, function () {
        var result, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIbkrOrdersLoading(true);
                    setIbkrOrdersError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, getIBKROrders()];
                case 2:
                    result = _a.sent();
                    console.log('[PLDashboard] IBKR Orders result:', result);
                    if (result.success && result.orders) {
                        setIbkrOrders(result.orders);
                    }
                    else {
                        setIbkrOrders([]);
                        setIbkrOrdersError(result.message || 'Failed to fetch orders.');
                    }
                    return [3 /*break*/, 5];
                case 3:
                    err_3 = _a.sent();
                    setIbkrOrders([]);
                    setIbkrOrdersError(err_3.message || 'Failed to fetch orders.');
                    return [3 /*break*/, 5];
                case 4:
                    setIbkrOrdersLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleRequestExecutions = function () { return __awaiter(void 0, void 0, void 0, function () {
        var result, err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIbkrExecutionsLoading(true);
                    setIbkrExecutionsError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, getIBKRExecutions()];
                case 2:
                    result = _a.sent();
                    console.log('[PLDashboard] IBKR Executions result:', result);
                    if (result.success && result.executions) {
                        setIbkrExecutions(result.executions);
                    }
                    else {
                        setIbkrExecutions([]);
                        setIbkrExecutionsError(result.message || 'Failed to fetch executions.');
                    }
                    return [3 /*break*/, 5];
                case 3:
                    err_4 = _a.sent();
                    setIbkrExecutions([]);
                    setIbkrExecutionsError(err_4.message || 'Failed to fetch executions.');
                    return [3 /*break*/, 5];
                case 4:
                    setIbkrExecutionsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (<Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {userName}!
      </Typography>

      {/* IBKR Connection Test Section - Always visible */}
      <Card sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>IBKR Connection Test</Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>Status: {ibkrConnectionStatus}</Typography>
        {ibkrError && <Typography variant="body2" color="error" sx={{ mb: 1 }}>Error: {ibkrError}</Typography>}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" onClick={handleConnectIBKR} disabled={isIBKRConnecting || ibkrConnectionStatus.startsWith('Connection attempt successful')}>
            {isIBKRConnecting ? 'Connecting...' : 'Connect to IBKR'}
          </Button>
          <Button variant="outlined" color="error" onClick={handleDisconnectIBKR} disabled={ibkrConnectionStatus === 'Disconnected' || isIBKRConnecting}>
            Disconnect from IBKR
          </Button>
          <Button variant="outlined" color="primary" onClick={handleRequestAccountSummary} disabled={ibkrConnectionStatus.toLowerCase() !== 'connected'}>
            Request Account Summary
          </Button>
        </Box>
        <Typography variant="caption" display="block" sx={{ mt: 1, color: theme.palette.text.secondary }}>
          Ensure your IBKR Gateway/TWS is running and configured for API access.
        </Typography>
      </Card>

      {/* IBKR Account Summary Section - always visible */}
      <Card sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>IBKR Account Summary</Typography>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Tag</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Value</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Currency</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(ibkrAccountSummaryMap).length === 0 ? (<tr>
                <td colSpan={3} style={{ textAlign: 'center', color: '#888' }}>
                  No account summary data received yet.
                </td>
              </tr>) : (Object.entries(ibkrAccountSummaryMap).map(function (_a) {
            var tag = _a[0], _b = _a[1], value = _b.value, currency = _b.currency;
            return (<tr key={tag}>
                  <td>{tag}</td>
                  <td>{value}</td>
                  <td>{currency}</td>
                </tr>);
        }))}
          </tbody>
        </table>
      </Card>

      {/* IBKR Positions Section */}
      <Card sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>IBKR Positions</Typography>
        <Button variant="outlined" color="primary" onClick={handleRequestPositions} disabled={ibkrConnectionStatus.toLowerCase() !== 'connected' || ibkrPositionsLoading} sx={{ mb: 2 }}>
          {ibkrPositionsLoading ? 'Loading...' : 'Request Positions'}
        </Button>
        {ibkrPositionsError && (<Typography color="error" variant="body2" sx={{ mb: 1 }}>{ibkrPositionsError}</Typography>)}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Symbol</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Quantity</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Avg Price</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Account</th>
            </tr>
          </thead>
          <tbody>
            {ibkrPositions.length === 0 ? (<tr>
                <td colSpan={4} style={{ textAlign: 'center', color: '#888' }}>
                  No positions to display.
                </td>
              </tr>) : (ibkrPositions.map(function (pos, idx) {
            var _a;
            return (<tr key={idx}>
                  <td>{((_a = pos.contract) === null || _a === void 0 ? void 0 : _a.symbol) || '-'}</td>
                  <td>{pos.pos}</td>
                  <td>{pos.avgCost}</td>
                  <td>{pos.account}</td>
                </tr>);
        }))}
          </tbody>
        </table>
      </Card>

      {/* IBKR Orders Section */}
      <Card sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>IBKR Open Orders</Typography>
        <Button variant="outlined" color="primary" onClick={handleRequestOrders} disabled={ibkrConnectionStatus.toLowerCase() !== 'connected' || ibkrOrdersLoading} sx={{ mb: 2 }}>
          {ibkrOrdersLoading ? 'Loading...' : 'Request Orders'}
        </Button>
        {ibkrOrdersError && (<Typography color="error" variant="body2" sx={{ mb: 1 }}>{ibkrOrdersError}</Typography>)}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Order ID</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Symbol</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Action</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Quantity</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {ibkrOrders.length === 0 ? (<tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>
                  No open orders to display.
                </td>
              </tr>) : (ibkrOrders.map(function (order, idx) {
            var _a, _b, _c, _d;
            return (<tr key={idx}>
                  <td>{order.orderId}</td>
                  <td>{((_a = order.contract) === null || _a === void 0 ? void 0 : _a.symbol) || '-'}</td>
                  <td>{((_b = order.order) === null || _b === void 0 ? void 0 : _b.action) || '-'}</td>
                  <td>{((_c = order.order) === null || _c === void 0 ? void 0 : _c.totalQuantity) || '-'}</td>
                  <td>{((_d = order.orderState) === null || _d === void 0 ? void 0 : _d.status) || '-'}</td>
                </tr>);
        }))}
          </tbody>
        </table>
      </Card>

      {/* IBKR Executions Section */}
      <Card sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>IBKR Order History</Typography>
        <Button variant="outlined" color="primary" onClick={handleRequestExecutions} disabled={ibkrConnectionStatus.toLowerCase() !== 'connected' || ibkrExecutionsLoading} sx={{ mb: 2 }}>
          {ibkrExecutionsLoading ? 'Loading...' : 'Request Order History'}
        </Button>
        {ibkrExecutionsError && (<Typography color="error" variant="body2" sx={{ mb: 1 }}>{ibkrExecutionsError}</Typography>)}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Exec ID</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Symbol</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Action</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Quantity</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Price</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {ibkrExecutions.length === 0 ? (<tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#888' }}>
                  No executions to display.
                </td>
              </tr>) : (ibkrExecutions.map(function (exec, idx) {
            var _a, _b, _c, _d, _e, _f;
            return (<tr key={idx}>
                  <td>{((_a = exec.execution) === null || _a === void 0 ? void 0 : _a.execId) || '-'}</td>
                  <td>{((_b = exec.contract) === null || _b === void 0 ? void 0 : _b.symbol) || '-'}</td>
                  <td>{((_c = exec.execution) === null || _c === void 0 ? void 0 : _c.side) || '-'}</td>
                  <td>{((_d = exec.execution) === null || _d === void 0 ? void 0 : _d.shares) || '-'}</td>
                  <td>{((_e = exec.execution) === null || _e === void 0 ? void 0 : _e.price) || '-'}</td>
                  <td>{((_f = exec.execution) === null || _f === void 0 ? void 0 : _f.time) || '-'}</td>
                </tr>);
        }))}
          </tbody>
        </table>
      </Card>

      {/* Conditional rendering for chart and account value */}
      {isLoading && (<Box sx={{
                display: 'flex',
                height: '50vh', // Adjusted height
                alignItems: 'center',
                justifyContent: 'center'
            }}>
          <CircularProgress />
        </Box>)}

      {!isLoading && error && (<Box textAlign="center" p={4} sx={{ mb: 4 }}>
          <Typography color="error" variant="h6">
            Oops! Something went wrong loading P&L data.
          </Typography>
          <Typography>{error}</Typography>
        </Box>)}

      {!isLoading && !error && (<>
          {chartData.datasets.length > 0 && chartData.labels && chartData.labels.length > 0 ? (<>
              <Card sx={{ p: 2, mb: 4, maxWidth: 300 }}>
                <Typography variant="subtitle2">Account Value</Typography>
                <Typography variant="h5" sx={{ color: accountValue >= 0 ? theme.palette.success.main : theme.palette.error.main }}>
                  {fmtUsd(accountValue)}
                </Typography>
              </Card>

              <Card sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  P&L Over Time
                </Typography>
                <Box sx={{ height: 400, position: 'relative' }}>
                  <Line data={chartData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            title: { display: true, text: 'Date' },
                            grid: { display: false }
                        },
                        y: {
                            title: { display: true, text: 'P&L (USD)' },
                            grid: { color: theme.palette.divider }
                        },
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return "P&L: ".concat(fmtUsd(context.parsed.y));
                                }
                            }
                        }
                    },
                }}/>
                </Box>
              </Card>
            </>) : (<Box textAlign="center" p={4} sx={{ mb: 4 }}>
              <Typography variant="h6">No P&L data to display yet.</Typography>
              <Typography variant="body2">Please import a CSV file with trade data.</Typography> 
            </Box>)}
        </>)}
    </Box>);
};
