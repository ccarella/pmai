'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RepositorySwitcher } from './RepositorySwitcher';
import { ThemeToggleButton } from './ui/ThemeToggle';

export const Header: React.FC = () => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (!pathname) return false;
    if (path === '/') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="text-lg font-semibold text-foreground hover:text-accent transition-colors">
            PMAI
          </Link>
          
          <div className="flex items-center gap-4">
            <RepositorySwitcher />
            <ThemeToggleButton />
            
            <Link 
            href="/settings" 
            className="p-2 rounded-md hover:bg-card-bg transition-colors duration-200 group"
            title="Settings"
          >
            <svg 
              className="w-5 h-5 text-muted group-hover:text-foreground transition-colors" 
              fill="none" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            </Link>
          </div>
        </div>
        
        <nav className="flex items-center h-12 gap-6">
          <Link
            href="/create"
            className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
              isActive('/create')
                ? 'text-foreground border-b-2 border-accent pb-3'
                : 'text-muted-foreground pb-3'
            }`}
          >
            Create
          </Link>
          <Link
            href="/issues"
            className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
              isActive('/issues')
                ? 'text-foreground border-b-2 border-accent pb-3'
                : 'text-muted-foreground pb-3'
            }`}
          >
            Issues
          </Link>
          <Link
            href="/settings"
            className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
              isActive('/settings')
                ? 'text-foreground border-b-2 border-accent pb-3'
                : 'text-muted-foreground pb-3'
            }`}
          >
            Settings
          </Link>
        </nav>
      </div>
    </header>
  );
};