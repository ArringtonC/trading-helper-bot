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
import React, { useState, useEffect } from 'react';
import { AccountType } from '../types/account';
import { AccountService } from '../services/AccountService';
import ExportCapabilitiesButton from '../components/ExportCapabilitiesButton';
import { Link } from 'react-router-dom';
import { Box, Typography, Switch, FormControlLabel, Card, Divider } from '@mui/material';
import { loadSetting, saveSetting } from '../services/SettingsService';
var Settings = function () {
    var _a = useState([]), accounts = _a[0], setAccounts = _a[1];
    var _b = useState(null), selectedAccount = _b[0], setSelectedAccount = _b[1];
    var _c = useState(false), showImport = _c[0], setShowImport = _c[1];
    var _d = useState(false), showDirectImport = _d[0], setShowDirectImport = _d[1];
    // Load accounts on component mount
    useEffect(function () {
        var loadedAccounts = AccountService.getAccounts();
        setAccounts(loadedAccounts);
        if (loadedAccounts.length > 0) {
            setSelectedAccount(loadedAccounts[0]);
        }
    }, []);
    useEffect(function () {
        setShowImport(loadSetting('showImport') === 'true');
        setShowDirectImport(loadSetting('showDirectImport') === 'true');
    }, []);
    // Handle account field updates
    var handleAccountUpdate = function (field, value) {
        var _a;
        if (!selectedAccount)
            return;
        var updatedAccount = __assign(__assign({}, selectedAccount), (_a = {}, _a[field] = value, _a));
        setSelectedAccount(updatedAccount);
        // Save to storage
        AccountService.updateAccount(updatedAccount);
        // Update accounts list
        setAccounts(function (prevAccounts) {
            return prevAccounts.map(function (acc) {
                return acc.id === updatedAccount.id ? updatedAccount : acc;
            });
        });
    };
    // Handle account selection change
    var handleAccountSelectionChange = function (e) {
        var accountId = e.target.value;
        var account = accounts.find(function (a) { return a.id === accountId; });
        if (account) {
            setSelectedAccount(account);
        }
    };
    // Handle creating a new account
    var handleCreateAccount = function () {
        var newAccount = {
            id: "account-".concat(Date.now()),
            name: 'New Account',
            type: AccountType.CASH,
            balance: 0,
            lastUpdated: new Date(),
            monthlyDeposit: 100,
            created: new Date()
        };
        AccountService.addAccount(newAccount);
        // Refresh accounts list
        var updatedAccounts = AccountService.getAccounts();
        setAccounts(updatedAccounts);
        setSelectedAccount(newAccount);
    };
    // Handle deleting an account
    var handleDeleteAccount = function () {
        if (!selectedAccount)
            return;
        if (window.confirm("Are you sure you want to delete account \"".concat(selectedAccount.name, "\"?"))) {
            AccountService.deleteAccount(selectedAccount.id);
            // Refresh accounts list
            var updatedAccounts = AccountService.getAccounts();
            setAccounts(updatedAccounts);
            // Select first account if available, or null if no accounts left
            setSelectedAccount(updatedAccounts.length > 0 ? updatedAccounts[0] : null);
        }
    };
    var handleToggle = function (key, value) {
        value
            ? saveSetting(key, 'true')
            : saveSetting(key, 'false');
        if (key === 'showImport')
            setShowImport(value);
        if (key === 'showDirectImport')
            setShowDirectImport(value);
    };
    return (<Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Settings</Typography>

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Feature Toggles</Typography>
        <Divider sx={{ mb: 2 }}/>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel control={<Switch checked={showImport} onChange={function (e) { return handleToggle('showImport', e.target.checked); }}/>} label="Enable IBKR Import Page"/>

          <FormControlLabel control={<Switch checked={showDirectImport} onChange={function (e) { return handleToggle('showDirectImport', e.target.checked); }}/>} label="Enable Direct CSV Import Page"/>
        </Box>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Account Settings */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h2 className="text-xl font-medium text-gray-800 mb-4">Account Settings</h2>
            
            {/* Account Selector */}
            <div className="mb-6 flex items-end gap-4">
              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Account
                </label>
                <select value={(selectedAccount === null || selectedAccount === void 0 ? void 0 : selectedAccount.id) || ''} onChange={handleAccountSelectionChange} className="w-full p-2 border border-gray-300 rounded">
                  {accounts.map(function (account) { return (<option key={account.id} value={account.id}>
                      {account.name}
                    </option>); })}
                </select>
              </div>
              
              <button onClick={handleCreateAccount} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                Add Account
              </button>
            </div>
            
            {selectedAccount ? (<div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Name
                  </label>
                  <input type="text" value={selectedAccount.name} onChange={function (e) { return handleAccountUpdate('name', e.target.value); }} className="w-full p-2 border border-gray-300 rounded"/>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Type
                  </label>
                  <select value={selectedAccount.type} onChange={function (e) { return handleAccountUpdate('type', e.target.value); }} className="w-full p-2 border border-gray-300 rounded">
                    <option value={AccountType.CASH}>Cash</option>
                    <option value={AccountType.IBKR}>Interactive Brokers</option>
                    <option value={AccountType.NINJA_TRADER}>NinjaTrader</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Balance
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input type="number" value={selectedAccount.balance} onChange={function (e) { return handleAccountUpdate('balance', Number(e.target.value)); }} className="w-full pl-7 p-2 border border-gray-300 rounded" step="0.01"/>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Deposit Amount
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input type="number" value={selectedAccount.monthlyDeposit || 0} onChange={function (e) { return handleAccountUpdate('monthlyDeposit', Number(e.target.value)); }} className="w-full pl-7 p-2 border border-gray-300 rounded" step="0.01"/>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Used for projecting future account balances
                  </p>
                </div>
                
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <button onClick={handleDeleteAccount} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                    Delete Account
                  </button>
                </div>
              </div>) : (<div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                <p>No accounts found. Click "Add Account" to create one.</p>
              </div>)}
          </div>
        </div>
        
        {/* System Settings */}
        <div>
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h2 className="text-xl font-medium text-gray-800 mb-4">System Settings</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Current Version</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Version: April 2025 Release
                </p>
                <p className="text-sm text-gray-600">
                  Last Updated: April 30, 2025
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Import Capabilities</h3>
                <p className="text-sm text-gray-600 mb-2">
                  The application supports two methods for importing IBKR data:
                </p>
                <ul className="text-sm text-gray-600 list-disc pl-5 mb-4">
                  <li>Fixed Import - For standard IBKR activity statements</li>
                  <li>Direct Parser - For specialized IBKR CSV formats</li>
                </ul>
                <div className="space-y-2">
                  <Link to="/import/fixed-import" className="block w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center">
                    Go to Fixed Import
                  </Link>
                  <Link to="/import/direct" className="block w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center">
                    Go to Direct Parser
                  </Link>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Capabilities Export</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Export the current capabilities and configuration of your Trading Helper Bot.
                </p>
                <ExportCapabilitiesButton className="w-full"/>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Data Management</h3>
                <div className="space-y-2">
                  <button className="w-full px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50" onClick={function () {
            if (window.confirm('This will download all your data as a backup file. Continue?')) {
                alert('Backup functionality will be available in a future update.');
            }
        }}>
                    Backup Data
                  </button>
                  
                  <button className="w-full px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50" onClick={function () {
            if (window.confirm('This will restore your data from a backup file. Current data will be overwritten. Continue?')) {
                alert('Restore functionality will be available in a future update.');
            }
        }}>
                    Restore Data
                  </button>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Application Information</h3>
                <div className="text-sm text-gray-600">
                  <p>Version: April 2025 Release</p>
                  <p>Last Updated: April 30, 2025</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Box>);
};
export default Settings;
