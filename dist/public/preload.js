console.log('[Preload Script] Starting execution...');

const { contextBridge, ipcRenderer } = require('electron');

console.log('[Preload Script] contextBridge available:', !!contextBridge);
console.log('[Preload Script] ipcRenderer available:', !!ipcRenderer);

// Test: Simple API exposure
try {
contextBridge.exposeInMainWorld('electronAPI', {
    test: () => {
      console.log('[Preload Script] electronAPI.test() called');
      return 'electronAPI working!';
    },
    
    storeCredentials: (broker, username, password) => {
      console.log('[Preload Script] storeCredentials called with:', broker, username);
      return ipcRenderer.invoke('store-credentials', {
      service: `TradingHelperBot_${broker}`,
      account: username,
      password,
      });
    },

    getCredentials: (broker, username) => {
      console.log('[Preload Script] getCredentials called with:', broker, username);
      return ipcRenderer.invoke('get-credentials', {
      service: `TradingHelperBot_${broker}`,
      account: username,
      });
    },

    // IBKR functions
    connectToIBKR: () => ipcRenderer.invoke('connect-to-ibkr'),
    disconnectFromIBKR: () => ipcRenderer.invoke('disconnect-from-ibkr'),
    getIBKRAccountSummary: () => ipcRenderer.invoke('get-ibkr-account-summary'),
    getIBKRPositions: () => ipcRenderer.invoke('get-ibkr-positions'),
    getIBKROrders: () => ipcRenderer.invoke('get-ibkr-orders'),
    getIBKRExecutions: () => ipcRenderer.invoke('get-ibkr-executions'),

    // Data Download Functions
    downloadSpyData: (options) => {
      console.log('[Preload Script] downloadSpyData called with options:', options);
      return ipcRenderer.invoke('download-spy-data', options);
    },

    downloadAlphaVantageData: (options) => {
      console.log('[Preload Script] downloadAlphaVantageData called with options:', options);
      return ipcRenderer.invoke('download-alpha-vantage-data', options);
    },

    downloadIBKRHistoricalData: (options) => {
      console.log('[Preload Script] downloadIBKRHistoricalData called with options:', options);
      return ipcRenderer.invoke('download-ibkr-historical-data', options);
    },

    downloadIBKRVIXData: (options) => {
      console.log('[Preload Script] downloadIBKRVIXData called with options:', options);
      return ipcRenderer.invoke('download-ibkr-vix-data', options);
    },

  onIBKREvent: (callback) => {
    const channel = 'ibkr-event';
    const subscription = (ipcEvent, eventData) => {
      console.log('[Preload] Received ibkr-event from main:', eventData);
      callback(eventData);
    };
    ipcRenderer.on(channel, subscription);
      return () => ipcRenderer.removeListener(channel, subscription);
  }
});
  console.log('[Preload Script] electronAPI exposed successfully');
} catch (error) {
  console.error('[Preload Script] Error exposing electronAPI:', error);
}

// Test: Simple credentials API
try {
contextBridge.exposeInMainWorld('credentials', {
    save: (broker, key, value) => {
      console.log('[Preload Script] credentials.save called with:', broker, key);
      return ipcRenderer.invoke('credentials-save', broker, key, value);
    },

    get: (broker, key) => {
      console.log('[Preload Script] credentials.get called with:', broker, key);
      return ipcRenderer.invoke('credentials-get', broker, key);
    },

    delete: (broker, key) => {
      console.log('[Preload Script] credentials.delete called with:', broker, key);
      return ipcRenderer.invoke('credentials-delete', broker, key);
    },

    isConfigured: (broker, primaryKey) => {
      console.log('[Preload Script] credentials.isConfigured called with:', broker, primaryKey);
      return ipcRenderer.invoke('credentials-is-configured', broker, primaryKey);
    }
});
  console.log('[Preload Script] credentials API exposed successfully');
} catch (error) {
  console.error('[Preload Script] Error exposing credentials API:', error);
}

console.log('[Preload Script] Execution completed');
