'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { IssuesList } from '@/components/IssuesList';
import { IssueDetail } from '@/components/IssueDetail';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { GitHubIssue } from '@/lib/types/github';
import { useRepositoryChange } from '@/hooks/useRepositoryChange';

export default function IssuesPage() {
  const { status } = useSession();
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<GitHubIssue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repository, setRepository] = useState<{ owner: string; name: string } | null>(null);
  const [filters, setFilters] = useState({
    state: 'open',
    sort: 'created',
    direction: 'desc'
  });

  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        state: filters.state,
        sort: filters.sort,
        direction: filters.direction
      });

      const response = await fetch(`/api/github/issues?${queryParams}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch issues');
      }

      const data = await response.json();
      setIssues(data.issues);
      setRepository(data.repository);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchIssues();
    }
  }, [status, fetchIssues]);

  // Listen for repository changes and refetch issues
  useRepositoryChange(() => {
    if (status === 'authenticated') {
      setSelectedIssue(null); // Clear selected issue
      fetchIssues();
    }
  }, [status, fetchIssues]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto text-center p-8">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground mb-6">
            Please sign in with GitHub to view repository issues.
          </p>
          <Link href="/settings/github">
            <Button>
              Connect GitHub Account
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto text-center p-8">
          <h2 className="text-2xl font-bold mb-4 text-red-500">Error</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          {error === 'No repository selected' && (
            <Link href="/settings">
              <Button>
                Select Repository
              </Button>
            </Link>
          )}
          {error !== 'No repository selected' && (
            <Button onClick={fetchIssues}>
              Try Again
            </Button>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">GitHub Issues</h1>
        {repository && (
          <p className="text-muted-foreground">
            Repository: {repository.owner}/{repository.name}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="mb-4">
            <select
              value={filters.state}
              onChange={(e) => setFilters({ ...filters, state: e.target.value })}
              className="w-full px-3 py-2 rounded-md bg-card-bg border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="open">Open Issues</option>
              <option value="closed">Closed Issues</option>
              <option value="all">All Issues</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <IssuesList
              issues={issues}
              selectedIssue={selectedIssue}
              onSelectIssue={setSelectedIssue}
            />
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedIssue ? (
            <IssueDetail issue={selectedIssue} repository={repository || undefined} />
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                Select an issue from the list to view details
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}