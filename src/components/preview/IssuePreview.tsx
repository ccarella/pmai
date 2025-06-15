'use client';

import React, { useState, useEffect } from 'react';
import { IssueFormData } from '@/lib/types/issue';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAIEnhancement } from '@/lib/hooks/useAIEnhancement';
import { generateMarkdown } from '@/lib/templates/markdown';
import { generateClaudePrompt } from '@/lib/templates/claude-prompt';

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
  }, []);
  
  const enhancedData = {
    ...formData,
    aiEnhancements: enhancements,
  } as IssueFormData;
  
  const markdown = generateMarkdown(enhancedData);
  const claudePrompt = generateClaudePrompt(enhancedData);
  
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
          <h2 className="text-2xl font-bold mb-4">Preview Your Issue</h2>
          
          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Enhancing your issue with AI...</p>
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">Failed to enhance issue: {error}</p>
              <p className="text-sm text-red-600 mt-1">Using default template instead.</p>
            </div>
          )}
          
          {!isLoading && (
            <>
              <div className="flex space-x-4 mb-4">
                <button
                  onClick={() => setActiveTab('markdown')}
                  className={`px-4 py-2 font-medium rounded-md ${
                    activeTab === 'markdown'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  GitHub Issue
                </button>
                <button
                  onClick={() => setActiveTab('claude')}
                  className={`px-4 py-2 font-medium rounded-md ${
                    activeTab === 'claude'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Claude Prompt
                </button>
              </div>
              
              <div className="bg-gray-50 rounded-md p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {activeTab === 'markdown' ? markdown : claudePrompt}
                </pre>
              </div>
              
              <div className="flex justify-between mt-6">
                <Button variant="secondary" onClick={onEdit}>
                  Edit
                </Button>
                <div className="space-x-3">
                  <Button variant="secondary" onClick={handleCopy}>
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                  </Button>
                  <Button onClick={onSubmit}>
                    Create Issue
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
      
      {enhancements && (
        <Card>
          <div className="p-6">
            <h3 className="font-semibold mb-3">AI Enhancements</h3>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-gray-700">Acceptance Criteria:</h4>
                <ul className="list-disc list-inside ml-2 text-gray-600">
                  {enhancements.acceptanceCriteria.map((ac: string, i: number) => (
                    <li key={i}>{ac}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700">Edge Cases:</h4>
                <ul className="list-disc list-inside ml-2 text-gray-600">
                  {enhancements.edgeCases.map((ec: string, i: number) => (
                    <li key={i}>{ec}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700">Technical Considerations:</h4>
                <ul className="list-disc list-inside ml-2 text-gray-600">
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