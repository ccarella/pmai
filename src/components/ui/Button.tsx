'use client';

import React, { useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';
import { motion, AnimatePresence } from 'framer-motion';
import { getRippleOrigin } from '@/lib/animations/utils';

const buttonVariants = cva(
  'relative inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 shadow-sm overflow-hidden',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-foreground hover:bg-accent-hover hover:shadow-md hover:shadow-accent/20 focus-visible:ring-accent',
        secondary: 'bg-secondary text-foreground hover:bg-secondary/90 hover:shadow-md hover:shadow-secondary/20 focus-visible:ring-secondary',
        ghost: 'bg-transparent hover:bg-card-bg hover:shadow-sm focus-visible:ring-accent text-foreground',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm rounded',
        md: 'px-4 py-2 text-base rounded-md',
        lg: 'px-6 py-3 text-lg rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

interface RippleProps {
  x: number;
  y: number;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, onClick, ...props }, ref) => {
    const [ripples, setRipples] = useState<RippleProps[]>([]);
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading) {
        e.preventDefault();
        return;
      }
      
      // Add ripple effect
      const rippleOrigin = getRippleOrigin(e);
      setRipples([...ripples, rippleOrigin]);
      setTimeout(() => {
        setRipples(ripples => ripples.slice(1));
      }, 600);
      
      onClick?.(e);
    };
    
    const buttonContent = (
      <>
        <AnimatePresence>
          {loading && (
            <motion.span 
              data-testid="spinner" 
              className="absolute inset-0 flex items-center justify-center bg-inherit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </motion.span>
          )}
        </AnimatePresence>
        <motion.span
          className="relative z-10"
          animate={{ opacity: loading ? 0 : 1 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.span>
        {ripples.map((ripple, index) => (
          <motion.span
            key={index}
            className="absolute rounded-full bg-white/20"
            style={{
              left: `${ripple.x}%`,
              top: `${ripple.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ width: 0, height: 0, opacity: 0.5 }}
            animate={{ width: 300, height: 300, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </>
    );
    
    if (asChild) {
      return (
        <Slot className={buttonVariants({ variant, size, className })}>
          {children}
        </Slot>
      );
    }
    
    return (
      <motion.button
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        disabled={disabled || loading}
        onClick={handleClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.1 }}
        {...props}
      >
        {buttonContent}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };