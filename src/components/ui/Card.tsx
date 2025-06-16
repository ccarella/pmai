'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useMousePosition } from '@/lib/animations/hooks';
import { calculate3DRotation } from '@/lib/animations/utils';
import { cardVariants } from '@/lib/animations/variants';

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
  enable3D?: boolean;
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
  enable3D = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const mousePosition = useMousePosition(cardRef);
  const rotation = enable3D ? calculate3DRotation(mousePosition.x, mousePosition.y, 8) : { rotateX: 0, rotateY: 0 };
  
  const baseClasses = 'bg-card-bg rounded-lg';
  
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
  
  const interactiveClasses = onClick ? 'cursor-pointer' : '';
  
  const cardClasses = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${interactiveClasses} ${className}`.trim();
  
  return (
    <motion.div
      ref={cardRef}
      className={cardClasses}
      onClick={onClick}
      variants={onClick ? cardVariants : undefined}
      initial="rest"
      whileHover={onClick ? "hover" : undefined}
      whileTap={onClick ? "tap" : undefined}
      animate={{
        rotateX: rotation.rotateX,
        rotateY: rotation.rotateY,
      }}
      style={{
        transformStyle: enable3D ? 'preserve-3d' : undefined,
        perspective: enable3D ? 1000 : undefined,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {(title || headerAction) && (
        <motion.div 
          className="flex items-start justify-between mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
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
        </motion.div>
      )}
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {children}
      </motion.div>
      
      {footer && (
        <motion.div 
          className="mt-6 pt-4 border-t border-border/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          {footer}
        </motion.div>
      )}
    </motion.div>
  );
};