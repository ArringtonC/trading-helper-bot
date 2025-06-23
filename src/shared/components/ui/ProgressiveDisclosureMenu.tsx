import React, { useState, useEffect, useCallback } from 'react';
import { UXLayersController, UserExperienceLevel, AdaptiveMenuSystem } from '../../utils/ux/UXLayersController';

interface ProgressiveDisclosureMenuProps {
  userLevel: UserExperienceLevel;
  onUserLevelChange: (level: UserExperienceLevel) => void;
  onFeatureSelect: (feature: string) => void;
  currentFeature?: string;
  className?: string;
}

interface MenuSection {
  title: string;
  items: string[];
  isExpanded: boolean;
  level: 'primary' | 'secondary' | 'broker';
}

export const ProgressiveDisclosureMenu: React.FC<ProgressiveDisclosureMenuProps> = ({
  userLevel,
  onUserLevelChange,
  onFeatureSelect,
  currentFeature,
  className = ''
}) => {
  const [uxController] = useState(() => new UXLayersController(userLevel));
  const [menuSystem] = useState(() => new AdaptiveMenuSystem(userLevel));
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['primary']));
  const [showLevelSelector, setShowLevelSelector] = useState(false);

  // Update controllers when user level changes
  useEffect(() => {
    uxController.setUserLevel(userLevel);
    // Note: AdaptiveMenuSystem doesn't have a setUserLevel method, so we'll work with what we have
  }, [userLevel, uxController]);

  // Get menu configuration
  const menuConfig = menuSystem.renderMenu();
  const navigationStyle = uxController.getNavigationStyle();

  // Create menu sections based on user level
  const menuSections: MenuSection[] = [
    {
      title: 'Core Features',
      items: menuSystem.getPrimaryActions(),
      isExpanded: expandedSections.has('primary'),
      level: 'primary'
    },
    {
      title: 'Additional Tools',
      items: menuSystem.getSecondaryActions(),
      isExpanded: expandedSections.has('secondary'),
      level: 'secondary'
    }
  ];

  // Add advanced section only for import/broker users
  if (userLevel !== 'learning') {
    const advancedItems = menuSystem.getAdvancedActions();
    if (advancedItems.length > 0) {
      menuSections.push({
        title: 'Advanced Features',
        items: advancedItems,
        isExpanded: expandedSections.has('broker'),
        level: 'broker'
      });
    }
  }

  const toggleSection = useCallback((sectionTitle: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      const key = sectionTitle.toLowerCase().replace(' ', '');
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }, []);

  const handleFeatureClick = useCallback((feature: string) => {
    onFeatureSelect(feature);
  }, [onFeatureSelect]);

  const handleLevelChange = useCallback((newLevel: UserExperienceLevel) => {
    onUserLevelChange(newLevel);
    setShowLevelSelector(false);
  }, [onUserLevelChange]);

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

  return (
    <div className={`progressive-disclosure-menu ${navigationStyle} ${className}`}>
      {/* User Level Indicator and Selector */}
      <div className="level-selector-section">
        <button
          className="level-indicator"
          onClick={() => setShowLevelSelector(!showLevelSelector)}
          style={{ borderColor: getLevelColor(userLevel) }}
        >
          <span className="level-icon">{getLevelIcon(userLevel)}</span>
          <span className="level-text">{userLevel.charAt(0).toUpperCase() + userLevel.slice(1)}</span>
          <span className="dropdown-arrow">{showLevelSelector ? '▲' : '▼'}</span>
        </button>
        
        {showLevelSelector && (
          <div className="level-dropdown">
            {(['learning', 'import', 'broker'] as UserExperienceLevel[]).map(level => (
              <button
                key={level}
                className={`level-option ${level === userLevel ? 'active' : ''}`}
                onClick={() => handleLevelChange(level)}
                style={{ 
                  borderLeftColor: getLevelColor(level),
                  backgroundColor: level === userLevel ? getLevelColor(level) + '20' : 'transparent'
                }}
              >
                <span className="level-icon">{getLevelIcon(level)}</span>
                <div className="level-info">
                  <span className="level-name">{level.charAt(0).toUpperCase() + level.slice(1)}</span>
                  <span className="level-description">
                    {level === 'learning' && 'Essential features only'}
                    {level === 'import' && 'Balanced feature set'}
                    {level === 'broker' && 'All features available'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Progressive Menu Sections */}
      <div className="menu-sections">
        {menuSections.map((section) => (
          <div key={section.title} className={`menu-section ${section.level}`}>
            <button
              className="section-header"
              onClick={() => toggleSection(section.title)}
            >
              <span className="section-title">{section.title}</span>
              <span className="section-count">({section.items.length})</span>
              <span className="expand-icon">
                {section.isExpanded ? '−' : '+'}
              </span>
            </button>
            
            {section.isExpanded && (
              <div className="section-items">
                {section.items.map((item) => (
                  <button
                    key={item}
                    className={`menu-item ${currentFeature === item ? 'active' : ''}`}
                    onClick={() => handleFeatureClick(item)}
                  >
                    <span className="item-text">{item}</span>
                    {currentFeature === item && <span className="active-indicator">●</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Feature Unlock Hints for Lower Levels */}
      {userLevel !== 'broker' && (
        <div className="unlock-hints">
          <div className="hint-header">
            <span className="hint-icon">💡</span>
            <span className="hint-title">Unlock More Features</span>
          </div>
          <p className="hint-text">
            {userLevel === 'learning' 
              ? 'Switch to Intermediate level to access analytics and strategy tools'
              : 'Switch to Advanced level to access all features including custom strategies and API settings'
            }
          </p>
        </div>
      )}

      <style>
        {`
        .progressive-disclosure-menu {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          overflow: hidden;
          min-width: 280px;
        }

        .progressive-disclosure-menu.simple {
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .progressive-disclosure-menu.advanced {
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        }

        .level-selector-section {
          position: relative;
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }

        .level-indicator {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: white;
          border: 2px solid;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 600;
        }

        .level-indicator:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .level-icon {
          font-size: 1.2rem;
        }

        .level-text {
          flex: 1;
          text-align: left;
          color: #374151;
        }

        .dropdown-arrow {
          color: #6b7280;
          font-size: 0.8rem;
        }

        .level-dropdown {
          position: absolute;
          top: 100%;
          left: 16px;
          right: 16px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          z-index: 1000;
          margin-top: 4px;
        }

        .level-option {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border: none;
          border-left: 4px solid;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .level-option:hover {
          background: #f9fafb;
        }

        .level-option.active {
          font-weight: 600;
        }

        .level-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .level-name {
          font-size: 0.9rem;
          color: #374151;
        }

        .level-description {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .menu-sections {
          padding: 8px 0;
        }

        .menu-section {
          border-bottom: 1px solid #f3f4f6;
        }

        .menu-section:last-child {
          border-bottom: none;
        }

        .section-header {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: background 0.2s ease;
          font-weight: 600;
          color: #374151;
        }

        .section-header:hover {
          background: #f9fafb;
        }

        .section-title {
          flex: 1;
          text-align: left;
        }

        .section-count {
          font-size: 0.8rem;
          color: #6b7280;
          font-weight: normal;
        }

        .expand-icon {
          color: #6b7280;
          font-weight: bold;
          width: 16px;
          text-align: center;
        }

        .section-items {
          padding: 4px 0 8px 0;
        }

        .menu-item {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 24px;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #4b5563;
        }

        .menu-item:hover {
          background: #f3f4f6;
          color: #1f2937;
        }

        .menu-item.active {
          background: #dbeafe;
          color: #1d4ed8;
          font-weight: 600;
        }

        .item-text {
          text-align: left;
        }

        .active-indicator {
          color: #3b82f6;
          font-size: 0.8rem;
        }

        .unlock-hints {
          padding: 16px;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-top: 1px solid #f59e0b;
        }

        .hint-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .hint-icon {
          font-size: 1.1rem;
        }

        .hint-title {
          font-weight: 600;
          color: #92400e;
        }

        .hint-text {
          margin: 0;
          font-size: 0.85rem;
          color: #a16207;
          line-height: 1.4;
        }

        /* Navigation Style Variations */
        .progressive-disclosure-menu.simple .section-header {
          padding: 10px 16px;
          font-size: 0.9rem;
        }

        .progressive-disclosure-menu.simple .menu-item {
          padding: 8px 20px;
          font-size: 0.9rem;
        }

        .progressive-disclosure-menu.advanced .section-header {
          padding: 14px 20px;
          font-size: 1rem;
        }

        .progressive-disclosure-menu.advanced .menu-item {
          padding: 12px 28px;
          font-size: 1rem;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .progressive-disclosure-menu {
            min-width: 240px;
          }
          
          .level-indicator {
            padding: 10px 12px;
          }
          
          .section-header {
            padding: 10px 12px;
          }
          
          .menu-item {
            padding: 8px 20px;
          }
        }
        `}
      </style>
    </div>
  );
};

export default ProgressiveDisclosureMenu; 