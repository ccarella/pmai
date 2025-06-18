import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { GitHubIssue } from '@/lib/types/github';

interface UseIssuesPaginationOptions {
  initialState?: string;
  initialSort?: string;
  initialDirection?: string;
  perPage?: number;
}

interface UseIssuesPaginationReturn {
  issues: GitHubIssue[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  filters: {
    state: string;
    sort: string;
    direction: string;
  };
  repository: { owner: string; name: string } | null;
  fetchMore: () => Promise<void>;
  refresh: () => Promise<void>;
  setFilters: (filters: { state?: string; sort?: string; direction?: string }) => void;
  isLoadingMore: boolean;
}

export function useIssuesPagination(options: UseIssuesPaginationOptions = {}): UseIssuesPaginationReturn {
  const {
    initialState = 'open',
    initialSort = 'created',
    initialDirection = 'desc',
    perPage = 20,
  } = options;

  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize filters from URL search params or defaults
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [repository, setRepository] = useState<{ owner: string; name: string } | null>(null);
  const [filters, setFiltersState] = useState({
    state: searchParams.get('state') || initialState,
    sort: searchParams.get('sort') || initialSort,
    direction: searchParams.get('direction') || initialDirection,
  });

  const fetchIssues = useCallback(async (pageNum: number, append = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      const queryParams = new URLSearchParams({
        state: filters.state,
        sort: filters.sort,
        direction: filters.direction,
        page: pageNum.toString(),
        per_page: perPage.toString(),
      });

      const response = await fetch(`/api/github/issues?${queryParams}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch issues');
      }

      const data = await response.json();
      
      if (append) {
        setIssues(prev => [...prev, ...data.issues]);
      } else {
        setIssues(data.issues);
      }
      
      setRepository(data.repository);
      
      // Check if there are more pages based on pagination data
      const pagination = data.pagination;
      setHasMore(!!pagination?.next);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [filters, perPage]);

  const fetchMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || loading) return;
    
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchIssues(nextPage, true);
  }, [hasMore, isLoadingMore, loading, page, fetchIssues]);

  const refresh = useCallback(async () => {
    setPage(1);
    setHasMore(true);
    await fetchIssues(1, false);
  }, [fetchIssues]);

  const setFilters = useCallback((newFilters: { state?: string; sort?: string; direction?: string }) => {
    setFiltersState(prev => {
      const updatedFilters = { ...prev, ...newFilters };
      
      // Update URL with new filter params
      const params = new URLSearchParams();
      params.set('state', updatedFilters.state);
      params.set('sort', updatedFilters.sort);
      params.set('direction', updatedFilters.direction);
      
      router.replace(`/issues?${params.toString()}`, { scroll: false });
      
      return updatedFilters;
    });
    setPage(1);
    setHasMore(true);
    setIssues([]);
  }, [router]);

  // Initial fetch
  useEffect(() => {
    fetchIssues(1, false);
  }, [filters, fetchIssues]); // Re-fetch when filters change

  return {
    issues,
    loading,
    error,
    hasMore,
    page,
    filters,
    repository,
    fetchMore,
    refresh,
    setFilters,
    isLoadingMore,
  };
}