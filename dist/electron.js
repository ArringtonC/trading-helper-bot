const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const fs = require('fs');
require('dotenv').config();
const { getCredentialService } = require('./services/CredentialService');

console.log('=== ELECTRON MAIN PROCESS STARTED ===');

let InteractiveBrokers;
try {
  const ibPackage = require('@stoqey/ib');
  console.log('[Electron Main] ibPackage typeof:', typeof ibPackage);
  // The default export is the constructor/class
  InteractiveBrokers = ibPackage.default || ibPackage;
  console.log('[Electron Main] typeof InteractiveBrokers:', typeof InteractiveBrokers);
  if (typeof InteractiveBrokers !== 'function') {
    console.error("Failed to correctly import InteractiveBrokers class from '@stoqey/ib'. Please check the library's export structure.");
    InteractiveBrokers = null;
  }
} catch (e) {
  console.error("Could not load '@stoqey/ib' module. Make sure it is installed:", e);
  InteractiveBrokers = null;
}

let ibClient = null; // Holds the InteractiveBrokers client instance
let mainWindow = null; // Holds the main browser window instance

// Function to validate IPC sender (from Perplexity research)
function validateSender(sender) {
  try {
    const url = new URL(sender.getURL());
    // For local development with http://localhost:3000
    if (isDev && url.origin === 'http://localhost:3000') {
      return true;
    }
    // For production with file:// protocol
    // IMPORTANT: Adjust 'app://trading-helper' or the file path check 
    // if your production app URL structure is different.
    // A common pattern for file URLs is checking the protocol and ensuring the path is within your app's bundle.
    if (!isDev && url.protocol === 'file:') {
        // This is a basic check. For more security, you might want to ensure
        // the path is specifically your app's index.html path.
        // console.log('Validating sender URL:', url.href);
        // return url.href.startsWith(`file://${path.join(__dirname, '../build/index.html')}`);
        return true; // Broadly allow file URLs for now, refine if needed
    }
    console.warn('Unauthorized IPC sender:', url.origin);
    return false;
  } catch (e) {
    console.error('Error validating sender:', e);
    return false;
  }
}

function createWindow() {
  const preloadPath = path.join(__dirname, 'public/preload.js');
  console.log('[Electron Main] Attempting to load preload script from:', preloadPath);

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      devTools: process.env.NODE_ENV !== 'production',
    }
  });

  // Load the app
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../build/index.html')}`;
  mainWindow.loadURL(startUrl);

  // Open DevTools in development
  if (process.env.NODE_ENV !== 'production') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null; // Dereference the window object
    if (ibClient && typeof ibClient.disconnect === 'function') { // Ensure disconnect method exists
      console.log('Main window closed, disconnecting IBKR client.');
      ibClient.disconnect(); // Or proper cleanup for @stoqey/ib
      ibClient = null;
    }
  });
}

