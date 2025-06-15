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
  const baseClasses = 'bg-card-bg rounded-lg transition-all duration-200';
  
  const variantClasses = {
    default: 'shadow-sm shadow-background/50 border border-border',
    bordered: 'border-2 border-accent/30',
    elevated: 'shadow-lg shadow-accent/10 border border-border',
    flat: 'border border-border/50',
  };
  
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    none: '',
  };
  
  const interactiveClasses = onClick ? 'cursor-pointer hover:shadow-lg hover:shadow-accent/20 hover:border-accent/50 hover:translate-y-[-2px] active:translate-y-0' : '';
  
  const cardClasses = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${interactiveClasses} ${className}`.trim();
  
  return (
    <div className={cardClasses} onClick={onClick}>
      {(title || headerAction) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-muted">{subtitle}</p>
            )}
          </div>
          {headerAction && (
            <div className="ml-4 flex-shrink-0">{headerAction}</div>
          )}
        </div>
      )}
      
      <div>{children}</div>
      
      {footer && (
        <div className="mt-6 pt-4 border-t border-border/50">{footer}</div>
      )}
    </div>
  );
};