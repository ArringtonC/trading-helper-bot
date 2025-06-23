/**
 * Utility for triggering dashboard refreshes
 * 
 * This module provides a simple way to trigger dashboard refreshes
 * when account data changes, such as after importing IBKR statements.
 */

/**
 * Trigger a dashboard refresh event
 * 
 * This function dispatches a custom event that the dashboard can listen for
 * to refresh its data when account information changes.
 */
export const triggerDashboardRefresh = (): void => {
  // Dispatch a custom event that the dashboard can listen for
  const event = new CustomEvent('dashboard-data-updated');
  window.dispatchEvent(event);
  
  console.log('Dashboard refresh event triggered');
}; 