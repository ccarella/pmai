'use client';

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { GitHubIssue } from '@/lib/types/github';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './ui/Card';
import { GitHubMarkdown } from './ui/GitHubMarkdown';
import { PRStatusIndicator } from './PRStatusIndicator';
import { usePRStatuses } from '@/lib/hooks/usePRStatuses';

interface IssuesListProps {
  issues: GitHubIssue[];
  selectedIssue: GitHubIssue | null;
  onSelectIssue: (issue: GitHubIssue) => void;
}

export const IssuesList: React.FC<IssuesListProps> = ({
  issues,
  selectedIssue,
  onSelectIssue,
}) => {
  const [expandedIssueId, setExpandedIssueId] = useState<number | null>(null);
  const [copiedIssueId, setCopiedIssueId] = useState<number | null>(null);
  const { statuses } = usePRStatuses(issues);
  
  // Respect user's motion preferences
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (issues.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No issues found</p>
      </Card>
    );
  }

  const handleIssueClick = (issue: GitHubIssue) => {
    // Toggle expansion when clicking on the same issue
    if (expandedIssueId === issue.id) {
      setExpandedIssueId(null);
    } else {
      setExpandedIssueId(issue.id);
      onSelectIssue(issue);
    }
  };

  const handleCopyUrl = async (e: React.MouseEvent | React.KeyboardEvent, issue: GitHubIssue) => {
    e.stopPropagation(); // Prevent triggering the issue click
    
    try {
      await navigator.clipboard.writeText(issue.html_url);
      setCopiedIssueId(issue.id);
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedIssueId(null);
      }, 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = issue.html_url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        setCopiedIssueId(issue.id);
        setTimeout(() => {
          setCopiedIssueId(null);
        }, 2000);
      } catch {
        console.error('Failed to copy URL');
      }
      
      document.body.removeChild(textArea);
    }
  };

  return (
    <motion.div className="space-y-2">
      {issues.map((issue) => {
        const isExpanded = expandedIssueId === issue.id;
        const isSelected = selectedIssue?.id === issue.id;

        return (
          <motion.div
            key={issue.id}
            layout
            initial={false}
            animate={isExpanded ? 'expanded' : 'collapsed'}
            className="relative"
          >
            <div
              className={`bg-card-bg rounded-lg shadow-sm shadow-background/50 border border-border cursor-pointer transition-all hover:shadow-md ${
                isSelected
                  ? 'ring-2 ring-accent bg-accent/10'
                  : 'hover:bg-accent/5'
              }`}
              onClick={() => handleIssueClick(issue)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleIssueClick(issue);
                }
              }}
              tabIndex={0}
              role="button"
              aria-expanded={isExpanded}
              aria-label={`${issue.title}. ${isExpanded ? 'Click to collapse' : 'Click to expand and view details'}`}
            >
              <motion.div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {issue.state === 'open' ? (
                      <svg
                        className="w-5 h-5 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                        <path fillRule="evenodd" d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z" />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 text-purple-500"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M11.28 6.78a.75.75 0 00-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l3.5-3.5z" />
                        <path fillRule="evenodd" d="M16 8A8 8 0 110 8a8 8 0 0116 0zm-1.5 0a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
                      </svg>
                    )}
                  </div>

                  <div className="flex-grow min-w-0">
                    <h3 className="text-sm font-medium text-foreground pr-2">
                      {issue.title}
                    </h3>
                    
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>#{issue.number}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(issue.created_at))} ago</span>
                      {issue.comments > 0 && (
                        <>
                          <span>•</span>
                          <span>{issue.comments} comments</span>
                        </>
                      )}
                    </div>

                    {issue.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {issue.labels.map((label) => (
                          <span
                            key={label.id}
                            className="inline-flex px-2 py-0.5 text-xs rounded-full"
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

                  <div className="flex items-center gap-2">
                    {issue.pull_request && (
                      <>
                        <button
                          className="flex-shrink-0 hover:opacity-70 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            const prUrl = typeof issue.pull_request === 'object' && issue.pull_request.html_url
                              ? issue.pull_request.html_url
                              : issue.html_url.replace('/issues/', '/pull/');
                            window.open(prUrl, '_blank', 'noopener,noreferrer');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              const prUrl = typeof issue.pull_request === 'object' && issue.pull_request.html_url
                                ? issue.pull_request.html_url
                                : issue.html_url.replace('/issues/', '/pull/');
                              window.open(prUrl, '_blank', 'noopener,noreferrer');
                            }
                          }}
                          aria-label="Open pull request in new tab"
                          title="Open pull request in new tab"
                        >
                          <svg
                            className="w-4 h-4 text-muted-foreground"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path fillRule="evenodd" d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z" />
                          </svg>
                        </button>
                        <PRStatusIndicator 
                          status={statuses[issue.number] || 'unknown'} 
                          className="flex-shrink-0"
                        />
                      </>
                    )}
                    
                    {/* Copy URL Button */}
                    <button
                      onClick={(e) => handleCopyUrl(e, issue)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCopyUrl(e, issue);
                        }
                      }}
                      className="flex-shrink-0 p-1 rounded hover:bg-accent/20 transition-colors"
                      aria-label={copiedIssueId === issue.id ? 'URL copied!' : `Copy GitHub URL for issue ${issue.title}`}
                      title={copiedIssueId === issue.id ? 'Copied!' : 'Copy GitHub URL'}
                    >
                      <AnimatePresence mode="wait">
                        {copiedIssueId === issue.id ? (
                          <motion.svg
                            key="check"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="w-4 h-4 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </motion.svg>
                        ) : (
                          <motion.svg
                            key="copy"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="w-4 h-4 text-muted-foreground hover:text-foreground"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                          </motion.svg>
                        )}
                      </AnimatePresence>
                    </button>
                    
                    {/* Expand/Collapse Indicator */}
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                      className="flex-shrink-0"
                    >
                      <svg
                        className="w-4 h-4 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </motion.div>
                  </div>
                </div>

                {/* Expandable Body Content */}
                <AnimatePresence initial={false}>
                  {isExpanded && issue.body && (
                    <motion.div
                      key="body"
                      initial="collapsed"
                      animate="expanded"
                      exit="collapsed"
                      variants={{
                        collapsed: {
                          opacity: prefersReducedMotion ? 0 : 0,
                          height: 0,
                          marginTop: 0,
                        },
                        expanded: {
                          opacity: 1,
                          height: 'auto',
                          marginTop: 16,
                          transition: prefersReducedMotion ? {
                            duration: 0
                          } : {
                            height: {
                              type: 'spring',
                              stiffness: 300,
                              damping: 30,
                            },
                            opacity: {
                              duration: 0.2,
                              delay: 0.1,
                            },
                          },
                        },
                      }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 mt-3 border-t border-border">
                        <GitHubMarkdown 
                          content={issue.body} 
                          className="text-sm"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};