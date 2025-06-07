/**
 * Enhanced dashboard refresh mechanism with multiple fallbacks
 * This utility provides multiple ways to refresh the dashboard when data changes
 */
export var refreshDashboard = function () {
    console.log('Triggering dashboard refresh...');
    // Method 1: Dispatch custom event
    try {
        var event_1 = new CustomEvent('dashboard-data-updated');
        window.dispatchEvent(event_1);
        console.log('Dashboard refresh event dispatched');
    }
    catch (error) {
        console.error('Error dispatching dashboard event:', error);
    }
    // Method 2: Set a flag in localStorage to trigger refresh
    try {
        localStorage.setItem('dashboard-refresh-needed', Date.now().toString());
        console.log('Dashboard refresh flag set in localStorage');
    }
    catch (error) {
        console.error('Error setting refresh flag in localStorage:', error);
    }
    // Method 3: Attempt to reload page if nothing else works
    try {
        setTimeout(function () {
            var lastRefresh = localStorage.getItem('last-dashboard-refresh');
            var currentTime = Date.now();
            if (!lastRefresh || (currentTime - parseInt(lastRefresh)) > 5000) {
                console.log('Forcing page reload for dashboard refresh');
                localStorage.setItem('last-dashboard-refresh', currentTime.toString());
                // This is a fallback - should be used only if necessary
                // window.location.reload();
            }
        }, 2000);
    }
    catch (error) {
        console.error('Error in refresh fallback:', error);
    }
};
