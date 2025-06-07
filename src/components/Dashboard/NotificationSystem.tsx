import React, { useState, useEffect } from 'react';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  autoHide?: boolean;
}

interface NotificationSystemProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  enabled,
  onToggle,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Mock notifications for demo
  useEffect(() => {
    if (!enabled) return;

    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'success',
        title: 'Position Updated',
        message: 'AAPL position successfully updated with new market data',
        timestamp: new Date(),
        autoHide: true,
      },
      {
        id: '2',
        type: 'warning',
        title: 'Risk Alert',
        message: 'Portfolio delta exposure exceeds 80% threshold',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        autoHide: false,
      },
    ];

    setNotifications(mockNotifications);

    // Auto-hide notifications after 5 seconds
    const timer = setTimeout(() => {
      setNotifications(prev => 
        prev.filter(n => !n.autoHide)
      );
    }, 5000);

    return () => clearTimeout(timer);
  }, [enabled]);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColors = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {/* Toggle Button */}
      <div className="flex justify-end">
        <button
          onClick={() => onToggle(!enabled)}
          className={`
            px-3 py-2 rounded-lg text-sm font-medium transition-colors
            ${enabled 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }
          `}
          title={enabled ? 'Disable notifications' : 'Enable notifications'}
        >
          🔔 {enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Notifications */}
      {enabled && notifications.map(notification => (
        <div
          key={notification.id}
          className={`
            max-w-sm w-full rounded-lg border p-4 shadow-lg
            ${getNotificationColors(notification.type)}
            animate-slide-in-right
          `}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-lg">
                {getNotificationIcon(notification.type)}
              </span>
            </div>
            <div className="ml-3 w-0 flex-1">
              <p className="text-sm font-medium">
                {notification.title}
              </p>
              <p className="mt-1 text-sm opacity-90">
                {notification.message}
              </p>
              <p className="mt-2 text-xs opacity-75">
                {notification.timestamp.toLocaleTimeString()}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={() => removeNotification(notification.id)}
                className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Notification Settings Panel */}
      {enabled && (
        <div className="max-w-sm w-full bg-white rounded-lg border border-gray-200 p-4 shadow-lg">
          <h4 className="text-sm font-medium text-gray-800 mb-3">
            Notification Settings
          </h4>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600">Position updates</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600">Risk alerts</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600">P&L milestones</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

// Remove unused styles constant
export default NotificationSystem;
 
 
 