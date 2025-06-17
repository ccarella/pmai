'use client';

import { useEffect, useRef } from 'react';

type RepositoryChangeCallback = (repository: string) => void;

/**
 * Hook to listen for repository changes and execute a callback
 * @param callback Function to execute when repository changes
 * @param dependencies Optional dependencies array for the callback
 */
export const useRepositoryChange = (
  callback: RepositoryChangeCallback,
  dependencies: React.DependencyList = []
) => {
  const callbackRef = useRef(callback);

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    const handleRepositoryChange = (event: CustomEvent<{ repository: string }>) => {
      callbackRef.current(event.detail.repository);
    };

    // Type assertion needed for CustomEvent
    window.addEventListener('repository-switched', handleRepositoryChange as EventListener);

    return () => {
      window.removeEventListener('repository-switched', handleRepositoryChange as EventListener);
    };
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps
};