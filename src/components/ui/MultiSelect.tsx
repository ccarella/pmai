'use client';

import React, { useState, KeyboardEvent } from 'react';

interface MultiSelectProps {
  name: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  name,
  value = [],
  onChange,
  placeholder,
  className = '',
  error,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!value.includes(inputValue.trim())) {
        onChange([...value, inputValue.trim()]);
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className={className}>
      <div className={`border rounded-md p-2 focus-within:ring-2 focus-within:ring-accent/30 transition-all duration-200 bg-input-bg ${error ? 'border-error focus-within:ring-error/30' : 'border-border hover:border-accent/50 focus-within:border-accent'}`}>
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2.5 py-1 text-sm bg-accent/20 text-accent border border-accent/30 rounded-md transition-all duration-200 hover:bg-accent/30"
            >
              {item}
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="ml-1.5 hover:text-foreground transition-colors"
                aria-label={`Remove ${item}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          name={name}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : 'Add more...'}
          className="w-full outline-none text-sm bg-transparent text-foreground placeholder:text-muted/70"
        />
      </div>
      {placeholder && value.length === 0 && (
        <p className="mt-1 text-sm text-muted">Press Enter to add items</p>
      )}
      {error && <p className="mt-1 text-sm text-error flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {error}
      </p>}
    </div>
  );
};