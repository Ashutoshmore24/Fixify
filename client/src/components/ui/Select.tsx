import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean | string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    const hasError = Boolean(error);

    return (
      <div className="relative w-full">
        <select
          className={cn(
            'flex h-9.5 w-full appearance-none rounded-lg border bg-card px-3 py-1.5 pr-8 text-sm text-foreground shadow-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50',
            hasError
              ? 'border-destructive/80 focus-visible:ring-destructive/20 focus-visible:border-destructive text-destructive'
              : 'border-border hover:border-border/80',
            className
          )}
          ref={ref}
          aria-invalid={hasError ? 'true' : undefined}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          strokeWidth={1.75}
        />
        {typeof error === 'string' && (
          <p className="mt-1 text-xs text-destructive font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
