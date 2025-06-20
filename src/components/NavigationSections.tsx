import React from 'react';
import { Link } from 'react-router-dom';
import NavigationController from '../utils/navigation/NavigationController';
import { loadSetting } from '../services/SettingsService';
import { UserExperienceLevel } from '../utils/ux/UXLayersController';

interface NavigationSectionsProps {
  className?: string;
  showTitle?: boolean;
  maxItemsPerSection?: number;
}

const NavigationSections: React.FC<NavigationSectionsProps> = ({ 
  className = '', 
  showTitle = true,
  maxItemsPerSection = 6 
}) => {
  // Get user level and create navigation controller
  const userLevel = (loadSetting('userExperienceLevel') as UserExperienceLevel) || 'import';
  const navigationController = new NavigationController(userLevel);
  const navigationSections = navigationController.getNavigationSections();

  const getSectionIcon = (sectionKey: string) => {
    switch (sectionKey) {
      case 'learning': return '🌱';
      case 'stock-picking': return '📈';
      case 'import': return '📊';
      case 'brokers': return '🔗';
      default: return '⚙️';
    }
  };

  const getSectionColor = (sectionKey: string) => {
    switch (sectionKey) {
      case 'learning': return 'border-green-200 bg-green-50';
      case 'stock-picking': return 'border-blue-200 bg-blue-50';
      case 'import': return 'border-purple-200 bg-purple-50';
      case 'brokers': return 'border-orange-200 bg-orange-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className={`py-16 px-4 bg-white ${className}`}>
      <div className="max-w-6xl mx-auto">
        {showTitle && (
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Explore Our Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover powerful tools organized by your experience level and trading needs
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {navigationSections.map(section => (
            <div 
              key={section.key} 
              className={`p-6 rounded-lg border-2 hover:shadow-lg transition-shadow ${getSectionColor(section.key)}`}
            >
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{getSectionIcon(section.key)}</span>
                  <h3 className="text-xl font-bold text-gray-900">
                    {section.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {section.description}
                </p>
                <div className="flex items-center gap-2">
                  <span className="inline-block px-2 py-1 bg-white rounded text-xs font-medium text-gray-700">
                    {section.items.length} features
                  </span>
                  <span className="inline-block px-2 py-1 bg-white rounded text-xs font-medium text-gray-700">
                    {section.level} level
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                {section.items.slice(0, maxItemsPerSection).map(item => (
                  <Link
                    key={item.id}
                    to={item.path}
                    className="block px-3 py-2 text-sm rounded transition-colors duration-150 text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm border border-transparent hover:border-gray-200"
                    title={item.description}
                  >
                    <div className="flex items-center justify-between">
                      <span>{item.label}</span>
                      {item.isNew && (
                        <span className="inline-block px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded font-medium">
                          NEW
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
                {section.items.length > maxItemsPerSection && (
                  <div className="text-xs text-gray-500 px-3 py-1 italic">
                    +{section.items.length - maxItemsPerSection} more features
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* User Level Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Currently showing features for <strong className="capitalize">{userLevel}</strong> level users. 
            <Link to="/settings" className="text-blue-600 hover:text-blue-800 ml-1">
              Change your level in Settings
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NavigationSections;
