import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  variant?: 'default' | 'bordered' | 'elevated' | 'flat';
  headerAction?: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  onClick?: () => void;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  className = '',
  variant = 'default',
  headerAction,
  padding = 'md',
  onClick,
  footer,
}) => {
  const baseClasses = 'bg-white rounded-lg';
  
  const variantClasses = {
    default: 'shadow',
    bordered: 'border border-gray-200',
    elevated: 'shadow-lg',
    flat: '',
  };
  
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    none: '',
  };
  
  const interactiveClasses = onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : '';
  
  const cardClasses = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${interactiveClasses} ${className}`.trim();
  
  return (
    <div className={cardClasses} onClick={onClick}>
      {(title || headerAction) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
          {headerAction && (
            <div className="ml-4 flex-shrink-0">{headerAction}</div>
          )}
        </div>
      )}
      
      <div>{children}</div>
      
      {footer && (
        <div className="mt-6 pt-4 border-t border-gray-200">{footer}</div>
      )}
    </div>
  );
};