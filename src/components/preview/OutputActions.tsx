'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface OutputActionsProps {
  onEdit: () => void;
  onSubmit: () => void;
  onCopy: () => Promise<void>;
  copyLabel?: string;
  submitLabel?: string;
  editLabel?: string;
}

export const OutputActions: React.FC<OutputActionsProps> = ({
  onEdit,
  onSubmit,
  onCopy,
  copyLabel = 'Copy to Clipboard',
  submitLabel = 'Create Issue',
  editLabel = 'Edit',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex justify-between mt-6">
      <Button variant="secondary" onClick={onEdit}>
        {editLabel}
      </Button>
      <div className="space-x-3">
        <Button variant="secondary" onClick={handleCopy}>
          {copied ? 'Copied!' : copyLabel}
        </Button>
        <Button onClick={onSubmit}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
};