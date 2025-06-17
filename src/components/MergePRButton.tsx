'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { GitHubIssue } from '@/lib/types/github';

interface MergePRButtonProps {
  issue: GitHubIssue;
  repoOwner: string;
  repoName: string;
  onMergeSuccess?: () => void;
}

interface MergeabilityStatus {
  mergeable: boolean;
  mergeable_state: 'clean' | 'dirty' | 'unstable' | 'blocked' | 'unknown' | 'behind' | 'has_hooks' | 'draft';
  merge_state_reason?: string;
}

export const MergePRButton: React.FC<MergePRButtonProps> = ({
  issue,
  repoOwner,
  repoName,
  onMergeSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState(false);
  const [mergeability, setMergeability] = useState<MergeabilityStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkMergeability = async () => {
      if (!issue.pull_request) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/github/pr/mergeability', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            owner: repoOwner,
            repo: repoName,
            pull_number: issue.number,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to check PR mergeability');
        }

        const data = await response.json();
        setMergeability(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    checkMergeability();
  }, [issue, repoOwner, repoName]);

  // Only render for pull requests
  if (!issue.pull_request) {
    return null;
  }

  const handleMerge = async () => {
    try {
      setMerging(true);
      setError(null);

      const response = await fetch('/api/github/pr/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: repoOwner,
          repo: repoName,
          pull_number: issue.number,
          merge_method: 'merge', // can be 'merge', 'squash', or 'rebase'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to merge PR');
      }

      const data = await response.json();
      
      if (data.merged) {
        onMergeSuccess?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during merge');
    } finally {
      setMerging(false);
    }
  };

  // Don't show button if still loading mergeability status
  if (loading || !mergeability) {
    return null;
  }

  // Don't show button if PR is not mergeable
  if (!mergeability.mergeable) {
    return null;
  }

  // Show different states based on mergeable_state
  const getButtonState = () => {
    switch (mergeability.mergeable_state) {
      case 'clean':
        return {
          disabled: false,
          text: 'Merge PR',
          variant: 'primary' as const,
        };
      case 'unstable':
        return {
          disabled: false,
          text: 'Merge PR (unstable)',
          variant: 'secondary' as const,
        };
      case 'behind':
        return {
          disabled: true,
          text: 'Update branch first',
          variant: 'secondary' as const,
        };
      case 'blocked':
        return {
          disabled: true,
          text: 'Blocked',
          variant: 'secondary' as const,
        };
      case 'draft':
        return {
          disabled: true,
          text: 'Draft PR',
          variant: 'secondary' as const,
        };
      default:
        return {
          disabled: true,
          text: 'Cannot merge',
          variant: 'secondary' as const,
        };
    }
  };

  const buttonState = getButtonState();

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="flex flex-col gap-2">
        <Button
          variant={buttonState.variant}
          disabled={buttonState.disabled || merging}
          loading={merging}
          onClick={handleMerge}
          className="w-full sm:w-auto"
        >
          {merging ? 'Merging...' : buttonState.text}
        </Button>
        
        {error && (
          <p className="text-sm text-red-500 mt-2" role="alert">
            {error}
          </p>
        )}
        
        {mergeability.merge_state_reason && (
          <p className="text-sm text-muted-foreground">
            {mergeability.merge_state_reason}
          </p>
        )}
      </div>
    </div>
  );
};