console.log('[Preload Script] TOP OF FILE - Preload script starting execution.');
console.log('Preload script is definitely running! CONTEXT BRIDGE CHECK.');

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Stores credentials securely via the main process.
   * @param broker The broker identifier (e.g., 'IBKR', 'Schwab').
   * @param username The username for the broker.
   * @param password The password for the broker.
   * @returns Promise<void>
   */
  storeCredentials: (broker: string, username: string, password: string): Promise<void> =>
    ipcRenderer.invoke('store-credentials', {
      service: `TradingHelperBot_${broker}`,
      account: username,
      password,
    }),

  /**
   * Retrieves credentials securely from the main process.
   * @param broker The broker identifier (e.g., 'IBKR', 'Schwab').
   * @param username The username associated with the credentials (used as the account key with keytar).
   * @returns Promise<{ username: string; password: string | null } | null> 
   *          The username and password, or null if not found or an error occurs.
   *          Password will be null if not found by keytar for that specific service/account.
   */
  getCredentials: (broker: string, username: string): Promise<{ username: string; password: string | null } | null> =>
    ipcRenderer.invoke('get-credentials', {
      service: `TradingHelperBot_${broker}`,
      account: username,
    }),

  // IBKR Specific Actions
  connectToIBKR: (): Promise<{ success: boolean; message?: string }> => 
    ipcRenderer.invoke('connect-to-ibkr'),
  
  disconnectFromIBKR: (): Promise<{ success: boolean; message?: string }> => 
    ipcRenderer.invoke('disconnect-from-ibkr'),

  getIBKRAccountSummary: (): Promise<{ success: boolean; message?: string }> =>
    ipcRenderer.invoke('get-ibkr-account-summary'),

  getIBKRPositions: (): Promise<{ success: boolean; positions?: any[]; message?: string }> =>
    ipcRenderer.invoke('get-ibkr-positions'),

  getIBKROrders: (): Promise<{ success: boolean; orders?: any[]; message?: string }> =>
    ipcRenderer.invoke('get-ibkr-orders'),

  getIBKRExecutions: (): Promise<{ success: boolean; executions?: any[]; message?: string }> =>
    ipcRenderer.invoke('get-ibkr-executions'),

  // ADD THIS NEW ENTRY FOR THE TEST HANDLER
  // testIbkrEvent: (): Promise<{ success: boolean }> => // Adjust Promise return type if needed
  //   ipcRenderer.invoke('test-ibkr-event'),           // Ensure channel name matches main process

  // Event Handling from Main to Renderer for IBKR
  onIBKREvent: (callback: (eventData: { type: string; [key: string]: any }) => void) => {
    const channel = 'ibkr-event';
    // ipcRenderer.on sends the event object as the first argument, and subsequent arguments follow.
    // We are assuming the main process sends a single object payload for 'ibkr-event'.
    const subscription = (ipcEvent: any, eventData: { type: string; [key: string]: any }) => {
      console.log('[Preload] Received ibkr-event from main:', eventData);
      callback(eventData);
    };
    ipcRenderer.on(channel, subscription);
    
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  }
});

// Expose CredentialService API under window.credentials
contextBridge.exposeInMainWorld('credentials', {
  save: (broker: string, key: string, value: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('credentials-save', broker, key, value),

  get: (broker: string, key: string): Promise<{ success: boolean; value?: string | null; error?: string }> =>
    ipcRenderer.invoke('credentials-get', broker, key),

  delete: (broker: string, key: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('credentials-delete', broker, key),

  isConfigured: (broker: string, primaryKey: string): Promise<{ success: boolean; isConfigured?: boolean; error?: string }> =>
    ipcRenderer.invoke('credentials-is-configured', broker, primaryKey)
});

console.log('[Preload Script] END OF FILE - Preload script execution finished.');
