import React from 'react';
// Import the component from the installed package
import ReactDiffViewer from 'react-diff-viewer-continued';

interface DiffViewerProps {
  oldValue: string;
  newValue: string;
  splitView?: boolean;
  // Add other props from the library as needed, e.g., useDarkTheme
}

const DiffViewer: React.FC<DiffViewerProps> = ({
  oldValue,
  newValue,
  splitView = true, // Default to split view
}) => {
  // TODO: Implement syntax highlighting later if needed using renderContent prop

  return (
    <div className="diff-viewer-container border rounded-md overflow-hidden my-4 dark:border-gray-700">
      <ReactDiffViewer
        oldValue={oldValue}
        newValue={newValue}
        splitView={splitView}
        useDarkTheme={document.documentElement.classList.contains('dark')} // Basic dark mode detection
        // Default styles are decent, can customize later via 'styles' prop
        // Example of customizing styles (optional):
        // styles={{
        //   variables: {
        //     dark: {
        //       diffViewerBackground: '#1f2937', // Example: Tailwind gray-800
        //       gutterBackground: '#374151', // Example: Tailwind gray-700
        //       addedBackground: '#059669', // Example: Tailwind green-600 slightly darker
        //       removedBackground: '#dc2626', // Example: Tailwind red-600 slightly darker
        //     },
        //   },
        // }}
      />
    </div>
  );
};

export default DiffViewer; 