'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { GitHubMarkdown } from './ui/GitHubMarkdown';
import { MergePRButton } from './MergePRButton';
import { InlineEdit } from './InlineEdit';
import { LabelSelector } from './LabelSelector';
import { formatDistanceToNow } from 'date-fns';
import { GitHubIssue, GitHubComment } from '@/lib/types/github';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { HistoryLogger } from '@/lib/historyLogger';

interface IssueDetailProps {
  issue: GitHubIssue;
  repository?: { owner: string; name: string };
  editable?: boolean;
  autoSave?: boolean;
  onUpdate?: () => void;
}

export const IssueDetail: React.FC<IssueDetailProps> = ({ 
  issue, 
  repository, 
  editable = false,
  autoSave = false,
  onUpdate 
}) => {
  const [comments, setComments] = useState<GitHubComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: issue.title,
    body: issue.body || '',
    labels: issue.labels,
  });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchIssueDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/github/issues', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ issueNumber: issue.number }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch issue details');
        }

        const data = await response.json();
        setComments(data.comments || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (issue.comments > 0) {
      fetchIssueDetails();
    } else {
      setComments([]);
    }
  }, [issue]);

  // Update edit data when issue changes
  useEffect(() => {
    setEditData({
      title: issue.title,
      body: issue.body || '',
      labels: issue.labels,
    });
  }, [issue]);

  const handleSave = useCallback(async (field: 'title' | 'body' | 'labels', value: string | typeof issue.labels) => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const updateData: {
        issueNumber: number;
        title?: string;
        body?: string;
        labels?: string[];
      } = { issueNumber: issue.number };
      
      if (field === 'labels') {
        updateData.labels = (value as typeof issue.labels).map((label) => label.name);
      } else {
        updateData[field] = value;
      }

      const response = await fetch('/api/github/issues', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update issue');
      }

      // Log the change
      const oldValue = field === 'labels' ? issue.labels : issue[field as keyof GitHubIssue];
      HistoryLogger.logChange(issue.number, field, oldValue, value);
      
      // Update local state
      setEditData(prev => ({ ...prev, [field]: value }));
      
      // Call onUpdate callback
      onUpdate?.();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update');
      throw err; // Re-throw to let InlineEdit handle it
    } finally {
      setIsSaving(false);
    }
  }, [issue, onUpdate]);

  const debouncedTitle = useDebounce(editData.title, 1000);
  const debouncedBody = useDebounce(editData.body, 1000);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && isEditing && debouncedTitle !== issue.title) {
      handleSave('title', debouncedTitle).catch(() => {});
    }
  }, [autoSave, isEditing, debouncedTitle, issue.title, handleSave]);

  useEffect(() => {
    if (autoSave && isEditing && debouncedBody !== issue.body) {
      handleSave('body', debouncedBody).catch(() => {});
    }
  }, [autoSave, isEditing, debouncedBody, issue.body, handleSave]);

  return (
    <Card className="p-4 sm:p-6" role="article" aria-label={`Issue: ${issue.title}`}>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          {isEditing ? (
            <InlineEdit
              value={editData.title}
              onSave={(value) => handleSave('title', value)}
              className="flex-grow text-xl sm:text-2xl font-bold"
              inputClassName="text-xl sm:text-2xl font-bold"
              ariaLabel="Edit issue title"
              placeholder="Issue title"
            />
          ) : (
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">{issue.title}</h2>
          )}
          <div className="flex items-center gap-2">
            {editable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? (
                  <>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Save
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit
                  </>
                )}
              </Button>
            )}
            <a
            href={issue.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0"
          >
            <Button variant="ghost" size="sm">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              GitHub
            </Button>
          </a>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                issue.state === 'open'
                  ? 'bg-green-500/20 text-green-500'
                  : 'bg-purple-500/20 text-purple-500'
              }`}
            >
              {issue.state === 'open' ? 'Open' : 'Closed'}
            </span>
          </div>
          <span>#{issue.number}</span>
          <span className="hidden sm:inline">•</span>
          <span>
            <span className="hidden sm:inline">opened </span>
            {formatDistanceToNow(new Date(issue.created_at))} ago
            <span className="hidden sm:inline"> by{' '}
              <span className="font-medium">{issue.user.login}</span>
            </span>
          </span>
        </div>

        {(issue.labels.length > 0 || isEditing) && (
          <div className="mt-3">
            {isEditing ? (
              <LabelSelector
                selectedLabels={editData.labels}
                onChange={(labels) => handleSave('labels', labels)}
                disabled={isSaving}
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {issue.labels.map((label) => (
                  <span
                    key={label.id}
                    className="inline-flex px-3 py-1 text-xs rounded-full font-medium"
                    style={{
                      backgroundColor: `#${label.color}20`,
                      color: `#${label.color}`,
                      border: `1px solid #${label.color}40`,
                    }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-border pt-4 sm:pt-6" role="region" aria-label="Issue description">
        <div className="flex items-start gap-3 sm:gap-4 mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={issue.user.avatar_url}
            alt={issue.user.login}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
          />
          <div className="flex-grow min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-medium text-sm sm:text-base">{issue.user.login}</span>
              <span className="text-xs sm:text-sm text-muted-foreground">
                commented {formatDistanceToNow(new Date(issue.created_at))} ago
              </span>
            </div>
            {isEditing ? (
              <InlineEdit
                value={editData.body}
                onSave={(value) => handleSave('body', value)}
                multiline
                className="w-full"
                ariaLabel="Edit issue description"
                placeholder="Add a description..."
              />
            ) : issue.body ? (
              <GitHubMarkdown content={issue.body} />
            ) : (
              <p className="text-muted-foreground italic">No description provided</p>
            )}
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        )}

        {!loading && comments.length > 0 && (
          <div className="space-y-6" role="region" aria-label="Comments section">
            <h3 className="font-semibold text-lg mb-4" id="comments-heading">Comments ({comments.length})</h3>
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3 sm:gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={comment.user.avatar_url}
                  alt={comment.user.login}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
                />
                <div className="flex-grow min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-medium text-sm sm:text-base">{comment.user.login}</span>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      commented {formatDistanceToNow(new Date(comment.created_at))} ago
                    </span>
                  </div>
                  <GitHubMarkdown content={comment.body} />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm mt-4">
            Error loading comments: {error}
          </div>
        )}

        {saveError && (
          <div className="text-red-500 text-sm mt-4 p-3 bg-red-50 rounded-md">
            Failed to update issue: {saveError}
          </div>
        )}
        
        {/* Merge PR Button - only shown for pull requests when repository info is available */}
        {repository && issue.pull_request && (
          <MergePRButton
            issue={issue}
            repoOwner={repository.owner}
            repoName={repository.name}
            onMergeSuccess={() => {
              // The parent component will handle refreshing the data
              // through context or props update
            }}
          />
        )}
      </div>
    </Card>
  );
};