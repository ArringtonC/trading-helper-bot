// src/services/BrokerService.ts
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
// This service acts as a client for IPC calls to the Electron main process for IBKR operations.
// It does NOT interact with the @stoqey/ib library directly.
/**
 * Attempts to connect to Interactive Brokers via the main process.
 * @returns Promise<{ success: boolean; message?: string }>
 */
export var connectToIBKR = function () { return __awaiter(void 0, void 0, void 0, function () {
    var result, error_1, errorMessage;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!window.electronAPI || !window.electronAPI.connectToIBKR) {
                    console.error('BrokerService: Electron API for IBKR connection not found.');
                    return [2 /*return*/, { success: false, message: 'Electron API not available for connectToIBKR.' }];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                console.log('BrokerService: Requesting IBKR connection via IPC...');
                return [4 /*yield*/, window.electronAPI.connectToIBKR()];
            case 2:
                result = _a.sent();
                console.log('BrokerService: IPC connectToIBKR call returned:', result);
                if (result === undefined || result === null) {
                    console.error('BrokerService: IPC connectToIBKR returned undefined or null. This indicates an issue in the main process handler.');
                    return [2 /*return*/, { success: false, message: 'IPC call returned no data. Check main process logs.' }];
                }
                return [2 /*return*/, result];
            case 3:
                error_1 = _a.sent();
                console.error('BrokerService: Error invoking connectToIBKR IPC:', error_1);
                errorMessage = (error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || (typeof error_1 === 'string' ? error_1 : 'IPC call failed with an unknown error');
                return [2 /*return*/, { success: false, message: errorMessage }];
            case 4: return [2 /*return*/];
        }
    });
}); };
/**
 * Disconnects from Interactive Brokers via the main process.
 * @returns Promise<{ success: boolean; message?: string }>
 */
export var disconnectFromIBKR = function () { return __awaiter(void 0, void 0, void 0, function () {
    var result, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!window.electronAPI || !window.electronAPI.disconnectFromIBKR) {
                    console.error('BrokerService: Electron API for IBKR disconnection not found.');
                    return [2 /*return*/, { success: false, message: 'Electron API not available for disconnectFromIBKR.' }];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                console.log('BrokerService: Requesting IBKR disconnection via IPC...');
                return [4 /*yield*/, window.electronAPI.disconnectFromIBKR()];
            case 2:
                result = _a.sent();
                console.log('BrokerService: IPC disconnectFromIBKR call returned:', result);
                return [2 /*return*/, result];
            case 3:
                error_2 = _a.sent();
                console.error('BrokerService: Error invoking disconnectFromIBKR IPC:', error_2);
                return [2 /*return*/, { success: false, message: error_2.message || 'IPC call failed' }];
            case 4: return [2 /*return*/];
        }
    });
}); };
/**
 * Requests IBKR account summary via the main process.
 * Actual summary data will be sent via an 'ibkr-event' from main process to renderer.
 * @returns Promise<{ success: boolean; message?: string }>
 *          Indicates if the request was successfully sent, not the summary data itself.
 */
export var requestIBKRAccountSummary = function () { return __awaiter(void 0, void 0, void 0, function () {
    var result, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!window.electronAPI || !window.electronAPI.getIBKRAccountSummary) {
                    console.error('BrokerService: Electron API for IBKR account summary not found.');
                    return [2 /*return*/, { success: false, message: 'Electron API not available for getIBKRAccountSummary.' }];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                console.log('BrokerService: Requesting IBKR account summary via IPC...');
                return [4 /*yield*/, window.electronAPI.getIBKRAccountSummary()];
            case 2:
                result = _a.sent();
                console.log('BrokerService: IPC getIBKRAccountSummary call returned:', result);
                return [2 /*return*/, result];
            case 3:
                error_3 = _a.sent();
                console.error('BrokerService: Error invoking getIBKRAccountSummary IPC:', error_3);
                return [2 /*return*/, { success: false, message: error_3.message || 'IPC call failed' }];
            case 4: return [2 /*return*/];
        }
    });
}); };
/**
 * Subscribes to IBKR events sent from the main process.
 * @param callback Function to handle incoming event data.
 *                 (e.g., eventData can be { type: 'connection-status', status: 'connected', message?: string } or
 *                                     { type: 'account-summary', data: { ... } } or
 *                                     { type: 'error', message: '...', data?: any })
 * @returns Unsubscribe function, or null if API is not available.
 */
export var subscribeToIBKREvents = function (callback) {
    if (!window.electronAPI || !window.electronAPI.onIBKREvent) {
        console.error('BrokerService: Electron API for IBKR events not found.');
        return null;
    }
    console.log('BrokerService: Subscribing to IBKR events from main process.');
    return window.electronAPI.onIBKREvent(callback);
};
/**
 * Requests IBKR positions via the main process.
 * @returns Promise<{ success: boolean; positions?: any[]; message?: string }>
 */
export var getIBKRPositions = function () { return __awaiter(void 0, void 0, void 0, function () {
    var result, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!window.electronAPI || !window.electronAPI.getIBKRPositions) {
                    console.error('BrokerService: Electron API for IBKR positions not found.');
                    return [2 /*return*/, { success: false, message: 'Electron API not available for getIBKRPositions.' }];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, window.electronAPI.getIBKRPositions()];
            case 2:
                result = _a.sent();
                console.log('BrokerService: IPC getIBKRPositions call returned:', result);
                return [2 /*return*/, result];
            case 3:
                error_4 = _a.sent();
                console.error('BrokerService: Error invoking getIBKRPositions IPC:', error_4);
                return [2 /*return*/, { success: false, message: error_4.message }];
            case 4: return [2 /*return*/];
        }
    });
}); };
/**
 * Requests IBKR open orders via the main process.
 * @returns Promise<{ success: boolean; orders?: any[]; message?: string }>
 */
export var getIBKROrders = function () { return __awaiter(void 0, void 0, void 0, function () {
    var result, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!window.electronAPI || !window.electronAPI.getIBKROrders) {
                    console.error('BrokerService: Electron API for IBKR orders not found.');
                    return [2 /*return*/, { success: false, message: 'Electron API not available for getIBKROrders.' }];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, window.electronAPI.getIBKROrders()];
            case 2:
                result = _a.sent();
                console.log('BrokerService: IPC getIBKROrders call returned:', result);
                return [2 /*return*/, result];
            case 3:
                error_5 = _a.sent();
                console.error('BrokerService: Error invoking getIBKROrders IPC:', error_5);
                return [2 /*return*/, { success: false, message: error_5.message }];
            case 4: return [2 /*return*/];
        }
    });
}); };
/**
 * Requests IBKR executions (order history) via the main process.
 * @returns Promise<{ success: boolean; executions?: any[]; message?: string }>
 */
export var getIBKRExecutions = function () { return __awaiter(void 0, void 0, void 0, function () {
    var result, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!window.electronAPI || !window.electronAPI.getIBKRExecutions) {
                    console.error('BrokerService: Electron API for IBKR executions not found.');
                    return [2 /*return*/, { success: false, message: 'Electron API not available for getIBKRExecutions.' }];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, window.electronAPI.getIBKRExecutions()];
            case 2:
                result = _a.sent();
                console.log('BrokerService: IPC getIBKRExecutions call returned:', result);
                return [2 /*return*/, result];
            case 3:
                error_6 = _a.sent();
                console.error('BrokerService: Error invoking getIBKRExecutions IPC:', error_6);
                return [2 /*return*/, { success: false, message: error_6.message }];
            case 4: return [2 /*return*/];
        }
    });
}); };
