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
  const [showSections, setShowSections] = useState(false);
  
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
    setUserLevel(newLevel);
    saveSetting('userExperienceLevel', newLevel);
    
    // Update controllers with new level
    controllers.ux.setUserLevel(newLevel);
    controllers.navigation.setUserLevel(newLevel);
  }, [controllers]);

  const getLevelIcon = (level: UserExperienceLevel) => {
    switch (level) {
      case 'learning': return '🌱';
      case 'import': return '📊';
      case 'broker': return '🔗';
      default: return '📊';
    }
  };

  const getLevelColor = (level: UserExperienceLevel) => {
    switch (level) {
      case 'learning': return 'text-green-600';
      case 'import': return 'text-blue-600';
      case 'broker': return 'text-orange-600';
      default: return 'text-blue-600';
    }
  };

  // Memoize navigation sections
  const navigationSections = useMemo(() => {
    return controllers.navigation.getNavigationSections();
  }, [controllers.navigation]);

  return (
    <>
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {/* Sections Toggle */}
        <div className="flex items-center px-3 py-2 border-r border-gray-200 flex-shrink-0">
          <button
            onClick={() => setShowSections(!showSections)}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors duration-150"
            title="Toggle sections view"
          >
            📋 Sections
          </button>
        </div>
        
        {/* Home Link */}
        <Link 
          to="/"
          className={`py-2 px-4 font-medium whitespace-nowrap transition-colors duration-150 ${
            currentPath === '/' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🏠 Home
        </Link>
        
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

      {/* Sections Dropdown */}
      {showSections && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-6xl mx-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {navigationSections.map(section => (
                <div key={section.key} className="space-y-2">
                  <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
                    {section.title}
                  </h3>
                  <p className="text-xs text-gray-600 mb-3">
                    {section.description}
                  </p>
                  <div className="space-y-1">
                    {section.items.map(item => (
                      <Link
                        key={item.id}
                        to={item.path}
                        className={`block px-3 py-2 text-sm rounded transition-colors duration-150 ${
                          currentPath === item.path
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                        }`}
                        onClick={() => setShowSections(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <TutorialListModal 
        isOpen={isTutorialModalOpen} 
        onClose={() => setIsTutorialModalOpen(false)} 
      />
    </>
  );
};

export default Navigation; 