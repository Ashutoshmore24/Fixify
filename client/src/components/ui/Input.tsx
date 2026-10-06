import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean | string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, leftIcon, rightIcon, ...props }, ref) => {
    const hasError = Boolean(error);

    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'flex h-9.5 w-full rounded-lg border bg-card px-3 py-1.5 text-sm text-foreground shadow-soft transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50',
            hasError
              ? 'border-destructive/80 focus-visible:ring-destructive/20 focus-visible:border-destructive text-destructive'
              : 'border-border hover:border-border/80',
            leftIcon && 'pl-9',
            rightIcon && 'pr-9',
            className
          )}
          ref={ref}
          aria-invalid={hasError ? 'true' : undefined}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground flex items-center">
            {rightIcon}
          </div>
        )}
        {typeof error === 'string' && (
          <p className="mt-1 text-xs text-destructive font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
