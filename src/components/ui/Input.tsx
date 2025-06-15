import React, { forwardRef } from 'react';

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
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-4 py-3 text-lg',
    };
    
    const baseInputClasses = `
      block w-full rounded-md border
      focus:outline-none focus:ring-2 focus:ring-offset-0
      transition-colors duration-200
    `;
    
    const stateClasses = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';
    
    const disabledClasses = disabled
      ? 'bg-gray-50 cursor-not-allowed text-gray-500'
      : 'bg-white';
    
    const inputClasses = `
      ${baseInputClasses}
      ${sizeClasses[size]}
      ${stateClasses}
      ${disabledClasses}
      ${icon ? 'pl-10' : ''}
      ${className}
    `.trim();
    
    return (
      <div className={containerClassName}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">{icon}</span>
            </div>
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
        </div>
        
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
        
        {helpText && !error && (
          <p id={`${inputId}-help`} className="mt-1 text-sm text-gray-500">
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';