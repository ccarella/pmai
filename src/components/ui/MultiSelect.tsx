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
      <div className={`border rounded-md p-2 focus-within:ring-2 focus-within:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-300'}`}>
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-md"
            >
              {item}
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="ml-1 hover:text-blue-600"
                aria-label={`Remove ${item}`}
              >
                ×
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
          className="w-full outline-none text-sm"
        />
      </div>
      {placeholder && value.length === 0 && (
        <p className="mt-1 text-sm text-gray-500">Press Enter to add items</p>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};