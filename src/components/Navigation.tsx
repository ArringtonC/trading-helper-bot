import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { loadSetting, saveSetting } from '../services/SettingsService';
import { TutorialListModal } from './Wizards/TutorialListModal';
import { UXLayersController, UserExperienceLevel } from '../utils/ux/UXLayersController';
import NavigationController from '../utils/navigation/NavigationController';

const Navigation: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);
  const [userLevel, setUserLevel] = useState<UserExperienceLevel>('import');
  
  // Memoize controllers to prevent recreation on each render
  const controllers = useMemo(() => {
    const savedLevel = loadSetting('userExperienceLevel') as UserExperienceLevel || 'import';
    return {
      ux: new UXLayersController(savedLevel),
      navigation: new NavigationController(savedLevel)
    };
  }, []); // Empty dependency array - only create once

  // Initialize user level from storage
  useEffect(() => {
    const savedLevel = loadSetting('userExperienceLevel') as UserExperienceLevel || 'import';
    setUserLevel(savedLevel);
  }, []);

  // Check feature flags (memoized to prevent recalculation)
  const featureFlags = useMemo(() => ({
    showImport: loadSetting('showImport') === 'true',
    showDirectImport: loadSetting('showDirectImport') === 'true',
    showHelpPage: loadSetting('showHelpPage') !== 'false',
    showUnifiedDashboard: loadSetting('showUnifiedDashboard') === 'true',
    showRuleEngine: loadSetting('showRuleEngine') === 'true',
    showLegacyDashboard: loadSetting('showLegacyDashboard') === 'true',
  }), []);

  const handleHelpClick = useCallback(() => {
    setIsTutorialModalOpen(true);
  }, []);

  const handleLevelChange = useCallback((newLevel: UserExperienceLevel) => {
    // Update state immediately for responsive UI
    setUserLevel(newLevel);
    
    // Update controllers
    controllers.ux.setUserLevel(newLevel);
    controllers.navigation.setUserLevel(newLevel);
    
    // Batch storage operations
    requestAnimationFrame(() => {
      saveSetting('userExperienceLevel', newLevel);
      localStorage.setItem('userExperienceLevel', newLevel);
    });
  }, [controllers]);

  const getLevelIcon = useCallback((level: UserExperienceLevel) => {
    switch (level) {
      case 'learning': return '🌱';
      case 'import': return '📊';
      case 'broker': return '🔗';
      default: return '🎯';
    }
  }, []);

  const getLevelColor = useCallback((level: UserExperienceLevel) => {
    switch (level) {
      case 'learning': return 'text-green-600 bg-green-50';
      case 'import': return 'text-blue-600 bg-blue-50';
      case 'broker': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }, []);

  // Memoize navigation items to prevent recalculation
  const navigationItems = useMemo(() => {
    const baseItems = controllers.navigation.getVisibleNavigationItems();
    
    // Filter out debug items that aren't enabled
    const filteredBaseItems = baseItems.filter(item => {
      // If it's not a debug item, always show it
      if (item.category !== 'debug') return true;
      
      // For debug items, check the corresponding setting
      switch (item.id) {
        case 'unified-dashboard':
          return featureFlags.showUnifiedDashboard;
        case 'rule-engine':
          return featureFlags.showRuleEngine;
        case 'legacy-dashboard':
          return featureFlags.showLegacyDashboard;
        default:
          return false; // Hide unknown debug items by default
      }
    });
    
    const importNavItems = [
      ...(featureFlags.showImport ? [{ path: '/import', label: '📥 Import', feature: 'import', minLevel: 'import' }] : []),
      ...(featureFlags.showDirectImport ? [{ path: '/import/direct', label: '🔧 Direct Parser', feature: 'direct-parser', minLevel: 'broker' }] : []),
    ];

    return [...filteredBaseItems, ...importNavItems];
  }, [userLevel, controllers.navigation, featureFlags]);

  return (
    <>
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {/* User Level Indicator */}
        <div className="flex items-center px-3 py-2 border-r border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <span className={`text-lg ${getLevelColor(userLevel)}`}>
              {getLevelIcon(userLevel)}
            </span>
            <select
              value={userLevel}
              onChange={(e) => handleLevelChange(e.target.value as UserExperienceLevel)}
              className={`text-sm font-medium border-none bg-transparent ${getLevelColor(userLevel)} focus:outline-none cursor-pointer`}
              title="Change experience level to show/hide features"
            >
              <option value="learning">Learning</option>
              <option value="import">Import</option>
              <option value="broker">Broker</option>
            </select>
          </div>
        </div>
        
        {/* Navigation Items */}
        {navigationItems.map(item => (
          <Link 
            key={item.path}
            to={item.path}
            className={`py-2 px-4 font-medium whitespace-nowrap transition-colors duration-150 ${
              currentPath === item.path 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {item.label}
          </Link>
        ))}
        
        {/* Help Button */}
        {featureFlags.showHelpPage && (
          <button 
            onClick={handleHelpClick}
            className="py-2 px-4 font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap transition-colors duration-150"
            aria-label="Open tutorials list"
          >
            Help
          </button>
        )}
        
        {/* Settings Link */}
        <Link 
          to="/settings"
          className={`py-2 px-4 font-medium whitespace-nowrap transition-colors duration-150 ${
            currentPath === '/settings' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Settings
        </Link>
      </div>
      
      <TutorialListModal 
        isOpen={isTutorialModalOpen} 
        onClose={() => setIsTutorialModalOpen(false)} 
      />
    </>
  );
};

export default Navigation; 