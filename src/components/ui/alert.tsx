import React from 'react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive';
  className?: string;
}

const Alert: React.FC<AlertProps> = ({ variant = 'default', className = '', ...props }) => {
  const base = 'p-4 rounded flex items-start gap-2';
  const variants = {
    default: 'bg-yellow-50 border border-yellow-300 text-yellow-800',
    destructive: 'bg-red-50 border border-red-300 text-red-800',
  };
  return <div className={`${base} ${variants[variant]} ${className}`} {...props} />;
};

const AlertTitle: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div className={`font-semibold text-base ${className}`} {...props} />
);

const AlertDescription: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div className={`text-sm ${className}`} {...props} />
);

export { Alert, AlertTitle, AlertDescription }; 