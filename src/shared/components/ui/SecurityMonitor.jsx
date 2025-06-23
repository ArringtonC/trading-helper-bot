import React, { useState, useEffect } from 'react';
import { getSecurityEvents, getRateLimitStatus } from '../../utils/rateLimiter';

/**
 * Security Monitor Component
 * Displays rate limiting status and security events
 */
const SecurityMonitor = ({ isAdmin = false }) => {
  const [securityData, setSecurityData] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const updateSecurityData = () => {
      const events = getSecurityEvents();
      const apiStatus = getRateLimitStatus('api');
      const uploadStatus = getRateLimitStatus('upload');
      const calculationStatus = getRateLimitStatus('calculation');

      setSecurityData({
        events,
        status: {
          api: apiStatus,
          upload: uploadStatus,
          calculation: calculationStatus
        }
      });
    };

    updateSecurityData();
    const interval = setInterval(updateSecurityData, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  if (!isAdmin || !securityData) {
    return null;
  }

  const getStatusColor = (remaining, limit) => {
    const percentage = (remaining / limit) * 100;
    if (percentage > 50) return 'text-green-600 bg-green-50';
    if (percentage > 20) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getEventTypeIcon = (type) => {
    switch (type) {
      case 'BLOCKED_REQUEST':
        return '🚫';
      case 'SUSPICIOUS_ACTIVITY':
        return '⚠️';
      case 'CLIENT_BLOCKED':
        return '🔒';
      case 'CLIENT_UNBLOCKED':
        return '🔓';
      case 'INVALID_UPLOAD':
        return '📁';
      case 'WARNING':
        return '⚡';
      default:
        return '📊';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Compact Status Indicator */}
      <div 
        className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 cursor-pointer hover:shadow-xl transition-all"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700">Security Monitor</span>
          <svg 
            className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Security Panel */}
      {isExpanded && (
        <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 max-w-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Rate Limiting Status</h3>
            
            {/* API Status */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">API Requests</span>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(securityData.status.api.remaining, securityData.status.api.limit)}`}>
                  {securityData.status.api.remaining}/{securityData.status.api.limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${(securityData.status.api.remaining / securityData.status.api.limit) * 100}%` 
                  }}
                ></div>
              </div>
            </div>

            {/* Upload Status */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">File Uploads</span>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(securityData.status.upload.remaining, securityData.status.upload.limit)}`}>
                  {securityData.status.upload.remaining}/{securityData.status.upload.limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${(securityData.status.upload.remaining / securityData.status.upload.limit) * 100}%` 
                  }}
                ></div>
              </div>
            </div>

            {/* Calculation Status */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Calculations</span>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(securityData.status.calculation.remaining, securityData.status.calculation.limit)}`}>
                  {securityData.status.calculation.remaining}/{securityData.status.calculation.limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${(securityData.status.calculation.remaining / securityData.status.calculation.limit) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Security Events */}
          <div>
            <h4 className="text-md font-semibold text-gray-800 mb-2">Recent Security Events</h4>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {securityData.events.events.length === 0 ? (
                <p className="text-sm text-gray-500">No security events</p>
              ) : (
                securityData.events.events.slice(-10).reverse().map((event, index) => (
                  <div key={index} className="bg-gray-50 rounded p-2 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center space-x-1">
                        <span>{getEventTypeIcon(event.type)}</span>
                        <span className="font-medium">{event.type}</span>
                      </span>
                      <span className="text-gray-500">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {event.reason && (
                      <p className="text-gray-600">{event.reason}</p>
                    )}
                    {event.clientId && (
                      <p className="text-gray-500">Client: {event.clientId.slice(-8)}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {securityData.events.totalEvents}
                </div>
                <div className="text-xs text-gray-500">Total Events</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-600">
                  {securityData.events.blockedClients.length}
                </div>
                <div className="text-xs text-gray-500">Blocked Clients</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityMonitor; 