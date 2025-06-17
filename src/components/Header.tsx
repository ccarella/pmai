'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RepositorySwitcher } from './RepositorySwitcher';

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
          
          <div className="flex items-center">
            <RepositorySwitcher />
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