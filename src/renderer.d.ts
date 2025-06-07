// src/renderer.d.ts

// This declares the 'electronAPI' object that the preload script exposes on the window object.
// It allows TypeScript in the renderer process (your React components) to know about these functions
// and their signatures, providing type safety and autocompletion.

export interface IElectronAPI {
  // Credential Management
  storeCredentials: (
    broker: string,
    username: string,
    password: string
  ) => Promise<void>;
  getCredentials: (
    broker: string,
    username: string // This username is used as the 'account' key for keytar
  ) => Promise<{ username: string; password: string | null } | null>;

  // IBKR Specific Actions
  connectToIBKR: () => Promise<{ success: boolean; message?: string }>;
  disconnectFromIBKR: () => Promise<{ success: boolean; message?: string }>;
  getIBKRAccountSummary: () => Promise<{ success: boolean; message?: string }>; // Result data will come via onIBKREvent
  getIBKRPositions: () => Promise<{ success: boolean; positions?: any[]; message?: string }>;
  getIBKROrders: () => Promise<{ success: boolean; orders?: any[]; message?: string }>;
  getIBKRExecutions: () => Promise<{ success: boolean; executions?: any[]; message?: string }>;

  // Data Download Functions
  downloadSpyData: (options?: { symbol?: string; years?: number; endDate?: string }) => Promise<{ success: boolean; data?: string; filename?: string; dateRange?: { start: string; end: string }; error?: string }>;
  downloadAlphaVantageData: (options?: { symbol?: string; outputsize?: 'compact' | 'full' }) => Promise<{ success: boolean; data?: string; filename?: string; source?: string; dateRange?: { start: string; end: string }; error?: string }>;
  downloadIBKRHistoricalData: (options?: { symbol?: string; duration?: string; barSize?: string; endDate?: string }) => Promise<{ success: boolean; data?: string; filename?: string; source?: string; dateRange?: { start: string; end: string }; dataPoints?: number; error?: string }>;
  downloadIBKRVIXData: (options?: { duration?: string; barSize?: string; endDate?: string }) => Promise<{ success: boolean; data?: string; filename?: string; source?: string; dataPoints?: number; dateRange?: { start: string; end: string }; error?: string }>;

  // Event Handling from Main to Renderer for IBKR
  // The callback will receive an object, e.g., { type: 'connection-status', status: 'connected' } or { type: 'account-summary', data: { ... } }
  onIBKREvent: (callback: (eventData: { type: string; [key: string]: any }) => void) => () => void; // Returns an unsubscribe function
}

export interface ICredentials {
  save: (broker: string, key: string, value: string) => Promise<{ success: boolean; error?: string }>;
  get: (broker: string, key: string) => Promise<{ success: boolean; value?: string | null; error?: string }>;
  delete: (broker: string, key: string) => Promise<{ success: boolean; error?: string }>;
  isConfigured: (broker: string, primaryKey: string) => Promise<{ success: boolean; isConfigured?: boolean; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
    credentials: ICredentials;
  }
} 