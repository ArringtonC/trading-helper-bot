// Mock for UI Button component
import React from 'react';

export const Button = ({ 
  children, 
  className = '', 
  variant = 'default', 
  disabled = false,
  onClick,
  ...props 
}) => {
  return (
    <button 
      className={`px-4 py-2 rounded font-medium focus:outline-none transition ${className}`}
      disabled={disabled}
      onClick={onClick}
      data-testid="button"
      {...props}
    >
      {children}
    </button>
  );
};

export default Button; 