// IBKR Connection and Interaction IPC Handlers
try { ipcMain.removeHandler('connect-to-ibkr'); } catch (e) {}
ipcMain.handle('connect-to-ibkr', async (event) => {
  console.log('=== connect-to-ibkr handler called ===');
  if (!validateSender(event.sender)) throw new Error('Unauthorized IPC call');
  if (!InteractiveBrokers) {
    console.error('IBKR SDK not loaded, cannot connect.');
    return { success: false, message: 'IBKR SDK not loaded.' };
  }
  if (ibClient && ibClient.isConnected) {
     console.log('IPC: Already connected to IBKR.');
     if (mainWindow) mainWindow.webContents.send('ibkr-event', { type: 'connection-status', status: 'connected', message: 'Already connected.' });
     return { success: true, message: 'Already connected.' };
  }

    console.log('IPC: Attempting to connect to IBKR...');
    // Get credentials using CredentialService
    const credentialService = getCredentialService(); // Ensure service is accessible here
    let username, password;
    try {
      const usernameResult = await credentialService.getCredential('ibkr', 'username');
      const passwordResult = await credentialService.getCredential('ibkr', 'password');
      // Ensure results are strings, null if not found or error during IPC is handled by getCredential itself
      username = typeof usernameResult === 'string' ? usernameResult : null;
      password = typeof passwordResult === 'string' ? passwordResult : null;

    } catch (e) {
      console.error('IPC: Error retrieving IBKR credentials from CredentialService:', e);
      if (mainWindow) mainWindow.webContents.send('ibkr-event', { type: 'connection-status', status: 'error', message: 'Error retrieving credentials.' });
      return { success: false, message: 'Error retrieving credentials.' };
    }

  if (!username || !password) {
    console.error('IPC: Failed to get IBKR username or password from CredentialService.');
    if (mainWindow) mainWindow.webContents.send('ibkr-event', { type: 'connection-status', status: 'error', message: 'IBKR credentials not found in secure storage.' });
    return { success: false, message: 'IBKR credentials not found in secure storage. Please configure them in settings.' };
  }

  try {
    // Determine IBKR port from env or default to 7497 (paper)
    const IBKR_PORT = process.env.IBKR_PORT ? parseInt(process.env.IBKR_PORT, 10) : 7497;
    console.log('Using IBKR port:', IBKR_PORT);
    console.log('IBKR credentials from secure store:', {
      username: username,
      password: password ? '***' : undefined, // Log password presence, not the value
      port: IBKR_PORT
    });
          // Generate a unique client ID to avoid conflicts
      const clientId = Math.floor(Math.random() * 10000) + 1000; // Random ID between 1000-10999
      console.log('Using IBKR client ID:', clientId);
      
    ibClient = new InteractiveBrokers({
      port: IBKR_PORT,
      host: '127.0.0.1',
        clientId: clientId
    });
    ['connected', 'error', 'disconnected', 'accountSummary'].forEach(event => {
      ibClient.on(event, (...args) => {
        console.log(`MAIN: IBKR Event '${event}':`, ...args);
      });
    });
    ibClient.on('all', (eventName, ...args) => {
      console.log('MAIN: [ALL EVENTS]', eventName, ...args);
    });
    ibClient.on('accountSummaryEnd', (...args) => {
      console.log('MAIN: IBKR Account Summary End', ...args);
    });
    ibClient.connect();
    console.log('MAIN: IBKR client instance created, waiting for events...');
    ibClient.on('connected', () => {
      console.log('MAIN: IBKR Connected!');
      if (mainWindow) mainWindow.webContents.send('ibkr-event', { type: 'connection-status', status: 'connected' });
      if (typeof ibClient.reqAccountSummary === 'function') {
          console.log('MAIN: Requesting account summary post-connection.');
          ibClient.reqAccountSummary(1, 'All', 'NetLiquidation,TotalCashValue,BuyingPower,AvailableFunds');
      } else {
          console.warn('MAIN: ibClient.reqAccountSummary is not a function. Cannot fetch summary automatically.');
      }
    });
    ibClient.on('disconnected', () => {
      console.log('MAIN: IBKR Disconnected!');
      if (mainWindow) mainWindow.webContents.send('ibkr-event', { type: 'connection-status', status: 'disconnected' });
      ibClient = null;
    });
    ibClient.on('error', (err, data) => {
      console.error('MAIN: IBKR Error:', err, data);
      
      // Check for client ID conflict (error code 326)
      if (data && data.code === 326) {
        console.log('MAIN: Client ID conflict detected. Cleaning up connection.');
        ibClient = null; // Clear the client to allow retry
      }
      
      if (mainWindow) mainWindow.webContents.send('ibkr-event', { type: 'error', message: data?.message || err?.message, data: data });
    });
    ibClient.on('accountSummary', (reqId, account, tag, value, currency) => {
      const row = { reqId, account, tag, value, currency };
      console.log('MAIN: IBKR Account Summary Received', row);
      if (mainWindow) mainWindow.webContents.send('ibkr-event', { type: 'account-summary', data: row });
    });
    console.log('IPC: IBKR client initialized. Connection attempt in progress.');
    return { success: true, message: 'Connection process initiated.' };
  } catch (error) {
    console.error('IPC: Error connecting to IBKR:', error);
    if (mainWindow) mainWindow.webContents.send('ibkr-event', { type: 'connection-status', status: 'error', message: error.message });
    return { success: false, message: error.message };
  }
});

