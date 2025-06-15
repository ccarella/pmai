'use client';

import { useEffect, useRef } from 'react';
import { IssueFormData } from '@/lib/types/issue';

const STORAGE_KEY = 'pmai-issue-form-data';
const DEBOUNCE_DELAY = 1000; // Save after 1 second of inactivity

export function useFormPersistence(formData: Partial<IssueFormData>) {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't save empty data
    if (Object.keys(formData).length === 0) {
      return;
    }

    // Debounce the save operation
    timeoutRef.current = setTimeout(() => {
      try {
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      } catch (error) {
        // Handle quota exceeded or other storage errors silently
        console.warn('Failed to save form data to localStorage:', error);
      }
    }, DEBOUNCE_DELAY);

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [formData]);
}

// Helper function to load persisted form data
export function loadPersistedFormData(): Partial<IssueFormData> | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.warn('Failed to load persisted form data:', error);
  }
  return null;
}

// Helper function to clear persisted form data
export function clearPersistedFormData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear persisted form data:', error);
  }
}