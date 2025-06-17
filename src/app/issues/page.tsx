'use client';

import React, { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { IssuesList } from '@/components/IssuesList';
import { IssueDetail } from '@/components/IssueDetail';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import Link from 'next/link';
import { GitHubIssue } from '@/lib/types/github';
import { useRepositoryChange } from '@/hooks/useRepositoryChange';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useIssuesPagination } from '@/hooks/useIssuesPagination';
import InfiniteScroll from 'react-infinite-scroll-component';

export default function IssuesPage() {
  const { status } = useSession();
  const [selectedIssue, setSelectedIssue] = useState<GitHubIssue | null>(null);
  
  const {
    issues,
    loading,
    error,
    hasMore,
    filters,
    repository,
    fetchMore,
    refresh,
    setFilters,
  } = useIssuesPagination();

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const { containerRef, isRefreshing, pullDistance, isPulling } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
    refreshTimeout: 1000,
  });

  // Listen for repository changes and refetch issues
  useRepositoryChange(() => {
    if (status === 'authenticated') {
      setSelectedIssue(null); // Clear selected issue
      refresh();
    }
  }, [status, refresh]);

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
            <Button onClick={refresh}>
              Try Again
            </Button>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="container mx-auto px-4 py-8 min-h-screen overflow-y-auto"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <PullToRefresh
        isRefreshing={isRefreshing}
        pullDistance={pullDistance}
        isPulling={isPulling}
        threshold={80}
      >
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
            <div className="mb-4 space-y-2">
              <select
                value={filters.state}
                onChange={(e) => setFilters({ state: e.target.value })}
                className="w-full px-3 py-2 rounded-md bg-card-bg border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                aria-label="Filter issues by state"
              >
                <option value="open">Open Issues</option>
                <option value="closed">Closed Issues</option>
                <option value="all">All Issues</option>
              </select>
              
              <select
                value={`${filters.sort}-${filters.direction}`}
                onChange={(e) => {
                  const [sort, direction] = e.target.value.split('-');
                  setFilters({ sort, direction });
                }}
                className="w-full px-3 py-2 rounded-md bg-card-bg border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                aria-label="Sort issues"
              >
                <option value="created-desc">Newest First</option>
                <option value="created-asc">Oldest First</option>
                <option value="updated-desc">Recently Updated</option>
                <option value="comments-desc">Most Commented</option>
              </select>
            </div>

            {loading && !isRefreshing ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="overflow-auto max-h-[calc(100vh-300px)]" id="scrollableDiv">
                <InfiniteScroll
                  dataLength={issues.length}
                  next={fetchMore}
                  hasMore={hasMore}
                  loader={
                    <div className="flex justify-center py-4">
                      <LoadingSpinner size="sm" />
                    </div>
                  }
                  scrollableTarget="scrollableDiv"
                  endMessage={
                    issues.length > 0 ? (
                      <p className="text-center py-4 text-muted-foreground text-sm">
                        No more issues to load
                      </p>
                    ) : null
                  }
                >
                  <IssuesList
                    issues={issues}
                    selectedIssue={selectedIssue}
                    onSelectIssue={setSelectedIssue}
                  />
                </InfiniteScroll>
              </div>
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
      </PullToRefresh>
    </div>
  );
}