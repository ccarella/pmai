import React, { forwardRef, useEffect, useRef, useState } from 'react';

interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size' | 'resize'> {
  label?: string;
  error?: string;
  helpText?: string;
  size?: 'sm' | 'md' | 'lg';
  containerClassName?: string;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  showCount?: boolean;
  minRows?: number;
  maxRows?: number;
  autoResize?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helpText,
      size = 'md',
      containerClassName = '',
      className = '',
      required,
      disabled,
      id,
      name,
      resize = 'vertical',
      showCount = false,
      maxLength,
      value,
      defaultValue,
      onChange,
      minRows,
      maxRows,
      autoResize = false,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const textareaId = id || name;
    const [charCount, setCharCount] = useState(0);
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref as React.MutableRefObject<HTMLTextAreaElement>) || internalRef;
    
    useEffect(() => {
      const currentValue = value || defaultValue || '';
      setCharCount(currentValue.toString().length);
    }, [value, defaultValue]);
    
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      
      if (autoResize && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        const scrollHeight = textareaRef.current.scrollHeight;
        const minHeight = minRows ? minRows * 24 : 0;
        const maxHeight = maxRows ? maxRows * 24 : scrollHeight;
        textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, minHeight), maxHeight)}px`;
      }
      
      onChange?.(e);
    };
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-4 py-3 text-lg',
    };
    
    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    };
    
    const baseTextareaClasses = `
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
    
    const textareaClasses = `
      ${baseTextareaClasses}
      ${sizeClasses[size]}
      ${resizeClasses[resize]}
      ${stateClasses}
      ${disabledClasses}
      ${className}
    `.trim();
    
    const minHeightStyle = autoResize && minRows ? { minHeight: `${minRows * 24}px` } : {};
    const maxHeightStyle = autoResize && maxRows ? { maxHeight: `${maxRows * 24}px` } : {};
    const style = { ...minHeightStyle, ...maxHeightStyle };
    
    return (
      <div className={containerClassName}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <textarea
          ref={textareaRef}
          id={textareaId}
          name={name}
          className={textareaClasses}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          rows={rows}
          style={style}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${textareaId}-error` : helpText ? `${textareaId}-help` : undefined
          }
          {...props}
        />
        
        <div className="mt-1 flex justify-between">
          <div>
            {error && (
              <p id={`${textareaId}-error`} className="text-sm text-red-600">
                {error}
              </p>
            )}
            
            {helpText && !error && (
              <p id={`${textareaId}-help`} className="text-sm text-gray-500">
                {helpText}
              </p>
            )}
          </div>
          
          {showCount && maxLength && (
            <span className="text-sm text-gray-500">
              {charCount} / {maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';