var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { loadSetting } from '../services/SettingsService';
import { TutorialListModal } from './Wizards/TutorialListModal';
var Navigation = function () {
    var location = useLocation();
    var currentPath = location.pathname;
    var _a = useState(false), isTutorialModalOpen = _a[0], setIsTutorialModalOpen = _a[1];
    // Check feature flags
    var showImport = loadSetting('showImport') === 'true';
    var showDirectImport = loadSetting('showDirectImport') === 'true';
    var handleHelpClick = function () {
        setIsTutorialModalOpen(true);
    };
    // Navigation items with path and label
    var baseNavItems = [
        { path: '/', label: 'Dashboard' },
        { path: '/pldashboard', label: 'P&L Dashboard' },
        { path: '/options', label: 'Options' },
        { path: '/analysis', label: 'AI Analysis' },
        { path: '/visualizer', label: 'Visualizer' },
        { path: '/rule-engine-demo', label: 'Rule Engine Demo' },
        { path: '/import-analyze', label: 'Import & Analyze' },
    ];
    var importNavItems = __spreadArray(__spreadArray([], (showImport ? [{ path: '/import', label: 'Import' }] : []), true), (showDirectImport ? [{ path: '/import/direct', label: 'Direct Parser' }] : []), true);
    var navItems = __spreadArray(__spreadArray(__spreadArray([], baseNavItems, true), importNavItems, true), [
        { path: '/settings', label: 'Settings' }
    ], false);
    return (<>
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {navItems.map(function (item) { return (<Link key={item.path} to={item.path} className={"py-2 px-4 font-medium ".concat(currentPath === item.path
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700')}>
            {item.label}
          </Link>); })}
        <button onClick={handleHelpClick} className="py-2 px-4 font-medium text-gray-500 hover:text-gray-700" aria-label="Open tutorials list">
          Help
        </button>
      </div>
      <TutorialListModal isOpen={isTutorialModalOpen} onClose={function () { return setIsTutorialModalOpen(false); }}/>
    </>);
};
export default Navigation;
