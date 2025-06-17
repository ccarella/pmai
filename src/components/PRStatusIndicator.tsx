'use client';

import React from 'react';
import { motion } from 'framer-motion';

export type PRTestStatus = 'success' | 'failure' | 'pending' | 'unknown';

interface PRStatusIndicatorProps {
  status: PRTestStatus;
  className?: string;
}

export const PRStatusIndicator: React.FC<PRStatusIndicatorProps> = ({ status, className = '' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          color: 'text-green-500',
          bgColor: 'bg-green-500/20',
          label: 'All tests passed',
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
            </svg>
          ),
        };
      case 'failure':
        return {
          color: 'text-red-500',
          bgColor: 'bg-red-500/20',
          label: 'Tests failed',
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
            </svg>
          ),
        };
      case 'pending':
        return {
          color: 'text-orange-500',
          bgColor: 'bg-orange-500/20',
          label: 'Tests running',
          icon: (
            <motion.svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 16 16"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <path fillRule="evenodd" d="M8 2.5a5.5 5.5 0 105.5 5.5.75.75 0 011.5 0 7 7 0 11-7-7 .75.75 0 010 1.5z" />
            </motion.svg>
          ),
        };
      case 'unknown':
      default:
        return {
          color: 'text-muted-foreground',
          bgColor: 'bg-muted-foreground/20',
          label: 'No test status available',
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9 3a1 1 0 11-2 0 1 1 0 012 0zm-.25-6.25a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5z" />
            </svg>
          ),
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className={`flex items-center gap-1.5 ${className}`}
      aria-label={config.label}
      title={config.label}
    >
      <div className={`${config.color} ${config.bgColor} p-1 rounded-full`}>
        {config.icon}
      </div>
      <span className="sr-only">{config.label}</span>
    </div>
  );
};