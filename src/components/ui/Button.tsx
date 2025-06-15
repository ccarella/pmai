import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 shadow-sm',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-foreground hover:bg-accent-hover hover:shadow-md hover:shadow-accent/20 focus-visible:ring-accent active:scale-[0.98]',
        secondary: 'bg-secondary text-foreground hover:bg-secondary/90 hover:shadow-md hover:shadow-secondary/20 focus-visible:ring-secondary active:scale-[0.98]',
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

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, onClick, ...props }, ref) => {
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
    };
    
    const buttonContent = (
      <>
        {loading && (
          <span data-testid="spinner" className="mr-2">
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
          </span>
        )}
        {children}
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
      <button
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        disabled={disabled || loading}
        onClick={handleClick}
        {...props}
      >
        {buttonContent}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };