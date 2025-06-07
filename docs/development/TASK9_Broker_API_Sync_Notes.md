# Task #9: Develop Broker API Synchronization - Notes & Learnings

**Status:** In Progress

## Overview

This document captures key information, research findings, decisions, roadblocks, and learnings related to implementing Task #9: Develop Broker API Synchronization.

## General Notes & Research

*   Interactive Brokers API Library: `@stoqey/ib`
    *   Potential primary link: (User to add if found, e.g., `https://github.com/stoqey/ib`)
*   Schwab API: (Research pending for Subtask 9.2)

## Decisions Made

*   **Initial IBKR Library Choice:** `@stoqey/ib` will be used for Interactive Brokers integration.
*   **Long-term Credential Management (Subtask 9.3):** Based on research, the approach will be:
    *   UI in application settings for users to input credentials.
    *   Credentials sent via secure Electron IPC (using `contextBridge` and preload scripts) from Renderer to Main process.
    *   Main process to use `keytar` for secure storage in OS keychain, with namespacing (e.g., `TradingHelperBot_IBKR`).
    *   Main process to validate sender origin for IPC requests.
*   **Short-term Credential Handling (for initial 9.1 testing):**
    *   Using environment variables (`REACT_APP_IBKR_USERNAME`, `REACT_APP_IBKR_PASSWORD`, `REACT_APP_IBKR_PAPER_TRADING`) loaded in `BrokerService.ts`.

## Potential Roadblocks & Questions

*   Complexity of the authentication flow if not fully abstracted by `@stoqey/ib`.
*   Specifics of error handling and reconnect logic for the chosen IBKR library.
*   Ensuring robust and secure IPC communication for credential management.
*   Handling `keytar` specific errors (e.g., keychain locked).
*   Integrating `keytar` and its dependencies (may require native compilation steps).

---

## Subtask Specific Notes

### Subtask 9.1: IBKR Client Implementation
*   **Status:** In Progress
*   **Key Files:** `src/services/BrokerService.ts`
*   **Objective:** Establish basic connection and authentication with IBKR using `@stoqey/ib`.
*   **Learnings/Updates:**
    *   Initial `BrokerService.ts` created with functions for client initialization, connection, and disconnection.
    *   Requires installation of `@stoqey/ib` (`npm install @stoqey/ib`).
    *   Requires local `.env` file with `REACT_APP_IBKR_USERNAME`, `REACT_APP_IBKR_PASSWORD`, and `REACT_APP_IBKR_PAPER_TRADING` for testing.

### Subtask 9.2: Schwab Integration Development
*   **Status:** Pending
*   **Objective:** Research and implement client for Schwab API.
*   **Learnings/Updates:**
    *   *(To be filled)*

### Subtask 9.3: Authentication & Credential Management
*   **Status:** Pending
*   **Objective:** Implement secure storage and retrieval of user-provided broker credentials using Electron IPC and OS keychain.
*   **Key Research Findings (from Perplexity):**
    *   **Secure IPC & `keytar` Integration:**
        *   Use `contextBridge` and preload scripts to expose minimal IPC methods.
        *   Main process should validate sender origin for all IPC requests (e.g., `url.origin === 'app://trading-helper'`).
        *   Store credentials using `keytar` with service/account namespacing (e.g., `TradingHelperBot_IBKR`).
    *   **TypeScript Implementation - Main Process (IPC Handlers):**
        ```typescript
        // main.ts (Conceptual)
        // import { ipcMain } from 'electron';
        // import * as keytar from 'keytar';
        //
        // ipcMain.handle('store-credentials', async (event, { service, account, password }) => {
        //   if (!validateSender(event.sender)) throw new Error('Unauthorized');
        //   await keytar.setPassword(service, account, password);
        // });
        //
        // ipcMain.handle('get-credentials', async (event, { service, account }) => {
        //   if (!validateSender(event.sender)) throw new Error('Unauthorized');
        //   return await keytar.getPassword(service, account);
        // });
        //
        // function validateSender(sender: Electron.WebContents) {
        //   const url = new URL(sender.getURL());
        //   return url.origin === 'app://trading-helper'; // Adjust if app protocol is different
        // }
        ```
    *   **TypeScript Implementation - Renderer Process (Preload Script):**
        ```typescript
        // preload.ts (Conceptual)
        // const { contextBridge, ipcRenderer } = require('electron');
        //
        // contextBridge.exposeInMainWorld('electronAPI', {
        //   storeCredentials: (broker: string, username: string, password: string) => 
        //     ipcRenderer.invoke('store-credentials', {
        //       service: `TradingHelperBot_${broker}`, // e.g., TradingHelperBot_IBKR
        //       account: username,
        //       password
        //     }),
        //   getCredentials: (broker: string, username: string) => // Username might be part of service key if static per broker
        //     ipcRenderer.invoke('get-credentials', {
        //       service: `TradingHelperBot_${broker}`,
        //       account: username 
        //     })
        // });
        ```
    *   **React Component Usage (`BrokerService.ts` adaptation):**
        ```typescript
        // BrokerService.ts (Conceptual for fetching credentials)
        // async function initializeBroker(brokerType: 'IBKR' | 'Schwab', /* username as param if needed */) {
        //   try {
        //     const credentials = await window.electronAPI.getCredentials(brokerType, /* username if used as account key */);
        //     // this.ib = new InteractiveBrokers({ username: credentials.username, password: credentials.password });
        //   } catch (error) {
        //     console.error('Credential retrieval failed:', error);
        //   }
        // }
        // Consider a static factory method:
        // static async create(brokerType: string, username: string) {
        //   const password = await window.electronAPI.getCredentials(brokerType, username);
        //   if (!password) throw new Error('Credentials not found or retrieval failed');
        //   return new BrokerService(new InteractiveBrokers({ username, password }));
        // }
        ```
    *   **Security Considerations:**
        *   Context Isolation (enabled by default in recent Electron versions).
        *   IPC sender validation is critical.
        *   `keytar` error handling (e.g., `Keychain locked` -> prompt user to re-authenticate/unlock).
    *   **Multi-Broker Support:**
        *   Namespace pattern for service names in `keytar` (e.g., `TradingHelperBot_IBKR`, `TradingHelperBot_Schwab`).
    *   **Recommended Security Additions (Long-Term):**
        *   Content Security Policy (CSP) meta tag.
        *   Process Sandboxing (`webPreferences`).
        *   Consider `safeStorage` for non-credential configuration if OS keychain is not suitable for that.
        *   Production: Certificate pinning, tamper detection, security audits (e.g., Electronegativity).
*   **Implementation Notes:**
    *   *(To be filled as Subtask 9.3 is implemented)*

### Subtask 9.4: Sync Service Architecture
*   **Status:** Pending
*   **Objective:** Design and implement service to regularly fetch and update account data (balances, positions, orders).
*   **Learnings/Updates:**
    *   *(To be filled)*

### Subtask 9.5: Error Handling & Retry Logic
*   **Status:** Pending
*   **Objective:** Implement robust error handling for API interactions and data synchronization.
*   **Learnings/Updates:**
    *   *(To be filled)*

### Subtask 9.6: Alert Push Service
*   **Status:** Pending
*   **Objective:** Develop a system to notify users of important account events or data changes.
*   **Learnings/Updates:**
    *   *(To be filled)*

### Subtask 9.7: Fallback Mechanism Implementation
*   **Status:** Pending
*   **Objective:** Design strategies for handling API outages or data inconsistencies.
*   **Learnings/Updates:**
    *   *(To be filled)* 