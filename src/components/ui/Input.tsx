'use client';

import React, { forwardRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { errorShake, fieldVariants } from '@/lib/animations/variants';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helpText?: string;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helpText,
      size = 'md',
      icon,
      containerClassName = '',
      className = '',
      required,
      disabled,
      type = 'text',
      id,
      name,
      ...props
    },
    ref
  ) => {
    const inputId = id || name;
    const [hasError, setHasError] = useState(false);
    
    useEffect(() => {
      if (error && !hasError) {
        setHasError(true);
      } else if (!error) {
        setHasError(false);
      }
    }, [error, hasError]);
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-4 py-3 text-lg',
    };
    
    const baseInputClasses = `
      block w-full rounded-md border
      focus:outline-none focus:ring-2 focus:ring-offset-0
      transition-all duration-200
      placeholder:text-muted/70
    `;
    
    const stateClasses = error
      ? 'border-error focus:border-error focus:ring-error/30 bg-error/5'
      : 'border-border focus:border-accent focus:ring-accent/30 bg-input-bg';
    
    const disabledClasses = disabled
      ? 'opacity-50 cursor-not-allowed'
      : 'hover:border-accent/50';
    
    const inputClasses = `
      ${baseInputClasses}
      ${sizeClasses[size]}
      ${stateClasses}
      ${disabledClasses}
      ${icon ? 'pl-10' : ''}
      ${className}
    `.trim();
    
    return (
      <motion.div 
        className={containerClassName}
        variants={fieldVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </label>
        )}
        
        <motion.div 
          className="relative"
          animate={hasError ? "animate" : "initial"}
          variants={errorShake}
        >
          {icon && (
            <motion.div 
              className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-muted">{icon}</span>
            </motion.div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            name={name}
            type={type}
            className={inputClasses}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined
            }
            {...props}
          />
        </motion.div>
        
        <AnimatePresence mode="wait">
          {error && (
            <motion.p 
              id={`${inputId}-error`} 
              className="mt-1.5 text-sm text-error flex items-center gap-1"
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 6 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.svg 
                className="w-4 h-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </motion.svg>
              {error}
            </motion.p>
          )}
          
          {helpText && !error && (
            <motion.p 
              id={`${inputId}-help`} 
              className="mt-1 text-sm text-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {helpText}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

Input.displayName = 'Input';