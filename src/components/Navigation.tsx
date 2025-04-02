import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Navigation items with path and label
  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/options', label: 'Options' },
    { path: '/futures', label: 'Futures' },
    { path: '/import', label: 'Import' },
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