try { ipcMain.removeHandler('disconnect-from-ibkr'); } catch (e) {}
ipcMain.handle('disconnect-from-ibkr', async (event) => {
  if (!validateSender(event.sender)) throw new Error('Unauthorized IPC call');
  console.log('IPC: Attempting to disconnect from IBKR...');
  if (ibClient) {
    try {
      if (typeof ibClient.disconnect === 'function') {
        await ibClient.disconnect();
      } else {
        console.warn('MAIN: ibClient.disconnect is not a function. Relying on library cleanup or setting to null.');
      }
      ibClient = null;
      if (mainWindow) mainWindow.webContents.send('ibkr-event', { type: 'connection-status', status: 'disconnected', message: 'User initiated disconnect.' });
      return { success: true };
    } catch (error) {
      console.error('IPC: Error disconnecting from IBKR:', error);
      return { success: false, message: error.message };
    }
  }
  console.log('IPC: No active IBKR client to disconnect.');
  return { success: true, message: 'No active client.' };
});

try { ipcMain.removeHandler('get-ibkr-account-summary'); } catch (e) {}
ipcMain.handle('get-ibkr-account-summary', async (event) => {
  if (!validateSender(event.sender)) throw new Error('Unauthorized IPC call');
  if (ibClient && typeof ibClient.reqAccountSummary === 'function') {
    try {
      console.log('IPC: Requesting IBKR Account Summary...');
      ibClient.reqAccountSummary(1, 'All', 'NetLiquidation,TotalCashValue,BuyingPower,AvailableFunds');
      return { success: true, message: 'Account summary request sent.' };
    } catch (error) {
      console.error('IPC: Error requesting IBKR Account Summary:', error);
      return { success: false, message: error.message };
    }
  } else {
    const notConnectedMsg = 'IBKR client not connected or reqAccountSummary not available.';
    console.warn(`IPC: ${notConnectedMsg}`);
    if (mainWindow) mainWindow.webContents.send('ibkr-event', { type: 'error', message: notConnectedMsg });
    return { success: false, message: notConnectedMsg };
  }
});

try { ipcMain.removeHandler('get-ibkr-positions'); } catch (e) {}
ipcMain.handle('get-ibkr-positions', async (event) => {
  if (!validateSender(event.sender)) throw new Error('Unauthorized IPC call');
  if (!ibClient || typeof ibClient.reqPositions !== 'function') {
    const msg = 'IBKR client not connected or reqPositions not available.';
    console.warn(msg);
    return { success: false, message: msg };
  }
  return new Promise((resolve) => {
    const positions = [];
    const onPosition = (account, contract, pos, avgCost) => {
      positions.push({ account, contract, pos, avgCost });
    };
    const onPositionEnd = () => {
      ibClient.off('position', onPosition);
      ibClient.off('positionEnd', onPositionEnd);
      resolve({ success: true, positions });
    };
    ibClient.on('position', onPosition);
    ibClient.on('positionEnd', onPositionEnd);
    try {
      ibClient.reqPositions();
    } catch (err) {
      ibClient.off('position', onPosition);
      ibClient.off('positionEnd', onPositionEnd);
      resolve({ success: false, message: err.message });
    }
  });
});

try { ipcMain.removeHandler('get-ibkr-orders'); } catch (e) {}
ipcMain.handle('get-ibkr-orders', async (event) => {
  if (!validateSender(event.sender)) throw new Error('Unauthorized IPC call');
  if (!ibClient || typeof ibClient.reqOpenOrders !== 'function') {
    const msg = 'IBKR client not connected or reqOpenOrders not available.';
    console.warn(msg);
    return { success: false, message: msg };
  }
  return new Promise((resolve) => {
    const orders = [];
    const onOrder = (orderId, contract, order, orderState) => {
      orders.push({ orderId, contract, order, orderState });
    };
    const onOpenOrderEnd = () => {
      ibClient.off('order', onOrder);
      ibClient.off('openOrderEnd', onOpenOrderEnd);
      resolve({ success: true, orders });
    };
    ibClient.on('order', onOrder);
    ibClient.on('openOrderEnd', onOpenOrderEnd);
    try {
      ibClient.reqOpenOrders();
    } catch (err) {
      ibClient.off('order', onOrder);
      ibClient.off('openOrderEnd', onOpenOrderEnd);
      resolve({ success: false, message: err.message });
    }
  });
});

