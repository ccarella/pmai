'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface InlineEditProps {
  value: string;
  onSave: (value: string) => void | Promise<void>;
  className?: string;
  inputClassName?: string;
  multiline?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  onCancel?: () => void;
}

export const InlineEdit: React.FC<InlineEditProps> = ({
  value,
  onSave,
  className,
  inputClassName,
  multiline = false,
  placeholder = 'Click to edit',
  ariaLabel,
  disabled = false,
  autoFocus = true,
  onCancel,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inputRef = useRef<any>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && autoFocus && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing, autoFocus]);

  const handleSave = async () => {
    const trimmedValue = editValue.trim();
    
    // Don't save if value hasn't changed
    if (trimmedValue === value.trim()) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(trimmedValue);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    setError(null);
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    if (!isSaving) {
      handleSave();
    }
  };

  if (!isEditing) {
    return (
      <div
        className={cn(
          'cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
        onClick={() => !disabled && setIsEditing(true)}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled) setIsEditing(true);
          }
        }}
        aria-label={ariaLabel || 'Click to edit'}
      >
        {value || (
          <span className="text-muted-foreground italic">{placeholder}</span>
        )}
      </div>
    );
  }

  const InputComponent = multiline ? 'textarea' : 'input';

  return (
    <div className={cn('relative', className)}>
      <InputComponent
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full px-2 py-1 bg-background border rounded focus:outline-none focus:ring-2 focus:ring-primary',
          multiline && 'resize-none min-h-screen',
          error && 'border-red-500',
          inputClassName
        )}
        aria-label={ariaLabel}
        disabled={isSaving}
      />
      {isSaving && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          Saving...
        </div>
      )}
      {error && (
        <div className="absolute left-0 -bottom-6 text-sm text-red-500">
          Error: {error}
        </div>
      )}
    </div>
  );
};