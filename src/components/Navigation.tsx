import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { loadSetting } from '../services/SettingsService';

const Navigation: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Check feature flags
  const showImport = loadSetting('showImport') === 'true';
  const showDirectImport = loadSetting('showDirectImport') === 'true';
  
  // Navigation items with path and label
  const baseNavItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/options', label: 'Options' },
    { path: '/analysis', label: 'AI Analysis' },
  ];

  const importNavItems = [
    ...(showImport ? [{ path: '/import', label: 'Import' }] : []),
    ...(showDirectImport ? [{ path: '/import/direct', label: 'Direct Parser' }] : []),
  ];

  const navItems = [
    ...baseNavItems,
    ...importNavItems,
    { path: '/settings', label: 'Settings' }
  ];
  
  return (
    <div className="flex border-b border-gray-200 overflow-x-auto">
      {navItems.map(item => (
        <Link 
          key={item.path}
          to={item.path}
          className={`py-2 px-4 font-medium ${
            currentPath === item.path 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
};

export default Navigation; 