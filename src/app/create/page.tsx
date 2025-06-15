'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { IssueType } from '@/lib/types/issue';
import { getFormSteps } from '@/lib/config/form-steps';

export default function CreateIssuePage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<IssueType | null>(null);

  const issueTypes: { type: IssueType; title: string; description: string }[] = [
    {
      type: 'feature',
      title: 'Feature',
      description: 'New functionality or enhancement to existing features',
    },
    {
      type: 'bug',
      title: 'Bug',
      description: 'Something that isn\'t working as expected',
    },
    {
      type: 'epic',
      title: 'Epic',
      description: 'Large feature that needs to be broken down into smaller tasks',
    },
    {
      type: 'technical-debt',
      title: 'Technical Debt',
      description: 'Code improvements, refactoring, or performance optimization',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Create New Issue</h1>
      <p className="text-gray-600 mb-8">
        Generate comprehensive GitHub issues optimized for AI-assisted development
      </p>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Select Issue Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {issueTypes.map((item) => (
              <button
                key={item.type}
                onClick={() => setSelectedType(item.type)}
                data-testid={`issue-type-${item.type}`}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  selectedType === item.type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </button>
            ))}
          </div>
        </div>

        {selectedType && (
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <p className="text-center text-gray-600 mb-4">
              You selected: <strong>{selectedType}</strong>
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="secondary" onClick={() => setSelectedType(null)}>
                Back
              </Button>
              <Button
                onClick={() => {
                  const steps = getFormSteps(selectedType);
                  router.push(`/create/${selectedType}/${steps[0].id}`);
                }}
              >
                Continue
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}