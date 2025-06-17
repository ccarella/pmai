'use client';

import React from 'react';
import { useTheme, type Theme } from '@/components/providers/ThemeProvider';

const themes: { value: Theme; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'system', label: 'System', icon: '💻' },
];

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className="flex gap-2 p-1 bg-card-bg rounded-lg border border-border">
      {themes.map(({ value, label, icon }) => {
        const isActive = theme === value;
        const isResolved = value === 'system' ? false : resolvedTheme === value;
        
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`
              relative flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
              transition-all duration-200 min-w-[100px]
              ${isActive 
                ? 'bg-accent text-accent-foreground shadow-sm' 
                : 'hover:bg-card-hover text-muted hover:text-foreground'
              }
              focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background
            `}
            aria-label={`Set theme to ${label}`}
            aria-pressed={isActive}
          >
            <span className="text-base" role="img" aria-hidden="true">
              {icon}
            </span>
            <span>{label}</span>
            {value === 'system' && isActive && (
              <span className="ml-1 text-xs opacity-70">
                ({resolvedTheme})
              </span>
            )}
            {isResolved && value !== 'system' && !isActive && (
              <div 
                className="absolute top-1 right-1 w-2 h-2 bg-success rounded-full"
                title="Currently active theme"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export function ThemeToggleButton() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const cycleTheme = () => {
    const currentIndex = themes.findIndex(t => t.value === theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex].value);
  };

  const currentTheme = themes.find(t => t.value === theme) || themes[0];

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-lg bg-card-bg hover:bg-input-bg border border-border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent group"
      title={`Current: ${currentTheme.label} (${resolvedTheme}). Click to cycle themes.`}
      aria-label={`Switch theme. Current: ${currentTheme.label}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-base" role="img" aria-hidden="true">
          {currentTheme.icon}
        </span>
        <span className="text-sm text-muted group-hover:text-foreground transition-colors">
          {currentTheme.label}
        </span>
      </div>
    </button>
  );
}