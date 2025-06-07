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
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import PerformanceSummary from './PerformanceSummary';
import { AccountService } from '../services/AccountService';
var data = [
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 600 },
    { name: 'Apr', value: 800 },
    { name: 'May', value: 700 },
    { name: 'Jun', value: 900 },
];
var DashboardWidget = function () {
    var _a = useState([]), accounts = _a[0], setAccounts = _a[1];
    var _b = useState({
        monthToDatePnL: 0,
        yearToDatePnL: 0,
        totalPnL: 0
    }), performanceData = _b[0], setPerformanceData = _b[1];
    // Load account data
    var loadAccountData = function () { return __awaiter(void 0, void 0, void 0, function () {
        var accounts_1, mainAccount, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, AccountService.getAccounts()];
                case 1:
                    accounts_1 = _a.sent();
                    setAccounts(accounts_1);
                    // Extract performance data from accounts if available
                    if (accounts_1.length > 0) {
                        mainAccount = accounts_1[0];
                        setPerformanceData({
                            monthToDatePnL: mainAccount.monthToDatePnL || 0,
                            yearToDatePnL: mainAccount.yearToDatePnL || 0,
                            totalPnL: mainAccount.totalPnL || 0
                        });
                    }
                    console.log('Dashboard loaded accounts:', accounts_1);
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error('Error loading account data:', error_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    // Load data on component mount
    useEffect(function () {
        loadAccountData();
        // Set up event listener for dashboard refresh
        var handleRefresh = function () {
            console.log('Dashboard refresh event received');
            loadAccountData();
        };
        window.addEventListener('dashboard-refresh', handleRefresh);
        // Check for localStorage flag periodically
        var checkInterval = setInterval(function () {
            var refreshFlag = localStorage.getItem('dashboard-refresh-flag');
            if (refreshFlag === 'true') {
                console.log('Dashboard refresh flag detected');
                localStorage.removeItem('dashboard-refresh-flag');
                loadAccountData();
            }
        }, 1000);
        return function () {
            window.removeEventListener('dashboard-refresh', handleRefresh);
            clearInterval(checkInterval);
        };
    }, []);
    return (<div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900">Total Trades</h3>
          <p className="text-3xl font-bold text-blue-600">24</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900">Win Rate</h3>
          <p className="text-3xl font-bold text-green-600">65%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900">Profit/Loss</h3>
          <p className="text-3xl font-bold text-green-600">+$1,234</p>
        </div>
      </div>

      {/* Performance Summary Component */}
      <PerformanceSummary monthToDatePnL={performanceData.monthToDatePnL} yearToDatePnL={performanceData.yearToDatePnL} totalPnL={performanceData.totalPnL}/>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Chart</h3>
        <div className="h-64">
          <LineChart width={800} height={250} data={data}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="name"/>
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#3B82F6"/>
          </LineChart>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">BTC/USD</span>
            <span className="text-green-600">+2.5%</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">ETH/USD</span>
            <span className="text-red-600">-1.2%</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600">SOL/USD</span>
            <span className="text-green-600">+5.8%</span>
          </div>
        </div>
      </div>
    </div>);
};
export default DashboardWidget;
