// Mock for UI Badge component
import React from 'react';

export const Badge = ({ children, className = '', variant = 'default', ...props }) => {
  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      data-testid="badge"
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge; 