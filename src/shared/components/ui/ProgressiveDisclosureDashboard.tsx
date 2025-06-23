import React, { useState, useEffect, useCallback } from 'react';
import { UserExperienceLevel } from '../../utils/ux/UXLayersController';
import { FeatureVisibilityController, FeatureDefinition, UserProgress } from '../../utils/ux/FeatureVisibilityController';
import ProgressiveDisclosureMenu from './ProgressiveDisclosureMenu';

interface ProgressiveDisclosureDashboardProps {
  initialUserLevel?: UserExperienceLevel;
  initialUserProgress?: Partial<UserProgress>;
  onFeatureSelect?: (feature: string) => void;
  className?: string;
}

interface UnlockNotification {
  id: string;
  feature: FeatureDefinition;
  timestamp: Date;
  isRead: boolean;
}

export const ProgressiveDisclosureDashboard: React.FC<ProgressiveDisclosureDashboardProps> = ({
  initialUserLevel = 'import',
  initialUserProgress,
  onFeatureSelect,
  className = ''
}) => {
  const [userLevel, setUserLevel] = useState<UserExperienceLevel>(initialUserLevel);
  const [featureController] = useState(() => new FeatureVisibilityController(initialUserLevel, initialUserProgress));
  const [currentFeature, setCurrentFeature] = useState<string>('basic-dashboard');
  const [showProgressPanel, setShowProgressPanel] = useState(false);
  const [notifications, setNotifications] = useState<UnlockNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Update feature controller when user level changes
  useEffect(() => {
    featureController.updateUserProgress({ level: userLevel });
  }, [userLevel, featureController]);

  // Simulate user progress tracking
  useEffect(() => {
    const interval = setInterval(() => {
      featureController.updateUserProgress({
        timeSpent: featureController.getUserProgressSummary().timeSpent + 1
      });
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [featureController]);

  const handleUserLevelChange = useCallback((newLevel: UserExperienceLevel) => {
    setUserLevel(newLevel);
  }, []);

  const handleFeatureSelect = useCallback((feature: string) => {
    setCurrentFeature(feature);
    featureController.markFeatureUsed(feature);
    
    // Check for newly unlocked features
    const unlockableFeatures = featureController.getUnlockableFeatures();
    const newUnlocks = unlockableFeatures.filter(f => {
      const state = featureController.getFeatureState(f.id);
      return state?.isUnlocked && !notifications.some(n => n.feature.id === f.id);
    });

    // Add notifications for new unlocks
    if (newUnlocks.length > 0) {
      const newNotifications = newUnlocks.map(feature => ({
        id: `${feature.id}-${Date.now()}`,
        feature,
        timestamp: new Date(),
        isRead: false
      }));
      setNotifications(prev => [...prev, ...newNotifications]);
    }

    onFeatureSelect?.(feature);
  }, [featureController, notifications, onFeatureSelect]);

  const handleNotificationRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  }, []);

  const progressSummary = featureController.getUserProgressSummary();
  const visibleFeatures = featureController.getVisibleFeatures();
  const nextTargets = featureController.getNextUnlockTargets();
  const unreadNotifications = notifications.filter(n => !n.isRead);

  return (
    <div className={`progressive-disclosure-dashboard ${className}`}>
      {/* Header with Progress and Notifications */}
      <div className="dashboard-header">
        <div className="progress-summary">
          <div className="level-badge" style={{ backgroundColor: getLevelColor(userLevel) }}>
            <span className="level-icon">{getLevelIcon(userLevel)}</span>
            <span className="level-text">{userLevel.charAt(0).toUpperCase() + userLevel.slice(1)}</span>
          </div>
          
          <div className="progress-stats">
            <div className="stat">
              <span className="stat-value">{progressSummary.featuresUnlocked}</span>
              <span className="stat-label">Features Unlocked</span>
            </div>
            <div className="stat">
              <span className="stat-value">{progressSummary.progressPercentage.toFixed(0)}%</span>
              <span className="stat-label">Progress</span>
            </div>
          </div>
        </div>

        <div className="header-actions">
          {/* Notifications */}
          <button
            className={`notification-button ${unreadNotifications.length > 0 ? 'has-notifications' : ''}`}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <span className="notification-icon">🔔</span>
            {unreadNotifications.length > 0 && (
              <span className="notification-badge">{unreadNotifications.length}</span>
            )}
          </button>

          {/* Progress Panel Toggle */}
          <button
            className={`progress-button ${showProgressPanel ? 'active' : ''}`}
            onClick={() => setShowProgressPanel(!showProgressPanel)}
          >
            <span className="progress-icon">📊</span>
            <span className="progress-text">Progress</span>
          </button>
        </div>
      </div>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="notifications-panel">
          <div className="notifications-header">
            <h3>🎉 New Features Unlocked!</h3>
            <button onClick={() => setShowNotifications(false)}>×</button>
          </div>
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">No new unlocks yet</div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationRead(notification.id)}
                >
                  <div className="notification-content">
                    <div className="notification-title">{notification.feature.name}</div>
                    <div className="notification-description">{notification.feature.description}</div>
                    <div className="notification-time">
                      {notification.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  {!notification.isRead && <div className="unread-indicator">●</div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="dashboard-content">
        {/* Progressive Disclosure Menu */}
        <div className="menu-section">
          <ProgressiveDisclosureMenu
            userLevel={userLevel}
            onUserLevelChange={handleUserLevelChange}
            onFeatureSelect={handleFeatureSelect}
            currentFeature={currentFeature}
          />
        </div>

        {/* Feature Content Area */}
        <div className="feature-content">
          <div className="feature-header">
            <h2 className="feature-title">
              {visibleFeatures.find(f => f.id === currentFeature)?.name || 'Select a Feature'}
            </h2>
            <div className="feature-description">
              {visibleFeatures.find(f => f.id === currentFeature)?.description || 'Choose a feature from the menu to get started'}
            </div>
          </div>

          {/* Feature Status */}
          <div className="feature-status">
            {(() => {
              const feature = visibleFeatures.find(f => f.id === currentFeature);
              if (!feature) return null;
              
              const state = featureController.getFeatureState(feature.id);
              if (!state) return null;

              return (
                <div className={`status-indicator ${state.isEnabled ? 'enabled' : 'disabled'}`}>
                  <span className="status-icon">
                    {state.isEnabled ? '✅' : state.unlockProgress !== undefined ? '🔒' : '⏳'}
                  </span>
                  <span className="status-text">
                    {state.isEnabled ? 'Available' : 
                     state.unlockProgress !== undefined ? `${state.unlockProgress.toFixed(0)}% Unlocked` : 
                     'Coming Soon'}
                  </span>
                  {state.unlockMessage && (
                    <div className="unlock-hint">{state.unlockMessage}</div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Placeholder for actual feature content */}
          <div className="feature-placeholder">
            <div className="placeholder-icon">🚧</div>
            <div className="placeholder-text">
              Feature content would be rendered here based on the selected feature: {currentFeature}
            </div>
          </div>
        </div>

        {/* Progress Panel */}
        {showProgressPanel && (
          <div className="progress-panel">
            <div className="progress-header">
              <h3>Your Progress</h3>
              <button onClick={() => setShowProgressPanel(false)}>×</button>
            </div>

            {/* Overall Progress */}
            <div className="overall-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${progressSummary.progressPercentage}%` }}
                />
              </div>
              <div className="progress-label">
                {progressSummary.featuresUnlocked} of {progressSummary.totalFeatures} features unlocked
              </div>
            </div>

            {/* Progress Stats */}
            <div className="progress-details">
              <div className="detail-item">
                <span className="detail-label">Account Size:</span>
                <span className="detail-value">${progressSummary.accountSize.toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Trades Completed:</span>
                <span className="detail-value">{progressSummary.tradesCompleted}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Time Spent:</span>
                <span className="detail-value">{Math.floor(progressSummary.timeSpent / 60)}h {progressSummary.timeSpent % 60}m</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Features Used:</span>
                <span className="detail-value">{progressSummary.featuresUsed}</span>
              </div>
            </div>

            {/* Next Unlock Targets */}
            {nextTargets.length > 0 && (
              <div className="next-targets">
                <h4>Next to Unlock:</h4>
                {nextTargets.map(feature => {
                  const state = featureController.getFeatureState(feature.id);
                  return (
                    <div key={feature.id} className="target-item">
                      <div className="target-name">{feature.name}</div>
                      <div className="target-progress">
                        <div className="target-bar">
                          <div 
                            className="target-fill"
                            style={{ width: `${state?.unlockProgress || 0}%` }}
                          />
                        </div>
                        <span className="target-percentage">{state?.unlockProgress?.toFixed(0) || 0}%</span>
                      </div>
                      {state?.unlockMessage && (
                        <div className="target-hint">{state.unlockMessage}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <style>
        {`
        .progressive-disclosure-dashboard {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #f8fafc;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .progress-summary {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .level-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 20px;
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .level-icon {
          font-size: 1.1rem;
        }

        .progress-stats {
          display: flex;
          gap: 24px;
        }

        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: #1f2937;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .notification-button, .progress-button {
          position: relative;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: #f3f4f6;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9rem;
        }

        .notification-button:hover, .progress-button:hover {
          background: #e5e7eb;
        }

        .progress-button.active {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .notification-button.has-notifications {
          background: #fef3c7;
          color: #92400e;
        }

        .notification-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ef4444;
          color: white;
          font-size: 0.7rem;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
        }

        .notifications-panel {
          position: absolute;
          top: 100%;
          right: 24px;
          width: 320px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          z-index: 1000;
          max-height: 400px;
          overflow: hidden;
        }

        .notifications-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .notifications-header h3 {
          margin: 0;
          font-size: 1rem;
          color: #1f2937;
        }

        .notifications-header button {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: #6b7280;
        }

        .notifications-list {
          max-height: 300px;
          overflow-y: auto;
        }

        .no-notifications {
          padding: 24px;
          text-align: center;
          color: #6b7280;
          font-style: italic;
        }

        .notification-item {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid #f3f4f6;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .notification-item:hover {
          background: #f9fafb;
        }

        .notification-item.unread {
          background: #fef3c7;
        }

        .notification-content {
          flex: 1;
        }

        .notification-title {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 2px;
        }

        .notification-description {
          font-size: 0.85rem;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .notification-time {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .unread-indicator {
          color: #f59e0b;
          font-size: 0.8rem;
          margin-left: 8px;
        }

        .dashboard-content {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .menu-section {
          width: 320px;
          border-right: 1px solid #e5e7eb;
          background: white;
          overflow-y: auto;
        }

        .feature-content {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
        }

        .feature-header {
          margin-bottom: 24px;
        }

        .feature-title {
          font-size: 2rem;
          font-weight: bold;
          color: #1f2937;
          margin: 0 0 8px 0;
        }

        .feature-description {
          font-size: 1.1rem;
          color: #6b7280;
          line-height: 1.5;
        }

        .feature-status {
          margin-bottom: 24px;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 8px;
          font-weight: 600;
        }

        .status-indicator.enabled {
          background: #d1fae5;
          color: #065f46;
        }

        .status-indicator.disabled {
          background: #fef3c7;
          color: #92400e;
        }

        .unlock-hint {
          font-size: 0.85rem;
          font-weight: normal;
          margin-top: 4px;
          opacity: 0.8;
        }

        .feature-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px;
          background: white;
          border: 2px dashed #d1d5db;
          border-radius: 12px;
          text-align: center;
        }

        .placeholder-icon {
          font-size: 3rem;
          margin-bottom: 16px;
        }

        .placeholder-text {
          color: #6b7280;
          font-size: 1.1rem;
          line-height: 1.5;
        }

        .progress-panel {
          width: 300px;
          background: white;
          border-left: 1px solid #e5e7eb;
          padding: 20px;
          overflow-y: auto;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .progress-header h3 {
          margin: 0;
          color: #1f2937;
        }

        .progress-header button {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: #6b7280;
        }

        .overall-progress {
          margin-bottom: 24px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
          transition: width 0.3s ease;
        }

        .progress-label {
          font-size: 0.85rem;
          color: #6b7280;
          text-align: center;
        }

        .progress-details {
          margin-bottom: 24px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .detail-label {
          color: #6b7280;
          font-size: 0.9rem;
        }

        .detail-value {
          color: #1f2937;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .next-targets h4 {
          margin: 0 0 12px 0;
          color: #1f2937;
          font-size: 1rem;
        }

        .target-item {
          margin-bottom: 16px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .target-name {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
          font-size: 0.9rem;
        }

        .target-progress {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .target-bar {
          flex: 1;
          height: 4px;
          background: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
        }

        .target-fill {
          height: 100%;
          background: #3b82f6;
          transition: width 0.3s ease;
        }

        .target-percentage {
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 600;
          min-width: 32px;
        }

        .target-hint {
          font-size: 0.75rem;
          color: #6b7280;
          line-height: 1.3;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .dashboard-content {
            flex-direction: column;
          }
          
          .menu-section {
            width: 100%;
            height: 300px;
          }
          
          .progress-panel {
            width: 100%;
            height: 200px;
          }
        }

        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }
          
          .progress-summary {
            justify-content: center;
          }
          
          .header-actions {
            justify-content: center;
          }
          
          .notifications-panel {
            right: 16px;
            left: 16px;
            width: auto;
          }
        }
        `}
      </style>
    </div>
  );
};

// Helper functions
const getLevelIcon = (level: UserExperienceLevel) => {
  switch (level) {
    case 'learning': return '🌱';
    case 'import': return '📈';
    case 'broker': return '🚀';
    default: return '📊';
  }
};

const getLevelColor = (level: UserExperienceLevel) => {
  switch (level) {
    case 'learning': return '#22c55e';
    case 'import': return '#3b82f6';
    case 'broker': return '#8b5cf6';
    default: return '#6b7280';
  }
};

export default ProgressiveDisclosureDashboard; 