try { ipcMain.removeHandler('get-ibkr-executions'); } catch (e) {}
ipcMain.handle('get-ibkr-executions', async (event) => {
  if (!validateSender(event.sender)) throw new Error('Unauthorized IPC call');
  if (!ibClient || typeof ibClient.reqExecutions !== 'function') {
    const msg = 'IBKR client not connected or reqExecutions not available.';
    console.warn(msg);
    return { success: false, message: msg };
  }
  return new Promise((resolve) => {
    const executions = [];
    const onExecution = (reqId, contract, execution) => {
      executions.push({ reqId, contract, execution });
    };
    const onExecDetailsEnd = (reqId) => {
      ibClient.off('execution', onExecution);
      ibClient.off('execDetailsEnd', onExecDetailsEnd);
      resolve({ success: true, executions });
    };
    ibClient.on('execution', onExecution);
    ibClient.on('execDetailsEnd', onExecDetailsEnd);
    try {
      ibClient.reqExecutions(1, {}); // 1 = reqId, {} = filter (all executions)
    } catch (err) {
      ibClient.off('execution', onExecution);
      ibClient.off('execDetailsEnd', onExecDetailsEnd);
      resolve({ success: false, message: err.message });
    }
  });
});

// SPY Data Download Handler - Bypasses CORS by using main process
try { ipcMain.removeHandler('download-spy-data'); } catch (e) {}
ipcMain.handle('download-spy-data', async (event, options = {}) => {
  if (!validateSender(event.sender)) throw new Error('Unauthorized IPC call');
  
  const https = require('https');
  
  try {
    // Default to 2 years of data ending today
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - (options.years || 2));
    const endDate = options.endDate ? new Date(options.endDate) : new Date();
    
    const period1 = Math.floor(startDate.getTime() / 1000);
    const period2 = Math.floor(endDate.getTime() / 1000);
    
    const symbol = options.symbol || 'SPY';
    const url = `https://query1.finance.yahoo.com/v7/finance/download/${symbol}?period1=${period1}&period2=${period2}&interval=1d&events=history&includeAdjustedClose=true`;
    
    console.log(`[Electron Main] Downloading ${symbol} data from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
    
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        if (res.statusCode !== 200) {
          console.error(`[Electron Main] Failed to download ${symbol} data:`, res.statusCode);
          resolve({ success: false, error: `HTTP ${res.statusCode}` });
          return;
        }
        
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log(`[Electron Main] Successfully downloaded ${symbol} data (${data.length} bytes)`);
          resolve({ 
            success: true, 
            data: data,
            filename: `${symbol}_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.csv`,
            dateRange: {
              start: startDate.toISOString().split('T')[0],
              end: endDate.toISOString().split('T')[0]
            }
          });
        });
      }).on('error', (err) => {
        console.error(`[Electron Main] Error downloading ${symbol} data:`, err.message);
        resolve({ success: false, error: err.message });
      });
    });
  } catch (error) {
    console.error('[Electron Main] Error in download-spy-data handler:', error);
    return { success: false, error: error.message };
  }
});

app.whenReady().then(() => {
  createWindow();

  // Initialize CredentialService after app is ready
  try {
    const credentialService = getCredentialService();
    console.log('CredentialService initialized successfully.');

    // IPC Handlers for CredentialService
    ipcMain.handle('credentials-save', async (event, broker, key, value) => {
      try {
        await credentialService.saveCredential(broker, key, value);
        return { success: true };
      } catch (error) {
        console.error('IPC credentials-save error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('credentials-get', async (event, broker, key) => {
      try {
        const value = await credentialService.getCredential(broker, key);
        return { success: true, value };
      } catch (error) {
        console.error('IPC credentials-get error:', error);
        return { success: false, error: error.message, value: null };
      }
    });

    ipcMain.handle('credentials-delete', async (event, broker, key) => {
      try {
        await credentialService.deleteCredential(broker, key);
        return { success: true };
      } catch (error) {
        console.error('IPC credentials-delete error:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('credentials-is-configured', async (event, broker, primaryKey) => {
      try {
        const isConfigured = await credentialService.isBrokerConfigured(broker, primaryKey);
        return { success: true, isConfigured };
      } catch (error) {
        console.error('IPC credentials-is-configured error:', error);
        return { success: false, error: error.message, isConfigured: false };
      }
    });

  } catch (error) {
    console.error('Failed to initialize CredentialService or set up IPC handlers:', error);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IBKR Historical Data Download Handler (for any symbol)
try { ipcMain.removeHandler('download-ibkr-historical-data'); } catch (e) {}
ipcMain.handle('download-ibkr-historical-data', async (event, options = {}) => {
  if (!validateSender(event.sender)) throw new Error('Unauthorized IPC call');
  
  if (!ibClient || !ibClient.isConnected) {
    console.error('[Electron Main] IBKR client not connected for historical data request');
    return { success: false, error: 'IBKR client not connected. Please connect to IBKR first.' };
  }

  try {
    const symbol = options.symbol || 'SPY';
    const duration = options.duration || '2 Y';
    const barSize = options.barSize || '1 day';
    const endDate = options.endDate || '';
    const contract = {
      symbol: symbol,
      secType: 'STK', // Stock
      exchange: 'SMART', // IBKR's smart routing
      currency: 'USD'
    };

    console.log(`[Electron Main] Requesting ${symbol} historical data with contract:`, contract);
    console.log(`[Electron Main] Duration: ${duration}, BarSize: ${barSize}, EndDate: ${endDate}`);

    return new Promise((resolve) => {
      const historicalData = [];
      const reqId = Math.floor(Math.random() * 10000);
      let timeoutId;

      const onHistoricalData = (reqId_1, date, open, high, low, close, volume, count, WAP) => {
        if (reqId_1 === reqId) {
          // Filter out IBKR's "finished" message and invalid data
          if (typeof date === 'string' && date.includes('finished')) {
            console.log(`[Electron Main] ${symbol} Historical data: Received finished signal, ignoring`);
            return;
          }
          if (close === -1 || open === -1) {
            console.log(`[Electron Main] ${symbol} Historical data: Received invalid data, ignoring`);
            return;
          }
          console.log(`[Electron Main] ${symbol} Historical data received: Date=${date}, Close=${close}, Volume=${volume}`);
          historicalData.push({
            date: date,
            open: open,
            high: high,
            low: low,
            close: close,
            volume: volume
          });
        }
      };

      const onHistoricalDataEnd = (reqId_1, start, end) => {
        console.log(`[Electron Main] ${symbol} historicalDataEnd triggered - reqId: ${reqId_1}, collected data points: ${historicalData.length}`);
        if (timeoutId) clearTimeout(timeoutId);
        ibClient.off('historicalData', onHistoricalData);
        ibClient.off('historicalDataEnd', onHistoricalDataEnd);
        ibClient.off('error', onError);

        if (historicalData.length === 0) {
          console.error(`[Electron Main] No ${symbol} historical data received from IBKR`);
          resolve({ success: false, error: `No ${symbol} historical data received from IBKR` });
          return;
        }

        // Convert to CSV format
        const csvHeader = 'Date,Open,High,Low,Close,Volume\n';
        const csvRows = historicalData.map(row => {
          // Format date properly
          let formattedDate = row.date;
          if (typeof row.date === 'string' && row.date.length === 8) {
            // Format YYYYMMDD to YYYY-MM-DD
            formattedDate = `${row.date.slice(0, 4)}-${row.date.slice(4, 6)}-${row.date.slice(6, 8)}`;
          }
          return `${formattedDate},${row.open},${row.high},${row.low},${row.close},${row.volume}`;
        });
        const csvData = csvHeader + csvRows.join('\n');
        const now = new Date();
        const timestamp = now.toISOString().split('T')[0]; // YYYY-MM-DD format
        const filename = `${symbol}_IBKR_${timestamp}.csv`;

        console.log(`[Electron Main] ${symbol} CSV data prepared successfully - ${historicalData.length} data points, filename: ${filename}`);

        resolve({
          success: true,
          data: csvData,
          filename: filename,
          source: 'IBKR',
          dataPoints: historicalData.length,
          dateRange: {
            start: historicalData[0]?.date,
            end: historicalData[historicalData.length - 1]?.date
          }
        });
      };

      const onError = (reqId_1, code, message) => {
        if (reqId_1 === reqId) {
          if (timeoutId) clearTimeout(timeoutId);
          ibClient.off('historicalData', onHistoricalData);
          ibClient.off('historicalDataEnd', onHistoricalDataEnd);
          ibClient.off('error', onError);
          console.error(`[Electron Main] IBKR ${symbol} historical data error: ${code} - ${message}`);
          resolve({ success: false, error: `IBKR Error ${code}: ${message}` });
        }
      };

      // Set up event listeners
      ibClient.on('historicalData', onHistoricalData);
      ibClient.on('historicalDataEnd', onHistoricalDataEnd);
      ibClient.on('error', onError);

      // Set timeout as fallback (30 seconds)
      timeoutId = setTimeout(() => {
        console.log(`[Electron Main] ${symbol} data request timeout - received ${historicalData.length} data points so far`);
        ibClient.off('historicalData', onHistoricalData);
        ibClient.off('historicalDataEnd', onHistoricalDataEnd);
        ibClient.off('error', onError);

        if (historicalData.length > 0) {
          // Convert partial data to CSV
          const csvHeader = 'Date,Open,High,Low,Close,Volume\n';
          const csvRows = historicalData.map(row => {
            let formattedDate = row.date;
            if (typeof row.date === 'string' && row.date.length === 8) {
              formattedDate = `${row.date.slice(0, 4)}-${row.date.slice(4, 6)}-${row.date.slice(6, 8)}`;
            }
            return `${formattedDate},${row.open},${row.high},${row.low},${row.close},${row.volume}`;
          });
          const csvData = csvHeader + csvRows.join('\n');
          const now = new Date();
          const timestamp = now.toISOString().split('T')[0];
          const filename = `${symbol}_IBKR_${timestamp}.csv`;

          resolve({
            success: true,
            data: csvData,
            filename: filename,
            source: 'IBKR (Partial)',
            dataPoints: historicalData.length,
            dateRange: {
              start: historicalData[0]?.date,
              end: historicalData[historicalData.length - 1]?.date
            }
          });
        } else {
          resolve({ success: false, error: `${symbol} data request timeout - no data received` });
        }
      }, 30000);

      // Make the request
      ibClient.reqHistoricalData(reqId, contract, endDate, duration, barSize, 'TRADES', 1, 1, false, []);
    });
  } catch (err) {
    console.error(`[Electron Main] Error in ${options.symbol || 'SPY'} historical data request:`, err);
    return { success: false, error: err.message || String(err) };
  }
});

// IBKR VIX Historical Data Download Handler
try { ipcMain.removeHandler('download-ibkr-vix-data'); } catch (e) {}
ipcMain.handle('download-ibkr-vix-data', async (event, options = {}) => {
  if (!validateSender(event.sender)) throw new Error('Unauthorized IPC call');
  
  if (!ibClient || !ibClient.isConnected) {
    console.error('[Electron Main] IBKR client not connected for VIX data request');
    return { success: false, error: 'IBKR client not connected. Please connect to IBKR first.' };
  }

  try {
    const symbol = 'VIX';
    const duration = options.duration || '2 Y';
    const barSize = options.barSize || '1 day';
    const endDate = options.endDate || '';
    const contract = {
      symbol: symbol,
      secType: 'IND', // Index
      exchange: 'CBOE', // Chicago Board Options Exchange
      currency: 'USD'
    };

    console.log(`[Electron Main] Requesting VIX historical data with contract:`, contract);
    console.log(`[Electron Main] Duration: ${duration}, BarSize: ${barSize}, EndDate: ${endDate}`);

    return new Promise((resolve) => {
      const historicalData = [];
      const reqId = Math.floor(Math.random() * 10000);
      let timeoutId;

      const onHistoricalData = (reqId_1, date, open, high, low, close, volume, count, WAP) => {
        if (reqId_1 === reqId) {
          // Filter out IBKR's "finished" message and invalid data
          if (typeof date === 'string' && date.includes('finished')) {
            console.log('[Electron Main] VIX Historical data: Received finished signal, ignoring');
            return;
          }
          if (close === -1 || open === -1) {
            console.log('[Electron Main] VIX Historical data: Received invalid data, ignoring');
            return;
          }
          console.log(`[Electron Main] VIX Historical data received: Date=${date}, Close=${close}, Volume=${volume}`);
          historicalData.push({
            date: date,
            open: open,
            high: high,
            low: low,
            close: close,
            volume: volume
          });
        }
      };

      const onHistoricalDataEnd = (reqId_1, start, end) => {
        console.log(`[Electron Main] VIX historicalDataEnd triggered - reqId: ${reqId_1}, collected data points: ${historicalData.length}`);
        if (timeoutId) clearTimeout(timeoutId);
        ibClient.off('historicalData', onHistoricalData);
        ibClient.off('historicalDataEnd', onHistoricalDataEnd);
        ibClient.off('error', onError);

        if (historicalData.length === 0) {
          console.error('[Electron Main] No VIX historical data received from IBKR');
          resolve({ success: false, error: 'No VIX historical data received from IBKR' });
          return;
        }

        // Convert to CSV format
        const csvHeader = 'Date,Open,High,Low,Close,Volume\n';
        const csvRows = historicalData.map(row => {
          // Format date properly
          let formattedDate = row.date;
          if (typeof row.date === 'string' && row.date.length === 8) {
            // Format YYYYMMDD to YYYY-MM-DD
            formattedDate = `${row.date.slice(0, 4)}-${row.date.slice(4, 6)}-${row.date.slice(6, 8)}`;
          }
          return `${formattedDate},${row.open},${row.high},${row.low},${row.close},${row.volume}`;
        });
        const csvData = csvHeader + csvRows.join('\n');
        const now = new Date();
        const timestamp = now.toISOString().split('T')[0]; // YYYY-MM-DD format
        const filename = `VIX_IBKR_${timestamp}.csv`;

        console.log(`[Electron Main] VIX CSV data prepared successfully - ${historicalData.length} data points, filename: ${filename}`);

        resolve({
          success: true,
          data: csvData,
          filename: filename,
          source: 'IBKR',
          dataPoints: historicalData.length,
          dateRange: {
            start: historicalData[0]?.date,
            end: historicalData[historicalData.length - 1]?.date
          }
        });
      };

      const onError = (reqId_1, code, message) => {
        if (reqId_1 === reqId) {
          if (timeoutId) clearTimeout(timeoutId);
          ibClient.off('historicalData', onHistoricalData);
          ibClient.off('historicalDataEnd', onHistoricalDataEnd);
          ibClient.off('error', onError);
          console.error(`[Electron Main] IBKR VIX historical data error: ${code} - ${message}`);
          resolve({ success: false, error: `IBKR Error ${code}: ${message}` });
        }
      };

      // Set up event listeners
      ibClient.on('historicalData', onHistoricalData);
      ibClient.on('historicalDataEnd', onHistoricalDataEnd);
      ibClient.on('error', onError);

      // Set timeout as fallback (30 seconds)
      timeoutId = setTimeout(() => {
        console.log(`[Electron Main] VIX data request timeout - received ${historicalData.length} data points so far`);
        ibClient.off('historicalData', onHistoricalData);
        ibClient.off('historicalDataEnd', onHistoricalDataEnd);
        ibClient.off('error', onError);

        if (historicalData.length > 0) {
          // Convert partial data to CSV
          const csvHeader = 'Date,Open,High,Low,Close,Volume\n';
          const csvRows = historicalData.map(row => {
            let formattedDate = row.date;
            if (typeof row.date === 'string' && row.date.length === 8) {
              formattedDate = `${row.date.slice(0, 4)}-${row.date.slice(4, 6)}-${row.date.slice(6, 8)}`;
            }
            return `${formattedDate},${row.open},${row.high},${row.low},${row.close},${row.volume}`;
          });
          const csvData = csvHeader + csvRows.join('\n');
          const now = new Date();
          const timestamp = now.toISOString().split('T')[0];
          const filename = `VIX_IBKR_${timestamp}.csv`;

          resolve({
            success: true,
            data: csvData,
            filename: filename,
            source: 'IBKR (Partial)',
            dataPoints: historicalData.length,
            dateRange: {
              start: historicalData[0]?.date,
              end: historicalData[historicalData.length - 1]?.date
            }
          });
        } else {
          resolve({ success: false, error: 'VIX data request timeout - no data received' });
        }
      }, 30000);

      // Make the request
      ibClient.reqHistoricalData(reqId, contract, endDate, duration, barSize, 'TRADES', 1, 1, false, []);
    });
  } catch (err) {
    console.error('[Electron Main] Error in VIX historical data request:', err);
    return { success: false, error: err.message || String(err) };
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// Example IPC handler (can be expanded)
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Example: Listen for a message from the renderer process
ipcMain.on('renderer-message', (event, arg) => {
  console.log('Message from renderer:', arg); // Log the message
  // Example: Send a reply back to the renderer process that sent the message
  event.sender.send('main-reply', 'Message received by main process!');
});

// Add more IPC handlers as needed for your application 