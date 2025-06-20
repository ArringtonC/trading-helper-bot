import React from 'react';
import { TutorialProgress, MESFeatureFlags } from './types';

interface MESNavigationTabsProps {
  currentTab: string;
  onTabChange: (tab: 'dashboard' | 'learn' | 'practice' | 'community' | 'settings' | 'analysis') => void;
  progress: TutorialProgress;
  featureFlags: MESFeatureFlags;
  unreadNotifications: number;
}

interface TabConfig {
  id: string;
  label: string;
  icon: string;
  badge?: number | string | null;
  isEnabled: boolean;
  requiresFeatureFlag?: keyof MESFeatureFlags;
}

const MESNavigationTabs: React.FC<MESNavigationTabsProps> = ({
  currentTab,
  onTabChange,
  progress,
  featureFlags,
  unreadNotifications
}) => {
  const tabs: TabConfig[] = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: '📊', 
      badge: null, 
      isEnabled: true 
    },
    { 
      id: 'learn', 
      label: 'Learn', 
      icon: '📚', 
      badge: progress.currentStep, 
      isEnabled: true 
    },
    { 
      id: 'practice', 
      label: 'Practice', 
      icon: '💹', 
      badge: null, 
      isEnabled: true,
      requiresFeatureFlag: 'tradingSimulator'
    },
    { 
      id: 'community', 
      label: 'Community', 
      icon: '👥', 
      badge: unreadNotifications > 0 ? unreadNotifications : null, 
      isEnabled: featureFlags.communityFeatures,
      requiresFeatureFlag: 'communityFeatures'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: '⚙️', 
      badge: null, 
      isEnabled: true 
    },
    { 
      id: 'analysis', 
      label: 'Analysis', 
      icon: '📈', 
      badge: null, 
      isEnabled: featureFlags.advancedAnalytics,
      requiresFeatureFlag: 'advancedAnalytics'
    }
  ];

  const getTabTooltip = (tab: TabConfig): string => {
    if (!tab.isEnabled && tab.requiresFeatureFlag) {
      return `${tab.label} feature is not enabled`;
    }
    return tab.label;
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex overflow-x-auto">
          {tabs.map(tab => {
            const isActive = currentTab === tab.id;
            const isDisabled = !tab.isEnabled;
            
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && onTabChange(tab.id as 'dashboard' | 'learn' | 'practice' | 'community' | 'settings' | 'analysis')}
                disabled={isDisabled}
                title={getTabTooltip(tab)}
                className={`relative py-4 px-6 font-medium whitespace-nowrap transition-all duration-200 border-b-2 ${
                  isActive
                    ? 'text-blue-600 border-blue-600 bg-blue-50'
                    : isDisabled
                    ? 'text-gray-400 border-transparent cursor-not-allowed'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                </div>
                
                {/* Badge for notifications or progress */}
                {tab.badge && typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                    {tab.badge}
                  </span>
                )}

                {/* Coming Soon indicator for disabled features */}
                {isDisabled && tab.requiresFeatureFlag && (
                  <span className="absolute -top-1 -right-1 bg-gray-400 text-white text-xs rounded-full px-1 py-0.5 text-[10px]">
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MESNavigationTabs; 