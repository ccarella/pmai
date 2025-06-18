'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/Button';
import { cn } from '@/lib/utils';

interface Label {
  id: number;
  name: string;
  color: string;
  description?: string;
}

interface LabelSelectorProps {
  selectedLabels: Label[];
  onChange: (labels: Label[]) => void;
  className?: string;
  disabled?: boolean;
}

export const LabelSelector: React.FC<LabelSelectorProps> = ({
  selectedLabels,
  onChange,
  className,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availableLabels, setAvailableLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchLabels();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchLabels = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/github/labels');
      if (!response.ok) {
        throw new Error('Failed to fetch labels');
      }

      const data = await response.json();
      setAvailableLabels(data.labels);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch labels');
    } finally {
      setLoading(false);
    }
  };

  const toggleLabel = (label: Label) => {
    const isSelected = selectedLabels.some((l) => l.id === label.id);
    
    if (isSelected) {
      onChange(selectedLabels.filter((l) => l.id !== label.id));
    } else {
      onChange([...selectedLabels, label]);
    }
  };

  const removeLabel = (labelId: number) => {
    onChange(selectedLabels.filter((l) => l.id !== labelId));
  };

  const filteredLabels = availableLabels.filter((label) =>
    label.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <div className="flex flex-wrap gap-2 items-center">
        {selectedLabels.map((label) => (
          <span
            key={label.id}
            className="inline-flex items-center px-3 py-1 text-xs rounded-full font-medium group"
            style={{
              backgroundColor: `#${label.color}20`,
              color: `#${label.color}`,
              border: `1px solid #${label.color}40`,
            }}
          >
            {label.name}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeLabel(label.id)}
                className="ml-2 hover:opacity-70 transition-opacity"
                aria-label={`Remove ${label.name} label`}
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </span>
        ))}
        
        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="text-xs"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add label
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 w-72 bg-background border rounded-lg shadow-lg z-50">
          <div className="p-3 border-b">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search labels..."
              className="w-full px-3 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>

          <div className="max-h-64 overflow-y-auto">
            {loading && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading labels...
              </div>
            )}

            {error && (
              <div className="p-4 text-center text-sm text-red-500">
                {error}
              </div>
            )}

            {!loading && !error && filteredLabels.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No labels found
              </div>
            )}

            {!loading && !error && filteredLabels.map((label) => {
              const isSelected = selectedLabels.some((l) => l.id === label.id);
              
              return (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label)}
                  className={cn(
                    'w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors flex items-center justify-between',
                    isSelected && 'bg-muted'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: `#${label.color}` }}
                    />
                    <span className="text-sm">{label.name}</span>
                  </div>
                  {isSelected && (
                    <svg
                      className="w-4 h-4 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};