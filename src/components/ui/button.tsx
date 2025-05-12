import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ variant = 'default', className = '', ...props }) => {
  const base = 'px-4 py-2 rounded font-medium focus:outline-none transition';
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'bg-white border border-blue-600 text-blue-600 hover:bg-blue-50',
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  );
};

export { Button }; 