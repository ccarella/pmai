'use client';

import React from 'react';
import { IssueType } from '@/lib/types/issue';
import { Card } from '@/components/ui/Card';

interface IssueTypeOption {
  type: IssueType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface IssueTypeSelectorProps {
  onSelect: (type: IssueType) => void;
  value?: IssueType;
  className?: string;
}

const issueTypeOptions: IssueTypeOption[] = [
  {
    type: 'feature',
    title: 'Feature',
    description: 'New functionality or enhancement',
    icon: (
      <svg data-testid="feature-icon" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
    color: 'text-blue-600'
  },
  {
    type: 'bug',
    title: 'Bug Report',
    description: "Something isn't working correctly",
    icon: (
      <svg data-testid="bug-icon" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'text-red-600'
  },
  {
    type: 'epic',
    title: 'Epic',
    description: 'Large feature that spans multiple issues',
    icon: (
      <svg data-testid="epic-icon" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    color: 'text-purple-600'
  },
  {
    type: 'technical-debt',
    title: 'Technical Debt',
    description: 'Code improvements and refactoring',
    icon: (
      <svg data-testid="technical-debt-icon" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    color: 'text-amber-600'
  }
];

export const IssueTypeSelector: React.FC<IssueTypeSelectorProps> = ({
  onSelect,
  value,
  className = ''
}) => {
  const handleSelect = (type: IssueType) => {
    onSelect(type);
  };

  const handleKeyDown = (type: IssueType, e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(type);
    }
  };

  return (
    <div 
      role="group" 
      aria-label="Select issue type"
      className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}
    >
      {issueTypeOptions.map((option) => {
        const isSelected = value === option.type;
        const descriptionId = `${option.type}-description`;
        
        return (
          <button
            key={option.type}
            onClick={() => handleSelect(option.type)}
            onKeyDown={(e) => handleKeyDown(option.type, e)}
            data-testid={`issue-type-${option.type}`}
            aria-label={option.title}
            aria-describedby={descriptionId}
            className={`
              text-left w-full transition-all duration-200 rounded-lg
              ${isSelected ? 'ring-2 ring-blue-500' : ''}
            `}
          >
            <Card
              variant="bordered"
              className={`
                h-full cursor-pointer transition-all duration-200
                hover:border-blue-500 hover:shadow-md
                ${isSelected ? 'border-blue-500 bg-blue-50' : ''}
              `}
            >
              <div className="flex items-start space-x-3">
                <div className={`mt-1 ${option.color}`}>
                  {option.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {option.title}
                  </h3>
                  <p 
                    id={descriptionId}
                    className="mt-1 text-sm text-gray-600"
                  >
                    {option.description}
                  </p>
                </div>
              </div>
            </Card>
          </button>
        );
      })}
    </div>
  );
};