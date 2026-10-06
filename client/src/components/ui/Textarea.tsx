import * as React from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean | string;
  charCount?: number;
  maxChars?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, charCount, maxChars, ...props }, ref) => {
    const hasError = Boolean(error);

    return (
      <div className="relative w-full">
        <textarea
          className={cn(
            'flex min-h-[90px] w-full rounded-lg border bg-card px-3 py-2 text-sm text-foreground shadow-soft transition-colors placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50',
            hasError
              ? 'border-destructive/80 focus-visible:ring-destructive/20 focus-visible:border-destructive'
              : 'border-border hover:border-border/80',
            className
          )}
          ref={ref}
          aria-invalid={hasError ? 'true' : undefined}
          {...props}
        />
        <div className="mt-1 flex items-center justify-between text-xs">
          {typeof error === 'string' ? (
            <p className="text-destructive font-medium">{error}</p>
          ) : (
            <span />
          )}
          {maxChars !== undefined && (
            <span
              className={cn(
                'ml-auto text-muted-foreground',
                charCount !== undefined && charCount > maxChars && 'text-destructive font-medium'
              )}
            >
              {charCount !== undefined ? charCount : 0}/{maxChars}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
