'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
  };
}

interface RepositoryContextType {
  selectedRepo: string | null;
  addedRepos: Repository[];
  isLoading: boolean;
  switchRepository: (repoFullName: string) => Promise<void>;
  refreshRepositories: () => Promise<void>;
}

const RepositoryContext = createContext<RepositoryContextType | undefined>(undefined);

export const useRepository = () => {
  const context = useContext(RepositoryContext);
  if (context === undefined) {
    throw new Error('useRepository must be used within a RepositoryProvider');
  }
  return context;
};

interface RepositoryProviderProps {
  children: ReactNode;
}

export const RepositoryProvider: React.FC<RepositoryProviderProps> = ({ children }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [addedRepos, setAddedRepos] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshRepositories = useCallback(async () => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Fetch selected repository
      const selectedResponse = await fetch('/api/github/selected-repo');
      if (selectedResponse.ok) {
        const data = await selectedResponse.json();
        setSelectedRepo(data.selectedRepo);
      }

      // Fetch added repositories
      const reposResponse = await fetch('/api/github/added-repos');
      if (reposResponse.ok) {
        const data = await reposResponse.json();
        setAddedRepos(data.repositories);
      }
    } catch (error) {
      console.error('Error fetching repository data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const switchRepository = useCallback(async (repoFullName: string) => {
    try {
      const response = await fetch('/api/github/repositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedRepo: repoFullName }),
      });

      if (response.ok) {
        setSelectedRepo(repoFullName);
        
        // Refresh the current route to update all components
        router.refresh();
        
        // Emit a custom event that components can listen to
        window.dispatchEvent(new CustomEvent('repository-switched', { 
          detail: { repository: repoFullName } 
        }));
      } else {
        throw new Error('Failed to switch repository');
      }
    } catch (error) {
      console.error('Error selecting repository:', error);
      throw error;
    }
  }, [router]);

  // Initial load and session changes
  useEffect(() => {
    refreshRepositories();
  }, [refreshRepositories]);

  const value: RepositoryContextType = {
    selectedRepo,
    addedRepos,
    isLoading,
    switchRepository,
    refreshRepositories,
  };

  return (
    <RepositoryContext.Provider value={value}>
      {children}
    </RepositoryContext.Provider>
  );
};