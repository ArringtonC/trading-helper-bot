import React from 'react';
// Import the component from the installed package
import ReactDiffViewer from 'react-diff-viewer-continued';
var DiffViewer = function (_a) {
    // TODO: Implement syntax highlighting later if needed using renderContent prop
    var oldValue = _a.oldValue, newValue = _a.newValue, _b = _a.splitView, splitView = _b === void 0 ? true : _b;
    return (<div className="diff-viewer-container border rounded-md overflow-hidden my-4 dark:border-gray-700">
      <ReactDiffViewer oldValue={oldValue} newValue={newValue} splitView={splitView} useDarkTheme={document.documentElement.classList.contains('dark')} // Basic dark mode detection
    />
    </div>);
};
export default DiffViewer;
