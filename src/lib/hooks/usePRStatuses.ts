import { useState, useEffect } from 'react';
import { GitHubIssue } from '@/lib/types/github';
import { PRTestStatus } from '@/components/PRStatusIndicator';

interface PRStatusMap {
  [issueNumber: number]: PRTestStatus;
}

export function usePRStatuses(issues: GitHubIssue[]) {
  const [statuses, setStatuses] = useState<PRStatusMap>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (issues.length === 0) return;

    const fetchStatuses = async () => {
      setLoading(true);
      
      try {
        // Only fetch statuses for issues that have associated PRs
        const issueNumbers = issues
          .filter(issue => issue.pull_request)
          .map(issue => issue.number);

        if (issueNumbers.length === 0) {
          setLoading(false);
          return;
        }

        const response = await fetch('/api/github/pr-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ issueNumbers }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch PR statuses');
        }

        const data = await response.json();
        setStatuses(data.statuses);
      } catch (error) {
        console.error('Error fetching PR statuses:', error);
        // Set all to unknown on error
        const errorStatuses: PRStatusMap = {};
        issues.forEach(issue => {
          if (issue.pull_request) {
            errorStatuses[issue.number] = 'unknown';
          }
        });
        setStatuses(errorStatuses);
      } finally {
        setLoading(false);
      }
    };

    fetchStatuses();

    // Set up polling for pending statuses
    const interval = setInterval(() => {
      const hasPending = Object.values(statuses).some(status => status === 'pending');
      if (hasPending) {
        fetchStatuses();
      }
    }, 30000); // Poll every 30 seconds for pending statuses

    return () => clearInterval(interval);
  }, [issues, statuses]);

  return { statuses, loading };
}