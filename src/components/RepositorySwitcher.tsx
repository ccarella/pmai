'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRepository } from '@/contexts/RepositoryContext';

interface RepositorySwitcherProps {
  className?: string;
}

export const RepositorySwitcher: React.FC<RepositorySwitcherProps> = ({ className = '' }) => {
  const { data: session } = useSession();
  const { selectedRepo, addedRepos, isLoading, switchRepository } = useRepository();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Repository data is now managed by context

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectRepository = async (repoFullName: string) => {
    try {
      await switchRepository(repoFullName);
      setIsOpen(false);
    } catch (error) {
      console.error('Error selecting repository:', error);
    }
  };

  if (!session?.user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="h-8 w-32 bg-card-bg animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-card-bg border border-border hover:border-accent/50 transition-all duration-200 group"
        aria-label="Switch repository"
        aria-expanded={isOpen}
      >
        {selectedRepo ? (
          <>
            <svg className="w-4 h-4 text-muted group-hover:text-foreground transition-colors" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span className="max-w-[200px] truncate text-foreground">
              {selectedRepo.split('/')[1]}
            </span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-muted">Select repository</span>
          </>
        )}
        <svg
          className={`w-4 h-4 text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-64 rounded-md border border-border bg-card-bg shadow-lg overflow-hidden z-50">
          {addedRepos.length > 0 ? (
            <div className="max-h-64 overflow-y-auto">
              {addedRepos.map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => handleSelectRepository(repo.full_name)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-accent/10 transition-colors duration-200 flex items-center justify-between group ${
                    selectedRepo === repo.full_name ? 'bg-accent/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <svg className="w-4 h-4 text-muted flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span className="truncate">{repo.name}</span>
                    {repo.private && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-warning/20 text-warning border border-warning/30">
                        Private
                      </span>
                    )}
                  </div>
                  {selectedRepo === repo.full_name && (
                    <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted">
              No repositories added yet
            </div>
          )}
          
          <div className="border-t border-border p-2">
            <Link
              href="/settings/github"
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-accent hover:bg-accent/10 rounded transition-colors duration-200"
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add repository
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};