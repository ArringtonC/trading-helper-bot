// src/services/BrokerService.ts

// This service acts as a client for IPC calls to the Electron main process for IBKR operations.
// It does NOT interact with the @stoqey/ib library directly.

/**
 * Attempts to connect to Interactive Brokers via the main process.
 * @returns Promise<{ success: boolean; message?: string }>
 */
export const connectToIBKR = async (): Promise<{ success: boolean; message?: string }> => {
  if (!window.electronAPI || !window.electronAPI.connectToIBKR) {
    console.error('BrokerService: Electron API for IBKR connection not found.');
    return { success: false, message: 'Electron API not available for connectToIBKR.' };
  }
  try {
    console.log('BrokerService: Requesting IBKR connection via IPC...');
    const result = await window.electronAPI.connectToIBKR();
    console.log('BrokerService: IPC connectToIBKR call returned:', result);

    if (result === undefined || result === null) {
      console.error('BrokerService: IPC connectToIBKR returned undefined or null. This indicates an issue in the main process handler.');
      return { success: false, message: 'IPC call returned no data. Check main process logs.' };
    }
    return result;
  } catch (error: any) {
    console.error('BrokerService: Error invoking connectToIBKR IPC:', error);
    const errorMessage = error?.message || (typeof error === 'string' ? error : 'IPC call failed with an unknown error');
    return { success: false, message: errorMessage };
  }
};

/**
 * Disconnects from Interactive Brokers via the main process.
 * @returns Promise<{ success: boolean; message?: string }>
 */
export const disconnectFromIBKR = async (): Promise<{ success: boolean; message?: string }> => {
  if (!window.electronAPI || !window.electronAPI.disconnectFromIBKR) {
    console.error('BrokerService: Electron API for IBKR disconnection not found.');
    return { success: false, message: 'Electron API not available for disconnectFromIBKR.' };
  }
  try {
    console.log('BrokerService: Requesting IBKR disconnection via IPC...');
    const result = await window.electronAPI.disconnectFromIBKR();
    console.log('BrokerService: IPC disconnectFromIBKR call returned:', result);
    return result;
  } catch (error: any) {
    console.error('BrokerService: Error invoking disconnectFromIBKR IPC:', error);
    return { success: false, message: error.message || 'IPC call failed' };
  }
};

/**
 * Requests IBKR account summary via the main process.
 * Actual summary data will be sent via an 'ibkr-event' from main process to renderer.
 * @returns Promise<{ success: boolean; message?: string }> 
 *          Indicates if the request was successfully sent, not the summary data itself.
 */
export const requestIBKRAccountSummary = async (): Promise<{ success: boolean; message?: string }> => {
  if (!window.electronAPI || !window.electronAPI.getIBKRAccountSummary) {
    console.error('BrokerService: Electron API for IBKR account summary not found.');
    return { success: false, message: 'Electron API not available for getIBKRAccountSummary.' };
  }
  try {
    console.log('BrokerService: Requesting IBKR account summary via IPC...');
    const result = await window.electronAPI.getIBKRAccountSummary();
    console.log('BrokerService: IPC getIBKRAccountSummary call returned:', result);
    return result;
  } catch (error: any) {
    console.error('BrokerService: Error invoking getIBKRAccountSummary IPC:', error);
    return { success: false, message: error.message || 'IPC call failed' };
  }
};

/**
 * Subscribes to IBKR events sent from the main process.
 * @param callback Function to handle incoming event data.
 *                 (e.g., eventData can be { type: 'connection-status', status: 'connected', message?: string } or 
 *                                     { type: 'account-summary', data: { ... } } or
 *                                     { type: 'error', message: '...', data?: any })
 * @returns Unsubscribe function, or null if API is not available.
 */
export const subscribeToIBKREvents = (callback: (eventData: { type: string; [key: string]: any }) => void): (() => void) | null => {
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
export const getIBKRPositions = async (): Promise<{ success: boolean; positions?: any[]; message?: string }> => {
  if (!window.electronAPI || !window.electronAPI.getIBKRPositions) {
    console.error('BrokerService: Electron API for IBKR positions not found.');
    return { success: false, message: 'Electron API not available for getIBKRPositions.' };
  }
  try {
    const result = await window.electronAPI.getIBKRPositions();
    console.log('BrokerService: IPC getIBKRPositions call returned:', result);
    return result;
  } catch (error: any) {
    console.error('BrokerService: Error invoking getIBKRPositions IPC:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Requests IBKR open orders via the main process.
 * @returns Promise<{ success: boolean; orders?: any[]; message?: string }>
 */
export const getIBKROrders = async (): Promise<{ success: boolean; orders?: any[]; message?: string }> => {
  if (!window.electronAPI || !window.electronAPI.getIBKROrders) {
    console.error('BrokerService: Electron API for IBKR orders not found.');
    return { success: false, message: 'Electron API not available for getIBKROrders.' };
  }
  try {
    const result = await window.electronAPI.getIBKROrders();
    console.log('BrokerService: IPC getIBKROrders call returned:', result);
    return result;
  } catch (error: any) {
    console.error('BrokerService: Error invoking getIBKROrders IPC:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Requests IBKR executions (order history) via the main process.
 * @returns Promise<{ success: boolean; executions?: any[]; message?: string }>
 */
export const getIBKRExecutions = async (): Promise<{ success: boolean; executions?: any[]; message?: string }> => {
  if (!window.electronAPI || !window.electronAPI.getIBKRExecutions) {
    console.error('BrokerService: Electron API for IBKR executions not found.');
    return { success: false, message: 'Electron API not available for getIBKRExecutions.' };
  }
  try {
    const result = await window.electronAPI.getIBKRExecutions();
    console.log('BrokerService: IPC getIBKRExecutions call returned:', result);
    return result;
  } catch (error: any) {
    console.error('BrokerService: Error invoking getIBKRExecutions IPC:', error);
    return { success: false, message: error.message };
  }
};
