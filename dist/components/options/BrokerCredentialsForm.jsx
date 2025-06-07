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
import React, { useState, useEffect } from 'react';
var BrokerCredentialsForm = function () {
    // IBKR State
    var _a = useState(''), ibkrUsername = _a[0], setIbkrUsername = _a[1];
    var _b = useState(''), ibkrPassword = _b[0], setIbkrPassword = _b[1];
    var _c = useState(false), ibkrConfigured = _c[0], setIbkrConfigured = _c[1];
    var _d = useState(''), ibkrMessage = _d[0], setIbkrMessage = _d[1];
    // Schwab State
    var _e = useState(''), schwabAppKey = _e[0], setSchwabAppKey = _e[1];
    var _f = useState(''), schwabAppSecret = _f[0], setSchwabAppSecret = _f[1];
    // const [schwabCallbackUrl, setSchwabCallbackUrl] = useState('https://127.0.0.1:8182'); // Default or make configurable
    var _g = useState(false), schwabConfigured = _g[0], setSchwabConfigured = _g[1];
    var _h = useState(''), schwabMessage = _h[0], setSchwabMessage = _h[1];
    // Check configuration status on load
    useEffect(function () {
        var checkConfig = function () { return __awaiter(void 0, void 0, void 0, function () {
            var ibkrStatus, schwabStatus, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, window.credentials.isConfigured('ibkr', 'username')];
                    case 1:
                        ibkrStatus = _a.sent();
                        setIbkrConfigured((ibkrStatus === null || ibkrStatus === void 0 ? void 0 : ibkrStatus.success) && (ibkrStatus === null || ibkrStatus === void 0 ? void 0 : ibkrStatus.isConfigured));
                        return [4 /*yield*/, window.credentials.isConfigured('schwab', 'appKey')];
                    case 2:
                        schwabStatus = _a.sent();
                        setSchwabConfigured((schwabStatus === null || schwabStatus === void 0 ? void 0 : schwabStatus.success) && (schwabStatus === null || schwabStatus === void 0 ? void 0 : schwabStatus.isConfigured));
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Error checking credential status:', error_1);
                        setIbkrMessage('Error checking IBKR status');
                        setSchwabMessage('Error checking Schwab status');
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        if (window.credentials) {
            checkConfig();
        }
    }, []);
    var handleSaveIbkr = function () { return __awaiter(void 0, void 0, void 0, function () {
        var saveUsernameResult, savePasswordResult, errorMsg, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIbkrMessage('');
                    if (!ibkrUsername || !ibkrPassword) {
                        setIbkrMessage('IBKR Username and Password are required.');
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, window.credentials.save('ibkr', 'username', ibkrUsername)];
                case 2:
                    saveUsernameResult = _a.sent();
                    return [4 /*yield*/, window.credentials.save('ibkr', 'password', ibkrPassword)];
                case 3:
                    savePasswordResult = _a.sent();
                    if ((saveUsernameResult === null || saveUsernameResult === void 0 ? void 0 : saveUsernameResult.success) && (savePasswordResult === null || savePasswordResult === void 0 ? void 0 : savePasswordResult.success)) {
                        setIbkrMessage('IBKR credentials saved successfully!');
                        setIbkrConfigured(true);
                        setIbkrUsername(''); // Clear fields after save
                        setIbkrPassword('');
                    }
                    else {
                        errorMsg = (saveUsernameResult === null || saveUsernameResult === void 0 ? void 0 : saveUsernameResult.error) || (savePasswordResult === null || savePasswordResult === void 0 ? void 0 : savePasswordResult.error) || 'Failed to save IBKR credentials.';
                        setIbkrMessage("Error: ".concat(errorMsg));
                        setIbkrConfigured(false);
                    }
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _a.sent();
                    setIbkrMessage("Error saving IBKR credentials: ".concat(error_2.message));
                    setIbkrConfigured(false);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleSaveSchwab = function () { return __awaiter(void 0, void 0, void 0, function () {
        var saveKeyResult, saveSecretResult, errorMsg, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setSchwabMessage('');
                    if (!schwabAppKey || !schwabAppSecret) {
                        setSchwabMessage('Schwab App Key and App Secret are required.');
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, window.credentials.save('schwab', 'appKey', schwabAppKey)];
                case 2:
                    saveKeyResult = _a.sent();
                    return [4 /*yield*/, window.credentials.save('schwab', 'appSecret', schwabAppSecret)];
                case 3:
                    saveSecretResult = _a.sent();
                    // const saveCallbackResult = await (window as any).credentials.save('schwab', 'callbackUrl', schwabCallbackUrl);
                    if ((saveKeyResult === null || saveKeyResult === void 0 ? void 0 : saveKeyResult.success) && (saveSecretResult === null || saveSecretResult === void 0 ? void 0 : saveSecretResult.success)) {
                        setSchwabMessage('Schwab credentials saved successfully!');
                        setSchwabConfigured(true);
                        setSchwabAppKey(''); // Clear fields
                        setSchwabAppSecret('');
                        // setSchwabCallbackUrl('https://127.0.0.1:8182');
                    }
                    else {
                        errorMsg = (saveKeyResult === null || saveKeyResult === void 0 ? void 0 : saveKeyResult.error) || (saveSecretResult === null || saveSecretResult === void 0 ? void 0 : saveSecretResult.error) || 'Failed to save Schwab credentials.';
                        setSchwabMessage("Error: ".concat(errorMsg));
                        setSchwabConfigured(false);
                    }
                    return [3 /*break*/, 5];
                case 4:
                    error_3 = _a.sent();
                    setSchwabMessage("Error saving Schwab credentials: ".concat(error_3.message));
                    setSchwabConfigured(false);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    // Basic styling - replace with your project's UI components or Tailwind classes
    var inputStyle = { padding: '8px', margin: '5px 0 10px 0', border: '1px solid #ccc', borderRadius: '4px', width: 'calc(100% - 18px)' };
    var buttonStyle = { padding: '10px 15px', margin: '10px 5px 0 0', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };
    var sectionStyle = { border: '1px solid #eee', padding: '20px', marginBottom: '20px', borderRadius: '8px' };
    var messageStyle = { marginTop: '10px', padding: '10px', borderRadius: '4px' };
    var successMessageStyle = __assign(__assign({}, messageStyle), { backgroundColor: '#d4edda', color: '#155724' });
    var errorMessageStyle = __assign(__assign({}, messageStyle), { backgroundColor: '#f8d7da', color: '#721c24' });
    var statusStyle = { marginBottom: '10px', fontWeight: 'bold' };
    return (<div>
      <h2>Broker API Credentials</h2>

      {/* IBKR Section */}
      <div style={sectionStyle}>
        <h3>Interactive Brokers</h3>
        <div style={statusStyle}>
          Status: {ibkrConfigured ? <span style={{ color: 'green' }}>Configured</span> : <span style={{ color: 'red' }}>Not Configured</span>}
        </div>
        <div>
          <label htmlFor="ibkrUsername">IBKR Username:</label>
          <input id="ibkrUsername" type="text" value={ibkrUsername} onChange={function (e) { return setIbkrUsername(e.target.value); }} style={inputStyle} autoComplete="username"/>
        </div>
        <div>
          <label htmlFor="ibkrPassword">IBKR Password:</label>
          <input id="ibkrPassword" type="password" value={ibkrPassword} onChange={function (e) { return setIbkrPassword(e.target.value); }} style={inputStyle} autoComplete="current-password"/>
        </div>
        <button onClick={handleSaveIbkr} style={buttonStyle}>Save IBKR Credentials</button>
        {ibkrMessage && (<div style={ibkrMessage.startsWith('Error:') ? errorMessageStyle : successMessageStyle}>
            {ibkrMessage}
          </div>)}
      </div>

      {/* Schwab Section */}
      <div style={sectionStyle}>
        <h3>Charles Schwab</h3>
         <div style={statusStyle}>
          Status: {schwabConfigured ? <span style={{ color: 'green' }}>Configured</span> : <span style={{ color: 'red' }}>Not Configured</span>}
        </div>
        <div>
          <label htmlFor="schwabAppKey">Schwab App Key (Client ID):</label>
          <input id="schwabAppKey" type="text" value={schwabAppKey} onChange={function (e) { return setSchwabAppKey(e.target.value); }} style={inputStyle}/>
        </div>
        <div>
          <label htmlFor="schwabAppSecret">Schwab App Secret (Client Secret):</label>
          <input id="schwabAppSecret" type="password" value={schwabAppSecret} onChange={function (e) { return setSchwabAppSecret(e.target.value); }} style={inputStyle}/>
        </div>
        {/* <div>
          <label htmlFor="schwabCallbackUrl">Schwab Callback URL:</label>
          <input
            id="schwabCallbackUrl"
            type="text"
            value={schwabCallbackUrl}
            onChange={(e) => setSchwabCallbackUrl(e.target.value)}
            style={inputStyle}
            placeholder="e.g., https://127.0.0.1:8182"
          />
        </div> */}
        <button onClick={handleSaveSchwab} style={buttonStyle}>Save Schwab Credentials</button>
        {schwabMessage && (<div style={schwabMessage.startsWith('Error:') ? errorMessageStyle : successMessageStyle}>
            {schwabMessage}
          </div>)}
      </div>
    </div>);
};
export default BrokerCredentialsForm;
