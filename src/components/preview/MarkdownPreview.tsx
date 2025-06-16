'use client';

import React from 'react';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

const MarkdownPreviewComponent: React.FC<MarkdownPreviewProps> = ({
  content,
  className = '',
}) => {
  return (
    <div
      className={`bg-input-bg border border-border rounded-md p-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-card-bg ${className}`}
    >
      <pre className="whitespace-pre-wrap text-sm font-mono text-foreground">
        {content}
      </pre>
    </div>
  );
};

export const MarkdownPreview = React.memo(MarkdownPreviewComponent);