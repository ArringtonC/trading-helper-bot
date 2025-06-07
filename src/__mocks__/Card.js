// Mock for UI Card component
import React from 'react';

export const Card = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`bg-white shadow rounded-lg p-4 ${className}`} 
      data-testid="card"
      {...props}
    >
      {children}
    </div>
  );
};

export default Card; 