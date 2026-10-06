import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium transition-colors border select-none',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground',
        outline:
          'border-border text-foreground bg-transparent',
        destructive:
          'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
        
        // Status Variants (Institutional semantic system)
        status_open:
          'border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300',
        status_assigned:
          'border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-800/80 dark:bg-indigo-950/60 dark:text-indigo-200',
        status_accepted:
          'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800/80 dark:bg-sky-950/60 dark:text-sky-200',
        status_in_progress:
          'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/80 dark:bg-amber-950/60 dark:text-amber-200',
        status_escalated:
          'border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-800/80 dark:bg-orange-950/60 dark:text-orange-200',
        status_awaiting_parts:
          'border-purple-200 bg-purple-50 text-purple-900 dark:border-purple-800/80 dark:bg-purple-950/60 dark:text-purple-200',
        status_resolved:
          'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800/80 dark:bg-emerald-950/60 dark:text-emerald-200',
        status_closed:
          'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800/80 dark:bg-emerald-950/60 dark:text-emerald-200',
        status_rejected:
          'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200',
        status_cancelled:
          'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400',

        // Priority Variants
        priority_low:
          'border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300',
        priority_medium:
          'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800/80 dark:bg-sky-950/60 dark:text-sky-200',
        priority_high:
          'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/80 dark:bg-amber-950/60 dark:text-amber-200',
        priority_critical:
          'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800/80 dark:bg-rose-950/60 dark:text-rose-200 font-semibold',
      },
      size: {
        default: 'px-2 py-0.5 text-xs',
        sm: 'px-1.5 py-0.2 text-[11px]',
        lg: 'px-2.5 py-1 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size, className }))} {...props}>
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'status_open' && 'bg-slate-500',
            variant === 'status_assigned' && 'bg-indigo-500',
            variant === 'status_accepted' && 'bg-sky-500',
            variant === 'status_in_progress' && 'bg-amber-500',
            variant === 'status_escalated' && 'bg-orange-500',
            variant === 'status_awaiting_parts' && 'bg-purple-500',
            (variant === 'status_resolved' || variant === 'status_closed') && 'bg-emerald-500',
            variant === 'status_rejected' && 'bg-rose-500',
            variant === 'priority_critical' && 'bg-rose-500 animate-pulse',
            variant === 'priority_high' && 'bg-amber-500',
            variant === 'priority_medium' && 'bg-sky-500',
            variant === 'priority_low' && 'bg-slate-400',
            !variant && 'bg-primary'
          )}
        />
      )}
      {children}
    </div>
  );
}

/**
 * Convenient helper to format ticket status with matching badge styles
 */
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const normalized = status.toUpperCase().replace(/\s+/g, '_');
  let variantKey: VariantProps<typeof badgeVariants>['variant'] = 'default';

  switch (normalized) {
    case 'OPEN':
      variantKey = 'status_open';
      break;
    case 'ASSIGNED':
      variantKey = 'status_assigned';
      break;
    case 'ACCEPTED':
      variantKey = 'status_accepted';
      break;
    case 'IN_PROGRESS':
      variantKey = 'status_in_progress';
      break;
    case 'ESCALATED':
      variantKey = 'status_escalated';
      break;
    case 'AWAITING_PARTS':
      variantKey = 'status_awaiting_parts';
      break;
    case 'RESOLVED':
      variantKey = 'status_resolved';
      break;
    case 'CLOSED':
      variantKey = 'status_closed';
      break;
    case 'REJECTED':
      variantKey = 'status_rejected';
      break;
    case 'CANCELLED':
      variantKey = 'status_cancelled';
      break;
    default:
      variantKey = 'outline';
  }

  const label = normalized.replace('_', ' ');

  return (
    <Badge variant={variantKey} dot className={className}>
      {label}
    </Badge>
  );
}

/**
 * Convenient helper to format ticket priority with matching badge styles
 */
export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  const normalized = priority.toUpperCase();
  let variantKey: VariantProps<typeof badgeVariants>['variant'] = 'priority_low';

  switch (normalized) {
    case 'CRITICAL':
      variantKey = 'priority_critical';
      break;
    case 'HIGH':
      variantKey = 'priority_high';
      break;
    case 'MEDIUM':
      variantKey = 'priority_medium';
      break;
    case 'LOW':
    default:
      variantKey = 'priority_low';
  }

  return (
    <Badge variant={variantKey} dot className={className}>
      {normalized}
    </Badge>
  );
}
