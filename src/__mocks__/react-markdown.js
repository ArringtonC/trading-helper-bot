// Mock for react-markdown
import React from 'react';

const ReactMarkdown = ({ children, ...props }) => {
  return React.createElement('div', { 
    'data-testid': 'markdown-content',
    ...props 
  }, children);
};

export default ReactMarkdown; 