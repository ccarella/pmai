'use client';

import React from 'react';
import { useTheme, type Theme } from '@/components/providers/ThemeProvider';

const themes: { value: Theme; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'system', label: 'System', icon: '💻' },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="relative">
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as Theme)}
        className="appearance-none bg-card-bg border border-border rounded-lg px-3 py-2 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200 cursor-pointer hover:bg-input-bg"
        aria-label="Select theme"
      >
        {themes.map(({ value, label, icon }) => (
          <option key={value} value={value} className="bg-card-bg text-foreground">
            {icon} {label}
          </option>
        ))}
      </select>
      
      {/* Custom dropdown arrow */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <svg
          className="w-4 h-4 text-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
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