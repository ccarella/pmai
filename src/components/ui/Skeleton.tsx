'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { loadingPulse } from '@/lib/animations/variants';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  count = 1,
}) => {
  const baseClasses = 'bg-muted/20 rounded';
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };
  
  const defaultSizes = {
    text: { width: '100%', height: '1rem' },
    circular: { width: '3rem', height: '3rem' },
    rectangular: { width: '100%', height: '4rem' },
  };
  
  const style = {
    width: width || defaultSizes[variant].width,
    height: height || defaultSizes[variant].height,
  };
  
  const skeletonClasses = `${baseClasses} ${variantClasses[variant]} ${className}`.trim();
  
  if (count > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, index) => (
          <motion.div
            key={index}
            className={skeletonClasses}
            style={{
              ...style,
              width: variant === 'text' && index === count - 1 ? '80%' : style.width,
            }}
            variants={loadingPulse}
            initial="initial"
            animate="animate"
          />
        ))}
      </div>
    );
  }
  
  return (
    <motion.div
      className={skeletonClasses}
      style={style}
      variants={loadingPulse}
      initial="initial"
      animate="animate"
    />
  );
};

interface SkeletonCardProps {
  showAvatar?: boolean;
  lines?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showAvatar = false,
  lines = 3,
}) => {
  return (
    <motion.div
      className="bg-card-bg rounded-lg p-6 border border-border"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {showAvatar && (
        <div className="flex items-center mb-4">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="ml-3 flex-1">
            <Skeleton width="40%" height={20} className="mb-2" />
            <Skeleton width="60%" height={16} />
          </div>
        </div>
      )}
      <Skeleton count={lines} />
      <div className="mt-4 flex gap-2">
        <Skeleton width={80} height={32} className="rounded-md" />
        <Skeleton width={80} height={32} className="rounded-md" />
      </div>
    </motion.div>
  );
};

interface SkeletonFormProps {
  fields?: number;
}

export const SkeletonForm: React.FC<SkeletonFormProps> = ({
  fields = 3,
}) => {
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index}>
          <Skeleton width="30%" height={20} className="mb-2" />
          <Skeleton variant="rectangular" height={40} />
        </div>
      ))}
      <div className="flex gap-3 mt-8">
        <Skeleton width={100} height={40} className="rounded-md" />
        <Skeleton width={100} height={40} className="rounded-md" />
      </div>
    </motion.div>
  );
};