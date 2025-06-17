import React from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  isRefreshing: boolean;
  pullDistance: number;
  isPulling: boolean;
  threshold?: number;
  children: React.ReactNode;
}

export function PullToRefresh({
  isRefreshing,
  pullDistance,
  isPulling,
  threshold = 80,
  children,
}: PullToRefreshProps) {
  const pullPercentage = Math.min(pullDistance / threshold, 1);
  const rotation = pullPercentage * 180;
  const scale = 0.5 + pullPercentage * 0.5;
  const opacity = pullPercentage;

  return (
    <div className="relative">
      {/* Pull indicator */}
      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center transition-all duration-300"
        style={{
          top: `-60px`,
          transform: `translateX(-50%) translateY(${pullDistance}px)`,
          opacity: isPulling || isRefreshing ? opacity : 0,
        }}
      >
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 ${
            isRefreshing ? 'animate-pulse' : ''
          }`}
        >
          <RefreshCw
            className={`w-6 h-6 text-accent ${isRefreshing ? 'animate-spin' : ''}`}
            style={{
              transform: `rotate(${rotation}deg) scale(${scale})`,
              transition: isRefreshing ? 'none' : 'transform 0.3s ease-out',
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: isPulling && !isRefreshing ? `translateY(${pullDistance}px)` : 'translateY(0)',
          transition: isPulling ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>

      {/* Refresh status message */}
      {isRefreshing && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-accent text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-in fade-in slide-in-from-top-2">
            Refreshing...
          </div>
        </div>
      )}
    </div>
  );
}