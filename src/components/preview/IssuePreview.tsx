'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { IssueFormData } from '@/lib/types/issue';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAIEnhancement } from '@/lib/hooks/useAIEnhancement';
import { generateMarkdown } from '@/lib/templates/markdown';
import { generateClaudePrompt } from '@/lib/templates/claude-prompt';
import { PublishButton } from '@/components/PublishButton';

interface IssuePreviewProps {
  formData: Partial<IssueFormData>;
  onEdit: () => void;
  onSubmit: () => void;
}

export const IssuePreview: React.FC<IssuePreviewProps> = ({
  formData,
  onEdit,
  onSubmit,
}) => {
  const [activeTab, setActiveTab] = useState<'markdown' | 'claude'>('markdown');
  const [copied, setCopied] = useState(false);
  
  const { enhance, enhancements, isLoading, error } = useAIEnhancement();
  
  useEffect(() => {
    if (formData.type && formData.title && formData.description) {
      enhance(formData as IssueFormData);
    }
  }, [enhance, formData]);
  
  const enhancedData = useMemo(() => ({
    ...formData,
    aiEnhancements: enhancements,
  } as IssueFormData), [formData, enhancements]);
  
  const markdown = useMemo(() => generateMarkdown(enhancedData), [enhancedData]);
  const claudePrompt = useMemo(() => generateClaudePrompt(enhancedData), [enhancedData]);
  
  const handleCopy = async () => {
    const textToCopy = activeTab === 'markdown' ? markdown : claudePrompt;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Preview Your Issue</h2>
          
          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
              <p className="mt-2 text-muted">Enhancing your issue with AI...</p>
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-4 bg-error/10 border border-error/30 rounded-md">
              <p className="text-error font-medium">Failed to enhance issue: {error}</p>
              <p className="text-sm text-error/80 mt-1">Using default template instead.</p>
            </div>
          )}
          
          {!isLoading && (
            <>
              <div className="flex space-x-4 mb-4">
                <button
                  onClick={() => setActiveTab('markdown')}
                  className={`px-4 py-2 font-medium rounded-md transition-all duration-200 ${
                    activeTab === 'markdown'
                      ? 'bg-accent text-foreground shadow-sm'
                      : 'text-muted hover:text-foreground hover:bg-card-bg'
                  }`}
                >
                  GitHub Issue
                </button>
                <button
                  onClick={() => setActiveTab('claude')}
                  className={`px-4 py-2 font-medium rounded-md transition-all duration-200 ${
                    activeTab === 'claude'
                      ? 'bg-accent text-foreground shadow-sm'
                      : 'text-muted hover:text-foreground hover:bg-card-bg'
                  }`}
                >
                  Claude Prompt
                </button>
              </div>
              
              <div className="bg-input-bg border border-border rounded-md p-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-card-bg">
                <pre className="whitespace-pre-wrap text-sm font-mono text-foreground">
                  {activeTab === 'markdown' ? markdown : claudePrompt}
                </pre>
              </div>
              
              <div className="flex justify-between mt-6">
                <Button variant="secondary" onClick={onEdit}>
                  Edit
                </Button>
                <div className="flex items-center space-x-3">
                  <Button variant="secondary" onClick={handleCopy}>
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                  </Button>
                  <PublishButton
                    title={enhancedData.title || ''}
                    body={markdown}
                    labels={[enhancedData.type || 'enhancement']}
                    onSuccess={(issueUrl) => {
                      console.log('Issue published:', issueUrl);
                    }}
                    onError={(error) => {
                      console.error('Failed to publish:', error);
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
      
      {enhancements && (
        <Card>
          <div className="p-6">
            <h3 className="font-semibold mb-3 text-foreground flex items-center gap-2">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
              AI Enhancements
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-accent">Acceptance Criteria:</h4>
                <ul className="list-disc list-inside ml-2 text-muted">
                  {enhancements.acceptanceCriteria.map((ac: string, i: number) => (
                    <li key={i}>{ac}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-accent">Edge Cases:</h4>
                <ul className="list-disc list-inside ml-2 text-muted">
                  {enhancements.edgeCases.map((ec: string, i: number) => (
                    <li key={i}>{ec}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-accent">Technical Considerations:</h4>
                <ul className="list-disc list-inside ml-2 text-muted">
                  {enhancements.technicalConsiderations.map((tc: string, i: number) => (
                    <li key={i}>{tc}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};