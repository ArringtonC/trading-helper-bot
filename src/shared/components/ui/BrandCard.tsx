import React from 'react';

interface BrandCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'bordered' | 'success' | 'warning' | 'danger';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

const BrandCard: React.FC<BrandCardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
  hoverable = false,
}) => {
  const baseClasses = 'bg-white rounded-lg transition-all duration-200';

  const variantClasses = {
    default: 'border border-gray-200 shadow-sm',
    elevated: 'shadow-md border border-gray-100',
    bordered: 'border-2 border-gray-200',
    success: 'border border-trading-profit bg-emerald-50',
    warning: 'border border-trading-warning bg-amber-50',
    danger: 'border border-trading-loss bg-red-50',
  };

  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  const hoverClasses = hoverable || onClick ? 'hover:shadow-lg hover:border-gray-300 cursor-pointer' : '';
  const clickableClasses = onClick ? 'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2' : '';

  const combinedClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${paddingClasses[padding]}
    ${hoverClasses}
    ${clickableClasses}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const CardComponent = onClick ? 'button' : 'div';

  return (
    <CardComponent
      className={combinedClasses}
      onClick={onClick}
      {...(onClick && { role: 'button', tabIndex: 0 })}
    >
      {children}
    </CardComponent>
  );
};

export default BrandCard; 